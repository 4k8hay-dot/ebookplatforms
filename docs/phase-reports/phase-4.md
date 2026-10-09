# Phase 4 Report — Bookshelf, Reading Progress, Bookmarks & Reading History

## What was implemented

**Bookshelf**
- `Bookshelf` model (join collection, per Assumption #1 from the analysis
  doc) + `GET/POST/DELETE /api/bookshelf`. "Currently reading" (FR-SHELF-04)
  is computed by joining against `ReadingProgress` at read time rather
  than stored as a separate flag, so it can never drift out of sync.
- `BookshelfPage.jsx` — grid of saved books with a progress bar/badge for
  ones already started, "Continue"/"Start reading" and "Remove" actions.
- `BookDetailsPage` now has a working "Add to bookshelf" / "On your
  bookshelf" toggle button.

**Reading Progress (percentage + Continue Reading)**
- `progressController.js` extended: for PDFs, the percentage is computed
  server-side from `currentPage/totalPages` (simple, hard to spoof); for
  EPUBs, epub.js generates a book-wide "locations" index client-side and
  computes the percentage from the CFI, which the server accepts directly
  (documented as an assumption — there's no reliable way to compute
  EPUB completion percentage without a fixed page model, and epub.js
  already solves this correctly).
- `GET /api/progress` — every book with saved, incomplete progress,
  newest first, capped at 20 — the data behind "Continue Reading."
- `ContinueReadingSection.jsx` — shown at the top of the catalog page for
  logged-in users with in-progress books.

**Bookmarks**
- `Bookmark` model + `GET/POST /api/bookmarks/:bookId`,
  `DELETE /api/bookmarks/:id` (ownership-checked, BR-03).
- `BookmarksPanel.jsx` — sits alongside the reader; "Add" saves the
  reader's live current position with an optional label; clicking a
  bookmark commands the active viewer to jump there.
- Both `PdfViewer` and `EpubViewer` now expose a `goToPosition(pos)`
  method via `forwardRef`/`useImperativeHandle` so `ReaderPage` can drive
  navigation imperatively (FR-BOOKMARK-04).

**Reading History**
- `ReadingHistory` model + `GET /api/history`, `POST /api/history/:bookId`,
  `DELETE /api/history/:id`.
- A single shared `recordAccess()` helper is called both when the reader
  page opens (FR-HISTORY-01) and every time progress is saved
  (FR-HISTORY-02 — keeps `lastPosition` current without an extra request
  from the client on every page turn).
- `HistoryPage.jsx` — recently-read list, newest first, removable entries.

## Files created / modified

```
server/
  src/models/{Bookshelf.js, Bookmark.js, ReadingHistory.js}     [new]
  src/controllers/{bookshelfController.js, bookmarkController.js, historyController.js}  [new]
  src/controllers/progressController.js                         [rewritten — percentage calc, Continue Reading list, history sync]
  src/routes/{bookshelfRoutes.js, bookmarkRoutes.js, historyRoutes.js}  [new]
  src/routes/progressRoutes.js                                  [rewritten — added GET / list route]
  src/routes/index.js                                           [modified]
  src/validators/{bookshelfValidators.js, bookmarkValidators.js, historyValidators.js}  [new]
  src/validators/progressValidators.js                          [modified — progressPercentage field]
  tests/bookshelfHistoryBookmarks.test.js                       [new]
client/
  src/api/{bookshelfApi.js, bookmarkApi.js, historyApi.js}      [new]
  src/api/progressApi.js                                        [modified — listMyProgressRequest]
  src/components/{BookmarksPanel.jsx, ContinueReadingSection.jsx}  [new]
  src/components/{PdfViewer.jsx, EpubViewer.jsx}                [modified — forwardRef goToPosition, EPUB percentage]
  src/pages/{BookshelfPage.jsx, HistoryPage.jsx}                [new]
  src/pages/ReaderPage.jsx                                      [rewritten — bookmarks panel, history recording, jump-to-position]
  src/pages/BookDetailsPage.jsx                                 [modified — bookshelf toggle, progress bar]
  src/pages/HomePage.jsx                                        [modified — Continue Reading section]
  src/App.jsx, src/components/NavBar.jsx                        [modified — new routes/links]
README.md                                                       [updated]
```

## How to run / test

