import { muntinPatterns } from './windows.js';
import { deromeCatalogue } from './derome.js';
import { tileSystems } from './roofing.js';

export const windowSizeStep = 100;
export const timberSections = deromeCatalogue.filter(item => item.family === 'frame');
const timberWidths = [...new Set(timberSections.map(item => item.width))];
const timberDepths = [...new Set(timberSections.map(item => item.depth))].sort((a,b) => a-b);
const trimWidths = [0,...deromeCatalogue.filter(item => item.family === 'panel').map(item => item.width)];
const boardWidths = trimWidths.filter(value => value > 0);
const windowModules = Array.from({length:11}, (_,i) => 500+i*windowSizeStep);

export function createControls($) {
  const layerMenu = $('wall-layers');
  const roofDisplay = $('roof-display');
  const roofMaterial = $('roof-material');
  const roofFinish = $('roof-finish');
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
  const houseBasementWindows = {
    houseBasementLeft: { label: 'Left basement window', offset: -4244, sill: 150, width: 900, height: 300 },
    houseBasementRight: { label: 'Right basement window', offset: 4244, sill: 150, width: 900, height: 300 }
  };
  function addFields(group, specs) {
    for (const [key, title, initial, min = 0, unit = 'mm', max = 50000, step = unit ? 'any' : 1, choices] of specs) {
      const label = document.createElement('label');
      label.textContent = title;
      const box = document.createElement('span');
      box.className = 'number';
      const input = document.createElement(choices ? 'select' : 'input');
      Object.assign(input, { name: key, id: key, required: true });
      input.dataset.initial = initial;
      if (choices) {
        for (const value of choices) input.add(new Option(`${value} ${unit}`,value,value === initial,value === initial));
      } else {
        Object.assign(input, { type: 'number', min, max, step, defaultValue: initial,
          inputMode: unit ? 'decimal' : 'numeric' });
      }
      const fieldTitle = Object.hasOwn(anchors, group) ? `${group} window: ${title.toLowerCase().replace(/^window /, '')}`
        : Object.hasOwn(houseWindows, group) ? `${houseWindows[group].label}: ${title.toLowerCase()}`
          : Object.hasOwn(houseBasementWindows, group) ? `${houseBasementWindows[group].label}: ${title.toLowerCase()}` : title;
      input.setAttribute('aria-label', unit ? `${fieldTitle} (${unit === 'mm' ? 'millimetres' : 'degrees'})` : fieldTitle);
      const suffix = document.createElement('span');
      suffix.className = 'unit';
      suffix.textContent = unit;
      suffix.setAttribute('aria-hidden', 'true');
      box.append(input);
      if (!choices) box.append(suffix);
      label.append(box);
      $(group).append(label);
      fields[key] = input;
    }
  }

  const stockSize = (key,title,initial,choices) =>
    [key,title,initial,Math.min(...choices),'mm',Math.max(...choices),1,choices];
  const windowSize = (key,title,initial) => stockSize(key,title,initial,windowModules);
  const measuredWindowSize = (key,title,initial,max) => [key,title,initial,100,'mm',max,1];

  addFields('slab', [
    ['width', 'Slab width', 2800, 1200, 'mm', 6000, 1], ['length', 'Slab length', 2200, 1200, 'mm', 6000, 1],
    ['slabThickness', 'Slab thickness', 140, 80, 'mm', 400, 1]
  ]);
  addFields('footings', [
    stockSize('footingDiameter','Pier diameter',403,[150,190,251,302,403]),
    ['footingDepth', 'Pier depth', 300, 300, 'mm', 3000, 1]
  ]);
  addFields('door', [
    stockSize('doorWidth','Door opening width',1000,[800,900,1000,1100]),
    stockSize('doorHeight','Door opening height',2100,[2000,2100,2200]),
    ['doorThickness','Door leaf thickness',70,40,'mm',100,1],
    ['offset', 'Offset from house', 550, 0, 'mm', 5000, 1]
  ]);
  for (const side of Object.keys(anchors)) {
    addFields(side, [
      windowSize(side + 'Width','Window width',900), windowSize(side + 'Height','Window height',1000),
      [side + 'Bottom', 'Bottom clearance', 900, 0, 'mm', 5000], [side + 'Top', 'Top clearance', 0, 0, 'mm', 5000]
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
    addFields(key, [stockSize(key + 'TrimWidth','Trim width',95,trimWidths)]);
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
    ['wallThickness', 'Wall thickness', 145, 120, 'mm', 600, 1], ['claddingSpacing', 'Cover-board spacing', 200, 150, 'mm', 300, 1],
    stockSize('baseBoardWidth','Base-board width',145,boardWidths),
    stockSize('coverBoardWidth','Cover-board width',120,boardWidths),
    ['frontWallHeight', 'Front wall height', 2350, 2000, 'mm', 3500, 1]
  ]);
  addFields('roof', [
    ['pitch', 'Roof angle', 14, 0, '\u00b0', 60],
    ['frontOverhang', 'Front overhang', 350, 0, 'mm', 1000, 1], ['sideOverhang', 'Side overhang', 180, 0, 'mm', 1000, .5]
  ]);
  addFields('roofTiles', [
    stockSize('tileWidth','Tile covering width',300,Object.keys(tileSystems).map(Number)),
    ['tileLength', 'Exposed tile length / batten gauge', 310, 310, 'mm', 375, 1],
    ['tileRise', 'Tile profile rise', 55, 15, 'mm', 100, 1]
  ]);
  addFields('studs', [
    ['studSpacing', 'Stud spacing', 600, 300, 'mm', 600, 1],
    stockSize('studWidth','Stud width',45,timberWidths),
    stockSize('studDepth','Stud depth',95,timberDepths)
  ]);
  addFields('rafters', [
    ['rafterSpacing', 'Rafter spacing', 600, 300, 'mm', 1200, 1],
    stockSize('rafterWidth','Rafter width',45,timberWidths),
    stockSize('rafterDepth','Rafter depth',170,timberDepths)
  ]);
  for (const [key, values] of Object.entries(houseWindows)) {
    addFields(key, [
      measuredWindowSize(key + 'Width','Width',values.width,4000), measuredWindowSize(key + 'Height','Height',values.height,3000),
      [key + 'Offset', 'Horizontal offset', values.offset, -15000, 'mm', 15000, 1],
      [key + 'Sill', 'Sill height', values.sill, 0, 'mm', 12000, 1]
    ]);
  }
  for (const [key, values] of Object.entries(houseBasementWindows)) {
    addFields(key, [
      measuredWindowSize(key + 'Width','Width',values.width,3000), measuredWindowSize(key + 'Height','Height',values.height,1500),
      [key + 'Offset', 'Horizontal offset', values.offset, -15000, 'mm', 15000, 1],
      [key + 'Sill', 'Sill height above base bottom', values.sill, 0, 'mm', 3000, 1]
    ]);
  }
  addFields('houseWall', [
    ['houseWallWidth', 'House wall width', 10798, 3000, 'mm', 30000, 1],
    ['houseWallHeight', 'House wall height', 4400, 2500, 'mm', 12000, 1],
    ['houseBaseHeight', 'Concrete base height', 600, 0, 'mm', 3000, 1],
    ['houseBaseRecession', 'Basement recession', 100, 0, 'mm', 500, 1]
  ]);
  addFields('hedge', [
    ['hedgeDistance', 'Distance from house', 3500, 500, 'mm', 20000, 1],
    ['hedgeHeight', 'Hedge height', 1500, 300, 'mm', 5000, 1]
  ]);
  function syncTimberSizes() {
    for (const prefix of ['stud','rafter']) {
      const depth = fields[prefix+'Depth'];
      const previous = Number(depth.value);
      const choices = timberSections.filter(item => item.width === Number(fields[prefix+'Width'].value))
        .map(item => item.depth);
      const next = choices.reduce((best,value) => Math.abs(value-previous) < Math.abs(best-previous) ? value : best);
      depth.replaceChildren(...choices.map(value => new Option(`${value} mm`,value,String(value) === depth.dataset.initial,value === next)));
    }
  }
  syncTimberSizes();
  return {
    layerMenu, roofDisplay, footingLayout, wallLayers, layerInputs, doorButton, groundButton,
    doorHanding, roofMaterial, roofFinish, fields, anchors, trimColours, houseWindows, houseBasementWindows, windowMuntins,
    syncTimberSizes
  };
}
