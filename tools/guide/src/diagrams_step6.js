/* PanelGuard Diagram guide — Step 6 diagrams (6a 6b 6c 6d 6e 6f 6g). Uses window.PGD (engine.js).
   The quality crew, drawn as a real control room: three workers at desks, a wall of tool cabinets, reports on paper.
   Honest about the lab: MiniCrew is a CrewAI-style runner in JavaScript, and the default brain is a SCRIPTED model (rules, not a
   language model). Numbers and texts: the student's own run when that substep passed ("your value"), else the real reference run
   (facts.json s6 = the lab's MiniCrew on the lab state of tools/research/step6_inputs.json, reproduced by real Python CrewAI).
   Locks: code-gap texts are never written in code form (6b's tool name stays "?" until 6b passed; 6c's analyst role until 6c passed);
   6d's poor report is covered until its prediction is answered; 6f's planted numbers stay hidden until the lab's hunt is done. */
(function () {
'use strict';
var D = window.PGD, A = D.art, C = A.COL, t = A.t, esc = A.esc;
var F6 = function () { return (window.PGD_FACTS || {}).s6 || {}; };
function clean(a) { return a.filter(function (r) { return r; }); }
function srcTag(you) { return { tag: you ? 'your value' : 'typical value' }; }
function refNote(you) { return you ? null : { t: '<i>Reference run: the lab’s MiniCrew (scripted model) on the course’s test-fixture lab state; real Python CrewAI gave the same.</i>' }; }
function snapTo(sx, sy, dx, dy, step) { return (sx + Math.round((dx - sx) / step) * step) + ',' + (sy + Math.round((dy - sy) / step) * step); }
var WCOL = ['#46e3ff', '#a98bff', '#ffb547'], WKEY = ['inspector', 'analyst', 'writer'], WNAME = ['INSPECTOR', 'ANALYST', 'WRITER'];
var TOOLN = ['shift_stats', 'slice_table', 'worst_cases', 'action_list'], TOOLW = { shift_stats: 0, slice_table: 1, worst_cases: 1, action_list: 2 };
function unlocked(id) { return !!(window.__pgdUnlock || D.liveRes(id)); }

/* ---------- the crew's data: the student's own run when it passed, else the reference run ---------- */
function crew6() {
  var F = F6(); if (!F.tools) return null;
  var o = { tools: F.tools, outs: F.outs, trace: F.trace, workers: F.workers, jobs: F.jobs, draft1: F.guarded[0].raw, draft2: F.guarded[1].raw, fb: F.guarded[0].feedback,
    planted: F.planted, plantedNow: F.plantedNow, poor: F.poor, you: {} };
  var r6b = D.liveRes('6b'); if (r6b && r6b.out && r6b.other) { o.tools = Object.assign({ shift_stats: r6b.out }, r6b.other); o.you.tools = true; }
  var r6c = D.liveRes('6c'); if (r6c && r6c.agents) { o.workers = r6c.agents.map(function (a) { return { role: a.role, goal: a.goal, backstory: a.backstory, tools: a.tools, chars: a.prompt.length, prompt: a.prompt }; }); o.you.workers = true; }
  var r6e = D.liveRes('6e'); if (r6e && r6e.outs && r6e.trace) {
    o.outs = r6e.outs.map(function (x) { return x.raw; }); o.you.outs = true;
    o.trace = r6e.trace.map(function (e) { var w = o.workers.filter(function (q) { return q.role === e.agent; })[0]; return [e.type, e.task, e.agent, e.type === 'tool_result' ? JSON.stringify(e.result) : e.text, e.tool]; }); o.you.trace = true; }
  var r6f = D.liveRes('6f'); if (r6f && r6f.attempts && r6f.attempts.length === 2) { o.draft1 = r6f.attempts[0].raw; o.draft2 = r6f.attempts[1].raw; o.fb = r6f.attempts[0].feedback; o.planted = r6f.planted.text; o.plantedNow = r6f.planted.planted.map(function (p) { return p.now; }); o.you.drafts = true; }
  var r6d = D.liveRes('6d'); if (r6d && r6d.report) o.you.order = true;
  return o;
}
function promptOf(w) { return w.prompt || (F6().prompts || [])[WKEY.indexOf(String(w.role).split(' ').pop().toLowerCase()) >= 0 ? 0 : 0]; }

/* ---------- the lab's number checker (6f): units out, every number vs the tool facts, with where it was found ---------- */
function factPaths(v, p, out) {
  out = out || [];
  if (typeof v === 'boolean') return out;
  if (typeof v === 'number') { out.push([v, p]); return out; }
  if (Array.isArray(v)) v.forEach(function (x, i) { factPaths(x, p + '[' + i + ']', out); });
  else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { factPaths(v[k], p ? p + '.' + k : k, out); });
  return out;
}
function find(tok, P) { var dp = (tok.split('.')[1] || '').length, x = +tok; for (var i = 0; i < P.length; i++) if (Math.abs(P[i][0] - x) <= 0.5 * Math.pow(10, -dp) + 1e-12) return P[i][1]; return null; }
/* one report line -> pieces [{s, tok, ok, path}] (units "per 1,000" / "per 100" stay plain text) */
function pieces(line, P) {
  var out = [], re = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g, m, at = 0;
  while ((m = re.exec(line))) {
    var before = line.slice(Math.max(0, m.index - 4), m.index), unit = before === 'per ' && (m[0] === '1,000' || m[0] === '100');
    if (m.index > at) out.push({ s: line.slice(at, m.index) });
    if (unit) out.push({ s: m[0] });
    else { var tk = m[0].replace(/,/g, ''), path = find(tk, P); out.push({ s: m[0], tok: tk, ok: !!path, path: path }); }
    at = m.index + m[0].length;
  }
  if (at < line.length) out.push({ s: line.slice(at) });
  return out;
}
/* wrap the pieces of every line into rows of at most n characters (numbers never split) */
function layout(text, P, n) {
  var rows = [], k = 0;
  text.split('\n').forEach(function (line, li) {
    var row = [], len = 0, ind = /^• /.test(line) ? 2 : 0;
    function push(seg) { if (len + seg.s.length > n && len > ind) { rows.push({ li: li, segs: row }); row = ind ? [{ s: '  ' }] : []; len = ind; if (/^ /.test(seg.s) && !seg.tok) seg = { s: seg.s.replace(/^ +/, '') }; } row.push(seg); len += seg.s.length + (seg.tok ? 1 : 0); }
    pieces(line, P).forEach(function (pc) {
      if (pc.tok) { pc.k = k++; push(pc); return; }
      pc.s.split(/(?= )/).forEach(function (w) { if (w) push({ s: w }); });
    });
    rows.push({ li: li, segs: row });
  });
  return rows;
}
/* the report on paper. o: {x, y, w, h, title, n (chars per row), fs, checked (row index up to which numbers are marked), lit, stamp} */
function paperSheet(text, P, fx, o) {
  var rows = layout(text, P, o.n || 58), fs = o.fs || 14, lh = o.lh || 21, s = '';
  s += '<g filter="url(#' + fx.sh + ')"><rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" rx="4" fill="#f1ecdf"/></g>';
  s += '<path d="M' + (o.x + 14) + ' ' + (o.y + 40) + 'h' + (o.w - 28) + '" stroke="#b9b09c"/>';
  s += t(o.x + 18, o.y + 28, o.title || 'SHIFT QUALITY REPORT', { size: 15, f: 'h', fill: '#2a3444', ls: '.06em' });
  if (o.sub) s += t(o.x + o.w - 16, o.y + 28, o.sub, { size: 14, a: 'end', fill: '#7a6f5a' });
  var y0 = o.y + 64, cnt = { ok: 0, bad: 0, all: 0 };
  rows.forEach(function (r, i) {
    if (i === 0) return;   // the title line is drawn above
    var y = y0 + (i - 1) * lh, done = o.checked != null && y <= o.checked;
    var sp = r.segs.map(function (g) {
      if (!g.tok) { var rm = g.s.indexOf('[removed]') >= 0; return '<tspan' + (rm ? ' fill="#2f6fae" font-weight="700"' : '') + '>' + esc(g.s) + '</tspan>'; }
      cnt.all++; if (done) cnt[g.ok ? 'ok' : 'bad']++;
      if (!done) return '<tspan font-weight="700">' + esc(g.s) + '</tspan>';
      return '<tspan font-weight="700" fill="' + (g.ok ? '#0f7a48' : '#c01a36') + '"' + (!g.ok ? ' text-decoration="underline"' : '') + '>' + esc(g.s) + '</tspan><tspan fill="' + (g.ok ? '#0f9a58' : '#d81e3e') + '" font-weight="700">' + (g.ok ? '✓' : '✗') + '</tspan>';
    }).join('');
    s += '<text x="' + (o.x + 18) + '" y="' + y + '" font-family="' + A.FM + '" font-size="' + fs + '" fill="#1f2937" xml:space="preserve" data-row="' + i + '">' + sp + '</text>';
  });
  return { svg: s, rows: rows, y0: y0, lh: lh, last: y0 + (rows.length - 2) * lh, cnt: cnt };
}
function marks(text, P, upto) {   // every checked number token up to row y (for the work strip / ledger)
  var rows = layout(text, P, 58), out = [], y0 = 0;
  rows.forEach(function (r, i) { if (i === 0) return; var y = (i - 1); if (upto != null && y > upto) return; r.segs.forEach(function (g) { if (g.tok) out.push(g); }); });
  return out;
}

/* ---------- shared art: a worker at a desk, a tool cabinet, a desk lamp, a rubber stamp ---------- */
function worker(x, y, k, o) {   // a person at a desk with a monitor, seen from the side-front. (x, y) = desk front centre
  o = o || {}; var col = WCOL[k], s = '', dim = o.dim ? ' opacity=".45"' : '';
  s += '<g' + dim + (o.cls ? ' class="' + o.cls + '"' : '') + '>';
  if (o.glow) s += '<ellipse cx="' + x + '" cy="' + (y - 40) + '" rx="96" ry="74" fill="' + col + '" opacity=".14"/>';
  s += '<ellipse cx="' + x + '" cy="' + (y + 46) + '" rx="92" ry="12" fill="#000" opacity=".5"/>';
  s += '<rect x="' + (x + 12) + '" y="' + (y - 92) + '" width="70" height="48" rx="5" fill="#0b121b" stroke="' + col + '" stroke-width="2"/><rect x="' + (x + 17) + '" y="' + (y - 87) + '" width="60" height="38" rx="2" fill="' + col + '" opacity=".22"/>' +
    '<path d="M' + (x + 22) + ' ' + (y - 78) + 'h34M' + (x + 22) + ' ' + (y - 70) + 'h44M' + (x + 22) + ' ' + (y - 62) + 'h26" stroke="' + col + '" stroke-width="2" opacity=".8"/><path d="M' + (x + 47) + ' ' + (y - 44) + 'v10" stroke="#3a4757" stroke-width="5"/>';
  s += '<circle cx="' + (x - 34) + '" cy="' + (y - 78) + '" r="17" fill="#d9c4a8"/><path d="M' + (x - 51) + ' ' + (y - 82) + 'a17 17 0 0 1 34 -4c-8 -6 -24 -6 -34 4z" fill="#2a2018"/>';
  s += '<path d="M' + (x - 66) + ' ' + (y - 10) + 'c0 -34 14 -50 32 -50s32 16 32 50z" fill="' + col + '" fill-opacity=".85"/><path d="M' + (x - 10) + ' ' + (y - 36) + 'l26 8" stroke="#d9c4a8" stroke-width="8" stroke-linecap="round"/>';
  s += '<rect x="' + (x - 88) + '" y="' + (y - 34) + '" width="186" height="14" rx="3" fill="url(#' + o.fx.mt + ')" stroke="#3a4757"/><rect x="' + (x - 80) + '" y="' + (y - 20) + '" width="170" height="62" rx="4" fill="#121a24" stroke="#26313f"/>';
  if (!o.nolabel) s += t(x + 5, y + 18, o.label || WNAME[k], { size: 15, a: 'middle', f: 'h', fill: col, ls: '.06em' });
  if (o.sub) s += t(x + 5, y + 38, o.sub, { size: 14, a: 'middle', fill: C.dim });
  return s + '</g>';
}
function cabinet(x, y, name, o) {   // a tall tool cabinet with a name plate and a socket
  o = o || {}; var w = o.w || 150, h = o.h || 108, col = o.col || '#5d6b80', s = '';
  s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="url(#' + o.fx.mt + ')" stroke="' + col + '" stroke-width="' + (o.lit ? 2.5 : 1.4) + '"/>';
  s += '<rect x="' + (x + 10) + '" y="' + (y + 10) + '" width="' + (w - 20) + '" height="28" rx="4" fill="#0b121b" stroke="#3a4757"/>' + t(x + w / 2, y + 30, name, { size: 14, a: 'middle', f: 'm', w: 700, fill: o.lit ? '#3dffa0' : '#c7d4e4' });
  s += '<path d="M' + (x + 14) + ' ' + (y + 52) + 'h' + (w - 28) + 'M' + (x + 14) + ' ' + (y + 68) + 'h' + (w - 28) + '" stroke="#0a0f15" stroke-width="2"/><rect x="' + (x + w / 2 - 14) + '" y="' + (y + 56) + '" width="28" height="6" rx="3" fill="#8d9bb0"/>';
  if (o.sub) s += t(x + w / 2, y + h - 12, o.sub, { size: 14, a: 'middle', fill: C.dim });
  return s;
}
function lamp(x, y, toX, toY, w, fx, on) {   // a desk lamp at (x, y) shining down onto a band at toY
  var s = '', k = A.uid('lp');
  s += '<defs><linearGradient id="' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a0" stop-opacity="' + (on ? .34 : .12) + '"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></linearGradient></defs>';
  s += '<path d="M' + (x - 20) + ' ' + (y + 18) + 'L' + (toX - w / 2) + ' ' + toY + 'H' + (toX + w / 2) + 'L' + (x + 20) + ' ' + (y + 18) + 'Z" fill="url(#' + k + ')"/>';
  s += '<path d="M' + (x + 40) + ' ' + (y - 6) + 'L' + (x + 90) + ' ' + (y - 40) + 'L' + (x + 112) + ' ' + (y + 60) + '" stroke="#5d6b80" stroke-width="6" fill="none" stroke-linecap="round"/>';
  s += '<path d="M' + (x - 26) + ' ' + (y + 18) + 'Q' + x + ' ' + (y - 34) + ' ' + (x + 26) + ' ' + (y + 18) + 'Z" fill="url(#' + fx.mt + ')" stroke="#8d9bb0"/><ellipse cx="' + x + '" cy="' + (y + 18) + '" rx="22" ry="5" fill="' + (on ? '#fff3c8' : '#5d6b80') + '"/>';
  return s;
}

/* ============================ 6f  Never trust, check ============================ */
/* the ledger: the tool facts the report's numbers are matched against */
function ledgerRows(T) {
  var S = T.shift_stats || {}, G = (T.slice_table || {}).groups || {}, L = T.action_list || {}, W = T.worst_cases || {};
  function g(n) { return G[n] || {}; }
  return [['shift_stats', null],
    ['cells · defects', S.cells + ' · ' + S.defects, ['shift_stats.cells', 'shift_stats.defects']],
    ['defects passed · /100', S.defects_passed + ' · ' + S.defects_passed_per_100, ['shift_stats.defects_passed', 'shift_stats.defects_passed_per_100']],
    ['target /100', String(S.target_max_per_100), ['shift_stats.target_max_per_100']],
    ['lanes per 1,000 cells', S.per_1000 ? S.per_1000.pass + ' · ' + S.per_1000.person + ' · ' + S.per_1000.stop : '', ['shift_stats.per_1000.pass', 'shift_stats.per_1000.person', 'shift_stats.per_1000.stop']],
    ['person checks', String(S.person_checks), ['shift_stats.person_checks']],
    ['slice_table', null],
    ['poly: passed · of · /100', g('poly').defects_passed + ' · ' + g('poly').defects + ' · ' + g('poly').passed_per_100, ['slice_table.groups.poly.defects_passed', 'slice_table.groups.poly.defects', 'slice_table.groups.poly.passed_per_100']],
    ['mono · unsure · sure', g('mono').defects + ' · ' + g('expert_unsure').defects + ' · ' + g('expert_sure').defects, ['slice_table.groups.mono.cells', 'slice_table.groups.mono.defects', 'slice_table.groups.mono.defects_passed', 'slice_table.groups.expert_unsure.defects', 'slice_table.groups.expert_unsure.defects_passed', 'slice_table.groups.expert_sure.defects']],
    ['action_list', null],
    ['sorted · each box', L.sorted + ' · ' + (L.boxes || []).map(function (b) { return b.count; }).join(' · '), ['action_list.sorted', 'action_list.boxes[0].count', 'action_list.boxes[1].count', 'action_list.boxes[2].count', 'action_list.boxes[3].count']],
    ['worst_cases', null],
    ['missed · false alarms', W.missed_count + ' · ' + W.false_alarm_count, ['worst_cases.missed_count', 'worst_cases.false_alarm_count']]];
}
function ledger(T, hits, x, y, w, fx, o) {
  o = o || {}; var s = A.glass(x, y, w, o.h || 470, { fx: fx, col: '#2b4760' }), yy = y + 30;
  s += t(x + 16, yy, 'TOOL FACTS · LEDGER', { size: 15, f: 'h', fill: '#c7d4e4', ls: '.08em' }); yy += 10;
  var lit = {}; hits.forEach(function (h) { if (h.path) lit[h.path] = (lit[h.path] || 0) + 1; });
  var last = hits.length && hits[hits.length - 1].path;
  ledgerRows(T).forEach(function (r) {
    if (!r[1] && r[1] !== '') { yy += 30; s += t(x + 16, yy, r[0], { size: 14, f: 'm', w: 700, fill: '#46e3ff' }); return; }
    yy += 24; var on = r[2].some(function (p) { return lit[p]; }), now = last && r[2].indexOf(last) >= 0;
    if (on) s += '<rect x="' + (x + 8) + '" y="' + (yy - 17) + '" width="' + (w - 16) + '" height="23" rx="5" fill="#3dffa0" fill-opacity="' + (now ? .22 : .1) + '"' + (now ? ' class="pgd-pop"' : '') + '/>';
    s += t(x + 18, yy, r[0], { size: 14, fill: on ? '#d8ffe9' : C.dim }) + t(x + w - 14, yy, r[1], { size: 14, a: 'end', f: 'm', w: 700, fill: on ? '#3dffa0' : '#c7d4e4' });
  });
  return s;
}
var PX6F = { x: 22, y: 42, w: 532, h: 490 }, N6F = 58, LH6F = 20.5, LX6F = 614, LW6F = 322;
function sheet6f(c, fx, which, checked, o) {
  var K = crew6(), P = factPaths(K.tools, ''), txt = which === 2 ? K.draft2 : which === 3 ? K.planted : K.draft1;
  return paperSheet(txt, P, fx, Object.assign({ x: PX6F.x, y: PX6F.y, w: PX6F.w, h: PX6F.h, n: N6F, fs: 14, lh: LH6F, checked: checked, title: 'SHIFT QUALITY REPORT', sub: which === 2 ? 'draft 2' : which === 3 ? 'copy with 2 planted numbers' : 'draft 1 · scripted writer' }, o || {}));
}
function hitsOf(c, which, upto) {
  var K = crew6(), P = factPaths(K.tools, ''), txt = which === 2 ? K.draft2 : K.draft1, rows = layout(txt, P, N6F), y0 = PX6F.y + 64, out = [];
  rows.forEach(function (r, i) { if (!i) return; var y = y0 + (i - 1) * LH6F; if (upto != null && y > upto) return; r.segs.forEach(function (g) { if (g.tok) out.push(g); }); });
  return out;
}
function work6f(c, which, upto) {
  var K = crew6(), h = hitsOf(c, which, upto), bad = h.filter(function (g) { return !g.ok; }), r = [{ h: which === 2 ? 'Draft 2, every number' : 'Numbers checked so far' }, { v: h.length + ' numbers', k: (h.length - bad.length) + ' found in the facts · ' + bad.length + ' not found' }];
  h.slice(-5).forEach(function (g) { r.push({ v: g.s + (g.ok ? '  ✓' : '  ✗'), k: g.ok ? g.path.replace(/\.groups\./, ' · ').replace(/\./g, ' · ') : 'no tool fact is this number', col: g.ok ? '#3dffa0' : '#ff4d6a' }); });
  r.push({ t: 'A number on the page is fine only if a tool gave it. “per 1,000” and “per 100” are units, not facts.' });
  return clean(r.concat([srcTag(K.you.drafts), refNote(K.you.drafts)]));
}
function bar6f(y) {   // the bar magnifier across the paper, with its grip on the right
  var x0 = PX6F.x + 6, x1 = PX6F.x + PX6F.w - 6;
  return '<g><rect x="' + x0 + '" y="' + (y - 19) + '" width="' + (x1 - x0) + '" height="28" rx="6" fill="#ffd36b" fill-opacity=".16" stroke="#c99a3a" stroke-width="2"/>' +
    '<path d="M' + (x0 + 8) + ' ' + (y - 17) + 'H' + (x1 - 8) + '" stroke="#fff" stroke-opacity=".55" stroke-width="2"/></g>';
}
function grip6f(y) { var gx = PX6F.x + PX6F.w + 30; return '<g><path d="M' + (PX6F.x + PX6F.w - 6) + ' ' + (y - 5) + 'H' + (gx - 16) + '" stroke="#8d9bb0" stroke-width="6"/><circle cx="' + gx + '" cy="' + (y - 5) + '" r="17" fill="#ffb547" stroke="#fff" stroke-width="2.5"/><path d="M' + gx + ' ' + (y - 15) + 'v20M' + (gx - 5) + ' ' + (y - 10) + 'l5 -5 5 5M' + (gx - 5) + ' ' + y + 'l5 5 5 -5" stroke="#1a1103" stroke-width="2" fill="none"/></g>'; }
function stamp6f(x, y, word, col, rot) {
  return '<g transform="rotate(' + (rot || -8) + ' ' + x + ' ' + y + ')" class="pgd-pop"><rect x="' + (x - 128) + '" y="' + (y - 30) + '" width="256" height="58" rx="8" fill="none" stroke="' + col + '" stroke-width="5" opacity=".85"/>' +
    t(x, y + 10, word, { size: 26, a: 'middle', f: 'h', fill: col, ls: '.08em', op: .9 }) + '</g>';
}
var NICE6 = { 'shift_stats.defects_passed': 'defects passed', 'shift_stats.per_1000.person': 'to a person, per 1,000', 'shift_stats.per_1000.pass': 'auto-pass, per 1,000', 'shift_stats.cells': 'cells checked', 'shift_stats.person_checks': 'person checks' };
function slips6f() {   // the numbers the scripted writer changed in draft 1, next to the same place in the real report
  var K = crew6(), P = factPaths(K.tools, ''), tk = function (txt) { var o = []; txt.split('\n').forEach(function (l) { pieces(l, P).forEach(function (g) { if (g.tok) o.push(g); }); }); return o; };
  var a = tk(K.draft1), b = tk(K.outs[2] || ''), out = [];
  a.forEach(function (g, i) { if (!g.ok) { var r = a.length === b.length ? b[i] : null; out.push({ was: g.s, real: r && r.s, path: r && r.path ? (NICE6[r.path] || r.path.split('.').pop().replace(/_/g, ' ')) : '' }); } });
  return out;
}
function huntDone() { if (window.__pgdUnlock) return true; var m = D.liveSub('6f').mech; return !!(m && m.huntDone) || !!D.liveRes('6f'); }
D.register('6f', {
  init: function () { return { y: null }; },
  frames: [
  { cap: 'Draft 1: slide the magnifier down, number by number',
    note: 'Every number in the report is looked up in the tool facts. Found: a tick. Not found: a cross.',
    svg: function (c) {
      var fx = A.fx(), K = crew6(), s = A.stage() + fx.defs; if (!K) return s;
      var y = c.state.y == null ? PX6F.y + 64 : c.state.y, P = sheet6f(c, fx, 1, y);
      s += lamp(150, -2, PX6F.x + PX6F.w / 2, y + 10, PX6F.w + 40, fx, true);
      s += P.svg + '<g id="bar6f" style="transform:translateY(' + (y - (PX6F.y + 64)) + 'px)">' + bar6f(PX6F.y + 64) + '</g>';
      s += '<g id="led6f">' + ledger(K.tools, hitsOf(c, 1, y), LX6F, PX6F.y, LW6F, fx, { h: PX6F.h }) + '</g>';
      s += A.target('bar', grip6f(PX6F.y + 64), 'slide down', PX6F.x + PX6F.w + 34, 24, { kind: 'drag', la: 'middle', to: snapTo(PX6F.x + PX6F.w + 30, PX6F.y + 64 - 5, PX6F.x + PX6F.w + 30, P.last + 10, LH6F) });
      return s;
    },
    work: function (c) { return work6f(c, 1, c.state.y == null ? PX6F.y + 64 : c.state.y); },
    bind: function (c, root) {
      var K = crew6(); if (!K) return;
      var y0 = PX6F.y + 64, P = layout(K.draft1, factPaths(K.tools, ''), N6F), last = y0 + (P.length - 2) * LH6F, el = root.querySelector('[data-pgd-t=bar]'), ring = el.querySelector('.pgd-ring'), bar = root.querySelector('#bar6f'), gx = PX6F.x + PX6F.w + 30;
      var cur = c.state.y == null ? y0 : c.state.y, lastPaint = -1; ring.style.transform = 'translateY(' + (cur - y0) + 'px)';
      function paint(y) {   // re-mark rows above the bar, live
        var row = Math.floor((y - y0) / LH6F + 1e-6); if (row === lastPaint) return; lastPaint = row;
        c.state.y = y; var fx = A.fx(), S = sheet6f(c, fx, 1, y);
        root.querySelectorAll('text[data-row]').forEach(function (n) { n.remove(); });
        var tmp = document.createElementNS('http://www.w3.org/2000/svg', 'g'); tmp.innerHTML = fx.defs + S.svg;
        var anchor = root.querySelector('#bar6f'); tmp.querySelectorAll('text[data-row]').forEach(function (n) { anchor.parentNode.insertBefore(n, anchor); });
        var led = root.querySelector('#led6f'); led.innerHTML = fx.defs + ledger(K.tools, hitsOf(c, 1, y), LX6F, PX6F.y, LW6F, fx, { h: PX6F.h }); c.rework();
      }
      D.onDrag(root, el, { start: { x: gx, y: cur - 5 }, step: LH6F, live: true,
        clamp: function (p) { return { x: gx, y: Math.max(y0 - 5, Math.min(last + 16, p.y)) }; },
        move: function (p) { var y = p.y + 5; ring.style.transform = bar.style.transform = 'translateY(' + (y - y0) + 'px)'; paint(y); },
        drop: function (p, live) { var y = p.y + 5; paint(y); if (y >= last - 2 && !live) { c.state.y = last + LH6F; c.next(); } else if (y >= last - 2 && live) { c.state.y = last + LH6F; c.next(); } } });
    },
    auto: function (c) { c.state.y = 999; } },
  { cap: 'Two numbers are not in the facts: send it back',
    note: 'The checker found 2 numbers no tool gave. The report job sends draft 1 back to the writer, once, with the list.',
    svg: function (c) {
      var fx = A.fx(), K = crew6(), s = A.stage() + fx.defs; if (!K) return s;
      var P = sheet6f(c, fx, 1, 999); s += lamp(150, -2, PX6F.x + PX6F.w / 2, 520, PX6F.w + 40, fx, true) + P.svg;
      s += A.glass(LX6F, PX6F.y, LW6F, PX6F.h, { fx: fx, col: '#7a2a3a' }) + t(LX6F + 20, PX6F.y + 32, 'THE CHECK SAYS', { size: 15, f: 'h', fill: '#ff8aa0', ls: '.08em' });
      s += t(LX6F + 20, PX6F.y + 66, 'not in the tool results:', { size: 17, fill: '#c7d4e4' });
      slips6f().forEach(function (d, i) { var y = PX6F.y + 120 + i * 104;
        s += '<rect x="' + (LX6F + 14) + '" y="' + (y - 38) + '" width="' + (LW6F - 28) + '" height="88" rx="10" fill="#ff4d6a" fill-opacity=".08" stroke="#ff4d6a" stroke-opacity=".45"/>';
        s += t(LX6F + 28, y, d.was + ' ✗', { size: 30, f: 'm', w: 700, fill: '#ff4d6a' }) + t(LX6F + 28, y + 32, 'the tool says ' + (d.real || '?') + (d.path ? ' · ' + d.path : ''), { size: 15, fill: '#c7d4e4' }); });
      s += t(LX6F + 20, PX6F.y + 362, 'So draft 1 goes back to', { size: 17, fill: '#c7d4e4' }) + t(LX6F + 20, PX6F.y + 388, 'the writer with this list.', { size: 17, fill: '#c7d4e4' }) + t(LX6F + 20, PX6F.y + 426, 'retries allowed: 1', { size: 17, f: 'm', w: 700, fill: '#ffcf6b' });
      s += A.target('stamp', '<g><ellipse cx="470" cy="492" rx="60" ry="9" fill="#000" opacity=".35"/><rect x="422" y="460" width="96" height="24" rx="5" fill="#7a1020"/><rect x="458" y="414" width="24" height="48" rx="6" fill="#c98a4a"/><circle cx="470" cy="408" r="17" fill="#c98a4a" stroke="#7a4a20" stroke-width="2"/></g>', 'stamp: send back', 330, 506, {});
      return s;
    },
    work: function (c) { var K = crew6(), h = hitsOf(c, 1, 999), bad = h.filter(function (g) { return !g.ok; }); return clean([{ h: 'Draft 1' }, { v: String(h.length), k: 'numbers on the page' }, { op: '−', v: String(h.length - bad.length), k: 'found in the tool facts' }, { op: '=', v: String(bad.length), k: 'not found: ' + bad.map(function (g) { return g.s; }).join(', '), res: true, col: '#ff4d6a' }, { t: 'The scripted writer changed 2 numbers in draft 1 <b>on purpose</b> (its rules say so). A real model can do the same by accident.' }, srcTag(K.you.drafts), refNote(K.you.drafts)]); },
    on: { stamp: function (c) { c.next(); } } },
  { cap: 'Draft 2 comes back: the writer removed what it could not prove',
    note: 'The writer got only the error and its old draft. Its tools cannot give those numbers again, so it removed them instead of guessing.',
    svg: function (c) {
      var fx = A.fx(), K = crew6(), s = A.stage() + fx.defs; if (!K) return s;
      s += '<g opacity=".5" transform="rotate(-4 300 270) translate(-14 10)">' + sheet6f(c, fx, 1, 999).svg + stamp6f(300, 260, 'SENT BACK', '#c01a36') + '</g>';
      s += '<g class="pgd-slide">' + sheet6f(c, fx, 2, null).svg + '</g>';
      s += lamp(150, -2, PX6F.x + PX6F.w / 2, 520, PX6F.w + 40, fx, false);
      s += A.glass(614, 46, 322, 300, { fx: fx, col: '#2b4157' }) + t(634, 74, 'WHAT THE WRITER GOT', { size: 14, f: 'h', fill: C.dim, ls: '.08em' });
      s += t(634, 104, '1. the error:', { size: 16, fill: '#c7d4e4' }) + t(648, 130, '“not in the tool results:', { size: 15, f: 'm', fill: '#ff8aa0' }) + t(648, 152, '  ' + K.fb.replace(/^.*: /, '') + '”', { size: 15, f: 'm', fill: '#ff8aa0' });
      s += t(634, 190, '2. its old draft', { size: 16, fill: '#c7d4e4' }) + t(634, 230, 'Rules: cannot look the', { size: 16, fill: C.dim }) + t(634, 254, 'numbers up again →', { size: 16, fill: C.dim }) + t(634, 282, 'write [removed]', { size: 18, f: 'm', w: 700, fill: '#7fb6ff' });
      s += A.target('switch', '<g><rect x="740" y="380" width="80" height="120" rx="12" fill="url(#' + fx.mt + ')" stroke="#8d9bb0" stroke-width="2"/><rect x="764" y="396" width="32" height="88" rx="8" fill="#0b121b"/><rect x="768" y="440" width="24" height="40" rx="6" fill="#ffb547"/></g>', 'check draft 2', 780, 364, {});
      return s;
    },
    work: function (c) { var K = crew6(); return clean([{ h: 'The retry' }, { v: '1', k: 'retry allowed for this job' }, { v: '[removed]', k: 'where the 2 numbers were' }, { t: 'As in CrewAI: a job sent back gets the error and its old answer, not the facts. Guessing again would not be safer, so the rules remove.' }, srcTag(K.you.drafts), refNote(K.you.drafts)]); },
    on: { switch: function (c) { c.next(); } } },
  { cap: 'Every number now comes from a tool. The report may go out.',
    note: 'Draft 2: every number left is in the tool facts. The check passes. The planted copy (the lab’s hunt) shows the same check catching numbers that look right.',
    svg: function (c) {
      var fx = A.fx(), K = crew6(), s = A.stage() + fx.defs; if (!K) return s;
      var P = sheet6f(c, fx, 2, 999); s += lamp(150, -2, PX6F.x + PX6F.w / 2, 520, PX6F.w + 40, fx, true) + P.svg + '<g opacity=".8">' + stamp6f(400, 498, 'CHECK PASSED', '#0f9a58', -4) + '</g>';
      s += A.glass(614, 46, 322, 478, { fx: fx, col: huntDone() ? '#7a2a3a' : '#2b4157' }) + t(634, 74, 'THE LAB’S PLANTED COPY', { size: 14, f: 'h', fill: C.dim, ls: '.06em' });
      if (!huntDone()) {
        s += t(634, 112, 'Two numbers were planted', { size: 16, fill: '#c7d4e4' }) + t(634, 136, 'in a copy of your report.', { size: 16, fill: '#c7d4e4' }) + A.lock(634, 180, 'find them in the lab first');
        s += t(634, 234, 'They stay hidden here', { size: 15, fill: C.dim }) + t(634, 258, 'until you finish the', { size: 15, fill: C.dim }) + t(634, 282, 'hunt in the lab (6f).', { size: 15, fill: C.dim });
      } else {
        var Pt = factPaths(K.tools, ''), rows = K.planted.split('\n').filter(function (l) { return /^(RESULT|COST):/.test(l); });
        s += t(634, 110, 'the check on that copy:', { size: 15, fill: '#c7d4e4' });
        K.plantedNow.forEach(function (v, i) { s += t(634, 152 + i * 40, v + '  ✗', { size: 24, f: 'm', w: 700, fill: '#ff4d6a' }) + t(742, 152 + i * 40, 'no tool fact', { size: 15, fill: C.dim }); });
        rows.forEach(function (l, i) { s += t(634, 256 + i * 24, l.slice(0, 30) + '…', { size: 14, f: 'm', fill: '#c7d4e4' }); });
        void Pt;
      }
      s += t(634, 360, 'ONE LIMIT', { size: 14, f: 'h', fill: '#ffcf6b', ls: '.08em' }) + t(634, 388, 'A wrong number that', { size: 16, fill: '#c7d4e4' }) + t(634, 412, 'equals ANOTHER fact', { size: 16, fill: '#c7d4e4' }) + t(634, 436, 'slips through. A stronger', { size: 16, fill: '#c7d4e4' }) + t(634, 460, 'check matches each number', { size: 16, fill: '#c7d4e4' }) + t(634, 484, 'to its label.', { size: 16, fill: '#c7d4e4' });
      return s;
    },
    work: function (c) { var K = crew6(), h = hitsOf(c, 2, 999), bad = h.filter(function (g) { return !g.ok; }); return clean([{ h: 'Draft 2' }, { v: h.length + ' numbers', k: 'all found in the tool facts' }, { op: '=', v: bad.length ? bad.length + ' not found' : 'check passed', res: true, col: bad.length ? '#ff4d6a' : '#3dffa0' }, { v: '2 drafts', k: 'draft 1 sent back, draft 2 passed' }, { t: 'Never trust a report: check every number against the tools.' }, srcTag(K.you.drafts), refNote(K.you.drafts)]); } }
  ]
});


/* ============================ 6a  Who does what ============================ */
var X6A = [160, 480, 800], CAB6A = { shift_stats: [26, 392], slice_table: [258, 392], worst_cases: [490, 392], action_list: [722, 392] }, NEED6A = [['shift_stats'], ['slice_table', 'worst_cases'], ['action_list']];
function jack6a(k) { return [X6A[k] + 5, 262]; }
function sock6a(n) { var b = CAB6A[n]; return [b[0] + 106, b[1] - 2]; }
var SHORT6A = { shift_stats: 'counts the logbook', slice_table: 'groups side by side', worst_cases: 'missed + false alarms', action_list: 'your 4f action boxes' };
function why6a(k, n) {
  var K = crew6(), w = K.workers[k], d = (F6().toolDesc || {})[n] || '';
  var owner = TOOLW[n];
  return n + ': “' + d.split(':')[0].replace(/\.$/, '') + '” — that is the ' + WNAME[owner].toLowerCase() + '’s work, not the ' + WNAME[k].toLowerCase() + '’s.';
}
function scene6a(c, fx, k) {
  var K = crew6(), st = c.state, s = A.stage({ floor: 300 }) + fx.defs;
  s += t(26, 30, 'CONTROL ROOM · WHO MAY USE WHICH TOOL', { size: 15, f: 'h', fill: C.dim, ls: '.08em' });
  X6A.forEach(function (x, i) { s += worker(x, 214, i, { fx: fx, glow: i === k, dim: k != null && i !== k && !st.done, sub: (K.workers[i] || {}).goal ? K.workers[i].goal.split(',')[0].replace(/\.$/, '').slice(0, 34) + '…' : '' }); });
  s += '<rect x="14" y="368" width="932" height="160" rx="12" fill="#070b11" stroke="#1b2b3c"/>' + t(30, 386, 'TOOL WALL', { size: 14, f: 'h', fill: '#5d6b80', ls: '.12em' });
  TOOLN.forEach(function (n) { var b = CAB6A[n], lit = st.plugs.some(function (q) { return q[1] === n; }); s += cabinet(b[0], b[1], n, { fx: fx, w: 212, h: 124, lit: lit, col: lit ? WCOL[TOOLW[n]] : undefined, sub: SHORT6A[n] }); s += '<circle cx="' + sock6a(n)[0] + '" cy="' + sock6a(n)[1] + '" r="9" fill="#05080d" stroke="' + (lit ? '#3dffa0' : '#8d9bb0') + '" stroke-width="2.5"/>'; });
  st.plugs.forEach(function (q) { var a = jack6a(q[0]), b = sock6a(q[1]); s += '<path d="M' + a[0] + ' ' + a[1] + 'C' + a[0] + ' ' + (a[1] + 80) + ' ' + b[0] + ' ' + (b[1] - 90) + ' ' + b[0] + ' ' + b[1] + '" stroke="' + WCOL[q[0]] + '" stroke-width="5" fill="none" stroke-linecap="round"' + (st.last === q[1] ? ' class="pgd-draw" style="--len:500"' : '') + '/><circle cx="' + b[0] + '" cy="' + b[1] + '" r="7" fill="' + WCOL[q[0]] + '"/>'; });
  X6A.forEach(function (x, i) { var a = jack6a(i); s += '<rect x="' + (a[0] - 12) + '" y="' + (a[1] - 8) + '" width="24" height="16" rx="4" fill="#0b121b" stroke="' + WCOL[i] + '" stroke-width="2"/>'; });
  if (st.spark) { var sp = sock6a(st.spark); s += '<g class="pgd-shake"><path d="M' + sp[0] + ' ' + (sp[1] - 30) + 'l-10 18h12l-8 20 22 -28h-12l8 -10z" fill="#ffd36b"/><circle cx="' + sp[0] + '" cy="' + sp[1] + '" r="18" fill="#ff4d6a" opacity=".35"/></g>'; }
  if (st.msg) s += '<rect x="20" y="314" width="920" height="40" rx="8" fill="#2a0d14" stroke="#ff4d6a" stroke-opacity=".6"/>' + t(36, 340, st.msg, { size: 15, w: 700, fill: '#ff8aa0' });
  return s;
}
function want6a(st) { for (var k = 0; k < 3; k++) for (var j = 0; j < NEED6A[k].length; j++) { var n = NEED6A[k][j]; if (!st.plugs.some(function (q) { return q[1] === n; })) return [k, n]; } return null; }
function svg6a(c) {
  var fx = A.fx(), st = c.state, w = want6a(st), s = scene6a(c, fx, w ? w[0] : null); if (!w) return s;
  var a = jack6a(w[0]), b = sock6a(w[1]);
  s += '<g id="rub6a"></g>' + A.target('plug', '<g><rect x="' + (a[0] - 9) + '" y="' + (a[1] - 4) + '" width="18" height="26" rx="4" fill="#ffb547" stroke="#fff" stroke-width="2"/><path d="M' + (a[0] - 4) + ' ' + (a[1] + 22) + 'v8M' + (a[0] + 4) + ' ' + (a[1] + 22) + 'v8" stroke="#c7d4e4" stroke-width="3"/></g>', 'plug into its tool', a[0] + (w[0] === 2 ? -110 : 110), a[1] + 26, { kind: 'drag', to: snapTo(a[0], a[1] + 9, b[0], b[1], 16) });
  return s;
}
function bind6a(c, root) {
  var st = c.state, w = want6a(st); if (!w) return;
  var a = jack6a(w[0]), el = root.querySelector('[data-pgd-t=plug]'), rub = root.querySelector('#rub6a');
  D.onDrag(root, el, { start: { x: a[0], y: a[1] + 9 }, step: 16,
    move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - a[0]) + ' ' + (p.y - a[1] - 9) + ')'); rub.innerHTML = '<path d="M' + a[0] + ' ' + a[1] + 'Q' + ((a[0] + p.x) / 2) + ' ' + (Math.max(a[1], p.y) + 60) + ' ' + p.x + ' ' + p.y + '" stroke="' + WCOL[w[0]] + '" stroke-width="5" fill="none" stroke-dasharray="6 5"/>'; },
    drop: function (p) {
      var best = null; TOOLN.forEach(function (n) { var b = CAB6A[n]; if (p.x > b[0] - 10 && p.x < b[0] + 222 && p.y > b[1] - 30 && p.y < b[1] + 134) best = n; });
      if (!best) { el.removeAttribute('transform'); rub.innerHTML = ''; return; }
      if (NEED6A[w[0]].indexOf(best) >= 0 && !st.plugs.some(function (q) { return q[1] === best; })) {
        st.plugs.push([w[0], best]); st.last = best; st.msg = ''; st.spark = null;
        var nx = want6a(st); if (!nx || nx[0] !== w[0]) c.next(); else c.redraw(true); return; }
      st.spark = best; st.msg = '✗ ' + (st.plugs.some(function (q) { return q[1] === best; }) ? best + ' is already plugged in.' : why6a(w[0], best)); c.redraw(true);
    } });
}
function work6a(c) {
  var K = crew6(), st = c.state, r = [{ h: 'Cables plugged' }, { v: st.plugs.length + ' of 4', k: 'one cable = this worker may call this tool' }];
  [0, 1, 2].forEach(function (k) { var tl = st.plugs.filter(function (q) { return q[0] === k; }).map(function (q) { return q[1]; }); if (tl.length) r.push({ v: WNAME[k].toLowerCase() + ' → ' + tl.join(', '), k: 'goal: ' + K.workers[k].goal }); });
  r.push({ t: 'A worker can call ONLY its own tools. Its numbers come from those tools, never from its brain.' });
  return r;
}
D.register('6a', {
  init: function () { return { plugs: [], msg: '', spark: null, last: null }; },
  frames: [
  { cap: 'The inspector states the shift facts', note: 'Plug the inspector into the one tool that counts the logbook.', svg: svg6a, work: work6a, bind: bind6a, auto: function (c) { c.state.plugs = [[0, 'shift_stats']]; } },
  { cap: 'The analyst compares groups and finds the worst cases', note: 'The analyst needs two tools: the group table and the worst cases.', svg: svg6a, work: work6a, bind: bind6a, auto: function (c) { c.state.plugs = [[0, 'shift_stats'], [1, 'slice_table'], [1, 'worst_cases']]; } },
  { cap: 'The writer needs the action list', note: 'The writer has one tool. Everything else it must read from the other workers.', svg: svg6a, work: work6a, bind: bind6a, auto: function (c) { c.state.plugs = [[0, 'shift_stats'], [1, 'slice_table'], [1, 'worst_cases'], [2, 'action_list']]; c.state.done = 1; } },
  { cap: 'Three workers, four tools, one report',
    note: 'Each worker has its own job and only its own tools. The writer will need the others’ answers: that is the job order (6d).',
    svg: function (c) {
      var fx = A.fx(), K = crew6(); c.state.done = 1; var s = scene6a(c, fx, null);
      K.jobs.forEach(function (j, i) { var x = X6A[i] - 76; var d = j.desc.split(/[:.]/)[0], cut = d.lastIndexOf(' ', 28); s += '<g class="pgd-seq" style="animation-delay:' + (i * .15) + 's"><rect x="' + (x - 24) + '" y="34" width="210" height="72" rx="6" fill="#efe9da" stroke="#b9b09c"/>' + t(x - 12, 54, 'JOB ' + (i + 1), { size: 14, f: 'h', fill: '#2a3444' }) + t(x - 12, 76, d.length > 28 ? d.slice(0, cut) : d, { size: 15, fill: '#3a4656' }) + t(x - 12, 96, d.length > 28 ? d.slice(cut + 1) : '', { size: 15, fill: '#3a4656' }) + '</g>'; });
      return s;
    },
    work: function (c) { var K = crew6(); return clean(work6a(c).concat([{ h: 'Their jobs' }]).concat(K.jobs.map(function (j, i) { return { v: WNAME[i].toLowerCase(), k: j.desc }; })).concat([srcTag(K.you.workers), refNote(K.you.workers)])); } }
  ]
});

