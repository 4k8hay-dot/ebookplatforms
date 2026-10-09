import { useMemo } from 'react';

const TAG_RADIUS = 22;
const BOOK_RADIUS = 42;
const CENTER = 50;

function pointOnCircle(radius, index, count) {
  const angle = (index / Math.max(count, 1)) * 2 * Math.PI - Math.PI / 2;
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Tags sit on an inner ring, books on an outer ring; a line is drawn for
 * every (tag, book) pair the backend found (see analyticsController's
 * getKnowledgeMap). Clicking a tag calls onSelectTag so the page can show
 * the actual notes/highlights behind it (FR-KNOW-02/03). Clicking a book
 * calls onSelectBook to navigate there.
 */
export default function KnowledgeGraphSvg({ tags, books, links, selectedTagId, onSelectTag, onSelectBook }) {
  const tagPositions = useMemo(
    () => new Map(tags.map((t, i) => [t.id, pointOnCircle(TAG_RADIUS, i, tags.length)])),
    [tags]
  );
  const bookPositions = useMemo(
    () => new Map(books.map((b, i) => [b.id, pointOnCircle(BOOK_RADIUS, i, books.length)])),
    [books]
  );

  return (
    <svg viewBox="0 0 100 100" width="100%" height="480" role="img" aria-label="Knowledge map of tags and books">
      {links.map((link) => {
        const tagPos = tagPositions.get(link.tagId);
        const bookPos = bookPositions.get(link.bookId);
        if (!tagPos || !bookPos) return null;
        const dimmed = selectedTagId && selectedTagId !== link.tagId;
        return (
          <line
            key={`${link.tagId}-${link.bookId}`}
            x1={tagPos.x}
            y1={tagPos.y}
            x2={bookPos.x}
            y2={bookPos.y}
            stroke={dimmed ? '#E0DCD3' : '#A9812F'}
            strokeWidth={0.4}
          />
        );
      })}

      {books.map((b) => {
        const pos = bookPositions.get(b.id);
        return (
          <g key={b.id} transform={`translate(${pos.x}, ${pos.y})`} onClick={() => onSelectBook(b.id)} style={{ cursor: 'pointer' }}>
            <circle r={2.2} fill="#1B2A3C" />
            <text y={-3.5} fontSize="2.6" textAnchor="middle" fill="#1B2430">
              {truncate(b.title, 16)}
            </text>
          </g>
        );
      })}

      {tags.map((t) => {
        const pos = tagPositions.get(t.id);
        const isSelected = selectedTagId === t.id;
        return (
          <g key={t.id} transform={`translate(${pos.x}, ${pos.y})`} onClick={() => onSelectTag(t.id)} style={{ cursor: 'pointer' }}>
            <circle r={isSelected ? 3.2 : 2.6} fill={isSelected ? '#A9812F' : '#33455C'} />
            <text y={-4} fontSize="3" fontWeight={isSelected ? 700 : 400} textAnchor="middle" fill="#1B2430">
              {truncate(t.name, 14)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
