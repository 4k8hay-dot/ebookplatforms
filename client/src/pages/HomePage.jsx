import { useEffect, useMemo, useState } from 'react';
import { Container, Typography, Box, Pagination, Stack, CircularProgress, Alert } from '@mui/material';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import BookGrid from '../components/BookGrid';
import ContinueReadingSection from '../components/ContinueReadingSection';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { getBooksRequest } from '../api/bookApi';
import { getCategoriesRequest } from '../api/categoryApi';

const EMPTY_FILTERS = { category: '', format: '', language: '', fromYear: '', toYear: '', sort: 'newest' };

export default function HomePage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategoriesRequest()
      .then((res) => setCategories(res.data.data.categories))
      .catch(() => setCategories([]));
  }, []);

  // Reset to page 1 whenever the search term or filters change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  const queryParams = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      category: filters.category || undefined,
      format: filters.format || undefined,
      language: filters.language || undefined,
      fromYear: filters.fromYear || undefined,
      toYear: filters.toYear || undefined,
      sort: filters.sort,
      page,
    }),
    [debouncedSearch, filters, page]
  );

  useEffect(() => {
    setIsLoading(true);
    setError('');
    getBooksRequest(queryParams)
      .then((res) => {
        setBooks(res.data.data.books);
        setMeta(res.data.data.meta);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load books.'))
      .finally(() => setIsLoading(false));
  }, [queryParams]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h3" gutterBottom>
        Discover your next book
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Browse the catalog, search by keyword, or narrow things down with filters.
      </Typography>

      <ContinueReadingSection />

      <Stack spacing={2} mb={3}>
        <SearchBar value={search} onChange={setSearch} />
        <FilterPanel categories={categories} filters={filters} onChange={setFilters} />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <BookGrid books={books} />
          {meta.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination count={meta.totalPages} page={page} onChange={(_e, value) => setPage(value)} color="secondary" />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
