// Loads and validates required environment variables in one place so that
// a missing/misconfigured .env fails fast at startup instead of causing
// confusing errors deep inside the request lifecycle.
require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    // eslint-disable-next-line no-console
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: process.env.COOKIE_NAME || 'token',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'no-reply@smart-ebook-platform.local',
  },
  maxAvatarSizeMb: Number(process.env.MAX_AVATAR_SIZE_MB || 2),
  maxCoverSizeMb: Number(process.env.MAX_COVER_SIZE_MB || 3),
  maxEbookSizeMb: Number(process.env.MAX_EBOOK_SIZE_MB || 50),
};
