// Step 5 end to end in real headless Chrome. TARGET=site|file|srcdoc.
// Start state: Steps 0-3 passed (seed.mjs); the Step 3 model is the Keras-trained TEST FIXTURE (fixture.mjs), saved into this
// browser's IndexedDB first so the app restores it exactly like a student's saved model. Everything else is computed live.
import { chromium } from 'playwright'; import { mirrorCDN } from './cdn.mjs'; import { spawn } from 'child_process';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
import { FILLS, fill } from './fills.mjs'; import { loadSteps, seedState, KEY } from './seed.mjs'; import { FIX, LOAD_SRC } from './fixture.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site'); const shots = path.resolve(here, '../shots');
const { SUBS } = loadSteps();
const W = 1366, H = 768, MODE = process.env.TARGET || 'site', DIST = path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v0.6.html');
let srv = null; if (MODE !== 'file') { srv = spawn('node', [path.resolve(here, '../serve.mjs'), site, '8771'], { stdio: 'pipe' }); await new Promise((r) => srv.stdout.once('data', r)); }
process.on('exit', () => { try { srv && srv.kill(); } catch (e) {} });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H } }); await mirrorCDN(ctx); const page = await ctx.newPage();
const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const t0 = Date.now(), log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
let n = 0; const shot = async (nm) => page.screenshot({ path: `${shots}/s5_${MODE}_${String(++n).padStart(2, '0')}_${nm}.png` });
let F = page; const ev = (f, a) => F.evaluate(f, a); const fails = [];
const expect = (ok, what) => { log(ok ? 'OK  ' : 'FAIL', what); if (!ok) fails.push(what); };
const frame = async () => { for (let i = 0; i < 80; i++) { const x = page.frames().find((q) => q.url().startsWith('about:srcdoc')); if (x) return x; await page.waitForTimeout(100); } return page.frames()[1]; };
const loadApp = async (first) => {
  if (MODE === 'site') { if (first) await page.goto('http://localhost:8771/index.html'); else await page.reload(); F = page; }
  else if (MODE === 'file') { if (first) await page.goto('file://' + DIST); else await page.reload(); F = page; }
  else { if (first) await page.goto('http://localhost:8771/data/labels.json');
    await page.setContent('<style>body{margin:0}</style><iframe id=f sandbox="allow-scripts allow-same-origin" style="width:' + W + 'px;height:' + H + 'px;border:0"></iframe>');
    await page.evaluate((h) => { document.getElementById('f').srcdoc = h; }, fs.readFileSync(DIST, 'utf8')); await page.waitForTimeout(1500); F = await frame(); }
};
await loadApp(true);
await F.waitForFunction(() => window.PG && window.PG.JSR.ready, null, { timeout: 300000 });
// fixture model -> IndexedDB (same origin as the app)
const MKEY = 'indexeddb://panelguard-cnn-testfixture';
await ev(async ([src, F2, key]) => {
  const load = new Function('return ' + src)(), m = tf.sequential(); m.add(tf.layers.inputLayer({ inputShape: [64, 64, 1] }));
  for (const f of [16, 32, 64, 128]) { m.add(tf.layers.conv2d({ filters: f, kernelSize: 3, padding: 'same', useBias: false })); m.add(tf.layers.batchNormalization()); m.add(tf.layers.activation({ activation: 'relu' })); m.add(tf.layers.maxPooling2d({ poolSize: 2 })); }
  m.add(tf.layers.globalAveragePooling2d({})); m.add(tf.layers.dropout({ rate: 0.3 })); m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  load(tf, m, F2); await m.save(key); m.dispose();
}, [LOAD_SRC, FIX, MKEY]);
const extra = { epochsMode: 'full' }, st = JSON.parse(seedState(SUBS, extra));
const M3 = { '3a': { tilesDone: 1 }, '3b': { done: 1 }, '3c': { tapBig: 1 }, '3d': { sortOk: 1 }, '3e': { modelKey: MKEY, savedAt: 'TEST FIXTURE (Keras-trained)', lastRes: { epochs: 30, done: 30, hist: [{ epoch: FIX.best_epoch, loss: null, valLoss: 0.5, valAuc: FIX.best_auc, sec: 0 }], best: { epoch: FIX.best_epoch, valAuc: FIX.best_auc }, restored: FIX.best_epoch, sec: 0, backend: 'webgl', gpu: null, nTrain: 1574, nDef: 492, cw: [0.7, 1.6], quick: 'full' } }, '3f': { hit: 1 }, '3g': { twoDone: 1, capOk: 1 } };
const M4 = { '4a': { paint: { 496: [1], 1088: [1], 379: [1] }, done: true }, '4b': { patchOk: 1, bestDrop: 0.5 }, '4c': { peek: 3 }, '4d': {}, '4e': { rows: ['kind', 'prob'] }, '4f': { done: 1, box: {}, actions: { more: [], label: [], sharp: [], wrong: [] } } };
Object.assign(M3, M4);
for (const id of ['3a', '3b', '3c', '3d', '3e', '3f', '3g', '4a', '4b', '4c', '4d', '4e', '4f']) { const s = SUBS[id]; st.subs[id] = { mech: M3[id], pred: s.predict ? { locked: true, val: s.predict.format === 'draw' ? new Array(30).fill(0.5) : 1, good: 1 } : {} }; if (s.kind === 'code') { st.subs[id].codePass = true; st.subs[id].code = fill(s.code, s.ref); } }
st.cur = '5a';
await ev(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(st)]);
await loadApp(false);
await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['4e'] && window.PG.RES['4d'], null, { timeout: 600000 });
log('ready: Steps 0-4 rebuilt, fixture model restored after', ((Date.now() - t0) / 1000).toFixed(0), 's | 3e:', await ev(() => window.PG.RES['3e'].restoredFrom));
const open = async (id) => { await ev((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(700); };
const mech = (id) => ev((i) => (window.PG.S.subs[i] || {}).mech || {}, id);
const pend = (id) => ev((i) => window.PG.pendingOf(i), id);
const setCode = async (c) => { await F.locator('.edw textarea').first().fill(c); await F.locator('.ed').first().evaluate((e) => { e.scrollTop = 0; e.scrollLeft = 0; }); };
const run = async (id, timeout = 900000) => { const t = Date.now(); await F.locator('#runbtn').click(); await F.waitForFunction((i) => window.PG.VERD[i] != null && window.PG.running() == null, id, { timeout }); const v = await ev((i) => window.PG.VERD[i], id); log(id, 'run', ((Date.now() - t) / 1000).toFixed(1) + 's', v.pass ? 'PASS: ' + v.msg : 'FAIL: ' + v.msg); return v; };
const codeStep = async (id, nWrong = 1) => { for (const w of FILLS[id].wrong.slice(0, nWrong)) { await setCode(fill(SUBS[id].code, w)); const v = await run(id); expect(!v.pass, id + ' wrong answer ' + JSON.stringify(w) + ' fails'); } await setCode(fill(SUBS[id].code, SUBS[id].ref)); const v = await run(id); expect(v.pass, id + ' right answer passes'); };
const drag = async (x0, y0, x1, y1, steps = 10) => { await page.mouse.move(x0, y0); await page.mouse.down(); await page.mouse.move(x1, y1, { steps }); await page.mouse.up(); };

const clickNode = async (n) => { await F.locator(`#wire5 [data-node="${n}"]`).click(); await page.waitForTimeout(120); };
// 5a wire the flow
await open('5a'); expect(await ev(() => window.PG.S.cur === '5a'), '5a opens (Step 5 unlocked)');
await clickNode('__start__'); await clickNode('score');
expect(/check_photo/.test(await F.locator('#wiremsg').innerText()) && ((await mech('5a')).wires || []).length === 0, '5a wrong arrow START → score refused with a reason: ' + (await F.locator('#wiremsg').innerText()));
await shot('5a_refused');
{ const a = await F.locator('#wire5 [data-node="__start__"]').boundingBox(), b = await F.locator('#wire5 [data-node="check_photo"]').boundingBox(); await drag(a.x + a.width / 2, a.y + a.height / 2, b.x + b.width / 2, b.y + b.height / 2, 12); }
expect(((await mech('5a')).wires || []).includes('__start__>check_photo'), '5a arrow drawn by dragging');
for (const [x, y] of [['check_photo', 'score'], ['score', 'route'], ['route', 'human_check'], ['route', 'record'], ['human_check', 'record'], ['record', '__end__']]) { await clickNode(x); await clickNode(y); }
expect(await pend('5a') === null, '5a all 7 arrows wired, done');
await shot('5a');
// 5b traveller card
await open('5b');
expect(/First do the hands-on part/.test(await ev(() => document.getElementById('runbtn').dataset.why)), '5b Run waits for the card');
await F.locator('[data-chip5="label"]').click(); await page.waitForTimeout(150);
expect(/answer we are looking for/.test(await F.locator('#prebox').innerText()), '5b useless chip (expert label) refused with a reason');
for (const k of ['id', 'kind', 'photo', 'p', 'lane', 'log']) { await F.locator(`[data-chip5="${k}"]`).click(); await page.waitForTimeout(80); }
expect(!!(await mech('5b')).cardOk, '5b card ready');
await shot('5b_card');
await codeStep('5b', 3); await shot('5b');
// 5c first two stations + token
await open('5c'); await codeStep('5c', 2);
for (let k = 0; k < 6 && !(await mech('5c')).tokenEnd; k++) { await F.locator('#tok5next').click(); await page.waitForTimeout(550); if (k === 1) { await F.locator('#out').evaluate((e) => { e.scrollTop = 0; }); await shot('5c_token'); } }
expect(await pend('5c') === null, '5c token reached END, passed');
await F.locator('#out').evaluate((e) => { e.scrollTop = 0; }); await shot('5c');
// 5d predict lanes, then the fork
await open('5d'); await F.locator('[data-cell5d]').first().waitFor({ timeout: 120000 });
const cells5d = await ev(() => window.PG.S.subs['5d'].pred.cells);
log('5d cells to predict:', JSON.stringify(cells5d.map((c) => [c.id, +c.p.toFixed(3), c.lane, c.y])));
for (const c of cells5d) { await F.locator(`[data-cell5d="${c.id}"]`).click(); await F.locator(`#predbox [data-drop="${c.lane}"]`).click(); await page.waitForTimeout(100); }
await shot('5d_predict');
await F.locator('#lanecheck').click(); await page.waitForTimeout(300);
expect(/All 4 right/.test(await F.locator('#predbox .verdict').innerText()) && await ev(() => window.PG.S.subs['5d'].pred.locked), '5d lanes prediction checked once and locked');
await codeStep('5d', 3); await page.waitForTimeout(3500); await F.locator('#out').evaluate((e) => { e.scrollTop = 0; }); await shot('5d');
// 5e loop: first no cap -> recursion limit, then the cap
await open('5e');
await setCode(fill(SUBS['5e'].code, ['Infinity', "'human_check'"])); { const v = await run('5e'); expect(!v.pass && /recursion limit/.test(v.msg), '5e no cap: real LangGraph recursion-limit error in plain words'); }
expect(await ev(() => /GraphRecursionError/.test(document.getElementById('vizbox').innerText) && !!document.querySelector('#vizbox details')), '5e raw message collapsed under the plain words');
await shot('5e_loop');
await codeStep('5e', 0); expect(await pend('5e') === null, '5e passed after seeing the loop');
await shot('5e');
// 5f pause and wait: be the checker
await open('5f'); await codeStep('5f', 2);
await F.locator('[data-dec]').first().waitFor({ timeout: 60000 }); await shot('5f_paused');
for (let k = 0; k < 5; k++) { const b = F.locator('[data-dec]').nth(k % 2); await b.click(); await page.waitForTimeout(1200); }
await F.waitForFunction(() => window.PG.pendingOf('5f') === null, null, { timeout: 60000 }).catch(() => {});
expect(await pend('5f') === null && /YOUR ANSWERS vs THE EXPERT LABELS/.test(await F.locator('#out').innerText()), '5f all 5 paused flows decided and resumed; answers vs labels shown');
expect(/No paused flows left/.test(await F.locator('#out').innerText()), '5f paused-thread list emptied');
await shot('5f');
// 5g run a shift
await open('5g'); await codeStep('5g', 1);
const r5g = await ev(() => { const r = window.PG.RES['5g']; const f = (R) => ({ lanes: R.lanes, per1000: Object.fromEntries(Object.entries(R.per1000).map(([k, v]) => [k, Math.round(v)])), defPassed: R.all.defPassed, def: R.all.def, goodStopped: R.all.goodStopped, personWrong: R.all.personWrong, reshoots: R.reshoots, poly: [R.poly.defPassed, R.poly.def, R.poly.person, R.poly.n] }); return { lowPoly: r.lowPoly, low: r.low, high: r.high, s1: f(r.s1), s2: f(r.s2), s3: f(r.s3), esc: r.s1.escapes }; });
log('5g LIVE shift:', JSON.stringify(r5g));
for (const id of r5g.esc) { await F.locator(`#logbook5 [data-row="${id}"]`).click(); await page.waitForTimeout(80); }
expect(await pend('5g') === null, '5g all ' + r5g.esc.length + ' defects that passed found in the logbook');
expect(/STEP 5 DONE/.test(await F.locator('#out').innerText()), '5g end card shown');
await F.locator('#out').evaluate((e) => { e.scrollTop = 0; }); await shot('5g');
await F.locator('#out').evaluate((e) => { e.scrollTop = e.scrollHeight; }); await shot('5g_end');
// scores + JS counts from THIS browser run, for the Python twin
if (MODE === 'site') {
  const inp = await ev(() => { const NS = window.PG.JSR.k.NS, r = window.PG.RES['5g'], sl = (R) => ({ lanes: R.lanes, reshoots: R.reshoots, all: R.all, mono: R.mono, poly: R.poly });
    return { source: 'tools/tests/s5_e2e.mjs (headless Chrome, TF.js WebGL, test fixture model)', langgraph_js: LangGraph.VERSION, cell_val: window.PG.JSR.k.pg().cell_val, y_val: window.PG.JSR.k.pg().y_val, kind_val: window.PG.JSR.k.pg().kind_val, p_blend: Array.from(NS.pBlend), low: NS.low, high: NS.high, low_poly: NS.lowPoly, js: { shift1: sl(r.s1), shift2: sl(r.s2), shift3: sl(r.s3) } }; });
  fs.writeFileSync(path.resolve(here, '../research/step5_browser_inputs.json'), JSON.stringify(inp));
}
const np = await ev(() => window.PG.ORDER.filter((i) => i < '6' && !window.PG.passed(i))); expect(np.length === 0, 'Steps 0-5 all passed (' + JSON.stringify(np) + ')');
expect(await ev(() => [...document.querySelectorAll('.ns.lock .nt')].map((e) => e.textContent).filter((t) => /CrewAI|operator console|Line trial/.test(t)).length === 3), 'Steps 6-8 still locked');
// reload: everything comes back by itself (real replay of every passed cell)
if (process.env.RELOAD !== '0') {
  const t1 = Date.now(); await loadApp(false);
  await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['5g'], null, { timeout: 900000 });
  log('reload: rebuilt up to 5g in', ((Date.now() - t1) / 1000).toFixed(0), 's');
  expect(await ev(() => window.PG.ORDER.filter((i) => i < '6' && !window.PG.passed(i)).length === 0), 'after reload: Steps 0-5 still passed');
  await open('5f'); await page.waitForTimeout(3000);
  expect(/No paused flows left/.test(await F.locator('#out').innerText()), 'after reload: 5f answers re-sent with Command resume, no paused flows left');
}
// review mode: open 5a-5g, Run up to here on 5g
if (process.env.REVIEW !== '0') {
  await F.locator('#revbtn').click(); await page.waitForTimeout(400);
  for (const id of ['5g', '5a', '5c', '5f', '5b', '5e', '5d']) { await open(id); expect(await ev((i) => window.PG.S.cur === i, id), 'review: opens ' + id); }
  await shot('5d_review'); await open('5g');
  const t2 = Date.now(); await F.locator('#runupto').click(); await F.waitForFunction(() => !window.PG.runningUpTo(), null, { timeout: 900000 }); await page.waitForTimeout(500);
  expect(await ev(() => window.PG.VERD['5g'] && window.PG.VERD['5g'].pass && /SHIFT REPORT/.test(document.getElementById('vizbox').innerText)), 'review: Run up to here on 5g gives a real shift report (' + await ev(() => (document.getElementById('rvstat') || {}).textContent) + ', ' + ((Date.now() - t2) / 1000).toFixed(0) + 's)');
  await shot('5g_review');
}
expect(errors.length === 0, 'zero console errors' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 5)) : ''));
log('TOTAL', ((Date.now() - t0) / 1000).toFixed(0) + 's | FAILS:', fails.length);
await browser.close(); process.exit(fails.length ? 1 : 0);
