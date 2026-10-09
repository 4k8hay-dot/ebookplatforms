require('./setup');
const request = require('supertest');
const app = require('../src/app');

describe('Profile', () => {
  const user = {
    name: 'Test Reader',
    email: 'reader2@example.com',
    password: 'password123',
  };

  test('a user can view and update their own profile (FR-PROFILE-01/02)', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(user);

    const view = await agent.get('/api/users/me');
    expect(view.status).toBe(200);
    expect(view.body.data.user.name).toBe(user.name);

    const update = await agent.put('/api/users/me').send({ name: 'Updated Name' });
    expect(update.status).toBe(200);
    expect(update.body.data.user.name).toBe('Updated Name');
  });

  test('profile routes require authentication (FR-PROFILE-04 - no access without identity)', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});
