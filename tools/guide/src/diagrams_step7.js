/* PanelGuard Diagram guide — Step 7 diagrams (7a 7b 7c 7d 7e 7f 7g). Uses window.PGD (engine.js).
   The operator console drawn as a real HMI: lamp, photo, queue, counters, shift board, report outbox, fault panel.
   Numbers: the student's own run when that substep passed ("your value"), else real reference facts (facts.json s7, made by
   tools/guide/facts67.py from the lab's own code and logbook and the Python Gradio twin's real run).
   Locks: no code-gap text is written (no lamp field names, no counter key, no resume option, no check field);
   7e's manager questions stay hidden until its prediction is answered (worked examples with other questions until then);
   7g shows only what the operator SEES before vs after the fix, never which code lines fix it. */
(function () {
'use strict';
var D = window.PGD, A = D.art, C = A.COL, t = A.t, fmt = D.fmt;
var F7 = function () { return (window.PGD_FACTS || {}).s7 || {}; };
function clean(a) { return a.filter(function (r) { return r; }); }
function srcTag(you) { return { tag: you ? 'your value' : 'typical value' }; }
function snapTo(sx, sy, dx, dy, step) { return (sx + Math.round((dx - sx) / step) * step) + ',' + (sy + Math.round((dy - sy) / step) * step); }
var LC = { pass: '#2ee07a', person: '#ffb21e', stop: '#ff5050', none: '#a3afbf' }, LW = { pass: 'PASS', person: 'CHECK', stop: 'STOP', none: 'NO VERDICT' };
function shape(k, cx, cy, r, o) {   // the lamp shapes of the lab: circle, triangle, square, dashed ring
  o = o || {}; var col = o.col || LC[k], f = o.hollow ? 'none' : col;
  if (k === 'pass') return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '" stroke="' + col + '" stroke-width="3"/>';
  if (k === 'person') return '<path d="M' + cx + ' ' + (cy - r) + 'L' + (cx + r * 1.05) + ' ' + (cy + r * .85) + 'H' + (cx - r * 1.05) + 'Z" fill="' + f + '" stroke="' + col + '" stroke-width="3"/>';
  if (k === 'stop') return '<rect x="' + (cx - r * .85) + '" y="' + (cy - r * .85) + '" width="' + (r * 1.7) + '" height="' + (r * 1.7) + '" fill="' + f + '" stroke="' + col + '" stroke-width="3"/>';
  return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * .85) + '" fill="none" stroke="' + col + '" stroke-width="' + Math.max(3, r * .22) + '" stroke-dasharray="' + (r * .32) + ' ' + (r * .24) + '"/>';
}
function lampBox(k, x, y, w, h, o) {   // the lab's lamp: border in its colour, shape over word
  o = o || {}; var col = LC[k], s = '';
  s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="#0a0f15" stroke="' + col + '" stroke-width="' + (o.bw || 5) + '"' + (k === 'none' ? ' stroke-dasharray="14 8"' : '') + '/>';
  if (o.glow) s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="' + col + '" opacity=".1"/>';
  var r = Math.min(w, h) * (o.sr || .2);
  s += shape(k, x + w / 2, y + h * .36, r) + t(x + w / 2, y + h * .8, LW[k], { size: o.fs || Math.max(14, Math.min(h * .2, w / (LW[k].length * .7))), a: 'middle', f: 'b', w: 700, fill: col });
  return s;
}
function gray(id) { return '<filter id="' + id + '"><feColorMatrix type="saturate" values="0"/></filter>'; }
function cellId(c) { return c; }

/* ============================ shared: the console as a real HMI ============================ */
/* o: {lamp, photo (cell id), counters {pass,person,stop,none,total,byPerson}, queue (n), qid, state, speed, blur {block: px}} */
function hmi(x, y, w, h, fx, o) {
  o = o || {}; var s = '', u = w / 64, bl = o.blur || {};
  function B(k) { return bl[k] ? ' filter="url(#' + bl[k] + ')" opacity="' + (bl.op || .55) + '"' : ''; }
  s += '<rect x="' + (x - 12) + '" y="' + (y - 12) + '" width="' + (w + 24) + '" height="' + (h + 34) + '" rx="14" fill="#1a2028" stroke="#3a4757" stroke-width="2"' + (fx ? ' filter="url(#' + fx.sh + ')"' : '') + '/>';
  s += '<rect x="' + (w / 2 + x - 50) + '" y="' + (y + h + 22) + '" width="100" height="16" rx="4" fill="#2a3340"/>';
  s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="#0a0e13"/>';
  var hh = h * .11, fh = h * .14, top = y + 6, gx = x + 6, gw = w - 12;
  s += '<rect x="' + gx + '" y="' + top + '" width="' + gw + '" height="' + hh + '" rx="5" fill="#101820" stroke="#243040"/>';
  s += '<g' + B('station') + '>' + t(gx + 10, top + hh * .66, 'PANELGUARD · EL STATION 1', { size: Math.max(14, hh * .42), f: 'b', w: 700, fill: '#c3cdd9', ls: '.04em' }) + '</g>';
  var C0 = o.counters || { pass: 0, person: 0, stop: 0, none: 0, total: 0 }, cx0 = gx + gw * .47;
  s += '<g' + B('counters') + '>' + ['pass', 'person', 'stop', 'none'].map(function (k, i) { var xx = cx0 + i * gw * .08; return shape(k, xx, top + hh / 2, hh * .2) + t(xx + hh * .32, top + hh * .66, String(C0[k] || 0), { size: Math.max(14, hh * .42), f: 'm', fill: '#fff' }); }).join('') + '</g>';
  s += '<g' + B('state') + '>' + t(gx + gw - 10, top + hh * .66, o.state || 'LINE RUNNING', { size: Math.max(14, hh * .44), a: 'end', w: 700, fill: o.state === 'LINE STOPPED' ? LC.stop : LC.pass }) + '</g>';
  var my = top + hh + 6, mh = h - hh - fh - 24, mw = gw * .6;
  s += '<rect x="' + gx + '" y="' + my + '" width="' + mw + '" height="' + mh + '" rx="6" fill="#0e141b" stroke="#263240"/>';
  var ps = Math.min(mh - 16, mw * .46);
  if (o.photo != null) s += A.cell(o.photo, gx + 8, my + 8, ps, { full: true }); else s += '<rect x="' + (gx + 8) + '" y="' + (my + 8) + '" width="' + ps + '" height="' + ps + '" fill="#000" stroke="#33414f"/>' + t(gx + 8 + ps / 2, my + 8 + ps / 2, o.nophoto || 'NO PHOTO', { size: Math.max(14, ps * .1), a: 'middle', w: 700, fill: '#9aa6b6' });
  s += '<g class="' + (o.lampCls || '') + '">' + lampBox(o.lamp || 'none', gx + ps + 18, my + 8, mw - ps - 26, mh - 16, { bw: Math.max(3, u * .35), glow: true }) + '</g>';
  var sx = gx + mw + 8, sw = gw - mw - 8;
  s += '<rect x="' + sx + '" y="' + my + '" width="' + sw + '" height="' + mh + '" rx="6" fill="#0e141b" stroke="#263240"/>';
  s += '<g' + B('qhead') + '>' + t(sx + 10, my + mh * .14, o.queue ? 'QUEUE · ' + o.queue + ' waiting' : 'QUEUE · no cells waiting', { size: Math.max(14, mh * .07), w: 700, fill: '#c3cdd9' }) + '</g>';
  var qs = Math.min(sw * .5, mh * .42);
  if (o.qid != null && o.queue) s += A.cell(o.qid, sx + 10, my + mh * .22, qs, {}); else s += '<rect x="' + (sx + 10) + '" y="' + (my + mh * .22) + '" width="' + qs + '" height="' + qs + '" fill="#000" stroke="#33414f"/>';
  s += '<g' + B('qbtn') + '>' + [['pass', '● PASS'], ['stop', '■ STOP']].map(function (b, i) { var bx = sx + 10 + i * (sw - 20) / 2, by = my + mh * .74; return '<rect x="' + bx + '" y="' + by + '" width="' + ((sw - 30) / 2) + '" height="' + (mh * .18) + '" rx="5" fill="#141c26" stroke="' + LC[b[0]] + '" stroke-width="2"' + (o.queue ? '' : ' opacity=".35"') + '/>' + t(bx + (sw - 30) / 4, by + mh * .12, b[1], { size: Math.max(14, mh * .07), a: 'middle', w: 700, fill: LC[b[0]] }); }).join('') + '</g>';
  var fy = y + h - fh - 6;
  s += '<rect x="' + gx + '" y="' + fy + '" width="' + gw + '" height="' + fh + '" rx="5" fill="#101820" stroke="#243040"/>';
  s += '<g' + B('buttons') + '>' + [['pass', '▶ START LINE'], ['stop', '■ STOP LINE']].map(function (b, i) { var bx = gx + 8 + i * gw * .22; return '<rect x="' + bx + '" y="' + (fy + fh * .15) + '" width="' + (gw * .2) + '" height="' + (fh * .7) + '" rx="5" fill="#141c26" stroke="' + LC[b[0]] + '" stroke-width="2"/>' + t(bx + gw * .1, fy + fh * .62, b[1], { size: Math.max(14, fh * .3), a: 'middle', w: 700, fill: LC[b[0]] }); }).join('') + '</g>';
  s += '<g' + B('speed') + '>' + t(gx + gw * .47, fy + fh * .62, (o.speed || 30) + ' cells / min', { size: Math.max(14, fh * .28), fill: '#c3cdd9' }) + '</g>';
  s += '<g' + B('tabs') + '>' + ['SHIFT BOARD', 'REPORT'].map(function (b, i) { var bx = gx + gw * (.655 + i * .17); return '<rect x="' + bx + '" y="' + (fy + fh * .2) + '" width="' + (gw * .16) + '" height="' + (fh * .6) + '" rx="5" fill="#1a2430" stroke="#3a4a5c"/>' + t(bx + gw * .08, fy + fh * .6, b, { size: Math.max(14, fh * .25), a: 'middle', w: 700, fill: '#e9eff6' }); }).join('') + '</g>';
  return s;
}

/* ============================ 7a  Sketch the screen ============================ */
var DIST7A = [0.5, 1, 2], FLOOR7A = { x0: 120, px: 230 };   // floor: monitor at x0, 1 m = px
function blurFor(d) { var B = F7().blocks || [], o = {}; B.forEach(function (b) { if (b.m < d) o[b.k] = 'bl7a'; }); if (o.qbtn) o.tabs = 'bl7a'; return o; }
function scene7a(c, fx, di) {
  var d = DIST7A[di], s = A.stage({ floor: 392 }) + fx.defs + '<defs><filter id="bl7a" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="' + (2.2 + di * 1.6) + '"/></filter></defs>';
  s += hmi(40, 30, 560, 315, fx, { lamp: 'pass', photo: 2567, counters: { pass: 12, person: 14, stop: 4, none: 0, total: 30 }, queue: 14, qid: 986, blur: blurFor(d), lampCls: '' });
  /* the side view: monitor, floor marks, the operator */
  var fy = 470, X = function (m) { return FLOOR7A.x0 + m * FLOOR7A.px; };
  s += '<rect x="20" y="' + (fy + 4) + '' + '" width="600" height="6" fill="#1e3a52"/><rect x="' + (FLOOR7A.x0 - 26) + '" y="' + (fy - 70) + '" width="12" height="70" fill="#3a4757"/><rect x="' + (FLOOR7A.x0 - 34) + '" y="' + (fy - 110) + '" width="10" height="56" rx="2" fill="#46e3ff" opacity=".7"/>';
  var ox = X(d), eye = fy - 92;
  s += '<path d="M' + (FLOOR7A.x0 - 24) + ' ' + (fy - 82) + 'L' + (ox - 14) + ' ' + eye + '" stroke="#ffd36b" stroke-width="2" stroke-dasharray="6 5"/>';
  s += '<g class="pgd-slide"><circle cx="' + ox + '" cy="' + (eye) + '" r="13" fill="#d9c4a8"/><path d="M' + (ox - 16) + ' ' + (fy - 2) + 'v-62a16 16 0 0 1 32 0v62z" fill="#46e3ff" fill-opacity=".8"/></g>';
  return { s: s, X: X, fy: fy };
}
function table7a(fx, d, x, y) {
  var B = F7().blocks || [], s = A.glass(x, y, 312, 480, { fx: fx, col: '#2b4760' }) + t(x + 16, y + 30, 'READS FROM ' + d + ' m?', { size: 15, f: 'h', fill: '#c7d4e4', ls: '.06em' });
  s += t(x + 16, y + 56, 'block', { size: 14, fill: C.dim }) + t(x + 232, y + 56, 'letters', { size: 14, a: 'end', fill: C.dim }) + t(x + 290, y + 56, 'up to', { size: 14, a: 'end', fill: C.dim });
  B.forEach(function (b, i) { var yy = y + 90 + i * 46, ok = b.m >= d; s += '<rect x="' + (x + 8) + '" y="' + (yy - 24) + '" width="296" height="38" rx="6" fill="' + (ok ? '#2ee07a' : '#ff5050') + '" fill-opacity=".08"/>' + t(x + 16, yy, (ok ? '✓ ' : '✗ ') + b.name, { size: 14, w: 700, fill: ok ? '#9ff5c4' : '#ff9aa8' }) + t(x + 232, yy, Math.round(b.px) + ' px', { size: 14, a: 'end', f: 'm', fill: '#c7d4e4' }) + t(x + 290, yy, b.m.toFixed(1) + ' m', { size: 15, a: 'end', f: 'm', w: 700, fill: ok ? '#2ee07a' : '#ff5050' }); });
  return s;
}
function frame7a(di) {
  var d = DIST7A[di];
  return { cap: ['From 0.5 m (the chair at the desk): everything reads', 'Step back to 1 m: the small counters go soft', 'From 2 m (walking past): only the verdict reads'][di],
    note: 'Each text block reads up to a distance set by its letter size. The verdict word is by far the biggest, so it reads from across the cell.',
    svg: function (c) {
      var fx = A.fx(), S = scene7a(c, fx, di), s = S.s + table7a(fx, d, 628, 30);
      DIST7A.forEach(function (m, j) { var x = S.X(m); s += '<path d="M' + x + ' ' + (S.fy + 4) + 'v14" stroke="' + (j === di ? '#ffb547' : '#5d6b80') + '" stroke-width="3"/>' + t(x, S.fy + 36, m + ' m', { size: 15, a: 'middle', f: 'm', w: 700, fill: j === di ? '#ffb547' : C.dim }); });
      if (di < 2) { var nx = S.X(DIST7A[di + 1]); s += A.target('mark', '<g><rect x="' + (nx - 30) + '" y="' + (S.fy - 34) + '" width="60" height="52" fill="#000" opacity="0"/><ellipse cx="' + nx + '" cy="' + (S.fy + 6) + '" rx="26" ry="9" fill="#ffb547" opacity=".35"/><path d="M' + (nx - 9) + ' ' + (S.fy - 26) + 'h18l-9 16z" fill="#ffb547"/></g>', 'step back to ' + DIST7A[di + 1] + ' m', Math.min(500, nx), S.fy - 48, {}); }
      else s += A.target('mark', '<rect x="211" y="80" width="160" height="204" rx="8" fill="none" stroke="#ffb547" stroke-width="3" stroke-dasharray="7 5"/>', 'measure the verdict word', 300, 372, {});
      return s;
    },
    work: function () { var B = F7().blocks || [], ok = B.filter(function (b) { return b.m >= d; }); return [{ h: 'At ' + d + ' m' }, { v: ok.length + ' of ' + B.length, k: 'text blocks still read' }, { t: 'Rule used: a letter reads when it fills about 20 arc-minutes of the eye (the lab’s own rule). Sizes: the lab’s console CSS on a 24-inch 1920 × 1080 screen.' }, { tag: 'typical value' }]; },
    on: { mark: function (c) { c.next(); } } };
}
D.register('7a', {
  init: function () { return {}; },
  frames: [frame7a(0), frame7a(1), frame7a(2),
  { cap: 'Why the verdict is so big: the reading-distance arithmetic',
    note: 'Letter height in mm from the pixel size, then the distance at which that letter still fills 20 arc-minutes.',
    svg: function (c) {
      var fx = A.fx(), F = F7(), L = (F.blocks || [])[0] || {}, s = A.stage() + fx.defs;
      s += hmi(40, 30, 560, 315, fx, { lamp: 'pass', photo: 2567, counters: { pass: 12, person: 14, stop: 4, none: 0, total: 30 }, queue: 14, qid: 986, lampCls: 'pgd-pop' });
      s += '<path d="M209 213v29M203 213h12M203 242h12" stroke="#ffb547" stroke-width="3"/><rect x="94" y="208" width="104" height="38" rx="6" fill="#0b121b" stroke="#ffb547"/>' + t(146, 234, L.capMm + ' mm', { size: 18, a: 'middle', f: 'm', w: 700, fill: '#ffb547' });
      s += A.glass(628, 30, 312, 480, { fx: fx, col: '#2b4760' }) + t(646, 62, 'THE VERDICT WORD', { size: 15, f: 'h', fill: '#c7d4e4', ls: '.06em' });
      [['font size', L.px + ' px'], ['× mm per px', String(F.mmPerPx)], ['× capital / font', '0.7'], ['= letter height', L.capMm + ' mm'], ['need at 2 m', F.cap2m + ' mm'], ['reads up to', (L.m || 0).toFixed(1) + ' m']].forEach(function (r, i) { var y = 106 + i * 54; s += t(646, y, r[0], { size: 16, fill: '#c7d4e4' }) + t(922, y, r[1], { size: 20, a: 'end', f: 'm', w: 700, fill: i === 5 ? '#2ee07a' : i === 3 ? '#ffb547' : '#fff' }); });
      s += t(646, 450, 'every other text: ≤ ' + Math.max.apply(null, (F.blocks || []).slice(1).map(function (b) { return b.m; })).toFixed(1) + ' m', { size: 16, fill: C.dim });
      s += A.glass(40, 392, 560, 118, { fx: fx, col: '#2b4157' }) + t(60, 424, 'Biggest thing on the screen = the answer the operator needs.', { size: 16, fill: '#dbe6f2' }) + t(60, 452, 'Counters, score and queue are for later, or on demand.', { size: 16, fill: '#dbe6f2' }) + t(60, 486, 'Screen: 24-inch, 1920 × 1080 (an assumption of the lab).', { size: 15, fill: C.dim });
      return s;
    },
    work: function () { var F = F7(), L = (F.blocks || [])[0] || {}; return [{ h: 'Verdict word (full console)' }, { v: L.em + ' em × ' + F.u + ' px', k: 'CSS size × the console unit' }, { op: '=', v: L.px + ' px', k: 'font size' }, { op: '×', v: '0.7 × ' + F.mmPerPx + ' mm', k: 'capital height per px' }, { op: '=', v: L.capMm + ' mm', k: 'letter height', res: true }, { op: '÷', v: F.cap2m + ' mm', k: 'needed at 2 m (20 arc-minutes)' }, { op: '→', v: '× 2 m = ' + (L.m || 0).toFixed(1) + ' m', k: 'reads up to', res: true, col: '#2ee07a' }, { tag: 'typical value' }]; } }
  ]
});

/* ============================ 7b  Show one cell ============================ */
var TIER7B = ['stop', 'person', 'pass', 'none'];
function tower(x, y, lit, gr) {   // a stack light: 4 tiers on a pole
  var s = '<g' + (gr ? ' filter="url(#gr7b)"' : '') + '><rect x="' + (x - 8) + '" y="' + (y + 300) + '" width="16" height="130" fill="#5d6b80"/><rect x="' + (x - 46) + '" y="' + (y + 424) + '" width="92" height="14" rx="4" fill="#3a4757"/>';
  TIER7B.forEach(function (k, i) {
    var ty = y + i * 74, on = lit === k, col = LC[k];
    if (on) s += '<ellipse cx="' + x + '" cy="' + (ty + 36) + '" rx="90" ry="54" fill="' + col + '" opacity=".22"/>';
    s += '<rect x="' + (x - 44) + '" y="' + ty + '" width="88" height="70" rx="8" fill="' + col + '" fill-opacity="' + (on ? .92 : .14) + '" stroke="' + col + '" stroke-opacity=".8" stroke-width="2"/><rect x="' + (x - 44) + '" y="' + (ty + 70) + '" width="88" height="4" fill="#1a2028"/>';
    s += shape(k, x, ty + 35, 16, { col: on ? '#0b121b' : col, hollow: k === 'none' });
  });
  return s + '<rect x="' + (x - 48) + '" y="' + (y - 14) + '" width="96" height="14" rx="5" fill="#3a4757"/></g>';
}
function cards7b() {
  var B = (F7().belt || {}).cells || [], pick = function (l) { return B.filter(function (q) { return q[2] === l; })[0]; };
  var a = pick('pass'), b = pick('person'), c = pick('stop');
  return [{ key: 'pass', id: a[0], p: a[3], say: 'pass' }, { key: 'person', id: b[0], p: b[3], say: 'paused for a person' }, { key: 'stop', id: c[0], p: c[3], say: 'stop' }];
}
var ODD7B = [{ key: 'person', id: 2567, say: 'camera fault: lens cap on', sub: 'photo check failed → paused', cam: 1 }, { key: 'none', say: 'nothing came back' }, { key: 'none', say: 'flow error: camera PC lost' }, { key: 'none', say: 'unknown answer: banana' }];
function card7b(q, x, y, o) {
  o = o || {}; var s = '<g' + (o.cls ? ' class="' + o.cls + '"' : '') + '><rect x="' + x + '" y="' + y + '" width="250" height="64" rx="8" fill="#121a24" stroke="#3a4757"/>';
  if (q.id != null) s += A.cell(q.id, x + 8, y + 8, 48, q.cam ? { op: .06 } : {});
  else s += '<rect x="' + (x + 8) + '" y="' + (y + 8) + '" width="48" height="48" fill="#05080d" stroke="#3a4757" stroke-dasharray="4 3"/>' + t(x + 32, y + 38, '?', { size: 20, a: 'middle', fill: '#5d6b80' });
  s += t(x + 66, y + 26, q.id != null && !q.cam ? 'cell ' + q.id + (q.p != null ? ' · ' + q.p.toFixed(3) : '') : q.cam ? 'cell ' + q.id + ' (spoiled copy F1)' : 'no cell data', { size: 14, f: 'm', fill: '#c7d4e4' }) + t(x + 66, y + 48, 'flow: ' + q.say, { size: 15, w: 700, fill: '#fff' });
  return s + '</g>';
}
function frame7b(set, cap, note) {
  return { cap: cap, note: note,
    svg: function (c) {
      var fx = A.fx(), s = A.stage({ floor: 470 }) + fx.defs, Q = set === 0 ? cards7b() : ODD7B, done = c.state.fed[set], last = done.length ? Q[done[done.length - 1]] : null;
      s += tower(560, 30, last && last.key) + '<rect x="400" y="200" width="90" height="70" rx="10" fill="url(#' + fx.mt + ')" stroke="#5d6b80"/>' + t(445, 290, 'INPUT', { size: 14, a: 'middle', f: 'h', fill: C.dim }) + '<path d="M490 236H512" stroke="#5d6b80" stroke-width="6"/>';
      s += '<g class="pgd-pop">' + lampBox(last ? last.key : 'none', 660, 140, 270, 210, { glow: !!last }) + '</g>' + t(795, 380, last ? 'lamp for: ' + last.say : 'nothing fed yet', { size: 15, a: 'middle', fill: C.dim });
      if (last && last.id != null && !last.cam) s += A.cell(last.id, 660, 400, 100, { full: true }) + t(772, 440, 'the real photo', { size: 14, fill: C.dim });
      var nx = Q.map(function (q, i) { return i; }).filter(function (i) { return done.indexOf(i) < 0; })[0];
      Q.forEach(function (q, i) { if (done.indexOf(i) >= 0 || i === nx) return; var y = 40 + i * 84; s += card7b(q, 30, y); });
      if (nx != null) { var yy = 40 + nx * 84; s += A.target('card', card7b(Q[nx], 30, yy) + '<rect x="30" y="' + yy + '" width="250" height="64" rx="8" fill="none" stroke="#ffb547" stroke-width="3"/>', 'feed it in', 296, yy + 36, { kind: 'drag', la: 'start', cls: 'pgd-solid', to: snapTo(155, yy + 32, 445, 235, 16) }); }
      return s;
    },
    work: function (c) {
      var Q = set === 0 ? cards7b() : ODD7B, r = [{ h: set === 0 ? 'Real cells → lamp' : 'Broken answers → lamp' }];
      c.state.fed[set].forEach(function (i) { var q = Q[i]; r.push({ v: LW[q.key], k: q.say, col: LC[q.key] }); });
      r.push({ t: set === 0 ? 'Each lamp has its own WORD, its own SHAPE and its own colour.' : 'Unknown, missing or broken is never PASS: it is NO VERDICT, and a person looks. A camera fault pauses the flow: CHECK.' });
      if (set === 1) r.push({ t: 'The Python twin gave the same: all 4 odd answers → NO VERDICT, the camera fault → CHECK.' });
      return r.concat([{ tag: 'typical value' }]);
    },
    bind: function (c, root) {
      var Q = set === 0 ? cards7b() : ODD7B, done = c.state.fed[set], nx = Q.map(function (q, i) { return i; }).filter(function (i) { return done.indexOf(i) < 0; })[0]; if (nx == null) return;
      var yy = 40 + nx * 84, el = root.querySelector('[data-pgd-t=card]');
      D.onDrag(root, el, { start: { x: 155, y: yy + 32 }, step: 16, move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - 155) + ' ' + (p.y - yy - 32) + ')'); },
        drop: function (p) { if (p.x > 330 && p.x < 560 && Math.abs(p.y - 235) < 110) { done.push(nx); if (done.length >= Q.length) c.next(); else c.redraw(true); } else el.removeAttribute('transform'); } });
    },
    auto: function (c) { c.state.fed[set] = (set === 0 ? cards7b() : ODD7B).map(function (q, i) { return i; }); } };
}
D.register('7b', {
  init: function () { return { fed: [[], []] }; },
  frames: [
    frame7b(0, 'Feed the tower real cells: one lamp each', 'The lamp follows the answer the flow wrote for that cell: pass, a person, or stop.'),
    frame7b(1, 'Now feed it broken answers: the safe default', 'A spoiled photo pauses for a person (CHECK). Nothing, an error or an unknown answer finds no lamp: NO VERDICT.'),
  { cap: 'Take the colour away: does it still read?',
    note: 'About 1 man in 12 cannot tell red from green. Word + shape carry the meaning without colour.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage({ floor: 470 }) + fx.defs + '<defs>' + gray('gr7b') + '</defs>', g = c.state.gray;
      s += tower(150, 30, 'stop', g);
      ['pass', 'person', 'stop', 'none'].forEach(function (k, i) { s += '<g' + (g ? ' filter="url(#gr7b)"' : '') + '>' + lampBox(k, 300 + (i % 2) * 300, 30 + Math.floor(i / 2) * 230, 280, 200, {}) + '</g>'; });
      if (!g) s += A.target('gray', '<g><rect x="40" y="476" width="150" height="50" rx="25" fill="#121a24" stroke="#ffb547" stroke-width="2"/><circle cx="68" cy="501" r="18" fill="#ffb547"/>' + t(124, 508, 'COLOUR', { size: 15, a: 'middle', f: 'h', fill: '#ffb547' }) + '</g>', 'switch colour off', 330, 500, {});
      return s;
    },
    work: function () { return [{ h: 'Four lamps, four ways to tell them apart' }, { v: 'PASS ● · CHECK ▲ · STOP ■', k: 'word + shape' }, { v: 'NO VERDICT ◌', k: 'a dashed ring: “nothing to trust”' }, { t: 'Never colour alone.' }]; },
    on: { gray: function (c) { c.state.gray = 1; c.next(); } }, auto: function (c) { c.state.gray = 1; } },
  { cap: 'Without colour, word and shape still say it',
    note: 'Grey only: every lamp still reads. In the lab’s cell view the lamp word is 126 px on a 1920 × 1080 screen: readable from about 4.2 m.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage({ floor: 470 }) + fx.defs + '<defs>' + gray('gr7b') + '</defs>', L = F7().lampCell || {};
      s += tower(150, 30, 'stop', true);
      ['pass', 'person', 'stop', 'none'].forEach(function (k, i) { s += '<g filter="url(#gr7b)" class="pgd-seq" style="animation-delay:' + i * .1 + 's">' + lampBox(k, 300 + (i % 2) * 300, 30 + Math.floor(i / 2) * 230, 280, 200, {}) + '</g>'; });
      s += t(300, 500, 'lamp word ' + Math.round(L.px || 0) + ' px → letters ' + L.capMm + ' mm → reads up to ' + (L.m || 0).toFixed(1) + ' m', { size: 17, f: 'm', w: 700, fill: '#c7d4e4' });
      return s;
    },
    work: function () { var L = F7().lampCell || {}; return [{ h: 'The lab’s cell view' }, { v: Math.round(L.px || 0) + ' px', k: 'lamp word on 1920 × 1080' }, { op: '=', v: L.capMm + ' mm', k: 'letter height (24-inch screen)' }, { op: '→', v: (L.m || 0).toFixed(1) + ' m', k: 'reads up to (20 arc-minutes)', res: true }, { tag: 'typical value' }]; } }
  ]
});

