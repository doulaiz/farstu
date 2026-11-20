import { createSheet, decimal, level, mm } from './drawing-svg.js';
import { permitSettings } from './permit-settings.js';
import { pierLayout } from './loads.js';
import { rafterStarts, wallPosts } from './framing.js';
import { roofRearOffset, standingFlashing } from './roofing.js';

const existing = 'WALLS_EXISTING', structure = 'STRUCTURE_NEW', hidden = 'HIDDEN_FOUNDATION';
const centre = 'CENTERLINES', labels = 'ANNOTATIONS';
const gray = 'fill="#e8ebec"', glass = 'fill="#e8f4f7"', dashed = 'stroke-dasharray="2 1"';
const roofFill = { terracotta: '#bd7960', classicRed: '#a65b55', darkGray: '#797d80', matteBlack: '#5e6165' };
const roofColor = { terracotta: 'terrakotta', classicRed: 'klassiskt röd', darkGray: 'mörkgrå', matteBlack: 'mattsvart' };
const directions = ['south', 'west', 'north', 'east'];
const swedishDirection = { north: 'norr', south: 'söder', east: 'öster', west: 'väster' };
const orientation = site => {
  const i = directions.indexOf(site.frontDirection);
  return { front: directions[i], left: directions[(i + 1) % 4], rear: directions[(i + 2) % 4], right: directions[(i + 3) % 4] };
};
const grossArea = area => decimal(area, area !== 15 && Math.abs(area - 15) < .005 ? 4 : 2);
const crosshair = (v, x, y, r) => {
  v.line(centre, x - r, y, x + r, y);
  v.line(centre, x, y - r, x, y + r);
};

function drawingModel(m, site) {
  const face = roofRearOffset(m), flashing = standingFlashing(m);
  const door = { start: face + m.offset, end: face + m.offset + m.doorWidth, bottom: 0, top: m.doorHeight };
  const entry = m.houseEntryOffset - m.slabOriginOffset;
  return {
    ...m, face, flashing, door, entry, roofTop: flashing.bottom - 2,
    roofFront: flashing.bottom - 2 - m.slope * (m.length + m.frontOverhang - face),
    area: m.width * m.length / 1e6,
    pier: pierLayout(m), pierBottom: -m.slabThickness - m.footingDepth,
    frostLevel: site.newGrade - site.frost,
    ridge: site.existingGrade + site.ridge,
    tread: { x: -300, start: Math.max(0, door.start - 100), end: Math.min(m.length, door.end + 100), z: -m.slabThickness / 2 }
  };
}

