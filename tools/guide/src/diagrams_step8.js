/* PanelGuard Diagram guide — Step 8 diagrams (8a 8b 8c 8d 8e 8f 8g). Uses window.PGD (engine.js) and PGD_S7 (the console).
   Numbers: the student's own Step 8 run when that substep passed ("your value"), else real reference facts (facts.json s8,
   made by tools/guide/facts8.py from the twin-verified Step 8 run, tools/research/step8_inputs.json).
   THE HONESTY RULE: no number of the sealed test tray is shown before the student has broken the seal and run their own
   trial (liveRes('8b')). Until then the test side is locked and the idea is shown with the VALIDATION tray, labelled so.
   Locks: no code-gap text (no index name, no blend name, no route name, no z value, no count name, no position number,
   no bin expression, no alarm literal, no part name); 8d's alarm needles stay covered until the student's own 8d run. */
(function () {
'use strict';
var D = window.PGD, A = D.art, C = A.COL, t = A.t, fmt = D.fmt;
var S7 = function () { return window.PGD_S7 || {}; };
var F8 = function () { return (window.PGD_FACTS || {}).s8 || {}; };
function clean(a) { return a.filter(function (r) { return r; }); }
function f1(x) { return x == null || isNaN(x) ? '?' : (Math.round(10 * x) / 10).toFixed(1); }
function f3(x) { return x == null || isNaN(x) ? '?' : (+x).toFixed(3); }
function snapTo(sx, sy, dx, dy, step) { return (sx + Math.round((dx - sx) / step) * step) + ',' + (sy + Math.round((dy - sy) / step) * step); }
var LC = { pass: '#2ee07a', person: '#ffb21e', stop: '#ff5050' };
function wilson(k, n) { var z = 1.96, p = k / n, d = 1 + z * z / n, mid = (p + z * z / (2 * n)) / d, half = (z / d) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return { p: p, d: d, mid: mid, half: half, lo: 100 * Math.max(0, mid - half), hi: 100 * Math.min(1, mid + half) }; }
function mech(id) { return (D.liveSub(id) || {}).mech || {}; }
/* the student's own sealed-tray trial, or (dev screenshots only) the reference run; null = locked */
function testSide() {
  var r = D.liveRes('8b');
  if (r && r.trial) { var c = D.liveRes('8c'), w = wilson(r.trial.all.defPassed, r.trial.all.def); return { you: true, T: r.trial, lo: c && c.ref ? c.ref[0] : w.lo, hi: c && c.ref ? c.ref[1] : w.hi, boot: c && c.boot, honest: r.honest, rows: (r.scores || []).map(function (q) { return q[5] === 1 ? (q[4] === 'pass' ? 2 : 1) : 0; }) }; }
  if (window.__pgdUnlock) { var T = F8().test || {}; return { you: false, ref: true, T: T, lo: (T.interval || [])[0], hi: (T.interval || [])[1], boot: T.boot, rows: null }; }
  return null;
}
function valSide() { var V = F8().val || {}; return { T: V, lo: (V.wilson || {}).lo, hi: (V.wilson || {}).hi, boot: V.boot, rows: (V.rows || '').split('').map(Number) }; }
function sealTag(x, y, w) { return A.lock(x, y, w || 'sealed: your own trial first (8a, 8b)'); }
function tagOf(ts) { return ts ? { tag: ts.you ? 'your value' : 'typical value' } : null; }

/* ============================ 8a  Freeze, then break the seal ============================ */
var KEYS8A = [['model', 'MODEL', 'CNN weights'], ['bestW', 'BLEND WEIGHT', 'CNN share'], ['low', 'LOW GATE · MONO', 'below: auto-pass'], ['lowPoly', 'LOW GATE · POLY', 'below: auto-pass'], ['high', 'HIGH GATE', 'from it: auto-stop'], ['flow', 'FLOW', 'stations + photo rules']];
var GROUP8A = [['model', 'bestW'], ['low', 'lowPoly', 'high'], ['flow']];
function frozen8a() {
  var m = mech('8a'), f = m.frozen, R = F8().freeze || {};
  if (f) return { you: true, model: f.params != null ? fmt(f.params) + ' numbers · sum ' + f.model : '?', bestW: String(f.bestW), low: f3(f.low), lowPoly: f3(f.lowPoly), high: f3(f.high), flow: f.maxTries + ' tries · ' + (f.rules || []).join('/') };
  return { you: false, model: D.liveRes('3c') ? fmt(R.params) + ' numbers' : 'your 3c CNN', bestW: String(R.bestW), low: f3(R.low), lowPoly: f3(R.lowPoly), high: f3(R.high), flow: R.maxTries + ' tries · ' + [(R.rules || {}).dark, (R.rules || {}).blank, (R.rules || {}).flat].join('/') };
}
function cabinet8a(c, fx, o) {
  o = o || {}; var V = frozen8a(), L = c.state.locked, s = '';
  s += '<rect x="30" y="24" width="560" height="492" rx="16" fill="url(#' + fx.mt + ')" stroke="#5d6b80" stroke-width="2" filter="url(#' + fx.sh + ')"/>';
  s += t(52, 58, 'FREEZE CABINET · ONE KEY PER SETTING', { size: 15, f: 'h', fill: '#c7d4e4', ls: '.06em' });
  KEYS8A.forEach(function (k, i) {
    var y = 80 + i * 70, on = L.indexOf(k[0]) >= 0, cur = o.cur === k[0];
    s += '<rect x="48" y="' + y + '" width="524" height="58" rx="10" fill="#0b121b" stroke="' + (on ? '#2ee07a' : cur ? '#ffb547' : '#2b3a4c') + '" stroke-width="' + (on || cur ? 2.4 : 1.2) + '"/>';
    s += '<circle cx="74" cy="' + (y + 29) + '" r="8" fill="' + (on ? '#2ee07a' : '#3a2a10') + '"' + (on ? ' filter="url(#' + fx.gl + ')"' : '') + '/>';
    s += t(94, y + 26, k[1], { size: 15, f: 'h', fill: on ? '#9ff5c4' : '#dbe6f2' }) + t(94, y + 48, k[2], { size: 14, fill: C.dim });
    if (on) s += t(490, y + 37, V[k[0]], { size: 17, a: 'end', f: 'm', w: 700, fill: '#fff', cls: cur ? 'pgd-pop' : '' }); else if (!cur) s += t(490, y + 37, '· · ·', { size: 16, a: 'end', f: 'm', fill: '#5d6b80' });
    /* the key switch */
    var kx = 528, ky = y + 29, ang = on ? 90 : 0;
    s += '<circle cx="' + kx + '" cy="' + ky + '" r="22" fill="#1a2028" stroke="#5d6b80" stroke-width="2"/>';
    s += '<g transform="rotate(' + ang + ' ' + kx + ' ' + ky + ')"' + (on && cur ? ' class="pgd-pop"' : '') + '><rect x="' + (kx - 4) + '" y="' + (ky - 15) + '" width="8" height="30" rx="3" fill="' + (on ? '#2ee07a' : '#c7d4e4') + '"/><circle cx="' + kx + '" cy="' + (ky - 15) + '" r="7" fill="' + (on ? '#2ee07a' : '#c7d4e4') + '"/></g>';
  });
  return s;
}
function tray8a(fx, x, y, open, peel) {
  var Sp = F8().split || {}, s = '', w = 300, h = 210;
  s += '<g filter="url(#' + fx.sh + ')"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="#151c27" stroke="#3a4757" stroke-width="2"/></g>';
  for (var i = 0; i < 40; i++) s += '<rect x="' + (x + 16 + (i % 10) * 27) + '" y="' + (y + 40 + Math.floor(i / 10) * 32) + '" width="22" height="26" rx="2" fill="' + (open ? '#33465c' : '#222c38') + '"/>';
  s += t(x + 16, y + 28, 'TEST TRAY · ' + fmt((Sp.sizes || [])[2]) + ' cells', { size: 15, f: 'h', fill: '#c7d4e4' });
  s += t(x + 16, y + h - 16, fmt((Sp.defects || [])[2]) + ' real defects inside (Step 1 split)', { size: 14, fill: C.dim });
  if (!open) {   // the seal tape (peel goes from the top-left corner)
    var pf = peel || 0;
    s += '<g opacity="' + (1 - pf * .85) + '"><path d="M' + (x - 8) + ' ' + (y + 70) + 'L' + (x + w + 8) + ' ' + (y + 150) + 'L' + (x + w + 8) + ' ' + (y + 186) + 'L' + (x - 8) + ' ' + (y + 106) + 'Z" fill="#c01a36" stroke="#ff8aa0"/>' +
      '<text x="' + (x + w / 2) + '" y="' + (y + 132) + '" font-family="' + A.FH + '" font-size="17" font-weight="700" fill="#fff" text-anchor="middle" transform="rotate(14.5 ' + (x + w / 2) + ' ' + (y + 128) + ')">SEALED SINCE STEP 1</text></g>';
  } else s += '<path d="M' + (x - 8) + ' ' + (y + 70) + 'l40 10l-30 22z" fill="#c01a36" opacity=".7"/>' + t(x + w - 14, y + 28, 'OPEN · ONCE', { size: 15, a: 'end', f: 'h', fill: '#ffb547' });
  return s;
}
function work8a(c, title) {
  var V = frozen8a(), L = c.state.locked;
  return clean([{ h: title }].concat(KEYS8A.map(function (k) { var on = L.indexOf(k[0]) >= 0; return { v: on ? V[k[0]] : '—', k: k[1].toLowerCase() + (on ? ' · locked' : ''), col: on ? '#2ee07a' : '#5d6b80' }; })).concat([{ v: L.length + ' of 6', k: 'settings locked', res: true }, { tag: V.you ? 'your value' : 'typical value' }]));
}
function keyFrame8a(g) {
  return { cap: ['Turn a key on the model and the blend weight', 'Turn a key on each gate', 'Turn the last key: the flow'][g],
    note: 'Every setting the trial depends on is locked before the test tray opens. A locked setting cannot be changed by what the test shows.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs, nx = GROUP8A[g].filter(function (k) { return c.state.locked.indexOf(k) < 0; })[0];
      s += cabinet8a(c, fx, { cur: nx || c.state.last });
      s += tray8a(fx, 626, 56, false, 0);
      s += A.glass(626, 300, 304, 216, { fx: fx, col: '#2b4157' }) + t(644, 334, 'WHY LOCK FIRST?', { size: 15, f: 'h', fill: '#46e3ff', ls: '.06em' }) +
        t(644, 366, 'The test tray must judge the', { size: 16, fill: '#dbe6f2' }) + t(644, 390, 'system you built — not one', { size: 16, fill: '#dbe6f2' }) + t(644, 414, 'tuned on the test answers.', { size: 16, fill: '#dbe6f2' }) +
        t(644, 456, 'Validation chose the settings.', { size: 16, fill: '#ffb547', w: 700 }) + t(644, 482, 'The test only measures them.', { size: 16, fill: '#ffb547', w: 700 });
      if (nx) { var i = KEYS8A.map(function (k) { return k[0]; }).indexOf(nx), y = 80 + i * 70; s += A.target('key', '<circle cx="528" cy="' + (y + 29) + '" r="28" fill="none" stroke="#ffb547" stroke-width="3"/>', 'turn the key', 494, y + 33, { la: 'end' }); }
      return s;
    },
    work: function (c) { return work8a(c, 'The freeze sheet'); },
    on: { key: function (c) { var nx = GROUP8A[g].filter(function (k) { return c.state.locked.indexOf(k) < 0; })[0]; if (!nx) return; c.state.locked.push(nx); c.state.last = nx; if (GROUP8A[g].every(function (k) { return c.state.locked.indexOf(k) >= 0; })) c.next(); else c.redraw(true); } },
    auto: function (c) { GROUP8A[g].forEach(function (k) { if (c.state.locked.indexOf(k) < 0) c.state.locked.push(k); }); } };
}
D.register('8a', {
  init: function () { return { locked: [], last: null, peel: 0, tamper: 0 }; },
  frames: [keyFrame8a(0), keyFrame8a(1), keyFrame8a(2),
  { cap: 'All six locked. Now peel the seal off the test tray',
    note: 'The test tray has been sealed since Step 1. It opens once, after the freeze. One way only.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs + cabinet8a(c, fx, {});
      s += '<g class="pgd-pop"><rect x="660" y="410" width="240" height="70" rx="10" fill="#0b1a12" stroke="#2ee07a" stroke-width="3" transform="rotate(-6 780 445)"/><text x="780" y="456" font-family="' + A.FH + '" font-size="26" font-weight="700" fill="#2ee07a" text-anchor="middle" transform="rotate(-6 780 445)">ALL 6 FROZEN</text></g>';
      s += tray8a(fx, 626, 150, false, 0);
      s += A.target('peel', '<g><circle cx="626" cy="226" r="22" fill="#c01a36" stroke="#fff" stroke-width="2"/><path d="M618 226l8-8 8 8" stroke="#fff" stroke-width="2.5" fill="none"/></g>', 'peel the seal', 780, 120, { kind: 'drag', to: snapTo(626, 226, 930, 330, 16), cls: 'pgd-solid' });
      return s;
    },
    work: function (c) { return [{ h: 'Before the seal breaks' }, { v: '6 of 6', k: 'settings locked', res: true, col: '#2ee07a' }, { t: 'In the lab you also lock a guess first: a range on the number line for “defects passed per 100”. Guess, then look — never the other way round.' }, { tag: frozen8a().you ? 'your value' : 'typical value' }]; },
    bind: function (c, root) {
      var el = root.querySelector('[data-pgd-t=peel]');
      D.onDrag(root, el, { start: { x: 626, y: 226 }, step: 16, move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - 626) + ' ' + (p.y - 226) + ')'); },
        drop: function (p) { if (p.x > 860 && p.y > 280) c.next(); else el.removeAttribute('transform'); } });
    },
    auto: function (c) { c.state.peel = 1; } },
  { cap: 'Change one setting now, and the tamper light comes on',
    note: 'After the seal breaks, any change to a frozen setting means the test is not an honest test any more. The acceptance sheet then allows only no-go.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs, on = c.state.tamper, V = frozen8a();
      s += tray8a(fx, 40, 40, true, 1);
      s += '<rect x="40" y="280" width="300" height="236" rx="14" fill="url(#' + fx.mt + ')" stroke="#5d6b80" stroke-width="2"/>' + t(60, 312, 'LOW GATE · MONO', { size: 15, f: 'h', fill: '#c7d4e4' });
      s += t(60, 350, 'frozen at ' + V.low, { size: 17, f: 'm', w: 700, fill: '#fff' });
      s += '<circle cx="190" cy="430" r="52" fill="#0b121b" stroke="#3a4757" stroke-width="3"/><g transform="rotate(' + (on ? 38 : 0) + ' 190 430)"' + (on ? ' class="pgd-pop"' : '') + '><rect x="186" y="384" width="8" height="40" rx="3" fill="' + (on ? '#ff5050' : '#c7d4e4') + '"/></g>';
      if (!on) s += A.target('nudge', '<circle cx="190" cy="430" r="60" fill="none" stroke="#ffb547" stroke-width="3"/>', 'nudge it a little', 190, 508, {});
      /* the tamper light */
      s += '<circle cx="560" cy="120" r="58" fill="' + (on ? '#ff5050' : '#2a1218') + '" stroke="#5d6b80" stroke-width="4"' + (on ? ' filter="url(#' + fx.gl + ')" class="pgd-pop"' : '') + '/>' + t(560, 214, 'TAMPER LIGHT', { size: 15, a: 'middle', f: 'h', fill: on ? '#ff8aa0' : C.dim });
      s += A.glass(380, 250, 550, 266, { fx: fx, col: on ? '#7a2a3a' : '#2b4157' });
      if (on) s += t(400, 288, 'NOT AN HONEST TEST ANY MORE', { size: 18, f: 'h', fill: '#ff5050' }) + t(400, 324, 'The freeze sheet compares now with the seal:', { size: 16, fill: '#dbe6f2' }) +
        t(400, 352, '“low gate changed after the seal broke”.', { size: 16, f: 'm', fill: '#ffb547' }) + t(400, 392, 'The test number now partly measures your nudge.', { size: 16, fill: '#dbe6f2' }) +
        t(400, 420, 'The go / no-go sheet then allows only NO-GO,', { size: 16, fill: '#dbe6f2' }) + t(400, 444, 'until a NEW sealed tray is tested.', { size: 16, fill: '#dbe6f2' }) + t(400, 488, 'Bad test number? Write it down. Do not tune.', { size: 17, w: 700, fill: '#ffb547' });
      else s += t(400, 290, 'The tray is open. Your trial is next.', { size: 17, fill: '#dbe6f2' }) + t(400, 322, 'What if the number looks bad and you', { size: 16, fill: C.dim }) + t(400, 346, '“fix” a gate a little?', { size: 16, fill: C.dim });
      return s;
    },
    work: function (c) { return c.state.tamper ? [{ h: 'Honest test?' }, { v: '1 setting', k: 'changed after the seal broke', col: '#ff5050' }, { op: '=', v: 'not honest', k: 'only NO-GO fits (8f)', res: true, col: '#ff5050' }, { t: 'The lab checks this itself: it keeps a fingerprint of the model weights and the flow, and the exact gate values.' }] : [{ h: 'The seal is broken' }, { t: 'Everything is frozen. Now the trial runs once (8b).' }]; },
    on: { nudge: function (c) { c.state.tamper = 1; c.redraw(true); } },
    auto: function (c) { c.state.tamper = 1; } }]
});

