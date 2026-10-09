const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';

/**
 * Every file the backend serves publicly (avatars, book covers) is saved
 * via storageService.saveFile() and stored as a relative path like
 * "/uploads/covers/xyz.jpg" — that path only resolves correctly against
 * the API server's own origin, not wherever the frontend happens to be
 * served from, so it needs the API origin prefixed to actually load.
 *
 * The one exception is Google Sign-In's profile picture, which is
 * already a full "https://..." URL — prefixing that would break it, so
 * anything already absolute is returned as-is.
 */
export function resolveFileUrl(path) {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_ORIGIN}${path}`;
}