export function sitePlan(m, site, date) {
  const s = createSheet('A-1', 'Situationsplan', '1:400', site, date);
  const { width: w, length: l, houseA, houseB, face } = m;
  const dir = orientation(site);
  // Keep the house above the porch in local plan coordinates; the north arrow rotates.
  const west = -site[dir.left], east = w + site[dir.right], north = site[dir.rear], south = -l - site[dir.front];
  const left = Math.min(west, houseA), right = Math.max(east, houseB);
  const top = Math.max(north, site.houseDepth - face), bottom = south;
  const fits = right - left <= 99200 && top - bottom <= 64000;
  const v = fits
    ? s.view(143 - (left + right) / 800, 127 + (top + bottom) / 800, 400)
    : s.view(143 - w / 800, 140, 400);
  const frame = fits ? { west, east, north, south } : {
    west: Math.max(west, w / 2 - 49000), east: Math.min(east, w / 2 + 49000),
    north: Math.min(north, 39000), south: Math.max(south, -27000)
  };
  const edges = [
    [west === frame.west, frame.west, frame.south, frame.west, frame.north],
    [east === frame.east, frame.east, frame.south, frame.east, frame.north],
    [north === frame.north, frame.west, frame.north, frame.east, frame.north],
    [south === frame.south, frame.west, frame.south, frame.east, frame.south]
  ];
  s.viewport(14, 40, 275, 184, () => {
    v.rect(existing, houseA, -face, houseB - houseA, site.houseDepth, gray);
    v.rect(structure, 0, -l, w, l, s.hatch);
    for (const [visible, x, y, a, b] of edges) if (visible) v.line(centre, x, y, a, b);
    if (north === frame.north) v.label(labels, frame.west, north + 900, 'Tomtgräns');
    if (north === frame.north && north !== 0) v.vertical(0, north, w * .65, 3);
    if (south === frame.south && site[dir.front]) v.vertical(-l, south, w * .65, 3);
    if (west === frame.west && site[dir.left]) v.horizontal(west, 0, -l * .55, 5);
    if (east === frame.east && site[dir.right]) v.horizontal(w, east, -l * .55, 5);
  });
  s.heading(14, 35, '1:400  /  Schematisk tomt');
  s.scaleBar(14, 41, 400, 10000);
  const rotation = 90 * directions.indexOf(dir.front);
  const compass = `transform="rotate(${rotation} 275 54)"`;
  s.text(labels, 275, 41, 'N', { weight: 700, anchor: 'middle' });
  s.poly(labels, [[275, 46], [272, 57], [275, 54], [278, 57]], `fill="#25343d" ${compass}`, true);
  s.line(labels, 275, 53, 275, 62, compass);
  s.rect(labels, 295, 35, 109, 93);
  s.heading(300, 43, 'Ytor och avstånd');
  s.note(300, 51, [
    `BTA ny farstu (modell): ${grossArea(m.area)} m²`,
    `ÖA ny farstu: ${decimal(0, 2)} m² (sluten farstu)`,
    'BTA beräknad från plattans yttermått.',
    'Befintlig byggnads BTA ingår inte.',
    '',
    `Norr ${mm(site.north)} · Söder ${mm(site.south)}`,
    `Öster ${mm(site.east)} · Väster ${mm(site.west)}`,
    'Avstånd från plattans ytterkant (mm).'
  ]);
  s.rect(existing, 300, 97, 8, 4, gray);
  s.text(labels, 311, 100, 'Befintlig byggnad');
  s.rect(structure, 300, 106, 8, 4, s.hatch);
  s.text(labels, 311, 109, 'Ny farstu');
  s.line(centre, 300, 118, 308, 118);
  s.text(labels, 311, 119, 'Tomtgräns');
  s.cloud(296, 136, 107, 'KONTROLLERAS MOT NYBYGGNADSKARTA');
  const close = Math.min(site.north, site.south, site.east, site.west) < 4500;
  if (close) s.cloud(296, 150, 107, 'OBS: TOMTGRÄNS NÄRMARE ÄN 4,5 m');
  if (m.area > 15) s.cloud(296, 164, 107, 'OBS: BTA > 15,0 m² – PRÖVA ÅTGÄRDEN');
  const crosses = houseA < west || houseB > east || site.houseDepth - face > north;
  if (crosses) s.cloud(296, 178, 107, 'BEFINTLIG BYGGNAD KORSAR SKISSGRÄNS');
  if (close) s.note(296, 199, ['Avstånd till tomtgräns < 4,5 m –', 'skriftligt grannemedgivande bifogas', 'Bilaga ej skapad; kontrollera om medgivande är möjligt.'], 2.6);
  s.pending([
    `Ersätt skissgränser och huskontur med kommunens kartunderlag. Front mot ${swedishDirection[dir.front]}${site.defaults.includes('frontDirection') ? ' (antaget)' : ''}.`,
    `${site.defaults.some(key => ['north', 'south', 'west', 'east', 'houseDepth'].includes(key)) ? 'Schablonmått används. ' : ''}${!site.address || !site.propertyId ? 'Adress och fastighetsbeteckning kompletteras. ' : ''}${fits ? 'Kontrollera utsprång, avstånd och areamätning.' : 'Gränser utanför ritfält visas bara som mått i tabell.'}`,
    'Kontrollera anmälnings-/lovplikt och tillämplig areagräns med byggnadsnämnden; 15,0 m² är en kontrollsignal.'
  ]);
  return s.svg();
}