/* ============================ 7c  Run the line ============================ */
function speed7c() {   // the student's own measured speed when 7c passed, else the Python twin's real run
  var m = D.liveSub('7c').mech || {}, r = D.liveRes('7c'), sp = (m && m.speed) || (r && r.speed);
  if (sp && sp.medianMs) return { ms: sp.medianMs, slow: sp.slowMs, you: true, max: sp.maxPerMinute, n: sp.cells };
  var B = F7().belt || {}; return { ms: B.medianMs, you: false, n: 30 };
}
function belt7c(c, fx, n, o) {
  o = o || {}; var B = F7().belt || {}, cells = B.cells || [], s = A.stage({ floor: 360 }) + fx.defs, cnt = { pass: 0, person: 0, stop: 0, none: 0 };
  cells.slice(0, n).forEach(function (q) { cnt[q[2]]++; });
  s += A.belt(40, 250, 640, 30, { fx: fx, moving: o.moving });
  s += '<rect x="300" y="150" width="120" height="96" rx="12" fill="url(#' + fx.mt + ')" stroke="#46e3ff"/>' + t(360, 186, 'CAMERA', { size: 14, a: 'middle', f: 'h', fill: '#46e3ff' }) + t(360, 210, '+ flow', { size: 14, a: 'middle', fill: '#c7d4e4' }) + '<path d="M360 246v8" stroke="#46e3ff" stroke-width="3"/>';
  /* the tray of waiting cells on the left, the cells that went through on the right */
  var waiting = cells.slice(n, n + 4); waiting.forEach(function (q, i) { s += A.cell(q[0], 54 + i * 56, 216, 46, {}); });
  var gone = cells.slice(Math.max(0, n - 4), n); gone.forEach(function (q, i) { var x = 470 + i * 52; s += '<g' + (i === gone.length - 1 && o.just ? ' class="pgd-slide"' : '') + '>' + A.cell(q[0], x, 216, 44, {}) + shape(q[2], x + 22, 200, 8) + '</g>'; });
  var last = cells[n - 1];
  s += '<g transform="translate(704 26)">' + '<rect x="0" y="0" width="236" height="230" rx="12" fill="#0e141b" stroke="#263240"/>' + (last ? lampBox(last[2], 12, 12, 212, 160, { glow: true }) + t(118, 204, 'cell ' + last[0] + ' · ' + last[1], { size: 15, a: 'middle', f: 'm', fill: '#c7d4e4' }) : lampBox('none', 12, 12, 212, 160, {}) + t(118, 204, 'waiting', { size: 15, a: 'middle', fill: C.dim })) + '</g>';
  ['pass', 'person', 'stop', 'none'].forEach(function (k, i) { var x = 40 + i * 132; s += '<rect x="' + x + '" y="40" width="120" height="76" rx="10" fill="#121a24" stroke="' + LC[k] + '" stroke-opacity=".6"/>' + shape(k, x + 24, 78, 11) + t(x + 108, 90, String(cnt[k]), { size: 30, a: 'end', f: 'm', w: 700, fill: '#fff' }) + t(x + 12, 132, LW[k], { size: 14, w: 700, fill: LC[k] }); });
  s += '<rect x="572" y="40" width="112" height="76" rx="10" fill="#121a24" stroke="#5d6b80"/>' + t(670, 90, String(n), { size: 30, a: 'end', f: 'm', w: 700, fill: '#fff' }) + t(584, 132, 'CELLS', { size: 14, w: 700, fill: '#c7d4e4' });
  return { s: s, cnt: cnt };
}
function pedal(x, y, key, label, kind) {
  return A.target(key, '<g><path d="M' + (x - 60) + ' ' + (y + 30) + 'h120l-14 -44h-92z" fill="#1a2028" stroke="#3a4757" stroke-width="2"/><path d="M' + (x - 44) + ' ' + (y - 10) + 'h88l10 -26h-108z" fill="#ffb547" stroke="#fff" stroke-width="2"/><circle class="pgd-holdring" cx="' + x + '" cy="' + (y - 4) + '" r="70" fill="none" stroke="#3dffa0" stroke-width="5" stroke-dasharray="0 999" transform="rotate(-90 ' + x + ' ' + (y - 4) + ')"/></g>', label, x, y + 62, { kind: kind || 'tap' });
}
function work7c(n) { var B = F7().belt || {}, cnt = { pass: 0, person: 0, stop: 0 }; (B.cells || []).slice(0, n).forEach(function (q) { cnt[q[2]]++; }); return [{ h: 'Counters after ' + n + ' cells' }, { v: 'PASS ' + cnt.pass + ' · CHECK ' + cnt.person + ' · STOP ' + cnt.stop, k: 'NO VERDICT 0' }, { op: '=', v: (cnt.pass + cnt.person + cnt.stop) + ' cells', k: 'the four always add up to CELLS', res: true }, { t: 'Each cell counts ONCE, under the lamp the operator saw.' }, { tag: 'typical value' }, { t: '<i>The first cells of the validation tray, with their real lanes from your Step 5 shift (reference run).</i>' }]; }
D.register('7c', {
  init: function () { return { n: 0 }; },
  frames: [
  { cap: 'Press the pedal: one real cell per press',
    note: 'Each press sends the next cell of the validation tray through the flow. Its lamp shows, and one counter goes up.',
    svg: function (c) { var fx = A.fx(), B = belt7c(c, fx, c.state.n, { just: c.state.n > 0, moving: c.state.n > 0 }); return B.s + pedal(360, 452, 'pedal', 'press the pedal (' + c.state.n + ' of 4)'); },
    work: function (c) { return work7c(c.state.n); },
    on: { pedal: function (c) { c.state.n++; if (c.state.n >= 4) c.next(); else c.redraw(true); } }, auto: function (c) { c.state.n = 4; } },
  { cap: 'Hold the pedal: run the line to 30 cells',
    note: '30 real cells, one every 2 seconds at 30 cells per minute. The counters always add up to CELLS.',
    svg: function (c) { var fx = A.fx(), B = belt7c(c, fx, c.state.n, {}); return B.s + pedal(360, 452, 'hold', 'hold to run 30 cells', 'hold'); },
    work: function (c) { return work7c(c.state.n); },
    bind: function (c, root) { var el = root.querySelector('[data-pgd-t=hold]'), ring = el && el.querySelector('.pgd-holdring'); if (!el) return; D.onHold(el, { ms: 1100, progress: function (f) { if (ring) ring.setAttribute('stroke-dasharray', (f * 440).toFixed(1) + ' 999'); }, done: function () { c.state.n = 30; c.next(); } }); },
    auto: function (c) { c.state.n = 30; } },
  { cap: '30 cells done. How long did one decision take?',
    note: 'The clock times every real decision: photo check, live model, gates, logbook.',
    svg: function (c) { var fx = A.fx(), B = belt7c(c, fx, 30, {}); return B.s + A.target('watch', '<g><circle cx="360" cy="450" r="44" fill="#0b121b" stroke="#ffb547" stroke-width="4"/><rect x="350" y="394" width="20" height="12" rx="3" fill="#ffb547"/><path d="M360 450V420" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M360 450l18 10" stroke="#ffb547" stroke-width="3" stroke-linecap="round"/></g>', 'read the stopwatch', 560, 450, {}); },
    work: function () { return work7c(30); },
    on: { watch: function (c) { c.next(); } } },
  { cap: 'One decision is a sliver of the 2-second budget',
    note: 'The line sends a cell every 2 seconds. One real decision takes a few milliseconds; the line waits for the rest.',
    svg: function (c) {
      var fx = A.fx(), B = belt7c(c, fx, 30, {}), s = B.s, S = speed7c(), bud = (F7().belt || {}).budgetMs || 2000, X0 = 60, W = 840, fr = S.ms / bud;
      s += A.glass(40, 380, 880, 140, { fx: fx, col: '#2b4760' }) + t(60, 410, 'TIME BUDGET PER CELL · ' + fmt(bud) + ' ms at 30 cells / min', { size: 15, f: 'h', fill: '#c7d4e4', ls: '.04em' });
      s += '<rect x="' + X0 + '" y="430" width="' + W + '" height="34" rx="6" fill="#16202c" stroke="#3a4757"/><rect x="' + X0 + '" y="430" width="' + Math.max(4, W * fr).toFixed(1) + '" height="34" rx="3" fill="#ffb547" class="pgd-pop"/>';
      s += t(X0 + 14 + Math.max(4, W * fr), 454, 'decision ' + S.ms.toFixed(1) + ' ms', { size: 16, f: 'm', w: 700, fill: '#ffb547' }) + t(X0 + W - 10, 454, 'the line waits', { size: 15, a: 'end', fill: C.dim }) + t(60, 500, (100 * fr).toFixed(1) + '% of the budget · the rest is waiting for the next cell', { size: 16, fill: '#dbe6f2' });
      return s;
    },
    work: function () { var S = speed7c(), bud = (F7().belt || {}).budgetMs || 2000; return clean([{ h: 'Decision time vs line budget' }, { v: fmt(60000) + ' ÷ 30', k: 'ms per minute ÷ cells per minute' }, { op: '=', v: fmt(bud) + ' ms', k: 'budget per cell' }, { v: S.ms.toFixed(1) + ' ms', k: 'median real decision' + (S.you ? ' in your browser' : '') }, { op: '÷', v: fmt(bud) + ' ms', k: '' }, { op: '=', v: (100 * S.ms / bud).toFixed(1) + '%', k: 'of the budget', res: true }, S.max ? { v: S.max + ' cells / min', k: 'your browser could keep up with (slow cells)' } : null, srcTag(S.you), S.you ? null : { t: '<i>Reference: the Python Gradio twin, 30 real cells, Keras on CPU (median ' + S.ms + ' ms). The lab measures your own browser.</i>' }]); } }
  ]
});

