# Smart eBook & Personal Knowledge Platform — Project Analysis

*This document is the working blueprint for the build. It will be updated after every phase with implementation status. Treat it as the living requirement tracker referenced in the SRS instructions.*

> **✅ Project complete — all 7 phases delivered.** Every FR/BR/NFR group
> in section 8 below is marked done. See `docs/phase-reports/phase-7.md`
> for the final full-project audit, including known limitations to review
> before treating this as production-ready.

---

## 1. Project Architecture

**Pattern:** Client-Server, 3-tier, REST API, monorepo with two workspaces.

```
project-root/
├── server/                 # Node.js + Express REST API
│   ├── src/
│   │   ├── config/         # db connection, env loader, storage client
│   │   ├── models/         # Mongoose schemas
│   │   ├── controllers/    # request handlers (thin)
│   │   ├── services/       # business logic (progress calc, analytics, knowledge graph)
│   │   ├── routes/         # route definitions per resource
│   │   ├── middleware/     # auth, role-check, validation, error handler, upload
│   │   ├── validators/     # express-validator / zod schemas
│   │   ├── utils/          # hashing, jwt, pagination helpers, file-type checks
│   │   └── app.js
│   ├── tests/               # Jest/Vitest + Supertest
│   └── server.js
├── client/                 # React (Vite) + MUI
│   ├── src/
│   │   ├── api/             # axios instance + endpoint modules
│   │   ├── context/         # AuthContext
│   │   ├── components/      # reusable UI (BookCard, Reader, HighlightPopover…)
│   │   ├── pages/           # route-level pages
│   │   ├── hooks/
│   │   ├── routes/          # ProtectedRoute, RoleRoute
│   │   └── App.jsx
└── docs/                    # this tracker + API docs
```

**Why this shape:** SRS §6 mandates React/Node/Express/MongoDB/Mongoose + external object storage for files (FR-FILE-01/02). Modular folders satisfy "clean, modular, maintainable" and NFR-Scalability ("modular REST APIs").

**Cross-cutting concerns implemented as middleware/services (allowed per your Rule 3), not user features:**
- JWT auth middleware, role-guard middleware
- Centralized error handler + custom `AppError` class
- Request validation layer
- File upload handler (type + size checks) before storage upload
- Pagination utility
- Rate limiting is **not** in the SRS — will not be added unless you confirm (see Assumptions).

---

## 2. Modules (maps directly to SRS §13)

| # | Module | Core Responsibility |
|---|---|---|
| 1 | Authentication | Register, login, logout, JWT issue/verify |
| 2 | User Management | Profile view/update, avatar, role field |
| 3 | Book Catalog | CRUD, browse, details page data |
| 4 | Search & Filtering | Keyword search, category/author/format/language/date filters, sorting |
| 5 | eBook Reader | Serve file securely, render PDF/EPUB, position tracking hooks |
| 6 | Bookshelf | Add/remove/list saved books, "currently reading" flag |
| 7 | Reading Progress | Save/read position, % calculation, Continue Reading |
| 8 | Bookmarks | CRUD bookmarks tied to a reading position |
| 9 | Highlights | CRUD highlighted text + location + color |
| 10 | Notes & Tags | CRUD notes, link to highlights, tag assignment/search |
| 11 | Reading History | Auto-logged access records, recent list |
| 12 | Reviews & Ratings | CRUD review, 1–5 stars, average calculation, duplicate prevention |
| 13 | Reading Analytics | Aggregation endpoints: totals, started/completed, over-time, top categories |
| 14 | Knowledge Map | Graph of book–highlight–note–tag relationships, privacy default |
| 15 | Knowledge Search | Cross-search notes/highlights/tags, distinct from book search |
| 16 | Author Management | Upload, metadata, own-book edit/delete, approval workflow |
| 17 | File Management | Object storage upload, DB reference, validation, access control |
| 18 | Administration | Dashboard, user mgmt, category mgmt, book approval, stats |
| 19 | Reporting & Moderation | Report content, admin review/resolve |
| 20 | Notifications | Event-based notices (approval/rejection/announcements), read list |

---

## 3. Database Models (MongoDB / Mongoose)

Entities from SRS §10, expanded with fields the SRS implies but doesn't enumerate (flagged as **[assumed]**).

### User
```
_id, name, email (unique, lowercase), passwordHash, profileImage,
role: enum['guest'*not stored, 'reader','author','admin'],
authorProfile: { bio, penName } [assumed, only if role=author],
status: enum['active','restricted','removed'] [assumed - needed for FR-ADMIN-03],
createdAt, updatedAt
```
> Guest is not a DB role — it's the unauthenticated state.