export function floorPlan(m, site, date) {
  const s = createSheet('A-2', 'Planritning & grundplan', '1:100 / 1:50', site, date);
  const { width: w, length: l, wallThickness: t, face, door, windows, tread } = m;
  const v = s.view(105 - w / 200, 104 - l / 200, 100);
  const f = s.view(297 - w / 100, 133 - l / 100, 50);
  s.heading(14, 35, '01  Planritning  /  1:100');
  s.heading(181, 35, '02  Platta, stomlinjer & plintar  /  1:50');
  s.scaleBar(14, 41, 100, 2000);
  s.scaleBar(181, 41, 50, 2000);
  const rear = (view, showEntry = false) => {
    const a = Math.max(m.houseA, -500), b = Math.min(m.houseB, w + 500);
    if (b <= a) return;
    const e1 = Math.max(a, m.entry - m.houseEntryWidth / 2), e2 = Math.min(b, m.entry + m.houseEntryWidth / 2);
    for (const [x, end] of showEntry && e1 < e2 ? [[a, e1], [e2, b]] : [[a, b]]) {
      if (end > x) view.rect(existing, x, -face, end - x, t + face, gray);
    }
    if (showEntry && e1 < e2) {
      const depth = Math.min(m.houseEntryDepth, 1800);
      view.poly(existing, [[e1, -face], [e1, depth - face], [e2, depth - face], [e2, -face]]);
    }
  };
  s.viewport(14, 46, 161, 110, () => {
    v.rect(structure, 0, -l, w, l);
    rear(v, true);
    const walls = [
      { start: face, end: l - t, opening: door, outline: (a, b, d, attr) => v.rect(structure, 0, -b, d, b - a, attr) },
      { start: face, end: l - t, opening: windows.right, outline: (a, b, d, attr) => v.rect(structure, w - d, -b, d, b - a, attr) },
      { start: 0, end: w, framingStart: t, framingEnd: w - t, opening: windows.front,
        outline: (a, b, d, attr) => v.rect(structure, a, -l, b - a, d, attr) }
    ];
    for (const { start, end, framingStart = start, framingEnd = end, opening, outline } of walls) {
      outline(start, opening.start, t, s.hatch);
      outline(opening.end, end, t, s.hatch);
      if (opening !== door) outline(opening.start, opening.end, t * .46, glass);
      for (const [a, b] of wallPosts(framingStart, framingEnd, opening, m.studWidth, m.studSpacing)) {
        if (b <= opening.start || a >= opening.end) outline(a, b, m.studDepth, 'fill="#7a807d" stroke-width=".13"');
      }
    }
    const rtl = m.doorHanding === 'rtl';
    const hinge = -(rtl ? door.end : door.start), direction = rtl ? 1 : -1;
    v.rect(structure, tread.x, -tread.end, -tread.x, tread.end - tread.start, gray);
    v.line(structure, 0, hinge, -m.doorWidth, hinge);
    v.poly(structure, Array.from({ length: 25 }, (_, i) => {
      const angle = i * Math.PI / 48;
      return [-m.doorWidth * Math.sin(angle), hinge + direction * m.doorWidth * Math.cos(angle)];
    }), 'stroke-width=".23"');
    v.rect(centre, -m.doorSideOverhang, -l - m.frontOverhang, m.roofWidth, l + m.frontOverhang - face);
    v.line(centre, w / 2, 150, w / 2, -l - m.frontOverhang - 130);
    v.label(labels, w / 2, -l - m.frontOverhang - 470, 'A', { anchor: 'middle', weight: 700 });
    v.label(labels, w / 2, 490, 'A', { anchor: 'middle', weight: 700 });
    v.horizontal(0, w, -l, 15);
    v.vertical(0, -l, w, 17);
    v.label(labels, w * .5, -l * .51, `BTA ${grossArea(m.area)} m²`, { anchor: 'middle', size: 2.3 });
    v.label(labels, w * .5, -l * .51 - 320, 'ÖA 0,00 m²', { anchor: 'middle', size: 2.3 });
  });

  const { columns, rows } = m.pier;
  s.viewport(181, 46, 222, 158, () => {
    f.rect(structure, 0, -l, w, l);
    rear(f);
    f.line(structure, 0, -face, w, -face, 'stroke-width=".75"');
    f.label(labels, w / 2, -face + 450, 'Anslutningslinje mot hus', { anchor: 'middle' });
    for (const x of columns) for (const y of rows) {
      f.circle(structure, x, -y, m.pier.radius);
      crosshair(f, x, -y, m.pier.radius + 100);
    }
    for (let i = 1; i < columns.length; i++) f.horizontal(columns[i - 1], columns[i], -l, 9);
    for (let i = 1; i < rows.length; i++) f.vertical(-rows[i - 1], -rows[i], w, 10);
    f.rect(structure, tread.x, -tread.end, -tread.x, tread.end - tread.start, gray);
    f.label(labels, tread.x - 150, -(tread.start + tread.end) / 2, 'Trappsteg', { anchor: 'end', size: 2.6 });
  });
  s.note(14, 160, ['Grå vägg: befintlig byggnad (utsnitt).', 'Streckad kontur: takutsprång. A–A: sektion.', 'Fyllda markeringar: modellens väggreglar.']);
  const outsideRise = tread.z - site.newGrade;
  s.note(181, 207, [
    `Platta ${mm(m.slabThickness)} mm · ${columns.length} × ${rows.length} plintar Ø${mm(m.footingDiameter)} · modellens entrésteg, stegdjup 300 mm.`,
    `Steghöjd: ${mm(outsideRise)} mm (mark till steg) / ${mm(-tread.z)} mm (steg till FG).`
  ], 2.6);
  s.cloud(14, 185, 143, 'OBS: VERIFIERA SPÄNNVIDDER, BÄRLINA OCH INFÄSTNING');
  s.pending([
    'Modellen har betongplatta på plintar; golvbjälkar (riktning/c/c) är inte modellerade eller föreskrivna.',
    'Takets bakre upplag (bärlina eller balk), plattans armering, spännvidder och plintreaktioner dimensioneras separat.',
    `${outsideRise <= 0 ? 'Ny mark ligger i eller över modellsteget. ' : ''}Kontrollera trappans geometri, tillgänglighet, nivåskillnader och fastsättning på plats.`
  ]);
  return s.svg();
}

