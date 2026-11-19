import { muntinPatterns } from './windows.js';

export const windowSizeStep = 100;

export function createControls($) {
  const layerMenu = $('wall-layers');
  const roofDisplay = $('roof-display');
  const footingLayout = $('footing-layout');
  const layerOptions = layerMenu.querySelector('.layer-options');
  if (!layerOptions) throw new Error('The wall layer controls are missing.');
  const wallLayers = [
    ['trim','Opening trim','#f7f8ee'],
    ['cover','Cover boards','#edc897'],
    ['base','Base boards','#d6a876'],
    ['nailers','Horizontal nailers','#a87147'],
    ['counter','Vertical counter-battens','#ba8f61'],
    ['wind','Wind barrier','#739489'],
    ['exterior','Exterior insulation (optional)','#c1ad79',false],
    ['studs','Studs, plates & headers','#d9ab76'],
    ['cavity','Stud-bay insulation','#efd382'],
    ['vapour','Vapour control','#8ba8c9'],
    ['service','Service battens','#c49b71'],
    ['serviceFill','Service insulation','#dbc08f'],
    ['osb','OSB / plywood','#bd986d'],
    ['gypsum','Gypsum lining','#ecebe3']
  ];
  const layerInputs = Object.fromEntries(wallLayers.map(([key,label,colour,checked = true]) => {
    const row = document.createElement('label');
    row.className = 'view-toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.wallLayer = key;
    input.defaultChecked = checked;
    input.setAttribute('aria-controls','drawing');
    const swatch = document.createElement('i');
    swatch.className = 'swatch';
    swatch.style.background = colour;
    swatch.setAttribute('aria-hidden','true');
    row.append(input,swatch,label);
    layerOptions.append(row);
    return [key,input];
  }));
  const doorButton = $('toggle-door');
  const groundButton = $('toggle-ground');
  const doorHanding = $('door-handing');
  const fields = {};
  const anchors = { front: 'Bottom', right: 'Bottom' };
  const trimColours = {};
  const windowMuntins = {};
  const houseWindows = {
    houseLeft: { label: 'Left house window', offset: -4244, sill: 1250, width: 1300, height: 1100 },
    houseUpper: { label: 'Upper house window', offset: 0, sill: 3350, width: 700, height: 500 },
    houseRight: { label: 'Right house window', offset: 4244, sill: 1250, width: 1300, height: 1100 }
  };
  function addFields(group, specs) {
    for (const [key, title, initial, min = 0, unit = 'mm', max = 50000, step = unit ? 'any' : 1] of specs) {
      const label = document.createElement('label');
      label.textContent = title;
      const box = document.createElement('span');
      box.className = 'number';
      const input = document.createElement('input');
      Object.assign(input, { type: 'number', name: key, id: key, min, max, step, required: true,
        defaultValue: initial, inputMode: unit ? 'decimal' : 'numeric' });
      const fieldTitle = Object.hasOwn(anchors, group) ? `${group} window: ${title.toLowerCase().replace(/^window /, '')}`
        : Object.hasOwn(houseWindows, group) ? `${houseWindows[group].label}: ${title.toLowerCase()}` : title;
      input.setAttribute('aria-label', unit ? `${fieldTitle} (${unit === 'mm' ? 'millimetres' : 'degrees'})` : fieldTitle);
      const suffix = document.createElement('span');
      suffix.className = 'unit';
      suffix.textContent = unit;
      suffix.setAttribute('aria-hidden', 'true');
      box.append(input, suffix);
      label.append(box);
      $(group).append(label);
      fields[key] = input;
    }
  }

  const windowSize = (key,title,initial) => [key,title,initial,windowSizeStep,'mm',50000,windowSizeStep];

  addFields('slab', [
    ['width', 'Slab width', 2800, 1], ['length', 'Slab length', 2200, 1],
    ['slabThickness', 'Slab thickness', 140, 1]
  ]);
  addFields('footings', [
    ['footingDiameter', 'Pier diameter', 400, 1], ['footingDepth', 'Pier depth', 300, 1]
  ]);
  addFields('door', [['doorWidth', 'Door width', 1000, 1], ['doorHeight', 'Door height', 2100, 1], ['offset', 'Offset from house', 550]]);
  for (const side of Object.keys(anchors)) {
    addFields(side, [
      windowSize(side + 'Width','Window width',900), windowSize(side + 'Height','Window height',1000),
      [side + 'Bottom', 'Bottom clearance', 900, 0, 'mm', 100000], [side + 'Top', 'Top clearance', 0, 0, 'mm', 100000]
    ]);
    const label = document.createElement('label');
    label.textContent = 'Muntins (spröjs)';
    const select = document.createElement('select');
    select.id = `${side}-muntins`;
    select.setAttribute('aria-label',`${side} window muntins`);
    for (const [value, {label:option}] of Object.entries(muntinPatterns)) {
      select.add(new Option(option,value,value === 'cross',value === 'cross'));
    }
    label.append(select);
    $(side).append(label);
    windowMuntins[side] = select;
  }
  for (const [key,labelText] of [['door','Door'],['front','Front window'],['right','Right window']]) {
    addFields(key, [[key + 'TrimWidth', 'Trim width', 90, 0, 'mm', 1000]]);
    const label = document.createElement('label');
    label.textContent = 'Trim colour';
    const colour = document.createElement('input');
    Object.assign(colour,{type:'color',defaultValue:'#f5efe1'});
    colour.setAttribute('aria-label',`${labelText} trim colour`);
    label.append(colour);
    $(key).append(label);
    trimColours[key] = colour;
  }
  addFields('walls', [
    ['wallThickness', 'Wall thickness', 145, 1], ['claddingSpacing', 'Cover-board spacing', 200, 50],
    ['frontWallHeight', 'Front wall height', 2350, 1]
  ]);
  addFields('roof', [
    ['pitch', 'Roof angle', 12, 0, '\u00b0', 60],
    ['frontOverhang', 'Front overhang', 350, 0, 'mm', 10000], ['sideOverhang', 'Side overhang', 180, 0, 'mm', 10000]
  ]);
  addFields('roofTiles', [
    ['tileWidth', 'Tile width', 300, 100, 'mm', 1500],
    ['tileLength', 'Exposed tile length', 330, 100, 'mm', 1500],
    ['tileRise', 'Tile profile rise', 55, 1, 'mm', 300]
  ]);
  addFields('studs', [
    ['studSpacing', 'Stud spacing', 600, 100], ['studWidth', 'Stud width', 45, 1, 'mm', 1000],
    ['studDepth', 'Stud depth', 95, 1, 'mm', 1000]
  ]);
  addFields('rafters', [
    ['rafterSpacing', 'Rafter spacing', 600, 100], ['rafterWidth', 'Rafter width', 45, 1, 'mm', 1000],
    ['rafterDepth', 'Rafter depth', 170, 1, 'mm', 1000]
  ]);
  for (const [key, values] of Object.entries(houseWindows)) {
    addFields(key, [
      windowSize(key + 'Width','Width',values.width), windowSize(key + 'Height','Height',values.height),
      [key + 'Offset', 'Horizontal offset', values.offset, -50000], [key + 'Sill', 'Sill height', values.sill]
    ]);
  }
  addFields('houseWall', [
    ['houseWallWidth', 'House wall width', 10798, 1],
    ['houseWallHeight', 'House wall height', 4400, 1],
    ['houseBaseHeight', 'Concrete base height', 600],
    ['houseBaseRecession', 'Basement recession', 100, 0, 'mm', 1000]
  ]);
  addFields('hedge', [
    ['hedgeDistance', 'Distance from house', 3500],
    ['hedgeHeight', 'Hedge height', 1500, 1]
  ]);
  return {
    layerMenu, roofDisplay, footingLayout, wallLayers, layerInputs, doorButton, groundButton,
    doorHanding, fields, anchors, trimColours, houseWindows, windowMuntins
  };
}
