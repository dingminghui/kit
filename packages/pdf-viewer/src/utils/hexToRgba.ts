export function hexToRgba(hex: string, alpha: number): string {
  const full = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, "#$1$1$2$2$3$3");
  const match = full.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return `rgba(22, 93, 255, ${alpha})`;
  const [, red, green, blue] = match;
  if (!red || !green || !blue) {
    return `rgba(22, 93, 255, ${alpha})`;
  }
  const r = parseInt(red, 16);
  const g = parseInt(green, 16);
  const b = parseInt(blue, 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
