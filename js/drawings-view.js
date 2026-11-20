import { compileDrawings } from './drawings.js';
import { permitFields, permitSettings } from './permit-settings.js';
import { wheelZoom } from './wheel-zoom.js';

const storageKey = 'farstu-permit-settings-v1';

export function createDrawingsView($) {
  const panel = $('drawings-view'), host = $('permit-sheets'), selector = $('permit-sheet');
  const status = $('drawings-status'), print = $('print-permit-sheets');
  const dialog = $('permit-dialog'), form = $('permit-form'), fieldset = $('permit-fields');
  const zoomByViewport = new WeakMap();
  let values = {}, model, valid = false, renderedModel, renderedValues, storageStatus = '';
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) values = saved;
  } catch (error) {
    console.error('Unable to load site and permit settings.', error);
    storageStatus = 'Site settings could not be read; drawing defaults are in use.';
  }
  const fields = permitFields.map(spec => {
    const field = document.createElement('label');
    const input = document.createElement(spec.options ? 'select' : 'input');
    input.name = spec.key;
    if (spec.options) {
      input.add(new Option('South (assumed)', ''));
      for (const direction of spec.options) input.add(new Option(direction[0].toUpperCase() + direction.slice(1), direction));
    } else if (typeof spec.initial === 'number') {
      Object.assign(input, { type: 'number', min: spec.min, max: spec.max, step: spec.step || 1 });
    } else {
      input.maxLength = spec.maxLength;
    }
    field.append(spec.label, input);
    fieldset.append(field);
    return { spec, input };
  });

  function showSelectedSheet() {
    for (const sheet of host.children) sheet.hidden = sheet.dataset.sheet !== selector.value;
  }

  function render() {
    print.disabled = !valid;
    status.textContent = [
      model ? valid ? '' : 'Designer has invalid values. Showing the last valid model; correct the errors to print.'
        : 'No valid Designer model is available yet.',
      storageStatus
    ].filter(Boolean).join(' ');
    if (!model || (model === renderedModel && values === renderedValues)) return;
    const sheets = compileDrawings(model, values).map(({ id, svg }) => {
      const sheet = document.createElement('div');
      sheet.className = 'permit-sheet';
      sheet.dataset.sheet = id;
      sheet.innerHTML = svg;
      return sheet;
    });
    host.replaceChildren(...sheets);
    renderedModel = model;
    renderedValues = values;
    showSelectedSheet();
  }

  selector.addEventListener('change', showSelectedSheet);
  host.addEventListener('wheel', event => {
    if (!event.altKey || !event.deltaY) return;
    const svg = event.target.closest('svg');
    const matrix = svg?.getScreenCTM();
    if (!matrix) return;
    const { x, y } = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const viewport = [...svg.querySelectorAll('[data-zoom-viewport]')].find(({ firstElementChild: rect }) => {
      const left = rect.x.baseVal.value, top = rect.y.baseVal.value;
      return x >= left && x <= left + rect.width.baseVal.value && y >= top && y <= top + rect.height.baseVal.value;
    });
    if (!viewport) return;
    event.preventDefault();
    const previous = zoomByViewport.get(viewport) || { scale: 1, x: 0, y: 0 };
    const scale = wheelZoom(event, previous.scale);
    if (scale === previous.scale) return;
    const ratio = scale / previous.scale;
    const transform = { scale, x: x - (x - previous.x) * ratio, y: y - (y - previous.y) * ratio };
    const groups = svg.querySelectorAll(`[data-zoom-view="${viewport.id}"]`);
    if (scale === 1) {
      zoomByViewport.delete(viewport);
      for (const group of groups) group.removeAttribute('transform');
    } else {
      zoomByViewport.set(viewport, transform);
      for (const group of groups) group.setAttribute('transform', `translate(${transform.x} ${transform.y}) scale(${scale})`);
    }
  }, { passive: false });
  $('reset-permit-zoom').addEventListener('click', () => {
    const sheet = host.querySelector('.permit-sheet:not([hidden])');
    for (const viewport of sheet?.querySelectorAll('[data-zoom-viewport]') || []) zoomByViewport.delete(viewport);
    for (const group of sheet?.querySelectorAll('[data-zoom-view][transform]') || []) group.removeAttribute('transform');
  });
  $('show-permit-dialog').addEventListener('click', () => {
    const site = permitSettings(values, model?.slabThickness);
    for (const { spec, input } of fields) {
      const assumed = site.defaults.includes(spec.key);
      input.value = assumed ? '' : site[spec.key];
      if (!spec.options) input.placeholder = assumed ? String(site[spec.key]) : '';
    }
    dialog.showModal();
  });
  $('cancel-permit').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', event => {
    event.preventDefault();
    values = Object.fromEntries(fields.filter(({ input }) => input.value.trim() !== '')
      .map(({ spec, input }) => [spec.key, input.type === 'number' ? input.valueAsNumber : input.value.trim()]));
    try {
      localStorage.setItem(storageKey, JSON.stringify(values));
      storageStatus = '';
    } catch (error) {
      console.error('Unable to save site and permit settings.', error);
      storageStatus = 'Site settings updated for this visit but could not be saved in this browser.';
    }
    dialog.close();
    render();
  });
  print.addEventListener('click', () => {
    if (!valid) return;
    document.body.classList.add('printing-permit');
    window.print();
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('printing-permit'));

  return {
    render,
    update(next, isValid) {
      if (isValid) model = next;
      valid = isValid;
      if (!panel.hidden) render();
    }
  };
}
