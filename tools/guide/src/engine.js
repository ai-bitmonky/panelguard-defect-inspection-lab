/* PanelGuard Diagram guide — diagram engine (window.PGD).
   A diagram = a short list of frames. Each frame is one static picture (SVG markup) with ONE thing to do on it.
   Doing it moves the diagram to the next frame. Frame dots let the student go back. No Next / Play buttons.
   Register:  PGD.register('1a', { title, frames: [ frame, ... ] })
   frame = {
     cap:  'short caption (the idea of this frame)',
     note: 'one plain sentence for print / screen readers',
     svg(c)  -> SVG markup for the 960 x 540 stage (use the helpers in c / PGD.art),
     work(c) -> rows for the "Work it out" strip (see workHTML),
     bind(c, root) (optional) -> wire the frame's action; call c.next() when it is done, c.redraw() after a state change.
   }
   Simple frames can skip bind and use c.tap('id', ...) markup + frame.on = { id: function (c) { ... } }.
   c.state is one plain object per diagram; it is snapshotted on entry to every frame so going back restores it. */
(function () {
'use strict';
var REG = {};
var W = 960, H = 540;
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); };
var fmt = function (n, d) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
var pct = function (a, b, d) { return b ? fmt(100 * a / b, d == null ? 1 : d) + '%' : '–'; };
function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function log() { try { console.log.apply(console, ['[guide]'].concat([].slice.call(arguments))); } catch (e) {} }

/* ---------------- data: labels, photos, the student's live values ---------------- */
var LAB = null, ID2I = null;
function labels() {
  if (LAB) return LAB;
  try { var e = window.PG_EMBED && window.PG_EMBED['data/labels.json']; if (e) LAB = JSON.parse(e.text); } catch (err) { LAB = null; }
  if (LAB) { ID2I = {}; LAB.rows.forEach(function (r, i) { ID2I[r[0]] = i; }); }
  return LAB;
}
function meta(id) { var L = labels(); if (!L || ID2I[id] == null) return null; var r = L.rows[ID2I[id]]; return { id: r[0], prob: r[1], score: r[1] === 1 ? '1.0' : String(r[1]), kind: r[2], i: ID2I[id] }; }
/* every count a Step 0/1 diagram shows, computed from labels.json */
var COUNTS = null;
function counts() {
  if (COUNTS) return COUNTS;
  var L = labels(); if (!L) return null;
  var P = [0, 0.33, 0.67, 1], c = { n: L.rows.length, bins: [0, 0, 0, 0], mono: [0, 0, 0, 0], poly: [0, 0, 0, 0] };
  L.rows.forEach(function (r) { var k = P.indexOf(r[1]); if (k < 0) return; c.bins[k]++; c[r[2]][k]++; });
  c.nMono = c.mono.reduce(function (a, b) { return a + b; }, 0); c.nPoly = c.n - c.nMono;
  c.def = c.bins[2] + c.bins[3]; c.ok = c.n - c.def; c.unsure = c.bins[1] + c.bins[2];
  c.shape = L.shape; c.perPhoto = L.shape[1] * L.shape[2]; c.bytes = c.n * c.perPhoto;
  return (COUNTS = c);
}
function pack() { try { return window.PG && window.PG.pack ? window.PG.pack() : null; } catch (e) { return null; } }
function pixels(id) { var p = pack(), m = meta(id); if (!p || !m) return null; return p.subarray(m.i * 4096, m.i * 4096 + 4096); }
var URLS = {};
function cellURL(id) {
  if (URLS[id]) return URLS[id];
  var px = pixels(id); if (!px) return '';
  try {
    var cv = document.createElement('canvas'); cv.width = cv.height = 64;
    var x = cv.getContext('2d'), im = x.createImageData(64, 64);
    for (var k = 0; k < 4096; k++) { var v = px[k]; im.data[4 * k] = v; im.data[4 * k + 1] = v; im.data[4 * k + 2] = v; im.data[4 * k + 3] = 255; }
    x.putImageData(im, 0, 0); return (URLS[id] = cv.toDataURL('image/png'));
  } catch (e) { return ''; }
}
function fullURL(id) {   // the 300 x 300 photo when the lab ships it (or the guide's own 240 px copy in facts.photos), else the 64 x 64 one
  var ph = (window.PGD_FACTS || {}).photos; if (ph && ph[id]) return 'data:image/jpeg;base64,' + ph[id];
  var key = 'data/full/cell' + ('000' + id).slice(-4) + '.png';
  var e = window.PG_EMBED && window.PG_EMBED[key];
  return e && e.b64 ? 'data:image/png;base64,' + e.b64 : cellURL(id);
}
function hasFull(id) { var ph = (window.PGD_FACTS || {}).photos; if (ph && ph[id]) return true; var e = window.PG_EMBED && window.PG_EMBED['data/full/cell' + ('000' + id).slice(-4) + '.png']; return !!(e && e.b64); }
var packWaiters = [];
function whenPack(fn) { if (pack()) return fn(); packWaiters.push(fn); }
(function poll() { if (pack()) { var w = packWaiters; packWaiters = []; w.forEach(function (f) { try { f(); } catch (e) { log('pack waiter', e && e.message); } }); } setTimeout(poll, packWaiters.length ? 300 : 1500); })();

