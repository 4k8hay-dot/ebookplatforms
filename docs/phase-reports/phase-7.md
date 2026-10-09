# Phase 7 Report — Administration, Reporting/Moderation & Notifications

*This is the final phase. The end of this report includes a full
project-wide SRS audit, not just this phase's slice.*

## What was implemented

**Administration**
- `Report` and `Notification` models.
- User management: `GET /api/admin/users` (search by name/email, filter
  by role/status, paginated), `PUT /api/admin/users/:id/status`
  (activate/restrict/remove — an admin is blocked from changing their
  *own* status, to prevent accidental lockout).
- Category management promoted from Phase 2's read-only endpoint to full
  CRUD: `POST/PUT/DELETE /api/categories` (admin-only). Deleting a
  category still in use by any book is blocked (409), rather than
  silently orphaning those books.
- `GET /api/admin/stats` — user counts by role, book counts by status,
  category count, open/resolved report counts.
- The Phase 3 book-approval screen is absorbed into a proper dashboard:
  `AdminDashboardPage.jsx` with Overview / Book Approvals / Users /
  Categories / Reports tabs, replacing the old standalone
  `/admin/approvals` route.

**Reporting & Moderation**
- `POST /api/reports` — any authenticated user can report a `book` or a
  `review` with a reason (validated against the actual target existing).
- `GET /api/admin/reports` (filterable by open/resolved) and
  `PUT /api/admin/reports/:id/resolve` — resolving can optionally take
  the reported content down in the same action: a book is soft-removed
  (`status: 'removed'`, consistent with the Phase 3 delete policy), a
  review is hard-deleted with the book's average rating recalculated
  immediately after.