function groundLines(v, site, a, b) {
  v.line(hidden, a, site.existingGrade, b, site.existingGrade);
  // When the levels coincide, the heavier new grade is drawn alongside the dashed line.
  v.line(labels, a, site.newGrade, site.newGrade === site.existingGrade ? (a + b) / 2 : b, site.newGrade, 'stroke-width=".42"');
  v.line(centre, a, 0, b, 0);
  v.label(labels, b, 200, '+0.000 / FG', { anchor: 'end', size: 2.45 });
}

function piersInElevation(v, m, positions, bottom) {
  for (const u of positions) {
    v.rect(hidden, u - m.pier.radius, m.pierBottom, m.footingDiameter, m.footingDepth);
    if (bottom < m.pierBottom) {
      v.rect(hidden, u - m.pier.radius, bottom, m.footingDiameter, m.pierBottom - bottom, 'stroke-dasharray=".5 .8"');
    }
  }
}

export function elevations(m, site, date) {
  const s = createSheet('A-3', 'Fasadritningar – berörda fasader', '1:100', site, date);
  const { width: w, length: l, face, door, windows, ridge } = m;
  const dir = orientation(site);
  const roof = `fill="${roofFill[m.roofFinish] || '#92989c'}"`;
  const houseTop = m.houseWallHeight - m.slabThickness;
  const baseTop = m.houseBaseHeight - m.slabThickness;
  const min = Math.min(m.houseA, -m.doorSideOverhang), max = Math.max(m.houseB, w + m.rightOverhang);
  const front = s.view(203 - (min + max) / 200, 125, 100);
  const frontMin = Math.min(site.existingGrade, site.newGrade, m.frostLevel, m.pierBottom);
  const cropped = Math.max(ridge, m.roofTop, m.flashing.top, houseTop) > 8100 || frontMin < -2400 ||
    max - min > 33800;
  const frontWindow = (v, op) => {
    v.rect(structure, op.start, op.bottom, op.end - op.start, op.top - op.bottom, glass);
    v.line(structure, (op.start + op.end) / 2, op.bottom, (op.start + op.end) / 2, op.top, 'stroke-width=".19"');
  };
  s.heading(14, 35, `01  Fasad mot ${swedishDirection[dir.front]} / front`);
  s.heading(14, 155, `02  Fasad mot ${swedishDirection[dir.left]} / dörrsida`);
  s.heading(208, 155, `03  Fasad mot ${swedishDirection[dir.right]}`);
  s.scaleBar(350, 34, 100, 5000);
  s.viewport(13, 39, 394, 112, () => {
    front.rect(existing, m.houseA, baseTop, m.houseB - m.houseA, houseTop - baseTop, 'fill="#f0f0ef"');
    if (m.houseBaseHeight) front.rect(existing, m.houseA, -m.slabThickness, m.houseB - m.houseA, m.houseBaseHeight, gray);
    if (ridge > houseTop) {
      front.poly(existing, [[m.houseA, houseTop], [(m.houseA + m.houseB) / 2, ridge], [m.houseB, houseTop]], dashed);
    }
    for (const { left, right, sill, head } of m.houseOpenings) {
      front.rect(existing, left, sill, right - left, head - sill, glass);
    }
    if (m.houseBaseHeight) for (const { left, right, sill, head } of m.basementOpenings) {
      front.rect(existing, left, sill - m.slabThickness, right - left, head - sill, glass);
    }
    piersInElevation(front, m, m.pier.columns, m.frostLevel);
    front.rect(structure, 0, -m.slabThickness, w, m.slabThickness, gray);
    front.rect(structure, 0, 0, w, m.frontWallHeight, 'fill="#f8f6ec"');
    front.rect(structure, -m.doorSideOverhang, m.eave, m.roofWidth, m.roofTop - m.eave, roof);
    frontWindow(front, windows.front);
    groundLines(front, site, min - 700, max + 700);
    if (ridge) front.vertical(site.existingGrade, ridge, min, -13, `Bef. nock ${mm(site.ridge)} över mark`);
    front.vertical(0, m.roofTop, max, 12, `Ny takanslutning ${level(m.roofTop)}`);
  });
  for (const [east, x] of [[false, 101], [true, 300]]) {
    const sign = east ? -1 : 1, e = l + m.frontOverhang;
    const v = s.view(x - sign * e / 200, 201, 100);
    const span = (a, b) => [Math.min(sign * a, sign * b), b - a];
    const a = Math.min(sign * -850, sign * (e + 700)), b = Math.max(sign * -850, sign * (e + 700));
    s.viewport(east ? 207 : 13, 156.5, 191, 63.5, () => {
      v.poly(existing, [[0, -m.slabThickness], [0, baseTop], [sign * face, baseTop], [sign * face, houseTop]]);
      piersInElevation(v, m, m.pier.rows.map(y => sign * y), m.frostLevel);
      const [slabStart, slabWidth] = span(0, l);
      v.rect(structure, slabStart, -m.slabThickness, slabWidth, m.slabThickness, gray);
      v.poly(structure, [[sign * face, 0], [sign * l, 0], [sign * l, m.frontWallHeight], [sign * face, m.rear]], 'fill="#f8f6ec"', true);
      v.poly(structure, [[sign * face, m.rear], [sign * e, m.eave], [sign * e, m.roofFront], [sign * face, m.roofTop]], roof, true);
      v.line(structure, sign * face, m.flashing.bottom, sign * face, m.flashing.top, 'stroke-width=".65"');
      const op = east ? windows.right : door;
      const [start, width] = span(op.start, op.end);
      if (east) frontWindow(v, { ...op, start, end: start + width });
      else {
        v.rect(structure, start, 0, width, op.top, 'fill="#e1e4dc"');
        if (m.doorWindow !== 'none') v.rect(structure, start + width * .23, op.top * .49, width * .54, op.top * .39, glass);
        v.rect(structure, treadSide(m.tread, sign), -m.slabThickness, m.tread.end - m.tread.start, m.slabThickness / 2, gray);
      }
      groundLines(v, site, a, b);
      v.vertical(0, m.roofFront, sign * e, east ? -5 : 6, `Takfot ${level(m.roofFront)}`);
    });
  }
  s.note(15, 221, ['Befintlig marklinje: streckad  ·  Ny marklinje: heldragen  ·  Plintar under mark: streckade; prickat visar bedömt tjäldjup.'], 2.55);
  s.note(211, 228, [
    `Taklutning ${decimal(m.pitch, Number.isInteger(m.pitch) ? 0 : 1)}° · ${m.roofMaterial === 'tiles' ? 'betongpannor' : 'bandtäckt plåt'}, ${roofColor[m.roofFinish] || 'kulör ej angiven'}.`,
    'Stående träpanel, kulör och säkerhetsglas verifieras.'
  ], 2.6);
  s.cloud(274, 141, 130, 'KONTROLLERAS: MARK, HUSNOCK OCH VÄDERSTRECK');
  if (cropped || Math.max(houseTop, m.flashing.top) > 4400 || frontMin < -1850) {
    s.cloud(14, 141, 111, 'HÖGA / DJUPA PARTIER KAPAS I RITFÄLT');
  }
  s.pending([
    `Befintlig mark ${level(site.existingGrade)} · Ny mark ${level(site.newGrade)} · Befintlig nock ${level(ridge)} (takprofil schematisk).`,
    'Verifiera nivåer, fasadkulör (NCS) och behov av härdat/laminerat säkerhetsglas.'
  ]);
  return s.svg();
}