### Book
```
_id, title, description, authorId (ref User), category (ref Category),
coverUrl, fileUrl, format: enum['pdf','epub'], language,
publicationInfo: { publisher, year } [assumed - FR-BOOK-02],
status: enum['pending','approved','rejected','removed'] (BR-08, FR-AUTHOR-09),
avgRating, ratingCount [denormalized for FR-REVIEW-05 performance],
createdAt, updatedAt
```

### Category
```
_id, name (unique), description, createdAt
```

### Bookshelf (join collection) **[assumed name, required by FR-SHELF]**
```
_id, userId, bookId, addedAt, isCurrentlyReading (bool)
```

### ReadingProgress
```
_id, userId, bookId, currentPage, totalPages, progressPercentage, lastReadAt
(unique compound index userId+bookId — BR-10)
```

### Bookmark
```
_id, userId, bookId, position (page/location), label [assumed], createdAt
```

### Highlight
```
_id, userId, bookId, text, location, color, createdAt
```

### Note
```
_id, userId, bookId, highlightId (optional ref), content, tags: [ObjectId ref Tag],
location, createdAt, updatedAt
```

### Tag
```
_id, userId (owner — tags are per-user per FR-TAG-04), name, createdAt
```

### ReadingHistory
```
_id, userId, bookId, lastAccessedAt, lastPosition
```

### Review
```
_id, userId, bookId, rating (1–5), comment, createdAt, updatedAt
(unique compound index userId+bookId — BR-11 / FR-REVIEW-06)
```

### Notification
```
_id, userId, type, message, relatedBookId, isRead, createdAt
```

### Report
```
_id, reporterId, targetType: enum['book','review'] [assumed scope],
targetId, reason, status: enum['open','resolved'], resolvedBy, createdAt
```

**Relationships:** User 1—N Book (as author) · User 1—N (Bookshelf, Progress, Bookmark, Highlight, Note, Tag, History, Review, Notification, Report) · Book 1—N (Highlight, Note, Bookmark, Review, Progress) · Note N—1 Highlight (optional) · Note N—N Tag.

---

## 4. API Plan

Base: `/api`. All non-auth routes below require `Authorization: Bearer <JWT>` unless marked **public**. Role-restricted routes marked accordingly.

| Group | Method & Path | Access |
|---|---|---|
| Auth | POST /auth/register | public |
| | POST /auth/login | public |
| | GET /auth/me | authenticated |
| | POST /auth/logout | authenticated |
| Users | GET /users/me | authenticated |
| | PUT /users/me | authenticated |
| | PUT /users/me/avatar | authenticated |
| Books | GET /books (query: q, category, author, format, language, from, to, sort, page, limit) | public |
| | GET /books/:id | public |
| | POST /books | author |
| | PUT /books/:id | author (own) |
| | DELETE /books/:id | author (own) |
| Categories | GET /categories | public |
| | POST/PUT/DELETE /categories/:id | admin |
| Bookshelf | GET /bookshelf | authenticated |
| | POST /bookshelf/:bookId | authenticated |
| | DELETE /bookshelf/:bookId | authenticated |
| Reader | GET /books/:id/file | authenticated (streams/signed URL) |
| Progress | GET /progress/:bookId | authenticated |
| | PUT /progress/:bookId | authenticated |
| Bookmarks | GET /bookmarks/:bookId | authenticated |
| | POST /bookmarks/:bookId | authenticated |
| | DELETE /bookmarks/:id | authenticated (own) |
| Highlights | GET /highlights/:bookId | authenticated |
| | POST /highlights/:bookId | authenticated |
| | DELETE /highlights/:id | authenticated (own) |
| Notes | GET /notes | authenticated |
| | POST /notes | authenticated |
| | PUT /notes/:id | authenticated (own) |
| | DELETE /notes/:id | authenticated (own) |
| Tags | GET /tags | authenticated |
| | POST /tags | authenticated |
| | DELETE /tags/:id | authenticated (own) |
| History | GET /history | authenticated |
| | DELETE /history/:id | authenticated (own) |
| Reviews | GET /books/:bookId/reviews | public |
| | POST /books/:bookId/reviews | authenticated |
| | PUT/DELETE /reviews/:id | authenticated (own) |
| Analytics | GET /analytics/reading | authenticated |
| | GET /analytics/topics | authenticated |
| Knowledge | GET /analytics/knowledge | authenticated |
| | GET /knowledge/search?q= | authenticated |
| Admin | GET /admin/users | admin |
| | PUT /admin/users/:id/status | admin |
| | GET /admin/books/pending | admin |
| | PUT /admin/books/:id/approve \| /reject | admin |
| | GET /admin/stats | admin |
| Reports | POST /reports | authenticated |
| | GET /admin/reports | admin |
| | PUT /admin/reports/:id/resolve | admin |
| Notifications | GET /notifications | authenticated |
| | PUT /notifications/:id/read | authenticated |

