# Smart eBook & Personal Knowledge Platform

MERN-stack academic project implementing the SRS. Built phase-by-phase;
this README covers everything delivered through **Phase 1 (Authentication
& Profile Management)**.

## Prerequisites

- Node.js 18+
- A running MongoDB instance (local `mongod`, or a free MongoDB Atlas cluster)

## 1. Backend setup

```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI to your MongoDB connection string,
# and set JWT_SECRET to a long random string
npm install
npm run dev
```

The API starts on `http://localhost:5000`. Health check:
`GET http://localhost:5000/api/health` should return `{ success: true }`.

### Creating the first administrator

The `admin` role cannot be created through public registration (by design —
see the User model comments). Seed one instead:

```bash
# optional: override defaults via env vars before running
# SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME
npm run seed:admin
```

### Running backend tests

```bash
cd server
npm test
```

This uses an in-memory MongoDB instance (via `mongodb-memory-server`), so
it does **not** touch your real database. Covers: registration, duplicate
email rejection, invalid email format, login success/failure, protected
route blocking, logout, profile view/update, and the full book catalog
(search, filter, sort, pagination, details, availability rules).

### Seeding demo catalog data

The real author-upload workflow doesn't exist until Phase 3, so to see the
catalog with real data, seed some demo books and categories:

```bash
npm run seed:catalog
```

This creates 5 categories, a demo author account
(`demo.author@example.com` / `DemoAuthor123!`), and 8 approved demo books.

> Note: the Phase 2 seed script creates books directly with `status:
> 'approved'` and no real file attached (`fileUrl: null`), purely to
> exercise catalog browsing/search/filter. Those seeded books will 404 if
> you try to open them in the Phase 3 reader, since there's no actual
> file on disk for them. To test the full upload → approve → read flow,
> register a real author account and upload a real PDF/EPUB through
> `/author/books/new`, then approve it from `/admin (Book Approvals tab)` using an
> admin account (see `npm run seed:admin` above).

## 2. Frontend setup

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The app starts on `http://localhost:5173` and talks to the API at the URL
in `client/.env` (`VITE_API_URL`).

## 2.1 Google Sign-In setup (optional — added on request)

This isn't part of the original SRS (which specifies email/password auth
only, FR-AUTH-01…07), but was added as an additional, optional sign-in
method alongside it. Without configuring it, the site works exactly as
before — the Google button just shows a small "not configured" notice
on the Login/Register pages instead of breaking anything.

To enable it:

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) and create an **OAuth 2.0 Client ID** (type: **Web application**).
2. Under **Authorized JavaScript origins**, add `http://localhost:5173` (and your production URL later, if any).
3. Copy the generated **Client ID** (looks like `123456789-abc...apps.googleusercontent.com`). You do **not** need the client secret — this integration only verifies ID tokens client-side, no server-side secret required.
4. Add it to **both**:
   - `server/.env`: `GOOGLE_CLIENT_ID=<your client id>`
   - `client/.env`: `VITE_GOOGLE_CLIENT_ID=<the same client id>`
5. Restart both `npm run dev` processes.

You should now see a real "Sign in with Google" button on the Login and
Register pages. First-time Google sign-in always creates a **Reader**
account (Google doesn't have a concept of "author," so there's no way to
pick a role during that flow) — if you want an Author account, use the
regular email/password form and its Reader/Author toggle.

## 2.2 Forgot password (optional email setup — added on request)

Not part of the original SRS. The login page has a "Forgot password?" link
that sends a one-hour, single-use reset link. With no email service
configured (the default), the link is shown on the page and printed in the
server console in development only. To send real emails, fill in the
`SMTP_*` values in `server/.env` (see `.env.example`). Run `npm install` in
`server/` once, since this adds the `nodemailer` package.

## 3. Try it out

