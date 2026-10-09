# Phase 1 Report — Authentication & Profile Management

## What was implemented

**Backend**
- Project scaffolding (`server/src/...`), env validation, MongoDB connection
- `User` model: hashed passwords (bcrypt), role enum (`reader`/`author`/`admin`),
  `status` enum for account activation control, timestamps
- JWT issued on register/login, delivered via httpOnly/secure/sameSite cookie
- `protect` middleware (authenticates any request), `authorize(...roles)`
  middleware (role-based access control)
- Centralized error handler translating Mongoose/Mongo errors into safe,
  readable messages; `AppError` for intentional operational errors;
  `asyncHandler` to avoid try/catch repetition
- express-validator chains for register/login/profile-update, with a shared
  `validate` middleware
- Local-disk `storageService` (save/delete/serve files) — the same
  interface Phase 3 will extend for eBook files/covers via real cloud storage
- Multer-based avatar upload middleware with MIME-type whitelist and
  configurable size limit
- Endpoints: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`,
  `POST /auth/logout`, `GET /users/me`, `PUT /users/me`, `PUT /users/me/avatar`
- Admin seed script (`npm run seed:admin`)
- Jest + Supertest + mongodb-memory-server integration tests (7 tests)

**Frontend**
- Vite + React + MUI, custom theme (ink navy / brass / warm paper, serif headings)
- `AuthContext` (session restore on load, login/register/logout actions)
- Axios client with `withCredentials: true` for cookie-based auth
- `ProtectedRoute` (any authenticated user) and `RoleRoute` (specific roles,
  ready for Author/Admin pages in later phases)
- Pages: Login, Register (role toggle reader/author), Profile (edit info +
  avatar upload with live preview), Home placeholder, Unauthorized
- NavBar reflecting auth state

## Files created

```
server/
  package.json, .env.example, server.js
  src/app.js
  src/config/{env.js, db.js}
  src/models/User.js
  src/services/storageService.js
  src/middleware/{auth.js, errorHandler.js, notFound.js, validate.js, uploadAvatar.js}
  src/utils/{AppError.js, asyncHandler.js, token.js, seedAdmin.js}
  src/validators/{authValidators.js, userValidators.js}
  src/controllers/{authController.js, userController.js}
  src/routes/{authRoutes.js, userRoutes.js, index.js}
  tests/{setup.js, auth.test.js, profile.test.js}
client/
  package.json, vite.config.js, index.html, .env.example
  src/main.jsx, src/App.jsx, src/theme.js
  src/api/{axiosClient.js, authApi.js, userApi.js}
  src/context/AuthContext.jsx
  src/routes/{ProtectedRoute.jsx, RoleRoute.jsx}
  src/components/NavBar.jsx
  src/pages/{LoginPage.jsx, RegisterPage.jsx, ProfilePage.jsx, HomePage.jsx, UnauthorizedPage.jsx}
README.md, .gitignore
```

## How to run / test

See root `README.md`. Short version:
```bash
# terminal 1
cd server && cp .env.example .env && npm install && npm run dev
# terminal 2
cd client && cp .env.example .env && npm install && npm run dev
```
Backend tests: `cd server && npm test`.

> Network access was unavailable in the sandbox this was built in, so
> `npm install` / `npm test` have **not** been executed by me — please run
> them locally and let me know if anything fails so I can fix it before
> we move on.

## SRS Cross-Check — Phase 1

| Requirement | Description | Status | Where |
|---|---|---|---|
| FR-AUTH-01 | Register with required info | ✅ | `authController.register`, `RegisterPage.jsx` |
| FR-AUTH-02 | Validate email format + uniqueness | ✅ | `authValidators.js` (format), `authController.register` (uniqueness + unique index) |
| FR-AUTH-03 | Hash passwords before storage | ✅ | `User.js` pre-save hook (bcrypt) |
| FR-AUTH-04 | Authenticate with valid credentials | ✅ | `authController.login` |
| FR-AUTH-05 | Secure token-based auth (JWT) | ✅ | `utils/token.js`, httpOnly cookie |
| FR-AUTH-06 | Allow logout | ✅ | `authController.logout`, clears cookie |
| FR-AUTH-07 | Restrict protected functionality to authenticated users | ✅ | `middleware/auth.js` `protect` |
| FR-PROFILE-01 | View own profile | ✅ | `GET /users/me`, `ProfilePage.jsx` |
| FR-PROFILE-02 | Update profile info | ✅ | `PUT /users/me` |
| FR-PROFILE-03 | Upload/change profile image | ✅ | `PUT /users/me/avatar`, `storageService.js` |
| FR-PROFILE-04 | No access to another user's private info | ✅ | Only `/users/me` exists; no public user-by-id endpoint |
| BR-02 | Passwords never stored in plain text | ✅ | bcrypt hash, `passwordHash` has `select: false` and is stripped in `toJSON` |
| BR-03 | Users may modify only their own profile (partial) | ✅ | `req.user` scoping; extended in later phases for notes/highlights/bookmarks |
| BR-05 | Admins have higher privileges | ✅ (groundwork) | Role enum + `authorize()`; enforced fully once admin routes exist in Phase 7 |
| NFR-Security | Hashing, token auth, RBAC, server-side validation, XSS-conscious | ✅ | bcrypt, JWT cookie (httpOnly/secure/sameSite), `authorize()`, express-validator, helmet |
| NFR-Reliability | Invalid input / failures don't crash the app | ✅ | `asyncHandler` + centralized `errorHandler` |
| NFR-Usability | Meaningful error messages | ✅ | `errorHandler.js` maps errors to plain messages |

## What remains (not started yet)

Everything else in the SRS: eBook Catalog, Bookshelf, Reader, Reading
Progress, Bookmarks, Highlights, Notes, Tags, Reading History, Reviews,
Analytics, Knowledge Map, Knowledge Search, Author upload/management,
File Management for eBooks, Administration, Reporting/Moderation,
Notifications — per the phase plan in `docs/01_Project_Analysis_and_Requirement_Checklist.md`.

**Next: Phase 2 — Book Catalog** (Category + Book models, browse/search/
filter/sort, pagination, book details page).
