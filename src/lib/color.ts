// Contrast helpers for the user's accent colour: whatever preset they pick,
// white text on buttons and brand-coloured text must stay readable (WCAG AA 4.5:1).

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(hexToRgb(a));
  const lb = luminance(hexToRgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Mix `hex` towards `target` in small steps until it contrasts enough with `against`. */
function adjust(hex: string, target: [number, number, number], against: string, min: number) {
  const base = hexToRgb(hex);
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const mixed = base.map((c, i) => c + (target[i] - c) * t) as [number, number, number];
    const out = toHex(mixed);
    if (contrast(out, against) >= min) return out;
  }
  return toHex(target);
}

/** Accent shades used by the UI: button fill (white text) and text on light/dark pages. */
export function brandShades(accent: string) {
  return {
    solid: adjust(accent, [0, 0, 0], '#ffffff', 4.6),
    textOnLight: adjust(accent, [0, 0, 0], '#ffffff', 4.6),
    textOnDark: adjust(accent, [255, 255, 255], '#1c1c1c', 4.6),
  };
}
