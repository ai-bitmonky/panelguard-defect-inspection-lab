// Step 3 end to end in real headless Chrome: every hands-on part, wrong + right code, real training, reload/restore.
// Env: TARGET=site|file  (file = dist single file via file://)   EPOCHS=1 (test setting, shown in the app)   SEED=1 (Steps 0-2 from seed.mjs; Python replays them for real)
//      STOPTEST=1 (press Stop during training first)   RELOAD=1 (reload: model must come back from IndexedDB)   W/H viewport
import { chromium } from 'playwright'; import { mirrorCDN } from './cdn.mjs'; import { spawn } from 'child_process';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
import { FILLS, fill } from './fills.mjs'; import { loadSteps, seedState, KEY } from './seed.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site');
const shots = path.resolve(here, '../shots'); fs.mkdirSync(shots, { recursive: true });
const { SUBS } = loadSteps();
const W = +(process.env.W || 1366), H = +(process.env.H || 768), EPOCHS = +(process.env.EPOCHS || 1), MODE = process.env.TARGET || 'site';
let srv = null, URL0;
if (MODE === 'site') { srv = spawn('node', [path.resolve(here, '../serve.mjs'), site, '8767'], { stdio: 'pipe' }); await new Promise((r) => srv.stdout.once('data', r)); URL0 = 'http://localhost:8767/index.html'; }
else if (MODE === 'srcdoc') { srv = spawn('node', [path.resolve(here, '../serve.mjs'), site, '8767'], { stdio: 'pipe' }); await new Promise((r) => srv.stdout.once('data', r)); URL0 = 'http://localhost:8767/index.html'; }
else URL0 = 'file://' + path.resolve(here, '../../dist/' + fs.readdirSync(path.resolve(here, '../../dist')).filter((f) => /v0\.3\.html$/.test(f))[0]);
process.on('exit', () => { try { srv && srv.kill(); } catch (e) {} });
const URL1 = URL0 + '?pgEpochs=' + EPOCHS;
// PROFILE=/dir keeps browser storage between runs (dev: FROM=3f continues from a model saved in an earlier run).
const FROM = process.env.FROM || '3a', at = (id) => id >= FROM;
const ctxB = process.env.PROFILE ? await chromium.launchPersistentContext(process.env.PROFILE, { executablePath: '/usr/bin/google-chrome', headless: true, viewport: { width: W, height: H } })
  : await (await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true })).newContext({ viewport: { width: W, height: H } });
