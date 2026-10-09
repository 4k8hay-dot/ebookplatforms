require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

async function registerUser(agent, email = `reset${Date.now()}@example.com`) {
  await agent.post('/api/auth/register').send({ name: 'Reset Me', email, password: 'OldPassword123' });
  return email;
}

describe('Forgot/reset password (added on request, outside the original SRS)', () => {
  test('forgot-password gives a dev reset link and reset-password actually changes the password', async () => {
    const agent = request.agent(app);
    const email = await registerUser(agent);

    const forgotRes = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.devResetUrl).toBeDefined();

    const token = new URL(forgotRes.body.devResetUrl).searchParams.get('token');
    expect(token).toBeTruthy();

    const resetRes = await request(app).post('/api/auth/reset-password').send({ token, password: 'NewPassword123' });
    expect(resetRes.status).toBe(200);

    const oldLogin = await request(app).post('/api/auth/login').send({ email, password: 'OldPassword123' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post('/api/auth/login').send({ email, password: 'NewPassword123' });
    expect(newLogin.status).toBe(200);
  });

  test('gives the same generic response for a non-existent email (no user enumeration)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'doesnotexist@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account with that email exists/i);
    expect(res.body.devResetUrl).toBeUndefined();
  });

  test('a used token cannot be reused', async () => {
    const agent = request.agent(app);
    const email = await registerUser(agent, `reuse${Date.now()}@example.com`);

    const forgotRes = await request(app).post('/api/auth/forgot-password').send({ email });
    const token = new URL(forgotRes.body.devResetUrl).searchParams.get('token');

    const firstReset = await request(app).post('/api/auth/reset-password').send({ token, password: 'FirstReset123' });
    expect(firstReset.status).toBe(200);

    const secondReset = await request(app).post('/api/auth/reset-password').send({ token, password: 'SecondReset123' });
    expect(secondReset.status).toBe(400);
  });

  test('an expired token is rejected', async () => {
    const agent = request.agent(app);
    const email = await registerUser(agent, `expired${Date.now()}@example.com`);

    const forgotRes = await request(app).post('/api/auth/forgot-password').send({ email });
    const token = new URL(forgotRes.body.devResetUrl).searchParams.get('token');

    // Simulate time passing by forcing the stored expiry into the past.
    await User.updateOne({ email }, { resetPasswordExpires: new Date(Date.now() - 1000) });

    const resetRes = await request(app).post('/api/auth/reset-password').send({ token, password: 'TooLate123' });
    expect(resetRes.status).toBe(400);
  });

  test('a garbage token is rejected', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'not-a-real-token', password: 'Whatever123' });
    expect(res.status).toBe(400);
  });

  test('a weak new password is rejected by validation', async () => {
    const agent = request.agent(app);
    const email = await registerUser(agent, `weak${Date.now()}@example.com`);
    const forgotRes = await request(app).post('/api/auth/forgot-password').send({ email });
    const token = new URL(forgotRes.body.devResetUrl).searchParams.get('token');

    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'short' });
    expect(res.status).toBe(400);
  });
});
