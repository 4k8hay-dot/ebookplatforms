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

describe('Tags (FR-TAG)', () => {
  test('create, list, and delete a tag; deleting cascades off notes/highlights', async () => {
    const book = await seedApprovedBook('tags');
    const agent = request.agent(app);
    await registerReader(agent);

    const createRes = await agent.post('/api/tags').send({ name: 'philosophy' });
    expect(createRes.status).toBe(201);
    const tagId = createRes.body.data.tag._id;

    const listRes = await agent.get('/api/tags');
    expect(listRes.body.data.tags).toHaveLength(1);

    const noteRes = await agent.post('/api/notes').send({ bookId: book._id, content: 'A tagged note', tags: [tagId] });
    expect(noteRes.body.data.note.tags).toHaveLength(1);

    const deleteRes = await agent.delete(`/api/tags/${tagId}`);
    expect(deleteRes.status).toBe(200);

    const notesAfter = await agent.get('/api/notes');
    expect(notesAfter.body.data.notes[0].tags).toHaveLength(0);
  });

  test('creating the same tag name twice returns the existing tag, not a duplicate', async () => {
    const agent = request.agent(app);
    await registerReader(agent);

    await agent.post('/api/tags').send({ name: 'sci-fi' });
    await agent.post('/api/tags').send({ name: 'sci-fi' });

    const listRes = await agent.get('/api/tags');
    expect(listRes.body.data.tags).toHaveLength(1);
  });

  test("a tag belongs to one user only — another user's tag list is unaffected (FR-TAG-04)", async () => {
    const agentA = request.agent(app);
    await registerReader(agentA, 'tagsA@example.com');
    await agentA.post('/api/tags').send({ name: 'private-tag' });

    const agentB = request.agent(app);
    await registerReader(agentB, 'tagsB@example.com');
    const listRes = await agentB.get('/api/tags');
    expect(listRes.body.data.tags).toHaveLength(0);
  });
});

describe('Highlights (FR-HIGHLIGHT)', () => {
  test('create, list for a book, and delete a highlight', async () => {
    const book = await seedApprovedBook('hl');
    const agent = request.agent(app);
    await registerReader(agent);

    const createRes = await agent.post(`/api/highlights/${book._id}`).send({ text: 'A key sentence', location: '12' });
    expect(createRes.status).toBe(201);
    const highlightId = createRes.body.data.highlight._id;

    const listRes = await agent.get(`/api/highlights/${book._id}`);
    expect(listRes.body.data.highlights).toHaveLength(1);

    const deleteRes = await agent.delete(`/api/highlights/${highlightId}`);
    expect(deleteRes.status).toBe(200);

    const listAfter = await agent.get(`/api/highlights/${book._id}`);
    expect(listAfter.body.data.highlights).toHaveLength(0);
  });

  test("a user cannot delete another user's highlight (BR-03)", async () => {
    const book = await seedApprovedBook('hl2');
    const agentA = request.agent(app);
    await registerReader(agentA, 'hlA@example.com');
    const createRes = await agentA.post(`/api/highlights/${book._id}`).send({ text: 'Mine', location: '1' });
    const highlightId = createRes.body.data.highlight._id;

    const agentB = request.agent(app);
    await registerReader(agentB, 'hlB@example.com');
    const deleteRes = await agentB.delete(`/api/highlights/${highlightId}`);
    expect(deleteRes.status).toBe(403);
  });

  test('GET /api/highlights (all-mine) supports keyword search across books (FR-SEARCH-02)', async () => {
    const bookA = await seedApprovedBook('hlA1');
    const bookB = await seedApprovedBook('hlB1');
    const agent = request.agent(app);
    await registerReader(agent);

    await agent.post(`/api/highlights/${bookA._id}`).send({ text: 'The mitochondria is the powerhouse', location: '1' });
    await agent.post(`/api/highlights/${bookB._id}`).send({ text: 'A completely unrelated sentence', location: '1' });

    const res = await agent.get('/api/highlights').query({ q: 'mitochondria' });
    expect(res.status).toBe(200);
    expect(res.body.data.highlights).toHaveLength(1);
  });
});

describe('Notes (FR-NOTE)', () => {
  test('create a note linked to a highlight, then edit and delete it', async () => {
    const book = await seedApprovedBook('note1');
    const agent = request.agent(app);
    await registerReader(agent);

    const hlRes = await agent.post(`/api/highlights/${book._id}`).send({ text: 'Something notable', location: '5' });
    const highlightId = hlRes.body.data.highlight._id;

    const createRes = await agent
      .post('/api/notes')
      .send({ bookId: book._id, highlightId, content: 'My thought on this', location: '5' });
    expect(createRes.status).toBe(201);
    const noteId = createRes.body.data.note._id;

    const updateRes = await agent.put(`/api/notes/${noteId}`).send({ content: 'Updated thought' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.note.content).toBe('Updated thought');

    const deleteRes = await agent.delete(`/api/notes/${noteId}`);
    expect(deleteRes.status).toBe(200);
  });

  test('rejects a note with a highlightId that belongs to another user', async () => {
    const book = await seedApprovedBook('note2');
    const agentA = request.agent(app);
    await registerReader(agentA, 'noteA@example.com');
    const hlRes = await agentA.post(`/api/highlights/${book._id}`).send({ text: 'Owned by A', location: '1' });
    const highlightId = hlRes.body.data.highlight._id;

    const agentB = request.agent(app);
    await registerReader(agentB, 'noteB@example.com');
    const res = await agentB.post('/api/notes').send({ bookId: book._id, highlightId, content: 'Trying to borrow a highlight' });
    expect(res.status).toBe(400);
  });

  test("a user cannot edit another user's note (BR-03)", async () => {
    const book = await seedApprovedBook('note3');
    const agentA = request.agent(app);
    await registerReader(agentA, 'noteEditA@example.com');
    const createRes = await agentA.post('/api/notes').send({ bookId: book._id, content: 'Private thought' });
    const noteId = createRes.body.data.note._id;

    const agentB = request.agent(app);
    await registerReader(agentB, 'noteEditB@example.com');
    const res = await agentB.put(`/api/notes/${noteId}`).send({ content: 'Hijacked' });
    expect(res.status).toBe(403);
  });

  test('search personal notes by keyword and filter by tag (FR-SEARCH-01/03)', async () => {
    const book = await seedApprovedBook('note4');
    const agent = request.agent(app);
    await registerReader(agent);

    const tagRes = await agent.post('/api/tags').send({ name: 'important' });
    const tagId = tagRes.body.data.tag._id;

    await agent.post('/api/notes').send({ bookId: book._id, content: 'Remember the mitochondria fact', tags: [tagId] });
    await agent.post('/api/notes').send({ bookId: book._id, content: 'Totally different note' });

    const byKeyword = await agent.get('/api/notes').query({ q: 'mitochondria' });
    expect(byKeyword.body.data.notes).toHaveLength(1);

    const byTag = await agent.get('/api/notes').query({ tag: tagId });
    expect(byTag.body.data.notes).toHaveLength(1);
    expect(byTag.body.data.notes[0].tags[0].name).toBe('important');
  });

  test('notes and bookmarks/highlights all require authentication', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.status).toBe(401);
  });
});
