import { Box, Typography } from '@mui/material';

/**
 * data: [{ label, value }]. Renders a simple, readable bar chart without
 * pulling in a charting library — appropriate for the small, fixed-size
 * datasets analytics produces here (14 days of activity, a handful of
 * categories).
 */
export default function SimpleBarChart({ data, height = 140, barColor = '#1B2A3C' }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <Box>
      <Box component="svg" viewBox={`0 0 100 ${height}`} width="100%" height={height} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (height - 20);
          return (
            <g key={d.label}>
              <rect
                x={i * barWidth + barWidth * 0.15}
                y={height - 20 - barHeight}
                width={barWidth * 0.7}
                height={barHeight}
                fill={barColor}
                rx={1}
              />
              <text x={i * barWidth + barWidth / 2} y={height - 6} fontSize="3.2" textAnchor="middle" fill="#5B6472">
                {d.value}
              </text>
            </g>
          );
        })}
      </Box>
      <Box display="flex" justifyContent="space-between" mt={0.5}>
        {data.map((d, i) => (
          <Typography
            key={d.label}
            variant="caption"
            color="text.secondary"
            sx={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', display: i % Math.ceil(data.length / 7) === 0 ? 'block' : 'none' }}
          >
            {d.label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
