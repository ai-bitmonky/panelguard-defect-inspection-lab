/* PanelGuard Step 6 visuals and hands-on mechanics (the quality crew). Every number shown comes from real tool runs. */
(function () {
'use strict';
var H = function () { return window.PGViz._h; };
function el(t, c, h) { return H().el(t, c, h); }
function card(p, t, s) { return H().card(p, t, s); }
function tiles(p, l) { return H().tiles(p, l); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function drag(tok, onDrop, onTap) { window.PGViz3._dragTok(tok, onDrop, onTap); }
function shake(e) { if (e && e.animate) e.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 }); }
function noData(host, api, what) { host.appendChild(el('div', 'verdict', api.review ? 'Review mode: press “Run up to here” (below the code) to load real data for this page.' : what)); }
function U() { return window.PG_STEP6_UTIL; }

/* ---------- the control room (shared by 6a and 6e) ---------- */
var W6 = [{ key: 'inspector', role: 'Line Inspector', x: 110, col: '#46e3ff' }, { key: 'analyst', role: 'Root-cause Analyst', x: 320, col: '#ffb547' }, { key: 'writer', role: 'Report Writer', x: 530, col: '#a98bff' }];
var TOOLS6 = [['shift_stats', 'inspector'], ['slice_table', 'analyst'], ['worst_cases', 'analyst'], ['action_list', 'writer']];
var DRAWER = { shift_stats: [20, 25], slice_table: [108, 25], worst_cases: [20, 54], action_list: [108, 54] };
function workerOf(role) { return W6.filter(function (w) { return w.role === role; })[0] || W6[/inspector/i.test(role) ? 0 : /analyst/i.test(role) ? 1 : 2]; }
function roomSVG(o) {
  o = o || {};
  var s = '<svg viewBox="0 0 640 300" style="width:100%;height:auto;display:block" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="rw6" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1624"/><stop offset="1" stop-color="#070b12"/></linearGradient>' +
    '<radialGradient id="rg6"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="640" height="300" fill="url(#rw6)"/><rect y="238" width="640" height="62" fill="#0a0f17"/><line x1="0" y1="238" x2="640" y2="238" stroke="#1b2533"/>';
  /* tool wall (left) */
  s += '<rect x="14" y="10" width="186" height="74" rx="8" fill="#0b121c" stroke="#263346"/><text x="107" y="21" text-anchor="middle" font-family="Orbitron,Arial" font-size="8.5" letter-spacing="2" fill="#5d6b80">TOOL WALL</text>';
  TOOLS6.forEach(function (t) { var p = DRAWER[t[0]], hot = o.tool === t[0], c = workerOf(W6.filter(function (w) { return w.key === t[1]; })[0].role).col;
    s += '<g data-drawer="' + t[0] + '"><rect x="' + p[0] + '" y="' + p[1] + '" width="86" height="25" rx="4" fill="' + (hot ? '#1d2a12' : '#0e1622') + '" stroke="' + (hot ? '#3dffa0' : c + '88') + '" stroke-width="' + (hot ? 2 : 1) + '"/>' +
      '<text x="' + (p[0] + 43) + '" y="' + (p[1] + 17) + '" text-anchor="middle" font-family="Space Mono,monospace" font-size="12" fill="' + (hot ? '#3dffa0' : '#c6d2e2') + '">' + t[0] + '</text></g>'; });
  /* wall screen (middle) + report tray (right) */
  s += '<rect x="226" y="10" width="188" height="74" rx="8" fill="#06131a" stroke="#1f6b80"/><text x="320" y="28" text-anchor="middle" font-family="Orbitron,Arial" font-size="9" letter-spacing="2" fill="#46e3ff">SHIFT END · QUALITY</text>' +
    '<text x="320" y="52" text-anchor="middle" font-family="Rajdhani,Arial" font-size="17" font-weight="700" fill="#e6eef8">' + esc(o.screen || 'control room') + '</text>' +
    '<text x="320" y="73" text-anchor="middle" font-family="Rajdhani,Arial" font-size="14" fill="#8d9bb0">' + esc(o.screen2 || '') + '</text>';
  s += '<rect x="440" y="10" width="186" height="74" rx="8" fill="#0b121c" stroke="#263346"/><text x="533" y="21" text-anchor="middle" font-family="Orbitron,Arial" font-size="8.5" letter-spacing="2" fill="#5d6b80">REPORT TRAY</text>' +
    '<rect x="498" y="30" width="70" height="46" rx="3" fill="' + (o.report ? '#e6eef8' : '#141c28') + '" stroke="#3a4658"/>' + (o.report ? '<line x1="506" y1="40" x2="560" y2="40" stroke="#5d6b80"/><line x1="506" y1="48" x2="554" y2="48" stroke="#5d6b80"/><line x1="506" y1="56" x2="560" y2="56" stroke="#5d6b80"/><line x1="506" y1="64" x2="540" y2="64" stroke="#5d6b80"/>' : '<text x="533" y="58" text-anchor="middle" font-family="Rajdhani,Arial" font-size="11" fill="#5d6b80">empty</text>');
  /* a line from the active worker to the drawer of its tool */
  if (o.tool && o.active) { var aw = workerOf(o.active), dp = DRAWER[o.tool]; if (dp) s += '<path d="M' + aw.x + ' 128 Q ' + ((aw.x + dp[0] + 43) / 2) + ' 96 ' + (dp[0] + 43) + ' ' + (dp[1] + 25) + '" fill="none" stroke="#3dffa0" stroke-width="2" stroke-dasharray="5 4"><animate attributeName="stroke-dashoffset" from="18" to="0" dur=".8s" repeatCount="indefinite"/></path>'; }
  W6.forEach(function (w) {
    var on = o.active === w.role, dim = o.active && !on, x = w.x, c = w.col;
    s += '<g data-worker="' + w.key + '" style="cursor:' + (o.click ? 'pointer' : 'default') + ';opacity:' + (dim ? 0.55 : 1) + '">';
    if (on) s += '<circle cx="' + x + '" cy="160" r="62" fill="url(#rg6)" opacity=".5"/>';
    if (o.tap === w.role) s += '<circle cx="' + x + '" cy="160" r="50" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 5"><animate attributeName="r" values="46;54;46" dur="1.4s" repeatCount="indefinite"/></circle>';
    s += '<rect x="' + (x - 74) + '" y="216" width="148" height="12" rx="3" fill="#1b2533"/><rect x="' + (x - 66) + '" y="228" width="8" height="30" fill="#141c28"/><rect x="' + (x + 58) + '" y="228" width="8" height="30" fill="#141c28"/>' +
      '<rect x="' + (x + 18) + '" y="180" width="44" height="32" rx="3" fill="#0b1520" stroke="' + c + '88"/><rect x="' + (x + 36) + '" y="212" width="8" height="5" fill="#263346"/>' +
      '<path d="M' + (x - 30) + ' 216 Q ' + (x - 30) + ' 176 ' + x + ' 174 Q ' + (x + 30) + ' 176 ' + (x + 30) + ' 216 Z" fill="' + c + '" opacity=".85"/>' +
      '<circle cx="' + x + '" cy="150" r="18" fill="#e9d2b8"/><path d="M' + (x - 18) + ' 147 Q ' + x + ' 124 ' + (x + 18) + ' 147 Q ' + x + ' 136 ' + (x - 18) + ' 147 Z" fill="#2a1d15"/>' +
      '<circle cx="' + (x - 6) + '" cy="152" r="2" fill="#1b1b1b"/><circle cx="' + (x + 6) + '" cy="152" r="2" fill="#1b1b1b"/>' + (on ? '<path d="M' + (x - 5) + ' 159 Q ' + x + ' 163 ' + (x + 5) + ' 159" stroke="#1b1b1b" stroke-width="1.5" fill="none"/>' : '<line x1="' + (x - 4) + '" y1="160" x2="' + (x + 4) + '" y2="160" stroke="#1b1b1b" stroke-width="1.5"/>') +
      '<rect x="' + (x - 92) + '" y="260" width="184" height="30" rx="15" fill="#0b121c" stroke="' + c + '"/><text x="' + x + '" y="281" text-anchor="middle" font-family="Rajdhani,Arial" font-size="19" font-weight="700" fill="' + c + '">' + esc(w.role) + '</text>';
    if (o.tap === w.role) s += '<g><rect x="' + (x - 22) + '" y="98" width="44" height="18" rx="9" fill="#fff"/><text x="' + x + '" y="111" text-anchor="middle" font-family="Orbitron,Arial" font-size="10" font-weight="900" fill="#05070b">TAP</text></g>';
    s += '</g>';
  });
  return s + '</svg>';
}

/* ================= 6a: give each worker its tools and its job ================= */
var CARDS6 = [
  { id: 'shift_stats', kind: 'tool', text: 'shift_stats — counts of the logbook', to: 'inspector' },
  { id: 'slice_table', kind: 'tool', text: 'slice_table — mistakes per group', to: 'analyst' },
  { id: 'worst_cases', kind: 'tool', text: 'worst_cases — missed defects, false alarms', to: 'analyst' },
  { id: 'action_list', kind: 'tool', text: 'action_list — your 4f action boxes', to: 'writer' },
  { id: 'job_facts', kind: 'job', text: 'Job: state the shift facts', to: 'inspector' },
  { id: 'job_causes', kind: 'job', text: 'Job: find where failures cluster', to: 'analyst' },
  { id: 'job_report', kind: 'job', text: 'Job: write the one-page report', to: 'writer' },
  { id: 'make_up', kind: 'bad', text: 'Tool: make up a round number if a fact is missing', to: null }];
var WHY6 = {
  inspector: 'The inspector only states the shift facts. Counting the logbook is its tool; groups, causes and the report belong to the others.',
  analyst: 'The analyst looks for weak spots: it needs the mistakes per group and the worst cases, not the raw shift counts or the action boxes.',
  writer: 'The writer writes the report from the others\' answers plus your action list. It does not count the logbook or the groups itself.' };
function sceneHire(s, stage, out, api) {
  var m = api.mech; m.put = m.put || {}; var sel = null, msg = null;
  function draw() {
    stage.innerHTML = '';
    stage.appendChild(el('div', 'hint', '<div style="padding:10px 12px 0">Drag each card onto a worker (or tap a card, then a worker). Each worker gets its <b>tools</b> (what it can look up) and its <b>job</b>. Wrong cards are refused with a reason.</div>'));
    var wrap = el('div'); wrap.style.cssText = 'position:relative;margin:6px 10px 0'; wrap.id = 'room6a';
    wrap.innerHTML = roomSVG({ click: true, screen: Object.keys(m.put).length + ' of 7 cards given', screen2: 'tools + jobs' });
    W6.forEach(function (w) {
      var d = el('div'); d.setAttribute('data-drop', w.key); d.id = 'drop6a-' + w.key;
      d.style.cssText = 'position:absolute;left:' + ((w.x - 92) / 6.4) + '%;width:' + (184 / 6.4) + '%;top:' + (96 / 3) + '%;height:' + (148 / 3) + '%;border-radius:12px;border:1px dashed ' + (sel ? w.col : 'transparent') + ';display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:2px;padding:2px 2px 34px;cursor:' + (sel ? 'pointer' : 'default');
      CARDS6.forEach(function (c) { if (m.put[c.id] === w.key) d.appendChild(el('div', null, '<span style="display:inline-block;font-size:10.5px;padding:1px 5px;border-radius:6px;background:#05070bcc;border:1px solid ' + w.col + ';color:' + (c.kind === 'tool' ? '#3dffa0' : '#e6eef8') + '">' + esc(c.kind === 'tool' ? '⚙ ' + c.id : '✎ ' + c.text.replace('Job: ', '')) + '</span>')); });
      d.addEventListener('click', function () { if (sel) tryPut(sel, w.key); });
      wrap.appendChild(d);
    });
    stage.appendChild(wrap);
    var pool = el('div'); pool.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px';
    CARDS6.forEach(function (c) {
      if (m.put[c.id]) return;
      var b = el('div', null, esc(c.text)); b.setAttribute('data-card6', c.id);
      b.style.cssText = 'font-size:13.5px;padding:6px 10px;border-radius:8px;cursor:grab;background:' + (c.kind === 'job' ? '#141028' : '#0c1a14') + ';border:1px ' + (sel === c.id ? 'solid #fff' : 'dashed ' + (c.kind === 'job' ? '#a98bff' : '#3dffa0')) + (c.kind === 'bad' && m.refusedBad ? ';text-decoration:line-through;opacity:.55' : '');
      drag(b, function (d) { tryPut(c.id, d); }, function () { sel = sel === c.id ? null : c.id; draw(); });
      pool.appendChild(b);
    });
    if (!pool.children.length) pool.appendChild(el('span', 'hint', 'All cards given.'));
    stage.appendChild(pool);
    var foot = el('div'); foot.style.cssText = 'padding:0 12px 12px;min-height:40px'; stage.appendChild(foot);
    if (msg) foot.appendChild(el('div', 'verdict ' + (msg[0] ? 'good' : 'bad'), esc(msg[1]))).id = 'hiremsg';
    side();
  }
  function tryPut(id, to) {
    var c = CARDS6.filter(function (x) { return x.id === id; })[0]; sel = null;
    if (!c || !to || !WHY6[to]) { draw(); return; }
    if (c.kind === 'bad') { msg = [0, 'Refused: numbers come from tools, never from the model. A worker that cannot find a fact must say “not known”.']; m.refused = (m.refused || 0) + 1; m.refusedBad = 1; }
    else if (c.to !== to) { msg = [0, 'Not this worker: ' + WHY6[to]]; m.refused = (m.refused || 0) + 1; }
    else { m.put[id] = to; msg = [1, (c.kind === 'tool' ? 'Tool ' + c.id : c.text) + ' → ' + W6.filter(function (w) { return w.key === to; })[0].role + ' ✓']; }
    var done = CARDS6.every(function (x) { return x.kind === 'bad' || m.put[x.id] === x.to; });
    api.setMech({ put: m.put, refused: m.refused || 0, refusedBad: m.refusedBad || 0, done: m.done || done });
    draw(); if (!msg[0]) shake(stage.querySelector('#room6a'));
  }
  function side() {
    out.innerHTML = '';
    var c = card(out, 'THE CREW', 'Three workers, one after another. Each can call only its own tools.');
    W6.forEach(function (w) {
      var tl = CARDS6.filter(function (x) { return x.kind === 'tool' && m.put[x.id] === w.key; }).map(function (x) { return '<code>' + x.id + '</code>'; }).join(' ') || '<span class="hint">no tools yet</span>';
      var jb = CARDS6.filter(function (x) { return x.kind === 'job' && m.put[x.id] === w.key; }).map(function (x) { return esc(x.text.replace('Job: ', '')); }).join('') || '<span class="hint">no job yet</span>';
      c.appendChild(el('div', null, '<div style="padding:5px 0;border-bottom:1px solid #1b2533"><b style="color:' + w.col + '">' + w.role + '</b><br>tools: ' + tl + '<br>job: ' + jb + '</div>'));
    });
    tiles(c, [[Object.keys(m.put).length + ' / 7', 'cards given', m.done ? 'g' : 'a'], [m.refused || 0, 'cards refused', '']]);
    if (m.done) c.appendChild(el('div', 'verdict good', '<b>The crew is set.</b> In code: a tool is <code>tool({...})</code> (6b), a worker is <code>new Agent({...})</code> (6c), a job is <code>new Task({...})</code> (6d).'));
    else c.appendChild(el('p', 'hint', 'Ask: what does this worker need to LOOK UP to do its job?'));
  }
  draw();
}

/* ================= 6b: the call panel ================= */
function numsHtml(obj) {   /* pretty JSON with every number highlighted */
  return esc(JSON.stringify(obj, null, 1)).replace(/(:\s|\[|,\s?|^)(-?\d+(?:\.\d+)?)(?=[,\n\]}]|$)/gm, function (m0, a, n) { return a + '<b style="color:#3dffa0">' + n + '</b>'; });
}
function toolPanel(r, host, api) {
  if (r.missing) return;
  var m = api.mech; m.called = m.called || {};
  var c = card(host, 'CALL PANEL — CALL A TOOL BY HAND', 'This is what a worker\'s model gets back when it calls the tool. Press CALL on each one.');
  var grid = el('div'); grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px'; c.appendChild(grid);
  var res = el('div'); res.id = 'callres6'; res.style.marginTop = '8px'; c.appendChild(res);
  var keys = [['shiftStats', 'shift_stats'], ['sliceTable', 'slice_table'], ['worstCases', 'worst_cases'], ['actionList', 'action_list']];
  function draw() {
    grid.innerHTML = '';
    keys.forEach(function (k) {
      var on = m.called[k[1]], w = el('div'); w.style.cssText = 'border:1px solid ' + (on ? '#1f6b44' : '#263346') + ';border-radius:10px;padding:6px 8px;background:#0a1019';
      w.appendChild(el('div', null, '<code style="color:#3dffa0">' + k[1] + '</code>' + (on ? ' <span style="color:#3dffa0">✓</span>' : '')));
      var b = el('button', 'btn small', '▶ CALL'); b.setAttribute('data-call6', k[1]); b.style.marginTop = '4px'; b.onclick = function () { call(k); }; w.appendChild(b);
      grid.appendChild(w);
    });
  }
  function call(k) {
    res.innerHTML = '<div class="hint">calling ' + k[1] + '()…</div>';
    api.jsEval(function (NS) { var t = NS[k[0]]; if (!t) return null; var t0 = performance.now(), o = t.run(); return { out: o, desc: t.description, ms: performance.now() - t0 }; }).then(function (x) {
      res.innerHTML = '';
      if (!x) { noData(res, api, 'Run the cell again: the tool is not in memory.'); return; }
      m.called[k[1]] = 1; api.setMech({ called: m.called }); draw();
      var rc = el('div'); rc.style.cssText = 'border:1px solid #1f6b44;border-radius:10px;padding:8px;background:#06140e';
      rc.appendChild(el('div', null, '<b>' + k[1] + '()</b> → result <span class="hint">(' + x.ms.toFixed(1) + ' ms, real lab data)</span>'));
      rc.appendChild(el('div', 'hint', 'description the model reads: “' + esc(x.desc) + '”'));
      var pre = el('pre', null, numsHtml(x.out)); pre.style.cssText = 'white-space:pre-wrap;font-size:12px;max-height:260px;overflow:auto;margin:6px 0 0;font-family:Space Mono,monospace'; rc.appendChild(pre);
      res.appendChild(rc);
    });
  }
  draw();
  var o = r.out || {};
  tiles(host, [[o.defects_passed + ' of ' + o.defects, 'defects passed (logbook)', o.defects_passed_per_100 <= 5 ? 'g' : 'r'], [o.defects_passed_per_100, 'per 100 · target ≤ 5', o.defects_passed_per_100 <= 5 ? 'g' : 'r'], [o.person_checks, 'person checks', 'a']]);
}

