// Mocked BEFORE anything requires the real modules — Jest hoists jest.mock
// calls above imports. mockVerifyIdToken is allowed to be referenced inside
// the factory because it's prefixed with "mock" (Jest's hoisting allowlist).
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken: mockVerifyIdToken })),
}));
jest.mock('../src/config/env', () => ({
  ...jest.requireActual('../src/config/env'),
  googleClientId: 'test-google-client-id',
}));

require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

function mockGooglePayload(overrides = {}) {
  return {
    sub: 'google-sub-123',
    email: 'googleuser@example.com',
    email_verified: true,
    name: 'Google User',
    ...overrides,
  };
}

describe('Google Sign-In (added on request, outside the original SRS)', () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset();
  });

  test('creates a new reader account on first Google sign-in', async () => {
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => mockGooglePayload() });

    const res = await request(app).post('/api/auth/google').send({ idToken: 'fake-token' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('googleuser@example.com');
    expect(res.body.data.user.role).toBe('reader');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('signing in again with the same Google account does not create a duplicate', async () => {
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => mockGooglePayload() });

    await request(app).post('/api/auth/google').send({ idToken: 'fake-token' });
    await request(app).post('/api/auth/google').send({ idToken: 'fake-token' });

    const count = await User.countDocuments({ email: 'googleuser@example.com' });
    expect(count).toBe(1);
  });

  test('links Google sign-in to an existing email/password account with the same email', async () => {
    const existing = new User({ name: 'Existing', email: 'linked@example.com' });
    existing.password = 'password123';
    await existing.save();

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => mockGooglePayload({ email: 'linked@example.com', sub: 'google-sub-456' }),
    });

    const res = await request(app).post('/api/auth/google').send({ idToken: 'fake-token' });
    expect(res.status).toBe(200);

    const count = await User.countDocuments({ email: 'linked@example.com' });
    expect(count).toBe(1);

    const updated = await User.findOne({ email: 'linked@example.com' });
    expect(updated.googleId).toBe('google-sub-456');
  });

  test('rejects an unverified Google email', async () => {
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => mockGooglePayload({ email_verified: false }) });
    const res = await request(app).post('/api/auth/google').send({ idToken: 'fake-token' });
    expect(res.status).toBe(401);
  });

  test('rejects an invalid/unverifiable token', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('invalid token'));
    const res = await request(app).post('/api/auth/google').send({ idToken: 'garbage' });
    expect(res.status).toBe(401);
  });

  test('a restricted account cannot sign in via Google either', async () => {
    const restricted = new User({
      name: 'Restricted',
      email: 'restrictedgoogle@example.com',
      status: 'restricted',
      googleId: 'google-sub-789',
    });
    await restricted.save();

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => mockGooglePayload({ email: 'restrictedgoogle@example.com', sub: 'google-sub-789' }),
    });

    const res = await request(app).post('/api/auth/google').send({ idToken: 'fake-token' });
    expect(res.status).toBe(403);
  });

  test('a Google-only account gets a clear error (not a crash) from the regular login endpoint', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => mockGooglePayload({ email: 'googleonly@example.com', sub: 'google-sub-999' }),
    });
    await request(app).post('/api/auth/google').send({ idToken: 'fake-token' });

    const res = await request(app).post('/api/auth/login').send({ email: 'googleonly@example.com', password: 'whatever123' });
    expect(res.status).toBe(400);
  });
});
