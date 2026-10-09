import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import ePub from 'epubjs';
import { Box, IconButton, Typography, Stack, ToggleButton, ToggleButtonGroup, CircularProgress } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TextDecreaseIcon from '@mui/icons-material/TextDecrease';
import TextIncreaseIcon from '@mui/icons-material/TextIncrease';

const FONT_STEPS = [80, 90, 100, 110, 120, 140, 160];

/**
 * fileData: ArrayBuffer of the EPUB (already fetched with authentication
 * by ReaderPage). initialPosition is an epub.js CFI string to resume at.
 *
 * Percentage (FR-PROGRESS-02) for reflowable EPUB content has no fixed
 * page count, so epub.js is asked to build a "locations" index for the
 * whole book once it's loaded; percentageFromCfi() then turns any CFI
 * into a 0-100 number, which is sent to the backend alongside the CFI
 * itself (the backend accepts a client-computed percentage for exactly
 * this reason — see progressController.js).
 *
 * A ref exposing goToPosition(cfi) lets ReaderPage jump here when the
 * user clicks a saved bookmark (FR-BOOKMARK-04).
 */
const EpubViewer = forwardRef(function EpubViewer({ fileData, initialPosition, onPositionChange, onTextSelected }, ref) {
  const containerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const locationsReadyRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [fontStepIndex, setFontStepIndex] = useState(2); // 100%
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const book = ePub(fileData.slice(0)); // slice(0) clones the buffer; epub.js detaches it
    bookRef.current = book;

    const rendition = book.renderTo(containerRef.current, {
      width: '100%',
      height: 600,
      flow: 'paginated',
    });
    renditionRef.current = rendition;

    rendition.themes.register('light', { body: { background: '#ffffff', color: '#1B2430' } });
    rendition.themes.register('dark', { body: { background: '#1B2430', color: '#F1EFE9' } });
    rendition.themes.select('light');
    rendition.themes.fontSize('100%');

    rendition.display(initialPosition || undefined).then(() => setIsLoading(false));

    // Generating locations walks the whole book to build a percentage
    // index; it can take a moment on large books, so it runs in the
    // background rather than blocking the initial render.
    book.ready
      .then(() => book.locations.generate(1600))
      .then(() => {
        locationsReadyRef.current = true;
      })
      .catch(() => {
        /* if generation fails, we simply won't send a percentage — the
           position/CFI itself still saves and resumes correctly */
      });

    rendition.on('relocated', (location) => {
      const cfi = location.start.cfi;
      const payload = { position: cfi };
      if (locationsReadyRef.current) {
        payload.progressPercentage = Math.round(book.locations.percentageFromCfi(cfi) * 100);
      }
      onPositionChange?.(payload);
    });

    // epub.js fires 'selected' with the CFI range and the iframe contents
    // whenever the reader selects text — exactly what FR-HIGHLIGHT-01/02
    // need (highlighted text + its location).
    rendition.on('selected', (cfiRange, contents) => {
      const text = contents.window.getSelection().toString().trim();
      if (text) {
        onTextSelected?.({ text, location: cfiRange });
      }
    });

    return () => {
      book.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    goToPosition: (cfi) => renditionRef.current?.display(cfi),
  }));

  const goNext = () => renditionRef.current?.next();
  const goPrev = () => renditionRef.current?.prev();

  const changeFontStep = (delta) => {
    setFontStepIndex((prev) => {
      const next = Math.min(Math.max(prev + delta, 0), FONT_STEPS.length - 1);
      renditionRef.current?.themes.fontSize(`${FONT_STEPS[next]}%`);
      return next;
    });
  };

  const changeTheme = (_e, value) => {
    if (!value) return;
    setTheme(value);
    renditionRef.current?.themes.select(value);
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" mb={2} flexWrap="wrap" useFlexGap>
        <IconButton onClick={goPrev}>
          <NavigateBeforeIcon />
        </IconButton>
        <IconButton onClick={goNext}>
          <NavigateNextIcon />
        </IconButton>

        <IconButton onClick={() => changeFontStep(-1)} disabled={fontStepIndex === 0}>
          <TextDecreaseIcon />
        </IconButton>
        <Typography variant="body2">{FONT_STEPS[fontStepIndex]}%</Typography>
        <IconButton onClick={() => changeFontStep(1)} disabled={fontStepIndex === FONT_STEPS.length - 1}>
          <TextIncreaseIcon />
        </IconButton>

        <ToggleButtonGroup size="small" exclusive value={theme} onChange={changeTheme}>
          <ToggleButton value="light">Light</ToggleButton>
          <ToggleButton value="dark">Dark</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {isLoading && (
        <Box display="flex" justifyContent="center" mb={2}>
          <CircularProgress />
        </Box>
      )}
      <Box
        ref={containerRef}
        sx={{ minHeight: 600, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}
      />
    </Box>
  );
});

export default EpubViewer;
