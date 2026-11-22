// A viewer that blocks WebAssembly (CSP without 'wasm-unsafe-eval' / 'unsafe-eval'): the site and the single file must
// NOT start Pyodide, must show the plain message, keep Step 0 usable, and throw zero uncaught errors.
import { chromium } from 'playwright'; import { mirrorCDN, hits } from '../tests/cdn.mjs'; import { spawn } from 'child_process';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '../..'); const shots = path.resolve(here, 'shots');
const CSP = "default-src 'self' data: blob: https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' blob: https://cdn.jsdelivr.net; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com";
const srv = spawn('node', [path.resolve(here, '../serve.mjs'), root, '8773'], { stdio: 'pipe', env: { ...process.env, CSP } }); await new Promise((r) => srv.stdout.once('data', r));
process.on('exit', () => { try { srv.kill(); } catch (e) {} });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const MSG = 'This viewer blocks WebAssembly, so Python cannot start here. Download the HTML file and open it in Chrome.';
let fails = 0; const expect = (ok, w) => { console.log(ok ? 'OK  ' : 'FAIL', w); if (!ok) fails++; };
for (const [name, url] of [['site', 'http://localhost:8773/site/index.html'], ['single file', 'http://localhost:8773/dist/PanelGuard_Defect_Inspection_Lab_v1.1.html']]) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }); await mirrorCDN(ctx); const page = await ctx.newPage();
  const uncaught = [], cons = []; hits.length = 0;
  page.on('pageerror', (e) => uncaught.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') cons.push(m.type() + ': ' + m.text().slice(0, 160)); });
  await page.goto(url);
  await page.waitForFunction(() => window.PG && window.PG.K.blocked, null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const st = await page.evaluate(() => ({ blocked: !!window.PG.K.blocked, ready: window.PG.K.ready, lerr: document.getElementById('lerr').innerText, ktext: document.getElementById('ktext').textContent, stage: (document.getElementById('stage') || {}).innerText || '', cur: window.PG.S.cur }));
  expect(st.blocked && !st.ready && st.lerr.includes(MSG), name + ': plain message shown (' + st.ktext + ')');
  expect(hits.filter((h) => /pyodide/.test(h)).length === 0, name + ': Pyodide never requested (' + hits.length + ' CDN hits)');
  expect(st.cur === '0a' && st.stage.length > 20, name + ': Step 0 page usable (stage drawn)');
  await page.locator('#revbtn').click(); await page.waitForTimeout(300);           // review mode: open later no-Python pages directly
  for (const id of ['0b', '0d', '5a']) { await page.evaluate((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(900);
    expect(await page.evaluate((i) => window.PG.S.cur === i && document.getElementById('stage').innerText.length > 20, id), name + ': no-Python page ' + id + ' works'); }
  await page.evaluate(() => { location.hash = '#sub-1a'; }); await page.waitForTimeout(600);
  expect(await page.evaluate((m) => document.getElementById('runbtn').disabled && document.getElementById('runbtn').dataset.why === m, MSG), name + ': a Python cell says why RUN is off');
  await page.screenshot({ path: shots + '/wasm_block_' + name.replace(' ', '_') + '.png' });
  expect(uncaught.length === 0, name + ': zero uncaught errors' + (uncaught.length ? ' ' + JSON.stringify(uncaught) : ''));
  console.log('   console messages (browser CSP reports are expected):', JSON.stringify(cons.slice(0, 6)));
  expect(!cons.some((c) => /wasm instantiation failed|DataCloneError|\[object /.test(c)), name + ': no Pyodide wasm warning, no raw objects logged');
  await ctx.close();
}
await browser.close(); process.exit(fails ? 1 : 0);