/* ============================ 6b  Make a tool ============================ */
function vend(x, y, fx, o) {   // a tool as a vending machine. o: {name, desc, knob (angle), open, slot (ticket in), lit}
  o = o || {}; var s = '', w = 330, h = 470;
  s += '<ellipse cx="' + (x + w / 2) + '" cy="' + (y + h + 8) + '" rx="' + (w / 2 + 20) + '" ry="12" fill="#000" opacity=".5"/>';
  s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="16" fill="url(#' + fx.mt + ')" stroke="#5d6b80" stroke-width="2"/>';
  s += '<rect x="' + (x + 18) + '" y="' + (y + 16) + '" width="' + (w - 36) + '" height="46" rx="8" fill="#0b121b" stroke="' + (o.lit ? '#46e3ff' : '#3a4757') + '" stroke-width="2"/>' + t(x + 32, y + 46, 'name', { size: 14, fill: C.dim });
  s += o.name ? t(x + w - 30, y + 47, o.name, { size: 20, a: 'end', f: 'm', w: 700, fill: '#46e3ff' }) : A.lock(x + 120, y + 45, 'you name it in 6b');
  s += '<rect x="' + (x + 18) + '" y="' + (y + 74) + '" width="' + (w - 36) + '" height="140" rx="8" fill="#0e1a26" stroke="' + (o.lit ? '#46e3ff' : '#3a4757') + '" stroke-width="2"/>' + t(x + 32, y + 98, 'description', { size: 14, fill: C.dim });
  var words = (o.desc || '').split(' '), line = '', ly = y + 124;
  words.forEach(function (wd) { if ((line + ' ' + wd).length > 34) { s += t(x + 32, ly, line, { size: 15, fill: '#dbe6f2' }); ly += 21; line = wd; } else line = line ? line + ' ' + wd : wd; });
  if (line) s += t(x + 32, ly, line, { size: 15, fill: '#dbe6f2' });
  s += '<rect x="' + (x + 18) + '" y="' + (y + 228) + '" width="' + (w - 36) + '" height="130" rx="8" fill="' + (o.open ? '#0b121b' : '#121a24') + '" stroke="#3a4757"/>';
  if (!o.open) { s += t(x + w / 2, y + 290, 'run()', { size: 22, a: 'middle', f: 'm', w: 700, fill: '#5d6b80' }) + t(x + w / 2, y + 318, 'the function, behind the panel', { size: 14, a: 'middle', fill: '#5d6b80' }); for (var g = 0; g < 3; g++) s += '<circle cx="' + (x + 60 + g * 100) + '" cy="' + (y + 250) + '" r="5" fill="#3a4757"/>'; }
  s += '<rect x="' + (x + 30) + '" y="' + (y + 372) + '" width="120" height="16" rx="8" fill="#05080d" stroke="#8d9bb0"/>' + t(x + 90, y + 408, 'request slot', { size: 14, a: 'middle', fill: C.dim });
  s += '<rect x="' + (x + 30) + '" y="' + (y + 420) + '" width="' + (w - 60) + '" height="36" rx="6" fill="#05080d" stroke="#3a4757"/>' + t(x + w / 2, y + 444, 'result tray', { size: 14, a: 'middle', fill: '#5d6b80' });
  var kx = x + 250, ky = y + 390, an = (o.knob || 0) * Math.PI / 180;
  s += '<circle cx="' + kx + '" cy="' + ky + '" r="30" fill="#0b121b" stroke="#8d9bb0" stroke-width="2"/><g transform="rotate(' + (o.knob || 0) + ' ' + kx + ' ' + ky + ')"><rect x="' + (kx - 6) + '" y="' + (ky - 28) + '" width="12" height="56" rx="6" fill="#c7d4e4"/><circle cx="' + kx + '" cy="' + (ky - 22) + '" r="4" fill="#ff4d6a"/></g>';
  void an;
  return s;
}
function toolRes6b() { var K = crew6(); return K.tools.shift_stats || {}; }
function nameOK6b() { return unlocked('6b'); }
function ledger6b(fx, x, y) {   // the other three ready-made machines, small, with one real result each
  var K = crew6(), s = '';
  [['slice_table', 'poly passed / 100', (((K.tools.slice_table || {}).groups || {}).poly || {}).passed_per_100], ['worst_cases', 'missed defects', (K.tools.worst_cases || {}).missed_count], ['action_list', 'mistakes sorted', (K.tools.action_list || {}).sorted]].forEach(function (q, i) {
    var yy = y + i * 102; s += '<rect x="' + x + '" y="' + yy + '" width="214" height="88" rx="10" fill="url(#' + fx.mt + ')" stroke="#3a4757"/>' + t(x + 14, yy + 26, q[0], { size: 15, f: 'm', w: 700, fill: '#c7d4e4' }) + t(x + 14, yy + 52, q[1], { size: 14, fill: C.dim }) + t(x + 200, yy + 74, String(q[2]), { size: 20, a: 'end', f: 'm', w: 700, fill: '#3dffa0' });
  });
  return s;
}
D.register('6b', {
  init: function () { return { knob: 0 }; },
  frames: [
  { cap: 'A tool is a machine with a name plate and a description',
    note: 'The worker’s model reads only the name and the description, then decides to call it. It never sees inside.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage({ floor: 500 }) + fx.defs, K = crew6();
      s += vend(40, 30, fx, { name: nameOK6b() ? 'shift_stats' : null, desc: (F6().toolDesc || {}).shift_stats, lit: true });
      s += '<path d="M370 120C440 120 450 150 520 150" stroke="#46e3ff" stroke-width="2" stroke-dasharray="5 5" fill="none"/>' + A.glass(520, 40, 200, 176, { fx: fx, col: '#2b4760' }) + t(540, 70, 'THE MODEL SEES', { size: 14, f: 'h', fill: '#46e3ff', ls: '.08em' }) + t(540, 100, '• the name', { size: 16, fill: '#dbe6f2' }) + t(540, 126, '• the description', { size: 16, fill: '#dbe6f2' }) + t(540, 160, 'NOT the function', { size: 16, w: 700, fill: '#ff8aa0' }) + t(540, 184, 'NOT the logbook', { size: 16, w: 700, fill: '#ff8aa0' });
      s += t(736, 50, 'THE 3 READY-MADE TOOLS', { size: 14, f: 'h', fill: C.dim, ls: '.06em' }) + ledger6b(fx, 732, 64);
      s += A.target('ticket', '<g><rect x="520" y="300" width="190" height="62" rx="6" fill="#efe9da" stroke="#b9b09c"/>' + t(544, 326, 'REQUEST', { size: 14, f: 'h', fill: '#2a3444' }) + t(544, 350, 'arguments: none {}', { size: 15, f: 'm', fill: '#4a5668' }) + '</g>', 'feed the request', 610, 400, { kind: 'drag', to: snapTo(610, 331, 130, 410, 16) });
      return s;
    },
    work: function (c) { var K = crew6(); return clean([{ h: 'What the model is given' }, { v: nameOK6b() ? 'shift_stats' : '? (gap 1)', k: 'the name the workers call' }, { v: ((F6().toolDesc || {}).shift_stats || '').length + ' characters', k: 'the description: when to call it' }, { t: 'The arguments are an empty object: this tool needs nothing, it always reads the last shift.' }, srcTag(K.you.tools)]); },
    bind: function (c, root) {
      var el = root.querySelector('[data-pgd-t=ticket]');
      D.onDrag(root, el, { start: { x: 610, y: 331 }, step: 16, move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - 610) + ' ' + (p.y - 331) + ')'); },
        drop: function (p) { if (Math.abs(p.x - 130) < 110 && Math.abs(p.y - 410) < 60) c.next(); else el.removeAttribute('transform'); } });
    } },
  { cap: 'Turn the knob: the function runs',
    note: 'Calling the tool runs a plain function over the real Step 5 logbook. The model waits for its answer.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage({ floor: 500 }) + fx.defs, k = c.state.knob || 0;
      s += vend(40, 30, fx, { name: nameOK6b() ? 'shift_stats' : null, desc: (F6().toolDesc || {}).shift_stats, knob: k });
      s += '<rect x="80" y="400" width="80" height="8" rx="3" fill="#efe9da"/>';
      var kx = 290, ky = 420, r = 54;
      s += '<path d="M' + kx + ' ' + (ky - r) + 'A' + r + ' ' + r + ' 0 1 1 ' + (kx - r) + ' ' + ky + '" stroke="#ffb547" stroke-width="3" stroke-dasharray="6 6" fill="none" opacity=".7"/>';
      s += A.target('knob', '<circle cx="' + kx + '" cy="' + (ky - r) + '" r="14" fill="#ffb547" stroke="#fff" stroke-width="2.5"/>', 'turn the knob', 480, 360, { kind: 'drag', to: snapTo(kx, ky - r, kx - r, ky, 8) });
      s += A.glass(520, 60, 400, 200, { fx: fx, col: '#2b4760' }) + t(540, 92, 'WHAT RUNS', { size: 14, f: 'h', fill: C.dim, ls: '.08em' }) + t(540, 126, 'count every row of the', { size: 17, fill: '#dbe6f2' }) + t(540, 152, 'Step 5 logbook (5g shift)', { size: 17, fill: '#dbe6f2' }) + t(540, 196, (toolRes6b().cells || '?') + ' rows', { size: 28, f: 'm', w: 700, fill: '#46e3ff' }) + t(540, 230, 'the same counter as 5g', { size: 15, fill: C.dim });
      return s;
    },
    work: function () { return [{ h: 'One call' }, { v: 'request in', k: 'from the worker’s model' }, { v: 'run()', k: 'a plain function: counts the logbook' }, { v: 'result out', k: 'facts as numbers, back to the model' }]; },
    bind: function (c, root) {
      var kx = 290, ky = 420, r = 54, el = root.querySelector('[data-pgd-t=knob]'), ring = el.querySelector('.pgd-ring'), knob = null;
      D.onDrag(root, el, { start: { x: kx, y: ky - r }, step: 8,
        move: function (p) { var a = Math.atan2(p.y - ky, p.x - kx), deg = ((a * 180 / Math.PI + 90) + 360) % 360; ring.setAttribute('transform', 'rotate(' + deg.toFixed(0) + ' ' + kx + ' ' + ky + ')'); c.state.knob = deg; knob = deg; var g = root.querySelectorAll('g[transform^="rotate("]'); if (g[0] && g[0] !== ring) g[0].setAttribute('transform', 'rotate(' + deg.toFixed(0) + ' 290 420)'); },
        drop: function (p) { var a = Math.atan2(p.y - ky, p.x - kx), deg = ((a * 180 / Math.PI + 90) + 360) % 360; if (deg > 200 && deg < 300) { c.state.knob = 270; c.next(); } else { ring.removeAttribute('transform'); } } });
    } },
  { cap: 'The result drops out: real facts of the shift',
    note: 'The function returns numbers counted from the logbook. They go back to the model as the tool result.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage({ floor: 500 }) + fx.defs, R = toolRes6b();
      s += vend(40, 30, fx, { name: nameOK6b() ? 'shift_stats' : null, desc: (F6().toolDesc || {}).shift_stats, knob: 270 });
      var rows = [['cells', R.cells], ['defects', R.defects], ['defects_passed', R.defects_passed], ['defects_passed_per_100', R.defects_passed_per_100], ['target_max_per_100', R.target_max_per_100], ['good_cells_stopped', R.good_cells_stopped], ['person_checks', R.person_checks], ['per_1000', R.per_1000 ? R.per_1000.pass + ' / ' + R.per_1000.person + ' / ' + R.per_1000.stop : '']];
      s += '<g class="pgd-drop"><g filter="url(#' + fx.sh + ')"><path d="M410 40h380v' + (rows.length * 30 + 70) + 'l-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-12 -8-12 8-20 -8z" fill="#f1ecdf"/></g>' + t(430, 74, 'TOOL RESULT', { size: 16, f: 'h', fill: '#2a3444', ls: '.08em' });
      rows.forEach(function (q, i) { s += t(430, 110 + i * 30, q[0], { size: 15, f: 'm', fill: '#4a5668' }) + t(772, 110 + i * 30, String(q[1]), { size: 17, a: 'end', f: 'm', w: 700, fill: '#0f5a8a' }); });
      s += '</g>' + A.target('panel', '<rect x="58" y="258" width="294" height="130" rx="8" fill="#46e3ff" fill-opacity=".06" stroke="#ffb547" stroke-width="2" stroke-dasharray="6 5"/>', 'open the back panel', 205, 342, {});
      s += t(820, 120, '', {});
      return s;
    },
    work: function (c) { var K = crew6(), R = toolRes6b(); return clean([{ h: 'The result, as the model gets it' }, { v: R.defects_passed + ' of ' + R.defects, k: 'defects passed' }, { op: '÷', v: R.defects + ' × 100', k: '' }, { op: '=', v: R.defects_passed_per_100 + ' per 100', k: 'target: at most ' + R.target_max_per_100, res: true }, { v: String(R.person_checks), k: 'person checks this shift' }, srcTag(K.you.tools), refNote(K.you.tools)]); },
    on: { panel: function (c) { c.next(); } } },
  { cap: 'The numbers come from the function, never from the model',
    note: 'Behind the panel: the logbook rows, counted. A model can write any number; a tool reads it from the data.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage({ floor: 500 }) + fx.defs, R = toolRes6b(), log = ((window.PGD_FACTS || {}).s7 || {}).belt;
      s += vend(40, 30, fx, { name: nameOK6b() ? 'shift_stats' : null, desc: (F6().toolDesc || {}).shift_stats, knob: 270, open: true });
      (log ? log.cells.slice(0, 5) : []).forEach(function (q, i) { s += t(70, 284 + i * 18, 'cell ' + q[0] + ' · ' + q[1] + ' · ' + q[2], { size: 14, f: 'm', fill: '#9fe8c2', cls: 'pgd-seq' }); });
      s += t(330, 372, '… ' + R.cells + ' rows', { size: 14, a: 'end', f: 'm', fill: '#9fe8c2' });
      s += A.glass(410, 40, 520, 470, { fx: fx, col: '#2b4760' }) + t(432, 74, 'MODEL vs TOOL', { size: 15, f: 'h', fill: C.dim, ls: '.08em' });
      s += t(432, 116, 'the model', { size: 18, w: 700, fill: '#a98bff' }) + t(432, 144, 'decides WHEN to call a tool,', { size: 16, fill: '#dbe6f2' }) + t(432, 168, 'from its name + description', { size: 16, fill: '#dbe6f2' });
      s += t(432, 220, 'the tool', { size: 18, w: 700, fill: '#46e3ff' }) + t(432, 248, 'gives the NUMBERS:', { size: 16, fill: '#dbe6f2' }) + t(432, 276, R.cells + ' rows counted → ' + R.defects_passed + ' of ' + R.defects + ' passed', { size: 16, f: 'm', fill: '#46e3ff' });
      s += t(432, 330, 'In this lab the brain is a', { size: 16, fill: C.dim }) + t(432, 354, 'SCRIPTED model (rules): it calls', { size: 16, fill: C.dim }) + t(432, 378, 'each of its tools once, in order.', { size: 16, fill: C.dim });
      s += t(432, 430, 'same 4 tools in real CrewAI:', { size: 16, fill: C.dim }) + t(432, 456, '@tool("…") + docstring', { size: 16, f: 'm', fill: '#c7d4e4' });
      return s;
    },
    work: function (c) { var K = crew6(), R = toolRes6b(); return clean([{ h: 'Where each number comes from' }, { v: String(R.cells), k: 'rows in the logbook (5g shift)' }, { v: String(R.defects), k: 'rows whose expert label is defect' }, { v: String(R.defects_passed), k: 'of those, final decision pass' }, { t: 'Numbers come from tools, never from the model.' }, srcTag(K.you.tools), refNote(K.you.tools)]); } }
  ]
});

