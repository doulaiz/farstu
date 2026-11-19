import { clippedHeight, rafterStarts, wallMembers } from './framing.js';
import { roofMaterials } from './roofing.js';

export const gravity = 9.81;
export const adultMass = 80;
export const adultCount = 3;
// Approximate standing footprint used to spread each person's weight on the slab.
export const adultFootprint = 400;

// Planning densities (kg/m³) and finished-layer masses (kg/m²). Values are typical, not product data.
export const densities = {
  concrete: { value: 2500, label: 'Reinforced concrete (slab and piers)' },
  timber: { value: 450, label: 'Structural spruce, C24 incl. moisture' },
  mineralWool: { value: 30, label: 'Mineral-wool insulation' }
};

export const wallLayerMasses = ({baseBoardWidth, coverBoardWidth, claddingSpacing}) => [
  { key: 'cladding', label: 'Board-on-board cladding, 22 mm', kg: (baseBoardWidth + coverBoardWidth) / claddingSpacing * 0.022 * densities.timber.value },
  { key: 'battens', label: 'Nailers and counter-battens, 48 × 25 @ 600', kg: 2 * 0.048 * 0.025 / 0.6 * 450 },
  { key: 'wind', label: 'Wind-barrier board, 9 mm', kg: 7 },
  { key: 'vapour', label: 'Vapour control membrane', kg: 0.2 },
  { key: 'service', label: 'Service battens 70 × 28 @ 600 with insulation', kg: 0.07 * 0.028 / 0.6 * 450 + 0.028 * 30 },
  { key: 'osb', label: 'OSB / plywood, 12 mm', kg: 0.012 * 620 },
  { key: 'gypsum', label: 'Gypsum lining, 13 mm', kg: 9 }
];

export const openingMasses = { window: 35, door: 30 };

export const roofCoveringMasses = {
  tiles: 45,
  standingSeam: 6
};
export const roofCoveringLabels = {
  tiles: roofMaterials.tiles.label,
  standingSeam: roofMaterials.standingSeam.label
};
// Designs without a covering choice use tiles, the original roof covering.
export const roofCovering = ({ roofMaterial }) => roofMaterial in roofCoveringMasses ? roofMaterial : 'tiles';
export const roofLayerMasses = { deck: 10, underlayment: 1.5 };
export const roofEdgeMasses = { eave: 6, verge: 3.6, abutment: 1, downpipe: 5 };

export function pierLayout({ width, length, footingColumns, footingRows, footingDiameter }) {
  const radius = footingDiameter / 2;
  const inset = radius + Math.min(100, (width - footingColumns * footingDiameter) / 4,
    (length - footingRows * footingDiameter) / 4);
  const axis = (span, count) => Array.from({ length: count }, (_, i) => inset + i * (span - 2 * inset) / (count - 1));
  return { radius, columns: axis(width, footingColumns), rows: axis(length, footingRows) };
}

// Lever-rule (simply supported) shares between neighbouring supports; loads beyond the outer
// supports are extrapolated, so a cantilevered load can lift the next support.
function leverShares(u, supports) {
  const last = supports.length - 2;
  let k = 0;
  while (k < last && u > supports[k + 1]) k++;
  const t = (u - supports[k]) / (supports[k + 1] - supports[k]);
  return [[k, 1 - t], [k + 1, t]];
}

export function defaultPeople(model, preset = 'spread') {
  const { width: W, length: L, wallThickness: T } = model;
  const ix = [T, W - T], iy = [0, L - T];
  const cx = (ix[0] + ix[1]) / 2, cy = (iy[0] + iy[1]) / 2;
  if (preset === 'spread') return [0.25, 0.5, 0.75].map(f => ({ x: ix[0] + f * (ix[1] - ix[0]), y: cy }));
  return [[-1, -1], [1, -1], [0, 1]].map(([dx, dy]) => ({ x: cx + dx * 220, y: cy + dy * 190 }));
}

export function clampPerson(model, { x, y }) {
  const { width: W, length: L, wallThickness: T } = model;
  const m = adultFootprint / 2;
  const clamp = (v, a, b) => a > b ? (a + b) / 2 : Math.max(a, Math.min(b, v));
  return { x: clamp(x, T + m, W - T - m), y: clamp(y, m, L - T - m) };
}

