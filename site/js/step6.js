/* PanelGuard — Step 6 content: the CrewAI-style quality crew (js/crew.js = MiniCrew, a small JS runner with CrewAI's names).
   Inputs: the Step 5 logbook (auditLog = the last shift of 5g), the Step 4e slices (mono, poly, sure, unsure), the Step 4f action boxes.
   Every number in a report comes from a tool over that real lab state. The default brain is a SCRIPTED model (rules), not a language model. */
(function (G) {
'use strict';
var V = function () { return G.PGViz6; };
var J = function () { return G.PGJS; };
function MC() { return G.MiniCrew; }
function CE(m) { return J().CheckError(m); }
function need(NS, list, msg) { var m = list.filter(function (k) { return !(k in NS); }); if (m.length) throw CE(msg + ' (missing: ' + m.join(', ') + ').'); }
function needMC() { if (!MC()) throw CE('The crew runner could not be loaded in this page (js/crew.js). Reload the page.'); }
function r1(x) { return Math.round(10 * x) / 10; }
function per100(a, b) { return b ? Math.round(1000 * a / b) / 10 : 0; }
function errMsg(e) { return String(e && e.message || e).split('\n')[0]; }
var BOX = [['more', 'Need more photos like this'], ['label', 'Ask the expert to re-check the label'], ['sharp', 'Needs a sharper photo'], ['wrong', 'Model looked at the wrong place']];

/* ---------- tool bodies given to the student code as pg.* (real lab state) ---------- */
function extra(pg) {
  function idx(id) { return pg.valIndex ? pg.valIndex(id) : pg.cell_val.indexOf(id); }
  function sliceFacts(g) {
    function one(x) { return { cells: x.n, defects: x.def, defects_passed: x.defPass, passed_per_100: per100(x.defPass, x.def), good: x.ok, good_stopped: x.okStop, to_person: x.person }; }
    if (!g || !g.mono || !g.poly || !g.sure || !g.unsure) throw CE('slice_table needs the Step 4e groups mono, poly, sure, unsure. Run 4e first.');
    return { source: 'Step 4e slices: validation tray at the Step 3 gates (no poly gate)', groups: { mono: one(g.mono), poly: one(g.poly), expert_sure: one(g.sure), expert_unsure: one(g.unsure) } };
  }
  function caseOf(x) { var i = idx(x[0]); return { cell: x[0], score: x[6], expert_score: i == null ? null : pg.prob_val[i], type: x[4], lane: x[1] }; }
  function worstCases(log, k) {
    if (!Array.isArray(log) || !log.length) throw CE('worst_cases needs the Step 5 logbook (auditLog). Run 5g first.');
    var rows = pg.shiftReport(log).rows;
    var missed = rows.filter(function (x) { return x[3] === 1 && x[2] === 'pass'; }).sort(function (a, b) { return a[6] - b[6] || a[0] - b[0]; });
    var fa = rows.filter(function (x) { return x[3] === 0 && x[2] === 'stop'; }).sort(function (a, b) { return b[6] - a[6] || a[0] - b[0]; }).slice(0, k == null ? 3 : k);
    return { missed_count: missed.length, missed_defects: missed.map(caseOf), false_alarm_count: rows.filter(function (x) { return x[3] === 0 && x[2] === 'stop'; }).length, worst_false_alarms: fa.map(caseOf) };
  }
  function actionFacts() {
    var a = (pg.mechOf ? pg.mechOf('4f') : {}).actions || {}, tot = 0;
    var boxes = BOX.map(function (b) { var c = (a[b[0]] || []).slice(); tot += c.length; return { box: b[1], count: c.length, cells: c }; });
    return { source: 'your Step 4f action boxes', sorted: tot, boxes: boxes };
  }
  /* a COPY of a report with 2 numbers planted wrong on purpose (labelled as planted in the page) */
  function plantedCopy(text, facts) {
    var known = MC()._numsIn(JSON.stringify(factList(facts))), toks = numberTokens(text), pick = [];
    function line(re) { var L = text.split('\n'), off = 0; for (var i = 0; i < L.length; i++) { if (re.test(L[i])) return [off, off + L[i].length]; off += L[i].length + 1; } return null; }
    var a = line(/^RESULT:/), b = line(/^COST:/);
    var inA = a && toks.filter(function (t) { return t.at >= a[0] && t.at < a[1] && /\./.test(t.tok); })[0], inB = b && toks.filter(function (t) { return t.at >= b[0] && t.at < b[1]; })[0];
    [inA, inB].forEach(function (t) { if (t) pick.push(t); });
    toks.forEach(function (t) { if (pick.length < 2 && pick.indexOf(t) < 0 && !t.unit) pick.push(t); });
    var out = text, shift = 0, planted = [];
    pick.sort(function (x, y) { return x.at - y.at; }).forEach(function (t) {
      var dp = (t.tok.split('.')[1] || '').length, v = +t.tok.replace(/,/g, ''), c = dp ? Math.round(v * 5) / 10 : Math.round(v * 0.6), step = dp ? 0.1 : 1;
      while (known.some(function (k) { return Math.abs(k - c) <= 0.5 * Math.pow(10, -dp) + 1e-9; }) || Math.abs(c - v) < 1e-9) c = Math.round((c + step) * 10) / 10;
      var now = dp ? c.toFixed(dp) : String(c);
      out = out.slice(0, t.at + shift) + now + out.slice(t.at + shift + t.tok.length);
      planted.push({ was: t.tok, now: now, at: t.at + shift }); shift += now.length - t.tok.length;
    });
    return { text: out, planted: planted, tokens: numberTokens(out) };
  }
  return { sliceFacts: sliceFacts, worstCases: worstCases, actionFacts: actionFacts, plantedCopy: plantedCopy, numberTokens: numberTokens };
}
function factList(f) { var o = []; (function walk(v) { if (typeof v === 'number') o.push(v); else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { walk(v[k]); }); })(f); return o; }
/* every number in a text with its place (units “per 1,000” / “per 100” are marked) */
function numberTokens(text) {
  var out = [], re = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g, m;
  while ((m = re.exec(text))) { var before = text.slice(Math.max(0, m.index - 4), m.index); out.push({ tok: m[0], at: m.index, unit: before === 'per ' && (m[0] === '1,000' || m[0] === '100') }); }
  return out;
}

/* ---------- the scripted brain's sentence patterns, one per role (rules, not a language model) ---------- */
function regWriters() {
  var S = MC() && MC().ScriptedLLM; if (!S || S._pg6) return; S._pg6 = 1;
  S.register(/inspector/i, function (x) {
    var F = x.facts.shift_stats;
    if (!F || typeof F !== 'object') return 'SHIFT FACTS — not known: I have no logbook tool, so I have no numbers.';
    return ['SHIFT FACTS — last shift in the logbook',
      '• Cells checked: ' + F.cells,
      '• Lanes per 1,000 cells: ' + F.per_1000.pass + ' auto-pass, ' + F.per_1000.person + ' to a person, ' + F.per_1000.stop + ' auto-stop',
      '• Defects passed: ' + F.defects_passed + ' of ' + F.defects + ' (' + F.defects_passed_per_100 + ' per 100; target: at most ' + F.target_max_per_100 + ' per 100)',
      '• Good cells stopped: ' + F.good_cells_stopped + ' of ' + F.good_cells,
      '• Person checks: ' + F.person_checks + ' · Reshoots: ' + F.reshoots,
      '• Person answers: ' + F.person_answers].join('\n');
  });
  S.register(/analyst/i, function (x) {
    var Sl = x.facts.slice_table, W = x.facts.worst_cases, L = ['WHERE FAILURES CLUSTER — slices of the validation tray'];
    function pair(lab, an, A, bn, B) {
      var same = A.passed_per_100 === B.passed_per_100, w = A.passed_per_100 >= B.passed_per_100 ? [an, A, bn, B] : [bn, B, an, A];
      return '• ' + lab + ': ' + (same ? 'no difference' : w[0] + ' is weaker') + ' — ' + w[0] + ' ' + w[1].defects_passed + ' of ' + w[1].defects + ' defects passed (' + w[1].passed_per_100 + ' per 100); ' + w[2] + ' ' + w[3].defects_passed + ' of ' + w[3].defects + ' (' + w[3].passed_per_100 + ' per 100)';
    }
    function c(z) { return 'cell ' + z.cell + ' (score ' + z.score + ', expert ' + z.expert_score + ', ' + z.type + ')'; }
    if (Sl && Sl.groups) { L.push(pair('Cell type', 'poly', Sl.groups.poly, 'mono', Sl.groups.mono)); L.push(pair('Expert labels', 'unsure', Sl.groups.expert_unsure, 'sure', Sl.groups.expert_sure)); }
    else L.push('• Groups: not known — I have no slice tool.');
    if (W && W.missed_defects) {
      L.push('• Missed defects this shift: ' + W.missed_count + (W.missed_defects.length ? ' — ' + W.missed_defects.map(c).join('; ') : ''));
      L.push('• Worst false alarms: ' + (W.worst_false_alarms.length ? W.worst_false_alarms.map(c).join('; ') : 'none'));
    } else L.push('• Missed defects: not known — I have no worst-case tool.');
    return L.join('\n');
  });
  S.register(/writer/i, function (x) {
    var A = x.facts.action_list, ctx = x.context || '', L = ['SHIFT QUALITY REPORT — for the plant manager'];
    var m1 = ctx.match(/Defects passed: (\d+) of (\d+) \(([\d.]+) per 100; target: at most ([\d.]+) per 100\)/);
    var m2 = ctx.match(/Lanes per 1,000 cells: (\d+) auto-pass, (\d+) to a person, (\d+) auto-stop/), m3 = ctx.match(/Person checks: (\d+)/);
    var m4 = ctx.match(/Cell type: (?:\w+ is weaker|no difference) — (\w+) (\d+) of (\d+) defects passed \(([\d.]+) per 100\)/);
    var m5 = ctx.match(/Expert labels: (?:\w+ is weaker|no difference) — (\w+) (\d+) of (\d+) defects passed \(([\d.]+) per 100\)/);
    var m6 = ctx.match(/Person answers: (.*)/);
    L.push('RESULT: ' + (m1 ? m1[3] + ' defects passed per 100 (' + m1[1] + ' of ' + m1[2] + '). Target: at most ' + m1[4] + ' per 100 → ' + (+m1[3] <= +m1[4] ? 'TARGET MET.' : 'TARGET MISSED.') : 'not known — no shift facts were given to me.'));
    L.push('COST: ' + (m2 ? m2[2] + ' person checks per 1,000 cells' + (m3 ? ' (' + m3[1] + ' this shift).' : '.') : 'not known — no shift facts were given to me.'));
    L.push('WHERE IT FAILS: ' + (m4 ? m4[1] + ' cells — ' + m4[2] + ' of ' + m4[3] + ' defects passed (' + m4[4] + ' per 100).' : 'not known — no analysis was given to me.'));
    L.push('TOP ACTIONS:');
    L.push('• ' + (m4 ? 'More ' + m4[1] + ' defect photos for training (' + m4[2] + ' of ' + m4[3] + ' ' + m4[1] + ' defects passed).' : 'More photos for the weakest group: not known (no analysis).'));
    L.push('• ' + (m5 ? 'Expert re-check of the ' + m5[1] + ' labels (' + m5[2] + ' of ' + m5[3] + ' ' + m5[1] + ' defects passed).' : 'Label re-check: not known (no analysis).'));
    L.push('• ' + (A && A.boxes ? (A.sorted ? 'Work the action list: ' + A.sorted + ' mistakes sorted — ' + A.boxes.map(function (b) { return b.count + ' “' + b.box.toLowerCase() + '”'; }).join(', ') + '.' : 'Sort the mistakes into the action boxes first: none sorted yet.') : 'Action list: not known (no action tool).'));
    if (m6) L.push('NOTE: person answers — ' + m6[1] + '. Real people make mistakes.');
    return L.join('\n');
  });
}
regWriters();

/* which report lines a report has (used by 6d) */
var FIELDS = [['result', 'RESULT: defects passed vs the target', 'shift_stats', /^RESULT: (?!not known)/m],
              ['cost', 'COST: person checks per 1,000 cells', 'shift_stats', /^COST: (?!not known)/m],
              ['where', 'WHERE IT FAILS: the weakest group', 'slice_table', /^WHERE IT FAILS: (?!not known)/m],
              ['actions', 'ACTION LIST line (from your 4f boxes)', 'action_list', /^• (Work the action list|Sort the mistakes)/m]];
function fieldsOf(text) { var o = {}; FIELDS.forEach(function (f) { o[f[0]] = f[3].test(text || ''); }); return o; }
function slimTrace(tr) { return (tr || []).map(function (e) { var o = { n: e.n, type: e.type, agent: e.agent, task: e.task, text: e.text }; if (e.tool) o.tool = e.tool; if (e.result !== undefined) o.result = e.result; if (e.ok !== undefined) o.ok = e.ok; return o; }); }
function outsOf(R) { return R.tasks_output.map(function (o) { return { agent: o.agent, description: o.description, raw: o.raw, attempts: o.attempts }; }); }
var TOOLS = ['shiftStats', 'sliceTable', 'worstCases', 'actionList'];
function needTools(NS) { need(NS, TOOLS, 'Run 6b first: the workers use your tools'); }
function needAgents(NS) { need(NS, ['inspector', 'analyst', 'writer'], 'Run 6c first: hire the workers'); }
function needTasks(NS) { need(NS, ['inspectShift', 'findCauses', 'writeReport'], 'Run 6d first: the crew needs its jobs'); }
function crewErr(e) { return e && (e.plain || e.name === 'CrewError') ? errMsg(e) : null; }

/* ================= 6a: who does what (no code) ================= */
var s6a = { id: '6a', name: 'Who does what', kind: 'scene', scene: 'hire',
  goal: 'The shift is over. Three AI workers will write the shift quality report. First give each worker its tools and its job: drag each card onto the right worker.',
  needText: 'give every tool card and every job card to the right worker (wrong cards are refused)' };

/* ================= 6b: make a tool ================= */
var s6b = { id: '6b', name: 'Make a tool', kind: 'code', lang: 'js',
  goal: 'A tool is a plain function with a name and a description. The worker\'s model reads the description and decides when to call it. The numbers come from the function — never from the model.',
  task: [
    "Gap 1: the tool's name, the way the workers will call it. Type it with quotes: 'shift_stats'",
    'Gap 2: the Step 5 logbook the facts are counted from. Type its name: auditLog',
    'Gap 3: the field of the report that counts defects passed. Type: defPassed',
    'Then call each of the 4 tools by hand from the call panel on the right.'
  ],
  code: [
'// Real CrewAI is Python and cannot run in a browser. MiniCrew is a small JavaScript runner with the same ideas and names.',
'const { tool } = MiniCrew;',
'',
'// A tool = name + description + run (a plain function over the real lab state)',
'const shiftStats = tool({',
'  name: ____,',
"  description: 'Facts of the last shift from the Step 5 logbook: cells, lanes per 1,000 cells, defects passed, good cells stopped, person checks, reshoots.',",
'  run: () => {',
'    const R = pg.shiftReport(____);           // counts every row of the logbook',
'    return {',
'      cells: R.n,',
'      per_1000: { pass: Math.round(R.per1000.pass), person: Math.round(R.per1000.person), stop: Math.round(R.per1000.stop) },',
'      defects: R.all.def,',
'      defects_passed: R.all.____,',
'      defects_passed_per_100: Math.round(1000 * R.all.defPassed / R.all.def) / 10,',
'      target_max_per_100: 5,                   // the plant target: at most 5 of 100 defects pass',
'      good_cells: R.all.good,',
'      good_cells_stopped: R.all.goodStopped,',
'      person_checks: R.lanes.person,',
'      reshoots: R.reshoots,',
"      person_answers: 'a perfect checker: the expert label answered every paused cell',",
'    };',
'  },',
'});',
'',
'// Three more tools, ready-made the same way',
"const sliceTable = tool({ name: 'slice_table', description: 'Defects passed and good cells stopped per group (mono / poly, expert sure / unsure), from the Step 4e slices.',",
'  run: () => pg.sliceFacts({ mono, poly, sure, unsure }) });',
"const worstCases = tool({ name: 'worst_cases', description: 'The missed defects and the worst false alarms of the last shift: cell id, score, expert score, cell type.',",
'  run: () => pg.worstCases(auditLog, 3) });',
"const actionList = tool({ name: 'action_list', description: 'Your Step 4f action boxes: which mistakes need more photos, a label re-check, a sharper photo, or a model fix.',",
'  run: () => pg.actionFacts() });',
'',
"console.log('shift_stats ->', shiftStats.run());"
  ].join('\n'),
  twin: [
'import json',
'from crewai.tools import tool',
'',
'@tool("shift_stats")',
'def shift_stats() -> str:',
'    """Facts of the last shift from the Step 5 logbook: cells, lanes per 1,000 cells,',
'    defects passed, good cells stopped, person checks, reshoots."""',
'    R = shift_report(audit_log)                  # counts every row of the logbook',
'    return json.dumps({',
"        'cells': R['n'],",
"        'per_1000': {k: js_round(v) for k, v in R['per1000'].items()},",
"        'defects': R['all']['def'],",
"        'defects_passed': R['all']['defPassed'],",
"        'defects_passed_per_100': js_round(1000 * R['all']['defPassed'] / R['all']['def']) / 10,",
"        'target_max_per_100': 5,",
"        'good_cells': R['all']['good'], 'good_cells_stopped': R['all']['goodStopped'],",
"        'person_checks': R['lanes']['person'], 'reshoots': R['reshoots'],",
"        'person_answers': 'a perfect checker: the expert label answered every paused cell'})",
'',
'@tool("slice_table")',
'def slice_table() -> str:',
'    """Defects passed and good cells stopped per group (mono / poly, expert sure / unsure), from the Step 4e slices."""',
'    return json.dumps(slice_facts(slices))',
'',
'# worst_cases and action_list: the same pattern (tools/research/step6_twin.py)'
  ].join('\n'),
  probe: async function (NS, pg) {
    needMC(); need(NS, ['auditLog', 'shift1'], 'Run 5g first: the tool reads the Step 5 logbook'); need(NS, ['mono', 'poly', 'sure', 'unsure'], 'Run 4e first: slice_table reads the Step 4e slices');
    if (!NS.shiftStats || !NS.sliceTable || !NS.worstCases || !NS.actionList) return { missing: TOOLS.filter(function (k) { return !NS[k]; }) };
    var out = {}, err = null, R = pg.shiftReport(NS.auditLog);
    try { out = NS.shiftStats.run(); } catch (e) { err = errMsg(e); }
    var ref = { cells: R.n, defects: R.all.def, defects_passed: R.all.defPassed, good_cells_stopped: R.all.goodStopped, person_checks: R.lanes.person, per100: per100(R.all.defPassed, R.all.def) };
    return { name: NS.shiftStats.name, desc: NS.shiftStats.description, out: out, err: err, ref: ref, logRows: NS.auditLog.length, names: TOOLS.map(function (k) { return NS[k].name; }),
      other: { slice_table: NS.sliceTable.run(), worst_cases: NS.worstCases.run(), action_list: NS.actionList.run() } };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (r.name !== 'shift_stats') return { pass: false, msg: 'The tool is called “' + r.name + '”. The workers (and 6a) know it as shift_stats: type \'shift_stats\' with quotes.' };
    if (r.err) return { pass: false, msg: 'The tool failed when it was called: ' + r.err + '. Gap 2 is the Step 5 logbook: auditLog.' };
    var o = r.out || {};
    if (o.cells !== r.ref.cells) return { pass: false, msg: 'The tool counted ' + o.cells + ' cells, but the logbook has ' + r.ref.cells + ' rows. Count the logbook itself: auditLog.' };
    if (o.defects_passed !== r.ref.defects_passed) return { pass: false, msg: 'defects_passed is ' + JSON.stringify(o.defects_passed) + ', but the logbook says ' + r.ref.defects_passed + ' defects passed. The field of the report is defPassed.' };
    return { pass: true, msg: 'Tool ready. shift_stats read ' + r.logRows + ' logbook rows: ' + o.defects_passed + ' of ' + o.defects + ' defects passed (' + o.defects_passed_per_100 + ' per 100), ' + o.person_checks + ' person checks.' };
  },
  mechNeed: function (m) { var n = Object.keys((m && m.called) || {}).length; return n >= 4 ? null : 'call each of the 4 tools from the call panel on the right (' + n + ' of 4 called)'; },
  example: '<p>A bakery crew. A tool that counts burnt loaves from the oven log:</p><pre>const burnt = tool({\n  name: \'burnt_count\',\n  description: \'How many loaves burnt today, from the oven log.\',\n  run: () => ({ burnt: ovenLog.filter((x) => x.temp > 260).length }),\n});</pre><p>The <b>name</b> is what the worker calls. The <b>description</b> tells the model when to call it. The <b>run</b> function gives the numbers.</p>',
  render: function (r, el, api) { V().toolPanel(r, el, api); },
  explain: function (r) { var o = r.out || {}; return {
    asked: 'Build one tool (name, description, run) that counts the real Step 5 logbook.',
    steps: ['tool({ name, description, run }) wraps a plain function. The model sees only the name and the description.',
            'run() counts all ' + r.logRows + ' rows of auditLog with pg.shiftReport — the same counter as 5g.',
            'Result: ' + o.cells + ' cells, ' + o.defects_passed + ' of ' + o.defects + ' defects passed = ' + o.defects_passed_per_100 + ' per 100 (target: at most 5).',
            'The other 3 tools read the 4e slices, the worst cases of the logbook, and your 4f action boxes.'],
    trap: 'Letting the model “know” the numbers. A model can write any number; a tool reads it from the data.',
    remember: 'Numbers come from tools, never from the model.' }; }
};

/* ================= 6c: hire the workers ================= */
var s6c = { id: '6c', name: 'Hire the workers', kind: 'code', lang: 'js',
  goal: 'An Agent is a worker: a role, a goal, a backstory and its tools. These texts become the instructions the model reads. The brain here is a scripted model: fixed rules, not a language model — so the lab works with no key and no network.',
  task: [
    "Gap 1: the second worker's role. Type it with quotes: 'Root-cause Analyst'",
    'Gap 2: the analyst\'s second tool (the missed defects and false alarms). Type its name: worstCases',
    'Gap 3: the option that gives a worker its tools. Type: tools',
    'Then tap each ID badge on the right to read the exact text its model is given.'
  ],
  code: [
'const { Agent, ScriptedLLM } = MiniCrew;',
'',
'// The brain: a SCRIPTED model. Rules: call each tool once, then fill a sentence pattern for the role.',
'// It is not a language model. A real model can be plugged in at 6g.',
'const brain = new ScriptedLLM();',
'',
'const inspector = new Agent({',
"  role: 'Line Inspector',",
"  goal: 'State the facts of the last shift, with the exact numbers from your tool.',",
"  backstory: 'You watch the solar-cell line every shift. You never guess a number: you read it from the logbook.',",
'  tools: [shiftStats],',
'  llm: brain,',
'});',
'const analyst = new Agent({',
'  role: ____,',
"  goal: 'Find where the failures cluster, and give the evidence numbers.',",
"  backstory: 'You compare groups of cells to find the weak spots. Every claim you make has a number from a tool.',",
'  tools: [sliceTable, ____],',
'  llm: brain,',
'});',
'const writer = new Agent({',
"  role: 'Report Writer',",
"  goal: 'Write a one-page shift quality report for the plant manager.',",
"  backstory: 'You write short and plain. You use only numbers from your tools and from the other workers.',",
'  ____: [actionList],',
'  llm: brain,',
'});',
"console.log([inspector, analyst, writer].map((a) => a.role + ' (' + a.tools.map((t) => t.name).join(', ') + ')').join('\\n'));"
  ].join('\n'),
  twin: [
'from crewai import Agent',
'from crewai.llms.base_llm import BaseLLM',
'',
'class ScriptedLLM(BaseLLM):           # rules, NOT a language model: no key, no network',
'    def call(self, messages, tools=None, callbacks=None, available_functions=None,',
'             from_task=None, from_agent=None, response_model=None):',
'        return scripted_step(messages)   # "Action: <next tool>" or "Final Answer: <pattern for the role>"',
'',
'brain = ScriptedLLM(model="scripted-rules")',
'',
'inspector = Agent(role="Line Inspector",',
'    goal="State the facts of the last shift, with the exact numbers from your tool.",',
'    backstory="You watch the solar-cell line every shift. You never guess a number: you read it from the logbook.",',
'    tools=[shift_stats], llm=brain)',
'analyst = Agent(role="Root-cause Analyst",',
'    goal="Find where the failures cluster, and give the evidence numbers.",',
'    backstory="You compare groups of cells to find the weak spots. Every claim you make has a number from a tool.",',
'    tools=[slice_table, worst_cases], llm=brain)',
'writer = Agent(role="Report Writer",',
'    goal="Write a one-page shift quality report for the plant manager.",',
'    backstory="You write short and plain. You use only numbers from your tools and from the other workers.",',
'    tools=[action_list], llm=brain)'
  ].join('\n'),
  probe: async function (NS) {
    needMC(); needTools(NS);
    if (!NS.inspector || !NS.analyst || !NS.writer) return { missing: ['inspector', 'analyst', 'writer'].filter(function (k) { return !NS[k]; }) };
    function one(a) { return { role: a.role, goal: a.goal, backstory: a.backstory, tools: a.tools.map(function (t) { return t.name; }), prompt: a.systemPrompt(false), llm: a.llm ? a.llm.kind : null }; }
    return { agents: [one(NS.inspector), one(NS.analyst), one(NS.writer)], ver: MC().VERSION };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    var a = r.agents[1], w = r.agents[2];
    if (!/^root-cause analyst$/i.test(a.role)) return { pass: false, msg: 'The second worker is called “' + a.role + '”. Type its role exactly: \'Root-cause Analyst\' (the scripted model picks its sentence pattern from the role name).' };
    if (a.tools.join() !== 'slice_table,worst_cases') return { pass: false, msg: 'The analyst has the tools [' + a.tools.join(', ') + ']. Its second tool gives the missed defects and false alarms: worstCases.' };
    if (w.tools.join() !== 'action_list') return { pass: false, msg: 'The writer has the tools [' + w.tools.join(', ') + ']. Give it actionList with the option tools.' };
    return { pass: true, msg: '3 workers hired: ' + r.agents.map(function (x) { return x.role + ' (' + x.tools.join(', ') + ')'; }).join(', ') + '.' };
  },
  mechNeed: function (m) { var n = Object.keys((m && m.read) || {}).length; return n >= 3 ? null : 'tap each of the 3 ID badges to read what its model is given (' + n + ' of 3 read)'; },
  example: '<p>A kitchen crew. The pastry chef reads the oven log:</p><pre>const pastry = new Agent({\n  role: \'Pastry Chef\',\n  goal: \'Say how many loaves burnt today.\',\n  backstory: \'You run the ovens and trust only the oven log.\',\n  tools: [burnt],\n});</pre><p>Each text in quotes ends up, word for word, in the instructions the model reads.</p>',
  render: function (r, el, api) { V().badges(r, el, api); },
  explain: function (r) { var a = r.agents; return {
    asked: 'Make three workers: each a role, a goal, a backstory and its tools.',
    steps: ['new Agent({...}) only stores the texts and the tools. Nothing runs yet.',
            'Before each job the runner builds the instructions from them, the same way CrewAI does: “You are ' + a[0].role + '. ' + a[0].backstory.split('.')[0] + '. …”, then the goal, then the tool list.',
            'Tools: ' + a.map(function (x) { return x.role + ' → ' + x.tools.join(', '); }).join('; ') + '. A worker can call only its own tools.',
            'The scripted model picks a sentence pattern by the role name. A real model (6g) reads the whole text instead.'],
    trap: 'A wrong option name. Python CrewAI silently ignores an option it does not know (the worker ends up with no tools); this lab refuses it with a message.',
    remember: 'Role, goal and backstory become the model\'s instructions. Tools decide what it can look up.' }; }
};

/* ================= 6d: give the jobs an order ================= */
var s6d = { id: '6d', name: 'Give the jobs an order', kind: 'code', lang: 'js',
  goal: 'A Task is one job for one worker: what to do and what a good answer looks like. The crew runs the jobs one after another. A job sees the answers of earlier jobs only through its context.',
  predict: { format: 'blanks',
    q: 'Run 1 puts the <b>writer first</b> with <b>no context</b>. Before you run: <b>tap each report line</b> to say if it will be <b>filled</b> or <b>missing</b>, then tap <b>Check</b>. One try.',
    reveal: { asked: 'Which lines of the report the writer can fill when it runs first, with no context.',
      steps: ['A worker knows only two things: what its own tools return, and the context (answers of earlier jobs).',
              'Run first with context [] → no earlier answers at all.',
              'The writer\'s only tool is action_list. So only the action-list line can be filled.',
              'RESULT and COST need shift_stats (the inspector\'s tool). WHERE IT FAILS needs slice_table (the analyst\'s tool).'],
      trap: 'Thinking the writer “knows” the shift because it is in the same crew. It knows only its tools and its context.',
      remember: 'A job sees only its tools and its context.' } },
  task: [
    'Gap 1, run 1 (wrong on purpose): the writer reads nothing. Type: []',
    'Gap 2, run 1: the writer runs first. Type: writeReport, inspectShift, findCauses',
    'Run 2: gap 1 = the writer reads both earlier jobs: [inspectShift, findCauses] · gap 2 = the right order: inspectShift, findCauses, writeReport'
  ],
  code: [
'const { Task, Crew, Process } = MiniCrew;',
'',
'const inspectShift = new Task({',
"  description: 'Read the facts of the last shift with your tool and state them.',",
"  expected_output: 'Cells checked, lanes per 1,000 cells, defects passed (per 100, with the target), good cells stopped, person checks, reshoots.',",
'  agent: inspector,',
'});',
'const findCauses = new Task({',
"  description: 'Find where the failures cluster: mono vs poly, expert-sure vs expert-unsure cells. List the missed defects.',",
"  expected_output: 'The weaker group in each pair with its numbers, the missed defects and the worst false alarms with ids and scores.',",
'  agent: analyst,',
'  context: [inspectShift],',
'});',
'const writeReport = new Task({',
"  description: 'Write the shift quality report for the plant manager.',",
"  expected_output: 'One page: result vs the target (at most 5 of 100 defects pass), cost in person checks, where it fails, top 3 actions.',",
'  agent: writer,',
'  context: ____,                  // run 1: []   run 2: [inspectShift, findCauses]',
'});',
'',
'const orderCrew = new Crew({',
'  agents: [inspector, analyst, writer],',
'  tasks: [____],                  // the order the jobs run.  run 1: writer first',
'  process: Process.sequential,',
'});',
'const orderResult = await orderCrew.kickoff();',
'console.log(orderResult.raw);'
  ].join('\n'),
  twin: [
'from crewai import Task, Crew, Process',
'',
'inspect_shift = Task(description="Read the facts of the last shift with your tool and state them.",',
'    expected_output="Cells checked, lanes per 1,000 cells, defects passed (per 100, with the target), ...",',
'    agent=inspector)',
'find_causes = Task(description="Find where the failures cluster: mono vs poly, expert-sure vs expert-unsure cells. ...",',
'    expected_output="The weaker group in each pair with its numbers, the missed defects ...",',
'    agent=analyst, context=[inspect_shift])',
'write_report = Task(description="Write the shift quality report for the plant manager.",',
'    expected_output="One page: result vs the target (at most 5 of 100 defects pass), ...",',
'    agent=writer, context=[inspect_shift, find_causes])     # run 1: context=[]',
'',
'order_crew = Crew(agents=[inspector, analyst, writer],',
'                  tasks=[inspect_shift, find_causes, write_report],   # run 1: write_report first',
'                  process=Process.sequential)',
'order_result = order_crew.kickoff()',
'print(order_result.raw)',
'# Writer first WITH context=[inspect_shift, find_causes] -> ValueError at Crew(...):',
'# "... has a context dependency on a future task ..., which is not allowed."'
  ].join('\n'),
  probe: async function (NS) {
    needMC(); needTools(NS); needAgents(NS);
    if (!NS.inspectShift || !NS.findCauses || !NS.writeReport || !NS.orderCrew || !NS.orderResult) return { missing: ['inspectShift', 'findCauses', 'writeReport', 'orderCrew', 'orderResult'].filter(function (k) { return !NS[k]; }) };
    var T = NS.orderCrew.tasks, names = T.map(function (t) { return t === NS.inspectShift ? 'inspectShift' : t === NS.findCauses ? 'findCauses' : t === NS.writeReport ? 'writeReport' : '?'; });
    var wc = NS.writeReport.context, ctxNames = wc === undefined ? null : wc.map(function (t) { return t === NS.inspectShift ? 'inspectShift' : t === NS.findCauses ? 'findCauses' : t === NS.writeReport ? 'writeReport' : '?'; });
    var R = NS.orderResult, wout = R.tasks_output.filter(function (o) { return o.agent === NS.writer.role; })[0];
    return { order: names, ctx: ctxNames, report: wout ? wout.raw : R.raw, fields: fieldsOf(wout ? wout.raw : R.raw), outs: outsOf(R), trace: slimTrace(R.trace), writerTools: NS.writer.tools.map(function (t) { return t.name; }) };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    var right = r.order.join() === 'inspectShift,findCauses,writeReport', all = r.fields.result && r.fields.cost && r.fields.where && r.fields.actions;
    if (r.order.length !== 3 || r.order.indexOf('?') >= 0) return { pass: false, msg: 'The crew has ' + r.order.length + ' jobs (' + r.order.join(', ') + '). List the 3 jobs: inspectShift, findCauses, writeReport.' };
    if (r.order[0] === 'writeReport') return { pass: false, msg: 'This is run 1, wrong on purpose: the writer ran first and wrote “not known” in ' + FIELDS.filter(function (f) { return !r.fields[f[0]]; }).length + ' lines (see the report on the right). Now run 2: the right order, and the writer reads both earlier jobs.' };
    if (!right) return { pass: false, msg: 'Order ' + r.order.join(' → ') + ': the analyst needs the inspector\'s facts and the writer needs both. Put the inspector first, the writer last.' };
    if (!r.ctx || r.ctx.join() !== 'inspectShift,findCauses') return { pass: false, msg: 'The order is right, but the writer reads ' + (r.ctx ? '[' + r.ctx.join(', ') + ']' : 'everything by default') + '. Say it clearly: context: [inspectShift, findCauses].' };
    if (!all) return { pass: false, msg: 'The report still has lines “not known”. Check the order and the writer\'s context.' };
    return { pass: true, msg: 'Jobs in order: inspector → analyst → writer. The report has every line filled from real tool numbers.' };
  },
  mechNeed: function (m) { return m && m.sawPoor ? null : 'first run it once in the WRONG order (writer first, context []) to see the poor report'; },
  example: '<p>A kitchen: the waiter writes the bill. The bill needs the cook\'s list of dishes.</p><pre>const bill = new Task({ description: \'Write the bill.\', expected_output: \'Each dish and the total.\',\n  agent: waiter, context: [cookDishes] });\nconst kitchen = new Crew({ agents: [cook, waiter], tasks: [cookDishes, bill] });</pre><p>The list of tasks is the running order. <code>context</code> says which earlier answers a job may read.</p>',
  render: function (r, el, api) { V().orderView(r, el, api); },
  explain: function (r) { return {
    asked: 'Give each job its worker, run them in an order, and say which earlier answers each job reads.',
    steps: ['Process.sequential runs the tasks list from left to right, one job at a time.',
            'Run 1 (writer first, context []): the writer had only its own tool (' + r.writerTools.join(', ') + '). It wrote “not known” for the result, the cost and the weak spot.',
            'Run 2: the inspector ran first, the analyst read its answer, and the writer read both (context: [inspectShift, findCauses]).',
            'Writer first but WITH context [inspectShift, findCauses] is refused before anything runs — CrewAI has the same rule: no context from a future task.'],
    trap: 'Leaving context out and hoping. In CrewAI a job with no context set reads ALL earlier answers; with context: [] it reads none. Say it on purpose.',
    remember: 'The task list is the running order. Context is what a job may read.' }; }
};

/* ================= 6e: kick off ================= */
var s6e = { id: '6e', name: 'Kick off', kind: 'code', lang: 'js',
  goal: 'Start the whole crew and record every step: each worker thinks, calls a tool, reads the result, and answers. Then follow the real trace message by message in the control room.',
  task: [
    'Gap 1: jobs one after another. Type the process name: sequential',
    'Gap 2: put each step into the trace list. Type the list method: push',
    'Gap 3: start the crew. Type the method name: kickoff',
    'Then tap the glowing worker in the control room to see the next message, until the report is done.'
  ],
  code: [
'const { Crew, Process } = MiniCrew;',
'',
'const trace = [];                                    // every step of every worker',
'const qualityCrew = new Crew({',
'  agents: [inspector, analyst, writer],',
'  tasks: [inspectShift, findCauses, writeReport],',
'  process: Process.____,',
'  step_callback: (step) => trace.____(step),          // called after every step',
'});',
'const shiftResult = await qualityCrew.____();',
"console.log(trace.length + ' steps · ' + shiftResult.tasks_output.length + ' jobs');",
'console.log(shiftResult.raw);'
  ].join('\n'),
  twin: [
'from crewai import Crew, Process',
'',
'trace = []',
'quality_crew = Crew(agents=[inspector, analyst, writer],',
'                    tasks=[inspect_shift, find_causes, write_report],',
'                    process=Process.sequential,',
'                    step_callback=lambda step: trace.append(step))   # AgentAction / AgentFinish objects',
'shift_result = quality_crew.kickoff()',
'print(len(trace), "steps ·", len(shift_result.tasks_output), "jobs")',
'print(shift_result.raw)'
  ].join('\n'),
  probe: async function (NS) {
    needMC(); needTools(NS); needAgents(NS); needTasks(NS);
    if (!NS.qualityCrew || !NS.shiftResult || !NS.trace) return { missing: ['trace', 'qualityCrew', 'shiftResult'].filter(function (k) { return !NS[k]; }) };
    var R = NS.shiftResult;
    return { n: NS.trace.length, nRes: R.trace.length, trace: slimTrace(R.trace), outs: outsOf(R), raw: R.raw, fields: fieldsOf(R.raw), ms: R.ms, order: NS.qualityCrew.tasks.map(function (t) { return t.agent.role; }), brain: NS.inspector.llm ? NS.inspector.llm.kind : 'scripted' };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (!r.n) return { pass: false, msg: 'The trace list is empty: the step_callback must put each step into it. The list method that adds an item is push.' };
    if (r.n !== r.nRes) return { pass: false, msg: 'The trace has ' + r.n + ' steps but the crew made ' + r.nRes + '.' };
    if (!(r.fields.result && r.fields.cost && r.fields.where && r.fields.actions)) return { pass: false, msg: 'The report has lines “not known”. Run 6d again (right order and context), then this cell.' };
    var calls = r.trace.filter(function (e) { return e.type === 'tool_call'; }).length;
    return { pass: true, msg: 'The crew ran: ' + r.outs.length + ' jobs, ' + calls + ' tool calls, ' + r.n + ' steps in ' + r.ms + ' ms (scripted model). Tap through the trace on the right.' };
  },
  mechNeed: function (m) { return m && m.traceEnd ? null : 'tap through the trace in the control room until the report is done'; },
  example: '<p>A garden robot crew. Record every step while they work:</p><pre>const log = [];\nconst garden = new Crew({ agents: [waterer, picker], tasks: [water, pick],\n  process: Process.sequential, step_callback: (s) => log.push(s) });\nconst day = await garden.kickoff();</pre>',
  render: function (r, el, api) { V().controlRoom(r, el, api); },
  explain: function (r) { var c = r.trace.filter(function (e) { return e.type === 'tool_call'; }); return {
    asked: 'Start the crew with kickoff() and record every step with step_callback.',
    steps: ['kickoff() runs the jobs in order: ' + r.order.join(' → ') + '.',
            'Each worker loops: the model decides → it calls a tool → the runner runs the real function → the result goes back to the model → it answers.',
            'Tool calls in this run: ' + c.map(function (e) { return e.agent + ' → ' + e.tool; }).join(', ') + '.',
            'step_callback ran after each of the ' + r.n + ' steps; trace.push kept them all. The writer\'s answer is shiftResult.raw.'],
    trap: 'Reading the trace as the model “thinking”. Here every thought is a fixed sentence of the scripted rules. A real model writes its own.',
    remember: 'Agent loop: decide → tool → result → answer. The trace shows every step.' }; }
};

/* ================= 6f: never trust, check ================= */
var s6f = { id: '6f', name: 'Never trust, check', kind: 'code', lang: 'js',
  goal: 'A model can write a wrong number that looks right. So check every number in the report against the tool facts, and wire the check in as the report job\'s guardrail.',
  pre: { need: function (m) { return m.huntDone ? null : 'find the planted numbers in the report copy above, then tap “Done”'; }, render: function (box, api) { V().plantHunt(box, api); } },
  task: [
    'Gap 1: allow half of the last written digit (so 3.6 written as 4 is fine, 13 for 12 is not). Type: 0.5',
    'Gap 2: the report is right when the list of wrong numbers is empty. Type the length that means empty: 0',
    'Gap 3: the Task option that checks an answer before the next job gets it. Type: guardrail'
  ],
  code: [
'const { Agent, Task, Crew, ScriptedLLM } = MiniCrew;',
'',
'// The facts: what the 4 tools return right now',
'const facts = () => ({ shift_stats: shiftStats.run(), slice_table: sliceTable.run(), worst_cases: worstCases.run(), action_list: actionList.run() });',
'function factNumbers(f) {                         // every number in the facts, as one flat list',
'  const out = [];',
"  (function walk(v) { if (typeof v === 'number') out.push(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); })(f);",
'  return out;',
'}',
'function checkReport(text, f) {',
'  const known = factNumbers(f);',
"  const clean = text.replace(/per 1,000|per 100/g, ' ').replace(/(\\d),(\\d{3})/g, '$1$2');   // units are not facts; 1,234 -> 1234",
'  const wrong = [];',
'  for (const m of clean.matchAll(/\\d+(?:\\.\\d+)?/g)) {',
"    const x = Number(m[0]), dp = (m[0].split('.')[1] || '').length;    // dp = digits after the point",
'    const ok = known.some((k) => Math.abs(k - x) <= ____ * 10 ** -dp);',
'    if (!ok) wrong.push(m[0]);',
'  }',
'  return { ok: wrong.length === ____, wrong };',
'}',
'',
'// 1. The copy with 2 planted numbers, and the real report from 6e',
'const planted = pg.plantedCopy(shiftResult.raw, facts());',
'const onPlanted = checkReport(planted.text, facts());',
'const onReal = checkReport(shiftResult.raw, facts());',
'',
'// 2. The checker as the guardrail of the report job. A failed check sends the report back once.',
'const sloppyWriter = new Agent({ role: writer.role, goal: writer.goal, backstory: writer.backstory, tools: writer.tools,',
'  llm: new ScriptedLLM({ slips: 2 }) });          // a scripted writer that changes 2 numbers in its first draft, on purpose',
'const checkedReport = new Task({',
'  description: writeReport.description, expected_output: writeReport.expected_output,',
'  agent: sloppyWriter, context: [inspectShift, findCauses],',
'  ____: (output) => {',
'    const c = checkReport(output.raw, facts());',
"    return c.ok ? [true, output.raw] : [false, 'These numbers are not in the tool results: ' + c.wrong.join(', ')];",
'  },',
'  guardrail_max_retries: 1,',
'});',
'const guarded = await new Crew({ agents: [inspector, analyst, sloppyWriter], tasks: [inspectShift, findCauses, checkedReport] }).kickoff();',
"console.log('planted copy:', onPlanted.wrong, '· real report ok:', onReal.ok);"
  ].join('\n'),
  twin: [
'import json, re',
'',
'def facts():',
'    return {n: json.loads(t.run()) for n, t in [("shift_stats", shift_stats), ("slice_table", slice_table),',
'                                               ("worst_cases", worst_cases), ("action_list", action_list)]}',
'def fact_numbers(v):',
'    if isinstance(v, bool): return []',
'    if isinstance(v, (int, float)): return [v]',
'    if isinstance(v, dict): v = list(v.values())',
'    return [x for item in v for x in fact_numbers(item)] if isinstance(v, list) else []',
'',
'def check_report(text, f):',
'    known = fact_numbers(f)',
'    clean = re.sub(r"(\\d),(\\d{3})", r"\\1\\2", re.sub(r"per 1,000|per 100", " ", text))',
'    wrong = []',
'    for tok in re.findall(r"\\d+(?:\\.\\d+)?", clean):',
'        dp = len(tok.split(".")[1]) if "." in tok else 0',
'        if not any(abs(k - float(tok)) <= 0.5 * 10 ** -dp for k in known): wrong.append(tok)',
'    return {"ok": len(wrong) == 0, "wrong": wrong}',
'',
'def report_guardrail(output):                       # CrewAI guardrail: (bool, result or error)',
'    c = check_report(output.raw, facts())',
'    return (True, output.raw) if c["ok"] else (False, "These numbers are not in the tool results: " + ", ".join(c["wrong"]))',
'',
'sloppy_writer = Agent(role=writer.role, goal=writer.goal, backstory=writer.backstory,',
'                      tools=writer.tools, llm=ScriptedLLM(model="scripted-rules", slips=2))',
'checked_report = Task(description=write_report.description, expected_output=write_report.expected_output,',
'                      agent=sloppy_writer, context=[inspect_shift, find_causes],',
'                      guardrail=report_guardrail, guardrail_max_retries=1)',
'guarded = Crew(agents=[inspector, analyst, sloppy_writer], tasks=[inspect_shift, find_causes, checked_report]).kickoff()'
  ].join('\n'),
  probe: async function (NS, pg) {
    needMC(); needTools(NS); needAgents(NS); needTasks(NS); need(NS, ['shiftResult'], 'Run 6e first: the check reads the real report');
    if (typeof NS.checkReport !== 'function' || !NS.planted || !NS.onPlanted || !NS.onReal || !NS.guarded) return { missing: ['checkReport', 'planted', 'onPlanted', 'onReal', 'guarded'].filter(function (k) { return !NS[k]; }) };
    var F = NS.facts(), known = factList(F), S = F.shift_stats;
    /* hidden tests, built from the real facts: a rounded fact must pass; a near miss must be caught */
    var round = null, rv = null;                     // a decimal fact written with one digit less, that is not itself a fact
    known.some(function (k) { var d = (String(k).split('.')[1] || '').length; if (!d) return false; var w = (+k).toFixed(d - 1), x = +w; if (x === k || known.indexOf(x) >= 0) return false; round = w; rv = k; return true; });
    var near = S.good_cells_stopped + 1;
    while (known.some(function (k) { return Math.abs(k - near) <= 0.5; })) near++;
    var tests = [{ text: 'A fact, rounded: ' + round + '.', want: true, what: rv + ' written as ' + round },
                 { text: 'Good cells stopped: ' + near + '.', want: false, what: near + ' (no fact is that number)' }];
    tests.forEach(function (t) { try { t.got = NS.checkReport(t.text, F); } catch (e) { t.err = errMsg(e); } });
    var g = NS.guarded.tasks_output[2];
    return { planted: NS.planted, onPlanted: NS.onPlanted, onReal: NS.onReal, real: NS.shiftResult.raw, tests: tests, attempts: g.attempts, final: g.raw, guardTrace: slimTrace(NS.guarded.trace).filter(function (e) { return e.task === 2; }),
      hasGuard: typeof NS.checkedReport.guardrail === 'function', retries: NS.checkedReport.guardrail_max_retries };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    var pl = r.planted.planted.map(function (p) { return p.now; }), got = r.onPlanted.wrong || [];
    var t0 = r.tests[0], t1 = r.tests[1];
    if (t0.err || t1.err) return { pass: false, msg: 'checkReport crashed: ' + (t0.err || t1.err) };
    if (r.onReal.ok !== (r.onReal.wrong.length === 0)) return { pass: false, msg: 'ok says ' + r.onReal.ok + ' while the wrong list has ' + r.onReal.wrong.length + ' numbers. The report is right only when the wrong list is empty: length 0.' };
    if (!r.onReal.ok) return { pass: false, msg: 'Your checker refuses the REAL report: ' + r.onReal.wrong.join(', ') + '. Allow half of the last written digit: 0.5.' };
    if (!t0.got.ok) return { pass: false, msg: 'Your checker refuses ' + t0.what + ' — but that is the same fact, rounded the way the text writes it. Allow half of the last written digit: 0.5.' };
    var missedP = pl.filter(function (x) { return got.indexOf(x) < 0; });
    if (missedP.length || t1.got.ok) return { pass: false, msg: 'Your checker lets ' + (missedP.length ? 'the planted number ' + missedP.join(' and ') : t1.what) + ' through: the allowed gap is too wide. Allow only half of the last written digit: 0.5.' };
    if (got.length !== pl.length) return { pass: false, msg: 'On the planted copy your checker flags ' + got.join(', ') + '; only ' + pl.join(' and ') + ' were planted.' };
    if (!r.hasGuard) return { pass: false, msg: 'The report job has no guardrail: the check never runs. The Task option is guardrail.' };
    if (!(r.attempts.length === 2 && !r.attempts[0].ok && r.attempts[1].ok)) return { pass: false, msg: 'The guardrail did not catch the sloppy first draft and pass the second (' + r.attempts.map(function (a) { return a.ok ? 'pass' : 'fail'; }).join(', ') + ').' };
    return { pass: true, msg: 'Planted copy: both planted numbers caught (' + pl.join(', ') + '). Real report: every number found in the tool facts. Guardrail: the sloppy draft was sent back once (' + r.attempts[0].feedback.replace(/^.*: /, '') + '), the second draft passed.' };
  },
  example: '<p>A shop checks a till slip against the price list:</p><pre>const prices = [2.5, 4, 12];\nconst ok = (x, dp) => prices.some((p) => Math.abs(p - x) <= 0.5 * 10 ** -dp);\nok(2.5, 1);   // true: on the list\nok(13, 0);    // false: no price is 13</pre><p>A number written with fewer digits may be rounded, but never more than half of its last digit.</p>',
  render: function (r, el, api) { V().checkView(r, el, api); },
  explain: function (r) { var a = r.attempts; return {
    asked: 'Pull every number out of a report, compare it with the tool facts, and use that check as the report job\'s guardrail.',
    steps: ['factNumbers walks the 4 tool results and lists every number in them. Units (“per 1,000”, “per 100”) are taken out of the text first.',
            'A written number is OK if some fact is within half of its last digit: ' + r.tests[0].what + ' is fine, but ' + r.tests[1].what.split(' ')[0] + ' is caught.',
            'Planted copy: ' + r.planted.planted.map(function (p) { return p.was + ' → ' + p.now; }).join(' and ') + ' — both flagged. The real report: ' + (r.onReal.ok ? 'no wrong number.' : 'wrong: ' + r.onReal.wrong.join(', ')),
            'Guardrail: draft 1 failed (' + a[0].feedback + '). As in CrewAI, the writer got only the error and its old draft, so it could not find the right numbers again: it removed them. Draft 2 passed.'],
    trap: 'A wrong number that happens to equal ANOTHER fact slips through this checker. A stronger checker matches each number to its label.',
    remember: 'Never trust a report: check every number against the tools.' }; }
};

/* ================= 6g: a real model (optional) ================= */
var s6g = { id: '6g', name: 'Plug in a real model (optional)', kind: 'scene', scene: 'keySlot',
  goal: 'Optional. Run the same crew with a real language model, with your checker as the guardrail, side by side with the scripted report. Your key stays in this page\'s memory only.',
  needText: 'run the crew with a real model, or tap “Skip — no key”' };

var step6 = { id: 6, title: 'Add the CrewAI quality crew', short: 'tools, workers, jobs, kickoff, checker, real model',
  story: 'The shift is over. Three AI workers read your Step 5 logbook and Step 4 findings and write the shift report for the plant manager — and a checker makes sure every number in it is true. Real CrewAI is Python and cannot run in a browser, so you use MiniCrew: the same ideas and names in JavaScript, with the real Python CrewAI beside every cell.',
  substeps: [s6a, s6b, s6c, s6d, s6e, s6f, s6g] };

var REF6 = { '6b': ["'shift_stats'", 'auditLog', 'defPassed'], '6c': ["'Root-cause Analyst'", 'worstCases', 'tools'], '6d': ['[inspectShift, findCauses]', 'inspectShift, findCauses, writeReport'],
  '6e': ['sequential', 'push', 'kickoff'], '6f': ['0.5', '0', 'guardrail'] };
step6.substeps.forEach(function (s) { if (REF6[s.id]) s.ref = REF6[s.id]; if (s.kind === 'code') { s.twinTitle = 'Same thing in Python CrewAI'; s.twinNote = 'read-only · crewai 1.15.44'; s.edLabel = 'JavaScript · MiniCrew (CrewAI-style)'; } });
s6d.predict.render = function (body, api, pr, lock, whyBox) { V().blanksPredict(body, api, pr, lock, whyBox, s6d.predict); };

G.PG_NAME_FROM = Object.assign(G.PG_NAME_FROM || {}, { mono: '4e', poly: '4e', sure: '4e', unsure: '4e', auditLog: '5d', shift1: '5g',
  shiftStats: '6b', sliceTable: '6b', worstCases: '6b', actionList: '6b', brain: '6c', inspector: '6c', analyst: '6c', writer: '6c',
  inspectShift: '6d', findCauses: '6d', writeReport: '6d', orderCrew: '6d', trace: '6e', qualityCrew: '6e', shiftResult: '6e', facts: '6f', checkReport: '6f' });
G.PG_STEP6 = step6;
G.PG_STEP6_UTIL = { fieldsOf: fieldsOf, FIELDS: FIELDS, factList: factList, numberTokens: numberTokens, regWriters: regWriters, slimTrace: slimTrace, outsOf: outsOf };
var prevExtra = G.PG_PG_EXTRA;
G.PG_PG_EXTRA = function (pg) { var o = prevExtra ? prevExtra(pg) : {}; regWriters(); return Object.assign(o, extra(pg)); };
if (G.PG_STEPS) { var i6 = G.PG_STEPS.findIndex(function (s) { return s.id === 6; }); if (i6 >= 0) G.PG_STEPS[i6] = step6; }
})(typeof window !== 'undefined' ? window : globalThis);