/* ============================ 7d  The person's queue ============================ */
function q7d() { return (F7().queue || {}).cells || []; }
function rate7d(c) {   // the student's own seconds measured in this diagram, or the lab's own 7d rate when it passed
  var Q = F7().queue || {}, m = D.liveSub('7d').mech || {}, lab = m.rate;
  var secs = (c.state.secs || []).slice().sort(function (a, b) { return a - b; }), med = secs.length ? secs[Math.floor(secs.length / 2)] : null;
  if (lab && lab.medianSeconds) return { med: lab.medianSeconds, perHour: lab.perHour, needed: lab.neededPerHour, share: lab.share, checkers: lab.checkers, n: lab.answered, lab: true };
  if (!med) return { needed: Q.needed, share: Q.share };
  var ph = Math.floor(3600 / med); return { med: med, perHour: ph, needed: Q.needed, share: Q.share, checkers: Math.ceil(Q.needed / ph), n: secs.length, here: true };
}
function tray7d(c, fx) {
  var Q = q7d(), st = c.state, s = '', k = st.i;
  s += '<rect x="30" y="40" width="560" height="350" rx="14" fill="#0e141b" stroke="#263240"/>' + t(48, 70, 'QUEUE · ' + Math.max(0, (F7().queue || {}).person - k) + ' waiting', { size: 16, w: 700, fill: '#c3cdd9' });
  var cur = Q[k];
  if (cur) s += A.cell(cur[0], 48, 86, 290, { full: true }) + t(356, 110, 'cell ' + cur[0] + ' · ' + cur[1], { size: 16, f: 'm', w: 700, fill: '#fff' }) + t(356, 136, 'score ' + cur[2].toFixed(3), { size: 15, f: 'm', fill: '#c7d4e4' }) + t(356, 160, 'between the two gates', { size: 15, fill: C.dim });
  /* the tray of the next cells */
  Q.slice(k + 1, k + 5).forEach(function (q, i) { s += A.cell(q[0], 356 + (i % 2) * 106, 196 + Math.floor(i / 2) * 96, 88, {}); });
  (st.ans || []).forEach(function (a, i) { var q = Q[i], y = 430; if (i > 5) return; s += '<g class="' + (i === st.ans.length - 1 ? 'pgd-pop' : '') + '">' + A.cell(q[0], 30 + i * 96, y - 20, 56, {}) + t(30 + i * 96, y + 54, a[0] === 'pass' ? '● PASS' : '■ STOP', { size: 14, w: 700, fill: LC[a[0]] }) + t(30 + i * 96, y + 72, a[1].toFixed(1) + ' s', { size: 14, f: 'm', fill: '#c7d4e4' }) + '</g>'; });
  return s;
}
function keys7d(c) {
  return A.target('kp', '<g><rect x="620" y="300" width="150" height="110" rx="16" fill="#141c26" stroke="#2ee07a" stroke-width="4"/>' + t(695, 352, '● PASS', { size: 22, a: 'middle', w: 700, fill: '#2ee07a' }) + t(695, 388, 'key P', { size: 15, a: 'middle', f: 'm', fill: '#c7d4e4' }) + '</g>', 'pass', 695, 280, {}) +
    A.target('ks', '<g><rect x="790" y="300" width="150" height="110" rx="16" fill="#141c26" stroke="#ff5050" stroke-width="4"/>' + t(865, 352, '■ STOP', { size: 22, a: 'middle', w: 700, fill: '#ff5050' }) + t(865, 388, 'key S', { size: 15, a: 'middle', f: 'm', fill: '#c7d4e4' }) + '</g>', 'stop', 865, 280, { cls: 'pgd-nochip' });
}
function say7d(c, word) {
  var st = c.state, now = performance.now(), sec = st.t0 ? (now - st.t0) / 1000 : null;
  st.ans = st.ans || []; st.secs = st.secs || []; st.ans.push([word, sec == null ? 0 : sec]); if (sec != null) st.secs.push(sec); st.i++; st.t0 = now;
  if (st.i >= 3) c.next(); else c.redraw(true);
}
D.register('7d', {
  init: function () { return { i: 0, ans: [], secs: [], t0: 0 }; },
  frames: [
  { cap: 'Clear the queue yourself: the clock is running',
    note: 'These real cells paused for a person: their scores sit between the two gates. Answer each with PASS or STOP. Each answer is timed.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs + tray7d(c, fx) + keys7d(c), r = rate7d(c);
      s += A.glass(620, 40, 320, 200, { fx: fx, col: '#2b4760' }) + t(640, 72, 'YOUR ANSWERS', { size: 15, f: 'h', fill: '#c7d4e4', ls: '.06em' }) + t(640, 116, (c.state.ans || []).length + ' of 3', { size: 30, f: 'm', w: 700, fill: '#fff' }) + t(640, 150, r.med ? 'median ' + r.med.toFixed(1) + ' s per cell' : 'the clock starts when a', { size: 16, fill: '#dbe6f2' }) + t(640, 174, r.med ? '' : 'cell is shown', { size: 16, fill: '#dbe6f2' });
      return s;
    },
    work: function (c) { var Q = q7d(), r = [{ h: 'Your answers' }]; (c.state.ans || []).forEach(function (a, i) { r.push({ v: (a[0] === 'pass' ? 'PASS' : 'STOP') + ' · ' + a[1].toFixed(1) + ' s', k: 'cell ' + Q[i][0] + ' · expert label: ' + (Q[i][3] ? 'defect' : 'good'), col: LC[a[0]] }); }); r.push({ t: 'Each answer goes back into the SAME paused flow, which then writes the logbook row.' }); return r; },
    bind: function (c, root) { if (!c.state.t0) c.state.t0 = performance.now(); D.onTap(root.querySelector('[data-pgd-t=kp]'), function () { say7d(c, 'pass'); }); D.onTap(root.querySelector('[data-pgd-t=ks]'), function () { say7d(c, 'stop'); });
      function key(e) { if (!root.isConnected || !(window.PGDiagram && window.PGDiagram.isOpen && window.PGDiagram.isOpen())) return; if (e.ctrlKey || e.metaKey || e.altKey) return; if (e.target && e.target.closest && e.target.closest('input,textarea,select')) return; var k = String(e.key).toLowerCase(); if (k === 'p' || k === 's') { e.preventDefault(); say7d(c, k === 'p' ? 'pass' : 'stop'); } }
      document.addEventListener('keydown', key); c.onCleanup(function () { document.removeEventListener('keydown', key); }); },
    auto: function (c) { c.state.i = 3; } },
  { cap: 'Your speed, as cells per hour for one checker',
    note: 'The median of your answer times turns into cells per hour. The flow decides how many cells per hour need a person.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs, r = rate7d(c), Q = F7().queue || {};
      var max = Math.max(r.needed * 2, r.perHour || 0) * 1.05, fr = r.perHour ? Math.min(1, r.perHour / max) : 0;
      s += A.gauge(250, 250, 160, fr, { col: r.perHour >= r.needed ? '#2ee07a' : '#ff5050', target: r.needed / max, tl: r.needed + ' needed', val: r.perHour ? fmt(r.perHour) : '—', vs: 40, label: 'cells per hour, one checker' });
      s += A.glass(500, 40, 430, 330, { fx: fx, col: '#2b4760' }) + t(520, 74, 'WHAT THE FLOW SENDS', { size: 15, f: 'h', fill: '#c7d4e4', ls: '.06em' });
      [['to a person', Q.person + ' of ' + Q.n + ' cells'], ['share', (100 * Q.share).toFixed(1) + '%'], ['line speed', '30 cells / min'], ['= needed', fmt(Q.needed) + ' per hour']].forEach(function (q, i) { var y = 120 + i * 52; s += t(520, y, q[0], { size: 17, fill: '#c7d4e4' }) + t(910, y, q[1], { size: 19, a: 'end', f: 'm', w: 700, fill: i === 3 ? '#ffb21e' : '#fff' }); });
      s += A.target('cmp', '<g><rect x="500" y="400" width="430" height="70" rx="14" fill="#141c26" stroke="#ffb547" stroke-width="2"/>' + t(715, 444, 'CAN ONE CHECKER KEEP UP?', { size: 18, a: 'middle', f: 'h', fill: '#ffb547' }) + '</g>', 'compare', 715, 500, {});
      return s;
    },
    work: function (c) { var r = rate7d(c), Q = F7().queue || {}; return clean([{ h: 'One checker' }, r.med ? { v: '3,600 ÷ ' + r.med.toFixed(2) + ' s', k: 'seconds per hour ÷ your median' } : { v: '3,600 ÷ median seconds', k: 'answer a few cells to measure yours' }, { op: '=', v: r.perHour ? fmt(r.perHour) + ' per hour' : '—', k: '', res: true }, { h: 'The line' }, { v: '30 × 60 × ' + (100 * Q.share).toFixed(1) + '%', k: 'cells per hour × share to a person' }, { op: '=', v: fmt(Q.needed) + ' per hour', k: 'need a person (your Step 5 shift, reference run)', res: true }, r.lab ? { tag: 'your value' } : r.here ? { t: '<i>Your speed: measured in this diagram just now (' + r.n + ' answers). The share: the reference Step 5 shift.</i>' } : { tag: 'typical value' }]); },
    on: { cmp: function (c) { c.next(); } } },
  { cap: 'The answer: how many checkers this line needs',
    note: 'Needed per hour ÷ one checker per hour, rounded up. One checker keeps up only while each look stays under 3,600 s ÷ the cells needed per hour.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs, r = rate7d(c), n = r.checkers || 0;
      s += t(480, 60, r.perHour ? fmt(r.needed) + ' ÷ ' + fmt(r.perHour) + ' = ' + (r.needed / r.perHour).toFixed(2) + ' → ' + n + ' checker' + (n === 1 ? '' : 's') : 'answer cells in frame 1 to measure your speed', { size: 26, a: 'middle', f: 'm', w: 700, fill: '#fff' });
      for (var i = 0; i < Math.min(n, 12); i++) { var x = 480 - Math.min(n, 12) * 40 + i * 80 + 40; s += '<g class="pgd-seq" style="animation-delay:' + i * .08 + 's"><circle cx="' + x + '" cy="150" r="22" fill="#d9c4a8"/><path d="M' + (x - 30) + ' 240c0 -44 12 -64 30 -64s30 20 30 64z" fill="#ffb21e"/><rect x="' + (x - 40) + '" y="240" width="80" height="14" rx="3" fill="url(#' + fx.mt + ')"/></g>'; }
      if (n > 12) s += t(480, 290, '+ ' + (n - 12) + ' more', { size: 18, a: 'middle', fill: C.dim });
      var be = 3600 / r.needed, X0 = 120, W = 720, mx = Math.max(10, (r.med || 0) * 1.2), X = function (v) { return X0 + W * Math.min(1, v / mx); };
      s += A.glass(80, 340, 800, 180, { fx: fx, col: '#2b4157' }) + t(100, 372, 'ONE CHECKER KEEPS UP WHILE EACH LOOK TAKES LESS THAN', { size: 15, f: 'h', fill: '#c7d4e4', ls: '.04em' });
      s += '<rect x="' + X0 + '" y="400" width="' + (X(be) - X0).toFixed(1) + '" height="30" fill="#2ee07a" fill-opacity=".35"/><rect x="' + X(be).toFixed(1) + '" y="400" width="' + (X0 + W - X(be)).toFixed(1) + '" height="30" fill="#ff5050" fill-opacity=".25"/>';
      s += '<path d="M' + X(be).toFixed(1) + ' 392v46" stroke="#fff" stroke-width="3"/>' + t(X(be), 458, '3,600 ÷ ' + fmt(r.needed) + ' = ' + be.toFixed(1) + ' s', { size: 16, a: 'middle', f: 'm', w: 700, fill: '#fff' });
      if (r.med) s += '<circle cx="' + X(r.med).toFixed(1) + '" cy="415" r="10" fill="#ffb21e" stroke="#fff" stroke-width="2"/>' + t(X(r.med), 492, 'you: ' + r.med.toFixed(2) + ' s', { size: 15, a: 'middle', f: 'm', fill: '#ffb21e' });
      s += t(X0, 392, '0 s', { size: 14, fill: C.dim }) + t(X0 + W, 392, mx.toFixed(0) + ' s', { size: 14, a: 'end', fill: C.dim });
      return s;
    },
    work: function (c) { var r = rate7d(c); return clean([{ h: 'Checkers needed' }, { v: fmt(r.needed) + ' per hour', k: 'need a person' }, r.perHour ? { op: '÷', v: fmt(r.perHour) + ' per hour', k: 'one checker at your speed' } : null, { op: '=', v: r.checkers ? r.checkers + ' (rounded up)' : '—', k: '', res: true }, { v: (3600 / r.needed).toFixed(1) + ' s', k: 'longest look per cell that one checker can afford (3,600 ÷ ' + fmt(r.needed) + ')' }, { t: 'A quick tap in this diagram is not a careful look at a real cell. Fewer cells to a person = better gates (Step 3), not faster people.' }]); } }
  ]
});

