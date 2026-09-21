# Security Audit — Tripwise

Scope: input validation, error handling + toast UX, secret/key hygiene, and database row-level security (RLS). Last reviewed against `main`.

## ✅ Passed / Verified

### 1. Secret & API-key hygiene
- **No secrets committed.** `.env*.local` and `.env` are gitignored; only the placeholder `.env.local.example` is tracked. Confirmed `.env.local` is **not** in git (`git ls-files` returns only `.env.local.example`).
- **No hardcoded keys** in `src/` (scanned for `service_role`, `sk_live`, `AIza...`, PEM blocks, etc. — none found).
- **Supabase key is the public `anon` key**, verified by decoding the JWT payload: `{"role":"anon", ...}`. It is **not** a leaked `service_role` key. `anon` is meant to be shipped to the client and is safe to expose.
- **`UNSPLASH_SECRET_KEY` correctly stays server-only** — it is *not* prefixed with `NEXT_PUBLIC_`, so Next.js never inlines it into the browser bundle. (Note: the app is currently using the public Google Places flow and `unsplashService.js` is unused, so this key is not exercised at runtime.)
- **`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`** are all public-by-design (Google Maps / Unsplash keys and site URL are intended for the client). They are only a risk if a provider is misconfigured (see Recommendations → referrer restrictions).

### 2. Form validation
- Expense form + announcement form: inline field-level errors (added previously).
- **UPI / phone validation added** (`src/lib/validation.js`):
  - `JoinTripModal` — zod schema now requires a valid UPI handle (`name@bank`) **or** an Indian mobile, with an inline field message.
  - `MembersTab` — add-member submit now rejects invalid UPI handles and non-10-digit mobiles with an inline error.
- Required fields, duplicate-member names, and empty-name cases are guarded.

### 3. Error handling + toast
- `Toast.jsx` renders as a **floating snackbar at `fixed` bottom-center**, `z-[70]`, `bottom-24` on mobile (clears the bottom dock) and `bottom-6` on desktop — it never appears inside a modal and cannot be pushed off-screen. It has `role="status"` + `aria-live="polite"`, auto-dismiss, a manual close button, and tone-based colors.
- Async operations (expense save, settlement, member add) are wrapped in `try/catch` and surface either inline field errors or a success/error toast rather than crashing.
- Currency converter falls back to cached/static rates if the live FX API is unreachable (no crash, shows an "Offline rates" badge).

## ⚠️ Findings to remediate

### F1 — RLS policies are intentionally permissive (Medium)
`supabase/schema.sql` enables RLS, but the policies currently allow broad access:

| Table | Policy risk |
|-------|-------------|
| `trips`, `expenses`, `settlements`, `trip_members`, `announcements` | `SELECT … USING (true)` — any authenticated user can read all rows |
| `expenses` | `INSERT/DELETE … WITH CHECK/USING (true)` — anyone can insert or delete any expense |
| `trip_members` | `INSERT WITH CHECK (true)` — anyone can join or add members |
| `settlements` | `INSERT WITH CHECK (true)` — anyone can record settlements |

This matches the current "demo / shared-board" product model, but before public launch:
- Restrict reads/writes to users who are `trip_members` of the same `trip_id`.
- Scope `expenses` delete/update to the expense creator (or trip creator). *(Already planned as an optional follow-up.)*
- Announcement `INSERT` should verify `auth.uid()` matches `creator_id`.

### F2 — Administrative gating is client-side (Low)
The Admin dashboard is hidden/guarded by comparing emails client-side (`isAdminEmail`). Anyone who edits the client can reach `/admin`, and the app relies on broad RLS (F1). For real isolation, move admin checks to RLS policies / server-side.

### F3 — Personal contact details in DB (Low)
UPI IDs, mobile numbers and QR payloads are stored as plaintext. This is normal for the feature but should be given `pgcrypto`-aware access or, at minimum, be covered by an updated privacy policy.

## 🔧 Recommendations (non-blocking)
1. **Google Maps key:** in Google Cloud, restrict `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to your domain + referrer, and enable only the needed APIs (Places New, Routes, Geocoding, Maps JS).
2. **Rotate keys periodically** (especially any that may have been committed or shared in the past).
3. Run the pending migration `supabase/migrations/fix_persistence.sql` so DB columns exist before relying on them.
4. Add `npm` security checks to CI (`npm audit`).

## Files
- Added: `src/lib/validation.js`
- Edited for hardening: `src/components/JoinTripModal.jsx`, `src/components/MembersTab.jsx`