/* ============================ 8b  The line trial ============================ */
function line8b(fx, o) {   // tray → frozen stations → three lane bins
  var s = '', T = o.T, f = o.f || 0;
  if (!o.binsOnly) {
  s += A.belt(30, 250, 560, 34, { fx: fx, moving: o.moving });
  [['PHOTO CHECK', 120], ['MODEL', 280], ['ROUTE', 440]].forEach(function (q) { s += '<rect x="' + (q[1] - 62) + '" y="150" width="124" height="86" rx="10" fill="#121a24" stroke="#46e3ff" stroke-opacity=".6" stroke-width="2"/>' + t(q[1], 186, q[0], { size: 14, a: 'middle', f: 'h', fill: '#46e3ff' }) + '<path d="M' + (q[1] - 14) + ' 204h28M' + (q[1] - 14) + ' 214h28" stroke="#2ee07a" stroke-width="3"/>' + t(q[1], 260, '', {}) + '<rect x="' + (q[1] - 10) + '" y="236" width="20" height="14" fill="#3a4757"/>'; });
  s += t(280, 140, 'FROZEN LINE (8a)', { size: 14, a: 'middle', f: 'h', fill: '#2ee07a', ls: '.08em' });
  /* the moving cells on the belt */
  if (o.moving || f > 0) for (var i = 0; i < 9; i++) { var x = 40 + ((i * 64 + f * 640) % 540); s += '<rect x="' + x + '" y="254" width="26" height="26" rx="2" fill="#3b4e66" stroke="#5d6b80"/>'; }
  s += '<path d="M590 267H620V215" stroke="#5d6b80" stroke-width="3" fill="none" stroke-dasharray="6 5"/>'; }
  /* lane bins */
  var L = (T && T.lanes) || {}, n = (T && T.n) || 1;
  ['pass', 'person', 'stop'].forEach(function (k, i) {
    var x = 640 + i * 102, cnt = T ? Math.round((L[k] || 0) * f) : null, hh = T ? 170 * (L[k] || 0) / n * f : 0;
    s += '<rect x="' + x + '" y="120" width="86" height="190" rx="8" fill="#0b121b" stroke="' + LC[k] + '" stroke-width="2"/>';
    s += '<rect data-lane8="' + k + '" x="' + (x + 6) + '" y="' + (304 - hh) + '" width="74" height="' + hh + '" rx="4" fill="' + LC[k] + '" opacity=".75"/>';
    s += t(x + 43, 110, ['PASS', 'PERSON', 'STOP'][i], { size: 14, a: 'middle', f: 'h', fill: LC[k] });
    s += T ? '<text data-cnt8="' + k + '" x="' + (x + 43) + '" y="334" font-family="' + A.FM + '" font-size="18" font-weight="700" fill="#fff" text-anchor="middle">' + cnt + '</text>' : t(x + 43, 334, '?', { size: 18, a: 'middle', f: 'm', fill: C.dim });
  });
  return s;
}
function handle8b(x, y, prog) {   // the dead-man's handle: a T grip on a column, a progress ring
  return '<g><rect x="' + (x - 10) + '" y="' + (y + 10) + '" width="20" height="74" fill="#3a4757"/><rect x="' + (x - 64) + '" y="' + (y - 16) + '" width="128" height="30" rx="14" fill="#c01a36" stroke="#ffb547" stroke-width="3"/>' +
    '<rect x="' + (x - 54) + '" y="' + (y + 80) + '" width="108" height="16" rx="5" fill="#2a3340"/>' + t(x, y + 5, 'SQUEEZE', { size: 14, a: 'middle', f: 'h', fill: '#fff' }) +
    '<rect x="' + (x - 54) + '" y="' + (y + 100) + '" width="108" height="10" rx="5" fill="#18222f"/><rect class="pgd-hprog" x="' + (x - 54) + '" y="' + (y + 100) + '" width="' + (108 * (prog || 0)) + '" height="10" rx="5" fill="#3dffa0"/></g>';
}
function bindHandle(c, root, key, fld, T, ms, onDone) {   // hold to run; letting go pauses the line (progress is kept)
  var el = root.querySelector('[data-pgd-t=' + key + ']'); if (!el) return;
  var raf = 0, last = 0;
  function paint() { var f = c.state[fld] || 0, bar = el.querySelector('.pgd-hprog'); if (bar) bar.setAttribute('width', (108 * f).toFixed(1));
    root.querySelectorAll('[data-lane8]').forEach(function (r) { var k = r.getAttribute('data-lane8'), L = T.lanes, h = 170 * L[k] / T.n * f; r.setAttribute('y', (304 - h).toFixed(1)); r.setAttribute('height', h.toFixed(1)); });
    root.querySelectorAll('[data-cnt8]').forEach(function (r) { var k = r.getAttribute('data-cnt8'); r.textContent = Math.round(T.lanes[k] * f); }); }
  function tick(now) { c.state[fld] = Math.min(1, (c.state[fld] || 0) + (now - last) / ms); last = now; paint(); if (c.state[fld] >= 1) { stop(); onDone(); } else raf = requestAnimationFrame(tick); }
  function start(e) { if (e) e.preventDefault(); if (raf || (c.state[fld] || 0) >= 1) return; last = performance.now(); el.classList.add('holding'); raf = requestAnimationFrame(tick); }
  function stop() { cancelAnimationFrame(raf); raf = 0; el.classList.remove('holding'); }
  el.addEventListener('pointerdown', function (e) { try { el.setPointerCapture(e.pointerId); } catch (x) {} start(e); });
  el.addEventListener('pointerup', stop); el.addEventListener('pointercancel', stop); el.addEventListener('pointerleave', stop);
  el.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) start(); } });
  el.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') stop(); });
  c.onCleanup(stop);
}
function per100Rows(label, T, col) {
  var a = T.all || {};
  return [{ h: label }, { v: fmt(a.defPassed) + ' ÷ ' + fmt(a.def), k: 'defects whose final decision was pass ÷ real defects' }, { op: '×', v: '100', k: 'per 100 defects' }, { op: '=', v: f1(a.per100 != null ? a.per100 : 100 * a.defPassed / a.def) + ' per 100', k: 'target: at most 5', res: true, col: col }];
}
D.register('8b', {
  init: function () { return { prog: 0, prog2: 0, split: 0 }; },
  frames: [
  { cap: 'Squeeze the handle: the validation tray runs through the frozen line',
    note: 'A dead-man’s handle: the line runs only while you squeeze it. Let go and it pauses. First the tray you already know: validation.',
    svg: function (c) {
      var fx = A.fx(), V = F8().val || {};
      var s = A.stage({ floor: 380 }) + fx.defs + line8b(fx, { T: V, f: c.state.prog, moving: false });
      s += '<rect x="30" y="40" width="250" height="60" rx="10" fill="#0b121b" stroke="#46e3ff"/>' + t(46, 66, 'VALIDATION TRAY', { size: 15, f: 'h', fill: '#46e3ff' }) + t(46, 90, fmt(V.n) + ' cells · ' + fmt((V.all || {}).def) + ' defects', { size: 15, fill: '#c7d4e4' });
      s += A.glass(330, 392, 600, 124, { fx: fx, col: '#2b4157' }) + t(350, 428, 'Same cells as Steps 3–7: the gates were chosen on them.', { size: 16, fill: '#dbe6f2' }) + t(350, 458, 'A person answers every PERSON cell (the perfect checker).', { size: 16, fill: '#dbe6f2' }) + t(350, 490, 'Defect passed = expert says defect, final decision pass.', { size: 16, fill: C.dim });
      s += A.target('handle', handle8b(150, 420, c.state.prog), 'squeeze and hold', 150, 400, { kind: 'hold', cls: 'pgd-solid' });
      return s;
    },
    work: function (c) { var V = F8().val || {}, f = c.state.prog; return f < 1 ? [{ h: 'Validation run' }, { v: Math.round(V.n * f) + ' of ' + V.n, k: 'cells through the line' }, { t: 'Keep squeezing. Letting go only pauses the line.' }] : per100Rows('Validation run', V, '#ffb547').concat([{ v: V.lanes.pass + ' · ' + V.lanes.person + ' · ' + V.lanes.stop, k: 'pass · person · stop' }, { tag: 'typical value' }]); },
    bind: function (c, root) { bindHandle(c, root, 'handle', 'prog', F8().val || {}, 1100, function () { c.next(); }); },
    auto: function (c) { c.state.prog = 1; } },
  { cap: 'Now the sealed tray: the cells the line has never seen',
    note: 'The same frozen line, ONE run, on the test tray. The numbers appear here only after you ran your own trial in the lab.',
    svg: function (c) {
      var fx = A.fx(), ts = testSide(), s = A.stage({ floor: 380 }) + fx.defs;
      if (ts) {
        s += line8b(fx, { T: ts.T, f: c.state.prog2 || 0 });
        s += '<rect x="30" y="40" width="270" height="60" rx="10" fill="#1a1206" stroke="#ffb547"/>' + t(46, 66, ts.you ? 'YOUR TEST TRAY · OPEN' : 'TEST TRAY · REFERENCE RUN', { size: 15, f: 'h', fill: '#ffb547' }) + t(46, 90, fmt(ts.T.n) + ' cells · ' + fmt(ts.T.all.def) + ' defects', { size: 15, fill: '#c7d4e4' });
        s += A.target('handle', handle8b(150, 420, c.state.prog2 || 0), 'squeeze and hold', 150, 400, { kind: 'hold', cls: 'pgd-solid' });
      } else {
        s += line8b(fx, { T: null, f: 0, binsOnly: true });
        s += tray8a(fx, 120, 60, false, 0);
        s += sealTag(660, 370, 'lanes: after your own trial');
        s += A.glass(330, 392, 600, 124, { fx: fx, col: '#2b4157' }) + t(350, 428, 'Still sealed here. In the lab: lock the freeze sheet,', { size: 16, fill: '#dbe6f2' }) + t(350, 456, 'break the seal (8a), then run the trial once (8b).', { size: 16, fill: '#dbe6f2' }) + t(350, 490, 'This picture then fills with YOUR numbers.', { size: 16, w: 700, fill: '#ffb547' });
        s += A.target('seal', '<rect x="110" y="410" width="80" height="90" rx="10" fill="#151c27" stroke="#ffb547" stroke-width="3"/><path d="M135 450v-12a15 15 0 0 1 30 0v12" stroke="#ffb547" stroke-width="4" fill="none"/><rect x="128" y="448" width="44" height="34" rx="4" fill="#ffb547"/>', 'check the seal', 150, 396, {});
      }
      return s;
    },
    work: function (c) { var ts = testSide(); if (!ts) return [{ h: 'Test tray' }, { t: 'Sealed. No test number is shown before your own trial: seeing it first would tempt you to tune on it.' }, { v: (F8().val.all || {}).per100 != null ? f1(F8().val.all.per100) + ' per 100' : '?', k: 'what you know so far: validation' }, { tag: 'typical value' }];
      return (c.state.prog2 || 0) < 1 ? [{ h: 'Test run' }, { v: Math.round(ts.T.n * (c.state.prog2 || 0)) + ' of ' + ts.T.n, k: 'cells through the line' }] : per100Rows(ts.you ? 'Your test run' : 'Test run (reference, dev unlock)', ts.T, ts.T.all.per100 <= 5 ? '#2ee07a' : '#ff5050').concat([tagOf(ts)]); },
    bind: function (c, root) {
      var ts = testSide();
      if (!ts) { D.onTap(root.querySelector('[data-pgd-t=seal]'), function () { c.next(); }); return; }
      bindHandle(c, root, 'handle', 'prog2', ts.T, 1100, function () { c.next(); });
    },
    auto: function (c) { c.state.prog2 = 1; } },
  { cap: 'Validation and test, side by side',
    note: 'The gates were tuned on validation, so validation tends to look a little too good. The test tray is the honest number.',
    svg: function (c) {
      var fx = A.fx(), V = F8().val || {}, ts = testSide(), sp = c.state.split, s = A.stage() + fx.defs;
      function col(x, T, title, colr, locked) {
        var o = A.glass(x, 30, 430, 380, { fx: fx, col: colr }) + t(x + 20, 64, title, { size: 16, f: 'h', fill: colr });
        if (locked) return o + sealTag(x + 20, 120, 'locked until your own trial') + t(x + 20, 190, 'Run 8b in the lab: this side', { size: 16, fill: '#dbe6f2' }) + t(x + 20, 216, 'then shows your test numbers.', { size: 16, fill: '#dbe6f2' });
        var a = T.all; o += t(x + 20, 120, f1(a.per100) + '', { size: 46, f: 'm', w: 700, fill: a.per100 <= 5 ? '#2ee07a' : '#ff5050' }) + t(x + 130, 120, 'defects passed per 100', { size: 16, fill: '#c7d4e4' }) + t(x + 20, 150, a.defPassed + ' of ' + a.def + ' defects · ' + T.n + ' cells', { size: 16, f: 'm', fill: C.dim });
        var B = [['pass', T.lanes.pass], ['person', T.lanes.person], ['stop', T.lanes.stop]];
        B.forEach(function (b, i) { var w = 380 * b[1] / T.n; o += '<rect x="' + (x + 20) + '" y="' + (174 + i * 34) + '" width="' + w + '" height="24" rx="4" fill="' + LC[b[0]] + '" opacity=".8"/>' + t(x + 26 + w, 192 + i * 34, ' ' + b[1] + ' ' + b[0], { size: 15, f: 'm', fill: '#fff' }); });
        if (sp) ['mono', 'poly'].forEach(function (g, i) { var q = T[g] || {}; o += '<g class="pgd-pop">' + t(x + 20, 306 + i * 40, g.toUpperCase(), { size: 16, f: 'h', fill: '#a98bff' }) + t(x + 110, 306 + i * 40, q.defPassed + ' of ' + q.def + ' = ' + f1(q.per100 != null ? q.per100 : 100 * q.defPassed / q.def) + ' per 100', { size: 17, f: 'm', w: 700, fill: '#fff' }) + '</g>'; });
        return o;
      }
      s += col(30, V, 'VALIDATION · chose the gates', '#46e3ff', false) + col(500, ts && ts.T, ts ? (ts.you ? 'YOUR TEST TRAY · measured once' : 'TEST · REFERENCE (dev)') : 'TEST TRAY', '#ffb547', !ts);
      if (!sp) s += A.target('split', '<rect x="380" y="440" width="200" height="56" rx="28" fill="#1a2430" stroke="#a98bff" stroke-width="3"/>' + t(480, 474, 'MONO | POLY', { size: 16, a: 'middle', f: 'h', fill: '#a98bff' }), 'split by cell type', 480, 524, {});
      else s += t(480, 470, 'A gap between the trays is normal. A big gap: the gates were over-fitted to validation.', { size: 16, a: 'middle', fill: '#dbe6f2' }) + t(480, 500, 'Freeze first, test once, report what you get.', { size: 17, a: 'middle', w: 700, fill: '#ffb547' });
      return s;
    },
    work: function (c) { var V = F8().val, ts = testSide(); return clean(per100Rows('Validation', V, '#46e3ff').concat(c.state.split ? [{ v: V.mono.defPassed + '/' + V.mono.def + ' vs ' + V.poly.defPassed + '/' + V.poly.def, k: 'mono vs poly (validation)' }] : []).concat([{ tag: 'typical value' }]).concat(ts ? per100Rows(ts.you ? 'Your test tray' : 'Test (reference, dev)', ts.T, '#ffb547').concat([tagOf(ts)]) : [{ h: 'Test tray' }, { t: 'Locked until your own trial.' }])); },
    on: { split: function (c) { c.state.split = 1; c.redraw(true); } },
    auto: function (c) { c.state.split = 1; } }]
});

