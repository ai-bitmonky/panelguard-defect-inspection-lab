// Step 6 end to end in real headless Chrome. TARGET=site|file|srcdoc.
// Start state: Steps 0-5 passed (seed.mjs + the M3/M4/M5 mech below); Step 3 model = the Keras-trained TEST FIXTURE in IndexedDB.
// Everything else replays for real (Steps 3-5 cells, then the Step 6 cells as they pass). The real-model path (6g) talks to a
// MOCKED provider (Playwright routes answer api.anthropic.com and an OpenAI-compatible base URL): no real model is called.
import { chromium } from 'playwright'; import { mirrorCDN } from './cdn.mjs'; import { spawn } from 'child_process';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
import { FILLS, fill } from './fills.mjs'; import { loadSteps, seedState, KEY } from './seed.mjs'; import { FIX, LOAD_SRC } from './fixture.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site'); const shots = path.resolve(here, '../shots');
const { SUBS } = loadSteps();
const W = 1366, H = 768, MODE = process.env.TARGET || 'site', DIST = path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v0.7.html');
const SECRET = 'sk-test-PG6-' + 'Zq81xLm4Vt7Rk2Wd9';                // a fake key: it must never appear in storage, console or page text
let srv = null; if (MODE !== 'file') { srv = spawn('node', [path.resolve(here, '../serve.mjs'), site, '8773'], { stdio: 'pipe' }); await new Promise((r) => srv.stdout.once('data', r)); }
process.on('exit', () => { try { srv && srv.kill(); } catch (e) {} });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H } }); await mirrorCDN(ctx); const page = await ctx.newPage();
const errors = [], consoleAll = []; page.on('console', (m) => { consoleAll.push(m.text()); if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const t0 = Date.now(), log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
let n = 0; const shot = async (nm) => page.screenshot({ path: `${shots}/s6_${MODE}_${String(++n).padStart(2, '0')}_${nm}.png` });
let F = page; const ev = (f, a) => F.evaluate(f, a); const fails = [];
const expect = (ok, what) => { log(ok ? 'OK  ' : 'FAIL', what); if (!ok) fails.push(what); };
const frame = async () => { for (let i = 0; i < 80; i++) { const x = page.frames().find((q) => q.url().startsWith('about:srcdoc')); if (x) return x; await page.waitForTimeout(100); } return page.frames()[1]; };
const loadApp = async (first) => {
  if (MODE === 'site') { if (first) await page.goto('http://localhost:8773/index.html'); else await page.reload(); F = page; }
  else if (MODE === 'file') { if (first) await page.goto('file://' + DIST); else await page.reload(); F = page; }
  else { if (first) await page.goto('http://localhost:8773/data/labels.json');
    await page.setContent('<style>body{margin:0}</style><iframe id=f sandbox="allow-scripts allow-same-origin" style="width:' + W + 'px;height:' + H + 'px;border:0"></iframe>');
    await page.evaluate((h) => { document.getElementById('f').srcdoc = h; }, fs.readFileSync(DIST, 'utf8')); await page.waitForTimeout(1500); F = await frame(); }
};

/* ---------- the mocked providers: a tiny fake "model" that calls every tool once, then answers from the tool results ---------- */
const calls = { anthropic: 0, openai: 0, headers: [] };
function fakeAnswer(role, sysText, userText, results) {
  const retry = /Previous attempt failed validation/.test(userText);
  if (/Inspector/.test(role)) { const s = results.shift_stats; return `Shift facts: ${s.cells} cells. Defects passed: ${s.defects_passed} of ${s.defects} (${s.defects_passed_per_100} per 100; target at most ${s.target_max_per_100}). ${s.person_checks} person checks.`; }
  if (/Analyst/.test(role)) { const g = results.slice_table.groups; return `Poly: ${g.poly.defects_passed} of ${g.poly.defects} defects passed (${g.poly.passed_per_100} per 100). Mono: ${g.mono.defects_passed} of ${g.mono.defects}. Missed: ${results.worst_cases.missed_count}.`; }
  const ctxt = (userText.split("This is the context you're working with:\n")[1] || '').split('\n\n----------\n\n');
  if (retry) { const prev = userText.split('### Previous result:\n')[1].split('\n\n\nTry again')[0]; return prev.split('\n').filter((l) => !/yield loss/.test(l)).join('\n'); }
  return ['MOCK MODEL REPORT', ...ctxt.map((x) => x.trim()), `Action list: ${results.action_list.sorted} mistakes sorted.`, 'Estimated yield loss: 12.34 panels.'].join('\n');   // 12.34 is invented on purpose
}
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' };
await ctx.route('https://api.anthropic.com/v1/messages', async (route) => {
  const rq = route.request(); if (rq.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
  calls.anthropic++; const hd = rq.headers(); calls.headers.push({ p: 'anthropic', key: hd['x-api-key'] === SECRET, browser: hd['anthropic-dangerous-direct-browser-access'], version: hd['anthropic-version'] });
  const b = JSON.parse(rq.postData()), names = {}, results = {}; const role = (b.system.match(/^You are (.+?)\. /) || [])[1] || '?';
  b.messages.forEach((m) => (Array.isArray(m.content) ? m.content : []).forEach((c) => { if (c.type === 'tool_use') names[c.id] = c.name; if (c.type === 'tool_result') results[names[c.tool_use_id]] = JSON.parse(c.content); }));
  const next = (b.tools || []).map((t) => t.name).find((t) => !(t in results));
  const userText = b.messages[0].content.map((c) => c.text || '').join('');
  const body = next ? { content: [{ type: 'text', text: 'I will look up ' + next + '.' }, { type: 'tool_use', id: 'tu_' + calls.anthropic, name: next, input: {} }], stop_reason: 'tool_use' } : { content: [{ type: 'text', text: fakeAnswer(role, b.system, userText, results) }], stop_reason: 'end_turn' };
  return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify({ id: 'msg_mock', type: 'message', role: 'assistant', model: b.model, ...body }) });
});
await ctx.route('https://mock-llm.example/v1/chat/completions', async (route) => {
  const rq = route.request(); if (rq.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
  calls.openai++; const hd = rq.headers(); calls.headers.push({ p: 'openai', key: hd.authorization === 'Bearer ' + SECRET });
  const b = JSON.parse(rq.postData()), names = {}, results = {}; const role = (b.messages[0].content.match(/^You are (.+?)\. /) || [])[1] || '?';
  b.messages.forEach((m) => { (m.tool_calls || []).forEach((c) => { names[c.id] = c.function.name; }); if (m.role === 'tool') results[names[m.tool_call_id]] = JSON.parse(m.content); });
  const next = (b.tools || []).map((t) => t.function.name).find((t) => !(t in results));
  const msg = next ? { role: 'assistant', content: null, tool_calls: [{ id: 'call_' + calls.openai, type: 'function', function: { name: next, arguments: '{}' } }] }
    : { role: 'assistant', content: fakeAnswer(role, b.messages[0].content, b.messages[1].content, results).replace('\nEstimated yield loss: 12.34 panels.', '') };
  return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify({ id: 'cmpl_mock', choices: [{ index: 0, message: msg, finish_reason: next ? 'tool_calls' : 'stop' }] }) });
});

