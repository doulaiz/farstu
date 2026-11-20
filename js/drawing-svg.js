const layers = {
  WALLS_EXISTING: 'fill="none" stroke="#647078" stroke-width=".28"',
  HIDDEN_FOUNDATION: 'fill="none" stroke="#56616a" stroke-width=".24" stroke-dasharray="1.5 .8"',
  STRUCTURE_NEW: 'fill="none" stroke="#17252e" stroke-width=".42"',
  CENTERLINES: 'fill="none" stroke="#56616a" stroke-width=".18" stroke-dasharray="2 .6 .35 .6"',
  DIMENSIONS: 'fill="none" stroke="#25343d" stroke-width=".19"',
  ANNOTATIONS: 'fill="none" stroke="#25343d" stroke-width=".25"',
  VERIFICATION_FLAGS: 'fill="none" stroke="#9e3227" stroke-width=".4"',
  TITLE_BLOCK: 'fill="none" stroke="#25343d" stroke-width=".28"'
};

const n = value => Number(value.toFixed(3));
const esc = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
})[char]);
const integer = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 });
export const mm = integer.format;
export const decimal = (value, places = 1) => value.toLocaleString('sv-SE', {
  minimumFractionDigits: places, maximumFractionDigits: places
});
export const level = z => `${z < 0 ? '−' : '+'}${(Math.abs(z) / 1000).toFixed(3)}`;

