const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn, cookieName, nodeEnv } = require('../config/env');

function signToken(userId) {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: jwtExpiresIn });
}

/**
 * Sends the JWT as an httpOnly cookie rather than in the JSON body.
 * This keeps the token out of reach of client-side JavaScript (mitigates
 * XSS-based token theft, per NFR-Security) while still satisfying
 * FR-AUTH-05 ("secure token-based authentication such as JWT").
 */
function sendTokenCookie(res, userId) {
  const token = signToken(userId);
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days, matches default JWT_EXPIRES_IN

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: maxAgeMs,
  });

  return token;
}

function clearTokenCookie(res) {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'lax',
  });
}

module.exports = { signToken, sendTokenCookie, clearTokenCookie };
