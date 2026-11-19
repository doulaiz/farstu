import { deromeCatalogue } from './derome.js';
import { clippedHeight, rafterStarts, wallCourses, wallMembers } from './framing.js';

const kerf = 3;
const roles = {
  stud:'Studs', 'wall-plate':'Wall plates', 'window-sill':'Window sills', 'opening-header':'Opening headers'
};

function takeoff(model) {
  const {width, length, wallThickness, studWidth, studDepth, studSpacing, frontWallHeight, rear, slope,
    windows, offset, doorWidth, doorHeight, rafterWidth, rafterDepth, rafterSpacing,
    roofWidth, doorSideOverhang, frontOverhang, slabThickness, claddingSpacing, baseBoardWidth, coverBoardWidth} = model;
  const factor = Math.hypot(1,slope);
  const groups = new Map();
  function add(role, family, width, depth, length) {
    if (length <= 0) return;
    const key = `${role}:${width}:${depth}`;
    if (!groups.has(key)) groups.set(key,{role,family,width,depth,cuts:[]});
    groups.get(key).cuts.push(Math.ceil(length-1e-8));
  }
  const door = {start:offset,end:offset+doorWidth,bottom:0,top:doorHeight};
  const sideTop = u => rear-slope*u;
  const walls = [
    {key:'door', end:length-wallThickness, face:length, top:sideTop, op:door},
    {key:'front', end:width, face:width, top:() => frontWallHeight, op:windows.front},
    {key:'right', end:length-wallThickness, face:length, top:sideTop, op:windows.right}
  ];
  for (const {key,end,face,top,op} of walls) {
    for (const {a,b,low,high,kind} of wallMembers(0,end,top,op,studWidth,studSpacing)) {
      const height = u => clippedHeight(top,high,u)-clippedHeight(top,low,u);
      if (Math.max(height(a),height(b)) <= 0) continue;
      const cut = kind === 'stud' ? Math.max(height(a),height(b)) :
        high(a) === top(a) && high(b) === top(b) && kind === 'wall-plate' ? Math.hypot(b-a,top(b)-top(a)) : b-a;
      add(roles[kind],'frame',studWidth,studDepth,cut);
    }

    const drip = Math.max(0,200-slabThickness);
    for (const [layer,role,stockWidth,depth] of [
      ['base','Base cladding boards',baseBoardWidth,22],
      ['cover','Cover cladding boards',coverBoardWidth,22],
      ['counter','Vertical counter-battens',48,25]
    ]) {
      const base = layer === 'counter' ? 0 : drip;
      const spans = wallCourses(layer,face,claddingSpacing,baseBoardWidth,coverBoardWidth);
      if (layer === 'base') spans.push([0,claddingSpacing*.19],[face-claddingSpacing*.19,face]);
      for (const [a,b] of spans) {
        const head = top(Math.max(0,a));
        const put = cut => add(role,layer === 'counter' ? 'batten' : 'panel',stockWidth,depth,cut);
        if (a >= op.start && b <= op.end) {
          put(Math.min(head,op.bottom)-base);
          put(head-Math.max(base,op.top));
        } else put(head-base);
      }
    }
    for (const [role,family,stockWidth,depth] of [
      ['Horizontal nailers','batten',48,25], ['Service battens','service',70,28]
    ]) {
      for (let z=0;z<top(0);z+=600) {
        const run = slope && key !== 'front' ? Math.min(face,(rear-z)/slope) : face;
        if (z >= op.bottom && z+stockWidth <= op.top && run > op.start) {
          add(role,family,stockWidth,depth,op.start);
          add(role,family,stockWidth,depth,run-op.end);
        } else add(role,family,stockWidth,depth,run);
      }
    }
    const trimWidth = model.trimWidth;
    if (trimWidth > 0) {
      for (const u of [op.start,op.end]) add('Opening trim','panel',trimWidth,22,Math.min(top(u),op.top)-op.bottom);
      const span = Math.min(face,op.end+trimWidth)-Math.max(0,op.start-trimWidth);
      add('Opening trim','panel',trimWidth,22,span);
    }
  }
  for (const _ of rafterStarts(roofWidth,doorSideOverhang,rafterWidth,rafterSpacing)) {
    add('Rafters','frame',rafterWidth,rafterDepth,(length+frontOverhang)*factor);
  }
  return [...groups.values()];
}

export function matchLumber(group, catalogue = deromeCatalogue) {
  function compare(a,b) {
    const distance = item => Math.hypot(item.width-group.width,item.depth-group.depth);
    const undersize = item => Number(item.width < group.width || item.depth < group.depth);
    return distance(a)-distance(b) || undersize(a)-undersize(b) || a.width-b.width || a.depth-b.depth;
  }
  return catalogue.filter(item => item.family === group.family).sort(compare)[0];
}

function allocate(cuts, variants) {
  const boards = [];
  const missing = [];
  for (const cut of [...cuts].sort((a,b) => b-a)) {
    const usable = board => board.left === cut || board.left >= cut+kerf;
    let best;
    for (const board of boards) {
      if (usable(board) && (!best || board.left < best.left)) best = board;
    }
    if (!best) {
      const stock = variants.find(item => usable({left:item.length}));
      if (!stock) {
        missing.push(cut);
        continue;
      }
      best = {stock,left:stock.length,cuts:[]};
      boards.push(best);
    }
    best.left = Math.max(0,best.left-cut-kerf);
    best.cuts.push(cut);
  }
  return {boards,missing};
}

export function buildBom(model) {
  return takeoff(model).flatMap(group => {
    const product = matchLumber(group);
    const {boards,missing} = allocate(group.cuts,product?.stock ?? []);
    const substitution = product && (product.width !== group.width || product.depth !== group.depth);
    const rows = new Map();
    for (const {stock,cuts} of boards) {
      if (!rows.has(stock.sku)) rows.set(stock.sku,{...group,product,substitution,stock,cuts:[],count:0});
      const row = rows.get(stock.sku);
      row.cuts.push(...cuts);
      row.count++;
    }
    if (missing.length) rows.set('missing',{...group,product,substitution,cuts:missing,count:0});
    return [...rows.values()];
  });
}
