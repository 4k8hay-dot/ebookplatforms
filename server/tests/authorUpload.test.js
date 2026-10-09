require('./setup');
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Book = require('../src/models/Book');

// Minimal valid-enough fake files for upload tests. We don't need real
// PDF/EPUB structure since our validation is based on declared mimetype,
// mirroring how multer/browsers report Content-Type on the multipart part.
function fakePdfBuffer() {
  return Buffer.from('%PDF-1.4 fake pdf content for testing');
}

async function registerAndLogin(agent, overrides = {}) {
  const user = { name: 'Author', email: 'author@example.com', password: 'password123', role: 'author', ...overrides };
  await agent.post('/api/auth/register').send(user);
  return user;
}

describe('Author upload & ownership', () => {
  let category;

  beforeEach(async () => {
    category = await Category.create({ name: 'Fiction' });
  });

  test('an author can upload a book, which starts as pending and is hidden from the public catalog', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const res = await agent
      .post('/api/books')
      .field('title', 'My New Book')
      .field('category', category._id.toString())
      .field('format', 'pdf')
      .attach('ebookFile', fakePdfBuffer(), { filename: 'book.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(res.body.data.book.status).toBe('pending');

    const publicList = await request(app).get('/api/books');
    expect(publicList.body.data.books).toHaveLength(0);
  });

  test('rejects an upload where the file does not match the declared format', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const res = await agent
      .post('/api/books')
      .field('title', 'Mismatched Book')
      .field('category', category._id.toString())
      .field('format', 'epub')
      .attach('ebookFile', fakePdfBuffer(), { filename: 'book.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
  });

  test('rejects upload from a reader (only authors may upload)', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ name: 'Reader', email: 'reader@example.com', password: 'password123', role: 'reader' });

    const res = await agent
      .post('/api/books')
      .field('title', 'Should Fail')
      .field('category', category._id.toString())
      .field('format', 'pdf')
      .attach('ebookFile', fakePdfBuffer(), { filename: 'book.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(403);
  });

  test('an author cannot edit or delete another author\'s book (BR-04/FR-AUTHOR-08)', async () => {
    const agentA = request.agent(app);
    await registerAndLogin(agentA, { email: 'authorA@example.com' });
    const createRes = await agentA
      .post('/api/books')
      .field('title', 'Author A Book')
      .field('category', category._id.toString())
      .field('format', 'pdf')
      .attach('ebookFile', fakePdfBuffer(), { filename: 'book.pdf', contentType: 'application/pdf' });
    const bookId = createRes.body.data.book._id;

    const agentB = request.agent(app);
    await registerAndLogin(agentB, { email: 'authorB@example.com' });

    const editRes = await agentB.put(`/api/books/${bookId}`).send({ title: 'Hijacked title' });
    expect(editRes.status).toBe(403);

    const deleteRes = await agentB.delete(`/api/books/${bookId}`);
    expect(deleteRes.status).toBe(403);
  });

  test('an author can view their own pending book via GET /:id, but a stranger gets 404', async () => {
    const agentA = request.agent(app);
    await registerAndLogin(agentA, { email: 'authorC@example.com' });
    const createRes = await agentA
      .post('/api/books')
      .field('title', 'Visible To Owner Only')
      .field('category', category._id.toString())
      .field('format', 'pdf')
      .attach('ebookFile', fakePdfBuffer(), { filename: 'book.pdf', contentType: 'application/pdf' });
    const bookId = createRes.body.data.book._id;

    const ownerView = await agentA.get(`/api/books/${bookId}`);
    expect(ownerView.status).toBe(200);

    const strangerView = await request(app).get(`/api/books/${bookId}`);
    expect(strangerView.status).toBe(404);
  });
});

describe('Admin approval workflow (FR-AUTHOR-09)', () => {
  test('admin can approve a pending book, making it publicly visible', async () => {
    const category = await Category.create({ name: 'Science' });

    const authorAgent = request.agent(app);
    await registerAndLogin(authorAgent, { email: 'author2@example.com' });
    const createRes = await authorAgent
      .post('/api/books')
      .field('title', 'Pending Book')
      .field('category', category._id.toString())
      .field('format', 'pdf')
      .attach('ebookFile', fakePdfBuffer(), { filename: 'book.pdf', contentType: 'application/pdf' });
    const bookId = createRes.body.data.book._id;

    const admin = new User({ name: 'Admin', email: 'admin@example.com', role: 'admin' });
    admin.password = 'password123';
    await admin.save();
    const adminAgent = request.agent(app);
    await adminAgent.post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' });

    const pendingList = await adminAgent.get('/api/admin/books/pending');
    expect(pendingList.status).toBe(200);
    expect(pendingList.body.data.books.some((b) => b._id === bookId)).toBe(true);

    const approveRes = await adminAgent.put(`/api/admin/books/${bookId}/approve`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.book.status).toBe('approved');

    const publicView = await request(app).get(`/api/books/${bookId}`);
    expect(publicView.status).toBe(200);
  });

  test('a non-admin cannot access admin approval routes', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, { email: 'author3@example.com' });
    const res = await agent.get('/api/admin/books/pending');
    expect(res.status).toBe(403);
  });
});

