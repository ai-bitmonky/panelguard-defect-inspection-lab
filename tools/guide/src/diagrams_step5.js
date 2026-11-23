/* PanelGuard Diagram guide — Step 5 diagrams (5a 5b 5c 5d 5e 5f 5g). Uses window.PGD (engine.js).
   The inspection line, drawn as a real factory floor. Numbers: the lab's own Step 5 rules (site/js/step5.js) on the Step 3
   blend scores and gates — the student's own when 3f/3g passed ("your value"), else the reference run ("typical value");
   shift totals checked against the Python LangGraph twin (facts.json s5.twin). Stations carry plain names here: the code
   names the gaps ask for (and the cap of 5e) are not written; the 5d prediction's 4 cells are left out until it is answered. */
(function () {
'use strict';
var D = window.PGD, A = D.art, C = A.COL, t = A.t, fmt = D.fmt;
var F5 = function () { return (window.PGD_FACTS || {}).s5 || {}; };
function f3(x) { return x == null || isNaN(x) ? '–' : (+x).toFixed(3); }
function p0(x) { return Math.round(100 * x) + '%'; }
function p1(x) { return (100 * x).toFixed(1) + '%'; }
function srcTag(you) { return { tag: you ? 'your value' : 'typical value' }; }
function refNote(you) { return you ? null : { t: '<i>Reference run: the lab’s Step 5 rules on the Step 3 reference scores and gates.</i>' }; }
function clean(a) { return a.filter(function (r) { return r; }); }
function snapTo(sx, sy, dx, dy, step) { return (sx + Math.round((dx - sx) / step) * step) + ',' + (sy + Math.round((dy - sy) / step) * step); }
var LCOL = { pass: '#3dffa0', person: '#ffb547', stop: '#ff4d6a' }, LNAME = { pass: 'AUTO-PASS', person: 'A PERSON CHECKS', stop: 'AUTO-STOP' };

/* ---------- the line's data (same rules as step5.js) ---------- */
function L5() {
  var G = D.S3 && D.S3.gates(); if (!G) return null;
  var v = G.B.v, s = G.s, lo = G.G.low, hi = G.G.high, at = {};
  v.id.forEach(function (id, i) { at[id] = i; });
  return { v: v, s: s, y: G.y, low: lo, high: hi, at: at, you: G.you, lane: function (p) { return p < lo ? 'pass' : p >= hi ? 'stop' : 'person'; },
    sample: function (n) { var N = v.id.length, o = []; for (var k = 0; k < n; k++) o.push(v.id[Math.floor(k * N / n)]); return o; },
    unsure: function (k) { var idx = s.map(function (q, i) { return i; }).filter(function (i) { return s[i] >= lo && s[i] < hi; }).sort(function (a, b) { return s[a] - s[b]; }), o = []; for (var j = 0; j < k && idx.length; j++) o.push(v.id[idx[Math.min(idx.length - 1, Math.floor((j + 0.5) * idx.length / k))]]); return o; } };
}
function stats(px) {
  var n = px.length, sm = 0, i; for (i = 0; i < n; i++) sm += px[i];
  var m = sm / n, q = 0; for (i = 0; i < n; i++) q += (px[i] - m) * (px[i] - m);
  var so = Array.prototype.slice.call(px).sort(function (a, b) { return a - b; });
  return { mean: m, spread: Math.sqrt(q / n), contrast: so[Math.floor(0.95 * n)] - so[Math.floor(0.05 * n)] };
}
function problemOf(px) { var R = F5().rules || { dark: 20, blank: 3, flat: 12 }, st = stats(px); return st.mean < R.dark ? 'too dark' : st.spread < R.blank ? 'almost blank' : st.contrast < R.flat ? 'low contrast' : null; }
function spoil(px, rule) {   // the lab's camera fault copies
  var st = stats(px), m = st.mean, k = rule === 'too dark' ? 0 : rule === 'almost blank' ? 0.02 : 10.5 / st.contrast;
  return Array.prototype.map.call(px, function (v) { var x = rule === 'too dark' ? v * 0.08 : m + (v - m) * k; return Math.max(0, Math.min(255, Math.round(x))); });
}
var FPX = {};
function faultPx(fid) { if (FPX[fid]) return FPX[fid]; var f = (F5().faults || []).filter(function (q) { return q[0] === fid; })[0], px = f && D.pixels(f[1]); return px ? (FPX[fid] = spoil(px, f[3])) : null; }
var PURL = {};
function pxURL(px, key) {
  if (PURL[key]) return PURL[key];
  try { var cv = document.createElement('canvas'); cv.width = cv.height = 64; var x = cv.getContext('2d'), im = x.createImageData(64, 64); for (var k = 0; k < 4096; k++) { im.data[4 * k] = im.data[4 * k + 1] = im.data[4 * k + 2] = px[k]; im.data[4 * k + 3] = 255; } x.putImageData(im, 0, 0); return (PURL[key] = cv.toDataURL('image/png')); } catch (e) { return ''; }
}
function lcg(seed) { var s = seed % 233280; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
/* a whole shift, cell by cell in tray order (runShift + shiftReport): perfect checker, right 9 in 10 (lcg 7), or the poly gate */
function shift5(L, o) {
  o = o || {}; var r = lcg(7), R = { pass: 0, person: 0, stop: 0, dp: 0, gs: 0, pdp: 0, pw: 0, def: 0, pdef: 0, rows: [] }, lowP = null;
  if (o.poly) { var pd = []; L.y.forEach(function (y, i) { if (y === 1 && L.v.kind[i] === 'p') pd.push(L.s[i]); }); pd.sort(function (a, b) { return a - b; }); lowP = pd[Math.floor(0.05 * pd.length)]; }
  for (var i = 0; i < L.s.length; i++) {
    var poly = L.v.kind[i] === 'p', lo = o.poly && poly ? lowP : L.low, p = L.s[i], lane = p < lo ? 'pass' : p >= L.high ? 'stop' : 'person', dec = lane, y = L.y[i];
    R[lane]++; if (y) { R.def++; if (poly) R.pdef++; }
    if (lane === 'person') { var a = y === 1 ? 'stop' : 'pass'; if (o.nine && r() < 0.1) a = a === 'stop' ? 'pass' : 'stop'; dec = a; if ((a === 'stop') !== (y === 1)) R.pw++; }
    if (y === 1 && dec === 'pass') { R.dp++; if (poly) R.pdp++; }
    if (y === 0 && dec === 'stop') R.gs++;
    R.rows.push([lane, dec, y]);
  }
  R.lowP = lowP; R.n = L.s.length; return R;
}

/* ---------- the machines (top view, slight depth) ---------- */
var NAME = { in: 'IN', check: 'PHOTO CHECK', model: 'MODEL', fork: 'FORK', desk: 'PERSON DESK', log: 'LOGBOOK', out: 'OUT', reshoot: 'CAMERA AGAIN' };
function icon(kind, x, y, col) {
  var s = '';
  if (kind === 'check' || kind === 'reshoot') s += '<rect x="' + (x - 22) + '" y="' + (y - 14) + '" width="44" height="30" rx="5" fill="#0b121b" stroke="' + col + '" stroke-width="2"/><circle cx="' + x + '" cy="' + (y + 1) + '" r="9" fill="none" stroke="' + col + '" stroke-width="2.5"/><rect x="' + (x - 8) + '" y="' + (y - 20) + '" width="16" height="6" rx="2" fill="' + col + '"/>' +
    (kind === 'reshoot' ? '<path d="M' + (x + 26) + ' ' + (y - 8) + 'a12 12 0 1 1 -4 -10" stroke="' + col + '" stroke-width="2" fill="none"/>' : '');
  else if (kind === 'model') s += '<rect x="' + (x - 18) + '" y="' + (y - 18) + '" width="36" height="36" rx="5" fill="#0b121b" stroke="' + col + '" stroke-width="2"/><rect x="' + (x - 9) + '" y="' + (y - 9) + '" width="18" height="18" rx="2" fill="' + col + '" fill-opacity=".35"/>' +
    [-12, -4, 4, 12].map(function (d) { return '<path d="M' + (x + d) + ' ' + (y - 18) + 'v-6M' + (x + d) + ' ' + (y + 18) + 'v6M' + (x - 18) + ' ' + (y + d) + 'h-6M' + (x + 18) + ' ' + (y + d) + 'h6" stroke="' + col + '" stroke-width="2"/>'; }).join('');
  else if (kind === 'fork') s += '<path d="M' + (x - 24) + ' ' + y + 'L' + x + ' ' + (y - 22) + 'L' + (x + 24) + ' ' + y + 'L' + x + ' ' + (y + 22) + 'Z" fill="#0b121b" stroke="' + col + '" stroke-width="2.5"/><path d="M' + (x - 10) + ' ' + y + 'h10l8 -8M' + x + ' ' + y + 'h10M' + x + ' ' + y + 'l8 8" stroke="' + col + '" stroke-width="2" fill="none"/>';
  else if (kind === 'desk') s += '<circle cx="' + x + '" cy="' + (y - 10) + '" r="8" fill="' + col + '"/><path d="M' + (x - 14) + ' ' + (y + 10) + 'a14 12 0 0 1 28 0z" fill="' + col + '"/><rect x="' + (x - 24) + '" y="' + (y + 10) + '" width="48" height="8" rx="2" fill="#0b121b" stroke="' + col + '" stroke-width="2"/>';
  else if (kind === 'log') s += '<path d="M' + (x - 20) + ' ' + (y - 16) + 'h17a3 3 0 0 1 3 3v31a3 3 0 0 0 -3 -3h-17zM' + (x + 20) + ' ' + (y - 16) + 'h-17a3 3 0 0 0 -3 3v31a3 3 0 0 1 3 -3h17z" fill="#0b121b" stroke="' + col + '" stroke-width="2"/>' + [0, 7, 14].map(function (d) { return '<path d="M' + (x - 16) + ' ' + (y - 8 + d) + 'h10M' + (x + 6) + ' ' + (y - 8 + d) + 'h10" stroke="' + col + '" stroke-width="1.5"/>'; }).join('');
  else s += '<path d="M' + (x - 14) + ' ' + (y - 12) + 'h16l12 12-12 12h-16l12 -12z" fill="' + col + '" fill-opacity=".6"/>';
  return s;
}
/* a station: box w x h centred at (x, y) with its icon and plain name. o: {col, hot, fx, w, h, sub} */
function station(kind, x, y, o) {
  o = o || {}; var w = o.w || 112, h = o.h || 88, col = o.col || (kind === 'in' || kind === 'out' ? '#8d9bb0' : '#46e3ff'), s = '';
  if (o.hot) s += '<rect x="' + (x - w / 2 - 8) + '" y="' + (y - h / 2 - 8) + '" width="' + (w + 16) + '" height="' + (h + 16) + '" rx="18" fill="' + col + '" opacity=".12"/>';
  s += '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2 + 6) + '" width="' + w + '" height="' + h + '" rx="14" fill="#03060a" opacity=".6"/>';
  s += '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h + '" rx="14" fill="' + (o.fx ? 'url(#' + o.fx.mt + ')' : '#16202c') + '" stroke="' + col + '" stroke-opacity="' + (o.dim ? .35 : .85) + '" stroke-width="2"/>';
  s += '<path d="M' + (x - w / 2 + 12) + ' ' + (y - h / 2 + 2) + 'h' + (w - 24) + '" stroke="#fff" stroke-opacity=".15" stroke-width="2"/>';
  s += icon(kind, x, y - 10, o.dim ? '#4a5a6e' : col);
  s += t(x, y + h / 2 - 12, NAME[kind], { size: 14, a: 'middle', f: 'h', fill: o.dim ? '#5d6b80' : '#e6eef8', ls: '.04em' });
  if (o.sub) s += t(x, y + h / 2 + 20, o.sub, { size: 14, a: 'middle', f: 'm', fill: C.dim });
  return s;
}
/* a conveyor piece from a to b (straight, with rollers), animated once when just laid */
function conveyor(a, b, o) {
  o = o || {}; var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy) || 1, ang = Math.atan2(dy, dx) * 180 / Math.PI, s = '', col = o.col || '#46e3ff';
  s += '<g transform="translate(' + a[0] + ' ' + a[1] + ') rotate(' + ang.toFixed(2) + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>';
  s += '<rect x="0" y="-11" width="' + L + '" height="22" rx="5" fill="#1a232f" stroke="#3a4757"/>';
  for (var k = 8; k < L - 4; k += 16) s += '<path d="M' + k + ' -9v18" stroke="#0a0f15" stroke-width="2"/>';
  s += '<path d="M6 0H' + (L - 10) + '" stroke="' + col + '" stroke-width="2.5" stroke-dasharray="8 8"' + (o.flow ? ' class="pgd-flowonce"' : '') + '/><path d="M' + (L - 14) + ' -6l8 6-8 6" fill="none" stroke="' + col + '" stroke-width="2.5"/>';
  if (o.lab) s += '<g transform="translate(' + (L / 2) + ' -18)' + (Math.abs(ang) > 90 ? ' rotate(180)' : '') + '">' + t(0, 0, o.lab, { size: 14, a: 'middle', w: 700, fill: col }) + '</g>';
  return s + '</g>';
}
function token(id, x, y, o) {   // a cell riding the line: its real photo on a little tray
  o = o || {}; var S = o.s || 40;
  return '<g' + (o.cls ? ' class="' + o.cls + '"' : '') + (o.style ? ' style="' + o.style + '"' : '') + '><rect x="' + (x - S / 2 - 4) + '" y="' + (y - S / 2 - 4) + '" width="' + (S + 8) + '" height="' + (S + 8) + '" rx="6" fill="#a98bff" stroke="#fff" stroke-width="2"/>' +
    (o.href ? '<image href="' + o.href + '" x="' + (x - S / 2) + '" y="' + (y - S / 2) + '" width="' + S + '" height="' + S + '" style="image-rendering:pixelated"/>' : A.cell(id, x - S / 2, y - S / 2, S, {})) + '</g>';
}

/* ============================ 5a  Draw the flow ============================ */
var P5 = { in: [96, 150], check: [276, 150], model: [456, 150], fork: [636, 150], desk: [846, 150], log: [636, 410], out: [376, 410] };
var NEED5 = [['in', 'check'], ['check', 'model'], ['model', 'fork'], ['fork', 'desk', 'person'], ['fork', 'log', 'pass · stop'], ['desk', 'log'], ['log', 'out']];
var FR5 = [[0, 1, 2], [3, 4], [5, 6]];
function half5(k) { return k === 'in' || k === 'out' ? [46, 44] : [56, 44]; }
function edgePt(k, toward) {   // where a conveyor leaves / enters station k, on the side facing the other station
  var p = P5[k], q = toward, h = half5(k), dx = q[0] - p[0], dy = q[1] - p[1], f = Math.min(h[0] / Math.abs(dx || 1e-9), h[1] / Math.abs(dy || 1e-9));
  return [p[0] + dx * f, p[1] + dy * f];
}
function outPort(k, to) { return edgePt(k, P5[to]); }
function inPort(k, from) { return edgePt(k, P5[from || 'in']); }
function why5a(a, b) {
  if (b === 'in') return 'Nothing goes back to IN: every cell comes in there.';
  if (a === 'in') return 'Every photo is checked first.';
  if (a === 'check') return 'A good photo goes to the model for a score first.';
  if (a === 'model') return 'The score goes to the fork: it picks the lane.';
  if (a === 'fork') return b === 'out' ? 'Every cell is written in the logbook before OUT.' : 'The fork sends cells forward: to a person, or to the logbook.';
  if (a === 'desk') return 'The person’s answer must be written down first.';
  if (a === 'log') return 'The logbook is the last station before OUT.';
  return 'The cell does not travel that way.';
}
function floor5a(c, fx, o) {
  o = o || {}; var st = c.state, s = A.stage() + fx.defs;
  s += '<rect x="20" y="40" width="920" height="480" rx="18" fill="#0a1018" stroke="#1b2b3c"/>' + '<rect x="20" y="40" width="920" height="480" rx="18" fill="url(#' + fx.vg + ')" opacity=".5"/>';
  for (var gx = 60; gx < 940; gx += 60) s += '<path d="M' + gx + ' 44v472" stroke="#ffffff" stroke-opacity=".03"/>';
  s += t(40, 30, 'THE INSPECTION LINE · FLOOR PLAN', { size: 15, f: 'h', fill: C.dim, ls: '.08em' });
  st.laid.forEach(function (k) { var e = NEED5[k], a = outPort(e[0], e[1]), b = inPort(e[1], e[0]); s += conveyor(a, b, { lab: e[2], col: e[2] === 'person' ? LCOL.person : e[2] ? '#9fe8c2' : '#46e3ff', cls: st.last === k ? 'pgd-in' : '', flow: st.last === k }); });
  Object.keys(P5).forEach(function (k) { var p = P5[k]; s += station(k, p[0], p[1], { fx: fx, w: k === 'in' || k === 'out' ? 92 : 112, col: k === 'desk' ? LCOL.person : k === 'fork' ? '#ffcf6b' : undefined }); });
  return s;
}
function want5a(st) { var f = FR5[st.f] || []; for (var i = 0; i < f.length; i++) if (st.laid.indexOf(f[i]) < 0) return f[i]; return null; }
function svg5a(c) {
  var fx = A.fx(), st = c.state, s = floor5a(c, fx), w = want5a(st); if (w == null) return s;
  var e = NEED5[w], a = outPort(e[0], e[1]), b = P5[e[1]];
  s += '<g id="rub5a"></g>';
  s += A.target('port', '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="13" fill="#ffb547" stroke="#fff" stroke-width="2"/>', 'drag a conveyor to the next station', Math.max(190, Math.min(770, a[0])), P5[e[0]][1] + 78, { kind: 'drag', to: snapTo(a[0], a[1], b[0], b[1], 16) });
  if (st.msg) s += t(480, 506, st.msg, { size: 16, a: 'middle', w: 700, fill: '#ff8aa0', cls: 'pgd-shake' });
  return s;
}
function bind5a(c, root) {
  var st = c.state, w = want5a(st); if (w == null) return;
  var e = NEED5[w], a = outPort(e[0], e[1]), el = root.querySelector('[data-pgd-t=port]'), rub = root.querySelector('#rub5a');
  D.onDrag(root, el, { start: { x: a[0], y: a[1] }, step: 16,
    move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - a[0]) + ' ' + (p.y - a[1]) + ')'); rub.innerHTML = '<path d="M' + a[0] + ' ' + a[1] + 'L' + p.x + ' ' + p.y + '" stroke="#ffb547" stroke-width="3" stroke-dasharray="7 6"/>'; },
    drop: function (p) {
      var best = null, bd = 90; Object.keys(P5).forEach(function (k) { var P = P5[k], d = Math.hypot(p.x - P[0], p.y - P[1]); if (Math.abs(p.x - P[0]) < 66 && Math.abs(p.y - P[1]) < 54) d = Math.min(d, 20); if (d < bd) { bd = d; best = k; } });
      if (!best || best === e[0]) { el.removeAttribute('transform'); rub.innerHTML = ''; return; }
      if (best === e[1]) { st.laid.push(w); st.last = w; st.msg = ''; if (want5a(st) == null) { st.f++; c.next(); } else c.redraw(true); return; }
      var ok = NEED5.filter(function (q, i) { return q[0] === e[0] && q[1] === best && st.laid.indexOf(i) < 0; })[0];
      if (ok) { var i2 = NEED5.indexOf(ok); st.laid.push(i2); st.last = i2; st.msg = ''; if (want5a(st) == null) { st.f++; c.next(); } else c.redraw(true); return; }
      st.msg = why5a(e[0], best); c.redraw(true);
    } });
}
function work5a(c) {
  var st = c.state, r = [{ h: 'Conveyors laid' }, { v: st.laid.length + ' of 7', k: 'each one = “after this station, the cell goes there”' }];
  NEED5.forEach(function (e, i) { if (st.laid.indexOf(i) >= 0) r.push({ v: NAME[e[0]].toLowerCase() + ' → ' + NAME[e[1]].toLowerCase(), k: e[2] ? 'lane: ' + e[2] : '' }); });
  if (st.laid.length < 7) r.push({ t: 'What does each station need before it can work? A score needs a good photo; the fork needs a score; the logbook needs a final answer.' });
  return r;
}
function ride5a() {   // the path of cell 496 through the finished line (its real lane)
  var L = L5(); if (!L) return null;
  var i = L.at[496], lane = L.lane(L.s[i]), pts = [P5.in, P5.check, P5.model, P5.fork].concat(lane === 'person' ? [P5.desk, P5.log] : [P5.log]).concat([P5.out]);
  return { lane: lane, p: L.s[i], y: L.y[i], d: 'M' + pts.map(function (q) { return q[0] + ' ' + q[1]; }).join('L'), you: L.you };
}
D.register('5a', {
  init: function () { return { laid: [], f: 0, msg: '', last: null }; },
  frames: [
  { cap: 'Lay the main line: in, check, score, fork',
    note: 'Each conveyor means: after this station, the cell goes there. A cell is checked, then scored, then the fork picks a lane.',
    svg: svg5a, work: work5a, bind: bind5a, auto: function (c) { c.state.laid = [0, 1, 2]; c.state.f = 1; } },
  { cap: 'The fork has two ways out',
    note: 'Unsure cells go to a person. Sure cells (pass or stop) go straight to the logbook.',
    svg: svg5a, work: work5a, bind: bind5a, auto: function (c) { c.state.laid = [0, 1, 2, 3, 4]; c.state.f = 2; } },
  { cap: 'Every answer is written down, then out',
    note: 'The person’s answer goes to the logbook too. The logbook is the last station before OUT.',
    svg: svg5a, work: work5a, bind: bind5a, auto: function (c) { c.state.laid = [0, 1, 2, 3, 4, 5, 6]; c.state.f = 3; } },
  { cap: 'The line is wired. Send one real cell.',
    note: 'Seven conveyors make the whole line. Now one real cell rides it, and the fork sends it by its score.',
    svg: function (c) {
      var fx = A.fx(), s = floor5a(c, fx);
      s += A.target('send', token(496, P5.in[0], P5.in[1] + 100, { s: 44 }), 'send cell 496', P5.in[0] - 40, P5.in[1] + 160, { la: 'start' });
      return s;
    },
    work: function (c) { return work5a(c).concat([{ t: 'In code each conveyor is one line that joins two station names. The fork’s two ways out are one conditional line.' }]); },
    on: { send: function (c) { c.state.sent = 1; c.next(); } }, auto: function (c) { c.state.sent = 1; } },
  { cap: 'Cell 496 rides the line to its lane',
    note: 'Cell 496 is checked, scored and sent by the fork. Its score is above the stop gate, so it goes straight to the logbook and out.',
    svg: function (c) {
      var fx = A.fx(), s = floor5a(c, fx), R = ride5a(); if (!R) return s;
      s += '<path d="' + R.d + '" stroke="#a98bff" stroke-width="3" fill="none" stroke-dasharray="4 6" opacity=".8"/>';
      s += '<g class="pgd-ride" style="offset-path:path(\'' + R.d + '\');--ride:3s">' + token(496, 0, -58, { s: 44 }) + '</g>';
      s += A.glass(40, 236, 330, 76, { fx: fx, col: LCOL[R.lane] }) + t(58, 266, 'score ' + f3(R.p) + ' → ' + LNAME[R.lane], { size: 18, f: 'm', w: 700, fill: LCOL[R.lane] }) + t(58, 294, 'expert label: ' + (R.y ? 'defect' : 'good'), { size: 15, fill: C.dim });
      return s;
    },
    work: function (c) {
      var R = ride5a(), L = L5(); if (!R) return [];
      return clean([{ h: 'Cell 496' }, { v: f3(R.p), k: 'its blend score (3f)' }, { v: R.lane === 'stop' ? f3(R.p) + ' ≥ ' + f3(L.high) : R.lane === 'pass' ? f3(R.p) + ' < ' + f3(L.low) : f3(L.low) + ' ≤ ' + f3(R.p) + ' < ' + f3(L.high), k: 'compared with the gates', res: true }, { op: '=', v: LNAME[R.lane].toLowerCase(), k: 'its lane' }, srcTag(R.you), refNote(R.you)]);
    } }
  ]
});