function wallLoads(model, add) {
  const { width: W, length: L, wallThickness: T, studWidth, studDepth, studSpacing,
    rear, slope, frontWallHeight, windows, offset, doorWidth, doorHeight } = model;
  const timber = densities.timber.value / 1e9;
  const layerKg = wallLayerMasses(model).reduce((sum, layer) => sum + layer.kg, 0) / 1e6;
  const cavityKg = densities.mineralWool.value * studDepth / 1e9 * Math.max(0, 1 - studWidth / studSpacing);
  const sideTop = u => rear - slope * u;
  const walls = [
    { end: L - T, top: sideTop, op: { start: offset, end: offset + doorWidth, bottom: 0, top: doorHeight },
      at: u => [T / 2, u], kind: 'door' },
    { end: W, top: () => frontWallHeight, op: windows.front, at: u => [u, L - T / 2], kind: 'window' },
    { end: L - T, top: sideTop, op: windows.right, at: u => [W - T / 2, u], kind: 'window' }
  ];
  const step = 25;
  for (const { end, top, op, at, kind } of walls) {
    for (const { a, b, low, high } of wallMembers(0, end, top, op, studWidth, studSpacing)) {
      const n = Math.max(1, Math.ceil((b - a) / step));
      for (let i = 0; i < n; i++) {
        const u = a + (i + .5) * (b - a) / n;
        const h = clippedHeight(top, high, u) - clippedHeight(top, low, u);
        if (h > 0) add('walls', 'framing', ...at(u), h * (b - a) / n * studDepth * timber);
      }
    }
    for (let start = 0; start < end;) {
      const boundary = start < op.start ? op.start : start < op.end ? op.end : end;
      const du = Math.min(step, end - start, boundary - start);
      const u = start + du / 2;
      const inOpening = u > op.start && u < op.end;
      const solid = Math.max(0, top(u) - (inOpening ? op.top - op.bottom : 0));
      add('walls', 'layers', ...at(u), solid * du * layerKg);
      add('walls', 'insulation', ...at(u), solid * du * cavityKg);
      start += du;
    }
    const area = (op.end - op.start) * (op.top - op.bottom) / 1e6;
    const unitKg = area * openingMasses[kind];
    const trimWidth = model.trimWidth ?? 0;
    const trimKg = trimWidth * 22 * densities.timber.value / 1e9 *
      (2 * (op.top - op.bottom) + (op.end - op.start) + 2 * trimWidth);
    const n = Math.max(1, Math.ceil((op.end - op.start) / step));
    for (let i = 0; i < n; i++) {
      const u = op.start + (i + .5) * (op.end - op.start) / n;
      add('walls', 'openings', ...at(u), (unitKg + trimKg) / n);
    }
  }
}

function roofLoads(model, add) {
  const { width: W, length: L, wallThickness: T, roofWidth, doorSideOverhang: S, frontOverhang: F, slope,
    rafterWidth, rafterDepth, rafterSpacing } = model;
  const factor = Math.hypot(1, slope);
  const roofRight = roofWidth-S;
  const rafters = rafterStarts(roofWidth, S, rafterWidth, rafterSpacing);
  const rafterKg = rafterWidth * rafterDepth * (L + F) * factor * densities.timber.value / 1e9;
  const areaKg = (roofCoveringMasses[roofCovering(model)] + roofLayerMasses.deck + roofLayerMasses.underlayment) / 1e6 * factor;
  const point = (part, x, y, kg) => add('roof', part, x, y, kg);
  const step = 50;
  const ys = [];
  for (let start = 0; start < L + F; start += step) {
    const dy = Math.min(step, L + F - start);
    ys.push([start + dy / 2, dy]);
  }
  for (const x0 of rafters) for (const [y, dy] of ys) point('rafters', x0 + rafterWidth / 2, y, rafterKg * dy / (L + F));
  for (let start = -S; start < roofRight; start += step) {
    const dx = Math.min(step, roofRight - start);
    const x = start + dx / 2;
    for (const [y, dy] of ys) point('covering', x, y, dx * dy * areaKg);
    point('edges', x, L + F, dx / 1000 * roofEdgeMasses.eave);
    point('edges', x, 0, dx / 1000 * roofEdgeMasses.abutment);
  }
  for (const [y, dy] of ys) {
    for (const x of [-S, roofRight]) point('edges', x, y, dy / 1000 * factor * roofEdgeMasses.verge);
  }
  point('edges', W - T / 2, L + F, roofEdgeMasses.downpipe);
}