await loadApp(true);
await F.waitForFunction(() => window.PG && window.PG.JSR.ready, null, { timeout: 300000 });
const MKEY = 'indexeddb://panelguard-cnn-testfixture';
await ev(async ([src, F2, key]) => {
  const load = new Function('return ' + src)(), m = tf.sequential(); m.add(tf.layers.inputLayer({ inputShape: [64, 64, 1] }));
  for (const f of [16, 32, 64, 128]) { m.add(tf.layers.conv2d({ filters: f, kernelSize: 3, padding: 'same', useBias: false })); m.add(tf.layers.batchNormalization()); m.add(tf.layers.activation({ activation: 'relu' })); m.add(tf.layers.maxPooling2d({ poolSize: 2 })); }
  m.add(tf.layers.globalAveragePooling2d({})); m.add(tf.layers.dropout({ rate: 0.3 })); m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  load(tf, m, F2); await m.save(key); m.dispose();
}, [LOAD_SRC, FIX, MKEY]);
const st = JSON.parse(seedState(SUBS, { epochsMode: 'full' }));
const M = { '3a': { tilesDone: 1 }, '3b': { done: 1 }, '3c': { tapBig: 1 }, '3d': { sortOk: 1 }, '3e': { modelKey: MKEY, savedAt: 'TEST FIXTURE (Keras-trained)', lastRes: { epochs: 30, done: 30, hist: [{ epoch: FIX.best_epoch, loss: null, valLoss: 0.5, valAuc: FIX.best_auc, sec: 0 }], best: { epoch: FIX.best_epoch, valAuc: FIX.best_auc }, restored: FIX.best_epoch, sec: 0, backend: 'webgl', gpu: null, nTrain: 1574, nDef: 492, cw: [0.7, 1.6], quick: 'full' } }, '3f': { hit: 1 }, '3g': { twoDone: 1, capOk: 1 },
  '4a': { paint: { 496: [1], 1088: [1], 379: [1] }, done: true }, '4b': { patchOk: 1, bestDrop: 0.5 }, '4c': { peek: 3 }, '4d': {}, '4e': { rows: ['kind', 'prob'] },
  '4f': { done: 1, box: {}, actions: { more: [2166, 2456], label: [593, 1222], sharp: [2089], wrong: [1761] } },       // a sorted action list (in real use: the student's own boxes)
  '5a': { done: 1, wires: [] }, '5b': { cardOk: 1 }, '5c': { tokenEnd: 1 }, '5d': {}, '5e': { sawLoop: 1 }, '5f': { dec: { a: 'pass', b: 'pass', c: 'stop', d: 'pass', e: 'stop' } }, '5g': { need: 0, found: 0 } };
