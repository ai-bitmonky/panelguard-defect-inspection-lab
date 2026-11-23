/* PanelGuard Diagram guide — Step 2 diagrams (2a 2b 2c 2d 2e). Uses window.PGD (engine.js).
   Numbers: the student's own live values when that substep passed ("your value"), else facts.json s2 / s3 made by
   tools/guide/facts23.py with the lab's own Step 2 pipeline ("typical value", reference run). */
(function () {
'use strict';
var D = window.PGD, A = D.art, C = A.COL, t = A.t, fmt = D.fmt;
var F2 = function () { return (window.PGD_FACTS || {}).s2 || {}; };
function p1(x) { return (100 * x).toFixed(1) + '%'; }
function srcTag(you) { return { tag: you ? 'your value' : 'typical value' }; }
function refNote(you) { return you ? null : { t: '<i>Reference run of the lab’s own Step 2 code.</i>' }; }
function clean(a) { return a.filter(function (r) { return r; }); }
/* a little pile of good cells (slate tiles) */
function pile(x, yb, n, o) {
  o = o || {}; var s = '', k = Math.min(n, o.max || 3);
  for (var i = 0; i < k; i++) s += '<rect x="' + (x + i * 2) + '" y="' + (yb - 9 - i * 5) + '" width="' + (o.w || 15) + '" height="9" rx="1.5" fill="' + (o.col || '#4d6a86') + '" stroke="#0a0f15" stroke-width=".8"/>';
  return s;
}


/* ============================ 2a  Build the features ============================ */
var SMALL = {};
function smallURL(id, n) {   // the photo shrunk to n x n by block averages (the 2a "pixel summary" uses 32 x 32)
  var key = id + ':' + n; if (SMALL[key]) return SMALL[key];
  var px = D.pixels(id); if (!px) return '';
  var cv = document.createElement('canvas'); cv.width = cv.height = n; var x = cv.getContext('2d'), im = x.createImageData(n, n), b = 64 / n;
  for (var r = 0; r < n; r++) for (var q = 0; q < n; q++) { var sum = 0; for (var i = 0; i < b; i++) for (var j = 0; j < b; j++) sum += px[(r * b + i) * 64 + q * b + j]; var v = sum / b / b, k = 4 * (r * n + q); im.data[k] = im.data[k + 1] = im.data[k + 2] = v; im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0); return (SMALL[key] = cv.toDataURL('image/png'));
}
var BENCH = [{ k: 'A', name: 'LINE FINDER', col: '#46e3ff', x: 214 }, { k: 'B', name: 'DARK MAP', col: '#a98bff', x: 466 }, { k: 'C', name: 'PIXEL SUMMARY', col: '#ffb547', x: 718 }];
var BW = 222, BY = 34, BH = 286;
/* line directions in one 16 x 16 box: 9 bars; under each bar a small line drawn in that direction
   (the line runs 90 degrees from the brightness change the code measures). The straight-across bar (busbar) is gray. */
function fan(x, yb, w, h, dirs, col, o) {
  o = o || {}; var s = '', bw = w / 9;
  s += '<line x1="' + x + '" x2="' + (x + w) + '" y1="' + yb + '" y2="' + yb + '" stroke="#3a4757"/>';
  dirs.forEach(function (v, k) {
    var bx = x + k * bw, hh = Math.max(1.5, v * h), flat = k === 4, a = ((k * 20 + 10 + 90) % 180) * Math.PI / 180, L = bw * 0.36;
    s += '<rect x="' + (bx + 2) + '" y="' + (yb - hh) + '" width="' + (bw - 4) + '" height="' + hh + '" rx="2" fill="' + (flat ? '#6b7a8f' : col) + '"/>';
    s += '<path d="M' + (bx + bw / 2 - L * Math.cos(a)).toFixed(1) + ' ' + (yb + 13 + L * Math.sin(a)).toFixed(1) + 'L' + (bx + bw / 2 + L * Math.cos(a)).toFixed(1) + ' ' + (yb + 13 - L * Math.sin(a)).toFixed(1) + '" stroke="' + (flat ? '#8d9bb0' : col) + '" stroke-width="2.2" stroke-linecap="round"/>';
    if (o.vals && !flat && v >= 0.05) s += A.t(bx + bw / 2, yb - hh - 5, v.toFixed(2), { size: 12, a: 'middle', f: 'm', fill: col });
  });
  return s;
}
function grid8(x, y, cs, patch, col) {
  var s = '';
  for (var i = 0; i < 64; i++) { var v = patch[i], r = Math.floor(i / 8), q = i % 8; s += '<rect x="' + (x + q * cs) + '" y="' + (y + r * cs) + '" width="' + (cs - 1.5) + '" height="' + (cs - 1.5) + '" rx="1.5" fill="' + col + '" fill-opacity="' + (0.08 + 0.92 * Math.min(1, v / 0.45)).toFixed(2) + '"/>'; }
  return s;
}
function pcaBars(x, y, w, h, vals, col) {
  var s = '<line x1="' + x + '" x2="' + (x + w) + '" y1="' + (y + h / 2) + '" y2="' + (y + h / 2) + '" stroke="#3a4757"/>', bw = w / vals.length;
  vals.forEach(function (v, k) { var hh = Math.max(1.5, Math.min(h / 2, Math.abs(v) / 8 * h / 2)); s += '<rect x="' + (x + k * bw + 3) + '" y="' + (v >= 0 ? y + h / 2 - hh : y + h / 2) + '" width="' + (bw - 6) + '" height="' + hh + '" rx="2" fill="' + col + '"/>'; });
  return s;
}
function bench(b, i, state, fx) {
  var x = b.x, on = state.at === i + 1, done = state.at > i + 1 || state.at === 4, s = '';
  s += '<g opacity="' + (on || done ? 1 : 0.62) + '">' + A.glass(x, BY, BW, BH, { fx: fx, col: on ? b.col : '#2b4157' });
  s += '<rect x="' + (x + 12) + '" y="' + (BY + 12) + '" width="30" height="30" rx="7" fill="' + b.col + '" fill-opacity="' + (on || done ? 1 : .35) + '"/>' + t(x + 27, BY + 33, b.k, { size: 18, a: 'middle', f: 'h', fill: '#081018' });
  s += t(x + 52, BY + 33, b.name, { size: 15, f: 'h', fill: on || done ? b.col : C.dim, ls: '.08em' });
  s += '<rect x="' + (x + 12) + '" y="' + (BY + 54) + '" width="' + (BW - 24) + '" height="' + (BH - 110) + '" rx="8" fill="#060b12" stroke="#1b2a3b"/>';
  // the nozzle to the vector rack
  var nx = x + BW / 2; s += '<path d="M' + (nx - 18) + ' ' + (BY + BH) + 'h36l-8 16h-20z" fill="' + (fx ? 'url(#' + fx.mt + ')' : '#2a3340') + '" stroke="#3a4757"/>';
  s += '</g>';
  return s;
}
function benchInside(b, i, cellId, side, fx) {
  var F = F2(), d = F[side] || {}, x = b.x + 12, y = BY + 54, w = BW - 24, h = BH - 110, s = '';
  if (i === 0) {   // line finder: the box on the photo + the 9 line directions in that box
    var bx = F.cells.box;
    s += A.cell(cellId, x + 10, y + 26, 84) + '<rect x="' + (x + 10 + bx[1] * 21) + '" y="' + (y + 26 + bx[0] * 21) + '" width="21" height="21" fill="none" stroke="' + b.col + '" stroke-width="2.2"/>';
    s += '<path d="M' + (x + 10 + bx[1] * 21 + 21) + ' ' + (y + 26 + bx[0] * 21 + 10) + 'L' + (x + 112) + ' ' + (y + 70) + '" stroke="' + b.col + '" stroke-dasharray="3 3"/>';
    s += fan(x + 104, y + 120, 92, 80, d.dirs, b.col);
    s += t(x + 10, y + 18, 'box 2 of 16', { size: 14, fill: C.dim }) + t(x + 150, y + h - 6, '9 line directions', { size: 14, a: 'middle', fill: C.dim });
  } else if (i === 1) {   // dark map: the 8 x 8 patch dark shares
    s += grid8(x + 16, y + 14, 18, d.patch, b.col);
    s += t(x + 172, y + 40, 'darkest', { size: 14, a: 'middle', fill: C.dim }) + t(x + 172, y + 62, d.darkMax.toFixed(2), { size: 19, a: 'middle', f: 'm', w: 700, fill: b.col });
    s += t(x + 172, y + 104, 'spread', { size: 14, a: 'middle', fill: C.dim }) + t(x + 172, y + 126, d.spread.toFixed(3), { size: 19, a: 'middle', f: 'm', w: 700, fill: b.col });
    s += t(x + 88, y + h - 4, '8 × 8 patches: share of dark pixels', { size: 13.5, a: 'middle', fill: C.dim });
  } else {   // pixel summary: 32 x 32, then 40 numbers
    var u = smallURL(cellId, 32);
    s += (u ? '<image href="' + u + '" x="' + (x + 10) + '" y="' + (y + 22) + '" width="80" height="80" style="image-rendering:pixelated"/>' : '') + '<rect x="' + (x + 10) + '" y="' + (y + 22) + '" width="80" height="80" fill="none" stroke="#3a4757"/>';
    s += t(x + 50, y + 122, '32 × 32', { size: 14, a: 'middle', f: 'm', fill: C.dim });
    s += A.arrow(x + 96, y + 62, x + 112, y + 62, b.col, { w: 2, head: 8 });
    s += pcaBars(x + 116, y + 22, 78, 80, d.pca, b.col) + t(x + 155, y + 122, 'first 6 of 40', { size: 14, a: 'middle', fill: C.dim });
    s += t(x + w / 2, y + h - 4, '1,024 pixels → 40 numbers', { size: 14, a: 'middle', fill: C.dim });
  }
  return s;
}
function rack(state, fx) {
  var F = F2(), dm = F.dims || { A: 144, B: 193, C: 40, F: 377 }, x0 = 40, W = 880, y = 382, h = 36, s = '', x = x0;
  s += A.glass(28, 352, 904, 176, { fx: fx, col: '#22384d' });
  s += t(46, 374, 'FEATURE VECTOR OF ONE CELL', { size: 14, f: 'h', fill: C.dim, ls: '.12em' });
  BENCH.forEach(function (b, i) {
    var n = dm[b.k], w = W * n / dm.F, full = state.at > i;
    s += '<rect x="' + (x + 1) + '" y="' + y + '" width="' + (w - 2) + '" height="' + h + '" rx="5" fill="' + (full ? b.col : '#0b121b') + '" fill-opacity="' + (full ? .28 : 1) + '" stroke="' + b.col + '" stroke-opacity="' + (full ? .9 : .35) + '"' + (full && state.at === i + 1 ? ' class="pgd-fade"' : '') + '/>';
    if (full) for (var k = 0; k < Math.min(n, 60); k++) s += '<rect x="' + (x + 6 + k * (w - 12) / Math.min(n, 60)) + '" y="' + (y + 8 + (1 - Math.abs(Math.sin(k * 1.7 + i))) * 18) + '" width="' + Math.max(1, (w - 12) / Math.min(n, 60) - 1.5) + '" height="' + (6 + Math.abs(Math.sin(k * 1.7 + i)) * 18) + '" fill="' + b.col + '" opacity=".55"/>';
    s += t(x + w - 6, y + h + 20, b.k + ' · ' + n, { size: 15, a: 'end', f: 'm', w: 700, fill: full ? b.col : C.dim2 });
    x += w;
  });
  var tot = (state.at >= 1 ? dm.A : 0) + (state.at >= 2 ? dm.B : 0) + (state.at >= 3 ? dm.C : 0);
  s += t(912, 374, tot + ' of ' + dm.F + ' numbers', { size: 16, a: 'end', f: 'm', w: 700, fill: tot === dm.F ? '#fff' : C.cy });
  // a few of the real numbers each bench put in
  var d = F.crack || {}, ex = [];
  if (state.at >= 1) ex.push([BENCH[0], 'slanted lines in the crack box: ' + [d.dirs[2], d.dirs[3], d.dirs[5]].map(function (v) { return v.toFixed(3); }).join('  ')]);
  if (state.at >= 2) ex.push([BENCH[1], 'darkest patch ' + d.darkMax.toFixed(2) + '   spread ' + d.spread.toFixed(3)]);
  if (state.at >= 3) ex.push([BENCH[2], 'summary ' + d.pca.slice(0, 3).map(function (v) { return v.toFixed(2); }).join('  ') + ' …']);
  ex.forEach(function (e, k) { s += '<g class="' + (k === ex.length - 1 ? 'pgd-in' : '') + '"><rect x="46" y="' + (448 + k * 24) + '" width="11" height="11" rx="2" fill="' + e[0].col + '"/>' + t(66, 459 + k * 24, e[0].k + ' · ' + e[1], { size: 16, f: 'm', fill: '#c7d4e4' }) + '</g>'; });
  if (!ex.length) s += t(46, 470, 'Empty: drag the photo through the benches to fill it.', { size: 17, fill: C.dim });
  return s;
}
function scene2a(c, o) {
  var st = c.state, fx = A.fx(), s = A.stage() + fx.defs, F = F2(), id = F.cells ? F.cells.crack : 6;
  BENCH.forEach(function (b, i) { s += bench(b, i, st, fx); s += st.at > i ? '<g class="' + (st.at === i + 1 ? 'pgd-in' : '') + '">' + benchInside(b, i, id, 'crack', fx) + '</g>' : '<g opacity=".13">' + benchInside(b, i, id, 'good', fx) + '</g>' + t(b.x + BW / 2, BY + 150, 'waiting', { size: 16, a: 'middle', fill: C.dim2 }); });
  // the dock with the real photo
  s += A.glass(22, BY, 176, BH, { fx: fx, col: '#2b4157' }) + t(36, BY + 33, 'REAL CELL ' + id, { size: 15, f: 'h', fill: C.dim, ls: '.08em' }) + t(36, BY + 56, 'cracked, mono', { size: 15, fill: '#ff8aa0' });
  if (st.at > 0) s += '<g opacity=".4">' + A.photoCard(id, 40, 92, 140, { full: true }) + '</g>' + (o && o.drag != null ? t(110, 270, 'now at bench ' + BENCH[Math.min(3, st.at) - 1].k, { size: 15, a: 'middle', fill: C.dim }) : '');
  if (st.at > 0 && !(o && o.drag != null)) s += A.photoCard(id, BENCH[st.at - 1].x + 16, BY + 236, 44, { full: true });
  s += rack(st, fx);
  if (o && o.drag != null) {
    var b = BENCH[o.drag], hx = st.at === 0 ? 40 : BENCH[st.at - 1].x + 16, hy = st.at === 0 ? 92 : BY + 236;
    var sz = st.at === 0 ? 140 : 44, ccx = hx + sz / 2, ccy = hy + sz / 2, tx = ccx + Math.round((b.x + BW / 2 - ccx) / 40) * 40, ty = ccy + Math.round((BY + 150 - ccy) / 40) * 40;
    s += A.target('carry', '<rect x="' + (hx - 6) + '" y="' + (hy - 6) + '" width="' + (sz + 12) + '" height="' + (sz + 12) + '" rx="8" fill="none" stroke="#ffb547" stroke-width="3"/>',
      'drag the photo to ' + b.k, st.at === 0 ? 110 : hx + 56, st.at === 0 ? 290 : BY + 262,
      { kind: 'drag', to: tx + ',' + ty, inner: '<g class="pgd-carry">' + A.photoCard(id, hx, hy, sz, { fx: fx, full: true }) + '</g>', la: st.at === 0 ? 'middle' : 'start' });
  } else if (st.at === 0) s += A.photoCard(id, 40, 92, 140, { fx: fx, full: true });
  return s;
}
function bind2a(c, root, to) {
  var el = root.querySelector('[data-pgd-t=carry]'); if (!el) return;
  var st = c.state, hx = st.at === 0 ? 40 : BENCH[st.at - 1].x + 16, hy = st.at === 0 ? 92 : BY + 236, b = BENCH[to];
  var drag = D.onDrag(root, el, { start: { x: hx, y: hy }, step: 40,
    move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - hx) + ' ' + (p.y - hy) + ')'); },
    drop: function (p) {
      var sz = st.at === 0 ? 140 : 44, cx = p.x + sz / 2, cy = p.y + sz / 2;
      if (cx > b.x - 30 && cx < b.x + BW + 30 && cy > BY - 20 && cy < BY + BH + 30) { st.at = to + 1; c.next(); }
      else { el.setAttribute('transform', ''); drag.set({ x: hx, y: hy }); }
    } });
}
function work2a(c) {
  var F = F2(), d = F.crack || {}, dm = F.dims || {}, at = c.state.at, r = [];
  if (at === 0) r = [{ h: 'Why numbers?' }, { t: 'A model cannot read a photo. It reads a list of numbers. Each bench measures one thing a crack changes.' }, { v: '64 × 64 = 4,096', k: 'pixels in one photo' }, { t: 'The benches make <b>' + dm.F + '</b> numbers that say more about defects.' }];
  if (at === 1) r = [{ h: 'A · Line finder' }, { v: '4 × 4 = 16', k: 'boxes of 16 × 16 pixels' }, { op: '×', v: '9', k: 'line directions per box' }, { op: '=', v: String(dm.A), k: 'numbers', res: true },
    { t: 'In the crack box the busbar line (gray) is strong. The crack adds slanted lines: <b>' + d.dirs[2].toFixed(3) + '</b>, <b>' + d.dirs[3].toFixed(3) + '</b>, <b>' + d.dirs[5].toFixed(3) + '</b>.' }];
  if (at === 2) r = [{ h: 'B · Dark map' }, { v: '64 + 64', k: 'row averages + column averages' }, { op: '+', v: '64', k: 'dark share of each 8 × 8 patch' }, { op: '+', v: '1', k: 'spread of brightness' }, { op: '=', v: String(dm.B), k: 'numbers', res: true },
    { t: 'Darkest patch of this cell: <b>' + d.darkMax.toFixed(2) + '</b> = ' + Math.round(d.darkMax * 64) + ' of its 64 pixels are dark.' }];
  if (at === 3) r = [{ h: 'C · Pixel summary' }, { v: '32 × 32 = 1,024', k: 'pixels after shrinking' }, { op: '→', v: String(dm.C), k: 'numbers that keep the main patterns' }, { op: '=', v: Math.round(100 * F.pcaVar) + '%', k: 'of the pixel variation kept', res: true },
    { t: 'The summary learns its patterns from the <b>' + fmt(F.nTrain) + '</b> train cells only. Validation and test stay unseen.' }];
  if (at === 4) r = [{ h: 'All three together' }, { v: dm.A + ' + ' + dm.B + ' + ' + dm.C, k: 'line finder + dark map + summary' }, { op: '=', v: String(dm.F), k: 'numbers per cell', res: true }];
  r.push({ tag: 'typical value' }, { t: '<i>Real cell ' + (F.cells ? F.cells.crack : 6) + ', computed with the lab’s own 2a code.</i>' });
  return r;
}
D.register('2a', {
  init: function () { return { at: 0 }; },
  frames: [
  { cap: 'Three benches turn one photo into numbers',
    note: 'A model reads numbers, not photos. Three benches each measure something a defect changes: lines, dark spots, and the overall picture.',
    svg: function (c) { return scene2a(c, { drag: 0 }); }, work: work2a, bind: function (c, root) { bind2a(c, root, 0); }, auto: function (c) { c.state.at = 1; } },
  { cap: 'A · Line finder: which way do the lines run?',
    note: 'In each 16 × 16 box the line finder measures how strong the lines are in 9 directions. Busbars run straight across; a crack adds slanted lines.',
    svg: function (c) { return scene2a(c, { drag: 1 }); }, work: work2a, bind: function (c, root) { bind2a(c, root, 1); }, auto: function (c) { c.state.at = 2; } },
  { cap: 'B · Dark map: where are the dark spots?',
    note: 'The dark map measures how dark each row, each column and each 8 × 8 patch is. A crack or a dead area makes some patches dark.',
    svg: function (c) { return scene2a(c, { drag: 2 }); }, work: work2a, bind: function (c, root) { bind2a(c, root, 2); }, auto: function (c) { c.state.at = 3; } },
  { cap: 'C · Pixel summary: the whole picture in 40 numbers',
    note: 'The photo is shrunk to 32 × 32. Then a summary (PCA) keeps the 40 strongest patterns. It learns them from the train cells only.',
    svg: function (c) {
      var s = scene2a(c, {});
      s += A.target('cmp', '<rect x="30" y="262" width="160" height="50" rx="10" fill="#0b121b" stroke="#ffb547" stroke-width="2.5"/>', 'compare', 110, 252, { inner: t(110, 295, 'good cell ' + (F2().cells ? F2().cells.good : 447), { size: 16, a: 'middle', fill: '#cfe7ff' }) });
      return s;
    }, work: work2a, on: { cmp: function (c) { c.next(); } } },
  { cap: 'Same benches, a good cell: the numbers differ',
    note: 'A good cell of the same kind gives very different numbers: almost no slanted lines and fewer dark patches. That difference is what the model learns.',
    svg: function (c) {
      var F = F2(), fx = A.fx(), s = A.stage() + fx.defs, ids = [F.cells.crack, F.cells.good], sides = ['crack', 'good'], cols = ['#ff8aa0', '#3dffa0'];
      s += t(250, 40, 'A · LINE FINDER', { size: 15, f: 'h', a: 'middle', fill: BENCH[0].col, ls: '.08em' }) + t(470, 40, 'B · DARK MAP', { size: 15, f: 'h', a: 'middle', fill: BENCH[1].col, ls: '.08em' }) + t(760, 40, 'C · SUMMARY (FIRST 6)', { size: 15, f: 'h', a: 'middle', fill: BENCH[2].col, ls: '.08em' });
      sides.forEach(function (sd, r) {
        var y = 60 + r * 236, d = F[sd];
        s += A.glass(20, y, 920, 220, { fx: fx, col: r ? '#2f6b55' : '#7a3446' });
        s += A.photoCard(ids[r], 40, y + 34, 120, { full: true, ring: cols[r] }) + t(100, y + 24, (r ? 'GOOD · CELL ' : 'CRACKED · CELL ') + ids[r], { size: 14, f: 'h', a: 'middle', fill: cols[r] });
        s += '<g class="pgd-in' + (r ? '2' : '') + '">' + fan(184, y + 150, 140, 110, d.dirs, BENCH[0].col);
        s += t(254, y + 196, 'slanted: ' + (d.dirs[2] + d.dirs[3] + d.dirs[5]).toFixed(2), { size: 17, a: 'middle', f: 'm', w: 700, fill: BENCH[0].col });
        s += grid8(395, y + 30, 19, d.patch, BENCH[1].col) + t(470, y + 196, 'darkest ' + d.darkMax.toFixed(2) + ' · spread ' + d.spread.toFixed(3), { size: 15, a: 'middle', f: 'm', fill: BENCH[1].col });
        var u = smallURL(ids[r], 32);
        s += (u ? '<image href="' + u + '" x="590" y="' + (y + 40) + '" width="110" height="110" style="image-rendering:pixelated"/>' : '') + A.arrow(708, y + 95, 730, y + 95, BENCH[2].col, { w: 2, head: 8 });
        s += pcaBars(738, y + 36, 180, 120, d.pca, BENCH[2].col) + t(828, y + 196, d.pca.slice(0, 3).map(function (v) { return v.toFixed(2); }).join('  '), { size: 15, a: 'middle', f: 'm', fill: BENCH[2].col }) + '</g>';
      });
      return s;
    },
    work: function (c) {
      var F = F2(), a = F.crack, b = F.good, sl = function (d) { return (d.dirs[2] + d.dirs[3] + d.dirs[5]).toFixed(2); };
      var mx = (D.liveSub('2a').mech || {}).results || [], rows = [{ h: 'Cracked vs good' }, { v: sl(a) + ' vs ' + sl(b), k: 'slanted lines in the crack box' }, { v: a.darkMax.toFixed(2) + ' vs ' + b.darkMax.toFixed(2), k: 'darkest patch' },
        { v: a.pca[0].toFixed(2) + ' vs ' + b.pca[0].toFixed(2), k: 'first summary number' }, { tag: 'typical value' }, { h: 'Which mix works best?' }];
      if (mx.length) { mx.forEach(function (m) { rows.push({ v: m.auc.toFixed(3), k: m.keys.join(' + ') + ' · ' + m.dims + ' numbers' }); }); rows.push({ tag: 'your value' }); }
      else rows.push({ t: 'Measure mixes with the chips in the lab. Your scores show here.' });
      return rows;
    } }
  ]
});