/* ============================ 8c  How sure is that number? ============================ */
function rows8c() { var ts = testSide(); if (ts && ts.rows && ts.rows.length) return { rows: ts.rows, you: true, name: 'YOUR TEST TRAY', ts: ts }; var v = valSide(); return { rows: v.rows, you: false, name: 'VALIDATION TRAY', ts: null }; }
function draw8c(st, rows, k) {   // k redrawn shifts (bootstrap: draw every cell with replacement), seeded like the lab (start 1)
  var s = st.seed, n = rows.length;
  for (var b = 0; b < k; b++) { var d = 0, e = 0; for (var i = 0; i < n; i++) { s = (s * 16807) % 2147483647; var r = rows[Math.floor((s - 1) / 2147483646 * n)]; if (r) { d++; if (r === 2) e++; } } st.dots.push(Math.round(1000 * e / d) / 10); }
  st.seed = s;
}
var NL8 = { x0: 300, x1: 920, max: 14, y: 400 };
function X8(v) { return NL8.x0 + (NL8.x1 - NL8.x0) * Math.max(0, Math.min(NL8.max, v)) / NL8.max; }
function numline8c(c, fx, o) {
  o = o || {}; var s = '', dots = c.state.dots, cnt = {};
  s += '<rect x="' + (NL8.x0 - 20) + '" y="40" width="' + (NL8.x1 - NL8.x0 + 40) + '" height="420" rx="14" fill="#08101a" opacity=".6"/>';
  for (var v = 0; v <= NL8.max; v += 2) s += '<path d="M' + X8(v) + ' ' + NL8.y + 'v10" stroke="#5d6b80"/>' + t(X8(v), NL8.y + 30, String(v), { size: 15, a: 'middle', f: 'm', fill: C.dim });
  s += '<path d="M' + NL8.x0 + ' ' + NL8.y + 'H' + NL8.x1 + '" stroke="#5d6b80" stroke-width="2"/>' + t((NL8.x0 + NL8.x1) / 2, NL8.y + 54, 'defects passed per 100 (one dot = one redrawn shift)', { size: 15, a: 'middle', fill: C.dim });
  s += '<path d="M' + X8(5) + ' 56V' + NL8.y + '" stroke="#ff5050" stroke-width="2.5" stroke-dasharray="7 5"/>' + t(X8(5) + 6, 74, 'TARGET 5', { size: 14, f: 'h', fill: '#ff5050' });
  var nn = dots.length, sh = nn > 60 ? 4 : 6;
  dots.forEach(function (d, i) { var b = Math.round(d * 2) / 2, k = cnt[b] = (cnt[b] || 0) + 1; s += '<circle cx="' + X8(b) + '" cy="' + (NL8.y - 8 - (k - 1) * (2 * sh + 1)) + '" r="' + sh + '" fill="#46e3ff"' + (i >= nn - (o.fresh || 0) ? ' class="pgd-drop"' : '') + '/>'; });
  if (o.band) { var B = o.band; s += '<g class="pgd-pop"><rect x="' + X8(B[0]) + '" y="' + (NL8.y - 268) + '" width="' + (X8(B[1]) - X8(B[0])) + '" height="22" rx="11" fill="' + (o.bcol || '#ffb547') + '" opacity=".35" stroke="' + (o.bcol || '#ffb547') + '"/>' + t(X8(B[0]), NL8.y - 278, f1(B[0]), { size: 15, a: 'middle', f: 'm', w: 700, fill: o.bcol || '#ffb547' }) + t(X8(B[1]), NL8.y - 278, f1(B[1]), { size: 15, a: 'middle', f: 'm', w: 700, fill: o.bcol || '#ffb547' }) + t((X8(B[0]) + X8(B[1])) / 2, NL8.y - 222, o.blabel || '', { size: 14, a: 'middle', f: 'h', fill: '#fff' }) + '</g>'; }
  if (o.band2) { var B2 = o.band2; s += '<rect x="' + X8(B2[0]) + '" y="' + (NL8.y - 230) + '" width="' + (X8(B2[1]) - X8(B2[0])) + '" height="14" rx="7" fill="#46e3ff" opacity=".3" stroke="#46e3ff" stroke-dasharray="4 3"/>' + t(X8(B2[1]) + 8, NL8.y - 218, 'middle 95% of your dots', { size: 14, fill: '#46e3ff' }); }
  return s;
}
function bag8c(fx, name, n) {
  return '<g filter="url(#' + fx.sh + ')"><path d="M60 200q-20 170 40 220h120q60-50 40-220z" fill="#6b4a2e" stroke="#a67c52" stroke-width="3"/><path d="M80 200q80-40 160 0" stroke="#3b2a1a" stroke-width="6" fill="none"/><path d="M108 188l-12-38M212 188l12-38" stroke="#c9a46a" stroke-width="4"/></g>' +
    t(160, 300, name.split(' ')[0], { size: 15, a: 'middle', f: 'h', fill: '#f1ecdf' }) + t(160, 324, name.split(' ').slice(1).join(' '), { size: 15, a: 'middle', f: 'h', fill: '#f1ecdf' }) + t(160, 352, fmt(n) + ' cells', { size: 15, a: 'middle', f: 'm', fill: '#f1ecdf' });
}
function mid95(d) { if (d.length < 10) return null; var s = d.slice().sort(function (a, b) { return a - b; }); return [s[Math.floor(0.025 * s.length)], s[Math.min(s.length - 1, Math.floor(0.975 * s.length))]]; }
function wilsonWork(k, n, you) {
  var w = wilson(k, n), zOpen = !!D.liveRes('8c') || window.__pgdUnlock;
  return [{ h: 'Wilson 95% band' }, { v: k + ' ÷ ' + n + ' = ' + w.p.toFixed(4), k: 'p = defects passed ÷ real defects' }, zOpen ? { v: 'z = 1.96', k: '95% of a bell curve' } : { v: 'z 🔒', k: 'the 95% number: your gap 1 in the lab' },
    { v: 'd = 1 + z² ÷ ' + n + (zOpen ? ' = ' + w.d.toFixed(4) : ''), k: '' }, { v: 'mid = (p + z² ÷ ' + (2 * n) + ') ÷ d' + (zOpen ? ' = ' + w.mid.toFixed(4) : ''), k: '' }, { v: 'half = z ÷ d × √(p(1−p) ÷ ' + n + ' + z² ÷ ' + fmt(4 * n * n) + ')' + (zOpen ? ' = ' + w.half.toFixed(4) : ''), k: '' },
    { op: '=', v: f1(w.lo) + ' to ' + f1(w.hi) + ' per 100', k: '100 × (mid ± half)', res: true, col: '#ffb547' }, { tag: you ? 'your value' : 'typical value' }];
}
D.register('8c', {
  init: function () { return { dots: [], seed: 1, band: 0, top: 0 }; },
  frames: [
  { cap: 'Draw a new shift out of the bag: the number moves',
    note: 'A shift is redrawn by picking cells from the tray at random, with replacement. Each redraw gives its own “defects passed per 100”.',
    svg: function (c) {
      var fx = A.fx(), R = rows8c(), s = A.stage() + fx.defs + numline8c(c, fx, { fresh: c.state.fresh }) + bag8c(fx, R.name, R.rows.length);
      if (c.state.dots.length < 3) s += A.target('bag', '<path d="M50 190q-24 180 44 240h132q68-60 44-240z" fill="none" stroke="#ffb547" stroke-width="3"/>', 'draw a shift', 160, 470, {});
      return s;
    },
    work: function (c) { var R = rows8c(), d = c.state.dots; return clean([{ h: 'Redrawn shifts: ' + d.length }].concat(d.map(function (v, i) { return { v: f1(v) + ' per 100', k: 'shift ' + (i + 1) }; })).concat([{ t: 'Each draw takes ' + fmt(R.rows.length) + ' cells from the bag, one at a time, putting each back.' }, { tag: R.you ? 'your value' : 'typical value' }])); },
    on: { bag: function (c) { draw8c(c.state, rows8c().rows, 1); c.state.fresh = 1; if (c.state.dots.length >= 3) c.next(); else c.redraw(true); } },
    auto: function (c) { while (c.state.dots.length < 3) draw8c(c.state, rows8c().rows, 1); } },
  { cap: 'Draw 25 at a time: the dots pile up into a spread',
    note: 'Many redrawn shifts show how far the number could move just by luck of the draw.',
    svg: function (c) {
      var fx = A.fx(), R = rows8c(), s = A.stage() + fx.defs + numline8c(c, fx, { fresh: c.state.fresh, band2: c.state.dots.length >= 50 ? mid95(c.state.dots) : null }) + bag8c(fx, R.name, R.rows.length);
      if (c.state.dots.length < 103) s += A.target('bag', '<path d="M50 190q-24 180 44 240h132q68-60 44-240z" fill="none" stroke="#ffb547" stroke-width="3"/>', 'draw 25 shifts', 160, 470, {});
      return s;
    },
    work: function (c) { var R = rows8c(), d = c.state.dots, m = mid95(d); return clean([{ h: d.length + ' redrawn shifts' }, { v: f1(Math.min.apply(null, d)) + ' to ' + f1(Math.max.apply(null, d)), k: 'lowest to highest' }, m && { op: '→', v: f1(m[0]) + ' to ' + f1(m[1]), k: 'middle 95% (cut 2.5% off each end)', res: true, col: '#46e3ff' }, { t: 'The lab draws 2,000 shifts: ' + (R.you && R.ts.boot ? f1(R.ts.boot[0]) + ' to ' + f1(R.ts.boot[1]) : (!R.you ? f1(F8().val.boot[0]) + ' to ' + f1(F8().val.boot[1]) : 'see 8c')) + ' per 100.' }, { tag: R.you ? 'your value' : 'typical value' }]); },
    on: { bag: function (c) { draw8c(c.state, rows8c().rows, 25); c.state.fresh = 25; if (c.state.dots.length >= 103) c.next(); else c.redraw(true); } },
    auto: function (c) { while (c.state.dots.length < 103) draw8c(c.state, rows8c().rows, 25); } },
  { cap: 'A formula gives nearly the same band: lay the Wilson band on the dots',
    note: 'No redrawing needed: from the count alone, the Wilson formula gives a 95% band. It matches the spread of the dots.',
    svg: function (c) {
      var fx = A.fx(), R = rows8c(), T = R.you ? R.ts.T : F8().val, w = wilson(T.all.defPassed, T.all.def), s = A.stage() + fx.defs + numline8c(c, fx, { band: null, band2: mid95(c.state.dots) }) + bag8c(fx, R.name, R.rows.length);
      s += A.target('band', '<rect x="' + (X8(w.lo) - 6) + '" y="118" width="' + (X8(w.hi) - X8(w.lo) + 12) + '" height="40" rx="20" fill="#ffb547" opacity=".12" stroke="#ffb547" stroke-width="3" stroke-dasharray="7 5"/>', 'lay the formula band', (X8(w.lo) + X8(w.hi)) / 2, 106, {});
      return s;
    },
    work: function (c) { var R = rows8c(), T = R.you ? R.ts.T : F8().val; return wilsonWork(T.all.defPassed, T.all.def, R.you); },
    on: { band: function (c) { c.state.band = 1; c.next(); } },
    auto: function (c) { c.state.band = 1; } },
  { cap: 'A promise needs the TOP end of the band under the target',
    note: 'The point number can sit under 5 while the band reaches over it. Then the trial cannot promise the target.',
    svg: function (c) {
      var fx = A.fx(), R = rows8c(), T = R.you ? R.ts.T : F8().val, w = wilson(T.all.defPassed, T.all.def), ok = w.hi <= 5, s = A.stage() + fx.defs + numline8c(c, fx, { band: [w.lo, w.hi], blabel: 'WILSON 95%', bcol: c.state.top ? (ok ? '#2ee07a' : '#ff5050') : '#ffb547' });
      s += '<circle cx="' + X8(100 * T.all.defPassed / T.all.def) + '" cy="' + (NL8.y - 257) + '" r="7" fill="#fff"/>';
      s += A.glass(30, 70, 250, 300, { fx: fx, col: '#2b4157' }) + t(46, 104, R.you ? 'YOUR TEST TRAY' : 'VALIDATION (practice)', { size: 15, f: 'h', fill: R.you ? '#ffb547' : '#46e3ff' });
      s += t(46, 140, 'point: ' + f1(100 * T.all.defPassed / T.all.def), { size: 18, f: 'm', w: 700, fill: '#fff' }) + t(46, 172, 'band: ' + f1(w.lo) + ' to ' + f1(w.hi), { size: 18, f: 'm', w: 700, fill: '#ffb547' });
      if (c.state.top) s += '<g class="pgd-pop">' + t(46, 216, 'top end ' + f1(w.hi) + (ok ? ' ≤ 5' : ' > 5'), { size: 18, f: 'm', w: 700, fill: ok ? '#2ee07a' : '#ff5050' }) + t(46, 248, ok ? 'promise holds' : 'cannot promise 5', { size: 17, w: 700, fill: ok ? '#2ee07a' : '#ff5050' }) + t(46, 276, ok ? 'even at the bad end' : 'the real rate could', { size: 16, fill: '#dbe6f2' }) + t(46, 298, ok ? '' : 'be ' + f1(w.hi) + ' per 100', { size: 16, fill: '#dbe6f2' }) + '</g>';
      if (!R.you) s += sealTag(40, 500, 'your test band: after your trial');
      if (!c.state.top) s += A.target('top', '<circle cx="' + X8(w.hi) + '" cy="' + (NL8.y - 257) + '" r="20" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap the top end', X8(w.hi), NL8.y - 200, {});
      return s;
    },
    work: function (c) { var R = rows8c(), T = R.you ? R.ts.T : F8().val, w = wilson(T.all.defPassed, T.all.def); return [{ h: 'The promise' }, { v: f1(w.hi) + ' per 100', k: 'top end of the 95% band' }, { op: w.hi <= 5 ? '≤' : '>', v: '5 per 100', k: 'the target' }, { op: '→', v: w.hi <= 5 ? 'target sure' : 'target NOT sure', k: '', res: true, col: w.hi <= 5 ? '#2ee07a' : '#ff5050' }, { t: 'A small tray gives a wide band: promise only what the top end allows.' }, { tag: R.you ? 'your value' : 'typical value' }]; },
    on: { top: function (c) { c.state.top = 1; c.redraw(true); } },
    auto: function (c) { c.state.top = 1; } }]
});