/* ============================ 5b  The traveller card ============================ */
var ST5B = [['check', 'problem'], ['model', 'score'], ['fork', 'lane'], ['log', 'decision']];
var FIELDS5B = [['cell number', 'id'], ['cell type', 'kind'], ['photo', 'photo'], ['problem', 'problem'], ['photos taken', 'tries'], ['defect score', 'score'], ['lane', 'lane'], ['final answer', 'decision']];
function card5b() {   // the real values for cell 496 at each station
  var L = L5(); if (!L) return null;
  var i = L.at[496], p = L.s[i], lane = L.lane(p), px = D.pixels(496), pr = px ? problemOf(px) : null;
  return { id: 496, kind: L.v.kind[i] === 'p' ? 'poly' : 'mono', p: p, lane: lane, problem: pr, dec: lane === 'person' ? 'waiting' : lane, you: L.you,
    lines: ['photo check: ' + (pr || 'photo ok'), 'model: score ' + f3(p), 'fork: lane ' + lane, 'logbook: ' + (lane === 'person' ? 'waiting' : lane)] };
}
function paper5b(K, n, fx, o) {
  o = o || {}; var x = 34, y = 40, w = 380, h = 476, s = '';
  s += '<g filter="url(#' + fx.sh + ')"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="#efe9da"/></g>';
  s += '<rect x="' + (x + w / 2 - 40) + '" y="' + (y - 14) + '" width="80" height="26" rx="5" fill="url(#' + fx.mt + ')" stroke="#8d9bb0"/>';   // the clip
  s += t(x + 20, y + 38, 'TRAVELLER CARD', { size: 18, f: 'h', fill: '#1d2a38', ls: '.08em' }) + t(x + w - 20, y + 38, 'cell ' + K.id, { size: 16, a: 'end', f: 'm', w: 700, fill: '#1d2a38' });
  s += '<path d="M' + (x + 16) + ' ' + (y + 52) + 'h' + (w - 32) + '" stroke="#1d2a38" stroke-width="1.5"/>';
  var val = { id: String(K.id), kind: K.kind, photo: '4,096 numbers', problem: n >= 1 ? (K.problem || 'none') : '', tries: '1', score: n >= 2 ? f3(K.p) : '', lane: n >= 3 ? K.lane : '', decision: n >= 4 ? K.dec : '' };
  var just = ['', 'problem', 'score', 'lane', 'decision'][n] || '';
  FIELDS5B.forEach(function (f, j) {
    var yy = y + 80 + j * 30, lit = f[1] === just && !o.still;
    if (lit) s += '<rect x="' + (x + 12) + '" y="' + (yy - 20) + '" width="' + (w - 24) + '" height="28" rx="4" fill="#ffd36b" opacity=".55" class="pgd-pop"/>';
    s += t(x + 22, yy, f[0], { size: 15, fill: '#4a5668' }) + t(x + 170, yy, val[f[1]] || '·  ·  ·', { size: 16, f: 'm', w: 700, fill: val[f[1]] ? (lit ? '#7a1020' : '#1d2a38') : '#a8a294' });
  });
  if (o.lane2) {   // the lab's own test: two stations write lane pass, then stop
    var yy2 = y + 80 + 6 * 30; s += '<rect x="' + (x + 12) + '" y="' + (yy2 - 20) + '" width="' + (w - 24) + '" height="28" rx="4" fill="#cfe6ff" opacity=".7"/>' + t(x + 22, yy2, 'lane', { size: 15, fill: '#4a5668' }) + t(x + 170, yy2, 'pass', { size: 16, f: 'm', w: 700, fill: '#a8a294' }) + '<path d="M' + (x + 166) + ' ' + (yy2 - 5) + 'h44" stroke="#b0102e" stroke-width="2.5"/>' + t(x + 222, yy2, 'stop', { size: 16, f: 'm', w: 700, fill: '#1d2a38' });
  }
  var ly = y + 80 + 8 * 30 + 6;
  s += '<path d="M' + (x + 16) + ' ' + (ly - 14) + 'h' + (w - 32) + '" stroke="#1d2a38" stroke-dasharray="3 3"/>' + t(x + 22, ly + 6, 'LOGBOOK LINES', { size: 14, f: 'h', fill: '#1d2a38', ls: '.06em' }) + t(x + w - 20, ly + 6, (o.lines || K.lines.slice(0, n)).length + ' line' + ((o.lines || K.lines.slice(0, n)).length === 1 ? '' : 's'), { size: 14, a: 'end', f: 'm', fill: '#4a5668' });
  (o.lines || K.lines.slice(0, n)).forEach(function (ln, j) { s += '<g class="' + (j === n - 1 && !o.still ? 'pgd-drop' : '') + '">' + t(x + 22, ly + 34 + j * 26, (j + 1) + '. ' + ln, { size: 15, f: 'm', fill: '#1d2a38' }) + '</g>'; });
  return s;
}
function line5b(n, fx, o) {
  o = o || {}; var s = '', y = 140, x0 = 460;
  s += A.belt(x0 - 20, y + 54, 480, 26, { fx: fx, moving: o.moving });
  ST5B.forEach(function (q, j) { s += station(q[0], x0 + 50 + j * 128, y, { fx: fx, w: 112, dim: j > n, hot: j === n, col: q[0] === 'fork' ? '#ffcf6b' : undefined }); });
  var tx = x0 + 50 + Math.min(n, 3) * 128;
  s += token(496, tx, y + 62, { s: 30, cls: o.moving ? 'pgd-slide' : '' }) + '<path d="M' + tx + ' ' + (y + 82) + 'C' + tx + ' ' + (y + 160) + ' 420 ' + (y + 120) + ' 414 ' + (y + 90) + '" stroke="#efe9da" stroke-opacity=".5" stroke-dasharray="4 5" fill="none"/>';
  return s;
}
function stamp5b(n) {
  var x = 460 + 50 + n * 128, y = 330;
  return A.target('stamp', '<g><rect x="' + (x - 34) + '" y="' + (y - 8) + '" width="68" height="22" rx="5" fill="#7a1020"/><rect x="' + (x - 12) + '" y="' + (y - 52) + '" width="24" height="44" rx="6" fill="#c98a4a"/><circle cx="' + x + '" cy="' + (y - 58) + '" r="16" fill="#c98a4a" stroke="#7a4a20" stroke-width="2"/></g>', 'stamp the card', x, y + 52, {});
}
function work5b(c, n) {
  var K = card5b(); if (!K) return [];
  var r = [{ h: 'What the station wrote' }];
  if (n >= 1) r.push({ v: K.problem || 'none', k: 'problem: written over the empty field' });
  if (n >= 2) r.push({ v: f3(K.p), k: 'defect score: your 3f blend for cell 496' });
  if (n >= 3) r.push({ v: K.lane, k: 'lane: from the score and the two gates' });
  if (n >= 4) r.push({ v: K.dec, k: 'final answer' });
  r.push({ h: 'Logbook lines' }, { v: String(n), k: 'one ADDED per station; the old lines stay' }, srcTag(K.you));
  return r;
}
function frame5b(n) {
  return { cap: ['At the photo check: stamp the card', 'At the model: the score is written', 'At the fork: the lane is written', 'At the logbook: the final answer'][n],
    note: 'Each station reads the card, writes only its own field, and adds one line to the logbook lines.',
    svg: function (c) { var fx = A.fx(), K = card5b(), s = A.stage() + fx.defs; if (!K) return s; return s + paper5b(K, n, fx, { still: !n }) + line5b(n, fx) + stamp5b(n); },
    work: function (c) { return work5b(c, n); },
    on: { stamp: function (c) { c.next(); } } };
}
D.register('5b', {
  init: function () { return {}; },
  frames: [frame5b(0), frame5b(1), frame5b(2), frame5b(3),
  { cap: 'Two kinds of field: written over, or added to',
    note: 'A plain field keeps only the last value written (the lab’s test: lane pass, then stop → stop). The logbook lines field adds each new line and keeps the old ones.',
    svg: function (c) {
      var fx = A.fx(), K = card5b(), s = A.stage() + fx.defs; if (!K) return s;
      s += paper5b(K, 4, fx) + line5b(4, fx, { moving: 1 });
      s += A.glass(452, 270, 478, 246, { fx: fx, col: '#2b4157' });
      s += t(474, 304, 'WRITTEN OVER', { size: 16, f: 'h', fill: '#46e3ff', ls: '.08em' }) + t(474, 330, 'lane: pass  →  then stop  →  keeps stop', { size: 16, f: 'm', fill: '#fff' }) + t(474, 354, 'last value wins (most fields)', { size: 15, fill: C.dim });
      s += t(474, 404, 'ADDED TO', { size: 16, f: 'h', fill: '#ffcf6b', ls: '.08em' }) + t(474, 430, 'lines: none → 1 line → 2 lines → …', { size: 16, f: 'm', fill: '#fff' }) + t(474, 454, 'starts empty; each station adds a NEW, longer list', { size: 15, fill: C.dim }) + t(474, 478, '(the old lines are never lost)', { size: 15, fill: C.dim });
      return s;
    },
    work: function (c) { return work5b(c, 4).concat([{ t: 'In LangGraph this card is the <b>state</b>. A field with a reducer says how a new value joins the old one.' }]); } }
  ]
});

