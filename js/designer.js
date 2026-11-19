import { createControls, timberSections } from './controls.js';
import { createBomView } from './bom-view.js';
import { createLoadsView } from './loads-view.js';
import { pierLayout } from './loads.js';
import { createWorkspaceTabs } from './workspace-tabs.js';
import { clippedHeight, rafterStarts, wallCourses as courses, wallMembers, wallPosts as posts } from './framing.js';
import { drawWindow, sillExtension, sillProjection, windowProfile } from './windows.js';
import { roofPitchGuidance, roofWidthRange, tileGaugeLimit, tileSystems } from './roofing.js';
import { downloadSettings, loadSettings, saveSettings } from './storage.js';

export function initDesigner() {
  const $ = (id) => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Required page element "#${id}" is missing.`);
    return element;
  };
  const form = $('settings');
  const svg = $('drawing');
  const { width: drawingWidth, height: drawingHeight } = svg.viewBox.baseVal;
  const {
    layerMenu, roofDisplay, footingLayout, wallLayers, layerInputs, doorButton, groundButton,
    doorHanding, doorWindow, roofMaterial, roofFinish, fields, anchors, trimColour, houseWindows, houseBasementWindows,
    windowMuntins, syncTimberSizes
  } = createControls($);
  const legacyBasementFields = new Set(Object.keys(houseBasementWindows)
    .flatMap(key => ['Width','Height','Offset','Sill'].map(suffix => key + suffix)));
  const isCalculatedClearance = (key, selectedAnchors = anchors) => Object.keys(anchors).some(side =>
    key === side + (selectedAnchors[side] === 'Bottom' ? 'Top' : 'Bottom'));
  const roofGuidance = $('roof-guidance');
  const tileLayoutGuidance = $('tile-layout-guidance');
  const roofLayoutGuidance = $('roof-layout-guidance');
  const storageStatus = $('storage-status');
  const exportButton = $('export-settings');
  const bom = createBomView($);
  const loads = createLoadsView($);
  createWorkspaceTabs($, [
    { button: 'show-designer', panel: 'designer-view' },
    { button: 'show-bom', panel: 'bom-view', onShow: bom.render },
    { button: 'show-loads', panel: 'loads-view', onShow: loads.render }
  ]);
  const dimensions = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
  const fmt = (n) => dimensions.format(n);
  const mm = (n) => `${fmt(n)} mm`;
  const houseColor = 'var(--house-color)';
  const glassColor = '#80a9b0';
  const footingColor = '#8c88a5';
  let latest;
  let view = '3d';
  let groundHidden = false;
  let persistenceEnabled = true;
  let settingsValid = false;
  let doorAngle = 0;
  let doorOpen = false;
  let doorAnimation = 0;
  let paintDoor;
  const activeSection = () => form.querySelector('.parameter-group[open] .parameter-section[open] .fields')?.id;
  let guideSection = activeSection();
  let guideField;
  let guideTimer;
  let paintMeasurements;
  let drawingLayer;
  let zoom = 1, zoomX = 0, zoomY = 0;

  function applyZoom() {
    drawingLayer?.setAttribute('transform',`translate(${zoomX} ${zoomY}) scale(${zoom})`);
  }

  function setZoom(next, x, y) {
    const ratio = next/zoom;
    zoomX = Math.max(drawingWidth*(1-next),Math.min(0,x-(x-zoomX)*ratio));
    zoomY = Math.max(drawingHeight*(1-next),Math.min(0,y-(y-zoomY)*ratio));
    zoom = next;
    applyZoom();
    paintMeasurements?.();
  }

  function showMeasurements(field) {
    clearTimeout(guideTimer);
    guideField = field;
    guideTimer = guideSection ? setTimeout(() => {
      guideTimer = undefined;
      paintMeasurements?.();
    },6000) : undefined;
    paintMeasurements?.();
  }

  function setDoor(open, animate = true) {
    cancelAnimationFrame(doorAnimation);
    doorOpen = open;
    doorButton.textContent = open ? 'Close door' : 'Open door';
    const start = doorAngle;
    const end = open ? Math.PI/2 : 0;
    const duration = 550 * Math.abs(end-start)/(Math.PI/2);
    if (!animate || duration === 0 || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      doorAngle = end;
      paintDoor?.();
      return;
    }
    const started = performance.now();
    const frame = (now) => {
      const t = Math.max(0,Math.min(1,(now-started)/duration));
      doorAngle = start+(end-start)*(t*t*(3-2*t));
      paintDoor?.();
      if (t < 1) doorAnimation = requestAnimationFrame(frame);
    };
    doorAnimation = requestAnimationFrame(frame);
  }


  const adjustedStockSizes = [];
  let adjustedRoofSettings = false;
  let adjustedTrims = false;
  function restoreSettings(saved) {
    if (!saved || saved.version !== 1 || !saved.fields ||
      !saved.layers || !saved.anchors) return false;
    const hasOption = (select, value) => [...select.options].some(option => option.value === value);
    const savedRoofMaterial = saved.roofMaterial && hasOption(roofMaterial, saved.roofMaterial)
      ? saved.roofMaterial
      : Number(saved.fields.pitch) < 14 ? 'standingSeam' : roofMaterial.value;
    const savedRoofFinish = saved.roofFinish ?? roofFinish.value;
    const savedFields = { ...saved.fields };
    const legacyTrims = savedFields.trimWidth === undefined && saved.trimColour === undefined;
    const savedTrimColour = legacyTrims ? saved.trimColours?.door : saved.trimColour;
    if (typeof savedTrimColour !== 'string' || !/^#[\da-f]{6}$/i.test(savedTrimColour)) return false;
    if (legacyTrims) {
      savedFields.trimWidth = savedFields.doorTrimWidth;
      adjustedTrims = ['front','right'].some(key => {
        const colour = saved.trimColours?.[key];
        return Number(saved.fields[key+'TrimWidth']) !== Number(savedFields.trimWidth) ||
          typeof colour !== 'string' || colour.toLowerCase() !== savedTrimColour.toLowerCase();
      });
    }
    if (savedFields.roofWidth === undefined && savedFields.doorSideOverhang === undefined) {
      const overhang = savedFields.sideOverhang;
      if (typeof overhang !== 'string' || overhang.trim() === '' ||
        !Number.isFinite(Number(overhang)) || Number(overhang) < 0 || Number(overhang) > 1000) return false;
      savedFields.roofWidth = String(Number(savedFields.width)+2*Number(overhang));
      savedFields.doorSideOverhang = overhang;
      adjustedRoofSettings = true;
    }
    if (savedRoofMaterial !== saved.roofMaterial) adjustedRoofSettings = true;
    if (savedRoofMaterial === 'standingSeam' && Number(savedFields.pitch) < 6) {
      savedFields.pitch = '6';
      adjustedRoofSettings = true;
    }
    for (const [key, input] of Object.entries(fields)) {
      if (isCalculatedClearance(key,saved.anchors)) continue;
      const value = (['houseBaseRecession','doorThickness','baseBoardWidth','coverBoardWidth'].includes(key) || legacyBasementFields.has(key)) && saved.fields[key] === undefined
        ? input.dataset.initial : savedFields[key];
      if (typeof value !== 'string' || value.trim() === '' || !Number.isFinite(Number(value))) return false;
      if (input.tagName === 'SELECT') {
        if (Number(value) < 0 || Number(value) > 50000 ||
          (Number(value) === 0 && !hasOption(input,'0'))) return false;
        const choices = key === 'studDepth' || key === 'rafterDepth'
          ? [...new Set(timberSections.map(item => item.depth))]
          : [...input.options].map(option => Number(option.value));
        const nearest = choices.reduce((best,n) => Math.abs(n-Number(value)) < Math.abs(best-Number(value)) ? n : best);
        savedFields[key] = String(nearest);
        if (nearest !== Number(value)) adjustedStockSizes.push(key);
      } else {
        if (Number(value) < Number(input.min) || Number(value) > Number(input.max)) return false;
        savedFields[key] = value;
      }
    }
    if (savedRoofMaterial === 'tiles' && Number(savedFields.tileLength) > tileGaugeLimit(Number(savedFields.pitch))) {
      savedFields.tileLength = String(tileGaugeLimit(Number(savedFields.pitch)));
      adjustedRoofSettings = true;
    }
    for (const prefix of ['stud','rafter']) {
      const width = Number(savedFields[prefix+'Width']), depth = Number(savedFields[prefix+'Depth']);
      if (!timberSections.some(item => item.width === width && item.depth === depth)) {
        const choices = timberSections.filter(item => item.width === width);
        savedFields[prefix+'Depth'] = String(choices.reduce((best,item) =>
          Math.abs(item.depth-depth) < Math.abs(best.depth-depth) ? item : best).depth);
        adjustedStockSizes.push(prefix+'Depth');
      }
    }
    for (const [key] of Object.entries(layerInputs)) {
      if (typeof saved.layers[key] !== 'boolean') return false;
    }
    if (!hasOption(footingLayout, saved.footingLayout) ||
      !hasOption(roofDisplay, saved.roofDisplay) ||
      !hasOption(roofMaterial, savedRoofMaterial) ||
      !hasOption(roofFinish, savedRoofFinish) ||
      !hasOption(doorHanding, saved.doorHanding) ||
      !['3d', 'front', 'left', 'right', 'plan'].includes(saved.view) ||
      typeof saved.groundHidden !== 'boolean' ||
      !['Bottom', 'Top'].includes(saved.anchors.front) ||
      !['Bottom', 'Top'].includes(saved.anchors.right)) return false;
    if (saved.windowMuntins !== undefined && !Object.entries(windowMuntins).every(([key,input]) =>
      hasOption(input,saved.windowMuntins?.[key]))) return false;
    if (saved.doorWindow !== undefined && !hasOption(doorWindow,saved.doorWindow)) return false;

    for (const [key, input] of Object.entries(fields)) {
      if (key !== 'studDepth' && key !== 'rafterDepth' && !isCalculatedClearance(key,saved.anchors)) {
        input.value = savedFields[key];
      }
    }
    syncTimberSizes();
    fields.studDepth.value = savedFields.studDepth;
    fields.rafterDepth.value = savedFields.rafterDepth;
    trimColour.value = savedTrimColour;
    if (saved.windowMuntins) {
      for (const [key,input] of Object.entries(windowMuntins)) input.value = saved.windowMuntins[key];
    }
    for (const [key, input] of Object.entries(layerInputs)) input.checked = saved.layers[key];
    footingLayout.value = saved.footingLayout;
    roofDisplay.value = saved.roofDisplay;
    roofMaterial.value = savedRoofMaterial;
    roofFinish.value = savedRoofFinish;
    doorHanding.value = saved.doorHanding;
    if (saved.doorWindow !== undefined) doorWindow.value = saved.doorWindow;
    view = saved.view;
    groundHidden = saved.groundHidden;
    anchors.front = saved.anchors.front;
    anchors.right = saved.anchors.right;
    return true;
  }

  function settingsSnapshot() {
    return {
      version: 1,
      fields: Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value])),
      trimColour: trimColour.value,
      windowMuntins: Object.fromEntries(Object.entries(windowMuntins).map(([key,input]) => [key,input.value])),
      layers: Object.fromEntries(Object.entries(layerInputs).map(([key, input]) => [key, input.checked])),
      footingLayout: footingLayout.value,
      roofDisplay: roofDisplay.value,
      roofMaterial: roofMaterial.value,
      roofFinish: roofFinish.value,
      doorHanding: doorHanding.value,
      doorWindow: doorWindow.value,
      view,
      groundHidden,
      anchors: { ...anchors }
    };
  }

  function persistSettings() {
    storageStatus.textContent = saveSettings(settingsSnapshot());
  }

  function update(alignRoofWidth = false) {
    tileLayoutGuidance.textContent = '';
    roofLayoutGuidance.textContent = '';
    tileLayoutGuidance.hidden = roofMaterial.value !== 'tiles';
    const roofStep = roofMaterial.value === 'tiles' ? Number(fields.tileWidth.value) : 1;
    fields.roofWidth.step = String(roofStep);
    fields.roofWidth.min = '1200';
    fields.roofWidth.max = '8000';
    if (fields.width.validity.valid && fields.doorSideOverhang.validity.valid && fields.tileWidth.validity.valid) {
      const range = roofWidthRange(Number(fields.width.value),Number(fields.doorSideOverhang.value),
        roofStep,Number(fields.doorSideOverhang.max));
      fields.roofWidth.min = String(range.min);
      fields.roofWidth.max = String(range.max);
      const previous = fields.roofWidth.value === '' ? NaN : Number(fields.roofWidth.value);
      if (alignRoofWidth && Number.isFinite(previous) && previous >= 1200 && previous <= 8000) {
        const next = Math.max(range.min,Math.min(range.max,Math.round(previous/roofStep)*roofStep));
        fields.roofWidth.value = String(next);
        if (next !== previous) adjustedRoofSettings = true;
      }
    }
    const bad = new Set();
    const messages = new Set();
    function flag(message, ...keys) {
      messages.add(message);
      keys.forEach((key) => bad.add(key));
    }
    const [footingColumns, footingRows] = footingLayout.value.split('x').map(Number);
    const v = {footingColumns, footingRows};
    for (const [key, input] of Object.entries(fields)) {
      if (isCalculatedClearance(key)) continue;
      v[key] = input.value === '' ? NaN : Number(input.value);
      if (!input.validity.valid || !Number.isFinite(v[key]) ||
        (input.tagName === 'SELECT' && ![...input.options].some(option => option.value === input.value))) {
        const label = input.getAttribute('aria-label');
        flag(input.tagName === 'SELECT' ? `Choose a listed standard size for ${label}.`
          : input.validity.stepMismatch && !input.validity.rangeUnderflow && !input.validity.rangeOverflow
          ? `${label} must be in increments of ${input.step} mm.`
          : `${label} must be between ${input.min} and ${input.max}.`, key);
        v[key] = NaN;
      }
    }

    const slope = Math.tan(v.pitch * Math.PI / 180);
    const pitchGuidance = roofPitchGuidance(roofMaterial.value,v.pitch);
    roofGuidance.textContent = pitchGuidance.valid ? pitchGuidance.message : '';
    roofGuidance.classList.toggle('roof-guidance-warning',
      pitchGuidance.valid && roofMaterial.value === 'tiles' && v.pitch < 22);
    if (!pitchGuidance.valid) flag(pitchGuidance.message,'pitch','roof-material');
    if (roofMaterial.value === 'tiles' && Number.isFinite(v.pitch) && v.tileLength > tileGaugeLimit(v.pitch)) {
      flag(`At ${fmt(v.pitch)}° these tiles need a batten gauge from 310 to ${tileGaugeLimit(v.pitch)} mm. Reduce the exposed tile length.`,
        'tileLength');
    }
    const rear = v.frontWallHeight + slope * v.length;
    const eave = v.frontWallHeight - slope * v.frontOverhang;
    const sideSpan = v.length - v.wallThickness;
    const frontSpan = v.width - 2 * v.wallThickness;
    if (sideSpan <= 0 || frontSpan <= 0) flag('The wall thickness leaves no clear interior span.', 'wallThickness', 'width', 'length');
    if (v.houseBaseHeight + 1 > v.houseWallHeight + v.slabThickness) {
      flag('The concrete base must end below the top of the existing house wall.', 'houseBaseHeight', 'houseWallHeight');
    }
    if (![2,3].includes(footingColumns) || ![2,3].includes(footingRows)) {
      flag('Choose a pier grid from the list.',footingLayout.id);
    } else if (footingColumns * v.footingDiameter >= v.width || footingRows * v.footingDiameter >= v.length) {
      flag(`The ${footingColumns} × ${footingRows} pier grid does not fit under this slab without touching. Choose a smaller grid, reduce the pier diameter, or enlarge the slab.`,
        footingLayout.id,'footingDiameter');
    }
    if (v.studDepth > v.wallThickness) flag('Stud depth exceeds the overall wall thickness.', 'studDepth', 'wallThickness');
    if (v.baseBoardWidth > v.claddingSpacing || v.coverBoardWidth > v.claddingSpacing ||
      v.baseBoardWidth + v.coverBoardWidth < v.claddingSpacing + 40) {
      flag('Cladding boards must fit their spacing with at least 20 mm overlap on each side of the joint.',
        'baseBoardWidth','coverBoardWidth','claddingSpacing');
    }
    for (const prefix of ['stud','rafter']) {
      if (!timberSections.some(item => item.width === v[prefix+'Width'] && item.depth === v[prefix+'Depth'])) {
        flag(`Choose a listed timber section for the ${prefix}s.`,prefix+'Width',prefix+'Depth');
      }
    }
    if (v.studWidth >= v.studSpacing) flag('Stud width must be less than the centre-to-centre spacing.', 'studWidth', 'studSpacing');
    if (v.rafterWidth >= v.rafterSpacing) flag('Rafter width must be less than the centre-to-centre spacing.', 'rafterWidth', 'rafterSpacing');
    const rightOverhang = v.roofWidth-v.width-v.doorSideOverhang;
    if (rightOverhang < 0 || rightOverhang > 1000) {
      flag('The roof must cover the slab with each side overhang between 0 and 1000 mm.',
        'roofWidth','doorSideOverhang','width');
    }
    if (2 * v.rafterWidth > v.roofWidth) flag('The two edge rafters do not fit within the roof width.', 'rafterWidth', 'roofWidth');
    const doorEnd = v.offset + v.doorWidth;
    if (doorEnd > sideSpan) flag('The left-side door extends into the front wall.', 'offset', 'doorWidth', 'length', 'wallThickness');
    if (v.doorHeight > rear - slope * doorEnd) flag('The left-side door reaches above the roofline at its front edge.', 'doorHeight', 'frontWallHeight', 'pitch');
    if (eave <= 0) flag('The front roof edge reaches slab level. Reduce the pitch or front overhang, or raise the front wall.', 'pitch', 'frontOverhang', 'frontWallHeight');

    const windows = {};
    for (const [side, anchor] of Object.entries(anchors)) {
      const w = v[side + 'Width'];
      const h = v[side + 'Height'];
      const isFront = side === 'front';
      const span = isFront ? frontSpan : sideSpan;
      const start = (span - w) / 2 + (isFront ? v.wallThickness : 0);
      const end = start + w;
      const available = (isFront ? v.frontWallHeight : rear - slope * end) - h;
      const complement = available - v[side + anchor];
      const other = anchor === 'Bottom' ? 'Top' : 'Bottom';
      fields[side + other].value = Number.isFinite(complement) ? Number(complement.toFixed(2)) : '';
      if (w > span) flag(`The ${side} window is wider than its clear wall span.`, side + 'Width', isFront ? 'width' : 'length', 'wallThickness');
      if (complement < -1e-8) flag(`The ${side} window does not fit between the slab and the roofline.`, side + 'Height', side + anchor, side + other);
      const bottom = anchor === 'Bottom' ? v[side + anchor] : Math.max(0, complement);
      windows[side] = { start, end, bottom, top: bottom + h };
    }

    const houseOpenings = Object.keys(houseWindows).map((key) => {
      const centre = v.width/2+v[key + 'Offset'];
      const halfWidth = v[key + 'Width']/2;
      const sill = v[key + 'Sill'];
      const head = sill+v[key + 'Height'];
      if (Math.abs(v[key + 'Offset'])+halfWidth > v.houseWallWidth/2) {
        flag(`${houseWindows[key].label} extends beyond the sides of the house wall.`, 'houseWallWidth', key + 'Width', key + 'Offset');
      }
      if (head > v.houseWallHeight) {
        flag(`${houseWindows[key].label} extends above the house wall.`, 'houseWallHeight', key + 'Height', key + 'Sill');
      }
      return { key, left: centre-halfWidth, right: centre+halfWidth, sill, head };
    });
    const basementOpenings = Object.entries(houseBasementWindows).map(([key, {label}]) => {
      const centre = v.width/2+v[key + 'Offset'];
      const halfWidth = v[key + 'Width']/2;
      const sill = v[key + 'Sill'];
      const head = sill+v[key + 'Height'];
      if (Math.abs(v[key + 'Offset'])+halfWidth > v.houseWallWidth/2) {
        flag(`${label} extends beyond the sides of the house wall.`, 'houseWallWidth', key + 'Width', key + 'Offset');
      }
      if (v.houseBaseHeight > 0 && head > v.houseBaseHeight) {
        flag(`${label} extends beyond the concrete base.`, 'houseBaseHeight', key + 'Height', key + 'Sill');
      }
      return { key, left: centre-halfWidth, right: centre+halfWidth, sill, head };
    });
    for (const [key, input] of Object.entries({
      ...fields, [footingLayout.id]:footingLayout, 'roof-material':roofMaterial
    })) {
      if (bad.has(key)) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    $('status').textContent = messages.size ? `Showing the last valid drawing. ${[...messages].join(' ')}` : '';
    if (messages.size) {
      settingsValid = false;
      bom.update(latest, false);
      loads.update(latest, false);
      return false;
    }
    settingsValid = true;
    roofLayoutGuidance.textContent = `Roof width: ${mm(v.roofWidth)}. Door-side (left) overhang: ${mm(v.doorSideOverhang)}. ` +
      `Opposite (right) overhang: ${mm(rightOverhang)}. Width increments: ${mm(roofStep)}.`;
    if (roofMaterial.value === 'tiles') {
      const tile = tileSystems[v.tileWidth];
      tileLayoutGuidance.textContent = `${tile.label}: ${mm(tile.width)} wide × ${mm(tile.length)} long; ` +
        `${mm(tile.width-v.tileWidth)} side overlap and ${mm(tile.length-v.tileLength)} headlap. ` +
        `Layout: ${v.roofWidth/v.tileWidth} whole covering modules × ${mm(v.tileWidth)} = ${mm(v.roofWidth)} roof width. ` +
        `Maximum batten gauge at this pitch: ${mm(tileGaugeLimit(v.pitch))}.`;
    }
    latest = { ...v, rightOverhang, windows, houseOpenings, basementOpenings, slope, rear, eave,
      roofMaterial:roofMaterial.value, roofFinish:roofFinish.value };
    bom.update(latest, true);
    loads.update(latest, true);
    $('area').textContent = `${fmt(v.width * v.length / 1e6)} m\u00b2`;
    $('rear').textContent = mm(rear);
    $('rise').textContent = mm(slope * v.length);
    $('assembly').textContent = `Slab: ${mm(v.slabThickness)} thick. Walls: ${mm(v.wallThickness)} thick. ${footingColumns * footingRows} piers (${footingColumns} × ${footingRows}): ${mm(v.footingDiameter)} diameter by ${mm(v.footingDepth)} deep below the slab.`;
    render();
    return true;
  }

  function render() {
    if (!latest) return;
    const { width: W, length: L, frontWallHeight: H, rear: R, eave: E, frontOverhang: F,
      roofWidth, doorSideOverhang, rightOverhang,
      slabThickness, wallThickness: T, footingColumns, footingRows, footingDiameter, footingDepth, claddingSpacing, baseBoardWidth, coverBoardWidth,
      windows, houseOpenings, basementOpenings, houseWallWidth, houseWallHeight, houseBaseHeight, houseBaseRecession,
      hedgeDistance, hedgeHeight, offset, doorWidth, doorHeight, doorThickness, pitch, slope,
      studSpacing, studWidth, studDepth, rafterSpacing, rafterWidth, rafterDepth, tileWidth, tileLength, tileRise,
      roofMaterial:material, roofFinish:finish } = latest;
    const visible = (key) => layerInputs[key].checked;
    const roofTiles = roofDisplay.value === 'tiles';
    const roofFraming = roofDisplay.value === 'rafters';
    const roofPaint = ({
      terracotta:'#a9573f', classicRed:'#96362e', darkGray:'#45494a', matteBlack:'#292c2d'
    })[finish];
    const tileTones = finish === 'matteBlack' || finish === 'darkGray'
      ? ['#292c2d','#3a3e3f','#484c4d','#55595a','#494d4e','#3b3f40','#303435','#252829']
      : finish === 'classicRed'
        ? ['#7a3028','#8e382f','#a44437','#b14c3d','#a34235','#923a31','#80332c','#702c25']
        : ['#8f4938','#ab5c47','#c37759','#ce8162','#bf6f53','#ab5a46','#964b39','#824233'];
    const tileEdgeTones = finish === 'matteBlack' || finish === 'darkGray'
      ? ['#292c2d','#45494a']
      : finish === 'classicRed' ? ['#7a3028','#a44437'] : ['#a14f3d','#c0755a'];
    const timberOnly = visible('studs') && wallLayers.every(([key]) => key === 'studs' || !visible(key));
    const iso = view === '3d';
    const side = iso || view === 'left' ? 'left' : 'right';
    const plan = view === 'plan';
    const front = view === 'front';
    const sideElevation = view === 'left' || view === 'right';
    const raw = iso ? ([x,y,z]) => [.866 * (x+y), .33 * (y-x)-z]
      : plan ? ([x,y]) => [x,y]
      : front ? ([x,,z]) => [x,-z]
      : ([,y,z]) => [side === 'left' ? y : -y,-z];
    const shapes = [];
    const doorTrimFaces = [];
    const labels = [];
    const dims = [];
    const face = (points, fill, extra = {}) => shapes.push(['polygon', points, {class: 'face', fill, ...extra}]);
    const line = (a, b, cls, extra = {}) => shapes.push(['line', [a,b], {class: cls, ...extra}]);
    const note = (at, text, dy = 0, anchor = 'middle') => labels.push({ at, text, dy, anchor });
    const dimension = (a, b, gap, text) => dims.push({ a, b, gap, text });
    const ground = (x,y) => [x,y,0];
    const roofLeft = -doorSideOverhang, roofRight = roofLeft+roofWidth;
    const planMargin = Math.max(360, doorSideOverhang + 170, rightOverhang + 170);
    const houseA = (W-houseWallWidth)/2, houseB = houseA+houseWallWidth;
    const houseAt = (x,z) => [x,0,z];
    const houseBaseAt = (x,z) => [x,-houseBaseRecession,z];
    const roofDepth = rafterDepth * Math.hypot(1,slope);
    const tileRun = tileLength/Math.hypot(1,slope);
    const roof = [[roofLeft,0,R+roofDepth],[roofRight,0,R+roofDepth],[roofRight,L+F,E+roofDepth],[roofLeft,L+F,E+roofDepth]];
    const roofAt = (x,y,offset = 0) => [x,y,R-slope*y+roofDepth+offset];
    const slab = [ground(0,0), ground(W,0), ground(W,L), ground(0,L)];
    const frontAt = (x,z) => [x,L,z];
    const sideAt = (x) => (y,z) => [x,y,z];
    const slabBase = -slabThickness;
    const houseBaseTop = slabBase + houseBaseHeight;
    const houseBaseColor = '#d5d5d5';
    const footingBase = slabBase - footingDepth;
    const { radius: pierRadius, rows: pierRows, columns: pierColumns } = pierLayout(latest);
    const gradeMargin = Math.min(350,W*.2,L*.2);
    const hedgeHalfDepth = 450;
    const sideGradeEnd = Math.max(L,hedgeDistance+hedgeHalfDepth)+gradeMargin;
    const grade = [[-gradeMargin,0,slabBase],[W+gradeMargin,0,slabBase],
      [W+gradeMargin,L+gradeMargin,slabBase],[-gradeMargin,L+gradeMargin,slabBase]];
    const door = { start: offset, end: offset + doorWidth, bottom: 0, top: doorHeight };
    const rtl = doorHanding.value === 'rtl';
    const hingeY = rtl ? door.end : door.start;
    const swingPoint = (angle, distance, height = 0) =>
      [-Math.sin(angle)*distance, hingeY+(rtl ? -1 : 1)*Math.cos(angle)*distance, height];
    const doorPoint = (angle, distance, depth, height) => {
      const [x,y,z] = swingPoint(angle,distance,height);
      return [x+Math.cos(angle)*depth,y+(rtl ? -1 : 1)*Math.sin(angle)*depth,z];
    };
    const swingArc = Array.from({length:25}, (_,i) => swingPoint(i*Math.PI/48,doorWidth));
    const doorVisible = plan || iso || view === 'left';
    const wallTop = (y) => R - slope * y;
    const frontTop = () => H;
    const frontSection = (u,d,z) => [u,L-d,z];
    const sideSection = (which) => (u,d,z) => [which === 'left' ? d : W-d,u,z];
    const core = Math.min(studDepth,T*.85);
    const spare = T-core;
    const outer = spare*.6, inner = spare-outer;
    const bands = {
      trim:[0,0], cover:[0,outer*.15], base:[outer*.15,outer*.31],
      nailers:[outer*.31,outer*.49], counter:[outer*.49,outer*.65], wind:[outer*.65,outer*.72],
      exterior:[outer*.72,outer], studs:[outer,outer+core], cavity:[outer,outer+core],
      vapour:[T-inner,T-inner*.91], service:[T-inner*.91,T-inner*.39],
      serviceFill:[T-inner*.91,T-inner*.39], osb:[T-inner*.39,T-inner*.19], gypsum:[T-inner*.19,T]
    };
    const wallColour = Object.fromEntries(wallLayers.map(([key,,colour]) => [key,colour]));
    const lumber = (points, kind, color = '#d9ab76', extra = {}) =>
      face(points,color,{class:`face lumber ${kind}`, ...extra});
    const camera = [-1,1,.66];
    const subtract = (a,b) => a.map((v,i) => v-b[i]);
    const dot = (a,b) => a.reduce((sum,v,i) => sum+v*b[i],0);
    const cross = ([x,y,z],[a,b,c]) => [y*c-z*b,z*a-x*c,x*b-y*a];
    const epsilon = 1e-6;

    function plane(points) {
      const origin = points[0];
      for (let i=1;i<points.length-1;i++) {
        const n = cross(subtract(points[i],origin),subtract(points[i+1],origin));
        const length = Math.hypot(...n);
        if (length>epsilon) return n.map(v => v/length);
      }
    }

    function timberPrism(outer, inner, kind, colour, extra) {
      const centre = outer[0].map((_,i) => (outer[0][i]+outer[2][i]+inner[0][i]+inner[2][i])/4);
      const sides = outer.map((p,i) => {
        const j = (i+1)%outer.length;
        return [p,outer[j],inner[j],inner[i]];
      });
      for (const [i,points] of [outer,inner,...sides].entries()) {
        const n = plane(points);
        if (!n || dot(n,camera)*dot(n,subtract(points[0],centre))<=epsilon) continue;
        lumber(points,i<2 ? kind : `${kind} lumber-return`,
          i<2 ? colour : i===4 ? '#f1cb9a' : '#b3875c',extra);
      }
    }

    // Split straddling faces at timber planes so a single long beam can be
    // behind one stud and in front of another in the same projection.
    function orderFraming(polygons, output, eye = camera) {
      if (!polygons.length) return;
      let pivot, best = Infinity;
      for (let i=0;i<Math.min(7,polygons.length);i++) {
        const sample = polygons[Math.floor(i*polygons.length/Math.min(7,polygons.length))];
        let above=0, below=0, crossing=0;
        for (const polygon of polygons) {
          const distances = polygon.points.map(p => dot(sample.normal,p)-sample.offset);
          const pos = distances.some(d => d>epsilon), neg = distances.some(d => d< -epsilon);
          if (pos && neg) crossing++;
          else if (pos) above++;
          else if (neg) below++;
        }
        const score = Math.abs(above-below)+crossing*4;
        if (score<best) { best=score; pivot=sample; }
      }
      const positive=[], negative=[], coplanar=[];
      for (const polygon of polygons) {
        const points = polygon.points;
        const distances = points.map(p => dot(pivot.normal,p)-pivot.offset);
        const pos = distances.some(d => d>epsilon), neg = distances.some(d => d< -epsilon);
        if (!pos && !neg) coplanar.push(polygon);
        else if (!neg) positive.push(polygon);
        else if (!pos) negative.push(polygon);
        else {
          const a=[], b=[];
          for (let i=0;i<points.length;i++) {
            const j=(i+1)%points.length, d=distances[i], e=distances[j];
            if (d>=-epsilon) a.push(points[i]);
            if (d<=epsilon) b.push(points[i]);
            if ((d>epsilon && e< -epsilon) || (d< -epsilon && e>epsilon)) {
              const p = points[i].map((v,k) => v+(points[j][k]-v)*d/(d-e));
              a.push(p);
              b.push(p);
            }
          }
          if (a.length>=3) positive.push({...polygon,points:a});
          if (b.length>=3) negative.push({...polygon,points:b});
        }
      }
      const facing = dot(pivot.normal,eye)>0;
      orderFraming(facing ? negative : positive,output,eye);
      output.push(...coplanar);
      orderFraming(facing ? positive : negative,output,eye);
    }

    const wallPosts = (start,end,op) => posts(start,end,op,studWidth,studSpacing);

    function drawWallFrame(at, start, end, top, op) {
      const members = wallMembers(start,end,top,op,studWidth,studSpacing);
      const height = (fn,u) => clippedHeight(top,fn,u);
      if (visible('studs')) for (const {a,b,low,high,kind} of members) {
        const al = height(low,a), bl = height(low,b);
        const ah = Math.max(al,height(high,a)), bh = Math.max(bl,height(high,b));
        if (ah === al && bh === bl) continue;
        const quad = (d) => [at(a,d,al),at(b,d,bl),at(b,d,bh),at(a,d,ah)];
        const outer = quad(0);
        const attrs = {'data-layer':'studs'};
        if (iso) timberPrism(outer,quad(core),kind,'#d9ab76',attrs);
        else lumber(outer,kind,'#d9ab76',attrs);
      }
      if (visible('cavity')) {
        members.push({a:op.start,b:op.end,low:() => op.bottom,high:() => op.top});
        const cuts = [...new Set([start,end,...members.flatMap(({a,b}) => [a,b])])].sort((a,b) => a-b);
        for (let i=1;i<cuts.length;i++) {
          const a = cuts[i-1], b = cuts[i], mid = (a+b)/2;
          const stack = members.filter(m => m.a < mid && m.b > mid)
            .sort((p,q) => height(p.low,mid)-height(q.low,mid));
          let al = 0, bl = 0;
          for (const {low,high} of [...stack,{low:top,high:top}]) {
            const ah = Math.max(al,height(low,a)), bh = Math.max(bl,height(low,b));
            if (ah > al || bh > bl) {
              const d = Math.min(1,core/2);
              face([at(a,d,al),at(b,d,bl),at(b,d,bh),at(a,d,ah)],wallColour.cavity,
                {class:'face insulation-bay','data-layer':'cavity'});
            }
            al = Math.max(ah,height(high,a));
            bl = Math.max(bh,height(high,b));
          }
        }
      }
    }

    function drawRafters() {
      const starts = rafterStarts(roofWidth,doorSideOverhang,rafterWidth,rafterSpacing);
      const y = L+F;
      const top = (x) => [[x,0,R+roofDepth],[x+rafterWidth,0,R+roofDepth],[x+rafterWidth,y,E+roofDepth],[x,y,E+roofDepth]];
      if (!plan && !iso && !front) {
        const x = side === 'left' ? roofLeft : roofRight;
        lumber([[x,0,R],[x,y,E],[x,y,E+roofDepth],[x,0,R+roofDepth]],'rafter');
        return;
      }
      for (const x of starts.reverse()) {
        const t = top(x);
        if (iso) {
          timberPrism(t,t.map(([u,v,z]) => [u,v,z-roofDepth]),'rafter','#efc693');
          continue;
        }
        if (plan) {
          lumber(t,'rafter','#e8bd89',{'fill-opacity':'.35'});
          continue;
        }
        lumber(t,'rafter','#efc693');
        lumber([[x,y,E],[x+rafterWidth,y,E],t[2],t[3]],'rafter-end');
      }
    }

    function wallStrip(at, start, end, top, base, openings) {
      return function strip(a, b, low, high, fill, kind, opacity = 1, layer) {
        a = Math.max(start,a);
        b = Math.min(end,b);
        low = Math.max(base,low);
        if (b <= a || high <= low) return;
        const cuts = [a,b];
        for (const {start, end, bottom, top} of openings) {
          if (bottom >= high || top <= low) continue;
          if (start > a && start < b) cuts.push(start);
          if (end > a && end < b) cuts.push(end);
        }
        cuts.sort((x,y) => x-y);
        for (let i=1;i<cuts.length;i++) {
          const x = cuts[i-1], y = cuts[i];
          if (y <= x) continue;
          const holes = openings.filter(op => op.start < y && op.end > x)
            .sort((p,q) => p.bottom-q.bottom);
          let z = low;
          for (const hole of holes) {
            patch(z,Math.min(high,hole.bottom));
            z = Math.max(z,hole.top);
          }
          patch(z,high);
          function patch(bottom, ceiling) {
            if (ceiling <= bottom || top(x) <= bottom) return;
            const roofFall = top(x)-top(y);
            const clippedY = top(y) < bottom ? x+(y-x)*(top(x)-bottom)/roofFall : y;
            const upper = [x,clippedY];
            if (top(x) > ceiling && top(clippedY) < ceiling) {
              upper.splice(1,0,x+(y-x)*(top(x)-ceiling)/roofFall);
            }
            face([at(x,bottom),at(clippedY,bottom),...upper.reverse().map(u => at(u,Math.min(ceiling,top(u))))],
              fill,{class:`cladding-facet ${kind}`,'fill-opacity':opacity,...(layer && {'data-layer':layer})});
          }
        }
      };
    }

    function houseCladding(at, start, end, top, bottom, openings) {
      const strip = wallStrip(at,start,end,top,bottom,openings);
      const high = top(start);
      const pitch = claddingSpacing;
      const halfCover = pitch*.27;
      const edge = Math.min(22,pitch*.08);
      for (let i=Math.floor(start/pitch);i*pitch-halfCover<end;i++) {
        const centre = i*pitch;
        const a = centre-halfCover, b = centre+halfCover;
        strip(a,b,bottom,high,i%3 ? '#fff7df' : '#f8dead','cladding-cover',.28);
        strip(a,a+edge,bottom,high,'#fff7e2','cladding-highlight',.62);
        strip(b-edge/2,b,bottom,high,'#795a35','cladding-return',.28);
        strip(b,b+edge,bottom,high,'#64492d','cladding-shadow',.27);
        strip(b+pitch*.15,b+pitch*.17,bottom,high,'#754e2c','cladding-grain',.14);
        strip(a,b,bottom,bottom+12,'#745430','cladding-drip',.5);
      }
    }

    function foundation(at, end, slabColor) {
      face([at(0,slabBase),at(end,slabBase),at(end,0),at(0,0)], slabColor, {class:'face slab-edge'});
    }

    function drawEntryStep() {
      if (view === 'right') return;
      const a = Math.max(0,door.start-100), b = Math.min(L,door.end+100);
      const tread = slabBase/2, outer = -300;
      const top = [[outer,a,tread],[outer,b,tread],[0,b,tread],[0,a,tread]];
      if (iso || view === 'left') {
        face([[outer,a,slabBase],[outer,b,slabBase],top[1],top[0]],'#9ba59a',{class:'face step-riser'});
      }
      if (iso || front) {
        face([[outer,b,slabBase],[0,b,slabBase],top[2],top[1]],'#9ba59a',{class:'face step-riser'});
      }
      if (iso || plan) face(top,'#c7cfc2',{class:'face step-tread'});
    }

    function drawGutter() {
      const y = L+F, lip = E+roofDepth;
      const back = y-20, edge = y+110;
      const bottom = Math.max(0,lip-100);
      const at = (x,u,z) => [x,u,z];
      const left = roofLeft, right = roofRight;
      const outlet = W;
      if (!plan) {
        const elbow = Math.max(0,bottom-200);
        const points = [at(outlet,y+55,bottom),at(outlet,y+55,elbow),
          at(outlet,L+35,Math.max(0,elbow-90)),at(outlet,L+35,35),at(outlet,L+85,15)];
        for (let i=1;i<points.length;i++) line(points[i-1],points[i],'downspout-outline');
        for (let i=1;i<points.length;i++) line(points[i-1],points[i],'downspout');
      }

      if (iso || front || plan) {
        if (iso || plan) face([at(left,back,lip),at(right,back,lip),at(right,edge,lip),at(left,edge,lip)],
          '#fff',{class:'face eave-gutter'});
        if (!plan) face([at(left,edge,lip),at(right,edge,lip),at(right,edge-25,bottom),at(left,edge-25,bottom)],
          '#f3f5f5',{class:'face eave-gutter'});
      } else {
        face([at(0,back,lip),at(0,edge,lip),at(0,edge-25,bottom),at(0,back+20,bottom)],
          '#f3f5f5',{class:'face eave-gutter'});
      }
    }

    function drawTiles() {
      const start = roofLeft, end = roofRight, eaveY = L+F;
      const count = Math.round((end-start)/tileWidth);
      const courses = Math.ceil(eaveY/tileRun);
      const elevation = !iso && !front;
      if (elevation ? courses > 80 : count > 65 || (iso && count*courses > 1800)) {
        note([W/2,eaveY/2,R+roofDepth-slope*eaveY/2],'Tile profiles too dense to show',-10);
        return;
      }
      const at = (x,y,h) => [x,y,R+roofDepth-slope*y+h];
      if (elevation) {
        const x = side === 'left' ? start : end;
        for (let row=0; row<courses; row++) {
          const b = eaveY-row*tileRun;
          const a = Math.max(0,b-tileRun);
          const shoulder = b-Math.min((b-a)*.22,55);
          face([at(x,a,0),at(x,b,0),at(x,b,tileRise),at(x,shoulder,tileRise),at(x,a,tileRise*.6)],
            tileEdgeTones[row%2],{class:'face tile-course-side'});
        }
        return;
      }
      const tones = tileTones;
      const waves = tileSystems[tileWidth].waves;
      const facets = tones.length*waves;
      const strips = [];
      for (let tile=0; tile<count; tile++) {
        const x = start+tile*tileWidth;
        const profile = (u) => tileRise*Math.abs(Math.sin(Math.PI*waves*(u-x)/tileWidth));
        for (let i=0; i<facets; i++) {
          const a = x+tileWidth*i/facets;
          const b = x+tileWidth*(i+1)/facets;
          strips.push({a,b,h1:profile(a),h2:profile(b),tone:tones[i%tones.length]});
        }
      }
      if (iso) {
        for (const {a,b,h1,h2,tone} of [...strips].reverse()) {
          face([at(a,0,h1),at(b,0,h2),at(b,eaveY,h2),at(a,eaveY,h1)],tone,{class:'tile-facet'});
        }
        for (let row=1; row<courses; row++) {
          const y = eaveY-row*tileRun;
          const points = [at(strips[0].a,y,strips[0].h1),...strips.map(({b,h2})=>at(b,y,h2))];
          shapes.push(['polyline',points,{class:'tile-joint'}]);
        }
      }
      for (const {a,b,h1,h2,tone} of strips) {
        face([at(a,eaveY,0),at(b,eaveY,0),at(b,eaveY,h2),at(a,eaveY,h1)],tone,{class:'tile-facet tile-profile'});
      }
    }

    function drawRoofCovering() {
      if (material === 'tiles') {
        drawTiles();
        return;
      }
      const span = roofWidth;
      const spacing = Math.max(350,span/120);
      for (let x=roofLeft+spacing;x<roofRight;x+=spacing) {
        line(roofAt(x,0,8),roofAt(x,L+F,8),'roof-standing-seam');
        if (pitch < 14 && x+10 < roofRight) {
          line(roofAt(x+10,0,9),roofAt(x+10,L+F,9),'roof-standing-seam');
        }
      }
    }

    function drawRoofEdgeDetails() {
      const start=roofLeft, end=roofRight, eave=L+F;
      const metal='#555b5c';
      face([
        roofAt(start,eave-35,-10),roofAt(end,eave-35,-10),
        roofAt(end,eave,-10),roofAt(start,eave,-10)
      ],metal,{class:'face roof-eave-flashing'});
      face([
        roofAt(start,0,-10),roofAt(start+22,0,-10),
        roofAt(start+22,eave,-10),roofAt(start,eave,-10)
      ],metal,{class:'face roof-verge-flashing'});
      face([
        roofAt(end-22,0,-10),roofAt(end,0,-10),
        roofAt(end,eave,-10),roofAt(end-22,eave,-10)
      ],metal,{class:'face roof-verge-flashing'});
      face([
        roofAt(start,0,-10),roofAt(end,0,-10),
        roofAt(end,30,-10),roofAt(start,30,-10)
      ],metal,{class:'face roof-abutment-flashing'});
      for (const x of rafterStarts(roofWidth,doorSideOverhang,rafterWidth,rafterSpacing)) {
        face([
          roofAt(x,eave,-roofDepth+10),roofAt(x+rafterWidth,eave,-roofDepth+10),
          roofAt(x+rafterWidth,eave,-10),roofAt(x,eave,-10)
        ],'#c18a5f',{class:'face roof-rafter-tail'});
      }
      line(roofAt(start,0,-15),roofAt(start,eave,-15),'roof-bargeboard');
      line(roofAt(start+25,0,-18),roofAt(start+25,eave,-18),'roof-bargeboard-secondary');
      line(roofAt(end,0,-15),roofAt(end,eave,-15),'roof-bargeboard');
      line(roofAt(end-25,0,-18),roofAt(end-25,eave,-18),'roof-bargeboard-secondary');
      line(roofAt(start,eave,-15),roofAt(end,eave,-15),'roof-eave-fascia');
      line(roofAt(start,0,-20),roofAt(end,0,-20),'roof-underlayment-edge');
    }

    function drawPiers() {
      const pier = (points) => face(points,footingColor,{class:'face pier'});
      const ring = (x,y,z,start,turn,steps) => Array.from({length:steps+1},(_,i) => {
        const angle = start+turn*i/steps;
        return [x+pierRadius*Math.cos(angle),y+pierRadius*Math.sin(angle),z];
      });
      if (iso || plan) {
        const centres = pierColumns.flatMap(x => pierRows.map(y => [x,y]));
        centres.sort(([x,y],[a,b]) => (y-x)-(b-a));
        for (const [x,y] of centres) {
          if (plan) {
            pier(ring(x,y,slabBase,0,2*Math.PI,36));
          } else {
            // The near half of the base traces the rounded edge visible beneath the slab.
            const base = ring(x,y,footingBase,Math.PI/4,Math.PI,18);
            const top = base.map(([u,v]) => [u,v,slabBase]);
            pier([top[0],...base,top[top.length-1],...top.slice(1,-1).reverse()]);
          }
        }
      } else {
        const at = front ? frontAt : sideAt(side === 'left' ? 0 : W);
        for (const u of front ? pierColumns : pierRows) {
          const a = u-pierRadius, b = u+pierRadius;
          pier([at(a,footingBase),at(b,footingBase),at(b,slabBase),at(a,slabBase)]);
        }
      }
    }

    function drawHouseFacade() {
      const section = (u,d,z) => [u,-d,z];
      const baseSection = (u,d,z) => [u,-houseBaseRecession-d,z];
      const facade = {start:houseA,end:houseB,top:() => houseWallHeight};
      if (houseBaseHeight > 0) {
        face([houseBaseAt(houseA,slabBase),houseBaseAt(houseB,slabBase),houseBaseAt(houseB,houseBaseTop),houseBaseAt(houseA,houseBaseTop)],
          houseBaseColor,{class:'face house-concrete-base'});
        if (houseBaseRecession > 0) {
          face([houseBaseAt(houseA,houseBaseTop),houseBaseAt(houseB,houseBaseTop),
            houseAt(houseB,houseBaseTop),houseAt(houseA,houseBaseTop)],
          '#c5c6b8',{class:'face house-base-reveal'});
          face([houseBaseAt(houseA,slabBase),houseBaseAt(houseA,houseBaseTop),
            houseAt(houseA,houseBaseTop),houseAt(houseA,slabBase)],
          '#b9bbb2',{class:'face house-base-return'});
          face([houseBaseAt(houseB,slabBase),houseAt(houseB,slabBase),
            houseAt(houseB,houseBaseTop),houseBaseAt(houseB,houseBaseTop)],
          '#b9bbb2',{class:'face house-base-return'});
        }
      }
      face([houseAt(houseA,houseBaseTop),houseAt(houseB,houseBaseTop),houseAt(houseB,houseWallHeight),houseAt(houseA,houseWallHeight)],
        houseColor,{class:'face house-facade'});
      houseCladding(houseAt,houseA,houseB,() => houseWallHeight,houseBaseTop,
        houseOpenings.map(w => ({start:w.left,end:w.right,bottom:w.sill,top:w.head})));
      if (houseBaseHeight > 0) {
        for (const w of basementOpenings) {
          drawWindow(face,baseSection,{start:w.left,end:w.right,
            bottom:slabBase+w.sill,top:slabBase+w.head},facade,
          {key:w.key,pattern:'cross',thickness:145,trim:0,flashing:false});
        }
      }
      for (const w of houseOpenings) {
        drawWindow(face,section,{start:w.left,end:w.right,bottom:w.sill,top:w.head},facade,
          {key:w.key,pattern:'cross',thickness:145,trim:95,trimColour:'#f5efe1'});
      }
      note(houseAt(houseA,houseWallHeight),'Existing house',-9,'start');
    }

    function drawSideWallBasementJunction(which) {
      if (!sideElevation || houseBaseRecession <= 0 || houseBaseHeight <= 0 ||
        (!visible('cover') && !visible('studs'))) return;
      const x = which === 'left' ? 0 : W;
      const at = (y,z) => [x,y,z];
      const foundationTop = Math.min(0,houseBaseTop);
      if (foundationTop > slabBase) {
        face([
          at(-houseBaseRecession,slabBase),at(0,slabBase),
          at(0,foundationTop),at(-houseBaseRecession,foundationTop)
        ],'#8e9b92',{class:'face side-wall-basement-junction','data-layer':'cover'});
      }
      const wallBottom = Math.max(0,slabBase);
      if (houseBaseTop > wallBottom) {
        face([
          at(-houseBaseRecession,wallBottom),at(0,wallBottom),
          at(0,houseBaseTop),at(-houseBaseRecession,houseBaseTop)
        ],visible('cover') ? wallColour.cover : wallColour.studs,
        {class:'face side-wall-basement-junction','data-layer':visible('cover') ? 'cover' : 'studs'});
      }
      line(at(-houseBaseRecession,slabBase),at(-houseBaseRecession,houseBaseTop),
        'face',{'data-layer':'cover'});
    }

    function doorTrim(at, key, op, wallLength, wallTop) {
      const width = latest.trimWidth;
      if (!width) return;
      const start = Math.max(0,op.start-width), end = Math.min(wallLength,op.end+width);
      const high = op.top+width;
      const colour = trimColour.value;
      function board(a,b,base,top) {
        if (b <= a) return;
        const inner = [a,b];
        if (wallTop(a)>top && wallTop(b)<top) {
          inner.splice(1,0,a+(b-a)*(wallTop(a)-top)/(wallTop(a)-wallTop(b)));
        }
        const point = (u,z) => at(u,Math.min(z,wallTop(u)));
        if (Math.min(top,wallTop(a))<=base) return;
        const points = [point(a,base),point(b,base),...inner.reverse().map(u => point(u,top))];
        const normal = plane(points);
        if (normal) doorTrimFaces.push({points,original:points,normal,offset:dot(normal,points[0]),
          attrs:{fill:colour,class:'face opening-trim','data-trim':key,'data-layer':'trim'}});
      }
      board(start,op.start,op.bottom,op.top);
      board(op.end,end,op.bottom,op.top);
      board(start,end,op.top,high);
    }

    const wallCourses = (key,end) => courses(key,end,claddingSpacing,baseBoardWidth,coverBoardWidth);

    function drawWall(section, length, top, op, name) {
      const isSide = name !== 'front';
      for (const [key] of [...wallLayers].reverse()) {
        if (!visible(key) || key === 'trim' || key === 'cavity') continue;
        const [depth] = bands[key];
        const at = (u,z) => section(u,depth,z);
        if (key === 'studs') {
          drawWallFrame((u,d,z) => section(u,depth+d,z),0,isSide ? length-T : length,top,op);
          continue;
        }
        const end = isSide ? length-depth : length;
        const strip = wallStrip(at,0,end,top,0,[op]);
        const cladding = key === 'cover' || key === 'base';
        const low = cladding ? Math.max(0,slabBase+200) : 0;
        const high = top(0);
        const paint = (a,b,l,h,fill = wallColour[key],part = 'wall-layer',alpha = 1) =>
          strip(a,b,l,h,fill,part,alpha,key);
        if (cladding || key === 'counter') {
          if (key === 'base') paint(0,end,0,low,'#abb0a0','cladding-plinth');
          const courses = wallCourses(key,end);
          if (key === 'base') {
            courses.unshift([0,claddingSpacing*.19]);
            courses.push([end-claddingSpacing*.19,end]);
          }
          for (const [a,b] of courses) {
            paint(a,b,low,high,wallColour[key],`cladding-${key}`);
            if (!cladding) continue;
            const edge = Math.min(13,(b-a)*.2);
            paint(a,a+edge,low,high,'#fff2d6','cladding-highlight',.62);
            paint(b-edge,b,low,high,'#785938','cladding-return',.40);
            paint(a+(b-a)*.58,a+(b-a)*.63,low,high,'#754e2c','cladding-grain',.14);
            paint(a,b,low,low+12,'#745430','cladding-drip',.5);
          }
        } else if (['nailers','service','serviceFill'].includes(key)) {
          const battenWidth = key === 'nailers' ? 48 : 70;
          for (let z=0;z<high;z+=600) {
            paint(0,end,z+(key === 'serviceFill' ? battenWidth : 0),key === 'serviceFill' ? z+600 : z+battenWidth);
          }
        } else {
          paint(0,end,0,high);
          if (key === 'wind' || key === 'osb' || key === 'gypsum') {
            for (let u=1200;u<end;u+=1200) paint(u,u+7,0,high,'#394735','sheet-joint',.30);
          }
        }
      }
      if (!visible('studs') && visible('cavity')) {
        drawWallFrame((u,d,z) => section(u,bands.studs[0]+d,z),0,isSide ? length-T : length,top,op);
      }
      const at = (u,z) => section(u,0,z);
      if (name === 'door') {
        if (visible('trim')) doorTrim(at,name,op,length,top);
        face([at(op.start,0),at(op.end,0),at(op.end,op.top),at(op.start,op.top)],
          'none',{class:'face door-opening'});
      } else {
        if (timberOnly) {
          face([at(op.start,op.bottom),at(op.end,op.bottom),at(op.end,op.top),at(op.start,op.top)],
            'none',{class:'face opening-guide window-opening'});
        } else {
          drawWindow(face,section,op,{start:0,end:length,top},{
            key:name,pattern:windowMuntins[name].value,thickness:T,
            trim:visible('trim') ? latest.trimWidth : 0,trimColour:trimColour.value
          });
        }
      }
    }

    function planWall(at, end, opening, keyForTrim) {
      const isDoor = keyForTrim === 'door';
      const spans = [[0,opening.start],[opening.end,end]];
      const posts = wallPosts(0,end,opening);
      function part(key,a,b,d,e) {
        for (const [start,finish] of spans) {
          const lo = Math.max(a,start), hi = Math.min(b,finish);
          if (hi > lo) face([at(lo,d),at(hi,d),at(hi,e),at(lo,e)],wallColour[key],
            {class:'cladding-facet wall-plan','data-layer':key});
        }
      }
      for (const [key] of wallLayers) {
        if (!visible(key) || key === 'trim') continue;
        const [d,e] = bands[key];
        if (key === 'cover' || key === 'base' || key === 'counter') {
          for (const [a,b] of wallCourses(key,end)) part(key,a,b,d,e);
        } else if (key === 'studs') {
          for (const [a,b] of posts) part(key,a,b,d,e);
        } else if (key === 'cavity') {
          let a = 0;
          for (const [b,c] of posts) {
            part(key,a,b,d,e);
            a = c;
          }
          part(key,a,end,d,e);
        } else {
          const middle = (d+e)/2;
          part(key,0,end,key === 'serviceFill' && visible('service') ? middle : d,
            key === 'service' && visible('serviceFill') ? middle : e);
        }
      }
      if (visible('trim')) {
        const width = latest.trimWidth;
        for (const [edge,dir] of [[opening.start,-1],[opening.end,1]]) {
          const u = Math.max(0,Math.min(end,edge+dir*width));
          if (u !== edge) line(at(edge,0),at(u,0),'opening-trim',
            {'data-layer':'trim',stroke:trimColour.value,'stroke-width':3});
        }
      }
      if (isDoor || timberOnly) {
        line(at(opening.start,T/2),at(opening.end,T/2),isDoor ? 'door-opening' : 'window-opening',
          {style:'stroke:#9a693c;stroke-width:2;stroke-dasharray:4 4'});
        return;
      }
      const {gap,setBack,jamb,rim,glassDepth} = windowProfile(opening,T);
      const l = opening.start+gap, r = opening.end-gap;
      const partWindow = (a,b,d,e,fill,part) => face([at(a,d),at(b,d),at(b,e),at(a,e)],fill,
        {class:`window-detail window-${part}`, 'data-window':keyForTrim, 'data-window-part':part});
      partWindow(l,l+rim,setBack,setBack+jamb,'#ecebe0','frame');
      partWindow(r-rim,r,setBack,setBack+jamb,'#ecebe0','frame');
      partWindow(l+rim,r-rim,setBack,glassDepth,glassColor,'glass');
      const extension = sillExtension(opening.end-opening.start);
      partWindow(Math.max(0,opening.start-extension),Math.min(end,opening.end+extension),-sillProjection,0,'#aebec1','sill');
    }

    function drawHedge() {
      const points = (profile) => profile.map(([offset,height]) =>
        [0,hedgeDistance+offset*hedgeHalfDepth,slabBase+hedgeHeight*height]);
      face(points([
        [-1,0],[-1,.89],[-.97,.95],[-.88,.98],[-.62,.99],[-.4,.98],
        [-.2,1],[.18,1],[.42,.98],[.68,.99],[.89,.97],[.97,.94],[1,.88],[1,0]
      ]),'#617c4d',{class:'face hedge-bush'});
      face(points([
        [-.83,.77],[-.7,.89],[-.38,.93],[-.08,.91],[.22,.95],[.62,.92],[.83,.77],
        [.48,.8],[.13,.77],[-.22,.81],[-.52,.75]
      ]),'#789363',{class:'hedge-highlight'});
    }

    function drawHedgePlanting() {
      const plantScale = 1.2;
      const plant = (centre, profile, colour, kind) => face(
        profile.map(([offset,height]) =>
          [0,hedgeDistance-hedgeHalfDepth-centre+offset*plantScale,slabBase+height*plantScale]),
        colour,{class:`hedge-plant ${kind}`});
      for (const [centre,size] of [[200,.85],[460,1]]) {
        for (const [reach,height,colour] of [
          [-170,176,'#416c45'],[-112,267,'#518052'],[-32,310,'#648d52'],
          [84,260,'#527949'],[162,192,'#3f6840']
        ]) {
          plant(centre,[
            [0,0],[reach*.18-10,height*.49],[reach*.45-19,height*.72],
            [reach*.6-16,height*.91],[reach,height],[reach*.78+15,height*.79],
            [reach*.52+18,height*.62],[reach*.27+10,height*.33]
          ].map(([x,z]) => [x*size,z*size]),colour,'fern-frond');
        }
      }
      for (const [centre,height,colour] of [
        [70,156,'#e1bd60'],[110,205,'#c484ad'],[310,170,'#e1bd60'],[365,145,'#b586b8'],[550,196,'#c484ad']
      ]) {
        plant(centre,[[0,0],[-4,height], [4,height],[7,0]],'#496c40','flower-stem');
        plant(centre,[[2,height*.32],[34,height*.55],[18,height*.34]],'#5d894e','flower-leaf');
        plant(centre,Array.from({length:20},(_,i) => {
          const angle = 2*Math.PI*i/20;
          const radius = i%4 === 2 ? 14 : 32;
          return [radius*Math.cos(angle),height+radius*Math.sin(angle)];
        }),colour,'flower-bloom');
      }
    }

    if (!groundHidden) {
      if (iso || plan) face(grade,'#d7e1ce',{class:'face ground-plane'});
      else if (front) line(frontAt(-gradeMargin,slabBase),frontAt(W+gradeMargin,slabBase),'ground-line');
      else line([0,0,slabBase],[0,sideGradeEnd,slabBase],'ground-line');
    }
    function orderScene(start) {
      if (!iso) return;
      const polygons = shapes.splice(start).flatMap(([,points,attrs]) => {
        const normal = plane(points);
        return normal ? [{points,original:points,attrs,normal,offset:dot(normal,points[0])}] : [];
      });
      const ordered = [];
      orderFraming(polygons,ordered);
      for (const {points,original,attrs} of ordered) shapes.push(['polygon',points,attrs,original]);
    }

    if (plan) {
      const planA = Math.max(houseA,-planMargin), planB = Math.min(houseB,W+planMargin);
      face([ground(planA,-Math.min(520,L*.22)),ground(planB,-Math.min(520,L*.22)),ground(planB,0),ground(planA,0)], houseColor);
      face(slab, '#f8f6e8');
      if (groundHidden) drawPiers();
      if (roofTiles || roofFraming) face(roof,'none',{style:`stroke:${roofPaint}`,'stroke-dasharray':'7 5'});
      planWall((u,d) => ground(d,u),L-T,door,'door');
      planWall((u,d) => ground(W-d,u),L-T,windows.right,'right');
      planWall((u,d) => ground(u,L-d),W,windows.front,'front');
      drawEntryStep();
      if (roofFraming) drawRafters();
      if (roofTiles) drawGutter();
      shapes.push(['door-leaf', []]);
      note(ground(W/2,-Math.min(260,L*.11)),'Existing house',-7);
      note(ground(T,(door.start+door.end)/2),'Left door',-9,'start');
      dimension(ground(0,L+F), ground(W,L+F), [0,35], mm(W));
      dimension(ground(roofLeft,0), ground(roofLeft,L), [-43,0], mm(L));
    } else {
      if (iso || front) drawHouseFacade();
      if (groundHidden) drawPiers();
      const wallScene = shapes.length;
      if (iso) {
        face(slab,'#e1e6de');
        drawWall(sideSection('right'),L,wallTop,windows.right,'right');
      }
      if (iso || front) {
        foundation(frontAt,W,'#aab4aa');
        drawWall(frontSection,W,frontTop,windows.front,'front');
        const baseline = groundHidden ? footingBase : slabBase;
        dimension(frontAt(0,baseline),frontAt(W,baseline),[0,38],mm(W));
      }
      if (iso || !front) {
        if (!iso) {
          if (houseBaseHeight > 0) {
            line([0,-houseBaseRecession,slabBase],[0,-houseBaseRecession,houseBaseTop],
              'house-concrete-base',{stroke:houseBaseColor,'stroke-width':3});
            if (houseBaseRecession > 0) {
              line([0,-houseBaseRecession,slabBase],[0,0,slabBase],
                'house-concrete-base',{stroke:houseBaseColor,'stroke-width':3});
              line([0,-houseBaseRecession,houseBaseTop],[0,0,houseBaseTop],
                'house-base-reveal',{stroke:'#858b81','stroke-width':2});
            }
          }
          line([0,0,houseBaseTop],[0,0,houseWallHeight],'face',
            {style:'stroke:#778a7b;stroke-width:2;stroke-dasharray:5 4'});
          note([0,0,houseWallHeight],'House wall',-9);
        }
        foundation(sideAt(side === 'right' ? W : 0),L,'#8e9b92');
        drawWall(sideSection(side),L,wallTop,side === 'left' ? door : windows.right,side === 'left' ? 'door' : 'right');
        const x = side === 'right' ? W : 0;
        const baseline = groundHidden ? footingBase : slabBase;
        dimension([x,0,baseline],[x,L,baseline],[0,38],mm(L));
      }
      if (sideElevation) drawSideWallBasementJunction(side);
      orderScene(wallScene);
      if (doorVisible) shapes.push(['door-leaf', []]);
      drawEntryStep();
      if (roofFraming) {
        const rafters = shapes.length;
        drawRafters();
        orderScene(rafters);
      } else if (roofTiles && (iso || front)) {
        if (iso) face([roof[0],roof[3],[roofLeft,L+F,E],[roofLeft,0,R]],material==='tiles' ? tileEdgeTones[0] : roofPaint);
        face(roof,roofPaint,{class:'face roof-covering'});
        face([roof[2],roof[3],[roofLeft,L+F,E],[roofRight,L+F,E]],material==='tiles' ? tileEdgeTones[0] : roofPaint);
        drawRoofCovering();
        drawRoofEdgeDetails();
      }
      if (!iso && !front) {
        if (roofTiles) {
          face([[0,0,R],[0,L+F,E],[0,L+F,E+roofDepth],[0,0,R+roofDepth]],roofPaint);
          drawRoofCovering();
          drawRoofEdgeDetails();
        }
        if (roofTiles || roofFraming) {
          note([0,(L+F)/2,(R+E)/2+roofDepth+(roofTiles&&material==='tiles' ? tileRise : 0)],`${fmt(pitch)}\u00b0 pitch`,-13);
        }
      }
      if (roofTiles) drawGutter();
      if (sideElevation) {
        drawHedge();
        drawHedgePlanting();
      }
      if (front) dimension(frontAt(0,0),frontAt(0,H),[-43,0],mm(H));
    }

    const bounds = [...shapes.flatMap(([,points]) => points),...roof];
    if (iso || plan) bounds.push(...grade);
    else if (front) bounds.push(frontAt(-gradeMargin,slabBase),frontAt(W+gradeMargin,slabBase));
    else bounds.push([0,sideGradeEnd,slabBase]);
    if (!plan) bounds.push([0,0,footingBase],[W,L,footingBase],[0,L,footingBase]);
    if (doorVisible) {
      for (let i=0;i<=24;i++) {
        for (const distance of [0,doorWidth]) for (const depth of [0,doorThickness]) {
          for (const height of [0,doorHeight]) bounds.push(doorPoint(i*Math.PI/48,distance,depth,height));
        }
      }
    }
    const unscaled = bounds.map(raw);
    const xs = unscaled.map(([x]) => x), ys = unscaled.map(([,y]) => y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const scale = Math.min(620/Math.max(1,maxX-minX), 375/Math.max(1,maxY-minY));
    const project = (point) => {
      const [x,y] = raw(point);
      return [410 + (x-(minX+maxX)/2)*scale, 246 + (y-(minY+maxY)/2)*scale];
    };
    const ns = 'http://www.w3.org/2000/svg';
    const group = document.createDocumentFragment();
    const layer = document.createElementNS(ns,'g');
    layer.setAttribute('class','drawing-layer');
    function node(tag, attrs, text, parent = layer) {
      const el = document.createElementNS(ns,tag);
      for (const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
      if (text !== undefined) el.textContent = text;
      parent.append(el);
      return el;
    }
    function stroke(a,b,attrs,parent = layer) {
      node('line',{ x1:a[0],y1:a[1],x2:b[0],y2:b[1],...attrs },undefined,parent);
    }
    function measurementSpecs(section) {
      const m = (key,label,a,b,visible = true,value = latest[key],gap = [0,-12]) =>
        ({key,label,a,b,visible,value,gap,vertical:a[2] !== b[2] && a[0] === b[0] && a[1] === b[1]});
      const left = view === 'left', right = view === 'right';
      const onFacade = iso || front;
      const x = pierColumns[0], y = pierRows[pierRows.length-1];
      switch (section) {
        case 'slab': return [
          m('width','Slab width',[0,L,0],[W,L,0],iso||front||plan, W,[0,16]),
          m('length','Slab length',[0,0,0],[0,L,0],!front,L,plan?[-15,0]:[0,28]),
          m('slabThickness','Slab thickness',[0,L,slabBase],[0,L,0],!plan,slabThickness,[-16,0])
        ];
        case 'footings': return [
          m('footingDiameter','Pier diameter',front||plan ? [x-pierRadius,y,slabBase] : [x,y-pierRadius,slabBase],
            front||plan ? [x+pierRadius,y,slabBase] : [x,y+pierRadius,slabBase],groundHidden),
          m('footingDepth','Pier depth',[x,y,footingBase],[x,y,slabBase],groundHidden&&!plan,footingDepth,[-12,0])
        ];
        case 'door': return [
          m('doorWidth','Door width',[0,door.start,0],[0,door.end,0],doorVisible),
          m('doorHeight','Door height',[0,door.start,0],[0,door.start,door.top],iso||left,doorHeight,[-14,0]),
          m('doorThickness','Leaf thickness',[0,hingeY,door.top],[doorThickness,hingeY,door.top],plan||iso,doorThickness),
          m('offset','Offset from house',[0,0,0],[0,door.start,0],doorVisible,offset,[0,12]),
          m('trimWidth','Trim width',[0,door.start-latest.trimWidth,door.top/2],[0,door.start,door.top/2],
            visible('trim')&&(iso||left)&&latest.trimWidth<=door.start)
        ];
        case 'front':
        case 'right': {
          const w = windows[section], isFront = section === 'front';
          const at = isFront ? frontAt : sideAt(W);
          const usable = isFront ? onFacade : right;
          const top = isFront ? H : wallTop(w.end);
          return [
            m(section+'Width','Window width',at(w.start,w.top),at(w.end,w.top),usable||plan),
            m(section+'Height','Window height',at(w.start,w.bottom),at(w.start,w.top),usable,undefined,[-14,0]),
            m(section+'Bottom','Bottom clearance',at(w.end,0),at(w.end,w.bottom),usable,w.bottom,[12,0]),
            m(section+'Top','Top clearance',at(w.end,w.top),at(w.end,top),usable,top-w.top,[12,0]),
            m('trimWidth','Trim width',at(w.start-latest.trimWidth,(w.bottom+w.top)/2),
              at(w.start,(w.bottom+w.top)/2),visible('trim')&&usable&&latest.trimWidth<=w.start)
          ];
        }
        case 'trims': return measurementSpecs(left ? 'door' : right ? 'right' : 'front').filter(spec => spec.key === 'trimWidth');
        case 'walls': {
          const seam = (Math.floor(houseA/claddingSpacing)+1)*claddingSpacing;
          const guideZ = houseBaseTop+(houseWallHeight-houseBaseTop)*.85;
          return [
            m('wallThickness','Wall thickness',[0,L/2,0],[T,L/2,0],plan),
            m('claddingSpacing','Cover-board spacing',houseAt(seam,guideZ),
              houseAt(seam+claddingSpacing,guideZ),onFacade&&seam+claddingSpacing<houseB),
            m('frontWallHeight','Front wall height',[0,L,0],[0,L,H],!plan,H,[-25,0])
          ];
        }
        case 'studs': {
          const w = windows.front;
          const posts = wallPosts(0,W,w).filter(([a,b]) => a< w.start || b>w.end);
          const pair = posts.findIndex(([a,b],i) => i>0 &&
            Math.abs((a+b-posts[i-1][0]-posts[i-1][1])/2-studSpacing)<.001);
          const centre = ([a,b]) => (a+b)/2;
          const p = posts[0] || [0,studWidth], z = H*.4;
          const exposed = visible('studs')&&(plan||onFacade&&!['cover','base','wind','exterior'].some(visible));
          const at = (u,z) => frontSection(u,bands.studs[0],z);
          return [
            m('studSpacing','Stud centres',at(pair>0?centre(posts[pair-1]):0,z),
              at(pair>0?centre(posts[pair]):studSpacing,z),exposed&&pair>0),
            m('studWidth','Stud width',at(p[0],z),at(p[1],z),exposed&&p[1]-p[0]===studWidth),
            m('studDepth','Stud depth',at(p[0],z),frontSection(p[0],bands.studs[1],z),exposed&&!front&&core===studDepth)
          ];
        }
        case 'roof': return [
          { key:'pitch',label:'Roof pitch',value:pitch,angle:true },
          m('frontOverhang','Front overhang',[0,L,E+roofDepth],[0,L+F,E+roofDepth],!front),
          m('roofWidth','Total roof width',[roofLeft,L,E+roofDepth],[roofRight,L,E+roofDepth],onFacade||plan),
          m('doorSideOverhang','Door-side overhang',[0,L,E+roofDepth],[roofLeft,L,E+roofDepth],onFacade||plan),
          m('rightOverhang','Opposite overhang',[W,L,E+roofDepth],[roofRight,L,E+roofDepth],onFacade||plan,rightOverhang)
        ];
        case 'roofTiles': {
          const y = L+F, x = roofLeft, z = E+roofDepth;
          return [
            m('tileWidth','Tile covering width',[x,y,z],[x+tileWidth,y,z],roofTiles&&material==='tiles'&&onFacade&&tileWidth<=roofWidth),
            m('tileLength','Exposed tile length',[x,y,z],[x,y-tileRun,z+slope*tileRun],roofTiles&&material==='tiles'&&(iso||left||right)&&tileRun<=y),
            m('tileRise','Profile rise',[x+tileWidth/(2*tileSystems[tileWidth].waves),y,z],[x+tileWidth/(2*tileSystems[tileWidth].waves),y,z+tileRise],
              roofTiles&&material==='tiles'&&!plan&&tileWidth/2<=roofWidth,tileRise,[8,0])
          ];
        }
        case 'rafters': {
          const c = roofLeft+rafterWidth/2, z = E+roofDepth;
          const visible = roofFraming&&(onFacade||plan);
          const perpendicular = rafterDepth/Math.hypot(1,slope);
          const startY = (L+F)/2, startZ = R-slope*startY;
          return [
            m('rafterSpacing','Rafter centres',[c,L+F,z],[c+rafterSpacing,L+F,z],
              visible&&roofLeft+rafterSpacing+rafterWidth<=roofRight-rafterWidth),
            m('rafterWidth','Rafter width',[roofLeft,L+F,z],[roofLeft+rafterWidth,L+F,z],visible),
            m('rafterDepth','Rafter depth',[roofLeft,startY,startZ],
              [roofLeft,startY+slope*perpendicular,startZ+perpendicular],roofFraming&&(left||right),rafterDepth)
          ];
        }
        case 'houseWall': return [
          m('houseWallWidth','House wall width',houseAt(houseA,houseWallHeight),houseAt(houseB,houseWallHeight),onFacade),
          m('houseWallHeight','House wall height',houseAt(houseB,0),houseAt(houseB,houseWallHeight),onFacade,houseWallHeight,[15,0]),
          m('houseBaseHeight','Concrete base height',houseBaseAt(houseA,slabBase),
            houseBaseAt(houseA,houseBaseTop),onFacade,houseBaseHeight,[-15,0])
        ];
        case 'hedge': return [
          m('hedgeDistance','Distance from house',[0,0,slabBase],[0,hedgeDistance,slabBase],
            sideElevation,hedgeDistance,[0,17]),
          m('hedgeHeight','Hedge height',[0,hedgeDistance,slabBase],
            [0,hedgeDistance,slabBase+hedgeHeight],sideElevation,hedgeHeight,side==='left'?[20,0]:[-20,0])
        ];
        default: {
          const basement = basementOpenings.find(w => w.key===section);
          if (basement) {
            const centre = (basement.left+basement.right)/2;
            const sill = slabBase+basement.sill, head = slabBase+basement.head;
            return [
              m(section+'Width','Window width',houseBaseAt(basement.left,head),houseBaseAt(basement.right,head),onFacade),
              m(section+'Height','Window height',houseBaseAt(basement.left,sill),houseBaseAt(basement.left,head),onFacade,undefined,[-12,0]),
              m(section+'Offset','Horizontal offset',houseBaseAt(W/2,sill),houseBaseAt(centre,sill),onFacade,undefined,[0,13]),
              m(section+'Sill','Sill height',houseBaseAt(basement.right,slabBase),houseBaseAt(basement.right,sill),onFacade,undefined,[13,0])
            ];
          }
          const w = houseOpenings.find(w => w.key===section);
          if (!w) return [];
          const c = (w.left+w.right)/2;
          return [
            m(section+'Width','Window width',houseAt(w.left,w.head),houseAt(w.right,w.head),onFacade),
            m(section+'Height','Window height',houseAt(w.left,w.sill),houseAt(w.left,w.head),onFacade,undefined,[-12,0]),
            m(section+'Offset','Horizontal offset',houseAt(W/2,w.sill),houseAt(c,w.sill),onFacade,undefined,[0,13]),
            m(section+'Sill','Sill height',houseAt(w.right,0),houseAt(w.right,w.sill),onFacade,undefined,[13,0])
          ];
        }
      }
    }

    function drawMeasurements() {
      svg.querySelector('.measurement-guides')?.remove();
      if (!guideTimer) return;
      const specs = measurementSpecs(guideSection).filter(spec => !guideField || spec.key === guideField);
      if (!specs.length) return;
      const overlay = node('g',{class:'measurement-guides','aria-hidden':'true'},undefined,svg);
      const guide = (tag,attrs,text) => node(tag,attrs,text,overlay);
      function arrow([x,y],[u,v]) {
        const n = Math.hypot(u-x,v-y);
        const dx = (u-x)/n, dy = (v-y)/n;
        const tip = (a,b,dir) => `M${a+dx*dir*5-dy*3},${b+dy*dir*5+dx*3} L${a},${b} L${a+dx*dir*5+dy*3},${b+dy*dir*5-dx*3}`;
        guide('path',{class:'guide-arrow',d:`M${x},${y} L${u},${v} ${tip(x,y,1)} ${tip(u,v,-1)}`});
      }
      function badge(x,y,i) {
        guide('circle',{cx:x,cy:y,r:8,fill:'#8a3520'});
        guide('text',{x,y,class:'guide-number'},i+1);
      }
      const rows = specs.map((spec,i) => {
        if (!spec.visible) return {spec,i,inset:true};
        const zoomPoint = ([x,y]) => [x*zoom+zoomX,y*zoom+zoomY];
        const a = zoomPoint(project(spec.a)), b = zoomPoint(project(spec.b));
        const p = a.map((v,j) => v+spec.gap[j]), q = b.map((v,j) => v+spec.gap[j]);
        const d = Math.hypot(q[0]-p[0],q[1]-p[1]);
        if (d<17 || [p,q].some(([x,y]) => x<12||x>808||y<12||y>513)) return {spec,i,inset:true};
        guide('path',{class:'guide-arrow',opacity:'.45',d:`M${a.join(',')} L${p.join(',')} M${b.join(',')} L${q.join(',')}`});
        arrow(p,q);
        badge((p[0]+q[0])/2,(p[1]+q[1])/2,i);
        return {spec,i,inset:false};
      });
      guide('rect',{x:12,y:12,width:222,height:32+rows.length*24,rx:8,fill:'#fff8eb',stroke:'#c3917b'});
      guide('text',{x:25,y:33,class:'guide-key guide-title'},rows.some(row=>row.inset) ? 'Measurements · inset as needed' : 'Measurements');
      rows.forEach(({spec,i,inset}) => {
        const y = 53+i*24;
        if (!inset) badge(30,y-4,i);
        else if (spec.angle) {
          guide('path',{class:'guide-arrow',d:`M18,${y+4} H47 M18,${y+4} L44,${y-11} M31,${y+4} A13,13 0 0 0 29,${y-3}`});
        } else if (spec.value === 0) {
          guide('circle',{cx:32,cy:y-4,r:3,fill:'#8a3520'});
        } else if (spec.vertical || spec.key==='rafterDepth') arrow([32,y-12],[32,y+4]);
        else arrow([20,y-4],[44,y-4]);
        guide('text',{x:54,y,class:'guide-key'},`${spec.label}: ${spec.angle ? `${fmt(spec.value)}\u00b0` : mm(spec.value)}`);
      });
    }
    function drawDoorLeaf() {
      if (plan) {
        const path = swingArc.map((p,i) => `${i ? 'L' : 'M'}${project(p).join(',')}`).join(' ');
        node('path',{d:path,fill:'none',stroke:'#9a693c','stroke-dasharray':'4 4'});
      }
      const leaf = node('g',{class:'door-leaf',opacity:timberOnly && !plan ? '.5' : '1',
        'data-thickness':doorThickness,'data-door-window':doorWindow.value});
      const w = doorWidth, h = doorHeight, d = doorThickness;
      const surfaces = [
        {name:'outer',normal:[0,-1,0],points:[[0,0,0],[w,0,0],[w,0,h],[0,0,h]],colour:'#f5ead7',depth:0},
        {name:'inner',normal:[0,1,0],points:[[0,d,0],[w,d,0],[w,d,h],[0,d,h]],colour:'#e7d8bd',depth:d},
        {name:'hinge',normal:[-1,0,0],points:[[0,0,0],[0,d,0],[0,d,h],[0,0,h]],colour:'#365b4b'},
        {name:'latch',normal:[1,0,0],points:[[w,0,0],[w,d,0],[w,d,h],[w,0,h]],colour:'#294c3d'},
        {name:'top',normal:[0,0,1],points:[[0,0,h],[w,0,h],[w,d,h],[0,d,h]],colour:'#64816d'},
        {name:'bottom',normal:[0,0,-1],points:[[0,0,0],[w,0,0],[w,d,0],[0,d,0]],colour:'#294c3d'}
      ];
      const inset = Math.min(42,w*.15,h*.12);
      for (const surface of surfaces) {
        const polygon = (points,fill,part) => ({
          points, attrs:{fill,class:'face','vector-effect':'non-scaling-stroke',
            'data-door-face':surface.name,...(part && {'data-door-part':part})}
        });
        surface.parts = [polygon(surface.points,surface.colour)];
        if (surface.depth === undefined) continue;
        const rect = (a,b,low,high,fill,part) => polygon([
          [a,surface.depth,low],[b,surface.depth,low],[b,surface.depth,high],[a,surface.depth,high]
        ],fill,part);
        surface.parts.push(rect(inset,w-inset,inset,h-inset,'#3d6052'));
        const rim = 22;
        if (doorWindow.value === 'half-circle') {
          const centre = w/2, radius = w*.3, base = h*.85-radius;
          const arch = (r,apron = 0) => [
            ...Array.from({length:25},(_,i) => [
              centre+r*Math.cos(i*Math.PI/24),surface.depth,base+r*Math.sin(i*Math.PI/24)
            ]),
            ...(apron ? [[centre-r,surface.depth,base-apron],[centre+r,surface.depth,base-apron]] : [])
          ];
          surface.parts.push(polygon(arch(radius+rim,rim),surface.colour,'glazing-frame'),
            polygon(arch(radius),glassColor,'glass'));
          const half = 6, reach = Math.sqrt(radius*radius-half*half);
          for (const angle of [Math.PI/4,Math.PI/2,3*Math.PI/4]) {
            const sin = Math.sin(angle), cos = Math.cos(angle);
            surface.parts.push(polygon([
              [centre-half/sin,surface.depth,base],[centre+half/sin,surface.depth,base],
              [centre+cos*reach+sin*half,surface.depth,base+sin*reach-cos*half],
              [centre+cos*reach-sin*half,surface.depth,base+sin*reach+cos*half]
            ],surface.colour,'muntin'));
          }
        } else if (doorWindow.value !== 'none') {
          const narrow = doorWindow.value === 'vertical';
          const a = w*(narrow ? .66 : .2), b = w*(narrow ? .82 : .8);
          const low = h*(narrow ? .52 : .5), high = h*.85;
          surface.parts.push(rect(a-rim,b+rim,low-rim,high+rim,surface.colour,'glazing-frame'),
            rect(a,b,low,high,glassColor,'glass'));
        }
        surface.parts.push(rect(w*.76,w*.87,h*.425,h*.435,'#edf8f7','handle'));
      }
      const eye = plan ? [0,0,1] : iso ? camera : [-1,0,0];
      paintDoor = () => {
        const sin = Math.sin(doorAngle), cos = Math.cos(doorAngle), direction = rtl ? -1 : 1;
        const polygons = [...doorTrimFaces];
        for (const surface of surfaces) {
          const [u,d,z] = surface.normal;
          const normal = [-sin*u+cos*d,direction*(cos*u+sin*d),z];
          if (dot(normal,eye)<=epsilon) continue;
          for (const part of surface.parts) {
            const points = part.points.map(([u,d,z]) => doorPoint(doorAngle,u,d,z));
            polygons.push({points,original:points,normal,offset:dot(normal,points[0]),attrs:part.attrs});
          }
        }
        const ordered = [];
        orderFraming(polygons,ordered,eye);
        leaf.replaceChildren();
        for (const {points,original,attrs} of ordered) drawShape('polygon',points,attrs,original,leaf);
      };
      paintDoor();
    }
    function drawShape(tag,points,attrs,original,parent = layer) {
      const polygon = points.map(project);
      const coords = polygon.map(p => p.join(',')).join(' ');
      if (tag === 'line') {
        stroke(...polygon,attrs,parent);
        return;
      }
      if (!original || points === original) {
        node(tag,{points:coords,...attrs},undefined,parent);
        return;
      }
      if (attrs.fill!=='none') node('polygon',{points:coords,...attrs,style:'stroke:none'},undefined,parent);
      if (attrs.class.includes('cladding-facet')) return;
      const edges = original.map((p,i) => [p,subtract(original[(i+1)%original.length],p)]);
      for (let i=0;i<points.length;i++) {
        const j=(i+1)%points.length;
        const onEdge = edges.some(([p,d]) => {
          const tolerance=epsilon*Math.hypot(...d);
          return tolerance>0 && [points[i],points[j]].every(q => Math.hypot(...cross(subtract(q,p),d))<=tolerance);
        });
        if (onEdge) stroke(polygon[i],polygon[j],{class:attrs.class,
          ...(attrs['data-layer'] && {'data-layer':attrs['data-layer']}),
          ...(attrs['vector-effect'] && {'vector-effect':attrs['vector-effect']})},parent);
      }
    }
    const names = { '3d':'3D porch sketch', front:'Front elevation', left:'Left elevation', right:'Right elevation', plan:'Top-down plan' };
    node('title',{id:'drawing-title'},timberOnly ? `${names[view]} — wall timber` : names[view],group);
    paintDoor = undefined;
    doorButton.disabled = !doorVisible;
    doorButton.title = doorVisible ? 'Preview the outward door swing' : 'Available in 3D, Left, and Plan';
    for (const [tag,points,attrs,original] of shapes) {
      if (tag === 'door-leaf') drawDoorLeaf();
      else drawShape(tag,points,attrs,original);
    }
    for (const {a,b,gap,text} of dims) {
      const p=project(a), q=project(b);
      const u=[p[0]+gap[0],p[1]+gap[1]], v=[q[0]+gap[0],q[1]+gap[1]];
      const attrs={class:'dim'};
      stroke(p,u,attrs); stroke(q,v,attrs); stroke(u,v,attrs);
      for (const [x,y] of [u,v]) stroke([x-4,y+4],[x+4,y-4],attrs);
      node('text',{x:(u[0]+v[0])/2,y:(u[1]+v[1])/2+(gap[0]?5:21),
        'text-anchor':gap[0]<0?'end':'middle',class:'dimension'},text);
    }
    for (const {at,text,dy,anchor} of labels) {
      const [x,y]=project(at);
      node('text',{x,y:y+dy,'text-anchor':anchor,class:'annotation'},text);
    }
    group.append(layer);
    drawingLayer = layer;
    applyZoom();
    svg.replaceChildren(group);
    paintMeasurements = drawMeasurements;
    paintMeasurements();
    groundButton.textContent = groundHidden ? 'Show ground' : 'Hide ground';
    const framingNotes = [];
    if (visible('studs') && !visible('cover')) framingNotes.push(`Studs: ${fmt(studWidth)} × ${mm(studDepth)} at ${mm(studSpacing)} centres.`);
    if (roofFraming) framingNotes.push(`Rafters: ${fmt(rafterWidth)} × ${mm(rafterDepth)} at ${mm(rafterSpacing)} centres.`);
    $('framing-summary').hidden = !framingNotes.length;
    $('framing-summary').textContent = [...framingNotes,'Framing is schematic; member sizes and spans are not structurally verified.'].join(' ');
    if (persistenceEnabled && settingsValid) persistSettings();
  }

  form.addEventListener('toggle', () => {
    const section = activeSection();
    if (section !== guideSection) {
      guideSection = section;
      showMeasurements();
    }
  },true);
  form.addEventListener('focusin', ({target}) => {
    if (fields[target.id] === target) {
      guideSection = activeSection();
      showMeasurements(target.id);
    }
  });
  form.addEventListener('input', ({target}) => {
    persistenceEnabled = true;
    if (target === trimColour || Object.values(windowMuntins).includes(target)) {
      render();
      return;
    }
    for (const side of Object.keys(anchors)) {
      if (target.name === side + 'Top') anchors[side] = 'Top';
      if (target.name === side + 'Bottom') anchors[side] = 'Bottom';
    }
    if (target === fields.studWidth || target === fields.rafterWidth) syncTimberSizes();
    update(target === fields.tileWidth);
    if (fields[target.id] === target) showMeasurements(target.id);
  });
  form.addEventListener('submit', (event) => event.preventDefault());
  exportButton.addEventListener('click', () => {
    storageStatus.textContent = settingsValid
      ? downloadSettings(settingsSnapshot())
      : 'Correct the highlighted settings before exporting.';
  });
  form.addEventListener('reset', (event) => {
    event.preventDefault();
    persistenceEnabled = true;
    resetParameters();
    update();
  });
  const tabs = [...document.querySelectorAll('[data-view]')];
  function resetParameters(resetView = false) {
    for (const input of Object.values(fields)) input.value = input.dataset.initial;
    syncTimberSizes();
    fields.studDepth.value = fields.studDepth.dataset.initial;
    fields.rafterDepth.value = fields.rafterDepth.dataset.initial;
    trimColour.value = trimColour.defaultValue;
    for (const input of Object.values(windowMuntins)) input.value = [...input.options].find(option => option.defaultSelected).value;
    anchors.front = anchors.right = 'Bottom';
    footingLayout.value = [...footingLayout.options].find(option => option.defaultSelected).value;
    for (const input of Object.values(layerInputs)) input.checked = input.defaultChecked;
    roofDisplay.selectedIndex = 0;
    roofMaterial.value = [...roofMaterial.options].find(option => option.defaultSelected).value;
    roofFinish.value = [...roofFinish.options].find(option => option.defaultSelected).value;
    groundHidden = false;
    if (resetView) view = '3d';
    for (const tab of tabs) tab.setAttribute('aria-pressed',String(tab.dataset.view === view));
    clearTimeout(guideTimer);
    guideTimer = undefined;
    doorHanding.selectedIndex = 0;
    doorWindow.value = [...doorWindow.options].find(option => option.defaultSelected).value;
    setDoor(false,false);
  }
  svg.addEventListener('wheel', (event) => {
    if (!event.ctrlKey || !event.deltaY) return;
    event.preventDefault();
    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 240 : 1;
    const next = Math.max(1,Math.min(4,zoom*Math.exp(-event.deltaY*unit*.002)));
    if (next === zoom) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const point = new DOMPoint(event.clientX,event.clientY).matrixTransform(ctm.inverse());
    setZoom(next,Math.max(0,Math.min(drawingWidth,point.x)),Math.max(0,Math.min(drawingHeight,point.y)));
  },{passive:false});
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey ||
      event.key.toLowerCase() !== 'r' || event.target.isContentEditable ||
      event.target.closest?.('input, textarea, select')) return;
    setZoom(1,0,0);
  });
  layerMenu.addEventListener('change', () => {
    persistenceEnabled = true;
    render();
  });
  for (const button of layerMenu.querySelectorAll('[data-layer-preset]')) {
    button.addEventListener('click', () => {
      persistenceEnabled = true;
      for (const [key,input] of Object.entries(layerInputs)) {
        input.checked = button.dataset.layerPreset === 'finished' ? input.defaultChecked :
          button.dataset.layerPreset === 'timber' && key === 'studs';
      }
      render();
    });
  }
  roofDisplay.addEventListener('change', () => {
    persistenceEnabled = true;
    render();
  });
  roofMaterial.addEventListener('change', () => {
    persistenceEnabled = true;
    update(true);
  });
  roofFinish.addEventListener('change', () => {
    persistenceEnabled = true;
    update();
  });
  groundButton.addEventListener('click', () => {
    persistenceEnabled = true;
    groundHidden = !groundHidden;
    render();
  });
  doorButton.addEventListener('click', () => setDoor(!doorOpen));
  doorHanding.addEventListener('change', () => {
    persistenceEnabled = true;
    setDoor(false,false);
    render();
  });
  doorWindow.addEventListener('change', () => {
    persistenceEnabled = true;
    render();
  });
  for (const tab of tabs) tab.addEventListener('click', () => {
    persistenceEnabled = true;
    view = tab.dataset.view;
    for (const option of tabs) option.setAttribute('aria-pressed',String(option === tab));
    render();
  });
  const saved = loadSettings();
  storageStatus.textContent = saved.error;
  const restored = saved.value ? restoreSettings(saved.value) : false;
  if (saved.error || (saved.value && !restored)) {
    persistenceEnabled = false;
  }
  if (saved.value && !restored) {
    storageStatus.textContent = 'Saved settings are invalid or incomplete; defaults were loaded.';
  }
  for (const tab of tabs) tab.setAttribute('aria-pressed',String(tab.dataset.view === view));
  const valid = update(true);
  if (!valid && restored) {
    persistenceEnabled = false;
    resetParameters(true);
    storageStatus.textContent = 'Saved settings are incompatible; defaults were loaded.';
    update();
  } else if (valid && restored && (adjustedStockSizes.length || adjustedRoofSettings || adjustedTrims)) {
    const notices = [];
    if (adjustedStockSizes.length) notices.push(`Saved dimensions adjusted to listed stock sizes: ${adjustedStockSizes.map(key => `${key} = ${fields[key].value} mm`).join(', ')}. Review these changes before ordering.`);
    if (adjustedRoofSettings) notices.push('Saved roof settings were migrated to total roof width and door-side overhang, or adjusted to the selected tile module and pitch-dependent batten gauge.');
    if (adjustedTrims) notices.push('Saved opening trims were unified using the door trim width and colour.');
    storageStatus.textContent = [...notices,storageStatus.textContent].filter(Boolean).join(' ');
  }
}
