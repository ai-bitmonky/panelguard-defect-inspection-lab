// Step 7 end to end in real headless Chrome. TARGET=site|file|srcdoc.  RELOAD=0 / REVIEW=0 / BIG=0 skip those parts.
// Start state: Steps 0-6 passed (s7seed.mjs); Step 3 model = the Keras-trained TEST FIXTURE in IndexedDB. Everything else
// replays for real (Steps 3-6 cells), then every Step 7 cell runs for real (wrong answers first, then the right ones).
import { chromium } from 'playwright'; import { mirrorCDN } from './cdn.mjs'; import { spawn } from 'child_process';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
import { FILLS, fill } from './fills.mjs'; import { SUBS, putFixture, state7, KEY } from './s7seed.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site'); const shots = path.resolve(here, '../shots');
const W = 1366, H = 768, MODE = process.env.TARGET || 'site', DIST = path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v0.8.html');
let srv = null; if (MODE !== 'file') { srv = spawn('node', [path.resolve(here, '../serve.mjs'), site, '8774'], { stdio: 'pipe' }); await new Promise((r) => srv.stdout.once('data', r)); }
process.on('exit', () => { try { srv && srv.kill(); } catch (e) {} });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H } }); await mirrorCDN(ctx); const page = await ctx.newPage();
try { await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:8774' }); } catch (e) {}
const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const t0 = Date.now(), log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
let n = 0; const shot = async (nm) => page.screenshot({ path: `${shots}/s7_${MODE}_${String(++n).padStart(2, '0')}_${nm}.png` });
let F = page; const ev = (f, a) => F.evaluate(f, a); const fails = [];
const expect = (ok, what) => { log(ok ? 'OK  ' : 'FAIL', what); if (!ok) fails.push(what); };
const frame = async () => { for (let i = 0; i < 80; i++) { const x = page.frames().find((q) => q.url().startsWith('about:srcdoc')); if (x) return x; await page.waitForTimeout(100); } return page.frames()[1]; };
const loadApp = async (first) => {
  if (MODE === 'site') { if (first) await page.goto('http://localhost:8774/index.html'); else await page.reload(); F = page; }
  else if (MODE === 'file') { if (first) await page.goto('file://' + DIST); else await page.reload(); F = page; }
  else { if (first) await page.goto('http://localhost:8774/data/labels.json');
    await page.setContent('<style>body{margin:0}</style><iframe id=f sandbox="allow-scripts allow-same-origin" style="width:100vw;height:100vh;border:0"></iframe>');
    await page.evaluate((h) => { document.getElementById('f').srcdoc = h; }, fs.readFileSync(DIST, 'utf8')); await page.waitForTimeout(1500); F = await frame(); }
};
await loadApp(true);
await F.waitForFunction(() => window.PG && window.PG.JSR.ready, null, { timeout: 300000 });
await putFixture(ev);
await ev(([k, v]) => localStorage.setItem(k, v), [KEY, state7('7a')]);
await loadApp(false);
await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['6f'], null, { timeout: 900000 });
log('ready: Steps 0-6 rebuilt after', ((Date.now() - t0) / 1000).toFixed(0), 's');
const open = async (id) => { await ev((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(700); };
const mech = (id) => ev((i) => (window.PG.S.subs[i] || {}).mech || {}, id);
const pend = (id) => ev((i) => window.PG.pendingOf(i), id);
const setCode = async (c) => { await F.locator('.edw textarea').first().fill(c); await F.locator('.ed').first().evaluate((e) => { e.scrollTop = 0; e.scrollLeft = 0; }); };
const run = async (id, timeout = 300000) => { const t = Date.now(); await F.locator('#runbtn').click(); await F.waitForFunction((i) => window.PG.VERD[i] != null && window.PG.running() == null, id, { timeout }); const v = await ev((i) => window.PG.VERD[i], id); log(id, 'run', ((Date.now() - t) / 1000).toFixed(1) + 's', v.pass ? 'PASS' : 'fail', '|', v.msg.slice(0, 220)); return v; };
const codeStep = async (id, wrongs) => { for (const w of wrongs) { await setCode(fill(SUBS[id].code, w)); const v = await run(id); expect(!v.pass, id + ' wrong answer ' + JSON.stringify(w) + ' fails with a plain message'); } await setCode(fill(SUBS[id].code, SUBS[id].ref)); const v = await run(id); expect(v.pass, id + ' right answer passes'); return v; };
const refCode = (id) => { let c = fill(SUBS[id].code, SUBS[id].ref || []); for (const f of SUBS[id].fixes || []) c = c.split(f[0]).join(f[1]); return c; };
const top = async () => { await F.locator('#out').evaluate((e) => { e.scrollTop = 0; }); };
const outText = () => F.locator('#out').innerText();
const key = async (k) => { await F.locator('#out').click({ position: { x: 4, y: 4 } }); await page.keyboard.press(k); };

// 7a sketch
await open('7a'); expect(await ev(() => window.PG.S.cur === '7a'), '7a opens (Step 7 unlocked)');
await F.locator('[data-block7="dot"]').click(); await F.locator('#zone7a-main').click(); await page.waitForTimeout(120);
expect(/colour alone/.test(await F.locator('#sketchmsg').innerText()), '7a colour-only dot refused with the reason');
await F.locator('[data-block7="lamp"]').click(); await F.locator('#zone7a-top').click(); await page.waitForTimeout(120);
expect(/BIGGEST/.test(await F.locator('#sketchmsg').innerText()) && !(await mech('7a')).put.lamp, '7a lamp in the small top strip refused');
await F.locator('[data-block7="keep"]').click(); await F.locator('#zone7a-main').click(); await page.waitForTimeout(120);
expect(/NO VERDICT/.test(await F.locator('#sketchmsg').innerText()), '7a “keep the last verdict” refused (safe default)');
await F.locator('[data-block7="score"]').click(); await F.locator('#zone7a-main').click(); await page.waitForTimeout(120);
expect(/on demand/.test(await F.locator('#sketchmsg').innerText()), '7a score bar in the main area refused (reason on demand)');
{ const a = await F.locator('[data-block7="lamp"]').boundingBox(), b = await F.locator('#zone7a-main').boundingBox(); await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 }); await page.mouse.up(); await page.waitForTimeout(150); }
expect((await mech('7a')).put.lamp === 'main', '7a lamp placed by dragging');
for (const [b, z] of [['photo', 'main'], ['score', 'drawer'], ['heat', 'side'], ['counters', 'top'], ['queue', 'side'], ['stopline', 'bottom'], ['tiny', 'bottom']]) { await F.locator(`[data-block7="${b}"]`).click(); await F.locator('#zone7a-' + z).click(); await page.waitForTimeout(100); }
expect(await pend('7a') !== null, '7a not done before the 2 m view'); await shot('7a');
await F.locator('#far7a').click(); await page.waitForTimeout(700); await shot('7a_far');
expect(await pend('7a') === null, '7a all blocks placed + seen from 2 m: done');

