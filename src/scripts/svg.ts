// Helpers for exporting brand artwork from the browser.

/**
 * Master artwork uses `currentColor` for its ink and `SURFACE` for opaque fills
 * (illustration linework); exported files need concrete values.
 */
export const colorize = (svg: string, ink: string, surface = 'none') =>
  svg.replaceAll('currentColor', ink).replaceAll('SURFACE', surface);

export const withStrokeWidth = (svg: string, width: string) =>
  svg.replace(/stroke-width="[^"]*"/g, `stroke-width="${width}"`);

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const svgBlob = (svg: string) => new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for browsers without async clipboard access
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    const focused = document.activeElement;
    try {
      area.select();
      if (!document.execCommand('copy')) throw new Error('Clipboard is unavailable.');
    } finally {
      area.remove();
      if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
    }
  }
}

/** Intrinsic size of an SVG string, from its viewBox. */
export function svgSize(svg: string) {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  const [, , w, h] = (root.getAttribute('viewBox') ?? '0 0 0 0').split(/[\s,]+/).map(Number);
  return { width: w || Number(root.getAttribute('width')), height: h || Number(root.getAttribute('height')) };
}

/** Rasterize an SVG to a transparent PNG, scaled so its long edge is `longEdge` px. */
export async function svgToPng(svg: string, longEdge = 2400): Promise<Blob> {
  const { width, height } = svgSize(svg);
  const scale = longEdge / Math.max(width, height);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  doc.documentElement.setAttribute('width', String(w));
  doc.documentElement.setAttribute('height', String(h));
  const sized = new XMLSerializer().serializeToString(doc);

  const url = URL.createObjectURL(svgBlob(sized));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