export function createSheet(id, title, scales, site, date) {
  const content = Object.fromEntries(Object.keys(layers).map(key => [key, []]));
  const clips = [];
  const add = (layer, shape) => content[layer].push(shape);
  const line = (layer, x1, y1, x2, y2, attrs = '') =>
    add(layer, `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${attrs}/>`);
  const rect = (layer, x, y, w, h, attrs = '') =>
    add(layer, `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" ${attrs}/>`);
  const poly = (layer, points, attrs = '', close = false) => {
    const tag = close ? 'polygon' : 'polyline';
    add(layer, `<${tag} points="${points.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" ${attrs}/>`);
  };
  const text = (layer, x, y, label, { size = 2.8, weight = 400, anchor = 'start', rotate = 0 } = {}) => {
    const color = layer === 'VERIFICATION_FLAGS' ? '#9e3227' : '#17252e';
    add(layer, `<text x="${n(x)}" y="${n(y)}" fill="${color}" stroke="none" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}"${rotate ? ` transform="rotate(${rotate} ${n(x)} ${n(y)})"` : ''}>${esc(label)}</text>`);
  };
  const note = (x, y, rows, size = 2.8) => rows.forEach((row, i) =>
    text('ANNOTATIONS', x, y + i * 4.7, row, { size }));
  const heading = (x, y, label) => text('ANNOTATIONS', x, y, label, { size: 3.6, weight: 700 });
  const cloud = (x, y, w, label) => {
    const h = 8, count = Math.ceil(w / 6), step = w / count;
    const horizontal = Array(count).fill(`q ${step / 2} -2.6 ${step} 0`).join(' ');
    const back = Array(count).fill(`q ${-step / 2} 2.6 ${-step} 0`).join(' ');
    add('VERIFICATION_FLAGS', `<path d="M ${x} ${y} ${horizontal} q 3.6 4 0 ${h} ${back} q -3.6 -4 0 ${-h} Z" fill="#fff"/>`);
    text('VERIFICATION_FLAGS', x + w / 2, y + 5.2, label, { size: 2.75, weight: 700, anchor: 'middle' });
  };
  const pending = (rows, x = 14, y = 228) => {
    text('VERIFICATION_FLAGS', x, y, 'Pending Verification / Komplettering', { weight: 700 });
    note(x, y + 4.5, rows, 2.6);
  };
  const scaleBar = (x, y, scale, length) => {
    const w = length / scale;
    rect('ANNOTATIONS', x, y, w / 2, 1.5, 'fill="#25343d"');
    rect('ANNOTATIONS', x + w / 2, y, w / 2, 1.5);
    text('ANNOTATIONS', x + w + 2, y + 1.6, `${decimal(length / 1000, length % 1000 ? 1 : 0)} m`, { size: 2.5 });
  };
  // Model coordinates are in mm, with +v up. Only geometry is projected; text stays upright.
  const view = (ox, oy, scale) => {
    const pt = (u, v) => [ox + u / scale, oy - v / scale];
    const dimension = (a, b, offset, label, vertical) => {
      const [x1, y1] = pt(...a), [x2, y2] = pt(...b);
      const q = vertical ? x1 + offset : y1 + offset;
      const p1 = vertical ? [q, y1] : [x1, q], p2 = vertical ? [q, y2] : [x2, q];
      const layer = 'DIMENSIONS';
      line(layer, x1, y1, ...p1);
      line(layer, x2, y2, ...p2);
      line(layer, ...p1, ...p2);
      for (const [x, y] of [p1, p2]) line(layer, x - .9, y + .9, x + .9, y - .9);
      const [x, y] = vertical ? [q - 1.3, (y1 + y2) / 2] : [(x1 + x2) / 2, q - 1.3];
      text(layer, x, y, label, { size: 2.6, anchor: 'middle', rotate: vertical ? -90 : 0 });
    };
    return {
      line: (layer, u, v, a, b, attrs) => line(layer, ...pt(u, v), ...pt(a, b), attrs),
      rect: (layer, u, v, w, h, attrs) => rect(layer, ...pt(u, v + h), w / scale, h / scale, attrs),
      poly: (layer, points, attrs, close) => poly(layer, points.map(point => pt(...point)), attrs, close),
      circle(layer, u, v, r) {
        const [x, y] = pt(u, v);
        add(layer, `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r / scale)}"/>`);
      },
      label: (layer, u, v, label, opts) => text(layer, ...pt(u, v), label, opts),
      horizontal: (u, a, v, offset, label = mm(Math.abs(a - u))) => dimension([u, v], [a, v], offset, label, false),
      vertical: (v, b, u, offset, label = mm(Math.abs(b - v))) => dimension([u, v], [u, b], offset, label, true),
      pt
    };
  };

  const t = 'TITLE_BLOCK';
  rect(t, 7, 7, 406, 283);
  line(t, 7, 25, 413, 25);
  line(t, 7, 251, 413, 251);
  line(t, 7, 275, 413, 275);
  line(t, 270, 251, 270, 275);
  line(t, 371, 251, 371, 275);
  text(t, 14, 19, title, { size: 6, weight: 700 });
  text(t, 406, 18, 'FARSTU  /  ANMÄLAN', { size: 3.2, weight: 700, anchor: 'end' });
  text(t, 14, 257, `NY FARSTU  ·  ${site.address || 'Adress ej angiven'}`, { size: 3.5, weight: 700 });
  text(t, 14, 263, `Fastighetsbeteckning: ${site.propertyId || 'ej angiven'}`);
  text(t, 14, 270, 'Mått i mm, nivåer i m relativt FG. Bärverk, infästning och grundläggning verifieras.');
  text(t, 275, 257, `Skala (A3): ${scales}`, { weight: 700 });
  text(t, 275, 263, `Datum: ${date}`);
  text(t, 275, 270, `Ritad av: ${site.drawnBy || 'Farstu Designer'}`);
  text(t, 392, 266, id, { size: 8, weight: 700, anchor: 'middle' });
  text(t, 14, 284, 'FÖRHANDSKOPIA / UNDERLAG FÖR ANMÄLAN – EJ FÄRDIGKONSTRUERAD', { size: 3.7, weight: 700 });
  text(t, 406, 284, 'ISO A3', { anchor: 'end' });

  return {
    line, rect, poly, text, note, heading, cloud, pending, scaleBar, view,
    clip(x, y, w, h, draw) {
      const clipId = `${id}-clip-${clips.length}`;
      clips.push(`<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`);
      const starts = Object.entries(content).map(([key, shapes]) => [key, shapes.length]);
      draw();
      for (const [key, start] of starts) {
        const shapes = content[key].splice(start);
        if (shapes.length) add(key, `<g clip-path="url(#${clipId})">${shapes.join('')}</g>`);
      }
    },
    hatch: `fill="url(#${id}-hatch)"`,
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="420mm" height="297mm" viewBox="0 0 420 297" role="img" aria-label="${esc(`${id} ${title}`)}" font-family="Arial, sans-serif">
<title>${esc(`${id} ${title}`)}</title>
<defs><pattern id="${id}-hatch" width="2.5" height="2.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V2.5" stroke="#7b858b" stroke-width=".24"/></pattern>${clips.join('')}</defs>
<rect width="420" height="297" fill="#fff"/>
${Object.entries(layers).map(([key, attrs]) => `<g id="${id}-${key}" data-layer="${key}" ${attrs}>${content[key].join('')}</g>`).join('\n')}
</svg>`
  };
}
