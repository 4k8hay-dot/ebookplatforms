require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Book = require('../src/models/Book');

async function seedApprovedBook(suffix = '') {
  const author = new User({ name: 'Author', email: `author${Date.now()}${suffix}@example.com`, role: 'author' });
  author.password = 'password123';
  await author.save();
  const category = await Category.create({ name: `Cat${Date.now()}${suffix}` });
  return Book.create({
    title: `Sample Book ${suffix}`,
    authorId: author._id,
    category: category._id,
    format: 'pdf',
    fileUrl: 'ebooks/whatever.pdf',
    status: 'approved',
  });
}

async function registerReader(agent, email = `reader${Date.now()}@example.com`) {
  await agent.post('/api/auth/register').send({ name: 'Reader', email, password: 'password123' });
}

describe('Reviews & Ratings (FR-REVIEW)', () => {
  test('submitting a review updates the book\'s average rating (FR-REVIEW-05)', async () => {
    const book = await seedApprovedBook('rev1');
    const agentA = request.agent(app);
    await registerReader(agentA, 'revA@example.com');
    await agentA.post(`/api/books/${book._id}/reviews`).send({ rating: 5, comment: 'Loved it' });

    const agentB = request.agent(app);
    await registerReader(agentB, 'revB@example.com');
    await agentB.post(`/api/books/${book._id}/reviews`).send({ rating: 3, comment: 'It was fine' });

    const detailsRes = await request(app).get(`/api/books/${book._id}`);
    expect(detailsRes.body.data.book.avgRating).toBe(4);
    expect(detailsRes.body.data.book.ratingCount).toBe(2);
  });

  test('submitting a second review for the same book updates it instead of duplicating (FR-REVIEW-06/BR-11)', async () => {
    const book = await seedApprovedBook('rev2');
    const agent = request.agent(app);
    await registerReader(agent);

    await agent.post(`/api/books/${book._id}/reviews`).send({ rating: 2, comment: 'Meh' });
    await agent.post(`/api/books/${book._id}/reviews`).send({ rating: 5, comment: 'Changed my mind' });

    const listRes = await request(app).get(`/api/books/${book._id}/reviews`);
    expect(listRes.body.data.reviews).toHaveLength(1);
    expect(listRes.body.data.reviews[0].rating).toBe(5);

    const detailsRes = await request(app).get(`/api/books/${book._id}`);
    expect(detailsRes.body.data.book.avgRating).toBe(5);
    expect(detailsRes.body.data.book.ratingCount).toBe(1);
  });

  test('rejects an out-of-range rating', async () => {
    const book = await seedApprovedBook('rev3');
    const agent = request.agent(app);
    await registerReader(agent);
    const res = await agent.post(`/api/books/${book._id}/reviews`).send({ rating: 7 });
    expect(res.status).toBe(400);
  });

  test("a user cannot edit or delete another user's review (BR-03)", async () => {
    const book = await seedApprovedBook('rev4');
    const agentA = request.agent(app);
    await registerReader(agentA, 'revEditA@example.com');
    const createRes = await agentA.post(`/api/books/${book._id}/reviews`).send({ rating: 4 });
    const reviewId = createRes.body.data.review._id;

    const agentB = request.agent(app);
    await registerReader(agentB, 'revEditB@example.com');

    const editRes = await agentB.put(`/api/reviews/${reviewId}`).send({ rating: 1 });
    expect(editRes.status).toBe(403);

    const deleteRes = await agentB.delete(`/api/reviews/${reviewId}`);
    expect(deleteRes.status).toBe(403);
  });

  test('deleting a review recalculates the average back down', async () => {
    const book = await seedApprovedBook('rev5');
    const agent = request.agent(app);
    await registerReader(agent);
    const createRes = await agent.post(`/api/books/${book._id}/reviews`).send({ rating: 1 });
    const reviewId = createRes.body.data.review._id;

    await agent.delete(`/api/reviews/${reviewId}`);

    const detailsRes = await request(app).get(`/api/books/${book._id}`);
    expect(detailsRes.body.data.book.avgRating).toBe(0);
    expect(detailsRes.body.data.book.ratingCount).toBe(0);
  });
});

