// Dev measurement (not a test): lab start-up with and without the guide code, guide open and diagram switch times.
// node perf.mjs <with.html> <without.html>
import { chromium } from 'playwright'; import { mirrorCDN } from '../../tests/cdn.mjs';
const [withF, noF] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
async function run(file, guide) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }); await mirrorCDN(ctx);
  await ctx.addInitScript(() => { try { localStorage.setItem('pgd-hint-v3', '1'); } catch (e) {} });
  const page = await ctx.newPage(); const t0 = Date.now();
  await page.goto('file://' + file);
  await page.waitForFunction(() => window.PG && window.PG.pack && window.PG.pack(), null, { timeout: 180000 });
  const ready = Date.now() - t0;
  const nav = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) }; });
  let open = null, sw = null;
  if (guide) {
    open = await page.evaluate(() => { const t = performance.now(); window.PGDiagram.open('0a', 'diagram'); return performance.now() - t; });
    sw = await page.evaluate(() => { const ids = ['1c', '3c', '5a', '6f', '7a', '8c', '8g', '2e', '4b', '0d']; const out = []; for (const id of ids) { const t = performance.now(); window.PGDiagram.open(id, 'diagram'); out.push(performance.now() - t); } return { max: Math.max(...out), mean: out.reduce((a, b) => a + b) / out.length }; });
  }
  await ctx.close(); return { ready, ...nav, open, sw };
}
for (const [name, f, g] of [['without guide', noF, false], ['with guide', withF, true]]) {
  const R = []; for (let i = 0; i < 3; i++) R.push(await run(f, g));
  const med = (k) => R.map((r) => r[k]).sort((a, b) => a - b)[1];
  console.log(name, JSON.stringify({ domContentLoaded: med('dcl'), load: med('load'), labReady: med('ready'), guideOpenMs: g ? Math.round(R[1].open) : null, switchMs: g ? { max: Math.round(R[1].sw.max), mean: Math.round(R[1].sw.mean) } : null }));
}
await browser.close();
