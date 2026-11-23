/* PanelGuard Step 7 visuals and hands-on mechanics (the operator console). The console itself is the STUDENT's code
   (cellView, countersView, queueView, drawBoard, reportView, makeConsole in the JS notebook); this file only hosts it
   (preview panes, the line-speed knob, the fault panel, the full-screen view) and shows measured numbers. */
(function () {
'use strict';
var H = function () { return window.PGViz._h; };
function el(t, c, h) { return H().el(t, c, h); }
function card(p, t, s) { return H().card(p, t, s); }
function tiles(p, l) { return H().tiles(p, l); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function drag(tok, onDrop, onTap) { window.PGViz3._dragTok(tok, onDrop, onTap); }
function shake(e) { if (e && e.animate) e.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 }); }
function U() { return window.PG_STEP7_UTIL; }
function SCR(id) { return (window.PG7_SCREENS || {})[id]; }
function noData(host, api, what) { host.appendChild(el('div', 'verdict', api.review ? 'Review mode: press “Run up to here” (below the code) to load real data for this page.' : what)); }
function f0(x) { return x == null || isNaN(x) ? '?' : Math.round(x).toLocaleString('en-US'); }
function f1(x) { return x == null || isNaN(x) ? '?' : (Math.round(10 * x) / 10).toFixed(1); }
function mount(parent, host, minH) { var w = el('div'); w.style.cssText = 'margin:6px 0;border:1px solid #263346;border-radius:8px;background:#06090d;padding:6px;overflow:hidden;min-height:' + (minH || 0) + 'px'; parent.appendChild(w); if (host) { w.appendChild(host); } return w; }
function busy(b, t) { b.disabled = true; b.dataset.t = b.textContent; b.textContent = t || 'working…'; }
function unbusy(b) { b.disabled = false; if (b.dataset.t) b.textContent = b.dataset.t; }

/* ================= 7a: sketch the screen ================= */
var ZONES = [['top', 'TOP STRIP · small', 0, 0, 100, 12], ['main', 'MAIN AREA · biggest', 0, 13, 62, 64], ['side', 'SIDE COLUMN', 63, 13, 37, 64], ['bottom', 'BUTTON BAR', 0, 78, 100, 14], ['drawer', 'ON DEMAND · opens with WHY?', 0, 93, 100, 7]];
var BLOCKS = [
  { id: 'photo', text: 'Photo of the cell', ok: ['main'] },
  { id: 'lamp', text: 'Verdict lamp: word + shape + colour', ok: ['main'] },
  { id: 'score', text: 'Score bar with the gates', ok: ['drawer'] },
  { id: 'heat', text: 'WHY? switch (heat map)', ok: ['side', 'bottom'] },
  { id: 'counters', text: 'Counters PASS / CHECK / STOP', ok: ['top'] },
  { id: 'queue', text: 'Queue of cells for a person', ok: ['side'] },
  { id: 'stopline', text: 'STOP LINE button (big)', ok: ['bottom'] },
  { id: 'dot', text: 'Green / red dot only', bad: 'Refused: colour alone. About 1 man in 12 cannot tell red from green, and a tired eye at 2 m mixes them. Use a WORD + a SHAPE + a colour.' },
  { id: 'keep', text: 'Keep the last verdict if the camera fails', bad: 'Refused: the safe default. When anything is unknown, missing or broken, the screen says NO VERDICT and the cell goes to a person. It never shows an old PASS.' },
  { id: 'tiny', text: 'Small × link to stop the line', bad: 'Refused: too small. A tired person with gloves has 2 seconds: big targets, and a key on the keyboard.' }];
var WHY7 = {
  lamp: { top: 'Too small up there. The verdict must be the BIGGEST thing on screen, readable from 2 m: the main area.', side: 'The side column is narrow. The verdict must be the biggest thing on screen: the main area.', bottom: 'The button bar is for actions, not the verdict. The verdict goes in the main area, big.', drawer: 'Never hide the verdict. It is the one thing that is always on screen, big.' },
  photo: { _: 'The photo sits next to the verdict in the main area: the person sees the cell and the answer together.' },
  score: { _: 'Show the reason on demand, not always: a moving number pulls the eye away from the verdict. Put it in the on-demand drawer.' },
  heat: { main: 'The main area is for the photo and the verdict only.', top: 'A switch in the small top strip is hard to hit. Put it beside the queue or in the button bar.', drawer: 'A switch hidden in the drawer cannot open the drawer.' },
  counters: { _: 'Counters are for the shift, not for this cell. Keep them small, in the top strip.' },
  queue: { _: 'The queue is a list next to the main view: the side column.' },
  stopline: { _: 'The STOP LINE button needs a big target the hand finds without looking: the button bar.' } };
function sceneSketch(s, stage, out, api) {
  var m = api.mech; m.put = m.put || {}; var sel = null, msg = null;
  function draw() {
    stage.innerHTML = '';
    stage.appendChild(el('div', 'hint', '<div style="padding:10px 12px 0">Drag each block into the screen frame (or tap a block, then a zone). The rules check every move and say why when they refuse.</div>'));
    var wrap = el('div'); wrap.id = 'frame7a'; wrap.style.cssText = 'position:relative;margin:8px 12px;aspect-ratio:16/9;max-height:330px;background:#090d12;border:3px solid #2b3846;border-radius:10px;transition:transform .5s,filter .5s;transform-origin:center top;' + (m.far ? 'transform:scale(.3);filter:blur(.5px)' : '');
    ZONES.forEach(function (z) {
      var d = el('div'); d.setAttribute('data-drop', z[0]); d.id = 'zone7a-' + z[0];
      d.style.cssText = 'position:absolute;left:' + z[2] + '%;top:' + z[3] + '%;width:' + z[4] + '%;height:' + z[5] + '%;border:1px dashed ' + (sel ? '#46e3ff' : '#2e3c4c') + ';border-radius:6px;display:flex;flex-wrap:wrap;gap:4px;align-content:flex-start;padding:3px;overflow:hidden;' + (z[0] === 'drawer' ? 'background:repeating-linear-gradient(45deg,#0d131a,#0d131a 6px,#0a0f15 6px,#0a0f15 12px)' : '');
      d.appendChild(el('span', null, '<span style="position:absolute;right:5px;bottom:3px;font:10px Orbitron,Arial;letter-spacing:1px;color:#4b5a6c">' + z[1] + '</span>'));
      BLOCKS.forEach(function (b) { if (m.put[b.id] === z[0]) d.appendChild(blockLook(b.id)); });
      d.addEventListener('click', function () { if (sel) tryPut(sel, z[0]); });
      wrap.appendChild(d);
    });
    stage.appendChild(wrap);
    if (m.far) requestAnimationFrame(function () { wrap.style.marginBottom = (-0.7 * wrap.offsetHeight) + 'px'; });
    var pool = el('div'); pool.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:4px 12px 8px';
    BLOCKS.forEach(function (b) {
      if (m.put[b.id] || (b.bad && (m.refusedIds || {})[b.id])) return;
      var t = el('div', null, esc(b.text)); t.setAttribute('data-block7', b.id);
      t.style.cssText = 'font-size:14px;padding:7px 11px;border-radius:8px;cursor:grab;background:#101821;border:1px ' + (sel === b.id ? 'solid #fff' : 'dashed #6d7f94');
      drag(t, function (d) { tryPut(b.id, d); }, function () { sel = sel === b.id ? null : b.id; draw(); });
      pool.appendChild(t);
    });
    if (!pool.children.length) pool.appendChild(el('span', 'hint', 'All blocks used.'));
    stage.appendChild(pool);
    var foot = el('div'); foot.style.cssText = 'padding:0 12px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap';
    var far = el('button', 'btn small' + (m.far ? ' on' : ''), m.far ? '◀ Back to arm\'s length' : '👁 View from 2 m'); far.id = 'far7a';
    far.onclick = function () { m.far = !m.far; if (m.far) { m.sawFar = 1; msg = [1, 'From 2 m: the verdict lamp still reads. The counters and the score do not — they are for later, or on demand.']; } else msg = null; save(); draw(); };
    foot.appendChild(far);
    if (msg) { var v = el('div', 'verdict ' + (msg[0] ? 'good' : 'bad'), esc(msg[1])); v.id = 'sketchmsg'; v.style.flex = '1'; foot.appendChild(v); }
    stage.appendChild(foot);
    side();
  }
  function blockLook(id) {
    var L = { photo: '<div style="width:84px;height:84px;background:linear-gradient(135deg,#333,#777);border:1px solid #555"></div>',
      lamp: '<div style="display:flex;align-items:center;gap:8px;color:#2ee07a;border:4px solid #2ee07a;border-radius:8px;padding:6px 16px;font:700 46px Rajdhani,Arial">● PASS</div>',
      score: '<div style="font-size:11px;color:#c3cdd9">score 0.41 |—|—●—|</div>', heat: '<div style="font-size:12px;border:1px solid #6d7f94;border-radius:4px;padding:1px 6px">WHY? H</div>',
      counters: '<div style="font-size:11px;color:#c3cdd9">● 120 ▲ 210 ■ 64</div>', queue: '<div style="font-size:11px;color:#c3cdd9;border:1px solid #33414f;padding:2px 5px">QUEUE · 7 waiting</div>',
      stopline: '<div style="font:700 15px Rajdhani,Arial;color:#ff5050;border:2px solid #ff5050;border-radius:6px;padding:4px 14px">■ STOP LINE</div>' }[id];
    var d = el('div', null, L); d.setAttribute('data-placed7', id); return d;
  }
  function save() { api.setMech({ put: m.put, far: m.far || 0, sawFar: m.sawFar || 0, refused: m.refused || 0, refusedIds: m.refusedIds || {}, done: m.done || isDone() }); }
  function isDone() { return BLOCKS.every(function (b) { return b.bad || m.put[b.id]; }) && !!m.sawFar; }
  function tryPut(id, to) {
    var b = BLOCKS.filter(function (x) { return x.id === id; })[0]; sel = null;
    if (!b || !to || !ZONES.some(function (z) { return z[0] === to; })) { draw(); return; }
    if (b.bad) { msg = [0, b.bad]; m.refused = (m.refused || 0) + 1; m.refusedIds = m.refusedIds || {}; m.refusedIds[id] = 1; }
    else if (b.ok.indexOf(to) < 0) { var w = WHY7[id]; msg = [0, 'Refused: ' + (w[to] || w._)]; m.refused = (m.refused || 0) + 1; }
    else { m.put[id] = to; msg = [1, b.text + ' → ' + ZONES.filter(function (z) { return z[0] === to; })[0][1].split(' ·')[0].toLowerCase() + ' ✓'];
      if (BLOCKS.every(function (x) { return x.bad || m.put[x.id]; }) && !m.sawFar) msg = [1, 'All 7 blocks placed. Now tap “View from 2 m”: can you still read the verdict?']; }
    save(); draw(); if (!msg[0]) shake(stage.querySelector('#frame7a'));
  }
  function side() {
    out.innerHTML = '';
    var c = card(out, 'THE RULES', 'Each one is checked on every move — and later measured in the real console.');
    [['The verdict is the biggest thing on screen, readable from 2 m', !!m.put.lamp], ['Never colour alone: word + shape + colour', !!(m.refusedIds || {}).dot], ['Safe default: unknown → NO VERDICT, a person looks', !!(m.refusedIds || {}).keep],
     ['Big targets and keys for the person\'s decision', !!m.put.stopline], ['The reason (score, gates, heat map) on demand, not always', m.put.score === 'drawer']].forEach(function (x) {
      c.appendChild(el('div', null, '<div style="padding:4px 0;border-bottom:1px solid #1b2533">' + (x[1] ? '<b style="color:#3dffa0">✓</b> ' : '<span style="color:#5d6b80">○</span> ') + esc(x[0]) + '</div>')); });
    var n = BLOCKS.filter(function (b) { return !b.bad && m.put[b.id]; }).length;
    tiles(c, [[n + ' / 7', 'blocks placed', n === 7 ? 'g' : 'a'], [m.refused || 0, 'moves refused', ''], [m.sawFar ? 'yes' : 'not yet', 'seen from 2 m', m.sawFar ? 'g' : '']]);
    if (m.far) c.appendChild(el('p', 'hint', 'From 2 m the screen looks about a quarter of the size. The verdict lamp still reads; the small counters do not — that is fine, they are for later.'));
    if (m.done) c.appendChild(el('div', 'verdict good', '<b>Sketch done.</b> Next you build it for real: 7b the lamp, 7c the line, 7d the queue, 7e the shift board, 7f the report, 7g the fault drill.'));
    else c.appendChild(el('p', 'hint', 'Ask for each block: what must a tired person see in 2 seconds — and what only when they ask?'));
  }
  draw();
}

/* ================= 7b: one cell, live preview + view switches ================= */
function cellPreview(r, host, api) {
  var scr = SCR('7b'), m = api.mech, v = m.views || {};
  var c = card(host, 'LIVE PREVIEW · your cell view', 'Your code draws this. One real cell, scored live by your model, routed by your flow.');
  if (!scr) { noData(c, api, 'Run the cell to see your console.'); return; }
  var wrap = mount(c, scr, 0); wrap.id = 'pv7b';
  var row = el('div', 'row'); row.style.cssText = 'gap:8px;flex-wrap:wrap;margin:4px 0';
  function apply() { scr.style.filter = v.grayNow ? 'grayscale(1)' : ''; scr.style.transform = v.farNow ? 'scale(.3)' : ''; scr.style.transformOrigin = 'left top'; wrap.style.height = v.farNow ? (scr.offsetHeight * 0.3 + 14) + 'px' : ''; }
  [['gray', 'No colour (colour-blind view)'], ['far', 'From 2 m']].forEach(function (x) {
    var b = el('button', 'btn small' + (v[x[0] + 'Now'] ? ' on' : ''), (v[x[0] + 'Now'] ? '✓ ' : '') + x[1]); b.id = 'view7b-' + x[0];
    b.onclick = function () { v[x[0] + 'Now'] = !v[x[0] + 'Now']; v[x[0]] = 1; api.setMech({ views: v }); b.className = 'btn small' + (v[x[0] + 'Now'] ? ' on' : ''); b.textContent = (v[x[0] + 'Now'] ? '✓ ' : '') + x[1]; apply(); note(); };
    row.appendChild(b);
  });
  var next = el('button', 'btn small', '▶ Next real cell'); next.id = 'next7b';
  next.onclick = function () { busy(next, 'deciding…'); api.jsEval(async function (NS, pg) { if (!NS.decideCell || !NS.view1) return null; var id = pg.cell_val[(NS.threadNo * 7) % pg.cell_val.length]; var x = await NS.decideCell(pg.card(id)); NS.view1.show(x); return { id: id, word: x.lamp.word, ms: x.ms }; }).then(function (x) { unbusy(next); if (x) nb.textContent = 'cell ' + x.id + ' → ' + x.word + ' (' + x.ms.toFixed(0) + ' ms)'; }); };
  row.appendChild(next); c.appendChild(row);
  var nb = el('div', 'hint', ''); c.appendChild(nb);
  function note() { nb.textContent = v.grayNow ? 'Without colour the lamp still reads: the WORD and the SHAPE carry the meaning.' : v.farNow ? 'About what the eye gets from 2 m: the lamp word is still clear.' : ''; }
  apply();
  if (!r || r.missing) return;
  var rc = card(host, 'WHAT YOUR LAMP DID', 'Real cells (from your Step 5 logbook lanes), a spoiled photo, and broken answers.');
  var t = '<table class="tbl"><tr><th>cell</th><th>flow lane</th><th>lamp</th><th>live score</th><th>3f score</th><th>ms</th></tr>' + (r.real || []).map(function (x) {
    return '<tr><td>' + esc(x.id) + '</td><td>' + esc(x.lane) + '</td><td><b>' + esc(x.word) + '</b></td><td>' + (x.p == null ? '—' : x.p.toFixed(4)) + '</td><td>' + x.ref.toFixed(4) + '</td><td>' + x.ms.toFixed(0) + '</td></tr>'; }).join('') + '</table>';
  rc.appendChild(el('div', null, t));
  rc.appendChild(el('div', null, '<div style="margin-top:6px">Spoiled photo F1 (' + esc(r.fault.problem) + '): <b>' + esc(r.fault.word) + '</b> · ' + (r.odd || []).map(function (o) { return esc(o.what) + ' → <b>' + esc(o.word) + '</b>'; }).join(' · ') + '</div>'));
  if (r.meas) tiles(rc, [[r.meas.lampPx + ' px', 'lamp word (1920×1080)', 'g'], [r.meas.next ? r.meas.next.px + ' px' : '—', 'next biggest text', ''], [r.meas.capMm + ' mm', 'letter height (24 inch)', ''], ['≈ ' + r.meas.metres + ' m', 'readable from', r.meas.metres >= 2 ? 'g' : 'r']]);
  if (r.meas) rc.appendChild(el('p', 'hint', 'Measured from the real page layout on a hidden 1920×1080 screen. Assumption: a 24-inch monitor (0.27 mm per pixel) and 20 arc-minutes per letter for easy reading (' + r.meas.needMm + ' mm at 2 m).'));
}

/* ================= 7c: the line: knob, Start / Stop, measured speed ================= */
var KNOB = [10, 20, 30, 60, 120, 600, Infinity];
function knobSVG(k) {
  var a0 = -135, step = 270 / (KNOB.length - 1), ang = a0 + k * step, s = '';
  s += '<circle cx="80" cy="76" r="50" fill="#141c26" stroke="#3a4a5c" stroke-width="3"/>';
  KNOB.forEach(function (v, i) { var a = (a0 + i * step - 90) * Math.PI / 180, x = 80 + 64 * Math.cos(a), y = 76 + 64 * Math.sin(a);
    s += '<text x="' + x.toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="middle" font-family="Space Mono,monospace" font-size="11" fill="' + (i === k ? '#fff' : '#7d8ca0') + '">' + (v === Infinity ? 'MAX' : v) + '</text>'; });
  var a = (ang - 90) * Math.PI / 180;
  s += '<line x1="80" y1="76" x2="' + (80 + 40 * Math.cos(a)).toFixed(1) + '" y2="' + (76 + 40 * Math.sin(a)).toFixed(1) + '" stroke="#ffb21e" stroke-width="7" stroke-linecap="round"/><circle cx="80" cy="76" r="8" fill="#ffb21e"/>';
  return s + '<text x="80" y="146" text-anchor="middle" font-family="Orbitron,Arial" font-size="9" letter-spacing="1.5" fill="#8d9bb0">CELLS / MIN</text>';
}
function beltPreview(r, host, api) {
  var m = api.mech, c = card(host, 'LIVE PREVIEW · the line', 'Your counters and your cell view. Cells come from the validation tray, one by one, through your real flow.');
  if (!r || r.missing) { noData(c, api, 'Run the cell first.'); return; }
  var scr = SCR('7c') || (window.PG7_SCREENS['7c'] = document.createElement('div')); scr.className = 'hmi-host'; scr.innerHTML = ''; scr.style.setProperty('--u', '10px');
  mount(c, scr, 0);
  var ctrl = el('div'); ctrl.style.cssText = 'display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:6px 0'; c.appendChild(ctrl);
  var kb = el('div'); ctrl.appendChild(kb);
  var btns = el('div'); btns.style.cssText = 'display:flex;flex-direction:column;gap:8px'; ctrl.appendChild(btns);
  var start = el('button', 'btn run', '▶ Start'); start.id = 'start7c'; var stop = el('button', 'btn stop', '■ Stop'); stop.id = 'stop7c';
  btns.appendChild(start); btns.appendChild(stop);
  var sp = el('div', 'hint'); sp.style.cssText = 'flex:1;min-width:180px;font-size:14px'; ctrl.appendChild(sp);
  var info = card(host, 'HOW FAST IS ONE REAL DECISION?', 'Measured in this browser: photo check + live model + gates + logbook, per cell.');
  var V = null;
  var k = m.knob === 'MAX' ? KNOB.length - 1 : KNOB.indexOf(m.knob != null ? m.knob : 30); if (k < 0) k = 2;
  var svg = null;
  function drawKnob() {
    if (svg) { svg.innerHTML = knobSVG(k); return; }
    kb.innerHTML = '<svg viewBox="0 0 160 150" width="150" height="140" style="touch-action:none;cursor:grab" id="knob7c" tabindex="0" aria-label="line speed knob">' + knobSVG(k) + '</svg>';
    svg = kb.querySelector('svg');
    svg.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0; if (d) { e.preventDefault(); k = Math.max(0, Math.min(KNOB.length - 1, k + d)); turned(); } });
    function setFrom(e) { var b = svg.getBoundingClientRect(), x = e.clientX - (b.left + b.width * 80 / 160), y = e.clientY - (b.top + b.height * 76 / 150);
      var ang = Math.atan2(y, x) * 180 / Math.PI + 90; if (ang > 180) ang -= 360; var nk = Math.round((Math.max(-135, Math.min(135, ang)) + 135) / 45); if (nk !== k) { k = nk; turned(); } }
    svg.addEventListener('pointerdown', function (e) { svg.setPointerCapture(e.pointerId); setFrom(e); svg.onpointermove = setFrom; });
    svg.addEventListener('pointerup', function () { svg.onpointermove = null; });
    svg.addEventListener('wheel', function (e) { e.preventDefault(); k = Math.max(0, Math.min(KNOB.length - 1, k + (e.deltaY > 0 ? -1 : 1))); turned(); }, { passive: false });
  }
  function turned() { var v = KNOB[k]; api.setMech({ knob: v === Infinity ? 'MAX' : v }); m.knob = v === Infinity ? 'MAX' : v; api.jsEval(function (NS) { if (NS.belt) NS.belt.perMinute = v; return 1; }); drawKnob(); speed(); }
  function perMin() { return KNOB[k]; }
  function speed() {
    api.jsEval(function (NS) { return NS.speedReport && NS.times.length ? { s: NS.speedReport(), running: NS.belt.running, n: NS.counts.total } : null; }).then(function (x) {
      var pm = perMin(), every = pm === Infinity ? 'as fast as the browser can' : 'one cell every ' + (60 / pm).toFixed(pm >= 60 ? 2 : 1) + ' s';
      sp.innerHTML = '<b>' + (pm === Infinity ? 'MAX' : pm) + ' cells / min</b> = ' + every + '.<br>' + (m.ran || 0) + ' of 30 cells run with Start.' + (x && x.running ? ' <b style="color:#3dffa0">LINE RUNNING</b>' : '');
      info.innerHTML = '<h3 class="fh" style="font-size:12px;margin:0 0 4px">HOW FAST IS ONE REAL DECISION?</h3>';
      if (!x) { info.appendChild(el('p', 'hint', 'Run cells to measure.')); return; }
      var s = x.s, ok = pm === Infinity || pm <= s.maxPerMinute;
      tiles(info, [[f0(s.medianMs) + ' ms', 'median decision', 'c'], [f0(s.slowMs) + ' ms', 'slow cells (95%)', ''], [f0(s.maxPerMinute), 'cells / min possible', 'g'], [s.cells, 'decisions measured', '']]);
      info.appendChild(el('p', null, 'The plant line needs <b>30 cells per minute</b> (2 s per cell). One decision here takes ' + f0(s.medianMs) + ' ms (slow ones ' + f0(s.slowMs) + ' ms), so this browser keeps up with about <b>' + f0(s.maxPerMinute) + ' cells per minute</b> — ' + (s.maxPerMinute >= 30 ? 'plenty for the line.' : 'NOT enough for the line.') +
        (pm === Infinity ? '' : ok ? ' Your knob (' + pm + '/min) is inside that.' : ' <b style="color:#ff5050">Your knob (' + pm + '/min) is faster than the model: cells would pile up.</b>')));
      info.appendChild(el('p', 'hint', 'Measured with performance.now() around each real decision (software graphics here, so a plant PC with a graphics chip is faster). The person\'s time is measured in 7d.'));
    });
  }
  function show(x) { /* called by the belt for every cell (student functions) */ }
  start.onclick = function () {
    busy(start, 'running…');
    api.jsEval(async function (NS, pg) {
      if (!NS.countersView || !NS.cellView) return null;
      if (!V) { V = { ctr: NS.countersView(scr), cell: NS.cellView(scr) }; }
      var left = (m.ran || 0) < 30 ? 30 - (m.ran || 0) : 30;
      await NS.runBelt(left, function (x) { NS.onResult(x); V.cell.show(x); V.ctr.update(); m.ran = (m.ran || 0) + 1; api.setMech({ ran: m.ran }); if (m.ran % 3 === 0) speed(); });
      return 1;
    }).then(function () { unbusy(start); speed(); });
  };
  stop.onclick = function () { api.jsEval(function (NS) { if (NS.belt) NS.belt.running = false; return 1; }).then(speed); };
  api.jsEval(function (NS) { if (!NS.countersView) return null; V = { ctr: NS.countersView(scr), cell: NS.cellView(scr) }; if (NS.oneCell) V.cell.show(NS.oneCell); if (NS.belt) NS.belt.perMinute = KNOB[k]; return 1; });
  drawKnob(); speed();
}

/* ================= 7d: the person's queue (student's queueView) + measured rate ================= */
function queuePreview(r, host, api) {
  var m = api.mech, scr = SCR('7d'), c = card(host, 'LIVE PREVIEW · the person\'s queue', 'Your queue view. Big buttons, or the keys P (pass) / S (stop); H shows why. The clock starts when a cell is shown.');
  if (!scr || !r || r.missing) { noData(c, api, 'Run the cell first.'); return; }
  mount(c, scr, 0);
  var tools = el('div', 'row'); tools.style.cssText = 'gap:8px;margin:4px 0'; c.appendChild(tools);
  var more = el('button', 'btn small', '▶ Run the line until 10 more wait'); more.id = 'more7d'; tools.appendChild(more);
  var res = card(host, 'CAN ONE CHECKER KEEP UP?', 'Your real seconds per cell vs the share your flow sends to a person.');
  function stats() {
    api.jsEval(function (NS) { if (!NS.answers) return null; var mine = NS.answers.filter(function (a) { return a.seconds > 0; }); return { mine: mine.slice(-12), n: mine.length, rate: mine.length ? NS.checkerRate(30) : null, waiting: NS.queue.length,
      agree: mine.filter(function (a) { return a.expert != null && (a.said === 'stop') === (a.expert === 1); }).length, known: mine.filter(function (a) { return a.expert != null; }).length }; }).then(function (x) {
      res.innerHTML = '<h3 class="fh" style="font-size:12px;margin:0 0 4px">CAN ONE CHECKER KEEP UP?</h3>';
      if (!x) return;
      if (x.n > (m.answered || 0)) {                    /* only grows: a re-run or a reload starts a new queue, it never takes your progress away */ var rr = x.rate && { answered: x.rate.answered, medianSeconds: x.rate.medianSeconds, perHour: x.rate.perHour, share: x.rate.share, perMinute: 30, neededPerHour: x.rate.neededPerHour, keepsUp: x.rate.keepsUp, checkers: x.rate.checkers }; api.setMech({ answered: x.n, rate: rr }); m.answered = x.n; }
      tiles(res, [[x.n + ' / 10', 'cells you cleared', x.n >= 10 ? 'g' : 'a'], [x.waiting, 'still waiting', ''], [x.known ? x.agree + ' / ' + x.known : '—', 'agree with the expert', '']]);
      if (x.rate) {
        var R = x.rate;
        tiles(res, [[f1(R.medianSeconds) + ' s', 'your median per cell', 'c'], [f0(R.perHour), 'cells / hour, one checker', 'c'], [(100 * R.share).toFixed(1) + '%', 'sent to a person', ''], [f0(R.neededPerHour), 'to a person / hour at 30/min', '']]);
        res.appendChild(el('div', 'verdict ' + (R.keepsUp ? 'good' : 'bad'), '<b>' + (R.keepsUp ? 'Yes — one checker keeps up.' : 'No — one checker cannot keep up.') + '</b> You take ' + f1(R.medianSeconds) + ' s per cell = ' + f0(R.perHour) + ' cells per hour. At 30 cells per minute your flow sends ' + (100 * R.share).toFixed(1) + '% to a person = ' + f0(R.neededPerHour) + ' per hour.' + (R.keepsUp ? '' : ' It needs ' + R.checkers + ' checkers — or a flow that sends fewer cells to a person.')));
        res.appendChild(el('p', 'hint', 'Share from your whole Step 5 shift (' + 'poly-gate line). Your seconds are real, from this page; a real shift adds breaks and tiredness.'));
      }
      if (x.mine.length) res.appendChild(el('div', null, '<table class="tbl"><tr><th>cell</th><th>you said</th><th>expert</th><th>seconds</th></tr>' + x.mine.map(function (a) { return '<tr><td>' + esc(a.id) + '</td><td>' + a.said + '</td><td>' + (a.expert == null ? '—' : a.expert ? 'defect' : 'good') + '</td><td>' + a.seconds.toFixed(1) + '</td></tr>'; }).join('') + '</table>'));
    });
  }
  api.jsEval(function (NS) { if (!NS.queueView) return null; scr.innerHTML = ''; NS.queueView(scr, function () { stats(); }); return 1; });
  more.onclick = function () { busy(more, 'running the line…'); api.jsEval(async function (NS, pg) { var n0 = NS.queue.length; for (var g = 0; NS.queue.length < n0 + 10 && g < 200; g++) { var x = await NS.decideCell(pg.card(pg.cell_val[NS.nextCell++ % pg.cell_val.length])); NS.onResult(x); NS.toQueue(x); } scr.innerHTML = ''; NS.queueView(scr, function () { stats(); }); return 1; }).then(function () { unbusy(more); stats(); }); };
  stats();
}

/* ================= 7e: match prediction (new format) + board ================= */
var Q7 = [['busy', 'Are checkers getting busier as the shift goes on?', 'lanes'], ['target', 'Are we inside the 5-in-100 target?', 'bullet'], ['poly', 'Is poly worse than mono?', 'pair']];
var CH7 = [['pie', 'Pie: cells by type', '<circle cx="40" cy="30" r="24" fill="#4f6d8c"/><path d="M40 30 L40 6 A24 24 0 0 1 62 40 Z" fill="#9fb3c8"/>'],
  ['lanes', 'Lanes per block, start → end', [0, 1, 2, 3, 4, 5].map(function (i) { return '<rect x="' + (6 + i * 12) + '" y="' + (40 - 6 - i * 2) + '" width="10" height="' + (6 + i * 2) + '" fill="#ffb21e"/><rect x="' + (6 + i * 12) + '" y="' + (20 - i) + '" width="10" height="' + (14 - i) + '" fill="#2ee07a"/>'; }).join('')],
  ['bullet', 'One bar vs a target line', '<rect x="6" y="22" width="44" height="14" fill="#4f6d8c"/><line x1="58" x2="58" y1="14" y2="44" stroke="#fff" stroke-width="3" stroke-dasharray="3 2"/>'],
  ['pair', 'Two bars side by side', '<rect x="6" y="14" width="30" height="12" fill="#4f6d8c"/><rect x="6" y="32" width="58" height="12" fill="#4f6d8c"/>']];
function matchPredict(body, api, pr, lock, whyBox, P) {
  var holder = el('div'); body.appendChild(holder); pr.ans = pr.ans || {}; var sel = null;
  var COL = { busy: '#46e3ff', target: '#ffb547', poly: '#a98bff' };
  function go() {
    holder.innerHTML = '';
    var g = el('div'); g.style.cssText = 'display:grid;grid-template-columns:1fr 1.3fr;gap:12px;align-items:start;margin-top:6px'; holder.appendChild(g);
    var qs = el('div'), cs = el('div'); cs.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px'; g.appendChild(qs); g.appendChild(cs);
    Q7.forEach(function (q) {
      var a = pr.locked ? pr.val[q[0]] : pr.ans[q[0]], b = el('div', null, '<b style="color:' + COL[q[0]] + '">' + esc(q[1]) + '</b>' + (a ? '<div class="hint">→ ' + esc(CH7.filter(function (c) { return c[0] === a; })[0][1]) + (pr.locked ? (a === q[2] ? ' <b style="color:#3dffa0">✓</b>' : ' <b style="color:#ff4d6a">✗ answer: ' + esc(CH7.filter(function (c) { return c[0] === q[2]; })[0][1]) + '</b>') : '') + '</div>' : ''));
      b.setAttribute('data-q7', q[0]);
      b.style.cssText = 'padding:8px 10px;margin-bottom:8px;border-radius:8px;cursor:' + (pr.locked ? 'default' : 'pointer') + ';background:#0c1219;border:2px ' + (sel === q[0] ? 'solid ' + COL[q[0]] : a ? 'solid #2b3846' : 'dashed #3a4658');
      if (!pr.locked) b.onclick = function () { sel = sel === q[0] ? null : q[0]; go(); };
      qs.appendChild(b);
    });
    CH7.forEach(function (c) {
      var who = Q7.filter(function (q) { return (pr.locked ? pr.val : pr.ans)[q[0]] === c[0]; });
      var d = el('div', null, '<svg viewBox="0 0 80 50" style="width:100%;height:auto;background:#0a0f15;border-radius:6px">' + c[2] + '</svg><div style="font-size:13px;margin-top:3px">' + esc(c[1]) + '</div>' + who.map(function (q) { return '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:3px;background:' + COL[q[0]] + '"></span>'; }).join(''));
      d.setAttribute('data-chart7', c[0]);
      d.style.cssText = 'padding:6px;border-radius:8px;cursor:' + (pr.locked ? 'default' : 'pointer') + ';border:1px solid ' + (sel ? '#46e3ff' : '#263346') + ';background:#0c1219';
      if (!pr.locked) d.onclick = function () { if (!sel) return; Object.keys(pr.ans).forEach(function (k) { if (k === sel) delete pr.ans[k]; }); pr.ans[sel] = c[0]; sel = null; go(); };
      cs.appendChild(d);
    });
    if (!pr.locked) {
      var left = Q7.filter(function (q) { return !pr.ans[q[0]]; }).length, b = el('button', 'btn', 'Check'); b.id = 'matchcheck'; b.disabled = left > 0; b.style.marginTop = '8px';
      b.onclick = function () { var n = Q7.filter(function (q) { return pr.ans[q[0]] === q[2]; }).length; pr.nRight = n; pr.good = n === 3 ? 1 : 0; lock(Object.assign({}, pr.ans)); };
      var row = el('div', 'row'); row.appendChild(b); row.appendChild(el('span', 'hint', left ? left + ' question' + (left > 1 ? 's' : '') + ' to match. One try.' : 'Ready. One try.')); holder.appendChild(row);
    } else {
      var n = Q7.filter(function (q) { return pr.val[q[0]] === q[2]; }).length;
      holder.appendChild(el('div', 'verdict ' + (n === 3 ? 'good' : 'bad'), (n === 3 ? '✓ All 3 right.' : '✗ ' + n + ' of 3 right.') + ' The pie answers none of them. Run the cell below to draw the real charts from your logbook.'));
      holder.appendChild(whyBox(P.reveal, 'Why (tap to open)'));
    }
  }
  go();
}
function boardPreview(r, host, api) {
  var scr = SCR('7e'), c = card(host, 'LIVE PREVIEW · the shift board', 'Your SVG charts, counted from the real Step 5 logbook.');
  if (!scr || !r || r.missing) { noData(c, api, 'Run the cell first.'); return; }
  mount(c, scr, 0);
  var b = r.b, P = api.pred || {};
  if (b && P.locked) { var cc = card(host, 'THE MANAGER\'S ANSWERS', 'Read straight from your charts.');
    var first = b.blocks.slice(0, 3), last = b.blocks.slice(-3), share = function (L) { var p = 0, n = 0; L.forEach(function (x) { p += x.person; n += x.pass + x.person + x.stop; }); return n ? 100 * p / n : 0; };
    cc.appendChild(el('ul', null, '<li><b>Busier?</b> To a person: ' + share(first).toFixed(0) + '% in the first 3 blocks, ' + share(last).toFixed(0) + '% in the last 3 — ' + (Math.abs(share(last) - share(first)) < 5 ? 'about the same.' : share(last) > share(first) ? 'busier at the end.' : 'less busy at the end.') + ' (The tray is in random order, so a real shift could differ.)</li>' +
      '<li><b>Target?</b> ' + b.all.passed + ' of ' + b.all.defects + ' defects passed = ' + b.all.per100 + ' per 100 → ' + (b.all.per100 <= b.target ? 'target met.' : 'target MISSED.') + '</li>' +
      '<li><b>Poly worse?</b> mono ' + b.mono.per100 + ' vs poly ' + b.poly.per100 + ' per 100 → ' + (b.poly.per100 > b.mono.per100 ? 'yes, poly is worse.' : b.poly.per100 < b.mono.per100 ? 'no, mono is worse now.' : 'the same.') + '</li>')); }
}

/* ================= 7f: report preview ================= */
function reportPreview(r, host, api) {
  var scr = SCR('7f'), m = api.mech, c = card(host, 'LIVE PREVIEW · one button, one report', 'Your REPORT button runs the crew, the checker, then shows the report — or holds it back.');
  if (!scr || !r || r.missing) { noData(c, api, 'Run the cell first.'); return; }
  mount(c, scr, 0);
  var rep = scr.querySelector('.report');
  if (rep && !rep._pg7) { rep._pg7 = 1;
    rep.addEventListener('report', function (e) { var d = e.detail || {}; api.setMech({ reported: 1, held: !!d.held, removed: d.removed || [] }); m.reported = 1; info(); });
    rep.addEventListener('copied', function () { api.setMech({ copied: 1 }); m.copied = 1; info(); }); }
  var ic = card(host, 'WHAT THE CHECK DID', '');
  function info() { ic.innerHTML = '<h3 class="fh" style="font-size:12px;margin:0 0 4px">WHAT THE CHECK DID</h3>';
    tiles(ic, [[r.r.drafts || '?', 'drafts written', ''], [r.r.removed.length ? r.r.removed.join(', ') : 'none', 'numbers removed', r.r.removed.length ? 'a' : 'g'], [r.planted.held ? 'held back' : 'SHOWN', 'copy with a planted number', r.planted.held ? 'g' : 'r'], [m.reported ? (m.copied ? 'yes' : 'not yet') : '—', 'copied', '']]);
    ic.appendChild(el('p', 'hint', 'The scripted writer slips 2 numbers in draft 1 on purpose (from 6f); the guardrail sent it back. The badge is what the operator sees.')); }
  info();
}

/* ================= 7g: fault panel, spot what is wrong, full console ================= */
var FAULTS7 = [['camera', 'Camera fault copy', 'A spoiled photo (lens cap on) comes after a PASS cell.', 'CHECK', 'The photo failed its check, so the flow paused for a person: CHECK.'],
  ['model', 'Model not loaded', 'The model is gone (a PC restart) when a cell comes after a PASS cell.', 'NO VERDICT', 'No model, no score: NO VERDICT, and the cell must go to a person.'],
  ['flow', 'Flow error', 'The camera PC sends a cell with no photo data, after a PASS cell.', 'NO VERDICT', 'The flow broke: NO VERDICT, and the cell must go to a person.'],
  ['empty', 'Empty queue', 'Nothing waits for a person, and the operator presses P (and taps PASS).', 'nothing', 'Nothing may happen: no counter moves, the queue says “no cells waiting”.']];
var FLOWN = 0, DRILL = 0;
async function fireFault(NS, pg, C, k) {
  DRILL++; try { return await fireFault1(NS, pg, C, k); } finally { setTimeout(function () { DRILL--; }, 400); }
}
async function fireFault1(NS, pg, C, k) {
  var ids = U().laneCells(NS, 3), before = JSON.parse(JSON.stringify(NS.counts)), q0 = NS.queue.length, keep = null;
  NS.belt.running = false;
  if (k !== 'empty') await C.feed(pg.card(ids.pass[(FLOWN++) % ids.pass.length]));
  var mid = JSON.parse(JSON.stringify(NS.counts)), qm = NS.queue.length;
  if (k === 'camera') await C.feed(pg.card(['F1', 'F2', 'F3'][FLOWN % 3]));
  if (k === 'model') { var mdl = NS.model; NS.model = null; try { await C.feed(pg.card(ids.stop[FLOWN % ids.stop.length])); } finally { NS.model = mdl; } }
  if (k === 'flow') await C.feed({ id: 'X' + (++FLOWN), kind: 'mono', tries: 1, photo: null });
  if (k === 'empty') { keep = NS.queue.splice(0); if (C.queue) C.queue.show();
    var ev = new KeyboardEvent('keydown', { key: 'p', bubbles: true }); document.body.dispatchEvent(ev);
    var pb = C.el.querySelector('.screen-side button[data-say="pass"]'); if (pb) pb.click();
    await new Promise(function (r) { setTimeout(r, 60); }); }
  var w = C.el.querySelector('.screen-main .lamp .word'), head = (C.el.querySelector('.screen-side .qhead') || {}).textContent || '';
  var after = JSON.parse(JSON.stringify(NS.counts)), qa = NS.queue.length;
  if (keep) { keep.forEach(function (x) { NS.queue.push(x); }); if (C.queue) C.queue.show(); }
  return { k: k, lamp: w ? w.textContent : null, head: head, queued: k === 'empty' ? 0 : qa - qm, moved: JSON.stringify(after) !== JSON.stringify(k === 'empty' ? before : after) ? 1 : 0, emptySame: k === 'empty' ? JSON.stringify(after) === JSON.stringify(before) : null,
    counted: after.total - mid.total, under: Object.keys(after).filter(function (x) { return x !== 'total' && after[x] !== mid[x]; }) };
}
function faultTruth(x) {
  if (x.k === 'empty') return { right: x.emptySame && /no cells waiting/i.test(x.head), shows: (x.emptySame ? 'no counter moved' : 'a COUNTER MOVED') + ' · queue: “' + x.head + '”' };
  var want = FAULTS7.filter(function (f) { return f[0] === x.k; })[0][3];
  return { right: x.lamp === want && x.queued === 1, shows: 'lamp: ' + x.lamp + ' · sent to a person: ' + (x.queued ? 'yes' : 'NO') };
}
function drillPreview(r, host, api) {
  var scr = SCR('7g'), m = api.mech, fixedNow = !!(r && !r.missing && window.PG_STEP7.substeps[6].check(r).pass);
  var c = card(host, 'LIVE PREVIEW · the whole console', fixedNow ? 'Fixed console. Fire every fault again to prove the safe default.' : 'Starter console, with 2 planted bugs. Break it with the fault panel.');
  if (!scr || !r || r.missing) { noData(c, api, 'Run the cell first (the starter code runs as it is).'); return; }
  scr.dataset.fixed = '1'; scr.style.cssText = 'width:1280px;height:720px;transform-origin:0 0;--u:' + U().unitFor(1280, 720) + 'px';
  var wrap = mount(c, scr, 0); wrap.style.padding = '0';
  function fit() { var k = Math.min(1, wrap.clientWidth / 1280); scr.style.transform = 'scale(' + k + ')'; wrap.style.height = Math.ceil(720 * k) + 'px'; }
  fit(); if (window.ResizeObserver) new ResizeObserver(fit).observe(wrap);
  c.appendChild(el('p', 'hint', 'This is your console at 1280×720, shrunk to fit. “Open the console” (after the fix) shows it full screen.'));
  var fp = card(host, 'FAULT PANEL · ' + (fixedNow ? 'FIXED CODE' : 'STARTER CODE WITH 2 PLANTED BUGS'), 'Each button makes a real fault in the real console. Then say if the screen is right.');
  var row = el('div'); row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap'; fp.appendChild(row);
  var outB = el('div'); fp.appendChild(outB);
  var watch = card(host, 'WATCH THE CELLS COUNTER', 'Answer a queued cell with PASS / STOP in the console above. Does CELLS go up? It should not: that cell was counted when it arrived.');
  var wv = el('div', 'hint'); watch.appendChild(wv);
  var C = null;
  api.jsEval(function (NS) { if (!NS.makeConsole) return null; scr.innerHTML = ''; C = NS.makeConsole(scr); window.PG7_CONSOLE = C;
    function watchAnswer() { if (DRILL || !NS.queue.length) return; var t0 = NS.counts.total, a0 = NS.answers.length;
      setTimeout(function () { if (NS.answers.length === a0) return; var t = NS.counts.total, dbl = t > t0 && !NS.belt.running;
        wv.innerHTML = 'A person answered a cell: CELLS ' + t0 + ' → <b>' + t + '</b> ' + (dbl ? '<b style="color:#ff5050">— counted AGAIN (BUG 2)</b>' : '<b style="color:#3dffa0">— counted once ✓</b>');
        var b = m.bug2 || {}; b[fixedNow ? 'fixed' : 'buggy'] = dbl ? 'double' : 'once'; api.setMech({ bug2: b }); m.bug2 = b; }, 600); }
    scr.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.screen-side button[data-say]')) watchAnswer(); }, true);
    document.addEventListener('keydown', function onk(e) { if (!scr.isConnected) return document.removeEventListener('keydown', onk, true); if (/^[ps]$/i.test(e.key) && !(e.target.closest && e.target.closest('textarea,input'))) watchAnswer(); }, true);
    return 1; });
  FAULTS7.forEach(function (f) {
    var done = (fixedNow ? m.fixed : m.buggy) || {}, b = el('button', 'btn small' + (done[f[0]] ? ' on' : ''), (done[f[0]] ? '✓ ' : '⚡ ') + f[1]); b.setAttribute('data-fault7', f[0]);
    b.onclick = function () {
      if (!C) return; row.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
      api.jsEval(function (NS, pg) { return fireFault(NS, pg, C, f[0]); }).then(function (x) {
        row.querySelectorAll('button').forEach(function (y) { y.disabled = false; });
        if (!x) return; var T = faultTruth(x);
        outB.innerHTML = '';
        var box = el('div'); box.style.cssText = 'margin-top:8px;padding:8px 10px;border:1px solid #3a4658;border-radius:8px;background:#0c1219'; outB.appendChild(box);
        box.appendChild(el('div', null, '<b>' + esc(f[1]) + ':</b> ' + esc(f[2]) + '<br>The screen shows: <b>' + esc(T.shows) + '</b>.<br>Is the screen right?'));
        var yes = el('button', 'btn small', 'Right'), no = el('button', 'btn small', 'Wrong'); yes.id = 'say7-right'; no.id = 'say7-wrong';
        var rr = el('div', 'row'); rr.style.gap = '8px'; rr.appendChild(yes); rr.appendChild(no); box.appendChild(rr);
        function said(right) {
          var good = right === T.right, key = fixedNow ? 'fixed' : 'buggy', o = m[key] || {}; o[f[0]] = { shows: T.shows, right: T.right, said: right ? 'right' : 'wrong' }; var p = {}; p[key] = o; api.setMech(p); m[key] = o;
          rr.remove();
          box.appendChild(el('div', 'verdict ' + (good ? 'good' : 'bad'), (good ? '✓ ' : '✗ ') + (T.right ? 'The screen is right. ' : 'The screen is WRONG. ') + esc(f[4]) + (T.right ? '' : f[0] === 'empty' ? '' : ' It shows the verdict of the cell BEFORE — that is BUG 1 (look at the line marked BUG 1).')));
          var bb = row.querySelector('[data-fault7="' + f[0] + '"]'); if (bb) { bb.className = 'btn small on'; bb.textContent = '✓ ' + f[1]; }
          side();
        }
        yes.onclick = function () { said(true); }; no.onclick = function () { said(false); };
      });
    };
    row.appendChild(b);
  });
  var sideC = card(host, 'DRILL LOG', '');
  function side() {
    sideC.innerHTML = '<h3 class="fh" style="font-size:12px;margin:0 0 4px">DRILL LOG</h3>';
    var t = '<table class="tbl"><tr><th>fault</th><th>starter code</th><th>fixed code</th></tr>' + FAULTS7.map(function (f) { var a = (m.buggy || {})[f[0]], b = (m.fixed || {})[f[0]];
      return '<tr><td>' + esc(f[1]) + '</td><td>' + (a ? esc(a.shows) + (a.right ? '' : ' <b style="color:#ff5050">✗</b>') : '—') + '</td><td>' + (b ? esc(b.shows) + (b.right ? ' <b style="color:#3dffa0">✓</b>' : ' <b style="color:#ff5050">✗</b>') : '—') + '</td></tr>'; }).join('') + '</table>';
    sideC.appendChild(el('div', null, t));
    if (fixedNow) { var ob = el('button', 'btn run', '⛶ Open the console'); ob.id = 'open7'; ob.onclick = function () { openFull(api); }; sideC.appendChild(ob); }
  }
  side();
}

/* ---------- the full-screen console view ---------- */
function openFull(api) {
  if (document.getElementById('pgc-full')) return;
  var ov = document.createElement('div'); ov.id = 'pgc-full';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#05080b;display:flex;flex-direction:column';
  var bar = el('div'); bar.style.cssText = 'display:flex;gap:10px;align-items:center;padding:4px 10px;background:#070b10;border-bottom:1px solid #1b2533;font:12px Orbitron,Arial;letter-spacing:1.5px;color:#5d6b80';
  bar.innerHTML = '<span style="flex:1">PANELGUARD · OPERATOR CONSOLE · FULL VIEW · your code · Esc closes</span>';
  var dr = el('button', 'btn small', '⚡ Fault drill'); dr.id = 'full-drill'; var cl = el('button', 'btn small', '✕ Close'); cl.id = 'full-close';
  bar.appendChild(dr); bar.appendChild(cl); ov.appendChild(bar);
  var root = el('div'); root.id = 'pgc-root'; root.style.cssText = 'flex:1;min-height:0;position:relative'; ov.appendChild(root);
  var dp = el('div'); dp.id = 'full-drillpanel'; dp.hidden = true; dp.style.cssText = 'position:absolute;right:12px;top:40px;z-index:3;background:#0c1219;border:1px solid #3a4658;border-radius:8px;padding:10px;width:340px;font-size:14px;color:#e6eef8'; ov.appendChild(dp);
  document.body.appendChild(ov);
  var u = U().unitFor(innerWidth, innerHeight - 30);
  root.style.setProperty('--u', u + 'px');
  var keysWas = null, C = null;
  api.jsEval(function (NS, pg) { keysWas = pg.keysNow(); C = NS.makeConsole(root); return 1; });
  function close() { api.jsEval(function (NS, pg) { if (NS.belt) NS.belt.running = false; pg.keys(keysWas); return 1; }); ov.remove(); document.removeEventListener('keydown', onEsc, true); api.setMech({ openedFull: 1 }); }
  function onEsc(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
  document.addEventListener('keydown', onEsc, true);
  cl.onclick = close;
  dr.onclick = function () { dp.hidden = !dp.hidden; if (dp.hidden) return; dp.innerHTML = '<b>FAULT DRILL</b> — real faults in this console';
    FAULTS7.forEach(function (f) { var b = el('button', 'btn small', '⚡ ' + f[1]); b.setAttribute('data-ffault7', f[0]); b.style.margin = '4px 4px 0 0';
      b.onclick = function () { api.jsEval(function (NS, pg) { return fireFault(NS, pg, C, f[0]); }).then(function (x) { if (!x) return; var T = faultTruth(x); res.innerHTML = '<b>' + esc(f[1]) + '</b>: ' + esc(T.shows) + ' — ' + (T.right ? '<b style="color:#3dffa0">safe default holds ✓</b>' : '<b style="color:#ff5050">WRONG</b>'); res.setAttribute('data-ok', T.right ? '1' : '0'); }); };
      dp.appendChild(b); });
    var res = el('div'); res.id = 'full-drillres'; res.style.marginTop = '8px'; dp.appendChild(res); };
  api.setMech({ openedFull: 1 });
}

function endCard7(box, api) {
  api.jsEval(function (NS) { if (!NS.speedReport || !NS.times.length) return null; return { s: NS.speedReport(), b: NS.board ? NS.board.all : null, t: NS.board ? NS.board.target : 5 }; }).then(function (x) {
    var r = api.getMech('7d').rate, rp = api.getMech('7f'), s = x && x.s;
    var d = el('div', 'endc', '<h3 class="fh">STEP 7 DONE — WHAT THE OPERATOR GETS</h3><ul>' +
      '<li><b>One screen:</b> the photo and a big lamp — PASS ●, CHECK ▲, STOP ■, or NO VERDICT ◌ — word + shape + colour.' + (s ? ' One real decision takes ' + f0(s.medianMs) + ' ms here (slow ones ' + f0(s.slowMs) + ' ms): about ' + f0(s.maxPerMinute) + ' cells per minute, the line needs 30.' : '') + '</li>' +
      '<li><b>A queue for the person</b> with big buttons and keys P / S / H.' + (r ? ' You took ' + f1(r.medianSeconds) + ' s per cell = ' + f0(r.perHour) + ' per hour; the flow sends ' + f0(r.neededPerHour) + ' per hour at 30/min → ' + (r.keepsUp ? 'one checker keeps up.' : 'one checker is NOT enough (' + r.checkers + ' needed).') : '') + '</li>' +
      '<li><b>A shift board</b> from the logbook' + (x && x.b ? ': ' + x.b.passed + ' of ' + x.b.defects + ' defects passed = ' + x.b.per100 + ' per 100 (target ' + x.t + ') → ' + (x.b.per100 <= x.t ? 'met' : 'MISSED') : '') + ', and <b>one REPORT button</b> whose every number is checked' + (rp.removed && rp.removed.length ? ' (the checker removed ' + esc(rp.removed.join(', ')) + ' from draft 1)' : '') + '.</li>' +
      '<li><b>The safe-default rule:</b> when anything is unknown, missing or broken, the screen says NO VERDICT and the cell goes to a person. It never shows PASS. Your fault drill proved it for 4 faults.</li></ul>' +
      '<p><b>Next — Step 8:</b> the sealed test tray opens for the line trial: cells your model has never seen, through this console.</p>' +
      '<p class="hint">All numbers above are measured or counted in your browser, on the validation tray. The test tray is still sealed.</p>');
    var ob = el('button', 'btn run', '⛶ Open the console'); ob.id = 'open7end'; ob.onclick = function () { openFull(api); }; d.appendChild(ob);
    box.appendChild(d);
  });
}

window.PGViz7 = { sketch: sceneSketch, cellPreview: cellPreview, beltPreview: beltPreview, queuePreview: queuePreview, matchPredict: matchPredict, boardPreview: boardPreview,
  reportPreview: reportPreview, drillPreview: drillPreview, openFull: openFull, endCard7: endCard7, fireFault: fireFault, faultTruth: faultTruth };
})();
