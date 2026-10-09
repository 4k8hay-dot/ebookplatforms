/**
 * Added on request, outside the original SRS scope, to support
 * "forgot password". This project has no email service configured by
 * default, so this module degrades gracefully:
 *
 *   - If SMTP_HOST/SMTP_USER/SMTP_PASS are all set in .env, it sends a
 *     real email via nodemailer.
 *   - If they are NOT set (the default, out of the box), it just logs
 *     the email's contents to the server console instead of sending
 *     anything, and the caller (authController.forgotPassword) also
 *     returns the reset link directly in the API response — but ONLY
 *     when NODE_ENV !== 'production', so this convenience can never
 *     leak a working reset link to a real deployed user.
 */
const nodemailer = require('nodemailer');
const { smtp, nodeEnv } = require('../config/env');

const isSmtpConfigured = Boolean(smtp.host && smtp.user && smtp.pass);

let transporter = null;
if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  if (!isSmtpConfigured) {
    // eslint-disable-next-line no-console
    console.log(
      `\n[email not configured — dev fallback]\nPassword reset requested for ${toEmail}\nReset link: ${resetUrl}\n`
    );
    return { sent: false, devFallback: true };
  }

  await transporter.sendMail({
    from: smtp.from,
    to: toEmail,
    subject: 'Reset your Smart eBook Platform password',
    text: `We received a request to reset your password. This link expires in 1 hour:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `<p>We received a request to reset your password. This link expires in 1 hour:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
  });

  return { sent: true, devFallback: false };
}

module.exports = { sendPasswordResetEmail, isSmtpConfigured, nodeEnv };