const browser = { close: () => ctxB.close() };
await mirrorCDN(ctxB);
const page = ctxB.pages()[0] || await ctxB.newPage();
const errors = [], external = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
page.on('request', (r) => { const u = r.url(); if (!/^(http:\/\/localhost|file:|blob:|data:)/.test(u)) external.push(u.split('?')[0]); });
const t0 = Date.now(), log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const tag = MODE + '_' + W; let n = 0; const shot = async (name) => { await page.screenshot({ path: `${shots}/s3_${tag}_${String(++n).padStart(2, '0')}_${name}.png` }); };
const ev = (f, a) => F.evaluate(f, a);
const mech = (id) => ev((i) => (window.PG.S.subs[i] || {}).mech || {}, id);
const open = async (id) => { await ev((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(500); };
const pend = (id) => ev((i) => window.PG.pendingOf(i), id);
const expectPass = async (id) => { const p = await pend(id); log(id, p === null ? 'PASSED' : 'NOT PASSED -> ' + p); if (p !== null) throw new Error(id + ' not passed: ' + p); };
const setCode = async (code) => { await F.locator('.edw textarea').first().fill(code); await F.locator('.ed').first().evaluate((e) => { e.scrollTop = 0; e.scrollLeft = 0; }); };
const run = async (id, timeout = 120000) => {
  const t = Date.now(); await F.locator('#runbtn').click();
  await F.waitForFunction((i) => window.PG.VERD[i] != null && window.PG.running() == null, id, { timeout });
  const v = await ev((i) => window.PG.VERD[i], id); log(id, 'run', ((Date.now() - t) / 1000).toFixed(1) + 's', v.pass ? 'PASS: ' + v.msg : 'FAIL: ' + v.msg); return v;
};
const codeStep = async (id, { wrongs = 1, timeout } = {}) => {
  for (const w of FILLS[id].wrong.slice(0, wrongs)) { await setCode(fill(SUBS[id].code, w)); const v = await run(id); if (v.pass) throw new Error(id + ' wrong answer passed'); }
  await setCode(fill(SUBS[id].code, FILLS[id].right)); const v = await run(id, timeout); if (!v.pass) throw new Error(id + ' right answer failed: ' + v.msg);
};
const tap = async (loc) => { await loc.click(); await page.waitForTimeout(80); };

// srcdoc mode: the single file inside <iframe sandbox="allow-scripts allow-same-origin" srcdoc=...> on a served parent page.
// A srcdoc frame has no address, so the test setting is passed as window.PG_TEST_EPOCHS (one tiny script added in front).
const DIST = path.resolve(here, '../../dist/' + fs.readdirSync(path.resolve(here, '../../dist')).filter((f) => /v0\.3\.html$/.test(f))[0]);
let F = page;
const loadApp = async () => {
  if (MODE !== 'srcdoc') { await page.reload(); F = page; return; }
  const html = fs.readFileSync(DIST, 'utf8').replace('<head>', '<head><script>window.PG_TEST_EPOCHS = ' + EPOCHS + ';</script>');
  await page.setContent('<style>body{margin:0}</style><iframe id=f sandbox="allow-scripts allow-same-origin" style="width:' + W + 'px;height:' + H + 'px;border:0"></iframe>');
  await page.evaluate((h) => { document.getElementById('f').srcdoc = h; }, html);
  await page.waitForTimeout(1500); F = page.frames().find((f) => f.url() === 'about:srcdoc') || page.frames()[1];
};
log('target', MODE === 'srcdoc' ? 'srcdoc frame of ' + DIST : URL1);
await page.goto(URL1);
if (process.env.SEED !== '0' && FROM === '3a') await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, seedState(SUBS)]);
await loadApp();
await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.RES['2e'] && window.PG.JSR.ready, null, { timeout: 600000 });
log('ready (Python replayed Steps 1-2) after', ((Date.now() - t0) / 1000).toFixed(0), 's | backend', await ev(() => window.PG.JSR.backend + ' | ' + window.PG.JSR.gpu.name));

