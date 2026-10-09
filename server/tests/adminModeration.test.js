require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Book = require('../src/models/Book');

async function makeAdmin(email = `admin${Date.now()}@example.com`) {
  const admin = new User({ name: 'Admin', email, role: 'admin' });
  admin.password = 'password123';
  await admin.save();
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password: 'password123' });
  return agent;
}

async function registerReader(agent, email = `reader${Date.now()}@example.com`) {
  await agent.post('/api/auth/register').send({ name: 'Reader', email, password: 'password123' });
}

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

describe('Admin user management (FR-ADMIN-02/03)', () => {
  test('admin can list users and restrict one', async () => {
    const adminAgent = await makeAdmin();
    const readerAgent = request.agent(app);
    await registerReader(readerAgent, 'toRestrict@example.com');

    const listRes = await adminAgent.get('/api/admin/users');
    expect(listRes.status).toBe(200);
    const target = listRes.body.data.users.find((u) => u.email === 'torestrict@example.com');
    expect(target).toBeDefined();

    const updateRes = await adminAgent.put(`/api/admin/users/${target._id}/status`).send({ status: 'restricted' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.user.status).toBe('restricted');

    // A restricted user can no longer authenticate.
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'torestrict@example.com', password: 'password123' });
    expect(loginRes.status).toBe(403);
  });

  test('an admin cannot change their own status', async () => {
    const adminAgent = await makeAdmin('selflock@example.com');
    const me = await adminAgent.get('/api/auth/me');
    const res = await adminAgent.put(`/api/admin/users/${me.body.data.user._id}/status`).send({ status: 'removed' });
    expect(res.status).toBe(400);
  });

  test('a non-admin cannot access user management', async () => {
    const agent = request.agent(app);
    await registerReader(agent);
    const res = await agent.get('/api/admin/users');
    expect(res.status).toBe(403);
  });
});

describe('Admin category management (FR-ADMIN-04)', () => {
  test('admin can create, update, and delete an unused category', async () => {
    const adminAgent = await makeAdmin();

    const createRes = await adminAgent.post('/api/categories').send({ name: 'Poetry' });
    expect(createRes.status).toBe(201);
    const categoryId = createRes.body.data.category._id;

    const updateRes = await adminAgent.put(`/api/categories/${categoryId}`).send({ description: 'Verse and rhyme' });
    expect(updateRes.status).toBe(200);

    const deleteRes = await adminAgent.delete(`/api/categories/${categoryId}`);
    expect(deleteRes.status).toBe(200);
  });

  test('cannot delete a category still used by a book', async () => {
    const book = await seedApprovedBook('catdel');
    const adminAgent = await makeAdmin();
    const res = await adminAgent.delete(`/api/categories/${book.category}`);
    expect(res.status).toBe(409);
  });

  test('a non-admin cannot create categories', async () => {
    const agent = request.agent(app);
    await registerReader(agent);
    const res = await agent.post('/api/categories').send({ name: 'Should Fail' });
    expect(res.status).toBe(403);
  });
});

describe('Admin dashboard statistics (FR-ADMIN-08)', () => {
  test('returns aggregate counts', async () => {
    await seedApprovedBook('stats');
    const adminAgent = await makeAdmin();
    const res = await adminAgent.get('/api/admin/stats');
    expect(res.status).toBe(200);
    expect(res.body.data.totalUsers).toBeGreaterThan(0);
    expect(res.body.data.totalBooks).toBeGreaterThan(0);
    expect(res.body.data.booksByStatus.approved).toBeGreaterThan(0);
  });
});

