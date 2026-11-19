export function wallPosts(start, end, op, studWidth, studSpacing) {
  const posts = [];
  function add(a,b) {
    if (b > a && !posts.some(([l,r]) => a < r && b > l)) posts.push([a,b]);
  }
  add(start,Math.min(start+studWidth,op.start));
  add(Math.max(end-studWidth,op.end),end);
  add(Math.max(start,op.start-studWidth),op.start);
  add(op.end,Math.min(end,op.end+studWidth));
  for (let a = start+studSpacing; a+studWidth <= end; a += studSpacing) {
    const b = a+studWidth;
    if ((a < op.start && b > op.start) || (a < op.end && b > op.end)) continue;
    add(a,b);
  }
  return posts.sort(([a],[b]) => a-b);
}

export function wallMembers(start, end, top, op, studWidth, studSpacing) {
  const members = [];
  function member(a,b,low,high,kind) {
    if (b > a) members.push({a,b,low,high,kind});
  }
  const constant = (z) => () => z;
  const plateTop = (u) => top(u)-studWidth;
  const zero = constant(0), plate = constant(studWidth);
  for (const [a,b] of wallPosts(start,end,op,studWidth,studSpacing)) {
    if (a >= op.start && b <= op.end) {
      member(a,b,plate,constant(op.bottom-studWidth),'stud');
      member(a,b,constant(op.top+studWidth),plateTop,'stud');
    } else {
      member(a,b,plate,plateTop,'stud');
    }
  }
  for (const [a,b] of [[start,op.start],[op.end,end]]) member(a,b,zero,plate,'wall-plate');
  member(op.start,op.end,zero,constant(Math.min(studWidth,op.bottom)),'wall-plate');
  member(start,op.start,plateTop,top,'wall-plate');
  member(op.end,end,plateTop,top,'wall-plate');
  member(op.start,op.end,(u) => Math.max(plateTop(u),op.top),top,'wall-plate');
  member(op.start,op.end,constant(Math.max(studWidth,op.bottom-studWidth)),constant(op.bottom),'window-sill');
  member(op.start,op.end,constant(op.top),(u) => Math.min(op.top+studWidth,Math.max(op.top,plateTop(u))),'opening-header');
  return members;
}

export const clippedHeight = (top, fn, u) => Math.max(0,Math.min(top(u),fn(u)));

export function rafterStarts(roofWidth, overhang, rafterWidth, spacing) {
  const rightEdge = roofWidth-overhang-rafterWidth;
  const starts = [-overhang];
  for (let x = -overhang+spacing; x+rafterWidth <= rightEdge; x += spacing) starts.push(x);
  return [...starts,rightEdge];
}

export function wallCourses(key, end, claddingSpacing, baseBoardWidth, coverBoardWidth) {
  const [width,phase,pitch] = key === 'cover' ? [coverBoardWidth,0,claddingSpacing] :
    key === 'base' ? [baseBoardWidth,.5,claddingSpacing] : [48,0,600];
  const half = width/2;
  const spans = [];
  for (let centre=phase*pitch;centre-half<end;centre+=pitch) {
    spans.push([Math.max(0,centre-half),Math.min(end,centre+half)]);
  }
  return spans;
}