// ---------- 3a ----------
if (at('3a')) {
await open('3a');
await shot('3a_open'); log('3a run button before tiles:', await ev(() => document.getElementById('runbtn').dataset.why));
await tap(F.locator('[data-tile="chan"]')); await tap(F.locator('[data-drop="0"]'));            // wrong: channel first
log('3a wrong tile ->', (await F.locator('#prebox .verdict').innerText()).slice(0, 90));
{ const t = await F.locator('[data-tile="photos"]').boundingBox(), s = await F.locator('[data-drop="0"]').boundingBox();   // a real drag
  await page.mouse.move(t.x + 20, t.y + 15); await page.mouse.down(); await page.mouse.move(t.x + 60, t.y - 20, { steps: 5 }); await page.mouse.move(s.x + 30, s.y + 20, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(150); }
await tap(F.locator('[data-tile="rows"]')); await tap(F.locator('[data-drop="1"]'));
await tap(F.locator('[data-tile="cols"]')); await tap(F.locator('[data-drop="2"]'));
await tap(F.locator('[data-tile="chan"]')); await tap(F.locator('[data-drop="3"]'));
log('3a tiles done:', (await mech('3a')).tilesDone);
await F.locator('.ex summary').first().click(); await page.waitForTimeout(100);
await shot('3a_tiles');
await codeStep('3a', { wrongs: 2 }); await shot('3a'); await expectPass('3a');

}
// ---------- 3b ----------
if (at('3b')) {
await open('3b'); await page.waitForTimeout(800);
const kbtn = (j) => F.locator('#stage button[aria-label^="filter weight ' + (j + 1) + ':"]');
const setK = async (target) => { const cur = (await mech('3b')).k || [0, 0, 0, 0, 1, 0, 0, 0, 0], ord = [0, 1, -1];
  for (let j = 0; j < 9; j++) { const t = (ord.indexOf(target[j]) - ord.indexOf(cur[j]) + 3) % 3; for (let q = 0; q < t; q++) await tap(kbtn(j)); } };
await setK([1, 1, 1, 0, 0, 0, -1, -1, -1]);          // top minus bottom: lights the flat busbars (must NOT pass)
log('3b top-minus-bottom filter ->', (await mech('3b')).done ? 'solved (BAD)' : 'not solved (right: busbars light up)');
await page.waitForTimeout(900); await shot('3b_wrong');
await setK([1, 0, -1, 1, 0, -1, 1, 0, -1]);          // left minus right
log('3b filter now', JSON.stringify((await mech('3b')).k), '->', (await mech('3b')).done ? 'solved' : 'not solved');
await page.waitForTimeout(900); await shot('3b'); await expectPass('3b');

}
// ---------- 3c ----------
if (at('3c')) {
await open('3c'); await codeStep('3c', { wrongs: 3 });
await F.locator('#vizbox [data-b="0"]').click(); await page.waitForTimeout(100);
log('3c tap block 1 ->', (await F.locator('#vizbox .verdict').first().innerText()).slice(0, 60));
await F.locator('#vizbox [data-b="3"]').click(); await page.waitForTimeout(150);
await shot('3c'); await expectPass('3c');

}
// ---------- 3d ----------
if (at('3d')) {
await open('3d');
const put = async (k, bin) => { await tap(F.locator(`#prebox [data-aug="${k}"]`)); await tap(F.locator(`#prebox [data-drop="${bin}"]`)); };
await put('lr', 'real'); await put('ud', 'real'); await put('rot', 'real'); await put('bright', 'real');
{ const t = await F.locator('#prebox [data-aug="blur"]').boundingBox(), s = await F.locator('#prebox [data-drop="fake"]').boundingBox();
  await page.mouse.move(t.x + 40, t.y + 40); await page.mouse.down(); await page.mouse.move(t.x + 80, t.y + 90, { steps: 5 }); await page.mouse.move(s.x + 60, s.y + 60, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(150); }
await F.locator('#prebox button', { hasText: 'Check my sort' }).click(); await page.waitForTimeout(150);
log('3d first sort ->', (await F.locator('#prebox .verdict').last().innerText()).slice(0, 100));
await put('rot', 'fake'); await F.locator('#prebox button', { hasText: 'Check my sort' }).click(); await page.waitForTimeout(150);
log('3d sortOk:', (await mech('3d')).sortOk);
await shot('3d_sort');
await codeStep('3d', { wrongs: 2 });
await F.locator('#vizbox button', { hasText: 'Call flipSome again' }).click(); await page.waitForTimeout(800);
await shot('3d'); await expectPass('3d');

}
// ---------- 3e ----------
let r3e = null;
if (at('3e')) {
await open('3e');
{ const s = F.locator('#predbox svg'); await s.scrollIntoViewIfNeeded(); const b = await s.boundingBox(); const pts = [];
  for (let i = 0; i <= 30; i++) { const x = b.x + b.width * (0.1 + 0.88 * i / 30); const v = i < 15 ? 0.2 + 0.6 * i / 15 : 0.8 - 0.3 * (i - 15) / 15; pts.push([x, b.y + b.height * (0.06 + 0.78 * (1 - v))]); }
  await page.mouse.move(...pts[0]); await page.mouse.down(); for (const p of pts) await page.mouse.move(p[0], p[1], { steps: 2 }); await page.mouse.up(); }
await F.locator('#predbox button', { hasText: 'Check' }).first().click(); await page.waitForTimeout(300);
log('3e prediction ->', (await F.locator('#predbox .verdict').innerText()).slice(0, 70));
await shot('3e_predict');
for (const w of FILLS['3e'].wrong) { await setCode(fill(SUBS['3e'].code, w)); const v = await run('3e', 60000); if (v.pass) throw new Error('3e wrong passed'); }
await setCode(fill(SUBS['3e'].code, FILLS['3e'].right));
if (process.env.STOPTEST !== '0') {
  await F.locator('#runbtn').click();
  await F.waitForFunction(() => { const s = window.PG.JSR.T.state; return s && s.batch >= 2; }, null, { timeout: 300000 });
  const ts = Date.now(); await F.locator('.btn.stop').click(); log('3e Stop pressed at batch', await ev(() => window.PG.JSR.T.state.batch));
  await F.waitForFunction(() => window.PG.running() == null, null, { timeout: 300000 });
  log('3e after Stop (' + ((Date.now() - ts) / 1000).toFixed(1) + 's) ->', JSON.stringify(await ev(() => window.PG.VERD['3e'])), '| tensors:', await ev(() => tf.memory().numTensors));
  await shot('3e_stopped');
}
const tt = Date.now();
await F.locator('#runbtn').click();
await F.waitForFunction(() => { const s = window.PG.JSR.T.state; return s && s.batch >= 5; }, null, { timeout: 300000 });
const respon = await ev(() => new Promise((res) => { const t = performance.now(); setTimeout(() => res(performance.now() - t), 0); }));
log('3e page responsive during training: setTimeout(0) answered in', respon.toFixed(0), 'ms'); await shot('3e_live');
await F.waitForFunction(() => window.PG.VERD['3e'] != null && window.PG.running() == null, null, { timeout: 7200000 });
r3e = await ev(() => window.PG.RES['3e']); const v3e = await ev(() => window.PG.VERD['3e']);
log('3e TRAINED in', ((Date.now() - tt) / 1000).toFixed(0), 's |', v3e.msg, '| per-epoch s:', JSON.stringify(r3e.hist.map((h) => +h.sec.toFixed(1))), '| saved:', r3e.saved);
if (!v3e.pass) throw new Error('3e failed: ' + v3e.msg);
await F.locator('#out').evaluate((e) => { e.scrollTop = 0; }); await shot('3e'); await expectPass('3e');

}
// ---------- 3f ----------
let r3f = null;
if (at('3f')) {
await open('3f'); await codeStep('3f', { wrongs: 2, timeout: 300000 });
{ const c = F.locator('#vizbox canvas').first(); const b = await c.boundingBox();
  for (let fx = 0.9; fx > 0.02 && !(await mech('3f')).hit; fx -= 0.03) { await page.mouse.click(b.x + b.width * fx, b.y + b.height * 0.5); await page.waitForTimeout(40); } }
r3f = await ev(() => { const r = window.PG.RES['3f']; return { w: r.bestW, base: [r.base.auc, r.base.far, r.base.fp, r.base.fn], cnn: [r.cnn.auc, r.cnn.far, r.cnn.fp, r.cnn.fn], blend: [r.blend.auc, r.blend.far, r.blend.fp, r.blend.fn], n: r.n }; });
log('3f LIVE baseline/cnn/blend [auc, far, fp, fn]:', JSON.stringify(r3f));
await F.locator('#out').evaluate((e) => { e.scrollTop = 520; }); await shot('3f'); await expectPass('3f');

}
// ---------- 3g ----------
await open('3g');
log('top bar target:', await F.locator('.goal').innerText());
const gateMap = async (c) => { await c.scrollIntoViewIfNeeded(); const b = await c.boundingBox(); const a = await c.evaluate((e) => ({ lo: +e.dataset.lo, hi: +e.dataset.hi, l: +e.dataset.l, r: +e.dataset.r, w: +e.dataset.w, st: { low: e.__st.low, high: e.__st.high } }));
  return { b, a, X: (v) => b.x + b.width * (a.l + (a.r - a.l) * (Math.max(a.lo, Math.min(a.hi, v)) - a.lo) / (a.hi - a.lo)) / a.w }; };
const dragGate = async (G, from, to) => { const y = G.b.y + 100; await page.mouse.move(G.X(from), y); await page.mouse.down(); await page.mouse.move(G.X(to), y, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(120); };
{ const G = await gateMap(F.locator('#prebox canvas').first());
  const lowV = await ev(() => { const r = window.PG.RES['3f']; return window.PG_STEP3_gatesFor(r.y, r.blendScores).low; });
  await dragGate(G, G.a.st.low, lowV - (G.a.hi - G.a.lo) * 0.004);                 // low gate just under the 5% point
  await dragGate(G, G.a.st.high, G.a.st.high + (G.a.hi - G.a.st.high) * 0.5);   // high gate further right
  log('3g play gates done:', (await mech('3g')).twoDone, JSON.stringify((await mech('3g')).play)); }
await shot('3g_play');
await codeStep('3g', { wrongs: 3 });
const r3g = await ev(() => { const r = window.PG.RES['3g'], L = r.lanes; return { low: r.low, high: r.high, defPass: L.defPass, nDef: L.nDef, human: L.human, autoPass: L.autoPass, autoStop: L.autoStop, stopPrec: L.stopPrec, okStop: L.okStop, base: { human: r.base.human, defPass: r.base.defPass, stopPrec: r.base.stopPrec } }; });
log('3g LIVE lanes:', JSON.stringify(r3g));
// challenge: one checker. Try the code gates first (too many for her), then move the high gate left step by step.
const chk = async () => { await F.locator('#vizbox button', { hasText: 'Check my gates' }).click(); await page.waitForTimeout(150); return (await F.locator('#vizbox .vc').last().locator('.verdict').last().innerText()).slice(0, 140); };
log('3g challenge cap', (await mech('3g')).cap, '| code gates ->', await chk());
{ let G = await gateMap(F.locator('#vizbox .vc').last().locator('canvas').first()); let hi = G.a.st.high > G.a.hi ? G.a.hi : G.a.st.high, msg = '';
  for (let k = 0; k < 150 && !(await mech('3g')).capOk; k++) {
    const to = Math.max(G.a.st.low, hi - (G.a.hi - G.a.lo) * 0.006); await dragGate(G, hi, to); hi = to;
    msg = await chk();
  }
  log('3g challenge ->', msg); }
await F.locator('#vizbox .vc').last().scrollIntoViewIfNeeded(); await page.waitForTimeout(150); await shot('3g_challenge');
await F.locator('#out').evaluate((e) => { e.scrollTop = e.scrollHeight; }); await page.waitForTimeout(200); await shot('3g_end');
await expectPass('3g');
log('end card:', (await F.locator('.endc').innerText()).replace(/\n/g, ' | ').slice(0, 700));
const notPassed = await ev(() => window.PG.ORDER.filter((i) => i < '4' && !window.PG.passed(i)));
log('not passed (Steps 0-3):', JSON.stringify(notPassed));

// ---------- reload: trained model must come back from this browser's storage (or say "train again") ----------
if (process.env.RELOAD !== '0') {
  const tr = Date.now(); await loadApp();
  await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['2e'] && (window.PG.RES['3g'] || window.PG.pendingOf('3e')), null, { timeout: 900000 });
  await F.waitForFunction(() => window.PG.ready(), null, { timeout: 600000 });
  const st = await ev(() => ({ e: window.PG.pendingOf('3e'), f: window.PG.pendingOf('3f'), g: window.PG.pendingOf('3g'), from: window.PG.RES['3e'] && window.PG.RES['3e'].restoredFrom, same: window.PG.RES['3g'] && window.PG.RES['3g'].low }));
  log('RELOAD rebuilt in', ((Date.now() - tr) / 1000).toFixed(0), 's ->', JSON.stringify(st), '| low gate same as before:', st.same === r3g.low);
  await open('3e'); await page.waitForTimeout(500); await shot('3e_after_reload');
}
// storage lost/blocked: the app must say "train again" plainly, never pretend
if (process.env.BLOCKTEST === '1') {
  await ev(() => new Promise((res) => { const r = indexedDB.deleteDatabase('tensorflowjs'); r.onsuccess = r.onerror = r.onblocked = () => res(); }));
  await loadApp();
  await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['2e'] && window.PG.pendingOf('3e') !== null, null, { timeout: 900000 }).catch(() => {});
  await F.waitForFunction(() => window.PG.ready(), null, { timeout: 600000 });
  const st = await ev(() => ({ e: window.PG.pendingOf('3e'), f: window.PG.pendingOf('3f'), g: window.PG.pendingOf('3g'), res3e: !!window.PG.RES['3e'] }));
  log('STORAGE CLEARED + reload ->', JSON.stringify(st));
  await open('3e'); await page.waitForTimeout(500); await shot('3e_train_again');
  if (!/train again/.test(st.e || '') || st.res3e) errors.push('restore-failure path did not say train again');
}
log('console errors:', errors.length ? errors : 'none');
log('external requests:', [...new Set(external)]);
log('TOTAL', ((Date.now() - t0) / 1000).toFixed(0) + 's');
await browser.close(); if (srv) srv.kill();
process.exit(notPassed.length || errors.length ? 1 : 0);