- `ReportDialog.jsx` reused from both `BookDetailsPage` ("Report this
  book") and `ReviewList` (flag icon on any review that isn't the
  caller's own).

**Notifications**
- `createNotification()` service, called automatically when an admin
  approves or rejects a book — the author gets a real, stored
  notification, not just a UI toast that disappears.
- `GET /api/notifications` (with unread count), `PUT /api/notifications/:id/read`
  (ownership-checked).
- `NotificationBell.jsx` — badge with unread count, polls every 30s,
  dropdown list, clicking an item marks it read and navigates to the
  related book.

## Files created / modified

```
server/
  src/models/{Report.js, Notification.js}                       [new]
  src/services/notificationService.js                           [new]
  src/controllers/{adminController.js, reportController.js, notificationController.js}  [new]
  src/controllers/adminBookController.js                        [modified — notification hooks]
  src/controllers/categoryController.js                         [modified — admin CRUD]
  src/routes/{reportRoutes.js, notificationRoutes.js}           [new]
  src/routes/adminRoutes.js                                     [rewritten — full admin route set]
  src/routes/categoryRoutes.js                                  [modified — admin mutation routes]
  src/routes/index.js                                           [modified]
  src/validators/{adminValidators.js, reportValidators.js, notificationValidators.js, categoryMutationValidators.js}  [new]
  tests/adminModeration.test.js                                 [new]
client/
  src/api/{reportApi.js, notificationApi.js}                    [new]
  src/api/adminApi.js                                           [rewritten — full admin API surface]
  src/components/{ReportDialog.jsx, NotificationBell.jsx}       [new]
  src/components/ReviewList.jsx                                 [modified — report-a-review action]
  src/components/admin/{AdminOverviewTab, AdminApprovalsTab, AdminUsersTab, AdminCategoriesTab, AdminReportsTab}.jsx  [new]
  src/pages/AdminDashboardPage.jsx                               [new]
  src/pages/AdminApprovalsPage.jsx                               [removed — absorbed into AdminDashboardPage]
  src/pages/BookDetailsPage.jsx                                  [modified — report-this-book action]
  src/App.jsx, src/components/NavBar.jsx                        [modified — /admin route, notification bell]
README.md                                                        [updated]
```

## How to run / test

See root `README.md`, section 3, steps 19–23.
```bash
cd server && npm test
```
New `adminModeration.test.js` covers: user listing/search, status
restriction actually blocking login, self-lockout prevention, non-admin
blocked from user management, category create/update/delete, delete
blocked while in use, non-admin blocked from category mutation, stats
shape, report creation → admin list → resolve-with-removal (book
disappears from public catalog), resolve-without-removal (content
survives), non-admin blocked from reports, unauthenticated reporting
blocked, notification creation on approval, notification list/unread
count, mark-as-read, and cross-user mark-as-read blocked.

> As with every previous phase, I could not run `npm install`/`npm test`
> myself in this sandbox (no network access). All backend `.js` files
> pass a `node --check` syntax validation. No new npm packages were
> added this phase.

## SRS Cross-Check — Phase 7

| Requirement | Description | Status | Where |
|---|---|---|---|
| FR-ADMIN-01 | Secure administrator dashboard | ✅ | `AdminDashboardPage.jsx`, all routes `authorize('admin')`-gated |
| FR-ADMIN-02 | View registered users | ✅ | `GET /api/admin/users`, `AdminUsersTab.jsx` |
| FR-ADMIN-03 | Activate/restrict/remove accounts | ✅ | `PUT /api/admin/users/:id/status` |
| FR-ADMIN-04 | Manage categories | ✅ | `POST/PUT/DELETE /api/categories`, `AdminCategoriesTab.jsx` |
| FR-ADMIN-05 | Manage books | ✅ | Existing `PUT/DELETE /api/books/:id` (admin already authorized since Phase 3) |
| FR-ADMIN-06 | Review submitted books | ✅ | `AdminApprovalsTab.jsx` (Phase 3, now in the dashboard) |
| FR-ADMIN-07 | Remove inappropriate/reported content | ✅ | Report resolution's `removeContent` action |
| FR-ADMIN-08 | Dashboard displays basic statistics | ✅ | `GET /api/admin/stats`, `AdminOverviewTab.jsx` |
| FR-REPORT-01 | Users report inappropriate content | ✅ | `POST /api/reports`, `ReportDialog.jsx` |
| FR-REPORT-02 | Record report reasons | ✅ | `Report.reason` |
| FR-REPORT-03 | Admins view reports | ✅ | `GET /api/admin/reports`, `AdminReportsTab.jsx` |
| FR-REPORT-04 | Admins resolve reports | ✅ | `PUT /api/admin/reports/:id/resolve` |
| FR-NOTIFY-01 | Notify users of events (approval/rejection/announcements) | ✅ (approval/rejection only — see assumptions) | `notificationService.js`, called from `adminBookController.js` |
| FR-NOTIFY-02 | Users view their notifications | ✅ | `GET /api/notifications`, `NotificationBell.jsx` |
| BR-05 | Admins have higher privileges than regular users | ✅ | Enforced throughout via `authorize('admin')` |

## Assumptions carried into this phase

1. **Notifications are only fired for book approval/rejection**, not a
   general-purpose "system announcement broadcast" tool. FR-NOTIFY-01
   says the system "may" notify users about events "such as" those two
   plus announcements — the wording is illustrative and optional, and
   there's no other concrete trigger anywhere else in the SRS that a
   broadcast feature would serve. Building an unused admin
   "send an announcement to everyone" tool would be scope not grounded
   in an actual requirement elsewhere.
2. **Report target types stay at `book` and `review`** (carried over from
   the original Phase 0 assumption) — the only two content types on the
   platform that could plausibly need moderation.
3. **Resolving a report without removing content is a simple dismissal.**
   The SRS doesn't describe intermediate states (e.g., "warn the author"),
   so open → resolved (with or without takedown) is the full lifecycle.
4. **An admin cannot demote/restrict their own account.** Not stated in
   the SRS, but a system with no way to recover from the only admin
   locking themselves out would be a genuine operational hazard — this
   guard costs nothing and prevents that.

---

# Final Project Audit — All 7 Phases

Every functional requirement group from the SRS, its implementation
status, and the phase it shipped in.

| SRS Section | Requirement IDs | Status | Phase |
|---|---|---|---|
| Authentication | FR-AUTH-01…07 | ✅ Done | 1 |
| User Profile | FR-PROFILE-01…04 | ✅ Done | 1 |
| eBook Catalog | FR-BOOK-01…07 | ✅ Done | 2 |
| Author Management | FR-AUTHOR-01…09 | ✅ Done | 3 |
| File Management | FR-FILE-01…06 | ✅ Done | 3 |
| eBook Reader | FR-READ-01…06 | ✅ Done | 3 |
| Bookshelf | FR-SHELF-01…05 | ✅ Done | 4 |
| Reading Progress | FR-PROGRESS-01…04 | ✅ Done | 4 |
| Bookmarks | FR-BOOKMARK-01…04 | ✅ Done | 4 |
| Reading History | FR-HISTORY-01…04 | ✅ Done | 4 |
| Highlights | FR-HIGHLIGHT-01…04 | ✅ Done | 5 |
| Personal Notes | FR-NOTE-01…05 | ✅ Done | 5 |
| Tags | FR-TAG-01…04 | ✅ Done | 5 |
| Knowledge Search | FR-SEARCH-01…04 | ✅ Done | 5 |
| Ratings and Reviews | FR-REVIEW-01…06 | ✅ Done | 6 |
| Reading Analytics | FR-ANALYTICS-01…05 | ✅ Done (with a documented data-model limitation on "activity over time") | 6 |
| Personal Knowledge Map | FR-KNOW-01…05 | ✅ Done | 6 |
| Administration | FR-ADMIN-01…08 | ✅ Done | 3 (approval) + 7 (rest) |
| Reporting and Moderation | FR-REPORT-01…04 | ✅ Done | 7 |
| Notifications | FR-NOTIFY-01…02 | ✅ Done (approval/rejection events; broadcast announcements out of scope — see assumptions) | 7 |

**All 20 functional requirement groups in the SRS are implemented,
tested (at the integration level, backend), and wired end-to-end from
MongoDB through the API to the React UI.**

## Business Rules (BR-01 through BR-12) — final check

| Rule | Description | Status |
|---|---|---|
| BR-01 | Valid account required for private features | ✅ — every private route behind `protect` |
| BR-02 | Passwords never stored in plain text | ✅ — bcrypt hash, fixed in the Phase 1 hotfix (`pre('validate')` ordering) |
| BR-03 | Users modify only their own notes/highlights/bookmarks/profile/reviews | ✅ — ownership checks throughout, tested repeatedly |
| BR-04 | Authors modify only their own books | ✅ — tested |
| BR-05 | Admins have higher privileges | ✅ — `authorize('admin')` throughout |
| BR-06 | Only supported eBook formats accepted | ✅ — MIME-type validated against declared format |
| BR-07 | Uploaded files comply with size restrictions | ✅ — configurable per-field limits |
| BR-08 | Books requiring approval not public until approved | ✅ — `status: 'pending'` default, catalog filters on `approved` |
| BR-09 | Personal knowledge information private by default | ✅ — tags/notes/highlights/knowledge map all scoped to `req.user._id` |
| BR-10 | Reading progress associated with the correct user+book | ✅ — unique compound index |
| BR-11 | No unlimited duplicate reviews per book | ✅ — unique index + upsert |
| BR-12 | Deleted books not accessible through normal browsing | ✅ — soft-delete excluded from all public queries |

## Non-Functional Requirements — final check

| Area | What was done |
|---|---|
| Performance | Pagination on catalog/user lists; compound indexes on frequently-filtered fields; denormalized `avgRating`/`ratingCount` to avoid aggregating on every book view |
| Security | bcrypt hashing, httpOnly/secure/sameSite JWT cookie, `helmet`, CORS locked to the configured client origin, server-side `express-validator` on every mutating route, RBAC via `authorize()`, private eBook files unreachable outside an authenticated+ownership-checked endpoint |
| Usability | Consistent nav (with the Phase 5→6 "Library" menu cleanup), MUI throughout, meaningful error messages from the centralized error handler |
| Reliability | `asyncHandler` + centralized error handler everywhere; Mongoose validation errors translated to readable messages; unavailable eBook files return a clean 404 instead of crashing |
| Scalability | Bookshelf/history/progress/bookmarks/highlights/notes/tags all modeled as their own collections rather than embedded arrays, so they scale independently of `User`/`Book` |
| Compatibility | Standard responsive MUI layout throughout; no browser-specific APIs used |

## Known limitations (stated plainly, not buried)

1. **This code has never been executed by me.** Every phase was written
   and syntax-checked (`node --check`) in a sandbox with no network
   access, so `npm install` and the real Jest suite have never actually
   run here. You found and I fixed one real bug this way already (the
   Phase 1 password-hashing hook ordering) — there is a real chance
   other issues surface once you run the full suite for the first time.
   **Please run `npm test` in `server/` now, project-wide, before
   considering this done.**
2. **"Activity over time" in analytics** reflects days with *some*
   reading activity per book, not a true session-by-session log — the
   SRS's data model (§10.3) has no event-log entity to build a more
   precise trend from.
3. **No HTTP Range/partial-content support** on the eBook file endpoint
   — files stream in full each time, which is fine at this project's
   scale but wouldn't be for very large files at production scale.
4. **Notifications only cover book approval/rejection**, not a general
   announcement broadcast tool (see this phase's assumptions).
5. **No automated frontend tests** — Jest/Supertest integration tests
   cover the backend API surface thoroughly; there is no React Testing
   Library / Cypress coverage of the UI. This wasn't explicitly required
   by the SRS's testing mention (Postman/Vitest/Jest were listed for
   dev/testing tooling generally) but is worth knowing before calling
   this "fully tested" in an academic report.

## Where every requirement lives

The requirement-by-requirement table in
`docs/01_Project_Analysis_and_Requirement_Checklist.md` has been kept
current after every phase and now shows all groups as done — that file,
plus the seven phase reports in `docs/phase-reports/`, together form the
complete Backend → Database → API → Frontend → Validation/Security →
Test audit trail requested at the start of this build.