/* ============================ 8d  Watch for drift ============================ */
var CELL8D = 2567, ALS8 = [['score', 'SCORE'], ['bright', 'BRIGHTNESS'], ['contrast', 'CONTRAST'], ['sharp', 'SHARPNESS']];
function looks(px) { var n = px.length, m = 0, i, s = Array.prototype.slice.call(px).sort(function (a, b) { return a - b; }), sh = 0; for (i = 0; i < n; i++) m += px[i]; for (var r = 0; r < 64; r++) for (var q = 0; q < 63; q++) sh += Math.abs(px[r * 64 + q + 1] - px[r * 64 + q]); return { bright: m / n, contrast: s[Math.floor(0.95 * 4096)] - s[Math.floor(0.05 * 4096)], sharp: sh / (64 * 63) }; }
function boxBlur(px) { var o = new Array(4096); for (var r = 0; r < 64; r++) for (var c = 0; c < 64; c++) { var s = 0, n = 0; for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) { var rr = r + a, cc = c + b; if (rr >= 0 && rr < 64 && cc >= 0 && cc < 64) { s += px[rr * 64 + cc]; n++; } } o[r * 64 + c] = Math.round(s / n); } return o; }
var LK8 = {};
function oneCell8d(kind) {
  if (LK8[kind]) return LK8[kind]; var px = D.pixels(CELL8D); if (!px) return null;
  var p = Array.prototype.slice.call(px); if (kind === 'dark') p = p.map(function (v) { return Math.round(0.65 * v); }); if (kind === 'blur') p = boxBlur(boxBlur(p));
  return (LK8[kind] = looks(p));
}
function alarms8d() { var r = D.liveRes('8d'); if (r && r.alarms) return { you: true, a: r.alarms, today: r.today, alarm: r.ALARM }; if (window.__pgdUnlock) { var Dr = F8().drift || {}, a = {}; Object.keys(Dr.sims || {}).forEach(function (k) { a[k] = Object.assign({ ring: Dr.ring[k] }, Dr.sims[k]); }); return { you: false, a: a, today: (F8().test || {}).today, alarm: Dr.alarm }; } return null; }
function camera8d(c, fx, kind) {
  var s = '', dark = kind === 'dark', blur = kind === 'blur', poly = kind === 'poly', rot = dark ? -70 : 0;
  s += '<defs><filter id="d8dark"><feComponentTransfer><feFuncR type="linear" slope=".65"/><feFuncG type="linear" slope=".65"/><feFuncB type="linear" slope=".65"/></feComponentTransfer></filter><filter id="d8blur"><feGaussianBlur stdDeviation="2.4"/></filter></defs>';
  /* gantry + camera body + lens with the exposure ring */
  s += '<rect x="40" y="34" width="420" height="16" rx="4" fill="#3a4757"/><rect x="190" y="50" width="120" height="70" rx="10" fill="url(#' + fx.mt + ')" stroke="#5d6b80" stroke-width="2"/>';
  s += '<circle cx="250" cy="150" r="56" fill="#151c27" stroke="#5d6b80" stroke-width="3"/><g transform="rotate(' + rot + ' 250 150)"' + (dark ? ' class="pgd-pop"' : '') + '>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { var a = i * 30 * Math.PI / 180; return '<path d="M' + (250 + 48 * Math.cos(a)) + ' ' + (150 + 48 * Math.sin(a)) + 'L' + (250 + 56 * Math.cos(a)) + ' ' + (150 + 56 * Math.sin(a)) + '" stroke="#8d9bb0" stroke-width="3"/>'; }).join('') + '<circle cx="250" cy="96" r="6" fill="#ffb547"/></g>';
  s += '<circle cx="250" cy="150" r="34" fill="#0a1a2a" stroke="#46e3ff" stroke-opacity=".5" stroke-width="2"/>' + (blur ? '<ellipse cx="244" cy="146" rx="26" ry="14" fill="#c7d4e4" opacity=".35" class="pgd-pop"/>' : '') + '<circle cx="240" cy="138" r="8" fill="#fff" opacity=".25"/>';
  s += t(320, 112, 'EXPOSURE RING', { size: 14, f: 'h', fill: C.dim });
  /* the photo it takes */
  var img = A.cell(CELL8D, 120, 236, 260, { full: true });
  if (dark) img = img.replace('<image ', '<image filter="url(#d8dark)" '); if (blur) img = img.replace('<image ', '<image filter="url(#d8blur)" ');
  s += '<rect x="112" y="228" width="276" height="276" rx="8" fill="#0b121b" stroke="#2b4157"/>' + img + t(250, 528, poly ? 'today: only poly cells come down the line' : 'cell ' + CELL8D + (dark ? ' · at 65% brightness' : blur ? ' · 3 × 3 blur, twice' : ' · as trained'), { size: 15, a: 'middle', f: 'm', fill: '#c7d4e4' });
  return s;
}
function dial8d(cx, cy, r, v) {   // a PSI dial: calm (green) up to 0.1, watch (amber) to the alarm level, act (red) beyond; full scale 0.5
  var a0 = Math.PI * .8, a1 = Math.PI * 2.2, P = function (f, rr) { var a = a0 + (a1 - a0) * f; return (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); };
  var arc = function (f0, f1, col, w, op) { return '<path d="M' + P(f0, r) + 'A' + r + ' ' + r + ' 0 ' + ((f1 - f0) * (a1 - a0) > Math.PI ? 1 : 0) + ' 1 ' + P(f1, r) + '" stroke="' + col + '" stroke-width="' + w + '" fill="none" opacity="' + op + '"/>'; };
  var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 14) + '" fill="#0a0f15" stroke="#3a4757" stroke-width="2"/>' + arc(0, .2, '#2ee07a', 10, .85) + arc(.2, .5, '#ffb547', 10, .85) + arc(.5, 1, '#ff5050', 10, .85);
  for (var k = 0; k <= 10; k++) s += '<path d="M' + P(k / 10, r - 8) + 'L' + P(k / 10, r - 15) + '" stroke="#5d6b80" stroke-width="2"/>';
  if (v != null) { var f = Math.min(1, v / 0.5); s += '<g class="pgd-pop"><path d="M' + cx + ' ' + cy + 'L' + P(f, r - 10) + '" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>'; }
  return s + '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="#c7d4e4"/>';
}
function gauges8d(c, fx, kind) {
  var AL = alarms8d(), s = A.glass(500, 30, 430, 486, { fx: fx, col: '#2b4157' }) + t(520, 62, 'DRIFT ALARMS · PSI', { size: 15, f: 'h', fill: '#46e3ff', ls: '.06em' }) + t(910, 62, kind ? 'simulated' : '', { size: 14, a: 'end', fill: '#ffb547' });
  if (!AL) s += sealTag(520, 96, 'needles: after your own 8d run');
  ALS8.forEach(function (a, i) {
    var cx = 612 + (i % 2) * 206, cy = 184 + Math.floor(i / 2) * 168, v = AL && kind ? (AL.a[kind] || {})[a[0]] : null, ring = AL && kind && ((AL.a[kind] || {}).ring || []).indexOf(a[0]) >= 0;
    s += dial8d(cx, cy, 52, v) + t(cx, cy + 34, v == null ? '?' : (+v).toFixed(v >= 10 ? 1 : v >= 1 ? 2 : 3), { size: 18, a: 'middle', f: 'm', w: 700, fill: v == null ? C.dim : ring ? '#ff8aa0' : '#fff' });
    s += t(cx, cy + 86, a[1], { size: 15, a: 'middle', f: 'h', fill: ring ? '#ff5050' : '#c7d4e4' }) + (ring ? t(cx, cy + 108, 'RINGS', { size: 14, a: 'middle', f: 'h', fill: '#ff5050', cls: 'pgd-pop' }) : '');
  });
  s += t(520, 506, 'green calm · amber watch · red act', { size: 14, fill: C.dim });
  return s;
}
function work8d(kind, title) {
  var b = oneCell8d('base'), k = kind === 'poly' ? null : oneCell8d(kind), AL = alarms8d(), rows = [{ h: title }];
  if (b && k) { rows.push({ t: 'This one photo (cell ' + CELL8D + '), measured now:' }); [['bright', 'brightness (mean grey)'], ['contrast', 'contrast (95th − 5th grey)'], ['sharp', 'sharpness (mean step to the next pixel)']].forEach(function (q) { rows.push({ v: f1(b[q[0]]) + ' → ' + f1(k[q[0]]), k: q[1], col: Math.abs(k[q[0]] - b[q[0]]) / b[q[0]] > 0.1 ? '#ffb547' : null }); }); }
  if (kind === 'poly') { var V = F8().val; rows.push({ v: V.mono.n + ' mono · ' + V.poly.n + ' poly', k: 'the reference mix (validation)' }, { op: '→', v: 'poly only', k: 'today’s order' }); }
  if (AL) { var a = AL.a[kind] || {}; rows.push({ t: 'PSI on ' + (F8().drift || {}).n[kind] + ' simulated cells vs the ' + (F8().drift || {}).nRef + ' validation cells (act above the alarm level):' }); ALS8.forEach(function (q) { rows.push({ v: (a[q[0]] != null ? (+a[q[0]]).toFixed(3) : '?'), k: q[1].toLowerCase() + ((a.ring || []).indexOf(q[0]) >= 0 ? ' · RINGS' : ''), col: (a.ring || []).indexOf(q[0]) >= 0 ? '#ff5050' : '#2ee07a' }); }); rows.push({ tag: AL.you ? 'your value' : 'typical value' }); }
  else rows.push({ t: 'Which alarms ring? Your guess comes first: tick the matrix in the lab, run 8d, then the needles move here.' });
  return rows;
}
function frame8d(kind, cap, label, mk, bindFn) {
  return { cap: cap, note: 'No expert labels on the real line: the alarms watch what the camera CAN see — the scores and simple photo numbers — and compare their mix with the validation tray (PSI).',
    svg: function (c) { var fx = A.fx(), done = c.state.did.indexOf(kind) >= 0, s = A.stage() + fx.defs + camera8d(c, fx, done ? kind : null) + gauges8d(c, fx, done ? kind : null); if (!done) s += mk(); else s += A.target('go', '<rect x="826" y="470" width="90" height="40" rx="20" fill="#1a2430" stroke="#46e3ff" stroke-width="2"/>' + t(871, 496, 'NEXT', { size: 14, a: 'middle', f: 'h', fill: '#46e3ff' }), 'next change', 916, 456, { la: 'end' }); return s; },
    work: function (c) { return c.state.did.indexOf(kind) >= 0 ? work8d(kind, label) : [{ h: label }, { t: 'Do it on the camera.' }]; },
    on: { go: function (c) { c.next(); }, mix: function (c) { if (c.state.did.indexOf(kind) < 0) { c.state.did.push(kind); c.redraw(true); } } },
    bind: function (c, root) { if (bindFn && c.state.did.indexOf(kind) < 0) bindFn(c, root, kind); },
    auto: function (c) { if (c.state.did.indexOf(kind) < 0) c.state.did.push(kind); } };
}
function clothBind(c, root, kind) {   // wipe a greasy cloth across the lens
  var el = root.querySelector('[data-pgd-t=cloth]'); if (!el) return;
  D.onDrag(root, el, { start: { x: 365, y: 150 }, step: 16, move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - 365) + ' ' + (p.y - 150) + ')'); },
    drop: function (p) { if (Math.abs(p.x - 250) < 50 && Math.abs(p.y - 150) < 50) { c.state.did.push(kind); c.redraw(true); } else el.removeAttribute('transform'); } });
}
function arcBind(c, root, kind) {   // turn the exposure ring: drag its dot round the ring (keyboard: arrows)
  var el = root.querySelector('[data-pgd-t=ring]'); if (!el) return;
  D.onDrag(root, el, { start: { x: 250, y: 94 }, step: 12, clamp: function (q) { var a = Math.atan2(q.y - 150, q.x - 250); a = Math.max(-Math.PI * .95, Math.min(-Math.PI / 2, a)); return { x: 250 + 56 * Math.cos(a), y: 150 + 56 * Math.sin(a) }; },
    move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - 250) + ' ' + (p.y - 94) + ')'); },
    drop: function (p) { if (p.x < 215) { c.state.did.push(kind); c.redraw(true); } else el.removeAttribute('transform'); } });
}
D.register('8d', {
  init: function () { return { did: [] }; },
  frames: [
  frame8d('dark', 'Twist the exposure ring: every photo comes out darker', 'Darker exposure (lamp ageing)', function () { return A.target('ring', '<circle cx="250" cy="94" r="14" fill="#ffb547" stroke="#fff" stroke-width="2"/>', 'twist the ring', 250, 222, { kind: 'drag', to: '197,132', cls: 'pgd-solid' }); }, arcBind),
  frame8d('blur', 'Smear the lens: every photo comes out soft', 'Blurred lens (focus drifted)', function () { return A.target('cloth', '<g><rect x="330" y="128" width="70" height="44" rx="8" fill="#d9c4a8" stroke="#fff" stroke-width="2"/><path d="M340 140h50M340 152h50M340 164h50" stroke="#a68a64" stroke-width="2"/></g>', 'smear the lens', 365, 222, { kind: 'drag', to: snapTo(365, 150, 250, 150, 16), cls: 'pgd-solid' }); }, clothBind),
  frame8d('poly', 'Swap the cell mix: today only poly cells come down the line', 'Only poly cells (a new order)', function () { return A.target('mix', '<g><rect x="330" y="236" width="140" height="120" rx="10" fill="#151c27" stroke="#a98bff" stroke-width="3"/>' + t(400, 270, 'CELL MIX', { size: 14, a: 'middle', f: 'h', fill: '#a98bff' }) + t(400, 300, 'mono + poly', { size: 16, a: 'middle', fill: '#dbe6f2' }) + t(400, 330, '→ poly only', { size: 16, a: 'middle', w: 700, fill: '#ffb547' }) + '</g>', 'swap the cassette', 400, 384, {}); }),
  { cap: 'Which alarm catches which change',
    note: 'Each simulated change moves a different mix of needles. Today’s line (the test tray) is compared the same way.',
    svg: function (c) {
      var fx = A.fx(), AL = alarms8d(), Dr = F8().drift || {}, s = A.stage() + fx.defs, K = [['dark', 'Darker exposure'], ['blur', 'Blurred lens'], ['poly', 'Only poly cells'], ['fault', 'Fogged copies (1 in 4)']];
      s += A.glass(30, 30, 900, 330, { fx: fx, col: '#2b4157' }) + t(50, 66, 'CHANGE', { size: 15, f: 'h', fill: C.dim });
      ALS8.forEach(function (a, j) { s += t(400 + j * 135, 66, a[1], { size: 14, a: 'middle', f: 'h', fill: '#c7d4e4' }); });
      K.forEach(function (k, i) { var y = 110 + i * 56, a = AL && AL.a[k[0]]; s += t(50, y, k[1], { size: 17, w: 700, fill: '#fff' });
        ALS8.forEach(function (q, j) { var x = 400 + j * 135; if (!a) { s += '<rect x="' + (x - 40) + '" y="' + (y - 22) + '" width="80" height="32" rx="6" fill="#0b121b" stroke="#3a4757" stroke-dasharray="4 4"/>' + t(x, y, '?', { size: 17, a: 'middle', f: 'm', fill: C.dim }); return; } var v = a[q[0]], r = (a.ring || []).indexOf(q[0]) >= 0; s += '<rect x="' + (x - 46) + '" y="' + (y - 22) + '" width="92" height="32" rx="6" fill="' + (r ? '#ff5050' : '#2ee07a') + '" fill-opacity=".14" stroke="' + (r ? '#ff5050' : '#2ee07a') + '"/>' + t(x, y, (+v).toFixed(v >= 1 ? 2 : 3), { size: 16, a: 'middle', f: 'm', w: 700, fill: r ? '#ff8aa0' : '#9ff5c4' }); }); });
      s += A.glass(30, 380, 900, 136, { fx: fx, col: '#2b4157' }) + t(50, 414, 'PSI = sum over 10 bins of (today − reference) × ln(today ÷ reference)', { size: 17, f: 'm', fill: '#dbe6f2' });
      s += t(50, 446, 'The reference against itself gives 0. Rule of thumb: under 0.1 calm, 0.1–0.25 watch, above: act.', { size: 16, fill: C.dim });
      s += AL ? t(50, 482, 'Today (the test tray): ' + (AL.today && AL.today.ring && AL.today.ring.length ? 'RINGS on ' + AL.today.ring.join(', ') : 'calm — highest ' + Math.max(AL.today.score, AL.today.bright, AL.today.contrast, AL.today.sharp).toFixed(3)) + (AL.you ? '' : ' (reference, dev)'), { size: 17, w: 700, fill: '#ffb547' }) : sealTag(50, 484, 'values: after your own 8d run (guess first)');
      return s;
    },
    work: function () { var AL = alarms8d(), Dr = F8().drift || {}; return clean([{ h: 'How PSI is built' }, { v: fmt(Dr.nRef) + ' values', k: 'reference: the validation tray' }, { v: '10 bins', k: 'each holds 10% of the reference' }, { v: 'share today per bin', k: 'counted the same way' }, { t: 'Each bin adds (today − ref) × ln(today ÷ ref): zero when the shares agree, big when they move apart.' }, AL ? { tag: AL.you ? 'your value' : 'typical value' } : { t: 'Simulated changes are made from line photos by the lab (65% brightness; blur twice; poly only; fogged copies).' }]); } }]
});
/* ============================ 8e  Your own factory photos ============================ */
var STR8 = null;
function stranger8e() {   // the lab's own "not an EL photo" sample: sky, sun, a roof — drawn the same way, then 64 x 64 grey
  if (STR8) return STR8;
  try {
    var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#7ec8ff'); gr.addColorStop(1, '#e8f4ff'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(196, 60, 32, 0, 7); g.fill();
    g.fillStyle = '#8a4b2a'; g.beginPath(); g.moveTo(20, 170); g.lineTo(128, 96); g.lineTo(236, 170); g.fill(); g.fillStyle = '#c9b89a'; g.fillRect(44, 170, 168, 86);
    var s = document.createElement('canvas'); s.width = s.height = 64; var h = s.getContext('2d'); h.imageSmoothingEnabled = true; h.imageSmoothingQuality = 'high'; h.drawImage(c, 0, 0, 256, 256, 0, 0, 64, 64);
    var d = h.getImageData(0, 0, 64, 64).data, px = new Array(4096); for (var i = 0; i < 4096; i++) px[i] = Math.round(0.299 * d[4 * i] + 0.587 * d[4 * i + 1] + 0.114 * d[4 * i + 2]);
    STR8 = { url: c.toDataURL('image/png'), looks: looks(px) };
  } catch (e) { STR8 = { url: '', looks: null }; }
  return STR8;
}
var REAL8E = 1876;
function where8e(k, v) { var R = ((F8().drift || {}).refd || {})[k] || [], n = R.length, b = 0; for (var i = 0; i < n; i++) if (R[i] < v) b++; return { pct: n ? 100 * b / n : 50, lo: R[Math.floor(0.01 * n)], hi: R[Math.floor(0.99 * n)] }; }
function scale8e(c, fx, which) {
  var L = which === 'str' ? stranger8e().looks : which === 'real' ? (function () { var px = D.pixels(REAL8E); return px ? looks(px) : null; })() : null;
  var out = L ? ['bright', 'contrast', 'sharp'].filter(function (k) { var w = where8e(k, L[k]); return w.pct < 1 || w.pct > 99; }).length : 0, tilt = !L ? 0 : out ? -12 : 0, s = '';
  s += '<path d="M250 470V170" stroke="#8d9bb0" stroke-width="10"/><path d="M190 486h120" stroke="#5d6b80" stroke-width="12" stroke-linecap="round"/><circle cx="250" cy="166" r="12" fill="#ffb547"/>';
  s += '<g transform="rotate(' + tilt + ' 250 166)" style="transition:transform .6s"><path d="M70 166H430" stroke="#c7d4e4" stroke-width="7" stroke-linecap="round"/>';
  [[90, 'this photo'], [410, 'training photos']].forEach(function (p, i) { s += '<path d="M' + p[0] + ' 166L' + (p[0] - 56) + ' 270M' + p[0] + ' 166L' + (p[0] + 56) + ' 270" stroke="#8d9bb0" stroke-width="2"/><path d="M' + (p[0] - 70) + ' 270h140q-10 30-70 30t-70-30z" fill="#3a4757" stroke="#8d9bb0"/>' + t(p[0], 322, p[1], { size: 15, a: 'middle', f: 'h', fill: '#c7d4e4' }); });
  s += [1878, 2567, 986, 1089].map(function (id, i) { return A.cell(id, 372 + (i % 2) * 40 - 2 + (i > 1 ? 10 : 0), 220 - Math.floor(i / 2) * 36, 34, {}); }).join('') + t(410, 344, fmt((F8().drift || {}).nRef) + ' (validation)', { size: 14, a: 'middle', f: 'm', fill: C.dim });
  if (which === 'str') s += '<image href="' + stranger8e().url + '" x="50" y="196" width="80" height="80" class="pgd-drop"/>';
  if (which === 'real') s += A.cell(REAL8E, 50, 196, 80, { full: true, cls: 'pgd-drop' });
  s += '</g>';
  return { s: s, L: L, out: out };
}
function table8e(fx, L, title) {
  var s = A.glass(500, 30, 430, 486, { fx: fx, col: '#2b4157' }) + t(520, 64, title, { size: 15, f: 'h', fill: '#46e3ff', ls: '.05em' });
  s += t(520, 98, 'photo number', { size: 14, fill: C.dim }) + t(724, 98, 'this', { size: 14, a: 'end', fill: C.dim }) + t(910, 98, 'training: 1%–99%', { size: 14, a: 'end', fill: C.dim });
  [['bright', 'brightness'], ['contrast', 'contrast'], ['sharp', 'sharpness']].forEach(function (q, i) { var y = 150 + i * 92, w = where8e(q[0], L ? L[q[0]] : 0), out = L && (w.pct < 1 || w.pct > 99);
    s += t(520, y, q[1], { size: 17, w: 700, fill: '#fff' }) + t(724, y, L ? f1(L[q[0]]) : '—', { size: 18, a: 'end', f: 'm', w: 700, fill: !L ? C.dim : out ? '#ff5050' : '#2ee07a' }) + t(910, y, f1(w.lo) + ' – ' + f1(w.hi), { size: 16, a: 'end', f: 'm', fill: '#c7d4e4' });
    if (L) s += t(520, y + 28, out ? (w.pct < 1 ? 'lower than 99% of them' : 'higher than 99% of them') : 'inside · percentile ' + Math.round(w.pct), { size: 15, fill: out ? '#ff8aa0' : '#9ff5c4' }); });
  return s;
}
function curve8e(c, fx, k) {
  var Cv = F8().curve || [], s = A.glass(500, 30, 430, 486, { fx: fx, col: '#2b4157' }) + t(520, 64, 'LEARNING CURVE · SCORED ON VALIDATION', { size: 14, f: 'h', fill: '#46e3ff' });
  var ch = A.chart({ x: 576, y: 100, w: 320, h: 300, xd: [0, 3], yd: [0.8, 0.9], xt: [0, 1, 2, 3], yt: [0.8, 0.825, 0.85, 0.875, 0.9], fx: function (v) { return fmt((Cv[v] || {}).photos); }, fy: function (v) { return v.toFixed(3); }, xl: 'labelled photos (doubling)', yl: 'ranking score' });
  s += ch.svg; var pts = Cv.slice(0, k).map(function (p, i) { return ch.X(i) + ',' + ch.Y(p.auc); }).join(' ');
  if (k > 1) s += '<polyline points="' + pts + '" fill="none" stroke="#3dffa0" stroke-width="3"/>';
  Cv.slice(0, k).forEach(function (p, i) { s += '<circle cx="' + ch.X(i) + '" cy="' + ch.Y(p.auc) + '" r="6" fill="#3dffa0"' + (i === k - 1 ? ' class="pgd-pop"' : '') + '/>' + t(ch.X(i), ch.Y(p.auc) - 12, p.auc.toFixed(3), { size: 14, a: 'middle', f: 'm', w: 700, fill: '#3dffa0' }); });
  return s;
}
function pile8e(c, k) {   // the pile of labelled photos; tap the next stack to add it
  var Cv = F8().curve || [], s = '', ids = [986, 1432, 1089, 1987, 2037, 353, 2567, 1876];
  s += '<rect x="40" y="440" width="400" height="16" rx="4" fill="#3a4757"/>';
  for (var i = 0; i < 4; i++) { var on = i < k, h = 14 + i * 22, x = 60 + i * 96;
    for (var j = 0; j < Math.round(h / 6); j++) s += '<rect x="' + (x + (j % 2) * 3) + '" y="' + (436 - (j + 1) * 6) + '" width="70" height="5" rx="1" fill="' + (on ? '#46e3ff' : '#2a3340') + '" opacity="' + (on ? .85 : .6) + '"/>';
    s += on ? A.cell(ids[i], x + 15, 436 - Math.round(h / 6) * 6 - 46, 40, {}) : '';
    s += t(x + 35, 480, (i ? '+' : '') + fmt(Cv[i].photos - (i ? Cv[i - 1].photos : 0)), { size: 15, a: 'middle', f: 'm', w: 700, fill: on ? '#46e3ff' : C.dim }); }
  s += t(240, 512, 'pile: ' + fmt(k ? Cv[k - 1].photos : 0) + ' labelled photos', { size: 16, a: 'middle', f: 'm', w: 700, fill: '#fff' });
  return s;
}
D.register('8e', {
  init: function () { return { put: null, k: 0 }; },
  frames: [
  { cap: 'A stranger at the door: weigh a photo against the training photos',
    note: 'A model only knows photos like the ones it learned from. Before trusting a verdict, check whether the photo’s numbers sit inside the training range.',
    svg: function (c) {
      var fx = A.fx(), S = scale8e(c, fx, c.state.put), s = A.stage() + fx.defs + S.s + table8e(fx, S.L, 'IS IT LIKE THE TRAINING PHOTOS?');
      if (!c.state.put) s += A.target('str', '<g><rect x="40" y="370" width="110" height="110" rx="8" fill="#0b121b" stroke="#ffb547" stroke-width="2"/><image href="' + stranger8e().url + '" x="50" y="380" width="90" height="90"/></g>', 'put it on the scale', 230, 410, { kind: 'drag', to: snapTo(95, 425, 90, 236, 16), cls: 'pgd-solid', la: 'start' });
      else s += '<g class="pgd-pop"><rect x="30" y="360" width="440" height="120" rx="12" fill="#2a0d14" stroke="#ff5050" stroke-width="2"/>' + t(50, 396, 'A drawing of a house — not an EL photo.', { size: 17, w: 700, fill: '#ff8aa0' }) + t(50, 426, S.out + ' of 3 numbers outside the training range:', { size: 16, fill: '#dbe6f2' }) + t(50, 454, 'do not trust this verdict.', { size: 16, w: 700, fill: '#ffb547' }) + '</g>' + A.target('real', '<g><rect x="390" y="420" width="76" height="76" rx="8" fill="#0b121b" stroke="#ffb547" stroke-width="2"/>' + A.cell(REAL8E, 396, 426, 64, { full: true }) + '</g>', 'now a real cell', 410, 516, { kind: 'drag', to: snapTo(428, 458, 90, 236, 16), cls: 'pgd-solid', la: 'end' });
      return s;
    },
    work: function (c) { var L = c.state.put ? stranger8e().looks : null; return L ? [{ h: 'The stranger' }, { v: f1(L.bright), k: 'brightness (mean grey 0–255)' }, { v: f1(L.contrast), k: 'contrast' }, { v: f1(L.sharp), k: 'sharpness' }, { t: 'Compared with the 1st–99th percentile of the ' + (F8().drift || {}).nRef + ' validation photos (the same numbers as the 8d drift alarm).' }, { tag: 'typical value' }] : [{ h: 'The stranger' }, { t: 'A picture the lab draws for you: sky, sun, a roof.' }]; },
    bind: function (c, root) { var el = root.querySelector('[data-pgd-t=str]');
      if (el) { D.onDrag(root, el, { start: { x: 95, y: 425 }, step: 16, move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - 95) + ' ' + (p.y - 425) + ')'); }, drop: function (p) { if (p.y < 300 && p.x < 200) { c.state.put = 'str'; c.redraw(true); } else el.removeAttribute('transform'); } }); return; }
      var er = root.querySelector('[data-pgd-t=real]'); if (er) D.onDrag(root, er, { start: { x: 428, y: 458 }, step: 16, move: function (p) { er.setAttribute('transform', 'translate(' + (p.x - 428) + ' ' + (p.y - 458) + ')'); }, drop: function (p) { if (p.y < 300 && p.x < 200) { c.state.put = 'real'; c.next(); } else er.removeAttribute('transform'); } }); },
    auto: function (c) { c.state.put = 'real'; } },
  { cap: 'A real cell balances: its numbers sit inside the range',
    note: 'Inside the range does not prove the verdict is right — it only says the model has seen photos like this one.',
    svg: function (c) {
      var fx = A.fx(), S = scale8e(c, fx, 'real'), s = A.stage() + fx.defs + S.s + table8e(fx, S.L, 'IS IT LIKE THE TRAINING PHOTOS?');
      s += '<g class="pgd-pop"><rect x="170" y="360" width="310" height="120" rx="12" fill="#0b1a12" stroke="#2ee07a" stroke-width="2"/>' + t(186, 394, 'Cell ' + REAL8E + ': a real EL photo.', { size: 17, w: 700, fill: '#9ff5c4' }) + t(186, 424, S.out + ' of 3 numbers outside:', { size: 16, fill: '#dbe6f2' }) + t(186, 450, 'the scale balances.', { size: 16, fill: '#dbe6f2' }) + '</g>';
      s += A.target('stack', '<g><rect x="40" y="370" width="110" height="110" rx="8" fill="#0b121b" stroke="#ffb547" stroke-width="2"/>' + [0, 1, 2, 3, 4].map(function (j) { return '<rect x="' + (58 + (j % 2) * 4) + '" y="' + (452 - j * 12) + '" width="70" height="9" rx="2" fill="#46e3ff" opacity=".8"/>'; }).join('') + '</g>', 'start a labelled pile', 40, 510, { la: 'start' });
      return s;
    },
    work: function (c) { var px = D.pixels(REAL8E), L = px ? looks(px) : null; return L ? [{ h: 'Cell ' + REAL8E }, { v: f1(L.bright), k: 'brightness' }, { v: f1(L.contrast), k: 'contrast' }, { v: f1(L.sharp), k: 'sharpness' }, { tag: 'typical value' }] : [{ h: 'A real cell' }, { t: 'Put it on the scale.' }]; },
    on: { stack: function (c) { c.state.k = 1; c.next(); } },
    auto: function (c) { c.state.k = 1; } },
  { cap: 'Add stacks of labelled photos: what does each doubling buy?',
    note: 'The same Step 2 model trained on 10%, 25%, 50% and 100% of the train tray, always scored on the same validation cells.',
    svg: function (c) {
      var fx = A.fx(), k = c.state.k, s = A.stage({ floor: 430 }) + fx.defs + pile8e(c, k) + curve8e(c, fx, k);
      s += A.glass(30, 30, 440, 150, { fx: fx, col: '#2b4157' }) + t(50, 66, 'HOW MANY PHOTOS DO YOU NEED?', { size: 15, f: 'h', fill: '#46e3ff' }) + t(50, 100, 'Label more photos, train again,', { size: 16, fill: '#dbe6f2' }) + t(50, 126, 'score on the SAME validation tray.', { size: 16, fill: '#dbe6f2' }) + t(50, 160, 'Never on the test tray: this is a choice.', { size: 16, w: 700, fill: '#ffb547' });
      if (k < 4) { var x = 60 + k * 96; s += A.target('stack', '<rect x="' + (x - 8) + '" y="' + (436 - Math.round((14 + k * 22) / 6) * 6 - 10) + '" width="86" height="' + (Math.round((14 + k * 22) / 6) * 6 + 16) + '" rx="8" fill="none" stroke="#ffb547" stroke-width="3"/>', 'add this stack', x + 35, 290, {}); }
      return s;
    },
    work: function (c) { var Cv = F8().curve || [], k = c.state.k, rows = [{ h: 'The learning curve' }]; Cv.slice(0, k).forEach(function (p, i) { rows.push({ v: fmt(p.photos) + ' → ' + p.auc.toFixed(3), k: 'photos → ranking score · good cells stopped at 95%: ' + (100 * p.far).toFixed(1) + '%' }); }); if (k > 1) { var a = Cv[k - 2], b = Cv[k - 1]; rows.push({ op: '→', v: (b.auc - a.auc >= 0 ? '+' : '') + (b.auc - a.auc).toFixed(3), k: 'what this doubling bought', res: true, col: '#3dffa0' }); } rows.push({ tag: 'typical value' }); return rows; },
    on: { stack: function (c) { c.state.k++; if (c.state.k >= 4) c.next(); else c.redraw(true); } },
    auto: function (c) { c.state.k = 4; } },
  { cap: 'The curve is flattening: more of the same photos buys little',
    note: 'The last doubling bought almost nothing. Better labels or new kinds of photos (your Step 4 to-do boxes) are worth more than more of the same.',
    svg: function (c) {
      var fx = A.fx(), Cv = F8().curve || [], a = Cv[2] || {}, b = Cv[3] || {}, s = A.stage({ floor: 430 }) + fx.defs + pile8e(c, 4) + curve8e(c, fx, 4);
      s += A.glass(30, 30, 440, 330, { fx: fx, col: '#2b4157' }) + t(50, 66, 'THE LAST DOUBLING', { size: 15, f: 'h', fill: '#46e3ff' }) + t(50, 108, fmt(a.photos) + ' → ' + fmt(b.photos) + ' photos', { size: 20, f: 'm', w: 700, fill: '#fff' }) + t(50, 146, 'ranking score ' + a.auc.toFixed(3) + ' → ' + b.auc.toFixed(3), { size: 18, f: 'm', fill: '#3dffa0' }) + t(50, 180, '= ' + ((b.auc - a.auc) >= 0 ? '+' : '') + (b.auc - a.auc).toFixed(3), { size: 22, f: 'm', w: 700, fill: '#ffb547' });
      s += t(50, 230, 'Buy instead (Step 4 to-do boxes):', { size: 16, w: 700, fill: '#dbe6f2' }) + ['more photos like the misses', 'experts re-check unsure labels', 'sharper photos', 'fix where the model looks'].map(function (x, i) { return t(64, 262 + i * 24, '· ' + x, { size: 16, fill: '#c7d4e4' }); }).join('');
      return s;
    },
    work: function () { var Cv = F8().curve || [], a = Cv[2], b = Cv[3]; return [{ h: 'What more photos buy' }, { v: b.auc.toFixed(3) + ' − ' + a.auc.toFixed(3), k: 'ranking score, 100% minus 50%' }, { op: '=', v: (b.auc - a.auc >= 0 ? '+' : '') + (b.auc - a.auc).toFixed(3), k: 'almost flat', res: true, col: '#ffb547' }, { tag: 'typical value' }]; } }]
});