This is a superset of SRS §14 that fills in the roles/categories/admin/report/notification endpoints implied by §7.16–7.20 but not listed in §14's shorter sample list. **Assumption stated per your Rule 11.**

---

## 5. Frontend Pages / Components

**Pages (route-level):**
Home/Catalog · BookDetails · Login · Register · Profile · Bookshelf · Reader (PDF/EPUB viewer) · BookmarksPanel · HighlightsPanel (usually embedded in Reader) · NotesPage · TagsPage · HistoryPage · AnalyticsDashboard · KnowledgeMap · AuthorDashboard (upload/manage) · AdminDashboard (users/categories/books/reports/stats) · NotFound/Unauthorized.

**Key shared components:**
BookCard, BookGrid, SearchBar, FilterPanel, StarRating, ReviewList, ReviewForm, PdfViewer, EpubViewer, HighlightToolbar, NoteEditor, TagChip, ProgressBar, ProtectedRoute, RoleRoute, NavBar, NotificationBell.

**State/Data:** AuthContext (JWT + user), React Query or simple hooks + Axios for server state, no Redux needed (keeps it understandable per your instructions).

---

## 6. Development Phases (mirrors SRS §20 MVP order)

| Phase | Scope | Key SRS Refs |
|---|---|---|
| 1 | Project scaffolding, DB connection, User model, Auth (register/login/logout/me), JWT middleware, role middleware, Profile view/update | FR-AUTH-*, FR-PROFILE-* |
| 2 | Category + Book models, Catalog CRUD, search/filter/sort, pagination, Book details page | FR-BOOK-* |
| 3 | File Management (object storage), Author upload flow, approval workflow, integrated Reader (PDF/EPUB) | FR-AUTHOR-*, FR-FILE-*, FR-READ-* |
| 4 | Bookshelf, Reading Progress, Continue Reading, Reading History, Bookmarks | FR-SHELF-*, FR-PROGRESS-*, FR-HISTORY-*, FR-BOOKMARK-* |
| 5 | Highlights, Notes, Tags, Knowledge Search | FR-HIGHLIGHT-*, FR-NOTE-*, FR-TAG-*, FR-SEARCH-* |
| 6 | Reviews/Ratings, Reading Analytics, Knowledge Map | FR-REVIEW-*, FR-ANALYTICS-*, FR-KNOW-* |
| 7 | Admin Dashboard, Reporting & Moderation, Notifications, security hardening, testing pass | FR-ADMIN-*, FR-REPORT-*, FR-NOTIFY-*, NFR-Security |

Each phase will end with: code delivered, files list, explanation, run/test steps, SRS cross-check, remaining items — per your instructions.

---

## 7. Technical Risks

| Risk | Impact | Mitigation |
|---|---|---|
| EPUB in-browser rendering complexity | Medium | Use `epub.js` (client-side) for actual reading, not download links |
| PDF rendering performance for large files | Medium | Use `react-pdf` / `pdf.js` with page-by-page lazy render |
| Object storage costs/limits (constraint §16) | Low | Use a single provider (e.g., Cloudinary/S3-compatible) with configurable size cap |
| Highlight-to-text-location mapping across reflowable EPUB | High | Store CFI (Canonical Fragment Identifier) for EPUB, page+offset for PDF |
| Knowledge Map visualization complexity | Medium | Start with a simple force-graph library; keep private-by-default (FR-KNOW-05) |
| Duplicate review race conditions | Low | Enforce via unique compound Mongo index, not just app logic |
| File upload security (malicious files) | High | Strict MIME/type whitelist + size limit server-side, never trust client-declared type |
| Role/ownership authorization bugs | High | Centralize ownership checks in middleware/service layer, unit-test each |
| Scope creep beyond SRS | Medium | Every new page/component must map to a listed FR before being built |

---

## 8. Requirement Checklist

Status columns will be filled in as `✅ Done / phase #` during development. All currently `⬜ Pending`.

### 8.1 Authentication (FR-AUTH-01…07) — Phase 1
| ID | Backend | DB | API | Frontend | Validation/Security | Test |
|---|---|---|---|---|---|---|
| FR-AUTH-01..07 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 1 |