/* ============================ 5c  First two stations ============================ */
function run5c() {
  var L = L5(), px = D.pixels(496), dp = D.pixels(F5().dead || 1896); if (!L || !px) return null;
  var i = L.at[496];
  return { st: stats(px), dead: dp ? stats(dp) : null, p: L.s[i], kind: L.v.kind[i] === 'p' ? 'poly' : 'mono', R: F5().rules || { dark: 20, blank: 3, flat: 12 }, you: L.you };
}
function crank(x, y, key, label, held) {   // a hand crank on a machine: press and hold to turn it
  var s = '<g><circle cx="' + x + '" cy="' + y + '" r="30" fill="#0b121b" stroke="#ffb547" stroke-width="3"/><g class="pgd-crank"><path d="M' + x + ' ' + y + 'L' + (x + 24) + ' ' + (y - 16) + '" stroke="#c7d4e4" stroke-width="7" stroke-linecap="round"/><circle cx="' + (x + 24) + '" cy="' + (y - 16) + '" r="8" fill="#ffb547"/></g><circle cx="' + x + '" cy="' + y + '" r="6" fill="#c7d4e4"/>' +
    '<circle class="pgd-holdring" cx="' + x + '" cy="' + y + '" r="38" fill="none" stroke="#3dffa0" stroke-width="5" stroke-dasharray="0 999" transform="rotate(-90 ' + x + ' ' + y + ')"/></g>';
  return A.target(key, s, label, x, y - 50, { kind: 'hold' });
}
function bars5c(R, x, y) {   // the three photo measurements against the quality rules
  var s = '', M = [['brightness', R.st.mean, R.R.dark, 255, 'too dark below'], ['spread', R.st.spread, R.R.blank, 90, 'blank below'], ['contrast', R.st.contrast, R.R.flat, 255, 'flat below']];
  M.forEach(function (m, j) {
    var yy = y + j * 44, w = 240, ok = m[1] >= m[2];
    s += t(x, yy, m[0], { size: 15, fill: '#c7d4e4' }) + t(x + w, yy, m[1].toFixed(1), { size: 15, a: 'end', f: 'm', w: 700, fill: ok ? C.gr : C.rd });
    s += '<rect x="' + x + '" y="' + (yy + 8) + '" width="' + w + '" height="10" rx="5" fill="#16202c"/><rect x="' + x + '" y="' + (yy + 8) + '" width="' + (w * Math.min(1, m[1] / m[3])).toFixed(1) + '" height="10" rx="5" fill="' + (ok ? C.gr : C.rd) + '"/>';
    s += '<path d="M' + (x + w * m[2] / m[3]) + ' ' + (yy + 2) + 'v22" stroke="#fff" stroke-width="2"/>' + t(x + w + 16, yy + 18, m[4] + ' ' + m[2], { size: 14, fill: C.dim });
  });
  return s;
}
function diff5c(R, n, fx) {   // the card before -> after: only the changed fields lit
  var x = 520, y = 52, s = A.glass(x, y, 410, 300, { fx: fx, col: '#2b4157' });
  s += t(x + 18, y + 30, 'THE CARD', { size: 15, f: 'h', fill: C.dim, ls: '.1em' }) + t(x + 200, y + 30, 'before', { size: 15, a: 'middle', fill: C.dim }) + t(x + 330, y + 30, 'after', { size: 15, a: 'middle', fill: C.dim });
  var rows = [['cell number', '496', '496'], ['cell type', R.kind, R.kind], ['photos taken', '1', '1'], ['problem', n >= 1 ? '–' : '–', n >= 1 ? 'none' : '–'], ['defect score', n >= 2 ? '–' : '–', n >= 2 ? f3(R.p) : '–'], ['logbook lines', String(Math.max(0, n - 1)), String(n)]];
  if (n === 2) rows[3][1] = 'none';
  rows.forEach(function (q, j) {
    var yy = y + 66 + j * 38, ch = q[1] !== q[2];
    if (ch) s += '<rect x="' + (x + 10) + '" y="' + (yy - 22) + '" width="390" height="32" rx="6" fill="#ffb547" fill-opacity=".14" stroke="#ffb547" stroke-opacity=".6" class="pgd-pop"/>';
    s += t(x + 18, yy, q[0], { size: 15, fill: '#c7d4e4' }) + t(x + 200, yy, q[1], { size: 16, a: 'middle', f: 'm', fill: ch ? C.dim : '#8d9bb0' }) + t(x + 260, yy, ch ? '→' : '', { size: 16, a: 'middle', fill: C.am }) + t(x + 330, yy, q[2], { size: 16, a: 'middle', f: 'm', w: 700, fill: ch ? '#ffcf6b' : '#8d9bb0' });
  });
  return s;
}
function scene5c(c, n, fx) {
  var R = run5c(), s = A.stage() + fx.defs; if (!R) return s;
  s += A.belt(30, 260, 470, 24, { fx: fx });
  s += station('check', 140, 190, { fx: fx, w: 150, h: 110, hot: n === 0, dim: n > 0 && false }) + station('model', 370, 190, { fx: fx, w: 150, h: 110, hot: n === 1, dim: n < 1 });
  s += token(496, n === 0 ? 60 : n === 1 ? 255 : 470, 266, { s: 34 });
  s += diff5c(R, n, fx);
  return { s: s, R: R };
}
D.register('5c', {
  init: function () { return {}; },
  frames: [
  { cap: 'Station 1 measures the photo',
    note: 'The photo check measures brightness, spread and contrast of the real photo and compares them with the quality rules. It writes only “problem”.',
    svg: function (c) { var fx = A.fx(), S = scene5c(c, 0, fx); if (!S.R) return S; return S.s + A.glass(30, 330, 470, 186, { fx: fx, col: '#22384d' }) + t(48, 360, 'CELL 496 · ITS PHOTO, MEASURED', { size: 14, f: 'h', fill: C.dim, ls: '.08em' }) + bars5c(S.R, 48, 392) + crank(140, 104 - 30, 'crank', 'crank the photo check'); },
    work: function (c) { var R = run5c(); if (!R) return []; return [{ h: 'The quality rules (out of 255)' }, { v: R.st.mean.toFixed(1) + ' ≥ ' + R.R.dark, k: 'brightness: not too dark' }, { v: R.st.spread.toFixed(1) + ' ≥ ' + R.R.blank, k: 'spread: not blank' }, { v: R.st.contrast.toFixed(1) + ' ≥ ' + R.R.flat, k: 'contrast: not flat' }, { op: '=', v: 'photo ok', k: 'problem: none', res: true }, { tag: 'typical value' }]; },
    bind: function (c, root) { holdBind(c, root, 'crank'); } },
  { cap: 'Station 2 writes the score',
    note: 'The model station reads the photo and writes the defect score. It returns only the score and one logbook line.',
    svg: function (c) { var fx = A.fx(), S = scene5c(c, 1, fx); if (!S.R) return S; return S.s + A.glass(30, 330, 470, 186, { fx: fx, col: '#22384d' }) + t(48, 362, 'WHAT EACH STATION RETURNS', { size: 14, f: 'h', fill: C.dim, ls: '.08em' }) + t(48, 400, 'photo check → problem + 1 line', { size: 17, f: 'm', fill: '#c7d4e4' }) + t(48, 432, 'model → score + 1 line', { size: 17, f: 'm', fill: '#ffcf6b' }) + t(48, 470, 'Only what changed. Never the whole card.', { size: 16, fill: C.dim }) + crank(370, 104 - 30, 'crank', 'crank the model'); },
    work: function (c) { var R = run5c(); if (!R) return []; return clean([{ h: 'Score of cell 496' }, { v: f3(R.p), k: 'the 3f blend for this cell: the same number as in Step 3', res: true }, srcTag(R.you), refNote(R.you)]); },
    bind: function (c, root) { holdBind(c, root, 'crank'); } },
  { cap: 'One real cell went through. Only the changed fields light up.',
    note: 'START, photo check, model, END. Each station changed only its own field and added one line. A dead cell would stop at the photo check: too dark.',
    svg: function (c) {
      var fx = A.fx(), S = scene5c(c, 2, fx), R = S.R; if (!R) return S;
      var s = S.s + A.glass(30, 330, 470, 186, { fx: fx, col: '#7a2a3a' }) + t(48, 360, 'FOR COMPARISON: A REAL DEAD CELL', { size: 14, f: 'h', fill: '#ff8aa0', ls: '.08em' });
      if (R.dead) s += A.cell(F5().dead || 1896, 48, 376, 120, {}) + t(186, 400, 'cell ' + (F5().dead || 1896), { size: 17, w: 700, fill: '#fff' }) + t(186, 428, 'brightness ' + R.dead.mean.toFixed(1) + ' < ' + R.R.dark, { size: 16, f: 'm', fill: C.rd }) + t(186, 456, '→ problem: too dark', { size: 16, f: 'm', w: 700, fill: '#ff8aa0' }) + t(186, 484, 'broken, not a bad photo', { size: 15, fill: C.dim });
      s += A.glass(520, 372, 410, 144, { fx: fx, col: '#2b4157' }) + t(538, 404, 'THE RUN', { size: 14, f: 'h', fill: C.dim, ls: '.1em' }) + t(538, 440, 'START → photo check → model → END', { size: 16, f: 'm', fill: '#fff' }) + t(538, 476, '2 stations · 2 fields written · 2 lines', { size: 16, fill: '#c7d4e4' });
      return s;
    },
    work: function (c) { var R = run5c(); if (!R) return []; return clean([{ h: 'The whole run' }, { v: '2', k: 'stations ran' }, { v: 'none, ' + f3(R.p), k: 'the two fields they wrote' }, { v: '2', k: 'logbook lines added' }, srcTag(R.you), refNote(R.you)]); } }
  ]
});
function holdBind(c, root, key) {
  var el = root.querySelector('[data-pgd-t="' + key + '"]'); if (!el) return;
  var ring = el.querySelector('.pgd-holdring'), arm = el.querySelector('.pgd-crank'), box = arm && arm.parentNode.querySelector('circle');
  var cx = box ? +box.getAttribute('cx') : 0, cy = box ? +box.getAttribute('cy') : 0;
  D.onHold(el, { ms: 1100, progress: function (f) { if (ring) ring.setAttribute('stroke-dasharray', (f * 239).toFixed(1) + ' 999'); if (arm) arm.setAttribute('transform', 'rotate(' + (f * 720).toFixed(0) + ' ' + cx + ' ' + cy + ')'); }, done: function () { c.next(); } });
}

