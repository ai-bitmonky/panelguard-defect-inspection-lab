/* PanelGuard Diagram guide — Step 3 diagrams (3a 3b 3c 3d 3e 3f 3g). Uses window.PGD (engine.js).
   Numbers: the student's own live values when that substep passed ("your value"), else facts.json s3 made by
   tools/guide/facts23.py: the Step 3 network trained in Keras by tools/research/step3_twin.py (seed 0, 30 epochs) —
   the reference run — and the lab's own rules for cutoffs, blend and gates ("typical value"). */
(function () {
'use strict';
var D = window.PGD, A = D.art, C = A.COL, t = A.t, fmt = D.fmt;
var F3 = function () { return (window.PGD_FACTS || {}).s3 || {}; };
var FA = function () { return window.PGD_FACTS || {}; };
function p1(x) { return (100 * x).toFixed(1) + '%'; }
function srcTag(you, what) { return { tag: you ? 'your value' : 'typical value' }; }
function refNote(you) { return you ? null : { t: '<i>Reference run of the lab’s Step 3 network (Keras twin, seed 0).</i>' }; }
function clean(a) { return a.filter(function (r) { return r; }); }
function gray(v) { v = Math.max(0, Math.min(255, Math.round(v))); return 'rgb(' + v + ',' + v + ',' + v + ')'; }
var TH = {};
function mapURL(vals, n, key) {   // a feature map (0..255 values, n x n) as a picture
  if (TH[key]) return TH[key];
  try {
    var cv = document.createElement('canvas'); cv.width = cv.height = n; var x = cv.getContext('2d'), im = x.createImageData(n, n);
    for (var i = 0; i < n * n; i++) { var v = vals[i], k = 4 * i; im.data[k] = Math.round(v * 0.28); im.data[k + 1] = Math.round(v * 0.89); im.data[k + 2] = v; im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0); return (TH[key] = cv.toDataURL('image/png'));
  } catch (e) { return ''; }
}
/* drag helper: a target group that follows the pointer; `to` snaps to the keyboard grid so arrow keys can land on it */
function dragTo(c, root, key, sx, sy, step, dest, ok, fail) {
  var el = root.querySelector('[data-pgd-t="' + key + '"]'); if (!el) return;
  var drag = D.onDrag(root, el, { start: { x: sx, y: sy }, step: step,
    move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - sx) + ' ' + (p.y - sy) + ')'); },
    drop: function (p) { if (ok(p)) return; el.setAttribute('transform', ''); drag.set({ x: sx, y: sy }); el.removeAttribute('transform'); if (fail) fail(p); } });
  return drag;
}
function snapTo(sx, sy, dx, dy, step) { return (sx + Math.round((dx - sx) / step) * step) + ',' + (sy + Math.round((dy - sy) / step) * step); }