// 7b one cell
await open('7b'); const v7b = await codeStep('7b', FILLS['7b'].wrong.slice(0, 2));
expect(/readable from about/.test(v7b.msg), '7b lamp size measured on a 1920×1080 layout');
await F.locator('#view7b-gray').click(); await F.locator('#view7b-far').click(); await page.waitForTimeout(200);
expect(await pend('7b') === null && /PASS|CHECK|STOP/.test(await F.locator('#pv7b .lamp .word').innerText()), '7b live preview lamp + both view switches'); await top(); await shot('7b');

// 7c the line
await open('7c'); await codeStep('7c', FILLS['7c'].wrong.slice(0, 1));
{ const k = await F.locator('#knob7c').boundingBox(); await page.mouse.move(k.x + k.width * 0.5, k.y + k.height * 0.45); await page.mouse.down(); await page.mouse.move(k.x + k.width * 0.95, k.y + k.height * 0.85, { steps: 8 }); await page.mouse.up(); }
expect((await mech('7c')).knob === 'MAX', '7c knob turned by dragging (to MAX)');
await F.locator('#start7c').click(); await F.waitForFunction(() => (window.PG.S.subs['7c'].mech.ran || 0) >= 30, null, { timeout: 300000 }); await page.waitForTimeout(1500);
const sp = await ev(() => window.PG.JSR.k.NS.speedReport()); log('7c measured decision:', JSON.stringify(sp));
expect(await pend('7c') === null && /cells per minute/.test(await outText()), '7c 30 real cells run with Start; measured speed shown'); await top(); await shot('7c');