const treadSide = ({ start, end }, sign) => Math.min(sign * start, sign * end);

function sectionDetails(s, m) {
  const a = s.view(229, 106, 20);
  const b = s.view(229, 174, 20);
  s.heading(213, 35, 'D1  Upplag mot befintlig vägg  /  1:20');
  s.heading(213, 119, 'D2  Platta / plint och princip för plintjärn  /  1:20');
  const run = 610, fall = m.slope * run, depth = m.rafterDepth * Math.hypot(1, m.slope);
  s.viewport(213, 40, 54, 75, () => {
    a.rect(existing, -180, -260, 180, 680, gray);
    a.poly(structure, [[0, 0], [run, -fall], [run, -fall + depth], [0, depth]], s.hatch, true);
    a.poly(structure, [[0, depth + m.flashing.coverRise + m.flashingHeight], [0, depth + m.flashing.coverRise],
      [170, depth + m.flashing.coverRise - m.slope * 170]], 'stroke-width=".7"');
    a.rect(hidden, 0, -130, 45, 130);
  });
  s.note(269, 54, [
    'Anslutningsplåt / ståndskiva bakom panel.',
    `Plåthöjd i modell: ${mm(m.flashingHeight)} mm.`,
    'Vattenavledning ut på taktäckning.',
    `Takregel ${mm(m.rafterWidth)} × ${mm(m.rafterDepth)} mm (modell).`,
    'Bakre upplag och infästning projekteras.'
  ]);
  s.viewport(213, 124, 54, 89, () => {
    b.rect(structure, -160, -m.slabThickness, 640, m.slabThickness, s.hatch);
    b.rect(structure, (m.studDepth - m.footingDiameter) / 2, -m.slabThickness - 360, m.footingDiameter, 360, gray);
    b.rect(structure, 0, 0, m.studDepth, 180, s.hatch);
    b.poly(hidden, [[-20, -45], [-20, 85], [m.studDepth + 20, 85], [m.studDepth + 20, -45]]);
  });
  s.note(269, 142, [
    `Betongplatta ${mm(m.slabThickness)} mm, plint Ø${mm(m.footingDiameter)} mm.`,
    'Streckat: plintjärn för ev. separat stolpe.',
    'Inte modellerat; inte ett utförandebeslag.',
    'Konstruktionsvirke: C24 (förslag, verifieras).',
    'NTR/A vid markkontakt; NTR/AB ovan mark',
    'där träskydd behövs. Fuktskydd projekteras.'
  ]);
  s.scaleBar(269, 173, 20, 500);
}

