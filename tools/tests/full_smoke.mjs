// v1.0 smoke: the WHOLE student flow, Steps 0-8, in ONE session on the single file (file://), from an empty browser.
// Every code cell runs for real through the RUN button with the reference answers, in course order. 3e trains for real
// (1 test epoch, ?pgEpochs=1), then the Keras-trained TEST FIXTURE weights are loaded into the student's model (allowed for this smoke).
// Hands-on parts of Steps 0-7 (already covered by s3-s7 e2e) are satisfied by writing their saved state; Step 8's hands-on runs through the UI.
import { chromium } from 'playwright'; import { mirrorCDN } from './cdn.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
import { SUBS, FIX, KEY } from './s8seed.mjs'; import { LOAD_SRC } from './fixture.mjs'; import { RATE_SEED } from './s8seed.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const shots = path.resolve(here, '../shots');
const DIST = path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v1.0.html');
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }); await mirrorCDN(ctx); const page = await ctx.newPage();
const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const t0 = Date.now(), log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a), fails = [];
const expect = (ok, what) => { log(ok ? 'OK  ' : 'FAIL', what); if (!ok) fails.push(what); };
const ev = (f, a) => page.evaluate(f, a); let n = 0; const shot = async (nm) => page.screenshot({ path: `${shots}/smoke_${String(++n).padStart(2, '0')}_${nm}.png` });
await page.goto('file://' + DIST + '?pgEpochs=1');
await page.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready, null, { timeout: 600000 });
expect(await ev(() => Object.keys(window.PG.S.subs).length === 0), 'fresh browser: no saved progress');
const M = { '0a': { done: 1 }, '0b': { done: 1 }, '0c': { done: 1 }, '0d': { done: 1 }, '1a': { opened: 2 }, '1c': { moves: 2 }, '1d': { rolls: 3 }, '1e': { found: true },
  '2a': { mixes: 3, kept: ['A', 'B', 'C'], best: { keys: ['A', 'B', 'C'], auc: 0.9 } }, '2c': { hit: 1, hitAt: 0.2 }, '2e': { sorted: 1, sort: {} },
  '3a': { tilesDone: 1 }, '3b': { done: 1 }, '3c': { tapBig: 1 }, '3d': { sortOk: 1 }, '3f': { hit: 1 }, '3g': { twoDone: 1, capOk: 1 },
  '4a': { paint: { 496: [1], 1088: [1], 379: [1] }, done: true }, '4b': { patchOk: 1, bestDrop: 0.5 }, '4c': { peek: 3 }, '4e': { rows: ['kind', 'prob'] },
  '4f': { done: 1, box: {}, actions: { more: [2166, 2456], label: [593, 1222], sharp: [2089], wrong: [1761] } },
  '5a': { done: 1, wires: [] }, '5b': { cardOk: 1 }, '5c': { tokenEnd: 1 }, '5e': { sawLoop: 1 }, '5f': { dec: { a: 'pass', b: 'pass', c: 'stop', d: 'pass', e: 'stop' } }, '5g': { need: 0, found: 0 },
  '6a': { done: 1, put: {} }, '6b': { called: { shift_stats: 1, slice_table: 1, worst_cases: 1, action_list: 1 } }, '6c': { read: { 0: 1, 1: 1, 2: 1 } }, '6d': { sawPoor: 1 }, '6e': { traceEnd: 1, tk: 0 }, '6f': { huntDone: 1, found: 2 }, '6g': { skipped: 1, done: 1 },
  '7a': { done: 1, put: {}, sawFar: 1 }, '7b': { views: { gray: 1, far: 1 } }, '7c': { knob: 'MAX', ran: 30 }, '7d': { answered: 10, rate: RATE_SEED }, '7f': { reported: 1, copied: 1 }, '7g': { fixed: { camera: 1, model: 1, empty: 1, flow: 1 } } };
const put = (id) => ev(([i, m, pr]) => { const s = window.PG.SSs(i); Object.assign(s.mech, m); if (pr) s.pred = pr; }, [id, M[id] || {}, null]);
const pred = (id) => { const f = SUBS[id].predict.format; const val = f === 'draw' ? new Array(30).fill(0.5) : f === 'lanes' ? { place: {} } : f === 'match' ? { busy: 'lanes', target: 'bullet', poly: 'pair' } : f === 'tokens' ? [6, 2, 2] : f === 'bet' ? 'SVC (RBF)' : 1;
  return ev(([i, v]) => { window.PG.SSs(i).pred = { locked: true, val: v, good: 1, cells: [] }; }, [id, val]); };
