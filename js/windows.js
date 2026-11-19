export const muntinPatterns = {
  none: { label:'No muntins', columns:1, rows:1 },
  vertical: { label:'Two lights', columns:2, rows:1 },
  cross: { label:'Four lights', columns:2, rows:2 },
  six: { label:'Six lights', columns:2, rows:3 }
};

export const sillProjection = 35;
export const sillExtension = width => Math.min(25,width*.1);

export function windowProfile(op, wallThickness) {
  const size = Math.min(op.end-op.start,op.top-op.bottom);
  const gap = Math.min(12,size*.08);
  const setBack = Math.min(26,wallThickness*.25,size*.2);
  const jamb = Math.min(70,wallThickness-setBack);
  const rim = Math.min(58,size*.16);
  const glassDepth = setBack+Math.min(4,wallThickness*.05);
  return {gap,setBack,jamb,rim,glassDepth};
}

export function drawWindow(face, section, op, wall, options) {
  const {key, pattern, thickness, trim, trimColour, flashing = true} = options;
  const {gap,setBack,rim,glassDepth} = windowProfile(op,thickness);
  const {start:a,end:b,bottom:c,top:d} = op;
  const l = a+gap, r = b-gap, s = c+gap, h = d-gap;
  const x = l+rim, y = r-rim, bottom = s+rim, top = h-rim;
  const draw = (points, fill, part) => face(points.map(point => section(...point)),fill,{
    class:`window-detail window-${part}`, 'data-window':key, 'data-window-part':part
  });
  const rect = (u,v,z,t,depth,fill,part) => {
    if (v>u && t>z) draw([[u,depth,z],[v,depth,z],[v,depth,t],[u,depth,t]],fill,part);
  };
  draw([[a,0,c],[a,0,d],[l,setBack,h],[l,setBack,s]],'#767a71','reveal');
  draw([[b,0,c],[r,setBack,s],[r,setBack,h],[b,0,d]],'#969b8d','reveal');
  draw([[a,0,d],[b,0,d],[r,setBack,h],[l,setBack,h]],'#59625c','reveal');
  draw([[a,0,c],[l,setBack,s],[r,setBack,s],[b,0,c]],'#c5c6b8','reveal');
  rect(l,x,s,h,setBack,'#ecebe0','frame');
  rect(y,r,s,h,setBack,'#d7dcd2','frame');
  rect(x,y,s,bottom,setBack,'#d8ddd3','frame');
  rect(x,y,top,h,setBack,'#f8f6ea','frame');
  rect(x,y,bottom,top,glassDepth,'#729ca7','glass');
  draw([[x,glassDepth,top],[y,glassDepth,top],[y,glassDepth,top-(top-bottom)*.22],
    [x,glassDepth,top-(top-bottom)*.52]],'#9cc1c6','reflection');
  const {columns,rows} = muntinPatterns[pattern];
  const half = Math.min(10,rim*.23);
  const barDepth = Math.max(setBack,glassDepth-.5);
  for (let i=1;i<columns;i++) {
    const u = x+(y-x)*i/columns;
    rect(u-half,u+half,bottom,top,barDepth,'#eaece1','muntin');
  }
  for (let i=1;i<rows;i++) {
    const z = bottom+(top-bottom)*i/rows;
    rect(x,y,z-half,z+half,barDepth,'#eaece1','muntin');
  }

  function casing(u,v,z,t) {
    u = Math.max(wall.start,u);
    v = Math.min(wall.end,v);
    if (v<=u || t<=z || wall.top(u)<=z) return;
    if (wall.top(v)<z) v = u+(v-u)*(wall.top(u)-z)/(wall.top(u)-wall.top(v));
    const corners = [[u,-22,z],[v,-22,z],[v,-22,Math.min(t,wall.top(v))]];
    if (wall.top(u)>t && wall.top(v)<t) {
      corners.push([u+(v-u)*(wall.top(u)-t)/(wall.top(u)-wall.top(v)),-22,t]);
    }
    corners.push([u,-22,Math.min(t,wall.top(u))]);
    draw(corners,trimColour,'casing');
  }
  if (trim>0) {
    casing(a-trim,a,c,d);
    casing(b,b+trim,c,d);
    casing(a-trim,b+trim,d,d+trim);
  }
  if (!flashing) return;
  const extension = sillExtension(b-a);
  const sillA = Math.max(wall.start,a-extension), sillB = Math.min(wall.end,b+extension);
  const fall = Math.min(16,(d-c)*.1);
  const lip = Math.min(9,fall);
  const drip = c-fall;
  draw([[sillA,setBack,c],[sillB,setBack,c],[sillB,-sillProjection,drip],[sillA,-sillProjection,drip]],'#aebec1','sill');
  rect(sillA,sillB,drip-lip,drip,-sillProjection,'#687d83','drip');
  for (const u of [sillA,sillB]) {
    draw([[u,setBack,c],[u,-sillProjection,drip],[u,-sillProjection,drip+lip],[u,setBack,c+lip]],'#83989b','end-dam');
  }
  const headA = Math.max(wall.start,a-trim-8), headB = Math.min(wall.end,b+trim+8);
  const head = Math.min(d+trim+12,wall.top(headB));
  if (headB>headA && head>=d+trim+10) {
    draw([[headA,0,head],[headB,0,head],[headB,-sillProjection,head-3],[headA,-sillProjection,head-3]],'#bccacc','head');
    rect(headA,headB,head-10,head-3,-sillProjection,'#76898e','head');
  }
}