/* ============================ 2b  Train three inspectors ============================ */
var GLYPH = {   // a small picture of how each model draws its line between OK and defect
  'Logistic regression': function (x, y, col) { return '<path d="M' + (x - 26) + ' ' + (y + 18) + 'L' + (x + 26) + ' ' + (y - 18) + '" stroke="' + col + '" stroke-width="3"/>' + dots(x, y); },
  'Random forest': function (x, y, col) { return '<path d="M' + (x - 26) + ' ' + (y + 4) + 'H' + (x - 6) + 'V' + (y - 16) + 'H' + (x + 10) + 'V' + (y + 2) + 'H' + (x + 26) + '" stroke="' + col + '" stroke-width="3" fill="none"/>' + dots(x, y); },
  'SVC (RBF)': function (x, y, col) { return '<ellipse cx="' + (x + 4) + '" cy="' + (y - 2) + '" rx="17" ry="12" stroke="' + col + '" stroke-width="3" fill="none"/>' + dots(x, y); }
};
function dots(x, y) { var s = '', P = [[-20, -14, 0], [-14, 8, 0], [16, 16, 0], [22, -16, 0], [-2, 14, 0], [2, -4, 1], [10, 0, 1], [-4, -10, 1]]; P.forEach(function (p) { s += '<circle cx="' + (x + p[0]) + '" cy="' + (y + p[1]) + '" r="3" fill="' + (p[2] ? '#ff4d6a' : '#8fb0cf') + '"/>'; }); return s; }
var MCOL = ['#46e3ff', '#3dffa0', '#a98bff'];
function models2b() {
  var r = D.liveRes('2b'), F = F2();
  if (r && r.models && r.models.length === 3 && r.models[0].folds.length === 5) return { m: r.models.map(function (q) { var mu = q.mean, sd = Math.sqrt(q.folds.reduce(function (a, v) { return a + (v - mu) * (v - mu); }, 0) / q.folds.length); return { name: q.name, folds: q.folds, mean: q.mean, sd: sd, sec: q.sec }; }), you: true };
  return { m: F.models || [], you: false };
}
function wedge(cx, cy, r0, r1, a0, a1) {
  var p = function (r, a) { return (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1); };
  return 'M' + p(r0, a0) + 'L' + p(r1, a0) + 'A' + r1 + ' ' + r1 + ' 0 0 1 ' + p(r1, a1) + 'L' + p(r0, a1) + 'A' + r0 + ' ' + r0 + ' 0 0 0 ' + p(r0, a0) + 'Z';
}
var TC = { x: 190, y: 250, r0: 58, r1: 150 };
function tray2b(c, fx, opts) {
  var F = F2(), st = c.state, s = '', A0 = -Math.PI / 2 - Math.PI / 5;
  s += '<ellipse cx="' + TC.x + '" cy="' + (TC.y + 168) + '" rx="150" ry="16" fill="#000" opacity=".5"/>';
  s += '<circle cx="' + TC.x + '" cy="' + TC.y + '" r="' + (TC.r1 + 10) + '" fill="' + (fx ? 'url(#' + fx.mt + ')' : '#1d2632') + '" stroke="#3a4757"/>';
  for (var k = 0; k < 5; k++) {
    var a0 = A0 + k * 2 * Math.PI / 5 + 0.02, a1 = a0 + 2 * Math.PI / 5 - 0.04, am = (a0 + a1) / 2, chk = st.cur === k, done = st.done.indexOf(k) >= 0;
    var off = chk ? 18 : 0, dx = off * Math.cos(am), dy = off * Math.sin(am), id = 'w2b' + k;
    var g = '<g transform="translate(' + dx.toFixed(1) + ' ' + dy.toFixed(1) + ')"' + (chk && st.acted ? ' class="pgd-pop"' : '') + '>';
    g += '<path d="' + wedge(TC.x, TC.y, TC.r0, TC.r1, a0, a1) + '" fill="' + (chk ? '#3a2a0c' : '#0f1a27') + '" stroke="' + (chk ? '#ffb547' : done ? '#2f6b55' : '#2b4157') + '" stroke-width="' + (chk ? 3 : 1.5) + '"/>';
    (F.foldCells ? F.foldCells[k] : []).slice(0, 3).forEach(function (cid, j) {
      var rr = 92 + (j === 1 ? 26 : 0), aa = am + (j - 1) * 0.28, px = TC.x + rr * Math.cos(aa) - 13, py = TC.y + rr * Math.sin(aa) - 13;
      g += A.cell(cid, px, py, 26, { r: 2 });
    });
    var lx = TC.x + (TC.r1 + 26) * Math.cos(am), ly = TC.y + (TC.r1 + 26) * Math.sin(am);
    g += t(lx, ly + 5, 'fold ' + (k + 1), { size: 15, a: 'middle', f: 'm', w: 700, fill: chk ? '#ffb547' : done ? C.gr : C.dim }) + '</g>';
    if (opts && opts.tap && !done && !chk) s += A.target('f' + k, '<path d="' + wedge(TC.x, TC.y, TC.r0, TC.r1, a0, a1) + '" fill="#ffb547" fill-opacity=".08" stroke="#ffb547" stroke-width="3"/>', k === opts.first ? opts.label : '', TC.x, 462, { inner: g, cls: k === opts.first ? '' : 'pgd-nochip' });
    else s += g;
  }
  s += '<circle cx="' + TC.x + '" cy="' + TC.y + '" r="' + (TC.r0 - 4) + '" fill="#0a121c" stroke="#2b4157"/>' + t(TC.x, TC.y - 4, fmt(F.nTrain || 1574), { size: 19, a: 'middle', f: 'm', w: 700 }) + t(TC.x, TC.y + 18, 'train cells', { size: 14, a: 'middle', fill: C.dim });
  s += t(30, 40, 'THE TRAIN TRAY IN 5 FOLDS', { size: 14, f: 'h', fill: C.dim, ls: '.1em' });
  s += '<rect x="30" y="482" width="14" height="14" rx="3" fill="#3a2a0c" stroke="#ffb547" stroke-width="2"/>' + t(52, 494, 'check fold', { size: 15, fill: C.am }) + '<rect x="150" y="482" width="14" height="14" rx="3" fill="#0f1a27" stroke="#2b4157" stroke-width="2"/>' + t(172, 494, 'the other 4 folds: learn', { size: 15, fill: C.dim });
  return s;
}
function booths2b(c, fx, M, named, o) {
  o = o || {}; var s = '';
  M.forEach(function (m, i) {
    var x = 382 + i * 188, y = 30, win = o.win === i, dim = o.win != null && !win;
    s += '<g opacity="' + (dim ? .45 : 1) + '">' + A.glass(x, y, 172, 150, { fx: fx, col: win ? '#ffb547' : MCOL[i] });
    s += '<rect x="' + (x + 14) + '" y="' + (y + 14) + '" width="144" height="78" rx="8" fill="#060b12" stroke="#1b2a3b"/>';
    s += named ? GLYPH[m.name] ? GLYPH[m.name](x + 86, y + 53, MCOL[i]) : '' : '<circle cx="' + (x + 86) + '" cy="' + (y + 53) + '" r="24" fill="none" stroke="' + MCOL[i] + '" stroke-dasharray="4 4"/>' + t(x + 86, y + 62, '?', { size: 26, a: 'middle', f: 'h', fill: MCOL[i] });
    s += t(x + 86, y + 118, named ? m.name : 'Inspector ' + (i + 1), { size: 16, a: 'middle', w: 700, fill: MCOL[i] });
    if (o.cur != null && !dim) s += t(x + 86, y + 140, 'checks fold ' + (o.cur + 1), { size: 14, a: 'middle', fill: C.dim });
    if (win) s += '<rect x="' + (x + 46) + '" y="' + (y - 12) + '" width="80" height="24" rx="12" fill="#ffb547"/>' + t(x + 86, y + 5, 'BEST', { size: 13, a: 'middle', f: 'h', fill: '#1a1103' });
    s += '</g>';
  });
  return s;
}
function board2b(c, fx, M, named, shown, o) {
  o = o || {}; var s = '', x0 = 382, y0 = 204;
  s += A.glass(372, 192, 560, 330, { fx: fx, col: '#22384d' });
  s += t(x0 + 6, y0 + 22, 'SCOREBOARD · RANKING SCORE (1.0 = PERFECT)', { size: 13.5, f: 'h', fill: C.dim, ls: '.08em' });
  for (var k = 0; k < 5; k++) s += t(x0 + 160 + k * 58, y0 + 50, 'fold ' + (k + 1), { size: 14, a: 'middle', f: 'm', fill: shown.indexOf(k) >= 0 ? C.am : C.dim2 });
  s += t(x0 + 482, y0 + 50, 'mean ± spread', { size: 14, a: 'middle', fill: C.dim });
  M.forEach(function (m, i) {
    var y = y0 + 84 + i * 40;
    s += '<rect x="' + (x0 + 2) + '" y="' + (y - 24) + '" width="544" height="34" rx="6" fill="' + (o.win === i ? 'rgba(255,181,71,.12)' : i % 2 ? 'rgba(255,255,255,.02)' : 'none') + '"/>';
    s += '<circle cx="' + (x0 + 14) + '" cy="' + (y - 7) + '" r="5" fill="' + MCOL[i] + '"/>' + t(x0 + 26, y - 2, named ? ({ 'Logistic regression': 'Logistic reg.', 'SVC (RBF)': 'SVC (RBF)' }[m.name] || m.name) : 'Inspector ' + (i + 1), { size: 15, w: 700, fill: MCOL[i] });
    for (var k2 = 0; k2 < 5; k2++) {
      var on = shown.indexOf(k2) >= 0, nw = o.just === k2;
      s += on ? t(x0 + 160 + k2 * 58, y - 2, m.folds[k2].toFixed(3), { size: 14.5, a: 'middle', f: 'm', w: 700, fill: '#e6eef8', cls: nw ? 'pgd-pop' : '' }) : t(x0 + 160 + k2 * 58, y - 2, '·', { size: 15, a: 'middle', fill: C.dim2 });
    }
    if (shown.length === 5) s += t(x0 + 482, y - 2, m.mean.toFixed(3) + ' ± ' + m.sd.toFixed(3), { size: 15, a: 'middle', f: 'm', w: 700, fill: o.win === i ? '#ffb547' : '#fff', cls: 'pgd-pop' });
  });
  // the dot plot: every fold score as a dot, the mean as a bar
  var ch = A.chart({ x: x0 + 70, y: y0 + 216, w: 440, h: 64, xd: [0.75, 0.9], yd: [0, 3], xt: [0.75, 0.8, 0.85, 0.9], fx: function (v) { return v.toFixed(2); } });
  s += ch.svg.replace(/<rect[^>]*opacity=".55"\/>/, '');
  M.forEach(function (m, i) {
    var y = ch.Y(2.5 - i);
    s += t(x0 + 60, y + 5, named ? m.name.split(' ')[0] : '#' + (i + 1), { size: 13.5, a: 'end', fill: MCOL[i] });
    shown.forEach(function (k) { s += '<circle cx="' + ch.X(m.folds[k]).toFixed(1) + '" cy="' + y + '" r="5" fill="' + MCOL[i] + '" fill-opacity=".75"' + (o.just === k ? ' class="pgd-pop"' : '') + '/>'; });
    if (shown.length === 5) s += '<line x1="' + ch.X(m.mean - m.sd) + '" x2="' + ch.X(m.mean + m.sd) + '" y1="' + y + '" y2="' + y + '" stroke="' + MCOL[i] + '" stroke-width="2"/><rect x="' + (ch.X(m.mean) - 2) + '" y="' + (y - 10) + '" width="4" height="20" fill="#fff"/>';
  });
  return s;
}
function work2b(c, M, you, named) {
  var st = c.state, F = F2(), k = st.cur, r = [];
  if (k == null) r = [{ h: 'Five folds' }, { v: fmt(F.nTrain) + ' ÷ 5 ≈ ' + F.foldSizes[0], k: 'cells per fold (' + F.foldDef[0] + ' or ' + F.foldDef[2] + ' defects each)' }, { t: 'One fold is held back to check. The other four teach. Every fold takes one turn.' }];
  else {
    r = [{ h: 'Fold ' + (k + 1) + ' checks' }, { v: fmt(F.nTrain - F.foldSizes[k]), k: 'cells learn (4 folds)' }, { v: String(F.foldSizes[k]), k: 'cells check (fold ' + (k + 1) + ')' }];
    M.forEach(function (m, i) { r.push({ v: m.folds[k].toFixed(3), k: (named ? m.name : 'Inspector ' + (i + 1)) + ' on fold ' + (k + 1), col: MCOL[i] }); });
  }
  r.push(srcTag(you)); if (!you) r.push({ t: '<i>Reference run of the lab’s own 2b code.</i>' });
  return r;
}
D.register('2b', {
  init: function () { return { cur: null, done: [], acted: 0 }; },
  frames: [
  { cap: 'Split the train tray into 5 folds',
    note: 'Cross-validation cuts the train tray into 5 folds. Each turn, one fold checks and the other four teach. All three inspectors see the same folds.',
    svg: function (c) { var R = models2b(), nm = D.predDone('2b'), fx = A.fx(); return A.stage() + fx.defs + tray2b(c, fx, { tap: 1, first: 0, label: 'tap a fold to check with' }) + booths2b(c, fx, R.m, nm) + board2b(c, fx, R.m, nm, []); },
    work: function (c) { var R = models2b(); return work2b(c, R.m, R.you, D.predDone('2b')); },
    bind: function (c, root) { root.querySelectorAll('.pgd-target').forEach(function (el) { D.onTap(el, function () { var k = +el.getAttribute('data-pgd-t').slice(1); c.state.cur = k; c.state.done = [k]; c.state.acted = 1; c.next(); }); }); },
    auto: function (c) { c.state.cur = 0; c.state.done = [0]; } },
  { cap: 'Turn the tray: every fold takes a turn',
    note: 'Each fold checks once. Each inspector gets 5 scores, one per fold, all on cells it did not learn from.',
    svg: function (c) {
      var R = models2b(), nm = D.predDone('2b'), fx = A.fx(), st = c.state, left = [0, 1, 2, 3, 4].filter(function (k) { return st.done.indexOf(k) < 0; });
      var s = A.stage() + fx.defs + tray2b(c, fx, { tap: 1, first: left[0], label: 'next fold' }) + booths2b(c, fx, R.m, nm, { cur: st.cur }) + board2b(c, fx, R.m, nm, st.done, { just: st.cur });
      // flows: the check fold to the booths
      var am = -Math.PI / 2 - Math.PI / 5 + (st.cur + 0.5) * 2 * Math.PI / 5, fx0 = TC.x + 120 * Math.cos(am), fy0 = TC.y + 120 * Math.sin(am);
      [0, 1, 2].forEach(function (i) { s += '<path d="M' + fx0.toFixed(0) + ' ' + fy0.toFixed(0) + 'C' + (fx0 + 120) + ' ' + (fy0 - 60) + ' ' + (420 + i * 188) + ' 230 ' + (468 + i * 188) + ' 182" stroke="#ffb547" stroke-opacity=".55" stroke-width="2" fill="none" class="pgd-flowonce"/>'; });
      return s;
    },
    work: function (c) { var R = models2b(); return work2b(c, R.m, R.you, D.predDone('2b')); },
    bind: function (c, root) { root.querySelectorAll('.pgd-target').forEach(function (el) { D.onTap(el, function () { var k = +el.getAttribute('data-pgd-t').slice(1), st = c.state; st.cur = k; st.done.push(k); st.acted = 1; if (st.done.length >= 5) c.next(); else c.redraw(true); }); }); },
    auto: function (c) { c.state.done = [0, 1, 2, 3, 4]; c.state.cur = 4; } },
  { cap: 'Mean ± spread: one fair score per inspector',
    note: 'The mean of the 5 fold scores says how good an inspector is. The spread says how much it changes from fold to fold.',
    svg: function (c) {
      var R = models2b(), nm = D.predDone('2b'), fx = A.fx(), st = c.state, best = 0;
      R.m.forEach(function (m, i) { if (m.mean > R.m[best].mean) best = i; });
      var s = A.stage() + fx.defs + tray2b(c, fx, {}) + booths2b(c, fx, R.m, nm) + board2b(c, fx, R.m, nm, [0, 1, 2, 3, 4]);
      s += A.target('best', '<rect x="380" y="' + (264 + best * 40) + '" width="548" height="38" rx="8" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap the best mean', 760, 190 + 0, { la: 'middle' });
      c._best = best; return s;
    },
    work: function (c) {
      var R = models2b(), nm = D.predDone('2b'), m = R.m[2], r = [{ h: 'Mean of 5 folds' }];
      R.m.forEach(function (q, i) { r.push({ v: '(' + q.folds.map(function (v) { return v.toFixed(3); }).join(' + ') + ') ÷ 5', k: nm ? q.name : 'Inspector ' + (i + 1), col: MCOL[i] }, { op: '=', v: q.mean.toFixed(3) + ' ± ' + q.sd.toFixed(3), k: 'mean ± spread', res: i === 2 }); });
      r.push(srcTag(R.you)); void m; return r;
    },
    on: { best: function (c) { c.next(); } } },
  { cap: 'The best inspector learns once from the whole tray',
    note: 'The inspector with the highest mean is trained again on all 1,574 train cells. The validation tray is still unseen: it is used next, to choose the cutoff.',
    svg: function (c) {
      var R = models2b(), nm = D.predDone('2b'), fx = A.fx(), best = 0;
      R.m.forEach(function (m, i) { if (m.mean > R.m[best].mean) best = i; });
      var s = A.stage() + fx.defs + booths2b(c, fx, R.m, nm, { win: best }) + board2b(c, fx, R.m, nm, [0, 1, 2, 3, 4], { win: best });
      // the whole tray flows into the winner
      s += '<circle cx="' + TC.x + '" cy="' + TC.y + '" r="' + (TC.r1 + 10) + '" fill="' + 'url(#' + fx.mt + ')' + '" stroke="#ffb547" stroke-width="2"/>';
      for (var k = 0; k < 5; k++) { var a0 = -Math.PI / 2 - Math.PI / 5 + k * 2 * Math.PI / 5 + .02; s += '<path d="' + wedge(TC.x, TC.y, TC.r0, TC.r1, a0, a0 + 2 * Math.PI / 5 - .04) + '" fill="#13283a" stroke="#3dffa0" stroke-width="1.5"/>'; F2().foldCells[k].slice(0, 3).forEach(function (cid, j) { var am = a0 + Math.PI / 5, rr = 92 + (j === 1 ? 26 : 0), aa = am + (j - 1) * 0.28; s += A.cell(cid, TC.x + rr * Math.cos(aa) - 13, TC.y + rr * Math.sin(aa) - 13, 26, { r: 2 }); }); }
      s += '<circle cx="' + TC.x + '" cy="' + TC.y + '" r="54" fill="#0a121c" stroke="#3dffa0"/>' + t(TC.x, TC.y - 4, fmt(F2().nTrain), { size: 19, a: 'middle', f: 'm', w: 700, fill: C.gr }) + t(TC.x, TC.y + 18, 'all 5 folds', { size: 14, a: 'middle', fill: C.dim });
      s += t(30, 46, 'FINAL TRAINING: THE WHOLE TRAIN TRAY', { size: 14, f: 'h', fill: C.gr, ls: '.08em' });
      s += '<path d="M' + (TC.x + 150) + ' ' + (TC.y - 60) + 'C 330 120 ' + (420 + best * 188) + ' 220 ' + (468 + best * 188) + ' 182" stroke="#3dffa0" stroke-width="3" fill="none" class="pgd-flow"/>';
      s += t(30, 494, nm ? 'Best: ' + R.m[best].name + ', mean ' + R.m[best].mean.toFixed(3) : 'Best: inspector ' + (best + 1) + ' (name shows after your 2b bet)', { size: 16, fill: '#ffb547' });
      return s;
    },
    work: function (c) {
      var R = models2b(), nm = D.predDone('2b'), best = 0; R.m.forEach(function (m, i) { if (m.mean > R.m[best].mean) best = i; });
      return clean([{ h: 'Train the winner once' }, { v: fmt(F2().nTrain), k: 'train cells, all 5 folds' }, { v: R.m[best].mean.toFixed(3), k: 'its mean fold score', res: true },
        nm ? { t: '<b>' + R.m[best].name + '</b> took ' + R.m[best].sec + ' s for its 5 folds.' } : { t: 'The names show after you place your bet in 2b.' },
        { t: 'The validation tray is still unseen. Next it gives each cell a score.' }, srcTag(R.you)]);
    } }
  ]
});