// 7d the queue
await open('7d'); await codeStep('7d', FILLS['7d'].wrong);
await key('h'); await page.waitForTimeout(800);
expect(/Score \d\.\d{3}|Photo problem|Fault/.test(await F.locator('[data-screen="7d"] .reason').innerText()), '7d H shows the reason (score, gates) + heat map'); await top(); await shot('7d_why');
const q0 = await ev(() => window.PG.JSR.k.NS.queue.length);
for (let i = 0; i < 10; i++) { await page.waitForTimeout(400); if (i === 3) await F.locator('[data-screen="7d"] button[data-say="stop"]').click(); else await key(i % 2 ? 's' : 'p'); }
await page.waitForTimeout(1200);
const ans = await ev(() => window.PG.JSR.k.NS.answers.filter((a) => a.seconds > 0).map((a) => a.said));
expect(ans.length === 10 && ans.filter((x) => x === 'stop').length === 5 && await ev(() => window.PG.JSR.k.NS.queue.length) === q0 - 10, '7d keys P / S and the big button answered 10 real queued cells (' + ans.join(',') + ')');
const rate = (await mech('7d')).rate; log('7d checker rate:', JSON.stringify(rate));
expect(await pend('7d') === null && /one checker/.test(await outText()), '7d measured seconds per cell → cells per hour vs the share sent to a person'); await top(); await shot('7d');

// 7e board (match prediction)
await open('7e'); await F.locator('[data-q7]').first().waitFor();
for (const [q, ch] of [['busy', 'lanes'], ['target', 'bullet'], ['poly', 'pair']]) { await F.locator(`[data-q7="${q}"]`).click(); await F.locator(`[data-chart7="${ch}"]`).click(); await page.waitForTimeout(80); }
await shot('7e_predict'); await F.locator('#matchcheck').click(); await page.waitForTimeout(300);
expect(await ev(() => window.PG.S.subs['7e'].pred.locked && window.PG.S.subs['7e'].pred.good === 1), '7e match prediction checked once and locked');
await codeStep('7e', FILLS['7e'].wrong);
expect(await pend('7e') === null && (await F.locator('[data-screen="7e"] svg').count()) === 3, '7e three SVG charts drawn from the logbook'); await top(); await shot('7e');

// 7f report
await open('7f'); await codeStep('7f', FILLS['7f'].wrong);
await F.locator('[data-screen="7f"] .go').click(); await F.waitForFunction(() => /CHECKED|HELD/.test(document.querySelector('[data-screen="7f"] .badge').textContent), null, { timeout: 120000 });
await F.locator('[data-screen="7f"] .copy').click(); await page.waitForTimeout(500);
const badge = await F.locator('[data-screen="7f"] .badge').innerText(); log('7f badge:', badge, '| copy:', await F.locator('[data-screen="7f"] .copy').innerText());
expect(/EVERY NUMBER CHECKED/.test(badge) && await pend('7f') === null, '7f REPORT → checked badge; COPY pressed'); await top(); await shot('7f');

