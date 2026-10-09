# Addendum — Google Sign-In

*Added after all 7 phases were complete, on direct request. This is
**not** an SRS requirement — flagged here explicitly so it's clear what
was graded-scope work versus a post-completion convenience feature.*

## Why this exists

The SRS's Authentication module (FR-AUTH-01…07) specifies email/password
registration and login only. The request here was to add Google Sign-In
"rather than some made up email" — read as wanting a faster way to test
the app locally without inventing throwaway accounts, not as a request
to remove the graded email/password flow. Both now coexist:

- Email/password registration and login: **unchanged**, still fully
  functional, still what FR-AUTH-01…07 describe.
- Google Sign-In: a new, additional way to get a session, sitting next
  to the existing form on both the Login and Register pages.

## How it works

1. The frontend loads Google's own `gsi/client` script (added to
   `index.html`) and renders Google's real "Sign in with Google" button
   via `GoogleSignInButton.jsx`.
2. When the user completes the Google flow, Google hands the frontend a
   signed **ID token** directly — no server-side OAuth redirect or
   client secret involved.
3. The frontend sends just that token to `POST /api/auth/google`.
4. The backend verifies the token's signature against Google's public
   keys (`google-auth-library`'s `verifyIdToken`, checked against our
   `GOOGLE_CLIENT_ID` as the audience) — this is what actually proves
   the token is genuine and tells us the verified email address.
5. From there, it's the same session mechanism as everywhere else in the
   app: `sendTokenCookie()` issues our own httpOnly JWT cookie. Nothing
   downstream of login (auth middleware, protected routes, roles) needed
   to change at all.

## Account matching rules

- **Existing Google user** (matched by the stored `googleId`): logged
  straight in.
- **No `googleId` match, but the verified Google email matches an
  existing email/password account**: the two are linked (the existing
  account gains a `googleId`) rather than creating a duplicate — this
  is almost certainly what a real person would want if they signed up
  with email/password once and later click "Sign in with Google" using
  the same address.
- **No match at all**: a brand-new account is created with `role:
  'reader'`. Google's own sign-up flow has no concept of "author," so
  there's no way to ask for a role during it — anyone wanting an Author
  account still uses the regular registration form.

## What changed

```
server/
  package.json                         [added google-auth-library]
  .env.example                          [added GOOGLE_CLIENT_ID]
  src/config/env.js                     [added googleClientId]
  src/models/User.js                    [added googleId (unique, sparse);
                                          passwordHash required only when
                                          !googleId; comparePassword now
                                          null-safe]
  src/controllers/authController.js     [added googleLogin; login() now
                                          gives a clear error for
                                          Google-only accounts instead of
                                          crashing on a missing hash]
  src/validators/authValidators.js      [added googleLoginValidator]
  src/routes/authRoutes.js              [added POST /google]
  tests/googleAuth.test.js              [new — google-auth-library mocked]
client/
  index.html                            [added Google Identity Services script]
  .env.example                          [added VITE_GOOGLE_CLIENT_ID]
  src/api/authApi.js                    [added googleLoginRequest]
  src/components/GoogleSignInButton.jsx [new]
  src/utils/avatar.js                   [new — resolveAvatarUrl handles
                                          both our relative upload paths
                                          and Google's absolute picture URLs]
  src/pages/LoginPage.jsx               [added the Google button + divider]
  src/pages/RegisterPage.jsx            [added the Google button + divider,
                                          with a note about the Reader-only
                                          default]
  src/components/NavBar.jsx,
  src/pages/ProfilePage.jsx             [avatar rendering now uses
                                          resolveAvatarUrl]
README.md                               [setup instructions, §2.1]
```

## Testing

`tests/googleAuth.test.js` mocks `google-auth-library` entirely (no real
network calls to Google are possible or desirable in a test suite) and
covers: new-account creation, no duplicate on repeat sign-in, linking to
an existing email/password account by matching verified email, rejecting
an unverified email, rejecting an invalid/unverifiable token, a
restricted account being blocked the same way as regular login, and a
Google-only account getting a clean 400 (not a crash) if someone tries
the regular email/password login endpoint on it.

As with every other backend file in this project, this was written and
syntax-checked (`node --check`) but never actually executed — no network
access in the sandbox this was built in. Please run `npm test` locally;
this is genuinely new surface area (mocked external dependency, new
account-linking logic) that hasn't been exercised for real yet.

## Setup required before this works

Nothing here functions until you provide a real Google OAuth Client ID —
see README.md §2.1 for the exact steps. Without it, the button shows a
plain "not configured" notice instead of erroring or looking broken.

## Assumptions / scope decisions

1. **Kept, not replaced, the email/password flow.** Removing FR-AUTH-01…07
   would drop graded SRS requirements; adding Google alongside was the
   only reading of the request that doesn't do that.
2. **New Google sign-ups are always `role: 'reader'`.** No SRS-defined
   or requested mechanism exists for picking a role mid-OAuth-flow.
3. **No Google avatar auto-import beyond display.** Google's profile
   picture URL is stored in the same `profileImage` field our own
   avatar upload uses, and is displayed correctly (see `resolveAvatarUrl`),
   but a user can still overwrite it with their own upload at any time —
   consistent with treating Google sign-in as "just another way to get
   an account," not a special account type with different rules.
4. **Client ID only, no client secret.** This flow (verifying a
   Google-issued ID token) never requires the app to hold a client
   secret — the secret is only needed for server-side authorization-code
   exchanges, which this integration deliberately avoids in favor of the
   simpler, SPA-appropriate token-verification flow.