describe('Protected eBook file access (FR-FILE-05, FR-READ-01)', () => {
  test('an unauthenticated request cannot fetch the eBook file', async () => {
    const category = await Category.create({ name: 'Fiction' });
    const author = new User({ name: 'Author', email: 'authfile@example.com', role: 'author' });
    author.password = 'password123';
    await author.save();
    const book = await Book.create({
      title: 'Protected Book',
      authorId: author._id,
      category: category._id,
      format: 'pdf',
      fileUrl: 'ebooks/does-not-matter.pdf',
      status: 'approved',
    });

    const res = await request(app).get(`/api/books/${book._id}/file`);
    expect(res.status).toBe(401);
  });

  test('an authenticated reader can fetch an approved book\'s file bytes', async () => {
    const category = await Category.create({ name: 'Fiction' });
    const agent = request.agent(app);
    await registerAndLogin(agent, { email: 'author4@example.com' });

    const createRes = await agent
      .post('/api/books')
      .field('title', 'Readable Book')
      .field('category', category._id.toString())
      .field('format', 'pdf')
      .attach('ebookFile', fakePdfBuffer(), { filename: 'book.pdf', contentType: 'application/pdf' });
    const bookId = createRes.body.data.book._id;

    const admin = new User({ name: 'Admin2', email: 'admin2@example.com', role: 'admin' });
    admin.password = 'password123';
    await admin.save();
    const adminAgent = request.agent(app);
    await adminAgent.post('/api/auth/login').send({ email: 'admin2@example.com', password: 'password123' });
    await adminAgent.put(`/api/admin/books/${bookId}/approve`);

    const readerAgent = request.agent(app);
    await readerAgent.post('/api/auth/register').send({ name: 'Reader', email: 'reader4@example.com', password: 'password123', role: 'reader' });

    const fileRes = await readerAgent.get(`/api/books/${bookId}/file`);
    expect(fileRes.status).toBe(200);
    expect(fileRes.headers['content-type']).toBe('application/pdf');
  });
});

describe('Reading progress (FR-READ-04/05)', () => {
  test('saves and retrieves a reading position scoped to the user and book', async () => {
    const category = await Category.create({ name: 'Fiction' });
    const author = new User({ name: 'Author', email: 'authorprog@example.com', role: 'author' });
    author.password = 'password123';
    await author.save();
    const book = await Book.create({
      title: 'Progress Book',
      authorId: author._id,
      category: category._id,
      format: 'epub',
      fileUrl: 'ebooks/whatever.epub',
      status: 'approved',
    });

    const readerAgent = request.agent(app);
    await readerAgent.post('/api/auth/register').send({ name: 'Reader', email: 'readerprog@example.com', password: 'password123' });

    const empty = await readerAgent.get(`/api/progress/${book._id}`);
    expect(empty.status).toBe(200);
    expect(empty.body.data.progress).toBeNull();

    const save = await readerAgent.put(`/api/progress/${book._id}`).send({ position: 'epubcfi(/6/4)' });
    expect(save.status).toBe(200);
    expect(save.body.data.progress.position).toBe('epubcfi(/6/4)');

    const fetch = await readerAgent.get(`/api/progress/${book._id}`);
    expect(fetch.body.data.progress.position).toBe('epubcfi(/6/4)');
  });
});
