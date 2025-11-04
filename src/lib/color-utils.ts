/**
 * Generate a consistent HSL color from a string seed
 * Uses a simple hash function to generate deterministic colors
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  const hue = Math.abs(hash % 360);

  const saturation = 65 + (Math.abs(hash) % 20);
  const lightness = 50 + (Math.abs(hash >> 8) % 15);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Generate a color with proper contrast for charts
 * Ensures colors are vibrant enough for data visualization
 */
export function generateChartColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);

  const saturation = 70;
  const lightness = 55;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