export function computeLoads(model, { people, rearSupport = 'beam' }) {
  const { width: W, length: L, wallThickness: T, slabThickness, footingDiameter, footingDepth } = model;
  const layout = pierLayout(model);
  const { columns, rows, radius } = layout;
  const piers = rows.flatMap((y, r) => columns.map((x, c) => ({
    id: `${String.fromCharCode(65 + r)}${c + 1}`, x, y, row: r, column: c,
    parts: { slab: 0, walls: 0, roof: 0, people: 0 }
  })));
  const totals = { slab: 0, walls: 0, roof: 0, people: 0, house: 0 };
  const details = {};
  const cell = 100;
  const nx = Math.max(1, Math.ceil(W / cell)), ny = Math.max(1, Math.ceil(L / cell));
  const field = new Float64Array(nx * ny);

  function onSlab(group, x, y, kg) {
    totals[group] += kg;
    const cx = Math.min(nx - 1, Math.max(0, Math.floor(x / W * nx)));
    const cy = Math.min(ny - 1, Math.max(0, Math.floor(y / L * ny)));
    field[cy * nx + cx] += kg;
    for (const [r, wr] of leverShares(y, rows)) {
      for (const [c, wc] of leverShares(x, columns)) piers[r * columns.length + c].parts[group] += kg * wr * wc;
    }
  }
  function add(group, part, x, y, kg) {
    details[`${group}:${part}`] = (details[`${group}:${part}`] ?? 0) + kg;
    onSlab(group, x, y, kg);
  }

  const slabKg = densities.concrete.value * slabThickness / 1e9;
  for (let y = 0; y < L; y += 50) {
    const dy = Math.min(50, L - y);
    for (let x = 0; x < W; x += 50) {
      const dx = Math.min(50, W - x);
      add('slab', 'concrete', x + dx / 2, y + dy / 2, dx * dy * slabKg);
    }
  }
  wallLoads(model, add);

  // Rafters span from the rear support at the house wall (y = 0) to the front wall; the reactions
  // follow the lever rule, so the front overhang increases the front-wall share.
  const frontY = L - T / 2;
  const sides = [T / 2, W - T / 2];
  roofLoads(model, (group, part, x, y, kg) => {
    details[`${group}:${part}`] = (details[`${group}:${part}`] ?? 0) + kg;
    const front = kg * y / frontY;
    const rearKg = kg - front;
    onSlab('roof', Math.max(sides[0], Math.min(sides[1], x)), frontY, front);
    if (rearSupport === 'house') {
      totals.house += rearKg;
    } else {
      for (const [i, share] of leverShares(x, sides)) onSlab('roof', sides[i], T / 2, rearKg * share);
    }
  });
  const footprint = adultFootprint;
  const steps = 4;
  for (const person of people) {
    for (let i = 0; i < steps; i++) {
      for (let j = 0; j < steps; j++) {
        const x = person.x - footprint / 2 + (i + .5) * footprint / steps;
        const y = person.y - footprint / 2 + (j + .5) * footprint / steps;
        add('people', 'adults', x, y, adultMass / steps / steps);
      }
    }
  }

  const area = Math.PI * radius * radius / 1e6;
  const selfWeight = densities.concrete.value * area * footingDepth / 1000;
  const onPiers = totals.slab + totals.walls + totals.roof + totals.people;
  for (const pier of piers) {
    pier.fromAbove = Object.values(pier.parts).reduce((a, b) => a + b, 0);
    pier.selfWeight = selfWeight;
    pier.atBase = pier.fromAbove + selfWeight;
    pier.share = pier.fromAbove / onPiers;
    pier.topPressure = pier.fromAbove * gravity / 1000 / area;
    pier.basePressure = pier.atBase * gravity / 1000 / area;
  }
  const cellArea = (W / nx) * (L / ny) / 1e6;
  return {
    piers, layout, totals, details, onPiers, area, footingDiameter,
    pierSelfWeight: selfWeight * piers.length,
    field: { nx, ny, values: Array.from(field, kg => kg * gravity / 1000 / cellArea) }
  };
}
