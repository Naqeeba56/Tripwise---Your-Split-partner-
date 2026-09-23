# PROJECT_INFO.md — Tripwise

> Internal engineering document for the **Tripwise** codebase. Written from a full
> read of the source tree on 2026-09-23. It explains what the app does, how it is
> wired together, and how the trickiest parts (persistence, RLS, resilience)
> actually work — including the two fixes shipped for the "paid by multiple"
> expense persistence bug.

---

## 1. EXECUTIVE SUMMARY & TECH STACK

### What the app is

**Tripwise** is a group-travel *expense-splitting* web app (India-first). You create
a trip, add members (each with a UPI ID), log expenses, and the app tells you **who
owes whom the minimum number of transactions**. It goes further than a plain splitter:

- **Expense categories + search/filter** feed, with settable *daily / total budget limits*.
- **Automatic debt minimisation** — `settlementMath.js` computes net balances and then
  the smallest set of transactions to settle them.
- **Instant settlement** — it renders the amounts as **UPI deep links** (GPay / PhonePe)
  and even a QR code, so members clear debts in one tap. PDF receipts are generated
  with `jspdf`.
- **"Paid by multiple"** — a single expense can be split across several payers with
  arbitrary per-person amounts (this is the data model the persistence bug was about).
- **Member exclusions** — an expense may exclude some members (e.g. vegetarians skip
  the non-veg dinner) and **sub-members** (a "dad" parent consolidates "kid" balances).
- **AI Travel Budget Estimator** — estimates a trip budget per person from origin,
  destination, travel mode and duration using a rule/fare engine (no external AI call).
- **Live Currency Converter** — offline-first FX rates with a glassmorphic UI.
- **Community board** — public "post a trip announcement" feed (the other persistence bug).
- **Google Places / Routes / Unsplash** integrations (server-side) for place picking,
  route distance/duration, and destination imagery.

### Core problem it solves
Manually tracking who paid what, and figuring out how to settle up fairly, is
error-prone and awkward with friends on a trip. Tripwise reduces N debts to the
minimum payments, makes each payment one tap away (UPI), and keeps the ledger
persistent across devices through Supabase.

### Tech stack

| Concern                  | Technology                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| Framework (meta)         | **Next.js 14.2** (App Router) — hybrid SSR + Client Components                                 |
| UI language              | **React 18.3** + JSX                                                                           |
| Styling                  | **Tailwind CSS v3.4** (`class` dark mode) + custom `globals.css` + `tw-animate-css`            |
| Component base           | **shadcn** utilities + hand-rolled **glassmorphic / neumorphic** components (`components.js`)   |
| Animation                | **framer-motion** (the `motion` object / `AnimatePresence`) + **animejs** (`animeAnimations.js`) |
| Icons                    | **lucide-react**                                                                            |
| Charts                   | **recharts**                                                                                   |
| PDF / QR                 | **jspdf** + `jspdf-autotable`, **qrcode** (base64 data-URLs into receipts)                      |
| Confetti / flair         | **canvas-confetti**                                                                          |
| Auth                     | **@supabase/supabase-js** + **@supabase/ssr** (email OTP magic links + Google OAuth)           |
| Database / backend       | **Supabase** (Postgres + Row-Level Security). Server proxies hide API keys.                    |
| External APIs (server)   | **Google Places API**, **Google Routes API v2**, **Unsplash**                                  |
| Analytics / SEO          | **@vercel/analytics**, `metadata`, JSON-LD, `robots.txt`, `sitemap.xml`                        |
| Validation               | **zod**, **react-hook-form**, **@hookform/resolvers**, `validation.js`, `errorMessages.js`     |

### Architectural rationale

- **Next.js App Router + Server/Client split.** Everything under `/api` is a server
  route; `src/app/app/page.js` and `src/components/*.jsx` are `'use client'`. This split is
  what lets the app proxy Google/Unsplash keys **server-side only** — the browser never
  sees `GOOGLE_MAPS_API_KEY` / `UNSPLASH_ACCESS_KEY` (they moved off the `NEXT_PUBLIC_`
  prefix; see `next.config.mjs`).
