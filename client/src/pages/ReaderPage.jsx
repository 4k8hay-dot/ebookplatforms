import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Grid, Box, Typography, CircularProgress, Alert, Link, Paper, Tabs, Tab } from '@mui/material';
import { getBookByIdRequest } from '../api/bookApi';
import { getBookFileRequest } from '../api/fileApi';
import { getProgressRequest, saveProgressRequest } from '../api/progressApi';
import { recordAccessRequest } from '../api/historyApi';
import { getHighlightsForBookRequest, createHighlightRequest } from '../api/highlightApi';
import PdfViewer from '../components/PdfViewer';
import EpubViewer from '../components/EpubViewer';
import BookmarksPanel from '../components/BookmarksPanel';
import HighlightsPanel from '../components/HighlightsPanel';
import NotesPanel from '../components/NotesPanel';
import SelectionToolbar from '../components/SelectionToolbar';

export default function ReaderPage() {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [selection, setSelection] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [highlightsRefreshSignal, setHighlightsRefreshSignal] = useState(0);
  const [activeTab, setActiveTab] = useState('bookmarks');

  const saveTimeoutRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError('');

    Promise.all([getBookByIdRequest(bookId), getBookFileRequest(bookId), getProgressRequest(bookId)])
      .then(([bookRes, fileRes, progressRes]) => {
        if (!isMounted) return;
        setBook(bookRes.data.data.book);
        setFileData(fileRes.data); // ArrayBuffer
        setProgress(progressRes.data.data.progress);
        setCurrentPosition(progressRes.data.data.progress?.position || null);
        recordAccessRequest(bookId).catch(() => {});
      })
      .catch((err) => {
        if (isMounted) setError(err.response?.data?.message || 'Unable to open this book right now.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  // Kept separately from HighlightsPanel's own list so NotesPanel can
  // offer "link to a highlight" without both components fetching in
  // lockstep — refreshed whenever a highlight is added.
  useEffect(() => {
    getHighlightsForBookRequest(bookId)
      .then((res) => setHighlights(res.data.data.highlights))
      .catch(() => {});
  }, [bookId, highlightsRefreshSignal]);

  const handlePositionChange = useMemo(
    () => (payload) => {
      setCurrentPosition(payload.position);
      setSelection(null); // navigating away clears any pending selection
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveProgressRequest(bookId, payload).catch(() => {});
      }, 800);
    },
    [bookId]
  );

  const handleSelectBookmark = (position) => viewerRef.current?.goToPosition(position);
  const handleSelectHighlight = (position) => viewerRef.current?.goToPosition(position);

  const handleSaveHighlight = async (color) => {
    if (!selection) return;
    try {
      await createHighlightRequest(bookId, { text: selection.text, location: selection.location, color });
      setSelection(null);
      setHighlightsRefreshSignal((n) => n + 1);
      setActiveTab('highlights');
    } catch {
      /* the selection toolbar simply stays open so the user can retry */
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Alert severity="error">{error}</Alert>
        <Link component={RouterLink} to="/" sx={{ mt: 2, display: 'inline-block' }}>
          ← Back to catalog
        </Link>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Link component={RouterLink} to={`/books/${bookId}`} underline="hover">
        ← Back to book details
      </Link>
      <Typography variant="h5" mt={1} mb={2}>
        {book.title}
      </Typography>

      <SelectionToolbar selection={selection} onSave={handleSaveHighlight} onDismiss={() => setSelection(null)} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          {book.format === 'pdf' ? (
            <PdfViewer
              ref={viewerRef}
              fileData={fileData}
              initialPage={progress?.currentPage || (progress?.position ? Number(progress.position) : 1)}
              onPositionChange={handlePositionChange}
              onTextSelected={setSelection}
            />
          ) : (
            <EpubViewer
              ref={viewerRef}
              fileData={fileData}
              initialPosition={progress?.position}
              onPositionChange={handlePositionChange}
              onTextSelected={setSelection}
            />
          )}
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ p: 2, position: { md: 'sticky' }, top: { md: 16 } }}>
            <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
              <Tab value="bookmarks" label="Bookmarks" />
              <Tab value="highlights" label="Highlights" />
              <Tab value="notes" label="Notes" />
            </Tabs>

            {activeTab === 'bookmarks' && (
              <BookmarksPanel bookId={bookId} currentPosition={currentPosition} onSelectBookmark={handleSelectBookmark} />
            )}
            {activeTab === 'highlights' && (
              <HighlightsPanel bookId={bookId} onSelectHighlight={handleSelectHighlight} refreshSignal={highlightsRefreshSignal} />
            )}
            {activeTab === 'notes' && <NotesPanel bookId={bookId} highlights={highlights} currentPosition={currentPosition} />}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
