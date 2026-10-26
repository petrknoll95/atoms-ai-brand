import type { Pindrop } from 'pindrop.js';
import type { connectFeedback } from './feedback-store';

const button = document.querySelector<HTMLButtonElement>('[data-feedback-toggle]');
const help = document.querySelector<HTMLElement>('[data-feedback-help]');
const status = document.querySelector<HTMLElement>('[data-feedback-status]');
const retry = document.querySelector<HTMLButtonElement>('[data-feedback-retry]');
let layer: ReturnType<typeof Pindrop.init> | undefined;
let mode = 'view';
let store: Awaited<ReturnType<typeof connectFeedback>> | undefined;
const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
// Local previews use a separate review space, so verification notes never appear on the live site.
const page = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) ? `preview:${pathname}` : pathname;

function setStatus(message: string, failed = false) {
  if (status) { status.textContent = message; status.hidden = false; }
  if (retry) retry.hidden = !failed || !layer;
}
function syncVisibility() {
  const root = document.getElementById('pindrop-web-root');
  const open = !!root && root.style.display !== 'none';
  button?.setAttribute('aria-expanded', String(open));
  if (button) button.textContent = open ? 'Close feedback' : 'Feedback';
  if (help) help.hidden = !open || mode !== 'view';
  if (status && !store?.hasUnsaved()) status.hidden = !open;
}

button?.addEventListener('click', async () => {
  if (layer) { layer.toggle(); syncVisibility(); return; }
  button.disabled = true;
  setStatus('Connecting shared feedback…');
  try {
    const [{ Pindrop }, { connectFeedback }] = await Promise.all([import('pindrop.js'), import('./feedback-store')]);
    store = await connectFeedback(page, setStatus);
    layer = Pindrop.init({
      storageKey: 'atomsai-feedback:shared:v1',
      adapter: store.adapter,
      theme: 'light',
      keyboardShortcuts: false,
      getScope: () => ({ page }),
      isScopeActive: scope => scope.page === page,
    });
    store.subscribe(comments => layer?.setComments(comments));
    layer.on('mode:change', event => { mode = event.mode; syncVisibility(); });
    const root = document.getElementById('pindrop-web-root');
    if (root) {
      new MutationObserver(syncVisibility).observe(root, { attributes: true, attributeFilter: ['style'] });
      // Keep upstream inputs within server limits and give icon-only send controls names.
      const constrainInputs = () => {
        const controls = document.querySelector<HTMLElement>('[data-feedback]');
        if (controls) controls.hidden = !!root.shadowRoot?.querySelector('.pindrop-sheet, .pindrop-sidebar-sheet, .pindrop-name-overlay, .pindrop-new-comment-box');
        // Shared threads do not support importing another page's local dump or clearing everyone's notes.
        const importer = root.shadowRoot?.querySelector<HTMLButtonElement>('button[aria-label="Load comments"]');
        if (importer) importer.style.display = 'none';
        root.shadowRoot?.querySelectorAll<HTMLButtonElement>('.pindrop-toolbar-menu-item').forEach(item => {
          if (item.textContent?.trim() === 'Clear all comments') item.style.display = 'none';
        });
        root.shadowRoot?.querySelectorAll('textarea').forEach(input => { input.maxLength = 8000; input.setAttribute('aria-label', input.placeholder || 'Comment'); });
        root.shadowRoot?.querySelectorAll<HTMLInputElement>('.pindrop-name-input').forEach(input => { input.maxLength = 100; });
        root.shadowRoot?.querySelectorAll('.pindrop-send-btn').forEach(send => send.setAttribute('aria-label', 'Send comment'));
      };
      if (root.shadowRoot) new MutationObserver(constrainInputs).observe(root.shadowRoot, { childList: true, subtree: true });
      constrainInputs();
    }
    setStatus('Shared feedback · Connected');
    syncVisibility();
  } catch (cause) {
    console.error('Unable to connect guideline feedback', cause);
    setStatus('Shared feedback could not connect. Check your connection and try Feedback again.');
  } finally { button.disabled = false; }
});
retry?.addEventListener('click', () => { if (layer && store) void store.adapter.save(layer.getComments()); });
window.addEventListener('beforeunload', event => {
  if (store?.hasUnsaved()) { event.preventDefault(); }
});
