# Phase 3 Report — Author Upload, File Management & eBook Reader

## What was implemented

**File Management (backend)**
- `storageService.js` extended with a *private* file variant alongside
  the existing public one: eBook files are saved under `private-uploads/`
  (never served by `express.static`), while covers continue to use the
  public `uploads/` path (fine to be directly linkable — they're not
  sensitive). The DB only ever stores a reference/URL, never file bytes
  (FR-FILE-01/02).
- `uploadBookFiles` middleware: validates the eBook file's actual MIME
  type against the *declared* format (not just the file extension),
  validates the cover's MIME type, and enforces independent size limits
  for each (`MAX_COVER_SIZE_MB`, `MAX_EBOOK_SIZE_MB` — FR-AUTHOR-04/05,
  FR-FILE-03/04).
- `GET /api/books/:id/file` — the *only* way to retrieve eBook bytes.
  Requires authentication; a non-approved book's file is only servable to
  its own author or an admin (FR-FILE-05, FR-READ-01).
- Every uploaded file is tied to its Book document via `fileUrl`/`coverUrl`
  (FR-FILE-06).

**Author Management (backend)**
- `POST /api/books` (author-only) — upload with metadata + cover + file;
  new books start `pending` (BR-08).
- `PUT /api/books/:id`, `DELETE /api/books/:id` — restricted to the
  book's own author or an admin (BR-04, FR-AUTHOR-08). Delete is a soft
  delete (`status: 'removed'`) so existing references in later phases
  (bookmarks/notes/reviews) won't dangle, while still satisfying BR-12
  (removed books never appear in normal browsing).
- `GET /api/books/mine` — an author's own submissions regardless of
  status, plus simple counts by status (the "basic statistics" from
  SRS §5.3 — see Assumptions below).
- Minimal `GET/PUT /api/admin/books/...` approval endpoints (admin-only)
  so FR-AUTHOR-09 actually works end-to-end. This is *not* the full
  Administration module — just enough plumbing to unblock this phase.
  Phase 7 will build it out into the complete admin dashboard.

**eBook Reader (backend + frontend)**
- `ReadingProgress` model (SRS §10.3 fields) + `GET/PUT /api/progress/:bookId`,
  scoped to the authenticated user (BR-10), used purely for save/resume
  (FR-READ-04/05) in this phase.
- `PdfViewer.jsx` — real in-browser PDF rendering via `react-pdf`/pdf.js
  (not a download link), with page navigation and zoom.
- `EpubViewer.jsx` — real in-browser EPUB rendering via `epub.js`, with
  section navigation, font-size steps, and a light/dark theme toggle.
- `ReaderPage.jsx` — fetches the book, its file bytes (authenticated,
  as an ArrayBuffer — never a public URL), and any saved progress; picks
  the right viewer by format; debounces position saves.
- `BookDetailsPage` now shows a real "Read this book" button for logged-in
  users instead of a placeholder message.

**Frontend author/admin UI**
- `AuthorDashboardPage` — table of the author's own books with status
  chips and edit/delete actions.
- `BookFormPage` + `BookForm` — shared create/edit form (multipart upload,
  format locked after creation, optional "replace file/cover" on edit).
- `AdminApprovalsPage` — minimal pending-books table with approve/reject.
- `NavBar` — conditional "My Books" (author/admin) and "Approvals" (admin)
  links.
- `RoleRoute` now actually gates real pages for the first time.

## Files created / modified

```
server/
  src/models/ReadingProgress.js                       [new]
  src/services/storageService.js                       [modified — added private-file variant]
  src/middleware/{uploadBookFiles.js, optionalAuth.js}  [new]
  src/validators/{bookMutationValidators.js, progressValidators.js}  [new]
  src/controllers/{bookController.js, adminBookController.js, progressController.js}  [bookController rewritten; others new]
  src/routes/{bookRoutes.js, adminRoutes.js, progressRoutes.js}  [bookRoutes rewritten; others new]
  src/routes/index.js                                   [modified]
  src/config/env.js, .env.example                       [modified — new size-limit vars]
  private-uploads/ (+ .gitkeep)                         [new, gitignored]
  tests/authorUpload.test.js                            [new]
client/
  package.json                                          [modified — react-pdf, epubjs]
  src/api/{authorBookApi.js, adminApi.js, progressApi.js, fileApi.js}  [new]
  src/components/{BookForm.jsx, PdfViewer.jsx, EpubViewer.jsx}  [new]
  src/pages/{ReaderPage.jsx, AuthorDashboardPage.jsx, BookFormPage.jsx, AdminApprovalsPage.jsx}  [new]
  src/pages/BookDetailsPage.jsx                         [modified — Read button]
  src/App.jsx, src/components/NavBar.jsx                [modified — new routes/links]
README.md                                               [updated]
```

## How to run / test