/* ============================ 3a  Shape the photos ============================ */
var S3A = { x: 120, y: 176, s: 216, ox: 22, oy: -16, n: 7 };
var AX = {
  rows: { lab: 'rows', n: 64, col: '#46e3ff', dock: function () { return [S3A.x - 30, S3A.y + S3A.s / 2]; }, what: 'top to bottom: one row of pixels each' },
  cols: { lab: 'columns', n: 64, col: '#3dffa0', dock: function () { return [S3A.x + S3A.s / 2, S3A.y + S3A.s + 34]; }, what: 'left to right: one column of pixels each' },
  chan: { lab: 'channel', n: 1, col: '#a98bff', dock: function () { return [S3A.x + S3A.s + 64, S3A.y + S3A.s + 6]; }, what: 'how many numbers per pixel: a gray photo has one brightness' },
  phot: { lab: 'photos', n: 2624, col: '#ffb547', dock: function () { var k = S3A.n - 1; return [S3A.x + S3A.s + k * S3A.ox / 2 + 26, S3A.y + k * S3A.oy / 2 - 10]; }, what: 'front to back: one photo each' }
};
var ORDER3A = ['rows', 'cols', 'chan', 'phot'];      // the frames ask for the docks in this order (not the tensor order)
var TRAY3A = ['cols', 'phot', 'rows', 'chan'];       // the handles sit in the tray in this order
function stack3a(c, fx, st) {
  var s = '', ids = [6, 447, 1, 23, 74, 245, 49], x = S3A.x, y = S3A.y, S = S3A.s;
  s += '<ellipse cx="' + (x + S / 2 + 70) + '" cy="' + (y + S + 52) + '" rx="210" ry="18" fill="#000" opacity=".5"/>';
  for (var k = S3A.n - 1; k >= 0; k--) {
    var sx = x + k * S3A.ox, sy = y + k * S3A.oy, front = k === 0;
    s += '<g opacity="' + (front ? 1 : 0.42 + 0.06 * (S3A.n - k)) + '">';
    s += '<path d="M' + (sx + S) + ' ' + sy + 'l7 -5v' + S + 'l-7 5z" fill="#20445e" opacity=".9"/><path d="M' + sx + ' ' + sy + 'l7 -5h' + S + 'l-7 5z" fill="#2b5875" opacity=".9"/>';
    s += A.cell(ids[k], sx, sy, S, { full: front });
    s += '<rect x="' + sx + '" y="' + sy + '" width="' + S + '" height="' + S + '" fill="url(#' + fx.vg + ')" stroke="#7fe9ff" stroke-opacity="' + (front ? .7 : .35) + '"/></g>';
  }
  // axes the student has attached
  var on = function (k) { return st.got.indexOf(k) >= 0; };
  if (on('rows')) s += '<g class="' + (st.last === 'rows' ? 'pgd-in' : '') + '">' + A.arrow(x - 16, y, x - 16, y + S, AX.rows.col, { w: 3 }) + '<text x="' + (x - 26) + '" y="' + (y + S / 2) + '" font-family="' + A.FM + '" font-size="17" font-weight="700" fill="' + AX.rows.col + '" text-anchor="middle" transform="rotate(-90 ' + (x - 26) + ' ' + (y + S / 2) + ')">64 rows</text></g>';
  if (on('cols')) s += '<g class="' + (st.last === 'cols' ? 'pgd-in' : '') + '">' + A.arrow(x, y + S + 16, x + S, y + S + 16, AX.cols.col, { w: 3 }) + t(x + S / 2, y + S + 40, '64 columns', { size: 17, a: 'middle', f: 'm', w: 700, fill: AX.cols.col }) + '</g>';
  if (on('phot')) { var k2 = S3A.n - 1; s += '<g class="' + (st.last === 'phot' ? 'pgd-in' : '') + '">' + A.arrow(x + S + 12, y - 6, x + S + 12 + k2 * S3A.ox, y - 6 + k2 * S3A.oy, AX.phot.col, { w: 3 }) + t(x + S + 30 + k2 * S3A.ox, y - 14 + k2 * S3A.oy, fmt(2624) + ' photos', { size: 17, f: 'm', w: 700, fill: AX.phot.col }) + '</g>'; }
  if (on('chan')) s += '<g class="' + (st.last === 'chan' ? 'pgd-in' : '') + '"><circle cx="' + (x + S + 64) + '" cy="' + (y + S + 6) + '" r="34" fill="#0b121b" stroke="' + AX.chan.col + '" stroke-width="2"/><rect x="' + (x + S + 40) + '" y="' + (y + S + 2) + '" width="48" height="8" fill="#8a8f96" stroke="' + AX.chan.col + '"/>' + t(x + S + 64, y + S + 30, '1 layer', { size: 14, a: 'middle', f: 'm', fill: AX.chan.col }) + '<path d="M' + (x + S - 4) + ' ' + (y + S - 4) + 'L' + (x + S + 34) + ' ' + (y + S + 4) + '" stroke="' + AX.chan.col + '" stroke-dasharray="3 3"/></g>';
  return s;
}
function handle3a(k, x, y, used) {
  var a = AX[k], ic = '';
  if (k === 'rows') ic = [0, 1, 2, 3].map(function (i) { return '<rect x="' + (x + 12) + '" y="' + (y + 12 + i * 7) + '" width="26" height="4" rx="1" fill="' + a.col + '"/>'; }).join('');
  if (k === 'cols') ic = [0, 1, 2, 3].map(function (i) { return '<rect x="' + (x + 12 + i * 7) + '" y="' + (y + 12) + '" width="4" height="26" rx="1" fill="' + a.col + '"/>'; }).join('');
  if (k === 'chan') ic = '<rect x="' + (x + 10) + '" y="' + (y + 22) + '" width="30" height="7" fill="' + a.col + '"/>';
  if (k === 'phot') ic = [3, 2, 1, 0].map(function (i) { return '<rect x="' + (x + 10 + i * 5) + '" y="' + (y + 10 + (3 - i) * 4) + '" width="20" height="20" fill="#0b121b" stroke="' + a.col + '"/>'; }).join('');
  return '<g opacity="' + (used ? .35 : 1) + '"><rect x="' + x + '" y="' + y + '" width="200" height="50" rx="12" fill="#0b121b" stroke="' + a.col + '" stroke-width="2"' + (used ? ' stroke-dasharray="4 4"' : '') + '/>' + ic +
    t(x + 52, y + 23, a.lab, { size: 18, w: 700, fill: a.col }) + t(x + 52, y + 42, 'counts ' + fmt(a.n), { size: 14, f: 'm', fill: C.dim }) + '</g>';
}
function scene3a(c, fx) {
  var st = c.state, s = A.stage() + fx.defs, want = ORDER3A[st.got.length];
  s += t(40, 42, 'ALL PHOTOS AS ONE BLOCK OF NUMBERS', { size: 14, f: 'h', fill: C.dim, ls: '.12em' });
  s += stack3a(c, fx, st);
  if (want) { var d = AX[want].dock(); s += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="20" fill="#ffb547" fill-opacity=".12" stroke="#ffb547" stroke-width="2.5" stroke-dasharray="5 4"/>' + t(d[0], d[1] + 6, '?', { size: 18, a: 'middle', f: 'h', fill: C.am }); }
  // the tray of labelled handles
  s += A.glass(590, 56, 342, 300, { fx: fx, col: '#2b4157' }) + t(610, 84, 'LABELLED HANDLES', { size: 14, f: 'h', fill: C.dim, ls: '.1em' });
  var list = TRAY3A.slice().sort(function (a, b) { return (a === want ? -1 : 0) - (b === want ? -1 : 0); });   // the asked one first in the DOM (keyboard order); the picture keeps the tray order
  list.forEach(function (k) {
    var j = TRAY3A.indexOf(k), x = 616, y = 100 + j * 62, used = st.got.indexOf(k) >= 0;
    if (!used && want) { var dd = AX[want].dock(); s += A.target('h_' + k, '<rect x="' + (x - 4) + '" y="' + (y - 4) + '" width="208" height="58" rx="15" fill="none" stroke="#ffb547" stroke-width="2"/>', '', 0, 0, { kind: 'drag', cls: 'pgd-nochip', to: snapTo(x + 100, y + 25, dd[0], dd[1], 24), inner: handle3a(k, x, y, false) }); }
    else s += handle3a(k, x, y, used);
  });
  if (want) s += '<g class="pgd-chip"><rect x="610" y="370" width="300" height="30" rx="15" fill="#ffb547"/>' + t(760, 391, 'DRAG A HANDLE TO THE ? MARK', { size: 14, a: 'middle', w: 700, fill: '#1a1103', ls: '.05em' }) + '</g>';
  if (st.wrong) s += t(760, 430, 'That handle counts something else. Look at the edge.', { size: 15, a: 'middle', fill: '#ff8aa0', cls: 'pgd-shake' });
  return s;
}
function bind3a(c, root) {
  var st = c.state, want = ORDER3A[st.got.length];
  root.querySelectorAll('[data-pgd-act=drag]').forEach(function (el) {
    var k = el.getAttribute('data-pgd-t').slice(2), j = TRAY3A.indexOf(k), sx = 716, sy = 125 + j * 62, d = AX[want].dock();
    dragTo(c, root, 'h_' + k, sx, sy, 24, null, function (p) {
      if (Math.abs(p.x - d[0]) < 70 && Math.abs(p.y - d[1]) < 50) {
        if (k === want) { st.got.push(k); st.last = k; st.wrong = 0; if (st.got.length >= 4) c.next(); else c.next(); return true; }
        st.wrong = 1; c.redraw(true); return true;
      }
      return false;
    });
  });
}
function work3a(c) {
  var st = c.state, r = [{ h: 'What each axis counts' }];
  ORDER3A.forEach(function (k) { if (st.got.indexOf(k) >= 0) r.push({ v: fmt(AX[k].n), k: AX[k].lab + ': ' + AX[k].what, col: AX[k].col }); });
  if (st.got.length < 4) r.push({ t: 'Find the edge with the <b>?</b>. Which handle counts along it?' });
  return r;
}
D.register('3a', {
  init: function () { return { got: [], last: null, wrong: 0 }; },
  frames: [
  { cap: 'A photo is a glass slab of numbers',
    note: 'Each photo is a 64 by 64 slab of brightness numbers. Stack all photos and the block has four edges to name.',
    svg: function (c) { return scene3a(c, A.fx()); }, work: work3a, bind: bind3a, auto: function (c) { c.state.got = ['rows']; } },
  { cap: 'Across the slab: columns', note: 'Along the bottom edge, left to right, the slab has 64 columns of pixels.',
    svg: function (c) { return scene3a(c, A.fx()); }, work: work3a, bind: bind3a, auto: function (c) { c.state.got = ['rows', 'cols']; } },
  { cap: 'How thick is one slab? The channel', note: 'A gray photo has one brightness number per pixel: one channel. A colour photo would have three.',
    svg: function (c) { return scene3a(c, A.fx()); }, work: work3a, bind: bind3a, auto: function (c) { c.state.got = ['rows', 'cols', 'chan']; } },
  { cap: 'Front to back: how many photos', note: 'The stack runs back through all 2,624 photos. That is the batch edge.',
    svg: function (c) { return scene3a(c, A.fx()); }, work: work3a, bind: bind3a, auto: function (c) { c.state.got = ['rows', 'cols', 'chan', 'phot']; } },
  { cap: 'Four numbers name the block; every value 0 to 1',
    note: 'The four edges together hold every number of every photo. Dividing by the largest byte puts every value between 0 and 1.',
    svg: function (c) {
      var fx = A.fx(), st = c.state, s = A.stage() + fx.defs + stack3a(c, fx, st), px = D.pixels(6);
      s += A.glass(590, 56, 342, 430, { fx: fx, col: '#2b4157' }) + t(610, 86, 'ONE PIXEL OF CELL 6', { size: 14, f: 'h', fill: C.dim, ls: '.1em' });
      var spots = [[20, 17], [40, 30], [5, 5]];
      spots.forEach(function (q, j) {
        var v = px ? px[q[0] * 64 + q[1]] : null, y = 112 + j * 70;
        s += '<rect x="612" y="' + y + '" width="46" height="46" rx="6" fill="' + (v == null ? '#111' : gray(v)) + '" stroke="#3a4757"/>' + t(670, y + 20, 'row ' + q[0] + ', column ' + q[1], { size: 15, fill: C.dim });
        if (v != null) s += t(670, y + 42, v + '  →  ' + (v / 255).toFixed(3), { size: 18, f: 'm', w: 700, fill: '#fff', cls: 'pgd-in' });
      });
      s += '<line x1="612" x2="912" y1="330" y2="330" stroke="#2b3a4c"/>';
      s += t(612, 362, 'darkest byte  0  →  0.0', { size: 16, f: 'm', fill: C.dim }) + t(612, 390, 'brightest byte  →  1.0', { size: 16, f: 'm', fill: C.dim });
      s += t(612, 440, fmt(2624 * 4096), { size: 26, f: 'm', w: 700, fill: C.cy }) + t(612, 466, 'numbers in the block', { size: 15, fill: C.dim });
      return s;
    },
    work: function (c) {
      return [{ h: 'Count the numbers' }, { v: '64 × 64 × 1', k: 'rows × columns × channel = one photo' }, { op: '=', v: '4,096', k: 'numbers per photo' }, { op: '×', v: '2,624', k: 'photos' },
        { op: '=', v: fmt(2624 * 4096), k: 'numbers in the block (the pack had the same count of bytes)', res: true }, { h: 'Small, even values' }, { t: 'Each byte is divided by the largest possible byte, so 0 stays 0 and the brightest becomes 1.0.' }, { tag: 'typical value' }];
    } }
  ]
});

/* ============================ 3b  See what a filter sees ============================ */
var K3 = [1, -2, 1, 1, -2, 1, 1, -2, 1];   // a "dark line running up-down" filter: centre column darker than both sides
function patch3b() { var p = FA().patch; return p ? p.vals : null; }
function conv3b(P, r, q) { var s = 0, terms = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) { var v = P[r + i][q + j], w = K3[i * 3 + j]; s += v * w; terms.push([v, w]); } return { sum: s, out: Math.max(0, s), terms: terms }; }
var G3 = { x: 52, y: 92, cs: 44 }, O3 = { x: 650, y: 92, cs: 44 };
function scene3b(c, fx, o) {
  o = o || {}; var P = patch3b(), st = c.state, s = A.stage() + fx.defs; if (!P) return s;
  var pos = st.path[st.k] || [0, 0], r = pos[0], q = pos[1], cv = conv3b(P, r, q);
  // where the patch comes from
  s += A.cell(6, 40, 24, 56, { full: true }) + '<rect x="' + (40 + 28 * 56 / 64) + '" y="' + (24 + 24 * 56 / 64) + '" width="' + (8 * 56 / 64) + '" height="' + (8 * 56 / 64) + '" fill="none" stroke="#ffb547" stroke-width="1.5"/>';
  s += t(106, 46, 'cell 6, rows 24–31, columns 28–35', { size: 14, fill: C.dim }) + t(106, 68, '8 × 8 patch on the crack', { size: 15, w: 700, fill: '#e6eef8' });
  // the patch
  for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) { var v = P[i][j], x = G3.x + j * G3.cs, y = G3.y + i * G3.cs; s += '<rect x="' + x + '" y="' + y + '" width="' + (G3.cs - 2) + '" height="' + (G3.cs - 2) + '" rx="3" fill="' + gray(v * 2) + '"/>' + t(x + G3.cs / 2 - 1, y + G3.cs / 2 + 5, String(v), { size: 14, a: 'middle', f: 'm', w: 700, fill: v * 2 > 140 ? '#081018' : '#e6eef8' }); }
  s += t(G3.x, G3.y + 8 * G3.cs + 22, 'bottom row = busbar · shown 2× brighter', { size: 14, fill: C.dim2 });
  // the window
  var wx = G3.x + q * G3.cs - 3, wy = G3.y + r * G3.cs - 3;
  s += '<rect class="' + (o.acted ? 'pgd-pop' : '') + '" x="' + wx + '" y="' + wy + '" width="' + (3 * G3.cs + 4) + '" height="' + (3 * G3.cs + 4) + '" rx="6" fill="#ffb547" fill-opacity=".1" stroke="#ffb547" stroke-width="3.5"/>';
  // the filter and the products
  var fxp = 432, fyp = 92, fc = 52;
  s += t(fxp, fyp - 12, 'FILTER', { size: 14, f: 'h', fill: C.am, ls: '.1em' });
  for (i = 0; i < 9; i++) { var w = K3[i], xx = fxp + (i % 3) * fc, yy = fyp + Math.floor(i / 3) * fc; s += '<rect x="' + xx + '" y="' + yy + '" width="' + (fc - 4) + '" height="' + (fc - 4) + '" rx="6" fill="' + (w < 0 ? '#3a1622' : '#10283a') + '" stroke="' + (w < 0 ? C.rd : C.cy) + '"/>' + t(xx + fc / 2 - 2, yy + fc / 2 + 6, (w > 0 ? '+' : '') + w, { size: 18, a: 'middle', f: 'm', w: 700, fill: w < 0 ? '#ff8aa0' : C.cy }); }
  s += t(fxp, fyp + 3 * fc + 22, 'window × filter', { size: 14, f: 'h', fill: C.dim, ls: '.06em' });
  var py = fyp + 3 * fc + 34;
  for (i = 0; i < 9; i++) { var tm = cv.terms[i], pr = tm[0] * tm[1], x2 = fxp + (i % 3) * fc, y2 = py + Math.floor(i / 3) * 34; s += '<rect x="' + x2 + '" y="' + y2 + '" width="' + (fc - 4) + '" height="30" rx="5" fill="#0b121b" stroke="#2b3a4c"/>' + t(x2 + fc / 2 - 2, y2 + 21, String(pr), { size: 14, a: 'middle', f: 'm', fill: pr < 0 ? '#ff8aa0' : C.cy }); }
  s += t(fxp, py + 3 * 34 + 26, 'sum ' + cv.sum, { size: 18, f: 'm', w: 700, fill: '#fff' }) + t(fxp, py + 3 * 34 + 50, 'keep if above 0 → ' + cv.out, { size: 16, f: 'm', w: 700, fill: C.am });
  // the output map
  s += t(O3.x, O3.y - 12, 'WHAT THE FILTER SEES', { size: 14, f: 'h', fill: C.cy, ls: '.1em' });
  var mx = 75;
  for (i = 0; i < 6; i++) for (j = 0; j < 6; j++) {
    var key = i + ',' + j, lit = st.seen.indexOf(key) >= 0, ov = lit ? conv3b(P, i, j).out : 0, x3 = O3.x + j * O3.cs, y3 = O3.y + i * O3.cs, cur = i === r && j === q;
    s += '<rect x="' + x3 + '" y="' + y3 + '" width="' + (O3.cs - 3) + '" height="' + (O3.cs - 3) + '" rx="4" fill="' + (lit ? 'rgba(70,227,255,' + (0.08 + 0.9 * Math.min(1, ov / mx)).toFixed(2) + ')' : '#0a1019') + '" stroke="' + (cur ? '#ffb547' : '#1b2a3b') + '" stroke-width="' + (cur ? 3 : 1) + '"' + (cur && o.acted ? ' class="pgd-pop"' : '') + '/>';
    if (lit) s += t(x3 + O3.cs / 2 - 1, y3 + O3.cs / 2 + 5, String(ov), { size: 14, a: 'middle', f: 'm', w: 700, fill: ov > 40 ? '#04141c' : '#cfefff' });
  }
  s += t(O3.x, O3.y + 6 * O3.cs + 22, '6 × 6: one number per window place', { size: 14, fill: C.dim });
  if (!o.noWhole) { var u = wholeURL(); s += A.glass(650, 396, 282, 124, { col: '#22384d' }) + (u ? '<image href="' + u + '" x="664" y="408" width="100" height="100" style="image-rendering:pixelated"/>' : '') + t(778, 430, 'Same filter over', { size: 15, fill: C.dim }) + t(778, 452, 'the whole cell 6:', { size: 15, fill: C.dim }) + t(778, 480, 'the crack lights up', { size: 15, w: 700, fill: C.cy }); }
  return s;
}
var WHOLE = null;
function wholeURL() {   // the filter slid over every place of the real 64 x 64 cell 6 (same math, kept if above 0)
  if (WHOLE) return WHOLE; var px = D.pixels(6); if (!px) return '';
  var o = new Float32Array(62 * 62), mx = 1;
  for (var r = 0; r < 62; r++) for (var q = 0; q < 62; q++) { var sm = 0; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) sm += px[(r + i) * 64 + q + j] * K3[i * 3 + j]; o[r * 62 + q] = Math.max(0, sm); if (sm > mx) mx = sm; }
  var vals = []; for (var k = 0; k < o.length; k++) vals.push(Math.min(255, 255 * o[k] / (mx * 0.45)));
  return (WHOLE = mapURL(vals, 62, 'whole3b'));
}
function work3b(c) {
  var P = patch3b(), st = c.state; if (!P) return [];
  var pos = st.path[st.k], cv = conv3b(P, pos[0], pos[1]), r = [{ h: 'Window at row ' + pos[0] + ', column ' + pos[1] }];
  for (var i = 0; i < 3; i++) { var a = cv.terms.slice(i * 3, i * 3 + 3); r.push({ op: i ? '+' : '', v: a.map(function (q) { return q[0] + '×' + (q[1] < 0 ? '(' + q[1] + ')' : q[1]); }).join(' + '), k: 'row ' + (i + 1) + ' = ' + a.reduce(function (z, q) { return z + q[0] * q[1]; }, 0) }); }
  r.push({ op: '=', v: String(cv.sum), k: 'sum', res: true }, { v: String(cv.out), k: 'kept (below 0 becomes 0)' }, { tag: 'typical value' }, { t: '<i>Real pixels of cell 6 from the photo pack.</i>' });
  return r;
}
function path3b(f) { var p = []; if (f === 0) for (var q = 0; q < 6; q++) p.push([3, q]); else if (f === 1) for (var r = 0; r < 6; r++) p.push([r, 4]); return p; }
function arrow3b(c, dir) {
  var x = 432, y = 472, lab = dir === 'r' ? 'step right' : 'step down';
  var shape = '<rect x="' + x + '" y="' + (y - 24) + '" width="64" height="48" rx="12" fill="#0b121b" stroke="#ffb547" stroke-width="2.5"/>' + (dir === 'r' ? '<path d="M' + (x + 18) + ' ' + y + 'h28m-10 -10l10 10-10 10" stroke="#ffb547" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M' + (x + 32) + ' ' + (y - 14) + 'v28m-10 -10l10 10 10-10" stroke="#ffb547" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
  return A.target('step', shape, lab, x + 76, y + 4, { la: 'start' });
}
D.register('3b', {
  init: function () { return { path: path3b(0), k: 0, seen: ['3,0'], acted: 0 }; },
  frames: [
  { cap: 'Slide a 3 × 3 window across the crack',
    note: 'The window covers 9 pixels. Multiply each pixel by the filter number under it and add them up. That one number goes into the output map.',
    svg: function (c) { return scene3b(c, A.fx(), { acted: c.state.acted }) + arrow3b(c, 'r'); }, work: work3b,
    on: { step: function (c) { var st = c.state; st.acted = 1; if (st.k < st.path.length - 1) { st.k++; st.seen.push(st.path[st.k].join(',')); c.redraw(true); } if (st.k >= st.path.length - 1) { st.path = path3b(1); st.k = 0; if (st.seen.indexOf('0,4') < 0) st.seen.push('0,4'); c.next(); } } },
    auto: function (c) { c.state.seen = ['3,0', '3,1', '3,2', '3,3', '3,4', '3,5', '0,4']; c.state.path = path3b(1); c.state.k = 0; } },
  { cap: 'Down the crack: the numbers stay high',
    note: 'Where a dark line runs up and down, the middle column is darker than both sides, so the sum is big. Step down along the crack.',
    svg: function (c) { return scene3b(c, A.fx(), { acted: c.state.acted }) + arrow3b(c, 'd'); }, work: work3b,
    on: { step: function (c) { var st = c.state; if (st.k < st.path.length - 1) { st.k++; var key = st.path[st.k].join(','); if (st.seen.indexOf(key) < 0) st.seen.push(key); c.redraw(true); } if (st.k >= st.path.length - 1) c.next(); } },
    auto: function (c) { var st = c.state; st.k = 5; path3b(1).forEach(function (p) { var k = p.join(','); if (st.seen.indexOf(k) < 0) st.seen.push(k); }); } },
  { cap: 'Fill the whole map',
    note: 'The same 9 numbers slide over every place. The crack column lights up; the flat busbar row adds nothing.',
    svg: function (c) {
      var s = scene3b(c, A.fx(), { noWhole: 1 });
      s += A.target('fill', '<rect x="650" y="400" width="260" height="46" rx="12" fill="#0b121b" stroke="#ffb547" stroke-width="2.5"/>', 'slide over all 36 places', 780, 478, { inner: t(780, 429, 'FILL THE MAP', { size: 16, a: 'middle', f: 'h', fill: C.am }) });
      return s;
    }, work: work3b,
    on: { fill: function (c) { var st = c.state; for (var i = 0; i < 6; i++) for (var j = 0; j < 6; j++) if (st.seen.indexOf(i + ',' + j) < 0) st.seen.push(i + ',' + j); c.next(); } },
    auto: function (c) { var st = c.state; for (var i = 0; i < 6; i++) for (var j = 0; j < 6; j++) if (st.seen.indexOf(i + ',' + j) < 0) st.seen.push(i + ',' + j); } },
  { cap: 'One filter = one detector. A CNN learns many.',
    note: 'This hand-made filter answers one question: is there a dark line running up and down here? A CNN layer holds many filters and learns their numbers from the photos.',
    svg: function (c) {
      var s = scene3b(c, A.fx(), { noWhole: 1 }), P = patch3b(), col = 0;
      for (var i = 0; i < 6; i++) col += conv3b(P, i, 4).out;
      s += '<rect x="' + (O3.x + 4 * O3.cs - 4) + '" y="' + (O3.y - 4) + '" width="' + (O3.cs + 5) + '" height="' + (6 * O3.cs + 5) + '" rx="7" fill="none" stroke="#3dffa0" stroke-width="3" class="pgd-pop"/>';
      s += t(O3.x + 4.5 * O3.cs, O3.y + 6 * O3.cs + 50, 'the crack', { size: 16, a: 'middle', w: 700, fill: C.gr });
      s += A.glass(650, 420, 282, 96, { col: '#2f6b55' }).replace('<g', '<g') + t(668, 446, 'In 3c the network has', { size: 16, fill: C.dim }) + t(668, 476, '240 filters', { size: 24, f: 'm', w: 700, fill: C.gr }) + t(668, 502, 'and learns every number itself.', { size: 16, fill: C.dim });
      return s;
    },
    work: function (c) {
      var P = patch3b(); if (!P) return [];
      var colv = [], rowv = []; for (var i = 0; i < 6; i++) colv.push(conv3b(P, i, 4).out);
      var b = 0; for (var j = 0; j < 3; j++) b += P[7][j] * 1 + P[7][j + 1] * (-2) + P[7][j + 2] * 1; void rowv;
      return [{ h: 'Crack column' }, { v: colv.join(', '), k: 'output down the crack: all high' }, { h: 'Busbar row alone' }, { v: P[7][0] + '×1 + ' + P[7][1] + '×(−2) + ' + P[7][2] + '×1', k: 'a flat dark row' }, { op: '=', v: String(P[7][0] - 2 * P[7][1] + P[7][2]), k: 'almost nothing: a flat line has no dark middle', res: true },
        { t: 'The network in 3c has <b>240</b> filters like this one, in 4 blocks.' }, { tag: 'typical value' }];
    } }
  ]
});
})();
