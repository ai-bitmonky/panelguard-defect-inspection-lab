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
  if (on('phot')) { var k2 = S3A.n - 1; s += '<g class="' + (st.last === 'phot' ? 'pgd-in' : '') + '">' + A.arrow(x + S + 12, y - 6, x + S + 12 + k2 * S3A.ox, y - 6 + k2 * S3A.oy, AX.phot.col, { w: 3 }) + t(x + S + 12 + k2 * S3A.ox, y - 24 + k2 * S3A.oy, fmt(2624) + ' photos', { size: 17, a: 'end', f: 'm', w: 700, fill: AX.phot.col }) + '</g>'; }
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
    if (!used && want) { var dd = AX[want].dock(); s += A.target('h_' + k, '<rect x="' + (x - 4) + '" y="' + (y - 4) + '" width="208" height="58" rx="15" fill="none" stroke="#ffb547" stroke-width="2"/>', '', 0, 0, { name: 'drag the ' + k + ' handle onto the stack', kind: 'drag', cls: 'pgd-nochip', to: snapTo(x + 100, y + 25, dd[0], dd[1], 24), inner: handle3a(k, x, y, false) }); }
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
      s += A.glass(650, 420, 282, 96, { col: '#2f6b55' }).replace('<g', '<g') + t(668, 446, 'In 3c the network has', { size: 16, fill: C.dim }) + t(668, 476, D.liveRes('3c') ? '240 filters' : '4 blocks of filters', { size: 24, f: 'm', w: 700, fill: C.gr }) + t(668, 502, 'and learns every number itself.', { size: 16, fill: C.dim });
      return s;
    },
    work: function (c) {
      var P = patch3b(); if (!P) return [];
      var colv = [], rowv = []; for (var i = 0; i < 6; i++) colv.push(conv3b(P, i, 4).out);
      var b = 0; for (var j = 0; j < 3; j++) b += P[7][j] * 1 + P[7][j + 1] * (-2) + P[7][j + 2] * 1; void rowv;
      return [{ h: 'Crack column' }, { v: colv.join(', '), k: 'output down the crack: all high' }, { h: 'Busbar row alone' }, { v: P[7][0] + '×1 + ' + P[7][1] + '×(−2) + ' + P[7][2] + '×1', k: 'a flat dark row' }, { op: '=', v: String(P[7][0] - 2 * P[7][1] + P[7][2]), k: 'almost nothing: a flat line has no dark middle', res: true },
        { t: D.liveRes('3c') ? 'The network in 3c has <b>240</b> filters like this one, in 4 blocks.' : 'The network in 3c has 4 blocks of filters like this one (the count shows after you pass 3c).' }, { tag: 'typical value' }];
    } }
  ]
});

