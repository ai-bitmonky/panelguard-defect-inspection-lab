/* PanelGuard Step 5 visuals and hands-on mechanics (LangGraph wiring). Every count is from real graph runs. */
(function () {
'use strict';
var H = function () { return window.PGViz._h; };
function el(t, c, h) { return H().el(t, c, h); }
function card(p, t, s) { return H().card(p, t, s); }
function tiles(p, l) { return H().tiles(p, l); }
function f3(x) { return x == null || isNaN(x) ? '—' : (+x).toFixed(3); }
function f4(x) { return x == null || isNaN(x) ? '—' : (+x).toFixed(4); }
function pc(x, d) { return (100 * x).toFixed(d == null ? 0 : d) + '%'; }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function drag(tok, onDrop, onTap) { window.PGViz3._dragTok(tok, onDrop, onTap); }
function shake(e) { if (e.animate) e.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 }); }
function noData(host, api, what) { host.appendChild(el('div', 'verdict', api.review ? 'Review mode: press “Run up to here” (below the code) to load real data for this page.' : what)); }
var LANE = { pass: ['AUTO-PASS', '#3dffa0'], person: ['A PERSON CHECKS', '#ffb547'], stop: ['AUTO-STOP', '#ff4d6a'] };
var LBL = { __start__: 'START', __end__: 'END' };

/* photo canvas from a pixel array (fault copies) or from the photo pack (real cells) */
function photoCanvas(api, id, px, size) {
  var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d');
  if (px) { var im = x.createImageData(64, 64); for (var k = 0; k < 4096; k++) { im.data[4 * k] = im.data[4 * k + 1] = im.data[4 * k + 2] = px[k]; im.data[4 * k + 3] = 255; } x.putImageData(im, 0, 0); }
  else { var s = api.canvas(id); if (s) x.drawImage(s, 0, 0); }
  c.style.cssText = 'width:' + size + 'px;height:' + size + 'px;border-radius:4px;image-rendering:pixelated;display:block';
  return c;
}

/* ---------- the line drawing: positions per station; edges come from the compiled graph (getGraph) ---------- */
var POS = { __start__: [36, 140], check_photo: [168, 140], reshoot: [168, 250], score: [322, 140], route: [470, 140], human_check: [610, 48], record: [752, 140], __end__: [866, 140] };
function shape(n) { return n === '__start__' || n === '__end__' ? { k: 'c', r: 28 } : n === 'route' ? { k: 'd', w: 50, h: 32 } : { k: 'r', w: 64, h: 24 }; }
function posOf(n, extra) { if (POS[n]) return POS[n]; var i = extra.indexOf(n); if (i < 0) { extra.push(n); i = extra.length - 1; } return [330 + 140 * i, 250]; }
function border(n, p, q) {            // point where the line from p (centre of n) towards q leaves the shape
  var s = shape(n), dx = q[0] - p[0], dy = q[1] - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
  if (s.k === 'c') return [p[0] + dx / L * s.r, p[1] + dy / L * s.r];
  if (s.k === 'd') { var t = 1 / (Math.abs(dx) / s.w + Math.abs(dy) / s.h); return [p[0] + dx * t, p[1] + dy * t]; }
  var tt = Math.min(s.w / Math.abs(dx || 1e-9), s.h / Math.abs(dy || 1e-9)); return [p[0] + dx * tt, p[1] + dy * tt];
}
function nodeSVG(n, o) {
  var p = POS[n] || o.pos(n), s = shape(n), lab = LBL[n] || n, hot = o.hot === n, sel = o.sel === n, col = hot ? '#46e3ff' : sel ? '#ffb547' : n[0] === '_' ? '#5d6b80' : '#2f8fb0';
  var fill = hot ? '#0f2a38' : '#0c131d', g = '<g data-node="' + n + '" style="cursor:' + (o.click ? 'pointer' : 'default') + '">';
  if (hot) g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (s.k === 'r' ? 64 : 40) + '" fill="#46e3ff" opacity=".12"/>';
  if (s.k === 'c') g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + s.r + '" fill="' + fill + '" stroke="' + col + '" stroke-width="2"/>';
  else if (s.k === 'd') g += '<path d="M' + (p[0] - s.w) + ' ' + p[1] + 'L' + p[0] + ' ' + (p[1] - s.h) + 'L' + (p[0] + s.w) + ' ' + p[1] + 'L' + p[0] + ' ' + (p[1] + s.h) + 'Z" fill="' + fill + '" stroke="' + col + '" stroke-width="2"/>';
  else g += '<rect x="' + (p[0] - s.w) + '" y="' + (p[1] - s.h) + '" width="' + 2 * s.w + '" height="' + 2 * s.h + '" rx="8" fill="' + fill + '" stroke="' + col + '" stroke-width="2"/>';
  g += '<text x="' + p[0] + '" y="' + (p[1] + 6) + '" text-anchor="middle" font-family="Space Mono,Consolas,monospace" font-size="' + (s.k === 'c' ? 13 : 16.5) + '" font-weight="700" fill="' + (n[0] === '_' ? '#8d9bb0' : '#e6eef8') + '">' + lab + '</text></g>';
  return g;
}
function edgesSVG(edges, o) {          // edges: [{s,t,c,d,col}]
  var pairs = {}, out = '';
  edges.forEach(function (e) { var k = e.s + '>' + e.t; (pairs[k] = pairs[k] || { s: e.s, t: e.t, c: e.c, d: [], col: e.col }).d.push(e.d); });
  Object.keys(pairs).forEach(function (k) {
    var e = pairs[k], p = POS[e.s] || o.pos(e.s), q = POS[e.t] || o.pos(e.t), back = pairs[e.t + '>' + e.s];
    var off = back ? 9 : 0, dx = q[0] - p[0], dy = q[1] - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L * off, ny = dx / L * off;
    var a = border(e.s, [p[0] + nx, p[1] + ny], [q[0] + nx, q[1] + ny]), b = border(e.t, [q[0] + nx, q[1] + ny], [p[0] + nx, p[1] + ny]);
    var col = e.col || (e.c ? '#ffb547' : '#46e3ff');
    out += '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="' + col + '" stroke-width="2.2"' + (e.c ? ' stroke-dasharray="6 4"' : '') + ' marker-end="url(#ah' + (e.c ? 'c' : '') + ')"/>';
    var lab = e.d.filter(function (x) { return x; }).join(' · ');
    if (lab) { var mx = (a[0] + b[0]) / 2 + nx * 1.6, my = (a[1] + b[1]) / 2 + ny * 1.6 - 6; out += '<text x="' + mx + '" y="' + my + '" text-anchor="middle" font-family="Rajdhani,Arial" font-size="17" font-weight="700" fill="#ffcf6b" stroke="#05070b" stroke-width="3" paint-order="stroke">' + esc(lab) + '</text>'; }
  });
  return out;
}
function lineSVG(nodes, edges, o) {
  o = o || {}; var extra = []; o.pos = function (n) { return posOf(n, extra); };
  var hasRe = nodes.indexOf('reshoot') >= 0 || nodes.some(function (n) { return !POS[n]; });
  var s = '<svg viewBox="0 0 900 ' + (hasRe ? 296 : 168) + '" style="width:100%;height:auto;display:block;touch-action:none" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#46e3ff"/></marker>' +
    '<marker id="ahc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ffb547"/></marker></defs>' +
    '<g transform="translate(0,' + (hasRe ? 4 : -14) + ')">';
  s += edgesSVG(edges, o);
  nodes.forEach(function (n) { s += nodeSVG(n, o); });
  if (o.token) { var tp = POS[o.token] || o.pos(o.token); s += '<g id="tok5" style="transition:transform .45s ease;transform:translate(' + tp[0] + 'px,' + (tp[1] - 34) + 'px)"><circle r="11" fill="#a98bff" stroke="#fff" stroke-width="2"/><text y="4" text-anchor="middle" font-size="10" font-family="Orbitron,Arial" font-weight="900" fill="#fff">' + esc(o.tokLabel || '') + '</text></g>'; }
  return s + (o.extraSVG || '') + '</g></svg>';
}