- **Supabase + RLS is the source of truth; localStorage is a resilience cache.** Data is
  written to Postgres, but the code *always* also mirrors it into a user+trip-scoped
  localStorage key. On read it prefers the DB row and **backfills** from the richer local
  snapshot. This dual-write is exactly what keeps data present even when a migration
  hasn't been applied yet (see §4 and the bug fix below).
- **Tailwind utility-first + a few design tokens.** The app leans on Tailwind utilities
  for speed, plus custom `@keyframes`/`animation` tokens (`float-slow`, `shimmer`) and CSS
  variables (`--background`, `--border`, `--ring`).
- **Severely capped third-parties.** No heavyweight state library, no ORM — the hot path
  (`.jsx`) uses **plain React state** + thin functional libs in `src/lib/`. This keeps the
  auth + data flow easy to trace and deploy to Vercel.

---

## 2. FILE & FOLDER ARCHITECTURE

### Visual tree

```
tripwise/
├── .env.local / .env.local.example   # server-only keys (SUPABASE_URL, GOOGLE_MAPS_API_KEY,
│                                     #   UNSPLASH_ACCESS_KEY) + public NEXT_PUBLIC_SUPABASE_ANON_KEY
├── next.config.mjs                   # bridges non-secret SUPABASE_URL & APP_URL to the client
├── tailwind.config.js                # brand/accent/warm palettes, keyframes, shadows, max-w.app
├── postcss.config.mjs                # tailwind + autoprefixer
├── components.json                   # shadcn UI registry
├── jsconfig.json                     # path aliases (@/* -> src/*)
├── package.json / package-lock.json
├── README.md / SECURITY.md / PROJECT_INFO.md
├── public/                           # static assets, og-image.png
├── scripts/
│   ├── vercel-diag.mjs, vercel-keys.mjs # CI helpers to confirm env vars are set server-side
├── supabase/
│   ├── schema.sql                     # canonical Postgres schema (trips, trip_members, expenses,
│   │                                  #   settlements, profiles, announcements)
│   └── migrations/                    # idempotent, opt-in fixes
│       ├── fix_persistence.sql        # adds `payers`/`excluded_members` JSONB to expenses
│       ├── fix_announcements.sql      # creates + backfills announcements table, RLS, realtime
│       └── expense_ownership_rls.sql  # RLS scoping expenses to creator/organizer
└── src/
    ├── logo.svg
    ├── app/
    │   ├── globals.css                # global styles, glass/neumorphic helpers, fonts, shadcn @theme
    │   ├── layout.js                  # fonts, metadata, viewport, JSON-LD, Analytics
    │   ├── robots.js / sitemap.js     # SEO (server-only APP_URL fallback)
    │   ├── not-found.js
    │   ├── page.js                    # marketing/landing page
    │   ├── about/page.js, privacy/page.js
    │   ├── admin/page.js              # admin dashboard (isAdminEmail gate)
    │   ├── app/page.js                # ★ MAIN app — auth + trips + expenses + settlements + tabs
    │   ├── auth/callback/route.js     # OAuth/magic-link redirect handler
    │   ├── trip/join/[token]/page.js  # invite-token join landing
    │   └── api/
    │       ├── health/images/route.js
    │       ├── places/{autocomplete,details,nearby,photo,textsearch}/route.js  # Google proxies
    │       ├── routes/route.js        # Google Routes API v2 proxy (distance/duration/polyline)
    │       └── unsplash/search/route.js
    ├── components/                    # client components (see below)
    │   └── ui/                        # shadcn-style primitives (button, shimmer-button,
    │                                  #   bento-grid, border-beam)
    └── lib/                           # pure logic + services (no framework)
        ├── supabase.js                # client factory, URL-from-anon-key, auth helpers
        ├── supabaseDb.js              # ★ all DB reads/writes + localStorage cache + resilience
        ├── settlementMath.js          # net balances + optimal settlements (multi-payer aware)
        ├── storage.js                 # quota-safe localStorage wrapper (trim inline base64)
        ├── errorMessages.js           # friendlyError() / isPermissionError() / isMissingColumnError()
        ├── validation.js              # form validators
        ├── googlePlacesService.js     # client side of Google Places (→ server proxies)
        ├── routesService.js           # client side of Google Routes
        ├── unsplashService.js         # client side of Unsplash (→ server proxy)
        ├── offlineAutocomplete.js / cityDatabase.js  # offline place suggestions
        ├── currencyRates.js           # offline-first FX table + live refresh hook
        ├── estimatorEngine.js         # AI-style budget estimation (fare rules)
        ├── fareEngine.js              # fare heuristics (road/cab/train/flight)
        ├── animeAnimations.js         # attach3DTilt, animateCounter, etc.
        ├── imageUtils.js, pdfGenerator.js, admin.js, useDebounce.js, utils.js
```