/* ============================ 6c  Hire the workers ============================ */
var PIECE6C = [['role', '#46e3ff'], ['backstory', '#a98bff'], ['goal', '#ffb547'], ['tools', '#3dffa0']];
function badge6c(x, y, w, k, fx, o) {   // an ID badge on a lanyard. o: {front: true, hi: piece index, lockRole}
  o = o || {}; var K = crew6(), W = K.workers[k] || {}, s = '', h = o.h || 300, col = WCOL[k];
  s += '<path d="M' + (x + w / 2 - 30) + ' ' + (y - 40) + 'L' + (x + w / 2) + ' ' + y + 'L' + (x + w / 2 + 30) + ' ' + (y - 40) + '" stroke="' + col + '" stroke-width="6" fill="none"/>';
  s += '<g filter="url(#' + fx.sh + ')"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="14" fill="#f4f1ea"/></g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="44" rx="14" fill="' + col + '"/><rect x="' + x + '" y="' + (y + 30) + '" width="' + w + '" height="14" fill="' + col + '"/>';
  s += '<rect x="' + (x + w / 2 - 20) + '" y="' + (y + 10) + '" width="40" height="8" rx="4" fill="#0b121b" opacity=".5"/>' + t(x + 16, y + 38, 'PANELGUARD CREW', { size: 14, f: 'h', fill: '#0b121b', ls: '.08em' });
  var role = o.lockRole ? null : W.role, tl = (W.tools || []).slice(); if (o.lockRole && tl.length > 1) tl[1] = '? (6c)'; var rows = [['role', role], ['backstory', W.backstory], ['goal', W.goal], ['tools', tl.join(', ')]];
  var yy = y + 74;
  rows.forEach(function (r, i) {
    var lit = o.hi === i, pc = PIECE6C[i][1];
    if (lit) s += '<rect x="' + (x + 8) + '" y="' + (yy - 22) + '" width="' + (w - 16) + '" height="' + (i === 0 ? 34 : i === 3 ? 44 : 62) + '" rx="6" fill="' + pc + '" fill-opacity=".22" stroke="' + pc + '" class="pgd-pop"/>';
    s += t(x + 16, yy - 4, i === 3 ? 'can use' : r[0], { size: 14, fill: '#6b7280' });
    if (r[1] == null) { s += A.lock(x + 90, yy - 2, 'you type it in 6c'); yy += 38; return; }
    if (i === 0) { s += t(x + 90, yy - 2, r[1], { size: o.big ? 20 : 17, w: 700, fill: '#111827' }); yy += 38; return; }
    var words = String(r[1]).split(' '), line = '', ly = yy + 16, lines = 0, max = o.big ? 40 : 30;
    var fs = o.big ? 16 : 14; words.forEach(function (wd) { if ((line + ' ' + wd).length > max && lines < 1) { s += t(x + 16, ly, line, { size: fs, fill: '#1f2937' }); ly += fs + 4; line = wd; lines++; } else line = line ? line + ' ' + wd : wd; });
    if (line) s += t(x + 16, ly, line.length > max ? line.slice(0, max - 1) + '…' : line, { size: fs, f: i === 3 ? 'm' : 'b', fill: '#1f2937' });
    yy += 66;
  });
  return s;
}
function back6c(x, y, w, h, fx, hi) {   // the back of the badge: the exact prompt text built from the pieces
  var K = crew6(), W = K.workers[0], pr = W.prompt || F6().prompts[0], s = '';
  s += '<g filter="url(#' + fx.sh + ')"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="14" fill="#0d1520" stroke="#46e3ff" stroke-width="2"/></g>' + t(x + 18, y + 30, 'THE BACK · WHAT THE MODEL IS GIVEN', { size: 14, f: 'h', fill: '#46e3ff', ls: '.06em' });
  var lines = [], m = pr.match(/^You are (.+?)\. (.+?)\nYour personal goal is: (.+?)\n/);
  lines.push([[['You are ', -1], [W.role, 0], ['. ', -1]]]);
  lines.push([[[W.backstory, 1]]]);
  lines.push([[['Your personal goal is: ', -1], [W.goal, 2]]]);
  lines.push([[['You ONLY have access to the following tools…', -1]]]);
  lines.push([[['Tool Name: ', -1], [W.tools[0], 3]]]);
  lines.push([[['Tool Description: ', -1], [((F6().toolDesc || {})[W.tools[0]] || '').slice(0, 30) + '…', 3]]]);
  lines.push([[['…the Thought / Action / Final Answer format (fixed text)', -1]]]);
  void m;
  var yy = y + 66;
  lines.forEach(function (ln) {
    var segs = ln[0], txt = '', col;
    // wrap long single segments
    var flat = segs.map(function (g) { return g[0]; }).join(''), parts = [];
    if (flat.length > 52) { var cut = flat.lastIndexOf(' ', 52); parts = [flat.slice(0, cut), flat.slice(cut + 1)]; } else parts = [flat];
    var pc = segs.filter(function (g) { return g[1] >= 0; })[0], k = pc ? pc[1] : -1;
    parts.forEach(function (pt) {
      col = k < 0 ? '#8d9bb0' : (hi != null && hi >= k ? PIECE6C[k][1] : '#c7d4e4');
      if (k >= 0 && hi === k) s += '<rect x="' + (x + 10) + '" y="' + (yy - 17) + '" width="' + (w - 20) + '" height="24" rx="5" fill="' + PIECE6C[k][1] + '" fill-opacity=".16" class="pgd-pop"/>';
      s += t(x + 18, yy, pt, { size: 15, f: 'm', fill: col }); yy += 26;
    });
    void txt;
  });
  s += t(x + 18, y + h - 18, pr.length.toLocaleString('en-US') + ' characters in all', { size: 14, fill: C.dim });
  return s;
}
D.register('6c', {
  init: function () { return { hi: -1 }; },
  frames: [
  { cap: 'A worker is a badge: role, backstory, goal, tools',
    note: 'new Agent stores four things. Nothing runs yet.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs;
      s += badge6c(300, 70, 360, 0, fx, { big: true, h: 380 });
      s += A.target('flip', '<g><path d="M612 404l48 0 0 46z" fill="#ffb547"/><path d="M612 404l48 46" stroke="#fff" stroke-width="2"/></g>', 'flip the badge', 760, 430, {});
      s += A.glass(40, 90, 220, 200, { fx: fx, col: '#2b4760' }) + t(58, 122, 'THE CODE STORES', { size: 14, f: 'h', fill: C.dim, ls: '.06em' }) + PIECE6C.map(function (p, i) { return t(58, 156 + i * 30, '■ ' + (i === 3 ? 'its tools' : p[0]), { size: 17, fill: p[1] }); }).join('');
      return s;
    },
    work: function (c) { var K = crew6(), W = K.workers[0]; return clean([{ h: 'The inspector’s badge' }, { v: W.role, k: 'role' }, { v: W.tools.join(', '), k: 'the one tool it may call' }, { t: 'These texts become, word for word, the instructions the model reads.' }, srcTag(K.you.workers), refNote(K.you.workers)]); },
    on: { flip: function (c) { c.state.hi = -1; c.next(); } }, auto: function (c) { c.state.hi = -1; } },
  { cap: 'The back: the prompt is built from the pieces',
    note: 'Tap the pieces in order. Each piece of the badge lands, word for word, in the text the model is given.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs, hi = c.state.hi;
      s += '<g transform="translate(-6 0)">' + badge6c(24, 70, 300, 0, fx, { hi: hi >= 0 ? hi : null, h: 380 }) + '</g>';
      s += '<g class="' + (hi < 0 ? 'pgd-flip' : '') + '">' + back6c(360, 50, 580, 420, fx, hi) + '</g>';
      var nx = hi + 1;
      if (nx < 4) s += A.target('piece', '<circle cx="300" cy="' + (144 + (nx ? 38 + (nx - 1) * 66 + 10 : -8)) + '" r="13" fill="' + PIECE6C[nx][1] + '" stroke="#fff" stroke-width="2.5"/>', 'tap the ' + (nx === 3 ? 'last' : 'next') + ' piece', 170, 500, {});
      return s;
    },
    work: function (c) { var hi = c.state.hi, K = crew6(), W = K.workers[0], r = [{ h: 'Pieces placed' }, { v: Math.max(0, hi + 1) + ' of 4', k: '' }];
      if (hi >= 0) r.push({ v: '“You are ' + W.role + '.”', k: 'role → first sentence' });
      if (hi >= 1) r.push({ v: 'backstory', k: 'right after the role' });
      if (hi >= 2) r.push({ v: '“Your personal goal is: …”', k: 'the goal' });
      if (hi >= 3) r.push({ v: 'Tool Name + Description', k: 'one block per tool, then a fixed format text' });
      r.push({ t: 'Same prompt slices as CrewAI 1.15 (its en.json). The lab’s Python twin gives the same text.' });
      return clean(r.concat([srcTag(K.you.workers)])); },
    on: { piece: function (c) { c.state.hi++; if (c.state.hi >= 3) c.next(); else c.redraw(true); } }, auto: function (c) { c.state.hi = 3; } },
  { cap: 'Three badges, three prompts, one brain',
    note: 'Each worker gets its own prompt. In this lab all three share one brain: a scripted model.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs, K = crew6();
      [0, 1, 2].forEach(function (k) { s += badge6c(24 + k * 306, 60, 290, k, fx, { h: 330, lockRole: k === 1 && !unlocked('6c') }) + t(169 + k * 306, 420, (K.workers[k].chars || (F6().prompts[k] || '').length).toLocaleString('en-US') + ' characters', { size: 15, a: 'middle', f: 'm', fill: '#c7d4e4' }); });
      s += A.target('brain', '<g><rect x="380" y="448" width="200" height="66" rx="12" fill="url(#' + fx.mt + ')" stroke="#ffb547" stroke-width="2"/>' + t(480, 476, 'BRAIN', { size: 15, a: 'middle', f: 'h', fill: '#ffb547' }) + t(480, 500, 'what is inside?', { size: 14, a: 'middle', fill: '#dbe6f2' }) + '</g>', 'open the brain', 700, 482, {});
      return s;
    },
    work: function (c) { var K = crew6(); return clean([{ h: 'Prompt length (characters)' }].concat([0, 1, 2].map(function (k) { return { v: String(K.workers[k].chars || F6().prompts[k].length), k: WNAME[k].toLowerCase() + ' · tools: ' + K.workers[k].tools.join(', ') }; })).concat([srcTag(K.you.workers), refNote(K.you.workers)])); },
    on: { brain: function (c) { c.next(); } } },
  { cap: 'The brain here is scripted rules, not a language model',
    note: 'Rule 1: call each of my tools once, in order. Rule 2: fill the sentence pattern for my role. No key, no network.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs;
      s += '<rect x="60" y="70" width="380" height="400" rx="20" fill="url(#' + fx.mt + ')" stroke="#ffb547" stroke-width="2"/>' + t(250, 110, 'SCRIPTED MODEL', { size: 20, a: 'middle', f: 'h', fill: '#ffb547' }) + t(250, 136, 'rules · no key · no network', { size: 15, a: 'middle', fill: '#dbe6f2' });
      [['RULE 1', 'call each of my tools once,', 'in order'], ['RULE 2', 'fill the sentence pattern', 'picked by my ROLE name'], ['RULE 3 (6f only)', 'change 2 numbers in draft 1', 'on purpose, then remove']].forEach(function (r, i) { var y = 176 + i * 96; s += '<rect x="86" y="' + y + '" width="328" height="80" rx="10" fill="#0b121b" stroke="#3a4757" class="pgd-seq" style="animation-delay:' + i * .12 + 's"/>' + t(102, y + 26, r[0], { size: 14, f: 'h', fill: '#ffcf6b' }) + t(102, y + 50, r[1], { size: 16, fill: '#dbe6f2' }) + t(102, y + 70, r[2], { size: 16, fill: '#dbe6f2' }); });
      s += A.glass(480, 70, 440, 400, { fx: fx, col: '#2b4760' }) + t(502, 106, 'WHY THE ROLE NAME MATTERS', { size: 15, f: 'h', fill: '#46e3ff', ls: '.06em' });
      [['role contains', 'pattern'], ['“inspector”', 'SHIFT FACTS'], ['“analyst”', 'WHERE FAILURES CLUSTER'], ['“writer”', 'SHIFT QUALITY REPORT']].forEach(function (r, i) { var y = 152 + i * 46; s += t(502, y, r[0], { size: i ? 17 : 14, f: i ? 'm' : 'b', fill: i ? '#dbe6f2' : C.dim }) + t(690, y, r[1], { size: i ? 15 : 14, f: i ? 'h' : 'b', fill: i ? '#46e3ff' : C.dim }); });
      s += t(502, 368, 'A real model (6g) reads the', { size: 16, fill: C.dim }) + t(502, 392, 'whole prompt instead.', { size: 16, fill: C.dim }) + t(502, 436, 'Same badges, same tools.', { size: 17, w: 700, fill: '#3dffa0' });
      return s;
    },
    work: function () { return [{ h: 'The brain' }, { v: 'ScriptedLLM', k: 'rules, not a language model' }, { t: 'A wrong role name gives no sentence pattern: the scripted model then just lists its tool results.' }, { t: 'Role, goal and backstory become the model’s instructions. Tools decide what it can look up.' }]; } }
  ]
});

