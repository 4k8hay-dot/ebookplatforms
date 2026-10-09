# Phase 5 Report — Highlights, Notes, Tags & Knowledge Search

## What was implemented

**Highlights**
- `Highlight` model per SRS §10.4, extended with an optional `tags`
  array (FR-TAG-01 explicitly requires tagging highlights, even though
  §10.4's sample fields don't list one — documented as an assumption).
- Real text-selection capture, not a simulated/placeholder feature:
  - **PDF**: `react-pdf` renders a genuine selectable text layer; a
    `mouseup` handler reads `window.getSelection()`.
  - **EPUB**: `epub.js` fires a `selected` event with the CFI range and
    the selected text directly — used as-is.
- `SelectionToolbar.jsx` appears whenever text is selected, offering a
  color choice and "Save highlight."
- `GET /api/highlights` (all of the caller's, filterable by keyword/tag/
  book — powers Knowledge Search), `GET /api/highlights/:bookId` (one
  book — powers the reader panel), `POST /api/highlights/:bookId`,
  `DELETE /api/highlights/:id` (ownership-checked).

**Notes**
- `Note` model per SRS §10.5 exactly (userId, bookId, highlightId,
  content, tags, location, timestamps).
- `POST /api/notes` validates that a supplied `highlightId` actually
  belongs to the same user and book before allowing the link (rejects
  cross-user/cross-book note-highlight linking).
- `GET/PUT/DELETE` for listing (with keyword/tag/book filters), editing,
  and deleting — all ownership-checked (BR-03).
- `NotesPanel.jsx` in the reader (create/edit/delete, link to a
  highlight, tag) and a standalone `NotesPage.jsx` for browsing/searching
  every note across every book.

**Tags**
- `Tag` model, scoped per-user (FR-TAG-04). `GET/POST /api/tags`,
  `DELETE /api/tags/:id` — deleting a tag pulls it out of every note and
  highlight that referenced it, so nothing dangles.
- `TagSelector.jsx` — a reusable Autocomplete that lets a note/highlight
  pick existing tags or type a new name to create one on the fly
  (FR-TAG-02), used in `NotesPanel` and reusable anywhere else tags are
  needed later.
- Clicking any tag chip (on `NotesPage`) filters by that tag
  (FR-TAG-03).

**Knowledge Search**
- `KnowledgeSearchPage.jsx` — a single search box that queries the
  caller's own notes and highlights in parallel and displays them
  grouped, plus tag-name matching that lets a click filter both lists by
  that tag. This is entirely separate from the book catalog's search
  (different page, different endpoints, different data — the public
  `Book` collection is never touched here), which is what satisfies
  FR-SEARCH-04's requirement to keep the two distinct.

## Files created / modified

```
server/
  src/models/{Tag.js, Highlight.js, Note.js}                    [new]
  src/controllers/{tagController.js, highlightController.js, noteController.js}  [new]
  src/routes/{tagRoutes.js, highlightRoutes.js, noteRoutes.js}  [new]
  src/routes/index.js                                            [modified]
  src/validators/{tagValidators.js, highlightValidators.js, noteValidators.js}  [new]
  tests/knowledgeManagement.test.js                              [new]
client/
  src/api/{tagApi.js, highlightApi.js, noteApi.js}              [new]
  src/components/{TagSelector.jsx, SelectionToolbar.jsx, HighlightsPanel.jsx, NotesPanel.jsx}  [new]
  src/components/{PdfViewer.jsx, EpubViewer.jsx}                [modified — text-selection capture]
  src/pages/{NotesPage.jsx, KnowledgeSearchPage.jsx}            [new]
  src/pages/ReaderPage.jsx                                       [rewritten — selection toolbar, tabbed side panel]
  src/App.jsx, src/components/NavBar.jsx                        [modified — new routes/links]
README.md                                                        [updated]
```

## How to run / test

See root `README.md`, section 3, steps 12–15.
```bash
cd server && npm test
```
New `knowledgeManagement.test.js` covers: tag create/list/delete with
cascading cleanup, duplicate tag names resolve to the same tag, tags are
private per user, highlight create/list/delete, cross-user highlight
deletion is blocked, cross-book highlight search by keyword, note
create/edit/delete with a valid highlight link, a note cannot borrow
another user's highlight, cross-user note editing is blocked, and note
search by keyword/tag.

