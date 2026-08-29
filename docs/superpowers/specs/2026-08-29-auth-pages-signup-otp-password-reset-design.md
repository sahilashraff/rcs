# Design: Auth Pages — Sign-up, Phone OTP, Forgot/Reset Password

Date: 2026-08-29
Status: Approved

## Purpose

Sign In already works. Sign-up, Forgot Password, and Reset Password have
frontend pages but **no backend at all** — none of their routes exist.
This design fixes all three, restyles all four auth pages to the theme's
"split" layout, and adds phone-number verification via WhatsApp OTP,
gated by an Admin-controlled on/off setting.

This is "Piece A" of a two-piece plan. "Piece B" — the much larger
onboarding/KYC request form (company details, legal documents, an
account that stays locked until Admin approves it and its Agent goes
Live) — is explicitly out of scope here and gets its own design pass
once this piece is working.

## Non-goals

- **The onboarding/KYC request form and account-lock gating** (Piece B)
  — separate, later design pass.
- **Real WhatsApp Business API integration.** The OTP code is written
  to the server log instead of actually sent, for now — same pattern
  already established for the Carriers module's real carrier API calls
  (documented interface, no implementation until real credentials
  exist) and for email (`MAIL_MAILER=log`).
- **Real email sending** — already logs locally, unchanged by this pass.
- **Two-factor auth on every sign-in.** OTP is a one-time check at
  sign-up only, not a recurring login step.
- **OTP code history/audit table.** Only the current code matters —
  no past-codes table, per the same reasoning that killed the earlier
  draft's separate `otp_codes` table: there's only ever one active
  code per person, so it lives directly on `users`, the same way
  Laravel's own `email_verified_at` does.

## 1. Data model changes

### `users` table — new columns

| Column | Type | Notes |
|---|---|---|
| `country_code` | string, nullable | e.g. `+91`. Kept separate from `phone`, not concatenated — needed separately for WhatsApp/SMS E.164 formatting and for display. |
| `phone` | string, nullable | The national number, no country code. |
| `phone_verified_at` | timestamp, nullable | Mirrors the stock `email_verified_at` column/convention. |
| `otp_code` | string, nullable | The current 6-digit code, if one is pending. |
| `otp_expires_at` | timestamp, nullable | When that code stops being valid. |
| `otp_attempts` | unsigned tinyint, default 0 | Failed `/otp/verify` attempts against the current code. |

All nullable — existing seeded accounts (`admin@rbm.local` etc.) have
none of this; only new self-serve sign-ups populate it.
`country_code`/`phone` are safe to add to `$fillable` (user-supplied,
non-privileged, same tier as `name`/`email`). `phone_verified_at`,
`otp_code`, `otp_expires_at` are **not** — server-computed only, same
mass-assignment discipline already established for `is_admin`/`is_owner`
(set via direct property assignment, e.g. `$user->otp_code = ...;
$user->save();`, never through a mass-assigned array).

### `settings` table (new)

| Column | Type |
|---|---|
| `key` | string, primary key |
| `value` | text, nullable |
| timestamps | |

A small `Setting` model with two static helpers:
`Setting::get(string $key, $default = null): mixed` and
`Setting::set(string $key, $value): void`. Seed one row:
`otp_verification_enabled => '0'` (off by default). General-purpose on
purpose — Admin will very likely want more toggles like this later
(Piece B's plan-based feature gating is an obvious future user of the
same table), so this isn't a single-flag special case, but it's also
not more than a two-column table — no caching layer, no typed-settings
abstraction, nothing beyond what's needed today.

## 2. Backend endpoints

All under the existing `auth:sanctum`-free public group (same as
`/sign-in` today — these run before a session exists), except the new
Admin settings endpoint.

- **`POST /sign-up`** — body: `name`, `email`, `country_code`, `phone`,
  `password`. Validates email and phone uniqueness. Creates a new
  Tenant, and a User for it with `is_owner = true`, `is_admin = false`
  (identical creation pattern to the existing seeder: `new
  User([...])` + direct property assignment for the privileged
  fields). Then:
  - If `Setting::get('otp_verification_enabled')` is true: generates a
    6-digit code, sets `otp_code`/`otp_expires_at` (10-minute expiry),
    sends it via `OtpSender` (below), responds
    `{requires_verification: true, userId: <id>}`. **No Sanctum token
    is issued yet** — this account cannot authenticate until verified.
  - If false: responds with the exact same shape `/sign-in` already
    returns (`{token, user}`, via the existing shared `userPayload()`
    helper) — so the frontend's existing
    `signUp()`→`handleSignIn()`→`redirect()` auto-login flow keeps
    working with zero frontend logic change for this path.
- **`POST /otp/verify`** — body: `userId`, `code`. Checks `otp_code`
  matches and `otp_expires_at` hasn't passed. On success: sets
  `phone_verified_at`, clears `otp_code`/`otp_expires_at`/
  `otp_attempts`, returns `{token, user}` — same shape as sign-in, so
  the frontend completes auto-login exactly like the OTP-disabled path
  does. Wrong code: increments `otp_attempts`, responds 422; at 5
  failed attempts, clears `otp_code`/`otp_expires_at` outright (the
  code is dead even if still time-valid) and the response says to
  request a new one via resend — caps a 6-digit code at 5 guesses
  instead of leaving it brute-forceable for its full 10-minute window.
  Expired code: 422, same "request a new one" message.
