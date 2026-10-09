require('./setup');
const request = require('supertest');
const app = require('../src/app');

describe('Auth', () => {
  const user = {
    name: 'Test Reader',
    email: 'reader@example.com',
    password: 'password123',
  };

  test('registers a new user and returns a session cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('rejects duplicate email registration (FR-AUTH-02)', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(409);
  });

  test('rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...user, email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  test('logs in with valid credentials and rejects invalid ones (FR-AUTH-04)', async () => {
    await request(app).post('/api/auth/register').send(user);

    const good = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(good.status).toBe(200);

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrongpassword' });
    expect(bad.status).toBe(401);
  });

  test('blocks protected routes without authentication (FR-AUTH-07)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('allows access to /me with a valid session cookie, and logout clears it', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(user);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(user.email);

    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(200);

    const meAfterLogout = await agent.get('/api/auth/me');
    expect(meAfterLogout.status).toBe(401);
  });
});