/* ============================ 5d  The fork ============================ */
var PRED5D = function () {   // the 5d prediction's own 4 cells (left out of this picture until it is answered)
  var L = L5(); if (!L) return []; var s = L.s, idx = s.map(function (v, i) { return i; }).sort(function (a, b) { return s[a] - s[b]; });
  var below = idx.filter(function (i) { return s[i] < L.low; }), mid = idx.filter(function (i) { return s[i] >= L.low && s[i] < L.high; }), top = idx.filter(function (i) { return s[i] >= L.high; });
  var a = below.filter(function (i) { return L.y[i] === 1; }).pop(); return [mid[mid.length - 1], a, top[0], mid[0]].filter(function (i) { return i != null; }).map(function (i) { return L.v.id[i]; });
};
function cells5d() {   // 4 real cells of the 20 the lab runs: one per lane plus one near the low gate
  var L = L5(); if (!L) return null;
  var skip = D.predDone('5d') ? [] : PRED5D(), twenty = L.sample(20).filter(function (id) { return skip.indexOf(id) < 0; }).map(function (id) { var i = L.at[id]; return { id: id, p: L.s[i], y: L.y[i], lane: L.lane(L.s[i]) }; });
  var pick = [], used = {};
  function take(f) { var q = twenty.filter(function (z) { return f(z) && !used[z.id]; })[0]; if (q) { used[q.id] = 1; pick.push(q); } }
  take(function (z) { return z.lane === 'pass'; }); take(function (z) { return z.lane === 'stop'; });
  take(function (z) { return z.lane === 'person' && z.p - L.low < 0.03; }); take(function (z) { return z.lane === 'person'; });
  return { L: L, cells: pick, twenty: L.sample(20).map(function (id) { return L.lane(L.s[L.at[id]]); }) };
}
var TR = { x0: 40, y: 280, sw: 430, ends: { pass: 120, person: 280, stop: 440 } };
var NOTCH = { pass: [560, 214], person: [600, 290], stop: [560, 366] };
function track5d(fx, lit) {
  var s = '';
  function rails(d, col, on) { return '<path d="' + d + '" stroke="#3a2f24" stroke-width="22" fill="none" stroke-linecap="round"/><path d="' + d + '" stroke="' + (on ? col : '#55606e') + '" stroke-width="3" fill="none" transform="translate(0 -7)"/><path d="' + d + '" stroke="' + (on ? col : '#55606e') + '" stroke-width="3" fill="none" transform="translate(0 7)"/>'; }
  s += rails('M' + TR.x0 + ' ' + TR.y + 'H' + TR.sw, '#8d9bb0', true);
  ['pass', 'person', 'stop'].forEach(function (k) { var y = TR.ends[k]; s += rails('M' + TR.sw + ' ' + TR.y + 'C' + (TR.sw + 90) + ' ' + TR.y + ' ' + (TR.sw + 80) + ' ' + y + ' ' + (TR.sw + 180) + ' ' + y + 'H' + 760, LCOL[k], lit === k); });
  for (var x = TR.x0 + 10; x < TR.sw; x += 22) s += '<path d="M' + x + ' ' + (TR.y - 12) + 'v24" stroke="#5a4632" stroke-width="5"/>';
  return s;
}
function gates5d(L) {
  return '<g>' + [['pass gate', L.low, LCOL.pass, 120], ['stop gate', L.high, LCOL.stop, 290]].map(function (g) { var x = g[3]; return '<rect x="' + (x - 3) + '" y="' + (TR.y - 120) + '" width="6" height="96" fill="#3a4757"/><rect x="' + (x - 62) + '" y="' + (TR.y - 160) + '" width="124" height="48" rx="10" fill="#0b121b" stroke="' + g[2] + '" stroke-width="2"/>' + t(x, TR.y - 140, g[0], { size: 14, a: 'middle', fill: g[2] }) + t(x, TR.y - 118, f3(g[1]), { size: 17, a: 'middle', f: 'm', w: 700, fill: '#fff' }); }).join('') + '</g>';
}
function yards5d(cnt, fx) {
  var s = '';
  ['pass', 'person', 'stop'].forEach(function (k) { var y = TR.ends[k]; s += '<rect x="770" y="' + (y - 40) + '" width="160" height="80" rx="12" fill="#0b121b" stroke="' + LCOL[k] + '" stroke-width="2"/>' + t(786, y - 14, LNAME[k], { size: 14, f: 'h', fill: LCOL[k], ls: '.04em' }) + '<text x="786" y="' + (y + 26) + '" font-family="' + A.FM + '" font-size="30" font-weight="700" fill="#fff">' + cnt[k] + '</text>'; });
  return s;
}
function wagon5d(q, x, y) { return '<g>' + '<rect x="' + (x - 38) + '" y="' + (y - 34) + '" width="76" height="48" rx="6" fill="#2a3340" stroke="#8d9bb0" stroke-width="2"/>' + A.cell(q.id, x - 20, y - 56, 40, {}) + '<rect x="' + (x - 36) + '" y="' + (y - 8) + '" width="72" height="20" rx="4" fill="#0b121b"/>' + t(x, y + 7, f3(q.p), { size: 15, a: 'middle', f: 'm', w: 700, fill: '#fff' }) + '<circle cx="' + (x - 22) + '" cy="' + (y + 16) + '" r="7" fill="#11171f" stroke="#8d9bb0"/><circle cx="' + (x + 22) + '" cy="' + (y + 16) + '" r="7" fill="#11171f" stroke="#8d9bb0"/></g>'; }
function lever5d(pos) {   // the switch lever pivots at (520, 290); its knob sits at a notch
  var k = NOTCH[pos] || [600, 290];
  return '<g><path d="M520 290L' + k[0] + ' ' + k[1] + '" stroke="#c7d4e4" stroke-width="8" stroke-linecap="round"/><circle cx="' + k[0] + '" cy="' + k[1] + '" r="16" fill="#ffb547" stroke="#fff" stroke-width="2"/></g>';
}
D.register('5d', {
  init: function () { return { k: 0, cnt: { pass: 0, person: 0, stop: 0 }, msg: '', last: null }; },
  frames: [
  { cap: 'Throw the switch: which lane does this cell take?',
    note: 'Only the score and the two gates decide. Below the pass gate: auto-pass. At or above the stop gate: auto-stop. In between: a person checks.',
    svg: function (c) {
      var fx = A.fx(), Q = cells5d(), st = c.state, s = A.stage() + fx.defs; if (!Q) return s;
      var L = Q.L, q = Q.cells[st.k];
      s += track5d(fx, st.last) + gates5d(L) + yards5d(st.cnt, fx);
      s += '<circle cx="520" cy="290" r="64" fill="none" stroke="#2b3a4c" stroke-dasharray="4 6"/>';
      ['pass', 'person', 'stop'].forEach(function (k) { var p = NOTCH[k]; s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="#0b121b" stroke="' + LCOL[k] + '" stroke-width="2.5"/>'; });
      if (q) {
        s += wagon5d(q, 360, TR.y - 2) + t(360, TR.y + 54, 'cell ' + q.id + ' · ' + (Q.cells.length - st.k) + ' to go', { size: 15, a: 'middle', fill: C.dim });
        s += A.target('lever', lever5d('person'), 'throw the switch', 600, 470, { kind: 'drag', to: snapTo(600, 290, NOTCH[q.lane][0], NOTCH[q.lane][1], 12) });
      }
      if (st.msg) s += t(300, 520, st.msg, { size: 16, a: 'middle', w: 700, fill: '#ff8aa0', cls: 'pgd-shake' });
      return s;
    },
    work: function (c) {
      var Q = cells5d(), st = c.state; if (!Q) return [];
      var L = Q.L, q = Q.cells[st.k] || Q.cells[Q.cells.length - 1];
      return clean([{ h: 'Cell ' + q.id }, { v: f3(q.p), k: 'its score' }, { v: f3(L.low), k: 'pass gate: below it = auto-pass' }, { v: f3(L.high), k: 'stop gate: at or above it = auto-stop' }, { t: 'Compare the score with both gates. Which lane is left?' }, srcTag(L.you), refNote(L.you)]);
    },
    bind: function (c, root) {
      var st = c.state, Q = cells5d(); if (!Q) return;
      var q = Q.cells[st.k], el = root.querySelector('[data-pgd-t=lever]'), L = Q.L; if (!q || !el) return;
      D.onDrag(root, el, { start: { x: 600, y: 290 }, step: 12,
        move: function (p) { var a = Math.atan2(p.y - 290, p.x - 520), deg = Math.max(-60, Math.min(60, a * 180 / Math.PI)); el.querySelector('.pgd-ring').innerHTML = '<g transform="rotate(' + deg.toFixed(1) + ' 520 290)"><path d="M520 290L600 290" stroke="#c7d4e4" stroke-width="8" stroke-linecap="round"/><circle cx="600" cy="290" r="16" fill="#ffb547" stroke="#fff" stroke-width="2"/></g>'; el.setAttribute('data-deg', deg); },
        drop: function (p) {
          var a = Math.atan2(p.y - 290, p.x - 520) * 180 / Math.PI, pos = a < -20 ? 'pass' : a > 20 ? 'stop' : 'person';
          if (pos === q.lane) { st.cnt[pos]++; st.last = pos; st.msg = ''; st.k++; if (st.k >= Q.cells.length) c.next(); else c.redraw(true); return; }
          st.msg = pos === 'pass' ? f3(q.p) + ' is not below the pass gate ' + f3(L.low) + '.' : pos === 'stop' ? f3(q.p) + ' is below the stop gate ' + f3(L.high) + '.' : f3(q.p) + (q.p < L.low ? ' is below the pass gate.' : ' is at or above the stop gate.');
          c.redraw(true);
        } });
    },
    auto: function (c) { var Q = cells5d(), st = c.state; Q.cells.forEach(function (q) { st.cnt[q.lane]++; }); st.k = Q.cells.length; } },
  { cap: 'Twenty real cells through the fork',
    note: 'The lab sends 20 cells, spread evenly over the validation tray, through the fork. The lanes fill with their real counts.',
    svg: function (c) {
      var fx = A.fx(), Q = cells5d(), st = c.state, s = A.stage() + fx.defs; if (!Q) return s;
      s += track5d(fx, null) + gates5d(Q.L) + yards5d(st.cnt, fx) + lever5d('person');
      s += A.target('run', '<rect x="160" y="350" width="240" height="70" rx="14" fill="#0b121b" stroke="#ffb547" stroke-width="2.5"/>', 'send all 20 cells', 280, 456, { inner: t(280, 394, '▶ 20 CELLS', { size: 22, a: 'middle', f: 'h', fill: C.am }) });
      return s;
    },
    work: function (c) { var st = c.state; return [{ h: 'So far' }, { v: st.cnt.pass + ' · ' + st.cnt.person + ' · ' + st.cnt.stop, k: 'pass · person · stop (the cells you switched)' }]; },
    on: { run: function (c) { var Q = cells5d(), st = c.state, n = { pass: 0, person: 0, stop: 0 }; Q.twenty.forEach(function (k) { n[k]++; }); st.from = st.cnt; st.cnt = n; c.next(); } },
    auto: function (c) { var Q = cells5d(), n = { pass: 0, person: 0, stop: 0 }; Q.twenty.forEach(function (k) { n[k]++; }); c.state.cnt = n; } },
  { cap: 'Two gates make three lanes',
    note: 'Twenty cells: most go to a person. Over the whole validation tray the same fork gives the same lanes as the gates of Step 3.',
    svg: function (c) {
      var fx = A.fx(), Q = cells5d(), st = c.state, s = A.stage() + fx.defs; if (!Q) return s;
      s += track5d(fx, null) + gates5d(Q.L) + yards5d(st.cnt, fx);
      var W = shift5(Q.L), x = 60, y = 380, w = 640;
      s += A.glass(40, 360, 700, 156, { fx: fx, col: '#2b4157' }) + t(60, 392, 'ALL ' + W.n + ' VALIDATION CELLS, PER 1,000', { size: 14, f: 'h', fill: C.dim, ls: '.08em' });
      var x0 = x; ['pass', 'person', 'stop'].forEach(function (k) { var ww = w * W[k] / W.n; s += '<rect class="pgd-in" x="' + x0 + '" y="' + (y + 28) + '" width="' + ww.toFixed(1) + '" height="40" fill="' + LCOL[k] + '" fill-opacity=".8"/>' + t(x0 + 10, y + 56, String(Math.round(1000 * W[k] / W.n)), { size: 20, f: 'm', w: 700, fill: '#05070b' }) + t(x0 + 10, y + 96, LNAME[k].toLowerCase(), { size: 15, fill: LCOL[k] }); x0 += ww; });
      return s;
    },
    work: function (c) {
      var Q = cells5d(), st = c.state; if (!Q) return [];
      var W = shift5(Q.L); return clean([{ h: '20 cells' }, { v: st.cnt.pass + ' + ' + st.cnt.person + ' + ' + st.cnt.stop + ' = 20', k: 'pass + person + stop' }, { h: 'All validation cells' }, { v: W.pass + ' · ' + W.person + ' · ' + W.stop, k: 'pass · person · stop (of ' + W.n + ')' }, { op: '=', v: Math.round(1000 * W.pass / W.n) + ' · ' + Math.round(1000 * W.person / W.n) + ' · ' + Math.round(1000 * W.stop / W.n), k: 'per 1,000: the same as 3g', res: true }, srcTag(Q.L.you), refNote(Q.L.you)]);
    } }
  ]
});


/* ============================ 5e  Shoot again, but not forever ============================ */
function cap5e() { return D.liveRes('5e') ? { n: 2, real: true } : { n: 3, real: false }; }   // the cap is a 5e code gap: an example cap until 5e is passed
var LP = { cx: 400, cy: 230, r: 116 };
function loop5e(fx, o) {
  o = o || {}; var s = '';
  s += '<circle cx="' + LP.cx + '" cy="' + LP.cy + '" r="' + LP.r + '" fill="none" stroke="#1a232f" stroke-width="26"/>';
  s += '<circle cx="' + LP.cx + '" cy="' + LP.cy + '" r="' + LP.r + '" fill="none" stroke="' + (o.hot ? '#ff4d6a' : '#46e3ff') + '" stroke-width="3" stroke-dasharray="9 9"' + (o.spin ? ' class="pgd-flowonce"' : '') + '/>';
  s += station('check', LP.cx - LP.r, LP.cy, { fx: fx, w: 128, h: 92 }) + station('reshoot', LP.cx + LP.r, LP.cy, { fx: fx, w: 128, h: 92, col: '#a98bff' });
  s += A.arrow(LP.cx - 20, LP.cy - LP.r, LP.cx + 20, LP.cy - LP.r, '#46e3ff', { w: 3 }) + A.arrow(LP.cx + 20, LP.cy + LP.r, LP.cx - 20, LP.cy + LP.r, '#a98bff', { w: 3 });
  s += t(LP.cx, LP.cy - LP.r - 22, 'bad photo → shoot again', { size: 15, a: 'middle', fill: C.dim }) + t(LP.cx, LP.cy + LP.r + 36, 'new photo → check again', { size: 15, a: 'middle', fill: C.dim });
  // exits
  s += station('model', 92, LP.cy, { fx: fx, w: 112, h: 80, dim: !o.ok }) + '<path d="M' + (LP.cx - LP.r - 64) + ' ' + LP.cy + 'H150" stroke="#3a4757" stroke-width="3" stroke-dasharray="5 5"/>' + t(186, LP.cy - 14, 'photo ok', { size: 14, a: 'middle', fill: C.dim });
  return s;
}
function dial5e(n, lim, x, y, err) {   // the step counter: LangGraph counts every station run
  var s = '', a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, R = 70;
  function pt(f, r) { var a = a0 + (a1 - a0) * f; return [x + r * Math.cos(a), y + r * Math.sin(a)]; }
  s += '<circle cx="' + x + '" cy="' + y + '" r="' + (R + 20) + '" fill="#0b121b" stroke="' + (err ? '#ff4d6a' : '#2b4157') + '" stroke-width="2"/>';
  for (var k = 0; k <= lim; k++) { var f = k / lim, p1 = pt(f, R), p2 = pt(f, R - (k % 5 ? 6 : 12)); s += '<path d="M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + 'L' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1) + '" stroke="' + (k >= lim - 1 ? '#ff4d6a' : '#5d6b80') + '" stroke-width="2"/>'; if (k % 5 === 0) { var q = pt(f, R + 12); s += t(q[0], q[1] + 5, String(k), { size: 14, a: 'middle', f: 'm', fill: C.dim }); } }
  var h = pt(Math.min(1, n / lim), R - 16); s += '<path d="M' + x + ' ' + y + 'L' + h[0].toFixed(1) + ' ' + h[1].toFixed(1) + '" stroke="' + (err ? '#ff4d6a' : '#ffb547') + '" stroke-width="5" stroke-linecap="round"/><circle cx="' + x + '" cy="' + y + '" r="8" fill="#c7d4e4"/>';
  s += '<text x="' + x + '" y="' + (y + 46) + '" text-anchor="middle" font-family="' + A.FM + '" font-size="24" font-weight="700" fill="' + (err ? '#ff8aa0' : '#fff') + '">' + n + '</text>' + t(x, y + R + 44, 'steps in this run', { size: 15, a: 'middle', fill: C.dim });
  return s;
}
function fault5e(x, y, fid) {
  var f = (F5().faults || []).filter(function (q) { return q[0] === fid; })[0], px = faultPx(fid); if (!f || !px) return '';
  var st = stats(px);
  return A.glass(x, y, 250, 120, { col: '#7a2a3a' }) + '<image href="' + pxURL(px, fid) + '" x="' + (x + 12) + '" y="' + (y + 12) + '" width="96" height="96" style="image-rendering:pixelated"/><rect x="' + (x + 12) + '" y="' + (y + 12) + '" width="96" height="96" fill="none" stroke="#5d6b80"/>' +
    t(x + 120, y + 34, 'fault copy ' + fid, { size: 16, w: 700, fill: '#fff' }) + t(x + 120, y + 56, 'of good cell ' + f[1], { size: 14, fill: C.dim }) + t(x + 120, y + 80, f[3], { size: 15, w: 700, fill: '#ff8aa0' }) + t(x + 120, y + 102, 'brightness ' + st.mean.toFixed(1), { size: 14, f: 'm', fill: C.dim });
}
function trail5e(tries, x, y) { var s = ''; for (var k = 1; k <= tries; k++) s += '<g class="' + (k === tries ? 'pgd-pop' : '') + '"><rect x="' + (x + (k - 1) * 46) + '" y="' + y + '" width="38" height="38" rx="6" fill="#0b121b" stroke="#a98bff"/>' + t(x + (k - 1) * 46 + 19, y + 25, String(k), { size: 16, a: 'middle', f: 'm', w: 700, fill: '#a98bff' }) + '</g>'; return s + t(x, y + 60, 'photos taken: ' + tries, { size: 15, fill: C.dim }); }
D.register('5e', {
  init: function () { return { laps: 0 }; },
  frames: [
  { cap: 'A bad photo goes round the loop',
    note: 'The camera fault copy fails the photo check, so it goes back to the camera. Here the camera stays broken: every new photo fails too.',
    svg: function (c) {
      var fx = A.fx(), st = c.state, s = A.stage() + fx.defs + loop5e(fx, { spin: st.laps > 0 }) + fault5e(28, 400, 'F1') + dial5e(1 + 2 * st.laps, F5().recursionLimit || 25, 790, 170) + trail5e(1 + st.laps, 330, 430);
      s += token(2567, LP.cx + (st.laps % 2 ? LP.r : -LP.r), LP.cy - 74, { s: 34, href: pxURL(faultPx('F1') || [], 'F1') });
      s += A.target('shoot', '<circle cx="' + (LP.cx + LP.r + 90) + '" cy="' + (LP.cy + 90) + '" r="30" fill="#2a1a40" stroke="#a98bff" stroke-width="3"/><circle cx="' + (LP.cx + LP.r + 90) + '" cy="' + (LP.cy + 90) + '" r="18" fill="#a98bff"/>', 'shoot again', LP.cx + LP.r + 90, LP.cy + 150, {});
      return s;
    },
    work: function (c) { var st = c.state, f = faultPx('F1'), R = F5().rules || {}; return clean([{ h: 'Each lap' }, { v: '+2 steps', k: 'photo check, then the camera' }, { v: 'photos taken: ' + (1 + st.laps), k: 'counted on the card' }, f ? { v: stats(f).mean.toFixed(1) + ' < ' + R.dark, k: 'brightness of the new photo: still too dark' } : null, { tag: 'typical value' }]); },
    on: { shoot: function (c) { var st = c.state; st.laps++; if (st.laps >= 3) c.next(); else c.redraw(true); } },
    auto: function (c) { c.state.laps = 3; } },
  { cap: 'With no way out, it never ends',
    note: 'Nothing stops the loop. LangGraph counts the steps of a run and stops it at its limit with an error. The cell is not recorded at all.',
    svg: function (c) {
      var fx = A.fx(), st = c.state, lim = F5().recursionLimit || 25, s = A.stage() + fx.defs + loop5e(fx, { hot: st.crash }) + fault5e(28, 400, 'F1') + dial5e(st.crash ? lim : 1 + 2 * st.laps, lim, 790, 170, st.crash);
      if (!st.crash) s += A.target('run', '<rect x="700" y="330" width="200" height="60" rx="14" fill="#0b121b" stroke="#ffb547" stroke-width="2.5"/>', 'let it run', 800, 420, { inner: t(800, 368, 'LET IT RUN', { size: 18, a: 'middle', f: 'h', fill: C.am }) });
      return s;
    },
    work: function (c) { var lim = F5().recursionLimit || 25; return [{ h: 'The run' }, { v: '7 + 2 + 2 + …', k: 'steps keep adding up' }, { v: String(lim), k: 'LangGraph’s step limit (recursion limit)', res: true }]; },
    on: { run: function (c) { c.state.crash = 1; c.next(); } }, auto: function (c) { c.state.crash = 1; } },
  { cap: 'Stopped by LangGraph: an error, not an answer',
    note: 'At the limit LangGraph throws the run away with an error. Nobody looked at the cell and nothing went into the logbook. The loop needs its own way out.',
    svg: function (c) {
      var fx = A.fx(), lim = F5().recursionLimit || 25, cap = cap5e(), s = A.stage() + fx.defs + loop5e(fx, { hot: 1 }) + dial5e(lim, lim, 790, 170, 1);
      s += A.glass(28, 410, 620, 100, { fx: fx, col: '#ff4d6a' }) + t(48, 442, 'GraphRecursionError', { size: 18, f: 'm', w: 700, fill: '#ff8aa0' }) + t(48, 470, (F5().recursionMsg || '').slice(0, 64), { size: 15, f: 'm', fill: '#c7d4e4' }) + t(48, 494, 'the cell is lost: no answer, no logbook line', { size: 15, fill: C.dim });
      s += '<rect x="' + (LP.cx + 30) + '" y="' + (LP.cy + LP.r - 18) + '" width="70" height="36" rx="8" fill="none" stroke="#ffb547" stroke-width="2.5" stroke-dasharray="6 5"/>';
      s += A.target('stopper', '<g><rect x="700" y="330" width="200" height="64" rx="10" fill="url(#' + fx.mt + ')" stroke="#ffb547" stroke-width="2.5"/>' + t(800, 358, 'STOPPER', { size: 16, a: 'middle', f: 'h', fill: C.am }) + t(800, 382, cap.real ? 'max ' + cap.n + ' photos' : 'max ' + cap.n + ' photos (example)', { size: 15, a: 'middle', f: 'm', fill: '#fff' }) + '</g>', 'fit a stopper on the loop', 800, 426, { kind: 'drag', to: snapTo(800, 362, LP.cx + 65, LP.cy + LP.r, 16) });
      return s;
    },
    work: function (c) { var cap = cap5e(); return clean([{ h: 'A way out' }, { t: 'Count the photos on the card. When the count reaches the cap, send the cell to a person instead of the camera.' }, cap.real ? { v: 'max ' + cap.n, k: 'your cap from the lab', res: true } : { t: 'Example cap: 3 photos. Your own cap is the number you put in the lab (5e, gap 1); it shows here after you pass 5e.' }]); },
    bind: function (c, root) {
      var el = root.querySelector('[data-pgd-t=stopper]'); if (!el) return;
      D.onDrag(root, el, { start: { x: 800, y: 362 }, step: 16, move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - 800) + ' ' + (p.y - 362) + ')'); },
        drop: function (p) { if (Math.abs(p.x - (LP.cx + 65)) < 70 && Math.abs(p.y - (LP.cy + LP.r)) < 50) { c.state.cap = 1; c.next(); } else el.removeAttribute('transform'); } });
    },
    auto: function (c) { c.state.cap = 1; } },
  { cap: 'With a cap, the cell leaves the loop to a person',
    note: 'Photo 1 bad, new photo, still bad … at the cap the cell goes to the person desk. A person looks, and the answer is written down.',
    svg: function (c) {
      var fx = A.fx(), cap = cap5e(), st = c.state, s = A.stage() + fx.defs + loop5e(fx) + fault5e(28, 400, 'F1');
      s += '<g><rect x="' + (LP.cx + 30) + '" y="' + (LP.cy + LP.r - 18) + '" width="70" height="36" rx="8" fill="url(#' + fx.mt + ')" stroke="#ffb547" stroke-width="2.5"/>' + t(LP.cx + 65, LP.cy + LP.r + 6, 'max ' + cap.n, { size: 14, a: 'middle', f: 'm', w: 700, fill: '#fff' }) + '</g>';
      s += station('desk', 790, 420, { fx: fx, w: 140, h: 92, col: LCOL.person, hot: st.out });
      s += '<path d="M' + (LP.cx + 100) + ' ' + (LP.cy + LP.r) + 'C' + 600 + ' ' + (LP.cy + LP.r) + ' 640 420 716 420" stroke="' + LCOL.person + '" stroke-width="3" fill="none" stroke-dasharray="8 6"/>';
      s += trail5e(st.out ? cap.n : 1, 560, 150) + (st.out ? t(560, 236, '→ person desk', { size: 16, w: 700, fill: LCOL.person }) : '');
      if (!st.out) s += A.target('go', '<rect x="560" y="60" width="220" height="60" rx="14" fill="#0b121b" stroke="#ffb547" stroke-width="2.5"/>', 'send the fault copy', 670, 140, { inner: t(670, 98, '▶ SEND F1', { size: 18, a: 'middle', f: 'h', fill: C.am }) });
      return s;
    },
    work: function (c) { var cap = cap5e(), r = [{ h: 'The trail' }]; for (var k = 1; k <= cap.n; k++) r.push({ v: 'photo ' + k, k: k < cap.n ? 'bad → camera again' : 'bad, and the cap is reached → a person' }); r.push(cap.real ? { tag: 'your value' } : { t: 'Shown with the example cap of 3.' }); return r; },
    on: { go: function (c) { c.state.out = 1; c.next(); } }, auto: function (c) { c.state.out = 1; } },
  { cap: 'Five real cards through the capped loop',
    note: 'The three camera fault copies and a real dead cell leave the loop at the cap and go to a person. A normal cell goes straight on.',
    svg: function (c) {
      var fx = A.fx(), cap = cap5e(), s = A.stage() + fx.defs, F = F5(), rows = [['F1', 'too dark'], ['F2', 'almost blank'], ['F3', 'low contrast'], [String(F.dead || 1896), 'dead cell: too dark'], [String(F.one || 496), 'photo ok']];
      s += t(40, 40, 'THE CAPPED LOOP · 5 REAL CARDS', { size: 15, f: 'h', fill: C.dim, ls: '.08em' });
      rows.forEach(function (r, j) {
        var x = 40 + j * 180, y = 70, fault = r[0][0] === 'F', px = fault ? faultPx(r[0]) : D.pixels(+r[0]), href = px ? (fault ? pxURL(px, r[0]) : D.cellURL(+r[0])) : '', ok = r[1] === 'photo ok', st = px ? stats(px) : null;
        s += A.glass(x, y, 166, 440, { fx: fx, col: ok ? '#2f6b55' : '#7a5a2a' }) + (href ? '<image href="' + href + '" x="' + (x + 13) + '" y="' + (y + 14) + '" width="140" height="140" style="image-rendering:pixelated"/>' : '');
        s += t(x + 13, y + 182, fault ? 'fault copy ' + r[0] : 'cell ' + r[0], { size: 16, w: 700, fill: '#fff' }) + t(x + 13, y + 206, r[1], { size: 15, fill: ok ? C.gr : '#ff8aa0' });
        if (st) s += t(x + 13, y + 236, 'bright ' + st.mean.toFixed(1), { size: 14, f: 'm', fill: C.dim }) + t(x + 13, y + 256, 'spread ' + st.spread.toFixed(1), { size: 14, f: 'm', fill: C.dim }) + t(x + 13, y + 276, 'contrast ' + st.contrast.toFixed(0), { size: 14, f: 'm', fill: C.dim });
        s += t(x + 13, y + 326, 'photos: ' + (ok ? 1 : cap.n), { size: 17, f: 'm', w: 700, fill: '#a98bff' }) + t(x + 13, y + 360, ok ? '→ model, then fork' : '→ person desk', { size: 15, w: 700, fill: ok ? '#46e3ff' : LCOL.person });
        s += t(x + 13, y + 420, ok ? 'normal path' : 'a person looks', { size: 14, fill: C.dim });
      });
      return s;
    },
    work: function (c) { var cap = cap5e(), R = F5().rules || {}; return clean([{ h: 'The quality rules' }, { v: 'brightness < ' + R.dark, k: 'too dark' }, { v: 'spread < ' + R.blank, k: 'almost blank' }, { v: 'contrast < ' + R.flat, k: 'low contrast' }, { t: 'Of all 2,624 real photos only 4 dead cells break a rule; every other photo is far above the lines.' }, cap.real ? { tag: 'your value' } : { t: 'Photo counts shown with the example cap of 3.' }]); } }
  ]
});

