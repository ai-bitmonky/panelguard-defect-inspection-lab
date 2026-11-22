// v1.0: a FRESH browser in review mode opens every page 0a-8g of the single file. Each page must render (no crash, no
// console error); pages without data say “press Run up to here”. TARGET=file (default) | site.
import { chromium } from 'playwright'; import { mirrorCDN } from './cdn.mjs'; import { spawn } from 'child_process';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const shots = path.resolve(here, '../shots'); const MODE = process.env.TARGET || 'file';
const DIST = path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v1.0.html');
let srv = null; if (MODE === 'site') { srv = spawn('node', [path.resolve(here, '../serve.mjs'), path.resolve(here, '../../site'), '8776'], { stdio: 'pipe' }); await new Promise((r) => srv.stdout.once('data', r)); }
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }); await mirrorCDN(ctx); const page = await ctx.newPage();
const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a), fails = []; const expect = (ok, what) => { log(ok ? 'OK  ' : 'FAIL', what); if (!ok) fails.push(what); };
await page.goto(MODE === 'site' ? 'http://localhost:8776/index.html?review=1' : 'file://' + DIST + '?review=1');
await page.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready, null, { timeout: 600000 });
expect(await page.evaluate(() => window.PG.review()), 'review mode is on');
const ORDER = await page.evaluate(() => window.PG.ORDER);
for (const id of ORDER) {
  const e0 = errors.length; await page.evaluate((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(id[0] === '8' ? 1500 : 500);
  const st = await page.evaluate((i) => ({ cur: window.PG.S.cur, work: document.querySelector('#work').innerText.length, out: document.querySelector('#out').innerText.length }), id);
  expect(st.cur === id && st.work > 50 && st.out > 10 && errors.length === e0, 'review opens ' + id + (errors.length > e0 ? ' — ' + errors.slice(e0).join(' | ') : ''));
  if (id[0] === '8') await page.screenshot({ path: `${shots}/review_${id}.png` });
}
expect(await page.evaluate(() => Object.keys(window.PG.S.subs).filter((k) => { const s = window.PG.S.subs[k]; return s.codePass || (s.mech && Object.keys(s.mech).length); }).length === 0), 'review mode wrote nothing into the student progress');
expect(errors.length === 0, 'zero console errors' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 5)) : ''));
log('FAILS:', fails.length, fails.length ? JSON.stringify(fails) : ''); await browser.close(); try { srv && srv.kill(); } catch (e) {} process.exit(fails.length ? 1 : 0);
