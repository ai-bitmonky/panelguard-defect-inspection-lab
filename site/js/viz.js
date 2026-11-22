/* PanelGuard visual cards and hands-on mechanics. Every number shown comes from the probe results Python sent back. */
(function () {
'use strict';
var ART = function () { return window.PGArt; };
function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function card(parent, title, sub) { var c = el('div', 'vc'); c.appendChild(el('h4', null, title)); if (sub) c.appendChild(el('div', 'sub', sub)); parent.appendChild(c); return c; }
function b64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
function pct(x, d) { return (100 * x).toFixed(d == null ? 1 : d) + '%'; }
function probCol(p) { return p >= 1 ? '#ff4d6a' : p >= 0.6 ? '#ff9a4d' : p >= 0.3 ? '#d6e05a' : '#3dffa0'; }
function tiles(parent, list) { var t = el('div', 'tiles'); list.forEach(function (x) { t.appendChild(el('div', 'tile ' + (x[2] || ''), '<div class="v">' + x[0] + '</div><div class="l">' + x[1] + '</div>')); }); parent.appendChild(t); return t; }
function canvasOf(bytes, off, n) { var c = document.createElement('canvas'); c.width = c.height = n; var x = c.getContext('2d'), im = x.createImageData(n, n); for (var k = 0; k < n * n; k++) { var v = bytes[off + k]; im.data[4 * k] = im.data[4 * k + 1] = im.data[4 * k + 2] = v; im.data[4 * k + 3] = 255; } x.putImageData(im, 0, 0); return c; }
function thumb(api, id, s, border) { var c = document.createElement('canvas'); c.width = c.height = s; c.getContext('2d').drawImage(api.canvas(id) || c, 0, 0, s, s); c.style.cssText = 'width:' + s + 'px;height:' + s + 'px;border-radius:3px;' + (border ? 'outline:2px solid ' + border + ';outline-offset:-1px;' : ''); return c; }
var NS = 'http://www.w3.org/2000/svg';
function svg(w, h, inner) { var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 ' + w + ' ' + h); s.style.width = '100%'; s.style.height = 'auto'; s.style.display = 'block'; s.innerHTML = inner || ''; return s; }
function zoomIn(host, api, id, smallCanvas, extra) {
  var z = el('div', 'zoom'), m = api.meta(id) || {};
  var imgs = el('div', 'imgs');
  var big = document.createElement('canvas'); big.width = big.height = 64; big.getContext('2d').drawImage(smallCanvas || api.canvas(id), 0, 0); big.style.cssText = 'width:192px;height:192px';
  var f1 = el('figure'); f1.appendChild(big); f1.appendChild(el('figcaption', null, 'What the model sees: 64 × 64')); imgs.appendChild(f1);
  z.appendChild(imgs);
  api.full(id).then(function (u) { if (!u) return; var f2 = el('figure'); var im = new Image(); im.src = u; im.style.cssText = 'width:192px;height:192px'; f2.appendChild(im); f2.appendChild(el('figcaption', null, 'Original camera photo: 300 × 300')); imgs.appendChild(f2); });
  z.appendChild(el('div', null, '<b>Cell ' + id + '</b> · ' + (m.kind || '') + ' · expert defect score <b style="color:' + probCol(m.prob) + '">' + m.prob + '</b>' + (m.prob === 0.33 || m.prob === 0.67 ? ' <span class="tagpill" style="border-color:#d6e05a;color:#d6e05a">experts unsure</span>' : '') + (extra || '')));
  var x = el('button', 'btn small', '✕ Close'); x.onclick = function () { z.remove(); }; z.appendChild(x);
  host.appendChild(z);
}

/* ================= STEP 0 SCENES ================= */
var PARTS = {
  camera: ['EL camera', 'Sits in a dark hood. It sees the faint near-infrared light a cell gives off when current flows. <b>Bright = working silicon. Dark = broken or dead.</b>'],
  contacts: ['Power contacts', 'They push current into the cell, like running it backwards as an LED. <b>No current, no glow</b> — that is why the cells outside the hood look plain blue.'],
  monitor: ['Monitor', 'Shows each photo. Today a person decides. <b>Your model will put a score here.</b>'],
  sorter: ['Sorter', '<b>PASS</b> goes on into a solar module. <b>STOP</b> goes to manual re-check by a person.']
};
function sceneStation(s, stage, out, api) {
  var m = api.mech; m.visited = m.visited || {};
  function draw() {
    stage.innerHTML = ART().station({ hot: true, visited: m.visited, monitor: 'STOP?', monitorSub: 'you decide' });
    ART().fillImages(stage, { cellURL: api.full, canvas: api.canvas });
    [].forEach.call(stage.querySelectorAll('.hot'), function (g) {
      var go = function () { m.visited[g.getAttribute('data-key')] = Date.now(); api.setMech({ visited: m.visited, done: Object.keys(m.visited).length >= 4 }); draw(); list(); };
      g.addEventListener('click', go); g.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    });
  }
  function list() {
    out.innerHTML = '';
    var c = card(out, 'THE STATION', 'Tap the numbered rings on the station. ' + Object.keys(m.visited).length + ' of 4 found.');
    Object.keys(PARTS).forEach(function (k, i) {
      var seen = m.visited[k];
      c.appendChild(el('div', 'tile', '<div class="l" style="font-family:Orbitron,Arial,sans-serif;font-size:11px;color:' + (seen ? '#3dffa0' : '#5d6b80') + '">' + (i + 1) + ' · ' + PARTS[k][0].toUpperCase() + '</div><div style="font-size:15px;margin-top:3px">' + (seen ? PARTS[k][1] : '<span class="hint">Not found yet.</span>') + '</div>')).style.marginBottom = '6px';
    });
  }
  draw(); list();
}
function sceneDefects(s, stage, out, api) {
  var m = api.mech; m.flipped = m.flipped || {};
  stage.innerHTML = '';
  var grid = el('div', null); grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:14px';
  stage.appendChild(grid);
  s.cards.forEach(function (cd) {
    var f = el('button', null); f.style.cssText = 'position:relative;background:#070b10;border:1px solid #263346;border-radius:12px;padding:8px;color:#e6eef8;text-align:left;min-height:120px';
    function paint() {
      var on = m.flipped[cd.id];
      f.innerHTML = '';
      var im = new Image(); im.style.cssText = 'width:100%;aspect-ratio:1;border-radius:6px;display:block;image-rendering:auto;filter:' + (on ? 'none' : 'brightness(1.05)');
      api.full(cd.id).then(function (u) { if (u) im.src = u; else im.src = api.canvas(cd.id).toDataURL(); });
      f.appendChild(im);
      f.appendChild(el('div', null, on ? '<div style="font-family:Orbitron,Arial,sans-serif;font-size:11px;margin-top:6px;color:' + (/Good/.test(cd.tag) ? '#3dffa0' : '#ff4d6a') + '">' + cd.tag.toUpperCase() + '</div><div style="font-size:14px">' + cd.note + '</div>'
        : '<div style="margin-top:6px;font-size:15px;color:#ffb547">Good or bad? Tap to flip</div>'));
      f.style.borderColor = on ? (/Good/.test(cd.tag) ? '#1f6b44' : '#6b1f30') : '#263346';
    }
    f.onclick = function () { m.flipped[cd.id] = 1; api.setMech({ flipped: m.flipped, done: Object.keys(m.flipped).length >= s.cards.length }); paint(); side(cd); };
    paint(); grid.appendChild(f);
  });
  function side(cd) {
    out.innerHTML = '';
    var c = card(out, 'LOOK CLOSELY', Object.keys(m.flipped).length + ' of ' + s.cards.length + ' cards flipped.');
    if (cd) {
      var row = el('div', null); row.style.cssText = 'display:flex;gap:10px';
      [cd.id, cd.id === 447 ? 74 : 447].forEach(function (id, k) {
        var f = el('figure', null); f.style.cssText = 'margin:0;flex:1;text-align:center;font-size:13px;color:#8d9bb0';
        var im = new Image(); im.style.cssText = 'width:100%;aspect-ratio:1;display:block;border-radius:6px;border:1px solid #263346';
        api.full(id).then(function (u) { im.src = u || api.canvas(id).toDataURL(); });
        f.appendChild(im); f.appendChild(el('figcaption', null, k ? 'Compare: ' + (id === 447 ? 'good mono cell' : 'good poly cell') : 'Cell ' + id + ' · expert score ' + api.meta(id).prob));
        row.appendChild(f);
      });
      c.appendChild(row);
      c.appendChild(el('p', null, '<b>' + cd.tag + '.</b> ' + cd.note));
    } else c.appendChild(el('p', 'hint', 'Tap a card on the left.'));
    c.appendChild(el('p', 'hint', s.honest));
  }
  side(null);
}
function sceneMistakes(s, stage, out, api) {
  var m = api.mech; m.place = m.place || {};
  var TOK = { miss: ['MISSED DEFECT', 'A bad cell gets PASS'], fa: ['FALSE ALARM', 'A good cell gets STOP'] };
  var BIN = { warranty: ['Weak panel ships', 'Power drops in the field. Warranty claim, unhappy customer. Costly.', 'miss'], recheck: ['Manual re-check', 'A person looks again. Costs time and labour. The cell is saved.', 'fa'] };
  var sel = null;
  function draw() {
    stage.innerHTML = '';
    var wrap = el('div'); wrap.style.cssText = 'padding:16px;display:flex;flex-direction:column;gap:16px';
    var top = el('div'); top.style.cssText = 'display:flex;gap:14px;justify-content:center;min-height:86px';
    Object.keys(TOK).forEach(function (k) {
      if (m.place[k]) return;
      var t = el('div', 'dragtok', '<div style="font-family:Orbitron,Arial,sans-serif;font-size:12px;color:#ffb547">' + TOK[k][0] + '</div><div>' + TOK[k][1] + '</div>');
      t.style.cssText = 'cursor:grab;padding:12px 16px;border-radius:12px;background:#1c1606;border:2px solid ' + (sel === k ? '#fff' : '#ffb547') + ';font-size:16px;min-width:200px;text-align:center';
      t.setAttribute('data-k', k);
      t.addEventListener('pointerdown', function (ev) { startDrag(ev, t, k); });
      top.appendChild(t);
    });
    if (!top.children.length) top.appendChild(el('div', 'hint', 'Both placed. ✓'));
    wrap.appendChild(top);
    var bins = el('div'); bins.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:14px';
    Object.keys(BIN).forEach(function (b) {
      var placed = Object.keys(m.place).filter(function (k) { return m.place[k] === b; })[0];
      var d = el('div', null, '<div style="font-family:Orbitron,Arial,sans-serif;font-size:12px;color:' + (b === 'warranty' ? '#ff4d6a' : '#46e3ff') + '">' + BIN[b][0].toUpperCase() + '</div><div style="font-size:15px;margin:4px 0">' + BIN[b][1] + '</div>' +
        (placed ? '<div style="margin-top:6px;padding:6px 10px;border-radius:8px;background:#0b2418;border:1px solid #1f6b44">✓ ' + TOK[placed][0] + '</div>' : '<div class="hint" style="margin-top:6px;border:1px dashed #33445a;border-radius:8px;padding:8px;text-align:center">drop a mistake here</div>'));
      d.style.cssText = 'padding:12px;border-radius:12px;background:#0a0f16;border:2px solid #263346;min-height:150px';
      d.setAttribute('data-bin', b);
      d.addEventListener('click', function () { if (sel) drop(sel, b); });
      bins.appendChild(d);
    });
    wrap.appendChild(bins);
    var msg = el('div', 'hint', 'Drag each orange card onto its cost (or tap the card, then tap the box).'); msg.id = 'mmsg';
    wrap.appendChild(msg);
    stage.appendChild(wrap);
  }
  function drop(k, b) {
    var msg = stage.querySelector('#mmsg');
    if (BIN[b][2] === k) { m.place[k] = b; sel = null; api.setMech({ place: m.place, done: Object.keys(m.place).length >= 2 }); draw(); side(); }
    else { sel = null; draw(); stage.querySelector('#mmsg').innerHTML = '<span style="color:#ff9aac">Not that one. Think: does the bad cell reach the customer, or does the good cell just get a second look?</span>'; }
  }
  function startDrag(ev, t, k) {
    ev.preventDefault(); var r = t.getBoundingClientRect(), dx = ev.clientX - r.left, dy = ev.clientY - r.top, moved = false;
    var ghost = t.cloneNode(true); ghost.style.position = 'fixed'; ghost.style.zIndex = 60; ghost.style.width = r.width + 'px'; ghost.style.pointerEvents = 'none'; ghost.style.opacity = '.9';
    function mv(e) { if (!moved) { moved = true; document.body.appendChild(ghost); } ghost.style.left = (e.clientX - dx) + 'px'; ghost.style.top = (e.clientY - dy) + 'px'; }
    function up(e) {
      document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); ghost.remove();
      if (!moved) { sel = k; draw(); return; }
      var tgt = document.elementFromPoint(e.clientX, e.clientY), bin = tgt && tgt.closest && tgt.closest('[data-bin]');
      if (bin) drop(k, bin.getAttribute('data-bin'));
    }
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  }
  function side() {
    out.innerHTML = '';
    var c = card(out, 'THE TARGET', 'Both mistakes cost money. A missed defect costs much more.');
    var cells = ''; for (var i = 0; i < 100; i++) { var x = (i % 20) * 21, y = Math.floor(i / 20) * 21; cells += '<rect x="' + x + '" y="' + y + '" width="18" height="18" rx="3" fill="' + (i < 95 ? '#3dffa0' : '#ff4d6a') + '" opacity="' + (i < 95 ? .85 : 1) + '"/>'; }
    c.appendChild(svg(420, 106, cells));
    c.appendChild(el('p', null, 'Out of every <b>100 defective cells</b>, the line must <b style="color:#3dffa0">stop at least 95</b>. At most <b style="color:#ff4d6a">5 may slip through</b>.'));
    c.appendChild(el('p', null, 'This share is called <b>recall</b>. Then we count the price: how many <b>good</b> cells get stopped for nothing (<b>false alarms</b>).'));
    if (Object.keys(m.place).length < 2) c.appendChild(el('p', 'hint', 'Place both mistake cards on the left.'));
  }
  draw(); side();
}
function sceneGame(s, stage, out, api) {
  var m = api.mech; m.choices = m.choices || {};
  var ids = s.game;
  function nextIdx() { for (var i = 0; i < ids.length; i++) if (m.choices[ids[i]] == null) return i; return -1; }
  function draw() {
    stage.innerHTML = ''; var i = nextIdx();
    var wrap = el('div'); wrap.style.cssText = 'padding:14px;display:flex;flex-direction:column;align-items:center;gap:10px';
    var dots = ''; ids.forEach(function (id, k) { var c = m.choices[id]; dots += '<circle cx="' + (12 + k * 26) + '" cy="10" r="8" fill="' + (c == null ? (k === i ? '#46e3ff' : '#1b2533') : c ? '#ff4d6a' : '#3dffa0') + '"/>'; });
    wrap.appendChild(svg(12 * 26, 20, dots)).style.maxWidth = '340px';
    if (i >= 0) {
      var id = ids[i];
      var box = el('div'); box.style.cssText = 'position:relative;width:min(300px,60%);aspect-ratio:1;border-radius:10px;overflow:hidden;border:2px solid #46e3ff;box-shadow:0 0 30px rgba(70,227,255,.25)';
      var im = new Image(); im.style.cssText = 'width:100%;height:100%;display:block'; api.full(id).then(function (u) { im.src = u || api.canvas(id).toDataURL(); });
      box.appendChild(im);
      box.appendChild(el('div', null, '<span style="position:absolute;left:8px;top:6px;font-family:Orbitron,Arial,sans-serif;font-size:10px;color:#9fe9ff;background:rgba(0,0,0,.5);padding:2px 6px;border-radius:4px">CELL ' + (i + 1) + ' / 12 · ' + api.meta(id).kind + '</span>'));
      wrap.appendChild(box);
      var row = el('div', 'row');
      var p = el('button', 'btn', '✓ PASS'); p.style.cssText = 'font-family:Orbitron,Arial,sans-serif;font-size:14px;padding:10px 26px;background:#0b2418;border-color:#3dffa0;color:#3dffa0';
      var st = el('button', 'btn', '■ STOP'); st.style.cssText = 'font-family:Orbitron,Arial,sans-serif;font-size:14px;padding:10px 26px;background:#2a0e15;border-color:#ff4d6a;color:#ff9aac';
      p.onclick = function () { pick(id, 0); }; st.onclick = function () { pick(id, 1); };
      row.appendChild(p); row.appendChild(st); wrap.appendChild(row);
      wrap.appendChild(el('div', 'hint', 'Bright and even = healthy. Dark lines, dark blobs, broken dashes = trouble. Poly cells are spotty by nature.'));
    } else {
      wrap.appendChild(el('div', null, '<b>All 12 done.</b> Here is the truth from the experts:'));
      var g = el('div'); g.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:8px;width:100%';
      ids.forEach(function (id) {
        var mt = api.meta(id), truth = mt.prob >= 0.5, you = m.choices[id], right = (!!you) === truth;
        var f = el('div', null); f.style.cssText = 'text-align:center;font-size:12px;border-radius:8px;padding:4px;background:' + (right ? '#0b2418' : '#2a0e15') + ';border:1px solid ' + (right ? '#1f6b44' : '#6b1f30');
        var im = new Image(); im.style.cssText = 'width:100%;border-radius:4px;display:block'; api.full(id).then(function (u) { im.src = u || api.canvas(id).toDataURL(); });
        f.appendChild(im);
        f.appendChild(el('div', null, 'you: <b>' + (you ? 'STOP' : 'PASS') + '</b><br>expert: <b style="color:' + probCol(mt.prob) + '">' + mt.prob + '</b>' + (mt.prob === 0.33 || mt.prob === 0.67 ? '<br><span style="color:#d6e05a">unsure</span>' : '')));
        g.appendChild(f);
      });
      wrap.appendChild(g);
      var again = el('button', 'btn small', '↺ Play again'); again.onclick = function () { m.choices = {}; api.setMech({ choices: {}, done: true }); draw(); side(); };
      wrap.appendChild(again);
    }
    stage.appendChild(wrap);
  }
  function pick(id, v) { m.choices[id] = v; api.setMech({ choices: m.choices, done: m.done || nextIdx() < 0 }); draw(); side(); }
  function side() {
    out.innerHTML = '';
    var n = Object.keys(m.choices).length, c = card(out, 'YOUR SCOREBOARD', n < 12 ? n + ' of 12 cells decided. The score shows at the end.' : 'The same scoreboard every model gets in this course.');
    if (n < 12) { c.appendChild(el('p', 'hint', 'Decide all 12. Expert truth: a cell is a defect if experts gave it 0.67 or 1.0.')); return; }
    var tp = 0, fn = 0, fp = 0, tn = 0, unsure = 0;
    ids.forEach(function (id) { var mt = api.meta(id), t = mt.prob >= 0.5, y = !!m.choices[id]; if (t && y) tp++; else if (t) fn++; else if (y) fp++; else tn++; if (mt.prob === 0.33 || mt.prob === 0.67) unsure++; });
    var rec = tp / (tp + fn);
    tiles(c, [[tp + ' / ' + (tp + fn), 'defects caught', 'g'], [fn, 'defects missed', fn ? 'r' : 'g'], [fp + ' / ' + (fp + tn), 'false alarms', fp ? 'a' : 'g']]);
    var bar = '<rect x="0" y="8" width="400" height="16" rx="8" fill="#162131"/><rect x="0" y="8" width="' + (400 * rec) + '" height="16" rx="8" fill="' + (rec >= .95 ? '#3dffa0' : '#ff4d6a') + '"/><line x1="380" y1="2" x2="380" y2="30" stroke="#fff" stroke-dasharray="3 2"/><text x="380" y="42" text-anchor="middle" font-size="11" fill="#c6d2e2" font-family="Rajdhani,Arial,sans-serif">target 95%</text>';
    c.appendChild(svg(420, 46, bar));
    c.appendChild(el('p', null, 'Your recall: <b>' + pct(rec, 0) + '</b> (' + tp + ' of ' + (tp + fn) + ' defects stopped). ' + (rec >= .95 ? 'You hit the target.' : 'Below the 95% target.') + ' You stopped <b>' + fp + '</b> of ' + (fp + tn) + ' good cells.'));
    c.appendChild(el('p', null, '<b>' + unsure + '</b> of these 12 cells were ones where the experts were not sure (0.33 or 0.67). If you found those hard, so will a model.'));
    c.appendChild(el('p', 'hint', 'A person gets tired after thousands of cells per shift. Next: teach a computer to do this, and judge it the same way.'));
  }
  draw(); side();
}
function scene(s, stage, out, api) {
  var f = ({ station: sceneStation, defects: sceneDefects, mistakes: sceneMistakes, game: sceneGame })[s.scene] || (window.PGViz3 && window.PGViz3[s.scene]) || (window.PGViz4 && window.PGViz4[s.scene]);
  return f(s, stage, out, api);
}

/* ================= STEP 1 ================= */
function wall(r, host, api) {
  tiles(host, [['(' + r.shape.join(', ') + ')', 'X.shape', 'c'], [r.dtype, 'type', 'c'], [r.min + '–' + r.max, 'pixel range', 'c']]);
  var c = card(host, 'THE WALL', '96 real cells, picked evenly from all 2,624 (straight from your array X). Tap one to look closely.');
  var bytes = r.thumbs ? b64(r.thumbs) : null;
  if (!bytes) { c.appendChild(el('p', 'hint', 'X does not have the right shape or type yet, so the photos cannot be drawn.')); return; }
  var g = el('div'); g.style.cssText = 'display:grid;grid-template-columns:repeat(12,1fr);gap:3px';
  r.ids.forEach(function (id, k) {
    var cv = canvasOf(bytes, k * 4096, 64);
    cv.style.cssText = 'width:100%;aspect-ratio:1;cursor:pointer;border-radius:2px;border-bottom:3px solid ' + probCol(r.probs[k]);
    cv.title = 'cell ' + id + ' · score ' + r.probs[k];
    cv.onclick = function () { api.mech.opened = (api.mech.opened || 0) + 1; api.setMech({ opened: api.mech.opened }); zoomIn(c, api, id, cv); };
    g.appendChild(cv);
  });
  c.appendChild(g);
  c.appendChild(el('div', 'hint', 'Bar under each photo = expert defect score: <span style="color:#3dffa0">■ 0</span> <span style="color:#d6e05a">■ 0.33</span> <span style="color:#ff9a4d">■ 0.67</span> <span style="color:#ff4d6a">■ 1.0</span>'));
}
function unitChart(r, host, api) {
  var per = 20, c = card(host, 'WHAT IS IN THE PACK', 'Each little cell = ' + per + ' real cells. Counted by your code.');
  function row(y, n, col, label, mark) {
    var k = Math.round(n / per), s = '<text x="0" y="' + (y + 12) + '" font-family="Rajdhani,Arial,sans-serif" font-size="14" fill="#c6d2e2">' + label + '</text>';
    for (var i = 0; i < k; i++) { var x = 120 + (i % 30) * 10, yy = y + Math.floor(i / 30) * 10; s += '<rect x="' + x + '" y="' + yy + '" width="8" height="8" rx="1.5" fill="' + col + '"/>' + (mark ? '<text x="' + (x + 4) + '" y="' + (yy + 7) + '" font-size="7" text-anchor="middle" fill="#111" font-family="Arial" font-weight="700">?</text>' : ''); }
    return { s: s, h: Math.ceil(k / 30) * 10 + 8 };
  }
  var y = 0, out = '', parts = [
    [r.ok, '#3dffa0', 'OK  ' + r.ok], [r.defect, '#ff4d6a', 'Defect  ' + r.defect], null,
    [r.mono, '#9fb4d6', 'Mono  ' + r.mono], [r.poly, '#6a7fa8', 'Poly  ' + r.poly], null,
    [r.unsure, '#d6e05a', 'Unsure  ' + r.unsure, 1]];
  parts.forEach(function (p) { if (!p) { y += 8; out += '<line x1="0" y1="' + (y - 4) + '" x2="420" y2="' + (y - 4) + '" stroke="#1b2533"/>'; return; } var q = row(y, p[0], p[1], p[2], p[3]); out += q.s; y += q.h; });
  c.appendChild(svg(420, y, out));
  var g = r.grid, tb = '<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:6px"><tr style="color:#8d9bb0"><td>expert score</td><td>0</td><td>0.33</td><td>0.67</td><td>1.0</td></tr>';
  ['mono', 'poly'].forEach(function (t) { tb += '<tr><td>' + t + '</td>' + [0, 0.33, 0.67, 1].map(function (p) { var k = t + '|' + (p === 0 ? '0.0' : p === 1 ? '1.0' : p); return '<td style="color:' + probCol(p) + '">' + g[k] + '</td>'; }).join('') + '</tr>'; });
  c.appendChild(el('div', null, tb + '</table>'));
  var c2 = card(host, 'THE LAZY MODEL', 'It says OK for every cell.');
  tiles(c2, [[pct(r.ok / r.n), 'accuracy', 'a'], ['0 / ' + r.defect, 'defects caught', 'r'], ['0%', 'recall', 'r']]);
  c2.appendChild(el('p', null, 'Accuracy looks fine, but every bad cell ships. That is why this course scores <b>recall</b> (defects caught) and <b>false alarms</b>, never accuracy alone.'));
}
function binLine(r, host, api) {
  var c = card(host, 'WHERE DO YOU DRAW THE LINE?', 'Drag the yellow line. Cells to its right become “defect”.');
  var m = api.mech, slot = m.slot != null ? m.slot : 2;
  var P = ['0', '0.33', '0.67', '1.0'], xs = [70, 170, 270, 370], maxN = Math.max.apply(null, r.bins), SX = [20, 120, 220, 320, 420];
  var s = svg(440, 230); c.appendChild(s);
  var info = el('div'); c.appendChild(info);
  function draw() {
    var o = '';
    r.bins.forEach(function (n, i) {
      var hgt = 150 * n / maxN, def = i >= slot;
      o += '<rect x="' + (xs[i] - 34) + '" y="' + (170 - hgt) + '" width="68" height="' + hgt + '" rx="4" fill="' + (def ? '#ff4d6a' : '#3dffa0') + '" opacity="' + (i === 1 || i === 2 ? .65 : .9) + '"/>' +
        '<text x="' + xs[i] + '" y="' + (164 - hgt) + '" text-anchor="middle" font-family="Orbitron,Arial,sans-serif" font-size="12" fill="#fff">' + n + '</text>' +
        '<text x="' + xs[i] + '" y="190" text-anchor="middle" font-family="Space Mono,monospace" font-size="13" fill="#c6d2e2">' + P[i] + '</text>' +
        (i === 1 || i === 2 ? '<text x="' + xs[i] + '" y="206" text-anchor="middle" font-family="Rajdhani,Arial,sans-serif" font-size="12" fill="#d6e05a">experts unsure</text>' : '');
    });
    o += '<text x="220" y="224" text-anchor="middle" font-family="Rajdhani,Arial,sans-serif" font-size="12" fill="#8d9bb0">expert defect score</text>';
    o += '<line x1="220" y1="6" x2="220" y2="176" stroke="#8d9bb0" stroke-dasharray="2 4"/><text x="224" y="14" font-family="Rajdhani,Arial,sans-serif" font-size="11" fill="#8d9bb0">our rule</text>';
    var lx = SX[slot];
    o += '<g style="cursor:ew-resize"><rect x="' + (lx - 14) + '" y="0" width="28" height="180" fill="transparent"/><line x1="' + lx + '" y1="0" x2="' + lx + '" y2="180" stroke="#ffb547" stroke-width="4"/><rect x="' + (lx - 12) + '" y="74" width="24" height="30" rx="5" fill="#ffb547"/><text x="' + lx + '" y="94" text-anchor="middle" font-size="14" fill="#1a1000">⇔</text></g>';
    s.innerHTML = o;
    var nd = r.bins.slice(slot).reduce(function (a, b) { return a + b; }, 0);
    info.innerHTML = '';
    tiles(info, [[nd, 'defect cells', 'r'], [r.n - nd, 'OK cells', 'g'], [pct(nd / r.n), 'defect share', 'a']]);
    info.appendChild(el('p', null, slot === 2 ? 'This is our rule: 0.67 and 1.0 are defects. Your y has <b>' + r.n_def + '</b> defects.' :
      slot < 2 ? 'Too strict: ' + (slot === 0 ? 'every cell, even score 0,' : 'the ' + r.bins[1] + ' unsure 0.33 cells') + ' would count as defects. More false alarms later.' :
      'Too loose: ' + (slot === 4 ? 'no cell is a defect at all.' : 'the ' + r.bins[2] + ' cells at 0.67 would count as OK, so real defects ship.')));
  }
  function setSlot(k) { if (k === slot) return; slot = k; var mv = (m.moves || 0) + 1; api.setMech({ slot: k, moves: mv }); draw(); }
  function at(ev) { var b = s.getBoundingClientRect(), x = (ev.clientX - b.left) * 440 / b.width, best = 0; SX.forEach(function (v, i) { if (Math.abs(v - x) < Math.abs(SX[best] - x)) best = i; }); return best; }
  s.addEventListener('pointerdown', function (ev) { s.setPointerCapture(ev.pointerId); setSlot(at(ev)); var mv = function (e) { setSlot(at(e)); }; s.addEventListener('pointermove', mv); s.addEventListener('pointerup', function up() { s.removeEventListener('pointermove', mv); s.removeEventListener('pointerup', up); }); });
  s.setAttribute('tabindex', '0'); s.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') setSlot(Math.max(0, slot - 1)); if (e.key === 'ArrowRight') setSlot(Math.min(4, slot + 1)); });
  s.style.touchAction = 'none';
  draw();
}
function trays(r, host, api) {
  var c = card(host, 'THREE TRAYS', 'Counted from your idx_train, idx_val, idx_test.');
  var N = ['TRAIN', 'VALIDATION', 'TEST'], col = ['#46e3ff', '#a98bff', '#ffb547'], o = '';
  r.sizes.forEach(function (n, i) {
    var x = 10 + i * 145, sh = r.defects[i] / n;
    o += '<g><path d="M' + x + ' 120h130l-10 40h-110z" fill="#111a27" stroke="' + col[i] + '"/>';
    var k = Math.round(n / 25);
    for (var j = 0; j < k; j++) { var cx = x + 12 + (j % 11) * 10, cy = 110 - Math.floor(j / 11) * 9; o += '<rect x="' + cx + '" y="' + cy + '" width="8" height="7" rx="1" fill="' + (j < Math.round(k * sh) ? '#ff4d6a' : '#2a4a6a') + '"/>'; }
    o += '<text x="' + (x + 65) + '" y="182" text-anchor="middle" font-family="Orbitron,Arial,sans-serif" font-size="11" fill="' + col[i] + '">' + N[i] + '</text>' +
      '<text x="' + (x + 65) + '" y="200" text-anchor="middle" font-family="Rajdhani,Arial,sans-serif" font-size="15" fill="#fff">' + n + ' cells</text>' +
      '<text x="' + (x + 65) + '" y="216" text-anchor="middle" font-family="Rajdhani,Arial,sans-serif" font-size="14" fill="#ff8a9c">' + r.defects[i] + ' defects · ' + pct(sh) + '</text></g>';
  });
  o += '<g transform="translate(300 58) rotate(-12)"><rect x="-6" y="0" width="150" height="30" rx="4" fill="#5a1220" stroke="#ff4d6a" stroke-width="2"/><text x="69" y="13" text-anchor="middle" font-family="Orbitron,Arial,sans-serif" font-size="10" font-weight="900" fill="#ffd1d9">SEALED</text><text x="69" y="25" text-anchor="middle" font-family="Rajdhani,Arial,sans-serif" font-size="10" fill="#ffd1d9">opened once, at the end (Step 8)</text></g>';
  o += '<text x="10" y="236" font-family="Rajdhani,Arial,sans-serif" font-size="12" fill="#8d9bb0">each little block ≈ 25 cells · red = defect</text>';
  c.appendChild(svg(445, 242, o));
  var c2 = card(host, 'WHY STRATIFY? ROLL THE DICE', 'Each roll splits the cells again WITHOUT stratify, with a new random seed. Python does the real split.');
  var m = api.mech; m.dice = m.dice || [];
  var s2 = svg(440, 150); c2.appendChild(s2);
  var btn = el('button', 'btn', '🎲 Shuffle without stratify'); var note = el('span', 'hint');
  c2.appendChild(el('div', 'row')).appendChild(btn); btn.parentNode.appendChild(note);
  function draw() {
    var lo = 0.24, hi = 0.39, X = function (v) { return 110 + 310 * (v - lo) / (hi - lo); }, o2 = '';
    var strat = r.defects[0] / r.sizes[0];
    [0.25, 0.3, 0.35].forEach(function (t) { o2 += '<line x1="' + X(t) + '" y1="10" x2="' + X(t) + '" y2="120" stroke="#1b2533"/><text x="' + X(t) + '" y="136" text-anchor="middle" font-size="11" fill="#8d9bb0" font-family="Space Mono,monospace">' + pct(t, 0) + '</text>'; });
    N.forEach(function (nm, i) {
      var y = 30 + i * 36;
      o2 += '<text x="0" y="' + (y + 4) + '" font-family="Orbitron,Arial,sans-serif" font-size="10" fill="' + col[i] + '">' + nm + '</text>';
      o2 += '<line x1="' + X(r.defects[i] / r.sizes[i]) + '" y1="' + (y - 12) + '" x2="' + X(r.defects[i] / r.sizes[i]) + '" y2="' + (y + 12) + '" stroke="#46e3ff" stroke-width="3"/>';
      m.dice.forEach(function (d) { o2 += '<circle cx="' + X(Math.max(lo, Math.min(hi, d.share[i]))) + '" cy="' + y + '" r="5" fill="#ffb547" opacity=".8"/>'; });
    });
    o2 += '<text x="110" y="148" font-family="Rajdhani,Arial,sans-serif" font-size="11" fill="#46e3ff">▍ your stratified split</text><text x="300" y="148" font-family="Rajdhani,Arial,sans-serif" font-size="11" fill="#ffb547">● random splits</text>';
    s2.innerHTML = o2;
    if (m.dice.length) {
      var spread = [0, 1, 2].map(function (i) { var v = m.dice.map(function (d) { return d.share[i]; }); return Math.max.apply(null, v) - Math.min.apply(null, v); });
      note.innerHTML = m.dice.length + ' roll' + (m.dice.length > 1 ? 's' : '') + '. Test-tray defect share swings by ' + pct(spread[2]) + '. With stratify it stays at ' + pct(strat) + '.';
    }
  }
  btn.onclick = function () {
    btn.disabled = true; var seed = Math.floor(Math.random() * 100000);
    api.py('_r = _pg_dice(' + seed + ')').then(function (d) { btn.disabled = false; if (!d || !d.share) { note.textContent = 'Python could not roll: ' + (d && d.probe_error || 'unknown'); return; } m.dice.push(d); api.setMech({ dice: m.dice, rolls: m.dice.length }); draw(); });
  };
  draw();
}
function lens(r, host, api) {
  var c = card(host, 'THE NUMBER LENS', 'Cell ' + r.cell + ' (expert score ' + r.prob + ') from your Xs. Drag the lens. Find a dark spot and a bright spot.');
  var m = api.mech, G = r.grid, S = 4, L = 8;
  var wrap = el('div'); wrap.style.cssText = 'display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap';
  var cv = document.createElement('canvas'); cv.width = cv.height = 256; cv.style.cssText = 'width:256px;height:256px;cursor:move;touch-action:none;border-radius:6px;border:1px solid #263346';
  var tbl = el('div'); tbl.style.cssText = 'font-family:Space Mono,monospace;font-size:10px;display:grid;grid-template-columns:repeat(8,22px);gap:1px';
  wrap.appendChild(cv); wrap.appendChild(tbl); c.appendChild(wrap);
  var info = el('div'); c.appendChild(info);
  var base = document.createElement('canvas'); base.width = base.height = 64; var bx = base.getContext('2d'), im = bx.createImageData(64, 64);
  for (var k = 0; k < 4096; k++) { var v = Math.round(G[k] * 255); im.data[4 * k] = im.data[4 * k + 1] = im.data[4 * k + 2] = v; im.data[4 * k + 3] = 255; } bx.putImageData(im, 0, 0);
  var means = []; for (var y = 0; y <= 56; y++) for (var x = 0; x <= 56; x++) { var s = 0; for (var j = 0; j < L; j++) for (var i = 0; i < L; i++) s += G[(y + j) * 64 + x + i]; means.push(s / 64); }
  var sorted = means.slice().sort(function (a, b) { return a - b; }), DARK = sorted[Math.floor(sorted.length * 0.05)], BRIGHT = sorted[Math.floor(sorted.length * 0.9)];
  var pos = m.pos || { x: 28, y: 28 };
  function draw() {
    var x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(base, 0, 0, 256, 256);
    x.strokeStyle = '#ffb547'; x.lineWidth = 2; x.strokeRect(pos.x * S, pos.y * S, L * S, L * S);
    x.fillStyle = 'rgba(255,181,71,.12)'; x.fillRect(pos.x * S, pos.y * S, L * S, L * S);
    var h = '', sum = 0;
    for (var j = 0; j < L; j++) for (var i = 0; i < L; i++) { var v = G[(pos.y + j) * 64 + pos.x + i]; sum += v; var g = Math.round(v * 255); h += '<div style="background:rgb(' + g + ',' + g + ',' + g + ');color:' + (v > .55 ? '#000' : '#fff') + ';text-align:center;padding:2px 0">' + v.toFixed(2).replace(/^0/, '') + '</div>'; }
    tbl.innerHTML = h;
    var mean = sum / 64;
    if (mean <= DARK && !m.dark) { m.dark = 1; api.setMech({ dark: 1, found: !!m.bright }); }
    if (mean >= BRIGHT && !m.bright) { m.bright = 1; api.setMech({ bright: 1, found: !!m.dark }); }
    info.innerHTML = '';
    tiles(info, [[mean.toFixed(2), 'average in the lens', 'c'], [m.dark ? '✓' : '—', 'dark spot found', m.dark ? 'g' : ''], [m.bright ? '✓' : '—', 'bright spot found', m.bright ? 'g' : '']]);
    info.appendChild(el('p', 'hint', 'Numbers near 1 = strong glow. Near 0 = dark (busbars, cracks, dead areas). The model sees only these ' + (64 * 64).toLocaleString() + ' numbers.'));
  }
  function at(ev) { var b = cv.getBoundingClientRect(); pos = { x: Math.max(0, Math.min(56, Math.round((ev.clientX - b.left) / b.width * 64 - L / 2))), y: Math.max(0, Math.min(56, Math.round((ev.clientY - b.top) / b.height * 64 - L / 2))) }; m.pos = pos; draw(); }
  cv.addEventListener('pointerdown', function (ev) { cv.setPointerCapture(ev.pointerId); at(ev); var mv = function (e) { at(e); }; cv.addEventListener('pointermove', mv); cv.addEventListener('pointerup', function up() { cv.removeEventListener('pointermove', mv); cv.removeEventListener('pointerup', up); api.setMech({ pos: pos }); }); });
  draw();
}

/* ================= STEP 2 ================= */
var CHIP = { A: ['Line finder', 'edges in 9 directions', 144], B: ['Dark map', 'dark rows, columns, patches', 193], C: ['Pixel summary', 'PCA, 40 numbers', 40], R: ['Raw pixels', 'all 4,096, slow (~15 s)', 4096] };
function chips(r, host, api) {
  tiles(host, [[r.A[1], 'line finder', 'c'], [r.B[1], 'dark map', 'c'], [r.C[1], 'pixel summary', 'c'], [r.F[1], 'all together', 'a']]);
  var c = card(host, 'FEATURE MIXER', 'Turn chips on, then measure. Python scores each mix on the train tray (3 folds). Higher ranking score = better.');
  var m = api.mech; m.results = m.results || []; var on = m.on || { A: 1, B: 0, C: 0, R: 0 };
  var row = el('div'); row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px'; c.appendChild(row);
  var go = el('button', 'btn run', '⚗ MEASURE THIS MIX'); var note = el('span', 'hint'); var r2 = el('div', 'row'); r2.style.marginTop = '8px'; r2.appendChild(go); r2.appendChild(note); c.appendChild(r2);
  var list = el('div'); list.style.marginTop = '10px'; c.appendChild(list);
  function keys() { return Object.keys(CHIP).filter(function (k) { return on[k]; }); }
  function drawChips() {
    row.innerHTML = '';
    Object.keys(CHIP).forEach(function (k) {
      var b = el('button', null, '<div style="font-family:Orbitron,Arial,sans-serif;font-size:11px;color:' + (on[k] ? '#001018' : '#46e3ff') + '">' + k + ' · ' + CHIP[k][0].toUpperCase() + '</div><div style="font-size:13px">' + CHIP[k][1] + ' · ' + CHIP[k][2] + '</div>');
      b.style.cssText = 'text-align:left;border-radius:10px;padding:8px 10px;border:1px solid ' + (on[k] ? '#46e3ff' : '#263346') + ';background:' + (on[k] ? 'linear-gradient(180deg,#46e3ff,#1aa6c9)' : '#0a1019') + ';color:' + (on[k] ? '#001018' : '#e6eef8');
      b.setAttribute('aria-pressed', on[k] ? 'true' : 'false');
      b.onclick = function () { on[k] = on[k] ? 0 : 1; api.setMech({ on: on }); drawChips(); };
      row.appendChild(b);
    });
  }
  function drawList() {
    list.innerHTML = '';
    if (!m.results.length) { list.appendChild(el('p', 'hint', 'No mix measured yet.')); return; }
    var best = m.results.reduce(function (a, b) { return b.auc > a.auc ? b : a; });
    var lo = 0.75, hi = 0.9;
    m.results.slice().sort(function (a, b) { return b.auc - a.auc; }).forEach(function (x) {
      var w = Math.max(2, 100 * (x.auc - lo) / (hi - lo)), kept = m.kept && m.kept.join() === x.keys.join();
      var d = el('div', null, '<div style="display:flex;justify-content:space-between;font-size:14px"><span><b>' + x.keys.join(' + ') + '</b> <span class="hint">' + x.dims + ' numbers · ' + x.sec + ' s</span></span><span style="font-family:Orbitron,Arial,sans-serif;font-size:13px;color:' + (x === best ? '#3dffa0' : '#c6d2e2') + '">' + x.auc.toFixed(3) + (x === best ? ' ★' : '') + '</span></div>' +
        '<div style="height:8px;background:#162131;border-radius:4px;margin:3px 0"><div style="height:100%;width:' + w + '%;background:' + (x === best ? '#3dffa0' : '#46e3ff') + ';border-radius:4px"></div></div>');
      var u = el('button', 'btn small', kept ? '✓ In use as F' : 'Use this mix'); u.disabled = !!kept;
      u.onclick = function () {
        var cmd = 'F = np.hstack([' + x.keys.map(function (k) { return k === 'R' ? 'Xflat' : k; }).join(', ') + '])\nprint("F now has", F.shape[1], "numbers per cell")';
        u.disabled = true; api.cmd(cmd).then(function (res) { if (!res.error) { api.setMech({ kept: x.keys, keptCmd: cmd, best: best }); drawList(); } else u.disabled = false; });
      };
      d.appendChild(u); d.style.cssText = 'margin-bottom:8px;padding:6px 8px;border-radius:8px;background:' + (kept ? '#0b2418' : 'transparent');
      list.appendChild(d);
    });
    list.appendChild(el('p', 'hint', 'Ranking score (ROC AUC): the chance that a random defect cell gets a higher score than a random good cell. 0.5 = coin flip, 1.0 = perfect.'));
  }
  go.onclick = function () {
    var k = keys(); if (!k.length) { note.textContent = 'Turn on at least one chip.'; return; }
    var have = m.results.filter(function (x) { return x.keys.join() === k.join(); })[0];
    if (have) { note.textContent = 'Already measured: ' + have.auc.toFixed(3); return; }
    go.disabled = true; note.textContent = 'Python is measuring… (' + (on.R ? 'raw pixels are slow' : 'a few seconds') + ')';
    api.py('_r = _pg_mix(' + JSON.stringify(k) + ')').then(function (d) {
      go.disabled = false;
      if (!d || d.auc == null) { note.textContent = 'Could not measure: ' + (d && d.probe_error || 'unknown'); return; }
      m.results.push(d); var best = m.results.reduce(function (a, b) { return b.auc > a.auc ? b : a; });
      api.setMech({ results: m.results, mixes: m.results.length, best: best }); note.textContent = 'Done: ' + d.auc.toFixed(3); drawList();
    });
  };
  drawChips(); drawList();
}
function race(r, host, api) {
  var c = card(host, 'THREE INSPECTORS, FIVE FOLDS', '5-fold cross-validation on the train tray. Each dot = one fold. Real scores from your run.');
  var lo = 0.7, hi = 0.95, X = function (v) { return 150 + 280 * (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo); }, o = '';
  [0.7, 0.75, 0.8, 0.85, 0.9, 0.95].forEach(function (t) { o += '<line x1="' + X(t) + '" y1="4" x2="' + X(t) + '" y2="' + (r.models.length * 56 + 4) + '" stroke="#1b2533"/><text x="' + X(t) + '" y="' + (r.models.length * 56 + 20) + '" text-anchor="middle" font-family="Space Mono,monospace" font-size="10" fill="#8d9bb0">' + t.toFixed(2) + '</text>'; });
  r.models.forEach(function (x, i) {
    var y = 30 + i * 56, win = x.name === r.best;
    o += '<text x="0" y="' + (y - 6) + '" font-family="Rajdhani,Arial,sans-serif" font-weight="700" font-size="15" fill="' + (win ? '#3dffa0' : '#e6eef8') + '">' + (win ? '★ ' : '') + x.name + '</text>' +
      '<text x="0" y="' + (y + 12) + '" font-family="Space Mono,monospace" font-size="11" fill="#8d9bb0">' + x.sec + ' s</text>';
    x.folds.forEach(function (f) { o += '<circle cx="' + X(f) + '" cy="' + y + '" r="5" fill="' + (win ? '#3dffa0' : '#46e3ff') + '" opacity=".75"/>'; });
    o += '<line x1="' + X(x.mean) + '" y1="' + (y - 14) + '" x2="' + X(x.mean) + '" y2="' + (y + 14) + '" stroke="#fff" stroke-width="2.5"/><text x="' + (X(x.mean) + 6) + '" y="' + (y - 8) + '" font-family="Orbitron,Arial,sans-serif" font-size="11" fill="#fff">' + x.mean.toFixed(3) + '</text>';
  });
  c.appendChild(svg(440, r.models.length * 56 + 26, o));
  c.appendChild(el('p', null, 'White line = mean ranking score. Tight dots = steady model. The winner, <b>' + r.best + '</b>, is now trained once on the whole train tray as <code>best</code>.'));
}
var SQ = function (v) { return Math.sqrt(Math.max(0, v)); };
function scoreAxis(o, X, y) { [0, 0.02, 0.05, 0.1, 0.2, 0.4, 0.6, 0.8, 1].forEach(function (t) { o.push('<line x1="' + X(t) + '" y1="' + (y - 3) + '" x2="' + X(t) + '" y2="' + (y + 3) + '" stroke="#5d6b80"/><text x="' + X(t) + '" y="' + (y + 14) + '" text-anchor="middle" font-family="Space Mono,monospace" font-size="9" fill="#8d9bb0">' + t + '</text>'); }); }
function gate(r, host, api) {
  var c = card(host, 'THE CUTOFF GATE', r.cells.length + ' real validation cells, placed by their defect score. Red = real defect (above the line), green = good (below). Drag the gate.');
  var m = api.mech, cells = r.cells.slice().sort(function (a, b) { return a[1] - b[1]; });
  var W = 440, H = 300, mid = 150, L = 14, R = W - 10, X = function (v) { return L + (R - L) * SQ(v); }, XI = function (px) { var t = (px - L) / (R - L); return Math.max(0, Math.min(1, t * t)); };
  var nb = 70, bins = [], maxS = 1;
  cells.forEach(function (cl) { var b = Math.min(nb - 1, Math.floor(SQ(cl[1]) * nb)), k = (cl[2] ? 'd' : 'g'); bins[b] = bins[b] || { d: 0, g: 0 }; bins[b][k]++; maxS = Math.max(maxS, bins[b][k]); });
  var dot = Math.min((R - L) / nb, (mid - 20) / maxS), cut = m.cut != null ? m.cut : 0.5;
  var cv = document.createElement('canvas'), dpr = window.devicePixelRatio || 1; cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = 'width:100%;touch-action:none;cursor:ew-resize;display:block';
  c.appendChild(cv);
  var near = el('div'); near.style.cssText = 'display:flex;gap:3px;justify-content:center;margin:6px 0;flex-wrap:wrap'; c.appendChild(near);
  var info = el('div'); c.appendChild(info);
  function draw() {
    var x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,77,106,.07)'; x.fillRect(X(cut), 0, R - X(cut) + 10, H - 22);
    var fill = {}; cells.forEach(function (cl) {
      var b = Math.min(nb - 1, Math.floor(SQ(cl[1]) * nb)), k = cl[2] ? 'd' : 'g'; fill[b + k] = (fill[b + k] || 0) + 1;
      var px = L + (b + 0.5) * (R - L) / nb, py = cl[2] ? mid - 6 - fill[b + k] * dot : mid + 6 + (fill[b + k] - 1) * dot, stop = cl[1] >= cut;
      x.fillStyle = cl[2] ? (stop ? '#ff4d6a' : '#ffd0d8') : (stop ? '#ffb547' : '#2f8a5f');
      x.fillRect(px - dot / 2 + 0.5, py, Math.max(1, dot - 1), Math.max(1, dot - 1));
    });
    x.strokeStyle = '#3a4658'; x.beginPath(); x.moveTo(L, mid); x.lineTo(R, mid); x.stroke();
    x.font = '10px Space Mono, monospace'; x.fillStyle = '#8d9bb0'; x.textAlign = 'center';
    [0, 0.02, 0.05, 0.1, 0.2, 0.4, 0.6, 0.8, 1].forEach(function (t) { x.fillText(String(t), X(t), H - 8); });
    x.textAlign = 'left'; x.fillStyle = '#ff8a9c'; x.fillText('defects', L, 12); x.fillStyle = '#3dffa0'; x.fillText('good cells', L, H - 26);
    var gx = X(cut); x.strokeStyle = '#46e3ff'; x.lineWidth = 3; x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H - 22); x.stroke(); x.lineWidth = 1;
    x.fillStyle = '#46e3ff'; x.fillRect(gx - 22, mid - 11, 44, 22); x.fillStyle = '#001018'; x.font = 'bold 11px Orbitron, Arial'; x.textAlign = 'center'; x.fillText(cut.toFixed(3), gx, mid + 4);
    x.font = '10px Orbitron, Arial'; x.fillStyle = '#3dffa0'; x.fillText('◀ PASS', gx - 40, 12); x.fillStyle = '#ff4d6a'; x.fillText('STOP ▶', gx + 40, 12);
    var tp = 0, fn = 0, fp = 0, tn = 0;
    cells.forEach(function (cl) { var s = cl[1] >= cut; if (cl[2]) { if (s) tp++; else fn++; } else { if (s) fp++; else tn++; } });
    var rec = tp / (tp + fn), prec = tp + fp ? tp / (tp + fp) : 0, far = fp / (fp + tn);
    info.innerHTML = '';
    tiles(info, [[tp, 'defects stopped', 'g'], [fn, 'defects missed', 'r'], [fp, 'good cells stopped', 'a'], [tn, 'good cells passed', 'c']]);
    tiles(info, [[pct(rec), 'recall' + (rec >= .95 ? ' ✓' : ''), rec >= .95 ? 'g' : 'r'], [pct(prec), 'precision', 'c'], [pct(far), 'false-alarm rate', 'a']]);
    info.appendChild(el('p', null, rec >= .95 ? 'Target reached: ' + tp + ' of ' + (tp + fn) + ' defects stopped. The price: <b>' + fp + ' good cells</b> (' + pct(far, 0) + ' of all good ones) go to re-check.' : 'Recall ' + pct(rec) + '. Move the gate left to stop more defects. Watch the yellow (good, stopped) pile grow.'));
    // real cells nearest the gate
    near.innerHTML = '';
    var idx = cells.findIndex(function (cl) { return cl[1] >= cut; }); if (idx < 0) idx = cells.length;
    cells.slice(Math.max(0, idx - 5), idx + 5).forEach(function (cl) { var t = thumb(api, cl[0], 34, cl[2] ? '#ff4d6a' : '#3dffa0'); t.title = 'cell ' + cl[0] + ' · score ' + cl[1].toFixed(3) + ' · expert ' + cl[3]; t.style.opacity = cl[1] >= cut ? 1 : .55; near.appendChild(t); });
    near.insertBefore(el('span', 'hint', 'at the gate:'), near.firstChild);
    if (rec >= .95 && !m.hit) api.setMech({ hit: 1, hitAt: cut, fpAt: fp });
  }
  function at(ev) { var b = cv.getBoundingClientRect(); cut = XI((ev.clientX - b.left) * W / b.width); m.cut = cut; draw(); }
  cv.addEventListener('pointerdown', function (ev) { cv.setPointerCapture(ev.pointerId); at(ev); var mv = function (e) { at(e); }; cv.addEventListener('pointermove', mv); cv.addEventListener('pointerup', function up() { cv.removeEventListener('pointermove', mv); cv.removeEventListener('pointerup', up); api.setMech({ cut: cut }); }); });
  cv.setAttribute('tabindex', '0'); cv.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); var p = X(cut) + (e.key === 'ArrowLeft' ? -2 : 2); cut = XI(p); m.cut = cut; draw(); } });
  draw();
}
function curveSvg(curve, opt) {
  var W = 440, H = 220, L = 34, R = W - 10, T = 10, B = H - 34, X = function (v) { return L + (R - L) * SQ(v); }, Y = function (v) { return B - (B - T) * v; }, o = [];
  o.push('<rect x="' + L + '" y="' + T + '" width="' + (R - L) + '" height="' + (B - T) + '" fill="#070b11" stroke="#1b2533"/>');
  [0, 0.25, 0.5, 0.75, 1].forEach(function (v) { o.push('<text x="' + (L - 4) + '" y="' + (Y(v) + 3) + '" text-anchor="end" font-family="Space Mono,monospace" font-size="9" fill="#8d9bb0">' + v + '</text>'); });
  scoreAxis(o, X, B + 6);
  o.push('<text x="' + ((L + R) / 2) + '" y="' + (H - 2) + '" text-anchor="middle" font-family="Rajdhani,Arial,sans-serif" font-size="12" fill="#8d9bb0">cutoff (defect score needed to STOP)</text>');
  o.push('<line x1="' + L + '" y1="' + Y(0.95) + '" x2="' + R + '" y2="' + Y(0.95) + '" stroke="#3dffa0" stroke-dasharray="5 4"/><text x="' + (R - 4) + '" y="' + (Y(0.95) - 4) + '" text-anchor="end" font-family="Rajdhani,Arial,sans-serif" font-size="12" fill="#3dffa0">target recall 0.95</text>');
  var pts = curve.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' ');
  o.push('<polyline points="' + pts + '" fill="none" stroke="#46e3ff" stroke-width="2.5"/>');
  if (opt && opt.prec) o.push('<polyline points="' + curve.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(p[2]).toFixed(1); }).join(' ') + '" fill="none" stroke="#a98bff" stroke-width="1.5" stroke-dasharray="3 3"/><text x="' + (L + 6) + '" y="' + (T + 14) + '" font-family="Rajdhani,Arial,sans-serif" font-size="12" fill="#46e3ff">— recall</text><text x="' + (L + 60) + '" y="' + (T + 14) + '" font-family="Rajdhani,Arial,sans-serif" font-size="12" fill="#a98bff">- - precision</text>');
  if (opt && opt.guess != null) o.push('<line x1="' + X(opt.guess) + '" y1="' + T + '" x2="' + X(opt.guess) + '" y2="' + B + '" stroke="#a98bff" stroke-width="2"/><text x="' + X(opt.guess) + '" y="' + (T + 28) + '" text-anchor="middle" font-family="Orbitron,Arial,sans-serif" font-size="10" fill="#a98bff" paint-order="stroke" stroke="#070b11" stroke-width="3">your guess ' + opt.guess.toFixed(2) + '</text>');
  if (opt && opt.cut != null) o.push('<line x1="' + X(opt.cut) + '" y1="' + T + '" x2="' + X(opt.cut) + '" y2="' + B + '" stroke="#ffb547" stroke-width="2.5"/><circle cx="' + X(opt.cut) + '" cy="' + Y(opt.rec) + '" r="5" fill="#ffb547"/><text x="' + X(opt.cut) + '" y="' + (T + 44) + '" text-anchor="middle" font-family="Orbitron,Arial,sans-serif" font-size="10" fill="#ffb547" paint-order="stroke" stroke="#070b11" stroke-width="3">answer ' + opt.cut.toFixed(3) + '</text>');
  return { s: svg(W, H, o.join('')), X: X, L: L, R: R, W: W };
}
function guessChart(holder, pre, pr, onPick, result) {
  holder.innerHTML = '';
  if (!pre || !pre.curve) return;
  var g = curveSvg(pre.curve, { guess: pr.val, cut: result ? result.cut : null, rec: result ? result.rec : null });
  g.s.style.maxWidth = '520px';
  if (!pr.locked) {
    g.s.style.cursor = 'crosshair';
    g.s.addEventListener('click', function (ev) { var b = g.s.getBoundingClientRect(), px = (ev.clientX - b.left) * g.W / b.width, t = Math.max(0, Math.min(1, (px - g.L) / (g.R - g.L))); onPick(t * t); });
  }
  holder.appendChild(g.s);
  if (pr.locked && result) {
    var d = Math.abs(pr.val - result.cut);
    holder.appendChild(el('div', 'verdict ' + (d <= 0.05 ? 'good' : 'bad'), (d <= 0.05 ? '✓ Close! ' : '✗ Off by ' + d.toFixed(2) + '. ') + 'Your guess ' + pr.val.toFixed(2) + ', real answer ' + result.cut.toFixed(3) + '. The answer sits where the blue line last stays above the green dashes.'));
  } else if (pr.locked) holder.appendChild(el('div', 'hint', 'Guess locked at ' + pr.val.toFixed(2) + '. Now fill the gap and run.'));
}
function target(r, host, api) {
  var c = card(host, 'THE CUTOFF YOUR CODE FOUND', 'Real recall and precision for every possible cutoff on the validation tray.');
  c.appendChild(curveSvg(r.curve, { prec: 1, cut: r.cut, rec: r.rec, guess: api.predVal }).s);
  tiles(c, [[r.cut.toFixed(3), 'cutoff', 'a'], [pct(r.rec), 'recall', r.rec >= .95 ? 'g' : 'r'], [pct(r.prec), 'precision', 'c']]);
  c.appendChild(el('p', null, 'Any cell with a defect score of <b>' + r.cut.toFixed(3) + '</b> or more gets STOP. Precision ' + pct(r.prec, 0) + ' means: of all stopped cells, only ' + pct(r.prec, 0) + ' are real defects.'));
}
function report(r, host, api, opt) {
  opt = opt || {};
  var k = 1000 / r.n;
  var c = card(host, opt.title || 'REPORT CARD — VALIDATION TRAY', 'Cutoff ' + r.cut.toFixed(3) + '. Every tile is a real cell. Test tray: still sealed.');
  var grid = el('div'); grid.style.cssText = 'display:grid;grid-template-columns:70px 1fr 1fr;gap:6px;align-items:stretch';
  grid.appendChild(el('div')); grid.appendChild(el('div', null, '<div style="text-align:center;font-family:Orbitron,Arial,sans-serif;font-size:11px;color:#ff4d6a">MODEL SAYS STOP</div>')); grid.appendChild(el('div', null, '<div style="text-align:center;font-family:Orbitron,Arial,sans-serif;font-size:11px;color:#3dffa0">MODEL SAYS PASS</div>'));
  function box(list, n, title, col, bg) {
    var b = el('div'); b.style.cssText = 'border:1px solid ' + col + ';background:' + bg + ';border-radius:10px;padding:6px;min-height:90px;position:relative';
    b.appendChild(el('div', null, '<span style="font-family:Orbitron,Arial,sans-serif;font-size:20px;font-weight:700;color:' + col + '">' + n + '</span> <span style="font-size:13px;color:#c6d2e2">' + title + '</span>'));
    var t = el('div'); t.style.cssText = 'display:flex;flex-wrap:wrap;gap:2px;margin-top:4px';
    list.slice(0, 24).forEach(function (cl) { var th = thumb(api, cl[0], 22); th.title = 'cell ' + cl[0] + ' · score ' + cl[3] + ' · expert ' + cl[1] + ' · ' + cl[2]; th.style.cursor = 'pointer'; th.onclick = function () { zoomIn(c, api, cl[0], null, ' · model score ' + cl[3]); }; t.appendChild(th); });
    if (list.length > 24) t.appendChild(el('span', 'hint', '+' + (list.length - 24)));
    b.appendChild(t); return b;
  }
  grid.appendChild(el('div', null, '<div style="font-family:Orbitron,Arial,sans-serif;font-size:10px;color:#ff8a9c;padding-top:30px">REAL DEFECT</div>'));
  grid.appendChild(box(r.TP, r.tp, 'caught', '#3dffa0', '#0b2418')); grid.appendChild(box(r.FN, r.fn, 'MISSED — ships!', '#ff4d6a', '#2a0e16'));
  grid.appendChild(el('div', null, '<div style="font-family:Orbitron,Arial,sans-serif;font-size:10px;color:#3dffa0;padding-top:30px">REALLY GOOD</div>'));
  grid.appendChild(box(r.FP, r.fp, 'false alarms', '#ffb547', '#1c1606')); grid.appendChild(box(r.TN, r.tn, 'passed, fine', '#2f8a5f', '#08140e'));
  c.appendChild(grid);
  tiles(c, [[pct(r.rec), 'recall', r.rec >= .95 ? 'g' : 'r'], [pct(r.far), 'false-alarm rate', 'a'], [pct(r.tp / (r.tp + r.fp)), 'precision', 'c']]);
  var c2 = card(host, 'PER 1,000 CELLS ON THE LINE', 'Scaled from the ' + r.n + ' validation cells.');
  var a = Math.round(r.tp * k), b = Math.round(r.fn * k), f = Math.round(r.fp * k), o = '', i = 0;
  function blocks(n, col) { for (var j = 0; j < n; j++, i++) { var x = (i % 50) * 8.8, y = Math.floor(i / 50) * 8.8; o += '<rect x="' + x + '" y="' + y + '" width="7.6" height="7.6" rx="1" fill="' + col + '"/>'; } }
  blocks(a, '#3dffa0'); blocks(b, '#ff4d6a'); blocks(f, '#ffb547'); blocks(1000 - a - b - f, '#1d2a3a');
  c2.appendChild(svg(440, Math.ceil(1000 / 50) * 8.8, o));
  c2.appendChild(el('p', null, '<b style="color:#3dffa0">' + a + '</b> defects caught · <b style="color:#ff4d6a">' + b + '</b> missed · <b style="color:#ffb547">' + f + '</b> good cells stopped · ' + (1000 - a - b - f) + ' good cells passed.'));
  c2.appendChild(el('div', 'verdict bad', opt.verdict ? opt.verdict(f) : '<b>Honest verdict:</b> the target is met, but ' + pct(r.far, 0) + ' of good cells get stopped. On a real line that means ' + f + ' extra manual checks per 1,000 cells — far too many. This baseline is not good enough. Step 3 must cut false alarms at the same 95% recall.'));
  if (!opt.noSorter) sorter(r, host, api);
}
var REASONS = { faint: ['Faint crack / small mark', '#46e3ff'], unsure: ['Unsure label', '#d6e05a'], poly: ['Poly texture hides it', '#a98bff'] };
function sorter(r, host, api) {
  var c = card(host, 'CHALLENGE: WHY WERE THESE MISSED?', 'The ' + r.FN.length + ' defects the model let through. Look closely (tap a photo), then drag each into a reason box. Then check.');
  var m = api.mech; m.sort = m.sort || {}; var sel = null;
  var pool = el('div'); pool.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;min-height:60px;padding:6px;border:1px dashed #33445a;border-radius:10px';
  var bins = el('div'); bins.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px';
  c.appendChild(pool); c.appendChild(bins);
  var foot = el('div'); c.appendChild(foot);
  function tile(cl) {
    var t = thumb(api, cl[0], 52, sel === cl[0] ? '#fff' : null); t.className = 'dragtok'; t.style.cursor = 'grab'; t.style.touchAction = 'none';
    t.title = 'cell ' + cl[0] + ' · model score ' + cl[3];
    if (m.sorted) { var w = el('div'); w.style.cssText = 'text-align:center;font-size:11px'; w.appendChild(t); w.appendChild(el('div', null, '<span style="color:' + probCol(cl[1]) + '">exp ' + cl[1] + '</span> · ' + cl[2])); return w; }
    t.addEventListener('pointerdown', function (ev) {
      ev.preventDefault(); var moved = false, gh = t.cloneNode(true); gh.getContext('2d').drawImage(t, 0, 0); gh.style.position = 'fixed'; gh.style.zIndex = 60; gh.style.pointerEvents = 'none';
      function mv(e) { if (!moved && Math.abs(e.clientX - ev.clientX) + Math.abs(e.clientY - ev.clientY) > 4) { moved = true; document.body.appendChild(gh); } gh.style.left = (e.clientX - 26) + 'px'; gh.style.top = (e.clientY - 26) + 'px'; }
      function up(e) {
        document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); gh.remove();
        if (!moved) {
          var inBin = m.sort[cl[0]];
          if (sel != null && sel !== cl[0] && inBin) { m.sort[sel] = inBin; sel = null; api.setMech({ sort: m.sort }); draw(); return; }
          if (sel === cl[0]) { zoomIn(c, api, cl[0], null, ' · model score ' + cl[3]); } sel = cl[0]; draw(); return;
        }
        var b = document.elementFromPoint(e.clientX, e.clientY); b = b && b.closest && b.closest('[data-reason]');
        if (b) { m.sort[cl[0]] = b.getAttribute('data-reason'); sel = null; api.setMech({ sort: m.sort }); draw(); }
      }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
    return t;
  }
  function draw() {
    pool.innerHTML = ''; bins.innerHTML = '';
    r.FN.forEach(function (cl) { if (!m.sort[cl[0]]) pool.appendChild(tile(cl)); });
    if (!pool.children.length) pool.appendChild(el('span', 'hint', 'All sorted.'));
    Object.keys(REASONS).forEach(function (k) {
      var b = el('div', null, '<div style="font-family:Orbitron,Arial,sans-serif;font-size:10px;color:' + REASONS[k][1] + '">' + REASONS[k][0].toUpperCase() + '</div>');
      b.setAttribute('data-reason', k); b.style.cssText = 'min-height:90px;border:1px solid ' + REASONS[k][1] + '55;border-radius:10px;padding:6px;background:#0a0f16';
      var t = el('div'); t.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:4px';
      r.FN.forEach(function (cl) { if (m.sort[cl[0]] === k) t.appendChild(tile(cl)); }); b.appendChild(t);
      b.addEventListener('click', function () { if (sel != null && !m.sorted) { m.sort[sel] = k; sel = null; api.setMech({ sort: m.sort }); draw(); } });
      bins.appendChild(b);
    });
    foot.innerHTML = '';
    var left = r.FN.filter(function (cl) { return !m.sort[cl[0]]; }).length;
    if (!m.sorted) {
      var chk = el('button', 'btn', 'Check my sort'); chk.disabled = left > 0; chk.style.marginTop = '8px';
      chk.onclick = function () { api.setMech({ sorted: 1 }); draw(); };
      foot.appendChild(chk); foot.appendChild(el('span', 'hint', left ? '  ' + left + ' left to sort. Tap a photo twice to zoom.' : '  Ready.'));
    } else {
      var uns = r.FN.filter(function (cl) { return cl[1] < 1; }), poly = r.FN.filter(function (cl) { return cl[2] === 'poly'; });
      var agreeU = uns.filter(function (cl) { return m.sort[cl[0]] === 'unsure'; }).length, agreeP = poly.filter(function (cl) { return cl[1] === 1 && m.sort[cl[0]] === 'poly'; }).length;
      foot.appendChild(el('div', 'verdict good', '<b>The label file tells two facts</b> (now shown under each photo): <b>' + uns.length + '</b> of the ' + r.FN.length + ' missed cells had expert score 0.67 — the experts were unsure too (you put ' + agreeU + ' of them in “unsure label”). <b>' + poly.length + '</b> are poly cells, where the busy texture hides marks (' + agreeP + ' of the sure ones went to “poly”). The rest are small or faint marks. There is no single right sort for the pictures — but all three reasons point the same way: hand-made features (edges, darkness, PCA) cannot see small, thin shapes well. A CNN learns its own shape detectors. That is Step 3.'));
    }
  }
  draw();
}
function endCard(box, RES, api) {
  var b = RES['2b'], d = RES['2d'], e = RES['2e']; if (!e) return;
  var best = b ? b.models.filter(function (x) { return x.name === b.best; })[0] : null, k = 1000 / e.n;
  var c = el('div', 'endc', '<h3 class="fh">STEP 2 DONE — YOUR FIRST INSPECTOR</h3>' +
    '<ul><li>Loaded 2,624 real EL photos, labelled, split 60/20/20, scaled.</li>' +
    '<li>Built ' + (RES['2a'] ? RES['2a'].F[1] : '') + ' hand-made features per cell (lines, darkness, PCA).</li>' +
    (best ? '<li>Best of 3 models: <b>' + b.best + '</b>, cross-validated ranking score ' + best.mean.toFixed(3) + '.</li>' : '') +
    (d ? '<li>Cutoff for 95% recall on validation: <b>' + d.cut.toFixed(3) + '</b>.</li>' : '') +
    '<li>Result: recall <b>' + pct(e.rec) + '</b>, false-alarm rate <b>' + pct(e.far) + '</b> → per 1,000 cells: ' + Math.round(e.tp * k) + ' caught, ' + Math.round(e.fn * k) + ' missed, <b>' + Math.round(e.fp * k) + ' good cells stopped</b>.</li></ul>' +
    '<p><b>Next — Step 3: Train a CNN with Keras + TensorFlow.</b> The network learns its own filters for cracks and dark areas straight from the pixels. Same target (95 of 100 defects), same validation tray — the goal is far fewer false alarms. The test tray stays sealed until Step 8.</p>' +
    '<p class="hint">All numbers above were computed live by Python in your browser just now.</p>');
  box.appendChild(c);
}

window.PGViz = { _h: { el: el, card: card, tiles: tiles, thumb: thumb, svg: svg, pct: pct, zoomIn: zoomIn, probCol: probCol }, scene: scene, wall: wall, unitChart: unitChart, binLine: binLine, trays: trays, lens: lens, chips: chips, race: race, gate: gate, guessChart: guessChart, target: target, report: report, endCard: endCard };
})();
