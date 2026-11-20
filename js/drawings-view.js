import { compileDrawings } from './drawings.js';
import { permitFields, permitSettings } from './permit-settings.js';

const storageKey = 'farstu-permit-settings-v1';

export function createDrawingsView($) {
  const panel = $('drawings-view'), host = $('permit-sheets'), selector = $('permit-sheet');
  const status = $('drawings-status'), print = $('print-permit-sheets');
  const dialog = $('permit-dialog'), form = $('permit-form'), fieldset = $('permit-fields');
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
