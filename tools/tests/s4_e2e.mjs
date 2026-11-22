// Step 4 end to end in real headless Chrome. TARGET=site|file|srcdoc.
// Start state: Steps 0-3 passed (seed.mjs); the Step 3 model is the Keras-trained TEST FIXTURE (fixture.mjs), saved into this
// browser's IndexedDB first so the app restores it exactly like a student's saved model. Everything else is computed live.
import { chromium } from 'playwright'; import { mirrorCDN } from './cdn.mjs'; import { spawn } from 'child_process';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
import { FILLS, fill } from './fills.mjs'; import { loadSteps, seedState, KEY } from './seed.mjs'; import { FIX, LOAD_SRC } from './fixture.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site'); const shots = path.resolve(here, '../shots');
const { SUBS } = loadSteps();
const W = 1366, H = 768, MODE = process.env.TARGET || 'site', DIST = path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v0.5.html');
let srv = null; if (MODE !== 'file') { srv = spawn('node', [path.resolve(here, '../serve.mjs'), site, '8769'], { stdio: 'pipe' }); await new Promise((r) => srv.stdout.once('data', r)); }
process.on('exit', () => { try { srv && srv.kill(); } catch (e) {} });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H } }); await mirrorCDN(ctx); const page = await ctx.newPage();
const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const t0 = Date.now(), log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
let n = 0; const shot = async (nm) => page.screenshot({ path: `${shots}/s4_${MODE}_${String(++n).padStart(2, '0')}_${nm}.png` });
let F = page; const ev = (f, a) => F.evaluate(f, a); const fails = [];
const expect = (ok, what) => { log(ok ? 'OK  ' : 'FAIL', what); if (!ok) fails.push(what); };
const frame = async () => { for (let i = 0; i < 80; i++) { const x = page.frames().find((q) => q.url().startsWith('about:srcdoc')); if (x) return x; await page.waitForTimeout(100); } return page.frames()[1]; };
const loadApp = async (first) => {
  if (MODE === 'site') { if (first) await page.goto('http://localhost:8769/index.html'); else await page.reload(); F = page; }
  else if (MODE === 'file') { if (first) await page.goto('file://' + DIST); else await page.reload(); F = page; }
  else { if (first) await page.goto('http://localhost:8769/data/labels.json');
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
for (const id of ['3a', '3b', '3c', '3d', '3e', '3f', '3g']) { const s = SUBS[id]; st.subs[id] = { mech: M3[id], pred: s.predict ? { locked: true, val: s.predict.format === 'draw' ? new Array(30).fill(0.5) : 1, good: 1 } : {} }; if (s.kind === 'code') { st.subs[id].codePass = true; st.subs[id].code = fill(s.code, s.ref); } }
st.cur = '4a';
await ev(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(st)]);
await loadApp(false);
await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['3g'], null, { timeout: 600000 });
log('ready: Steps 0-3 rebuilt, fixture model restored after', ((Date.now() - t0) / 1000).toFixed(0), 's | 3e:', await ev(() => window.PG.RES['3e'].restoredFrom));
const open = async (id) => { await ev((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(700); };
const mech = (id) => ev((i) => (window.PG.S.subs[i] || {}).mech || {}, id);
const pend = (id) => ev((i) => window.PG.pendingOf(i), id);
const setCode = async (c) => { await F.locator('.edw textarea').first().fill(c); await F.locator('.ed').first().evaluate((e) => { e.scrollTop = 0; e.scrollLeft = 0; }); };
const run = async (id, timeout = 900000) => { const t = Date.now(); await F.locator('#runbtn').click(); await F.waitForFunction((i) => window.PG.VERD[i] != null && window.PG.running() == null, id, { timeout }); const v = await ev((i) => window.PG.VERD[i], id); log(id, 'run', ((Date.now() - t) / 1000).toFixed(1) + 's', v.pass ? 'PASS: ' + v.msg : 'FAIL: ' + v.msg); return v; };
const codeStep = async (id, nWrong = 1) => { for (const w of FILLS[id].wrong.slice(0, nWrong)) { await setCode(fill(SUBS[id].code, w)); const v = await run(id); expect(!v.pass, id + ' wrong answer ' + JSON.stringify(w) + ' fails'); } await setCode(fill(SUBS[id].code, SUBS[id].ref)); const v = await run(id); expect(v.pass, id + ' right answer passes'); };
const drag = async (x0, y0, x1, y1, steps = 10) => { await page.mouse.move(x0, y0); await page.mouse.down(); await page.mouse.move(x1, y1, { steps }); await page.mouse.up(); };

// 4a paint
await open('4a'); expect(await ev(() => window.PG.S.cur === '4a'), '4a opens (Step 4 unlocked)');
for (const id of [496, 1088, 379]) { const c = F.locator(`canvas[data-paint="${id}"]`); const b = await c.boundingBox(); await drag(b.x + b.width * 0.3, b.y + b.height * 0.3, b.x + b.width * 0.7, b.y + b.height * 0.7, 14); await drag(b.x + b.width * 0.7, b.y + b.height * 0.3, b.x + b.width * 0.3, b.y + b.height * 0.7, 14); }
expect(await pend('4a') === null, '4a painting done: ' + JSON.stringify(Object.fromEntries(Object.entries((await mech('4a')).paint || {}).map(([k, v]) => [k, v.length]))));
await shot('4a');
// 4b cover-up: hand patch, then code
await open('4b');
expect(/First do the hands-on part/.test(await ev(() => document.getElementById('runbtn').dataset.why)), '4b Run waits for the hand patch');
await F.locator('#patch4b').waitFor({ timeout: 120000 });
{ const st2 = F.locator('#patch4b').locator('xpath=..'); await st2.scrollIntoViewIfNeeded(); const b = await st2.boundingBox();
  for (let gy = 0.1; gy < 0.95 && !(await mech('4b')).patchOk; gy += 0.1) { await drag(b.x + b.width * 0.05, b.y + b.height * gy, b.x + b.width * 0.95, b.y + b.height * gy, 12); await page.waitForTimeout(400); } }
expect(!!(await mech('4b')).patchOk, '4b hand patch found a spot that drops the score (best drop ' + ((await mech('4b')).bestDrop || 0).toFixed(3) + ')');
await shot('4b_hand');
await codeStep('4b'); await shot('4b');
// 4c Grad-CAM + peek
await open('4c'); await codeStep('4c');
for (let k = 0; k < 3; k++) { const c = F.locator('[data-peek]').nth(k * 2); await c.scrollIntoViewIfNeeded(); const b = await c.boundingBox(); await page.mouse.move(b.x + 30, b.y + 30); await page.mouse.down(); await page.waitForTimeout(150); await page.mouse.up(); }
expect(await pend('4c') === null, '4c peeks done, passed');
const r4c = await ev(() => window.PG.RES['4c'].cells.map((c) => [c.tag, c.id, +c.score.toFixed(3)]));
log('4c cells:', JSON.stringify(r4c));
await F.locator('#out').evaluate((e) => { e.scrollTop = 0; }); await shot('4c');
// 4d tokens + deletion test
await open('4d');
for (let k = 0; k < 7; k++) await F.locator('#tokp0').click(); for (let k = 0; k < 3; k++) await F.locator('#tokp1').click();
await F.locator('#tokcheck').click(); await page.waitForTimeout(300);
expect(/Right/.test(await F.locator('#predbox .verdict').innerText()), '4d tokens prediction checked once and locked');
await shot('4d_predict');
await codeStep('4d');
const r4d = await ev(() => { const r = window.PG.RES['4d']; return { n: r.n, dropHot: +r.dropHot.toFixed(3), dropRand: +r.dropRand.toFixed(3), wins: r.wins, s0: +r.s0.toFixed(3) }; });
log('4d LIVE deletion test:', JSON.stringify(r4d));
await shot('4d');
// 4e chips + slices
await open('4e');
await F.locator('[data-chip="id"]').click(); await F.locator('[data-drop="table"]').click(); await page.waitForTimeout(150);
expect(/525 groups/.test(await F.locator('#prebox .verdict').last().innerText()), '4e useless chip refused with a reason');
{ const t = await F.locator('[data-chip="kind"]').boundingBox(), s = await F.locator('[data-drop="table"]').boundingBox(); await drag(t.x + 20, t.y + 10, s.x + 60, s.y + 40, 10); }
await F.locator('[data-chip="prob"]').click(); await F.locator('[data-drop="table"]').click(); await page.waitForTimeout(150);
expect(((await mech('4e')).rows || []).length === 2, '4e both useful chips in the table');
await shot('4e_chips');
await codeStep('4e', 2);
const r4e = await ev(() => { const R = window.PG.RES['4e'].R; const f = (g) => `${g.defPass}/${g.def} passed, ${g.okStop}/${g.ok} good stopped, ${g.person}/${g.n} to person`; return { mono: f(R.mono), poly: f(R.poly), sure: f(R.sure), unsure: f(R.unsure) }; });
log('4e LIVE slices:', JSON.stringify(r4e));
await F.locator('#out').evaluate((e) => { e.scrollTop = 0; }); await shot('4e');
// 4f to-do sort
await open('4f'); await F.locator('[data-todo]').first().waitFor({ timeout: 300000 });
const nT = await F.locator('[data-todo]').count(); const boxes = ['more', 'label', 'sharp', 'wrong'];
for (let k = 0; k < nT; k++) { await F.locator('[data-todo]').first().click(); await F.locator(`[data-drop="${boxes[k % 4]}"]`).click(); await page.waitForTimeout(80); }
await F.locator('#todoDone').click(); await page.waitForTimeout(400);
expect(await pend('4f') === null && !!(await mech('4f')).actions, '4f all ' + nT + ' mistakes sorted, action list saved: ' + JSON.stringify(Object.fromEntries(Object.entries((await mech('4f')).actions || {}).map(([k, v]) => [k, v.length]))));
expect(/STEP 4 DONE/.test(await F.locator('#out').innerText()), '4f end card shown');
await F.locator('#out').evaluate((e) => { e.scrollTop = e.scrollHeight; }); await shot('4f_end');
await F.locator('#stage').scrollIntoViewIfNeeded(); await shot('4f_sorted');
const np = await ev(() => window.PG.ORDER.filter((i) => i < '5' && !window.PG.passed(i))); expect(np.length === 0, 'Steps 0-4 all passed (' + JSON.stringify(np) + ')');
expect(await ev(() => /Step 5|5/.test(document.querySelector('.ns.lock .num') ? '5' : '') ), 'Steps 5-8 still locked');
// review mode: open 4a-4f, Run up to here on 4c, banner X
if (process.env.REVIEW !== '0') {
  await F.locator('#revbtn').click(); await page.waitForTimeout(400);
  for (const id of ['4f', '4a', '4e', '4b', '4d', '4c']) { await open(id); expect(await ev((i) => window.PG.S.cur === i, id), 'review: opens ' + id); }
  await F.locator('#runupto').click(); await F.waitForFunction(() => !window.PG.runningUpTo(), null, { timeout: 900000 }); await page.waitForTimeout(400);
  expect(await ev(() => window.PG.VERD['4c'] && window.PG.VERD['4c'].pass && /NETWORK vs/.test(document.getElementById('vizbox').innerText)), 'review: Run up to here on 4c gives real maps (' + await ev(() => (document.getElementById('rvstat') || {}).textContent) + ')');
  await shot('4c_review');
  await F.locator('#revx').click(); await page.waitForTimeout(200);
  expect(await ev(() => getComputedStyle(document.getElementById('revbar')).display === 'none' && window.PG.review() && /ON/.test(document.getElementById('revbtn').textContent)), 'review banner closed with X; review still ON');
  await shot('review_banner_closed');
}
expect(errors.length === 0, 'zero console errors' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 5)) : ''));
log('TOTAL', ((Date.now() - t0) / 1000).toFixed(0) + 's | FAILS:', fails.length);
await browser.close(); process.exit(fails.length ? 1 : 0);