/* ============================ 6d  Give the jobs an order ============================ */
var JOB6D = ['READ THE SHIFT FACTS', 'FIND THE CAUSES', 'WRITE THE REPORT'];
function folder6d(x, y, k, o) {
  o = o || {}; var col = WCOL[k], s = '';
  s += '<g' + (o.cls ? ' class="' + o.cls + '"' : '') + '><path d="M' + x + ' ' + (y + 14) + 'h60l12 -14h60l8 14h90v120h-230z" fill="' + col + '" fill-opacity=".9"/><rect x="' + x + '" y="' + (y + 24) + '" width="230" height="120" rx="6" fill="#f1ecdf"/>';
  s += t(x + 14, y + 54, 'JOB · ' + WNAME[k], { size: 14, f: 'h', fill: '#2a3444', ls: '.04em' }) + t(x + 14, y + 82, JOB6D[k], { size: 16, w: 700, fill: '#1f2937' });
  s += t(x + 14, y + 110, o.reads != null ? 'reads: ' + o.reads : '', { size: 14, fill: '#4a5668' }) + '<circle cx="' + (x + 214) + '" cy="' + (y + 130) + '" r="7" fill="#5d6b80"/></g>';
  return s;
}
var SLOT6D = [40, 340, 640], RAIL6D = 120;
function rail6d(fx) { return '<rect x="20" y="' + (RAIL6D - 26) + '" width="920" height="10" rx="5" fill="url(#' + fx.mt + ')" stroke="#5d6b80"/>' + [0, 1, 2].map(function (i) { return t(SLOT6D[i] + 115, RAIL6D - 40, (i + 1) + (i ? (i === 1 ? 'nd' : 'rd') : 'st'), { size: 15, a: 'middle', f: 'h', fill: C.dim }); }).join(''); }
function report6d(txt, x, y, w, fx, locked) {
  var s = '<g filter="url(#' + fx.sh + ')"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="230" rx="4" fill="#f1ecdf"/></g>' + t(x + 16, y + 28, 'THE REPORT', { size: 15, f: 'h', fill: '#2a3444', ls: '.06em' });
  var L = (txt || '').split('\n'), keys = [['RESULT', /^RESULT: /], ['COST', /^COST: /], ['WHERE IT FAILS', /^WHERE IT FAILS: /], ['ACTION LIST', /^• (Work the action list|Sort the mistakes)/]];
  keys.forEach(function (k, i) {
    var line = L.filter(function (l) { return k[1].test(l); })[0] || '', miss = /not known/.test(line), yy = y + 66 + i * 40; if (!locked && k[0] === 'ACTION LIST' && /^• Sort/.test(line)) miss = false;
    s += t(x + 16, yy, k[0], { size: 15, f: 'h', fill: '#2a3444' });
    if (locked) { s += A.lock(x + 170, yy, 'answer the 6d prediction first'); return; }
    s += '<rect x="' + (x + 166) + '" y="' + (yy - 18) + '" width="' + (w - 182) + '" height="26" rx="4" fill="' + (miss ? '#ff4d6a' : '#3dffa0') + '" fill-opacity=".18" stroke="' + (miss ? '#c01a36' : '#0f7a48') + '" stroke-opacity=".5"/>' +
      t(x + 176, yy, miss ? 'not known' : (function (z) { var M = Math.floor((w - 196) / 8.6); return z.length > M ? z.slice(0, M - 1) + '…' : z; })(line.replace(k[1], '').replace(/^Work the action list: /, '')), { size: 14, f: 'm', w: 700, fill: miss ? '#b0102e' : '#0f5a3a' });
  });
  return s;
}
D.register('6d', {
  init: function () { return { order: [2, 0, 1], strings: [] }; },
  frames: [
  { cap: 'Run 1 (wrong on purpose): the writer goes first, reading nothing',
    note: 'The jobs run left to right. The writer runs first and reads no earlier answers.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage({ floor: 280 }) + fx.defs + rail6d(fx);
      c.state.order.forEach(function (k, i) { s += folder6d(SLOT6D[i], RAIL6D - 12, k, { reads: k === 2 ? 'nothing' : k === 1 ? 'the facts job' : 'nothing (first job)' }); });
      s += worker(480, 430, 2, { fx: fx, glow: true, sub: 'its own tool only: action_list' });
      s += A.target('run', '<g><circle cx="830" cy="400" r="42" fill="#c01a36" stroke="#fff" stroke-width="3"/>' + t(830, 406, 'RUN', { size: 18, a: 'middle', f: 'h', fill: '#fff' }) + '</g>', 'run the crew', 830, 470, {});
      return s;
    },
    work: function () { return [{ h: 'Run 1' }, { v: 'writer → inspector → analyst', k: 'the running order' }, { v: 'nothing', k: 'what the writer reads' }, { t: 'A worker knows two things only: what its own tools return, and the earlier answers it is told to read.' }]; },
    on: { run: function (c) { c.next(); } } },
  { cap: 'The writer’s report has holes where numbers should be',
    note: 'Which lines could the writer fill on its own? Answer the 6d prediction in the lab to see the real report here.',
    svg: function (c) {
      var fx = A.fx(), K = crew6(), s = A.stage({ floor: 280 }) + fx.defs + rail6d(fx), lk = !D.predDone('6d');
      c.state.order.forEach(function (k, i) { s += folder6d(SLOT6D[i], RAIL6D - 12, k, { cls: k === 2 ? '' : 'pgd-x' }); });
      s += report6d(K.poor, 420, 296, 520, fx, lk);
      var ax = SLOT6D[0];
      s += A.target('slide', '<g><rect x="' + (ax + 236) + '" y="' + (RAIL6D + 40) + '" width="30" height="64" rx="8" fill="#ffb547" stroke="#fff" stroke-width="2"/><path d="M' + (ax + 244) + ' ' + (RAIL6D + 72) + 'h14m-5 -6l6 6-6 6" stroke="#1a1103" stroke-width="2.5" fill="none"/></g>', 'slide the writer to the end', 216, 470, { kind: 'drag', to: snapTo(ax + 251, RAIL6D + 72, SLOT6D[2] + 251, RAIL6D + 72, 20) });
      return s;
    },
    work: function (c) { var K = crew6(), lk = !D.predDone('6d'); if (lk) return [{ h: 'Run 1 result' }, { v: 'locked', k: 'answer the 6d prediction in the lab first' }, { t: 'Think: the writer’s ONLY tool is the action list. Which lines need the shift facts or the analysis?' }];
      var f = { result: !/RESULT: not known/.test(K.poor), cost: !/COST: not known/.test(K.poor), where: !/WHERE IT FAILS: not known/.test(K.poor) };
      return [{ h: 'Run 1 result' }, { v: (f.result ? 1 : 0) + (f.cost ? 1 : 0) + (f.where ? 1 : 0) + 1 + ' of 4', k: 'report lines filled' }, { v: 'not known', k: 'where shift facts or analysis were needed' }, { tag: 'typical value' }]; },
    bind: function (c, root) {
      var ax = SLOT6D[0], el = root.querySelector('[data-pgd-t=slide]'), sx = ax + 251, sy = RAIL6D + 72;
      D.onDrag(root, el, { start: { x: sx, y: sy }, step: 20, clamp: function (p) { return { x: Math.max(sx, Math.min(SLOT6D[2] + 251, p.x)), y: sy }; },
        move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - sx) + ' 0)'); },
        drop: function (p) { if (p.x > SLOT6D[2] + 150) { c.state.order = [0, 1, 2]; c.next(); } else el.removeAttribute('transform'); } });
    }, auto: function (c) { c.state.order = [0, 1, 2]; } },
  { cap: 'Tie the strings: which earlier answers each job reads',
    note: 'The analyst reads the facts job. The writer reads both earlier jobs. A string can only go back in time.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage({ floor: 280 }) + fx.defs + rail6d(fx), st = c.state, need = [[1, 0], [2, 0], [2, 1]];
      [0, 1, 2].forEach(function (k, i) { var rd = st.strings.filter(function (q) { return q[0] === k; }).map(function (q) { return WNAME[q[1]].toLowerCase(); }); s += folder6d(SLOT6D[i], RAIL6D - 12, k, { reads: rd.length ? rd.join(' + ') : k ? '…' : 'nothing (first job)' }); });
      st.strings.forEach(function (q, j) { var a = SLOT6D[q[0]] + 40, b = SLOT6D[q[1]] + 190, dip = 310 + j * 34; s += '<path d="M' + a + ' ' + (RAIL6D + 132) + 'C' + a + ' ' + dip + ' ' + b + ' ' + dip + ' ' + b + ' ' + (RAIL6D + 132) + '" stroke="' + WCOL[q[0]] + '" stroke-width="3.5" fill="none"' + (j === st.strings.length - 1 ? ' class="pgd-draw" style="--len:700"' : '') + '/>'; });
      var nx = need.filter(function (q) { return !st.strings.some(function (z) { return z[0] === q[0] && z[1] === q[1]; }); })[0];
      if (nx) { var a = SLOT6D[nx[0]] + 40, b = SLOT6D[nx[1]] + 190; s += '<circle cx="' + b + '" cy="' + (RAIL6D + 132) + '" r="10" fill="none" stroke="#ffb547" stroke-width="2" stroke-dasharray="4 3"/><g id="rub6d"></g>' + A.target('hook', '<circle cx="' + a + '" cy="' + (RAIL6D + 132) + '" r="11" fill="#ffb547" stroke="#fff" stroke-width="2.5"/>', 'tie: ' + WNAME[nx[0]].toLowerCase() + ' reads ' + WNAME[nx[1]].toLowerCase(), 480, 400, { kind: 'drag', to: snapTo(a, RAIL6D + 132, b, RAIL6D + 132, 20) }); }
      s += A.arrow(60, 500, 900, 500, '#5d6b80', { w: 2 }) + t(60, 490, 'runs first', { size: 14, fill: C.dim }) + t(900, 490, 'runs last', { size: 14, a: 'end', fill: C.dim });
      if (st.msg) s += t(480, 460, st.msg, { size: 16, a: 'middle', w: 700, fill: '#ff8aa0', cls: 'pgd-shake' });
      return s;
    },
    work: function (c) { var r = [{ h: 'Strings tied' }, { v: c.state.strings.length + ' of 3', k: '“this job reads the answer of that one”' }]; c.state.strings.forEach(function (q) { r.push({ v: WNAME[q[0]].toLowerCase() + ' ← ' + WNAME[q[1]].toLowerCase(), k: '' }); }); r.push({ t: 'Reading a job that has not run yet is refused before anything runs (CrewAI has the same rule).' }); return r; },
    bind: function (c, root) {
      var st = c.state, need = [[1, 0], [2, 0], [2, 1]], nx = need.filter(function (q) { return !st.strings.some(function (z) { return z[0] === q[0] && z[1] === q[1]; }); })[0]; if (!nx) return;
      var a = SLOT6D[nx[0]] + 40, ay = RAIL6D + 132, el = root.querySelector('[data-pgd-t=hook]'), rub = root.querySelector('#rub6d');
      D.onDrag(root, el, { start: { x: a, y: ay }, step: 20, move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - a) + ' ' + (p.y - ay) + ')'); rub.innerHTML = '<path d="M' + a + ' ' + ay + 'Q' + ((a + p.x) / 2) + ' ' + (ay + 80) + ' ' + p.x + ' ' + p.y + '" stroke="#ffb547" stroke-width="3" stroke-dasharray="6 5" fill="none"/>'; },
        drop: function (p) {
          var hit = null; [0, 1, 2].forEach(function (k) { var x = SLOT6D[k]; if (p.x > x - 10 && p.x < x + 240 && p.y > RAIL6D - 20 && p.y < RAIL6D + 160) hit = k; });
          if (hit == null || hit === nx[0]) { el.removeAttribute('transform'); rub.innerHTML = ''; return; }
          if (hit > nx[0]) { st.msg = 'Refused: the ' + WNAME[hit].toLowerCase() + ' runs LATER. A job can only read jobs that ran before it.'; c.redraw(true); return; }
          if (!st.strings.some(function (z) { return z[0] === nx[0] && z[1] === hit; })) st.strings.push([nx[0], hit]); st.msg = '';
          if (st.strings.length >= 3) c.next(); else c.redraw(true);
        } });
    }, auto: function (c) { c.state.strings = [[1, 0], [2, 0], [2, 1]]; } },
  { cap: 'Run 2: right order, strings tied — every line filled',
    note: 'Inspector, then analyst, then writer. The writer reads both earlier answers: every line of the report has real numbers.',
    svg: function (c) {
      var fx = A.fx(), K = crew6(), s = A.stage({ floor: 280 }) + fx.defs + rail6d(fx);
      [0, 1, 2].forEach(function (k, i) { s += folder6d(SLOT6D[i], RAIL6D - 12, k, { reads: ['nothing (first job)', 'inspector', 'inspector + analyst'][k] }); });
      [[1, 0], [2, 0], [2, 1]].forEach(function (q, j) { var a = SLOT6D[q[0]] + 40, b = SLOT6D[q[1]] + 190, dip = 300 + j * 26; s += '<path d="M' + a + ' ' + (RAIL6D + 132) + 'C' + a + ' ' + dip + ' ' + b + ' ' + dip + ' ' + b + ' ' + (RAIL6D + 132) + '" stroke="' + WCOL[q[0]] + '" stroke-width="3" fill="none" opacity=".7"/>'; });
      s += report6d(K.outs[2], 140, 300, 680, fx, false);
      return s;
    },
    work: function (c) { var K = crew6(), L = (K.outs[2] || '').split('\n'); return clean([{ h: 'Run 2 result' }, { v: '4 of 4', k: 'report lines filled' }, { v: (L[1] || '').replace(/^RESULT: /, '').split('.')[0] + '.' + ((L[1] || '').split('.')[1] || '').split(' ')[0], k: 'RESULT, from the inspector’s tool' }, { t: 'The task list is the running order. What a job may read is said on purpose, job by job.' }, srcTag(K.you.outs), refNote(K.you.outs)]); } }
  ]
});