See root `README.md`, section 3, steps 8–11 for the full walkthrough.
```bash
cd server && npm test
```
New `bookshelfHistoryBookmarks.test.js` covers: add/list/remove from
bookshelf, duplicate-add is a no-op, bookshelf requires auth, bookmark
create/list/delete, cross-user bookmark deletion is blocked (BR-03),
history is recorded on access and removable, saving progress refreshes
history, PDF percentage is computed correctly from page numbers, EPUB
percentage is accepted as sent by the client, and Continue Reading
excludes 100%-complete books.

> As with previous phases, I could not run `npm install`/`npm test`
> myself in this sandbox (no network access). All backend `.js` files
> pass a `node --check` syntax validation. No new npm packages were added
> this phase, so no fresh `client` install is required — just pull the
> updated files.

## SRS Cross-Check — Phase 4

| Requirement | Description | Status | Where |
|---|---|---|---|
| FR-SHELF-01 | Add book to bookshelf | ✅ | `POST /api/bookshelf/:bookId` |
| FR-SHELF-02 | Remove book from bookshelf | ✅ | `DELETE /api/bookshelf/:bookId` |
| FR-SHELF-03 | Display saved books | ✅ | `GET /api/bookshelf`, `BookshelfPage.jsx` |
| FR-SHELF-04 | Identify books currently being read | ✅ | Derived from `ReadingProgress` join, shown as a badge |
| FR-SHELF-05 | Access previously read books through history | ✅ | `HistoryPage.jsx`, linked from nav |
| FR-PROGRESS-01 | Record reading progress | ✅ | `PUT /api/progress/:bookId` |
| FR-PROGRESS-02 | Calculate progress from position | ✅ | Server-side for PDF, epub.js-assisted for EPUB |
| FR-PROGRESS-03 | Display progress as a percentage | ✅ | `LinearProgress` on Bookshelf/Details/Continue Reading |
| FR-PROGRESS-04 | "Continue Reading" option | ✅ | `GET /api/progress`, `ContinueReadingSection.jsx` |
| FR-BOOKMARK-01 | Bookmark a page/position | ✅ | `POST /api/bookmarks/:bookId` |
| FR-BOOKMARK-02 | View saved bookmarks | ✅ | `GET /api/bookmarks/:bookId`, `BookmarksPanel.jsx` |
| FR-BOOKMARK-03 | Remove bookmarks | ✅ | `DELETE /api/bookmarks/:id` |
| FR-BOOKMARK-04 | Selecting a bookmark returns to its position | ✅ | `goToPosition()` via viewer ref |
| FR-HISTORY-01 | Record books accessed | ✅ | `POST /api/history/:bookId`, fired on reader open |
| FR-HISTORY-02 | Record the latest reading position | ✅ | `recordAccess()` called from `upsertProgress` |
| FR-HISTORY-03 | Display recently read books | ✅ | `GET /api/history`, `HistoryPage.jsx` |
| FR-HISTORY-04 | Remove history items | ✅ | `DELETE /api/history/:id` |
| BR-03 | Users modify only their own bookmarks (extends Phase 1's scope) | ✅ | Ownership check in `bookmarkController.deleteBookmark`, tested |
| BR-10 | Progress associated with the correct user+book | ✅ | Unique compound index, unchanged since Phase 3 |

## Assumptions carried into this phase

1. **"Currently reading" is derived, not stored** — computed from whether
   a `ReadingProgress` record exists for that user+book, rather than a
   redundant boolean that could fall out of sync.
2. **EPUB percentage is trusted from the client.** The server has no
   practical way to compute a reflowable EPUB's completion percentage
   from a CFI without re-implementing epub.js's own locations logic; the
   validated, bounded (0–100) value the client already computed is
   accepted instead. PDF percentage remains fully server-computed.
3. **"Continue Reading" excludes books at exactly 100%** — once finished,
   there's nothing left to "continue"; this isn't stated explicitly in
   the SRS but is the only sensible reading of the requirement's intent.
4. **Bookmarks are unlabeled by default** — the SRS doesn't require a
   label, but an unlabeled list of raw page numbers/CFIs would be
   unusable with more than one or two bookmarks, so an optional label
   field was added (smallest reasonable addition, Rule 11).

## What remains

Highlights, Notes, Tags, Knowledge Search, Reviews & Ratings, Reading
Analytics, Personal Knowledge Map, the full Administration dashboard,
Reporting/Moderation, Notifications.

**Next: Phase 5 — Highlights, Notes, Tags, and Knowledge Search.**