/* ============================ 3c  Build the network ============================ */
function net3c() {
  var r = D.liveRes('3c'), F = F3(), L, total, you = false;
  if (r && r.layers && r.layers.length) { L = r.layers.map(function (l) { return { cls: l.cls, out: l.out, params: l.params }; }); total = r.total; you = true; }
  else { L = (F.layers || []).map(function (l) { return { cls: l.cls, out: l.out, params: l.params }; }); total = F.total; }
  var B = [], cur = null;
  L.forEach(function (l) {
    if (l.cls === 'Conv2D') { cur = { conv: l.params, bn: 0, filt: l.out[3], size: l.out[1] }; B.push(cur); }
    else if (l.cls === 'BatchNormalization' && cur) cur.bn = l.params;
    else if (l.cls === 'MaxPooling2D' && cur) cur.out = l.out[1];
    else if (l.cls === 'Dense') B.head = l.params;
  });
  return { B: B, total: total, you: you, open: you };   // open: block 3's filter count may show (the student passed 3c)
}
var SLOT = [{ x: 214, f: 120 }, { x: 372, f: 92 }, { x: 514, f: 68 }, { x: 642, f: 48 }];
function slab3c(x, yc, f, sheets, face, col, o) {
  o = o || {}; var s = '', d = 5;
  for (var k = sheets - 1; k >= 0; k--) {
    var sx = x + k * d, sy = yc - f / 2 - k * d * 0.75;
    s += '<rect x="' + sx + '" y="' + sy + '" width="' + f + '" height="' + f + '" rx="3" fill="' + (k ? '#0f2233' : '#0a1622') + '" stroke="' + col + '" stroke-opacity="' + (k ? .35 : .9) + '"/>';
  }
  if (face) s += '<image href="' + face + '" x="' + x + '" y="' + (yc - f / 2) + '" width="' + f + '" height="' + f + '" style="image-rendering:pixelated"/>' + '<rect x="' + x + '" y="' + (yc - f / 2) + '" width="' + f + '" height="' + f + '" rx="3" fill="none" stroke="' + col + '" stroke-width="2"/>';
  return s;
}
function thumb3c(b, ch) { var T = F3().thumbs; if (!T || !T[b]) return ''; var q = T[b][ch || 0]; return mapURL(q.v, q.size, 't3c' + b + '_' + (ch || 0)); }
var BCOL = ['#46e3ff', '#3dffa0', '#a98bff', '#ffb547'];
function scene3c(c, fx, o) {
  o = o || {}; var N = net3c(), st = c.state, s = A.stage() + fx.defs, yc = 186;
  s += t(40, 42, 'THE NETWORK, LEFT TO RIGHT', { size: 14, f: 'h', fill: C.dim, ls: '.12em' });
  // input photo slab
  s += slab3c(36, yc, 150, 1, D.fullURL ? D.fullURL(6) : '', '#8d9bb0') + t(111, yc + 100, N.open ? '64 × 64 × 1' : '64 × 64 photo', { size: 16, a: 'middle', f: 'm', w: 700, fill: '#c7d4e4' }) + t(111, yc + 122, 'input', { size: 14, a: 'middle', fill: C.dim });
  var prevX = 186;
  N.B.forEach(function (b, k) {
    var sl = SLOT[k], placed = st.n > k, hide = k === 2 && !N.open, sheets = [3, 5, 8, 12][k];
    if (!placed) { s += '<rect x="' + sl.x + '" y="' + (yc - sl.f / 2) + '" width="' + sl.f + '" height="' + sl.f + '" rx="4" fill="none" stroke="' + (st.n === k ? '#ffb547' : '#2b3a4c') + '" stroke-width="2" stroke-dasharray="5 5"/>' + (st.n === k ? t(sl.x + sl.f / 2, yc + 6, 'drop', { size: 14, a: 'middle', fill: C.am }) : ''); return; }
    s += A.arrow(prevX + 4, yc, sl.x - 6, yc, '#5d6b80', { w: 2, head: 8 });
    s += '<g class="' + (st.n === k + 1 && st.acted ? 'pgd-pop' : '') + '">' + slab3c(sl.x, yc, sl.f, sheets, thumb3c(k), BCOL[k]) + '</g>';
    s += t(sl.x + sl.f / 2 + sheets * 2.5, yc + 96, b.out + ' × ' + b.out + ' × ' + (hide ? '?' : b.filt), { size: 15, a: 'middle', f: 'm', w: 700, fill: BCOL[k] });
    s += t(sl.x + sl.f / 2 + sheets * 2.5, yc + 118, (hide || (k === 3 && !N.open) ? '?' : fmt(b.conv + b.bn)) + ' weights', { size: 14, a: 'middle', f: 'm', fill: C.dim });
    prevX = sl.x + sl.f + sheets * 5;
  });
  if (!o.head) s += '<rect x="770" y="' + (yc - 66) + '" width="160" height="132" rx="12" fill="none" stroke="#2b3a4c" stroke-width="2" stroke-dasharray="5 5"/>' + t(850, yc - 4, 'score head', { size: 15, a: 'middle', fill: C.dim2 }) + t(850, yc + 18, 'comes last', { size: 14, a: 'middle', fill: C.dim2 });
  if (o.head) {
    s += A.arrow(prevX + 4, yc, 760, yc, '#5d6b80', { w: 2, head: 8 });
    s += '<g class="pgd-in">' + A.glass(764, yc - 70, 168, 140, { fx: fx, col: '#ff4d6a' }) + t(848, yc - 42, 'average each map', { size: 14, a: 'middle', fill: C.dim }) + t(848, yc - 20, '→ 128 numbers', { size: 15, a: 'middle', f: 'm', fill: '#c7d4e4' }) +
      t(848, yc + 8, '→ 1 score', { size: 20, a: 'middle', f: 'm', w: 700, fill: '#ff8aa0' }) + t(848, yc + 32, '0 = good, 1 = defect', { size: 14, a: 'middle', fill: C.dim }) + t(848, yc + 56, fmt(N.B.head || 129) + ' weights', { size: 14, a: 'middle', f: 'm', fill: C.dim }) + '</g>';
  }
  // the shelf of blocks
  s += A.glass(28, 336, 904, 184, { fx: fx, col: '#22384d' }) + t(46, 362, o.head ? 'WEIGHTS PER BLOCK' : 'THE SHELF', { size: 14, f: 'h', fill: C.dim, ls: '.1em' });
  if (!o.head) N.B.forEach(function (b, k) {
    var x = 60 + k * 214, y = 384, hide = k === 2 && !N.open;
    if (st.n > k) { s += '<rect x="' + x + '" y="' + y + '" width="190" height="104" rx="12" fill="none" stroke="' + BCOL[k] + '" stroke-opacity=".35" stroke-dasharray="5 5"/>' + t(x + 95, y + 58, 'in the network ✓', { size: 15, a: 'middle', fill: BCOL[k] }); return; }
    var brick = '<g' + (st.n === k ? '' : ' opacity=".45"') + '><rect x="' + x + '" y="' + y + '" width="190" height="104" rx="12" fill="#0b121b" stroke="' + BCOL[k] + '" stroke-width="2"/>' +
      [0, 1, 2].map(function (i) { return '<rect x="' + (x + 14 + i * 6) + '" y="' + (y + 18 - i * 4) + '" width="44" height="44" rx="3" fill="#0f2233" stroke="' + BCOL[k] + '" stroke-opacity=".6"/>'; }).join('') +
      t(x + 80, y + 34, 'block ' + (k + 1), { size: 17, w: 700, fill: BCOL[k] }) + t(x + 80, y + 58, (hide ? '?' : b.filt) + ' filters', { size: 15, f: 'm', fill: '#c7d4e4' }) +
      t(x + 14, y + 90, '3 × 3 each, then halve', { size: 14, fill: C.dim }) + '</g>';
    if (st.n === k) s += A.target('blk', '<rect x="' + (x - 4) + '" y="' + (y - 4) + '" width="198" height="112" rx="15" fill="none" stroke="#ffb547" stroke-width="2.5"/>', 'drag into the network', x + 95, y + 128, { kind: 'drag', to: snapTo(x + 95, y + 52, SLOT[k].x + SLOT[k].f / 2, yc, 24), inner: brick });
    else s += brick;
  });
  else {   // bar chart of the weights per block
    var ch = A.chart({ x: 170, y: 378, w: 720, h: 100, xd: [0, 80000], yd: [0, 5], xt: [0, 20000, 40000, 60000, 80000], fx: function (v) { return v ? (v / 1000) + 'k' : '0'; } });
    s += ch.svg.replace(/<rect[^>]*opacity=".55"\/>/, '');
    N.B.concat([{ head: 1 }]).forEach(function (b, k) {
      var y = 384 + k * 19, v = b.head ? (N.B.head || 129) : b.conv + b.bn, hide = (k === 2 || k === 3) && !N.open;   // block 4's count (3·3·64·128 + …) would give block 3's filters away
      s += t(160, y + 13, b.head ? 'score head' : 'block ' + (k + 1), { size: 14, a: 'end', fill: b.head ? '#ff8aa0' : BCOL[k] });
      if (!hide) s += '<rect class="pgd-in" x="170" y="' + y + '" width="' + Math.max(2, ch.X(v) - 170) + '" height="14" rx="3" fill="' + (b.head ? '#ff4d6a' : BCOL[k]) + '"/>' + t(ch.X(v) + 8, y + 12, fmt(v), { size: 14, f: 'm', fill: '#c7d4e4' });
      else s += A.lock(180, y + 12, 'after you pass 3c');
    });
  }
  return s;
}
function bind3c(c, root) {
  var st = c.state, k = st.n, x = 60 + k * 214, yc = 186, sl = SLOT[k];
  dragTo(c, root, 'blk', x + 95, 436, 24, null, function (p) { if (Math.abs(p.x - (sl.x + sl.f / 2)) < 70 && Math.abs(p.y - yc) < 80) { st.n++; st.acted = 1; c.next(); return true; } return false; });
}
function work3c(c) {
  var N = net3c(), k = c.state.n - 1, r = [];
  if (k < 0) return [{ h: 'The input' }, { v: '64 × 64', k: 'one gray photo goes in' }, { t: 'Each block: 3 × 3 filters look at every place, then the photo is halved.' }, srcTag(N.you)];
  var b = N.B[k], hide = k === 2 && !N.open, inC = k === 0 ? 1 : N.B[k - 1].filt, hideIn = k === 3 && !N.open, hideIn1 = k === 0 && !N.open;
  r.push({ h: 'Block ' + (k + 1) + ' weights' });
  r.push({ v: '3 × 3 × ' + (hideIn || hideIn1 ? '?' : inC) + ' × ' + (hide ? '?' : b.filt), k: 'filter size × channels in × filters' }, { op: '=', v: hide || hideIn ? '?' : fmt(b.conv), k: 'filter weights', res: true });
  r.push({ v: '4 × ' + (hide ? '?' : b.filt) + ' = ' + (hide ? '?' : fmt(b.bn)), k: 'batch-norm numbers (4 per filter)' });
  r.push({ h: 'Size' }, { v: b.size + ' → ' + b.out, k: 'pooling halves rows and columns' });
  if (hide || hideIn || hideIn1) r.push({ t: 'The “?” shows after you pass 3c in the lab.' });
  r.push(srcTag(N.you)); return r;
}
D.register('3c', {
  init: function () { return { n: 0, acted: 0 }; },
  frames: [
  { cap: 'One photo goes in: add the first block',
    note: 'The network starts with one gray 64 × 64 photo. Block 1 slides 16 small filters over it, then halves its size.',
    svg: function (c) { return scene3c(c, A.fx()); }, work: work3c, bind: bind3c, auto: function (c) { c.state.n = 1; } },
  { cap: 'Block 2: half the size, twice the filters',
    note: 'Each block halves rows and columns and doubles the filters. The maps get smaller but say more.',
    svg: function (c) { return scene3c(c, A.fx()); }, work: work3c, bind: bind3c, auto: function (c) { c.state.n = 2; } },
  { cap: 'Block 3: the maps shrink again',
    note: 'Each filter now looks at all the maps of the block before. Its weights grow with every channel that comes in.',
    svg: function (c) { return scene3c(c, A.fx()); }, work: work3c, bind: bind3c, auto: function (c) { c.state.n = 3; } },
  { cap: 'Block 4: tiny maps, many filters',
    note: 'The last block has the most channels in and the most filters out, so it holds the most weights.',
    svg: function (c) { return scene3c(c, A.fx()); }, work: work3c, bind: bind3c, auto: function (c) { c.state.n = 4; } },
  { cap: 'Average each map, then one score per cell',
    note: 'Each of the last maps is averaged to one number. One last layer turns those numbers into one defect score between 0 and 1.',
    svg: function (c) { return scene3c(c, A.fx(), { head: 1 }); },
    work: function (c) { var N = net3c(); return clean([{ h: 'The score head' }, { v: '4 × 4 × 128 → 128', k: 'one average per map' }, { v: '128 + 1 = ' + (N.B.head || 129), k: 'weights + one bias in the last layer' }, { h: 'All weights' }, { v: N.open ? fmt(N.total) : '?', k: N.open ? 'learned in 3e, not set by hand' : 'shows after you pass 3c (it would give block 3 away)', res: true }, srcTag(N.you)]); } }
  ]
});
/* ============================ 3d  Make more photos for free ============================ */
var P3D = { x: 138, y: 96, s: 230 };
function img3d(id, x, y, sz, flip, o) {   // flip: '', 'lr', 'ud', 'both'
  o = o || {}; var sx = flip === 'lr' || flip === 'both' ? -1 : 1, sy = flip === 'ud' || flip === 'both' ? -1 : 1, cx = x + sz / 2, cy = y + sz / 2;
  return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + sx + ' ' + sy + ') translate(' + (-cx) + ' ' + (-cy) + ')"' + (o.clip ? ' clip-path="url(#' + o.clip + ')"' : '') + '>' + A.cell(id, x, y, sz, { full: true }) + '</g>';
}
function scene3d(c, fx, mode) {
  var st = c.state, s = A.stage() + fx.defs, X = P3D.x, Y = P3D.y, S = P3D.s, id = 6;
  // the turntable
  s += '<ellipse cx="' + (X + S / 2) + '" cy="' + (Y + S + 46) + '" rx="190" ry="34" fill="' + 'url(#' + fx.mt + ')' + '" stroke="#5d6b80"/><ellipse cx="' + (X + S / 2) + '" cy="' + (Y + S + 40) + '" rx="176" ry="28" fill="#141c26" stroke="#3a4757"/>';
  s += '<ellipse cx="' + (X + S / 2) + '" cy="' + (Y + S + 84) + '" rx="200" ry="14" fill="#000" opacity=".45"/>';
  var shown = st.view || '';
  s += '<g filter="url(#' + fx.sh + ')"><rect x="' + (X - 8) + '" y="' + (Y - 8) + '" width="' + (S + 16) + '" height="' + (S + 16) + '" rx="8" fill="#0b121b" stroke="#2b4157"/></g>';
  s += '<g class="' + (st.acted ? 'pgd-flip' : '') + '">' + img3d(id, X, Y, S, shown) + '</g>';
  if (mode === 'patch') s += '<rect x="' + (X + 120) + '" y="' + (Y + 110) + '" width="70" height="60" fill="#0a0a0a" class="pgd-pop"/>';
  s += t(X + S / 2, Y - 22, 'REAL CELL 6 · cracked', { size: 14, f: 'h', a: 'middle', fill: C.dim, ls: '.08em' });
  // version gallery
  var V = [['', 'as taken'], ['lr', 'left-right'], ['ud', 'up-down'], ['both', 'both']];
  s += A.glass(560, 26, 372, 236, { fx: fx, col: '#2b4157' }) + t(580, 54, 'VERSIONS THE CAMERA COULD TAKE', { size: 13.5, f: 'h', fill: C.dim, ls: '.08em' });
  V.forEach(function (v, k) {
    var x = 580 + k * 88, y = 70, have = !v[0] || st.have.indexOf(v[0]) >= 0;
    s += have ? '<g class="' + (st.justGot === v[0] && v[0] ? 'pgd-pop' : '') + '">' + img3d(id, x, y, 76, v[0]) + '<rect x="' + x + '" y="' + y + '" width="76" height="76" fill="none" stroke="#3dffa0" stroke-width="1.5"/></g>' : '<rect x="' + x + '" y="' + y + '" width="76" height="76" rx="4" fill="#0a1019" stroke="#2b3a4c" stroke-dasharray="4 4"/>' + t(x + 38, y + 44, '?', { size: 20, a: 'middle', f: 'h', fill: C.dim2 });
    s += t(x + 38, y + 98, v[1], { size: 14, a: 'middle', fill: have ? '#c7d4e4' : C.dim2 });
  });
  s += t(580, 204, 'Busbars stay flat, the crack stays a crack,', { size: 15, fill: C.dim }) + t(580, 226, 'the label (defect) stays true.', { size: 15, fill: C.dim });
  return s;
}
function pix3d(dir) {   // where one real pixel of cell 6 goes under the mirror (fills the space before the judge question)
  var px = D.pixels(6), r = 20, col = 5, v = px ? px[r * 64 + col] : null, r2 = dir === 'ud' ? 63 - r : r, c2 = dir === 'lr' ? 63 - col : col, g = v == null ? '#556' : 'rgb(' + v + ',' + v + ',' + v + ')';
  var s = A.glass(560, 290, 372, 226, { col: '#2b4157' }) + t(580, 320, 'WHERE ONE PIXEL GOES', { size: 14, f: 'h', fill: C.dim, ls: '.08em' });
  s += '<rect x="584" y="340" width="96" height="96" fill="#0a1019" stroke="#3a4757"/><rect x="' + (584 + col * 1.5) + '" y="' + (340 + r * 1.5) + '" width="9" height="9" fill="' + g + '" stroke="#ffb547" stroke-width="2"/>';
  s += A.arrow(692, 388, 756, 388, '#ffb547', { w: 2.5 });
  s += '<rect x="768" y="340" width="96" height="96" fill="#0a1019" stroke="#3a4757"/><rect x="' + (768 + c2 * 1.5 - 4) + '" y="' + (340 + r2 * 1.5 - (dir === 'ud' ? 4 : 0)) + '" width="9" height="9" fill="' + g + '" stroke="#3dffa0" stroke-width="2"/>';
  s += t(632, 460, 'row ' + r + ', col ' + col, { size: 15, a: 'middle', f: 'm', fill: '#c7d4e4' }) + t(816, 460, 'row ' + r2 + ', col ' + c2, { size: 15, a: 'middle', f: 'm', fill: '#3dffa0' });
  s += t(746, 494, 'grey ' + (v == null ? '…' : v) + ' — the value moves, it does not change', { size: 15, a: 'middle', fill: C.dim });
  return s;
}
function judge3d(c, yes) {   // two answer buttons; the right one is first in the DOM
  var s = '<g class="pgd-chip"><rect x="560" y="290" width="372" height="32" rx="16" fill="#ffb547"/>' + t(746, 312, 'COULD THE CAMERA TAKE THIS PHOTO?', { size: 14, a: 'middle', w: 700, fill: '#1a1103', ls: '.04em' }) + '</g>';
  var bY = '<rect x="560" y="336" width="178" height="58" rx="12" fill="#0b1f17" stroke="#3dffa0" stroke-width="2"/>' + t(649, 372, 'YES, IT COULD', { size: 16, a: 'middle', f: 'h', fill: C.gr });
  var bN = '<rect x="754" y="336" width="178" height="58" rx="12" fill="#1f0b12" stroke="#ff4d6a" stroke-width="2"/>' + t(843, 372, 'NO', { size: 16, a: 'middle', f: 'h', fill: C.rd });
  var tY = A.target('yes', '<rect x="556" y="332" width="186" height="66" rx="15" fill="none" stroke="#ffb547" stroke-width="2"/>', '', 0, 0, { cls: 'pgd-nochip', inner: bY, name: 'Yes, the camera could take it' });
  var tN = A.target('no', '<rect x="750" y="332" width="186" height="66" rx="15" fill="none" stroke="#ffb547" stroke-width="2"/>', '', 0, 0, { cls: 'pgd-nochip', inner: bN, name: 'No, the camera could not' });
  s += yes ? tY + tN : tN + tY;
  if (c.state.wrong) s += t(746, 424, c.state.wrong, { size: 15, a: 'middle', fill: '#ff8aa0', cls: 'pgd-shake' });
  return s;
}
function mirror3d(c, dir) {   // the mirror bar to drag across the photo
  var X = P3D.x, Y = P3D.y, S = P3D.s, cid = A.uid('mir'), s = '';
  s += '<defs><clipPath id="' + cid + '"><rect id="' + cid + 'r" x="' + X + '" y="' + Y + '" width="' + (dir === 'lr' ? 0 : S) + '" height="' + (dir === 'lr' ? S : 0) + '"/></clipPath></defs>';
  s += img3d(6, X, Y, S, dir, { clip: cid });
  var bar = dir === 'lr' ? '<rect x="' + (X - 14) + '" y="' + (Y - 20) + '" width="10" height="' + (S + 40) + '" rx="5" fill="#bfefff" opacity=".9"/><rect x="' + (X - 24) + '" y="' + (Y + S / 2 - 22) + '" width="30" height="44" rx="8" fill="#ffb547"/>'
    : '<rect x="' + (X - 20) + '" y="' + (Y - 14) + '" width="' + (S + 40) + '" height="10" rx="5" fill="#bfefff" opacity=".9"/><rect x="' + (X + S / 2 - 22) + '" y="' + (Y - 24) + '" width="44" height="30" rx="8" fill="#ffb547"/>';
  var to = dir === 'lr' ? snapTo(X - 9, Y + S / 2, X + S + 12, Y + S / 2, 24) : snapTo(X + S / 2, Y - 9, X + S / 2, Y + S + 12, 24);
  s += A.target('mirror', bar, dir === 'lr' ? 'drag the mirror across' : 'drag the mirror down', dir === 'lr' ? X + S / 2 : X + S / 2, dir === 'lr' ? Y + S + 28 : Y + S + 28, { kind: 'drag', to: to });
  c._mir = { cid: cid, dir: dir };
  return s;
}
function bindMirror(c, root) {
  var m = c._mir; if (!m) return; var X = P3D.x, Y = P3D.y, S = P3D.s, r = root.querySelector('#' + m.cid + 'r'), st = c.state;
  var sx = m.dir === 'lr' ? X - 9 : X + S / 2, sy = m.dir === 'lr' ? Y + S / 2 : Y - 9;
  var el = root.querySelector('[data-pgd-t=mirror]');
  var drag = D.onDrag(root, el, { start: { x: sx, y: sy }, step: 24, live: false,
    clamp: function (p) { return m.dir === 'lr' ? { x: Math.max(sx, Math.min(X + S + 30, p.x)), y: sy } : { x: sx, y: Math.max(sy, Math.min(Y + S + 30, p.y)) }; },
    move: function (p) { if (m.dir === 'lr') { el.setAttribute('transform', 'translate(' + (p.x - sx) + ' 0)'); r.setAttribute('width', Math.max(0, Math.min(S, p.x - X))); } else { el.setAttribute('transform', 'translate(0 ' + (p.y - sy) + ')'); r.setAttribute('height', Math.max(0, Math.min(S, p.y - Y))); } },
    drop: function (p) { var far = m.dir === 'lr' ? p.x >= X + S - 10 : p.y >= Y + S - 10; if (far) { st.view = m.dir; st.mirrored = 1; st.acted = 1; c.redraw(true); } } });
  void drag;
}
function onJudge(c, right, ok, msg) {
  return function () {
    var st = c.state;
    if (right !== ok) { st.wrong = msg; c.redraw(true); return; }
    st.wrong = ''; st.acted = 0;
    if (st.view && st.have.indexOf(st.view) < 0) { st.have.push(st.view); st.justGot = st.view; }
    if (st.have.indexOf('lr') >= 0 && st.have.indexOf('ud') >= 0 && st.have.indexOf('both') < 0) st.have.push('both');
    st.mirrored = 0; st.view = ''; c.next();
  };
}
function work3d(c, k) {
  var F = F3(), n = F.nTrain || 1574, r = [];
  if (k === 0) r = [{ h: 'A left-right mirror' }, { t: 'Every pixel swaps sides: column 0 ↔ column 63, column 1 ↔ column 62 …' }, { v: '64 − 1 − column', k: 'new column of each pixel' }, { t: 'Cells sit either way round in a module, so the camera sees both.' }];
  if (k === 1) r = [{ h: 'An up-down mirror' }, { v: '64 − 1 − row', k: 'new row of each pixel' }, { t: 'Busbars stay flat (left-right). The crack is still a crack.' }];
  if (k === 2) r = [{ h: 'A pasted dark patch' }, { t: 'A dark area looks like a <b>dead part</b> of a cell: a defect. A good cell with this patch would carry the wrong label.' }, { t: 'Rule: only make changes the camera could really produce, and that keep the label true.' }];
  if (k === 3) r = [{ h: 'Photos for free' }, { v: fmt(n), k: 'train photos' }, { op: '×', v: '4', k: 'versions: as taken, left-right, up-down, both' }, { op: '=', v: fmt(4 * n), k: 'different photos the network can see', res: true },
    { v: fmt(n) + ' × 30', k: 'each epoch: every photo with new coin flips' }, { op: '=', v: fmt(30 * n), k: 'photo views in 30 epochs', res: true }];
  r.push({ tag: 'typical value' }); return r;
}
D.register('3d', {
  init: function () { return { view: '', have: [], mirrored: 0, wrong: '', acted: 0 }; },
  frames: [
  { cap: 'Mirror the photo left to right',
    note: 'Drag the mirror across the real cell. Then judge: could the camera have taken this photo?',
    svg: function (c) { var fx = A.fx(), st = c.state, s = scene3d(c, fx); s += st.mirrored ? judge3d(c, true) : pix3d('lr') + mirror3d(c, 'lr'); return s; },
    work: function (c) { return work3d(c, 0); },
    bind: function (c, root) { if (!c.state.mirrored) bindMirror(c, root); else { D.onTap(root.querySelector('[data-pgd-t=yes]'), onJudge(c, true, true)); D.onTap(root.querySelector('[data-pgd-t=no]'), onJudge(c, true, false, 'Look again: the busbars are still flat and the crack is still there.')); } },
    auto: function (c) { c.state.view = ''; c.state.have = ['lr']; c.state.mirrored = 0; } },
  { cap: 'Mirror it top to bottom',
    note: 'Drag the mirror down. An up-down mirror also gives a photo the camera could take.',
    svg: function (c) { var fx = A.fx(), st = c.state, s = scene3d(c, fx); s += st.mirrored ? judge3d(c, true) : pix3d('ud') + mirror3d(c, 'ud'); return s; },
    work: function (c) { return work3d(c, 1); },
    bind: function (c, root) { if (!c.state.mirrored) bindMirror(c, root); else { D.onTap(root.querySelector('[data-pgd-t=yes]'), onJudge(c, true, true)); D.onTap(root.querySelector('[data-pgd-t=no]'), onJudge(c, true, false, 'Look again: the busbars stay flat and the label stays true.')); } },
    auto: function (c) { c.state.have = ['lr', 'ud', 'both']; c.state.view = ''; } },
  { cap: 'Not every change is allowed',
    note: 'A dark patch pasted on a photo looks like a dead area, a real defect. The camera would not make it, and the label could become wrong.',
    svg: function (c) { var fx = A.fx(), s = scene3d(c, fx, 'patch'); s += judge3d(c, false); return s; },
    work: function (c) { return work3d(c, 2); },
    bind: function (c, root) { D.onTap(root.querySelector('[data-pgd-t=no]'), onJudge(c, false, false)); D.onTap(root.querySelector('[data-pgd-t=yes]'), onJudge(c, false, true, 'A dark patch looks like a dead area: a defect. It can make the label wrong.')); },
    init: null },
  { cap: 'Four versions of every photo, new flips every epoch',
    note: 'Each epoch, every train photo gets new coin flips: as taken, left-right, up-down or both. The network sees more variety without one new photo being taken.',
    svg: function (c) {
      var fx = A.fx(), F = F3(), n = F.nTrain || 1574, s = A.stage() + fx.defs;
      [['', 'as taken'], ['lr', 'left-right'], ['ud', 'up-down'], ['both', 'both']].forEach(function (v, k) { var x = 60 + k * 128; s += '<g class="pgd-in">' + img3d(6, x, 70, 110, v[0]) + '<rect x="' + x + '" y="70" width="110" height="110" fill="none" stroke="#3dffa0" stroke-width="1.5"/></g>' + t(x + 55, 204, v[1], { size: 15, a: 'middle', fill: '#c7d4e4' }); });
      s += t(60, 46, 'ONE REAL CELL, FOUR PHOTOS', { size: 14, f: 'h', fill: C.dim, ls: '.1em' });
      // coin flips per photo
      s += A.glass(580, 40, 352, 180, { fx: fx, col: '#2b4157' }) + t(600, 70, 'EACH PHOTO, EACH EPOCH', { size: 14, f: 'h', fill: C.dim, ls: '.08em' });
      s += '<circle cx="640" cy="130" r="28" fill="#2b2410" stroke="#ffb547" stroke-width="2"/>' + t(640, 136, 'L-R?', { size: 14, a: 'middle', f: 'm', w: 700, fill: C.am }) + '<circle cx="720" cy="130" r="28" fill="#2b2410" stroke="#ffb547" stroke-width="2"/>' + t(720, 136, 'U-D?', { size: 14, a: 'middle', f: 'm', w: 700, fill: C.am });
      s += t(770, 124, 'two coins:', { size: 15, fill: C.dim }) + t(770, 146, 'each 1 in 2', { size: 15, fill: C.dim }) + t(600, 196, 'label never changes', { size: 15, w: 700, fill: C.gr });
      // bar chart: photo counts
      var ch = A.chart({ x: 250, y: 262, w: 640, h: 200, xd: [0, 50000], yd: [0, 3], xt: [0, 10000, 20000, 30000, 40000, 50000], fx: function (v) { return v ? (v / 1000) + 'k' : '0'; }, xl: 'photos' });
      s += ch.svg;
      [['train photos taken', n, '#8fb0cf'], ['different versions', 4 * n, C.gr], ['views in 30 epochs', 30 * n, C.cy]].forEach(function (b, k) {
        var y = 280 + k * 62; s += t(240, y + 26, b[0], { size: 16, a: 'end', fill: b[2] }) + '<rect class="pgd-in' + (k ? String(Math.min(3, k + 1)) : '') + '" x="250" y="' + y + '" width="' + (ch.X(b[1]) - 250) + '" height="38" rx="5" fill="' + b[2] + '" fill-opacity=".8"/>' + t(ch.X(b[1]) + 10, y + 26, fmt(b[1]), { size: 18, f: 'm', w: 700, fill: '#fff' });
      });
      return s;
    },
    work: function (c) { return work3d(c, 3); } }
  ]
});
/* ============================ 3e  Train it ============================ */
function hist3e() {
  var r = D.liveRes('3e'), F = F3();
  if (r && r.hist && r.hist.length) return { h: r.hist.map(function (q) { return [q.epoch, q.loss, q.valAuc]; }), best: r.best ? [r.best.epoch, r.best.valAuc] : null, you: true, nTrain: r.nTrain, nDef: r.nDef };
  var b = null; (F.hist || []).forEach(function (q) { if (!b || q[2] > b[1]) b = [q[0], q[2]]; });
  return { h: F.hist || [], best: b, you: false, nTrain: F.nTrain || 1574, nDef: F.defTrain || 492 };
}
var RING = { x: 206, y: 286, r: 124 };
var STN = [{ k: 'predict', a: -90, lab: 'PREDICT', sub: 'scores for 32 photos', col: '#46e3ff' }, { k: 'compare', a: 0, lab: 'COMPARE', sub: 'score vs label → loss', col: '#ff8aa0' },
  { k: 'nudge', a: 90, lab: 'NUDGE', sub: 'move every weight a bit', col: '#ffb547' }, { k: 'validate', a: 180, lab: 'CHECK', sub: 'score validation', col: '#3dffa0' }];