/* ============================ 6e  Kick off ============================ */
var DESK6E = [[170, 300], [480, 300], [790, 300]];
function bubble(x, y, w, kind, text, col, o) {   // a speech bubble on the scene
  o = o || {}; var lines = [], words = String(text).split(' '), line = '', max = Math.floor((w - 24) / 7.6);
  words.forEach(function (wd) { if ((line + ' ' + wd).length > max) { lines.push(line); line = wd; } else line = line ? line + ' ' + wd : wd; }); if (line) lines.push(line);
  lines = lines.slice(0, o.max || 3); var h = 34 + lines.length * 19, s = '<g class="pgd-seq"' + (o.delay != null ? ' style="animation-delay:' + o.delay + 's"' : '') + '>';
  s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="#0b121b" stroke="' + col + '" stroke-width="1.6"/>' + t(x + 12, y + 20, kind, { size: 14, f: 'h', fill: col, ls: '.06em' });
  lines.forEach(function (l, i) { s += t(x + 12, y + 40 + i * 19, l, { size: 14, f: o.mono ? 'm' : 'b', fill: '#dbe6f2' }); });
  return { svg: s + '</g>', h: h };
}
function room6e(fx, k, done) {
  var s = A.stage({ floor: 330 }) + fx.defs;
  s += '<rect x="0" y="330" width="960" height="210" fill="#060a10"/>';
  DESK6E.forEach(function (d, i) { s += worker(d[0], d[1] + 120, i, { fx: fx, glow: i === k, dim: done == null ? i !== k : i > done && i !== k }); });
  return s;
}
function turn6e(K, k) { return K.trace.filter(function (e) { return e[1] === k && e[0] !== 'task_start'; }); }
function baton(x, y) { return '<g><rect x="' + (x - 34) + '" y="' + (y - 9) + '" width="68" height="18" rx="9" fill="#ffb547" stroke="#fff" stroke-width="2"/><rect x="' + (x - 10) + '" y="' + (y - 9) + '" width="20" height="18" fill="#c98a4a"/></g>'; }
function frame6e(k) {
  return { cap: ['Start the crew: the inspector takes the baton', 'Pass the baton: the analyst’s turn', 'Pass the baton: the writer’s turn'][k],
    note: 'Each worker loops: decide → call a tool → read the result → answer. Every step goes into the trace.',
    svg: function (c) {
      var fx = A.fx(), K = crew6(), s = room6e(fx, k, k - 1), shown = c.state.shown > k, ev = turn6e(K, k);
      if (shown) {
        var half = Math.ceil(ev.length / 2), two = ev.length > 4, ys = [16, 16];
        ev.forEach(function (e, j) {
          var col2 = two && j >= half ? 1 : 0, x = two ? (col2 ? 490 : 14) : Math.max(16, Math.min(960 - 520 - 16, DESK6E[k][0] - 260)), w = two ? 456 : 520;
          var kind = { thought: 'THOUGHT', tool_call: 'TOOL CALL', tool_result: 'TOOL RESULT', answer: 'ANSWER' }[e[0]], col = e[0] === 'tool_call' || e[0] === 'tool_result' ? '#3dffa0' : e[0] === 'answer' ? WCOL[k] : '#c7d4e4';
          var txt = e[0] === 'tool_result' ? short6e(e[3]) : e[0] === 'answer' ? String(e[3]).split('\n').slice(1, 3).join(' ').replace(/•/g, '').trim() : e[3];
          var b = bubble(x, ys[col2], w, (j + 1) + ' · ' + kind, txt, col, { delay: j * 0.15, max: e[0] === 'answer' ? 2 : 1, mono: e[0] === 'tool_call' || e[0] === 'tool_result' }); s += b.svg; ys[col2] += b.h + 6;
        });
      }
      var bx = DESK6E[k][0] + 5, by = DESK6E[k][1] + 162;
      if (!shown) s += A.target('baton', baton(bx, by), k ? 'pass the baton' : 'start the crew', bx, by + 40, {});
      else if (k < 2) s += A.target('baton', baton(DESK6E[k + 1][0] + 5, by), 'pass the baton', DESK6E[k + 1][0] + 5, by + 40, {});
      else s += A.target('baton', '<g><rect x="70" y="' + (by - 22) + '" width="190" height="44" rx="10" fill="#0b121b" stroke="#ffb547" stroke-width="2"/>' + t(165, by + 6, 'FINISH LINE', { size: 16, a: 'middle', f: 'h', fill: '#ffb547' }) + '</g>', 'cross the finish', 165, by + 52, {});
      return s;
    },
    work: function (c) {
      var K = crew6(), ev = turn6e(K, k), r = [{ h: WNAME[k].toLowerCase() + '’s turn' }];
      if (c.state.shown <= k) return [{ h: 'Trace so far' }, { v: K.trace.filter(function (e) { return e[1] < k; }).length + ' steps', k: 'of ' + K.trace.length }, { t: 'Tap the baton to run this worker’s turn.' }];
      r.push({ v: ev.length + ' steps', k: ev.map(function (e) { return e[0].replace('_', ' '); }).join(' → ') });
      ev.filter(function (e) { return e[0] === 'tool_call'; }).forEach(function (e) { r.push({ v: e[3], k: 'tool call: the runner runs the real function' }); });
      r.push({ v: K.trace.filter(function (e) { return e[1] <= k; }).length + ' of ' + K.trace.length, k: 'steps in the trace so far' });
      r.push({ t: 'Every “thought” here is a fixed sentence of the scripted rules. A real model writes its own.' });
      return clean(r.concat([srcTag(K.you.trace), refNote(K.you.trace)]));
    },
    on: { baton: function (c) { if (c.state.shown <= k) { c.state.shown = k + 1; c.redraw(true); } else c.next(); } },
    auto: function (c) { c.state.shown = k + 1; } };
}
function short6e(j) { try { var o = JSON.parse(j); if (o.cells != null) return 'cells ' + o.cells + ', defects ' + o.defects + ', passed ' + o.defects_passed + ' (' + o.defects_passed_per_100 + ' per 100), person checks ' + o.person_checks; if (o.groups) return 'poly ' + o.groups.poly.defects_passed + ' of ' + o.groups.poly.defects + ' passed (' + o.groups.poly.passed_per_100 + '), mono ' + o.groups.mono.defects_passed + ' of ' + o.groups.mono.defects; if (o.missed_count != null) return 'missed ' + o.missed_count + ': cells ' + o.missed_defects.map(function (m) { return m.cell; }).join(', '); if (o.boxes) return o.sorted + ' mistakes sorted: ' + o.boxes.map(function (b) { return b.count; }).join(' · '); } catch (e) {} return String(j).slice(0, 90); }
D.register('6e', {
  init: function () { return { shown: 0 }; },
  frames: [frame6e(0), frame6e(1), frame6e(2),
  { cap: 'The report is done: three turns, one trace',
    note: 'The last answer is the report. The trace kept every step: thoughts, tool calls, tool results and answers.',
    svg: function (c) {
      var fx = A.fx(), K = crew6(), s = room6e(fx, -1, 2), L = (K.outs[2] || '').split('\n');
      s += '<g filter="url(#' + fx.sh + ')"><rect x="250" y="24" width="460" height="290" rx="4" fill="#f1ecdf" class="pgd-drop"/></g>' + t(270, 54, L[0] || '', { size: 15, f: 'h', fill: '#2a3444' });
      L.slice(1, 4).forEach(function (l, i) { s += t(270, 90 + i * 26, l.length > 52 ? l.slice(0, 51) + '…' : l, { size: 14, f: 'm', fill: '#1f2937' }); });
      s += t(270, 190, 'TRACE', { size: 14, f: 'h', fill: '#2a3444' });
      var types = ['thought', 'tool_call', 'tool_result', 'answer'], cnt = types.map(function (ty) { return K.trace.filter(function (e) { return e[0] === ty; }).length; });
      types.forEach(function (ty, i) { s += t(270 + i * 110, 222, String(cnt[i]), { size: 24, f: 'm', w: 700, fill: '#0f5a8a' }) + t(270 + i * 110, 244, ty.replace('_', ' '), { size: 14, fill: '#4a5668' }); });
      s += t(270, 290, K.trace.length + ' steps in all (with 3 job starts)', { size: 15, fill: '#4a5668' });
      return s;
    },
    work: function (c) { var K = crew6(); return clean([{ h: 'The whole run' }, { v: '3 jobs', k: 'inspector → analyst → writer' }, { v: String(K.trace.filter(function (e) { return e[0] === 'tool_call'; }).length), k: 'tool calls' }, { v: String(K.trace.length), k: 'steps in the trace' }, { t: 'Agent loop: decide → tool → result → answer. The trace shows every step.' }, srcTag(K.you.trace), refNote(K.you.trace)]); } }
  ]
});