/* ============================ 8f  Go or no-go ============================ */
var CARDS8F = [['target', 'TARGET vs BAND'], ['honest', 'HONEST TEST'], ['human', 'HUMAN LOAD'], ['poly', 'POLY RISK'], ['unsure', 'UNSURE LABELS'], ['drift', 'DRIFT PLAN']];
var TRAYS8F = [['go', 'GO', '#2ee07a', 120], ['cond', 'CONDITIONS', '#ffb21e', 400], ['nogo', 'NO-GO', '#ff5050', 680]];
function sheet8f() {   // the student's own evidence when 8b + 8c ran, else a PRACTICE sheet from the validation tray
  var b = D.liveRes('8b'), cc = D.liveRes('8c'), dd = D.liveRes('8d'), rate = (mech('7d') || {}).rate, T, lo, hi, you = false, honest = null;
  if (b && b.trial && cc && cc.ref) { T = b.trial; lo = cc.ref[0]; hi = cc.ref[1]; you = true; honest = b.honest; }
  else { T = F8().val; var w = wilson(T.all.defPassed, T.all.def); lo = w.lo; hi = w.hi; T = Object.assign({ target: 5 }, T); }
  var share = T.lanes.person / T.n, needed = Math.round(30 * 60 * share), checkers = rate && rate.perHour ? Math.ceil(needed / rate.perHour) : null, point = T.all.per100;
  var F = { you: you, T: T, lo: lo, hi: hi, point: point, needed: needed, share: share, rate: rate, checkers: checkers, drift: dd, honest: honest };
  F.missed = point > 5 || lo > 5; F.straddle = !F.missed && hi > 5; F.polyRisk = T.poly.per100 > 5 || T.poly.per100 > T.mono.per100; F.dishonest = !!(honest && honest.frozen && honest.ok === false);
  return F;
}
function ok8f(F, key) {   // which trays fit this evidence (the lab's own acceptance rules) and why a tray is refused
  var R = {};
  if (key === 'target') { var want = F.missed ? 'nogo' : F.straddle ? 'cond' : 'go'; R.ok = [want]; R.why = { go: F.missed ? 'Refused: the trial measured ' + f1(F.point) + ' per 100, above 5. Conditions cannot fix a miss.' : 'Refused: the band reaches ' + f1(F.hi) + ' per 100, above the target of 5.', cond: F.missed ? 'Refused: a measured miss cannot be run with conditions. Change the system, test on a new sealed tray.' : 'Refused: the whole band is under 5 — no condition needed for the target.', nogo: 'Refused: the target is ' + (F.straddle ? 'not missed — the band only reaches over it. A bigger trial on a NEW sealed tray is the condition.' : 'met even at the top end.') }; }
  if (key === 'honest') { R.ok = [F.dishonest ? 'nogo' : 'go']; R.why = { go: 'Refused: ' + ((F.honest && F.honest.changed) || []).join(', ') + ' changed after the seal broke.', cond: F.dishonest ? 'Refused: no condition makes a tuned test honest again. Only no-go until a new sealed tray.' : 'Refused: the frozen values are unchanged — nothing to make conditional.', nogo: 'Refused: the test is honest — nothing was changed after the seal broke.' }; }
  if (key === 'human') { var one = F.checkers === 1; R.ok = [one ? 'go' : 'cond']; R.why = { go: F.checkers == null ? 'Refused: one checker’s speed was not measured (7d).' : 'Refused: ' + fmt(F.needed) + ' cells per hour to a person, one checker does ' + fmt(F.rate.perHour) + ' → ' + F.checkers + ' checkers.', cond: 'Refused: one checker keeps up — no extra checker needed.', nogo: 'Refused: a busy queue is fixed with more checkers (a condition), not by stopping the line.' }; }
  if (key === 'poly') { R.ok = [F.polyRisk ? 'cond' : 'go']; R.why = { go: 'Refused: poly lets ' + f1(F.T.poly.per100) + ' of 100 defects pass, mono ' + f1(F.T.mono.per100) + '. Watch poly separately.', cond: 'Refused: poly is not worse than mono here.', nogo: 'Refused: a weaker group is watched (a condition); it does not stop the whole line.' }; }
  if (key === 'unsure') { var u = F.T.unsureEscapes || 0; R.ok = [u ? 'cond' : 'go']; R.why = { go: 'Refused: ' + u + ' of the defects that passed had an unsure expert label (0.67). Experts re-check them.', cond: 'Refused: no defect that passed had an unsure label.', nogo: 'Refused: unsure labels are re-checked (a condition); they do not stop the line.' }; }
  if (key === 'drift') { R.ok = F.drift ? ['go', 'cond'] : ['cond']; R.why = { go: 'Refused: the drift alarm is not built yet (8d). On the line there are no labels: it is the only early warning.', cond: '', nogo: 'Refused: a drift alarm is a plan for the line (run it every shift), not a reason to stop it.' }; }
  return R;
}
function tray8f(c, fx) {
  var s = '';
  TRAYS8F.forEach(function (q) { s += '<rect x="' + (q[3] - 120) + '" y="300" width="240" height="214" rx="14" fill="#0b121b" stroke="' + q[2] + '" stroke-width="3"/>' + t(q[3], 334, q[1], { size: 18, a: 'middle', f: 'h', fill: q[2] });
    var inn = Object.keys(c.state.put).filter(function (k) { return c.state.put[k] === q[0]; });
    inn.forEach(function (k, i) { var nm = CARDS8F.filter(function (x) { return x[0] === k; })[0][1]; s += '<g class="pgd-keep"><rect x="' + (q[3] - 104) + '" y="' + (350 + i * 32) + '" width="208" height="26" rx="5" fill="#f1ecdf"/>' + t(q[3], 368 + i * 32, nm, { size: 14, a: 'middle', f: 'h', fill: '#1f2937' }) + '</g>'; }); });
  return s;
}
function card8f(F, key) {
  var T = F.T;
  return { target: ['at most 5 per 100', 'trial ' + f1(F.point) + ' · band ' + f1(F.lo) + '–' + f1(F.hi)], honest: ['frozen values since the seal', F.you ? (F.honest && F.honest.frozen ? (F.honest.ok ? 'unchanged' : 'CHANGED: ' + F.honest.changed.join(', ')) : 'no freeze sheet') : 'practice: unchanged'],
    human: [fmt(F.needed) + ' cells / hour to a person', F.rate ? 'one checker: ' + fmt(F.rate.perHour) + ' / hour (7d)' : 'one checker: not measured (7d)'], poly: ['poly ' + f1(T.poly.per100) + ' vs mono ' + f1(T.mono.per100), T.poly.defPassed + '/' + T.poly.def + ' vs ' + T.mono.defPassed + '/' + T.mono.def + ' defects passed'],
    unsure: [(T.unsureEscapes || 0) + ' of ' + T.all.defPassed + ' passed defects', 'had an unsure label (0.67)'], drift: [F.drift ? 'PSI alarm built (8d)' : 'alarm not built yet (8d)', F.drift ? 'act above the alarm level' : 'no labels on the line'] }[key];
}
function frame8f(g) {
  var keys = [CARDS8F[2 * g][0], CARDS8F[2 * g + 1][0]];
  return { cap: ['Place the evidence: the target and the honest test', 'Place the evidence: people and poly cells', 'Place the evidence: labels and the drift plan'][g],
    note: 'Each card goes on the tray its numbers allow: GO, GO WITH CONDITIONS, or NO-GO. A card on the wrong tray is refused with the reason from the acceptance rules.',
    svg: function (c) {
      var fx = A.fx(), F = sheet8f(), s = A.stage() + fx.defs + tray8f(c, fx), nx = keys.filter(function (k) { return !c.state.put[k]; })[0];
      s += t(30, 40, F.you ? 'YOUR ACCEPTANCE SHEET' : 'PRACTICE SHEET · validation numbers', { size: 15, f: 'h', fill: F.you ? '#ffb547' : '#46e3ff', ls: '.06em' });
      if (!F.you) s += sealTag(560, 40, 'your sheet: after 8b + 8c');
      if (nx) { var cd = card8f(F, nx), nm = CARDS8F.filter(function (x) { return x[0] === nx; })[0][1], want = ok8f(F, nx).ok[0], tx = TRAYS8F.filter(function (q) { return q[0] === want; })[0][3];
        s += A.target('card', '<g class="pgd-keep"><rect x="330" y="70" width="300" height="150" rx="8" fill="#f1ecdf" stroke="#ffb547" stroke-width="3" filter="url(#' + fx.sh + ')"/>' + t(480, 104, nm, { size: 18, a: 'middle', f: 'h', fill: '#1f2937' }) + t(480, 146, cd[0], { size: 17, a: 'middle', f: 'm', w: 700, fill: '#1f2937' }) + t(480, 180, cd[1], { size: 15, a: 'middle', fill: '#4a5668' }) + '</g>', 'slide onto a tray', 480, 246, { kind: 'drag', to: snapTo(480, 145, tx, 420, 16), cls: 'pgd-solid' }); }
      if (c.state.msg) s += '<g class="pgd-shake"><rect x="30" y="226" width="900" height="56" rx="8" fill="#2a0d14" stroke="#ff5050"/>' + t(46, 260, c.state.msg.length > 112 ? c.state.msg.slice(0, 111) + '…' : c.state.msg, { size: 15, fill: '#ff8aa0' }) + '</g>';
      return s;
    },
    work: function (c) { var F = sheet8f(), rows = [{ h: F.you ? 'Your evidence' : 'Practice evidence (validation)' }]; keys.forEach(function (k) { var cd = card8f(F, k); rows.push({ v: cd[0], k: CARDS8F.filter(function (x) { return x[0] === k; })[0][1].toLowerCase() + (c.state.put[k] ? ' → ' + c.state.put[k].toUpperCase() : '') }); });
      if (keys[0] === 'human') rows.push({ t: fmt(F.T.lanes.person) + ' of ' + fmt(F.T.n) + ' cells to a person × 30 cells/min × 60 = ' + fmt(F.needed) + ' per hour.' });
      if (c.state.msg) rows.push({ t: '<b>' + D.esc(c.state.msg) + '</b>' }); rows.push({ tag: F.you ? 'your value' : 'typical value' }); return rows; },
    bind: function (c, root) {
      var el = root.querySelector('[data-pgd-t=card]'); if (!el) return; var F = sheet8f(), nx = keys.filter(function (k) { return !c.state.put[k]; })[0];
      D.onDrag(root, el, { start: { x: 480, y: 145 }, step: 16, move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - 480) + ' ' + (p.y - 145) + ')'); },
        drop: function (p) { var tr = p.y > 290 ? TRAYS8F.filter(function (q) { return Math.abs(p.x - q[3]) < 130; })[0] : null; if (!tr) { el.removeAttribute('transform'); return; }
          var R = ok8f(F, nx); if (R.ok.indexOf(tr[0]) < 0) { c.state.msg = R.why[tr[0]]; c.redraw(true); return; }
          c.state.msg = ''; c.state.put[nx] = tr[0]; if (keys.every(function (k) { return c.state.put[k]; })) c.next(); else c.redraw(true); } });
    },
    auto: function (c) { var F = sheet8f(); keys.forEach(function (k) { c.state.put[k] = ok8f(F, k).ok[ok8f(F, k).ok.length - 1]; }); c.state.msg = ''; } };
}
D.register('8f', {
  init: function () { return { put: {}, msg: '', stamped: 0 }; },
  frames: [frame8f(0), frame8f(1), frame8f(2),
  { cap: 'Stamp the decision the trays add up to',
    note: 'One card on NO-GO makes it no-go. Otherwise any card on CONDITIONS makes it go with conditions. Only all on GO is a plain go.',
    svg: function (c) {
      var fx = A.fx(), F = sheet8f(), P = c.state.put, v = Object.keys(P).map(function (k) { return P[k]; }), dec = v.indexOf('nogo') >= 0 ? 'nogo' : v.indexOf('cond') >= 0 ? 'cond' : 'go', tr = TRAYS8F.filter(function (q) { return q[0] === dec; })[0];
      var s = A.stage() + fx.defs + tray8f(c, fx) + t(30, 40, F.you ? 'YOUR ACCEPTANCE SHEET' : 'PRACTICE SHEET · validation numbers', { size: 15, f: 'h', fill: F.you ? '#ffb547' : '#46e3ff', ls: '.06em' });
      if (c.state.stamped) s += '<g class="pgd-pop"><rect x="250" y="80" width="460" height="110" rx="14" fill="none" stroke="' + tr[2] + '" stroke-width="6" transform="rotate(-4 480 135)"/><text x="480" y="152" font-family="' + A.FH + '" font-size="' + (dec === 'cond' ? 30 : 44) + '" font-weight="700" fill="' + tr[2] + '" text-anchor="middle" transform="rotate(-4 480 135)">' + (dec === 'cond' ? 'GO WITH CONDITIONS' : tr[1]) + '</text></g>' + t(480, 240, F.you ? 'Your decision fits your numbers.' : 'Practice only: your own sheet uses your test tray (8f in the lab).', { size: 16, a: 'middle', fill: '#dbe6f2' });
      else s += A.target('stamp', '<g><rect x="430" y="120" width="100" height="56" rx="8" fill="#3a4757" stroke="#ffb547" stroke-width="3"/><rect x="465" y="80" width="30" height="44" rx="6" fill="#8d9bb0"/><rect x="420" y="176" width="120" height="16" rx="4" fill="#c01a36"/></g>', 'stamp it', 480, 232, {});
      return s;
    },
    work: function (c) { var P = c.state.put, F = sheet8f(), conds = Object.keys(P).filter(function (k) { return P[k] === 'cond'; }); var rows = [{ h: 'The decision' }, { v: Object.keys(P).filter(function (k) { return P[k] === 'nogo'; }).length + ' · ' + conds.length + ' · ' + Object.keys(P).filter(function (k) { return P[k] === 'go'; }).length, k: 'cards on no-go · conditions · go' }];
      var NM = { target: 'a bigger trial on a NEW sealed tray', human: 'a second checker on every shift', poly: 'watch poly cells separately', unsure: 'experts re-check the unsure labels', drift: 'run the drift alarm every shift' };
      if (conds.length) rows.push({ h: 'Conditions' }); conds.forEach(function (k) { rows.push({ t: '✓ ' + (NM[k] || k) }); }); rows.push({ t: 'Never a condition: moving the gates on the test results, or skipping the person’s queue when busy.' }); rows.push({ tag: F.you ? 'your value' : 'typical value' }); return rows; },
    on: { stamp: function (c) { c.state.stamped = 1; c.redraw(true); } },
    auto: function (c) { c.state.stamped = 1; } }]
});