function stPos(i) { var a = STN[i % 4].a * Math.PI / 180; return [RING.x + RING.r * Math.cos(a), RING.y + RING.r * Math.sin(a)]; }
function ring3e(c, fx, o) {
  o = o || {}; var st = c.state, s = '', at = st.at % 4;
  s += '<circle cx="' + RING.x + '" cy="' + RING.y + '" r="' + RING.r + '" fill="none" stroke="#1d3046" stroke-width="16"/>';
  s += '<circle cx="' + RING.x + '" cy="' + RING.y + '" r="' + RING.r + '" fill="none" stroke="#46e3ff" stroke-opacity=".35" stroke-width="3" stroke-dasharray="8 10" class="' + (st.acted ? 'pgd-flowonce' : '') + '"/>';
  for (var k = 0; k < 4; k++) { var a0 = (STN[k].a + 20) * Math.PI / 180, a1 = (STN[k].a + 70) * Math.PI / 180; s += A.arrow(RING.x + RING.r * Math.cos(a0), RING.y + RING.r * Math.sin(a0), RING.x + RING.r * Math.cos(a1), RING.y + RING.r * Math.sin(a1), '#2b4f6a', { w: 3, head: 10 }); }
  STN.forEach(function (q, i) {
    var p = stPos(i), on = i === at, w = 150, h = 62, x = p[0] - w / 2, y = p[1] - h / 2;
    s += '<g' + (on && st.acted ? ' class="pgd-pop"' : '') + '>' + A.glass(x, y, w, h, { fx: fx, col: on ? q.col : '#2b4157', r: 12 }) + t(p[0], y + 26, q.lab, { size: 15, f: 'h', a: 'middle', fill: on ? q.col : C.dim, ls: '.08em' }) + t(p[0], y + 48, q.sub, { size: 13.5, a: 'middle', fill: on ? '#c7d4e4' : C.dim2 }) + '</g>';
  });
  s += t(RING.x, RING.y - 8, 'epoch', { size: 15, a: 'middle', fill: C.dim }) + t(RING.x, RING.y + 26, String(st.ep), { size: 34, a: 'middle', f: 'm', w: 700, fill: '#fff' }).replace('<text ', '<text data-pgd-from="' + (st.ep0 == null ? st.ep : st.ep0) + '" ');
  return s;
}
function chart3e(c, fx, o) {
  o = o || {}; var H = hist3e(), E = H.h.length || 30, st = c.state, show = D.predDone('3e'), s = '', n = Math.min(st.ep, E);
  s += A.glass(452, 22, 480, 498, { fx: fx, col: '#22384d' });
  var xt = E <= 10 ? H.h.map(function (q) { return q[0]; }) : [1, 5, 10, 15, 20, 25, 30].filter(function (e) { return e <= E; });
  var c1 = A.chart({ x: 520, y: 62, w: 390, h: 150, xd: [1, E], yd: [0.4, 0.7], yt: [0.4, 0.5, 0.6, 0.7], fy: function (v) { return v.toFixed(1); } });
  var c2 = A.chart({ x: 520, y: 276, w: 390, h: 170, xd: [1, E], yd: [0.4, 0.9], xt: xt, yt: [0.4, 0.5, 0.6, 0.7, 0.8, 0.9], fy: function (v) { return v.toFixed(1); }, xl: 'epoch' });
  s += c1.svg + c2.svg + t(470, 50, 'TRAIN LOSS (LOWER = BETTER)', { size: 13.5, f: 'h', fill: C.am, ls: '.08em' }) + t(470, 264, 'VALIDATION RANKING SCORE', { size: 13.5, f: 'h', fill: C.gr, ls: '.08em' });
  var pl = H.h.slice(0, n).map(function (q) { return c1.X(q[0]).toFixed(1) + ',' + c1.Y(q[1]).toFixed(1); }), pv = H.h.slice(0, n).map(function (q) { return c2.X(q[0]).toFixed(1) + ',' + c2.Y(q[2]).toFixed(1); });
  if (pl.length > 1) s += '<polyline points="' + pl.join(' ') + '" fill="none" stroke="' + C.am + '" stroke-width="2.5"/>';
  H.h.slice(0, n).forEach(function (q, i) { s += '<circle cx="' + c1.X(q[0]) + '" cy="' + c1.Y(q[1]) + '" r="' + (i === n - 1 ? 5 : 2.5) + '" fill="' + C.am + '"' + (i === n - 1 ? ' class="pgd-pop"' : '') + '/>'; });
  if (n) s += A.tag(Math.min(c1.X(H.h[n - 1][0]) + 8, 850), c1.Y(H.h[n - 1][1]) - 10, H.h[n - 1][1].toFixed(3), C.am, { size: 13 });
  if (show) {
    if (pv.length > 1) s += '<polyline points="' + pv.join(' ') + '" fill="none" stroke="' + C.gr + '" stroke-width="2.5"/>';
    H.h.slice(0, n).forEach(function (q) { s += '<circle cx="' + c2.X(q[0]) + '" cy="' + c2.Y(q[2]) + '" r="2.5" fill="' + C.gr + '"/>'; });
    if (o.best && H.best) { var bx = c2.X(H.best[0]), by = c2.Y(H.best[1]); s += '<line x1="' + bx + '" x2="' + bx + '" y1="' + c2.Y(0.9) + '" y2="' + c2.Y(0.4) + '" stroke="#fff" stroke-dasharray="4 4"/><circle class="pgd-pop" cx="' + bx + '" cy="' + by + '" r="9" fill="none" stroke="#fff" stroke-width="2.5"/>' + A.tag(bx - 10, by - 14, 'best: epoch ' + H.best[0] + ' · ' + H.best[1].toFixed(3), '#fff', { a: 'end', size: 13 }); }
    else if (n === 1) s += A.tag(c2.X(1) + 10, c2.Y(H.h[0][2]) - 10, H.h[0][2].toFixed(3), C.gr, { size: 13 });
  } else {
    s += '<rect x="521" y="277" width="388" height="168" fill="#060b12" opacity=".85"/>' + A.lock(600, 368, 'shows after your 3e drawing');
  }
  return s;
}
D.register('3e', {
  init: function () { return { at: 0, ep: 0, ep0: null, acted: 0 }; },
  frames: [
  { cap: 'One epoch is one lap of the loop',
    note: 'Push the token around: predict scores for a batch, compare them with the labels (the loss), nudge every weight a little, and after all batches check the validation tray.',
    svg: function (c) {
      var fx = A.fx(), st = c.state, s = A.stage() + fx.defs + t(40, 42, 'THE TRAINING LOOP', { size: 14, f: 'h', fill: C.dim, ls: '.12em' }) + ring3e(c, fx) + chart3e(c, fx);
      var p = stPos(st.at), q = stPos(st.at + 1);
      s += A.target('tok', '<circle cx="' + p[0] + '" cy="' + (p[1] - 44) + '" r="15" fill="#ffb547" stroke="#fff" stroke-width="2"/>', st.at ? 'push on' : 'push the token', p[0] + (st.at === 1 ? -20 : 0), p[1] - (st.at === 2 ? -52 : 74), { kind: 'drag', to: snapTo(p[0], p[1] - 44, q[0], q[1] - 44, 20), la: st.at === 1 ? 'end' : 'middle' });
      return s;
    },
    work: function (c) {
      var H = hist3e(), st = c.state, n = H.nTrain, d = H.nDef, e1 = H.h[0] || [1, 0, 0], r = [{ h: STN[st.at % 4].lab.toLowerCase() }];
      if (st.at === 0) r.push({ v: fmt(n) + ' ÷ 32 → ' + Math.ceil(n / 32), k: 'batches of 32 flipped photos per epoch' }, { t: 'The network gives each photo a defect score from 0 to 1.' });
      if (st.at === 1) r.push({ t: 'The yes/no loss is small when the score is near the label, big when it is far.' }, { v: fmt(n) + ' ÷ (2 × ' + d + ') = ' + (n / (2 * d)).toFixed(2), k: 'weight of each defect (rare, so it counts more)' }, { v: fmt(n) + ' ÷ (2 × ' + (n - d) + ') = ' + (n / (2 * (n - d))).toFixed(2), k: 'weight of each good cell' });
      if (st.at === 2) r.push({ t: 'Each weight moves a small step in the direction that lowers the loss (Adam, step size 0.001).' });
      if (st.at === 3) r.push({ v: e1[1].toFixed(3), k: 'train loss after epoch 1' }, { t: 'Then all 525 validation cells are scored.' });
      r.push(srcTag(H.you)); var rn = refNote(H.you); if (rn) r.push(rn); return r;
    },
    bind: function (c, root) {
      var st = c.state, p = stPos(st.at), q = stPos(st.at + 1);
      dragTo(c, root, 'tok', p[0], p[1] - 44, 20, null, function (pt) { if (Math.hypot(pt.x - q[0], pt.y - (q[1] - 44)) < 60) { st.at++; st.acted = 1; if (st.at >= 4) { st.at = 0; st.ep = 1; c.next(); } else c.redraw(true); return true; } return false; });
    },
    auto: function (c) { c.state.at = 0; c.state.ep = 1; } },
  { cap: 'Pull the lever: ten more laps each time',
    note: 'The loop now runs on its own. Each pull runs ten more epochs. Watch the train loss fall.',
    svg: function (c) {
      var fx = A.fx(), st = c.state, H = hist3e(), E = H.h.length || 30, s = A.stage() + fx.defs + t(40, 42, 'THE TRAINING LOOP', { size: 14, f: 'h', fill: C.dim, ls: '.12em' }) + ring3e(c, fx) + chart3e(c, fx);
      var lx = 426, ly = 330;
      s += '<rect x="' + (lx - 8) + '" y="' + (ly - 90) + '" width="16" height="200" rx="8" fill="#111824" stroke="#3a4757"/>';
      s += A.target('lever', '<rect x="' + (lx - 16) + '" y="' + (ly - 104) + '" width="32" height="32" rx="16" fill="#ffb547" stroke="#fff" stroke-width="2"/>', 'pull down: +' + Math.ceil(E / 3), lx + 14, ly + 146, { kind: 'drag', to: lx + ',' + (ly - 88 + 160), la: 'end' });
      return s;
    },
    work: function (c) {
      var H = hist3e(), st = c.state, n = Math.min(st.ep, H.h.length), q = H.h[n - 1] || [0, 0, 0], f = H.h[0] || q;
      return clean([{ h: 'After ' + n + (n === 1 ? ' epoch' : ' epochs') }, { v: f[1].toFixed(3) + ' → ' + q[1].toFixed(3), k: 'train loss: epoch 1 → epoch ' + n }, { t: 'The train loss keeps falling: the network fits the train photos better and better.' }, srcTag(H.you), refNote(H.you)]);
    },
    bind: function (c, root) {
      var st = c.state, H = hist3e(), E = H.h.length || 30, lx = 426, ly = 330;
      dragTo(c, root, 'lever', lx, ly - 88, 20, null, function (p) { if (p.y > ly + 20) { st.ep0 = st.ep; st.ep = Math.min(E, st.ep === 1 ? Math.ceil(E / 3) : st.ep + Math.ceil(E / 3)); st.acted = 1; if (st.ep >= E) c.next(); else c.redraw(true); return true; } return false; });
    },
    auto: function (c) { var H = hist3e(); c.state.ep = H.h.length || 30; } },
  { cap: 'Train loss vs validation: which epoch to keep?',
    note: 'The train loss only tells how well the network fits photos it has seen. The validation score tells how it does on new photos.',
    svg: function (c) {
      var fx = A.fx(), H = hist3e(), show = D.predDone('3e'), s = A.stage() + fx.defs + t(40, 42, 'THE TRAINING LOOP', { size: 14, f: 'h', fill: C.dim, ls: '.12em' }) + ring3e(c, fx) + chart3e(c, fx);
      var E = H.h.length, c2x = function (e) { return 520 + (e - 1) / Math.max(1, E - 1) * 390; };
      if (show && H.best) { var y = 446 - (H.best[1] - 0.4) / 0.5 * 170; s += A.target('best', '<circle cx="' + c2x(H.best[0]) + '" cy="' + y + '" r="14" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap the best epoch', c2x(H.best[0]) - 20, y - 30, { la: 'end' }); }
      else { var last = H.h[E - 1], y1 = 212 - (last[1] - 0.4) / 0.3 * 150; s += A.target('best', '<circle cx="' + c2x(E) + '" cy="' + y1 + '" r="14" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap the last epoch', c2x(E) - 20, y1 + 40, { la: 'end' }); }
      return s;
    },
    work: function (c) {
      var H = hist3e(), show = D.predDone('3e'), last = H.h[H.h.length - 1];
      if (!show) return [{ h: 'Train loss' }, { v: H.h[0][1].toFixed(3) + ' → ' + last[1].toFixed(3), k: 'falls almost every epoch' }, { t: 'The validation line shows here after you draw your guess in 3e.' }, srcTag(H.you)];
      return clean([{ h: 'Validation score' }, { v: H.h[0][2].toFixed(3), k: 'epoch 1' }, { v: H.best[1].toFixed(3), k: 'highest: epoch ' + H.best[0] }, { v: last[2].toFixed(3), k: 'last: epoch ' + last[0] }, { t: 'It does not rise every epoch. The last epoch is not the best one.' }, srcTag(H.you), refNote(H.you)]);
    },
    on: { best: function (c) { c.next(); } } },
  { cap: 'Keep the weights of the best epoch',
    note: 'After training, the weights from the epoch with the best validation score are put back. Those are the weights you keep.',
    svg: function (c) {
      var fx = A.fx(), H = hist3e(), show = D.predDone('3e'), s = A.stage() + fx.defs + chart3e(c, fx, { best: 1 });
      s += A.glass(28, 60, 404, 400, { fx: fx, col: '#2f6b55' }) + t(48, 92, 'KEPT', { size: 15, f: 'h', fill: C.gr, ls: '.12em' });
      // a vault of weights
      for (var i = 0; i < 6; i++) for (var j = 0; j < 9; j++) s += '<rect x="' + (56 + j * 40) + '" y="' + (112 + i * 34) + '" width="32" height="26" rx="4" fill="#123326" stroke="#3dffa0" stroke-opacity=".5" class="' + ((i + j) % 3 ? '' : 'pgd-fade') + '"/>';
      s += t(48, 344, show ? 'weights of epoch ' + H.best[0] : 'weights of the best epoch', { size: 20, w: 700, fill: '#fff' }) + t(48, 372, (D.liveRes('3c') ? fmt(F3().total || 98001) + ' numbers' : 'all the weights') + ' put back', { size: 16, f: 'm', fill: C.dim });
      s += show ? t(48, 420, 'validation ' + H.best[1].toFixed(3) + ' (last epoch ' + H.h[H.h.length - 1][2].toFixed(3) + ')', { size: 16, f: 'm', fill: C.gr }) : A.lock(56, 420, 'after your 3e drawing');
      return s;
    },
    work: function (c) {
      var H = hist3e(), show = D.predDone('3e'), last = H.h[H.h.length - 1];
      return clean([{ h: 'Keep the best' }, show ? { v: H.best[1].toFixed(3) + ' vs ' + last[2].toFixed(3), k: 'best epoch ' + H.best[0] + ' vs last epoch ' + last[0], res: true } : { t: 'The numbers show after you answer the 3e drawing.' },
        { t: 'Train on train. Choose on validation. The test tray stays sealed.' }, srcTag(H.you), refNote(H.you)]);
    } }
  ]
});
/* ============================ 3f  Score it and blend it ============================ */
function blend3f() {
  var v = D.val(); if (!v) return null;
  var L = D.liveRes('3f'), w = L && L.bestW != null ? L.bestW : F3().bestW, you = v.youCnn || !!L;
  var b = v.cnn.map(function (q, i) { return w * q + (1 - w) * v.svc[i]; }), M = D.M;
  function row(sc) { return M.rates(v.y, sc, M.cutAt(v.y, sc, 0.95)); }
  var ws = L && L.ws ? L.ws : F3().ws;
  var I = []; for (var i = 0; i < v.y.length; i++) I.push(i);
  function top(f, key) { var o = I.filter(f).sort(function (a, c) { return key(c) - key(a); }); return o[0]; }
  var pick = [top(function (i) { return v.y[i] === 1; }, function (i) { return v.cnn[i] - v.svc[i]; }), top(function (i) { return v.y[i] === 0; }, function (i) { return v.svc[i] - v.cnn[i]; }),
    top(function (i) { return v.y[i] === 1; }, function (i) { return v.svc[i] - v.cnn[i]; }), top(function (i) { return v.y[i] === 0; }, function (i) { return v.cnn[i] - v.svc[i]; })];
  return { v: v, w: w, b: b, you: you, base: row(v.svc), cnn: row(v.cnn), blend: row(b), ws: ws, pick: pick, n: v.y.length };
}
var LN = { x0: 120, x1: 880, ys: 116, yb: 262, yc: 408 };
function lx(q) { return LN.x0 + q * (LN.x1 - LN.x0); }
function lines3f(c, fx, B, o) {
  o = o || {}; var s = '';
  [[LN.ys, 'STEP 2', C.vi], [LN.yc, 'CNN', C.cy]].concat(o.blend ? [[LN.yb, 'BLEND', C.am]] : []).forEach(function (L) {
    s += '<line x1="' + LN.x0 + '" x2="' + LN.x1 + '" y1="' + L[0] + '" y2="' + L[0] + '" stroke="' + L[2] + '" stroke-width="3" stroke-opacity=".8"/>';
    for (var k = 0; k <= 10; k++) s += '<line x1="' + lx(k / 10) + '" x2="' + lx(k / 10) + '" y1="' + L[0] + '" y2="' + (L[0] + 6) + '" stroke="' + L[2] + '" stroke-opacity=".6"/>' + (k % 2 ? '' : t(lx(k / 10), L[0] + 24, (k / 10).toFixed(1), { size: 13.5, a: 'middle', f: 'm', fill: C.dim }));
    s += t(LN.x0 - 14, L[0] + 6, L[1], { size: 15, a: 'end', f: 'h', fill: L[2] });
  });
  return s;
}
function pair3f(B, i, k, f) {   // one real cell: its Step 2 dot, its CNN dot, moving to the blend by f (0..1)
  var v = B.v, xs = lx(v.svc[i]), xc = lx(v.cnn[i]), xb = lx(B.b[i]), col = v.y[i] ? C.rd : C.gr;
  var ax = xs + (xb - xs) * f, ay = LN.ys + (LN.yb - LN.ys) * f, bx = xc + (xb - xc) * f, by = LN.yc + (LN.yb - LN.yc) * f, s = '';
  s += '<line class="pg3f-l" x1="' + ax + '" y1="' + ay + '" x2="' + bx + '" y2="' + by + '" stroke="' + col + '" stroke-opacity=".55" stroke-width="2" stroke-dasharray="5 4"/>';
  s += '<circle class="pg3f-a" cx="' + ax + '" cy="' + ay + '" r="8" fill="' + col + '" stroke="#fff" stroke-width="1.5"/><circle class="pg3f-b" cx="' + bx + '" cy="' + by + '" r="8" fill="' + col + '" stroke="#fff" stroke-width="1.5"/>';
  return s;
}
function photos3f(B) {   // the 4 real cells, with both scores
  var s = '';
  B.pick.forEach(function (i, k) {
    var v = B.v, x = 40 + k * 230, y = 452;
    s += A.cell(v.id[i], x, y, 62, { r: 3 }) + '<rect x="' + x + '" y="' + y + '" width="62" height="62" rx="3" fill="none" stroke="' + (v.y[i] ? C.rd : C.gr) + '" stroke-width="2"/>';
    s += t(x + 72, y + 16, (v.y[i] ? 'defect' : 'good') + ' · cell ' + v.id[i], { size: 14, w: 700, fill: v.y[i] ? '#ff8aa0' : C.gr });
    s += t(x + 72, y + 37, 'Step 2 ' + v.svc[i].toFixed(2), { size: 14, f: 'm', fill: C.vi }) + t(x + 72, y + 56, 'CNN ' + v.cnn[i].toFixed(2), { size: 14, f: 'm', fill: C.cy });
  });
  return s;
}
D.register('3f', {
  init: function () { return { poured: 0 }; },
  frames: [
  { cap: 'Two inspectors score the same cells',
    note: 'Each validation cell has a Step 2 score and a CNN score. They often disagree. Pour them together: each cell lands at the mix of its two scores.',
    svg: function (c) {
      var B = blend3f(), fx = A.fx(); if (!B) return A.stage();
      var s = A.stage() + fx.defs + lines3f(c, fx, B) + t(40, 40, 'THE SAME 4 REAL CELLS ON TWO SCORE LINES', { size: 14, f: 'h', fill: C.dim, ls: '.1em' });
      B.pick.forEach(function (i, k) { s += '<g class="pg3f" data-i="' + i + '">' + pair3f(B, i, k, 0) + '</g>'; });
      s += photos3f(B);
      s += A.target('pour', '<rect x="420" y="232" width="120" height="60" rx="30" fill="#2b2410" stroke="#ffb547" stroke-width="2.5"/><path d="M455 252h50l-8 22h-34z" fill="#ffb547"/>', 'hold to pour together', 480, 222, { kind: 'hold' });
      return s;
    },
    work: function (c) {
      var B = blend3f(); if (!B) return [];
      var r = [{ h: 'Same cell, two scores' }];
      B.pick.forEach(function (i) { r.push({ v: B.v.svc[i].toFixed(2) + ' vs ' + B.v.cnn[i].toFixed(2), k: 'cell ' + B.v.id[i] + ' (' + (B.v.y[i] ? 'defect' : 'good') + '): Step 2 vs CNN' }); });
      r.push(srcTag(B.you)); var rn = refNote(B.you); if (rn) r.push(rn); return r;
    },
    bind: function (c, root) {
      var B = blend3f(), el = root.querySelector('[data-pgd-t=pour]'); if (!B || !el) return;
      var gs = root.querySelectorAll('.pg3f');
      D.onHold(el, { ms: 1300, progress: function (f) { gs.forEach(function (g, k) { var i = +g.getAttribute('data-i'); g.innerHTML = pair3f(B, i, k, f); }); }, done: function () { c.state.poured = 1; c.next(); } });
    },
    auto: function (c) { c.state.poured = 1; } },
  { cap: 'The blend: each cell at the mix of its two scores',
    note: 'With weight w for the CNN, blend = w × CNN + (1 − w) × Step 2, for the same cell. Then each line gets its own gate at 95% recall.',
    svg: function (c) {
      var B = blend3f(), fx = A.fx(); if (!B) return A.stage();
      var s = A.stage() + fx.defs + lines3f(c, fx, B, { blend: 1 }) + t(40, 40, 'THREE SCORE LINES, EACH WITH ITS 95% GATE', { size: 14, f: 'h', fill: C.dim, ls: '.1em' });
      B.pick.forEach(function (i, k) { s += pair3f(B, i, k, 0) + '<circle class="pgd-pop" cx="' + lx(B.b[i]) + '" cy="' + LN.yb + '" r="9" fill="' + (B.v.y[i] ? C.rd : C.gr) + '" stroke="#ffb547" stroke-width="2.5"/>'; });
      [[LN.ys, B.base, C.vi], [LN.yb, B.blend, C.am], [LN.yc, B.cnn, C.cy]].forEach(function (L) {
        var gx = lx(L[1].cut); s += '<rect x="' + (gx - 3) + '" y="' + (L[0] - 26) + '" width="6" height="52" rx="3" fill="#ffb547"/>' + A.tag(LN.x1 + 6, L[0] - 30, L[1].fp + ' false alarms', L[2], { a: 'end', size: 13 });
      });
      s += photos3f(B);
      var lo = [B.base, B.blend, B.cnn], m = 0; lo.forEach(function (r, k) { if (r.fp < lo[m].fp) m = k; });
      var ys = [LN.ys, LN.yb, LN.yc][m];
      s += A.target('fewest', '<rect x="' + (LN.x0 - 90) + '" y="' + (ys - 30) + '' + '" width="' + (LN.x1 - LN.x0 + 100) + '" height="60" rx="12" fill="none" stroke="#ffb547" stroke-width="2.5"/>', 'tap the line with the fewest false alarms', 480, ys - 40);
      return s;
    },
    work: function (c) {
      var B = blend3f(); if (!B) return [];
      var i = B.pick[0], v = B.v;
      return clean([{ h: 'Blend of cell ' + v.id[i] }, { v: B.w + ' × ' + v.cnn[i].toFixed(3), k: 'CNN part' }, { op: '+', v: (1 - B.w).toFixed(1) + ' × ' + v.svc[i].toFixed(3), k: 'Step 2 part, same cell' }, { op: '=', v: B.b[i].toFixed(3), k: 'blend score', res: true },
        { h: 'Good cells stopped at 95% recall' }, { v: String(B.base.fp), k: 'Step 2 alone', col: C.vi }, { v: String(B.cnn.fp), k: 'CNN alone', col: C.cy }, { v: String(B.blend.fp), k: 'blend', col: C.am }, srcTag(B.you), refNote(B.you)]);
    },
    on: { fewest: function (c) { c.next(); } } },
  { cap: 'Two different inspectors cancel some mistakes',
    note: 'The blend weight was chosen on validation: the mix with the fewest false alarms at 95% recall. Per 1,000 cells, fewer good cells are stopped than with either inspector alone.',
    svg: function (c) {
      var B = blend3f(), fx = A.fx(); if (!B) return A.stage();
      var s = A.stage() + fx.defs;
      s += A.glass(28, 22, 470, 498, { fx: fx, col: '#22384d' }) + t(48, 54, 'FALSE ALARMS AT 95% RECALL, BY MIX', { size: 13.5, f: 'h', fill: C.dim, ls: '.08em' });
      var ch = A.chart({ x: 100, y: 84, w: 370, h: 330, xd: [0, 1], yd: [0.4, 0.65], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [0.4, 0.45, 0.5, 0.55, 0.6, 0.65], fx: function (v) { return v.toFixed(1); }, fy: function (v) { return Math.round(v * 100) + '%'; }, xl: 'CNN weight w (0 = Step 2 only, 1 = CNN only)' });
      s += ch.svg;
      var pts = B.ws.map(function (q) { return ch.X(q[0]).toFixed(1) + ',' + ch.Y(q[1]).toFixed(1); });
      s += '<polyline class="pgd-draw" style="--len:600" points="' + pts.join(' ') + '" fill="none" stroke="' + C.am + '" stroke-width="3"/>';
      B.ws.forEach(function (q) { var best = Math.abs(q[0] - B.w) < 1e-9; s += '<circle cx="' + ch.X(q[0]) + '" cy="' + ch.Y(q[1]) + '" r="' + (best ? 8 : 4) + '" fill="' + (best ? '#fff' : C.am) + '"' + (best ? ' class="pgd-pop"' : '') + '/>'; });
      var bq = B.ws.filter(function (q) { return Math.abs(q[0] - B.w) < 1e-9; })[0];
      if (bq) s += A.tag(ch.X(bq[0]), ch.Y(bq[1]) + 34, 'w ' + B.w + ' · ' + p1(bq[1]), '#fff', { a: 'middle', size: 14 });
      s += t(ch.X(0) + 8, ch.Y(B.ws[0][1]) - 10, 'Step 2', { size: 14, fill: C.vi }) + t(ch.X(1) - 8, ch.Y(B.ws[B.ws.length - 1][1]) - 10, 'CNN', { size: 14, a: 'end', fill: C.cy });
      // per 1,000 cells
      s += A.glass(518, 22, 414, 498, { fx: fx, col: '#7a5a2a' }) + t(538, 54, 'GOOD CELLS STOPPED PER 1,000', { size: 13.5, f: 'h', fill: C.am, ls: '.08em' });
      var rows = [['Step 2', B.base, C.vi], ['CNN', B.cnn, C.cy], ['Blend', B.blend, C.am]], mx = 450;
      rows.forEach(function (r, k) {
        var v = Math.round(1000 * r[1].fp / B.n), y = 96 + k * 120, w = v / mx * 300;
        s += t(538, y, r[0], { size: 17, w: 700, fill: r[2] }) + '<rect class="pgd-in' + (k ? String(k + 1) : '') + '" x="538" y="' + (y + 14) + '" width="' + w.toFixed(1) + '" height="40" rx="6" fill="' + r[2] + '" fill-opacity=".85"/>' + t(538 + w + 10, y + 42, String(v), { size: 24, f: 'm', w: 700, fill: '#fff' });
        s += t(538, y + 76, 'false-alarm rate ' + p1(r[1].far) + ' · recall ' + p1(r[1].rec), { size: 14, f: 'm', fill: C.dim });
      });
      s += t(538, 476, 'Chosen on validation: a little hopeful.', { size: 15, fill: C.dim }) + t(538, 500, 'Step 8 checks it once on the sealed test tray.', { size: 15, fill: C.dim });
      return s;
    },
    work: function (c) {
      var B = blend3f(); if (!B) return [];
      var k = 1000 / B.n;
      return clean([{ h: 'Per 1,000 cells' }, { v: B.base.fp + ' × ' + k.toFixed(3), k: 'Step 2 good cells stopped' }, { op: '=', v: String(Math.round(B.base.fp * k)), k: 'per 1,000' }, { v: B.blend.fp + ' × ' + k.toFixed(3), k: 'blend good cells stopped' }, { op: '=', v: String(Math.round(B.blend.fp * k)), k: 'per 1,000', res: true },
        { t: 'Saved: <b>' + (Math.round(B.base.fp * k) - Math.round(B.blend.fp * k)) + '</b> re-checks per 1,000 cells, same 95% recall.' }, srcTag(B.you), refNote(B.you)]);
    } }
  ]
});
/* ============================ 3g  Two gates, not one ============================ */
function g3g() {
  var B = blend3f(); if (!B) return null;
  var y = B.v.y, sc = B.b, G = D.M.gatesFor(y, sc), L = D.liveRes('3g');
  return { B: B, y: y, s: sc, G: G, you: B.you || !!L, lanes: function (lo, hi) { return D.M.twoGates(y, sc, lo, hi); } };
}
var AXG = { x0: 80, x1: 880, y: 150 };
function gx(v) { return AXG.x0 + v * (AXG.x1 - AXG.x0); }
function gv(x) { return Math.max(0, Math.min(1, (x - AXG.x0) / (AXG.x1 - AXG.x0))); }
function strip3g(G) {   // every validation cell as a dot over its blend score
  var s = '', B = 40, cnt = {}, w = (AXG.x1 - AXG.x0) / B;
  G.s.forEach(function (v, i) { var b = Math.min(B - 1, Math.floor(v * B)), k = (cnt[b] = (cnt[b] || 0) + 1) - 1, cx = gx((b + 0.5) / B) + ((k % 3) - 1) * 5.5, cy = AXG.y - 8 - Math.floor(k / 3) * 5.5; if (cy < 34) return; s += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="2.4" fill="' + (G.y[i] ? '#ff4d6a' : '#6f93b8') + '"/>'; });
  s += '<line x1="' + AXG.x0 + '" x2="' + AXG.x1 + '" y1="' + AXG.y + '" y2="' + AXG.y + '" stroke="#5d6b80" stroke-width="2"/>';
  for (var k = 0; k <= 10; k++) s += '<line x1="' + gx(k / 10) + '" x2="' + gx(k / 10) + '" y1="' + AXG.y + '" y2="' + (AXG.y + 6) + '" stroke="#5d6b80"/>' + t(gx(k / 10), AXG.y + 24, (k / 10).toFixed(1), { size: 14, a: 'middle', f: 'm', fill: C.dim });
  s += t(AXG.x0, 30, 'BLEND SCORES OF ALL ' + G.y.length + ' VALIDATION CELLS', { size: 13.5, f: 'h', fill: C.dim, ls: '.08em' }) + t(AXG.x1, 30, '● defect  ● good', { size: 14, a: 'end', fill: C.dim }).replace('● defect', '<tspan fill="#ff4d6a">●</tspan> defect').replace('● good', '<tspan fill="#6f93b8">●</tspan> good');
  return s;
}
function lanes3g(G, lo, hi, fx) {
  var L = G.lanes(lo, hi), n = L.n, k = 1000 / n, s = '', x0 = AXG.x0, xl = gx(lo), xh = gx(Math.max(lo, hi)), x1 = AXG.x1, y = 196, h = 190;
  function lane(a, b, col, title, cells, defs, ok, id) {
    var w = Math.max(0, b - a); if (w < 2) return '';
    var o = '<path d="M' + (a + 2) + ' ' + y + 'H' + (b - 2) + 'L' + (b - 8) + ' ' + (y + h) + 'H' + (a + 8) + 'Z" fill="' + col + '" fill-opacity=".1" stroke="' + col + '" stroke-opacity=".7" stroke-width="1.5"/>';
    for (var r = 0; r < 6; r++) o += '<line x1="' + (a + 10) + '" x2="' + (b - 10) + '" y1="' + (y + 18 + r * 30) + '" y2="' + (y + 18 + r * 30) + '" stroke="' + col + '" stroke-opacity=".12"/>';
    if (w > 110) o += t((a + b) / 2, y + 34, title, { size: 15, a: 'middle', f: 'h', fill: col, ls: '.06em' }) + t((a + b) / 2, y + 84, String(Math.round(cells * k)), { size: 34, a: 'middle', f: 'm', w: 700, fill: '#fff', cls: id }) + t((a + b) / 2, y + 108, 'per 1,000 cells', { size: 14, a: 'middle', fill: C.dim }) +
      t((a + b) / 2, y + 142, defs + ' defects', { size: 15, a: 'middle', f: 'm', fill: '#ff8aa0' }) + t((a + b) / 2, y + 164, ok + ' good', { size: 15, a: 'middle', f: 'm', fill: '#8fb0cf' });
    return o;
  }
  s += lane(x0, xl, C.gr, 'AUTO PASS', L.defPass + L.okPass, L.defPass, L.okPass);
  s += lane(xl, xh, C.am, 'A PERSON CHECKS', L.defHuman + L.okHuman, L.defHuman, L.okHuman);
  s += lane(xh, x1, C.rd, 'AUTO STOP', L.defStop + L.okStop, L.defStop, L.okStop);
  return { svg: s, L: L };
}
function gate3g(x, col, lab) { return '<rect x="' + (x - 4) + '" y="40" width="8" height="350" rx="4" fill="' + col + '" opacity=".9"/><rect x="' + (x - 26) + '" y="' + (AXG.y - 16) + '" width="52" height="32" rx="9" fill="' + col + '" stroke="#fff" stroke-width="2"/>' + t(x, AXG.y + 6, lab, { size: 13, a: 'middle', f: 'h', fill: '#1a1103' }); }
function sum3g(G, L, fx, o) {
  o = o || {}; var s = A.glass(28, 404, 904, 120, { fx: fx, col: '#22384d' });
  var pr = L.passRate, bad = pr > 0.05 + 1e-9;
  s += A.gauge(110, 466, 34, Math.min(1, pr / 0.1), { col: bad ? C.rd : C.gr, val: p1(pr), vs: 15 });
  s += t(156, 452, L.defPass + ' of ' + L.nDef + ' defects pass unchecked', { size: 17, w: 700, fill: bad ? '#ff8aa0' : '#fff' }) + t(156, 478, 'rule: at most 5 of every 100', { size: 15, fill: C.dim });
  var prec = L.defStop + L.okStop ? L.defStop / (L.defStop + L.okStop) : null;
  s += t(560, 452, 'auto-stop pile: ' + (prec == null ? 'empty' : p1(prec) + ' real defects'), { size: 17, w: 700, fill: prec != null && prec < 0.95 ? '#ff8aa0' : '#fff' }) + t(560, 478, 'rule: at least 95 of every 100', { size: 15, fill: C.dim });
  return s;
}
D.register('3g', {
  init: function () { return { lo: 0, hi: 1 }; },
  frames: [
  { cap: 'The low gate: below it, cells pass with no check',
    note: 'Drag the low gate up the score line. Cells below it pass with no check, so at most 5 of every 100 defects may sit below it.',
    svg: function (c) {
      var G = g3g(), fx = A.fx(); if (!G) return A.stage();
      var st = c.state, R = lanes3g(G, st.lo, st.hi, fx), s = A.stage() + fx.defs + strip3g(G) + '<g id="g3gl">' + R.svg + '</g>' + '<g id="g3gs">' + sum3g(G, R.L, fx) + '</g>';
      s += gate3g(gx(st.hi), C.rd, 'HIGH');
      s += A.target('lo', gate3g(gx(st.lo), C.gr, 'LOW'), 'drag the low gate up', gx(st.lo) + 40, 78, { kind: 'drag', la: 'start', to: snapTo(gx(st.lo), 215, gx(G.G.low), 215, 8) });
      return s;
    },
    work: function (c) {
      var G = g3g(); if (!G) return [];
      var L = G.lanes(c.state.lo, c.state.hi);
      return clean([{ h: 'Low gate at ' + c.state.lo.toFixed(2) }, { v: L.defPass + ' ÷ ' + L.nDef, k: 'defects below the gate ÷ all defects' }, { op: '=', v: p1(L.passRate), k: 'pass unchecked (rule: 5% or less)', res: true },
        { t: '5% of ' + L.nDef + ' = ' + (0.05 * L.nDef).toFixed(2) + ' → at most ' + Math.floor(0.05 * L.nDef) + ' defects below the low gate.' }, srcTag(G.you), refNote(G.you)]);
    },
    bind: function (c, root) {
      var G = g3g(), st = c.state, fx = A.fx(), sx = gx(st.lo), el = root.querySelector('[data-pgd-t=lo]');
      var drag = D.onDrag(root, el, { start: { x: sx, y: AXG.y }, step: 8, live: true,
        clamp: function (p) { return { x: Math.max(AXG.x0, Math.min(gx(st.hi) - 10, p.x)), y: AXG.y }; },
        move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - sx) + ' 0)'); var v = gv(p.x), R = lanes3g(G, v, st.hi, fx); root.querySelector('#g3gl').innerHTML = R.svg; root.querySelector('#g3gs').innerHTML = sum3g(G, R.L, fx); st.lo = v; c.rework(); },
        drop: function (p, live) { var v = gv(p.x); if (live) return; if (v <= G.G.low + 1e-9 && v >= G.G.low - 0.04) { st.lo = G.G.low; c.next(); } } });
      void drag;
    },
    auto: function (c) { var G = g3g(); c.state.lo = G.G.low; } },
  { cap: 'The high gate: above it, cells stop with no check',
    note: 'Drag the high gate down. Cells above it stop with no check, so that pile must be at least 95 of every 100 real defects.',
    svg: function (c) {
      var G = g3g(), fx = A.fx(); if (!G) return A.stage();
      var st = c.state, R = lanes3g(G, st.lo, st.hi, fx), s = A.stage() + fx.defs + strip3g(G) + '<g id="g3gl">' + R.svg + '</g>' + '<g id="g3gs">' + sum3g(G, R.L, fx) + '</g>';
      s += gate3g(gx(st.lo), C.gr, 'LOW');
      s += A.target('hi', gate3g(gx(st.hi), C.rd, 'HIGH'), 'drag the high gate down', gx(st.hi) - 40, 78, { kind: 'drag', la: 'end', to: snapTo(gx(st.hi), 215, gx(G.G.high), 215, 8) });
      return s;
    },
    work: function (c) {
      var G = g3g(); if (!G) return [];
      var L = G.lanes(c.state.lo, c.state.hi), pile = L.defStop + L.okStop;
      return clean([{ h: 'High gate at ' + c.state.hi.toFixed(2) }, { v: L.defStop + ' ÷ ' + pile, k: 'real defects in the auto-stop pile ÷ all cells in it' }, { op: '=', v: pile ? p1(L.defStop / pile) : '–', k: 'rule: 95% or more', res: true },
        { t: 'Lower the gate and the pile grows, but more good cells slip in.' }, srcTag(G.you), refNote(G.you)]);
    },
    bind: function (c, root) {
      var G = g3g(), st = c.state, fx = A.fx(), sx = gx(st.hi), el = root.querySelector('[data-pgd-t=hi]');
      D.onDrag(root, el, { start: { x: sx, y: AXG.y }, step: 8, live: true,
        clamp: function (p) { return { x: Math.max(gx(st.lo) + 10, Math.min(AXG.x1, p.x)), y: AXG.y }; },
        move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - sx) + ' 0)'); var v = gv(p.x), R = lanes3g(G, st.lo, v, fx); root.querySelector('#g3gl').innerHTML = R.svg; root.querySelector('#g3gs').innerHTML = sum3g(G, R.L, fx); st.hi = v; c.rework(); },
        drop: function (p, live) { var v = gv(p.x); if (live) return; if (v >= G.G.high - 1e-9 && v <= G.G.high + 0.04) { st.hi = G.G.high; c.next(); } } });
    },
    auto: function (c) { var G = g3g(); c.state.hi = G.G.high; } },
  { cap: 'Three lanes: the model takes the sure cells, a person the rest',
    note: 'With both gates set by the rules, most defects are stopped automatically or sent to a person. Only a few pass unchecked, and the person sees fewer cells than all of them.',
    svg: function (c) {
      var G = g3g(), fx = A.fx(); if (!G) return A.stage();
      var st = c.state, R = lanes3g(G, st.lo, st.hi, fx), s = A.stage() + fx.defs + strip3g(G) + '<g class="pgd-fade">' + R.svg + '</g>' + sum3g(G, R.L, fx);
      s += gate3g(gx(st.lo), C.gr, 'LOW') + gate3g(gx(st.hi), C.rd, 'HIGH');
      s += A.tag(gx(st.lo), 66, st.lo.toFixed(3), C.gr, { a: 'middle', size: 14 }) + A.tag(gx(st.hi), 66, st.hi.toFixed(3), C.rd, { a: 'middle', size: 14 });
      return s;
    },
    work: function (c) {
      var G = g3g(); if (!G) return [];
      var L = G.lanes(c.state.lo, c.state.hi), k = 1000 / L.n, one = G.B.blend;
      return clean([{ h: 'Per 1,000 cells' }, { v: String(Math.round(1000 * L.autoPass)), k: 'auto pass' }, { v: String(Math.round(1000 * L.human)), k: 'a person checks' }, { v: String(Math.round(1000 * L.autoStop)), k: 'auto stop' },
        { op: '=', v: L.defPass + ' of ' + L.nDef + ' (' + p1(L.passRate) + ')', k: 'defects that pass unchecked', res: true },
        { h: 'One gate instead (3f)' }, { v: String(Math.round(one.fp * k)), k: 'good cells stopped per 1,000, with no person to look' }, srcTag(G.you), refNote(G.you)]);
    } }
  ]
});
D.S3 = { blend: blend3f, gates: g3g };   // shared with the Step 4-5 diagrams (same scores, same gates)
})();
