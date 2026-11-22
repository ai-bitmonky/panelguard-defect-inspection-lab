// item 8: phone 390x844 and tablet 768x1024 (+ tablet landscape 1024x768): the note, then "Show it anyway" on a few pages
import { chromium } from 'playwright'; import { mirrorCDN } from '../tests/cdn.mjs'; import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const out = path.resolve(here, 'shots_small'); fs.mkdirSync(out, { recursive: true });
const ctx = await chromium.launchPersistentContext(process.env.PROFILE || '/tmp/audit_prof', { executablePath: '/usr/bin/google-chrome', headless: true, viewport: { width: 390, height: 844 } });
await mirrorCDN(ctx); const p = ctx.pages()[0] || await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('file://' + process.env.DIST); await p.waitForFunction(() => window.PG && window.PG.S, null, { timeout: 120000 }); await p.waitForTimeout(3000);
for (const [w, h] of (process.env.SIZES || '390x844,768x1024,1024x768').split(',').map((x) => x.split('x').map(Number))) {
  await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(600);
  const shown = await p.evaluate(() => getComputedStyle(document.getElementById('small')).display !== 'none'); console.log(w + 'x' + h, 'note shown:', shown);
  await p.screenshot({ path: `${out}/${w}x${h}_note.png` });
  if (shown) await p.locator('#smallgo').click();
  for (const id of ['0a', '3e', '7g']) { await p.evaluate((i) => { location.hash = '#sub-' + i; }, id); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/${w}x${h}_${id}.png` });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth); console.log('  ', id, 'page width', sw, 'viewport', w); }
  await p.evaluate(() => document.body.classList.remove('bigok'));
}
console.log('errors', JSON.stringify(errs)); await ctx.close();