function liveRes(id) {   // the student's own probe result, only when that cell passed
  try { var P = window.PG; if (P && P.VERD && P.VERD[id] && P.VERD[id].pass && P.RES[id]) return P.RES[id]; } catch (e) {}
  return null;
}
function liveSub(id) {   // read-only copy of a substep's saved {mech, pred}
  try {
    var P = window.PG; if (!P) return {};
    var rv = P.review && P.review() && P.RV && P.RV.subs[id] && P.RV.subs[id].mech && Object.keys(P.RV.subs[id].mech).length ? P.RV.subs[id] : P.S && P.S.subs[id];
    return rv ? JSON.parse(JSON.stringify(rv)) : {};
  } catch (e) { return {}; }
}

/* ---------------- SVG art helpers (shared by every diagram file) ---------------- */
var COL = { bg: '#05070b', panel: '#0c1119', panel2: '#111824', line: '#1b2533', line2: '#263346', ink: '#e6eef8', dim: '#8d9bb0', dim2: '#5d6b80',
  cy: '#46e3ff', cy2: '#1aa6c9', am: '#ffb547', gr: '#3dffa0', rd: '#ff4d6a', vi: '#a98bff', steel: '#2a3340', steel2: '#151b24' };
var FH = "Orbitron,'Segoe UI',Arial,sans-serif", FB = "Rajdhani,'Segoe UI',Arial,sans-serif", FM = "'Space Mono',Consolas,monospace";
var uidN = 0;
function uid(p) { return (p || 'g') + (++uidN); }
var A = {
  MIN: 14,   // smallest stage font: at 1366 x 768 the stage scales to ~0.88, so 14 stays above 12 px on screen
  W: W, H: H, COL: COL, FH: FH, FB: FB, FM: FM, uid: uid, esc: esc, fmt: fmt, pct: pct,
  t: function (x, y, s, o) {   // text. o: {size, fill, w (weight), a (anchor), f ('h'|'m'|'b'), ls, cls, op}
    o = o || {};
    var f = o.f === 'h' ? FH : o.f === 'm' ? FM : FB;
    return '<text x="' + x + '" y="' + y + '" font-family="' + f + '" font-size="' + Math.max(A.MIN, o.size || 18) + '" fill="' + (o.fill || COL.ink) + '" font-weight="' + (o.w || (o.f === 'h' ? 700 : 600)) + '"' +
      (o.a ? ' text-anchor="' + o.a + '"' : '') + (o.ls ? ' letter-spacing="' + o.ls + '"' : '') + (o.op != null ? ' opacity="' + o.op + '"' : '') + (o.cls ? ' class="' + o.cls + '"' : '') + '>' + esc(s) + '</text>';
  },
  /* the shared stage background: same canvas on every frame and every diagram */
  stage: function (o) {
    o = o || {};
    var id = uid('st');
    return '<defs><linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08101b"/><stop offset=".7" stop-color="#0a1322"/><stop offset="1" stop-color="#05080e"/></linearGradient>' +
      '<radialGradient id="' + id + 'r" cx=".62" cy="-.1" r=".9"><stop offset="0" stop-color="#0f2a40" stop-opacity=".8"/><stop offset="1" stop-color="#0f2a40" stop-opacity="0"/></radialGradient>' +
      '<pattern id="' + id + 'p" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#12304a" stroke-width=".7"/></pattern></defs>' +
      '<g class="pgd-bg"><rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'g)"/><rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'r)"/>' +
      '<rect width="' + W + '" height="' + (o.floor || H) + '" fill="url(#' + id + 'p)" opacity=".38"/>' +
      (o.floor ? '<rect y="' + o.floor + '" width="' + W + '" height="' + (H - o.floor) + '" fill="#04070c" opacity=".7"/><line x1="0" y1="' + o.floor + '" x2="' + W + '" y2="' + o.floor + '" stroke="#1e3a52" stroke-width="1.5"/>' : '') + '</g>';
  },
  /* a glow filter (blur) — returns its id inside defs markup */
  glow: function (id, sd) { return '<filter id="' + id + '" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="' + (sd || 6) + '"/></filter>'; },
  /* a real cell photo. o: {full (300 px photo), px (pixelated), op, clip, cls} */
  cell: function (id, x, y, s, o) {
    o = o || {};
    var href = o.full ? fullURL(id) : cellURL(id);
    var frame = '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="' + (o.r || 3) + '" fill="#0d1520"/>';
    if (!href) return frame + '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="3" fill="none" stroke="#263346" stroke-dasharray="4 4"/>' +
      A.t(x + s / 2, y + s / 2 + 5, 'loading photo…', { size: 13, fill: COL.dim, a: 'middle' });
    return frame + '<image class="pgd-photo' + (o.cls ? ' ' + o.cls : '') + '" href="' + href + '" x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" preserveAspectRatio="none"' +
      (o.px ? ' style="image-rendering:pixelated"' : '') + (o.op != null ? ' opacity="' + o.op + '"' : '') + (o.clip ? ' clip-path="url(#' + o.clip + ')"' : '') + '/>';
  },
  /* a small value tag with a coordinate / number on the picture */
  tag: function (x, y, s, col, o) {
    o = o || {};
    var w = Math.max(30, s.length * (o.size ? o.size * 0.62 : 9.4) + 16), h = o.h || 26, a = o.a || 'start', x0 = a === 'middle' ? x - w / 2 : a === 'end' ? x - w : x;
    return '<g class="pgd-tag"><rect x="' + x0 + '" y="' + (y - h + 7) + '" width="' + w + '" height="' + h + '" rx="6" fill="#071019" stroke="' + (col || COL.cy) + '" stroke-opacity=".7"/>' +
      A.t(x0 + w / 2, y - 1 + (o.dy || 0), s, { size: o.size || 15, fill: col || COL.cy, a: 'middle', f: 'm', w: 700 }) + '</g>';
  },
  arrow: function (x1, y1, x2, y2, col, o) {
    o = o || {};
    var a = Math.atan2(y2 - y1, x2 - x1), n = o.head || 11;
    return '<g' + (o.cls ? ' class="' + o.cls + '"' : '') + '><path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + (col || COL.cy) + '" stroke-width="' + (o.w || 2.5) + '" fill="none" stroke-linecap="round"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>' +
      '<path d="M' + x2 + ' ' + y2 + 'L' + (x2 - n * Math.cos(a - 0.45)) + ' ' + (y2 - n * Math.sin(a - 0.45)) + 'L' + (x2 - n * Math.cos(a + 0.45)) + ' ' + (y2 - n * Math.sin(a + 0.45)) + 'Z" fill="' + (col || COL.cy) + '"/></g>';
  },
  /* a glowing do-this target. kind: tap | drag | hold. The label chip is the ONLY instruction. */
  target: function (key, shape, label, lx, ly, o) {
    o = o || {};
    var lw = Math.round(label.length * 10.4 + 50), la = o.la || 'middle', x0 = la === 'middle' ? lx - lw / 2 : la === 'end' ? lx - lw : lx;
    var ix = x0 + 17, iy = ly - 4, k = o.kind || 'tap';
    var icon = k === 'drag' ? '<path d="M' + (ix - 7) + ' ' + iy + 'h14M' + (ix - 3) + ' ' + (iy - 4) + 'l-4 4 4 4M' + (ix + 3) + ' ' + (iy - 4) + 'l4 4-4 4" stroke="#1a1103" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
      : k === 'hold' ? '<circle cx="' + ix + '" cy="' + iy + '" r="6.5" fill="none" stroke="#1a1103" stroke-width="2"/><circle cx="' + ix + '" cy="' + iy + '" r="3" fill="#1a1103"/>'
      : '<circle cx="' + ix + '" cy="' + iy + '" r="6.5" fill="none" stroke="#1a1103" stroke-width="2"/><circle cx="' + ix + '" cy="' + iy + '" r="1.8" fill="#1a1103"/>';
    return '<g class="pgd-target' + (o.cls ? ' ' + o.cls : '') + '" data-pgd-t="' + key + '" data-pgd-act="' + k + '"' + (o.to ? ' data-pgd-to="' + o.to + '"' : '') +
      ' tabindex="0" role="button" aria-label="' + esc(label) + '"' + (o.style ? ' style="' + o.style + '"' : '') + '>' +
      '<g class="pgd-ring">' + shape + '</g>' + (o.inner || '') +
      '<g class="pgd-chip"><rect x="' + x0 + '" y="' + (ly - 19) + '" width="' + lw + '" height="30" rx="15" fill="' + COL.am + '"/>' + icon +
      A.t(x0 + 30 + (lw - 30) / 2 - 4, ly + 1, label.toUpperCase(), { size: 14, fill: '#1a1103', a: 'middle', w: 700, ls: '.06em' }) + '</g></g>';
  },
  /* a little unit pile: n cells as blocks, cols across, from bottom-left upward */
  blocks: function (x, yb, n, cols, sz, gap, col, o) {
    o = o || {}; var s = '';
    for (var i = 0; i < n; i++) { var cx = x + (i % cols) * (sz + gap), cy = yb - (Math.floor(i / cols) + 1) * (sz + gap); s += '<rect x="' + cx + '" y="' + cy + '" width="' + sz + '" height="' + sz + '" rx="1" fill="' + (typeof col === 'function' ? col(i) : col) + '"/>'; }
    return '<g' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' + s + '</g>';
  }
};