1. Open `http://localhost:5173/register`, create a Reader or Author account.
2. You're redirected to the home page, logged in (session persists on refresh).
3. Visit `/profile` to update your name/bio and upload an avatar.
4. Click "Logout" in the nav bar — session ends, protected pages redirect to `/login`.
5. **(Phase 3)** If you registered as an Author, go to "My Books" → "Upload a book" and submit a real PDF or EPUB file. It starts as `pending`.
6. Log in as an admin (`npm run seed:admin` first) and visit `/admin (Book Approvals tab)` to approve it.
7. Back as the reader/author, open the book's details page and click "Read this book" — the integrated reader opens, tracks your page/position, and resumes where you left off next time.
8. **(Phase 4)** From the book details page, click "Add to bookshelf," then visit "Bookshelf" in the nav bar — the book appears there, showing your reading progress once you've opened it.
9. Turn a few pages/sections in the reader, then go back to the catalog (`/`) — a "Continue reading" section appears at the top with your progress.
10. In the reader, type an optional label and click "Add" under Bookmarks to save your current position; click a saved bookmark to jump back to it.
11. Visit "History" (now under the "Library" menu in the nav bar) to see every book you've opened, most recent first, with an option to remove entries.
12. **(Phase 5)** In the reader, select some text with your mouse — a small bar appears offering to save it as a highlight in one of four colors. Save it, then check the "Highlights" tab in the side panel.
13. Switch to the "Notes" tab in the reader to jot a note about the book, optionally linking it to a highlight and tagging it (type a new tag name and press enter to create it on the fly).
14. From the "Library" menu, visit "Notes" to browse/search all your notes across every book, and filter by tag.
15. From "Library", visit "Knowledge Search" to search across your own notes and highlights together — separate from the catalog's book search.
16. **(Phase 6)** On any book's details page, leave a star rating and optional comment — the average rating updates immediately, both there and on the catalog card.
17. Read a few books and make some progress, then visit "Library" → "Analytics" to see books started/completed, average progress, a 14-day activity chart, and your most-explored categories.
18. Tag a few highlights/notes (if you haven't already), then visit "Library" → "Knowledge Map" — click a tag in the graph to see every note and highlight connected to it.
19. **(Phase 7)** As an admin, click "Admin" in the nav bar — a dashboard with Overview, Book Approvals, Users, Categories, and Reports tabs (book approval moved here from its old standalone page).
20. In "Admin" → "Users", search for an account and change its status to "Restricted" — that account can no longer log in.
21. In "Admin" → "Categories", add or remove a category (removal is blocked while any book still uses it).
22. On any book's details page, click "Report this book" (or the flag icon on someone else's review) to submit a report; as an admin, resolve it from "Admin" → "Reports" — "Remove content" takes the book/review down immediately.
23. Approve or reject a pending book as admin, then log back in as that book's author — a notification appears (bell icon in the nav bar), and clicking it marks it read and jumps to the book.

## Project status — all 7 phases complete

See `docs/01_Project_Analysis_and_Requirement_Checklist.md` for the full
architecture plan and the live requirement-by-requirement tracking table
— every SRS functional requirement (FR-AUTH through FR-NOTIFY) is now
marked done there, phase by phase.

**Phase 1:** FR-AUTH-01…07, FR-PROFILE-01…04.
**Phase 2:** FR-BOOK-01…07 (catalog browsing, keyword search,
category/format/language/publication-period filters, sorting, pagination,
book details page).
**Phase 3:** FR-AUTHOR-01…09, FR-FILE-01…06, FR-READ-01…06
(real in-browser PDF/EPUB rendering, upload/approval workflow).
**Phase 4:** FR-SHELF-01…05 (bookshelf add/remove/list,
currently-reading indicator), FR-PROGRESS-01…04 (percentage calculation
for both PDF and EPUB, "Continue Reading" surface), FR-BOOKMARK-01…04
(save/view/remove/jump-to bookmarks inside the reader), FR-HISTORY-01…04
(automatic access logging, recently-read list, removable entries).
**Phase 5:** FR-HIGHLIGHT-01…04 (real text-selection
highlighting in both PDF and EPUB), FR-NOTE-01…05 (create/edit/delete,
optional highlight link, location), FR-TAG-01…04 (create-on-the-fly,
private per user), FR-SEARCH-01…04 (personal notes/highlights search,
tag filtering, kept separate from catalog search).
**Phase 6:** FR-REVIEW-01…06 (star ratings, comments, edit/
delete own review, live average, duplicate-review prevention via
upsert), FR-ANALYTICS-01…05 (books started/completed/in-progress,
average progress, 14-day activity chart, top categories), FR-KNOW-01…05
(private tag↔book knowledge graph with click-to-explore).
**Phase 7:** FR-ADMIN-01…08 (secure dashboard, user list + status
management, category CRUD, book approval, content removal, system
statistics), FR-REPORT-01…04 (report book/review, admin review/resolve,
optional takedown), FR-NOTIFY-01…02 (book approval/rejection
notifications, in-app bell with unread count and mark-as-read).

**Post-Phase-7 addendum:** Google Sign-In was added as an additional,
optional authentication method (see `docs/phase-reports/addendum-google-signin.md`).
This is **not** an SRS requirement — the original email/password flow
(FR-AUTH-01…07) is untouched and still the graded implementation; Google
Sign-In is a convenience layered on top, not a replacement.

See `docs/phase-reports/` for the detailed report and SRS cross-check for
each phase, and `docs/phase-reports/phase-7.md` in particular for the
final full-project audit.