/* ================= 5a: wire the line by hand ================= */
var WIRE_NODES = ['__start__', 'check_photo', 'score', 'route', 'human_check', 'record', '__end__'];
var NEED = ['__start__>check_photo', 'check_photo>score', 'score>route', 'route>human_check', 'route>record', 'human_check>record', 'record>__end__'];
var LANES_OF = { 'route>human_check': 'person', 'route>record': 'pass · stop' };
function whyNot(s, t) {
  if (s === t) return null;
  if (t === '__start__') return 'Nothing goes back to START: START is where every cell comes in.';
  if (s === '__end__') return 'END is the end of the line: nothing leaves it.';
  if (s === '__start__') return 'Every photo is checked first: START goes to check_photo.';
  if (s === 'check_photo') return t === 'route' ? 'The fork needs a score to compare with the gates. check_photo goes to score first.' : 'After the photo check comes the score: check_photo goes to score.';
  if (s === 'score') return 'The score goes to the fork (route). The fork picks the lane; the score station does not.';
  if (s === 'route') return t === '__end__' ? 'Every cell must be written in the logbook before END: the lanes go to record or to a person.' : t === 'score' || t === 'check_photo' ? 'That arrow goes backwards: the fork only sends cells forward, to a lane.' : 'The fork sends cells to a person (human_check) or to record.';
  if (s === 'human_check') return t === '__end__' ? 'A person\'s answer must be written down: human_check goes to record, then END.' : 'After the person decides, the answer is recorded: human_check goes to record.';
  if (s === 'record') return 'record is the last station: it goes to END.';
  return 'The cell does not travel that way.';
}
function sceneWire(s, stage, out, api) {
  var m = api.mech; m.wires = m.wires || []; var sel = null, msg = null, rub = null;
  stage.innerHTML = '';
  var head = el('div', 'hint', '<div style="padding:10px 12px 0">Drag from one station to the next station a cell must visit (or tap one station, then the next). <b>7 arrows</b> make the whole line.</div>');
  var box = el('div'); box.style.cssText = 'padding:4px 8px 8px;position:relative'; box.id = 'wire5';
  var foot = el('div'); foot.style.cssText = 'padding:0 12px 12px;min-height:44px';
  stage.appendChild(head); stage.appendChild(box); stage.appendChild(foot);
  function edges() { return m.wires.map(function (w) { var a = w.split('>'); return { s: a[0], t: a[1], c: a[0] === 'route', d: LANES_OF[w] || null, col: '#3dffa0' }; }); }
  function draw() {
    box.innerHTML = lineSVG(WIRE_NODES, edges(), { click: true, sel: sel });
    var svg = box.querySelector('svg');
    svg.addEventListener('pointerdown', function (ev) {
      var g = ev.target.closest && ev.target.closest('[data-node]'); if (!g) return; ev.preventDefault();
      var from = g.getAttribute('data-node'), pt = svg.createSVGPoint();
      var ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'), p = POS[from]; ln.setAttribute('x1', p[0]); ln.setAttribute('y1', p[1]); ln.setAttribute('x2', p[0]); ln.setAttribute('y2', p[1]);
      ln.setAttribute('stroke', '#ffb547'); ln.setAttribute('stroke-width', '2'); ln.setAttribute('stroke-dasharray', '4 4'); svg.firstElementChild.nextElementSibling.appendChild(ln); rub = ln;
      function mv(e) { pt.x = e.clientX; pt.y = e.clientY; var q = pt.matrixTransform(svg.getScreenCTM().inverse()); ln.setAttribute('x2', q.x); ln.setAttribute('y2', q.y + 14); }
      function up(e) {
        document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (rub) rub.remove(); rub = null;
        var t = document.elementFromPoint(e.clientX, e.clientY), tg = t && t.closest && t.closest('[data-node]'), to = tg && tg.getAttribute('data-node');
        if (to && to !== from) { sel = null; tryWire(from, to); return; }
        if (to === from) { if (sel && sel !== from) { var a = sel; sel = null; tryWire(a, from); return; } sel = sel === from ? null : from; draw(); }
      }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
  }
  function tryWire(a, b) {
    var k = a + '>' + b;
    if (m.wires.indexOf(k) >= 0) { msg = ['ok', 'That arrow is already there.']; }
    else if (NEED.indexOf(k) >= 0) { m.wires.push(k); msg = ['ok', (LBL[a] || a) + ' → ' + (LBL[b] || b) + (LANES_OF[k] ? ' (lane: ' + LANES_OF[k] + ')' : '') + '. ✓']; }
    else { msg = ['no', whyNot(a, b)]; m.refused = (m.refused || 0) + 1; }
    var done = NEED.every(function (w) { return m.wires.indexOf(w) >= 0; });
    api.setMech({ wires: m.wires, refused: m.refused || 0, done: m.done || done });
    draw(); side(); if (msg[0] === 'no') shake(box);
  }
  function side() {
    foot.innerHTML = msg ? '<div class="verdict ' + (msg[0] === 'ok' ? 'good' : 'bad') + '" id="wiremsg">' + esc(msg[1]) + '</div>' : '';
    out.innerHTML = '';
    var c = card(out, 'YOUR WIRING', 'Each arrow = “after this station, the cell goes there”. The fork (the diamond) has more than one way out.');
    tiles(c, [[m.wires.length + ' / 7', 'arrows drawn', m.done ? 'g' : 'a'], [m.refused || 0, 'arrows refused', '']]);
    if (m.done) c.appendChild(el('div', 'verdict good', '<b>The line is wired.</b> START → check_photo → score → route. The fork has two exits: <b>person</b> → human_check → record, and <b>pass · stop</b> → record. Then END.<br>In code, every arrow is one line: <code>addEdge(a, b)</code>, and the fork is <code>addConditionalEdges</code>. That is 5c and 5d.'));
    else c.appendChild(el('p', 'hint', 'Think about what each station needs before it can work: a score needs a good photo; the fork needs a score; the logbook needs a final answer.'));
  }
  draw(); side();
}

/* ================= 5b pre: what travels on the card ================= */
var CHIPS = [['id', 'cell number', 1], ['kind', 'cell type (mono / poly)', 1], ['photo', 'the photo', 1], ['p', 'defect score', 1], ['lane', 'lane (pass / person / stop)', 1], ['log', 'audit log of the stations', 1],
  ['label', 'expert label', 0, 'The line never knows the expert label: it is the answer we are looking for. If it travelled on the card, a station could cheat.'],
  ['weights', 'the model weights', 0, 'Every cell uses the SAME model. It stays at the score station; it does not travel with each cell.'],
  ['shift', 'all 525 photos of the shift', 0, 'A card is for ONE cell. Every other cell has its own card.']];
function cardPlay(box, api) {
  var m = api.mech; m.on = m.on || []; var sel = null, why = null;
  function draw() {
    box.innerHTML = '';
    var c = el('div', 'card'); c.style.cssText = 'display:grid;grid-template-columns:1fr 300px;gap:12px;align-items:start';
    var pool = el('div'); pool.appendChild(el('div', 'hint', '<b>Tap or drag</b> every field a station needs onto the traveller card. Things that should not travel are refused.'));
    var pl = el('div'); pl.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px';
    CHIPS.forEach(function (ch) {
      if (m.on.indexOf(ch[0]) >= 0) return;
      var b = el('button', 'btn small', esc(ch[1])); b.setAttribute('data-chip5', ch[0]); b.style.cssText = 'border-style:dashed' + (sel === ch[0] ? ';border-color:#ffb547;color:#ffb547' : '');
      drag(b, function (d) { if (d === 'card') put(ch); }, function () { put(ch); });
      pl.appendChild(b);
    });
    if (!pl.children.length) pl.appendChild(el('span', 'hint', 'Nothing left.'));
    pool.appendChild(pl);
    if (why) pool.appendChild(el('div', 'verdict bad', '<b>Refused:</b> ' + esc(why)));
    var tag = el('div'); tag.setAttribute('data-drop', 'card'); tag.id = 'card5';
    tag.style.cssText = 'border:2px solid #a98bff;border-radius:12px;padding:10px 12px 10px 26px;background:linear-gradient(135deg,#171233,#0e0b1f);position:relative;min-height:150px';
    tag.innerHTML = '<div style="position:absolute;left:9px;top:12px;width:10px;height:10px;border-radius:50%;background:#05070b;border:2px solid #a98bff"></div><div style="font-family:Orbitron,Arial;font-size:11px;letter-spacing:.18em;color:#a98bff">TRAVELLER CARD · ONE CELL</div>';
    m.on.forEach(function (k) { var ch = CHIPS.filter(function (x) { return x[0] === k; })[0]; tag.appendChild(el('div', null, '<span style="color:#3dffa0">✓</span> <code>' + k + '</code> ' + esc(ch[1]))); });
    if (!m.on.length) tag.appendChild(el('div', 'hint', 'drop fields here'));
    c.appendChild(pool); c.appendChild(tag); box.appendChild(c);
  }
  function put(ch) {
    if (ch[2]) { m.on.push(ch[0]); why = null; } else { why = ch[3]; m.refusedCard = (m.refusedCard || 0) + 1; }
    var ok = CHIPS.every(function (x) { return !x[2] || m.on.indexOf(x[0]) >= 0; });
    api.setMech({ on: m.on, refusedCard: m.refusedCard || 0, cardOk: m.cardOk || ok }); draw();
    if (ok) box.querySelector('.card').appendChild(el('div', 'verdict good', 'Card ready. The code below adds 3 more fields the stations fill in on the way: <code>problem</code>, <code>tries</code> and <code>decision</code>.'));
  }
  draw();
  if (m.cardOk) box.querySelector('.card').appendChild(el('div', 'verdict good', 'Card ready. The code below adds 3 more fields the stations fill in on the way: <code>problem</code>, <code>tries</code> and <code>decision</code>.'));
}
function cardResult(r, host) {
  if (r.missing) return;
  var c = card(host, 'THE CARD, TESTED BY REAL LANGGRAPH ' + esc(r.ver || ''), 'Two test stations ran on one card. Station a wrote lane “pass” and one log line; station b wrote lane “stop” and one more line.');
  var g = el('div'); g.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px';
  var a = r.log && r.logType === 'list';
  g.appendChild(el('div', 'tile', '<div class="l">plain field <code>lane</code> — last value wins</div><div class="v" style="font-size:16px">' + esc(r.lane == null ? '—' : r.lane) + '</div>'));
  g.appendChild(el('div', 'tile ' + (a && r.log.length === 2 ? 'g' : 'r'), '<div class="l">reducer field <code>log</code> — values are combined</div><div class="v" style="font-size:14px;font-family:Space Mono,monospace">' + esc(r.log == null ? '— nothing: the stations could not add their lines' : a ? JSON.stringify(r.log) : JSON.stringify(r.log) + '  (' + ({ string: 'text', number: 'a number' }[r.logType] || r.logType) + ', not a list)') + '</div>'));
  c.appendChild(g);
  c.appendChild(el('div', 'hint', 'Fields on your card: ' + r.keys.map(function (k) { return '<code>' + k + '</code>'; }).join(' ')));
}

/* ================= 5c: first two stations + token ================= */
function stateCard(st, changed, api, title) {
  var w = el('div', 'vc'); w.style.marginBottom = '8px';
  w.appendChild(el('h4', null, esc(title)));
  var keys = ['id', 'kind', 'photo', 'problem', 'tries', 'p', 'lane', 'decision', 'log'];
  var t = '<table style="width:100%;border-collapse:collapse;font-size:14px">';
  keys.forEach(function (k) {
    var v = k === 'photo' ? (st.photoStats ? '4,096 values · mean ' + st.photoStats.mean.toFixed(0) : null) : st[k], ch = changed && Object.prototype.hasOwnProperty.call(changed, k);
    var txt = v == null ? '<span style="color:#5d6b80">—</span>' : k === 'p' ? f3(v) : k === 'log' ? (v.length ? v.map(esc).join('<br>') : '<span style="color:#5d6b80">[ ]</span>') : esc(v);
    t += '<tr style="' + (ch ? 'background:#3a2a05' : '') + '"><td style="padding:2px 6px;color:#8d9bb0;font-family:Space Mono,monospace;width:78px;vertical-align:top">' + k + (ch ? ' <b style="color:#ffb547">●</b>' : '') + '</td><td style="padding:2px 6px">' + txt + '</td></tr>';
  });
  w.appendChild(el('div', null, t + '</table>'));
  if (changed) w.appendChild(el('div', 'hint', '● = written by this station (it returned only these).'));
  return w;
}
function firstTwo(r, host, api) {
  if (r.missing) return;
  var m = api.mech, path = ['__start__'].concat(r.names, ['__end__']), k = Math.min(m.tok || 0, path.length - 1);
  var c = card(host, 'YOUR GRAPH — DRAWN FROM line1.getGraph()', 'Real cell ' + r.id + '. Tap the purple token (or the next station) to move the cell forward.');
  var gbox = el('div'); gbox.id = 'graph5c'; c.appendChild(gbox);
  var cardBox = el('div'); host.appendChild(cardBox);
  function draw(animFrom) {
    var at = path[k];
    gbox.innerHTML = lineSVG(r.graph.nodes, r.graph.edges, { token: animFrom != null ? path[animFrom] : at, tokLabel: String(r.id).slice(-3), hot: at, click: true });
    var svg = gbox.querySelector('svg');
    if (animFrom != null) requestAnimationFrame(function () { var t = svg.querySelector('#tok5'), p = POS[at]; if (t && p) t.style.transform = 'translate(' + p[0] + 'px,' + (p[1] - 34) + 'px)'; });
    svg.addEventListener('click', function (ev) { var g = ev.target.closest && (ev.target.closest('#tok5') || ev.target.closest('[data-node]')); if (!g) return; if (g.id === 'tok5' || g.getAttribute('data-node') === path[k + 1]) step(); });
    cardBox.innerHTML = '';
    var vi = Math.min(k, r.vals.length - 1);
    cardBox.appendChild(stateCard(r.vals[vi] || {}, k > 0 && k <= r.upd.length ? r.upd[k - 1][1] : null, api, k === 0 ? 'THE CARD AT START (the input)' : at === '__end__' ? 'THE CARD AT END' : 'THE CARD AFTER ' + at.toUpperCase()));
    var row = el('div', 'row'); var b = el('button', 'btn small', k < path.length - 1 ? 'Move the token → ' + (LBL[path[k + 1]] || path[k + 1]) : 'Reached END ✓'); b.id = 'tok5next'; b.disabled = k >= path.length - 1; b.onclick = step;
    var rs = el('button', 'btn small', '↺ Back to START'); rs.onclick = function () { k = 0; draw(); };
    row.appendChild(b); row.appendChild(rs); c.appendChild(row); if (c._row) c._row.remove(); c._row = row;
  }
  function step() { if (k >= path.length - 1) return; var from = k; k++; api.setMech({ tok: k, tokenEnd: m.tokenEnd || k === path.length - 1 }); draw(from); }
  draw();
  // the photo rule on the real data
  var q = card(host, 'THE PHOTO RULE, ON ALL 2,624 REAL PHOTOS', 'Mean brightness of every photo in the pack. Your gate: too dark below ' + 20 + '.');
  var bins = new Array(26).fill(0); r.means.forEach(function (v) { bins[Math.min(25, Math.floor(v / 10))]++; });
  var mx = Math.max.apply(null, bins), sv = '<svg viewBox="0 0 520 120" style="width:100%;height:auto">';
  bins.forEach(function (b, i) { var hh = b ? Math.max(2, 90 * Math.sqrt(b / mx)) : 0; sv += '<rect x="' + (10 + i * 19.5) + '" y="' + (100 - hh) + '" width="17" height="' + hh + '" fill="' + (i < 2 ? '#ff4d6a' : '#2f8fb0') + '"/>'; });
  sv += '<line x1="' + (10 + 2 * 19.5) + '" y1="5" x2="' + (10 + 2 * 19.5) + '" y2="102" stroke="#ffb547" stroke-width="2" stroke-dasharray="4 3"/><text x="' + (14 + 2 * 19.5) + '" y="16" fill="#ffb547" font-size="12" font-family="Rajdhani,Arial">DARK = 20</text>';
  sv += '<text x="10" y="116" fill="#8d9bb0" font-size="11" font-family="Rajdhani,Arial">0</text><text x="505" y="116" fill="#8d9bb0" font-size="11" font-family="Rajdhani,Arial">255</text><text x="200" y="116" fill="#8d9bb0" font-size="11" font-family="Rajdhani,Arial">mean brightness (bar height: square root of the count)</text></svg>';
  q.appendChild(el('div', null, sv));
  q.appendChild(el('p', null, '<b>' + r.dark + '</b> of 2,624 real photos are darker than 20: all fully dead cells (expert score 1.0), all in the train tray. Every other photo has spread ≥ 6.3 and contrast ≥ 16, far above BLANK = 3 and FLAT = 12.'));
  var fr = el('div'); fr.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap'; q.appendChild(el('div', 'hint', 'Camera fault copies (made from real good photos, labelled — never mixed into a shift). Your photoProblem() says:')); q.appendChild(fr);
  api.jsEval(function (NS, pg) { return pg && pg.faultCards ? pg.faultCards().map(function (x) { return x.photo; }) : null; }).then(function (ph) {
    r.faults.forEach(function (f, i) {
      var w = el('div'); w.style.cssText = 'text-align:center;font-size:12.5px;color:#c6d2e2';
      w.appendChild(photoCanvas(api, f.of, ph && ph[i], 64)); w.appendChild(el('div', null, '<b>' + f.id + '</b> ' + esc(f.what) + '<br>mean ' + f.st.mean.toFixed(0) + ' · spread ' + f.st.spread.toFixed(1) + ' · contrast ' + f.st.contrast + '<br>→ <b style="color:' + (f.got === f.rule ? '#3dffa0' : '#ff4d6a') + '">' + esc(f.got || 'photo ok') + '</b>'));
      fr.appendChild(w);
    });
  });
}

/* ================= 5d: predict lanes (new prediction format: drag cells into lanes) ================= */
function lanesPredict(body, api, pr, lock, whyBox, P) {
  var holder = el('div'); body.appendChild(holder);
  function go(D) {
    if (!D) { holder.appendChild(el('div', 'hint', api.review ? 'Review mode: press “Run up to here” on 5c or 5d to load the real scores.' : 'Finish 3f and 3g first: the cells and gates come from there.')); return; }
    pr.cells = pr.cells || D.cells; pr.place = pr.place || {}; var sel = null;
    function draw() {
      holder.innerHTML = '';
      holder.appendChild(el('div', 'hint', 'Gates: low = <b>' + f4(D.low) + '</b>, high = <b>' + f4(D.high) + '</b>. Below low → pass. At or above high → stop.'));
      var pool = el('div'); pool.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;min-height:30px;margin:6px 0';
      var lanes = el('div'); lanes.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px';
      function tok(cx) {
        var w = el('div'); w.setAttribute('data-cell5d', cx.id); w.style.cssText = 'text-align:center;font-size:12px;padding:3px;border-radius:8px;background:#0a0816;border:2px solid ' + (sel === cx.id ? '#fff' : '#5b48a0') + ';cursor:' + (pr.locked ? 'default' : 'grab');
        w.appendChild(photoCanvas(api, cx.id, null, 54)); w.appendChild(el('div', null, 'score <b>' + f4(cx.p) + '</b>'));
        if (pr.locked) { var ok = (pr.val.place[cx.id] === cx.lane); w.appendChild(el('div', null, ok ? '<b style="color:#3dffa0">✓</b>' : '<b style="color:#ff4d6a">✗ → ' + LANE[cx.lane][0].toLowerCase() + '</b>')); }
        else drag(w, function (d) { put(cx.id, d); }, function () { if (sel && sel !== cx.id && pr.place[cx.id]) { put(sel, pr.place[cx.id]); return; } sel = sel === cx.id ? null : cx.id; draw(); });
        return w;
      }
      pr.cells.forEach(function (cx) { var pl = pr.locked ? pr.val.place[cx.id] : pr.place[cx.id]; if (!pl) pool.appendChild(tok(cx)); });
      ['pass', 'person', 'stop'].forEach(function (L) {
        var d = el('div'); d.setAttribute('data-drop', L); d.style.cssText = 'min-height:110px;border:1px solid ' + LANE[L][1] + '88;border-radius:10px;padding:6px;background:#0a0f16';
        d.appendChild(el('div', null, '<div style="font-family:Orbitron,Arial;font-size:10px;color:' + LANE[L][1] + '">' + LANE[L][0] + '</div><div class="hint" style="font-size:12px">' + (L === 'pass' ? 'score below ' + f4(D.low) : L === 'stop' ? 'score ' + f4(D.high) + ' or more' : 'from ' + f4(D.low) + ' up to ' + f4(D.high)) + '</div>'));
        var t = el('div'); t.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin-top:4px';
        pr.cells.forEach(function (cx) { var pl = pr.locked ? pr.val.place[cx.id] : pr.place[cx.id]; if (pl === L) t.appendChild(tok(cx)); });
        d.appendChild(t); d.addEventListener('click', function (e) { if (sel && !pr.locked && !e.target.closest('[data-cell5d]')) put(sel, L); });
        lanes.appendChild(d);
      });
      holder.appendChild(pool); holder.appendChild(lanes);
      if (!pr.locked) {
        var left = pr.cells.filter(function (cx) { return !pr.place[cx.id]; }).length;
        var b = el('button', 'btn', 'Check'); b.id = 'lanecheck'; b.disabled = left > 0; b.style.marginTop = '8px';
        b.onclick = function () { var n = pr.cells.filter(function (cx) { return pr.place[cx.id] === cx.lane; }).length; pr.good = n === pr.cells.length ? 1 : 0; pr.nRight = n; lock({ place: Object.assign({}, pr.place) }); };
        var row = el('div', 'row'); row.appendChild(b); row.appendChild(el('span', 'hint', left ? left + ' cell' + (left > 1 ? 's' : '') + ' left to place. One try.' : 'Ready. One try.')); holder.appendChild(row);
      } else {
        holder.appendChild(el('div', 'verdict ' + (pr.good ? 'good' : 'bad'), (pr.good ? '✓ All 4 right. ' : '✗ ' + pr.nRight + ' of 4 right. ') + 'Only the score and the two gates decide the lane. ' + (pr.cells.some(function (cx) { return cx.y === 1 && cx.lane === 'pass'; }) ? 'Note: one of these is a real <b>defect</b> that scores below the low gate — it passes with no check. That is the 5% the low gate allows.' : '')));
        holder.appendChild(whyBox(P.reveal, 'Why (tap to open)'));
      }
    }
    function put(id, L) { pr.place[id] = L; sel = null; draw(); }
    draw();
  }
  if (pr.cells && (pr.locked || pr.D)) return go(pr.D || { cells: pr.cells, low: pr.low, high: pr.high });
  holder.appendChild(el('div', 'hint', 'Getting 4 real cells and your gates…'));
  api.jsEval(function (NS, pg) {
    if (!NS.pBlend || !('low' in NS) || !pg) return null;
    var s = NS.pBlend, lo = NS.low, hi = NS.high, idx = s.map(function (v, i) { return i; }).sort(function (a, b) { return s[a] - s[b]; });
    var below = idx.filter(function (i) { return s[i] < lo; }), mid = idx.filter(function (i) { return s[i] >= lo && s[i] < hi; }), top = idx.filter(function (i) { return s[i] >= hi; });
    var a = below.filter(function (i) { return pg.y_val[i] === 1; }).pop(); if (a == null) a = below[below.length - 1];
    var pick = [mid[mid.length - 1], a, top[0], mid[0]].filter(function (i) { return i != null; });
    return { low: lo, high: hi, cells: pick.map(function (i) { return { id: pg.cell_val[i], p: s[i], y: pg.y_val[i], lane: s[i] < lo ? 'pass' : s[i] >= hi ? 'stop' : 'person' }; }) };
  }).then(function (D) { holder.innerHTML = ''; if (D) { pr.low = D.low; pr.high = D.high; } go(D); });
}

/* ================= 5d: the lanes fill ================= */
function lanesFill(r, host, api) {
  if (r.missing) return;
  var c = card(host, 'THE FORK, LIVE — 20 REAL CELLS', 'Each photo dropped into the lane your graph sent it to. Border: red = expert label “defect”, green = good.');
  var g = el('div'); g.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px'; c.appendChild(g);
  var cols = {}; ['pass', 'person', 'stop'].forEach(function (L) { var d = el('div'); d.style.cssText = 'border:1px solid ' + LANE[L][1] + '88;border-radius:10px;padding:5px;min-height:120px;background:#0a0f16'; d.appendChild(el('div', null, '<span style="font-family:Orbitron,Arial;font-size:10px;color:' + LANE[L][1] + '">' + LANE[L][0] + '</span>')); var t = el('div'); t.style.cssText = 'display:flex;flex-wrap:wrap;gap:3px;margin-top:4px'; d.appendChild(t); cols[L] = t; g.appendChild(d); });
  r.twenty.forEach(function (x, k) {
    var cv = photoCanvas(api, x.id, null, 36); cv.style.border = '2px solid ' + (x.y === 1 ? '#ff4d6a' : '#3dffa0'); cv.title = 'cell ' + x.id + ' · score ' + f3(x.p) + ' · ' + x.lane;
    cv.style.opacity = '0'; cv.style.transform = 'translateY(-14px)'; cv.style.transition = 'opacity .3s, transform .3s';
    cols[x.lane].appendChild(cv); setTimeout(function () { cv.style.opacity = '1'; cv.style.transform = 'none'; }, 120 + k * 140);
  });
  var cnt = { pass: 0, person: 0, stop: 0 }; r.twenty.forEach(function (x) { cnt[x.lane]++; });
  tiles(c, [[cnt.pass, 'auto-pass (of 20)', 'g'], [cnt.person, 'to a person', 'a'], [cnt.stop, 'auto-stop', 'r']]);
  c.appendChild(el('div', 'hint', 'Same fork on all ' + r.n + ' validation cells: ' + r.ref.pass + ' pass, ' + r.ref.person + ' person, ' + r.ref.stop + ' stop.'));
  var c2 = card(host, 'YOUR GRAPH — FROM line2.getGraph()', 'Dashed = conditional edge (the fork). The labels are the lanes in your map.');
  c2.appendChild(el('div', null, lineSVG(r.graph.nodes, r.graph.edges, {})));
}

/* ================= 5e: the loop ================= */
function loopView(r, host, api) {
  if (r.missing) return;
  if (r.loop) {
    if (r.recursion && !api.mech.sawLoop) api.setMech({ sawLoop: 1 });
    var c = card(host, r.recursion ? 'ENDLESS LOOP — STOPPED BY LANGGRAPH' : 'LANGGRAPH STOPPED', r.recursion ? 'The first camera fault copy never got a good photo, so it went round and round.' : 'The run stopped with an error.');
    if (r.recursion) {
      var lim = (r.raw.match(/Recursion limit of (\d+)/) || [])[1] || '25';
      var sv = '<svg viewBox="0 0 460 150" style="width:100%;height:auto"><defs><marker id="ahl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ff4d6a"/></marker></defs>' +
        '<rect x="60" y="20" width="130" height="40" rx="8" fill="#0c131d" stroke="#2f8fb0" stroke-width="2"/><text x="125" y="45" text-anchor="middle" fill="#e6eef8" font-family="Space Mono,monospace" font-size="13">check_photo</text>' +
        '<rect x="60" y="96" width="130" height="40" rx="8" fill="#0c131d" stroke="#2f8fb0" stroke-width="2"/><text x="125" y="121" text-anchor="middle" fill="#e6eef8" font-family="Space Mono,monospace" font-size="13">reshoot</text>' +
        '<path id="lp5" d="M190 40 C245 40 245 116 190 116 M60 116 C5 116 5 40 60 40" fill="none" stroke="#ff4d6a" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#ahl)"/>' +
        '<circle r="8" fill="#a98bff" stroke="#fff" stroke-width="2"><animateMotion dur="1.4s" repeatCount="indefinite" path="M190 40 C245 40 245 116 190 116 L60 116 C5 116 5 40 60 40 Z"/></circle>' +
        '<text x="280" y="52" fill="#ff8a9c" font-family="Orbitron,Arial" font-size="15" font-weight="700">' + lim + ' STEPS</text><text x="280" y="76" fill="#c6d2e2" font-family="Rajdhani,Arial" font-size="15">no END in sight →</text><text x="280" y="98" fill="#c6d2e2" font-family="Rajdhani,Arial" font-size="15">LangGraph stops the run:</text><text x="280" y="120" fill="#ffb547" font-family="Space Mono,monospace" font-size="13">GraphRecursionError</text></svg>';
      c.appendChild(el('div', null, sv));
      c.appendChild(el('p', null, 'In plain words: every photo of this copy is bad, every bad photo goes to reshoot, and reshoot goes back to check_photo. Nothing ever reaches END. After ' + lim + ' steps (LangGraph\'s <b>recursion limit</b>) the run is stopped and <b>nothing is recorded</b> for that cell.'));
    } else c.appendChild(el('p', null, esc(window.PGJS.lgFriendly(r.raw) || r.raw.split('\n')[0])));
    var d = el('details'); d.appendChild(el('summary', 'hint', 'Show the raw LangGraph message')); d.appendChild(el('pre', null, esc(r.name + ': ' + r.raw))); d.querySelector('pre').style.cssText = 'white-space:pre-wrap;font-size:12px;background:#0a0f16;border:1px solid #1b2533;border-radius:6px;padding:8px'; c.appendChild(d);
    return;
  }
  var c1 = card(host, 'EVERY CELL REACHED END', 'Real runs of your line3. Each row is the trail of one card (its log).');
  var list = el('div'); c1.appendChild(list);
  api.jsEval(function (NS, pg) { return pg && pg.faultCards ? pg.faultCards().map(function (x) { return x.photo; }) : null; }).then(function (ph) {
    r.trails.forEach(function (t, k) {
      var row = el('div'); row.style.cssText = 'display:flex;gap:10px;align-items:center;padding:6px;border-bottom:1px solid #1b2533';
      row.appendChild(photoCanvas(api, t.fault ? t.fault.of : t.id, t.fault && ph ? ph[k] : null, 44));
      var who = t.fault ? '<b>' + t.id + '</b> camera fault copy: ' + esc(t.fault.what) : t.id === 1896 ? '<b>cell 1896</b> real dead cell (train tray, expert 1.0)' : '<b>cell ' + t.id + '</b> real validation cell';
      var chips = t.path.map(function (s) { return '<span class="tagpill" style="border-color:' + (s === 'reshoot' ? '#ff4d6a' : s === 'human_check' ? '#ffb547' : '#263346') + '">' + esc(s) + '</span>'; }).join('→');
      row.appendChild(el('div', null, '<div style="font-size:14px">' + who + ' · photos taken: <b>' + t.tries + '</b> · ' + (t.problem ? 'photo: ' + esc(t.problem) : 'photo ok') + '</div><div style="font-size:12.5px;margin-top:3px">' + chips + '</div>'));
      list.appendChild(row);
    });
  });
  c1.appendChild(el('div', 'hint', 'Here a reshoot gives back the same photo (one photo per cell; the fault copies stay faulty). On a real line a new shot might come back clean, and the cell would go on to score.'));
  var c2 = card(host, 'YOUR GRAPH — FROM line3.getGraph()', 'The loop check_photo ⇄ reshoot now has a way out.');
  c2.appendChild(el('div', null, lineSVG(r.graph.nodes, r.graph.edges, {})));
}

/* ================= 5f: the human desk ================= */
function humanDesk(r, host, api) {
  if (r.missing) return;
  var m = api.mech; m.dec = m.dec || {};
  var c = card(host, 'YOU ARE THE CHECKER', '5 real flows are paused at human_check. Look at the photo and the Step 4 heat map, then decide. Your button sends Command({ resume }) to that thread.');
  var desk = el('div'); c.appendChild(desk);
  var threadsBox = card(host, 'PAUSED THREADS — LIVE FROM THE CHECKPOINTER', 'Read with line.getState(config) after every answer.');
  var tl = el('div'); threadsBox.appendChild(tl);
  var res = el('div'); host.appendChild(res);
  var busy = false;
  function statuses() {
    return api.jsEval(async function (NS) {
      if (!NS.line || !NS.threads) return null;
      var o = []; for (var i = 0; i < NS.threads.length; i++) { var st = await NS.line.getState(NS.threads[i]); o.push({ thread: NS.threads[i].configurable.thread_id, next: st.next.slice(), decision: st.values.decision, log: st.values.log }); }
      return o;
    });
  }
  function draw(S) {
    desk.innerHTML = ''; tl.innerHTML = '';
    if (!S) { noData(desk, api, 'Run the cell again: the paused flows are not in memory.'); return; }
    r.cells.forEach(function (cx, k) {
      var s = S[k], paused = s && s.next.indexOf('human_check') >= 0, d = m.dec[cx.id];
      var w = el('div'); w.style.cssText = 'display:flex;gap:10px;align-items:center;padding:6px;border-bottom:1px solid #1b2533';
      w.appendChild(photoCanvas(api, cx.id, null, 62));
      if (cx.cam && window.PGViz4) { var hc = window.PGViz4.heatCanvas(api, cx.id, cx.cam, 16, 62); w.appendChild(hc); }
      var info = el('div', null, '<div style="font-size:14px"><b>cell ' + cx.id + '</b> · ' + esc(cx.kind) + ' · score <b>' + f3(cx.p) + '</b></div><div class="hint" style="font-size:12.5px"><code>' + esc(cx.thread) + '</code> ' + (paused ? '<b style="color:#ffb547">paused</b>' : 'done') + '</div>');
      info.style.flex = '1'; w.appendChild(info);
      if (paused) ['pass', 'stop'].forEach(function (a) { var b = el('button', 'btn small', a === 'pass' ? 'Pass' : 'Stop'); b.style.padding = '4px 8px'; b.setAttribute('data-dec', cx.id + ':' + a); b.style.borderColor = LANE[a][1]; b.onclick = function () { decide(k, cx, a); }; w.appendChild(b); });
      else w.appendChild(el('span', 'tagpill', 'you said: <b>' + esc(d || (s && s.decision)) + '</b>'));
      desk.appendChild(w);
      var row = el('div', null, '<code>' + esc(cx.thread) + '</code> ' + (paused ? '<span style="color:#ffb547">⏸ waiting</span>' : '<span style="color:#3dffa0">✓ done → record → END</span>')); row.style.cssText = 'font-size:13.5px;padding:2px 0' + (paused ? '' : ';opacity:.55'); tl.appendChild(row);
    });
    var left = S.filter(function (s) { return s.next.length; }).length;
    threadsBox.querySelector('.sub').textContent = left ? left + ' of 5 flows still paused. Read with line.getState(config) after every answer.' : 'No paused flows left: every thread reached END.';
    res.innerHTML = '';
    if (Object.keys(m.dec).length >= 5 && !left) {
      var right = r.cells.filter(function (cx) { return (m.dec[cx.id] === 'stop') === (cx.y === 1); }).length;
      var rc = card(res, 'YOUR ANSWERS vs THE EXPERT LABELS', 'The labels are shown only now.');
      rc.appendChild(el('div', null, '<table style="width:100%;font-size:14px;border-collapse:collapse">' + '<tr style="color:#8d9bb0"><td>cell</td><td>you</td><td>label</td><td>expert score</td><td></td></tr>' + r.cells.map(function (cx) { var ok = (m.dec[cx.id] === 'stop') === (cx.y === 1); return '<tr><td>' + cx.id + '</td><td>' + m.dec[cx.id] + '</td><td>' + (cx.y ? 'defect' : 'good') + '</td><td>' + cx.prob + '</td><td>' + (ok ? '<b style="color:#3dffa0">✓</b>' : '<b style="color:#ff4d6a">✗</b>') + '</td></tr>'; }).join('') + '</table>'));
      rc.appendChild(el('div', 'verdict ' + (right >= 4 ? 'good' : 'bad'), 'You matched the label on <b>' + right + ' of 5</b>. These are the cells the model was unsure about; ' + r.cells.filter(function (cx) { return cx.prob > 0 && cx.prob < 1; }).length + ' of them were unsure for the experts too (score 0.33 or 0.67).'));
    }
  }
  function decide(k, cx, a) {
    if (busy) return; busy = true;
    api.jsEval(async function (NS) { await NS.decide(NS.threads[k], a); return true; }).then(function () { m.dec[cx.id] = a; api.setMech({ dec: m.dec }); return statuses(); }).then(function (S) { busy = false; draw(S); });
  }
  desk.appendChild(el('div', 'hint', 'Reading the paused threads…'));
  /* after a reload the flows are paused again: answers you already gave are sent again (real Command resume) */
  statuses().then(function (S) {
    if (!S) return draw(S);
    var todo = r.cells.map(function (cx, k) { return [k, cx]; }).filter(function (x) { return m.dec[x[1].id] && S[x[0]] && S[x[0]].next.length; });
    if (!todo.length) return draw(S);
    return api.jsEval(async function (NS) { for (var i = 0; i < todo.length; i++) await NS.decide(NS.threads[todo[i][0]], m.dec[todo[i][1].id]); return true; }).then(statuses).then(draw);
  });
}

/* ================= 5g: the shift board ================= */
function shiftBoard(r, host, api) {
  if (r.missing) return;
  var m = api.mech, A = r.s1, B = r.s2, C = r.s3;
  var c = card(host, 'SHIFT REPORT — FROM THE LOGBOOK', A.n + ' real validation cells, each in its own thread. Counted from the ' + A.rows.length + ' logbook rows.');
  function col(R, title, note) {
    return '<td style="padding:6px;vertical-align:top;border-left:1px solid #1b2533"><div style="font-family:Orbitron,Arial;font-size:10px;letter-spacing:.12em;color:#46e3ff">' + title + '</div><div class="hint" style="font-size:12px">' + note + '</div></td>';
  }
  function row(lab, f, fmt) { return '<tr><td style="padding:4px 6px;color:#8d9bb0">' + lab + '</td>' + [A, B, C].map(function (R) { return '<td style="padding:4px 6px;border-left:1px solid #1b2533;font-family:Space Mono,monospace">' + (fmt ? fmt(f(R)) : f(R)) + '</td>'; }).join('') + '</tr>'; }
  var t = '<table style="width:100%;border-collapse:collapse;font-size:13px"><tr><td></td>' + col(A, 'PERFECT CHECKER', 'the label answers') + col(B, 'RIGHT 9 IN 10', 'seeded what-if') + col(C, 'POLY GATE', 'perfect checker') + '</tr>' +
    row('per 1,000: pass / person / stop', function (R) { return [R.per1000.pass, R.per1000.person, R.per1000.stop].map(Math.round).join(' / '); }) +
    row('defects passed', function (R) { return R.all.defPassed + ' of ' + R.all.def; }) +
    row('good cells stopped', function (R) { return R.all.goodStopped + ' of ' + R.all.good; }) +
    row('wrong person answers', function (R) { return R.all.personWrong + ' of ' + R.all.person; }) +
    row('reshoots', function (R) { return R.reshoots; }) + '</table>';
  c.appendChild(el('div', null, t));
  c.appendChild(el('div', 'hint', 'Perfect checker = the expert label answers every paused flow. Real people are not perfect: the middle column flips 1 answer in 10 (seeded, the same every run). Reshoots: no real validation photo broke the photo rule.'));
  var ap = A.poly, cp = C.poly, am = A.mono;
  var ch = card(host, 'CHALLENGE — A SEPARATE LOW GATE FOR POLY CELLS', 'Poly gate ' + f3(r.lowPoly) + ' instead of ' + f3(r.low) + ' (same 5% rule, on the ' + r.nPolyDef + ' poly defects of the validation tray).');
  tiles(ch, [[ap.defPassed + ' → ' + cp.defPassed, 'poly defects passed (of ' + ap.def + ')', cp.defPassed < ap.defPassed ? 'g' : 'a'], [pc(ap.person / ap.n) + ' → ' + pc(cp.person / cp.n), 'poly cells to a person', 'a'], [Math.round(A.per1000.person) + ' → ' + Math.round(C.per1000.person), 'person checks per 1,000 cells', 'a']]);
  ch.appendChild(el('div', 'verdict', '<b>Honest reading:</b> poly defects passed went from ' + ap.defPassed + ' to ' + cp.defPassed + ' (' + pc(ap.defPassed / ap.def, 1) + ' → ' + pc(cp.defPassed / cp.def, 1) + '); mono stays at ' + am.defPassed + ' of ' + am.def + '. The price: ' + (cp.person - ap.person) + ' more poly cells for a person (' + Math.round(C.per1000.person - A.per1000.person) + ' more checks per 1,000). The gate was tuned on these same cells, so the gain is the best case. ' + (ap.def < 100 ? 'Only ' + ap.def + ' poly defects: one cell more or less moves the rate by ' + pc(1 / ap.def, 1) + '.' : '')));
  // the logbook hunt
  var lb = card(host, 'THE LOGBOOK — PERFECT-CHECKER SHIFT', 'One square per logbook row. Colour = final decision. White dot = the expert label says defect. Find every defect that passed: tap it.');
  var need = A.escapes.length; if (m.need !== need) api.setMech({ need: need });
  m.seen = m.seen || {};
  var grid = el('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(35,1fr);gap:2px'; grid.id = 'logbook5';
  var info = el('div'); info.style.cssText = 'margin-top:8px;min-height:84px';
  A.rows.forEach(function (x) {
    var sq = el('div'), col2 = x[2] === 'pass' ? '#1d6b47' : '#7a2232'; sq.setAttribute('data-row', x[0]);
    sq.style.cssText = 'aspect-ratio:1;border-radius:2px;cursor:pointer;position:relative;background:' + col2 + ';' + (x[1] === 'person' ? 'box-shadow:inset 0 0 0 2px #ffb547;' : '') + (m.seen[x[0]] ? 'outline:2px solid #fff;' : '');
    if (x[3] === 1) sq.innerHTML = '<i style="position:absolute;left:30%;top:30%;width:40%;height:40%;border-radius:50%;background:#fff"></i>';
    sq.title = 'cell ' + x[0];
    sq.onclick = function () { pick(x, sq); };
    grid.appendChild(sq);
  });
  lb.appendChild(grid);
  lb.appendChild(el('div', 'hint', '<span style="color:#3dffa0">■</span> pass  <span style="color:#ff4d6a">■</span> stop  <span style="color:#ffb547">□</span> a person decided  ● defect (label)'));
  var found = el('div', 'hint'); lb.appendChild(found); lb.appendChild(info);
  function showFound() { var n = A.escapes.filter(function (id) { return m.seen[id]; }).length; found.innerHTML = '<b>' + n + ' of ' + need + '</b> defects that passed found.'; }
  function pick(x, sq) {
    var esc1 = x[3] === 1 && x[2] === 'pass';
    if (esc1 && !m.seen[x[0]]) { m.seen[x[0]] = 1; var n = A.escapes.filter(function (id) { return m.seen[id]; }).length; api.setMech({ seen: m.seen, found: n }); sq.style.outline = '2px solid #fff'; showFound(); }
    info.innerHTML = '';
    var w = el('div'); w.style.cssText = 'display:flex;gap:10px;align-items:center';
    w.appendChild(photoCanvas(api, x[0], null, 72));
    w.appendChild(el('div', null, '<div><b>cell ' + x[0] + '</b> · ' + x[4] + ' · score ' + f3(x[6]) + ' · lane <b>' + x[1] + '</b> → decision <b>' + x[2] + '</b> · label <b>' + (x[3] ? 'defect' : 'good') + '</b></div>' +
      '<div class="hint">' + (esc1 ? (x[1] === 'pass' ? 'A defect that scored below the low gate: it passed with no check. These are the 5% the gate allows.' : 'A person said pass.') : x[3] === 1 ? 'A defect that was stopped. Good.' : x[2] === 'stop' ? 'A good cell that was stopped: a false alarm.' : 'A good cell that passed. Fine.') + '</div>'));
    info.appendChild(w);
  }
  showFound();
}
function endCard5(box, api) {
  var r = api.res('5g'); if (!r) return;
  var A = r.s1, C = r.s3, ids = {}, dup = 0; A.rows.forEach(function (x) { if (ids[x[0]]) dup++; ids[x[0]] = 1; });
  box.appendChild(el('div', 'endc', '<h3 class="fh">STEP 5 DONE — WHAT THE FLOW GUARANTEES, AND WHAT IT COSTS</h3><ul>' +
    '<li><b>Every cell gets one written decision:</b> ' + A.rows.length + ' logbook rows for ' + A.n + ' cells' + (dup ? ' (' + dup + ' repeated!)' : ', none repeated') + '.</li>' +
    '<li><b>No flow runs forever:</b> a bad photo gets 2 shots, then a person. LangGraph\'s recursion limit is the last safety net.</li>' +
    '<li><b>Nothing passes unseen by a rule:</b> a cell passes only with a score under the low gate, or a person\'s “pass”.</li>' +
    '<li><b>What it does NOT guarantee:</b> ' + A.all.defPassed + ' of ' + A.all.def + ' defects still passed with a perfect checker (low scores), ' + r.s2.all.defPassed + ' with a checker right 9 in 10.</li>' +
    '<li><b>The cost in people:</b> ' + Math.round(A.per1000.person) + ' person checks per 1,000 cells (' + Math.round(C.per1000.person) + ' with the poly gate).</li></ul>' +
    '<p><b>Next — Step 6:</b> a CrewAI quality crew (inspector, root-cause analyst, shift-report writer) reads this logbook and writes the shift report. The test tray stays sealed until Step 8.</p>' +
    '<p class="hint">All numbers above come from real LangGraph runs in your browser, on the validation tray.</p>'));
}

window.PGViz5 = { wire: sceneWire, cardPlay: cardPlay, cardResult: cardResult, firstTwo: firstTwo, lanesPredict: lanesPredict, lanesFill: lanesFill, loopView: loopView, humanDesk: humanDesk, shiftBoard: shiftBoard, endCard5: endCard5, lineSVG: lineSVG };
})();
