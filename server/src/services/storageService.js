/**
 * Storage abstraction (FR-FILE-01: files must not be stored directly as
 * binary blobs in MongoDB; only references/URLs are stored there).
 *
 * Phase 1 used this only for profile avatars (public files, served
 * directly via express.static). Phase 3 extends it with a second,
 * *private* variant for eBook files: those must never be reachable by
 * guessing a URL (FR-FILE-05), so they live outside the static /uploads
 * folder and are only readable through the authenticated
 * GET /api/books/:id/file controller, which resolves the stored relative
 * path back to a real filesystem path itself.
 *
 * Both variants share the same on-disk-for-now implementation. Swapping
 * either to real cloud/object storage later means changing only this
 * file — no controller code depends on where bytes physically live.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PUBLIC_ROOT = path.join(__dirname, '..', '..', 'uploads');
const PRIVATE_ROOT = path.join(__dirname, '..', '..', 'private-uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Saves a buffer under uploads/<subFolder>/ and returns a public URL
 * (served by express.static in app.js). Used for avatars and book covers
 * — nothing sensitive, fine to be directly linkable.
 */
function saveFile({ buffer, originalName, subFolder }) {
  const dir = path.join(PUBLIC_ROOT, subFolder);
  ensureDir(dir);

  const ext = path.extname(originalName).toLowerCase();
  const filename = `${crypto.randomUUID()}${ext}`;
  const fullPath = path.join(dir, filename);

  fs.writeFileSync(fullPath, buffer);

  return `/uploads/${subFolder}/${filename}`;
}

function deleteFile(publicUrl) {
  if (!publicUrl) return;
  const relative = publicUrl.replace(/^\/uploads\//, '');
  const fullPath = path.join(PUBLIC_ROOT, relative);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

/**
 * Saves a buffer under private-uploads/<subFolder>/, OUTSIDE anything
 * express.static serves. Returns only a relative reference (e.g.
 * "ebooks/<uuid>.pdf"), never a fetchable URL — the DB stores this
 * reference, and only saveFile's counterpart, getPrivateFilePath, may
 * turn it back into bytes, from inside an authenticated controller.
 */
function savePrivateFile({ buffer, originalName, subFolder }) {
  const dir = path.join(PRIVATE_ROOT, subFolder);
  ensureDir(dir);

  const ext = path.extname(originalName).toLowerCase();
  const filename = `${crypto.randomUUID()}${ext}`;
  fs.writeFileSync(path.join(dir, filename), buffer);

  return `${subFolder}/${filename}`;
}

function getPrivateFilePath(relativeRef) {
  if (!relativeRef) return null;
  return path.join(PRIVATE_ROOT, relativeRef);
}

function deletePrivateFile(relativeRef) {
  if (!relativeRef) return;
  const fullPath = getPrivateFilePath(relativeRef);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

module.exports = {
  saveFile,
  deleteFile,
  savePrivateFile,
  getPrivateFilePath,
  deletePrivateFile,
};