const PRED = { lanes: { locked: true, val: { place: {} }, good: 1, cells: [] } };
for (const id of Object.keys(M)) { const s = SUBS[id]; st.subs[id] = { mech: M[id], pred: s.predict ? (s.predict.format === 'lanes' ? PRED.lanes : { locked: true, val: s.predict.format === 'draw' ? new Array(30).fill(0.5) : 1, good: 1 }) : {} }; if (s.kind === 'code') { st.subs[id].codePass = true; st.subs[id].code = fill(s.code, s.ref); } }
st.cur = '6a';
await ev(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(st)]);
await loadApp(false);
await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['5g'], null, { timeout: 900000 });
log('ready: Steps 0-5 rebuilt after', ((Date.now() - t0) / 1000).toFixed(0), 's');
const open = async (id) => { await ev((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(700); };
const mech = (id) => ev((i) => (window.PG.S.subs[i] || {}).mech || {}, id);
const pend = (id) => ev((i) => window.PG.pendingOf(i), id);
const setCode = async (c) => { await F.locator('.edw textarea').first().fill(c); await F.locator('.ed').first().evaluate((e) => { e.scrollTop = 0; e.scrollLeft = 0; }); };
const run = async (id, timeout = 300000) => { const t = Date.now(); await F.locator('#runbtn').click(); await F.waitForFunction((i) => window.PG.VERD[i] != null && window.PG.running() == null, id, { timeout }); const v = await ev((i) => window.PG.VERD[i], id); log(id, 'run', ((Date.now() - t) / 1000).toFixed(1) + 's', v.pass ? 'PASS: ' + v.msg : 'FAIL: ' + v.msg); return v; };
const codeStep = async (id, wrongs) => { for (const w of wrongs) { await setCode(fill(SUBS[id].code, w)); const v = await run(id); expect(!v.pass, id + ' wrong answer ' + JSON.stringify(w) + ' fails'); } await setCode(fill(SUBS[id].code, SUBS[id].ref)); const v = await run(id); expect(v.pass, id + ' right answer passes'); };
const top = async () => { await F.locator('#out').evaluate((e) => { e.scrollTop = 0; }); };

// 6a who does what
await open('6a'); expect(await ev(() => window.PG.S.cur === '6a'), '6a opens (Step 6 unlocked)');
await F.locator('[data-card6="make_up"]').click(); await F.locator('#drop6a-writer').click(); await page.waitForTimeout(150);
expect(/never from the model/.test(await F.locator('#hiremsg').innerText()), '6a decoy card (make up a number) refused with the rule');
await F.locator('[data-card6="shift_stats"]').click(); await F.locator('#drop6a-analyst').click(); await page.waitForTimeout(150);
expect(/Not this worker/.test(await F.locator('#hiremsg').innerText()) && !(await mech('6a')).put.shift_stats, '6a wrong worker refused with a reason');
await shot('6a_refused');
{ const a = await F.locator('[data-card6="shift_stats"]').boundingBox(), b = await F.locator('#drop6a-inspector').boundingBox(); await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 }); await page.mouse.up(); await page.waitForTimeout(150); }
expect((await mech('6a')).put.shift_stats === 'inspector', '6a card given by dragging');
for (const [c, w] of [['slice_table', 'analyst'], ['worst_cases', 'analyst'], ['action_list', 'writer'], ['job_facts', 'inspector'], ['job_causes', 'analyst'], ['job_report', 'writer']]) { await F.locator(`[data-card6="${c}"]`).click(); await F.locator('#drop6a-' + w).click(); await page.waitForTimeout(100); }
expect(await pend('6a') === null, '6a every card on the right worker, done'); await shot('6a');
// 6b make a tool + call panel
await open('6b'); await codeStep('6b', FILLS['6b'].wrong.slice(0, 2));
for (const t of ['shift_stats', 'slice_table', 'worst_cases', 'action_list']) { await F.locator(`[data-call6="${t}"]`).click(); await page.waitForTimeout(400); }
expect(await pend('6b') === null && /action_list\(\) → result/.test(await F.locator('#callres6').innerText()), '6b all 4 tools called by hand; result card shown'); await top(); await shot('6b');
// 6c hire
await open('6c'); await codeStep('6c', FILLS['6c'].wrong.slice(0, 1));
for (let i = 0; i < 3; i++) { await F.locator(`[data-badge6="${i}"]`).click(); await page.waitForTimeout(250); if (i === 1) { await top(); await shot('6c_prompt'); } }
expect(await pend('6c') === null && /Your personal goal is/.test(await F.locator('#prompt6').innerText()), '6c 3 badges read; the real prompt text shown');
// 6d predict (blanks) + wrong order, then right
await open('6d'); await F.locator('[data-line6]').first().waitFor({ timeout: 60000 });
const truth = await ev(() => window.PG.S.subs['6d'].pred.truth); log('6d truth (filled?):', JSON.stringify(truth));
for (const k of Object.keys(truth)) { await F.locator(`[data-line6="${k}"]`).click(); if (!truth[k]) await F.locator(`[data-line6="${k}"]`).click(); await page.waitForTimeout(60); }
await shot('6d_predict'); await F.locator('#blankcheck').click(); await page.waitForTimeout(300);
expect(/All 4 right/.test(await F.locator('#predbox .verdict').innerText()) && await ev(() => window.PG.S.subs['6d'].pred.locked), '6d blanks prediction checked once and locked');
await setCode(fill(SUBS['6d'].code, FILLS['6d'].wrong[0])); { const v = await run('6d'); expect(!v.pass && /wrong on purpose/.test(v.msg), '6d run 1 (writer first, no context): the real poor report'); }
expect(!!(await mech('6d')).sawPoor && /not known/.test(await F.locator('#vizbox').innerText()), '6d poor report shown with “not known” lines'); await top(); await shot('6d_poor');
await setCode(fill(SUBS['6d'].code, FILLS['6d'].wrong[1])); { const v = await run('6d'); expect(!v.pass && /runs LATER/.test(await F.locator('#errbox').innerText()), '6d writer first WITH future context: refused in plain words (CrewAI rule)'); }
await codeStep('6d', []); expect(await pend('6d') === null, '6d passed after the wrong run'); await top(); await shot('6d');
// 6e kickoff + trace
await open('6e'); await codeStep('6e', FILLS['6e'].wrong.slice(1, 2));
const nTr = await ev(() => window.PG.RES['6e'].trace.length); log('6e trace length', nTr);
for (let k = 0; k < 4; k++) { const role = await ev(() => { const r = window.PG.RES['6e'], m = window.PG.S.subs['6e'].mech, i = m.tk == null ? 0 : m.tk + 1; return r.trace[i].agent; }); const key = /Inspector/.test(role) ? 'inspector' : /Analyst/.test(role) ? 'analyst' : 'writer'; await F.locator(`#room6e [data-worker="${key}"]`).click(); await page.waitForTimeout(200); if (k === 2) { await top(); await shot('6e_bubble'); } }
expect((await mech('6e')).tk === 3, '6e tapping the glowing worker moves the trace on');
for (let k = 0; k < nTr && !(await mech('6e')).traceEnd; k++) { await F.locator('#next6e').click(); await page.waitForTimeout(60); if (k === 8) { await top(); await shot('6e_tool'); } }
expect(await pend('6e') === null && /THE FINISHED REPORT/.test(await F.locator('#out').innerText()), '6e trace tapped to the end; finished report card'); await top(); await shot('6e');
const report = await ev(() => window.PG.RES['6e'].raw); log('6e REAL REPORT (browser):\n' + report);
// 6f the planted copy hunt, then the checker
await open('6f'); await F.locator('[data-num6]').first().waitFor({ timeout: 60000 });
const planted = await ev(() => { const k = window.PG.JSR.k, NS = k.NS; const f = { shift_stats: NS.shiftStats.run(), slice_table: NS.sliceTable.run(), worst_cases: NS.worstCases.run(), action_list: NS.actionList.run() }; return k.pg().plantedCopy(NS.shiftResult.raw, f).planted; });
for (const p of planted) await F.locator(`[data-num6="${p.at}"]`).click();
await shot('6f_hunt'); await F.locator('#hunt6').click(); await page.waitForTimeout(200);
expect((await mech('6f')).found === 2 && /found <b>2 of 2|found 2 of 2/.test(await F.locator('#prebox').innerHTML()), '6f hunt: both planted numbers found by tapping');
await codeStep('6f', [FILLS['6f'].wrong[0], FILLS['6f'].wrong[2]]);
expect(await pend('6f') === null && /DRAFT 2 · CHECK PASSED/.test(await F.locator('#out').innerText()), '6f checker catches the planted numbers, passes the real report; guardrail sent the sloppy draft back once'); await top(); await shot('6f');
// 6g the key slot (mocked providers)
await open('6g');
const keyNow = async () => ev(() => [...document.querySelectorAll('input')].map((i) => i.value).join('|'));
if (MODE !== 'srcdoc') {
  await F.locator('#model6').fill('claude-opus-5-5'); await F.locator('#key6').fill(SECRET);
  await F.locator('#run6g').click(); await F.waitForFunction(() => /SIDE BY SIDE|blocked|failed/.test(document.getElementById('out').innerText + document.getElementById('stat6g').innerText), null, { timeout: 60000 });
  const t1 = await F.locator('#out').innerText();
  expect(/SIDE BY SIDE/.test(t1) && /draft 1 failed \(These numbers are not in the tool results: 12\.34\)/.test(t1) && /every number in its report is in the tool facts/.test(t1), 'mock Anthropic: real-model crew ran, guardrail caught the invented 12.34, sent back once, second draft passed');
  await top(); await shot('6g_anthropic');
  await F.locator('#prov6').selectOption('openai'); await F.locator('#base6').fill('https://mock-llm.example/v1'); await F.locator('#model6').fill('gpt-5.5');
  expect(await F.locator('#key6').inputValue() === SECRET, 'key slot keeps the key in memory while the page is open');
  await F.locator('#run6g').click(); await page.waitForTimeout(500); await F.waitForFunction(() => /OpenAI-compatible · gpt-5\.5/.test(document.getElementById('out').innerText) || /blocked|failed/.test(document.getElementById('stat6g').innerText), null, { timeout: 60000 });
  expect(/OpenAI-compatible · gpt-5\.5/.test(await F.locator('#out').innerText()) && /every number in its report is in the tool facts/.test(await F.locator('#out').innerText()), 'mock OpenAI-compatible: real-model crew ran, guardrail passed');
  log('provider calls:', JSON.stringify({ anthropic: calls.anthropic, openai: calls.openai }), JSON.stringify(calls.headers.slice(0, 1)), JSON.stringify(calls.headers.find((x) => x.p === 'openai')));
  expect(calls.headers.every((x) => x.key) && calls.headers.filter((x) => x.p === 'anthropic').every((x) => x.browser === 'true' && x.version === '2026-10-21'), 'requests carried the key in the auth header only, with the browser-access header (Anthropic)');
  // a provider error must not echo the key
  await ctx.route('https://mock-llm.example/v1/chat/completions', (route) => route.request().method() === 'OPTIONS' ? route.fulfill({ status: 204, headers: CORS }) : route.fulfill({ status: 401, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify({ error: { message: 'Incorrect API key provided: ' + SECRET } }) }));
  await F.locator('#run6g').click(); await F.waitForFunction(() => /HTTP 401/.test(document.getElementById('stat6g').innerText), null, { timeout: 30000 });
  expect(!(await F.locator('#stat6g').innerText()).includes(SECRET) && /\[key hidden\]/.test(await F.locator('#stat6g').innerText()), 'provider error shown in plain words with the key hidden');
  await shot('6g_error');
} else {
  await F.locator('#skip6g').click(); await page.waitForTimeout(300);
  expect(/skipped — no key/.test(await F.locator('#stat6g').innerText()), '6g skipped honestly (no key) in the srcdoc frame');
}
expect(await pend('6g') === null && /STEP 6 DONE/.test(await F.locator('#out').innerText()), '6g done; end card shown'); await top(); await shot('6g');
const storeTxt = await ev(() => { let s = ''; try { for (let i = 0; i < localStorage.length; i++) s += localStorage.getItem(localStorage.key(i)); } catch (e) {} return s + JSON.stringify(window.PG.S) + document.body.innerText; });
expect(!storeTxt.includes(SECRET) && !consoleAll.join('\n').includes(SECRET), 'key never in storage, console or page text');
const np = await ev(() => window.PG.ORDER.filter((i) => i < '7' && !window.PG.passed(i))); expect(np.length === 0, 'Steps 0-6 all passed (' + JSON.stringify(np) + ')');
expect(await ev(() => [...document.querySelectorAll('.ns.lock .nt')].map((e) => e.textContent).filter((t) => /operator console|Line trial/.test(t)).length === 2), 'Steps 7-8 still locked');
// reload: Step 6 comes back by itself; the key is gone
if (process.env.RELOAD !== '0') {
  const t1 = Date.now(); await loadApp(false);
  await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['6f'], null, { timeout: 900000 });
  log('reload: rebuilt up to 6f in', ((Date.now() - t1) / 1000).toFixed(0), 's');
  expect(await ev(() => window.PG.ORDER.filter((i) => i < '7' && !window.PG.passed(i)).length === 0), 'after reload: Steps 0-6 still passed');
  await open('6g'); expect(!(await keyNow()).includes(SECRET), 'after reload: the key slot is empty');
}
// review mode: open 6a-6g, Run up to here on 6f
if (process.env.REVIEW !== '0') {
  await F.locator('#revbtn').click(); await page.waitForTimeout(400);
  for (const id of ['6g', '6a', '6c', '6f', '6b', '6e', '6d']) { await open(id); expect(await ev((i) => window.PG.S.cur === i, id), 'review: opens ' + id); }
  await shot('6d_review'); await open('6f');
  const t2 = Date.now(); await F.locator('#runupto').click(); await F.waitForFunction(() => !window.PG.runningUpTo(), null, { timeout: 900000 }); await page.waitForTimeout(500);
  expect(await ev(() => window.PG.VERD['6f'] && window.PG.VERD['6f'].pass && /THE GUARDRAIL AT WORK/.test(document.getElementById('vizbox').innerText)), 'review: Run up to here on 6f gives the real checker + guardrail result (' + await ev(() => (document.getElementById('rvstat') || {}).textContent) + ', ' + ((Date.now() - t2) / 1000).toFixed(0) + 's)');
  await shot('6f_review');
}
const errs2 = errors.filter((e) => !/status of 401 \(Unauthorized\)/.test(e)); log('expected 401 from the deliberate provider-error test:', errors.length - errs2.length); errors.length = 0; errors.push(...errs2);
expect(errors.length === 0, 'zero console errors' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 5)) : ''));
log('TOTAL', ((Date.now() - t0) / 1000).toFixed(0) + 's | FAILS:', fails.length);
await browser.close(); process.exit(fails.length ? 1 : 0);
