// AUDIT re-run of ONLY the checks that failed (v1.1), on the student's finished LIVE-model session (persistent profile).
import { chromium } from 'playwright'; import { mirrorCDN } from '../tests/cdn.mjs';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url'; import { fill } from '../tests/fills.mjs'; import { loadSteps } from '../tests/seed.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const { SUBS } = loadSteps();
const DIST = process.env.DIST || path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v1.1.html');
const ctx = await chromium.launchPersistentContext(process.env.PROFILE || '/tmp/audit_prof', { executablePath: '/usr/bin/google-chrome', headless: true, viewport: { width: 1366, height: 768 } });
await mirrorCDN(ctx); const page = ctx.pages()[0] || await ctx.newPage(); const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a); const fails = [];
const expect = (ok, what) => { log(ok ? 'OK  ' : 'FAIL', what); if (!ok) fails.push(what); };
const ev = (f, a) => page.evaluate(f, a);
const open = async (id) => { await ev((i) => { if (location.hash === '#sub-' + i) location.hash = '#x'; }, id); await page.waitForTimeout(100); await ev((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(900); };
const refCode = (id) => { let c = fill(SUBS[id].code, SUBS[id].ref || []); for (const f of SUBS[id].fixes || []) c = c.split(f[0]).join(f[1]); return c; };
const run = async (id, code) => { await page.locator('.edw textarea').first().fill(code); await page.locator('#runbtn').click({ noWaitAfter: true });
  await page.waitForFunction((i) => window.PG.VERD[i] != null && window.PG.running() == null, id, { timeout: 1800000 }); await page.waitForTimeout(300);
  return { v: await ev((i) => window.PG.VERD[i], id), err: await ev(() => (document.getElementById('errbox') || {}).innerText || '') }; };
await page.goto('file://' + DIST); await page.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['8e'], null, { timeout: 2400000 });
expect(await ev(() => /v1\.1/.test(document.title)), 'running ' + await ev(() => document.title));
expect(await ev(() => window.PG.ORDER.every((i) => window.PG.passed(i))), 'v1.1 replay of the whole live-model session: every substep still passed');
const S7 = SUBS['7g'], f = S7.fixes; log('7g fixes', JSON.stringify(f).slice(0, 300));
for (const [nm, fx] of [['only BUG 1 fixed', [f[0]]], ['only BUG 2 fixed', [f[1]]]]) {
  let c = S7.code; for (const x of fx) c = c.split(x[0]).join(x[1]);
  await open('7g'); const r = await run('7g', c); expect(!r.v.pass && !/^undefined$/.test(r.v.msg), '7g ' + nm + ': fails with ' + (r.v.msg + ' || ' + r.err).replace(/\n/g, ' / ').slice(0, 260));
}
{ const r2 = await run('7g', refCode('7g')); expect(r2.v.pass, '7g reference passes again: ' + r2.v.msg.slice(0, 140)); }
await open('8b'); await page.waitForTimeout(2000);
expect(await page.locator('[data-flag8="dishonest"]').count() === 0, 'no “not an honest test” flag after the re-runs (4c restores the weights exactly; 3f/3g give the same frozen values)');
expect(await ev(() => window.PG.ORDER.every((i) => window.PG.passed(i))), 'every substep still passed after the re-runs');
expect(errors.length === 0, 'zero console errors' + (errors.length ? ' ' + JSON.stringify(errors.slice(0, 3)) : ''));
log('FAILS', fails.length, JSON.stringify(fails)); await ctx.close(); process.exit(0);
