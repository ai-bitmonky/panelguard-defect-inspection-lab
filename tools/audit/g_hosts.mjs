// AUDIT scope G: the three host modes from an empty browser. Each: Python + TF.js start, review "Run up to here" on 3a
// (runs every Python cell 1a-2e, then the first JS cell), zero console errors / uncaught rejections; storage note.
// Modes: site (http), file (dist via file://), srcdoc (sandbox allow-scripts allow-same-origin), srcdoc-noorigin (allow-scripts only: storage blocked).
import { chromium } from 'playwright'; import { mirrorCDN } from '../tests/cdn.mjs'; import { spawn } from 'child_process';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site'); const shots = path.resolve(here, 'shots');
const DIST = process.env.DIST || path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v1.0.html');
const MODES = (process.env.MODES || 'site,file,srcdoc,srcdoc-noorigin').split(',');
const PORT = 8791; const srv = spawn('node', [path.resolve(here, '../serve.mjs'), site, String(PORT)], { stdio: 'pipe' }); await new Promise((r) => srv.stdout.once('data', r));
process.on('exit', () => { try { srv.kill(); } catch (e) {} });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a); const fails = []; const out = {};
const expect = (ok, what) => { log(ok ? 'OK  ' : 'FAIL', what); if (!ok) fails.push(what); };
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
for (const mode of MODES) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }); await mirrorCDN(ctx);
  await ctx.addInitScript(() => { window.addEventListener('unhandledrejection', (e) => { try { console.error('UNHANDLED REJECTION ' + String(e.reason && (e.reason.message || e.reason))); } catch (x) {} }); });
  const page = await ctx.newPage(); const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  const t0 = Date.now(); let F = page;
  const frame = async () => { for (let i = 0; i < 100; i++) { const x = page.frames().find((q) => q.url().startsWith('about:srcdoc')); if (x) return x; await page.waitForTimeout(100); } return null; };
  const load = async () => {
    if (mode === 'site') { await page.goto(`http://localhost:${PORT}/index.html`); F = page; }
    else if (mode === 'file') { await page.goto('file://' + DIST); F = page; }
    else { await page.goto(`http://localhost:${PORT}/data/labels.json`); const sb = mode === 'srcdoc' ? 'allow-scripts allow-same-origin' : 'allow-scripts';
      await page.setContent(`<style>body{margin:0}</style><iframe id=f sandbox="${sb}" style="width:100vw;height:100vh;border:0"></iframe>`);
      await page.evaluate((h) => { document.getElementById('f').srcdoc = h; }, fs.readFileSync(DIST, 'utf8')); await page.waitForTimeout(1500); F = await frame(); }
  };
  try {
    await load();
    await F.waitForFunction(() => window.PG && window.PG.S, null, { timeout: 120000 });
    const store = await F.evaluate(() => { try { localStorage.setItem('x', '1'); localStorage.removeItem('x'); return 'ok'; } catch (e) { return 'blocked: ' + e.name; } });
    // review mode: the button reloads; in a sandbox without same-origin the choice cannot be stored, so use the hash route
    await F.locator('#revbtn').click(); await page.waitForTimeout(1500);
    await F.waitForFunction(() => window.PG && window.PG.S, null, { timeout: 120000 });
    const rv = await F.evaluate(() => window.PG.review());
    await F.waitForFunction(() => window.PG.ready() && window.PG.JSR.ready, null, { timeout: 900000 });
    const kern = await F.evaluate(() => ({ py: window.PG.K.mode, js: window.PG.JSR.backend }));
    let ran = null;
    if (rv) { await F.evaluate(() => { location.hash = '#sub-3a'; }); await page.waitForTimeout(1200);
      await F.locator('#runupto').click(); await F.waitForFunction(() => !window.PG.runningUpTo(), null, { timeout: 1800000 }); await page.waitForTimeout(800);
      ran = await F.evaluate(() => ({ v3a: window.PG.VERD['3a'], v2e: window.PG.VERD['2e'], stat: (document.getElementById('rvstat') || {}).textContent })); }
    const note = await F.evaluate(() => document.body.innerText.match(/[^\n]*(cannot save|not be saved|storage)[^\n]*/i));
    await page.screenshot({ path: `${shots}/g_${mode}.png` });
    out[mode] = { store, review: rv, kern, ran, storageNote: note && note[0], sec: (Date.now() - t0) / 1000, errors };
    expect(rv && ran && ran.v3a && ran.v3a.pass && ran.v2e && ran.v2e.pass, mode + ': Python (1a-2e) + TF.js (3a) run in review mode (' + JSON.stringify(kern) + ', storage ' + store + ', ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s) ' + (ran ? ran.stat : 'review did not turn on'));
    expect(errors.length === 0, mode + ': zero console errors / uncaught rejections' + (errors.length ? ' ' + JSON.stringify(errors.slice(0, 4)) : ''));
    if (store !== 'ok') log(mode, 'storage blocked; any notice to the student:', note ? note[0] : 'NONE');
  } catch (e) { expect(false, mode + ': threw ' + e.message.split('\n')[0]); out[mode] = { errors, threw: e.message.slice(0, 300) }; await page.screenshot({ path: `${shots}/g_${mode}_THROW.png` }); }
  await ctx.close();
}
fs.writeFileSync(path.resolve(here, 'g_hosts_results.json'), JSON.stringify({ out, fails }, null, 1));
log('FAILS', fails.length, JSON.stringify(fails)); await browser.close(); srv.kill(); process.exit(0);
