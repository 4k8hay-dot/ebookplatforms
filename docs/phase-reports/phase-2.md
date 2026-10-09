# Phase 2 Report — eBook Catalog

## What was implemented

**Backend**
- `Category` model + `GET /api/categories` (public) — populates catalog
  filter options. Full CRUD stays an Administration capability, built in
  Phase 7 with the rest of the admin dashboard.
- `Book` model per SRS §10.2, extended with `publicationInfo` (publisher/
  year) and denormalized `avgRating`/`ratingCount` (unused until Phase 6
  Reviews, but part of the schema now so no later migration is needed).
  Text index on title/description/language for search; compound indexes
  for category/status/author/format/year to keep filtering fast.
- `GET /api/books` — public catalog with:
  - keyword search (`q`, MongoDB text search)
  - filter by category, author, format, language, publication year range
  - sort (newest, oldest, title A–Z/Z–A, rating)
  - pagination (`page`, `limit`, capped at 50/page) via a shared `pagination.js` utility
  - only `status: 'approved'` books are ever returned — this is how "availability" (FR-BOOK-05) is enforced, since the SRS has no separate lending/checkout concept
- `GET /api/books/:id` — book details, 404s for anything not approved
- express-validator query validation for all of the above (invalid Mongo IDs, out-of-range pages, unknown sort values, etc. are rejected with 400s, not silently ignored)
- `seed:catalog` script: creates 5 categories, a demo author, and 8 demo books, since the real author-upload workflow doesn't exist until Phase 3 and the catalog needs real data to browse/test
- 10 new integration tests covering search, every filter type, sorting, pagination math, details page, the availability rule, and malformed/missing IDs

**Frontend**
- `HomePage` now IS the catalog (search bar, filter panel, grid, pagination) — matches SRS §5.1, which lets Guests browse/search/filter without an account
- `SearchBar` (debounced 400ms so it doesn't hit the API on every keystroke)
- `FilterPanel` (category, format, language, year range, sort)
- `BookCard` / `BookGrid` — responsive grid, placeholder cover art when none is set
- `BookDetailsPage` — full book info; explicitly tells the user that reading/bookshelf/reviews arrive in later phases rather than showing broken buttons
- `useDebouncedValue` hook (reusable for future search UIs, e.g. Knowledge Search in Phase 5)

## Files created / modified

```
server/
  src/models/{Category.js, Book.js}                [new]
  src/controllers/{categoryController.js, bookController.js}  [new]
  src/routes/{categoryRoutes.js, bookRoutes.js}     [new]
  src/routes/index.js                                [modified — mounted new routes]
  src/validators/bookValidators.js                  [new]
  src/utils/{pagination.js, seedCatalog.js}          [new]
  tests/catalog.test.js                              [new]
  package.json                                       [modified — seed:catalog script]
client/
  src/api/{bookApi.js, categoryApi.js}               [new]
  src/hooks/useDebouncedValue.js                     [new]
  src/components/{BookCard.jsx, BookGrid.jsx, SearchBar.jsx, FilterPanel.jsx}  [new]
  src/pages/HomePage.jsx                             [replaced — was Phase 1 placeholder, now the real catalog]
  src/pages/BookDetailsPage.jsx                      [new]
  src/App.jsx                                        [modified — added /books/:id route]
README.md                                            [updated]
```

## How to run / test

Same as Phase 1, plus:
```bash
cd server
npm run seed:catalog   # populates demo categories + books
npm test                # includes the new catalog.test.js suite
```
Then open `http://localhost:5173/` — you should see the seeded books,
be able to search "quantum", filter by category/format/language/year,
sort, and click into a details page.

> As before, I was not able to run `npm install` / `npm test` myself in
> this sandbox (no network access) — all backend files pass a
> `node --check` syntax validation, but please run the real test suite
> locally and tell me if anything fails.

## SRS Cross-Check — Phase 2

| Requirement | Description | Status | Where |
|---|---|---|---|
| FR-BOOK-01 | Display catalog | ✅ | `GET /api/books`, `HomePage.jsx` |
| FR-BOOK-02 | Book info: title, author, cover, description, category, publication info, format, availability | ✅ | `Book` model, `BookDetailsPage.jsx` |
| FR-BOOK-03 | Keyword search | ✅ | Mongo text index + `q` param, `SearchBar.jsx` |
| FR-BOOK-04 | Filter by category | ✅ | `category` param, `FilterPanel.jsx` |
| FR-BOOK-05 | Filter by author/format/language/publication period/availability | ✅ | `author`/`format`/`language`/`fromYear`/`toYear` params; availability = approved-only rule |
| FR-BOOK-06 | Sorting | ✅ | `sort` param (5 options), `FilterPanel.jsx` |
| FR-BOOK-07 | Dedicated details page | ✅ | `GET /api/books/:id`, `BookDetailsPage.jsx` |
| NFR-Performance | Pagination on book lists | ✅ | `pagination.js`, capped at 50/page |
| NFR-Performance | Minimize unnecessary DB queries | ✅ | Compound indexes on category/status/author/format/year |
| §5.1 Guest role | Browse/search/filter/view details without an account | ✅ | All catalog routes are unauthenticated |

## Assumption carried into this phase

"Availability" (FR-BOOK-05) is implemented as the book's approval status
— the catalog only ever surfaces `approved` books. The SRS defines no
lending/checkout/copy-count mechanism, so there's no separate
"available/unavailable per copy" concept to filter on.

## What remains

Bookshelf, eBook Reader, Reading Progress, Bookmarks, Highlights, Notes,
Tags, Reading History, Reviews, Analytics, Knowledge Map/Search, Author
upload, File Management, Administration, Reporting/Moderation,
Notifications.

**Next: Phase 3 — Author upload, File Management, and the integrated
eBook Reader** (real PDF/EPUB rendering, not a download link).