/* ============================ 2c  Read scores, not verdicts ============================ */
function picks2c() {
  var v = D.val(); if (!v) return null;
  var n = v.y.length, I = []; for (var i = 0; i < n; i++) I.push(i);
  function best(f, key) { var b = null; I.forEach(function (i) { if (f(i) && (b == null || key(i) < key(b))) b = i; }); return b; }
  var sA = best(function (i) { return v.y[i] === 1 && v.svc[i] >= 0.51; }, function (i) { return v.svc[i]; });
  var sB = best(function (i) { return v.y[i] === 1; }, function (i) { return -v.svc[i]; });
  var miss = best(function (i) { return v.y[i] === 1 && v.svc[i] < 0.5; }, function (i) { return Math.abs(v.svc[i] - 0.4); });
  var fa = best(function (i) { return v.y[i] === 0 && v.svc[i] >= 0.5; }, function (i) { return Math.abs(v.svc[i] - 0.55); });
  var g1 = best(function (i) { return v.y[i] === 0 && v.kind[i] === 'm'; }, function (i) { return v.svc[i]; });
  var g2 = best(function (i) { return v.y[i] === 0 && v.kind[i] === 'p'; }, function (i) { return v.svc[i]; });
  return { v: v, order: [sA, g1, sB, miss, fa, g2], sA: sA, sB: sB, you: v.youSvc };
}
function card2c(P, i, x, y, flipped, o) {
  o = o || {}; var v = P.v, sc = v.svc[i], stop = sc >= 0.5, s = '', fx = o.fx;
  s += '<g' + (fx ? ' filter="url(#' + fx.sh + ')"' : '') + '><rect x="' + x + '" y="' + y + '" width="120" height="176" rx="10" fill="#0d1622" stroke="#2b4157"/></g>';
  s += A.cell(v.id[i], x + 12, y + 12, 96, { full: true });
  s += t(x + 60, y + 124, 'cell ' + v.id[i], { size: 13.5, a: 'middle', f: 'm', fill: C.dim });
  var cls = o.just ? ' class="pgd-flip"' : '';
  if (!flipped) s += '<g' + cls + '><rect x="' + (x + 14) + '" y="' + (y + 134) + '" width="92" height="32" rx="6" fill="none" stroke="' + (stop ? C.rd : C.gr) + '" stroke-width="2.5" transform="rotate(-4 ' + (x + 60) + ' ' + (y + 150) + ')"/>' +
    t(x + 60, y + 157, stop ? 'STOP' : 'PASS', { size: 20, a: 'middle', f: 'h', fill: stop ? C.rd : C.gr, ls: '.1em' }).replace('<text ', '<text transform="rotate(-4 ' + (x + 60) + ' ' + (y + 150) + ')" ') + '</g>';
  else s += '<g' + cls + '><rect x="' + (x + 10) + '" y="' + (y + 134) + '" width="100" height="34" rx="6" fill="#071019" stroke="' + C.cy + '"/>' +
    '<rect x="' + (x + 14) + '" y="' + (y + 160) + '" width="' + (92 * sc).toFixed(1) + '" height="4" rx="2" fill="' + C.cy + '"/>' + t(x + 60, y + 156, sc.toFixed(3), { size: 19, a: 'middle', f: 'm', w: 700, fill: '#fff' }) + '</g>';
  if (o.truth) s += '<rect x="' + (x + 12) + '" y="' + (y + 12) + '" width="96" height="96" fill="none" stroke="' + (v.y[i] ? C.rd : C.gr) + '" stroke-width="2"/>' + t(x + 104, y + 28, v.y[i] ? 'defect' : 'good', { size: 13, a: 'end', w: 700, fill: v.y[i] ? '#ff8aa0' : C.gr });
  return s;
}
function line2c(P, flipped, y0) {
  var s = '', X = function (v) { return 90 + v * 780; };
  s += A.glass(28, y0 - 54, 904, 170, { col: '#22384d' });
  s += t(46, y0 - 26, 'THE SCORE LINE · CHANCE OF DEFECT', { size: 14, f: 'h', fill: C.dim, ls: '.1em' });
  s += '<line x1="' + X(0) + '" x2="' + X(1) + '" y1="' + y0 + '" y2="' + y0 + '" stroke="#5d6b80" stroke-width="2"/>';
  for (var k = 0; k <= 10; k++) s += '<line x1="' + X(k / 10) + '" x2="' + X(k / 10) + '" y1="' + y0 + '" y2="' + (y0 + 7) + '" stroke="#5d6b80"/>' + t(X(k / 10), y0 + 26, (k / 10).toFixed(1), { size: 15, a: 'middle', f: 'm', fill: C.dim });
  s += '<rect x="' + X(0.5) + '" y="' + (y0 - 30) + '" width="' + (X(1) - X(0.5)) + '" height="30" fill="#ff4d6a" opacity=".08"/><rect x="' + X(0) + '" y="' + (y0 - 30) + '" width="' + (X(0.5) - X(0)) + '" height="30" fill="#3dffa0" opacity=".06"/>';
  s += '<line x1="' + X(0.5) + '" x2="' + X(0.5) + '" y1="' + (y0 - 34) + '" y2="' + (y0 + 4) + '" stroke="#fff" stroke-dasharray="4 3"/>' + t(X(0.5) + 6, y0 - 38, 'verdict line 0.5', { size: 14, fill: '#fff' });
  t; var lab = [];
  flipped.forEach(function (i, n) { var x = X(P.v.svc[i]); lab.push(x); s += '<circle class="' + (n === flipped.length - 1 ? 'pgd-pop' : '') + '" cx="' + x.toFixed(1) + '" cy="' + (y0 - 12) + '" r="8" fill="' + (P.v.y[i] ? C.rd : C.gr) + '" stroke="#fff" stroke-width="1.5"/>' + t(x, y0 + 56, String(P.v.id[i]), { size: 13, a: 'middle', f: 'm', fill: C.dim }); });
  if (flipped.indexOf(P.sA) >= 0 && flipped.indexOf(P.sB) >= 0) {
    var xa = X(P.v.svc[P.sA]), xb = X(P.v.svc[P.sB]);
    s += '<path d="M' + xa + ' ' + (y0 + 70) + 'V' + (y0 + 78) + 'H' + xb + 'V' + (y0 + 70) + '" stroke="#ffb547" fill="none" stroke-width="2"/>' + t((xa + xb) / 2, y0 + 100, 'both STOP · ' + (P.v.svc[P.sB] - P.v.svc[P.sA]).toFixed(3) + ' apart', { size: 16, a: 'middle', w: 700, fill: C.am });
  }
  return s;
}
function hist2c(P, y0, o) {
  o = o || {}; var v = P.v, B = 20, d = [], g = [], s = '';
  for (var k = 0; k < B; k++) { d.push(0); g.push(0); }
  v.svc.forEach(function (sc, i) { var b = Math.min(B - 1, Math.floor(sc * B)); (v.y[i] ? d : g)[b]++; });
  var X = function (q) { return 90 + q * 780; }, mx = Math.max(Math.max.apply(null, d), Math.max.apply(null, g)), top = Math.ceil(mx / 25) * 25, md = top, mg = top, hd = 88, hg = 88, bw = 780 / B;
  s += A.glass(28, y0 - 104, 904, 236, { col: '#22384d' });
  s += t(46, y0 - 78, 'ALL ' + v.y.length + ' VALIDATION SCORES', { size: 14, f: 'h', fill: C.dim, ls: '.1em' });
  for (k = 0; k < B; k++) {
    var h1 = d[k] / md * hd, h2 = g[k] / mg * hg;
    s += '<rect x="' + (X(k / B) + 2) + '" y="' + (y0 - h1) + '" width="' + (bw - 4) + '" height="' + h1 + '" rx="2" fill="#ff4d6a" opacity=".85"/>';
    s += '<rect x="' + (X(k / B) + 2) + '" y="' + (y0 + 2) + '" width="' + (bw - 4) + '" height="' + h2 + '" rx="2" fill="#5f84a8" opacity=".9"/>';
  }
  s += '<line x1="' + X(0) + '" x2="' + X(1) + '" y1="' + (y0 + 1) + '" y2="' + (y0 + 1) + '" stroke="#e6eef8" stroke-width="1.5"/>';
  for (k = 0; k <= 10; k++) s += t(X(k / 10), y0 + hg + 24, (k / 10).toFixed(1), { size: 14, a: 'middle', f: 'm', fill: C.dim });
  s += t(X(1) - 4, y0 - hd + 4, 'defects (' + d.reduce(function (a, b) { return a + b; }, 0) + ')', { size: 15, a: 'end', w: 700, fill: '#ff8aa0' }) + t(X(1) - 4, y0 + hg - 4, 'good cells (' + g.reduce(function (a, b) { return a + b; }, 0) + ')', { size: 15, a: 'end', w: 700, fill: '#8fb0cf' });
  [-top, -top / 2, top / 2, top].forEach(function (q) { var yy = y0 + (q < 0 ? q : q) / top * hd * (q < 0 ? 1 : 1); yy = q < 0 ? y0 + q / top * hd : y0 + q / top * hg; s += '<line x1="84" x2="90" y1="' + yy + '" y2="' + yy + '" stroke="#5d6b80"/>' + t(80, yy + 5, String(Math.abs(q)), { size: 13, a: 'end', f: 'm', fill: C.dim }); });
  s += '<line x1="90" x2="90" y1="' + (y0 - hd) + '" y2="' + (y0 + hg) + '" stroke="#5d6b80"/>' + t(40, y0 + 5, 'cells', { size: 13, fill: C.dim });
  if (o.gate != null) {
    var gx = X(o.gate), r = D.M.rates(v.y, v.svc, o.gate);
    s += '<rect x="' + gx + '" y="' + (y0 - hd - 6) + '" width="' + (X(1) - gx) + '" height="' + (hd + hg + 14) + '" fill="#ff4d6a" opacity=".07"/>';
    s += '<line x1="' + gx + '" x2="' + gx + '" y1="' + (y0 - hd - 10) + '" y2="' + (y0 + hg + 6) + '" stroke="#ffb547" stroke-width="3"/>' + t(gx + 8, y0 - hd + 8, 'STOP at 0.5 and above', { size: 15, w: 700, fill: C.am });
    s += A.tag(gx + 12, y0 - 40, r.tp + ' defects caught', C.rd).replace('<g class="pgd-tag">', '<g class="pgd-tag pgd-pop">');
    s += A.tag(gx - 12, y0 - 64, r.fn + ' defects missed', '#ff8aa0', { a: 'end' });
  }
  return s;
}
D.register('2c', {
  init: function () { return { flipped: [] }; },
  frames: [
  { cap: 'The model’s verdict: STOP or PASS',
    note: 'A plain verdict only says STOP or PASS. Flip two STOP cards to see what is behind them.',
    svg: function (c) {
      var P = picks2c(), fx = A.fx(); if (!P) return A.stage();
      var s = A.stage() + fx.defs + t(40, 40, 'VALIDATION CELLS ON THE BELT · VERDICT = SCORE ≥ 0.5', { size: 14, f: 'h', fill: C.dim, ls: '.1em' });
      s += A.belt(30, 246, 900, 34, { fx: fx });
      var st = c.state, next = st.flipped.indexOf(P.sA) < 0 ? P.sA : P.sB;
      P.order.forEach(function (i, k) {
        var x = 42 + k * 150, card = card2c(P, i, x, 62, st.flipped.indexOf(i) >= 0, { fx: fx, just: st.flipped[st.flipped.length - 1] === i });
        if (i === next) s += A.target('flip', '<rect x="' + (x - 4) + '" y="58" width="128" height="184" rx="12" fill="none" stroke="#ffb547" stroke-width="3"/>', 'flip this STOP', x + 60, 40 + 252 + 20, { inner: card });
        else s += card;
      });
      s += line2c(P, st.flipped, 420);
      return s;
    },
    work: function (c) {
      var P = picks2c(); if (!P) return [];
      var r = [{ h: 'Verdict' }, { t: 'The plain verdict is STOP when the defect score is 0.5 or more. It hides <b>how sure</b> the model is.' }];
      c.state.flipped.forEach(function (i) { r.push({ v: P.v.svc[i].toFixed(3), k: 'defect score of cell ' + P.v.id[i] + ' → ' + (P.v.svc[i] >= 0.5 ? 'STOP' : 'PASS') }); });
      r.push(srcTag(P.you)); return r;
    },
    on: { flip: function (c) { var P = picks2c(), st = c.state; if (st.flipped.indexOf(P.sA) < 0) { st.flipped.push(P.sA); c.redraw(true); } else { st.flipped.push(P.sB); c.next(); } } },
    auto: function (c) { var P = picks2c(); c.state.flipped = [P.sA, P.sB]; } },
  { cap: 'Same verdict, very different scores',
    note: 'Both cards said STOP. One is just over 0.5, the other is almost 1. A score keeps that difference; a verdict throws it away.',
    svg: function (c) {
      var P = picks2c(), fx = A.fx(); if (!P) return A.stage();
      var s = A.stage() + fx.defs + t(40, 40, 'VALIDATION CELLS ON THE BELT', { size: 14, f: 'h', fill: C.dim, ls: '.1em' }) + A.belt(30, 246, 900, 34, { fx: fx });
      P.order.forEach(function (i, k) { s += card2c(P, i, 42 + k * 150, 62, c.state.flipped.indexOf(i) >= 0, { fx: fx }); });
      s += line2c(P, c.state.flipped, 420);
      s += A.target('all', '<rect x="730" y="294" width="196" height="40" rx="20" fill="#0b121b" stroke="#ffb547" stroke-width="2.5"/>', 'flip the rest', 828, 314, { cls: 'pgd-nochip', inner: t(828, 320, 'FLIP THE REST', { size: 15, a: 'middle', f: 'h', fill: C.am }) });
      return s;
    },
    work: function (c) {
      var P = picks2c(); if (!P) return [];
      var a = P.v.svc[P.sA], b = P.v.svc[P.sB];
      return [{ h: 'Two STOPs' }, { v: b.toFixed(3), k: 'cell ' + P.v.id[P.sB] + ': almost sure' }, { op: '−', v: a.toFixed(3), k: 'cell ' + P.v.id[P.sA] + ': just over the line' }, { op: '=', v: (b - a).toFixed(3), k: 'apart, same verdict', res: true }, srcTag(P.you)];
    },
    on: { all: function (c) { var P = picks2c(); c.state.flipped = P.order.slice(); c.next(); } },
    auto: function (c) { var P = picks2c(); c.state.flipped = P.order.slice(); } },
  { cap: 'Scores of all 525 validation cells',
    note: 'Defects (top) mostly score high, good cells (bottom) mostly low, but they overlap. Some defects score low and some good cells score high.',
    svg: function (c) {
      var P = picks2c(), fx = A.fx(); if (!P) return A.stage();
      var s = A.stage() + fx.defs + t(40, 40, 'THE SAME CELLS, NOW IN SCORE ORDER', { size: 14, f: 'h', fill: C.dim, ls: '.1em' }) + A.belt(30, 246, 900, 34, { fx: fx });
      P.order.slice().sort(function (a, b) { return P.v.svc[a] - P.v.svc[b]; }).forEach(function (i, k) { s += '<g class="pgd-in">' + card2c(P, i, 42 + k * 150, 62, true, { fx: fx, truth: true }) + '</g>'; });
      s += hist2c(P, 408);
      s += A.target('gate', '<rect x="474" y="296" width="12" height="236" rx="6" fill="#ffb547" fill-opacity=".25" stroke="#ffb547" stroke-width="2.5"/>', 'tap the verdict line', 480, 308, { la: 'start' });
      return s;
    },
    work: function (c) {
      var P = picks2c(); if (!P) return [];
      var v = P.v, nd = v.y.filter(function (q) { return q; }).length, lo = 0; v.svc.forEach(function (q, i) { if (v.y[i] && q < 0.5) lo++; });
      return [{ h: 'What the scores show' }, { v: String(v.y.length), k: 'validation cells, one score each' }, { v: nd + ' defects', k: 'red bars, above the line' }, { v: (v.y.length - nd) + ' good cells', k: 'blue bars, below the line' }, { t: 'They overlap: no single cut separates them perfectly.' }, srcTag(P.you)];
    },
    on: { gate: function (c) { c.next(); } } },
  { cap: 'The 0.5 verdict misses many defects. You choose the gate.',
    note: 'With the plain verdict line at 0.5, many real defects pass. Because we have scores, we can move the gate lower to catch more (that is 2d).',
    svg: function (c) {
      var P = picks2c(), fx = A.fx(); if (!P) return A.stage();
      var r = D.M.rates(P.v.y, P.v.svc, 0.5), s = A.stage() + fx.defs;
      s += A.glass(28, 22, 904, 136, { fx: fx, col: '#7a5a2a' });
      s += t(50, 56, 'WITH THE PLAIN VERDICT (0.5)', { size: 14, f: 'h', fill: C.am, ls: '.1em' });
      s += A.gauge(130, 112, 34, r.rec, { col: C.rd, target: 0.95, tl: '95%', val: p1(r.rec), vs: 16 });
      s += t(190, 100, r.tp + ' of ' + (r.tp + r.fn) + ' defects stopped', { size: 20, w: 700 }) + t(190, 130, r.fn + ' defects pass unseen: far from the 95% goal', { size: 17, fill: '#ff8aa0' });
      s += t(912, 100, r.fp + ' good cells stopped', { size: 18, a: 'end', fill: C.am }) + t(912, 130, 'of ' + (r.fp + r.tn), { size: 16, a: 'end', fill: C.dim });
      s += hist2c(P, 330, { gate: 0.5 });
      s += t(480, 510, 'Lower the gate to stop more defects → 2d', { size: 17, a: 'middle', fill: '#fff' });
      return s;
    },
    work: function (c) {
      var P = picks2c(); if (!P) return [];
      var r = D.M.rates(P.v.y, P.v.svc, 0.5);
      return [{ h: 'Gate at 0.5' }, { v: r.tp + ' ÷ ' + (r.tp + r.fn), k: 'defects stopped ÷ all defects' }, { op: '=', v: p1(r.rec), k: 'recall: the target is 95%', res: true }, { v: String(r.fn), k: 'defects that pass' },
        { t: 'A score lets <b>you</b> place the gate where the factory needs it.' }, srcTag(P.you)];
    } }
  ]
});


