# Phase 6 Report — Reviews & Ratings, Reading Analytics, Personal Knowledge Map

## What was implemented

**Reviews & Ratings**
- `Review` model per SRS §10.6, unique per user+book.
- `POST /api/books/:bookId/reviews` is an **upsert**: submitting a second
  review for the same book updates the existing one rather than erroring
  — this is the literal reading of FR-REVIEW-06 ("prevent duplicate
  active ratings... *unless updated*").
- `PUT/DELETE /api/reviews/:id` for explicit edit/delete (ownership-
  checked, BR-03).
- `ratingService.recalculateBookRating()` runs after every create/update/
  delete, keeping `Book.avgRating`/`ratingCount` (already part of the
  schema since Phase 2) always current — no stale averages.
- `ReviewForm`/`ReviewList` on `BookDetailsPage`; the average rating now
  also shows on catalog cards (`BookCard`).

**Reading Analytics**
- `GET /api/analytics/reading` — books started/completed/in-progress,
  average completion percentage, and a 14-day activity chart.
- `GET /api/analytics/topics` — category frequency across books the user
  has made progress in.
- `AnalyticsPage.jsx` with stat cards and a dependency-free inline-SVG
  bar chart (`SimpleBarChart.jsx`) — no new npm package was added for
  this, keeping the "no new untested dependency" posture from earlier
  phases.
- **Honest limitation, stated directly in the code comments and below**:
  `ReadingProgress` only stores each book's *latest* position, not a full
  session log. "Activity over time" is therefore built from each book's
  `lastReadAt` date — it shows which days had *some* activity, not a
  true count of every reading session. A full event log isn't part of
  the SRS's §10.3 data model, so this is the most accurate thing
  derivable from what's actually stored, not a shortcut hidden from you.

**Personal Knowledge Map**
- `GET /api/analytics/knowledge` — builds a tag↔book graph from the
  caller's own tagged highlights/notes only (private by construction,
  satisfying FR-KNOW-05 — there's no sharing mechanism to leak through).
- `KnowledgeGraphSvg.jsx` — a small radial layout (tags on an inner ring,
  books on an outer ring, connecting lines) built with plain inline SVG,
  no charting/graph library dependency.
- Clicking a tag on `KnowledgeMapPage.jsx` fetches the actual notes and
  highlights behind it (reusing the Phase 5 filtered list endpoints),
  satisfying FR-KNOW-02/03 ("view related items" / "selecting a topic
  displays associated books, notes and highlights") with real data, not
  just a visual.

**Nav bar cleanup**
- The Phase 5 report flagged the nav bar getting crowded. This phase
  consolidates Notes, Knowledge Search, Knowledge Map, Analytics, and
  History into a single "Library" dropdown menu, leaving Bookshelf as a
  direct link since it's the most-used one. This resolves that flagged
  issue rather than letting it compound with two more links this phase.

## Files created / modified

```
server/
  src/models/Review.js                                          [new]
  src/services/ratingService.js                                 [new]
  src/controllers/{reviewController.js, analyticsController.js} [new]
  src/routes/{reviewRoutes.js, analyticsRoutes.js}              [new]
  src/routes/bookRoutes.js                                      [modified — nested review routes]
  src/routes/index.js                                           [modified]
  src/validators/reviewValidators.js                            [new]
  tests/reviewsAnalyticsKnowledge.test.js                       [new]
client/
  src/api/{reviewApi.js, analyticsApi.js}                       [new]
  src/components/{ReviewForm.jsx, ReviewList.jsx, SimpleBarChart.jsx, KnowledgeGraphSvg.jsx}  [new]
  src/components/BookCard.jsx                                   [modified — rating display]
  src/pages/{AnalyticsPage.jsx, KnowledgeMapPage.jsx}           [new]
  src/pages/BookDetailsPage.jsx                                 [modified — reviews section, rating display]
  src/App.jsx, src/components/NavBar.jsx                        [modified — new routes, Library menu]
README.md                                                       [updated]
```

## How to run / test

See root `README.md`, section 3, steps 16–18.
```bash
cd server && npm test
```
New `reviewsAnalyticsKnowledge.test.js` covers: average rating
recalculation across multiple reviewers, resubmission updates rather than
duplicates, out-of-range ratings rejected, cross-user edit/delete blocked,
average recalculates correctly after deletion, analytics totals/average/
14-day-array shape, topic tallying, analytics requiring auth, knowledge
graph construction and deduplication, untagged items producing no links,
and the knowledge map being private per user.

> As with previous phases, I could not run `npm install`/`npm test`
> myself in this sandbox (no network access). All backend `.js` files
> pass a `node --check` syntax validation. No new npm packages were
> added this phase (the bar chart and graph are both plain inline SVG).

## SRS Cross-Check — Phase 6

| Requirement | Description | Status | Where |
|---|---|---|---|
| FR-REVIEW-01 | Rate available books | ✅ | `ReviewForm.jsx`, `POST /api/books/:bookId/reviews` |
| FR-REVIEW-02 | 1–5 star scale | ✅ | `Review.rating` min/max validated |
| FR-REVIEW-03 | Submit textual reviews | ✅ | `Review.comment` |
| FR-REVIEW-04 | Edit/delete own review | ✅ | `PUT/DELETE /api/reviews/:id`, ownership-checked |
| FR-REVIEW-05 | Calculate and display average rating | ✅ | `ratingService.js`, shown on details page + catalog cards |
| FR-REVIEW-06 | Prevent duplicate active ratings unless updated | ✅ | Upsert + unique index |
| FR-ANALYTICS-01 | Calculate total reading activity | ✅ | `totalBooksStarted` etc. in `getReadingAnalytics` |
| FR-ANALYTICS-02 | Books started/completed | ✅ | Same endpoint |
| FR-ANALYTICS-03 | Progress statistics | ✅ | `averageProgress` |
| FR-ANALYTICS-04 | Activity over time | ✅ (with documented limitation) | 14-day chart from `lastReadAt` |
| FR-ANALYTICS-05 | Frequently explored categories/topics | ✅ | `getTopicAnalytics` |
| FR-KNOW-01 | Relationships among books/highlights/notes/tags | ✅ | `getKnowledgeMap` graph |
| FR-KNOW-02 | View related knowledge items | ✅ | Tag click → related notes/highlights list |
| FR-KNOW-03 | Selecting a topic shows associated books/notes/highlights | ✅ | Same interaction |
| FR-KNOW-04 | Visual representation where supported | ✅ | `KnowledgeGraphSvg.jsx` |
| FR-KNOW-05 | Private unless explicitly shared | ✅ | Endpoint scoped to `req.user._id`, no sharing feature exists |
| BR-03 | Users modify only their own reviews (extends earlier scope) | ✅ | Tested |
| BR-11 | No unlimited duplicate reviews per book | ✅ | Unique index + upsert |

## Assumptions carried into this phase

1. **"Activity over time" reflects days-with-activity, not a session
   count.** Documented above and in the controller's own comments — the
   SRS's data model has no event log to build a true session-by-session
   trend from, so this is the honest ceiling of what's derivable.
2. **The Knowledge Map graph is aggregated at the tag↔book level**, not
   one node per individual highlight/note. With realistic amounts of
   tagged material this keeps the visual readable; the actual underlying
   items are still fully reachable by clicking a tag (per FR-KNOW-02/03).
3. **"Frequently explored categories" is based on reading progress**,
   not bookshelf membership or catalog browsing history (which isn't
   logged anywhere) — a book only counts toward a category once the user
   has actually opened it and made progress.
4. **No new charting/graph library was added.** Both visualizations are
   plain inline SVG. This was a deliberate choice to avoid adding
   another untested dependency this late in the build, given every
   dependency addition has to be verified by you rather than by me in
   this sandbox.

## What remains

The full Administration dashboard (user management, category management,
system-wide statistics — beyond the minimal book-approval screen built in
Phase 3), Reporting/Moderation, Notifications.

**Next: Phase 7 (final) — Administration, Reporting/Moderation, and
Notifications.**