/* ---------------- richer art helpers (batch 2) ---------------- */
/* common filters + gradients for one frame: returns {defs, sh (drop shadow id), gl (soft glow id), gls (glass gradient id), mt (metal gradient id)} */
A.fx = function () {
  var k = uid('fx');
  return { sh: k + 's', gl: k + 'g', gls: k + 'l', mt: k + 'm', vg: k + 'v',
    defs: '<defs><filter id="' + k + 's" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur in="SourceAlpha" stdDeviation="7"/><feOffset dy="8"/><feComponentTransfer><feFuncA type="linear" slope=".55"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="' + k + 'g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<linearGradient id="' + k + 'l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2b3e" stop-opacity=".92"/><stop offset=".55" stop-color="#0e1826" stop-opacity=".9"/><stop offset="1" stop-color="#0a121c" stop-opacity=".95"/></linearGradient>' +
      '<linearGradient id="' + k + 'm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4757"/><stop offset=".45" stop-color="#1d2632"/><stop offset="1" stop-color="#11171f"/></linearGradient>' +
      '<radialGradient id="' + k + 'v" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#46e3ff" stop-opacity=".16"/><stop offset="1" stop-color="#46e3ff" stop-opacity="0"/></radialGradient></defs>' };
};
/* a glass panel: soft fill, top highlight, thin rim. o: {r, col (rim), fx (from A.fx), op} */
A.glass = function (x, y, w, h, o) {
  o = o || {}; var r = o.r == null ? 14 : o.r, col = o.col || '#2b4760';
  return '<g' + (o.fx ? ' filter="url(#' + o.fx.sh + ')"' : '') + (o.cls ? ' class="' + o.cls + '"' : '') + '><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + (o.fx ? 'url(#' + o.fx.gls + ')' : '#0e1826') + '" stroke="' + col + '" stroke-opacity="' + (o.op || .8) + '" stroke-width="1.4"/>' +
    '<path d="M' + (x + r) + ' ' + (y + 1.5) + 'H' + (x + w - r) + '" stroke="#ffffff" stroke-opacity=".14" stroke-width="2" stroke-linecap="round"/></g>';
};
/* a conveyor belt seen slightly from above: top surface y..y+h, rollers below. o: {fx, moving} */
A.belt = function (x, y, w, h, o) {
  o = o || {}; var s = '', k = uid('bl');
  s += '<defs><linearGradient id="' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26313f"/><stop offset="1" stop-color="#121922"/></linearGradient>' +
    '<pattern id="' + k + 'p" width="26" height="' + h + '" patternUnits="userSpaceOnUse"><path d="M0 0V' + h + '" stroke="#0a0f15" stroke-width="2" opacity=".55"/></pattern></defs>';
  s += '<ellipse cx="' + (x + w / 2) + '" cy="' + (y + h + 30) + '" rx="' + (w / 2 + 10) + '" ry="12" fill="#000" opacity=".45"/>';
  s += '<rect x="' + x + '" y="' + (y + h) + '" width="' + w + '" height="14" rx="3" fill="' + (o.fx ? 'url(#' + o.fx.mt + ')' : '#1d2632') + '"/>';
  for (var i = 0; i <= Math.floor(w / 60); i++) s += '<circle cx="' + (x + 14 + i * 60) + '" cy="' + (y + h + 7) + '" r="5" fill="#0b1016" stroke="#3a4757"/>';
  s += '<path d="M' + (x + 10) + ' ' + y + 'H' + (x + w - 10) + 'L' + (x + w) + ' ' + (y + h) + 'H' + x + 'Z" fill="url(#' + k + ')" stroke="#3a4757" stroke-width="1.2"/>';
  s += '<path d="M' + (x + 10) + ' ' + y + 'H' + (x + w - 10) + 'L' + (x + w) + ' ' + (y + h) + 'H' + x + 'Z" fill="url(#' + k + 'p)"' + (o.moving ? ' class="pgd-beltmove"' : '') + '/>';
  s += '<path d="M' + (x + 10) + ' ' + (y + .8) + 'H' + (x + w - 10) + '" stroke="#5d6b80" stroke-opacity=".6"/>';
  return s;
};
/* a card that holds a real cell photo, with depth. o: {fx, ring (colour), label, sub, full} */
A.photoCard = function (id, x, y, s, o) {
  o = o || {}; var p = 5;
  return '<g' + (o.cls ? ' class="' + o.cls + '"' : '') + '><rect x="' + (x - p) + '" y="' + (y - p) + '" width="' + (s + 2 * p) + '" height="' + (s + 2 * p) + '" rx="7" fill="#0b121b" stroke="' + (o.ring || '#2b4157') + '" stroke-width="' + (o.ring ? 2.2 : 1.2) + '"' + (o.fx ? ' filter="url(#' + o.fx.sh + ')"' : '') + '/>' +
    A.cell(id, x, y, s, { full: o.full, r: 3 }) + (o.label ? A.t(x + s / 2, y + s + p + 17, o.label, { size: o.ls || 13, a: 'middle', f: 'm', fill: o.lc || COL.dim }) : '') + '</g>';
};
/* an arc gauge: frac 0..1, optional target tick. o: {col, label, val (text), target, w} */
A.gauge = function (cx, cy, r, frac, o) {
  o = o || {}; var a0 = Math.PI * 0.8, a1 = Math.PI * 2.2, sw = o.w || 12;
  function pt(f, rr) { var a = a0 + (a1 - a0) * f; return (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); }
  function arc(f0, f1, col, wdt, op) { var big = (f1 - f0) * (a1 - a0) > Math.PI ? 1 : 0; return '<path d="M' + pt(f0, r) + 'A' + r + ' ' + r + ' 0 ' + big + ' 1 ' + pt(f1, r) + '" stroke="' + col + '" stroke-width="' + wdt + '" fill="none" stroke-linecap="round"' + (op ? ' opacity="' + op + '"' : '') + '/>'; }
  var s = arc(0, 1, '#18222f', sw) + (frac > 0.001 ? arc(0, Math.min(1, frac), o.col || COL.cy, sw) : '');
  if (o.target != null) { var a = a0 + (a1 - a0) * o.target; s += '<path d="M' + (cx + (r - sw) * Math.cos(a)) + ' ' + (cy + (r - sw) * Math.sin(a)) + 'L' + (cx + (r + sw) * Math.cos(a)) + ' ' + (cy + (r + sw) * Math.sin(a)) + '" stroke="#fff" stroke-width="2.5"/>' + A.t(cx + (r + sw + 20) * Math.cos(a), cy + (r + sw + 20) * Math.sin(a) + 5, o.tl || '', { size: 14, a: 'middle', f: 'm', fill: '#fff' }); }
  if (o.val) s += A.t(cx, cy + 8, o.val, { size: o.vs || 26, a: 'middle', f: 'm', w: 700, fill: o.vc || '#fff', cls: o.vcls });
  if (o.label) s += A.t(cx, cy + r + 18, o.label, { size: 16, a: 'middle', fill: COL.dim });
  return s;
};
/* a finished chart frame: axes with real ticks. o: {x,y,w,h, xd:[min,max], yd:[min,max], xt:[...], yt:[...], fx(v)->label, fy(v)->label, xl, yl, grid}
   returns {svg, X(v), Y(v)} */
A.chart = function (o) {
  var X = function (v) { return o.x + (v - o.xd[0]) / (o.xd[1] - o.xd[0]) * o.w; }, Y = function (v) { return o.y + o.h - (v - o.yd[0]) / (o.yd[1] - o.yd[0]) * o.h; };
  var s = '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="#08101a" opacity=".55"/>';
  (o.yt || []).forEach(function (v) { s += '<line x1="' + o.x + '" x2="' + (o.x + o.w) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#16273a"' + (o.grid === false ? ' opacity="0"' : '') + '/>' + A.t(o.x - 8, Y(v) + 5, o.fy ? o.fy(v) : String(v), { size: 15, a: 'end', f: 'm', fill: COL.dim }); });
  (o.xt || []).forEach(function (v) { s += '<line x1="' + X(v) + '" x2="' + X(v) + '" y1="' + (o.y + o.h) + '" y2="' + (o.y + o.h + 6) + '" stroke="#5d6b80"/>' + A.t(X(v), o.y + o.h + 22, o.fx ? o.fx(v) : String(v), { size: 15, a: 'middle', f: 'm', fill: COL.dim }); });
  s += '<path d="M' + o.x + ' ' + o.y + 'V' + (o.y + o.h) + 'H' + (o.x + o.w) + '" stroke="#5d6b80" stroke-width="1.5" fill="none"/>';
  if (o.xl) s += A.t(o.x + o.w / 2, o.y + o.h + 46, o.xl, { size: 16, a: 'middle', fill: COL.dim });
  if (o.yl) s += '<text x="' + (o.x - 46) + '" y="' + (o.y + o.h / 2) + '" font-family="' + FB + '" font-size="16" font-weight="600" fill="' + COL.dim + '" text-anchor="middle" transform="rotate(-90 ' + (o.x - 46) + ' ' + (o.y + o.h / 2) + ')">' + esc(o.yl) + '</text>';
  return { svg: s, X: X, Y: Y };
};
/* a lock badge: a value the student unlocks in the lab (prediction or code gap) */
A.lock = function (x, y, label) {
  return '<g class="pgd-lock"><rect x="' + (x - 6) + '" y="' + (y - 17) + '" width="' + (label.length * 8.4 + 36) + '" height="26" rx="13" fill="#0b121b" stroke="#5d6b80" stroke-dasharray="3 3"/>' +
    '<path d="M' + (x + 3) + ' ' + (y - 6) + 'v-3a4 4 0 0 1 8 0v3" stroke="#8d9bb0" stroke-width="1.6" fill="none"/><rect x="' + (x + 1) + '" y="' + (y - 6) + '" width="12" height="9" rx="2" fill="#8d9bb0"/>' +
    A.t(x + 20, y, label, { size: 15, fill: COL.dim }) + '</g>';
};

/* ---------------- shared maths (same rules as the lab's jskernel.js) ---------------- */
var M = {
  cutAt: function (y, s, recall) { var d = []; for (var i = 0; i < y.length; i++) if (y[i] === 1) d.push(s[i]); d.sort(function (a, b) { return b - a; }); var k = Math.ceil((recall == null ? 0.95 : recall) * d.length - 1e-9); return d[Math.max(0, k - 1)]; },
  rates: function (y, s, cut) { var tp = 0, fn = 0, fp = 0, tn = 0; for (var i = 0; i < y.length; i++) { var st = s[i] >= cut; if (y[i] === 1) { if (st) tp++; else fn++; } else { if (st) fp++; else tn++; } } return { cut: cut, tp: tp, fn: fn, fp: fp, tn: tn, rec: tp / (tp + fn), far: fp / (fp + tn), prec: tp + fp ? tp / (tp + fp) : 0 }; },
  twoGates: function (y, s, low, high) { var hi = Math.max(high, low), o = { low: low, high: high, n: y.length, defPass: 0, defHuman: 0, defStop: 0, okPass: 0, okHuman: 0, okStop: 0 };
    for (var i = 0; i < y.length; i++) { var k = s[i] < low ? 'Pass' : (s[i] >= hi ? 'Stop' : 'Human'); o[(y[i] === 1 ? 'def' : 'ok') + k]++; }
    o.nDef = o.defPass + o.defHuman + o.defStop; o.nOk = o.okPass + o.okHuman + o.okStop; o.passRate = o.defPass / o.nDef; o.human = (o.defHuman + o.okHuman) / o.n; o.autoStop = (o.defStop + o.okStop) / o.n; o.autoPass = (o.defPass + o.okPass) / o.n; return o; },
  gatesFor: function (y, s) { var d = []; for (var i = 0; i < y.length; i++) if (y[i] === 1) d.push(s[i]); d.sort(function (a, b) { return a - b; });
    var low = d[Math.floor(0.05 * d.length)], order = s.map(function (v, i) { return i; }).sort(function (a, b) { return s[b] - s[a]; }), high = Infinity, caught = 0;
    order.forEach(function (i, n) { caught += y[i]; if (caught / (n + 1) >= 0.95) high = s[i]; }); return { low: low, high: high, nDef: d.length }; }
};
/* the validation tray, per cell: Step 2 score (svc) and CNN score (cnn). The student's own scores when 2c / 3f passed, else the reference run. */
function val() {
  var F = (window.PGD_FACTS || {}).s3; if (!F || !F.val) return null;
  var v = F.val, o = { id: v.id, y: v.y, prob: v.prob, kind: v.kind, svc: v.svc, cnn: v.cnn, youSvc: false, youCnn: false };
  var r2 = liveRes('2c'); if (r2 && r2.cells && r2.cells.length === v.id.length) { o.svc = r2.cells.map(function (c) { return c[1]; }); o.youSvc = true; }
  var r3 = liveRes('3f'); if (r3 && r3.cells && r3.cells.length === v.id.length) { o.cnn = r3.cells.map(function (c) { return c[1]; }); o.youCnn = true; }
  return o;
}
/* has the student answered this substep's prediction (or passed it)? */
function predDone(id) { if (window.__pgdUnlock) return true; var p = liveSub(id).pred; return !!(liveRes(id) || (p && p.locked)); }

/* ---------------- the Work it out strip ----------------
   rows: { h: 'heading' } | { t: 'plain line' } | { k: 'label', v: '1,234', op: '÷'|'×'|'−'|'+'|'=', res: true, col } | { tag: 'your value'|'typical value' } | { bar: share 0..1, col, mark } */
function workHTML(rows) {
  return (rows || []).map(function (r) {
    if (r.h) return '<h5 class="pgd-wh">' + esc(r.h) + '</h5>';
    if (r.t) return '<p class="pgd-wt">' + r.t + '</p>';
    if (r.tag) return '<p class="pgd-wtag ' + (r.tag === 'your value' ? 'you' : 'typ') + '">' + esc(r.tag) + '</p>';
    if (r.bar != null) return '<div class="pgd-wbar"><i style="width:' + Math.max(0, Math.min(100, 100 * r.bar)) + '%;background:' + (r.col || COL.cy) + '"></i>' + (r.mark != null ? '<b style="left:' + 100 * r.mark + '%"></b>' : '') + '</div>';
    return '<div class="pgd-wr' + (r.res ? ' res' : '') + '"><span class="op">' + esc(r.op || '') + '</span><span class="v"' + (r.col ? ' style="color:' + r.col + '"' : '') + '>' + esc(r.v) + '</span><span class="k">' + esc(r.k || '') + '</span></div>';
  }).join('');
}

/* ---------------- the player ---------------- */
function register(id, spec) { REG[id] = spec; spec.id = id; }
function has(id) { return !!REG[id]; }
var SESS = {};   // per diagram: {i, max, state, snaps}
function sess(id) {
  var spec = REG[id];
  if (!SESS[id]) { var st = spec.init ? spec.init() : {}; SESS[id] = { i: 0, max: 0, state: st, snaps: [JSON.stringify(st)] }; }
  return SESS[id];
}
function ctxFor(id, mode, extra) {
  var spec = REG[id], S = sess(id);
  var c = {
    id: id, mode: mode, state: S.state, A: A, fmt: fmt, pct: pct, esc: esc, counts: counts(), meta: meta, liveRes: liveRes, liveSub: liveSub, pixels: pixels, val: val, M: M, predDone: predDone,
    facts: window.PGD_FACTS || {}, enter: false, reduce: reduced(), print: mode === 'print'
  };
  for (var k in extra) c[k] = extra[k];
  return c;
}
/* mount a diagram into host: builds caption, stage, dots and the Work it out strip */
function mount(host, id) {
  var spec = REG[id]; if (!spec) return false;
  var S = sess(id), N = spec.frames.length;
  host.innerHTML = '<div class="pgd-dia" data-dia="' + id + '">' +
    '<div class="pgd-left"><div class="pgd-cap"><span class="pgd-fno"></span><h3 class="pgd-capt" aria-live="polite"></h3></div>' +
    '<div class="pgd-stagebox"><svg class="pgd-stage" viewBox="0 0 ' + W + ' ' + H + '" role="group" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
    '<nav class="pgd-dots" aria-label="Frames of this diagram"></nav></div>' +
    '<aside class="pgd-work" aria-label="Work it out"><h4>Work it out</h4><div class="pgd-wbody" aria-live="polite"></div></aside></div>';
  var svg = host.querySelector('.pgd-stage'), dots = host.querySelector('.pgd-dots'), wb = host.querySelector('.pgd-wbody');
  var cur = null, cleanup = [];
  function go(i, entering) {
    cleanup.forEach(function (f) { try { f(); } catch (e) {} }); cleanup = [];
    S.i = i; if (i > S.max) S.max = i;
    if (entering) S.snaps[i] = JSON.stringify(S.state);
    else if (S.snaps[i]) { S.state = JSON.parse(S.snaps[i]); }
    draw(entering);
  }
  function draw(entering, acted) {
    var f = spec.frames[S.i];
    var c = ctxFor(id, 'live', { enter: !!entering && !reduced() });
    c.state = S.state;
    c.next = function () { if (S.i < N - 1) { var nx = S.i + 1; setTimeout(function () { go(nx, true); focusFirst(); }, 0); } };
    c.redraw = function (acted) { draw(false, acted); };
    c.setWork = function (rows) { wb.innerHTML = workHTML(rows); };
    c.rework = function () { try { wb.innerHTML = workHTML(f.work ? f.work(c) : []); } catch (e) { log('work failed', e && e.message); } };
    c.onCleanup = function (fn) { cleanup.push(fn); };
    cur = c;
    var markup;
    try { markup = f.svg(c); } catch (e) { log('frame draw failed', id, S.i, e && e.message); markup = A.stage() + A.t(480, 270, 'This picture could not be drawn.', { a: 'middle', fill: COL.dim }); }
    svg.innerHTML = markup;
    svg.setAttribute('aria-label', 'Frame ' + (S.i + 1) + ' of ' + N + ': ' + f.cap + '. ' + (f.note || ''));
    svg.classList.toggle('pgd-enter', !!c.enter);
    svg.classList.toggle('pgd-acted', !!acted && !reduced());
    if ((acted || c.enter) && !reduced()) countUp(svg);
    host.querySelector('.pgd-fno').textContent = 'FRAME ' + (S.i + 1) + ' / ' + N;
    host.querySelector('.pgd-capt').textContent = f.cap;
    try { wb.innerHTML = workHTML(f.work ? f.work(c) : []); } catch (e) { log('work failed', e && e.message); wb.innerHTML = ''; }
    dots.innerHTML = spec.frames.map(function (fr, k) {
      var can = k <= S.max;
      return '<button type="button" class="pgd-dot' + (k === S.i ? ' on' : '') + (k <= S.max ? ' seen' : '') + '" data-k="' + k + '"' + (can ? '' : ' disabled') + ' aria-label="Frame ' + (k + 1) + ': ' + esc(fr.cap) + (can ? '' : ' (not reached yet)') + '"' + (k === S.i ? ' aria-current="step"' : '') + '><i></i><span>' + (k + 1) + '</span></button>';
    }).join('');
    wire(svg, f, c);
  }
  function focusFirst() { var t = svg.querySelector('.pgd-target'); if (t && host.contains(document.activeElement)) { try { t.focus({ preventScroll: true }); } catch (e) {} } }
  dots.addEventListener('click', function (e) { var b = e.target.closest('.pgd-dot'); if (!b || b.disabled) return; go(+b.dataset.k, false); b = dots.querySelector('[data-k="' + S.i + '"]'); if (b) b.focus(); });
  go(S.i, false);
  host._pgd = { go: function (i) { go(i, false); }, cur: function () { return S.i; }, n: N, max: function () { return S.max; } };
  return true;
}
/* default wiring: taps from frame.on, then the frame's own bind */
function wire(root, f, c) {
  root.querySelectorAll('.pgd-target[data-pgd-act="tap"]').forEach(function (t) {
    var k = t.getAttribute('data-pgd-t'), fn = f.on && f.on[k];
    if (fn) onTap(t, function () { fn(c, t); });
  });
  if (f.bind) f.bind(c, root);
}

/* numbers that count up after an action: <text data-pgd-from="12">57</text> counts 12 -> 57 (keeps commas, decimals, % and the rest of the text) */
function countUp(root) {
  root.querySelectorAll('[data-pgd-from]').forEach(function (el) {
    var txt = el.textContent, m = txt.match(/-?[\d,]*\.?\d+/); if (!m) return;
    var to = parseFloat(m[0].replace(/,/g, '')), from = parseFloat(el.getAttribute('data-pgd-from')), dec = (m[0].split('.')[1] || '').length, t0 = performance.now(), ms = 650;
    if (!isFinite(from) || from === to) return;
    function f(x) { return txt.replace(m[0], x.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })); }
    (function tick() { var k = Math.min(1, (performance.now() - t0) / ms), e = 1 - Math.pow(1 - k, 3); if (!el.isConnected) return; el.textContent = f(from + (to - from) * e); if (k < 1) requestAnimationFrame(tick); else el.textContent = txt; })();
  });
}

/* ---------------- interaction helpers (mouse, touch, keyboard) ---------------- */
function onTap(el, fn) {
  el.addEventListener('click', function (e) { e.preventDefault(); fn(e); });
  el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } });
}
function svgPoint(svg, ev) { var r = svg.getBoundingClientRect(); return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height }; }
/* drag: o = {start:{x,y}, move(p), drop(p) -> true when accepted, step (keyboard px), clamp(p)}. Arrow keys move, Enter/Space drops. */
function onDrag(svg, el, o) {
  var p = { x: o.start.x, y: o.start.y }, step = o.step || 16;
  function set(q) { p = o.clamp ? o.clamp(q) : q; o.move(p); }
  el.addEventListener('pointerdown', function (ev) {
    ev.preventDefault(); try { el.setPointerCapture(ev.pointerId); } catch (e) {}
    var s0 = svgPoint(svg, ev), off = { x: p.x - s0.x, y: p.y - s0.y }, moved = false;
    el.classList.add('dragging');
    function mv(e) { var q = svgPoint(svg, e); moved = true; set({ x: q.x + off.x, y: q.y + off.y }); }
    function up() { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.classList.remove('dragging'); if (moved) o.drop(p); }
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });
  el.addEventListener('keydown', function (e) {
    var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (d) { e.preventDefault(); set({ x: p.x + d[0] * step, y: p.y + d[1] * step }); if (o.live) o.drop(p, true); return; }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.drop(p); }
  });
  return { pos: function () { return p; }, set: set };
}
/* press and hold: o = {ms, progress(f 0..1), done()} — pointer or Space/Enter held */
function onHold(el, o) {
  var t0 = 0, raf = 0, ms = o.ms || 1200, done = false;
  function tick() { var f = Math.min(1, (performance.now() - t0) / ms); o.progress(f); if (f >= 1) { done = true; stop(); o.done(); } else raf = requestAnimationFrame(tick); }
  function start(e) { if (done || t0) return; if (e) e.preventDefault(); t0 = performance.now(); raf = requestAnimationFrame(tick); el.classList.add('holding'); }
  function stop() { cancelAnimationFrame(raf); raf = 0; t0 = 0; el.classList.remove('holding'); if (!done) o.progress(0); }
  el.addEventListener('pointerdown', function (e) { try { el.setPointerCapture(e.pointerId); } catch (x) {} start(e); });
  el.addEventListener('pointerup', stop); el.addEventListener('pointercancel', stop); el.addEventListener('pointerleave', stop);
  el.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) start(); } });
  el.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') stop(); });
}