/* ============================ 8g  What you built ============================ */
var ST8G = [
  ['cam', 'CAMERA', 0, 120], ['split', 'SPLIT', 1, 330],
  ['svc', 'FEATURES + SVC', 2, 640], ['cnn', 'CNN', 3, 850], ['gate', 'BLEND + GATES', 3, 1060],
  ['why', 'WHY MAP', 4, 1370], ['flow', 'FLOW', 5, 1580],
  ['crew', 'CREW REPORT', 6, 1890], ['hmi', 'CONSOLE', 7, 2100],
  ['trial', 'LINE TRIAL', 8, 2410], ['drift', 'DRIFT WATCH', 8, 2620], ['dec', 'GO / NO-GO', 8, 2830]];
var PAN8G = [[0, 2], [2, 5], [5, 7], [7, 9], [9, 12]], OFF8G = [0, 370, 995, 1515, 2140];
function one8g() { var O = F8().one || {}, v = D.val(), i = v ? v.id.indexOf(O.id) : -1; var svc = i >= 0 ? v.svc[i] : O.svc, cnn = i >= 0 ? v.cnn[i] : O.cnn, fr = (mech('8a') || {}).frozen, R = F8().freeze || {};
  var w = fr ? fr.bestW : R.bestW, hi = fr ? fr.high : R.high, lo = fr ? (O.kind === 'p' ? fr.lowPoly : fr.low) : (O.kind === 'p' ? R.lowPoly : R.low), p = w * cnn + (1 - w) * svc;
  return { O: O, svc: svc, cnn: cnn, w: w, hi: hi, lo: lo, p: p, lane: p < lo ? 'PASS' : p >= hi ? 'STOP' : 'PERSON', you: !!(v && (v.youSvc || v.youCnn)) || !!fr }; }