- **`POST /otp/resend`** — body: `userId`. Regenerates code + expiry,
  resets `otp_attempts` to 0, resends via `OtpSender`. Rate-limited by
  requiring the existing code to be at least 30 seconds old before a
  new one can be issued — cheap spam guard, no new infrastructure
  needed.
- **`POST /forgot-password`** — body: `email`. Uses Laravel's built-in
  `Password::sendResetLink()` broker (the `password_reset_tokens`
  table already exists from Laravel's stock migration, unused until
  now — no new table needed). Always responds success-shaped whether
  or not the email exists, standard practice, doesn't leak which
  emails are registered.
- **`POST /reset-password`** — body: `email`, `token`, `password`.
  Uses `Password::reset()` broker, which validates the token against
  `password_reset_tokens` and invalidates it after use.
- **`GET /admin/settings`, `PUT /admin/settings`** — `is-admin` gated,
  same pattern as every other `/admin/*` endpoint. Returns/updates the
  full settings key-value map (just the one `otp_verification_enabled`
  key for now).

### `OtpSender` interface

Mirrors the `CarrierAgentAdapter` pattern from the Carriers & Agents
module — an interface with exactly one real implementation today, and
a documented future swap-in point:

```php
interface OtpSender
{
    public function send(User $user, string $code): void;
}
```

`LogOtpSender` (the only implementation right now) writes the code to
the Laravel log. A future `WhatsAppOtpSender` is where real WhatsApp
Business API integration lands, once credentials exist — nothing else
in the system (the sign-up/resend controllers, the frontend) needs to
change when that happens, since they only ever depend on the
interface, resolved via the container.

### Password reset link → frontend URL

Laravel's default `ResetPassword` notification builds a link to a
backend route, which doesn't exist in this SPA setup. Override
`User::sendPasswordResetNotification(string $token)` to point at the
frontend instead:
`{FRONTEND_URL}/reset-password?token={token}&email={urlencoded email}`.
New `.env` value: `FRONTEND_URL=http://localhost:5173` (mirrors the
existing `APP_URL` pattern already used for the backend's own URL).

## 3. Frontend changes

- **`AuthLayout.tsx`**: `currentLayoutType` changes from `'side'` to
  `'split'` — a one-line change that restyles all four auth pages
  consistently (Sign In's behavior is unchanged, only its appearance).
- **`SignUpForm.tsx`**: rebuilt as a 2-step wizard using the existing
  `Steps` UI component (already present in this repo, unused until
  now). Step 1: Name, Email, Country Code + Phone. Step 2: Password,
  Confirm Password. The actual submit only fires on step 2 — step 1's
  "Next" just runs its own field validation and advances.
- **`AuthProvider.tsx`'s `signUp()`**: branches on the response shape
  — if it carries `requires_verification`, navigate to
  `/otp-verification` (passing the returned `userId`) instead of
  calling `handleSignIn()`; otherwise, behavior is unchanged
  (auto-login, same as today).
- **`OtpVerification` page/form**: wired to the real `/otp/verify` and
  `/otp/resend` endpoints — today it's a `sleep()` + `console.log`
  stub that verifies nothing. On a successful verify, calls
  `handleSignIn()` + `redirect()`, completing sign-in exactly like the
  OTP-disabled path.
- **`ResetPasswordForm`/`ResetPassword` page**: reads `token` and
  `email` from the URL query string (`useSearchParams`) and includes
  them in the `apiResetPassword` call. This is a real, pre-existing
  gap in the stock theme code — as shipped, the form has no way to
  know whose password it's resetting.
- **New minimal Admin Settings page**: one toggle, "Require phone
  verification at sign-up" — same `Switcher` UI pattern already used
  for the Carriers active/inactive toggle. Calls the new
  `GET/PUT /admin/settings` endpoints.

## 4. Terminology / conventions carried forward

- No "Owner" in new UI copy, code comments, or commit messages.
- No automated test code — verification via curl/tinker, matching this
  project's established convention.
- No `git push` without explicit confirmation for that specific push.
- Server-computed/sensitive `User` fields are set via direct property
  assignment, never through `$fillable` mass assignment — the same
  discipline established for `is_admin`/`is_owner`/`tenant_id` earlier
  in this project.

## Verification

- Sign-up with OTP **disabled**: response includes a token; frontend
  auto-logs in; the new account lands on its entry page, same as any
  other sign-in.
- Sign-up with OTP **enabled**: response has no token; `/otp/verify`
  with the code from the log succeeds and returns a token, completing
  login; a wrong or expired code is rejected with a clear 422.
- `/otp/resend` issued twice within 30 seconds is rejected; after 30
  seconds it succeeds and the old code stops working.
- 5 wrong codes in a row against `/otp/verify` kills that code (the
  6th attempt, even with the *correct* code, fails) — confirms the
  brute-force cap actually holds, not just that it's rejected once.
- Forgot Password → the reset link (with its token) appears in the log
  → Reset Password using that link's token and a new password
  succeeds; reusing the same token a second time fails (Laravel's
  broker invalidates it after one use).
- Toggling `otp_verification_enabled` off mid-session doesn't affect
  an account that already has a pending `otp_code` from before the
  toggle flipped — only new sign-ups after the flip skip OTP.
- `npm run build` clean; no automated tests, per project convention.