### Key folders explained

- **`src/app/**`** — Next.js App Router. Everything under `api/` is a server proxy holding
  the API keys.
- **`src/app/app/page.js`** — the monolith that *orchestrates* the logged-in product. It
  holds ~90% of the global state (trips, activeTripId, expenses, settlements), the auth
  listener, and every tab handler. Components stay **presentational**.
- **`src/components/*.jsx`** — presentational + a little local state: `Header.jsx` (tabs,
  mobile dock), `SettlementsTab.jsx`, `MembersTab.jsx`, `ExpenseFeed.jsx`, `ExpenseCard.jsx`,
  `BudgetTracker.jsx`, `BudgetEstimator.jsx`, `CurrencyConverter.jsx`,
  `CommunityAnnouncements.jsx`, `NewTripModal.jsx`, `JoinTripModal.jsx`, `AuthModal.jsx`,
  `GlassTripDropdown.jsx`, `GlassMemberDropdown.jsx`, `GlassCategoryDropdown.jsx`,
  `AdminDashboard.jsx`, `ProfilePanel.jsx`, `UpiPaymentModal.jsx`, `PdfReceiptModal.jsx`,
  `ConfirmModal.jsx`, `Toast.jsx`, `Spinner.jsx`, `Footer.jsx`.
- **`src/lib/**`** — **zero-React** business logic and data services, unit-testable and
  reusable. `supabaseDb.js` is the single choke point for all persistence.

### Separation of concerns

1. **Page orchestration** (`page.js`) knows *what* state exists.
2. **Components** know *how* it looks and fire callbacks (`onX(...)`).
3. **Lib** (`supabaseDb.js`, `settlementMath.js`, `errorMessages.js`) knows *where data lives*
   and *how to compute/validate* — no DOM, no JSX.
4. **Server routes** (`api/`) own *secrets and third-party HTTP*.

This means a bug like "settlements got disturbed after refresh" could be traced to one
place (`fetchTripExpenses` + `settlementMath.js`) without touching any UI.

---

## 3. CORE FEATURES & STEP-BY-STEP LOGICAL FLOWS

> Naming note: `expense.payers` = `[{ name, amount }]`, `expense.excludedMembers = [name]`,
> `expense.paidBy` = the primary/single payer name. `settlementMath.js` consumes these.

### Feature 1 — Create/join a trip & add members

User trigger → `NewTripModal` / `JoinTripModal` → `createTripInDb` / `joinTrip` →
Supabase `trips` + `trip_members` rows → `fetchUserTrips` remaps `trip_members` into
`trip.members` → `setAllTrips`.

- `useState`: `allTrips`, `activeTripId`, `showNewTripModal`.
- Lib: `fetchUserTrips` runs a **resilient select** — tries `TRIP_SELECT_FULL`, and on a
  missing-column error retries `TRIP_SELECT_SAFE` (drops `upi_number` / `parent_member_name`).
  Member inserts via `insertMemberSafe` likewise drop optional columns on retry. This
  "growing-less retry" idiom is used everywhere so a half-migrated DB can't brick writes.

### Feature 2 — Log an expense (single payer / **paid by multiple** / with exclusions)

The most intricate flow and the subject of the reported bug.

1. User taps *Add expense* in `page.js`.
2. `buildPayers(numAmount)` (`page.js:~295`):
   - if `paidByMode === 'multiple'` → `Object.entries(paidByAmounts)` filtered to positive
     amounts, each `{ name, amount }`;
   - else → single `{ name, amount }` for the chosen payer.