### 8.2 Profile (FR-PROFILE-01…04) — Phase 1
| FR-PROFILE-01..04 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 1 |

### 8.3 Catalog (FR-BOOK-01…07) — Phase 2
| FR-BOOK-01..07 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 2 |

### 8.4 Bookshelf (FR-SHELF-01…05) — Phase 4
| FR-SHELF-01..05 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 4 |

### 8.5 Reader (FR-READ-01…06) — Phase 3
| FR-READ-01..06 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 3 |

### 8.6 Progress (FR-PROGRESS-01…04) — Phase 4
| FR-PROGRESS-01..04 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 4 |

### 8.7 Bookmarks (FR-BOOKMARK-01…04) — Phase 4
| FR-BOOKMARK-01..04 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 4 |

### 8.8 Highlights (FR-HIGHLIGHT-01…04) — Phase 5
| FR-HIGHLIGHT-01..04 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 5 |

### 8.9 Notes (FR-NOTE-01…05) — Phase 5
| FR-NOTE-01..05 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 5 |

### 8.10 Tags (FR-TAG-01…04) — Phase 5
| FR-TAG-01..04 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 5 |

### 8.11 Reading History (FR-HISTORY-01…04) — Phase 4
| FR-HISTORY-01..04 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 4 |

### 8.12 Reviews (FR-REVIEW-01…06) — Phase 6
| FR-REVIEW-01..06 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 6 |

### 8.13 Analytics (FR-ANALYTICS-01…05) — Phase 6
| FR-ANALYTICS-01..05 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 6 |

### 8.14 Knowledge Map (FR-KNOW-01…05) — Phase 6
| FR-KNOW-01..05 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 6 |

### 8.15 Knowledge Search (FR-SEARCH-01…04) — Phase 5
| FR-SEARCH-01..04 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 5 |

### 8.16 Author (FR-AUTHOR-01…09) — Phase 3
| FR-AUTHOR-01..09 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 3 |

### 8.17 File Management (FR-FILE-01…06) — Phase 3
| FR-FILE-01..06 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 3 |

### 8.18 Administration (FR-ADMIN-01…08) — Phase 7
| FR-ADMIN-01..08 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 3 (approval) + Phase 7 (rest) |

### 8.19 Reporting/Moderation (FR-REPORT-01…04) — Phase 7
| FR-REPORT-01..04 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 7 |

### 8.20 Notifications (FR-NOTIFY-01…02) — Phase 7
| FR-NOTIFY-01..02 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done / Phase 7 |

### 8.21 Business Rules (BR-01…12)
Mapped into the phases above wherever the corresponding feature is built (e.g., BR-02/BR-03 → Phase 1 & ongoing ownership checks; BR-08 → Phase 3; BR-11 → Phase 6). **Status: ✅ All 12 verified — see the final Business Rules table in `docs/phase-reports/phase-7.md`.**

### 8.22 Non-Functional Requirements (§9.1–9.6)
Tracked continuously, not phase-bound: pagination (Phase 2), file-size/type limits (Phase 3), RBAC + input validation + hashing (Phase 1, reinforced every phase), responsive UI (every phase), graceful error handling (every phase), modular API design (structural, Phase 1 onward). **Status: ✅ All 6 areas covered — see the final NFR table in `docs/phase-reports/phase-7.md`.**

---

## 9. Assumptions Requiring Your Confirmation

1. **Bookshelf** is modeled as a separate join collection (not embedded array in User) — better for scaling per NFR-Scalability.
2. **Tags are per-user**, not global, since FR-TAG-04 implies private tags exist — global tags aren't specified.
3. **Object storage provider** — SRS says "external cloud/object storage" without naming one. I'll use a local-disk-backed storage abstraction in dev with an interface that can swap to S3/Cloudinary in production, unless you tell me which provider/credentials you want to target now.
4. **EPUB/PDF only** as formats (per FR-READ-02 "selected formats such as PDF and/or EPUB") — I will support both.
5. **Report target types** limited to `book` and `review` since SRS doesn't enumerate reportable entities.
6. **User "status" field** (active/restricted/removed) added to support FR-ADMIN-03, not explicitly in the §10 data model but required by the functional requirement.
7. No rate-limiting, no payment, no DRM, no audiobook, no device sync — excluded per §2.2 Out of Scope.

If any of these should be different, tell me before Phase 1 starts and I'll adjust the plan.

---

**Next step:** Say **"Start Phase 1"** and I will build: project scaffolding, MongoDB connection, User model, Authentication (register/login/logout/me), JWT + role middleware, and Profile management — with working code, file list, and SRS cross-check.
