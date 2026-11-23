// Release check for the LAB (not the guide): with the guide closed, the v3.0 file opens, Step 0a works and code step 1a
// passes with the reference answer through the real Run button. node lab_check.mjs
import { chromium } from 'playwright'; import { mirrorCDN } from '../../tests/cdn.mjs'; import { SUBS } from '../../tests/s8seed.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(here, '../../../dist/PanelGuard_Refined_Student_Lab_v' + (process.env.GV || '3.0') + '.html');
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }); await mirrorCDN(ctx); const page = await ctx.newPage();
const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const fails = [], expect = (ok, w) => { console.log(ok ? 'OK  ' : 'FAIL', w); if (!ok) fails.push(w); };
const t0 = Date.now(); await page.goto('file://' + DIST);
await page.waitForFunction(() => window.PG && window.PG.ready && window.PG.ready() && window.PG.JSR && window.PG.JSR.ready, null, { timeout: 600000 });
expect(true, 'lab opens and is ready in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
await page.evaluate(() => { location.hash = '#sub-0a'; }); await page.waitForTimeout(600);
const keys = await page.evaluate(() => [...document.querySelectorAll('#stage .hot')].map((e) => e.getAttribute('data-key')));
for (const k of keys) { await page.click(`#stage .hot[data-key="${k}"]`); await page.waitForTimeout(150); }
expect(await page.evaluate(() => !!(window.PG.S.subs['0a'] && window.PG.S.subs['0a'].mech.done)), 'Step 0a works with the guide closed');
await page.evaluate(() => { for (const i of ['0b', '0c', '0d']) Object.assign(window.PG.SSs(i).mech, { done: 1 }); Object.assign(window.PG.SSs('1a').mech, { opened: 2 }); location.hash = '#sub-1a'; }); await page.waitForTimeout(800);
const s = SUBS['1a']; let i = 0; const code = s.code.replace(/____/g, () => s.ref[i++]);
await page.locator('.edw textarea').first().fill(code); await page.locator('#runbtn').click({ noWaitAfter: true });
await page.waitForFunction(() => window.PG.VERD['1a'] != null && window.PG.running() == null, null, { timeout: 600000 });
const v = await page.evaluate(() => window.PG.VERD['1a']);
expect(v && v.pass, '1a with the reference answer passes through Run (' + (v && v.msg || '').slice(0, 100) + ')');
expect(!(await page.evaluate(() => window.PGDiagram.isOpen())), 'the guide stayed closed');
expect(errors.length === 0, 'zero console errors' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 3)) : ''));
await page.screenshot({ path: path.resolve(here, '../shots/g_lab_1a_pass_1366.png') });
await browser.close(); console.log('FAILS:', fails.length); process.exit(fails.length ? 1 : 0);