/* ============================ 6g  Plug in a real model ============================ */
function bench6g(fx, o) {
  o = o || {}; var s = A.stage({ floor: 420 }) + fx.defs;
  s += '<rect x="20" y="60" width="600" height="360" rx="18" fill="#0a1018" stroke="#1b2b3c"/>' + t(40, 50, 'THE CREW MACHINE (IN THIS BROWSER)', { size: 14, f: 'h', fill: C.dim, ls: '.08em' });
  s += '<rect x="44" y="88" width="250" height="300" rx="14" fill="url(#' + fx.mt + ')" stroke="#5d6b80"/>' + t(169, 118, 'BRAIN SOCKET', { size: 14, a: 'middle', f: 'h', fill: '#c7d4e4' }) + '<rect x="74" y="134" width="190" height="200" rx="10" fill="#05080d" stroke="#3a4757" stroke-dasharray="6 5"/>';
  s += '<rect x="320" y="88" width="280" height="140" rx="14" fill="url(#' + fx.mt + ')" stroke="#3dffa0" stroke-opacity=".7"/>' + t(340, 118, 'TOOLS · the same 4', { size: 14, f: 'h', fill: '#3dffa0' }) + TOOLN.map(function (n, i) { return t(340 + (i % 2) * 130, 154 + Math.floor(i / 2) * 30, n, { size: 14, f: 'm', fill: '#c7d4e4' }); }).join('') + t(340, 214, 'numbers still come from here', { size: 14, fill: C.dim });
  s += '<rect x="320" y="248" width="280" height="140" rx="14" fill="url(#' + fx.mt + ')" stroke="#ffb547" stroke-opacity=".7"/>' + t(340, 278, 'CHECKER · the same', { size: 14, f: 'h', fill: '#ffb547' }) + t(340, 310, 'every number vs the facts', { size: 15, fill: '#c7d4e4' }) + t(340, 336, 'send back once, then', { size: 15, fill: '#c7d4e4' }) + t(340, 360, 'hold or pass', { size: 15, fill: '#c7d4e4' });
  return s;
}
function cart6g(x, y, kind, o) {
  o = o || {}; var real = kind === 'real', col = real ? '#a98bff' : '#ffb547', s = '<g' + (o.cls ? ' class="' + o.cls + '"' : '') + '>';
  s += '<rect x="' + x + '" y="' + y + '" width="180" height="190" rx="12" fill="#121a24" stroke="' + col + '" stroke-width="2.5"/><rect x="' + (x + 50) + '" y="' + (y + 190) + '" width="80" height="14" rx="3" fill="#8d9bb0"/>';
  s += t(x + 90, y + 34, real ? 'REAL MODEL' : 'SCRIPTED', { size: 16, a: 'middle', f: 'h', fill: col }) + t(x + 90, y + 58, real ? 'a language model' : 'rules, not a model', { size: 14, a: 'middle', fill: '#dbe6f2' });
  if (real) { s += '<rect x="' + (x + 40) + '" y="' + (y + 80) + '" width="100" height="34" rx="6" fill="#05080d" stroke="#8d9bb0"/>' + t(x + 90, y + 136, o.key ? 'key in slot' : 'key slot: empty', { size: 14, a: 'middle', fill: o.key ? '#3dffa0' : C.dim }) + t(x + 90, y + 162, 'runs at the provider', { size: 14, a: 'middle', fill: C.dim }); if (o.key) s += '<rect x="' + (x + 50) + '" y="' + (y + 88) + '" width="80" height="18" rx="4" fill="#ffd36b"/>'; }
  else s += t(x + 90, y + 100, 'no key', { size: 15, a: 'middle', fill: '#dbe6f2' }) + t(x + 90, y + 124, 'no network', { size: 15, a: 'middle', fill: '#dbe6f2' }) + t(x + 90, y + 160, 'works offline', { size: 14, a: 'middle', fill: C.dim });
  return s + '</g>';
}
var SENT6G = [['system prompt', 'role · backstory · goal (6c)'], ['task prompt', 'job + earlier answers (6d)'], ['tool names + descriptions', 'NOT the functions'], ['tool results', 'the numbers, after each call'], ['your key', 'in a request header only']];
D.register('6g', {
  init: function () { return {}; },
  frames: [
  { cap: 'Swap the brain cartridge: tools and checker stay',
    note: 'Only the brain changes. The four tools and the checker are the same; the numbers still come from the tools.',
    svg: function (c) {
      var fx = A.fx(), s = bench6g(fx);
      s += cart6g(79, 139, 'scripted');
      s += t(40, 470, 'Same crew, same jobs, same tools, same checker. Only the brain changes.', { size: 16, fill: '#dbe6f2' });
      s += t(780, 50, 'ON THE BENCH', { size: 14, a: 'middle', f: 'h', fill: C.dim, ls: '.08em' });
      s += A.target('cart', cart6g(690, 120, 'real'), 'swap it in', 780, 350, { kind: 'drag', to: snapTo(780, 215, 169, 234, 16) });
      return s;
    },
    work: function () { return [{ h: 'What changes' }, { v: 'the brain', k: 'scripted rules → a real language model' }, { h: 'What stays' }, { v: '4 tools', k: 'shift_stats, slice_table, worst_cases, action_list' }, { v: 'the checker', k: 'your 6f check, as the report job’s gate' }, { v: 'the prompts', k: 'same badges and jobs' }]; },
    bind: function (c, root) {
      var el = root.querySelector('[data-pgd-t=cart]');
      D.onDrag(root, el, { start: { x: 780, y: 215 }, step: 16, move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - 780) + ' ' + (p.y - 215) + ')'); },
        drop: function (p) { if (Math.abs(p.x - 169) < 90 && Math.abs(p.y - 234) < 100) c.next(); else el.removeAttribute('transform'); } });
    } },
  { cap: 'No key in the slot: nothing leaves the browser',
    note: 'Without a key the real model cannot run. The lab keeps the scripted report; you may skip this substep.',
    svg: function (c) {
      var fx = A.fx(), s = bench6g(fx);
      s += cart6g(79, 139, 'real', { cls: 'pgd-drop' }) + cart6g(690, 120, 'scripted');
      s += A.glass(650, 330, 290, 150, { fx: fx, col: '#2b4760' }) + t(668, 362, 'THE KEY', { size: 14, f: 'h', fill: '#ffd36b', ls: '.08em' }) + t(668, 392, 'kept in this page’s memory', { size: 15, fill: '#dbe6f2' }) + t(668, 416, 'only: never stored, never', { size: 15, fill: '#dbe6f2' }) + t(668, 440, 'logged, hidden in errors', { size: 15, fill: '#dbe6f2' });
      s += A.target('key', '<g><circle cx="560" cy="470" r="16" fill="none" stroke="#ffd36b" stroke-width="5"/><rect x="576" y="466" width="54" height="9" rx="3" fill="#ffd36b"/><rect x="612" y="474" width="7" height="12" fill="#ffd36b"/></g>', 'insert a key', 470, 506, { kind: 'drag', to: snapTo(560, 470, 150, 236, 16) });
      return s;
    },
    work: function () { return [{ h: 'Without a key' }, { v: '0 calls', k: 'leave the browser' }, { t: 'The lab works fully offline with the scripted brain. A real model is optional.' }]; },
    bind: function (c, root) {
      var el = root.querySelector('[data-pgd-t=key]');
      D.onDrag(root, el, { start: { x: 560, y: 470 }, step: 16, move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - 560) + ' ' + (p.y - 470) + ')'); },
        drop: function (p) { if (Math.abs(p.x - 150) < 90 && Math.abs(p.y - 236) < 90) c.next(); else el.removeAttribute('transform'); } });
    } },
  { cap: 'With a key: this is what leaves the building',
    note: 'Each model step is one request from your browser to the provider. It carries the prompts, the tool names and descriptions, the tool results — and the key in a header.',
    svg: function (c) {
      var fx = A.fx(), s = bench6g(fx);
      s += cart6g(79, 139, 'real', { key: true });
      s += '<rect x="640" y="60" width="300" height="360" rx="18" fill="#0a0f18" stroke="#a98bff" stroke-opacity=".6"/>' + t(790, 92, 'MODEL PROVIDER', { size: 15, a: 'middle', f: 'h', fill: '#a98bff' }) + t(790, 116, 'outside your building', { size: 14, a: 'middle', fill: C.dim });
      s += '<path d="M630 52V420" stroke="#5d6b80" stroke-width="3" stroke-dasharray="10 6"/>' + t(624, 446, 'building wall', { size: 14, a: 'end', fill: C.dim }) + '<path d="M200 140C240 44 560 30 660 150" stroke="#a98bff" stroke-width="4" fill="none" class="pgd-flowonce"/>';
      SENT6G.forEach(function (q, i) { var y = 150 + i * 50; s += '<g class="pgd-seq" style="animation-delay:' + (i * .12) + 's"><rect x="656" y="' + (y - 20) + '" width="268" height="42" rx="8" fill="#121a24" stroke="#3a4757"/>' + t(670, y - 2, q[0], { size: 15, w: 700, fill: i === 4 ? '#ffd36b' : '#dbe6f2' }) + t(670, y + 16, q[1], { size: 14, fill: C.dim }) + '</g>'; });
      s += t(40, 470, 'Back come: tool calls or a final answer. Your checker still checks it.', { size: 16, fill: '#dbe6f2' }) + t(40, 498, 'No real-model run is shown here: the lab runs it only with your key.', { size: 15, fill: C.dim });
      return s;
    },
    work: function () { return [{ h: 'One request = one model step' }, { v: 'POST', k: 'browser → provider (Anthropic or OpenAI-compatible)' }, { v: 'prompts + tool list', k: 'what the model reads' }, { v: 'tool results', k: 'sent back after each call' }, { t: 'The tools still run in your browser. The model only decides and writes; the checker decides what may be shown.' }]; } }
  ]
});

window.PGD_S6 = { crew6: crew6, factPaths: factPaths, layout: layout, paperSheet: paperSheet, worker: worker, cabinet: cabinet, lamp: lamp, stamp: stamp6f, ledger: ledger, hitsOf: hitsOf };
})();