describe('Reading Analytics (FR-ANALYTICS)', () => {
  test('computes totals and average progress from reading activity', async () => {
    const bookA = await seedApprovedBook('an1');
    const bookB = await seedApprovedBook('an2');
    const agent = request.agent(app);
    await registerReader(agent);

    await agent.put(`/api/progress/${bookA._id}`).send({ currentPage: 100, totalPages: 100 });
    await agent.put(`/api/progress/${bookB._id}`).send({ currentPage: 50, totalPages: 100 });

    const res = await agent.get('/api/analytics/reading');
    expect(res.status).toBe(200);
    expect(res.body.data.totalBooksStarted).toBe(2);
    expect(res.body.data.totalBooksCompleted).toBe(1);
    expect(res.body.data.booksInProgress).toBe(1);
    expect(res.body.data.averageProgress).toBe(75);
    expect(res.body.data.activityOverTime).toHaveLength(14);
  });

  test('topic analytics tallies categories from books with reading progress', async () => {
    const book = await seedApprovedBook('an3');
    const agent = request.agent(app);
    await registerReader(agent);
    await agent.put(`/api/progress/${book._id}`).send({ currentPage: 1, totalPages: 10 });

    const res = await agent.get('/api/analytics/topics');
    expect(res.status).toBe(200);
    expect(res.body.data.topics).toHaveLength(1);
    expect(res.body.data.topics[0].count).toBe(1);
  });

  test('analytics routes require authentication', async () => {
    const res = await request(app).get('/api/analytics/reading');
    expect(res.status).toBe(401);
  });
});

describe('Knowledge Map (FR-KNOW)', () => {
  test('builds a tag<->book graph from tagged highlights and notes', async () => {
    const book = await seedApprovedBook('km1');
    const agent = request.agent(app);
    await registerReader(agent);

    const tagRes = await agent.post('/api/tags').send({ name: 'biology' });
    const tagId = tagRes.body.data.tag._id;

    await agent.post(`/api/highlights/${book._id}`).send({ text: 'cells', location: '1', tags: [tagId] });
    await agent.post('/api/notes').send({ bookId: book._id, content: 'thoughts on cells', tags: [tagId] });

    const res = await agent.get('/api/analytics/knowledge');
    expect(res.status).toBe(200);
    expect(res.body.data.books).toHaveLength(1);
    expect(res.body.data.tags).toHaveLength(1);
    expect(res.body.data.links).toHaveLength(1); // deduped: same tag+book from both highlight and note
  });

  test('untagged notes/highlights do not appear as graph links', async () => {
    const book = await seedApprovedBook('km2');
    const agent = request.agent(app);
    await registerReader(agent);
    await agent.post(`/api/highlights/${book._id}`).send({ text: 'no tags here', location: '1' });

    const res = await agent.get('/api/analytics/knowledge');
    expect(res.body.data.links).toHaveLength(0);
  });

  test('the knowledge map is private — only returns the caller\'s own data', async () => {
    const book = await seedApprovedBook('km3');
    const agentA = request.agent(app);
    await registerReader(agentA, 'kmA@example.com');
    const tagRes = await agentA.post('/api/tags').send({ name: 'private-topic' });
    await agentA.post(`/api/highlights/${book._id}`).send({ text: 'secret', location: '1', tags: [tagRes.body.data.tag._id] });

    const agentB = request.agent(app);
    await registerReader(agentB, 'kmB@example.com');
    const res = await agentB.get('/api/analytics/knowledge');
    expect(res.body.data.tags).toHaveLength(0);
    expect(res.body.data.books).toHaveLength(0);
  });
});
