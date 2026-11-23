// Dev helper (not a test): screenshot guide frames. node shot.mjs <id> [w] [h] [frames e.g. 0,1,2] [tab]
import { chromium } from 'playwright'; import { mirrorCDN } from '../../tests/cdn.mjs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(here, '../../../dist/PanelGuard_Refined_Student_Lab_v' + (process.env.GV || '3.0') + '.html');
const [id = '1a', w = '1366', h = '768', fr = '0', tab = 'diagram'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h } }); await mirrorCDN(ctx); const page = await ctx.newPage();
const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
await page.goto('file://' + DIST);
await page.waitForFunction(() => window.PG && window.PG.pack && window.PG.pack(), null, { timeout: 120000 });
if (process.env.UNLOCK) await page.evaluate(() => { window.__pgdUnlock = true; });
await page.evaluate(([i, t]) => window.PGDiagram.open(i, t), [id, tab]);
await page.waitForTimeout(400);
for (const f of fr.split(',')) {
  if (tab === 'diagram') await page.evaluate((k) => { const p = document.querySelector('#pgd-panel'); if (p._pgd) { window.PGD._sess[document.querySelector('.pgd-dia').dataset.dia].max = 9; p._pgd.go(k); } }, +f);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.resolve(here, `../shots/dev_${id}_${tab}_${f}_${w}.png`) });
}
console.log('errors', errors);
await browser.close();