const open = async (id) => { await ev((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(500); };
const refCode = (s) => { let i = 0, c = s.code.replace(/____/g, () => s.ref[i++]); for (const f of s.fixes || []) c = c.split(f[0]).join(f[1]); return c; };
const run = async (id) => { await page.locator('.edw textarea').first().fill(refCode(SUBS[id])); const t = Date.now(); await page.locator('#runbtn').click();
  await page.waitForFunction((i) => window.PG.VERD[i] != null && window.PG.running() == null, id, { timeout: 1800000 }); const v = await ev((i) => window.PG.VERD[i], id);
  log(id, ((Date.now() - t) / 1000).toFixed(1) + 's', v.pass ? 'PASS' : 'FAIL', v.msg.slice(0, 160)); return v; };
const ORDER = await ev(() => window.PG.ORDER);
for (const id of ORDER) {
  const s = SUBS[id];
  await put(id); if (s.predict) await pred(id); await open(id);
  expect(await ev((i) => window.PG.S.cur === i, id), id + ' opens in order');
  if (id === '8a') { for (const k of ['model', 'bestW', 'low', 'lowPoly', 'high', 'flow']) await page.locator(`[data-lock8="${k}"]`).click(); await page.locator('#lockrange8').click();
    const b = await (async () => { await page.locator('#seal8').scrollIntoViewIfNeeded(); return page.locator('#seal8').boundingBox(); })(); await page.mouse.move(b.x + 20, b.y + 10); await page.mouse.down(); await page.waitForTimeout(2500); await page.mouse.up(); await page.waitForTimeout(1200); }
  if (id === '8c') { await page.waitForTimeout(1500); for (let i = 0; i < 10; i++) { await page.locator('#lever8').scrollIntoViewIfNeeded(); const b = await page.locator('#lever8').boundingBox(); await page.mouse.move(b.x + b.width * 0.71, b.y + 30); await page.mouse.down(); await page.mouse.move(b.x + b.width * 0.71, b.y + 110, { steps: 4 }); await page.mouse.up(); await page.waitForTimeout(200); } for (let i = 0; i < 3; i++) await page.locator('#lever8x10').click(); }
  if (s.kind === 'code') { const v = await run(id); expect(v.pass, id + ' runs and passes'); await put(id); await open(id);
    if (id === '3e') { await ev(([src, F2]) => { const NS = window.PG.JSR.k.NS; new Function('return ' + src)()(window.tf, NS.model, F2); return 1; }, [LOAD_SRC, FIX]); log('3e: fixture weights loaded into the student\'s model (smoke only)'); } }
  if (id === '8d') { for (const k of ['dark|bright', 'blur|sharp']) await page.locator(`[data-cell8="${k}"]`).click(); await page.locator('#matrixcheck8').click(); await page.waitForTimeout(300); }
  if (id === '8e') { await page.locator('#own8sky').click(); await page.waitForFunction(() => /drawing/.test((document.querySelector('#own8res') || {}).innerText || ''), null, { timeout: 120000 }); for (const k of ['more', 'label', 'sharp', 'wrong']) await page.locator(`[data-box8="${k}"] button`).click(); }
  if (id === '8f') { await page.locator('#sheet8').waitFor(); await page.locator('[data-dec8="nogo"]').click(); await page.locator('#stamp8').click(); await page.waitForTimeout(400); }
  if (id === '8g') { for (const k of ['photos', 'svc', 'cnn', 'blend', 'why', 'flow', 'crew', 'console', 'trial', 'drift']) await page.locator(`[data-stage8="${k}"]`).click();
    await page.locator('[data-q8="q1"] input').fill('4096'); await page.locator('[data-check8="q1"]').click(); await page.locator('#submit8').click(); await page.locator('#submit8').click(); await page.waitForTimeout(500); }
  const p = await ev((i) => window.PG.pendingOf(i), id); expect(p === null, id + ' done' + (p ? ' — pending: ' + p : ''));
  if (['2e', '3g', '5g', '7g', '8b', '8g'].includes(id)) { await page.locator('#out').evaluate((e) => { e.scrollTop = 0; }); await shot(id); }
}
const np = await ev(() => window.PG.ORDER.filter((i) => !window.PG.passed(i))); expect(np.length === 0, 'Steps 0-8 all passed in one session (' + JSON.stringify(np) + ')');
log('SMOKE TRIAL', await ev(() => window.PG.VERD['8b'].msg), '|', await ev(() => window.PG.VERD['8c'].msg));
expect(errors.length === 0, 'zero console errors' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 5)) : ''));
log('TOTAL', ((Date.now() - t0) / 1000).toFixed(0) + 's | FAILS:', fails.length, fails.length ? JSON.stringify(fails) : '');
await browser.close(); process.exit(fails.length ? 1 : 0);
