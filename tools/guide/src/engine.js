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
function meta(id) { var L = labels(); if (!L || ID2I[id] == null) return null; var r = L.rows[ID2I[id]]; return { id: r[0], prob: r[1], kind: r[2], i: ID2I[id] }; }
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
function fullURL(id) {   // the 300 x 300 photo when the lab ships it, else the 64 x 64 one
  var key = 'data/full/cell' + ('000' + id).slice(-4) + '.png';
  var e = window.PG_EMBED && window.PG_EMBED[key];
  return e && e.b64 ? 'data:image/png;base64,' + e.b64 : cellURL(id);
}
function hasFull(id) { var e = window.PG_EMBED && window.PG_EMBED['data/full/cell' + ('000' + id).slice(-4) + '.png']; return !!(e && e.b64); }
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
  W: W, H: H, COL: COL, FH: FH, FB: FB, FM: FM, uid: uid, esc: esc, fmt: fmt, pct: pct,
  t: function (x, y, s, o) {   // text. o: {size, fill, w (weight), a (anchor), f ('h'|'m'|'b'), ls, cls, op}
    o = o || {};
    var f = o.f === 'h' ? FH : o.f === 'm' ? FM : FB;
    return '<text x="' + x + '" y="' + y + '" font-family="' + f + '" font-size="' + (o.size || 18) + '" fill="' + (o.fill || COL.ink) + '" font-weight="' + (o.w || (o.f === 'h' ? 700 : 600)) + '"' +
      (o.a ? ' text-anchor="' + o.a + '"' : '') + (o.ls ? ' letter-spacing="' + o.ls + '"' : '') + (o.op != null ? ' opacity="' + o.op + '"' : '') + (o.cls ? ' class="' + o.cls + '"' : '') + '>' + esc(s) + '</text>';
  },
  /* the shared stage background: same canvas on every frame and every diagram */
  stage: function (o) {
    o = o || {};
    var id = uid('st');
    return '<defs><linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08101b"/><stop offset=".7" stop-color="#0a1322"/><stop offset="1" stop-color="#05080e"/></linearGradient>' +
      '<radialGradient id="' + id + 'r" cx=".62" cy="-.1" r=".9"><stop offset="0" stop-color="#0f2a40" stop-opacity=".8"/><stop offset="1" stop-color="#0f2a40" stop-opacity="0"/></radialGradient>' +
      '<pattern id="' + id + 'p" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#12304a" stroke-width=".7"/></pattern></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'g)"/><rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'r)"/>' +
      '<rect width="' + W + '" height="' + (o.floor || H) + '" fill="url(#' + id + 'p)" opacity=".38"/>' +
      (o.floor ? '<rect y="' + o.floor + '" width="' + W + '" height="' + (H - o.floor) + '" fill="#04070c" opacity=".7"/><line x1="0" y1="' + o.floor + '" x2="' + W + '" y2="' + o.floor + '" stroke="#1e3a52" stroke-width="1.5"/>' : '');
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
    id: id, mode: mode, state: S.state, A: A, fmt: fmt, pct: pct, esc: esc, counts: counts(), meta: meta, liveRes: liveRes, liveSub: liveSub, pixels: pixels,
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
  function draw(entering) {
    var f = spec.frames[S.i];
    var c = ctxFor(id, 'live', { enter: !!entering && !reduced() });
    c.state = S.state;
    c.next = function () { if (S.i < N - 1) { var nx = S.i + 1; setTimeout(function () { go(nx, true); focusFirst(); }, 0); } };
    c.redraw = function () { draw(false); };
    c.setWork = function (rows) { wb.innerHTML = workHTML(rows); };
    c.rework = function () { try { wb.innerHTML = workHTML(f.work ? f.work(c) : []); } catch (e) { log('work failed', e && e.message); } };
    c.onCleanup = function (fn) { cleanup.push(fn); };
    cur = c;
    var markup;
    try { markup = f.svg(c); } catch (e) { log('frame draw failed', id, S.i, e && e.message); markup = A.stage() + A.t(480, 270, 'This picture could not be drawn.', { a: 'middle', fill: COL.dim }); }
    svg.innerHTML = markup;
    svg.setAttribute('aria-label', 'Frame ' + (S.i + 1) + ' of ' + N + ': ' + f.cap + '. ' + (f.note || ''));
    svg.classList.toggle('pgd-enter', !!c.enter);
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
  workHTML: workHTML, fmt: fmt, pct: pct, esc: esc, reduced: reduced, log: log, ids: function () { return Object.keys(REG); },
  _sess: SESS, reset: function (id) { if (id) delete SESS[id]; else for (var k in SESS) delete SESS[k]; } };
})();