/* ============================ 7e  The shift board ============================ */
var CH7E = [{ k: 'lanes', name: 'LANES OVER THE SHIFT', x: 30, y: 30 }, { k: 'target', name: 'DEFECTS PASSED vs TARGET', x: 490, y: 30 }, { k: 'mono', name: 'MONO vs POLY', x: 30, y: 280 }, { k: 'pie', name: 'CELLS BY TYPE', x: 490, y: 280 }];
var Q7E = { lab: [['q1', 'Are checkers getting busier as the shift goes on?', 'lanes'], ['q3', 'Is poly worse than mono?', 'mono'], ['q2', 'Are we inside the 5-in-100 target?', 'target']],
  ex: [['e1', 'Did the STOP lane get busier late in the shift?', 'lanes'], ['e2', 'Were more poly or mono cells checked?', 'pie']] };
function chart7e(ch, fx, o) {
  o = o || {}; var B = F7().board || {}, x = ch.x, y = ch.y, w = 440, h = 230, s = '<g class="pgd-keep">';
  s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="#f4f1ea" stroke="' + (o.lit ? '#ffb547' : '#c9c2b0') + '" stroke-width="' + (o.lit ? 4 : 1.5) + '"' + (fx ? ' filter="url(#' + fx.sh + ')"' : '') + '/>';
  s += '<circle cx="' + (x + w / 2) + '" cy="' + (y + 6) + '" r="7" fill="#c01a36"/>' + t(x + 14, y + 30, ch.name, { size: 14, f: 'h', fill: '#2a3444', ls: '.04em' });
  var bx = x + 20, by = y + 40, bw = w - 40, bh = h - 120;
  if (ch.k === 'lanes') { var bl = B.blocks || [], cw = bw / bl.length; bl.forEach(function (b, i) { var n = b.pass + b.person + b.stop, yy = by + bh; ['pass', 'person', 'stop'].forEach(function (k) { var hh = bh * b[k] / n; yy -= hh; s += '<rect x="' + (bx + i * cw + 1) + '" y="' + yy.toFixed(1) + '" width="' + (cw - 2) + '" height="' + hh.toFixed(1) + '" fill="' + LC[k] + '"/>'; }); }); s += t(bx, by + bh + 18, 'start', { size: 14, fill: '#4a5668' }) + t(bx + bw, by + bh + 18, bl.length + ' blocks of 50 → end', { size: 14, a: 'end', fill: '#4a5668' }); }
  if (ch.k === 'target') { var A1 = B.all || {}, max = 10, X = function (v) { return bx + bw * v / max; }; s += '<rect x="' + bx + '" y="' + (by + 10) + '" width="' + (X(A1.per100) - bx).toFixed(1) + '" height="36" fill="#4f6d8c"/>' + t(bx, by + 68, A1.passed + ' of ' + A1.defects + ' = ' + A1.per100 + ' per 100', { size: 15, f: 'm', w: 700, fill: '#1f2937' }) + '<path d="M' + X(B.target) + ' ' + (by + 2) + 'v52" stroke="#c01a36" stroke-width="3" stroke-dasharray="6 4"/>' + t(X(B.target) + 8, by + 30, 'target ' + B.target, { size: 14, w: 700, fill: '#c01a36' }) + t(bx, by + 100, A1.per100 <= B.target ? '● TARGET MET' : '■ TARGET MISSED', { size: 18, w: 700, fill: A1.per100 <= B.target ? '#0f7a48' : '#c01a36' }); }
  if (ch.k === 'mono') { var mx = Math.max(10, (B.mono || {}).per100, (B.poly || {}).per100) * 1.2; [['mono', B.mono], ['poly', B.poly]].forEach(function (q, i) { var g = q[1] || {}, yy = by + 4 + i * 50, bwid = bw * .45 * g.per100 / mx * 1.2; s += '<rect x="' + bx + '" y="' + yy + '" width="' + bwid.toFixed(1) + '" height="36" fill="#4f6d8c"/>' + t(bx + bwid + 10, yy + 24, q[0] + ' ' + g.passed + ' of ' + g.defects + ' = ' + g.per100 + ' per 100', { size: 15, f: 'm', w: 700, fill: '#1f2937' }); }); s += t(bx, by + bh + 18, 'defects passed per 100, by cell type', { size: 14, fill: '#4a5668' }); }
  if (ch.k === 'pie') { var T = B.types || { mono: 1, poly: 1 }, tot = T.mono + T.poly, a = 2 * Math.PI * T.mono / tot, cx = bx + 70, cy = by + bh / 2 + 6, r = 56; s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#a98bff"/><path d="M' + cx + ' ' + cy + 'L' + cx + ' ' + (cy - r) + 'A' + r + ' ' + r + ' 0 ' + (a > Math.PI ? 1 : 0) + ' 1 ' + (cx + r * Math.sin(a)).toFixed(1) + ' ' + (cy - r * Math.cos(a)).toFixed(1) + 'Z" fill="#46a3ff"/>' + t(bx + 150, cy - 10, 'mono ' + T.mono, { size: 16, f: 'm', w: 700, fill: '#1f5fa8' }) + t(bx + 150, cy + 16, 'poly ' + T.poly, { size: 16, f: 'm', w: 700, fill: '#6b4fd1' }) + t(bx + 150, cy + 40, 'of ' + tot + ' cells', { size: 14, fill: '#4a5668' }); }
  return s + '</g>';
}
function qcard(q, x, y, o) { o = o || {}; return '<g class="pgd-keep' + (o.cls ? ' ' + o.cls : '') + '"><rect x="' + x + '" y="' + y + '" width="300" height="62" rx="6" fill="#ffd36b" stroke="#a87a1a" stroke-width="1.5"/><circle cx="' + (x + 150) + '" cy="' + (y + 4) + '" r="6" fill="#c01a36"/>' + t(x + 12, y + 26, 'MANAGER ASKS', { size: 14, f: 'h', fill: '#5a3d00' }) + t(x + 12, y + 48, q[1].length > 40 ? q[1].slice(0, 39) + '…' : q[1], { size: 15, w: 700, fill: '#1f1400' }) + '</g>'; }
function set7e() { return D.predDone('7e') ? Q7E.lab : Q7E.ex; }
function board7e(c, fx) { var s = A.stage() + fx.defs + '<rect x="14" y="14" width="932" height="512" rx="12" fill="#2a3038" stroke="#5d6b80" stroke-width="3"/>'; CH7E.forEach(function (ch) { s += chart7e(ch, fx, { lit: c.state.lit === ch.k }); }); (c.state.pinned || []).forEach(function (p) { var ch = CH7E.filter(function (z) { return z.k === p[1]; })[0], q = set7e().filter(function (z) { return z[0] === p[0]; })[0]; if (ch && q) s += '<g transform="translate(' + (ch.x + 130) + ' ' + (ch.y + 172) + ') scale(.95)">' + qcard(q, 0, 0) + '</g>'; }); return s; }
function frame7e(j) {
  return { get cap() { return j < 2 ? ['The manager asks: pin the question to the chart that answers it', 'Next question: pin it too'][j] : D.predDone('7e') ? 'Last question: pin it' : 'Read one bar: what is inside a block?'; },
    note: 'The question picks the chart: time → lanes over the shift; one number vs a target → the target bar; two groups → two bars side by side.',
    svg: function (c) {
      var fx = A.fx(), s = board7e(c, fx), Q = set7e(), q = Q[j];
      if (!q) {   // before the 7e prediction: only 2 example questions; the third frame reads one block of the lanes chart instead
        s += A.target('blk', '<rect x="49" y="76" width="38" height="164" fill="none" stroke="#ffb547" stroke-width="3"/>', 'count block 1', 160, 262, {});
        s += '<rect x="490" y="232" width="440" height="40" rx="8" fill="#0b121b" opacity=".85"/>' + A.lock(500, 258, 'your 3 questions: answer the 7e prediction first');
        return s;
      }
      s += '<g id="q7e">' + A.target('q', qcard(q, 330, 236), 'pin it', 480, 330, { kind: 'drag', cls: 'pgd-solid', to: snapTo(480, 267, { lanes: 250, target: 710, mono: 250, pie: 710 }[q[2]], { lanes: 140, target: 140, mono: 390, pie: 390 }[q[2]], 16) }) + '</g>';
      if (c.state.msg) s += '<rect x="200" y="494" width="560" height="30" rx="6" fill="#2a0d14"/>' + t(480, 515, c.state.msg, { size: 15, a: 'middle', w: 700, fill: '#ff8aa0' });
      return s;
    },
    work: function (c) { var B = F7().board || {}, ex = !D.predDone('7e'), r = [{ h: ex ? 'Worked examples (other questions)' : 'The manager’s questions' }]; (c.state.pinned || []).forEach(function (p) { var q = set7e().filter(function (z) { return z[0] === p[0]; })[0]; if (q) r.push({ v: p[1] === 'lanes' ? 'lanes over time' : p[1] === 'pie' ? 'cells by type' : p[1] === 'mono' ? 'mono vs poly' : 'target bar', k: q[1] }); });
      if (ex) r.push({ t: 'Your own 3 questions appear here after you answer the 7e prediction in the lab.' });
      r.push({ v: B.cells + ' rows', k: 'the logbook of your Step 5 shift (with the poly gate), counted' }); return r.concat([{ tag: 'typical value' }]); },
    bind: function (c, root) {
      var Q = set7e(), q = Q[j];
      if (!q) { D.onTap(root.querySelector('[data-pgd-t=blk]'), function () { c.state.lit = 'lanes'; c.state.blk = 1; c.next(); }); return; }
      var el = root.querySelector('[data-pgd-t=q]');
      D.onDrag(root, el, { start: { x: 480, y: 267 }, step: 16, move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - 480) + ' ' + (p.y - 267) + ')'); },
        drop: function (p) {
          var hit = CH7E.filter(function (ch) { return p.x > ch.x && p.x < ch.x + 440 && p.y > ch.y && p.y < ch.y + 230; })[0];
          if (!hit) { el.removeAttribute('transform'); return; }
          if (hit.k === q[2]) { c.state.pinned = (c.state.pinned || []).concat([[q[0], hit.k]]); c.state.msg = ''; c.state.lit = hit.k; c.next(); return; }
          c.state.msg = { lanes: 'Lanes over time shows WHEN, not this.', target: 'The target bar is one number against a line.', mono: 'Mono vs poly compares two groups.', pie: 'Cells by type shows what came in, not how the line did.' }[hit.k]; c.redraw(true);
        } });
    },
    auto: function (c) { var q = set7e()[j]; if (q) c.state.pinned = (c.state.pinned || []).concat([[q[0], q[2]]]); else c.state.blk = 1; } };
}
D.register('7e', {
  init: function () { return { pinned: [], msg: '', lit: null }; },
  frames: [frame7e(0), frame7e(1), frame7e(2),
  { cap: 'The board, counted from the real logbook',
    note: 'Every bar is a count of logbook rows: lanes per block of 50, and defects whose final decision was pass.',
    svg: function (c) {
      var fx = A.fx(), s = board7e(c, fx), B = F7().board || {}, b1 = (B.blocks || [])[0] || {};
      if (c.state.blk) s += '<g class="pgd-pop"><rect x="96" y="70" width="300" height="120" rx="10" fill="#0b121b" stroke="#ffb547" stroke-width="2"/>' + t(112, 98, 'BLOCK 1 · rows 1–50', { size: 14, f: 'h', fill: '#ffb547' }) + ['pass', 'person', 'stop'].map(function (k, i) { return shape(k, 122, 124 + i * 22, 7) + t(140, 130 + i * 22, LW[k] + ' ' + b1[k], { size: 15, f: 'm', w: 700, fill: LC[k] }); }).join('') + '</g>';
      return s;
    },
    work: function () { var B = F7().board || {}, b1 = (B.blocks || [])[0] || {}; return [{ h: 'Counted from ' + B.cells + ' rows' }, { v: B.blocks.length + ' blocks', k: 'of 50 rows (the last one shorter)' }, { v: b1.pass + ' · ' + b1.person + ' · ' + b1.stop, k: 'block 1: pass · check · stop' }, { v: B.all.passed + ' of ' + B.all.defects, k: 'defects whose FINAL decision was pass' }, { op: '=', v: B.all.per100 + ' per 100', k: 'target at most ' + B.target, res: true, col: '#2ee07a' }, { v: B.mono.per100 + ' vs ' + B.poly.per100, k: 'mono vs poly, per 100' }, { tag: 'typical value' }]; } }
  ]
});

