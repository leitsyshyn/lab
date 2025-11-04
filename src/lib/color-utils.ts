/**
 * Generate a consistent HSL color from a string seed
 * Uses a simple hash function to generate deterministic colors
 */
export function stringToColor(str: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate hue (0-360)
  const hue = Math.abs(hash % 360);

  // Use consistent saturation and lightness for good visibility
  const saturation = 65 + (Math.abs(hash) % 20); // 65-85%
  const lightness = 50 + (Math.abs(hash >> 8) % 15); // 50-65%

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

  // Generate hue from hash
  const hue = Math.abs(hash % 360);

  // Chart-friendly saturation and lightness
  const saturation = 70; // Fixed high saturation for vibrant colors
  const lightness = 55; // Fixed lightness for good contrast

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
