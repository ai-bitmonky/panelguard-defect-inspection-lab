// Full browser test: real Chrome (headless), local static server, completes Steps 0-2 by script.
// Usage: node e2e.mjs [from-substep]   (screenshots go to tools/shots/)
import { chromium } from 'playwright';
import { mirrorCDN, hits as cdnHits } from './cdn.mjs';
import { spawn } from 'child_process';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
import vm from 'vm';
import { FILLS, fill } from './fills.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const shots = path.resolve(here, '../shots'); fs.mkdirSync(shots, { recursive: true });
const site = path.resolve(here, '../../site');
const ctx = {}; ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(site + '/js/steps.js', 'utf8'), ctx);
const SUBS = Object.fromEntries(ctx.PG_STEPS.flatMap((s) => s.substeps).map((s) => [s.id, s]));
const PORT = 8765;
const srv = spawn('node', [path.resolve(here, '../serve.mjs'), site, String(PORT)], { stdio: 'pipe' });
await new Promise((r) => srv.stdout.once('data', r));
const W = +(process.env.W || 1366), H = +(process.env.H || 768);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const page = await browser.newPage({ viewport: { width: W, height: H } }); await mirrorCDN(page.context());
const errors = [], external = [], failed = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
page.on('request', (r) => { const u = r.url(); if (!u.startsWith('http://localhost:' + PORT) && !u.startsWith('blob:') && !u.startsWith('data:')) external.push(u); });
page.on('requestfailed', (r) => failed.push(r.url() + ' ' + (r.failure() && r.failure().errorText)));
let n = 0; const shot = async (name) => { await page.screenshot({ path: `${shots}/${W}_${String(++n).padStart(2, '0')}_${name}.png` }); };
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const t0 = Date.now();
await page.goto(`http://localhost:${PORT}/index.html`);
await page.waitForTimeout(1500); await shot('loading');
const passed = (id) => page.evaluate((i) => window.PG.passed(i), id);
const mech = (id) => page.evaluate((i) => (window.PG.S.subs[i] || {}).mech || {}, id);
const open = async (id) => { await page.evaluate((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(400); };
const expectPass = async (id) => { const ok = await passed(id); log(id, ok ? 'PASSED' : 'NOT PASSED -> ' + await page.evaluate((i) => window.PG.pendingOf(i), id)); if (!ok) throw new Error(id + ' not passed'); };

// ---------- STEP 0 (works while Python loads) ----------
await open('0a');
for (let k = 0; k < 4; k++) { const hs = page.locator('#stage .hot'); await hs.nth(k).click(); await page.waitForTimeout(150); }
await shot('0a'); await expectPass('0a');
await open('0b'); await page.waitForTimeout(500);
for (let k = 0; k < 6; k++) { await page.locator('#stage button').nth(k).click(); await page.waitForTimeout(120); }
await shot('0b'); await expectPass('0b');
await open('0c');
// tap-then-tap: first a wrong drop, then the right ones
await page.locator('#stage .dragtok').first().click(); await page.locator('[data-bin="recheck"]').click(); await page.waitForTimeout(150);
await page.locator('.dragtok[data-k="miss"]').click(); await page.locator('[data-bin="warranty"]').click(); await page.waitForTimeout(150);
// real drag for the second
{ const t = await page.locator('.dragtok[data-k="fa"]').boundingBox(); const b = await page.locator('[data-bin="recheck"]').boundingBox();
  await page.mouse.move(t.x + 20, t.y + 20); await page.mouse.down(); await page.mouse.move(t.x + 60, t.y + 80, { steps: 5 }); await page.mouse.move(b.x + 40, b.y + 40, { steps: 8 }); await page.mouse.up(); }
await page.waitForTimeout(200); await shot('0c'); await expectPass('0c');
await open('0d');
for (let k = 0; k < 12; k++) { await page.locator('#stage button', { hasText: k % 3 === 0 ? 'STOP' : 'PASS' }).click(); await page.waitForTimeout(120); }
await page.waitForTimeout(400); await shot('0d'); await expectPass('0d');

// ---------- wait for Python ----------
await page.waitForFunction(() => window.PG && window.PG.ready(), null, { timeout: 240000 });
log('python ready after', ((Date.now() - t0) / 1000).toFixed(1), 's', await page.locator('#ktext').innerText());

const setCode = async (code) => { await page.locator('.edw textarea').fill(code); await page.locator('.ed').evaluate((e) => { e.scrollTop = 0; e.scrollLeft = 0; }); };
const run = async (id, timeout = 180000) => {
  const t = Date.now();
  await page.locator('#runbtn').click();
  await page.waitForFunction((i) => { const v = window.PG.VERD[i]; return v != null; }, id, { timeout });
  const v = await page.evaluate((i) => window.PG.VERD[i], id);
  log(id, 'run', ((Date.now() - t) / 1000).toFixed(1) + 's', v.pass ? 'check PASS' : 'check FAIL: ' + v.msg);
  return v;
};
const codeStep = async (id, before, after) => {
  await open(id);
  // a wrong answer first: the check must fail in the browser too
  const W0 = FILLS[id].wrong[0];
  if (before) await before();
  await setCode(fill(SUBS[id].code, W0)); const vw = await run(id); if (vw.pass) throw new Error(id + ' wrong answer passed');
  await setCode(fill(SUBS[id].code, FILLS[id].right)); const v = await run(id); if (!v.pass) throw new Error(id + ' right answer failed');
  if (after) await after();
  await page.waitForTimeout(300); await shot(id); await expectPass(id);
};
// gap left -> friendly message, no run
await open('1a'); await page.locator('#runbtn').click(); await page.waitForTimeout(300);
log('gap guard:', await page.locator('#chkbox').innerText());
await codeStep('1a', null, async () => { const c = page.locator('#vizbox canvas'); await c.nth(5).click(); await page.waitForTimeout(300); await shot('1a_zoom'); await page.locator('.zoom button').click(); await c.nth(40).click(); await page.locator('.zoom button').click(); });
await codeStep('1b', async () => { await page.locator('#predbox input').fill('69'); await page.locator('#predbox button').click(); await page.waitForTimeout(200); });
await codeStep('1c', null, async () => { const s = page.locator('#vizbox svg').first(); const b = await s.boundingBox(); for (const fx of [0.05, 0.95, 0.27, 0.5]) { await page.mouse.click(b.x + b.width * fx, b.y + b.height * 0.4); await page.waitForTimeout(100); } });
await codeStep('1d', null, async () => { for (let k = 0; k < 3; k++) { await page.locator('button', { hasText: 'Shuffle without stratify' }).click(); await page.waitForFunction((c) => ((window.PG.S.subs['1d'].mech || {}).rolls || 0) >= c, k + 1, { timeout: 30000 }); } });
await codeStep('1e', null, async () => {
  const c = page.locator('#vizbox canvas').first(); const b = await c.boundingBox();
  for (let y = 0.05; y < 1 && !(await mech('1e')).found; y += 0.06) for (let x = 0.1; x < 1; x += 0.2) { await page.mouse.click(b.x + b.width * x, b.y + b.height * y); }
});
await codeStep('2a', null, async () => {
  const measure = async () => { const before = ((await mech('2a')).results || []).length; await page.locator('button', { hasText: 'MEASURE THIS MIX' }).click(); await page.waitForFunction((c) => ((window.PG.S.subs['2a'].mech || {}).results || []).length > c, before, { timeout: 120000 }); };
  await measure(); // A
  await page.locator('#vizbox button', { hasText: 'B · DARK MAP' }).click(); await measure(); // A+B
  await page.locator('#vizbox button', { hasText: 'C · PIXEL SUMMARY' }).click(); await measure(); // A+B+C
  await page.locator('#vizbox button', { hasText: 'A · LINE FINDER' }).click(); await page.locator('#vizbox button', { hasText: 'B · DARK MAP' }).click(); await measure(); // C
  log('2a mixes', JSON.stringify(((await mech('2a')).results || []).map((x) => [x.keys.join('+'), x.auc, x.sec])));
  // keep the best measured mix
  const res = (await mech('2a')).results; const best = res.reduce((a, b) => (b.auc > a.auc ? b : a));
  await page.locator('#vizbox button', { hasText: 'Use this mix' }).first().click();
  await page.waitForFunction(() => !!(window.PG.S.subs['2a'].mech || {}).kept, null, { timeout: 60000 });
  log('2a kept', JSON.stringify((await mech('2a')).kept), 'best was', best.keys.join('+'));
});
await codeStep('2b', async () => { await page.locator('#predbox .bet').nth(2).click(); await page.waitForTimeout(200); });
log('2b result', JSON.stringify(await page.evaluate(() => window.PG.RES['2b'] && window.PG.RES['2b'].models.map((m) => [m.name, m.mean, m.sec]))));
await codeStep('2c', null, async () => {
  const c = page.locator('#vizbox canvas').first(); const b = await c.boundingBox();
  for (const fx of [0.9, 0.6, 0.45, 0.35, 0.3, 0.27, 0.25, 0.22, 0.2]) { await page.mouse.click(b.x + b.width * fx, b.y + b.height * 0.5); await page.waitForTimeout(80); if ((await mech('2c')).hit) break; }
});
await codeStep('2d', async () => {
  await page.waitForSelector('#predbox svg', { timeout: 60000 });
  const s = page.locator('#predbox svg'); const b = await s.boundingBox(); await page.mouse.click(b.x + b.width * 0.35, b.y + b.height * 0.5);
  await page.locator('#predbox button', { hasText: 'Lock my guess' }).click(); await page.waitForTimeout(200);
});
await codeStep('2e', null, async () => {
  const fnN = await page.evaluate(() => window.PG.RES['2e'].FN.length);
  for (let k = 0; k < fnN; k++) {
    const tile = page.locator('#vizbox .vc').last().locator('canvas.dragtok').first();
    await tile.click(); await page.waitForTimeout(60);
    await page.locator('[data-reason]').nth(k % 3).click(); await page.waitForTimeout(60);
  }
  await page.locator('button', { hasText: 'Check my sort' }).click(); await page.waitForTimeout(300);
});
await page.locator('#out').evaluate((e) => { e.scrollTop = e.scrollHeight; }); await page.waitForTimeout(300); await shot('2e_end');
const rep = await page.evaluate(() => { const r = window.PG.RES['2e']; return { tp: r.tp, fn: r.fn, fp: r.fp, tn: r.tn, rec: r.rec, far: r.far, cut: r.cut }; });
log('REPORT', JSON.stringify(rep));
const all = await page.evaluate(() => window.PG.ORDER.filter((i) => !window.PG.passed(i)));
log('not passed:', JSON.stringify(all));

// ---------- reload: state must come back (localStorage + replay) ----------
const tr = Date.now();
await page.reload(); await page.waitForFunction(() => window.PG && window.PG.ready() && window.PG.RES['2e'], null, { timeout: 300000 });
log('reload + replay rebuilt in', ((Date.now() - tr) / 1000).toFixed(1), 's; 2e passed:', await passed('2e'));
await open('2c'); await page.waitForTimeout(500); await shot('2c_after_reload');
// locked tooltip text check: clear progress in a fresh context
const p2 = await browser.newPage({ viewport: { width: W, height: H } }); await mirrorCDN(p2.context());
await p2.goto(`http://localhost:${PORT}/index.html#sub-2b`); await p2.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await p2.reload(); await p2.waitForTimeout(800);
const lockTxt = await p2.evaluate(() => window.PG.S.cur);
await p2.locator('.snode').nth(3).hover(); await p2.waitForTimeout(200); const tip = await p2.locator('#tip').innerText();
log('fresh visit to #sub-2b landed on', lockTxt, '| locked tooltip:', tip);
await p2.screenshot({ path: `${shots}/${W}_zz_locked_tooltip.png` });
await p2.close();

log('console errors:', errors.length ? errors : 'none');
log('external requests:', [...new Set(external)]);
log('failed requests:', failed);
log('TOTAL', ((Date.now() - t0) / 1000).toFixed(0) + 's');
await browser.close(); srv.kill();
process.exit(all.length || errors.filter((e) => !/fonts\.g/.test(e)).length ? 1 : 0);