/* ---------------- a thumbnail: frame 1 of a diagram, fresh state, static (no listeners) ---------------- */
function thumbSVG(id) {
  var spec = REG[id]; if (!spec) return '';
  var c = ctxFor(id, 'print', {}); c.state = spec.init ? spec.init() : {}; c.next = c.redraw = c.setWork = c.rework = c.onCleanup = function () {};
  try { return spec.frames[0].svg(c).replace(/<g class="pgd-chip">[\s\S]*?<\/g><\/g>/g, '</g>'); } catch (e) { log('thumb failed', id, e && e.message); return ''; }
}

/* ---------------- print: every frame as a static picture with its note and numbers ---------------- */
function printHTML(id) {
  var spec = REG[id]; if (!spec) return '';
  var st = spec.init ? spec.init() : {}, out = '';
  var S = sess(id);   // walk the frames with a fresh state, replaying each frame's `auto` (the result of its action)
  spec.frames.forEach(function (f, k) {
    var c = ctxFor(id, 'print', {}); c.state = st;
    c.next = c.redraw = c.setWork = c.rework = c.onCleanup = function () {};
    var svgm = ''; try { svgm = f.svg(c); } catch (e) { svgm = ''; log('print draw failed', id, k, e && e.message); }
    var rows = ''; try { rows = workHTML(f.work ? f.work(c) : []); } catch (e) {}
    out += '<section class="pgd-pframe"><div class="pgd-pf-left"><p class="pgd-pk">Frame ' + (k + 1) + ' / ' + spec.frames.length + '</p><h3>' + esc(f.cap) + '</h3>' +
      '<svg class="pgd-pstage" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + svgm + '</svg>' + (f.note ? '<p class="pgd-pnote">' + esc(f.note) + '</p>' : '') + '</div>' +
      '<div class="pgd-pf-work"><h4>Work it out</h4>' + rows + '</div></section>';
    if (f.auto) { try { f.auto(c); } catch (e) { log('print auto failed', id, k, e && e.message); } }
  });
  void S;
  return out;
}

window.PGD = { register: register, has: has, mount: mount, printHTML: printHTML, art: A, COL: COL, onTap: onTap, onDrag: onDrag, onHold: onHold, svgPoint: svgPoint,
  meta: meta, counts: counts, pixels: pixels, cellURL: cellURL, fullURL: fullURL, hasFull: hasFull, whenPack: whenPack, liveRes: liveRes, liveSub: liveSub,
  workHTML: workHTML, thumbSVG: thumbSVG, val: val, M: M, predDone: predDone, countUp: countUp, fmt: fmt, pct: pct, esc: esc, reduced: reduced, log: log, ids: function () { return Object.keys(REG); },
  _sess: SESS, reset: function (id) { if (id) delete SESS[id]; else for (var k in SESS) delete SESS[k]; } };
})();