/* ============================ 2e  Write the report card ============================ */
function card2e() {
  var w = walk(); if (!w) return null;
  var v = w.v, cut = w.at(w.maxPass).cut, r = D.M.rates(v.y, v.svc, cut), you = v.youSvc, L = D.liveRes('2e');
  if (L && L.n) { r = { tp: L.tp, fn: L.fn, fp: L.fp, tn: L.tn, rec: L.rec, far: L.far }; you = true; }
  var n = r.tp + r.fn + r.fp + r.tn, pick = function (t, p) { var o = []; for (var i = 0; i < v.y.length && o.length < 3; i++) if (v.y[i] === t && ((v.svc[i] >= cut) ? 1 : 0) === p) o.push(v.id[i]); return o; };
  return { r: r, n: n, you: you, k: 1000 / n, cells: { tp: pick(1, 1), fn: pick(1, 0), fp: pick(0, 1), tn: pick(0, 0) } };
}
var BOX = { tp: { x: 150, y: 86, lab: 'caught', col: C.rd }, fn: { x: 330, y: 86, lab: 'missed', col: '#ff8aa0' }, fp: { x: 150, y: 290, lab: 'false alarms', col: C.am }, tn: { x: 330, y: 290, lab: 'passed, correct', col: C.gr } };
var SENT = [{ k: 'tp', pre: 'In every 1,000 cells we stop', post: 'real defects,' }, { k: 'fn', pre: 'and', post: 'defects slip through.' }, { k: 'fp', pre: '', post: 'good cells stopped to re-check.' }];
function scene2e(c, fx) {
  var R = card2e(), st = c.state, s = A.stage() + fx.defs; if (!R) return s;
  // the cabinet: 4 boxes
  s += t(264, 40, 'MODEL SAYS', { size: 14, f: 'h', a: 'middle', fill: C.dim, ls: '.12em' }) + t(174, 66, 'STOP', { size: 17, f: 'h', a: 'middle', fill: C.rd }) + t(354, 66, 'PASS', { size: 17, f: 'h', a: 'middle', fill: C.gr });
  s += '<text x="44" y="190" font-family="' + A.FH + '" font-size="14" font-weight="700" fill="#ff8aa0" text-anchor="middle" transform="rotate(-90 44 190)">REAL DEFECT</text><text x="44" y="392" font-family="' + A.FH + '" font-size="14" font-weight="700" fill="#8fb0cf" text-anchor="middle" transform="rotate(-90 44 392)">REAL GOOD</text>';
  s += '<path d="M66 82H492" stroke="#2b4157"/>';
  ['tp', 'fn', 'fp', 'tn'].forEach(function (k) {
    var b = BOX[k], used = st.used.indexOf(k) >= 0;
    s += A.glass(b.x - 80 + 64 - 40, b.y, 160, 186, { fx: fx, col: b.col, op: .7 });
    var bx = b.x - 56;
    R.cells[k].forEach(function (id, j) { s += A.cell(id, bx + 6 + j * 48, b.y + 14, 42, { r: 2 }); });
    s += t(bx + 80, b.y + 92, b.lab, { size: 16, a: 'middle', w: 700, fill: b.col });
    s += t(bx + 80, b.y + 116, k.toUpperCase(), { size: 13, a: 'middle', f: 'm', fill: C.dim2 });
    var pill = '<rect x="' + (bx + 30) + '" y="' + (b.y + 130) + '" width="100" height="40" rx="20" fill="' + (used ? '#0b121b' : b.col) + '" fill-opacity="' + (used ? 1 : .2) + '" stroke="' + b.col + '" stroke-width="2"' + (used ? ' stroke-dasharray="4 4"' : '') + '/>' + t(bx + 80, b.y + 157, String(R.r[k]), { size: 21, a: 'middle', f: 'm', w: 700, fill: used ? C.dim2 : '#fff' });
    if (!used && st.j < 3) s += A.target('t' + k, '<rect x="' + (bx + 26) + '" y="' + (b.y + 126) + '" width="108" height="48" rx="24" fill="none" stroke="#ffb547" stroke-width="2.5"/>', '', 0, 0, { kind: 'drag', cls: 'pgd-nochip', to: '0,0', inner: '<g class="pgd-pill">' + pill + '</g>' });
    else s += pill;
  });
  s += t(270, 500, 'validation tray · ' + R.n + ' cells · cutoff from 2d', { size: 15, a: 'middle', fill: C.dim });
  // the report card
  s += '<g' + ' filter="url(#' + fx.sh + ')"><rect x="476" y="24" width="456" height="494" rx="12" fill="#0e1520" stroke="#3a4f66"/></g>';
  s += '<rect x="476" y="24" width="456" height="56" rx="12" fill="#14202f"/>' + t(500, 60, 'REPORT CARD', { size: 18, f: 'h', fill: '#fff', ls: '.14em' }) + t(908, 60, 'per 1,000 cells', { size: 15, a: 'end', fill: C.am });
  SENT.forEach(function (q, j) {
    var yl = 118 + j * 92, done = j < st.j, val = done ? Math.round(R.r[q.k] * R.k) : null, bx = 500, by = yl + 14, now = st.j === j;
    if (q.pre) s += t(500, yl, q.pre, { size: 18, fill: '#c7d4e4' }); else by = yl - 22;
    s += '<g class="' + (now && st.wrong ? 'pgd-shake' : '') + '"><rect x="' + bx + '" y="' + by + '" width="112" height="40" rx="8" fill="' + (done ? 'rgba(70,227,255,.1)' : '#0a1019') + '" stroke="' + (done ? BOX[q.k].col : now ? '#ffb547' : '#2b3a4c') + '" stroke-width="2"' + (done ? '' : ' stroke-dasharray="5 4"') + '/>';
    if (done) s += t(bx + 56, by + 28, String(val), { size: 22, a: 'middle', f: 'm', w: 700, fill: '#fff', cls: j === st.j - 1 ? 'pgd-pop' : '' }).replace('<text ', j === st.j - 1 ? '<text data-pgd-from="' + R.r[q.k] + '" ' : '<text ');
    else if (now) s += t(bx + 56, by + 26, 'drop a count', { size: 14, a: 'middle', fill: C.am });
    s += '</g>' + t(bx + 124, by + 27, q.post, { size: 18, fill: '#c7d4e4' });
  });
  return s;
}
function blankAt(j) { var yl = 118 + j * 92, by = SENT[j].pre ? yl + 14 : yl - 22; return { x: 556, y: by + 20 }; }
function bind2e(c, root) {
  var R = card2e(), st = c.state, want = SENT[st.j] && SENT[st.j].k;
  root.querySelectorAll('[data-pgd-act=drag]').forEach(function (el) {
    var k = el.getAttribute('data-pgd-t').slice(1), b = BOX[k], bx = b.x - 56, sx = bx + 80, sy = b.y + 150, bl = blankAt(st.j);
    var dx0 = Math.round((bl.x - sx) / 32) * 32, dy0 = Math.round((bl.y - sy) / 32) * 32;
    el.setAttribute('data-pgd-to', (sx + dx0) + ',' + (sy + dy0));
    var drag = D.onDrag(root, el, { start: { x: sx, y: sy }, step: 32,
      move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - sx) + ' ' + (p.y - sy) + ')'); },
      drop: function (p) {
        if (Math.abs(p.x - bl.x) < 80 && Math.abs(p.y - bl.y) < 40) {
          if (k === want) { st.used.push(k); st.j++; st.wrong = null; c.next(); return; }
          st.wrong = k; c.redraw(true); return;
        }
        el.setAttribute('transform', ''); drag.set({ x: sx, y: sy }); el.removeAttribute('transform');
      } });
  });
  void R;
}
function work2e(c) {
  var R = card2e(); if (!R) return [];
  var st = c.state, r = [{ h: 'Per 1,000 cells' }, { v: '1,000 ÷ ' + R.n + ' = ' + R.k.toFixed(3), k: 'scale from the tray to 1,000 cells' }];
  SENT.slice(0, st.j).forEach(function (q) { r.push({ v: R.r[q.k] + ' × ' + R.k.toFixed(3), k: BOX[q.k].lab }, { op: '=', v: String(Math.round(R.r[q.k] * R.k)), k: 'per 1,000', res: true }); });
  if (st.wrong) r.push({ t: 'That count does not fit this sentence. Read the row (real defect or good) and the column (STOP or PASS).' });
  r.push(srcTag(R.you));
  return r;
}
D.register('2e', {
  init: function () { return { j: 0, used: [], wrong: null }; },
  frames: [
  { cap: 'Four boxes: every cell lands in one',
    note: 'At the 2d cutoff every validation cell lands in one box: real defect or good, stopped or passed. Drag the right count into the first sentence.',
    svg: function (c) { return scene2e(c, A.fx()); }, work: work2e, bind: bind2e, auto: function (c) { c.state.j = 1; c.state.used = ['tp']; } },
  { cap: 'What slips through',
    note: 'Defects the model passed are the dangerous mistake. Drag that count into the second sentence.',
    svg: function (c) { return scene2e(c, A.fx()); }, work: work2e, bind: bind2e, auto: function (c) { c.state.j = 2; c.state.used = ['tp', 'fn']; } },
  { cap: 'What it costs',
    note: 'Good cells that were stopped cost re-check time. Drag that count into the third sentence.',
    svg: function (c) { return scene2e(c, A.fx()); }, work: work2e, bind: bind2e, auto: function (c) { c.state.j = 3; c.state.used = ['tp', 'fn', 'fp']; } },
  { cap: 'The report card: what you catch and what it costs',
    note: 'Recall says how many defects are stopped. The false-alarm rate says how many good cells are stopped. Per 1,000 cells, both are easy to read on the line.',
    svg: function (c) {
      var R = card2e(), fx = A.fx(), s = scene2e(c, fx); if (!R) return s;
      // rates
      s += t(500, 356, 'recall', { size: 16, fill: C.dim }) + t(580, 358, p1(R.r.rec), { size: 24, f: 'm', w: 700, fill: C.cy });
      s += t(700, 356, 'false alarms', { size: 16, fill: C.dim }) + t(908, 358, p1(R.r.far), { size: 24, a: 'end', f: 'm', w: 700, fill: C.am });
      // 1,000 cells as a waffle
      var per = ['tp', 'fn', 'fp', 'tn'].map(function (k) { return Math.round(R.r[k] * R.k); }), tot = per.reduce(function (a, b) { return a + b; }, 0), cols = [C.rd, '#ffd0d8', C.am, '#2f6b55'], k = 0, n = 0, wx = 500, wy = 384;
      var sq = ''; for (var i = 0; i < 1000; i++) { while (k < 3 && n >= per[k]) { k++; n = 0; } n++; var col = i < tot ? cols[k] : cols[3]; sq += '<rect x="' + (wx + (i % 50) * 8.16) + '" y="' + (wy + Math.floor(i / 50) * 5.6) + '" width="7" height="4.6" rx=".8" fill="' + col + '"/>'; }
      s += '<g class="pgd-fade">' + sq + '</g>';
      [['caught ' + per[0], C.rd], ['missed ' + per[1], '#ffd0d8'], ['false alarms ' + per[2], C.am], ['passed ' + per[3], '#3dffa0']].forEach(function (q, j) { var lx = [500, 604, 694, 822][j]; s += '<rect x="' + lx + '" y="502" width="10" height="10" rx="2" fill="' + q[1] + '"/>' + t(lx + 14, 512, q[0], { size: 13.5, fill: q[1] }); });
      return s;
    },
    work: function (c) {
      var R = card2e(); if (!R) return [];
      var r = R.r;
      return [{ h: 'Recall' }, { v: r.tp + ' ÷ (' + r.tp + ' + ' + r.fn + ')', k: 'caught ÷ all real defects' }, { op: '=', v: p1(r.rec), k: 'recall', res: true },
        { h: 'False-alarm rate' }, { v: r.fp + ' ÷ ' + (r.fp + r.tn), k: 'good cells stopped ÷ ALL good cells (stopped + passed)' }, { op: '=', v: p1(r.far), k: 'false-alarm rate', res: true }, srcTag(R.you)];
    } }
  ]
});

