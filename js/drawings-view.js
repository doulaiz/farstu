import { compileDrawings } from './drawings.js';
import { permitFields, permitSettings } from './permit-settings.js';
import { wheelZoom } from './wheel-zoom.js';

const storageKey = 'farstu-permit-settings-v1';

export function createDrawingsView($) {
  const panel = $('drawings-view'), host = $('permit-sheets'), selector = $('permit-sheet');
  const status = $('drawings-status'), print = $('print-permit-sheets'), download = $('download-permit-svgs');
  const viewportSelector = $('permit-viewport'), zoomLevel = $('permit-zoom-level');
  const dialog = $('permit-dialog'), form = $('permit-form'), fieldset = $('permit-fields');
  const zoomByViewport = new WeakMap();
  const selectedBySheet = new Map();
  let values = {}, model, valid = false, renderedModel, renderedValues, storageStatus = '', exportStatus = '';
  let compiledSheets = [], gesture;
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
    const viewports = currentViewports();
    viewportSelector.replaceChildren(...viewports.map(viewport =>
      new Option(viewport.dataset.zoomLabel, viewport.id)));
    const selected = selectedBySheet.get(selector.value);
    if (viewports.some(viewport => viewport.id === selected)) viewportSelector.value = selected;
    updateZoomLevel();
  }

  function render() {
    print.disabled = download.disabled = !valid;
    status.textContent = [
      model ? valid ? '' : 'Designer has invalid values. Showing the last valid model; correct the errors to export.'
        : 'No valid Designer model is available yet.',
      storageStatus, exportStatus
    ].filter(Boolean).join(' ');
    if (!model || (model === renderedModel && values === renderedValues)) return;
    compiledSheets = compileDrawings(model, values);
    const sheets = compiledSheets.map(({ id, svg }) => {
      const sheet = document.createElement('div');
      sheet.className = 'permit-sheet';
      sheet.dataset.sheet = id;
      sheet.innerHTML = svg;
      return sheet;
    });
    gesture = undefined;
    host.replaceChildren(...sheets);
    renderedModel = model;
    renderedValues = values;
    showSelectedSheet();
  }

  function currentViewports() {
    return [...(host.querySelector('.permit-sheet:not([hidden])')?.querySelectorAll('[data-zoom-viewport]') || [])];
  }
  function activeViewport() {
    return currentViewports().find(viewport => viewport.id === viewportSelector.value);
  }
  function selectViewport(viewport) {
    viewportSelector.value = viewport.id;
    selectedBySheet.set(selector.value, viewport.id);
    updateZoomLevel();
  }
  function state(viewport) {
    return zoomByViewport.get(viewport) || { scale: 1, x: 0, y: 0 };
  }
  function bounds(viewport) {
    const rect = viewport.firstElementChild;
    return { x: rect.x.baseVal.value, y: rect.y.baseVal.value,
      width: rect.width.baseVal.value, height: rect.height.baseVal.value };
  }
  function updateZoomLevel() {
    const viewport = activeViewport();
    zoomLevel.textContent = `${Math.round((viewport ? state(viewport).scale : 1) * 100)}%`;
  }
  function transformViewport(viewport, next) {
    const box = bounds(viewport), scale = Math.max(1, Math.min(4, next.scale));
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const x = clamp(next.x, box.x - scale * (box.x + box.width) + box.width * .2,
      box.x + box.width * .8 - scale * box.x);
    const y = clamp(next.y, box.y - scale * (box.y + box.height) + box.height * .2,
      box.y + box.height * .8 - scale * box.y);
    const groups = viewport.ownerSVGElement.querySelectorAll(`[data-zoom-view="${viewport.id}"]`);
    if (scale === 1 && x === 0 && y === 0) {
      zoomByViewport.delete(viewport);
      for (const group of groups) group.removeAttribute('transform');
    } else {
      zoomByViewport.set(viewport, { scale, x, y });
      for (const group of groups) group.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
    }
    if (viewport === activeViewport()) updateZoomLevel();
  }
  function zoomAt(viewport, scale, point) {
    const previous = state(viewport);
    scale = Math.max(1, Math.min(4, scale));
    if (scale === previous.scale) return;
    if (scale === 1) {
      transformViewport(viewport, { scale: 1, x: 0, y: 0 });
      return;
    }
    const ratio = scale / previous.scale;
    transformViewport(viewport, { scale, x: point.x - (point.x - previous.x) * ratio,
      y: point.y - (point.y - previous.y) * ratio });
  }
  function zoomSelected(factor) {
    const viewport = activeViewport();
    if (!viewport) return;
    const box = bounds(viewport);
    zoomAt(viewport, state(viewport).scale * factor, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  }
  function panSelected(dx, dy) {
    const viewport = activeViewport();
    if (!viewport) return;
    const previous = state(viewport), box = bounds(viewport);
    transformViewport(viewport, { ...previous, x: previous.x + dx * box.width * .05,
      y: previous.y + dy * box.height * .05 });
  }
  function sheetPoint(svg, event) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  }
  function viewportAt(svg, point) {
    return [...svg.querySelectorAll('[data-zoom-viewport]')].find(viewport => {
      const box = bounds(viewport);
      return point.x >= box.x && point.x <= box.x + box.width &&
        point.y >= box.y && point.y <= box.y + box.height;
    });
  }

  selector.addEventListener('change', () => {
    gesture = undefined;
    showSelectedSheet();
  });
  viewportSelector.addEventListener('change', () => {
    gesture = undefined;
    selectedBySheet.set(selector.value, viewportSelector.value);
    updateZoomLevel();
  });
  $('permit-zoom-in').addEventListener('click', () => zoomSelected(1.25));
  $('permit-zoom-out').addEventListener('click', () => zoomSelected(1 / 1.25));
  for (const [direction, dx, dy] of [['left',-1,0],['right',1,0],['up',0,-1],['down',0,1]]) {
    $(`permit-pan-${direction}`).addEventListener('click', () => panSelected(dx, dy));
  }
  host.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const actions = {
      '+': () => zoomSelected(1.25), '=': () => zoomSelected(1.25), '-': () => zoomSelected(1 / 1.25),
      ArrowLeft: () => panSelected(-1, 0), ArrowRight: () => panSelected(1, 0),
      ArrowUp: () => panSelected(0, -1), ArrowDown: () => panSelected(0, 1)
    };
    if (!actions[event.key]) return;
    event.preventDefault();
    actions[event.key]();
  });
  host.addEventListener('wheel', event => {
    if (!event.altKey || !event.deltaY) return;
    const svg = event.target.closest('svg');
    const point = svg && sheetPoint(svg, event);
    const viewport = point && viewportAt(svg, point);
    if (!viewport) return;
    event.preventDefault();
    selectViewport(viewport);
    zoomAt(viewport, wheelZoom(event, state(viewport).scale), point);
  }, { passive: false });
  host.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const svg = event.target.closest('svg');
    const point = svg && sheetPoint(svg, event);
    const viewport = point && viewportAt(svg, point);
    if (!viewport || (gesture && (gesture.svg !== svg || gesture.viewport !== viewport || gesture.points.size >= 2))) return;
    if (!gesture) gesture = { svg, viewport, points: new Map() };
    gesture.points.set(event.pointerId, point);
    selectViewport(viewport);
    svg.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  host.addEventListener('pointermove', event => {
    if (!gesture?.points.has(event.pointerId)) return;
    const point = sheetPoint(gesture.svg, event);
    if (!point) return;
    const before = [...gesture.points.values()];
    gesture.points.set(event.pointerId, point);
    const after = [...gesture.points.values()], previous = state(gesture.viewport);
    if (after.length === 1) {
      transformViewport(gesture.viewport, { ...previous, x: previous.x + after[0].x - before[0].x,
        y: previous.y + after[0].y - before[0].y });
    } else {
      const centre = points => ({ x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 });
      const distance = points => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const oldDistance = distance(before);
      if (!oldDistance) return;
      const a = centre(before), b = centre(after);
      const scale = Math.max(1, Math.min(4, previous.scale * distance(after) / oldDistance));
      const ratio = scale / previous.scale;
      transformViewport(gesture.viewport, { scale, x: b.x - (a.x - previous.x) * ratio,
        y: b.y - (a.y - previous.y) * ratio });
    }
    event.preventDefault();
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) {
    host.addEventListener(type, event => {
      if (!gesture?.points.delete(event.pointerId)) return;
      if (!gesture.points.size) gesture = undefined;
    });
  }
  $('reset-permit-zoom').addEventListener('click', () => {
    const sheet = host.querySelector('.permit-sheet:not([hidden])');
    for (const viewport of sheet?.querySelectorAll('[data-zoom-viewport]') || []) zoomByViewport.delete(viewport);
    for (const group of sheet?.querySelectorAll('[data-zoom-view][transform]') || []) group.removeAttribute('transform');
    updateZoomLevel();
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
  download.addEventListener('click', () => {
    if (!valid) return;
    const urls = [];
    let link;
    try {
      for (const { id, svg } of compiledSheets) {
        const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
        urls.push(url);
        link = document.createElement('a');
        link.href = url;
        link.download = `farstu-${id}.svg`;
        document.body.append(link);
        link.click();
        link.remove();
      }
      setTimeout(() => urls.forEach(url => URL.revokeObjectURL(url)), 1000);
      exportStatus = '';
    } catch (error) {
      if (link?.isConnected) link.remove();
      urls.forEach(url => URL.revokeObjectURL(url));
      console.error('Unable to export SVG drawings.', error);
      exportStatus = 'SVG drawings could not be exported in this browser.';
    }
    render();
  });

  return {
    render,
    update(next, isValid) {
      if (isValid) model = next;
      valid = isValid;
      if (!panel.hidden) render();
    }
  };
}