export function section(m, site, date) {
  const s = createSheet('A-4', 'Sektionsritning & konstruktionsdetaljer', '1:50 / 1:20', site, date);
  const v = s.view(101 - m.length / 100, 153, 50);
  const e = m.length + m.frontOverhang;
  s.heading(14, 35, 'A–A  Sektion genom farstu och husanslutning  /  1:50');
  s.scaleBar(14, 41, 50, 2000);
  s.viewport(12, 47, 190, 148, () => {
    const baseTop = m.houseBaseHeight - m.slabThickness;
    const wallTop = m.houseWallHeight - m.slabThickness;
    if (m.houseBaseHeight > 0) v.rect(existing, -400, -m.slabThickness, 400, m.houseBaseHeight, gray);
    v.rect(existing, -400, baseTop, 400 + m.face, wallTop - baseTop, gray);
    v.rect(structure, 0, -m.slabThickness, m.length, m.slabThickness, s.hatch);
    const window = m.windows.front;
    const cutsWindow = window.start <= m.width / 2 && m.width / 2 <= window.end;
    const front = m.length - m.wallThickness;
    if (cutsWindow) {
      v.rect(structure, front, 0, m.wallThickness, window.bottom, s.hatch);
      v.rect(structure, front, window.top, m.wallThickness, m.frontWallHeight - window.top, s.hatch);
      v.line(structure, front + m.wallThickness / 2, window.bottom, front + m.wallThickness / 2, window.top);
    } else v.rect(structure, front, 0, m.wallThickness, m.frontWallHeight, s.hatch);
    v.poly(structure, [[m.face, m.rear], [e, m.eave], [e, m.roofFront], [m.face, m.roofTop]], s.hatch, true);
    v.line(structure, m.face, m.flashing.bottom, m.face, m.flashing.top, 'stroke-width=".75"');
    const cutPier = m.pier.columns.some(x => Math.abs(x - m.width / 2) <= m.pier.radius);
    piersInElevation(v, m, m.pier.rows, m.frostLevel);
    if (cutPier) for (const y of m.pier.rows) {
      v.rect(structure, y - m.pier.radius, m.pierBottom, m.footingDiameter, m.footingDepth, s.hatch);
    }
    groundLines(v, site, -650, e + 250);
    v.vertical(0, m.frontWallHeight, m.length - m.wallThickness, -9, `Rumshöjd ca ${mm(m.frontWallHeight)} till takregel`);
    v.label(labels, m.face + 120, m.roofTop + 220, 'D1', { weight: 700 });
    v.label(labels, m.pier.rows[0] - 120, -m.slabThickness - 160, 'D2', { weight: 700, anchor: 'end' });
  });
  s.note(14, 198, [
    `Modell: betongplatta ${mm(m.slabThickness)} mm; plintbotten ${level(m.pierBottom)}.`,
    `Tjälfritt djup (underlag): ${mm(site.frost)} mm under ny mark, nivå ${level(m.frostLevel)}.`,
    `Takreglar ${rafterStarts(m.roofWidth, m.doorSideOverhang, m.rafterWidth, m.rafterSpacing).length} st. · ${mm(m.rafterWidth)} × ${mm(m.rafterDepth)} · nominellt c/c ${mm(m.rafterSpacing)} mm.`
  ], 2.65);
  sectionDetails(s, m);
  if (m.frostLevel < m.pierBottom) s.cloud(13, 215, 160, 'KONTROLLERAS: PLINTBOTTEN ÖVER ANTAGET TJÄLDJUP');
  s.cloud(213, 215, 189, `OBS: VERIFIERA DIMENSIONERING / SNÖZON ${decimal(site.snow)} kN/m²`);
  s.pending([
    'Verifiera snö, vind, spännvidder, jord/bärighet, armering, frost, fuktskydd och alla infästningar.',
    'Räcke ej modellerat. Verifiera fallhöjd och krav; 1 100 mm är ett kontrollmått där tillämpligt.',
    'Fastställ gällande byggregler med kommunen (BBR/EKS där tillämpligt); trä enligt SS-EN 1995.'
  ]);
  if (Math.max(m.flashing.top, m.houseWallHeight - m.slabThickness) > 5200 || Math.min(m.frostLevel, m.pierBottom) < -2050 ||
      m.slope * 610 > 180 || m.flashingHeight + m.rafterDepth * Math.hypot(1, m.slope) > 1150) {
    s.note(213, 209, ['Geometri utanför ritfält kapas; angivna skalor bibehålls.'], 2.55);
  }
  return s.svg();
}

const sheets = [sitePlan, floorPlan, elevations, section];

export function compileDrawings(model, values = {}, date = new Date().toLocaleDateString('sv-SE')) {
  const site = permitSettings(values, model.slabThickness);
  const drawing = drawingModel(model, site);
  return sheets.map((generate, i) => ({ id: `A-${i + 1}`, svg: generate(drawing, site, date) }));
}
