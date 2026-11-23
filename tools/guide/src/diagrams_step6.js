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

window.PGD_S6 = { crew6: crew6, factPaths: factPaths, layout: layout, paperSheet: paperSheet, worker: worker, cabinet: cabinet, lamp: lamp, stamp: stamp6f, ledger: ledger, hitsOf: hitsOf };
})();
