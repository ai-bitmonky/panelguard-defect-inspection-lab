/* PanelGuard Step 3 visuals and hands-on mechanics. Every number comes from the student's own tensors / model (live). */
(function () {
'use strict';
var H = function () { return window.PGViz._h; };
function el(t, c, h) { return H().el(t, c, h); }
function card(p, t, s) { return H().card(p, t, s); }
function tiles(p, l) { return H().tiles(p, l); }
function pct(x, d) { return H().pct(x, d); }
function n0(x) { return Math.round(x).toLocaleString('en-US'); }
function f3(x) { return x == null || !isFinite(x) ? (x === Infinity ? '∞ (none)' : '—') : (+x).toFixed(3); }
var NS = 'http://www.w3.org/2000/svg';
function svg(w, hh, inner) { return H().svg(w, hh, inner); }
function T(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-family="' + (o.f || 'Rajdhani,Arial,sans-serif') + '" font-size="' + (o.s || 13) + '" fill="' + (o.c || '#c6d2e2') + '"' + (o.a ? ' text-anchor="' + o.a + '"' : '') + (o.w ? ' font-weight="' + o.w + '"' : '') + '>' + s + '</text>'; }
function bytesCanvas(bytes, off, size, map) {
  var c = document.createElement('canvas'); c.width = c.height = size; var x = c.getContext('2d'), im = x.createImageData(size, size);
  for (var k = 0; k < size * size; k++) { var v = bytes[off + k]; if (map) { var rgb = map(v); im.data[4 * k] = rgb[0]; im.data[4 * k + 1] = rgb[1]; im.data[4 * k + 2] = rgb[2]; } else im.data[4 * k] = im.data[4 * k + 1] = im.data[4 * k + 2] = v; im.data[4 * k + 3] = 255; }
  x.putImageData(im, 0, 0); return c;
}
function cellBytes(api, id) { var c = api.canvas(id); if (!c) return null; var d = c.getContext('2d').getImageData(0, 0, 64, 64).data, o = new Uint8Array(4096); for (var i = 0; i < 4096; i++) o[i] = d[4 * i]; return o; }
function px(c, s) { c.style.cssText += ';width:' + s + 'px;height:' + s + 'px;image-rendering:pixelated;border-radius:4px;display:block'; return c; }

/* ---------- generic drag-or-tap tokens ---------- */
function dragTok(tok, onDrop, onTap) {
  tok.classList.add('dragtok'); tok.style.touchAction = 'none';
  tok.addEventListener('pointerdown', function (ev) {
    ev.preventDefault(); var moved = false, gh = null, sx = ev.clientX, sy = ev.clientY;
    function mv(e) {
      if (!moved && Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 5) { moved = true; gh = tok.cloneNode(true); if (tok.tagName === 'CANVAS') gh.getContext('2d').drawImage(tok, 0, 0); gh.style.position = 'fixed'; gh.style.zIndex = 60; gh.style.pointerEvents = 'none'; gh.style.opacity = '.85'; document.body.appendChild(gh); }
      if (gh) { gh.style.left = (e.clientX - tok.offsetWidth / 2) + 'px'; gh.style.top = (e.clientY - tok.offsetHeight / 2) + 'px'; }
    }
    function up(e) {
      document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (gh) gh.remove();
      if (!moved) { onTap && onTap(); return; }
      var t = document.elementFromPoint(e.clientX, e.clientY); t = t && t.closest && t.closest('[data-drop]');
      if (t) onDrop(t.getAttribute('data-drop'));
    }
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  });
}
function shake(e) { e.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 }); }

/* ================= 3a: build the shape with tiles ================= */
var TILE = { photos: ['2,624', 'photos'], rows: ['64', 'rows'], cols: ['64', 'columns'], chan: ['1', 'channel'] };
var WANT = ['photos', 'rows', 'cols', 'chan'];
var WHY = {
  photos: 'Photos come first: TensorFlow first asks “how many photos are in this batch?”',
  rows: 'Rows come right after the photo count: first go DOWN the photo (height)…',
  cols: '…then ACROSS it (width). Columns come after rows.',
  chan: 'The channel comes last (“channels-last”). A gray photo has 1 channel; a colour photo would have 3.'
};
function tiles3a(box, api) {
  var m = api.mech; m.slots = m.slots || [null, null, null, null]; var sel = null, msg = '';
  var c = card(box, 'BUILD THE SHAPE', 'TensorFlow reads a stack of photos as a list of 4 numbers. Drag each tile into its slot (or tap a tile, then a slot).');
  var wrap = el('div'); wrap.style.cssText = 'display:flex;gap:14px;align-items:center;flex-wrap:wrap'; c.appendChild(wrap);
  var pic = el('div'); pic.style.cssText = 'flex:0 0 250px'; wrap.appendChild(pic);
  var right = el('div'); right.style.cssText = 'flex:1;min-width:250px'; wrap.appendChild(right);
  function picture() {
    var done = function (k) { return m.slots[WANT.indexOf(k)] === k; };
    var o = '';
    for (var i = 4; i >= 0; i--) o += '<rect x="' + (40 + i * 14) + '" y="' + (40 - i * 9) + '" width="130" height="130" rx="4" fill="#0b121b" stroke="' + (done('photos') ? '#46e3ff' : '#2a3a50') + '"/>';
    o += '<image id="pg3aimg" x="40" y="40" width="130" height="130" preserveAspectRatio="none" style="image-rendering:pixelated"/>';
    var on = function (k) { return done(k) ? '#46e3ff' : '#4a5a70'; };
    o += '<line x1="45" y1="36" x2="115" y2="-5" stroke="' + on('photos') + '" stroke-width="2" marker-end="url(#ar)"/>' + T(118, 8, done('photos') ? '2,624 photos' : 'photos ?', { c: on('photos'), w: 700 });
    o += '<line x1="30" y1="45" x2="30" y2="165" stroke="' + on('rows') + '" stroke-width="2" marker-end="url(#ar)"/>' + T(24, 110, done('rows') ? '64 rows' : 'rows ?', { c: on('rows'), a: 'end', w: 700 });
    o += '<line x1="45" y1="182" x2="165" y2="182" stroke="' + on('cols') + '" stroke-width="2" marker-end="url(#ar)"/>' + T(105, 200, done('cols') ? '64 columns' : 'columns ?', { c: on('cols'), a: 'middle', w: 700 });
    o += T(105, 216, done('chan') ? '1 channel (gray)' : 'channels ?', { c: on('chan'), a: 'middle', w: 700 });
    var s = svg(250, 222, '<defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 10 5 0 10z" fill="#46e3ff"/></marker></defs>' + o);
    s.setAttribute('viewBox', '-30 -10 250 232');
    pic.innerHTML = ''; pic.appendChild(s);
    var cv = api.canvas(6); if (cv) s.querySelector('#pg3aimg').setAttribute('href', cv.toDataURL());
  }
  function place(k, i) {
    if (m.tilesDone) return;
    if (WANT[i] === k) { m.slots[i] = k; msg = '✓ ' + WHY[k]; m.tries = (m.tries || 0) + 1; }
    else { m.tries = (m.tries || 0) + 1; msg = '✗ Not there. ' + WHY[k]; var sl = right.querySelector('[data-drop="' + i + '"]'); if (sl) shake(sl); }
    var done = m.slots.every(function (v, j) { return v === WANT[j]; });
    api.setMech({ slots: m.slots, tries: m.tries, tilesDone: done ? 1 : 0 });
    sel = null; draw();
  }
  function draw() {
    picture(); right.innerHTML = '';
    var row = el('div'); row.style.cssText = 'display:flex;align-items:center;gap:6px;font-family:Space Mono,monospace;font-size:22px;color:#8d9bb0;flex-wrap:wrap';
    row.appendChild(el('span', null, '['));
    m.slots.forEach(function (v, i) {
      var s = el('div', null, v ? '<b style="color:#46e3ff">' + TILE[v][0] + '</b><div style="font-size:10px;color:#8d9bb0;font-family:Rajdhani,Arial">' + TILE[v][1] + '</div>' : '<span style="font-size:11px;color:#5d6b80;font-family:Rajdhani,Arial">axis ' + i + '</span>');
      s.setAttribute('data-drop', i);
      s.style.cssText = 'min-width:74px;height:52px;border:2px dashed ' + (v ? '#1f6b44' : '#ffb547') + ';border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:' + (v ? '#0b2418' : '#151109') + ';cursor:pointer';
      s.onclick = function () { if (sel && !v) place(sel, i); };
      row.appendChild(s); if (i < 3) row.appendChild(el('span', null, ','));
    });
    row.appendChild(el('span', null, ']'));
    right.appendChild(row);
    var pool = el('div'); pool.style.cssText = 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;min-height:50px';
    ['chan', 'cols', 'photos', 'rows'].forEach(function (k) {
      if (m.slots.indexOf(k) >= 0) return;
      var t = el('div', null, '<b style="font-family:Space Mono,monospace;font-size:18px">' + TILE[k][0] + '</b> <span style="font-size:13px">' + TILE[k][1] + '</span>');
      t.style.cssText = 'padding:8px 12px;border-radius:8px;border:1px solid ' + (sel === k ? '#fff' : '#46e3ff') + ';background:#0f2232;cursor:grab;color:#e6eef8';
      t.setAttribute('data-tile', k);
      dragTok(t, function (slot) { place(k, +slot); }, function () { sel = sel === k ? null : k; draw(); });
      pool.appendChild(t);
    });
    if (!pool.children.length) pool.appendChild(el('span', 'hint', 'All 4 tiles placed.'));
    right.appendChild(pool);
    if (msg) right.appendChild(el('div', 'verdict ' + (msg[0] === '✓' ? 'good' : 'bad'), msg));
    if (m.tilesDone) right.appendChild(el('div', 'verdict good', '<b>Shape built: [2624, 64, 64, 1].</b> Now type it in Gap 1 of the code below, and run.'));
  }
  draw();
}

/* ================= 3a output: the stack ================= */
function stack(r, host, api) {
  if (!r.shape) return;
  tiles(host, [['[' + r.shape.join(', ') + ']', 'X.shape', 'c'], [r.min.toFixed(1) + ' – ' + r.max.toFixed(1), 'value range', 'c'], [r.dtype, 'type', 'c']]);
  if (!r.sample) return;
  var c = card(host, 'ONE REAL CELL INSIDE THE TENSOR', 'Cell ' + r.sampleId + ' as the network will see it: 64 × 64 numbers from 0 (dark) to 1 (bright). The box shows a piece of the crack.');
  var row = el('div'); row.style.cssText = 'display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap'; c.appendChild(row);
  var bytes = r.sample.map(function (v) { return Math.round(v * 255); });
  var cv = bytesCanvas(bytes, 0, 64); var wrapc = el('div'); wrapc.style.cssText = 'position:relative;width:176px;height:176px'; wrapc.appendChild(px(cv, 176));
  var y0 = 14, x0 = 12, N = 7, s = 176 / 64;
  var box = el('div'); box.style.cssText = 'position:absolute;left:' + (x0 * s) + 'px;top:' + (y0 * s) + 'px;width:' + (N * s) + 'px;height:' + (N * s) + 'px;outline:2px solid #ffb547'; wrapc.appendChild(box);
  row.appendChild(wrapc);
  var g = '<table style="border-collapse:collapse;font-family:Space Mono,monospace;font-size:11px">';
  for (var yy = 0; yy < N; yy++) { g += '<tr>'; for (var xx = 0; xx < N; xx++) { var v = r.sample[(y0 + yy) * 64 + x0 + xx]; g += '<td style="padding:2px 3px;background:rgb(' + [Math.round(v * 255), Math.round(v * 255), Math.round(v * 255)] + ');color:' + (v > 0.3 ? '#000' : '#fff') + '">' + v.toFixed(2) + '</td>'; } g += '</tr>'; }
  row.appendChild(el('div', null, g + '</table><div class="hint" style="margin-top:4px">rows ' + y0 + '–' + (y0 + N - 1) + ', columns ' + x0 + '–' + (x0 + N - 1) + ': the dark diagonal is the crack</div>'));
  var c2 = card(host, 'THE TRAYS', 'Same cells as Step 1. Python sent the indices; TensorFlow picked the photos.');
  tiles(c2, [['[' + r.train.join(', ') + ']', 'xTrain — learn', 'g'], ['[' + r.val.join(', ') + ']', 'xVal — choose', 'a'], [String(r.n - r.nTrain - r.nVal), 'test — still sealed', 'r']]);
}

/* ================= 3b: hand-made filter on a real cracked cell ================= */
var CRACK_ID = 6;
function masks() {
  var crack = new Uint8Array(4096), bar = new Uint8Array(4096);
  for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) {
    var lx = 29 - (y - 2) * 25 / 27, d = Math.abs(x - lx), i = y * 64 + x;
    if (d <= 1.5 && y >= 2 && y <= 29 && [9, 10, 11, 12].indexOf(y) < 0) crack[i] = 1;
    if ([9, 10, 11, 12, 30, 31, 32, 33, 34, 51, 52, 53, 54].indexOf(y) >= 0 && x >= 4 && x <= 59 && d > 3) bar[i] = 1;
  }
  return { crack: crack, bar: bar };
}
function conv3(img, k) {   // same math as tf.conv2d(x, k, 1, 'same') followed by relu
  var o = new Float32Array(4096);
  for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) {
    var s = 0;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var yy = y + dy, xx = x + dx; if (yy < 0 || yy > 63 || xx < 0 || xx > 63) continue; s += img[yy * 64 + xx] * k[(dy + 1) * 3 + dx + 1]; }
    o[y * 64 + x] = s > 0 ? s : 0;
  }
  return o;
}
var CR_MIN = 0.03, CR_RATIO = 2.5;
function sceneFilter(s, stage, out, api) {
  var m = api.mech; m.k = m.k || [0, 0, 0, 0, 1, 0, 0, 0, 0];
  var b = cellBytes(api, CRACK_ID); if (!b) { stage.innerHTML = '<p class="hint" style="padding:14px">Loading the photos…</p>'; setTimeout(function () { if (api.sub && document.contains(stage)) sceneFilter(s, stage, out, api); }, 600); return; }
  var img = new Float32Array(4096); for (var i = 0; i < 4096; i++) img[i] = b[i] / 255;
  var M = masks(), anim = null, showMask = false;
  stage.innerHTML = '';
  var wrap = el('div'); wrap.style.cssText = 'display:flex;gap:12px;padding:12px 8px;flex-wrap:wrap;align-items:flex-start;justify-content:center'; stage.appendChild(wrap);
  function fig(title) { var f = el('div'); f.style.cssText = 'text-align:center;position:relative'; f.appendChild(el('div', null, '<span style="font-family:Orbitron,Arial,sans-serif;font-size:11px;letter-spacing:.14em;color:#8d9bb0">' + title + '</span>')); wrap.appendChild(f); return f; }
  var fIn = fig('REAL CELL ' + CRACK_ID + ' (INPUT)'), fK = fig('YOUR 3 × 3 FILTER'), fOut = fig('WHAT THE FILTER SEES');
  var S = 160, cIn = document.createElement('canvas'); cIn.width = cIn.height = 64; cIn.getContext('2d').drawImage(api.canvas(CRACK_ID), 0, 0);
  var inWrap = el('div'); inWrap.style.cssText = 'position:relative;width:' + S + 'px;height:' + S + 'px;margin-top:4px'; inWrap.appendChild(px(cIn, S));
  var win = el('div'); win.style.cssText = 'position:absolute;width:' + (3 * S / 64) + 'px;height:' + (3 * S / 64) + 'px;outline:2px solid #46e3ff;box-shadow:0 0 8px #46e3ff;display:none'; inWrap.appendChild(win);
  var mk = document.createElement('canvas'); mk.width = mk.height = 64; mk.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;display:none'; inWrap.appendChild(mk);
  fIn.appendChild(inWrap);
  var mx = mk.getContext('2d'), mi = mx.createImageData(64, 64); for (i = 0; i < 4096; i++) { var cr = M.crack[i], br = M.bar[i]; mi.data[4 * i] = cr ? 255 : br ? 255 : 0; mi.data[4 * i + 1] = cr ? 77 : br ? 181 : 0; mi.data[4 * i + 2] = cr ? 106 : br ? 71 : 0; mi.data[4 * i + 3] = cr || br ? 150 : 0; } mx.putImageData(mi, 0, 0);
  var tog = el('button', 'btn small', 'Show the zones'); tog.style.marginTop = '6px';
  tog.onclick = function () { showMask = !showMask; mk.style.display = showMask ? 'block' : 'none'; tog.textContent = showMask ? 'Hide the zones' : 'Show the zones'; };
  fIn.appendChild(tog);
  var zl = el('div', 'hint', '<span style="color:#ff4d6a">■</span> crack zone · <span style="color:#ffb547">■</span> busbar zone'); zl.style.display = 'none'; fIn.appendChild(zl);
  tog.addEventListener('click', function () { zl.style.display = showMask ? 'block' : 'none'; });
  var grid = el('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,58px);gap:5px;margin-top:8px'; fK.appendChild(grid);
  fK.appendChild(el('div', 'hint', 'tap a square: 0 → +1 → −1'));
  fK.style.maxWidth = '200px';
  var cOut = document.createElement('canvas'); cOut.width = cOut.height = 64; var outWrap = el('div'); outWrap.style.cssText = 'margin-top:4px'; outWrap.appendChild(px(cOut, S)); fOut.appendChild(outWrap);
  var bars = el('div'); bars.style.cssText = 'width:100%;padding:0 14px 12px'; stage.appendChild(bars);
  function paintGrid() {
    grid.innerHTML = '';
    m.k.forEach(function (v, j) {
      var bt = el('button', null, v > 0 ? '+1' : v < 0 ? '−1' : '0');
      bt.style.cssText = 'height:58px;border-radius:8px;font-family:Orbitron,Arial,sans-serif;font-size:18px;font-weight:700;border:1px solid ' + (v > 0 ? '#3dffa0' : v < 0 ? '#ff4d6a' : '#33445a') + ';background:' + (v > 0 ? '#0b2418' : v < 0 ? '#2a0e16' : '#0c131d') + ';color:' + (v > 0 ? '#3dffa0' : v < 0 ? '#ff8a9c' : '#8d9bb0');
      bt.setAttribute('aria-label', 'filter weight ' + (j + 1) + ': ' + v);
      bt.onclick = function () { m.k[j] = v === 0 ? 1 : v === 1 ? -1 : 0; m.taps = (m.taps || 0) + 1; api.setMech({ k: m.k, taps: m.taps }); paintGrid(); run(); };
      grid.appendChild(bt);
    });
  }
  function score(o) { var cs = 0, cn = 0, bs = 0, bn = 0; for (var q = 0; q < 4096; q++) { if (M.crack[q]) { cs += o[q]; cn++; } if (M.bar[q]) { bs += o[q]; bn++; } } return { crack: cs / cn, bar: bs / bn }; }
  function run() {
    var o = conv3(img, m.k), sc = score(o), mxv = 0; for (var q = 0; q < 4096; q++) if (o[q] > mxv) mxv = o[q];
    var scale = Math.max(0.12, mxv), x = cOut.getContext('2d'), im = x.createImageData(64, 64);
    for (q = 0; q < 4096; q++) im.data[4 * q + 3] = 255;
    x.putImageData(im, 0, 0);
    if (anim) cancelAnimationFrame(anim);
    var row = 0, t0 = performance.now();
    (function step() {
      var target = Math.min(64, Math.floor((performance.now() - t0) / 700 * 64) + 1);
      for (; row < target; row++) for (var xx = 0; xx < 64; xx++) { var v = Math.min(1, o[row * 64 + xx] / scale), k = 4 * (row * 64 + xx); im.data[k] = Math.round(70 * v + 185 * v * v); im.data[k + 1] = Math.round(227 * v); im.data[k + 2] = Math.round(255 * v); }
      x.putImageData(im, 0, 0);
      win.style.display = row < 64 ? 'block' : 'none'; win.style.top = ((row - 2) * S / 64) + 'px'; win.style.left = (((performance.now() / 3) % 62) * S / 64) + 'px';
      if (row < 64) anim = requestAnimationFrame(step);
    })();
    var ok = sc.crack >= CR_MIN && sc.crack >= CR_RATIO * sc.bar;
    var mxBar = Math.max(0.1, sc.crack, sc.bar) * 1.15, W = 420;
    bars.innerHTML = '';
    var o2 = '';
    [['crack glow', sc.crack, '#ff4d6a'], ['busbar glow', sc.bar, '#ffb547']].forEach(function (b2, j) {
      var y = 8 + j * 30, w = Math.max(1, (W - 120) * b2[1] / mxBar);
      o2 += T(0, y + 14, b2[0], { s: 14, w: 700, c: b2[2] }) + '<rect x="100" y="' + y + '" width="' + w + '" height="18" rx="3" fill="' + b2[2] + '"/>' + T(106 + w, y + 14, b2[1].toFixed(3), { f: 'Space Mono,monospace', s: 12 });
    });
    var need = Math.max(CR_MIN, CR_RATIO * sc.bar); o2 += '<line x1="' + (100 + (W - 120) * need / mxBar) + '" y1="4" x2="' + (100 + (W - 120) * need / mxBar) + '" y2="30" stroke="#fff" stroke-dasharray="3 3"/>' + T(100 + (W - 120) * need / mxBar, 70, 'crack must reach here', { s: 11, a: 'middle', c: '#fff' });
    bars.appendChild(svg(W, 74, o2));
    if (ok && !m.done) api.setMech({ done: 1, solved: m.k.slice() });
    side(sc, ok);
  }
  function side(sc, ok) {
    out.innerHTML = '';
    var c = card(out, 'THE CHALLENGE', 'Make the crack glow at least ' + CR_RATIO + '× brighter than the busbars (the 3 dark horizontal bars), and at least ' + CR_MIN + '.');
    tiles(c, [[sc.crack.toFixed(3), 'crack glow', ok ? 'g' : 'r'], [sc.bar.toFixed(3), 'busbar glow', 'a'], [sc.bar > 0 ? (sc.crack / sc.bar).toFixed(1) + '×' : (sc.crack > 0 ? '∞' : '—'), 'crack ÷ busbar', ok ? 'g' : 'a']]);
    c.appendChild(el('div', 'verdict ' + (ok ? 'good' : 'bad'), ok ? '✓ <b>Solved.</b> Your filter answers “is it darker on one side than the other, left to right?” The busbars run left to right, so they hardly answer. The crack runs on a slant, so it does.' : 'Not yet. Try: what changes as you go ACROSS the crack, but not across a busbar?'));
    c.appendChild(el('p', null, 'How it works: the cyan box slides over every pixel. At each spot it multiplies the 9 pixels under it by your 9 numbers and adds them up. Below zero becomes 0 (that is ReLU). Same math as <code>tf.conv2d</code> + <code>relu</code>.'));
    c.appendChild(el('p', 'hint', 'In 3c the network gets 240 filters like this one — and learns their numbers by itself in 3e.'));
  }
  paintGrid(); run();
}

/* ================= 3c: layer diagram ================= */
function blocksOf(layers) {
  var B = [], cur = null;
  layers.forEach(function (l) {
    if (l.cls === 'Conv2D') { cur = { kind: 'block', layers: [l] }; B.push(cur); }
    else if (cur && (l.cls === 'BatchNormalization' || l.cls === 'Activation' || l.cls === 'MaxPooling2D')) { cur.layers.push(l); if (l.cls === 'MaxPooling2D') cur = null; }
    else { cur = null; B.push({ kind: l.cls, layers: [l] }); }
  });
  B.forEach(function (b) { b.params = b.layers.reduce(function (a, l) { return a + l.params; }, 0); b.out = b.layers[b.layers.length - 1].out; });
  return B;
}
function layers3c(r, host, api) {
  var m = api.mech, B = blocksOf(r.layers), sel = m.sel != null ? m.sel : null, msg = '';
  var big = 0; B.forEach(function (b, i) { if (b.params > B[big].params) big = i; });
  var c = card(host, 'YOUR NETWORK — REAL SHAPES', 'Read from your model object. Each picture shows the data shape after that block. Tap a block to open it.');
  var holder = el('div'); c.appendChild(holder);
  var det = el('div'); c.appendChild(det);
  var W = 440, Hh = 206;
  function draw() {
    var o = '', x = 4, n = B.length + 1, slot = (W - 8) / n;
    function box(cx, side, depth, col, label, sub, idx) {
      var s = side, d = Math.min(22, depth / 7 + 4), y = 76 - s / 2;
      var g = '<g data-b="' + idx + '" style="cursor:pointer">';
      for (var k = 3; k >= 0; k--) g += '<rect x="' + (cx - s / 2 + k * d / 4) + '" y="' + (y - k * d / 4) + '" width="' + s + '" height="' + s + '" fill="' + (k ? '#0b121b' : '#0f2232') + '" stroke="' + col + '" stroke-opacity="' + (k ? .45 : 1) + '"/>';
      var ly = idx % 2 ? 172 : 146;
      g += '<line x1="' + (cx + d / 2) + '" y1="' + (y + s + 2) + '" x2="' + (cx + d / 2) + '" y2="' + (ly - 11) + '" stroke="#26344a"/>' + T(cx + d / 2, ly, label, { a: 'middle', s: 10.5, f: 'Space Mono,monospace', c: '#e6eef8' }) + T(cx + d / 2, ly + 13, sub, { a: 'middle', s: 11, c: '#8d9bb0' });
      if (sel === idx) g += '<rect x="' + (cx - slot / 2 + 2) + '" y="4" width="' + (slot - 4) + '" height="196" rx="8" fill="none" stroke="#ffb547" stroke-width="2"/>';
      return g + '<rect x="' + (cx - slot / 2 + 2) + '" y="4" width="' + (slot - 4) + '" height="196" fill="transparent"/></g>';
    }
    var cx = 4 + slot / 2;
    o += box(cx, 44, 1, '#46e3ff', '64×64×1', 'input', -1);
    B.forEach(function (b, i) {
      cx += slot; var sh = b.out;
      if (b.kind === 'block') o += box(cx, Math.max(8, sh[1] * 1.3), sh[3], i === big && m.tapBig ? '#3dffa0' : '#a98bff', sh[1] + '×' + sh[2] + '×' + sh[3], n0(b.params) + ' w', i);
      else o += box(cx, 10, sh[sh.length - 1] || 1, '#ffb547', String(sh[sh.length - 1]), (b.kind === 'GlobalAveragePooling2D' ? 'average' : b.kind === 'Dense' ? 'score' : b.kind.toLowerCase()) + (b.params ? ' · ' + b.params + ' w' : ''), i);
    });
    var s = svg(W, Hh, o); holder.innerHTML = ''; holder.appendChild(s);
    [].forEach.call(s.querySelectorAll('[data-b]'), function (g) { g.addEventListener('click', function () { tap(+g.getAttribute('data-b')); }); });
    det.innerHTML = '';
    if (sel != null && sel >= 0) {
      var b = B[sel], t = '<table style="width:100%;border-collapse:collapse;font-size:14px">';
      b.layers.forEach(function (l) { t += '<tr style="border-bottom:1px solid #1b2533"><td style="padding:3px 4px">' + l.cls + (l.filters ? ' · ' + l.filters + ' filters 3×3' : '') + (l.units ? ' · ' + l.units + ' unit' : '') + '</td><td style="font-family:Space Mono,monospace;font-size:12px">[' + l.out.map(function (v) { return v == null ? 'N' : v; }).join(', ') + ']</td><td style="text-align:right;font-family:Space Mono,monospace">' + n0(l.params) + '</td></tr>'; });
      det.appendChild(el('div', null, t + '</table>'));
    }
    if (msg) det.appendChild(el('div', 'verdict ' + (msg[0] === '✓' ? 'good' : 'bad'), msg));
  }
  function tap(i) {
    sel = i; m.sel = i;
    if (!m.tapBig) {
      if (i === big) { var cv = B[i].layers[0]; msg = '✓ Yes: ' + n0(B[i].params) + ' weights. Its conv layer alone has 3 × 3 × ' + (cv.params / 9 / cv.filters) + ' × ' + cv.filters + ' = ' + n0(cv.params) + ': many channels come in, many filters go out.'; api.setMech({ tapBig: 1, sel: i }); }
      else { msg = '✗ This one holds ' + n0(i < 0 ? 0 : B[i].params) + '. Look for more.'; api.setMech({ sel: i, wrong: (m.wrong || 0) + 1 }); }
    } else api.setMech({ sel: i });
    draw();
  }
  draw();
  tiles(host, [[n0(r.total), 'weights to learn', 'c'], ['[' + r.inShape.slice(1).join(', ') + ']', 'one photo in', 'c'], ['[' + r.outShape.slice(1).join(', ') + ']', 'one score out', 'c']]);
}

/* ================= 3d: sort the changed photos ================= */
var AUG = [
  { k: 'lr', name: 'Left-right flip', real: true, why: 'Real. A cell can sit either way round in a module. The crack is still a crack; the busbars stay flat.' },
  { k: 'rot', name: 'Quarter turn (90°)', real: false, why: 'Not real. The busbars would run up-down. Every mono cell on this line has flat (left-right) busbars, so the network would learn from photos that never happen.' },
  { k: 'bright', name: 'A bit darker', real: true, why: 'Real. Glow strength changes with the current and the camera. (Our tests found it did not help this data set, so we leave it out of the code.)' },
  { k: 'blur', name: 'Heavy blur', real: false, why: 'Not real. The camera is sharp. Blur wipes out thin cracks, so a “defect” label may now sit on a photo with no visible defect.' },
  { k: 'ud', name: 'Up-down flip', real: true, why: 'Real. Busbars stay flat, the cell is still a cell, the label stays true.' }
];
function augCanvas(api, k) {
  var b = cellBytes(api, CRACK_ID), o = new Uint8Array(4096), x, y;
  for (y = 0; y < 64; y++) for (x = 0; x < 64; x++) {
    var v = b[y * 64 + x];
    if (k === 'lr') o[y * 64 + 63 - x] = v; else if (k === 'ud') o[(63 - y) * 64 + x] = v; else if (k === 'rot') o[x * 64 + 63 - y] = v;
    else if (k === 'bright') o[y * 64 + x] = Math.round(v * 0.72); else o[y * 64 + x] = v;
  }
  if (k === 'blur') for (var pass = 0; pass < 3; pass++) { var t = new Uint8Array(4096); for (y = 0; y < 64; y++) for (x = 0; x < 64; x++) { var s = 0, n = 0; for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) { var yy = y + dy, xx = x + dx; if (yy >= 0 && yy < 64 && xx >= 0 && xx < 64) { s += o[yy * 64 + xx]; n++; } } t[y * 64 + x] = s / n; } o = t; }
  return bytesCanvas(o, 0, 64);
}
function sortAug(box, api) {
  var m = api.mech; m.bins = m.bins || {}; var sel = null;
  var c = card(box, 'WHICH CHANGES STILL GIVE A REAL CELL PHOTO?', 'Each card is real cell ' + CRACK_ID + ' (a cracked mono cell), changed by the computer. Drag each card into a box (or tap a card, then a box). Then check.');
  var top = el('div'); top.style.cssText = 'display:flex;gap:10px;align-items:center;margin-bottom:6px';
  var org = document.createElement('canvas'); org.width = org.height = 64; org.getContext('2d').drawImage(api.canvas(CRACK_ID), 0, 0);
  top.appendChild(px(org, 72)); top.appendChild(el('div', 'hint', 'The original photo. Busbars run left-right; the crack runs on a slant at the top left.'));
  c.appendChild(top);
  var pool = el('div'); pool.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;min-height:110px;padding:6px;border:1px dashed #33445a;border-radius:10px'; c.appendChild(pool);
  var bins = el('div'); bins.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px'; c.appendChild(bins);
  var foot = el('div'); c.appendChild(foot);
  function cardEl(a) {
    var w = el('div'); w.style.cssText = 'text-align:center;width:96px;font-size:12.5px;line-height:1.1;cursor:grab;padding:3px;border-radius:8px;border:1px solid ' + (sel === a.k ? '#fff' : 'transparent');
    w.appendChild(px(augCanvas(api, a.k), 88)); w.appendChild(el('div', null, a.name));
    w.setAttribute('data-aug', a.k);
    if (m.checked && m.bins[a.k]) { var ok = (m.bins[a.k] === 'real') === a.real; w.style.borderColor = ok ? '#3dffa0' : '#ff4d6a'; w.appendChild(el('div', null, ok ? '<span style="color:#3dffa0">✓</span>' : '<span style="color:#ff4d6a">✗</span>')); }
    if (!m.sortOk) dragTok(w, function (b) { put(a.k, b); }, function () { if (sel && sel !== a.k && m.bins[a.k]) { put(sel, m.bins[a.k]); return; } sel = sel === a.k ? null : a.k; draw(); });
    return w;
  }
  function put(k, b) { m.bins[k] = b; m.checked = 0; sel = null; api.setMech({ bins: m.bins, checked: 0 }); draw(); }
  function draw() {
    pool.innerHTML = ''; bins.innerHTML = '';
    AUG.forEach(function (a) { if (!m.bins[a.k]) pool.appendChild(cardEl(a)); });
    pool.style.minHeight = '110px'; if (!pool.children.length) { pool.appendChild(el('span', 'hint', 'All cards sorted.')); pool.style.minHeight = '0'; }
    [['real', 'STILL A REAL CELL PHOTO', '#3dffa0'], ['fake', 'NOT A REAL CELL PHOTO', '#ff4d6a']].forEach(function (b) {
      var d = el('div', null, '<div style="font-family:Orbitron,Arial,sans-serif;font-size:10.5px;color:' + b[2] + '">' + b[1] + '</div>');
      d.setAttribute('data-drop', b[0]); d.style.cssText = 'min-height:130px;border:1px solid ' + b[2] + '66;border-radius:10px;padding:6px;background:#0a0f16';
      var t = el('div'); t.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:4px';
      AUG.forEach(function (a) { if (m.bins[a.k] === b[0]) t.appendChild(cardEl(a)); });
      d.appendChild(t); d.addEventListener('click', function (e) { if (sel && !e.target.closest('[data-aug]')) put(sel, b[0]); });
      bins.appendChild(d);
    });
    foot.innerHTML = '';
    var left = AUG.filter(function (a) { return !m.bins[a.k]; }).length;
    if (m.sortOk) { foot.appendChild(el('div', 'verdict good', '<b>All 5 right.</b> Only changes the camera could really produce are safe. The code below uses the two flips.')); AUG.forEach(function (a) { foot.appendChild(el('div', 'hint', '<b>' + a.name + ':</b> ' + a.why)); }); return; }
    var chk = el('button', 'btn', 'Check my sort'); chk.disabled = left > 0; chk.style.marginTop = '8px';
    chk.onclick = function () {
      var wrong = AUG.filter(function (a) { return (m.bins[a.k] === 'real') !== a.real; });
      api.setMech({ checked: 1, checks: (m.checks || 0) + 1, sortOk: wrong.length ? 0 : 1 }); draw();
      if (wrong.length) foot.appendChild(el('div', 'verdict bad', wrong.length + ' card' + (wrong.length > 1 ? 's are' : ' is') + ' in the wrong box (marked ✗). Hint for “' + wrong[0].name + '”: would the camera on this line ever take such a photo of a real cell?'));
    };
    foot.appendChild(chk); foot.appendChild(el('span', 'hint', left ? '  ' + left + ' left to sort.' : '  Ready.'));
  }
  draw();
}