// 7g fault drill: starter (planted bugs) then fixed
await open('7g'); await setCode(SUBS['7g'].code); const vs = await run('7g');
expect(!vs.pass && /BUG 1/.test(vs.msg), '7g starter console fails the drill with a plain BUG 1 message'); await page.waitForTimeout(500);
const said = {};
for (const f of ['camera', 'model', 'flow', 'empty']) {
  await F.locator(`[data-fault7="${f}"]`).click(); await F.locator('#say7-wrong').waitFor({ timeout: 60000 });
  said[f] = (await outText()).match(/The screen shows: (.*)/)[1]; await F.locator(f === 'empty' ? '#say7-right' : '#say7-wrong').click(); await page.waitForTimeout(250);
  if (f === 'camera') { await top(); await shot('7g_camera_bug'); }
}
log('starter console under faults:', JSON.stringify(said));
expect(/lamp: PASS/.test(said.camera) && /lamp: PASS/.test(said.model) && /lamp: PASS/.test(said.flow) && /no cells waiting/.test(said.empty), '7g starter: the stale PASS shows for camera / model / flow faults; empty queue ok');
await page.waitForTimeout(700); await F.locator('[data-screen="7g"] .screen-side button[data-say="stop"]').click(); await page.waitForTimeout(1200);
expect(/counted AGAIN/.test(await outText()), '7g starter: a cell back from the person is counted twice (BUG 2 seen)');
await setCode(refCode('7g')); const vf = await run('7g'); expect(vf.pass, '7g both bugs fixed: drill passes');
for (const f of ['camera', 'model', 'flow', 'empty']) { await F.locator(`[data-fault7="${f}"]`).click(); await F.locator('#say7-right').waitFor({ timeout: 60000 }); said[f] = (await outText()).match(/The screen shows: (.*)/)[1]; await F.locator('#say7-right').click(); await page.waitForTimeout(250); }
log('fixed console under faults:', JSON.stringify(said));
expect(/lamp: CHECK · sent to a person: yes/.test(said.camera) && /NO VERDICT · sent to a person: yes/.test(said.model) && /NO VERDICT · sent to a person: yes/.test(said.flow) && /no counter moved/.test(said.empty), '7g fixed: safe default holds for all 4 faults');
expect(await pend('7g') === null && /STEP 7 DONE/.test(await outText()), '7g done; end card'); await top(); await shot('7g');
// the full console
await F.locator('#open7end').click(); await page.waitForTimeout(1500); await shot('full');
await F.locator('#pgc-root .start').click(); await page.waitForTimeout(5000); await F.locator('#pgc-root .halt').click(); await page.waitForTimeout(1500);
const fullTot = await ev(() => window.PG.JSR.k.NS.counts.total); await shot('full_line');
await page.keyboard.press('h'); await page.waitForTimeout(800); await shot('full_why');
const qa = await ev(() => window.PG.JSR.k.NS.queue.length); await page.keyboard.press('s'); await page.waitForTimeout(1000);
expect(await ev(() => window.PG.JSR.k.NS.queue.length) === qa - 1 && await ev(() => window.PG.JSR.k.NS.counts.total) === fullTot, 'full view: key S answers the queued cell; CELLS not counted again');
await F.locator('#pgc-root .tab[data-tab="board"]').click(); await page.waitForTimeout(500); await shot('full_board');
await F.locator('#pgc-root .tab[data-tab="report"]').click(); await page.waitForTimeout(300); await F.locator('#pgc-root .drawer .go').click();
await F.waitForFunction(() => /CHECKED|HELD/.test((document.querySelector('#pgc-root .drawer .badge') || {}).textContent || ''), null, { timeout: 120000 }); await shot('full_report');
await F.locator('#pgc-root .tab[data-tab="report"]').click(); await F.locator('#full-drill').click();
const fr = [];
for (const f of ['camera', 'model', 'flow', 'empty']) { await F.locator(`[data-ffault7="${f}"]`).click(); await F.waitForFunction(() => document.getElementById('full-drillres').getAttribute('data-ok') != null && document.getElementById('full-drillres').textContent.length > 5, null, { timeout: 60000 }); await page.waitForTimeout(300); fr.push(await F.locator('#full-drillres').getAttribute('data-ok')); await ev(() => document.getElementById('full-drillres').removeAttribute('data-ok')); }
expect(fr.join() === '1,1,1,1', 'full view: all 4 faults → safe default holds (' + fr.join() + ')'); await shot('full_drill');
const lampPx = await ev(() => { const w = document.querySelector('#pgc-root .lamp .word'); return w ? parseFloat(getComputedStyle(w).fontSize) : 0; }); log('full view lamp font px at 1366x768:', lampPx);
await page.keyboard.press('Escape'); await page.waitForTimeout(400); expect(await ev(() => !document.getElementById('pgc-full')), 'full view closes with Esc');
const np = await ev(() => window.PG.ORDER.filter((i) => i < '8' && !window.PG.passed(i))); expect(np.length === 0, 'Steps 0-7 all passed (' + JSON.stringify(np) + ')');
expect(await ev(() => [...document.querySelectorAll('.ns.lock .nt')].map((e) => e.textContent).filter((t) => /Line trial/i.test(t)).length === 1), 'Step 8 still locked');
// 1920 x 1080: every substep + the full console
if (process.env.BIG !== '0') {
  await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(500);
  for (const id of ['7a', '7b', '7c', '7d', '7e', '7f', '7g']) { await open(id); await page.waitForTimeout(600); await top(); await shot('big_' + id); }
  await F.locator('#open7').click(); await page.waitForTimeout(1500); await shot('big_full');
  const big = await ev(() => { const w = document.querySelector('#pgc-root .lamp .word'); return w ? parseFloat(getComputedStyle(w).fontSize) : 0; }); log('full view lamp font px at 1920x1080:', big);
  await page.keyboard.press('Escape'); await page.setViewportSize({ width: W, height: H }); await page.waitForTimeout(400);
}
// reload: Step 7 comes back by itself
if (process.env.RELOAD !== '0') {
  const t1 = Date.now(); await loadApp(false);
  await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['7g'], null, { timeout: 900000 });
  log('reload: rebuilt up to 7g in', ((Date.now() - t1) / 1000).toFixed(0), 's');
  await open('7d'); await page.waitForTimeout(1200);
  expect(await ev(() => window.PG.ORDER.filter((i) => i < '8' && !window.PG.passed(i)).length === 0) && (await mech('7d')).answered >= 10, 'after reload: Steps 0-7 still passed; your 10 answers kept');
  await open('7g'); await page.waitForTimeout(800); expect(await F.locator('[data-screen="7g"] .console').count() === 1, 'after reload: the console preview is back');
}
// review mode: open 7a-7g, Run up to here on 7g
if (process.env.REVIEW !== '0') {
  await F.locator('#revbtn').click(); await page.waitForTimeout(400);
  for (const id of ['7g', '7a', '7c', '7f', '7b', '7e', '7d']) { await open(id); expect(await ev((i) => window.PG.S.cur === i, id), 'review: opens ' + id); }
  await open('7g'); const t2 = Date.now(); await F.locator('#runupto').click(); await F.waitForFunction(() => !window.PG.runningUpTo(), null, { timeout: 900000 }); await page.waitForTimeout(800);
  log('review Run up to here 7g:', ((Date.now() - t2) / 1000).toFixed(0), 's');
  expect(await ev(() => window.PG.VERD['7g'] && window.PG.VERD['7g'].pass) && await F.locator('[data-screen="7g"] .console').count() === 1, 'review: Run up to here on 7g fixes the bugs (reference) and passes the drill'); await shot('7g_review');
}
expect(errors.length === 0, 'zero console errors' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 5)) : ''));
log('TOTAL', ((Date.now() - t0) / 1000).toFixed(0) + 's | FAILS:', fails.length, fails.length ? JSON.stringify(fails) : '');
await browser.close(); process.exit(fails.length ? 1 : 0);