function info8g(k) {
  var F = window.PGD_FACTS || {}, J = one8g(), O = J.O, Sp = F8().split || {}, ts = testSide(), AL = D.liveRes('8d'), f8 = mech('8f'), V = F8().val || {};
  var hot = ((F.s4 || {}).del || {});
  return { cam: ['Step 0', 'An EL photo of one cell: dark lines and patches are cracks.', 'cell ' + O.id + ' · 64 × 64 grey = ' + fmt(4096) + ' numbers', fmt(4096) + ' numbers'],
    split: ['Step 1', 'Split by cell: train / validation / test. Test sealed until Step 8.', fmt(Sp.sizes[0]) + ' · ' + fmt(Sp.sizes[1]) + ' · ' + fmt(Sp.sizes[2]) + ' — cell ' + O.id + ' is in validation', 'in validation'],
    svc: ['Step 2', fmt(((F.s2 || {}).dims || {}).F) + ' hand-made features → an SVC inspector.', 'score of cell ' + O.id + ': ' + f3(J.svc), f3(J.svc)],
    cnn: ['Step 3', 'A CNN of 4 blocks learns its own features.', (D.liveRes('3c') ? fmt((F.s3 || {}).total) + ' weights · ' : '') + 'score ' + f3(J.cnn), f3(J.cnn)],
    gate: ['Step 3', 'Blend the two scores, then two gates.', J.w + ' × ' + f3(J.cnn) + ' + ' + (1 - J.w) + ' × ' + f3(J.svc) + ' = ' + f3(J.p) + (J.lane === 'STOP' ? ' ≥ ' + f3(J.hi) + ' → STOP' : ' → ' + J.lane), f3(J.p) + ' → ' + J.lane],
    why: ['Step 4', 'Heat maps show where the model looks; the deletion check tests them.', 'hot squares removed: score drops ' + f3(hot.dropHot) + ' vs random ' + f3(hot.dropRand), f3(hot.dropHot) + ' vs ' + f3(hot.dropRand)],
    flow: ['Step 5', 'Photo check → score → route → person → record.', 'brightness ' + f1(O.looks.bright) + ' ≥ dark rule ' + ((F.s5 || {}).rules || {}).dark + ' · lane ' + J.lane + ' · recorded', 'lane ' + J.lane],
    crew: ['Step 6', 'Three agents write the shift report; a checker sends back any number no tool gave.', V.all.defPassed + ' of ' + V.all.def + ' defects passed = ' + f1(V.all.per100) + ' per 100 (validation)', f1(V.all.per100) + ' per 100'],
    hmi: ['Step 7', 'The operator console: one big lamp, a queue for the person.', 'lamp ' + J.lane + ' · the verdict word reads from ' + f1(((F.s7 || {}).blocks || [{}])[0].m) + ' m', f1(((F.s7 || {}).blocks || [{}])[0].m) + ' m'],
    trial: ['Step 8', 'The sealed tray, run once on the frozen line.', ts ? ts.T.all.defPassed + ' of ' + ts.T.all.def + ' = ' + f1(ts.T.all.per100) + ' per 100 · band ' + f1(ts.lo) + '–' + f1(ts.hi) + (ts.you ? '' : ' (reference, dev)') : null, ts ? f1(ts.T.all.per100) + ' per 100' : null],
    drift: ['Step 8', 'Label-free alarms on score, brightness, contrast, sharpness.', AL && AL.today ? 'today: ' + (AL.today.ring.length ? 'rings' : 'calm') + ' · act above ' + AL.ALARM : null, AL && AL.today ? (AL.today.ring.length ? 'rings' : 'calm') : null],
    dec: ['Step 8', 'The acceptance sheet: the decision must fit the numbers.', f8 && f8.stamped ? 'your stamp: ' + ({ go: 'GO', cond: 'GO WITH CONDITIONS', nogo: 'NO-GO' }[f8.dec] || f8.dec) : null, f8 && f8.stamped ? (f8.dec || '').toUpperCase() : null] }[k];
}
function icon8g(k, x, y) {
  var col = '#46e3ff';
  if (k === 'cam') return '<rect x="' + (x - 34) + '" y="' + (y - 22) + '" width="68" height="44" rx="8" fill="#1a2028" stroke="' + col + '" stroke-width="2"/><circle cx="' + x + '" cy="' + y + '" r="14" fill="#0a1a2a" stroke="' + col + '" stroke-width="2"/>';
  if (k === 'split') return [0, 1, 2].map(function (i) { return '<rect x="' + (x - 40 + i * 28) + '" y="' + (y - 20) + '" width="22" height="40" rx="3" fill="' + ['#46e3ff', '#ffb547', '#c01a36'][i] + '" opacity=".8"/>'; }).join('');
  if (k === 'cnn') return [0, 1, 2, 3].map(function (i) { return '<rect x="' + (x - 40 + i * 21) + '" y="' + (y - 26 + i * 5) + '" width="16" height="' + (52 - i * 10) + '" rx="2" fill="#a98bff" opacity="' + (.5 + i * .12) + '"/>'; }).join('');
  if (k === 'gate') return '<path d="M' + (x - 40) + ' ' + y + 'H' + (x + 40) + '" stroke="#5d6b80" stroke-width="4"/><path d="M' + (x - 14) + ' ' + (y - 24) + 'v48M' + (x + 16) + ' ' + (y - 24) + 'v48" stroke="#ffb547" stroke-width="5"/>';
  if (k === 'why') { var P4 = ((window.PGD_FACTS || {}).s4 || {}).paint || [], cam = (P4.filter(function (p) { return p.id === 496; })[0] || {}).cam || [], mx = Math.max.apply(null, cam.concat([1e-9])), o = A.cell(496, x - 30, y - 30, 60, { full: true });
    cam.forEach(function (v, i) { if (v > 0.25 * mx) o += '<rect x="' + (x - 30 + (i % 16) * 3.75) + '" y="' + (y - 30 + Math.floor(i / 16) * 3.75) + '" width="3.75" height="3.75" fill="#ff5050" opacity="' + (0.7 * v / mx).toFixed(2) + '"/>'; }); return o; }
  if (k === 'hmi') return '<rect x="' + (x - 38) + '" y="' + (y - 26) + '" width="76" height="52" rx="6" fill="#0a0e13" stroke="#5d6b80" stroke-width="2"/><rect x="' + (x - 4) + '" y="' + (y - 18) + '" width="34" height="36" fill="none" stroke="#ff5050" stroke-width="3"/>';
  if (k === 'drift') return A.gauge(x, y + 6, 26, 0.15, { col: '#2ee07a', w: 7 });
  if (k === 'dec') return '<rect x="' + (x - 30) + '" y="' + (y - 26) + '" width="60" height="52" rx="4" fill="#f1ecdf"/><path d="M' + (x - 18) + ' ' + (y - 8) + 'h36M' + (x - 18) + ' ' + (y + 4) + 'h36M' + (x - 18) + ' ' + (y + 16) + 'h22" stroke="#4a5668" stroke-width="3"/>';
  return '<rect x="' + (x - 36) + '" y="' + (y - 24) + '" width="72" height="48" rx="8" fill="#121a24" stroke="' + col + '" stroke-width="2"/><path d="M' + (x - 22) + ' ' + y + 'h44" stroke="' + col + '" stroke-width="3" stroke-dasharray="6 4"/>';
}
function frame8g(g) {
  var rng = PAN8G[g];
  return { cap: ['Follow one real cell: camera and split', 'Two inspectors and the gates', 'Why it decided, and the flow', 'The report and the console', 'The sealed trial, the drift watch, the decision'][g],
    note: 'One real validation cell (496, a cracked mono cell) travels the whole line you built, stage by stage, with the real number of each stage.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage({ floor: 330 }) + fx.defs, off = OFF8G[g], opened = c.state.open, cur = c.state.cur;
      s += '<g class="pgd-pan" data-off="' + off + '" data-from="' + (g && c.enter ? OFF8G[g - 1] : off) + '" style="transform:translateX(' + (-(g && c.enter ? OFF8G[g - 1] : off)) + 'px)">';
      s += A.belt(20, 290, 3000, 30, { fx: fx });
      var lastX = 120; ST8G.forEach(function (q, i) { if (opened.indexOf(q[0]) >= 0) lastX = q[3]; });
      ST8G.forEach(function (q, i) { var x = q[3], on = opened.indexOf(q[0]) >= 0, inRange = i >= rng[0] && i < rng[1];
        s += '<rect x="' + (x - 86) + '" y="90" width="172" height="150" rx="14" fill="#0e1622" stroke="' + (on ? '#2ee07a' : inRange ? '#46e3ff' : '#263346') + '" stroke-width="' + (on ? 3 : 1.6) + '"/>' + icon8g(q[0], x, 146) + t(x, 206, q[1], { size: 14, a: 'middle', f: 'h', fill: on ? '#9ff5c4' : '#c7d4e4' }) + t(x, 228, 'STEP ' + q[2], { size: 14, a: 'middle', f: 'm', fill: C.dim }) + '<path d="M' + x + ' 240V290" stroke="#3a4757" stroke-width="4"/>';
        if (i < ST8G.length - 1) s += '<path d="M' + (x + 90) + ' 165H' + (ST8G[i + 1][3] - 90) + '" stroke="#2b4157" stroke-width="2" stroke-dasharray="6 6"/>'; });
      s += '<g class="pgd-slide"><rect x="' + (lastX + 14) + '" y="250" width="44" height="40" rx="4" fill="#0b121b" stroke="#ffb547" stroke-width="2"/>' + A.cell(496, lastX + 17, 253, 34, { full: true }) + '</g>';
      ST8G.slice(rng[0], rng[1]).forEach(function (q) { if (opened.indexOf(q[0]) < 0 && q[0] === ST8G.slice(rng[0], rng[1]).filter(function (z) { return opened.indexOf(z[0]) < 0; })[0][0]) s += A.target('st', '<rect x="' + (q[3] - 92) + '" y="84" width="184" height="162" rx="16" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap ' + q[1].toLowerCase(), q[3], 66, {}); });
      s += '</g>';
      if (cur) { var I = info8g(cur), nm = ST8G.filter(function (q) { return q[0] === cur; })[0][1];
        s += '<g class="pgd-pop">' + A.glass(30, 352, 900, 164, { fx: fx, col: '#2b4157' }) + t(52, 388, nm + ' · ' + I[0], { size: 17, f: 'h', fill: '#46e3ff' }) + t(52, 422, I[1], { size: 17, fill: '#dbe6f2' });
        s += I[2] == null ? A.lock(52, 470, cur === 'dec' ? 'your stamp: after 8f in the lab' : 'sealed: after your own trial (8a, 8b' + (cur === 'drift' ? ', 8d' : '') + ')') : t(52, 472, I[2], { size: 20, f: 'm', w: 700, fill: '#ffb547' });
        s += '</g>'; }
      else s += A.glass(30, 352, 900, 164, { fx: fx, col: '#1e2c3c' }) + t(480, 440, 'Tap the stage the cell reaches next.', { size: 17, a: 'middle', fill: C.dim });
      return s;
    },
    work: function (c) { var rows = [{ h: 'Cell 496 so far' }]; ST8G.forEach(function (q) { if (c.state.open.indexOf(q[0]) < 0) return; var I = info8g(q[0]); rows.push({ v: I[2] == null ? '🔒 locked' : I[3], k: q[1].toLowerCase() + ' · step ' + q[2] }); }); rows.push({ tag: one8g().you ? 'your value' : 'typical value' }); return rows; },
    on: { st: function (c) { var nx = ST8G.slice(rng[0], rng[1]).filter(function (z) { return c.state.open.indexOf(z[0]) < 0; })[0]; if (!nx) return; c.state.open.push(nx[0]); c.state.cur = nx[0]; if (ST8G.slice(rng[0], rng[1]).every(function (z) { return c.state.open.indexOf(z[0]) >= 0; }) && g < PAN8G.length - 1) { c.next(); } else c.redraw(true); } },
    bind: function (c, root) { bindPan(c, root); },
    auto: function (c) { ST8G.slice(rng[0], rng[1]).forEach(function (z) { if (c.state.open.indexOf(z[0]) < 0) c.state.open.push(z[0]); }); c.state.cur = ST8G[rng[1] - 1][0]; } };
}
function bindPan(c, root) { var p = root.querySelector('.pgd-pan'); if (!p || p.getAttribute('data-from') === p.getAttribute('data-off')) return; requestAnimationFrame(function () { requestAnimationFrame(function () { p.style.transition = 'transform .8s ease'; p.style.transform = 'translateX(' + (-p.getAttribute('data-off')) + 'px)'; }); }); }
D.register('8g', { init: function () { return { open: [], cur: null }; }, frames: [frame8g(0), frame8g(1), frame8g(2), frame8g(3), frame8g(4)] });
})();
