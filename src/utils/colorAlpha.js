/**
 * Hex (#RRGGBB) to rgba() so gradients can fade into the theme.
 */
export function colorAlpha(color, alpha) {
  if (typeof color === 'string' && color[0] === '#' && color.length === 7) {
    const n = parseInt(color.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}