/* ================= 3d output: real flips ================= */
function flips(r, host, api) {
  if (!r.orig || !r.demo) return;
  var c = card(host, 'YOUR flipSome ON 6 REAL CELLS', 'Top: the photos. Bottom: what your function gave back this time. Labels do not change.');
  var g = el('div'); c.appendChild(g);
  function name(i, d) {
    function eq(f) { for (var y = 0; y < 64; y += 3) for (var x = 0; x < 64; x += 3) if (Math.abs(d[i * 4096 + y * 64 + x] - r.orig[i * 4096 + f(y, x)]) > 1) return false; return true; }
    if (eq(function (y, x) { return y * 64 + x; })) return 'unchanged';
    if (eq(function (y, x) { return y * 64 + 63 - x; })) return 'left-right';
    if (eq(function (y, x) { return (63 - y) * 64 + x; })) return 'up-down';
    if (eq(function (y, x) { return (63 - y) * 64 + 63 - x; })) return 'both';
    return 'mixed up!';
  }
  function draw(d) {
    g.innerHTML = '';
    var grid = el('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:4px;text-align:center;font-size:12px';
    r.ids.forEach(function (id, i) { var cv = bytesCanvas(r.orig, i * 4096, 64); cv.style.cssText = 'width:100%;image-rendering:pixelated;border-radius:3px'; var w = el('div'); w.appendChild(cv); w.appendChild(el('div', 'hint', 'cell ' + id)); grid.appendChild(w); });
    r.ids.forEach(function (id, i) { var cv = bytesCanvas(d, i * 4096, 64); cv.style.cssText = 'width:100%;image-rendering:pixelated;border-radius:3px;outline:1px solid #46e3ff'; var w = el('div'); w.appendChild(cv); var nm = name(i, d); w.appendChild(el('div', null, '<span style="color:' + (nm === 'unchanged' ? '#8d9bb0' : '#46e3ff') + '">' + nm + '</span>')); grid.appendChild(w); });
    g.appendChild(grid);
  }
  draw(r.demo);
  var again = el('button', 'btn small', '↻ Call flipSome again'); again.style.marginTop = '8px';
  again.onclick = function () {
    api.jsEval(async function (NSx, pg, tf) { var b = tf.gather(NSx.X, r.ids.map(pg.cellIndex)), o = NSx.flipSome(b), d = await o.data(); b.dispose(); o.dispose(); return Array.prototype.map.call(d, function (v) { return Math.round(v * 255); }); })
      .then(function (d) { if (d) draw(d); });
  };
  c.appendChild(again);
  tiles(host, [[r.cnt.orig, 'unchanged', 'c'], [r.cnt.lr, 'left-right', 'c'], [r.cnt.ud, 'up-down', 'c'], [r.cnt.both, 'both', 'c']]);
  c.appendChild(el('p', 'hint', 'Counts are from 12 test calls × 6 cells. Every epoch in 3e calls flipSome on all ' + '1,574 train photos, so the network rarely sees the exact same picture twice.'));
}

/* ================= 3e: prediction sketch ('draw' format) ================= */
function drawGuess(holder, P, pr, onSet, locked) {
  holder.innerHTML = '';
  var W = 440, Hh = 200, L = 40, R = W - 10, Tt = 12, B = Hh - 34, N = 30;
  var X = function (i) { return L + (R - L) * i / (N - 1); }, Y = function (v) { return B - (B - Tt) * v; };
  var pts = pr.val ? pr.val.slice() : new Array(N).fill(null);
  var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh); s.style.cssText = 'width:100%;max-width:520px;display:block;touch-action:none;background:#070b11;border:1px solid #1b2533;border-radius:8px;cursor:' + (locked ? 'default' : 'crosshair');
  function line(arr, col, dash, wd) { var p = []; arr.forEach(function (v, i) { if (v != null) p.push(X(i).toFixed(1) + ',' + Y(v).toFixed(1)); }); return p.length > 1 ? '<polyline points="' + p.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="' + (wd || 3) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' stroke-linejoin="round"/>' : ''; }
  function paint() {
    var o = '<rect x="' + L + '" y="' + Tt + '" width="' + (R - L) + '" height="' + (B - Tt) + '" fill="none" stroke="#1b2533"/>';
    [1, 10, 20, 30].forEach(function (e) { o += T(X(e - 1), B + 14, e, { a: 'middle', s: 11, f: 'Space Mono,monospace', c: '#8d9bb0' }); });
    o += T((L + R) / 2, Hh - 4, 'epoch (one pass over all train photos)', { a: 'middle', s: 12, c: '#8d9bb0' });
    o += '<text transform="translate(14 ' + ((Tt + B) / 2) + ') rotate(-90)" text-anchor="middle" font-family="Rajdhani,Arial,sans-serif" font-size="12" fill="#8d9bb0">validation score →</text>';
    o += T(L + 4, Tt + 12, 'high', { s: 11, c: '#5d6b80' }) + T(L + 4, B - 4, 'low', { s: 11, c: '#5d6b80' });
    if (locked) o += line(P.answer, '#3dffa0', '6 4', 2.5) + T(R - 4, Y(P.answer[N - 1]) - 26, 'typical real shape', { a: 'end', s: 12, c: '#3dffa0' });
    o += line(pts, '#a98bff') + (locked ? T(X(2), Y(pts[2] || 0.5) - 8, 'your line', { s: 12, c: '#a98bff' }) : '');
    if (!locked && pts.every(function (v) { return v == null; })) o += T((L + R) / 2, (Tt + B) / 2, 'press here and drag from left to right', { a: 'middle', s: 15, c: '#ffb547', w: 700 });
    s.innerHTML = o;
  }
  if (!locked) {
    var down = false, last = null;
    function at(ev) {
      var b = s.getBoundingClientRect(), x = (ev.clientX - b.left) * W / b.width, y = (ev.clientY - b.top) * Hh / b.height;
      var i = Math.round((x - L) / (R - L) * (N - 1)), v = Math.max(0, Math.min(1, (B - y) / (B - Tt)));
      if (i < 0 || i >= N) return;
      if (last != null && Math.abs(i - last.i) > 1) { var a = Math.min(i, last.i), z = Math.max(i, last.i); for (var j = a; j <= z; j++) pts[j] = last.v + (v - last.v) * (j - last.i) / (i - last.i); }
      pts[i] = v; last = { i: i, v: v }; paint();
    }
    s.addEventListener('pointerdown', function (ev) { down = true; last = null; s.setPointerCapture(ev.pointerId); at(ev); });
    s.addEventListener('pointermove', function (ev) { if (down) at(ev); });
    s.addEventListener('pointerup', function () { down = false; onSet(pts.slice()); });
  }
  paint(); holder.appendChild(s);
  return { filled: function () { return pts.filter(function (v) { return v != null; }).length; } };
}
function fillGaps(pts) {
  var o = pts.slice(), N = o.length, first = o.findIndex(function (v) { return v != null; }); if (first < 0) return o;
  for (var i = 0; i < first; i++) o[i] = o[first];
  for (i = first + 1; i < N; i++) if (o[i] == null) { var j = i; while (j < N && o[j] == null) j++; for (var k = i; k < j; k++) o[k] = j < N ? o[i - 1] + (o[j] - o[i - 1]) * (k - i + 1) / (j - i + 1) : o[i - 1]; i = j; }
  return o;
}

/* ================= 3e: curves ================= */
function curveChart(hist, epochs, opt) {
  opt = opt || {};
  var W = 440, Hh = 230, L = 38, R = W - 40, Tt = 14, B = Hh - 36, E = Math.max(epochs, 2);
  var X = function (e) { return L + (R - L) * (e - 1) / (E - 1); };
  var losses = []; hist.forEach(function (h) { if (h.loss != null) losses.push(h.loss); losses.push(h.valLoss); });
  var lmax = Math.max(0.8, Math.max.apply(null, losses.length ? losses : [1]) * 1.05);
  var YL = function (v) { return B - (B - Tt) * v / lmax; };
  var aucs = hist.map(function (h) { return h.valAuc; }).filter(isFinite), amin = Math.min(0.5, Math.floor((Math.min.apply(null, aucs.length ? aucs : [0.5]) - 0.02) * 10) / 10);
  var YA = function (v) { return B - (B - Tt) * (Math.max(amin, v) - amin) / (1 - amin); };
  var o = '<rect x="' + L + '" y="' + Tt + '" width="' + (R - L) + '" height="' + (B - Tt) + '" fill="#070b11" stroke="#1b2533"/>';
  [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].filter(function (v) { return v >= amin - 1e-9; }).forEach(function (v) { o += '<line x1="' + L + '" x2="' + R + '" y1="' + YA(v) + '" y2="' + YA(v) + '" stroke="#121b28"/>' + T(R + 4, YA(v) + 4, v.toFixed(1), { s: 10, f: 'Space Mono,monospace', c: '#46e3ff' }); });
  [0, lmax / 2, lmax].forEach(function (v) { o += T(L - 4, YL(v) + 4, v.toFixed(2), { s: 10, f: 'Space Mono,monospace', c: '#ffb547', a: 'end' }); });
  var ticks = E <= 10 ? Array.from({ length: E }, function (_, i) { return i + 1; }) : [1, 5, 10, 15, 20, 25, 30].filter(function (e) { return e <= E; });
  ticks.forEach(function (e) { o += T(X(e), B + 13, e, { a: 'middle', s: 10, f: 'Space Mono,monospace', c: '#8d9bb0' }); });
  o += T((L + R) / 2, Hh - 6, 'epoch', { a: 'middle', s: 12, c: '#8d9bb0' });
  if (opt.sketch) { var sk = opt.sketch.map(function (v, i) { var e = 1 + i * (E - 1) / (opt.sketch.length - 1); return X(e).toFixed(1) + ',' + YA(amin + (1 - amin) * (0.15 + 0.8 * v)).toFixed(1); }); o += '<polyline points="' + sk.join(' ') + '" fill="none" stroke="#a98bff" stroke-width="1.5" stroke-dasharray="4 4" opacity=".8"/>'; }
  function pl(key, Yf, col, w, dash) { var p = hist.filter(function (h) { return h[key] != null && isFinite(h[key]); }).map(function (h) { return X(h.epoch).toFixed(1) + ',' + Yf(h[key]).toFixed(1); }); if (!p.length) return ''; return (p.length > 1 ? '<polyline points="' + p.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>' : '') + hist.filter(function (h) { return h[key] != null; }).map(function (h) { return '<circle cx="' + X(h.epoch) + '" cy="' + Yf(h[key]) + '" r="2.5" fill="' + col + '"/>'; }).join(''); }
  o += pl('loss', YL, '#ffb547', 2) + pl('valLoss', YL, '#ff8a5c', 1.5, '5 3') + pl('valAuc', YA, '#46e3ff', 3);
  if (opt.best) o += '<line x1="' + X(opt.best.epoch) + '" x2="' + X(opt.best.epoch) + '" y1="' + Tt + '" y2="' + B + '" stroke="#3dffa0" stroke-width="2"/><circle cx="' + X(opt.best.epoch) + '" cy="' + YA(opt.best.valAuc) + '" r="6" fill="none" stroke="#3dffa0" stroke-width="2"/>' + T(X(opt.best.epoch) + (opt.best.epoch > E * 0.7 ? -6 : 6), Tt + 14, 'best epoch ' + opt.best.epoch, { s: 12, w: 700, c: '#3dffa0', a: opt.best.epoch > E * 0.7 ? 'end' : 'start' });
  o += '<g font-family="Rajdhani,Arial,sans-serif" font-size="12">' + T(L + 6, B - 8, '━ train loss', { c: '#ffb547' }) + T(L + 86, B - 8, '┅ validation loss', { c: '#ff8a5c' }) + T(L + 196, B - 8, '━ validation score', { c: '#46e3ff' }) + (opt.sketch ? T(L + 306, B - 8, '┅ your sketch', { c: '#a98bff' }) : '') + '</g>';
  return svg(W, Hh, o);
}
function gpuText(r) { return r.backend === 'webgl' ? (r.gpu && r.gpu.soft ? 'WebGL on a SOFTWARE renderer (no graphics chip): ' + r.gpu.name : 'WebGL (graphics chip' + (r.gpu && r.gpu.name ? ': ' + r.gpu.name : '') + ')') : 'CPU (no WebGL) — very slow'; }
function curves(r, host, api) {
  if (!r.hist || !r.hist.length) return;
  var c = card(host, 'TRAINING CURVES — REAL EPOCHS', (r.restoredFrom ? 'Restored from this browser’s storage: the weights and curves of your run on ' + r.restoredFrom + '. ' : '') + 'Every point was measured live on the validation tray.');
  c.appendChild(curveChart(r.hist, r.epochs, { best: r.best, sketch: api.predVal }));
  var last = r.hist[r.hist.length - 1], per = r.hist.reduce(function (a, h) { return a + h.sec; }, 0) / r.hist.length;
  tiles(c, [[r.best.epoch + ' / ' + r.epochs, 'best epoch (kept)', 'g'], [f3(r.best.valAuc), 'best validation score', 'c'], [f3(last.valAuc), 'last epoch score', 'a']]);
  tiles(c, [[per.toFixed(1) + ' s', 'per epoch', 'c'], [(r.sec / 60).toFixed(1) + ' min', 'total', 'c'], [r.backend.toUpperCase(), 'TensorFlow.js backend', r.backend === 'webgl' ? 'g' : 'r']]);
  c.appendChild(el('p', 'hint', 'Ran on: ' + gpuText(r) + '. ' + (r.saved ? 'Weights saved in this browser: a reload brings this model back.' : r.restoredFrom ? '' : 'Could not save the weights in this browser (storage is blocked here). After a reload you will need to train again.')));
  if (r.epochs < 30) c.appendChild(el('p', 'hint', 'Trained for ' + r.epochs + (r.epochs === 1 ? ' epoch (' : ' epochs (') + (r.epochs === 10 ? 'Quick' : 'test') + ' setting). Full is 30 epochs; it usually scores a little better.'));
}
function curvesLive(host, api) {
  var box = el('div'); host.appendChild(box);
  function upd(s) {
    if (!s) return;
    box.innerHTML = '';
    var c = card(box, 'TRAINING — LIVE', 'Backend: ' + gpuText({ backend: s.backend, gpu: api.gpu() }) + '. The page stays usable; ■ Stop really stops after the current batch.');
    c.appendChild(curveChart(s.hist, s.epochs, { best: s.best, sketch: api.predVal }));
    var per = s.hist.length ? s.hist.reduce(function (a, h) { return a + h.sec; }, 0) / s.hist.length : null;
    var frac = (s.done + (s.batch || 0) / s.batches) / s.epochs;
    var bar = el('div'); bar.style.cssText = 'height:10px;border-radius:6px;background:#0f1b28;border:1px solid #263346;overflow:hidden;margin:6px 0';
    bar.appendChild(el('div', null, '')).style.cssText = 'height:100%;width:' + (100 * frac).toFixed(1) + '%;background:linear-gradient(90deg,#1aa6c9,#46e3ff)';
    c.appendChild(bar);
    var el2 = (Date.now() - s.t0) / 1000, eta = per ? per * (s.epochs - s.done) - (Date.now() - s.tEpoch) / 1000 : null;
    c.appendChild(el('div', null, '<b>Epoch ' + Math.min(s.epochs, s.done + 1) + ' of ' + s.epochs + '</b> · batch ' + (s.batch || 0) + ' of ' + s.batches + (s.batchLoss != null ? ' · batch loss ' + (+s.batchLoss).toFixed(3) : '') + ' · ' + (el2 / 60).toFixed(1) + ' min so far' + (eta != null ? ' · about ' + Math.max(0, eta / 60).toFixed(1) + ' min left' : ' · time per epoch shows after epoch 1')));
    if (s.best) c.appendChild(el('div', 'hint', 'Best so far: epoch ' + s.best.epoch + ', validation score ' + f3(s.best.valAuc) + '.'));
  }
  return { update: upd };
}

/* ================= 3f: blend ================= */
function blend(r, host, api) {
  window.PGViz.gate({ cells: r.cells }, host, api);
  var hd = host.querySelector('.vc h4'); if (hd) hd.textContent = 'THE CUTOFF GATE — CNN SCORES';
  var c = card(host, 'SIDE BY SIDE — VALIDATION TRAY', r.n + ' cells, each model at its own 95%-recall cutoff. Live numbers.');
  var k = 1000 / r.n, rows = [[r.baseline + ' (Step 2)', r.base], ['CNN alone', r.cnn], ['Blend (CNN weight ' + r.bestW + ')', r.blend]];
  var best = Math.min(r.base.far, r.cnn.far, r.blend.far);
  var t = '<style>.sbs td{padding:4px 5px}</style><table class="sbs" style="width:100%;border-collapse:collapse;font-size:14px"><tr style="color:#8d9bb0;font-size:12px;text-align:right"><td style="text-align:left">model</td><td>ranking score</td><td>recall</td><td>false-alarm rate</td><td>per 1,000: defects missed</td><td>good cells stopped</td></tr>';
  rows.forEach(function (x) { var q = x[1], b = q.far === best; t += '<tr style="border-top:1px solid #1b2533;text-align:right' + (b ? ';color:#3dffa0;font-weight:700' : '') + '"><td style="text-align:left;padding:5px 2px">' + x[0] + '</td><td>' + f3(q.auc) + '</td><td>' + pct(q.rec) + '</td><td>' + pct(q.far) + '</td><td>' + n0(q.fn * k) + '</td><td><b>' + n0(q.fp * k) + '</b></td></tr>'; });
  c.appendChild(el('div', null, t + '</table>'));
  var cnnWins = r.cnn.far < r.base.far;
  c.appendChild(el('div', 'verdict ' + (cnnWins ? 'good' : 'bad'), cnnWins
    ? '<b>The CNN alone beats Step 2 here:</b> ' + n0(r.cnn.fp * k) + ' good cells stopped per 1,000 instead of ' + n0(r.base.fp * k) + '.'
    : '<b>Plainly: the CNN alone does not beat the Step 2 baseline</b> (' + pct(r.cnn.far) + ' vs ' + pct(r.base.far) + ' false alarms). Why: thin cracks are only 1–2 pixels wide at 64 × 64, the experts themselves were unsure on many cells, and there are only ' + n0(r.nTrain) + ' training photos. Published work on this data set tops out near 88% accuracy.'));
  c.appendChild(el('div', 'verdict ' + (r.blend.far < r.base.far ? 'good' : 'bad'), r.blend.far < r.base.far
    ? '<b>The blend helps:</b> ' + n0(r.blend.fp * k) + ' good cells stopped per 1,000 instead of ' + n0(r.base.fp * k) + ' — at the same 95% recall. Better, but still ' + pct(r.blend.far, 0) + ' of good cells. One gate cannot fix this.'
    : '<b>The blend does not beat Step 2 here</b> (' + pct(r.blend.far) + ' vs ' + pct(r.base.far) + '). One gate cannot fix this.'));
  if (r.card) window.PGViz.report(r.card, host, api, { noSorter: true, title: 'REPORT CARD — BLEND (CNN WEIGHT ' + r.bestW + ')', verdict: function (f) { return '<b>Still one gate:</b> to stop 95 of 100 defects, ' + f + ' good cells per 1,000 go to re-check. Tap any photo to look closely. Step 3g splits the cells into three lanes instead.'; } });
  var c2 = card(host, 'HOW THE CNN WEIGHT WAS PICKED', 'False-alarm rate at 95% recall for each weight (0 = only Step 2, 1 = only CNN). Lower is better.');
  var W = 440, Hh = 150, mx = Math.max.apply(null, r.ws.map(function (w) { return w[1]; })) * 1.1, o = '', bw = (W - 20) / r.ws.length;
  r.ws.forEach(function (w, i) { var h = (Hh - 40) * w[1] / mx, x = 10 + i * bw, isB = Math.abs(w[0] - r.bestW) < 1e-9; o += '<rect x="' + (x + 3) + '" y="' + (Hh - 24 - h) + '" width="' + (bw - 6) + '" height="' + h + '" rx="3" fill="' + (isB ? '#3dffa0' : '#2a5a7a') + '"/>' + T(x + bw / 2, Hh - 10, w[0].toFixed(1), { a: 'middle', s: 11, f: 'Space Mono,monospace', c: '#8d9bb0' }) + T(x + bw / 2, Hh - 28 - h, pct(w[1], 0), { a: 'middle', s: 10, c: isB ? '#3dffa0' : '#8d9bb0' }); });
  c2.appendChild(svg(W, Hh, o));
  c2.appendChild(el('p', 'hint', 'Picked on validation, so the blend number is a little hopeful. The sealed test tray (Step 8) gives the honest one.'));
}

/* ================= 3g: two gates ================= */
function twoGate(host, y, s, ids, st, onChange, opt) {
  opt = opt || {};
  /* the score line spans the real range of these scores (so bunched-up scores still spread out) */
  var W = 440, Hh = 250, mid = 120, L = 14, R = W - 10;
  var smin = Math.min.apply(null, s), smax = Math.max.apply(null, s), pad = Math.max(1e-3, 0.03 * (smax - smin));
  var lo0 = Math.max(0, smin - pad), hi0 = Math.min(1, smax + pad);
  var X = function (v) { return L + (R - L) * (Math.max(lo0, Math.min(hi0, v)) - lo0) / (hi0 - lo0); }, XI = function (p) { return lo0 + (hi0 - lo0) * Math.max(0, Math.min(1, (p - L) / (R - L))); };
  var nb = 64, BIN = function (v) { return Math.min(nb - 1, Math.max(0, Math.floor((v - lo0) / (hi0 - lo0) * nb))); };
  var idx = s.map(function (v, i) { return i; }).sort(function (a, b) { return s[a] - s[b]; }), maxS = 1, cnt = {};
  idx.forEach(function (i) { var k = BIN(s[i]) + (y[i] ? 'd' : 'g'); cnt[k] = (cnt[k] || 0) + 1; maxS = Math.max(maxS, cnt[k]); });
  var dot = Math.min((R - L) / nb, (mid - 30) / maxS);
  if (st.low == null || st.low < lo0 || st.low > hi0) st.low = s.slice().sort(function (a, b) { return a - b; })[Math.floor(0.3 * s.length)];
  if (st.high == null || (st.high <= 1 && (st.high < st.low || st.high > hi0))) st.high = s.slice().sort(function (a, b) { return a - b; })[Math.floor(0.8 * s.length)];
  var cv = document.createElement('canvas'), dpr = window.devicePixelRatio || 1; cv.width = W * dpr; cv.height = Hh * dpr; cv.style.cssText = 'width:100%;touch-action:none;cursor:ew-resize;display:block';
  cv.__st = st; cv.setAttribute('data-lo', lo0); cv.setAttribute('data-hi', hi0); cv.setAttribute('data-l', L); cv.setAttribute('data-r', R); cv.setAttribute('data-w', W);
  host.appendChild(cv);
  var info = el('div'); host.appendChild(info);
  var drag = null;
  function draw() {
    var x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, Hh);
    var lo = st.low, hi = Math.max(st.high, st.low);
    x.fillStyle = 'rgba(61,255,160,.06)'; x.fillRect(L, 0, X(lo) - L, Hh - 22);
    x.fillStyle = 'rgba(255,181,71,.08)'; x.fillRect(X(lo), 0, X(Math.min(hi0, hi)) - X(lo), Hh - 22);
    x.fillStyle = 'rgba(255,77,106,.08)'; if (hi <= hi0) x.fillRect(X(hi), 0, R - X(hi) + 10, Hh - 22);
    var fill = {};
    idx.forEach(function (i) {
      var b = BIN(s[i]), k = b + (y[i] ? 'd' : 'g'); fill[k] = (fill[k] || 0) + 1;
      var pxx = L + (b + 0.5) * (R - L) / nb, py = y[i] ? mid - 6 - fill[k] * dot : mid + 6 + (fill[k] - 1) * dot;
      var lane = s[i] < lo ? 'p' : s[i] >= hi ? 's' : 'h';
      x.fillStyle = y[i] ? (lane === 'p' ? '#ff2d55' : lane === 'h' ? '#ffd0d8' : '#ff8a9c') : (lane === 's' ? '#ffb547' : lane === 'h' ? '#8ac0a5' : '#2f8a5f');
      if (y[i] && lane === 'p') { x.fillRect(pxx - dot / 2 - 0.5, py - 0.5, dot + 1, dot < 3 ? dot + 0.5 : dot + 1); if (dot >= 5) { x.fillStyle = '#fff'; x.fillRect(pxx - dot / 2 + 1.5, py + 1, dot - 5, dot - 5); } }
      else x.fillRect(pxx - dot / 2 + 0.5, py, Math.max(1, dot - 1), dot < 3 ? dot + 0.4 : dot - 1);
    });
    x.strokeStyle = '#3a4658'; x.beginPath(); x.moveTo(L, mid); x.lineTo(R, mid); x.stroke();
    x.font = '10px Space Mono, monospace'; x.fillStyle = '#8d9bb0'; x.textAlign = 'center';
    for (var q = 0; q <= 5; q++) { var tv = lo0 + (hi0 - lo0) * q / 5; x.textAlign = q === 0 ? 'left' : q === 5 ? 'right' : 'center'; x.fillText(tv.toFixed(2), X(tv), Hh - 8); }
    x.textAlign = 'left'; x.fillStyle = '#ff8a9c'; x.fillText('defects', L, 12); x.fillStyle = '#3dffa0'; x.fillText('good cells', L, Hh - 26);
    x.textAlign = 'right'; x.fillStyle = '#5d6b80'; x.fillText('score →', R, Hh - 26);
    [['low', lo, '#3dffa0'], ['high', hi, '#ff4d6a']].forEach(function (g) {
      if (g[1] > hi0) return; var gx = X(g[1]); x.strokeStyle = g[2]; x.lineWidth = 3; x.beginPath(); x.moveTo(gx, 16); x.lineTo(gx, Hh - 22); x.stroke(); x.lineWidth = 1;
      x.fillStyle = g[2]; x.fillRect(gx - 24, g[0] === 'low' ? mid - 30 : mid + 8, 48, 20); x.fillStyle = '#001018'; x.font = 'bold 11px Orbitron, Arial'; x.textAlign = 'center'; x.fillText(g[1].toFixed(3), gx, g[0] === 'low' ? mid - 16 : mid + 22);
    });
    x.font = '10px Orbitron, Arial'; x.textAlign = 'center';
    x.fillStyle = '#3dffa0'; x.fillText('AUTO-PASS', (L + X(lo)) / 2, 26);
    if (X(Math.min(hi0, hi)) - X(lo) > 50) { x.fillStyle = '#ffb547'; x.fillText('PERSON', (X(lo) + X(Math.min(hi0, hi))) / 2, 26); }
    if (hi <= hi0 && R - X(hi) > 40) { x.fillStyle = '#ff4d6a'; x.fillText('AUTO-STOP', (X(hi) + R) / 2, 26); }
    var g2 = window.PGJS.twoGates(y, s, lo, st.high);
    info.innerHTML = '';
    var okP = g2.passRate <= 0.05 + 1e-12;
    tiles(info, [[g2.defPass + ' of ' + g2.nDef + ' (' + pct(g2.passRate) + ')', 'defects passed by mistake' + (okP ? ' ✓' : ' — over 5%!'), okP ? 'g' : 'r'],
                 [g2.okStop + ' (' + pct(g2.okStopRate) + ')', 'good cells auto-stopped', 'a'], [pct(g2.human), 'cells sent to a person', 'c']]);
    var a = Math.round(1000 * g2.autoPass), h2 = Math.round(1000 * g2.human), st2 = 1000 - a - h2, o = '', i2 = 0;
    function blocks(n, col) { for (var j = 0; j < n; j++, i2++) o += '<rect x="' + ((i2 % 50) * 8.8) + '" y="' + (Math.floor(i2 / 50) * 8.8) + '" width="7.6" height="7.6" rx="1" fill="' + col + '"/>'; }
    blocks(a, '#2f8a5f'); blocks(h2, '#ffb547'); blocks(st2, '#ff4d6a');
    info.appendChild(el('div', 'hint', 'Per 1,000 cells on the line: <b style="color:#3dffa0">' + a + '</b> auto-pass · <b style="color:#ffb547">' + h2 + '</b> to a person · <b style="color:#ff4d6a">' + st2 + '</b> auto-stop' + (opt.cap ? ' · checker can take <b>' + opt.cap + '</b>' : '')));
    var sv = svg(440, 176, o); sv.style.maxWidth = '440px'; info.appendChild(sv);
    if (opt.cap) { var capLine = el('div'); capLine.style.cssText = 'height:6px;border-radius:3px;margin-top:2px;background:linear-gradient(90deg,#ffb547 ' + Math.min(100, 100 * h2 / Math.max(1, opt.cap)).toFixed(0) + '%,#1d2a3a 0)'; info.appendChild(capLine); info.appendChild(el('div', 'hint', 'checker load: ' + h2 + ' of ' + opt.cap + (h2 > opt.cap ? ' — <b style="color:#ff4d6a">too many</b>' : ''))); }
    onChange && onChange(g2);
  }
  function at(ev) { var b = cv.getBoundingClientRect(); return XI((ev.clientX - b.left) * W / b.width); }
  cv.addEventListener('pointerdown', function (ev) {
    var v = at(ev), dl = Math.abs(X(v) - X(st.low)), dh = Math.abs(X(v) - X(Math.min(hi0, st.high)));
    drag = dl <= dh ? 'low' : 'high'; cv.setPointerCapture(ev.pointerId); move(ev);
  });
  function move(ev) { if (!drag) return; var v = at(ev); if (drag === 'low') st.low = Math.min(v, st.high > 1 ? hi0 : st.high); else st.high = v >= hi0 - 1e-9 ? Infinity : Math.max(v, st.low); st.moved = st.moved || {}; st.moved[drag] = 1; draw(); }
  cv.addEventListener('pointermove', move);
  cv.addEventListener('pointerup', function () { drag = null; opt.onUp && opt.onUp(); });
  draw();
  return { redraw: draw };
}
function twoGatePlay(box, api) {
  var r3f = api.res('3f'), m = api.mech;
  var c = card(box, 'TRY IT: TWO GATES ON THE REAL SCORES', 'Every real validation cell is stacked at its blend score from 3f: defects above the line, good cells below. Drag the green LOW gate and the red HIGH gate. Rule: at most 5 of every 100 defects may land left of the low gate (bright red).');
  if (!r3f || !r3f.blendScores) { c.appendChild(el('p', 'hint', 'Waiting for your 3f scores… (if this stays, run 3f again)')); return; }
  var st = m.play ? { low: m.play.low, high: m.play.high == null ? Infinity : m.play.high, moved: m.play.moved } : { low: null, high: null };
  twoGate(c, r3f.y, r3f.blendScores, null, st, function (g) {
    var done = g.passRate <= 0.05 + 1e-12 && st.moved && st.moved.low && st.moved.high;
    if (done && !m.twoDone) setTimeout(function () { api.setMech({ twoDone: 1, play: { low: st.low, high: st.high, moved: st.moved } }); c.appendChild(el('div', 'verdict good', '✓ At most 5% of defects pass. Now let the code find the best gates by rule.')); }, 0);
  }, { onUp: function () { api.setMech({ play: { low: st.low, high: st.high, moved: st.moved } }); } });
  if (m.twoDone) c.appendChild(el('div', 'verdict good', '✓ Done. Now let the code find the gates by rule.'));
}
function capacityOf(r) { var H2 = 1000 * r.lanes.human; return Math.max(20, Math.floor(0.6 * H2 / 10) * 10); }
function bestForCap(y, s, low, cap) {
  var n = y.length, maxH = cap * n / 1000, inBand = s.filter(function (v) { return v >= low; }).sort(function (a, b) { return a - b; });
  var k = Math.floor(maxH + 1e-9), high = k < inBand.length ? inBand[k] : Infinity;
  if (k < inBand.length && k > 0 && inBand[k] === inBand[k - 1]) { while (k > 0 && inBand[k] === inBand[k - 1]) k--; high = inBand[k]; }
  return window.PGJS.twoGates(y, s, low, high);
}
function twoGateResult(r, host, api) {
  var L = r.lanes, k = 1000 / r.n, m = api.mech;
  var c = card(host, 'THE GATES YOUR CODE FOUND', 'Low ' + f3(r.low) + ' · high ' + f3(r.high) + '. Same rules, live on the ' + r.n + ' validation cells.');
  tiles(c, [[L.defPass + ' of ' + L.nDef + ' (' + pct(L.passRate) + ')', 'defects passed by mistake', L.passRate <= 0.05 ? 'g' : 'r'], [L.stopPrec == null ? '—' : pct(L.stopPrec), 'auto-stop pile: real defects', 'c'], [pct(L.human), 'share sent to a person', 'a']]);
  tiles(c, [[n0(1000 * L.autoPass), 'auto-pass / 1,000', 'g'], [n0(1000 * L.human), 'person / 1,000', 'a'], [n0(1000 * L.autoStop), 'auto-stop / 1,000', 'r']]);
  var cap = m.cap || capacityOf(r);
  if (!m.cap) setTimeout(function () { api.setMech({ cap: cap }); }, 0);
  var opt = bestForCap(r.y, r.scores, r.ref.low, cap);
  var c2 = card(host, 'CHALLENGE: ONE HUMAN CHECKER', 'Your line has one checker. She can look at <b>' + cap + ' of every 1,000 cells</b>, no more. Set the gates so that (1) at most 5% of defects pass, (2) at most ' + cap + ' per 1,000 go to her, and (3) as few good cells as possible are auto-stopped. Then tap “Check my gates”. Try as often as you like.');
  var st = m.capSt ? { low: m.capSt.low, high: m.capSt.high == null ? Infinity : m.capSt.high } : { low: r.ref.low, high: r.ref.high };
  var last = null;
  twoGate(c2, r.y, r.scores, null, st, function (g) { last = g; }, { cap: cap, onUp: function () { api.setMech({ capSt: { low: st.low, high: st.high } }); } });
  var fb = el('div'); c2.appendChild(fb);
  var chk = el('button', 'btn', 'Check my gates'); chk.style.marginTop = '6px'; c2.insertBefore(chk, fb);
  function judge(g) {
    var h = Math.round(1000 * g.human), tol = Math.max(2, Math.ceil(0.1 * opt.okStop));
    if (g.passRate > 0.05 + 1e-12) return [false, '✗ ' + g.defPass + ' of ' + g.nDef + ' defects (' + pct(g.passRate) + ') pass with no check. Move the green gate LEFT until it is 5% or less.'];
    if (g.human * 1000 > cap + 1e-9) return [false, '✗ ' + h + ' of every 1,000 cells go to the checker; she can take ' + cap + '. Move the red gate LEFT (auto-stop more), or the green gate right (only while defects passed stay ≤ 5%).'];
    if (g.okStop > opt.okStop + tol) return [false, '✗ Both rules hold, but ' + g.okStop + ' good cells are auto-stopped. A better pair stops only ' + opt.okStop + '. Hint: push the green gate as far right as the 5% rule allows, then fill her ' + cap + ' slots.'];
    return [true, '✓ <b>Solved.</b> ' + g.defPass + ' of ' + g.nDef + ' defects pass (' + pct(g.passRate) + '), ' + h + ' per 1,000 go to the checker, ' + g.okStop + ' good cells auto-stopped (best possible: ' + opt.okStop + '). The trade-off: every slot she lacks becomes a good cell stopped by the machine.'];
  }
  chk.onclick = function () { if (!last) return; var j = judge(last); api.setMech({ capTries: (m.capTries || 0) + 1, capOk: m.capOk || (j[0] ? 1 : 0), capRes: j[0] ? { low: last.low, high: last.high, okStop: last.okStop, human: last.human, defPass: last.defPass, nDef: last.nDef } : m.capRes }); fb.innerHTML = ''; fb.appendChild(el('div', 'verdict ' + (j[0] ? 'good' : 'bad'), j[1])); if (j[0]) endCard(host, r, api); };
  if (m.capOk) { fb.appendChild(el('div', 'verdict good', '✓ Solved earlier' + (m.capRes ? ': ' + m.capRes.okStop + ' good cells auto-stopped, ' + Math.round(1000 * m.capRes.human) + ' per 1,000 to the checker.' : '.'))); endCard(host, r, api); }
}
function endCard(host, r, api) {
  var old = host.querySelector('.endc'); if (old) old.remove();
  var L = r.lanes, B = r.base, k = 1000 / r.n, one = r.oneGate;
  var alone = Math.round(1000 * (L.autoPass + L.autoStop)), bAlone = Math.round(1000 * (B.autoPass + B.autoStop));
  var c = el('div', 'endc', '<h3 class="fh">STEP 3 DONE — THE HONEST RESULT</h3>' +
    '<ul><li>One gate, 95% recall: Step 2 stops <b>' + n0(one.base.fp * k) + '</b> good cells per 1,000; the blend stops <b>' + n0(one.blend.fp * k) + '</b>.</li>' +
    '<li>Two gates (same rules for both): the machine decides <b>' + alone + ' of every 1,000</b> cells alone with the blend (' + bAlone + ' with Step 2 alone). A person checks <b>' + n0(1000 * L.human) + '</b> (Step 2: ' + n0(1000 * B.human) + ').</li>' +
    '<li>Defects passed with no check: ' + L.defPass + ' of ' + L.nDef + ' (' + pct(L.passRate) + ') — inside the 5% rule.</li>' +
    '<li>Auto-stop pile: ' + (L.stopPrec == null ? 'empty' : pct(L.stopPrec) + ' real defects') + '.</li></ul>' +
    '<p>This data set is hard: thin cracks at 64 × 64 px, unsure expert labels, about 1,570 training photos. The honest industrial answer is not “AI replaces the inspector” but “AI takes the sure cells, a person takes the unsure ones”.</p>' +
    '<p><b>Next:</b> Step 4 shows what the network looks at. <b>Step 5 wires this pass / person / stop routing with LangGraph.</b> The test tray stays sealed until Step 8.</p>' +
    '<p class="hint">All numbers above were computed live in your browser just now, on the validation tray.</p>');
  host.appendChild(c);
}

window.PGViz3 = { tiles: tiles3a, stack: stack, filter: sceneFilter, layers: layers3c, sortAug: sortAug, flips: flips, drawGuess: drawGuess, fillGaps: fillGaps, curves: curves, curvesLive: curvesLive, blend: blend, twoGatePlay: twoGatePlay, twoGateResult: twoGateResult, _conv3: conv3, _masks: masks };
})();