/* ============================ 7f  One button, one report ============================ */
function rep7f() { var R = F7().report || {}, r7 = D.liveRes('7f'); if (r7 && r7.r && r7.r.text) return { final: r7.r.text, removed: r7.r.removed, drafts: r7.r.drafts, held: R.held, heldWhy: r7.planted && r7.planted.why, heldWrong: (R.heldCheck || {}).wrong, you: true }; return { final: R.final, removed: R.removed, drafts: R.drafts, held: R.held, heldWrong: (R.heldCheck || {}).wrong, you: false }; }
function outbox(fx, open, o) {
  o = o || {}; var s = '';
  s += '<rect x="560" y="70" width="380" height="380" rx="16" fill="url(#' + fx.mt + ')" stroke="#5d6b80" stroke-width="2"/>' + t(750, 102, 'OUTBOX · TO THE OPERATOR', { size: 15, a: 'middle', f: 'h', fill: '#c7d4e4', ls: '.06em' });
  s += '<rect x="590" y="124" width="320" height="300" rx="10" fill="#05080d" stroke="#3a4757"/>';
  s += '<g style="transition:transform .6s" transform="translate(0 ' + (open ? -86 : 0) + ')"><rect x="590" y="210" width="320" height="34" fill="' + (o.held ? '#c01a36' : '#5d6b80') + '"/>' + t(750, 233, o.held ? 'GATE SHUT' : open ? 'GATE OPEN' : 'CHECKER’S GATE', { size: 16, a: 'middle', f: 'h', fill: '#fff' }) + '</g>';
  return s;
}
function paper7f(txt, x, y, w, h, fx, o) {
  o = o || {}; var s = '<g class="pgd-keep' + (o.cls ? ' ' + o.cls : '') + '"><g filter="url(#' + fx.sh + ')"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="#f1ecdf"/></g>';
  (txt || '').split('\n').slice(0, o.lines || 6).forEach(function (l, i) { var bad = o.bad && o.bad.some(function (b) { return l.indexOf(b) >= 0; }); s += t(x + 12, y + 26 + i * 21, l.length > (o.cut || 44) ? l.slice(0, (o.cut || 44) - 1) + '…' : l, { size: 14, f: 'm', w: i ? 600 : 700, fill: bad ? '#c01a36' : '#1f2937' }); });
  return s + '</g>';
}
D.register('7f', {
  init: function () { return {}; },
  frames: [
  { cap: 'Hold the REPORT button: three workers, then the checker',
    note: 'One button runs the whole Step 6 crew. The report job has your checker as its gate.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage({ floor: 470 }) + fx.defs + outbox(fx, false);
      ['INSPECTOR', 'ANALYST', 'WRITER'].forEach(function (w, i) { s += '<rect x="' + (40 + i * 166) + '" y="70" width="150" height="60" rx="10" fill="#121a24" stroke="' + ['#46e3ff', '#a98bff', '#ffb547'][i] + '" stroke-width="2"/>' + t(115 + i * 166, 106, w, { size: 15, a: 'middle', f: 'h', fill: ['#46e3ff', '#a98bff', '#ffb547'][i] }); });
      s += '<path d="M115 130V170H615V124M281 130V170M447 130V170" stroke="#5d6b80" stroke-width="3" fill="none" stroke-dasharray="8 6"/>' + t(330, 196, 'report → checker’s gate → operator', { size: 15, fill: C.dim });
      s += A.target('report', '<g><circle cx="270" cy="320" r="92" fill="#3a0a14" stroke="#ffb547" stroke-width="6"/><circle cx="270" cy="314" r="76" fill="#c01a36"/>' + t(270, 322, 'REPORT', { size: 24, a: 'middle', f: 'h', fill: '#fff' }) + '<circle class="pgd-holdring" cx="270" cy="318" r="104" fill="none" stroke="#3dffa0" stroke-width="6" stroke-dasharray="0 999" transform="rotate(-90 270 318)"/></g>', 'hold the button', 270, 448, { kind: 'hold' });
      return s;
    },
    work: function () { return [{ h: 'One press' }, { v: '3 jobs', k: 'inspector → analyst → writer (Step 6)' }, { v: 'the checker', k: 'the report job’s gate: draft sent back once' }, { v: 'check again', k: 'on the final text, against the tool facts now' }]; },
    bind: function (c, root) { var el = root.querySelector('[data-pgd-t=report]'), ring = el.querySelector('.pgd-holdring'); D.onHold(el, { ms: 1000, progress: function (f) { ring.setAttribute('stroke-dasharray', (f * 654).toFixed(1) + ' 999'); }, done: function () { c.next(); } }); } },
  { cap: 'Every number passes: the gate opens',
    note: 'Draft 1 lost 2 slipped numbers to the checker. The final text is checked again: every number is in the tool facts, so it goes out with a badge.',
    svg: function (c) {
      var fx = A.fx(), R = rep7f(), s = A.stage({ floor: 470 }) + fx.defs + outbox(fx, true);
      s += paper7f(R.final, 600, 172, 300, 170, fx, { cls: 'pgd-drop', lines: 7, cut: 38 });
      s += '<rect x="40" y="70" width="490" height="110" rx="12" fill="#0b1a12" stroke="#2ee07a" stroke-width="3"/>' + shape('pass', 76, 125, 18) + t(110, 116, 'EVERY NUMBER CHECKED', { size: 20, w: 700, fill: '#2ee07a' }) + t(110, 148, R.removed && R.removed.length ? 'the checker removed ' + R.removed.join(', ') + ' from draft 1' : 'nothing removed', { size: 16, fill: '#c7d4e4' });
      s += A.target('try', '<g><rect x="40" y="250" width="300" height="150" rx="6" fill="#f1ecdf" stroke="#c01a36" stroke-width="3" stroke-dasharray="7 5"/>' + t(56, 280, 'A COPY WITH ONE', { size: 15, f: 'h', fill: '#7a1020' }) + t(56, 304, 'PLANTED NUMBER', { size: 15, f: 'h', fill: '#7a1020' }) + t(56, 340, '(the lab’s own test:', { size: 15, fill: '#4a5668' }) + t(56, 362, 'first decimal + 7)', { size: 15, fill: '#4a5668' }) + '</g>', 'send the copy', 190, 430, {});
      return s;
    },
    work: function () { var R = rep7f(); return clean([{ h: 'The real report' }, { v: R.drafts + ' drafts', k: 'draft 1 sent back, draft 2 passed' }, { v: (R.removed || []).join(', ') || 'none', k: 'numbers removed from draft 1' }, { v: 'check again → ok', k: 'every number found in the tool facts', res: true, col: '#2ee07a' }, srcTag(R.you)]); },
    on: { try: function (c) { c.next(); } } },
  { cap: 'One wrong number: the report is held back',
    note: 'The same check on a copy with one number changed: it is not in the tool facts, so the gate stays shut and the operator sees why.',
    svg: function (c) {
      var fx = A.fx(), R = rep7f(), s = A.stage({ floor: 470 }) + fx.defs + outbox(fx, false, { held: true });
      s += '<g class="pgd-shake">' + paper7f(R.held, 600, 270, 300, 140, fx, { lines: 6, cut: 38, bad: R.heldWrong }) + '</g>';
      s += '<rect x="40" y="70" width="490" height="130" rx="12" fill="#2a0d14" stroke="#ff5050" stroke-width="3"/>' + shape('stop', 76, 128, 18) + t(110, 116, 'REPORT HELD BACK', { size: 20, w: 700, fill: '#ff5050' }) + t(110, 148, 'numbers not in the tool results:', { size: 16, fill: '#c7d4e4' }) + t(110, 180, (R.heldWrong || []).join(', '), { size: 22, f: 'm', w: 700, fill: '#ff5050' });
      s += A.glass(40, 240, 490, 200, { fx: fx, col: '#2b4157' }) + t(60, 276, 'The safe default again:', { size: 17, w: 700, fill: '#fff' }) + t(60, 308, 'show the report only when the check is good.', { size: 17, fill: '#dbe6f2' }) + t(60, 340, 'Otherwise show nothing — and say why.', { size: 17, fill: '#dbe6f2' }) + t(60, 390, 'No checked report, no report.', { size: 18, w: 700, fill: '#ffb547' });
      return s;
    },
    work: function () { var R = rep7f(); return [{ h: 'The planted copy' }, { v: (R.heldWrong || []).join(', '), k: 'not in the tool facts', col: '#ff5050' }, { op: '=', v: 'held back', k: 'the gate stays shut', res: true }, { tag: 'typical value' }]; } }
  ]
});

