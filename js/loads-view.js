import {
  adultCount, adultFootprint, adultMass, clampPerson, computeLoads, defaultPeople, densities, gravity,
  openingMasses, roofCovering, roofCoveringLabels, roofCoveringMasses, roofEdgeMasses, roofLayerMasses, wallLayerMasses
} from './loads.js';

const svgNS = 'http://www.w3.org/2000/svg';
const kgFormat = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const twoDecimals = new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 1 });
const kg = n => kgFormat.format(Math.round(n));
const kN = n => twoDecimals.format(n * gravity / 1000);

// Light yellow to dark red; matches the CSS legend ramp.
const ramp = [[255, 247, 214], [253, 205, 120], [240, 133, 62], [204, 64, 44], [128, 20, 34]];
function heat(t) {
  const x = Math.max(0, Math.min(1, t)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(x));
  const f = x - i;
  return `rgb(${ramp[i].map((c, k) => Math.round(c + f * (ramp[i + 1][k] - c))).join(',')})`;
}

function el(name, attrs = {}, parent) {
  const node = document.createElementNS(svgNS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  parent?.append(node);
  return node;
}

function text(parent, x, y, content, size, attrs = {}) {
  const node = el('text', { x, y, 'font-size': size, class: 'loads-text', ...attrs }, parent);
  node.textContent = content;
  return node;
}

export function createLoadsView($) {
  const panel = $('loads-view');
  const svg = $('loads-diagram');
  const status = $('loads-status');
  const rearSupport = $('loads-rear-support');
  const peopleSelect = $('loads-people');
  const rows = $('loads-rows');
  const breakdown = $('loads-breakdown');
  const assumptions = $('loads-assumptions');
  const fixedNodes = [...svg.childNodes];
  $('loads-adult-mass').textContent = adultMass;
  let latest, valid;
  let custom;
  let dragging = null;
  let focusIndex = null;

  const interior = model => ({ x0: model.wallThickness, x1: model.width - model.wallThickness, y0: 0, y1: model.length - model.wallThickness });

  function peopleFor(model) {
    let people;
    if (peopleSelect.value === 'custom' && custom) {
      const box = interior(model);
      people = custom.map(({ fx, fy }) => ({ x: box.x0 + fx * (box.x1 - box.x0), y: box.y0 + fy * (box.y1 - box.y0) }));
    } else if (peopleSelect.value === 'worst') {
      const dead = computeLoads(model, { people: [], rearSupport: rearSupport.value });
      const pier = dead.piers.reduce((a, b) => b.fromAbove > a.fromAbove ? b : a);
      const group = defaultPeople(model, 'together');
      const cx = group.reduce((s, q) => s + q.x, 0) / group.length;
      const cy = group.reduce((s, q) => s + q.y, 0) / group.length;
      people = group.map(p => ({ x: p.x - cx + pier.x, y: p.y - cy + pier.y }));
    } else {
      people = defaultPeople(model, peopleSelect.value);
    }
    return people.slice(0, adultCount).map(p => clampPerson(model, p));
  }

  function storeCustom(model, people) {
    const box = interior(model);
    custom = people.map(({ x, y }) => ({
      fx: (x - box.x0) / Math.max(1, box.x1 - box.x0), fy: (y - box.y0) / Math.max(1, box.y1 - box.y0)
    }));
    peopleSelect.querySelector('option[value="custom"]').disabled = false;
    peopleSelect.value = 'custom';
  }

  function moveTo(index, point) {
    const people = peopleFor(latest);
    people[index] = clampPerson(latest, point);
    storeCustom(latest, people);
    render(true);
  }

  function svgPoint(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  }

  svg.addEventListener('pointerdown', event => {
    const person = event.target.closest('[data-person]');
    if (!person || !latest) return;
    event.preventDefault();
    const index = Number(person.dataset.person);
    const { x, y } = svgPoint(event);
    const current = peopleFor(latest)[index];
    dragging = { index, pointer: event.pointerId, dx: current.x - x, dy: current.y - y };
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener('pointermove', event => {
    if (!dragging || event.pointerId !== dragging.pointer) return;
    const { x, y } = svgPoint(event);
    moveTo(dragging.index, { x: x + dragging.dx, y: y + dragging.dy });
  });
  const stop = event => {
    if (dragging && event.pointerId === dragging.pointer) dragging = null;
  };
  svg.addEventListener('pointerup', stop);
  svg.addEventListener('pointercancel', stop);
  svg.addEventListener('keydown', event => {
    const person = event.target.closest?.('[data-person]');
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!person || !step || !latest) return;
    event.preventDefault();
    const index = Number(person.dataset.person);
    const current = peopleFor(latest)[index];
    const distance = event.shiftKey ? 500 : 100;
    focusIndex = index;
    moveTo(index, { x: current.x + step[0] * distance, y: current.y + step[1] * distance });
  });
  rearSupport.addEventListener('change', () => render(true));
  peopleSelect.addEventListener('change', () => render(true));

  function drawDiagram(model, result, people) {
    const { width: W, length: L, wallThickness: T, sideOverhang: S, frontOverhang: F, windows, offset, doorWidth } = model;
    const { piers, layout, field } = result;
    const span = Math.max(W + 2 * S, L + F);
    const u = span / 640;
    const margin = 70 * u;
    const houseBand = 46 * u;
    const minX = -S - margin, minY = -houseBand - 14 * u, maxX = W + S + margin, maxY = L + F + margin;
    svg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
    svg.replaceChildren(...fixedNodes);
    const root = el('g', {}, svg);

    el('rect', { x: minX, y: -houseBand, width: maxX - minX, height: houseBand, class: 'loads-house' }, root);
    text(root, W / 2, -houseBand / 2, 'Existing house wall', 13 * u, { 'dominant-baseline': 'central', 'text-anchor': 'middle' });
    el('rect', { x: -S, y: 0, width: W + 2 * S, height: L + F, class: 'loads-roof' }, root);
    text(root, W + S - 4 * u, L + F - 6 * u, 'Roof outline', 10 * u, { 'text-anchor': 'end', class: 'loads-text loads-muted' });

    const max = Math.max(...field.values);
    const cw = W / field.nx, ch = L / field.ny;
    const cells = el('g', { 'aria-hidden': 'true', 'shape-rendering': 'crispEdges' }, root);
    field.values.forEach((value, i) => {
      el('rect', {
        x: (i % field.nx) * cw, y: Math.floor(i / field.nx) * ch, width: cw + .5, height: ch + .5,
        fill: heat(Math.sqrt(value / max))
      }, cells);
    });
    el('rect', { x: 0, y: 0, width: W, height: L, class: 'loads-slab' }, root);

    const walls = el('g', { class: 'loads-walls' }, root);
    el('rect', { x: 0, y: 0, width: T, height: offset }, walls);
    el('rect', { x: 0, y: offset + doorWidth, width: T, height: Math.max(0, L - T - offset - doorWidth) }, walls);
    el('rect', { x: 0, y: L - T, width: W, height: T }, walls);
    el('rect', { x: W - T, y: 0, width: T, height: L - T }, walls);
    const glazing = el('g', { class: 'loads-glazing' }, root);
    el('line', { x1: windows.front.start, x2: windows.front.end, y1: L - T / 2, y2: L - T / 2 }, glazing);
    el('line', { x1: W - T / 2, x2: W - T / 2, y1: windows.right.start, y2: windows.right.end }, glazing);
    text(root, -10 * u, offset + doorWidth / 2, 'Door', 10 * u,
      { 'text-anchor': 'middle', transform: `rotate(-90 ${-10 * u} ${offset + doorWidth / 2})`, class: 'loads-text loads-muted' });

    const pressures = piers.map(p => p.basePressure);
    const pMin = Math.min(...pressures), pMax = Math.max(...pressures);
    for (const pier of piers) {
      const g = el('g', { class: 'loads-pier' }, root);
      const t = pMax > pMin ? (pier.basePressure - pMin) / (pMax - pMin) : .5;
      el('circle', { cx: pier.x, cy: pier.y, r: layout.radius, fill: `hsl(250 ${25 + 30 * t}% ${78 - 30 * t}%)` }, g);
      const size = Math.min(12 * u, layout.radius / 3.2);
      text(g, pier.x, pier.y - size * 1.15, pier.id, size, { 'text-anchor': 'middle', class: 'loads-text loads-pier-id' });
      text(g, pier.x, pier.y, `${kg(pier.fromAbove)} kg`, size, { 'text-anchor': 'middle', 'dominant-baseline': 'central', class: `loads-text${pier.fromAbove < 0 ? ' loads-uplift' : ''}` });
      text(g, pier.x, pier.y + size * 1.2, `${oneDecimal.format(pier.basePressure)} kPa`, size * .9, { 'text-anchor': 'middle', 'dominant-baseline': 'hanging', class: 'loads-text' });
    }

    people.forEach((person, index) => {
      const g = el('g', {
        class: 'loads-person', 'data-person': index, tabindex: 0, role: 'button',
        'aria-label': `Adult ${index + 1}, ${adultMass} kg, ${kgFormat.format(person.x)} mm from the left and ${kgFormat.format(person.y)} mm from the house. Use the arrow keys to move.`
      }, root);
      el('rect', {
        x: person.x - adultFootprint / 2, y: person.y - adultFootprint / 2, width: adultFootprint, height: adultFootprint,
        rx: adultFootprint / 5, class: 'loads-person-area'
      }, g);
      el('circle', { cx: person.x, cy: person.y - 60, r: 55, class: 'loads-person-head' }, g);
      el('path', { d: `M${person.x - 110} ${person.y + 120} Q${person.x} ${person.y - 30} ${person.x + 110} ${person.y + 120} Z`, class: 'loads-person-head' }, g);
      text(g, person.x, person.y + adultFootprint / 2 + 12 * u, `${adultMass} kg`, 10 * u, { 'text-anchor': 'middle', 'dominant-baseline': 'hanging' });
    });

    const dims = el('g', { class: 'loads-dims' }, root);
    const dy = L + F + 28 * u;
    el('line', { x1: 0, x2: W, y1: dy, y2: dy }, dims);
    for (const x of [0, W]) el('line', { x1: x, x2: x, y1: dy - 7 * u, y2: dy + 7 * u }, dims);
    text(root, W / 2, dy + 6 * u, `Slab width ${kgFormat.format(W)} mm`, 11 * u, { 'text-anchor': 'middle', 'dominant-baseline': 'hanging' });
    const dx = -S - 28 * u;
    el('line', { x1: dx, x2: dx, y1: 0, y2: L }, dims);
    for (const y of [0, L]) el('line', { x1: dx - 7 * u, x2: dx + 7 * u, y1: y, y2: y }, dims);
    text(root, dx - 6 * u, L / 2, `Slab length ${kgFormat.format(L)} mm`, 11 * u,
      { 'text-anchor': 'middle', transform: `rotate(-90 ${dx - 6 * u} ${L / 2})` });

    $('loads-ramp-range').textContent = `0 – ${oneDecimal.format(max)} kPa (square-root scale; walls and feet are concentrated loads)`;
    if (focusIndex !== null) svg.querySelector(`[data-person="${focusIndex}"]`)?.focus({ preventScroll: true });
    focusIndex = null;
  }

  function fillTables(model, result) {
    const { piers, totals, details, onPiers, area } = result;
    const fragment = document.createDocumentFragment();
    const cell = (row, value, className = 'numeric') => {
      const td = row.insertCell();
      td.textContent = value;
      if (className) td.className = className;
      return td;
    };
    for (const pier of piers) {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = pier.id;
      tr.append(th);
      cell(tr, `${kgFormat.format(pier.x)} / ${kgFormat.format(pier.y)}`);
      for (const key of ['slab', 'walls', 'roof', 'people']) cell(tr, kg(pier.parts[key]));
      cell(tr, kg(pier.fromAbove), pier.fromAbove < 0 ? 'numeric bom-flag' : 'numeric');
      cell(tr, kN(pier.fromAbove));
      cell(tr, kg(pier.selfWeight));
      cell(tr, kN(pier.atBase));
      cell(tr, oneDecimal.format(pier.basePressure));
      cell(tr, percent.format(pier.share));
      fragment.append(tr);
    }
    const tr = document.createElement('tr');
    tr.className = 'loads-total-row';
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = 'Total';
    tr.append(th);
    cell(tr, `${piers.length} piers, ${twoDecimals.format(area)} m² each`, '');
    for (const key of ['slab', 'walls', 'roof', 'people']) cell(tr, kg(totals[key]));
    cell(tr, kg(onPiers));
    cell(tr, kN(onPiers));
    cell(tr, kg(result.pierSelfWeight));
    cell(tr, kN(onPiers + result.pierSelfWeight));
    cell(tr, '');
    cell(tr, percent.format(1));
    fragment.append(tr);
    rows.replaceChildren(fragment);

    const factor = Math.hypot(1, model.slope);
    const covering = roofCovering(model);
    const coveringLabel = roofCoveringLabels[covering].toLowerCase();
    const lines = [
      ['Concrete slab', details['slab:concrete'], `${kgFormat.format(model.width)} × ${kgFormat.format(model.length)} × ${kgFormat.format(model.slabThickness)} mm at ${densities.concrete.value} kg/m³`],
      ['Wall studs, plates, sills & headers', details['walls:framing'], `Stud layout from the Designer at ${densities.timber.value} kg/m³`],
      ['Wall cladding, battens, boards & linings', details['walls:layers'], `${oneDecimal.format(wallLayerMasses(model).reduce((s, l) => s + l.kg, 0))} kg/m² of solid wall`],
      ['Stud-bay insulation', details['walls:insulation'], `${densities.mineralWool.value} kg/m³ mineral wool, ${kgFormat.format(model.studDepth)} mm deep`],
      ['Windows, door & opening trim', details['walls:openings'], `Windows ${openingMasses.window} kg/m², door ${openingMasses.door} kg/m²`],
      ['Rafters', details['roof:rafters'], `${kgFormat.format(model.rafterWidth)} × ${kgFormat.format(model.rafterDepth)} mm at ${densities.timber.value} kg/m³`],
      [`Roof ${coveringLabel}, deck & underlayment`, details['roof:covering'], `${oneDecimal.format((roofCoveringMasses[covering] + roofLayerMasses.deck + roofLayerMasses.underlayment) * factor)} kg per m² of plan`],
      ['Fascia, flashings & gutter', details['roof:edges'], 'Line loads along the roof edges'],
      [`${adultCount} adults`, details['people:adults'], `${adultMass} kg each, spread over ${adultFootprint} × ${adultFootprint} mm`]
    ];
    const out = document.createDocumentFragment();
    const addLine = (label, mass, basis, className) => {
      const row = document.createElement('tr');
      if (className) row.className = className;
      const head = document.createElement('th');
      head.scope = 'row';
      head.textContent = label;
      row.append(head);
      cell(row, kg(mass));
      cell(row, basis, '');
      out.append(row);
    };
    for (const line of lines) addLine(...line);
    if (totals.house > 0) addLine('Less: rear roof share carried by the house', -totals.house, 'Ledger on the existing house wall');
    addLine('Total on the piers', onPiers, `${kN(onPiers)} kN`, 'loads-total-row');
    addLine('Pier self-weight', result.pierSelfWeight, `${piers.length} × Ø ${kgFormat.format(model.footingDiameter)} mm, ${kgFormat.format(model.footingDepth)} mm deep`);
    addLine('Total on the soil', onPiers + result.pierSelfWeight, `${kN(onPiers + result.pierSelfWeight)} kN`, 'loads-total-row');
    breakdown.replaceChildren(out);

    const items = [
      ...Object.values(densities).map(d => `${d.label}: ${d.value} kg/m³`),
      ...wallLayerMasses(model).map(l => `${l.label}: ${oneDecimal.format(l.kg)} kg/m²`),
      `Window units: ${openingMasses.window} kg/m²; exterior door: ${openingMasses.door} kg/m²`,
      ...Object.entries(roofCoveringMasses).map(([key, value]) => `${roofCoveringLabels[key]}: ${value} kg/m² of roof incl. battens`),
      `Roof deck, 22 mm boards: ${roofLayerMasses.deck} kg/m²; underlayment: ${roofLayerMasses.underlayment} kg/m²`,
      `Eave (fascia, drip flashing, gutter): ${roofEdgeMasses.eave} kg/m; each verge (two bargeboards, flashing): ${roofEdgeMasses.verge} kg/m; downpipe: ${roofEdgeMasses.downpipe} kg`,
      `Average adult: ${adultMass} kg; gravity ${gravity} m/s²`
    ];
    assumptions.replaceChildren(...items.map(item => {
      const li = document.createElement('li');
      li.textContent = item;
      return li;
    }));
  }

  let renderedKey;
  function render(force = false) {
    if (panel.hidden) return;
    if (!latest) {
      status.textContent = 'No valid design is available.';
      return;
    }
    status.textContent = valid ? '' : 'Showing the last valid design. Fix the highlighted parameters in Designer to update these loads.';
    const key = [latest, rearSupport.value, peopleSelect.value];
    if (!force && renderedKey && key.every((value, i) => value === renderedKey[i])) return;
    renderedKey = key;
    const people = peopleFor(latest);
    const result = computeLoads(latest, { people, rearSupport: rearSupport.value });
    const top = result.piers.reduce((a, b) => b.fromAbove > a.fromAbove ? b : a);
    const worst = result.piers.reduce((a, b) => b.basePressure > a.basePressure ? b : a);
    $('loads-total').textContent = `${kg(result.onPiers)} kg · ${kN(result.onPiers)} kN`;
    $('loads-max').textContent = `${top.id}: ${kg(top.fromAbove)} kg`;
    $('loads-pressure').textContent = `${worst.id}: ${oneDecimal.format(worst.basePressure)} kPa`;
    drawDiagram(latest, result, people);
    fillTables(latest, result);
  }

  return {
    render: () => render(),
    update(model, isValid) {
      latest = model;
      valid = isValid;
      render();
    }
  };
}
