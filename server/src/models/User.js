const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Data fields follow SRS §10.1, extended with:
 *  - status: required to actually implement FR-ADMIN-03 (activate/restrict/
 *    remove accounts). Not listed in §10.1 but necessary to satisfy §7.18.
 *  - authorBio: optional, only meaningful when role === 'author'.
 *  - googleId: added on request, outside the original SRS scope, to
 *    support "Sign in with Google" as an alternative to email/password.
 *    A user account can have a password, a googleId, or both (if an
 *    existing email/password account later signs in with a matching
 *    Google email, the accounts are linked rather than duplicated).
 *
 * Role note (Assumption #6 from the analysis doc): public registration only
 * allows 'reader' or 'author'. 'admin' is never assignable through the
 * public API and must be seeded/promoted directly in the database, per
 * BR-05 (admins have higher privileges than regular users) and general
 * least-privilege practice. Google sign-in follows the same rule: a
 * brand-new Google sign-in always creates a 'reader' account.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      // Only required for accounts that don't sign in via Google — a
      // Google-only account never has a password to hash.
      required: function passwordRequired() {
        return !this.googleId;
      },
      select: false, // never returned by default queries
    },
    googleId: {
      type: String,
      // default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['reader', 'author', 'admin'],
      default: 'reader',
    },
    authorBio: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'restricted', 'removed'],
      default: 'active',
    },
    // Added on request, outside the original SRS scope, for "forgot
    // password". We store a HASH of the reset token, never the raw
    // token itself — if the database were ever exposed, the stored
    // value alone could not be used to reset anyone's password.
    resetPasswordTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true } // gives us createdAt/updatedAt automatically
);

// sparse: true means the unique constraint only applies to documents that
// actually HAVE a googleId — otherwise every email/password-only account
// (googleId: null) would collide on the same "null" value.
userSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } }
);
// Hash the password whenever it is newly set/changed (FR-AUTH-03, BR-02).
// We hash a virtual "password" field on the way in rather than exposing
// passwordHash directly to controllers, so controllers never handle raw
// hashes.
//
// IMPORTANT: this must be a pre('validate') hook, not pre('save'). Mongoose
// runs a document's schema validation (the `required: true` checks) BEFORE
// any pre('save') hooks fire, but AFTER pre('validate') hooks. Hashing in
// pre('save') meant passwordHash still didn't exist when the `required`
// check ran, so validation ("Path `passwordHash` is required.") always
// failed before this code ever got a chance to run.
userSchema.virtual('password').set(function setPassword(plain) {
  this._plainPassword = plain;
});

userSchema.pre('validate', async function hashPassword(next) {
  if (!this._plainPassword) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
  this._plainPassword = undefined;
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.passwordHash);
};

// Strip sensitive/internal fields whenever a user document is serialized.
userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