3. `handleAddExpense` builds `payload = { title, amount, paidBy: primaryPayer, payers,
   category, excludedMembers, ... }`.
4. `createExpenseInDb(payload, userId)` (`supabaseDb.js`):
   - mirrors the row to localStorage (`expenses_<tripId>`) **regardless** of DB outcome;
   - inserts to Supabase `expenses` with `payers` (JSONB) + `excluded_members`;
   - **on error** it retries without each optional column the live schema lacks (e.g. drops
     `payers` if the column is missing); the row is flagged `_localOnly = true` if it never
     reached the DB.
5. `setExpenses([newExp, ...expenses])` → `ExpenseFeed` → `ExpenseCard`.
6. Settlements are derived, not stored per card: `calculateNetBalances` credits each entry
   of `exp.payers` its own `amount` (single payer falls back to `paidBy` getting the full
   `amount`), then `calculateOptimalSettlements` collapses debts to min transactions.

**The refresh bug (now fixed).** On reload, `fetchTripExpenses` builds the list from the DB
first and only merges *local-only* ids (`extras`). If the DB row was saved *without* `payers`
(third-party column missing → retry dropped it), the DB row ("one user") won over the richer
local cache ("all users") → showing one name and a disturbed settlement. Fix: in
`fetchTripExpenses` we now **backfill** `payers` / `excludedMembers` from the local snapshot
when the DB row lacks them (see §4).

### Feature 3 — Remember which trip you were viewing across refresh

`loadUserData` used to always open `trips[0]` (the newest trip), which is why a refresh
"jumped to the new trip." Fix: persist `active_trip` to localStorage
(`getUserStorageKey`) inside `handleSelectTrip` and on load restore it **if it still exists**
in the user's trips, falling back to `trips[0]` only when it doesn't.

User trigger → `handleSelectTrip` → write `active_trip` → `fetchTripExpenses` → `setExpenses`.

### Feature 4 — Settle up with UPI deep-links + PDF

1. `SettlementsTab` renders `calculateOptimalSettlements` output.
2. Tapping a settlement opens `UpiPaymentModal` (builds `upi://pay?pa=...&am=...` deep link)
   and/or `PdfReceiptModal` (`pdfGenerator.js` + `jspdf-autotable`).
3. Confetti + success state via `canvas-confetti` / `ExpenseCard.handleSettlement`.

### Feature 5 — AI Budget Estimator + Currency Converter

- `BudgetEstimator` → `estimatorEngine.js` + `fareEngine.js` (rule/fare heuristics) — no
  network AI. Pure function of origin/destination/mode/duration → per-person budget.
- `CurrencyConverter` → `currencyRates.js` (bundled fallback table) + optional live refresh;
  local `useState` for amount, `from`, `to`.

### Feature 6 — Community announcements (persistence fixed)

`CommunityAnnouncements.jsx` → `createAnnouncementInDb` → `insertAnnouncementResilient`
(retry dropping missing columns / broken profile FK) → localStorage cache + DB.
The dedicated `supabase/migrations/fix_announcements.sql` adds `user_id`/`image_url` and RLS.

---

## 4. STATE MANAGEMENT & DATA HANDLING

### Global vs local state

- **Global (orchestrator) state** lives in `page.js` as plain `useState`:
  `userProfile`, `allTrips`, `activeTripId`, `expenses`, `settledIds`,
  `settlementDetailsMap`, modal flags, expense-form fields, `darkMode`, `activeTab`.
  `currentTrip` is derived with `useMemo([allTrips, activeTripId])`.
- **Component-local state** is inside each component (e.g. `ExpenseCard`'s `balance`,
  `showSuccessBadge`; `Header`'s `showMoreMenu`; feeds' filters). Components receive data +
  callbacks, so they never reach into Supabase directly.
- **No global store library.** The "store" is effectively `page.js` + the localStorage cache.

### Persistence model (the important part)

- **Source of truth:** Supabase rows (`profiles`, `trips`, `trip_members`, `expenses`,
  `settlements`, `announcements`), guarded by **RLS** and by app-level ownership checks
  (`getExpensePermission` allows creator or trip organizer).