/* ============================ 5f  Stop and wait for a person ============================ */
function unsure5f() { var L = L5(); if (!L) return null; var ids = L.unsure(5); return { L: L, cells: ids.map(function (id) { var i = L.at[id]; return { id: id, p: L.s[i], y: L.y[i], kind: L.v.kind[i] === 'p' ? 'poly' : 'mono' }; }) }; }
function snap5f(q, x, y, fx, o) {   // the saved card on the shelf
  o = o || {};
  return '<g' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' + '<rect x="' + x + '" y="' + y + '" width="230" height="150" rx="6" fill="#efe9da"' + (fx ? ' filter="url(#' + fx.sh + ')"' : '') + '/>' +
    t(x + 14, y + 26, 'SAVED CARD', { size: 14, f: 'h', fill: '#1d2a38', ls: '.06em' }) + t(x + 216, y + 26, 'cell-' + q.id, { size: 14, a: 'end', f: 'm', w: 700, fill: '#7a1020' }) +
    t(x + 14, y + 54, 'at: person desk', { size: 15, f: 'm', fill: '#1d2a38' }) + t(x + 14, y + 78, 'score: ' + f3(q.p), { size: 15, f: 'm', fill: '#1d2a38' }) + t(x + 14, y + 102, 'lane: person', { size: 15, f: 'm', fill: '#1d2a38' }) + t(x + 14, y + 126, 'answer: ' + (o.ans || '…waiting'), { size: 15, f: 'm', w: 700, fill: o.ans ? '#7a1020' : '#8a8274' }) + '</g>';
}
function floor5f(fx, q, o) {
  o = o || {}; var s = '';
  s += A.belt(30, 120, 900, 24, { fx: fx, moving: o.moving });
  s += station('model', 110, 80, { fx: fx, w: 120, h: 80, dim: 1 }) + station('fork', 270, 80, { fx: fx, w: 110, h: 80, col: '#ffcf6b', dim: 1 }) + station('desk', 470, 80, { fx: fx, w: 140, h: 80, col: LCOL.person, hot: !o.done }) + station('log', 690, 80, { fx: fx, w: 120, h: 80, dim: !o.done, hot: o.done }) + station('out', 860, 80, { fx: fx, w: 90, h: 80, dim: 1 });
  // the holding bay under the person desk
  s += '<rect x="380" y="190" width="180" height="120" rx="10" fill="#0b121b" stroke="' + LCOL.person + '" stroke-dasharray="6 5"/>' + t(470, 214, 'HOLDING BAY', { size: 14, a: 'middle', f: 'h', fill: LCOL.person, ls: '.06em' });
  if (q && !o.done) s += '<g class="pgd-drop">' + token(q.id, 470, 260, { s: 50 }) + '<path d="M496 236l26 -14" stroke="#ffb547" stroke-width="2"/><rect x="520" y="208" width="84" height="26" rx="4" fill="#ffb547"/>' + t(562, 226, 'cell-' + q.id, { size: 14, a: 'middle', f: 'm', w: 700, fill: '#1a1103' }) + '</g>';
  return s;
}
D.register('5f', {
  init: function () { return { ans: null }; },
  frames: [
  { cap: 'The flow pauses: the cell waits in the holding bay',
    note: 'An unsure cell reaches the person desk. The flow stops right there. Its card is saved, labelled with the cell’s own thread tag.',
    svg: function (c) {
      var fx = A.fx(), U = unsure5f(), s = A.stage() + fx.defs; if (!U) return s; var q = U.cells[0];
      s += floor5f(fx, q) + snap5f(q, 40, 340, fx, { cls: 'pgd-in' });
      s += t(290, 372, 'saved on the shelf', { size: 15, fill: C.dim }) + t(290, 396, 'while the line waits', { size: 15, fill: C.dim });
      s += A.target('bell', '<g><path d="M760 410a40 40 0 0 1 80 0v30h-80z" fill="#c9a23a" stroke="#fff3c4" stroke-width="2"/><rect x="750" y="440" width="100" height="12" rx="4" fill="#8a6a1a"/><circle cx="800" cy="364" r="8" fill="#c9a23a"/></g>', 'ring for the checker', 800, 490, {});
      return s;
    },
    work: function (c) { var U = unsure5f(); if (!U) return []; var q = U.cells[0]; return clean([{ h: 'Cell ' + q.id }, { v: f3(q.p), k: 'its score' }, { v: f3(U.L.low) + ' ≤ ' + f3(q.p) + ' < ' + f3(U.L.high), k: 'between the gates → a person', res: true }, { v: 'cell-' + q.id, k: 'its thread tag: one per cell, so its card can be found again' }, srcTag(U.L.you), refNote(U.L.you)]); },
    on: { bell: function (c) { c.next(); } } },
  { cap: 'The checker answers on the handset',
    note: 'The checker sees the photo and the score, then answers: pass or stop. Your answer goes back into the waiting flow.',
    svg: function (c) {
      var fx = A.fx(), U = unsure5f(), s = A.stage() + fx.defs; if (!U) return s; var q = U.cells[0];
      s += floor5f(fx, q) + snap5f(q, 40, 340, fx);
      s += '<g filter="url(#' + fx.sh + ')"><rect x="600" y="190" width="320" height="330" rx="26" fill="#11171f" stroke="#3a4757" stroke-width="2"/></g><rect x="616" y="206" width="288" height="200" rx="12" fill="#04070c"/>';
      s += A.cell(q.id, 630, 218, 120, { full: true }) + t(764, 244, 'cell ' + q.id, { size: 17, w: 700, fill: '#fff' }) + t(764, 270, q.kind, { size: 15, fill: C.dim }) + t(764, 300, 'score', { size: 14, fill: C.dim }) + t(764, 326, f3(q.p), { size: 22, f: 'm', w: 700, fill: LCOL.person }) + t(764, 360, 'pass or stop?', { size: 15, fill: '#c7d4e4' });
      s += A.target('a_stop', '<rect x="616" y="420" width="136" height="56" rx="12" fill="#3a0d18" stroke="' + LCOL.stop + '" stroke-width="2.5"/>', 'answer stop', 684, 500, { inner: t(684, 455, 'STOP', { size: 20, a: 'middle', f: 'h', fill: LCOL.stop }) });
      s += A.target('a_pass', '<rect x="768" y="420" width="136" height="56" rx="12" fill="#0d3a26" stroke="' + LCOL.pass + '" stroke-width="2.5"/>', 'pass', 836, 500, { inner: t(836, 455, 'PASS', { size: 20, a: 'middle', f: 'h', fill: LCOL.pass }), cls: 'pgd-nochip' });
      return s;
    },
    work: function (c) { return [{ h: 'You are the checker' }, { t: 'Look at the photo. A crack, a dark patch, a broken finger? Then answer.' }, { t: 'The flow is still paused. Nothing moves until an answer comes.' }]; },
    on: { a_stop: function (c) { c.state.ans = 'stop'; c.next(); }, a_pass: function (c) { c.state.ans = 'pass'; c.next(); } },
    auto: function (c) { c.state.ans = 'stop'; } },
  { cap: 'The flow goes on from the same place',
    note: 'The saved card comes back with your answer. The flow continues from the person desk, not from the start: the logbook writes your answer.',
    svg: function (c) {
      var fx = A.fx(), U = unsure5f(), st = c.state, s = A.stage() + fx.defs; if (!U) return s; var q = U.cells[0];
      s += floor5f(fx, q, { done: 1, moving: 1 }) + snap5f(q, 40, 340, fx, { ans: st.ans, cls: 'pgd-pop' });
      s += '<path class="pgd-draw" style="--len:520" d="M480 410C600 410 640 330 680 330C760 330 800 250 830 180" stroke="#ffb547" stroke-width="2.5" fill="none" stroke-dasharray="6 6"/>';
      s += token(q.id, 690, 160, { s: 40, cls: 'pgd-slide' });
      s += A.glass(560, 300, 370, 150, { fx: fx, col: '#2b4157' }) + t(580, 330, 'LOGBOOK LINES OF CELL ' + q.id, { size: 14, f: 'h', fill: C.dim, ls: '.06em' });
      ['photo check: photo ok', 'model: score ' + f3(q.p), 'fork: lane person', 'person desk: a person said ' + st.ans, 'logbook: ' + st.ans].forEach(function (ln, j) { s += t(580, 356 + j * 20, (j + 1) + '. ' + ln, { size: 14, f: 'm', fill: j >= 3 ? '#ffcf6b' : '#c7d4e4', cls: j >= 3 ? 'pgd-drop' : '' }); });
      s += A.target('more', '<rect x="560" y="462" width="370" height="50" rx="12" fill="#0b121b" stroke="#ffb547" stroke-width="2.5"/>', 'the next 4 unsure cells', 745, 534 > 530 ? 528 : 534, { inner: t(745, 494, 'NEXT 4 CELLS', { size: 17, a: 'middle', f: 'h', fill: C.am }) });
      return s;
    },
    work: function (c) { var U = unsure5f(), st = c.state; if (!U) return []; var q = U.cells[0]; return [{ h: 'Your answer' }, { v: st.ans || '–', k: 'written into the saved card' }, { v: q.y ? 'defect' : 'good', k: 'what the expert label says' }, { v: (st.ans === 'stop') === (q.y === 1) ? 'agree' : 'disagree', k: 'you and the label', res: true }]; },
    on: { more: function (c) { c.next(); } } },
  { cap: 'One thread tag per cell: many cells can wait at once',
    note: 'Five unsure cells, five saved cards. Each tag finds its own card, so an answer always goes back to the right cell.',
    svg: function (c) {
      var fx = A.fx(), U = unsure5f(), st = c.state, s = A.stage() + fx.defs; if (!U) return s;
      s += t(40, 40, 'THE SHELF OF SAVED CARDS · 5 REAL UNSURE CELLS', { size: 15, f: 'h', fill: C.dim, ls: '.08em' });
      U.cells.forEach(function (q, j) {
        var x = 30 + j * 182, y = 70;
        s += A.glass(x, y, 170, 440, { fx: fx, col: '#7a5a2a' }) + A.cell(q.id, x + 15, y + 16, 140, { full: true });
        s += '<rect x="' + (x + 15) + '" y="' + (y + 170) + '" width="140" height="28" rx="5" fill="#ffb547"/>' + t(x + 85, y + 190, 'cell-' + q.id, { size: 15, a: 'middle', f: 'm', w: 700, fill: '#1a1103' });
        s += t(x + 15, y + 232, 'score ' + f3(q.p), { size: 15, f: 'm', fill: '#fff' }) + t(x + 15, y + 258, q.kind, { size: 15, fill: C.dim });
        s += t(x + 15, y + 300, 'expert label', { size: 14, fill: C.dim }) + t(x + 15, y + 324, q.y ? 'defect' : 'good', { size: 17, w: 700, fill: q.y ? '#ff8aa0' : C.gr });
        if (j === 0 && st.ans) s += t(x + 15, y + 366, 'you said ' + st.ans, { size: 15, w: 700, fill: '#ffcf6b' });
        s += t(x + 15, y + 420, j === 0 && st.ans ? 'done' : 'waiting', { size: 14, f: 'm', fill: j === 0 && st.ans ? C.gr : C.dim });
      });
      return s;
    },
    work: function (c) { var U = unsure5f(); if (!U) return []; var nd = U.cells.filter(function (q) { return q.y; }).length; return clean([{ h: 'Five paused flows' }, { v: '5', k: 'saved cards, one thread tag each' }, { v: nd + ' of 5', k: 'are real defects (expert label)' }, { t: 'Spread over the person lane: from just above the pass gate to just under the stop gate.' }, srcTag(U.L.you), refNote(U.L.you)]); } }
  ]
});