/* ================= 6c: ID badges + the prompt they become ================= */
function badges(r, host, api) {
  if (r.missing) return;
  var m = api.mech; m.read = m.read || {}; var open = m.open == null ? null : m.open;
  var c = card(host, 'ID BADGES — TAP ONE', 'Each badge turns into the exact text its model is given before every job.');
  var row = el('div'); row.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px'; c.appendChild(row);
  var view = el('div'); view.id = 'prompt6'; host.appendChild(view);
  function draw() {
    row.innerHTML = '';
    r.agents.forEach(function (a, i) {
      var w = workerOf(a.role), b = el('div'); b.setAttribute('data-badge6', i);
      b.style.cssText = 'cursor:pointer;border-radius:10px;overflow:hidden;border:2px solid ' + (open === i ? '#fff' : w.col) + ';background:#0b121c;text-align:center;transition:transform .2s;' + (open === i ? 'transform:translateY(-3px)' : '');
      b.innerHTML = '<div style="height:10px;background:' + w.col + '"></div><div style="width:34px;height:34px;border-radius:50%;background:#e9d2b8;margin:6px auto 2px;border:3px solid ' + w.col + '"></div>' +
        '<div style="font-family:Rajdhani,Arial;font-weight:700;font-size:14px;color:' + w.col + ';line-height:1.1;padding:0 4px">' + esc(a.role) + '</div>' +
        '<div style="font-size:11px;padding:3px 4px 6px">' + a.tools.map(function (t) { return '<span class="tagpill" style="border-color:#1f6b44;color:#3dffa0;margin:1px">' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<div style="font-size:10px;color:#8d9bb0;padding-bottom:5px">' + (m.read[i] ? '✓ read' : 'tap to read') + '</div>';
      b.onclick = function () { open = i; m.read[i] = 1; api.setMech({ read: m.read, open: i }); draw(); };
      row.appendChild(b);
    });
    view.innerHTML = '';
    if (open == null) { view.appendChild(el('div', 'hint', 'Tap a badge.')); return; }
    var a = r.agents[open], w = workerOf(a.role), toolsPart = a.prompt.slice(('You are ' + a.role + '. ' + a.backstory + '\nYour personal goal is: ' + a.goal).length);
    var pc = card(view, 'WHAT THE MODEL OF “' + esc(a.role).toUpperCase() + '” IS GIVEN', 'Word for word (the system message). Colours show which field each part came from.');
    var span = function (t, col, lab) { return '<span title="' + lab + '" style="background:' + col + '22;border-bottom:2px solid ' + col + '">' + esc(t) + '</span>'; };
    var pre = el('pre', null, 'You are ' + span(a.role, w.col, 'role') + '. ' + span(a.backstory, '#c58bff', 'backstory') + '\nYour personal goal is: ' + span(a.goal, '#ffcf6b', 'goal') + span(toolsPart, '#3dffa0', 'tools'));
    pre.style.cssText = 'white-space:pre-wrap;font-size:11.5px;line-height:1.45;max-height:300px;overflow:auto;background:#05080d;border:1px solid #1b2533;border-radius:8px;padding:8px;margin:0;font-family:Space Mono,monospace';
    pc.appendChild(el('div', null, '<span class="tagpill" style="border-color:' + w.col + '">role</span><span class="tagpill" style="border-color:#c58bff">backstory</span><span class="tagpill" style="border-color:#ffcf6b">goal</span><span class="tagpill" style="border-color:#3dffa0">tools</span>'));
    pc.appendChild(pre);
    pc.appendChild(el('div', 'hint', 'Then each job adds its own text (“Current Task: …”, the expected output and the context). The same words are built by real CrewAI 1.15 — the Python twin checks it. The scripted model only uses the role name to pick a sentence pattern; a real model (6g) reads it all.'));
  }
  draw();
}

/* ================= 6d: predict which lines will be missing (new format: tap each line filled / missing) ================= */
function blanksPredict(body, api, pr, lock, whyBox, P) {
  var holder = el('div'); body.appendChild(holder);
  var F = U().FIELDS;
  function go(D) {
    holder.innerHTML = '';
    if (!D) { holder.appendChild(el('div', 'hint', api.review ? 'Review mode: press “Run up to here” on 6d to load the workers.' : 'Run 6c first: the prediction uses your workers.')); return; }
    pr.ans = pr.ans || {}; pr.truth = pr.truth || D.truth; pr.wtools = pr.wtools || D.tools;
    holder.appendChild(el('div', 'hint', 'The writer\'s tools: <b>' + pr.wtools.join(', ') + '</b>. Context: <b>none</b>. Tap a line to switch it between FILLED and MISSING.'));
    var sheet = el('div'); sheet.style.cssText = 'background:#e9eef5;color:#16202c;border-radius:6px;padding:10px 12px;margin-top:6px;font-family:Space Mono,monospace;font-size:13px;max-width:560px';
    sheet.appendChild(el('div', null, '<b>SHIFT QUALITY REPORT — for the plant manager</b>'));
    F.forEach(function (f) {
      var a = pr.locked ? pr.val[f[0]] : pr.ans[f[0]], t = pr.truth[f[0]];
      var line = el('div'); line.setAttribute('data-line6', f[0]);
      line.style.cssText = 'margin-top:6px;padding:5px 8px;border-radius:5px;cursor:' + (pr.locked ? 'default' : 'pointer') + ';display:flex;gap:8px;align-items:center;border:2px ' + (a ? 'solid ' + (a === 'filled' ? '#1f9b60' : '#c0392b') : 'dashed #8d9bb0') + ';background:' + (a === 'filled' ? '#d6f5e5' : a === 'missing' ? '#f8dcdc' : '#fff');
      line.innerHTML = '<span style="flex:1">' + esc(f[1]) + '</span><b style="font-size:11px;color:' + (a === 'filled' ? '#1f7a4d' : a === 'missing' ? '#a0302a' : '#5d6b80') + '">' + (a ? a.toUpperCase() : 'tap') + '</b>' +
        (pr.locked ? '<b style="font-size:12px;color:' + ((a === 'filled') === t ? '#1f7a4d' : '#a0302a') + '">' + ((a === 'filled') === t ? '✓' : '✗ ' + (t ? 'filled' : 'missing')) + '</b>' : '');
      if (!pr.locked) line.onclick = function () { pr.ans[f[0]] = pr.ans[f[0]] === 'filled' ? 'missing' : 'filled'; go(D); };
      sheet.appendChild(line);
    });
    holder.appendChild(sheet);
    if (!pr.locked) {
      var left = F.filter(function (f) { return !pr.ans[f[0]]; }).length;
      var b = el('button', 'btn', 'Check'); b.id = 'blankcheck'; b.disabled = left > 0; b.style.marginTop = '8px';
      b.onclick = function () { var n = F.filter(function (f) { return (pr.ans[f[0]] === 'filled') === pr.truth[f[0]]; }).length; pr.nRight = n; pr.good = n === F.length ? 1 : 0; lock(Object.assign({}, pr.ans)); };
      var row = el('div', 'row'); row.appendChild(b); row.appendChild(el('span', 'hint', left ? left + ' line' + (left > 1 ? 's' : '') + ' left. One try.' : 'Ready. One try.')); holder.appendChild(row);
    } else {
      holder.appendChild(el('div', 'verdict ' + (pr.good ? 'good' : 'bad'), (pr.good ? '✓ All 4 right. ' : '✗ ' + pr.nRight + ' of 4 right. ') + 'Only lines that come from the writer\'s own tool (' + esc(pr.wtools.join(', ')) + ') can be filled. Run 1 below shows the real report.'));
      holder.appendChild(whyBox(P.reveal, 'Why (tap to open)'));
    }
  }
  if (pr.truth) return go({ truth: pr.truth, tools: pr.wtools });
  holder.appendChild(el('div', 'hint', 'Reading your workers…'));
  api.jsEval(function (NS) { if (!NS.writer || !NS.writer.tools) return null; var t = NS.writer.tools.map(function (x) { return x.name; }), o = {}; U().FIELDS.forEach(function (f) { o[f[0]] = t.indexOf(f[2]) >= 0; }); return { truth: o, tools: t }; }).then(go);
}
function reportSheet(text, opt) {
  opt = opt || {};
  var d = el('div'); d.style.cssText = 'background:#e9eef5;color:#16202c;border-radius:6px;padding:10px 12px;font-family:Space Mono,monospace;font-size:12.5px;line-height:1.5;white-space:pre-wrap';
  d.innerHTML = String(text || '').split('\n').map(function (l) {
    var t = esc(l);
    if (opt.mark) t = opt.mark(l, t);
    if (/not known/.test(l)) return '<div style="background:#f8dcdc;color:#8a1f1a;border-left:4px solid #c0392b;padding-left:6px">' + t + '</div>';
    if (/^\[?removed|\[removed\]/.test(l)) t = t.replace(/\[removed\]/g, '<b style="background:#ffe2a8;color:#7a4b00">[removed]</b>');
    return '<div' + (/^(SHIFT|WHERE FAILURES|SHIFT FACTS)/.test(l) ? ' style="font-weight:700"' : '') + '>' + t + '</div>';
  }).join('');
  return d;
}
function orderView(r, host, api) {
  if (r.missing) return;
  var poor = r.order[0] === 'writeReport';
  if (poor && !(r.fields.result && r.fields.cost && r.fields.where) && !api.mech.sawPoor) api.setMech({ sawPoor: 1 });
  var c = card(host, poor ? 'RUN 1 — WRITER FIRST (WRONG ON PURPOSE)' : 'THE JOBS, IN THE ORDER THEY RAN', 'Real kickoff with the scripted model. Each box says what the job could read.');
  var row = el('div'); row.style.cssText = 'display:flex;gap:4px;align-items:stretch'; c.appendChild(row);
  r.outs.forEach(function (o, i) {
    var w = workerOf(o.agent), nm = r.order[i], ctxs = nm === 'writeReport' ? (r.ctx == null ? 'all earlier jobs' : r.ctx.length ? r.ctx.join(', ') : 'nothing') : nm === 'findCauses' ? 'inspectShift' : 'nothing';
    var ran = r.trace.filter(function (e) { return e.task === i && e.type === 'tool_call'; }).map(function (e) { return e.tool; });
    if (i) row.appendChild(el('div', null, '<div style="padding-top:26px;color:#5d6b80">→</div>'));
    row.appendChild(el('div', null, '<div style="border:1px solid ' + w.col + ';border-radius:10px;padding:6px;background:#0a1019;font-size:12.5px;flex:1;min-height:92px"><b style="color:' + w.col + '">' + (i + 1) + '. ' + esc(o.agent) + '</b><br><code>' + esc(nm) + '</code><br>reads: <b>' + esc(ctxs) + '</b><br>tools: ' + esc(ran.join(', ') || '—') + '</div>'));
    row.lastChild.style.flex = '1';
  });
  var rc = card(host, 'THE WRITER\'S REPORT', poor ? 'Red lines = “not known”: the writer had no facts for them.' : 'Every line filled. Numbers come from the tools of the earlier workers.');
  rc.appendChild(reportSheet(r.report));
  var F = U().FIELDS, miss = F.filter(function (f) { return !r.fields[f[0]]; });
  tiles(rc, [[F.length - miss.length + ' / ' + F.length, 'lines filled', miss.length ? 'r' : 'g'], [miss.length, 'lines “not known”', miss.length ? 'r' : 'g']]);
  var pr = api.pred; if (poor && pr && pr.locked && pr.val) { var n = F.filter(function (f) { return (pr.val[f[0]] === 'filled') === !!r.fields[f[0]]; }).length; rc.appendChild(el('div', 'verdict ' + (n === F.length ? 'good' : 'bad'), 'Your prediction matched ' + n + ' of ' + F.length + ' lines of this real report.')); }
}

/* ================= 6e: the control room trace (tap through it) ================= */
function bubbleOf(e) {
  var t = e.type;
  if (t === 'task_start') return { cls: 'job', head: 'NEW JOB', body: e.text };
  if (t === 'note') return { cls: 'note', head: 'NOTE', body: e.text };
  if (t === 'thought') return { cls: 'thought', head: 'THINKS', body: e.text };
  if (t === 'tool_call') return { cls: 'call', head: 'CALLS A TOOL', body: e.tool + '()' };
  if (t === 'tool_result') { var x = e.result, lines = [];
    if (x && typeof x === 'object') { if (x.groups) Object.keys(x.groups).forEach(function (g) { lines.push(g + ': ' + x.groups[g].defects_passed + ' of ' + x.groups[g].defects + ' passed'); });
      else if (x.missed_defects) { lines.push('missed defects: ' + x.missed_count); x.missed_defects.slice(0, 3).forEach(function (z) { lines.push('cell ' + z.cell + ' · score ' + z.score + ' · expert ' + z.expert_score); }); lines.push('false alarms: ' + x.false_alarm_count); }
      else if (x.boxes) { lines.push('sorted: ' + x.sorted); x.boxes.forEach(function (b) { lines.push(b.count + ' · ' + b.box.toLowerCase()); }); }
      else Object.keys(x).forEach(function (k) { if (typeof x[k] === 'number') lines.push(k + ': ' + x[k]); else if (x[k] && typeof x[k] === 'object') lines.push(k + ': ' + Object.keys(x[k]).map(function (q) { return q + ' ' + x[k][q]; }).join(', ')); }); }
    else lines.push(String(x));
    return { cls: 'result', head: e.tool + ' → RESULT', body: lines.slice(0, 7).join('\n') }; }
  if (t === 'answer') { var L = String(e.text).split('\n'); return { cls: 'answer', head: 'ANSWERS', body: L.slice(0, 3).join('\n') + (L.length > 3 ? '\n… (' + (L.length - 3) + ' more lines)' : '') }; }
  if (t === 'guardrail') return { cls: e.ok ? 'result' : 'bad', head: e.ok ? 'CHECK PASSED' : 'CHECK FAILED', body: e.text };
  if (t === 'sent_back') return { cls: 'bad', head: 'SENT BACK', body: e.text };
  return { cls: 'note', head: t, body: e.text };
}
var BCOL = { job: ['#06131a', '#46e3ff'], note: ['#141c28', '#8d9bb0'], thought: ['#141028', '#a98bff'], call: ['#2a1f05', '#ffb547'], result: ['#06140e', '#3dffa0'], answer: ['#f2f6fb', '#ffffff'], bad: ['#2a0e16', '#ff4d6a'] };
function controlRoom(r, host, api) {
  if (r.missing) return;
  var m = api.mech, ev = r.trace, k = Math.min(m.tk == null ? -1 : m.tk, ev.length - 1);
  var c = card(host, 'THE CONTROL ROOM — THE REAL TRACE', ev.length + ' steps recorded by step_callback. Tap the glowing worker for the next message.');
  var PAD = 104, wrap = el('div'); wrap.style.cssText = 'position:relative;padding-top:' + PAD + 'px'; wrap.id = 'room6e'; c.appendChild(wrap);
  var ctrl = el('div', 'row'); c.appendChild(ctrl);
  var rep = el('div'); host.appendChild(rep);
  function nextRole() { var n = ev[k + 1]; return n ? n.agent : null; }
  function draw() {
    var e = ev[k] || null, done = k >= ev.length - 1, jobs = ev.filter(function (x, i) { return i <= k && x.type === 'answer'; }).length;
    wrap.innerHTML = roomSVG({ click: true, active: e ? e.agent : null, tap: done ? null : nextRole(), tool: e && (e.type === 'tool_call' || e.type === 'tool_result') ? e.tool : null, report: done,
      screen: e ? 'job ' + (e.task + 1) + ' of ' + r.outs.length + ' · ' + workerOf(e.agent).role : 'press the glowing worker', screen2: 'message ' + (k + 1) + ' of ' + ev.length + ' · ' + jobs + ' answers' });
    if (e) {
      var b = bubbleOf(e), w = workerOf(e.agent), col = BCOL[b.cls] || BCOL.note, light = b.cls === 'answer';
      var bb = el('div'); bb.id = 'bubble6';
      bb.style.cssText = 'position:absolute;top:' + PAD + 'px;left:' + (w.x / 6.4) + '%;transform:translate(' + (w.x < 200 ? '-18%' : w.x > 440 ? '-82%' : '-50%') + ',-100%);max-width:76%;min-width:210px;padding:6px 9px;border-radius:12px;font-size:12px;line-height:1.35;white-space:pre-wrap;' +
        'background:' + col[0] + ';color:' + (light ? '#16202c' : '#e6eef8') + ';border:' + (b.cls === 'thought' ? '2px dashed ' : '2px solid ') + col[1] + ';box-shadow:0 4px 18px #000a;z-index:2;cursor:pointer';
      bb.innerHTML = '<div style="font-family:Orbitron,Arial;font-size:9px;letter-spacing:.12em;color:' + (light ? '#5b48a0' : col[1]) + ';margin-bottom:2px">' + esc(w.role.toUpperCase()) + ' · ' + esc(b.head) + '</div>' + esc(b.body) +
        '<i style="position:absolute;bottom:-9px;left:' + (w.x < 200 ? '18%' : w.x > 440 ? '82%' : '50%') + ';width:14px;height:14px;background:' + col[0] + ';border-right:2px solid ' + col[1] + ';border-bottom:2px solid ' + col[1] + ';transform:translateX(-50%) rotate(45deg)"></i>';
      bb.onclick = step; wrap.appendChild(bb);
      var svH = wrap.querySelector('svg').getBoundingClientRect().height || 200, hy = svH * (e.type === 'task_start' ? 0.31 : 0.39), pad = Math.max(PAD, bb.offsetHeight + 14 - hy);
      wrap.style.paddingTop = pad + 'px'; bb.style.top = (pad + hy) + 'px';
    }
    wrap.querySelector('svg').addEventListener('click', function (ev2) { var g = ev2.target.closest && ev2.target.closest('[data-worker]'); if (g && !done && workerOf(nextRole()).key === g.getAttribute('data-worker')) step(); else if (g) shake(wrap); });
    ctrl.innerHTML = '';
    var back = el('button', 'btn small', '↺ From the start'); back.onclick = function () { k = -1; api.setMech({ tk: k }); draw(); };
    var nb = el('button', 'btn small', done ? 'Trace done ✓' : 'Next message →'); nb.id = 'next6e'; nb.disabled = done; nb.onclick = step;
    ctrl.appendChild(nb); ctrl.appendChild(back); ctrl.appendChild(el('span', 'hint', done ? 'All ' + ev.length + ' messages seen.' : 'next: ' + (ev[k + 1] ? workerOf(ev[k + 1].agent).role + ' · ' + bubbleOf(ev[k + 1]).head.toLowerCase() : '')));
    rep.innerHTML = '';
    if (done || m.traceEnd) {
      var rc = card(rep, 'THE FINISHED REPORT — FOR THE PLANT MANAGER', 'shiftResult.raw: the writer\'s answer. ' + r.outs.length + ' jobs, ' + r.trace.filter(function (x) { return x.type === 'tool_call'; }).length + ' tool calls, scripted model.');
      rc.appendChild(reportSheet(r.raw));
      rc.appendChild(el('div', 'hint', 'Made by the scripted model: rules that call the tools and fill sentence patterns. It is not a language model. 6f checks every number; 6g lets you try a real model.'));
    }
  }
  function step() { if (k >= ev.length - 1) return; k++; api.setMech({ tk: k, traceEnd: m.traceEnd || k >= ev.length - 1 }); draw(); }
  draw();
}

/* ================= 6f pre: find the planted numbers (proof-reading) ================= */
function plantHunt(box, api) {
  var m = api.mech;
  box.innerHTML = '<div class="card"><div class="hint">Getting the real report from 6e…</div></div>';
  api.jsEval(function (NS, pg) {
    if (!NS.shiftResult || !NS.shiftStats || !pg || !pg.plantedCopy) return null;
    var f = { shift_stats: NS.shiftStats.run(), slice_table: NS.sliceTable.run(), worst_cases: NS.worstCases.run(), action_list: NS.actionList.run() };
    return { P: pg.plantedCopy(NS.shiftResult.raw, f), f: f };
  }).then(function (D) {
    box.innerHTML = '';
    var c = el('div', 'card'); box.appendChild(c);
    if (!D) { c.appendChild(el('div', 'hint', api.review ? 'Review mode: this hands-on needs 6e. Press “Run up to here” below.' : 'Run 6e first: the copy is made from its real report.')); return; }
    var P = D.P; m.picks = m.picks || [];
    c.appendChild(el('div', null, '<b style="font-family:Orbitron,Arial;font-size:11px;letter-spacing:.14em;color:#ff8a9c">PLANTED COPY — 2 NUMBERS WERE CHANGED ON PURPOSE</b><div class="hint">This is a copy of your real 6e report. We changed 2 numbers so they are wrong. Be the checker: <b>tap every number you think is wrong</b>, then tap Done. One try. (The tool facts are under “Show the tool facts”.)</div>'));
    var sheet = el('div'); sheet.id = 'plant6'; sheet.style.cssText = 'background:#e9eef5;color:#16202c;border-radius:6px;padding:10px 12px;font-family:Space Mono,monospace;font-size:12.5px;line-height:1.75;white-space:pre-wrap;margin-top:6px';
    c.appendChild(sheet);
    var det = el('details'); det.appendChild(el('summary', 'hint', 'Show the tool facts (what the 4 tools return)')); var fp = el('pre', null, numsHtml(D.f)); fp.style.cssText = 'white-space:pre-wrap;font-size:11px;max-height:200px;overflow:auto'; det.appendChild(fp); c.appendChild(det);
    var foot = el('div'); c.appendChild(foot);
    function draw() {
      var t = P.text, out = '', last = 0;
      P.tokens.forEach(function (tk, i) {
        out += esc(t.slice(last, tk.at)); last = tk.at + tk.tok.length;
        if (tk.unit) { out += esc(tk.tok); return; }
        var picked = m.picks.indexOf(tk.at) >= 0, pl = P.planted.filter(function (p) { return p.at === tk.at; })[0], st;
        if (m.huntDone) st = pl ? (picked ? 'background:#1f9b60;color:#fff' : 'background:#c0392b;color:#fff') : picked ? 'background:#ffd0d0;text-decoration:line-through' : '';
        else st = picked ? 'background:#ff4d6a;color:#fff' : 'background:#fff;border-bottom:2px dotted #5d6b80';
        out += '<span data-num6="' + tk.at + '" style="cursor:' + (m.huntDone ? 'default' : 'pointer') + ';padding:0 2px;border-radius:3px;' + st + '">' + esc(tk.tok) + (m.huntDone && pl ? ' <small>(real: ' + esc(pl.was) + ')</small>' : '') + '</span>';
      });
      sheet.innerHTML = out + esc(t.slice(last));
      if (!m.huntDone) [].forEach.call(sheet.querySelectorAll('[data-num6]'), function (s) { s.onclick = function () { var a = +s.getAttribute('data-num6'), i = m.picks.indexOf(a); if (i >= 0) m.picks.splice(i, 1); else m.picks.push(a); api.setMech({ picks: m.picks }); draw(); }; });
      foot.innerHTML = '';
      if (!m.huntDone) {
        var b = el('button', 'btn', 'Done'); b.id = 'hunt6'; b.disabled = !m.picks.length; b.style.marginTop = '8px';
        b.onclick = function () { var found = P.planted.filter(function (p) { return m.picks.indexOf(p.at) >= 0; }).length; api.setMech({ huntDone: 1, found: found, falsePicks: m.picks.length - found }); draw(); };
        var row = el('div', 'row'); row.appendChild(b); row.appendChild(el('span', 'hint', m.picks.length + ' number' + (m.picks.length === 1 ? '' : 's') + ' marked.')); foot.appendChild(row);
      } else {
        var f = m.found || 0, fp2 = m.falsePicks || 0;
        foot.appendChild(el('div', 'verdict ' + (f === P.planted.length && !fp2 ? 'good' : 'bad'), 'You found <b>' + f + ' of ' + P.planted.length + '</b> planted numbers' + (fp2 ? ' and marked ' + fp2 + ' right number' + (fp2 > 1 ? 's' : '') + ' as wrong' : '') + '. Green = planted and found, red = planted and missed. A wrong number that looks normal is hard to see by eye — now make the computer check all of them, every time.'));
      }
    }
    draw();
  });
}
function markNums(line, html, bad, good) {   /* colour every number in an escaped line: red if in `bad`, green otherwise */
  return html.replace(/(per 1,000|per 100)|(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)/g, function (m0, unit, n) { if (unit) return unit; var isBad = bad.indexOf(n.replace(/,/g, '')) >= 0 || bad.indexOf(n) >= 0; return '<b style="padding:0 2px;border-radius:3px;' + (isBad ? 'background:#c0392b;color:#fff' : good ? 'color:#1f7a4d' : '') + '">' + n + '</b>'; });
}
function checkView(r, host, api) {
  if (r.missing) return;
  var c1 = card(host, 'YOUR CHECKER ON THE PLANTED COPY', 'Red = numbers your checkReport() could not find in the tool facts.');
  c1.appendChild(reportSheet(r.planted.text, { mark: function (l, h) { return markNums(l, h, r.onPlanted.wrong, false); } }));
  var pl = r.planted.planted.map(function (p) { return p.now; }), caught = pl.filter(function (x) { return r.onPlanted.wrong.indexOf(x) >= 0; }).length;
  tiles(c1, [[caught + ' / ' + pl.length, 'planted numbers caught', caught === pl.length ? 'g' : 'r'], [r.onPlanted.wrong.length - caught, 'right numbers flagged', r.onPlanted.wrong.length - caught ? 'r' : 'g'], [(api.getMech('6f').found || 0) + ' / ' + pl.length, 'you found by eye', '']]);
  var c2 = card(host, 'YOUR CHECKER ON THE REAL REPORT (6e)', r.onReal.ok ? 'Every number was found in the tool facts.' : 'Wrong: ' + r.onReal.wrong.join(', '));
  c2.appendChild(reportSheet(r.real, { mark: function (l, h) { return markNums(l, h, r.onReal.wrong, true); } }));
  var c3 = card(host, 'THE GUARDRAIL AT WORK — A SLOPPY SCRIPTED WRITER', 'Its first draft has 2 numbers changed on purpose. The guardrail runs your checkReport() before the report is handed on.');
  var tl = el('div'); c3.appendChild(tl);
  r.attempts.forEach(function (a, i) {
    var bad = a.ok ? [] : ((a.feedback || '').split(':').slice(1).join(':').match(/\d+(?:\.\d+)?/g) || []);
    tl.appendChild(el('div', null, '<div style="font-family:Orbitron,Arial;font-size:10px;letter-spacing:.12em;margin:8px 0 4px;color:' + (a.ok ? '#3dffa0' : '#ff4d6a') + '">DRAFT ' + (i + 1) + ' · ' + (a.ok ? 'CHECK PASSED ✓' : 'CHECK FAILED ✗') + '</div>'));
    tl.appendChild(reportSheet(a.raw, { mark: function (l, h) { return markNums(l, h, bad, false); } }));
    if (!a.ok) tl.appendChild(el('div', 'verdict bad', '<b>Sent back once:</b> “' + esc(a.feedback) + '”. As in CrewAI, the writer gets only this message and its old draft.'));
  });
  c3.appendChild(el('div', 'hint', 'The second draft says “[removed]” where the wrong numbers were: the writer had no tool to get them again, so it removed them instead of guessing. Honest — but the real fix is to give every number a tool.'));
}

/* ================= 6g: the key slot (real model, optional) ================= */
var KEY6 = null;   /* the key: in this variable only (memory). Never saved, never logged, never in the trace. */
var PROV = { anthropic: { label: 'Anthropic (Messages API)', model: 'claude-opus-5-5', src: '@anthropic-ai/sdk 1.12.0 README' }, openai: { label: 'OpenAI-compatible (chat completions)', model: 'gpt-5.5', src: 'openai 7.62.0 README', base: 'https://api.openai.com/v1' } };
function sceneKeySlot(s, stage, out, api) {
  var m = api.mech, busy = false, last = null;
  m.provider = m.provider || 'anthropic';
  var hosted = /^https?:$/.test(location.protocol), sandboxed = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  function draw() {
    stage.innerHTML = '';
    var c = el('div', 'card'); c.style.margin = '10px';
    c.appendChild(el('div', null, '<b style="font-family:Orbitron,Arial;font-size:12px;letter-spacing:.14em;color:#ffb547">KEY SLOT · OPTIONAL</b>'));
    c.appendChild(el('p', 'hint', 'Same crew, same tools, same checker — but a real language model as the brain. The key stays in this page\'s memory only: it is never saved, never logged, and it is gone when you reload. The call goes straight from your browser to the provider.'));
    if (hosted || sandboxed) c.appendChild(el('div', 'verdict', '<b>Note:</b> ' + (hosted && !sandboxed ? 'on the published page, calls to outside sites are blocked.' : 'this page runs inside a frame that may block calls to outside sites.') + ' A real model works in the <b>downloaded single file opened in Chrome</b>. You can still try here: if the call is blocked, you will see it plainly.'));
    var f = el('div'); f.style.cssText = 'display:grid;grid-template-columns:130px 1fr;gap:6px 8px;align-items:center;margin-top:8px';
    f.appendChild(el('label', null, 'Provider'));
    var sel = el('select'); sel.id = 'prov6'; Object.keys(PROV).forEach(function (k) { var o = el('option', null, esc(PROV[k].label)); o.value = k; if (k === m.provider) o.selected = true; sel.appendChild(o); });
    sel.onchange = function () { api.setMech({ provider: sel.value, model: '' }); draw(); }; f.appendChild(sel);
    var P = PROV[m.provider];
    if (m.provider === 'openai') { f.appendChild(el('label', null, 'Base URL')); var bu = el('input'); bu.id = 'base6'; bu.value = m.base || P.base; bu.spellcheck = false; bu.oninput = function () { api.setMech({ base: bu.value.trim() }); }; f.appendChild(bu); }
    f.appendChild(el('label', null, 'Model name')); var mo = el('input'); mo.id = 'model6'; mo.placeholder = P.model; mo.value = m.model || ''; mo.spellcheck = false; mo.oninput = function () { api.setMech({ model: mo.value.trim() }); }; f.appendChild(mo);
    f.appendChild(el('label', null, 'API key')); var ke = el('input'); ke.id = 'key6'; ke.type = 'password'; ke.autocomplete = 'off'; ke.spellcheck = false; ke.placeholder = 'paste your key (kept in memory only)'; ke.value = KEY6 || ''; ke.oninput = function () { KEY6 = ke.value.trim() || null; }; f.appendChild(ke);
    [].forEach.call(f.querySelectorAll('input,select'), function (x) { x.style.cssText = 'background:#05080d;color:#e6eef8;border:1px solid #263346;border-radius:6px;padding:6px 8px;font-family:Space Mono,monospace;font-size:13px;width:100%;box-sizing:border-box'; });
    c.appendChild(f);
    c.appendChild(el('div', 'hint', 'Model name placeholder from the ' + P.src + '. Type the model your account can use.'));
    var row = el('div', 'row'); row.style.marginTop = '8px';
    var go = el('button', 'btn', busy ? 'Running…' : '▶ Run the crew with this model'); go.id = 'run6g'; go.disabled = busy; go.onclick = run;
    var sk = el('button', 'btn small', 'Skip — no key'); sk.id = 'skip6g'; sk.disabled = busy; sk.onclick = function () { api.setMech({ done: 1, skipped: 1 }); side(); draw(); };
    row.appendChild(go); row.appendChild(sk); c.appendChild(row);
    var st = el('div'); st.id = 'stat6g'; c.appendChild(st);
    if (m.skipped && !m.ran) st.appendChild(el('div', 'verdict', 'Marked: <b>skipped — no key</b>. That is fine: Step 6 is complete without a real model. You can still come back and plug one in.'));
    if (last && last.err) st.appendChild(el('div', 'verdict bad', esc(last.err)));
    c.appendChild(el('details', null, '<summary class="hint">Same thing in Python CrewAI</summary><pre style="white-space:pre-wrap;font-size:12px">from crewai import LLM\nllm = LLM(model="anthropic/' + esc(PROV.anthropic.model) + '")   # key from ANTHROPIC_API_KEY\n# or: LLM(model="openai/' + esc(PROV.openai.model) + '", base_url="https://api.openai.com/v1")\nfor a in (inspector, analyst, writer): a.llm = llm\nchecked = Task(..., guardrail=report_guardrail, guardrail_max_retries=1)\nCrew(agents=[inspector, analyst, writer], tasks=[inspect_shift, find_causes, checked]).kickoff()</pre>'));
    stage.appendChild(c);
  }
  function run() {
    if (busy) return; var key = KEY6, model = (m.model || '').trim(), prov = m.provider, base = (m.base || PROV.openai.base).trim();
    if (!key) { last = { err: 'The key slot is empty. Paste a key, or tap “Skip — no key”.' }; draw(); return; }
    if (!model) { last = { err: 'Type a model name (for example ' + PROV[prov].model + ').' }; draw(); return; }
    busy = true; last = null; draw();
    var csp = null, onv = function (e) { if (/connect-src|default-src/.test(e.violatedDirective || e.effectiveDirective || '')) csp = e.blockedURI || 'outside site'; };
    document.addEventListener('securitypolicyviolation', onv);
    api.jsEval(async function (NS) {
      var C = window.MiniCrew;
      if (!NS.qualityCrew || typeof NS.checkReport !== 'function' || typeof NS.facts !== 'function') return { need: 1 };
      var llm = prov === 'anthropic' ? new C.AnthropicLLM({ apiKey: key, model: model }) : new C.OpenAILLM({ apiKey: key, model: model, baseURL: base });
      var guarded = new C.Task({ description: NS.writeReport.description, expected_output: NS.writeReport.expected_output, agent: NS.writer, context: [NS.inspectShift, NS.findCauses], guardrail_max_retries: 1,
        guardrail: function (o) { var ck = NS.checkReport(o.raw, NS.facts()); return ck.ok ? [true, o.raw] : [false, 'These numbers are not in the tool results: ' + ck.wrong.join(', ')]; } });
      var crew = C.withLLM(NS.qualityCrew, llm, guarded), t0 = Date.now();
      try { var R = await crew.kickoff(); return { ok: 1, raw: R.raw, outs: U().outsOf(R), trace: U().slimTrace(R.trace), ms: Date.now() - t0, check: NS.checkReport(R.raw, NS.facts()), scripted: NS.shiftResult.raw }; }
      catch (e) { return { fail: String(e && e.message || e).split('\n')[0], attempts: e && e.attempts || null, scripted: NS.shiftResult.raw, ms: Date.now() - t0 }; }
    }).then(function (x) {
      document.removeEventListener('securitypolicyviolation', onv); busy = false;
      if (!x) last = { err: 'The crew could not run here.' };
      else if (x.need) last = { err: api.review ? 'Review mode: press “Run up to here” on 6f first (the crew and your checker come from 6b–6f).' : 'Finish 6b–6f first: the real model uses your tools, workers, jobs and checker.' };
      else if (x.fail && !x.attempts) { var blocked = csp || /NETWORK/.test(x.fail); last = { err: (blocked ? 'The call was blocked or did not reach the provider. ' + (hosted || sandboxed ? 'This page blocks calls to outside sites (the published page does). Open the downloaded single file in Chrome to use a real model.' : 'Check your network.') + ' ' : '') + 'Details: ' + x.fail.replace(/^.*?call failed: /, '') }; }
      else { last = x; api.setMech({ done: 1, ran: 1, okCheck: x.ok ? (x.check.ok ? 1 : 0) : 0, lastModel: model, lastProvider: prov }); }
      draw(); side();
    });
  }
  function side() {
    out.innerHTML = '';
    if (last && (last.ok || last.attempts)) {
      var c = card(out, 'SIDE BY SIDE — SCRIPTED vs REAL MODEL', 'Same tools, same jobs, same checker. ' + esc(m.lastProvider === 'anthropic' ? 'Anthropic' : 'OpenAI-compatible') + ' · ' + esc(m.lastModel) + ' · ' + (last.ms / 1000).toFixed(1) + ' s');
      var g = el('div'); g.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px'; c.appendChild(g);
      var a = el('div'); a.appendChild(el('div', 'hint', '<b>Scripted model</b> (rules)')); a.appendChild(reportSheet(last.scripted)); g.appendChild(a);
      var b = el('div'); b.id = 'real6g'; b.appendChild(el('div', 'hint', '<b>Real model</b>')); g.appendChild(b);
      if (last.ok) {
        b.appendChild(reportSheet(last.raw, { mark: function (l, h) { return markNums(l, h, last.check.wrong, true); } }));
        var calls = last.trace.filter(function (e) { return e.type === 'tool_call'; }).map(function (e) { return workerOf(e.agent).role.split(' ')[0] + '→' + e.tool; });
        var gr = last.outs[last.outs.length - 1].attempts || [];
        c.appendChild(el('div', 'verdict ' + (last.check.ok ? 'good' : 'bad'), '<b>Guardrail on the real model:</b> ' + (gr.length > 1 ? 'draft 1 failed (' + esc(gr[0].feedback) + '), sent back once; ' : '') + (last.check.ok ? 'every number in its report is in the tool facts ✓' : 'wrong numbers: ' + esc(last.check.wrong.join(', '))) + '<br>Tool calls the model chose: ' + esc(calls.join(', ') || 'none') + '.'));
      } else {
        b.appendChild(el('div', 'verdict bad', 'The real model\'s report failed your check twice, so the crew stopped (as CrewAI does). ' + esc(last.fail)));
        (last.attempts || []).forEach(function (t, i) { b.appendChild(el('div', 'hint', 'draft ' + (i + 1) + ': ' + (t.ok ? 'passed' : esc(t.feedback)))); b.appendChild(reportSheet(t.raw)); });
      }
    } else if (m.done && m.ran) out.appendChild(el('div', 'verdict good', 'You ran the crew with ' + esc(m.lastModel) + ' (the result is not kept after a reload; the key never is).'));
    else if (m.skipped) card(out, 'SKIPPED — NO KEY', 'Step 6 is complete without a real model. Everything above ran with the scripted model, with real numbers.');
    else card(out, 'NO REAL MODEL YET', 'Paste a key on the left and run, or skip. Nothing is sent anywhere until you press Run.');
    if (m.done) endCard6(out, api);
  }
  draw(); side();
}
function endCard6(box, api) {
  api.jsEval(function (NS) { return NS.shiftStats && NS.shiftResult ? { s: NS.shiftStats.run(), raw: NS.shiftResult.raw } : null; }).then(function (x) {
    var m = api.getMech('6g'), s = x && x.s;
    box.appendChild(el('div', 'endc', '<h3 class="fh">STEP 6 DONE — WHAT THE CREW GIVES THE PLANT MANAGER</h3><ul>' +
      (s ? '<li><b>A one-page shift report:</b> ' + s.defects_passed + ' of ' + s.defects + ' defects passed = ' + s.defects_passed_per_100 + ' per 100 (target: at most ' + s.target_max_per_100 + ') → ' + (s.defects_passed_per_100 <= s.target_max_per_100 ? 'target met' : 'target missed') + '; ' + s.per_1000.person + ' person checks per 1,000 cells; the weak spot and the top actions.</li>' : '<li>A one-page shift report, from your tools.</li>') +
      '<li><b>The rule:</b> numbers come from tools, never from the model. Your checker proves it for every number, every time, as the report job\'s guardrail.</li>' +
      '<li><b>Honest limits:</b> the brain here is a scripted model (rules, not a language model); the person answers in the logbook came from a perfect checker; ' + (m.ran ? 'you also ran a real model (' + esc(m.lastModel) + ').' : 'a real model was skipped (no key).') + '</li></ul>' +
      '<p><b>Next — Step 7:</b> everything goes behind an operator screen. The test tray stays sealed until Step 8.</p>' +
      '<p class="hint">All numbers above come from real tool runs in your browser, on the validation tray.</p>'));
  });
}

window.PGViz6 = { hire: sceneHire, toolPanel: toolPanel, badges: badges, blanksPredict: blanksPredict, orderView: orderView, controlRoom: controlRoom, plantHunt: plantHunt, checkView: checkView, keySlot: sceneKeySlot, endCard6: endCard6, roomSVG: roomSVG, reportSheet: reportSheet };
})();