describe('Reporting & Moderation (FR-REPORT, FR-ADMIN-07)', () => {
  test('a user can report a book, and an admin can resolve it by removing the book', async () => {
    const book = await seedApprovedBook('report1');
    const reporterAgent = request.agent(app);
    await registerReader(reporterAgent, 'reporter1@example.com');

    const createRes = await reporterAgent
      .post('/api/reports')
      .send({ targetType: 'book', targetId: book._id, reason: 'Contains plagiarized content' });
    expect(createRes.status).toBe(201);
    const reportId = createRes.body.data.report._id;

    const adminAgent = await makeAdmin();
    const listRes = await adminAgent.get('/api/admin/reports').query({ status: 'open' });
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.reports.some((r) => r._id === reportId)).toBe(true);

    const resolveRes = await adminAgent.put(`/api/admin/reports/${reportId}/resolve`).send({ removeContent: true });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.report.status).toBe('resolved');

    // The book should now be gone from the public catalog.
    const publicView = await request(app).get(`/api/books/${book._id}`);
    expect(publicView.status).toBe(404);
  });

  test('resolving a report without removeContent leaves the content intact', async () => {
    const book = await seedApprovedBook('report2');
    const reporterAgent = request.agent(app);
    await registerReader(reporterAgent, 'reporter2@example.com');
    const createRes = await reporterAgent.post('/api/reports').send({ targetType: 'book', targetId: book._id, reason: 'Minor issue' });

    const adminAgent = await makeAdmin();
    await adminAgent.put(`/api/admin/reports/${createRes.body.data.report._id}/resolve`).send({});

    const publicView = await request(app).get(`/api/books/${book._id}`);
    expect(publicView.status).toBe(200);
  });

  test('a non-admin cannot list or resolve reports', async () => {
    const agent = request.agent(app);
    await registerReader(agent);
    const listRes = await agent.get('/api/admin/reports');
    expect(listRes.status).toBe(403);
  });

  test('reporting requires authentication', async () => {
    const book = await seedApprovedBook('report3');
    const res = await request(app).post('/api/reports').send({ targetType: 'book', targetId: book._id, reason: 'x' });
    expect(res.status).toBe(401);
  });
});

describe('Notifications (FR-NOTIFY)', () => {
  test('approving a book notifies its author, who can view and mark it read', async () => {
    const category = await Category.create({ name: `NotifyCat${Date.now()}` });
    const authorEmail = `notifyauthor${Date.now()}@example.com`;
    const authorAgent = request.agent(app);
    await authorAgent.post('/api/auth/register').send({ name: 'Author', email: authorEmail, password: 'password123', role: 'author' });

    const createRes = await authorAgent
      .post('/api/books')
      .field('title', 'Notify Me')
      .field('category', category._id.toString())
      .field('format', 'pdf')
      .attach('ebookFile', Buffer.from('%PDF-1.4 fake'), { filename: 'book.pdf', contentType: 'application/pdf' });
    const bookId = createRes.body.data.book._id;

    const adminAgent = await makeAdmin();
    await adminAgent.put(`/api/admin/books/${bookId}/approve`);

    const notifRes = await authorAgent.get('/api/notifications');
    expect(notifRes.status).toBe(200);
    expect(notifRes.body.data.notifications.length).toBeGreaterThan(0);
    expect(notifRes.body.data.unreadCount).toBeGreaterThan(0);

    const notifId = notifRes.body.data.notifications[0]._id;
    const readRes = await authorAgent.put(`/api/notifications/${notifId}/read`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.data.notification.isRead).toBe(true);
  });

  test("a user cannot mark another user's notification as read", async () => {
    const category = await Category.create({ name: `NotifyCat2${Date.now()}` });
    const authorAgent = request.agent(app);
    await authorAgent
      .post('/api/auth/register')
      .send({ name: 'Author', email: `notifyauthor2${Date.now()}@example.com`, password: 'password123', role: 'author' });

    const createRes = await authorAgent
      .post('/api/books')
      .field('title', 'Notify Me 2')
      .field('category', category._id.toString())
      .field('format', 'pdf')
      .attach('ebookFile', Buffer.from('%PDF-1.4 fake'), { filename: 'book.pdf', contentType: 'application/pdf' });
    const bookId = createRes.body.data.book._id;

    const adminAgent = await makeAdmin();
    await adminAgent.put(`/api/admin/books/${bookId}/approve`);

    const notifRes = await authorAgent.get('/api/notifications');
    const notifId = notifRes.body.data.notifications[0]._id;

    const strangerAgent = request.agent(app);
    await registerReader(strangerAgent, 'strangernotif@example.com');
    const res = await strangerAgent.put(`/api/notifications/${notifId}/read`);
    expect(res.status).toBe(403);
  });

  test('notifications require authentication', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});