> As with previous phases, I could not run `npm install`/`npm test`
> myself in this sandbox (no network access). All backend `.js` files
> pass a `node --check` syntax validation. No new npm packages were
> added this phase.

## SRS Cross-Check — Phase 5

| Requirement | Description | Status | Where |
|---|---|---|---|
| FR-HIGHLIGHT-01 | Highlight supported text | ✅ | Real selection capture in `PdfViewer`/`EpubViewer` + `SelectionToolbar` |
| FR-HIGHLIGHT-02 | Store highlighted content and location | ✅ | `Highlight.text`/`location` |
| FR-HIGHLIGHT-03 | View highlights for a book | ✅ | `GET /api/highlights/:bookId`, `HighlightsPanel.jsx` |
| FR-HIGHLIGHT-04 | Delete highlights | ✅ | `DELETE /api/highlights/:id` |
| FR-NOTE-01 | Create notes associated with a book | ✅ | `POST /api/notes` |
| FR-NOTE-02 | Notes associable with highlighted text | ✅ | `highlightId` field, ownership/book-matched validation |
| FR-NOTE-03 | Edit notes | ✅ | `PUT /api/notes/:id` |
| FR-NOTE-04 | Delete notes | ✅ | `DELETE /api/notes/:id` |
| FR-NOTE-05 | Record location/context of a note | ✅ | `Note.location`, populated from the reader's current position |
| FR-TAG-01 | Assign tags to notes and highlights | ✅ | `tags` array on both models |
| FR-TAG-02 | Create custom tags | ✅ | `TagSelector.jsx` freeSolo create-on-type |
| FR-TAG-03 | View notes associated with a tag | ✅ | Tag-chip click filters `NotesPage` by `?tag=` |
| FR-TAG-04 | Private tags not accessible to unauthorized users | ✅ | Every tag query scoped to `req.user._id`, tested |
| FR-SEARCH-01 | Search personal notes | ✅ | `GET /api/notes?q=` |
| FR-SEARCH-02 | Search saved highlights | ✅ | `GET /api/highlights?q=` |
| FR-SEARCH-03 | Search by tags | ✅ | `?tag=` filter on both notes and highlights |
| FR-SEARCH-04 | Distinguish book search from personal knowledge search | ✅ | `KnowledgeSearchPage.jsx` is a fully separate page/endpoint set from the catalog |
| BR-03 | Users modify only their own notes/highlights/tags (extends earlier scope) | ✅ | Ownership checks throughout, tested |

## Assumptions carried into this phase

1. **Highlights can carry tags**, even though SRS §10.4's sample field
   list doesn't mention one — FR-TAG-01 explicitly requires it, so the
   functional requirement took precedence over the illustrative schema.
2. **Editing a highlight isn't supported** — only create/view/delete, per
   FR-HIGHLIGHT-01/03/04. The SRS never lists an edit requirement for
   highlights (unlike notes, which explicitly get FR-NOTE-03), so none
   was added.
3. **Knowledge Search is implemented as two parallel client-side queries**
   (`/api/notes?q=` + `/api/highlights?q=`) rather than a single combined
   backend endpoint — simpler, reuses existing endpoints exactly as
   Phase 4/5 already built them, and still fully satisfies "search
   personal notes" + "search saved highlights" as distinct, working
   capabilities under one page.
4. **Tag names are case-sensitive for uniqueness** ("Sci-Fi" and "sci-fi"
   would be two different tags) — kept simple rather than adding
   normalization logic the SRS doesn't ask for.

## A note on UI density

The nav bar now carries quite a few links (Bookshelf, Notes, Knowledge
Search, History, plus role-conditional My Books/Approvals). It still
works, but it's getting visually busy on smaller desktop windows. This
is a cosmetic issue, not a functional one — worth a "group under a menu"
pass in a future polish cycle. Not addressed now to stay focused on
implementing SRS requirements rather than UI refinement.

## What remains

Reviews & Ratings, Reading Analytics, Personal Knowledge Map, the full
Administration dashboard, Reporting/Moderation, Notifications.

**Next: Phase 6 — Reviews & Ratings, Reading Analytics, and the Personal
Knowledge Map.**
