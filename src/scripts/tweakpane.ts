// Shared Tweakpane helpers for the brand tools (theme: .tp-theme in global.css).

/**
 * Previous / next buttons beside a list binding, for quick switching. They step the list's own
 * select, so Tweakpane handles the change exactly as if it had been picked.
 */
export function addSteppers(binding: { element: HTMLElement }, name: string) {
  const select = binding.element.querySelector('select')!;
  const value = binding.element.querySelector<HTMLElement>('.tp-lblv_v')!;
  const group = document.createElement('div');
  group.className = 'stepper';
  for (const [dir, label, path] of [
    [-1, 'Previous', 'M6 1 2 5l4 4'],
    [1, 'Next', 'M2 1l4 4-4 4'],
  ] as const) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'step';
    button.setAttribute('aria-label', `${label} ${name}`);
    button.innerHTML = `<svg viewBox="0 0 8 10" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`;
    button.addEventListener('click', () => {
      const n = select.options.length;
      select.selectedIndex = (select.selectedIndex + dir + n) % n;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    group.append(button);
  }
  value.append(group);
  value.classList.add('has-stepper');
}
