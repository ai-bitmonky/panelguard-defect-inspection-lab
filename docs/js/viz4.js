/* PanelGuard Step 4 visuals and hands-on mechanics. Every map and number is computed live from the trained model. */
(function () {
'use strict';
var H = function () { return window.PGViz._h; };
function el(t, c, h) { return H().el(t, c, h); }
function card(p, t, s) { return H().card(p, t, s); }
function tiles(p, l) { return H().tiles(p, l); }
function pct(x, d) { return H().pct(x, d); }
function f3(x) { return x == null || isNaN(x) ? '—' : (+x).toFixed(3); }
var PAINT_MIN = 25;

/* photo + heat overlay. grid: n*n values; area: [from,to] in 64-px units that the grid covers */
function heatCanvas(api, id, grid, n, size, opt) {
  opt = opt || {};
  var c = document.createElement('canvas'); c.width = c.height = size; var x = c.getContext('2d');
  var src = api.canvas(id); x.imageSmoothingEnabled = false; if (src) x.drawImage(src, 0, 0, size, size);
  if (grid && !opt.plain) {
    var mx = 0; for (var i = 0; i < grid.length; i++) if (grid[i] > mx) mx = grid[i];
    var g = document.createElement('canvas'); g.width = g.height = n; var gx = g.getContext('2d'), im = gx.createImageData(n, n);
    for (i = 0; i < n * n; i++) { var v = mx > 0 ? Math.max(0, grid[i]) / mx : 0; im.data[4 * i] = 255; im.data[4 * i + 1] = Math.round(60 + 180 * v); im.data[4 * i + 2] = Math.round(40 * (1 - v)); im.data[4 * i + 3] = v < 0.25 ? 0 : Math.round(215 * Math.pow((v - 0.25) / 0.75, 0.8)); }
    gx.putImageData(im, 0, 0);
    var a = opt.area || [0, 64]; x.imageSmoothingEnabled = true;
    x.drawImage(g, a[0] / 64 * size, a[0] / 64 * size, (a[1] - a[0]) / 64 * size, (a[1] - a[0]) / 64 * size);
  }
  if (opt.mask && opt.mask.length) { x.fillStyle = 'rgba(70,227,255,.45)'; var s = size / 64; opt.mask.forEach(function (p) { x.fillRect((p % 64) * s, Math.floor(p / 64) * s, s + .3, s + .3); }); }
  c.style.cssText = 'width:' + size + 'px;height:' + size + 'px;border-radius:5px;display:block';
  return c;
}
function roughTag(r) { return r && r.rough ? '<div style="font-size:11px;color:#ffb547">review setting — rough</div>' : ''; }
function fig(canvas, cap) { var f = el('figure'); f.style.cssText = 'margin:0;text-align:center;font-size:12.5px;color:#8d9bb0;line-height:1.2'; f.appendChild(canvas); f.appendChild(el('figcaption', null, cap)); return f; }
function noData(host, api, what) {
  host.appendChild(el('div', 'verdict', api.review ? 'Review mode: press “Run up to here” (below the code) to load real data for this page.' : (what || 'Train the model in 3e first.')));
}

/* ================= 4a: paint over the defect ================= */
function scenePaint(s, stage, out, api) {
  if (!api.canvas(s.cells[0])) { stage.innerHTML = '<p class="hint" style="padding:14px">Loading the photos…</p>'; setTimeout(function () { if (document.contains(stage)) scenePaint(s, stage, out, api); }, 500); return; }
  var m = api.mech; m.paint = m.paint || {};
  stage.innerHTML = '';
  var wrap = el('div'); wrap.style.cssText = 'display:flex;gap:12px;padding:12px;flex-wrap:wrap;justify-content:center'; stage.appendChild(wrap);
  var S = 176, brush = 2;
  s.cells.forEach(function (id) {
    var box = el('div'); box.style.cssText = 'text-align:center';
    var cv = document.createElement('canvas'); cv.width = cv.height = S; cv.style.cssText = 'width:' + S + 'px;height:' + S + 'px;border-radius:6px;touch-action:none;cursor:crosshair;display:block;border:1px solid #263346';
    cv.setAttribute('data-paint', id); cv.setAttribute('aria-label', 'paint on cell ' + id);
    var bg = null, set = {}; (m.paint[id] || []).forEach(function (p) { set[p] = 1; });
    api.full(id).then(function (u) { if (!u) return; var im = new Image(); im.onload = function () { bg = im; draw(); }; im.src = u; });
    function draw() {
      var x = cv.getContext('2d'); x.imageSmoothingEnabled = true;
      if (bg) x.drawImage(bg, 0, 0, S, S); else { x.imageSmoothingEnabled = false; x.drawImage(api.canvas(id), 0, 0, S, S); }
      x.fillStyle = 'rgba(70,227,255,.5)'; var k = S / 64; Object.keys(set).forEach(function (p) { p = +p; x.fillRect((p % 64) * k, Math.floor(p / 64) * k, k + .3, k + .3); });
      if (!Object.keys(set).length) { x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, S - 26, S, 26); x.fillStyle = '#ffb547'; x.font = 'bold 13px Rajdhani, Arial'; x.textAlign = 'center'; x.fillText('paint over the defect', S / 2, S - 9); }
    }
    function at(ev) {
      var b = cv.getBoundingClientRect(), px = Math.floor((ev.clientX - b.left) / b.width * 64), py = Math.floor((ev.clientY - b.top) / b.height * 64);
      for (var dy = -brush; dy <= brush; dy++) for (var dx = -brush; dx <= brush; dx++) { var yy = py + dy, xx = px + dx; if (yy >= 0 && yy < 64 && xx >= 0 && xx < 64 && dx * dx + dy * dy <= brush * brush + 1) set[yy * 64 + xx] = 1; }
      draw();
    }
    var down = false;
    cv.addEventListener('pointerdown', function (ev) { down = true; cv.setPointerCapture(ev.pointerId); at(ev); });
    cv.addEventListener('pointermove', function (ev) { if (down) at(ev); });
    cv.addEventListener('pointerup', function () { down = false; m.paint[id] = Object.keys(set).map(Number).sort(function (a, b) { return a - b; }); var done = s.cells.every(function (c) { return (m.paint[c] || []).length >= PAINT_MIN; }); api.setMech({ paint: m.paint, done: m.done || done }); side(); });
    var clr = el('button', 'btn small', 'Clear'); clr.style.marginTop = '4px';
    clr.onclick = function () { set = {}; m.paint[id] = []; api.setMech({ paint: m.paint }); draw(); side(); };
    box.appendChild(cv); box.appendChild(el('div', 'hint', 'cell ' + id)); box.appendChild(clr);
    wrap.appendChild(box); draw();
  });
  function side() {
    out.innerHTML = '';
    var c = card(out, 'YOUR MARKS', 'Paint with your finger or mouse. Cover the dark area, the crack or the dark streak. Not the busbars (the flat dark bars), not the corners.');
    tiles(c, s.cells.map(function (id) { var n = (m.paint[id] || []).length; return [n + ' px', 'cell ' + id + (n >= PAINT_MIN ? ' ✓' : ''), n >= PAINT_MIN ? 'g' : 'a']; }));
    c.appendChild(el('p', null, 'These are your answers to “where is the defect?”. In 4b and 4c the network gives its own answer, and you compare.'));
    c.appendChild(el('p', 'hint', 'All 3 are real validation cells with expert score 1.0. Each has cracks: thin dark lines, sometimes with a dark broken corner.'));
  }
  side();
}

/* ================= 4b pre: drag a gray patch, live score ================= */
function patchPlay(box, api) {
  var CELL = 496;
  var m = api.mech, c = card(box, 'TRY IT: COVER A PART BY HAND', 'Drag the gray square over real cell ' + CELL + '. The network scores the covered photo live. Find the spot that makes the score fall.');
  var body = el('div'); c.appendChild(body); body.appendChild(el('p', 'hint', 'Loading the model…'));
  api.jsEval(async function (NS, pg, tf) {
    if (!NS.model || !NS.xVal || !pg || !pg.refCoverUp) return null;
    var img = NS.xVal.slice([pg.valIndex(pg.paintCells[0]), 0, 0, 0], [1, 64, 64, 1]).squeeze([0]);
    var base = NS.model.predict(img.expandDims(0)).dataSync()[0], ref = pg.refCoverUp(NS.model, img); img.dispose();
    return { base: base, max: Math.max.apply(null, ref) };
  }).then(function (info) {
    body.innerHTML = '';
    if (!info) { noData(body, api, 'There is no trained model in memory yet. Train it in 3e first.'); return; }
    var S = 256, P = 8, pos = m.patch || { r: 28, c: 28 }, busy = false, want = null, best = m.bestDrop || 0;
    var wrap = el('div'); wrap.style.cssText = 'display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start'; body.appendChild(wrap);
    var stageEl = el('div'); stageEl.style.cssText = 'position:relative;width:' + S + 'px;height:' + S + 'px;touch-action:none;cursor:grab'; wrap.appendChild(stageEl);
    var cv = document.createElement('canvas'); cv.width = cv.height = 64; cv.getContext('2d').drawImage(api.canvas(CELL), 0, 0); cv.style.cssText = 'width:' + S + 'px;height:' + S + 'px;image-rendering:pixelated;border-radius:6px'; stageEl.appendChild(cv);
    var sq = el('div', null, '<span style="font-size:10px;color:#000;font-weight:700">drag me</span>'); sq.id = 'patch4b'; sq.style.cssText = 'position:absolute;width:' + (P * S / 64) + 'px;height:' + (P * S / 64) + 'px;background:#7d7d7d;outline:2px solid #ffb547;display:flex;align-items:center;justify-content:center;line-height:1;text-align:center'; stageEl.appendChild(sq);
    var info2 = el('div'); info2.style.cssText = 'flex:1;min-width:200px'; wrap.appendChild(info2);
    function place() { sq.style.left = (pos.c * S / 64) + 'px'; sq.style.top = (pos.r * S / 64) + 'px'; }
    function show(score) {
      var drop = info.base - score; if (drop > best) best = drop;
      var okNow = info.max > 0.01 ? best >= 0.5 * info.max : (m.moves || 0) >= 10;
      info2.innerHTML = '';
      tiles(info2, [[f3(info.base), 'score, nothing covered', 'c'], [f3(score), 'score now', drop > 0.5 * info.max ? 'g' : 'a'], [f3(drop), 'drop', drop > 0 ? 'g' : 'r']]);
      var bar = el('div'); bar.style.cssText = 'height:12px;border-radius:6px;background:#0f1b28;border:1px solid #263346;overflow:hidden;margin:6px 0';
      bar.appendChild(el('div')).style.cssText = 'height:100%;width:' + Math.max(0, Math.min(100, 100 * best / Math.max(1e-6, info.max))).toFixed(0) + '%;background:#3dffa0';
      info2.appendChild(bar); info2.appendChild(el('div', 'hint', 'green bar = your best drop so far, compared with the biggest drop any spot gives (' + f3(info.max) + ')'));
      info2.appendChild(el('div', 'verdict ' + (okNow ? 'good' : ''), okNow ? '✓ Found it: covering that spot takes the evidence away. Now let code test every spot.' : 'Keep moving the patch. Where does the score fall most?'));
      if (okNow && !m.patchOk) api.setMech({ patchOk: 1, bestDrop: best, patch: pos, moves: m.moves });
    }
    function score() {
      if (busy) { want = 1; return; } busy = true; want = null;
      var p = { r: pos.r, c: pos.c };
      api.jsEval(function (NS, pg, tf) { return tf.tidy(function () { var img = NS.xVal.slice([pg.valIndex(pg.paintCells[0]), 0, 0, 0], [1, 64, 64, 1]).squeeze([0]); return NS.model.predict(pg.grayPatch(img, p.r, p.c, 8).expandDims(0)).dataSync()[0]; }); })
        .then(function (s) { busy = false; if (s != null) show(s); if (want) score(); });
    }
    var drag = null;
    stageEl.addEventListener('pointerdown', function (ev) { drag = true; stageEl.setPointerCapture(ev.pointerId); mv(ev); });
    stageEl.addEventListener('pointermove', function (ev) { if (drag) mv(ev); });
    stageEl.addEventListener('pointerup', function () { drag = false; api.setMech({ patch: pos, moves: m.moves, bestDrop: Math.max(m.bestDrop || 0, best) }); });
    function mv(ev) { var b = stageEl.getBoundingClientRect(); pos = { r: Math.max(0, Math.min(56, Math.round((ev.clientY - b.top) / b.height * 64 - P / 2))), c: Math.max(0, Math.min(56, Math.round((ev.clientX - b.left) / b.width * 64 - P / 2))) }; m.moves = (m.moves || 0) + 1; place(); score(); }
    place(); show(info.base); score();
  });
}

/* ================= 4b output ================= */
function coverResult(r, host, api) {
  var paint = (api.getMech('4a').paint) || {};
  var c = card(host, 'COVER-UP MAPS — 3 REAL CELLS', 'Left: your painting from 4a. Right: where covering the photo made the score fall (brighter = bigger drop).');
  r.ids.forEach(function (id, k) {
    var row = el('div'); row.style.cssText = 'display:flex;gap:10px;align-items:flex-end;margin-bottom:8px';
    row.appendChild(fig(heatCanvas(api, id, null, 0, 150, { mask: paint[id] }), 'cell ' + id + ' · you'));
    row.appendChild(fig(heatCanvas(api, id, r.maps[k], 15, 150, { area: [4, 60] }), 'cover-up · biggest drop ' + f3(Math.max.apply(null, r.maps[k])) + roughTag(r)));
    row.appendChild(el('div', 'hint', 'score ' + f3(r.bases[k]) + (paint[id] && paint[id].length ? '' : '<br>(you did not paint this one)')));
    c.appendChild(row);
  });
  c.appendChild(el('p', 'hint', 'The cover-up test asks the model 225 questions per cell. It is slow but easy to trust: it measures, it does not guess.'));
}

/* ================= 4c output: three maps side by side, press-and-hold to peek ================= */
function camCompare(r, host, api) {
  var paint = (api.getMech('4a').paint) || {}, m = api.mech, seen = {};
  var c = card(host, 'THE NETWORK vs THE COVER-UP TEST vs YOU', 'Grad-CAM grid: 16 × 16 (each square = 4 × 4 pixels), so the map is coarse. Press and hold a heat map to see the photo under it.');
  r.cells.forEach(function (cl) {
    var row = el('div'); row.style.cssText = 'display:flex;gap:8px;align-items:flex-start;margin-bottom:10px;flex-wrap:wrap';
    var g = heatCanvas(api, cl.id, cl.cam, 16, 120), cv = heatCanvas(api, cl.id, cl.cover, 15, 120, { area: [4, 60] });
    [g, cv].forEach(function (cn, k) {
      cn.style.cursor = 'pointer'; cn.style.touchAction = 'none'; cn.setAttribute('data-peek', cl.id + '_' + k);
      var plain = heatCanvas(api, cl.id, null, 0, 120), heat = cn.getContext('2d').getImageData(0, 0, 120, 120);
      cn.addEventListener('pointerdown', function () { cn.getContext('2d').drawImage(plain, 0, 0); var key = cl.id + '_' + k; if (!seen[key]) { seen[key] = 1; api.setMech({ peek: (m.peek || 0) + 1 }); } });
      var back = function () { cn.getContext('2d').putImageData(heat, 0, 0); };
      cn.addEventListener('pointerup', back); cn.addEventListener('pointerleave', back);
    });
    row.appendChild(fig(g, 'network (Grad-CAM)' + roughTag(r)));
    row.appendChild(fig(cv, 'cover-up test'));
    var mask = paint[cl.id];
    if (mask) {
      row.appendChild(fig(heatCanvas(api, cl.id, null, 0, 120, { mask: mask }), 'you'));
    }
    var hp = mask && mask.length ? window.PG_STEP4_heatInPaint(Float32Array.from(cl.up), mask) : null;
    var col = cl.y ? (cl.tag === 'missed defect' ? '#ff4d6a' : '#3dffa0') : '#ffb547';
    row.appendChild(el('div', null, '<div style="font-family:Orbitron,Arial,sans-serif;font-size:11px;color:' + col + '">' + cl.tag.toUpperCase() + '</div><div style="font-size:14px">cell ' + cl.id + ' · ' + cl.kind + '<br>CNN score ' + f3(cl.score) + '<br>expert score ' + cl.prob + '</div>' +
      (hp ? '<div style="font-size:14px;margin-top:4px"><b>' + pct(hp.share, 0) + '</b> of the network’s hottest pixels are inside your paint (by chance: ' + pct(hp.chance, 0) + ')</div>' : '')));
    c.appendChild(row);
  });
  c.appendChild(el('p', 'hint', 'Same place in all three = good sign. If the heat sits on the busbars, the border or the corners, the network learned a shortcut.'));
}

/* ================= 4d: deletion result ================= */
function deletion(r, host, api) {
  var c = card(host, 'DELETION TEST — ' + r.n + ' REAL DEFECTS', 'Average drop of the defect score after graying out 10% of the pixels.' + (r.rough ? ' Review setting — rough.' : ''));
  var mx = Math.max(r.dropHot, r.dropRand, 0.01) * 1.2, W = 420, o = '';
  [['hottest 10% (Grad-CAM)', r.dropHot, '#ff8a5c'], ['random 10%', r.dropRand, '#8d9bb0']].forEach(function (b, j) {
    var y = 10 + j * 40, w = Math.max(2, (W - 230) * Math.max(0, b[1]) / mx);
    o += '<text x="0" y="' + (y + 16) + '" font-family="Rajdhani,Arial,sans-serif" font-size="14" fill="#c6d2e2">' + b[0] + '</text><rect x="175" y="' + y + '" width="' + w + '" height="24" rx="4" fill="' + b[2] + '"/><text x="' + (181 + w) + '" y="' + (y + 17) + '" font-family="Space Mono,monospace" font-size="13" fill="#fff">' + f3(b[1]) + '</text>';
  });
  c.appendChild(H().svg(W, 92, o));
  tiles(c, [[r.wins + ' of ' + r.n, 'defects where the hot area hurt more', 'c'], [f3(r.s0), 'average score before', 'c'], [(r.dropRand > 0 ? (r.dropHot / r.dropRand).toFixed(1) + '×' : '—'), 'hot drop ÷ random drop', r.dropHot > 1.5 * r.dropRand ? 'g' : 'a']]);
  var strong = r.dropHot > 1.5 * r.dropRand && r.dropHot - r.dropRand > 0.03;
  c.appendChild(el('div', 'verdict ' + (strong ? 'good' : 'bad'), strong
    ? '<b>The map is partly honest:</b> removing its hottest 10% hurts the score ' + (r.dropHot / Math.max(1e-6, r.dropRand)).toFixed(1) + '× more than removing a random 10%. But it wins on only ' + Math.round(100 * r.wins / r.n) + '% of the defects, so use it as a hint, not as proof.'
    : '<b>Plainly: this result is weak.</b> Removing the hottest pixels hurts only a little more than removing random ones (' + f3(r.dropHot) + ' vs ' + f3(r.dropRand) + '). The map is a rough hint at best.'));
}

/* ================= 4e pre: build the breakdown with chips ================= */
var CHIPS = { kind: ['cell type', 'mono / poly'], prob: ['expert score', 'sure (0, 1) / unsure (0.33, 0.67)'], id: ['cell number', ''], day: ['day of the week', ''] };
function slicePlay(box, api) {
  var m = api.mech; m.rows = m.rows || []; var sel = null, msg = '';
  var r3 = api.res('3g');
  var c = card(box, 'BUILD THE BREAKDOWN', 'Drag a chip into the empty table (or tap a chip, then the table). Only chips that make useful groups will stay.');
  var body = el('div'); c.appendChild(body);
  function draw() {
    body.innerHTML = '';
    var pool = el('div'); pool.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px';
    Object.keys(CHIPS).forEach(function (k) {
      if (m.rows.indexOf(k) >= 0) return;
      var t = el('div', null, CHIPS[k][0]); t.setAttribute('data-chip', k);
      t.style.cssText = 'padding:7px 12px;border-radius:16px;border:1px solid ' + (sel === k ? '#fff' : '#a98bff') + ';background:#151030;cursor:grab';
      window.PGViz3._dragTok(t, function () { put(k); }, function () { sel = sel === k ? null : k; draw(); });
      pool.appendChild(t);
    });
    body.appendChild(pool);
    var tb = el('div'); tb.setAttribute('data-drop', 'table');
    tb.style.cssText = 'border:2px dashed ' + (m.rows.length === 2 ? '#1f6b44' : '#ffb547') + ';border-radius:10px;padding:8px;min-height:90px;background:#0a0f16';
    tb.addEventListener('click', function () { if (sel) put(sel); });
    if (!m.rows.length) tb.appendChild(el('div', 'hint', 'empty table — rows go here'));
    else if (!r3 || !r3.cells) tb.appendChild(el('div', 'hint', api.review ? 'Review mode: press “Run up to here” to load real data for this page.' : 'Run 3g first: the groups use your validation cells.'));
    else {
      var t = '<table style="width:100%;border-collapse:collapse;font-size:14px"><tr style="color:#8d9bb0;font-size:12px"><td>group</td><td style="text-align:right">cells</td><td style="text-align:right">real defects</td></tr>';
      m.rows.forEach(function (k) {
        var groups = k === 'kind' ? [['mono', function (cl) { return cl[4] === 'mono'; }], ['poly', function (cl) { return cl[4] === 'poly'; }]]
          : [['experts sure', function (cl) { return cl[3] === 0 || cl[3] === 1; }], ['experts unsure', function (cl) { return cl[3] > 0 && cl[3] < 1; }]];
        groups.forEach(function (g) { var cs = r3.cells.filter(g[1]); t += '<tr style="border-top:1px solid #1b2533"><td style="padding:4px">' + g[0] + '</td><td style="text-align:right">' + cs.length + '</td><td style="text-align:right">' + cs.filter(function (cl) { return cl[2] === 1; }).length + '</td></tr>'; });
      });
      tb.appendChild(el('div', null, t + '</table>'));
    }
    body.appendChild(tb);
    if (msg) body.appendChild(el('div', 'verdict ' + (msg[0] === '✓' ? 'good' : 'bad'), msg));
    if (m.rows.length === 2) body.appendChild(el('div', 'verdict good', 'Breakdown built. Now let code count the mistakes in each group at your Step 3 gates.'));
  }
  function put(k) {
    sel = null;
    if (k === 'id') msg = '✗ “Cell number” makes 525 groups of one cell. A rate of 1 cell tells you nothing. Use a property many cells share.';
    else if (k === 'day') msg = '✗ The data has no day of the week. Use what the labels file really gives us.';
    else { m.rows.push(k); msg = '✓ “' + CHIPS[k][0] + '” makes groups many cells share: ' + CHIPS[k][1] + '.'; api.setMech({ rows: m.rows, tries: (m.tries || 0) + 1 }); }
    draw();
  }
  draw();
}

/* ================= 4e output: the slice table ================= */
function sliceTable(r, host, api) {
  var R = r.R, rate = function (a, b) { return b ? a / b : 0; };
  var c = card(host, 'WHERE DOES IT FAIL? — YOUR STEP 3 GATES', 'Validation cells, gates low ' + f3(r.low) + ' / high ' + f3(r.high) + '. Live counts.');
  var t = '<style>.slt td{padding:4px 5px;text-align:right}.slt td:first-child{text-align:left}</style><table class="slt" style="width:100%;border-collapse:collapse;font-size:14px"><tr style="color:#8d9bb0;font-size:12px"><td>group</td><td>cells</td><td>defects passed by mistake</td><td>good cells auto-stopped</td><td>sent to a person</td></tr>';
  [['mono', R.mono], ['poly', R.poly], ['experts sure (0 / 1)', R.sure], ['experts unsure (0.33 / 0.67)', R.unsure], ['all cells', r.all]].forEach(function (x, j) {
    var g = x[1]; t += '<tr style="border-top:1px solid ' + (j === 4 ? '#3a4658' : '#1b2533') + (j === 4 ? ';color:#8d9bb0' : '') + '"><td>' + x[0] + '</td><td>' + g.n + '</td><td><b>' + g.defPass + '</b> of ' + g.def + ' (' + pct(rate(g.defPass, g.def), 0) + ')</td><td>' + g.okStop + ' of ' + g.ok + ' (' + pct(rate(g.okStop, g.ok), 0) + ')</td><td>' + pct(rate(g.person, g.n), 0) + '</td></tr>';
  });
  c.appendChild(el('div', null, t + '</table>'));
  var pm = rate(R.mono.defPass, R.mono.def), pp = rate(R.poly.defPass, R.poly.def), hs = rate(R.sure.person, R.sure.n), hu = rate(R.unsure.person, R.unsure.n);
  var lines = [];
  lines.push(pp > pm ? 'Poly cells let more defects slip through: ' + pct(pp, 0) + ' vs ' + pct(pm, 0) + ' for mono.' : pp < pm ? 'Mono cells let more defects slip through: ' + pct(pm, 0) + ' vs ' + pct(pp, 0) + ' for poly.' : 'Mono and poly let the same share of defects slip through (' + pct(pm, 0) + ').');
  lines.push('Cells the experts were unsure about go to a person ' + pct(hu, 0) + ' of the time, vs ' + pct(hs, 0) + ' when they were sure' + (hu > hs ? ' — the model is unsure where the experts were.' : '.'));
  if (R.unsure.def < 30 || R.poly.def < 30) lines.push('Careful: some groups are small (' + R.unsure.def + ' unsure defects, ' + R.poly.def + ' poly defects), so these rates can move a lot with a few cells.');
  c.appendChild(el('div', 'verdict', '<b>What the numbers say:</b><br>' + lines.join('<br>')));
}

/* ================= 4f: sort mistakes into action boxes ================= */
var BOXES = [['more', 'Need more photos like this', '#46e3ff'], ['label', 'Ask the expert to re-check the label', '#d6e05a'], ['sharp', 'Needs a sharper photo', '#a98bff'], ['wrong', 'Model looked at the wrong place', '#ff8a5c']];
function sceneTodo(s, stage, out, api) {
  if (!api.canvas(s.cells ? s.cells[0] : 6)) { stage.innerHTML = '<p class="hint" style="padding:14px">Loading the photos…</p>'; setTimeout(function () { if (document.contains(stage)) sceneTodo(s, stage, out, api); }, 500); return; }
  var m = api.mech; m.box = m.box || {}; var sel = null;
  stage.innerHTML = '<p class="hint" style="padding:14px">Loading the real mistakes and their heat maps…</p>';
  api.jsEval(async function (NS, pg, tf) {
    if (!NS.model || !NS.pBlend || !('low' in NS) || !pg || !pg.refGradCam) return null;
    var y = pg.y_val, s2 = NS.pBlend, lo = NS.low, hi = Math.max(NS.high, NS.low);
    var missed = []; y.forEach(function (v, i) { if (v === 1 && s2[i] < lo) missed.push(i); });
    var fa = s2.map(function (v, i) { return i; }).filter(function (i) { return y[i] === 0; }).sort(function (a, b) { return s2[b] - s2[a]; }).slice(0, 6);
    var list = missed.map(function (i) { return [i, 'missed']; }).concat(fa.map(function (i) { return [i, 'fa']; }));
    var outL = [];
    for (var k = 0; k < list.length; k++) {
      var i = list[k][0], img = NS.xVal.slice([i, 0, 0, 0], [1, 64, 64, 1]).squeeze([0]), cam = pg.refGradCam(NS.model, img);
      outL.push({ id: pg.cell_val[i], kind: list[k][1], score: s2[i], prob: pg.prob_val[i], type: pg.kind_val[i], lane: s2[i] < lo ? 'auto-pass' : s2[i] >= hi ? 'auto-stop' : 'person', cam: Array.from(await cam.data()) });
      img.dispose(); cam.dispose();
    }
    return { list: outL, rough: pg.rough };
  }).then(function (D) {
    if (!D) { stage.innerHTML = ''; noData(stage, api, 'Finish 3g first: the mistakes come from your Step 3 gates.'); out.innerHTML = ''; return; }
    stage.innerHTML = '';
    var pool = el('div'); pool.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:10px;min-height:90px';
    var bins = el('div'); bins.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 10px 10px';
    stage.appendChild(el('div', 'hint', '<div style="padding:10px 12px 0">Red outline = a defect that passed with no check. Amber = a good cell the model scored highest (false alarm). The heat shows where the network looked' + (D.rough ? ' (review setting — rough)' : '') + '. Drag each photo into a box (or tap a photo, then a box).</div>'));
    stage.appendChild(pool); stage.appendChild(bins);
    var foot = el('div'); foot.style.cssText = 'padding:0 10px 12px'; stage.appendChild(foot);
    function tile(d) {
      var w = el('div'); w.setAttribute('data-todo', d.id); w.style.cssText = 'text-align:center;font-size:11px;cursor:grab;padding:2px;border-radius:6px;border:2px solid ' + (sel === d.id ? '#fff' : d.kind === 'missed' ? '#ff4d6a' : '#ffb547');
      w.appendChild(heatCanvas(api, d.id, d.cam, 16, 70));
      if (m.done) w.appendChild(el('div', null, 'exp ' + d.prob + ' · ' + d.type));
      if (!m.done) window.PGViz3._dragTok(w, function (b) { put(d.id, b); }, function () { if (sel && sel !== d.id && m.box[d.id]) { put(sel, m.box[d.id]); return; } sel = sel === d.id ? null : d.id; draw(); });
      return w;
    }
    function put(id, b) { m.box[id] = b; sel = null; api.setMech({ box: m.box }); draw(); }
    function draw() {
      pool.innerHTML = ''; bins.innerHTML = '';
      D.list.forEach(function (d) { if (!m.box[d.id]) pool.appendChild(tile(d)); });
      pool.style.display = m.done && !pool.children.length ? 'none' : 'flex'; if (!pool.children.length) pool.appendChild(el('span', 'hint', 'All sorted.'));
      BOXES.forEach(function (b) {
        var d = el('div', null, '<div style="font-family:Orbitron,Arial,sans-serif;font-size:10px;color:' + b[2] + '">' + b[1].toUpperCase() + '</div>');
        d.setAttribute('data-drop', b[0]); d.style.cssText = 'min-height:100px;border:1px solid ' + b[2] + '66;border-radius:10px;padding:6px;background:#0a0f16';
        var t = el('div'); t.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:4px';
        D.list.forEach(function (x) { if (m.box[x.id] === b[0]) t.appendChild(tile(x)); });
        d.appendChild(t); d.addEventListener('click', function (e) { if (sel && !e.target.closest('[data-todo]')) put(sel, b[0]); });
        bins.appendChild(d);
      });
      foot.innerHTML = '';
      var left = D.list.filter(function (d) { return !m.box[d.id]; }).length;
      if (!m.done) {
        var bt = el('button', 'btn', 'Done sorting'); bt.id = 'todoDone'; bt.disabled = left > 0;
        bt.onclick = function () { var acts = {}; BOXES.forEach(function (b) { acts[b[0]] = D.list.filter(function (d) { return m.box[d.id] === b[0]; }).map(function (d) { return d.id; }); }); api.setMech({ done: 1, actions: acts }); draw(); side(); };
        foot.appendChild(bt); foot.appendChild(el('span', 'hint', left ? '  ' + left + ' left to sort.' : '  Ready.'));
      }
    }
    function side() {
      out.innerHTML = '';
      var c = card(out, 'THE MISTAKES', D.list.filter(function (d) { return d.kind === 'missed'; }).length + ' defects passed with no check at your gates, and the ' + D.list.filter(function (d) { return d.kind === 'fa'; }).length + ' good cells the model was most sure were bad.');
      if (!m.done) { c.appendChild(el('p', null, 'There is no single right box. Look at the photo and the heat: is the defect tiny? Is the label doubtful? Is the photo blurry? Is the heat somewhere silly?')); return; }
      var unsure = D.list.filter(function (d) { return d.prob > 0 && d.prob < 1; }), poly = D.list.filter(function (d) { return d.type === 'poly'; });
      c.appendChild(el('div', 'verdict good', '<b>The label file says</b> (now under each photo): ' + unsure.length + ' of these ' + D.list.length + ' cells had an unsure expert score (0.33 or 0.67) and ' + poly.length + ' are poly cells. You put ' + unsure.filter(function (d) { return m.box[d.id] === 'label'; }).length + ' of the unsure ones in “re-check the label”.'));
      var c2 = card(out, 'ACTION LIST — FOR STEP 8', 'Saved. Step 8 (line trial, retraining) will start from this list.');
      var acts = m.actions || {};
      tiles(c2, BOXES.map(function (b) { return [(acts[b[0]] || []).length, b[1], '']; }));
      out.appendChild(endCard(api));
    }
    draw(); side();
  });
}
function endCard(api) {
  var r4 = api.res('4d'), r5 = api.res('4e');
  var d = r4 ? (r4.dropHot > 1.5 * r4.dropRand && r4.dropHot - r4.dropRand > 0.03 ? 'removing the hottest 10% hurt the score ' + (r4.dropHot / Math.max(1e-6, r4.dropRand)).toFixed(1) + '× more than random (' + f3(r4.dropHot) + ' vs ' + f3(r4.dropRand) + ')' : 'the deletion test was weak (' + f3(r4.dropHot) + ' vs ' + f3(r4.dropRand) + ')') : 'run 4d to measure it';
  var R = r5 && r5.R, rt = function (g) { return g.def ? Math.round(100 * g.defPass / g.def) + '%' : '—'; };
  return el('div', 'endc', '<h3 class="fh">STEP 4 DONE — WHAT WE TRUST, WHAT WE DO NOT</h3>' +
    '<ul><li><b>Trust a little:</b> ' + d + '. The cover-up test and Grad-CAM let us check any single photo.</li>' +
    '<li><b>Do not trust blindly:</b> the Grad-CAM map is coarse (16 × 16) and wins on only part of the cells.</li>' +
    (R ? '<li><b>Weak spots:</b> defects passed with no check — mono ' + rt(R.mono) + ', poly ' + rt(R.poly) + '; experts unsure ' + rt(R.unsure) + ' vs sure ' + rt(R.sure) + '.</li>' : '') +
    '<li>Your action list is saved for Step 8.</li></ul>' +
    '<p><b>Next — Step 5:</b> wire the pass / person / stop routing with LangGraph. The test tray stays sealed until Step 8.</p>' +
    '<p class="hint">All numbers above were computed live in your browser, on the validation tray.</p>');
}

window.PGViz4 = { paint: scenePaint, todo: sceneTodo, patchPlay: patchPlay, coverResult: coverResult, camCompare: camCompare, deletion: deletion, slicePlay: slicePlay, sliceTable: sliceTable, heatCanvas: heatCanvas };
})();
