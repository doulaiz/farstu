export function pierLayout({ width, length, footingColumns, footingRows, footingDiameter }) {
  const radius = footingDiameter / 2;
  const inset = radius + Math.min(100, (width - footingColumns * footingDiameter) / 4,
    (length - footingRows * footingDiameter) / 4);
  const axis = (span, count) => Array.from({ length: count }, (_, i) => inset + i * (span - 2 * inset) / (count - 1));
  return { radius, columns: axis(width, footingColumns), rows: axis(length, footingRows) };
}