/* ============================ 2d  Hit the target ============================ */
/* the defects of the validation tray, lowest score first; the gate sits just below defect g (g defects pass) */
function walk() {
  var v = D.val(); if (!v) return null;
  var d = [], good = [];
  for (var i = 0; i < v.y.length; i++) (v.y[i] === 1 ? d : good).push(i);
  d.sort(function (a, b) { return v.svc[a] - v.svc[b]; });
  var w = { v: v, d: d, nDef: d.length, nOk: good.length, you: v.youSvc };
  w.at = function (g) {   // gate just below defect g (0-based): g defects pass
    var cut = v.svc[d[g]], gp = 0; good.forEach(function (i) { if (v.svc[i] < cut) gp++; });
    return { g: g, cut: cut, goodPass: gp, goodStop: w.nOk - gp, rec: (w.nDef - g) / w.nDef, far: (w.nOk - gp) / w.nOk };
  };
  w.between = function (g) { var lo = g ? v.svc[d[g - 1]] : -1, hi = v.svc[d[g]], n = 0; good.forEach(function (i) { if (v.svc[i] >= lo && v.svc[i] < hi) n++; }); return n; };
  w.maxPass = Math.floor(0.05 * w.nDef + 1e-9);
  return w;
}
var SL = { x0: 74, w: 64, n: 12, by: 140, bh: 56 };
function slotX(g) { return SL.x0 + g * SL.w; }
function gateX(g) { return slotX(g) + 18; }
function belt2d(c, w, g, o) {
  o = o || {}; var fx = o.fx, s = '', show = D.predDone('2d');
  var gx = gateX(g);
  s += t(40, 44, 'VALIDATION TRAY · ' + fmt(w.v.y.length) + ' CELLS', { size: 15, f: 'h', fill: C.dim, ls: '.12em' });
  s += A.arrow(560, 39, 912, 39, '#5d6b80', { w: 1.6 }) + t(548, 44, 'lowest score first · score rises', { size: 16, a: 'end', fill: C.dim });
  s += A.belt(40, SL.by, 880, SL.bh, { fx: fx, moving: true });
  // pass / stop tint on the belt
  s += '<path d="M50 ' + SL.by + 'H' + gx + 'V' + (SL.by + SL.bh) + 'H40Z" fill="#3dffa0" opacity=".09"/>';
  s += '<path d="M' + gx + ' ' + SL.by + 'H910L920 ' + (SL.by + SL.bh) + 'H' + gx + 'Z" fill="#ff4d6a" opacity=".08"/>';
  for (var k = 0; k < SL.n; k++) {
    var x = slotX(k), id = w.v.id[w.d[k]], nb = w.between(k), passed = k < g;
    s += '<g' + (passed && k === g - 1 ? ' class="pgd-slide"' : '') + ' opacity="' + (passed ? .55 : 1) + '">';
    s += pile(x + 1, SL.by + SL.bh - 8, nb) + t(x + 10, SL.by + SL.bh + 36, '×' + nb, { size: 14, a: 'middle', f: 'm', fill: '#8fb0cf' });
    s += A.cell(id, x + 20, SL.by + 7, 42, { r: 2 }) + '<rect x="' + (x + 20) + '" y="' + (SL.by + 7) + '" width="42" height="42" rx="2" fill="none" stroke="#ff4d6a" stroke-width="1.6"/>';
    s += '</g>';
    s += t(x + 41, SL.by - 14, '#' + (k + 1), { size: 15, a: 'middle', f: 'm', fill: passed ? C.gr : '#ff8aa0' });
    if (show) s += t(x + 41, SL.by - 32, w.v.svc[w.d[k]].toFixed(3), { size: 14, a: 'middle', f: 'm', fill: C.dim });
  }
  s += pile(862, SL.by + SL.bh - 8, 3, { col: '#a83a50' }) + pile(884, SL.by + SL.bh - 8, 3, { col: '#4d6a86' });
  s += t(914, SL.by + SL.bh + 36, '+' + (w.nDef - SL.n) + ' defects →', { size: 15, a: 'end', f: 'm', fill: '#ff8aa0' });
  // the gate: a light curtain with two posts
  s += '<g class="' + (o.shake ? 'pgd-shake' : '') + '"><rect x="' + (gx - 5) + '" y="' + (SL.by - 52) + '" width="10" height="' + (SL.bh + 72) + '" rx="3" fill="' + (fx ? 'url(#' + fx.mt + ')' : '#2a3340') + '" stroke="#5d6b80"/>' +
    '<rect x="' + (gx - 1.5) + '" y="' + (SL.by - 4) + '" width="3" height="' + (SL.bh + 8) + '" fill="#ffb547"' + (fx ? ' filter="url(#' + fx.gl + ')"' : '') + '/>' +
    '<rect x="' + (gx - 24) + '" y="' + (SL.by - 74) + '" width="48" height="22" rx="5" fill="#ffb547"/>' + t(gx, SL.by - 58, 'GATE', { size: 14, a: 'middle', f: 'h', fill: '#1a1103' }) + '</g>';
  return s;
}
function trays2d(c, w, g, at, o) {
  o = o || {}; var fx = o.fx, s = '', prev = o.prev;
  s += A.glass(40, 236, 400, 108, { fx: fx, col: '#2f6b55' }) + A.glass(480, 236, 440, 108, { fx: fx, col: '#7a3446' });
  s += t(58, 262, 'PASS', { size: 15, f: 'h', fill: C.gr, ls: '.14em' }) + t(498, 262, 'STOP', { size: 15, f: 'h', fill: C.rd, ls: '.14em' });
  // pass tray: the defects that slip + good cells that pass
  for (var k = 0; k < g; k++) s += '<g class="' + (k === g - 1 ? 'pgd-drop' : '') + '">' + A.cell(w.v.id[w.d[k]], 58 + k * 30, 278, 26, { r: 2 }) + '<rect x="' + (58 + k * 30) + '" y="278" width="26" height="26" rx="2" fill="none" stroke="#ff4d6a" stroke-width="1.4"/></g>';
  if (!g) s += t(58, 296, 'nothing passes yet', { size: 14, fill: C.dim2 });
  s += t(58, 330, 'defects let through: ' + g, { size: 14, fill: g ? '#ff8aa0' : C.dim });
  s += t(424, 300, fmt(at.goodPass), { size: 34, a: 'end', f: 'm', w: 700, fill: C.gr }).replace('<text ', '<text data-pgd-from="' + (prev ? prev.goodPass : at.goodPass) + '" ');
  s += t(424, 330, 'good cells passed', { size: 16, a: 'end', fill: C.dim });
  // stop tray
  s += t(498, 300, fmt(w.nDef - g), { size: 34, f: 'm', w: 700, fill: '#ff8aa0' }) + t(498, 330, 'defects stopped', { size: 16, fill: C.dim });
  s += t(904, 300, fmt(at.goodStop), { size: 34, a: 'end', f: 'm', w: 700, fill: C.am }).replace('<text ', '<text data-pgd-from="' + (prev ? prev.goodStop : at.goodStop) + '" ');
  s += t(904, 330, 'good cells stopped (false alarms)', { size: 16, a: 'end', fill: C.dim });
  for (var j = 0; j < 6; j++) s += pile(700 + j * 18, 290, 3, { col: j < 2 ? '#a83a50' : '#4d6a86', w: 13 });
  return s;
}
function gauges2d(c, w, g, at, o) {
  o = o || {}; var s = '', bad = at.rec < 0.95 - 1e-9;
  s += A.glass(40, 364, 880, 160, { fx: o.fx, col: '#22384d' });
  s += A.gauge(130, 436, 50, at.rec, { col: bad ? C.rd : C.cy, target: 0.95, tl: '95%', val: p1(at.rec), vs: 22, label: 'defects stopped', vc: bad ? C.rd : '#fff' });
  s += A.gauge(300, 436, 50, at.far, { col: C.am, val: p1(at.far), vs: 22, label: 'false-alarm rate' });
  // mini chart: recall after each defect let through
  var ch = A.chart({ x: 450, y: 380, w: 440, h: 82, xd: [0, 12], yd: [0.92, 1.0], xt: [0, 2, 4, 6, 8, 10, 12], yt: [0.92, 0.95, 1.0], fy: function (v) { return Math.round(v * 100) + '%'; }, xl: 'defects let through' });
  s += ch.svg + '<line x1="450" x2="890" y1="' + ch.Y(0.95) + '" y2="' + ch.Y(0.95) + '" stroke="#fff" stroke-dasharray="5 4" stroke-opacity=".7"/>' + t(886, ch.Y(0.95) - 6, 'target', { size: 14, a: 'end', fill: '#fff' });
  var pts = []; for (var k = 0; k <= Math.min(g, 12); k++) pts.push(ch.X(k).toFixed(1) + ',' + ch.Y((w.nDef - k) / w.nDef).toFixed(1));
  if (pts.length > 1) s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + C.cy + '" stroke-width="2.5"/>';
  for (k = 0; k <= Math.min(g, 12); k++) { var r = (w.nDef - k) / w.nDef; s += '<circle cx="' + ch.X(k) + '" cy="' + ch.Y(r) + '" r="' + (k === g ? 6 : 3.5) + '" fill="' + (r < 0.95 - 1e-9 ? C.rd : C.cy) + '"' + (k === g ? ' class="pgd-pop" stroke="#fff" stroke-width="2"' : '') + '/>'; }
  s += A.tag(Math.min(ch.X(g) + 10, 820), ch.Y(at.rec) - 12, p1(at.rec), bad ? C.rd : C.cy, { size: 15 });
  return s;
}
D.register('2d', {
  init: function () { return { g: 0 }; },
  frames: [
  { cap: 'The gate starts below every cell: all 525 stop',
    note: 'The validation cells sit in score order. With the gate below the lowest score, every cell stops: all defects are caught, but every good cell is a false alarm.',
    svg: function (c) {
      var w = walk(), fx = A.fx(); if (!w) return A.stage() + t(480, 270, 'Loading…', { a: 'middle' });
      var at = w.at(0), s = A.stage() + fx.defs + belt2d(c, w, 0, { fx: fx }) + trays2d(c, w, 0, at, { fx: fx }) + gauges2d(c, w, 0, at, { fx: fx });
      var x = slotX(0) + 41;
      s += A.target('lift', '<rect x="' + (x - 25) + '" y="' + (SL.by + 3) + '" width="50" height="50" rx="5" fill="none" stroke="#ffb547" stroke-width="3"/>', 'let the lowest defect pass', x + 32, 92, { la: 'start' });
      return s;
    },
    work: function (c) {
      var w = walk(); if (!w) return [];
      return clean([{ h: 'Gate below every cell' }, { v: w.nDef + ' ÷ ' + w.nDef, k: 'defects stopped ÷ all defects' }, { op: '=', v: '100%', k: 'recall', res: true },
        { v: w.nOk + ' ÷ ' + w.nOk, k: 'good cells stopped ÷ all good cells' }, { op: '=', v: '100%', k: 'false-alarm rate', res: true },
        { t: 'Every defect is caught, but every good cell is stopped too. Lift the gate to pass the lowest scores.' }, srcTag(w.you), refNote(w.you)]);
    },
    on: { lift: function (c) { c.state.g = 1; c.next(); } } },

  { cap: 'Lift the gate past the lowest defects, one at a time',
    note: 'Each lift lets one more defect slip through and passes the good cells below it. Recall drops by one defect; false alarms fall by many good cells.',
    svg: function (c) {
      var w = walk(), fx = A.fx(); if (!w) return A.stage();
      var g = c.state.g, at = w.at(g), prev = g > 1 ? w.at(g - 1) : null;
      var s = A.stage() + fx.defs + belt2d(c, w, g, { fx: fx }) + trays2d(c, w, g, at, { fx: fx, prev: prev }) + gauges2d(c, w, g, at, { fx: fx });
      var x = slotX(g) + 41;
      s += A.target('next', '<rect x="' + (x - 25) + '" y="' + (SL.by + 3) + '" width="50" height="50" rx="5" fill="none" stroke="#ffb547" stroke-width="3"/>', 'let the next defect pass', x + 32, 92, { la: x > 600 ? 'end' : 'start' });
      return s;
    },
    work: function (c) {
      var w = walk(); if (!w) return [];
      var g = c.state.g, at = w.at(g);
      return clean([{ h: 'Gate after ' + g + (g === 1 ? ' defect' : ' defects') + ' let through' }, { v: '(' + w.nDef + ' − ' + g + ') ÷ ' + w.nDef, k: 'defects stopped ÷ all defects' }, { op: '=', v: p1(at.rec), k: 'recall (target 95%)', res: true },
        { v: fmt(at.goodStop) + ' ÷ ' + w.nOk, k: 'good cells still stopped ÷ all good cells' }, { op: '=', v: p1(at.far), k: 'false-alarm rate', res: true },
        { bar: at.rec, col: C.cy, mark: 0.95 }, srcTag(w.you), refNote(w.you)]);
    },
    on: { next: function (c) { var w = walk(); c.state.g++; if (c.state.g >= w.maxPass) c.next(); else c.redraw(true); } } },

  { cap: 'Eight defects may slip. One more breaks the target.',
    note: '95% of 165 defects must stop, so at most 8 may pass. The 9th would drop recall below 95%.',
    svg: function (c) {
      var w = walk(), fx = A.fx(); if (!w) return A.stage();
      var g = w.maxPass, at = w.at(g), s = A.stage() + fx.defs + belt2d(c, w, g, { fx: fx }) + trays2d(c, w, g, at, { fx: fx, prev: w.at(g - 1) }) + gauges2d(c, w, g, at, { fx: fx });
      var x = slotX(g) + 41;
      s += A.target('try', '<rect x="' + (x - 25) + '" y="' + (SL.by + 3) + '" width="50" height="50" rx="5" fill="none" stroke="#ffb547" stroke-width="3"/>', 'try one more', x + 32, 92, { la: 'start' });
      return s;
    },
    work: function (c) {
      var w = walk(); if (!w) return [];
      var g = w.maxPass, at = w.at(g);
      return clean([{ h: 'How many may slip?' }, { v: '5% × ' + w.nDef, k: 'the target allows 5% to pass' }, { op: '=', v: (0.05 * w.nDef).toFixed(2), k: 'so at most ' + g + ' whole defects', res: true },
        { h: 'Now' }, { v: p1(at.rec), k: 'recall with ' + g + ' let through' }, { v: p1((w.nDef - g - 1) / w.nDef), k: 'recall if one more passes', col: C.rd }, srcTag(w.you), refNote(w.you)]);
    },
    auto: function (c) { c.state.tried = 1; },
    on: { try: function (c) { c.state.tried = 1; c.next(); } } },

  { cap: 'The highest gate that still stops 95%',
    note: 'Recall and false alarms move together as the gate rises. The gate that lets 8 defects through is the highest one that keeps recall at 95% or more.',
    svg: function (c) {
      var w = walk(), fx = A.fx(); if (!w) return A.stage();
      var g = w.maxPass, at = w.at(g), show = D.predDone('2d'), s = A.stage() + fx.defs;
      // two charts on one x axis: defects stopped (top) and good cells stopped (bottom)
      s += A.glass(28, 22, 600, 496, { fx: fx, col: '#22384d' });
      var xd = [0, 12], xt = [0, 2, 4, 6, 8, 10, 12], pc = function (v) { return Math.round(v * 100) + '%'; };
      var c1 = A.chart({ x: 104, y: 74, w: 490, h: 120, xd: xd, yd: [0.9, 1.0], yt: [0.9, 0.95, 1.0], fy: pc });
      var c2 = A.chart({ x: 104, y: 252, w: 490, h: 170, xd: xd, yd: [0.4, 1.0], xt: xt, yt: [0.4, 0.6, 0.8, 1.0], fy: pc, xl: 'defects let through as the gate rises' });
      s += c1.svg + c2.svg;
      s += t(48, 56, 'DEFECTS STOPPED (RECALL)', { size: 15, f: 'h', fill: C.cy, ls: '.1em' }) + t(48, 236, 'GOOD CELLS STOPPED (FALSE-ALARM RATE)', { size: 15, f: 'h', fill: C.am, ls: '.1em' });
      if (show) [0, 4, 8, 12].forEach(function (k) { s += t(c2.X(k), 500, w.v.svc[w.d[k]].toFixed(3), { size: 14, a: 'middle', f: 'm', fill: C.am }); });
      if (show) s += t(48, 500, 'cutoff', { size: 14, f: 'm', fill: C.am });
      s += '<line x1="' + c1.X(0) + '" x2="' + c1.X(12) + '" y1="' + c1.Y(0.95) + '" y2="' + c1.Y(0.95) + '" stroke="#fff" stroke-dasharray="5 4" stroke-opacity=".75"/>' + t(c1.X(12) - 2, c1.Y(0.95) - 7, 'target 95%', { size: 15, a: 'end', fill: '#fff' });
      var pr = [], pf = [];
      for (var k = 0; k <= 12; k++) { var q = w.at(k); pr.push(c1.X(k).toFixed(1) + ',' + c1.Y(q.rec).toFixed(1)); pf.push(c2.X(k).toFixed(1) + ',' + c2.Y(q.far).toFixed(1)); }
      s += '<polyline class="pgd-draw" style="--len:600" points="' + pr.join(' ') + '" fill="none" stroke="' + C.cy + '" stroke-width="3"/>';
      s += '<polyline class="pgd-draw" style="--len:700" points="' + pf.join(' ') + '" fill="none" stroke="' + C.am + '" stroke-width="3"/>';
      for (k = 0; k <= 12; k++) { var qq = w.at(k), bad = qq.rec < 0.95 - 1e-9; s += '<circle cx="' + c1.X(k) + '" cy="' + c1.Y(qq.rec) + '" r="4" fill="' + (bad ? C.rd : C.cy) + '"/><circle cx="' + c2.X(k) + '" cy="' + c2.Y(qq.far) + '" r="3.5" fill="' + C.am + '"/>'; }
      // the chosen gate through both charts
      s += '<line x1="' + c1.X(g) + '" x2="' + c1.X(g) + '" y1="' + c1.Y(1) + '" y2="' + c2.Y(0.4) + '" stroke="#ffb547" stroke-width="2" stroke-dasharray="2 0"/>';
      s += '<circle class="pgd-pop" cx="' + c1.X(g) + '" cy="' + c1.Y(at.rec) + '" r="8" fill="none" stroke="#fff" stroke-width="2.5"/><circle class="pgd-pop" cx="' + c2.X(g) + '" cy="' + c2.Y(at.far) + '" r="8" fill="none" stroke="#fff" stroke-width="2.5"/>';
      s += A.tag(c1.X(g) - 12, c1.Y(at.rec) + 30, p1(at.rec), C.cy, { a: 'end' }) + A.tag(c2.X(g) + 14, c2.Y(at.far) - 12, p1(at.far), C.am);
      var nx = w.at(g + 1); s += '<circle cx="' + c1.X(g + 1) + '" cy="' + c1.Y(nx.rec) + '" r="7" fill="none" stroke="' + C.rd + '" stroke-width="2.2"/>' + t(c1.X(g + 1) + 12, c1.Y(nx.rec) + 24, p1(nx.rec) + ' ✗', { size: 15, f: 'm', fill: C.rd });
      // the result card
      s += A.glass(650, 22, 282, 496, { fx: fx, col: '#7a5a2a' });
      s += t(670, 54, 'YOUR GATE', { size: 15, f: 'h', fill: C.am, ls: '.14em' });
      s += t(670, 96, 'cutoff', { size: 16, fill: C.dim });
      s += show ? t(912, 98, at.cut.toFixed(3), { size: 34, a: 'end', f: 'm', w: 700, fill: '#fff' }) : A.lock(752, 96, 'after your 2d guess');
      s += '<line x1="670" x2="912" y1="116" y2="116" stroke="#2b3a4c"/>';
      s += t(670, 150, 'recall', { size: 16, fill: C.dim }) + t(912, 152, p1(at.rec), { size: 26, a: 'end', f: 'm', w: 700, fill: C.cy });
      s += t(670, 190, 'false-alarm rate', { size: 16, fill: C.dim }) + t(912, 192, p1(at.far), { size: 26, a: 'end', f: 'm', w: 700, fill: C.am });
      s += t(670, 246, 'THE ' + g + ' DEFECTS IT LETS THROUGH', { size: 14, f: 'h', fill: '#ff8aa0', ls: '.1em' });
      for (k = 0; k < g; k++) s += '<g class="pgd-in">' + A.cell(w.v.id[w.d[k]], 670 + (k % 4) * 62, 262 + Math.floor(k / 4) * 64, 54, { r: 3 }) + '<rect x="' + (670 + (k % 4) * 62) + '" y="' + (262 + Math.floor(k / 4) * 64) + '" width="54" height="54" rx="3" fill="none" stroke="#ff4d6a" stroke-width="1.5"/></g>';
      s += t(670, 420, 'Real cells from the validation tray.', { size: 16, fill: C.dim }) + t(670, 442, 'Most show faint or small marks.', { size: 16, fill: C.dim });
      return s;
    },
    work: function (c) {
      var w = walk(); if (!w) return [];
      var g = w.maxPass, at = w.at(g), show = D.predDone('2d');
      return clean([{ h: 'The rule' }, { t: 'Keep every gate with recall ≥ 95%. Of those, take the <b>highest</b>: it stops the fewest good cells.' },
        { v: (w.nDef - g) + ' ÷ ' + w.nDef, k: 'defects stopped ÷ all defects' }, { op: '=', v: p1(at.rec), k: 'recall', res: true },
        { v: at.goodStop + ' ÷ ' + w.nOk, k: 'good cells stopped ÷ all good cells' }, { op: '=', v: p1(at.far), k: 'false-alarm rate', res: true },
        show ? { v: at.cut.toFixed(3), k: 'the cutoff: score of the lowest defect still stopped' } : { t: 'The cutoff number shows here after you answer the 2d guess in the lab.' },
        srcTag(w.you), refNote(w.you)]);
    } }
  ]
});
})();
