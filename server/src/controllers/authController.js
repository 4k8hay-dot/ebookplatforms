const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendTokenCookie, clearTokenCookie } = require('../utils/token');
const { googleClientId, clientUrl, nodeEnv } = require('../config/env');
const { sendPasswordResetEmail } = require('../services/emailService');

const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

/**
 * POST /api/auth/register
 * FR-AUTH-01 register with required info
 * FR-AUTH-02 validate email format + uniqueness
 * FR-AUTH-03 hash password before storage (handled in the User model)
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = new User({ name, email, role: role || 'reader' });
  user.password = password; // virtual -> hashed by pre-save hook
  await user.save();

  sendTokenCookie(res, user._id);

  res.status(201).json({ success: true, data: { user } });
});

/**
 * POST /api/auth/login
 * FR-AUTH-04 authenticate with valid credentials
 * FR-AUTH-05 token-based authentication
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status !== 'active') {
    throw new AppError('This account is not active. Contact an administrator.', 403);
  }

  if (!user.passwordHash) {
    throw new AppError('This account signs in with Google. Please use "Continue with Google" instead.', 400);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  sendTokenCookie(res, user._id);
  user.passwordHash = undefined;

  res.status(200).json({ success: true, data: { user } });
});

/**
 * POST /api/auth/google
 * Added on request — not part of the original SRS (FR-AUTH-01..07 cover
 * email/password only). Kept alongside the existing flow rather than
 * replacing it, since FR-AUTH-01..07 are still graded requirements.
 *
 * Flow: the frontend uses Google Identity Services to obtain a signed
 * ID token directly from Google (no server-side redirect/secret needed),
 * then sends just that token here. We verify it against Google's own
 * public keys — this proves the token is genuine and tells us the
 * verified email, without us ever handling a Google password.
 *
 *   - If a user with this googleId already exists, log them in.
 *   - Else if a user with this (verified) email already exists via
 *     email/password, link the Google account to it (same person,
 *     avoids a duplicate account) and log them in.
 *   - Else create a brand-new 'reader' account (see User model comment
 *     on why 'reader' — same rule as public email/password registration).
 */
const googleLogin = asyncHandler(async (req, res) => {
  if (!googleClient) {
    throw new AppError('Google Sign-In is not configured on this server.', 500);
  }

  const { idToken } = req.body;

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: googleClientId });
    payload = ticket.getPayload();
  } catch (err) {
    throw new AppError('Invalid Google sign-in token', 401);
  }

  if (!payload.email_verified) {
    throw new AppError('Your Google email is not verified', 401);
  }

  let user = await User.findOne({ googleId: payload.sub });

  if (!user) {
    user = await User.findOne({ email: payload.email });
    if (user) {
      user.googleId = payload.sub; // link the existing email/password account
    } else {
      user = new User({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        googleId: payload.sub,
        role: 'reader',
      });
    }
    await user.save();
  }

  if (user.status !== 'active') {
    throw new AppError('This account is not active. Contact an administrator.', 403);
  }

  sendTokenCookie(res, user._id);

  res.status(200).json({ success: true, data: { user } });
});

/**
 * POST /api/auth/forgot-password
 * Added on request, outside the original SRS scope.
 *
 * Always responds with the same generic message whether or not the email
 * is actually registered — this prevents someone from using this endpoint
 * to check which emails have accounts (a common real-world attack vector
 * for "forgot password" endpoints). A Google-only account (no password to
 * reset) also gets the generic message rather than a different one, for
 * the same reason.
 *
 * The raw reset token is only ever sent to the user (via email, or via
 * the dev-mode fallback below) — the database only ever stores a SHA-256
 * hash of it, so a database leak alone could never be used to reset
 * anyone's password.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const genericResponse = {
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  };

  const user = await User.findOne({ email });
  if (!user || user.status !== 'active' || !user.passwordHash) {
    return res.status(200).json(genericResponse);
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;
  const { devFallback } = await sendPasswordResetEmail(user.email, resetUrl);

  // Dev-only convenience: with no real email service configured, there is
  // no other way to actually get the link. NEVER included in production.
  if (devFallback && nodeEnv !== 'production') {
    return res.status(200).json({ ...genericResponse, devResetUrl: resetUrl });
  }

  res.status(200).json(genericResponse);
});

/**
 * POST /api/auth/reset-password
 * Added on request, outside the original SRS scope. Verifies the raw
 * token against the stored hash and its expiry, then sets a new password
 * through the same virtual-setter path used everywhere else (so it's
 * hashed the normal way — see the User model's pre('validate') hook).
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordTokenHash +resetPasswordExpires');

  if (!user) {
    throw new AppError('This reset link is invalid or has expired. Please request a new one.', 400);
  }

  user.password = password; // virtual -> hashed by pre-validate hook
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (also used by the frontend to
 * restore session state on page reload).
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});

/**
 * POST /api/auth/logout
 * FR-AUTH-06 allow authenticated users to log out
 */
const logout = asyncHandler(async (_req, res) => {
  clearTokenCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

module.exports = { register, login, googleLogin, forgotPassword, resetPassword, getMe, logout };
