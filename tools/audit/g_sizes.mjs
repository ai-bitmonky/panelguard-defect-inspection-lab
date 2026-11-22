// AUDIT scope G (sizes): every page 0a-8g at 1366x768 and 1920x1080, on the student's own finished session (persistent profile
// from a_student.mjs, live model). Screenshot each page (work panel + output panel scrolled to the top, then the output panel
// scrolled to the end) and machine-check: page scrolls sideways, text clipped by overflow:hidden, elements sticking out of their panel.
import { chromium } from 'playwright'; import { mirrorCDN } from '../tests/cdn.mjs';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const shots = path.resolve(here, process.env.SHOTDIR || 'shots_sizes'); fs.mkdirSync(shots, { recursive: true });
const DIST = process.env.DIST || path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v1.0.html');
const PROFILE = process.env.PROFILE || '/tmp/audit_prof'; const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const ctx = await chromium.launchPersistentContext(PROFILE, { executablePath: '/usr/bin/google-chrome', headless: true, viewport: { width: 1366, height: 768 } });
await mirrorCDN(ctx); const page = ctx.pages()[0] || await ctx.newPage(); const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
await page.goto('file://' + DIST); await page.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['8e'], null, { timeout: 2400000 });
log('rebuilt'); const ORDER = ONLY || await page.evaluate(() => window.PG.ORDER); const R = {};
const AUDIT = () => {
  const out = [], W = innerWidth; const desc = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ' “' + (e.innerText || e.textContent || '').trim().slice(0, 40).replace(/\n/g, ' ') + '”';
  if (document.documentElement.scrollWidth > W + 1) out.push('page scrolls sideways: ' + document.documentElement.scrollWidth + ' > ' + W);
  const scroller = (el, stop) => { for (let p = el.parentElement; p && p !== stop; p = p.parentElement) { const c = getComputedStyle(p); if (/auto|scroll/.test(c.overflowX) || /auto|scroll/.test(c.overflow)) return true; } return false; };
  for (const sel of ['#work', '#out', '#nav', '.top']) { const P = document.querySelector(sel); if (!P) continue; const pr = P.getBoundingClientRect();
    for (const el of P.querySelectorAll('*')) {
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const txt = (el.innerText || '').trim();
      if (txt && /hidden|clip/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 2 && cs.textOverflow !== 'ellipsis' && el.clientWidth > 0) out.push('text clipped (x) in ' + sel + ': ' + desc(el) + ' ' + el.scrollWidth + '>' + el.clientWidth);
      if (txt && /hidden|clip/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0 && !/^-webkit-box$/.test(cs.display)) out.push('text clipped (y) in ' + sel + ': ' + desc(el) + ' ' + el.scrollHeight + '>' + el.clientHeight);
      const r = el.getBoundingClientRect(); if (r.width > 0 && r.right > pr.right + 3 && !scroller(el, P) && sel !== '.top') out.push('sticks out of ' + sel + ' by ' + Math.round(r.right - pr.right) + 'px: ' + desc(el));
    } }
  return [...new Set(out)].slice(0, 25);
};
for (const [w, h] of (process.env.SIZES || '1366x768,1920x1080').split(',').map((x) => x.split('x').map(Number))) {
  await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(600);
  for (const id of ORDER) {
    await page.evaluate((i) => { if (location.hash === '#sub-' + i) location.hash = '#x'; }, id); await page.waitForTimeout(80); await page.evaluate((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(1300);
    await page.evaluate(() => { for (const s of ['#work', '#out']) { const e = document.querySelector(s); if (e) e.scrollTop = 0; } });
    const a = await page.evaluate(AUDIT); await page.screenshot({ path: `${shots}/${w}_${id}_a.png` });
    await page.evaluate(() => { for (const s of ['#work', '#out']) { const e = document.querySelector(s); if (e) e.scrollTop = e.scrollHeight; } }); await page.waitForTimeout(300);
    const b = await page.evaluate(AUDIT); await page.screenshot({ path: `${shots}/${w}_${id}_b.png` });
    R[w + '_' + id] = [...new Set([...a, ...b])]; if (R[w + '_' + id].length) log(w, id, JSON.stringify(R[w + '_' + id]).slice(0, 600));
  }
}
fs.writeFileSync(path.resolve(here, process.env.OUTJ || 'g_sizes_results.json'), JSON.stringify({ R, errors }, null, 1));
log('pages with machine findings:', Object.values(R).filter((x) => x.length).length, 'of', Object.keys(R).length, '| console errors', errors.length, JSON.stringify(errors.slice(0, 3)));
await ctx.close(); process.exit(0);
