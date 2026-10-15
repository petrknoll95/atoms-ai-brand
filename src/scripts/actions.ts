// Delegated click handlers shared by every page: copy values, and copy/download artwork.
import { colorize, copyText, downloadBlob, svgBlob, svgToPng, withStrokeWidth } from './svg';

const toast = document.querySelector<HTMLElement>('[data-toast]');
let toastTimer = 0;

export function notify(message: string) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 1600);
}

/** Options live on the card, or on a surrounding group shared by many cards (the icon library). */
const scopeOf = (card: HTMLElement) => card.closest<HTMLElement>('[data-asset-group]') ?? card;

/** Current artwork for an asset card, with its selected color and weight applied. */
function assetState(card: HTMLElement) {
  const master = card.querySelector<HTMLTemplateElement>('template[data-asset-svg]')!.innerHTML.trim();
  const scope = scopeOf(card);
  const color = scope.querySelector<HTMLInputElement>('input[data-asset-color]:checked');
  const weight = scope.querySelector<HTMLInputElement>('input[data-asset-weight]:checked');
  let svg = color ? colorize(master, color.value, color.dataset.surface) : master;
  if (weight) svg = withStrokeWidth(svg, weight.value);
  const parts = [card.dataset.asset, color?.dataset.assetColor, weight?.dataset.assetWeight].filter(Boolean);
  return { svg, filename: parts.join('-'), colorLabel: color?.dataset.label };
}

async function runAssetAction(card: HTMLElement, action: string) {
  const { svg, filename } = assetState(card);
  if (action === 'copy-svg') {
    await copyText(svg);
    notify('SVG copied');
  } else if (action === 'download-svg') {
    downloadBlob(svgBlob(svg), `${filename}.svg`);
  } else if (action === 'download-png') {
    const png = await svgToPng(svg, Number(card.dataset.pngSize) || 2400);
    downloadBlob(png, `${filename}.png`);
  }
}

document.addEventListener('click', async (event) => {
  const target = event.target as Element;

  const copy = target.closest<HTMLElement>('[data-copy]');
  if (copy) {
    const value = copy.dataset.copy!;
    await copyText(value);
    notify(copy.dataset.copyMessage ?? `Copied ${value}`);
    return;
  }

  const action = target.closest<HTMLElement>('[data-asset-action]');
  if (action) {
    const card = action.closest<HTMLElement>('[data-asset]');
    if (card) await runAssetAction(card, action.dataset.assetAction!);
  }
});

// Live preview when the color or weight of an asset card (or a group of cards) changes.
document.addEventListener('change', (event) => {
  const input = event.target as HTMLInputElement;
  if (!input.matches('[data-asset-color], [data-asset-weight]')) return;
  const scope = input.closest<HTMLElement>('[data-asset-group]') ?? input.closest<HTMLElement>('[data-asset]');
  if (!scope) return;
  const cards = scope.matches('[data-asset]') ? [scope] : [...scope.querySelectorAll<HTMLElement>('[data-asset]')];
  for (const card of cards) {
    const preview = card.querySelector<HTMLElement>('[data-asset-preview]');
    if (preview) preview.innerHTML = assetState(card).svg;
  }
  if (input.matches('[data-asset-color]')) {
    scope.querySelectorAll<HTMLElement>('[data-asset-preview], [data-asset-tone]').forEach((el) => {
      el.dataset.tone = input.dataset.tone;
    });
    const label = scope.querySelector('[data-asset-color-label]');
    if (label) label.textContent = input.dataset.label ?? '';
  }
});
