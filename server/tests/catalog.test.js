require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Book = require('../src/models/Book');

async function seedBasicCatalog() {
  const author = new User({ name: 'Author One', email: 'author1@example.com', role: 'author' });
  author.password = 'password123';
  await author.save();

  const fiction = await Category.create({ name: 'Fiction' });
  const science = await Category.create({ name: 'Science' });

  const books = await Book.create([
    {
      title: 'Ocean of Stars',
      description: 'A sci-fi adventure',
      authorId: author._id,
      category: fiction._id,
      format: 'epub',
      language: 'English',
      publicationInfo: { year: 2020, publisher: 'Test Press' },
      status: 'approved',
    },
    {
      title: 'Quantum Basics',
      description: 'An introduction to quantum mechanics',
      authorId: author._id,
      category: science._id,
      format: 'pdf',
      language: 'English',
      publicationInfo: { year: 2010, publisher: 'Sci Press' },
      status: 'approved',
    },
    {
      title: 'Hidden Draft',
      description: 'Not yet approved, should never appear publicly',
      authorId: author._id,
      category: fiction._id,
      format: 'pdf',
      language: 'English',
      publicationInfo: { year: 2022, publisher: 'Test Press' },
      status: 'pending',
    },
  ]);

  return { author, fiction, science, books };
}

describe('Book catalog', () => {
  test('lists only approved books (FR-BOOK-01, availability rule)', async () => {
    await seedBasicCatalog();
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body.data.books).toHaveLength(2);
    expect(res.body.data.books.every((b) => b.status === 'approved' || b.status === undefined)).toBe(true);
  });

  test('keyword search matches title/description (FR-BOOK-03)', async () => {
    await seedBasicCatalog();
    const res = await request(app).get('/api/books').query({ q: 'quantum' });
    expect(res.status).toBe(200);
    expect(res.body.data.books).toHaveLength(1);
    expect(res.body.data.books[0].title).toBe('Quantum Basics');
  });

  test('filters by category (FR-BOOK-04)', async () => {
    const { fiction } = await seedBasicCatalog();
    const res = await request(app).get('/api/books').query({ category: fiction._id.toString() });
    expect(res.status).toBe(200);
    expect(res.body.data.books).toHaveLength(1);
    expect(res.body.data.books[0].title).toBe('Ocean of Stars');
  });

  test('filters by format, language and publication period (FR-BOOK-05)', async () => {
    await seedBasicCatalog();
    const res = await request(app).get('/api/books').query({ format: 'pdf', toYear: 2015 });
    expect(res.status).toBe(200);
    expect(res.body.data.books).toHaveLength(1);
    expect(res.body.data.books[0].title).toBe('Quantum Basics');
  });

  test('sorts by title ascending (FR-BOOK-06)', async () => {
    await seedBasicCatalog();
    const res = await request(app).get('/api/books').query({ sort: 'title_asc' });
    expect(res.body.data.books.map((b) => b.title)).toEqual(['Ocean of Stars', 'Quantum Basics']);
  });

  test('paginates results', async () => {
    await seedBasicCatalog();
    const res = await request(app).get('/api/books').query({ limit: 1, page: 2 });
    expect(res.status).toBe(200);
    expect(res.body.data.books).toHaveLength(1);
    expect(res.body.data.meta).toMatchObject({ page: 2, limit: 1, totalItems: 2, totalPages: 2 });
  });

  test('returns a book details page for an approved book (FR-BOOK-07)', async () => {
    const { books } = await seedBasicCatalog();
    const approved = books.find((b) => b.status === 'approved');
    const res = await request(app).get(`/api/books/${approved._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.book.title).toBe(approved.title);
  });

  test('404s for a pending (not publicly available) book', async () => {
    const { books } = await seedBasicCatalog();
    const pending = books.find((b) => b.status === 'pending');
    const res = await request(app).get(`/api/books/${pending._id}`);
    expect(res.status).toBe(404);
  });

  test('404s for a non-existent book id, 400s for a malformed one', async () => {
    const validButMissing = new (require('mongoose').Types.ObjectId)();
    const res1 = await request(app).get(`/api/books/${validButMissing}`);
    expect(res1.status).toBe(404);

    const res2 = await request(app).get('/api/books/not-a-valid-id');
    expect(res2.status).toBe(400);
  });
});

describe('Categories', () => {
  test('lists categories (used to populate catalog filters)', async () => {
    await Category.create([{ name: 'Fiction' }, { name: 'Science' }]);
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.data.categories.map((c) => c.name)).toEqual(['Fiction', 'Science']);
  });
});
