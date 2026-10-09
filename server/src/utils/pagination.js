const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

/**
 * Parses page/limit query params defensively (never trusts client input
 * blindly) and returns both the Mongo skip/limit values and a response
 * meta block the frontend can use to render pagination controls.
 */
function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildMeta({ page, limit, totalItems }) {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.max(Math.ceil(totalItems / limit), 1),
  };
}

module.exports = { parsePagination, buildMeta };