- **Resilience cache:** every write is *also* stored per user+trip in localStorage via
  `safeSetItem(getUserStorageKey(userId, key), value)` (`src/lib/storage.js` trims oversized
  inline base64 so QR images don't blow the ~5MB quota).
- **Read strategy — "DB first, local backfill":**
  - `fetchTripExpenses` loads local `extras` (ids not in DB) **and** now backfills
    `payers`/`excludedMembers` when the DB row is missing them.
  - `fetchAnnouncementsFromDb` merges pending local posts.
  - `fetchUserTrips` remaps snake_case → camelCase and is **schema-resilient** (full/safe
    column retry).

### Async / API integration

- Auth: `supabase.auth.getSession()` + `onAuthStateChange` listener set up once in a
  `useEffect` (`page.js`), calling `loadUserData(userId)`.
- DB calls are `async/await` + try/catch; they never throw to the caller — they return
  `{ data, error }` or a `_localOnly` flag so the UI degrades gracefully.
- Third-party APIs (Places, Routes, Unsplash) are called from the browser to **server
  proxies** in `api/`; keys are server-only. `googlePlacesService.js` / `routesService.js` /
  `unsplashService.js` are thin client wrappers; `useDebounce.js` debounces autocomplete.

---

## 5. PERFORMANCE OPTIMIZATIONS & DESIGN PATTERNS

### Design patterns

- **Container / Presenter (Orchestrator).** `page.js` is the container that owns state and
  flow; components are dumb presenters fed by props + callbacks.
- **Data-service singleton (facade).** `supabaseDb.js` is the only module that talks to
  Supabase + localStorage; everything else imports it.
- **Builder / resilient retrofit.** `insertAnnouncementResilient`, `createExpenseInDb`,
  `insertMemberSafe`, `runTripSelect` all *retry with a reduced shape* when the live schema
  is missing optional columns — a pragmatic schema-drift pattern.
- **Mapper functions.** `mapTrip` / `mapMember` normalize DB snake_case → app camelCase.
- **Custom hooks / helpers.** `useDebounce`, `friendlyError`, `animateCounter`,
  `attach3DTilt` keep logic shared and testable.

### Performance techniques

- **Memoization:** `useMemo` for `currentTrip` (avoids re-deriving on every render).
- **Debouncing:** `useDebounce` for search/autocomplete inputs.
- **Lazy image loading:** `loading="lazy"` on avatars/thumbnails; `next.config.mjs` allows
  remote image hosts.
- **localStorage as an async cache:** instant first paint of trips/expenses while Supabase
  confirms, and a safety net for offline/quota.
- **Responsive + reduced-motion:** `prefers-reduced-motion` disables float/shimmer;
  `scroll-into-view` for the mobile dock; `no-scrollbar` overflow rails.
- **CSS niceties:** GPU-friendly `transform`/`opacity` animations (framer-motion),
  `backdrop-blur` only on small surfaces, `will-change`/3D preserve (`transform-style`).
- **Server-side routing:** heavy keys/HTTP never reach the client bundle.

---

## 6. TECHNICAL INTERVIEW Q&A (SPECIFIC TO THIS CODEBASE)

**Q1. Why does the app need *both* Supabase and localStorage? Isn't one enough?**
Supabase is the durable, multi-device source of truth (RLS-protected). But the app must not
lose a user's data if a migration hasn't been applied yet or the network hiccups. Every write
is mirrored to a user+trip localStorage key; reads prefer DB and backfill from the local
snapshot. This is why "paid by multiple" expenses survive a refresh even when the `payers`
column is missing live. The cost is dual-write complexity, paid back in resilience.

**Q2. What caused "paid by multiple" expenses to show only one payer after a refresh, and how was it fixed?**
The insert retried after a 42703 (missing `payers` column) by removing `payers`, so the DB
stored only `paid_by`. On load, `fetchTripExpenses` preferred the DB row over the local cache,
which had the full `payers` array. Fix: build a `localById` map and **backfill** `payers` /
`excludedMembers` from the local row when the DB row is missing them. The accompanying
`fix_persistence.sql` adds the `payers JSONB` column so new rows carry the data natively.

**Q3. Why did a page refresh "jump to a new trip"?**
`loadUserData` unconditionally selected `trips[0]` as active. `fetchUserTrips` orders created
trips newest-first, so a freshly created trip became active on reload. Fix: persist the chosen
trip id under `active_trip` in `handleSelectTrip`, and on load restore it only if it still
belongs to the user, else fall back to `trips[0]`.

**Q4. What does "schema-resilient" mean here, and why is it needed?**
The DB schema can be behind the app (a migration not yet run). The code selects/inserts the
full ("growing") shape first and, on a missing-column/42501 error, retries with a reduced
shape (`MEMBER_SAFE_COLS`, dropping `payers`, etc.). This keeps writes working and never loses
data — at the cost of a second request only on failure.

**Q5. The `/api/*` routes are proxies. What security property do they enforce?**
They keep `GOOGLE_MAPS_API_KEY`, `UNSPLASH_ACCESS_KEY`, and other server vars out of the
browser. The browser calls the proxy; the proxy injects the key. This is why those keys were
moved off `NEXT_PUBLIC_*` (only `NEXT_PUBLIC_SUPABASE_ANON_KEY` stays public because the
client needs it and RLS, not the key, protects data). `next.config.mjs` bridges only the
non-secret `SUPABASE_URL`/`APP_URL` into the client.

**Q6. How is the settlement ("who owes whom") derived, and why is it computed not stored?**
`settlementMath.js` derives it on the fly: per expense, debit each non-excluded member their
share, credit each payer (`exp.payers` with amounts, or a single `paidBy`), then run a
two-pointer greedy over sorted negative/positive balances to minimise transaction count.
Storing it would risk stale values when an expense/member changes; recomputing keeps the UI
always consistent with the ledger.

**Q7. How is "paid by multiple" different from member exclusion in the math?**
Exclusion removes names from the *splitters* (the share is split among fewer people). "Paid by
multiple" changes the *creditors* — each payer is credited its own `amount`. Both are handled
independently in `calculateNetBalances`, which is why a multi-payer, exclusions-enabled expense
needs both `payers` and `excludedMembers` persisted.

**Q8. What makes the auth flow work across the OAuth/magic-link redirect?**
`supabase.js` listens for session changes; `auth/callback/route.js` catches the redirect and
forwards to `/app`. `supabase.auth.getSession()` seeds the session on mount. The app URL is
derived from `window.location.origin` (browser) with an `APP_URL` env fallback (server) — so
redirect URLs work in local dev and production.

**Q9. How would you add a new trip-related table (e.g. `reminders`) safely?**
Add it to `schema.sql` + an idempotent `supabase/migrations/*.sql` (`CREATE TABLE IF NOT
EXISTS`, `ADD COLUMN IF NOT EXISTS`), enable RLS with owner/member policies, then add write/
read functions in `supabaseDb.js` following the "insert, retry-without-optional-columns on
error, mirror to localStorage, merge on read" pattern, plus a mapper + component. Run
`npm run build` to confirm CSS/JS compiles.

**Q10. What is a subtle trade-off you'd call out for a reviewer?**
`page.js` is a very large orchestrator owning most product state — pragmatic for a small repo
and keeps the data flow linear to debug, but harder to unit-test and reuse than splitting into
feature hooks/contexts. The persistence layer mitigates risk, but a future refactor could
extract per-feature state into custom hooks or React contexts without changing `supabaseDb.js`.

---

## Appendix — Changes shipped in this pass

- **`src/lib/supabaseDb.js`** — `fetchTripExpenses` now backfills `payers`/`excludedMembers`
  from the local cache when DB rows lack them (fixes single-payer-after-refresh + disturbed
  settlement).
- **`src/app/app/page.js`** — persist & restore last-active trip (`active_trip`); `handleSelectTrip`
  saves the choice, `loadUserData` restores it when valid.
- **`src/app/globals.css`** — replaced shadcn v4-only `@apply border-border outline-ring` /
  `@apply bg-background text-foreground font-sans` token directives (which fail on Tailwind v3)
  with plain CSS variables so the build compiles.
- Ensure `supabase/migrations/fix_persistence.sql` and `fix_announcements.sql` are applied to
  the live Supabase project (Dashboard → SQL Editor → Run) so `payers`/`excluded_members` and
  the announcements columns exist.