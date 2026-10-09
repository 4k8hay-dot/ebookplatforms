require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Book = require('../src/models/Book');

async function seedApprovedBook() {
  const author = new User({ name: 'Author', email: `author${Date.now()}@example.com`, role: 'author' });
  author.password = 'password123';
  await author.save();
  const category = await Category.create({ name: `Cat${Date.now()}` });
  const book = await Book.create({
    title: 'Sample Book',
    authorId: author._id,
    category: category._id,
    format: 'pdf',
    fileUrl: 'ebooks/whatever.pdf',
    status: 'approved',
  });
  return book;
}

async function registerReader(agent, email = `reader${Date.now()}@example.com`) {
  await agent.post('/api/auth/register').send({ name: 'Reader', email, password: 'password123' });
}

describe('Bookshelf (FR-SHELF)', () => {
  test('add, list, and remove a book from the bookshelf', async () => {
    const book = await seedApprovedBook();
    const agent = request.agent(app);
    await registerReader(agent);

    const addRes = await agent.post(`/api/bookshelf/${book._id}`);
    expect(addRes.status).toBe(201);

    const listRes = await agent.get('/api/bookshelf');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items).toHaveLength(1);
    expect(listRes.body.data.items[0].book._id).toBe(String(book._id));
    expect(listRes.body.data.items[0].progress).toBeNull();

    const removeRes = await agent.delete(`/api/bookshelf/${book._id}`);
    expect(removeRes.status).toBe(200);

    const listAfter = await agent.get('/api/bookshelf');
    expect(listAfter.body.data.items).toHaveLength(0);
  });

  test('adding the same book twice does not create duplicates', async () => {
    const book = await seedApprovedBook();
    const agent = request.agent(app);
    await registerReader(agent);

    await agent.post(`/api/bookshelf/${book._id}`);
    await agent.post(`/api/bookshelf/${book._id}`);

    const listRes = await agent.get('/api/bookshelf');
    expect(listRes.body.data.items).toHaveLength(1);
  });

  test('bookshelf requires authentication', async () => {
    const res = await request(app).get('/api/bookshelf');
    expect(res.status).toBe(401);
  });
});

describe('Bookmarks (FR-BOOKMARK)', () => {
  test('create, list, and delete a bookmark', async () => {
    const book = await seedApprovedBook();
    const agent = request.agent(app);
    await registerReader(agent);

    const createRes = await agent.post(`/api/bookmarks/${book._id}`).send({ position: '42', label: 'Great chapter' });
    expect(createRes.status).toBe(201);
    const bookmarkId = createRes.body.data.bookmark._id;

    const listRes = await agent.get(`/api/bookmarks/${book._id}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.bookmarks).toHaveLength(1);

    const deleteRes = await agent.delete(`/api/bookmarks/${bookmarkId}`);
    expect(deleteRes.status).toBe(200);

    const listAfter = await agent.get(`/api/bookmarks/${book._id}`);
    expect(listAfter.body.data.bookmarks).toHaveLength(0);
  });

  test("a user cannot delete another user's bookmark (BR-03)", async () => {
    const book = await seedApprovedBook();

    const agentA = request.agent(app);
    await registerReader(agentA, 'bmA@example.com');
    const createRes = await agentA.post(`/api/bookmarks/${book._id}`).send({ position: '5' });
    const bookmarkId = createRes.body.data.bookmark._id;

    const agentB = request.agent(app);
    await registerReader(agentB, 'bmB@example.com');
    const deleteRes = await agentB.delete(`/api/bookmarks/${bookmarkId}`);
    expect(deleteRes.status).toBe(403);
  });
});

describe('Reading History (FR-HISTORY)', () => {
  test('opening a book records a history entry, and it can be removed', async () => {
    const book = await seedApprovedBook();
    const agent = request.agent(app);
    await registerReader(agent);

    await agent.post(`/api/history/${book._id}`);

    const listRes = await agent.get('/api/history');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.history).toHaveLength(1);

    const itemId = listRes.body.data.history[0]._id;
    const removeRes = await agent.delete(`/api/history/${itemId}`);
    expect(removeRes.status).toBe(200);

    const listAfter = await agent.get('/api/history');
    expect(listAfter.body.data.history).toHaveLength(0);
  });

  test('saving reading progress also refreshes the history entry', async () => {
    const book = await seedApprovedBook();
    const agent = request.agent(app);
    await registerReader(agent);

    await agent.put(`/api/progress/${book._id}`).send({ position: '10', currentPage: 10, totalPages: 100 });

    const listRes = await agent.get('/api/history');
    expect(listRes.body.data.history).toHaveLength(1);
    expect(listRes.body.data.history[0].lastPosition).toBe('10');
  });
});

describe('Reading progress percentage + Continue Reading (FR-PROGRESS)', () => {
  test('computes percentage from currentPage/totalPages for PDFs', async () => {
    const book = await seedApprovedBook();
    const agent = request.agent(app);
    await registerReader(agent);

    const res = await agent.put(`/api/progress/${book._id}`).send({ position: '25', currentPage: 25, totalPages: 100 });
    expect(res.status).toBe(200);
    expect(res.body.data.progress.progressPercentage).toBe(25);
  });

  test('accepts a client-computed percentage directly (EPUB case)', async () => {
    const book = await seedApprovedBook();
    const agent = request.agent(app);
    await registerReader(agent);

    const res = await agent.put(`/api/progress/${book._id}`).send({ position: 'epubcfi(/6/8)', progressPercentage: 63 });
    expect(res.status).toBe(200);
    expect(res.body.data.progress.progressPercentage).toBe(63);
  });

  test('Continue Reading list excludes books at 100%', async () => {
    const bookA = await seedApprovedBook();
    const bookB = await seedApprovedBook();
    const agent = request.agent(app);
    await registerReader(agent);

    await agent.put(`/api/progress/${bookA._id}`).send({ currentPage: 50, totalPages: 100 });
    await agent.put(`/api/progress/${bookB._id}`).send({ currentPage: 100, totalPages: 100 });

    const res = await agent.get('/api/progress');
    expect(res.status).toBe(200);
    const ids = res.body.data.progress.map((p) => p.bookId._id);
    expect(ids).toContain(String(bookA._id));
    expect(ids).not.toContain(String(bookB._id));
  });
});