/* ============================ 7g  Break it before the plant does ============================ */
var SW7G = [[60, 'camera'], [190, 'model'], [320, 'flow'], [450, 'empty']];
function fault7g(k) { return (F7().faults || []).filter(function (f) { return f.k === k; })[0] || {}; }
function panel7g(fx, thrown, cur) {
  var s = '<rect x="20" y="330" width="560" height="196" rx="14" fill="url(#' + fx.mt + ')" stroke="#5d6b80" stroke-width="2"/>' + t(40, 358, 'FAULT PANEL', { size: 15, f: 'h', fill: '#ffcf6b', ls: '.1em' });
  SW7G.forEach(function (q) { var x = q[0], on = thrown.indexOf(q[1]) >= 0, f = fault7g(q[1]); s += '<rect x="' + (x + 20) + '" y="378" width="48" height="84" rx="10" fill="#0b121b" stroke="' + (q[1] === cur ? '#ffb547' : '#3a4757') + '" stroke-width="2"/><rect x="' + (x + 28) + '" y="' + (on ? 418 : 386) + '" width="32" height="36" rx="6" fill="' + (on ? '#ff5050' : '#c7d4e4') + '"/>' + t(x + 44, 486, f.name || q[1], { size: 14, a: 'middle', w: 700, fill: '#dbe6f2' }) + t(x + 44, 506, on ? 'THROWN' : 'off', { size: 14, a: 'middle', f: 'm', fill: on ? '#ff5050' : C.dim }); });
  return s;
}
function screens7g(fx, k) {
  var f = fault7g(k), s = '';
  [['STARTER CONSOLE (2 planted bugs)', f.buggy || {}, 20], ['FIXED CONSOLE', f.fixed || {}, 490]].forEach(function (q, i) {
    var x = q[2], v = q[1], lamp = v.lamp === 'PASS' ? 'pass' : v.lamp === 'CHECK' ? 'person' : v.lamp === 'NO VERDICT' ? 'none' : null, right = i === 1 || k === 'empty';
    s += t(x + 10, 30, q[0], { size: 14, f: 'h', fill: i ? '#2ee07a' : '#ff8aa0', ls: '.06em' });
    s += '<rect x="' + x + '" y="40" width="450" height="270" rx="10" fill="#0a0e13" stroke="' + (right ? '#2ee07a' : '#ff5050') + '" stroke-width="3"/>';
    if (k === 'empty') { s += t(x + 20, 80, 'QUEUE · no cells waiting', { size: 17, w: 700, fill: '#c3cdd9' }) + t(x + 20, 130, 'operator presses P', { size: 16, fill: '#dbe6f2' }) + t(x + 20, 170, v.moved ? 'a counter moved' : '→ nothing happens', { size: 20, w: 700, fill: '#2ee07a' }) + t(x + 20, 210, 'no counter moves', { size: 16, fill: '#c7d4e4' }); }
    else {
      if (k === 'camera') s += A.cell(2567, x + 14, 54, 150, { op: .08 }); else s += '<rect x="' + (x + 14) + '" y="54" width="150" height="150" fill="#000" stroke="#33414f"/>' + t(x + 89, 136, k === 'flow' ? 'NO PHOTO' : 'NO MODEL', { size: 16, a: 'middle', w: 700, fill: '#9aa6b6' });
      s += '<g class="pgd-pop">' + lampBox(lamp || 'none', x + 178, 54, 258, 150, { glow: true }) + '</g>';
      s += t(x + 14, 236, 'counted as: ' + (v.counted || '—'), { size: 16, w: 700, fill: v.counted === 'PASS' && !right ? '#ff5050' : '#c7d4e4' }) + t(x + 14, 266, 'sent to a person: ' + (v.queued ? 'yes' : 'NO'), { size: 16, w: 700, fill: v.queued ? '#2ee07a' : '#ff5050' });
      s += t(x + 436, 296, right ? '✓ safe' : '✗ WRONG', { size: 18, a: 'end', w: 700, fill: right ? '#2ee07a' : '#ff5050' });
    }
  });
  return s;
}
function frame7g(i) {
  var k = SW7G[i][1];
  return { cap: ['Throw the camera fault', 'Throw “model not loaded”', 'Throw a flow error', 'Throw “empty queue”'][i],
    note: 'Each fault arrives right after a real PASS cell. Left: what the operator sees on the starter console. Right: after both fixes.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs, th = c.state.thrown, shown = th.indexOf(k) >= 0, f = fault7g(k);
      if (shown) s += screens7g(fx, k);
      else s += '<rect x="20" y="40" width="920" height="270" rx="12" fill="#0a0e13" stroke="#263240"/>' + t(480, 150, f.name ? f.name.toUpperCase() : '', { size: 26, a: 'middle', f: 'h', fill: '#ffcf6b' }) + t(480, 190, f.what || '', { size: 18, a: 'middle', fill: '#dbe6f2' }) + t(480, 230, 'throw the switch to see both consoles', { size: 16, a: 'middle', fill: C.dim });
      s += panel7g(fx, th, k);
      s += A.glass(600, 330, 340, 196, { fx: fx, col: '#2b4157' }) + t(620, 364, 'THE ONE CONSTANT', { size: 15, f: 'h', fill: '#46e3ff', ls: '.08em' }) + t(620, 396, 'Unknown, missing or broken', { size: 16, fill: '#dbe6f2' }) + t(620, 420, '→ never PASS:', { size: 16, fill: '#dbe6f2' }) + t(620, 448, 'NO VERDICT, a person looks.', { size: 17, w: 700, fill: '#a3afbf' }) + t(620, 476, 'A spoiled photo → CHECK.', { size: 16, fill: '#ffb21e' });
      var x = SW7G[i][0];
      if (!shown) s += A.target('sw', '<rect x="' + (x + 14) + '" y="372" width="60" height="96" rx="12" fill="none" stroke="#ffb547" stroke-width="3"/>', 'throw it', x + 44, 548 - 20, {});
      else s += A.target('sw', '<rect x="' + (x + 14) + '" y="372" width="60" height="96" rx="12" fill="none" stroke="#5d6b80" stroke-width="2" stroke-dasharray="4 4"/>', i < 3 ? 'next fault' : 'see the summary', 300, 548 - 20, { la: 'middle' });
      return s;
    },
    work: function (c) {
      var f = fault7g(k), shown = c.state.thrown.indexOf(k) >= 0; if (!shown) return [{ h: f.name || k }, { t: f.what }, { t: 'Throw the switch.' }];
      var b = f.buggy || {}, x = f.fixed || {};
      return k === 'empty' ? [{ h: f.name }, { v: 'nothing happens', k: 'starter AND fixed console: already safe' }, { t: 'A key press with no cell waiting must change nothing.' }] :
        [{ h: f.name }, { v: 'starter: ' + b.lamp, k: 'the verdict of the cell BEFORE, kept on screen', col: '#ff5050' }, { v: 'starter: counted ' + b.counted + ', to a person: ' + (b.queued ? 'yes' : 'no'), k: '', col: '#ff5050' }, { v: 'fixed: ' + x.lamp, k: 'to a person: yes', col: '#2ee07a' }, { t: 'Same checks as the lab’s own fault drill; the Python twin gave the same lamps.' }];
    },
    on: { sw: function (c) { if (c.state.thrown.indexOf(k) < 0) { c.state.thrown.push(k); c.redraw(true); } else c.next(); } },
    auto: function (c) { if (c.state.thrown.indexOf(k) < 0) c.state.thrown.push(k); } };
}
D.register('7g', {
  init: function () { return { thrown: [] }; },
  frames: [frame7g(0), frame7g(1), frame7g(2), frame7g(3),
  { cap: 'Two bugs, two symptoms — find their lines in the lab',
    note: 'Symptom 1: a fault keeps the last verdict on screen (often PASS) and is never sent to a person. Symptom 2: a cell answered by the person is counted twice.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs, F = F7(), ab = F.answerBack || { buggy: 2, fixed: 1 };
      s += A.glass(20, 30, 450, 300, { fx: fx, col: '#7a2a3a' }) + t(40, 64, 'SYMPTOM 1 · the old verdict stays', { size: 16, f: 'h', fill: '#ff8aa0' });
      ['camera', 'model', 'flow'].forEach(function (k, i) { var f = fault7g(k); s += t(40, 110 + i * 60, f.name, { size: 17, w: 700, fill: '#fff' }) + t(40, 134 + i * 60, 'starter: ' + f.buggy.lamp + ' → fixed: ' + f.fixed.lamp, { size: 16, f: 'm', fill: '#c7d4e4' }); });
      s += A.glass(490, 30, 450, 300, { fx: fx, col: '#7a2a3a' }) + t(510, 64, 'SYMPTOM 2 · counted twice', { size: 16, f: 'h', fill: '#ff8aa0' });
      s += t(510, 110, 'one cell that waits for a person (arrives + answered):', { size: 16, fill: '#dbe6f2' }) + t(510, 160, 'starter: CELLS +' + ab.buggy, { size: 24, f: 'm', w: 700, fill: '#ff5050' }) + t(510, 200, 'fixed: CELLS +' + ab.fixed, { size: 22, f: 'm', w: 700, fill: '#2ee07a' }) + t(510, 250, 'Counted ONCE, when it arrived.', { size: 16, fill: '#dbe6f2' });
      s += A.glass(20, 350, 920, 170, { fx: fx, col: '#2b4157' }) + t(40, 390, 'The code lines are yours to find: run the starter console in the lab, throw each fault,', { size: 17, fill: '#dbe6f2' }) + t(40, 418, 'and look for where the screen reuses an old verdict and where a cell is counted.', { size: 17, fill: '#dbe6f2' }) + t(40, 466, 'When in doubt the screen says NO VERDICT, and a person looks.', { size: 19, w: 700, fill: '#ffb547' });
      return s;
    },
    work: function () { return [{ h: 'The fault drill' }, { v: '3 of 4', k: 'faults that the starter console shows WRONG' }, { v: '4 of 4', k: 'faults that the fixed console shows safely' }, { t: 'Break it on purpose before the plant does: both bugs are invisible on the happy path.' }]; } }
  ]
});
window.PGD_S7 = { hmi: hmi, lampBox: lampBox, shape: shape, LC: LC, LW: LW };   // reused by the Step 8 diagrams
})();
