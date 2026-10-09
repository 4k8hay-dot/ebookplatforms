/**
 * Run with: npm run seed:admin
 * Creates (or updates) a single administrator account from env vars.
 * This exists because, by design, 'admin' is not a role the public
 * /api/auth/register endpoint will accept (see User model comments).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function run() {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.SEED_ADMIN_NAME || 'Platform Admin';

  let admin = await User.findOne({ email });
  if (admin) {
    console.log(`Admin already exists: ${email}`);
  } else {
    admin = new User({ name, email, role: 'admin' });
    admin.password = password;
    await admin.save();
    console.log(`Admin created: ${email} / ${password} (change this password after first login)`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
