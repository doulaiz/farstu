export function createWorkspaceTabs($, views) {
  const entries = views.map(({ button, panel, onShow }) => ({ button: $(button), panel: $(panel), onShow }));
  function show(active) {
    for (const entry of entries) {
      const open = entry === active;
      entry.panel.hidden = !open;
      entry.button.setAttribute('aria-pressed', String(open));
    }
    active.onShow?.();
  }
  for (const entry of entries) entry.button.addEventListener('click', () => show(entry));
}
