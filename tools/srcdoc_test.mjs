// The single file inside about:srcdoc frames (the hosting preview), three sandbox variants:
// it must load, start Python AND TensorFlow.js, with zero console errors. (Full Step 3 in a srcdoc frame: TARGET=srcdoc node tests/s3_e2e.mjs)
import { chromium } from 'playwright'; import { mirrorCDN } from './tests/cdn.mjs';
import fs from 'fs';
const f = fs.readdirSync('../dist').filter((x) => /v0\.3\.html$/.test(x))[0];
const html = fs.readFileSync('../dist/' + f, 'utf8');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true }); const ctx = await b.newContext(); await mirrorCDN(ctx); const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
let bad = 0;
for (const sb of ['allow-scripts', 'allow-scripts allow-same-origin', null]) {
  errs.length = 0;
  await p.setContent('<iframe id=f style="width:1300px;height:700px"></iframe>');
  await p.evaluate(([h, sb]) => { const f = document.getElementById('f'); if (sb !== null) f.setAttribute('sandbox', sb); f.srcdoc = h; }, [html, sb]);
  const fr = await (async () => { for (let i = 0; i < 50; i++) { const x = p.frames().find((q) => q.url() === 'about:srcdoc'); if (x) return x; await p.waitForTimeout(100); } return p.frames()[1]; })();
  const t0 = Date.now();
  const ok = await fr.waitForFunction(() => window.PG && window.PG.K.ready && window.PG.JSR.ready, null, { timeout: 240000 }).then(() => true, () => false);
  const st = await fr.evaluate(() => ({ py: document.getElementById('ktext').textContent, tf: document.getElementById('tstat').textContent, mode: window.PG.K.mode, ls: (() => { try { localStorage.setItem('x', '1'); return 'localStorage ok'; } catch (e) { return 'localStorage blocked'; } })(),
    idb: (() => { try { return typeof indexedDB !== 'undefined' && indexedDB ? 'indexedDB present' : 'no indexedDB'; } catch (e) { return 'indexedDB blocked'; } })(), title: document.title })).catch((e) => ({ err: e.message }));
  console.log('sandbox=', sb, '| ready:', ok, 'in', ((Date.now() - t0) / 1000).toFixed(0) + 's |', JSON.stringify(st), '\n  errs:', errs.slice(0, 4));
  if (!ok || errs.length) bad++;
}
await b.close(); process.exit(bad ? 1 : 0);