See root `README.md`, section 3 ("Try it out") for the full upload →
approve → read walkthrough. Backend tests:
```bash
cd server && npm test
```
New `authorUpload.test.js` covers: upload success (starts pending, hidden
from public catalog), format/file-mismatch rejection, role restriction
(readers can't upload), ownership enforcement (can't edit/delete another
author's book), owner-can-view-own-pending-book vs stranger-gets-404, the
full admin approve flow, non-admin blocked from admin routes, unauthenticated
file access blocked, authenticated file access to an approved book
succeeds, and reading-progress save/resume.

> As with Phases 1–2, I could not run `npm install`/`npm test` myself in
> this sandbox (no network access). All backend `.js` files pass a
> `node --check` syntax validation. Please run the real suite locally —
> this phase adds two new npm packages (`react-pdf`, `epubjs`) so a fresh
> `npm install` in `client/` is required before it will run.

## SRS Cross-Check — Phase 3

| Requirement | Description | Status | Where |
|---|---|---|---|
| FR-AUTHOR-01 | Authors may upload eBooks | ✅ | `POST /api/books`, `BookFormPage.jsx` |
| FR-AUTHOR-02 | Authors provide metadata | ✅ | `createBookValidator`, `BookForm.jsx` |
| FR-AUTHOR-03 | Authors upload cover images | ✅ | `uploadBookFiles` (`cover` field) |
| FR-AUTHOR-04 | Validate eBook file types | ✅ | `uploadBookFiles` fileFilter checks MIME vs declared format |
| FR-AUTHOR-05 | Enforce configurable size limits | ✅ | `enforcePerFieldSizeLimits`, `MAX_COVER_SIZE_MB`/`MAX_EBOOK_SIZE_MB` |
| FR-AUTHOR-06 | Edit own book info | ✅ | `PUT /api/books/:id` (ownership-checked) |
| FR-AUTHOR-07 | Delete own books subject to policy | ✅ | `DELETE /api/books/:id` (soft delete) |
| FR-AUTHOR-08 | Authors shall not modify others' books | ✅ | `isOwnerOrAdmin()` check, tested |
| FR-AUTHOR-09 | Admins approve/reject submitted books | ✅ | `adminBookController.js`, `AdminApprovalsPage.jsx` |
| FR-FILE-01 | Files stored externally, not as MongoDB blobs | ✅ | `storageService.js` (disk now, swappable) |
| FR-FILE-02 | DB stores references/URLs, not files | ✅ | `Book.fileUrl`/`coverUrl` are strings |
| FR-FILE-03 | Validate file types | ✅ | `uploadBookFiles` |
| FR-FILE-04 | Enforce max upload sizes | ✅ | `enforcePerFieldSizeLimits` |
| FR-FILE-05 | Prevent unauthorized access to restricted files | ✅ | private-uploads folder + `protect` + ownership check on `streamBookFile` |
| FR-FILE-06 | Each file associated with its book record | ✅ | `Book.fileUrl`/`coverUrl` fields |
| FR-READ-01 | Authenticated users open available eBooks via integrated reader | ✅ | `GET /api/books/:id/file` + `ReaderPage.jsx` |
| FR-READ-02 | Support PDF and/or EPUB | ✅ | `PdfViewer.jsx` (react-pdf), `EpubViewer.jsx` (epub.js) |
| FR-READ-03 | Navigation between pages/sections | ✅ | Prev/next controls in both viewers |
| FR-READ-04 | Save reading position | ✅ | `PUT /api/progress/:bookId`, debounced from both viewers |
| FR-READ-05 | Resume from saved position | ✅ | `GET /api/progress/:bookId` on reader load |
| FR-READ-06 | Basic customization: font size, theme, zoom, page nav | ✅ | Zoom in `PdfViewer`; font-size + light/dark theme in `EpubViewer` |
| BR-04 | Authors modify only their own books | ✅ | Tested in `authorUpload.test.js` |
| BR-08 | Books requiring approval not public until approved | ✅ | `status: 'pending'` default, catalog filters on `approved` |
| BR-12 | Deleted books not accessible through normal browsing | ✅ | Soft-delete (`removed`) excluded from catalog filters |

## Assumptions carried into this phase

1. **"Basic statistics" for authors** (§5.3) is interpreted as simple
   counts of their own books by status. The SRS defines no view/download
   tracking anywhere in its data model, so richer analytics aren't
   fabricated here.
2. **Editing the eBook file resets status to `pending`.** The SRS doesn't
   explicitly say whether replacing the file requires re-approval, but
   letting an approved book silently swap its actual content without
   review would undermine BR-08's intent. Editing metadata only does
   *not* require re-approval.
3. **Format is locked after upload.** Changing `pdf`→`epub` (or vice
   versa) after the file's MIME type has been validated against the
   original format would require re-validating everything; the smallest
   safe solution is requiring a new submission instead.
4. **No HTTP Range/partial-content support on `/api/books/:id/file`.**
   The file streams in full on each request. This is simpler and
   sufficient for an academic-project file-size scale; true progressive
   loading for very large PDFs is a possible future enhancement, not an
   SRS requirement.
5. **The admin approval endpoints built here are minimal** (list
   pending, approve, reject) — just enough for FR-AUTHOR-09. The full
   Administration module (user management, category management,
   statistics dashboard, moderation) is still entirely Phase 7 work.

## What remains

Bookshelf, Reading Progress percentage calculation + "Continue Reading"
surface, Bookmarks, Highlights, Notes, Tags, Reading History, Reviews,
Analytics, Knowledge Map/Search, full Administration, Reporting/Moderation,
Notifications.

**Next: Phase 4 — Bookshelf, Reading Progress (percentage + Continue
Reading), Reading History, and Bookmarks.**
