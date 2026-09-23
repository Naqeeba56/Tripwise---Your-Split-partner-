# Security Audit — Tripwise

Scope: input validation, error handling + toast UX, secret/key hygiene, and database row-level security (RLS). Last reviewed against `main`.

## ✅ Passed / Verified

### 1. Secret & API-key hygiene (updated)
- **No secrets committed.** `.env*.local` and `.env` are gitignored; only the placeholder `.env.local.example` is tracked. Confirmed `.env.local` is **not** in git (`git ls-files` returns only `.env.local.example`).
- **No hardcoded keys** in `src/` (scanned for `service_role`, `sk_live`, `AIza...`, PEM blocks, etc. — none found).
- **Google Maps & Unsplash keys are now SERVER-ONLY.** They are stored as `GOOGLE_MAPS_API_KEY` / `UNSPLASH_ACCESS_KEY` (no `NEXT_PUBLIC_` prefix) and only ever read inside Next.js API routes (`/api/places/*`, `/api/routes`, `/api/unsplash`). Client modules (`googlePlacesService.js`, `routesService.js`, `unsplashService.js`) no longer read or embed any key — they call the server-side proxies. A production build scan of the client bundle returns **0 occurrences** of the key or the `NEXT_PUBLIC_*` var. The old `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` are no longer required and should be removed from the host's env vars and from `.env.local`.
- **Supabase key is the public `anon` key**, verified by decoding the JWT payload: `{"role":"anon", ...}`. It is **not** a leaked `service_role` key. The `anon` key is public by design (shipped with the supabase-js client) — data secrecy is enforced by **Row-Level-Security**, not by hiding this key. See `supabase/migrations/expense_ownership_rls.sql`.

### 2. Form validation
- Expense form + announcement form: inline field-level errors (added previously).
- **UPI / phone validation added** (`src/lib/validation.js`):
  - `JoinTripModal` — zod schema now requires a valid UPI handle (`name@bank`) **or** an Indian mobile, with an inline field message.
  - `MembersTab` — add-member submit now rejects invalid UPI handles and non-10-digit mobiles with an inline error.
- Required fields, duplicate-member names, and empty-name cases are guarded.

### 3. Error handling + toast
- `Toast.jsx` renders as a **floating snackbar at `fixed` bottom-center**, `z-[70]`, `bottom-24` on mobile (clears the bottom dock) and `bottom-6` on desktop — it never appears inside a modal and cannot be pushed off-screen. It has `role="status"` + `aria-live="polite"`, auto-dismiss, a manual close button, and tone-based colors.
- **Expense form shows errors INLINE inside the form** (`expenseFormError` banner at the top of the form + per-field messages), plus a spinner on the submit button while saving — no more global floating toast for form mistakes.
- **Loading states:** a shimmer **skeleton loader** is shown during initial auth + first data fetch, and a `Spinner` component renders for API/submit operations.
- Async operations (expense save, settlement, member add) are wrapped in `try/catch` and surface either inline field errors or a success/error toast rather than crashing.
- Currency converter falls back to cached/static rates if the live FX API is unreachable (no crash, shows an "Offline rates" badge).

## ⚠️ Findings to remediate

### F1 — Trip/member/settlement RLS policies are still permissive (Medium)
`supabase/schema.sql` enables RLS, but several policies still allow broad access:

| Table | Policy risk |
|-------|-------------|
| `trips`, `settlements`, `trip_members`, `announcements` | `SELECT … USING (true)` — any authenticated user can read all rows |
| `trip_members` | `INSERT WITH CHECK (true)` — anyone can join or add members |
| `settlements` | `INSERT WITH CHECK (true)` — anyone can record settlements |

This matches the current "demo / shared-board" product model, but before public launch:
- Restrict reads/writes to users who are `trip_members` of the same `trip_id`.
- Announcement `INSERT` should verify `auth.uid()` matches `creator_id`.

**Expenses are now locked down** — `supabase/migrations/expense_ownership_rls.sql` replaces the old
`".../DELETE USING (true)"` policies with UPDATE/DELETE policies that allow only the expense
creator (`expenses.user_id`) or the trip organizer (`trips.created_by`). The app also enforces this
in `src/lib/supabaseDb.js` (`getExpensePermission`) and hides edit/delete in the UI for everyone else.

### F2 — Administrative gating is client-side (Low)
The Admin dashboard is hidden/guarded by comparing emails client-side (`isAdminEmail`). Anyone who edits the client can reach `/admin`, and the app relies on broad RLS (F1). For real isolation, move admin checks to RLS policies / server-side.

### F3 — Personal contact details in DB (Low)
UPI IDs, mobile numbers and QR payloads are stored as plaintext. This is normal for the feature but should be given `pgcrypto`-aware access or, at minimum, be covered by an updated privacy policy.

## 🔧 Recommendations (non-blocking)
1. **Google Maps key:** in Google Cloud, restrict `GOOGLE_MAPS_API_KEY` to your domain + referrer, and enable only the needed APIs (Places New, Routes, Geocoding, Maps JS). **Remove** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` from `.env.local` and your host (it is no longer read by any client code).
2. **Rotate keys periodically** (especially any that may have been committed or shared in the past).
3. **Apply the pending migrations in order** so columns and RLS are correct before relying on them:
   - `supabase/migrations/fix_persistence.sql` (missing `trip_members`, `expenses`, `announcements` columns + base RLS)
   - `supabase/migrations/expense_ownership_rls.sql` (expense `user_id`/`added_by` + creator/organizer update/delete policies)
4. Add `npm` security checks to CI (`npm audit`).

## Files
- Added: `src/lib/validation.js`
- Edited for hardening: `src/components/JoinTripModal.jsx`, `src/components/MembersTab.jsx`