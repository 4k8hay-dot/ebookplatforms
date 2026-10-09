import { forwardRef, useImperativeHandle, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Box, IconButton, Typography, Stack, CircularProgress } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

// react-pdf renders PDFs via pdf.js, which needs its own worker script.
// Loading it from a CDN (matching react-pdf's bundled pdfjs-dist version)
// avoids having to hand-configure a bundler-specific worker asset.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

/**
 * fileData: ArrayBuffer of the PDF (already fetched with authentication
 * by ReaderPage — this component never talks to the network itself).
 * initialPage/onPositionChange: wire up FR-READ-04/05 save & resume.
 * A ref exposing goToPosition(pageNumber) lets ReaderPage jump here when
 * the user clicks a saved bookmark (FR-BOOKMARK-04).
 */
const PdfViewer = forwardRef(function PdfViewer({ fileData, initialPage, onPositionChange, onTextSelected }, ref) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(initialPage || 1);
  const [scale, setScale] = useState(1.1);

  const goToPage = (next) => {
    const clamped = Math.min(Math.max(next, 1), numPages || 1);
    setPageNumber(clamped);
    onPositionChange?.({ position: String(clamped), currentPage: clamped, totalPages: numPages });
  };

  useImperativeHandle(ref, () => ({
    goToPosition: (pos) => goToPage(Number(pos)),
  }));

  // react-pdf renders real selectable text via pdf.js's text layer, so a
  // native browser selection is all we need to capture for FR-HIGHLIGHT-01.
  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text) {
      onTextSelected?.({ text, location: String(pageNumber) });
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mb={2}>
        <IconButton onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1}>
          <NavigateBeforeIcon />
        </IconButton>
        <Typography variant="body2">
          Page {pageNumber} {numPages ? `of ${numPages}` : ''}
        </Typography>
        <IconButton onClick={() => goToPage(pageNumber + 1)} disabled={numPages && pageNumber >= numPages}>
          <NavigateNextIcon />
        </IconButton>

        <IconButton onClick={() => setScale((s) => Math.max(s - 0.15, 0.5))} sx={{ ml: 3 }}>
          <ZoomOutIcon />
        </IconButton>
        <IconButton onClick={() => setScale((s) => Math.min(s + 0.15, 2.5))}>
          <ZoomInIcon />
        </IconButton>
      </Stack>

      <Box display="flex" justifyContent="center" sx={{ bgcolor: '#e9e5da', p: 2, borderRadius: 1 }} onMouseUp={handleMouseUp}>
        <Document
          file={{ data: fileData }}
          onLoadSuccess={({ numPages: n }) => {
            setNumPages(n);
            // Clamp any previously-saved page number against the real page count.
            setPageNumber((p) => Math.min(p, n));
          }}
          loading={<CircularProgress />}
        >
          <Page pageNumber={pageNumber} scale={scale} />
        </Document>
      </Box>
    </Box>
  );
});

export default PdfViewer;