/* ============================ 5g  Run a shift ============================ */
var CK = { x: 210, y: 270, r: 150 }, HOURS = 8;
function hourAng(h) { return (-150 + 300 * h / HOURS) * Math.PI / 180; }   // 0 at lower-left, 8 at lower-right, clockwise over the top
function hourAt(p) { var a = Math.atan2(p.x - CK.x, -(p.y - CK.y)) * 180 / Math.PI; return Math.max(0, Math.min(HOURS, Math.round((a + 150) / 300 * HOURS))); }
function tipOf(h) { var a = hourAng(h); return [CK.x + (CK.r - 34) * Math.sin(a), CK.y - (CK.r - 34) * Math.cos(a)]; }
function upTo(L, W, h) {   // cumulative counts of the shift up to hour h (cells in tray order, the same per hour)
  var n = Math.floor(h * W.n / HOURS), o = { n: n, pass: 0, person: 0, stop: 0, dp: 0, gs: 0 };
  for (var i = 0; i < n; i++) { var r = W.rows[i]; o[r[0]]++; if (r[2] === 1 && r[1] === 'pass') o.dp++; if (r[2] === 0 && r[1] === 'stop') o.gs++; }
  return o;
}
function clock5g(h, fx) {
  var s = '<circle cx="' + CK.x + '" cy="' + CK.y + '" r="' + (CK.r + 10) + '" fill="url(#' + fx.mt + ')" stroke="#5d6b80" stroke-width="2"' + ' filter="url(#' + fx.sh + ')"/><circle cx="' + CK.x + '" cy="' + CK.y + '" r="' + CK.r + '" fill="#0b121b"/>';
  var a0 = hourAng(0), a1 = hourAng(h), big = (a1 - a0) > Math.PI ? 1 : 0, R = CK.r - 10;
  if (h > 0) s += '<path d="M' + (CK.x + R * Math.sin(a0)).toFixed(1) + ' ' + (CK.y - R * Math.cos(a0)).toFixed(1) + 'A' + R + ' ' + R + ' 0 ' + big + ' 1 ' + (CK.x + R * Math.sin(a1)).toFixed(1) + ' ' + (CK.y - R * Math.cos(a1)).toFixed(1) + '" stroke="#46e3ff" stroke-width="12" fill="none" stroke-opacity=".5"/>';
  for (var k = 0; k <= HOURS; k++) { var a = hourAng(k), x1 = CK.x + (CK.r - 4) * Math.sin(a), y1 = CK.y - (CK.r - 4) * Math.cos(a), x2 = CK.x + (CK.r - 18) * Math.sin(a), y2 = CK.y - (CK.r - 18) * Math.cos(a); s += '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="#c7d4e4" stroke-width="3"/>' + t(CK.x + (CK.r - 40) * Math.sin(a), CK.y - (CK.r - 40) * Math.cos(a) + 6, String(k), { size: 17, a: 'middle', f: 'm', w: 700, fill: k <= h ? '#fff' : C.dim2 }); }
  s += t(CK.x, CK.y + 46, 'SHIFT HOURS', { size: 14, a: 'middle', f: 'h', fill: C.dim, ls: '.08em' });
  return s;
}
function hand5g(h) { var p = tipOf(h); return '<g><path d="M' + CK.x + ' ' + CK.y + 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + '" stroke="#ffb547" stroke-width="7" stroke-linecap="round"/><circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="14" fill="#ffb547" stroke="#fff" stroke-width="2"/><circle cx="' + CK.x + '" cy="' + CK.y + '" r="10" fill="#c7d4e4"/></g>'; }
function bins5g(U, W, x, y) {
  var s = '', w = 150;
  ['pass', 'person', 'stop'].forEach(function (k, j) {
    var bx = x + j * (w + 14), full = W[k] || 1, fh = 150 * U[k] / Math.max(W.pass, W.person, W.stop);
    s += '<rect x="' + bx + '" y="' + y + '" width="' + w + '" height="170" rx="10" fill="#0b121b" stroke="' + LCOL[k] + '" stroke-opacity=".7" stroke-width="2"/>' + '<rect x="' + (bx + 8) + '" y="' + (y + 162 - fh).toFixed(1) + '" width="' + (w - 16) + '" height="' + fh.toFixed(1) + '" rx="5" fill="' + LCOL[k] + '" fill-opacity=".35"/>';
    s += t(bx + 12, y + 26, { pass: 'PASS', person: 'PERSON', stop: 'STOP' }[k], { size: 15, f: 'h', fill: LCOL[k], ls: '.06em' }) + '<text x="' + (bx + 12) + '" y="' + (y + 66) + '" font-family="' + A.FM + '" font-size="30" font-weight="700" fill="#fff">' + U[k] + '</text>';
    void full;
  });
  return s;
}
function log5g(L, W, h, x, y) {
  var s = A.glass(x, y, 474, 196, { col: '#2b4157' }) + t(x + 16, y + 28, 'LOGBOOK', { size: 14, f: 'h', fill: C.dim, ls: '.1em' }) + t(x + 150, y + 28, 'cells', { size: 14, a: 'end', fill: C.dim }) + t(x + 260, y + 28, 'pass · person · stop', { size: 14, a: 'middle', fill: C.dim }) + t(x + 456, y + 28, 'defects passed', { size: 14, a: 'end', fill: C.dim });
  var from = Math.max(0, h - 4);
  for (var k = from; k < h; k++) {
    var a = upTo(L, W, k), b = upTo(L, W, k + 1), yy = y + 56 + (k - from) * 32;
    s += '<g class="' + (k === h - 1 ? 'pgd-drop' : '') + '">' + t(x + 16, yy, 'hour ' + (k + 1), { size: 15, fill: '#c7d4e4' }) + t(x + 150, yy, String(b.n - a.n), { size: 15, a: 'end', f: 'm', fill: '#fff' }) + t(x + 260, yy, (b.pass - a.pass) + ' · ' + (b.person - a.person) + ' · ' + (b.stop - a.stop), { size: 15, a: 'middle', f: 'm', fill: '#fff' }) + t(x + 456, yy, String(b.dp - a.dp), { size: 15, a: 'end', f: 'm', w: 700, fill: b.dp - a.dp ? '#ff8aa0' : C.dim }) + '</g>';
  }
  if (!h) s += t(x + 16, y + 60, 'empty: turn the clock', { size: 15, fill: C.dim2 });
  return s;
}
function scene5g(c, fx, h) {
  var L = L5(), s = A.stage() + fx.defs; if (!L) return { s: s };
  var W = shift5(L), U = upTo(L, W, h);
  s += clock5g(h, fx) + bins5g(U, W, 432, 40) + log5g(L, W, h, 432, 236);
  s += A.glass(432, 446, 474, 66, { col: '#7a2a3a' }) + t(450, 486, 'defects passed with no check, so far', { size: 15, fill: C.dim }) + '<text x="888" y="492" text-anchor="end" font-family="' + A.FM + '" font-size="30" font-weight="700" fill="#ff8aa0">' + U.dp + '</text>';
  return { s: s, L: L, W: W, U: U };
}
function whatIf5g(c, fx, which) {   // the two what-if tiles over the finished shift
  var L = L5(), s = A.stage() + fx.defs, st = c.state; if (!L) return s;
  var W = shift5(L), W2 = shift5(L, { nine: true }), W3 = shift5(L, { poly: true });
  s += t(40, 40, 'THE FINISHED SHIFT · ' + W.n + ' CELLS · WHAT IF…', { size: 15, f: 'h', fill: C.dim, ls: '.08em' });
  function tile(x, title, sub, on, key, rows, flip) {
    var o = A.glass(x, 64, 440, 448, { fx: fx, col: on ? '#ffb547' : '#2b4157' }) + t(x + 22, 100, title, { size: 18, f: 'h', fill: on ? C.am : '#c7d4e4', ls: '.04em' }) + t(x + 22, 126, sub, { size: 15, fill: C.dim });
    rows.forEach(function (r, j) { var y = 176 + j * 62; o += t(x + 22, y, r[0], { size: 15, fill: C.dim }) + t(x + 22, y + 30, r[1], { size: 22, f: 'm', w: 700, fill: '#8d9bb0' }) + (on ? '<g class="pgd-flip">' + t(x + 200, y + 30, '→  ' + r[2], { size: 22, f: 'm', w: 700, fill: r[3] || '#fff' }) + '</g>' : ''); });
    return o + (flip ? A.target(key, '<rect x="' + (x + 120) + '" y="420" width="200" height="56" rx="28" fill="#0b121b" stroke="#ffb547" stroke-width="2.5"/>', 'flip this tile', x + 220, 500, { inner: t(x + 220, 455, 'WHAT IF?', { size: 17, a: 'middle', f: 'h', fill: C.am }) }) : '');
  }
  s += tile(28, 'CHECKER RIGHT 9 IN 10', 'a real person is not perfect', st.nine, 'nine', [['defects passed', W.dp + ' of ' + W.def, W2.dp + ' of ' + W2.def, '#ff8aa0'], ['good cells stopped', String(W.gs), String(W2.gs), '#ffcf6b'], ['person answers wrong', String(W.pw), W2.pw + ' of ' + W2.person, '#ffcf6b'], ['lanes (pass · person · stop)', W.pass + ' · ' + W.person + ' · ' + W.stop, 'the same']], which === 'nine');
  s += tile(492, 'A SEPARATE POLY GATE', 'poly let more defects slip (4e)', st.poly, 'poly', [['poly pass gate', f3(L.low), f3(W3.lowP), '#3dffa0'], ['defects passed', W.dp + ' of ' + W.def, W3.dp + ' of ' + W3.def, '#3dffa0'], ['poly defects passed', W.pdp + ' of ' + W.pdef, W3.pdp + ' of ' + W3.pdef, '#3dffa0'], ['to a person', String(W.person), String(W3.person), '#ffcf6b']], which === 'poly');
  return s;
}
D.register('5g', {
  init: function () { return { h: 0 }; },
  frames: [
  { cap: 'Turn the shift clock: hour by hour the line fills',
    note: 'Every validation cell goes through the finished line, in tray order, like one shift of 8 hours. A perfect checker answers the person lane.',
    svg: function (c) {
      var fx = A.fx(), st = c.state, S = scene5g(c, fx, st.h); if (!S.L) return S.s;
      var p = tipOf(st.h), q = tipOf(HOURS);
      return S.s + A.target('hand', hand5g(st.h), 'turn the clock hand', CK.x, CK.y + 196, { kind: 'drag', to: snapTo(p[0], p[1], q[0], q[1], 12) });
    },
    work: function (c) {
      var L = L5(); if (!L) return []; var W = shift5(L), U = upTo(L, W, c.state.h);
      return clean([{ h: 'After ' + c.state.h + ' of 8 hours' }, { v: U.n + ' of ' + W.n, k: 'cells through the line' }, { v: U.pass + ' · ' + U.person + ' · ' + U.stop, k: 'pass · person · stop' }, { v: String(U.dp), k: 'defects passed with no check', res: true }, { v: String(U.gs), k: 'good cells stopped' }, srcTag(L.you), refNote(L.you)]);
    },
    bind: function (c, root) {
      var st = c.state, el = root.querySelector('[data-pgd-t=hand]'), p0 = tipOf(st.h); if (!el) return;
      var fx = A.fx();
      D.onDrag(root, el, { start: { x: p0[0], y: p0[1] }, step: 12,
        move: function (p) {
          var h = hourAt(p); el.querySelector('.pgd-ring').innerHTML = hand5g(h);
          if (h !== st.h) { st.h = h; var S = scene5g(c, fx, h); root.querySelectorAll('.pgd-live5g').forEach(function (n) { n.remove(); }); var g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'pgd-live5g'); g.innerHTML = S.s; root.insertBefore(g, el); c.rework(); }
        },
        drop: function () { if (st.h >= HOURS) c.next(); } });
    },
    auto: function (c) { c.state.h = HOURS; } },
  { cap: 'What if the checker is right only 9 times in 10?',
    note: 'The lanes stay the same: the gates did not change. But wrong answers at the person desk let more defects pass and stop more good cells.',
    svg: function (c) { return whatIf5g(c, A.fx(), 'nine'); },
    work: function (c) { var L = L5(); if (!L) return []; var W = shift5(L), W2 = shift5(L, { nine: true }); return clean([{ h: 'Perfect checker' }, { v: W.dp + ' ÷ ' + W.def + ' = ' + p1(W.dp / W.def), k: 'defects passed' }, { h: 'Right 9 in 10' }, { v: W2.dp + ' ÷ ' + W2.def + ' = ' + p1(W2.dp / W2.def), k: 'defects passed', res: true }, { v: '≈ 1 in 10 of ' + W2.person, k: 'person answers flipped: ' + W2.pw }, srcTag(L.you), refNote(L.you)]); },
    on: { nine: function (c) { c.state.nine = 1; c.next(); } }, auto: function (c) { c.state.nine = 1; } },
  { cap: 'What if poly cells get their own pass gate?',
    note: 'The poly pass gate uses the 3g rule on poly defects only. Fewer poly defects slip through, and a few more cells go to a person.',
    svg: function (c) { return whatIf5g(c, A.fx(), 'poly'); },
    work: function (c) { var L = L5(); if (!L) return []; var W = shift5(L), W3 = shift5(L, { poly: true }); return clean([{ h: 'Poly pass gate' }, { t: 'Sort the poly defects by score. At most 5 of every 100 may sit below the gate.' }, { v: f3(W3.lowP), k: 'poly pass gate (others keep ' + f3(L.low) + ')' }, { op: '=', v: W3.dp + ' of ' + W3.def + ' = ' + p1(W3.dp / W3.def), k: 'defects passed', res: true }, srcTag(L.you), refNote(L.you)]); },
    on: { poly: function (c) { c.state.poly = 1; c.next(); } }, auto: function (c) { c.state.poly = 1; } },
  { cap: 'One shift, three ways',
    note: 'The same 525 cells: the line as built, with a real (imperfect) checker, and with a separate poly gate. Every number is counted from the logbook rows.',
    svg: function (c) {
      var fx = A.fx(), L = L5(), s = A.stage() + fx.defs; if (!L) return s;
      var R = [['as built (perfect checker)', shift5(L)], ['checker right 9 in 10', shift5(L, { nine: true })], ['separate poly gate', shift5(L, { poly: true })]];
      s += t(40, 40, 'ONE SHIFT · ' + R[0][1].n + ' VALIDATION CELLS', { size: 15, f: 'h', fill: C.dim, ls: '.08em' });
      var cols = ['pass', 'person', 'stop', 'defects', 'good cells'], cx5 = [400, 490, 580, 710, 850];
      cols.forEach(function (h, k) { s += t(cx5[k], k < 3 ? 92 : 80, h, { size: 15, a: 'middle', fill: k < 3 ? LCOL[h] : C.dim }) + (k >= 3 ? t(cx5[k], 100, k === 3 ? 'passed' : 'stopped', { size: 15, a: 'middle', fill: C.dim }) : ''); });
      R.forEach(function (r, j) {
        var W = r[1], y = 150 + j * 110; s += A.glass(28, y - 44, 904, 92, { fx: fx, col: j ? '#ffb547' : '#2b4157' }) + t(48, y + 8, r[0], { size: 18, w: 700, fill: '#fff' });
        [W.pass, W.person, W.stop, W.dp + ' of ' + W.def, W.gs].forEach(function (v, k) { s += t(cx5[k], y + 10, String(v), { size: 20, a: 'middle', f: 'm', w: 700, fill: k === 3 ? '#ff8aa0' : '#fff' }); });
      });
      var T = F5().twin; if (T && !L.you) s += t(40, 500, 'Same counts in the Python LangGraph twin (' + (F5().lgVersion || '') + '): ' + T.shift1[3] + ', ' + T.shift2[3] + ', ' + T.shift3[3] + ' defects passed.', { size: 15, fill: C.dim });
      return s;
    },
    work: function (c) { var L = L5(); if (!L) return []; var a = shift5(L), b = shift5(L, { nine: true }), d = shift5(L, { poly: true }); return clean([{ h: 'Defects passed per 100' }, { v: p1(a.dp / a.def), k: 'as built' }, { v: p1(b.dp / b.def), k: 'checker right 9 in 10' }, { v: p1(d.dp / d.def), k: 'separate poly gate', res: true }, { t: 'Gates are tuned on this same tray, so these numbers are a little hopeful. Step 8 tests once on sealed cells.' }, srcTag(L.you), refNote(L.you)]); } }
  ]
});

})();
