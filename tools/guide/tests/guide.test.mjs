// Diagram guide v2.0 — headless Chrome test of the built single file.
//  1. the lab opens; with the guide closed Step 0a still works (tap the 4 station parts); the launch + "Explain this step" buttons exist
//  2. deep link #guide-1c opens the guide at 1c
//  3. all 55 substeps: open every tab, content present, zero console errors
//  4. the 9 new diagrams: every frame driven by MOUSE (1366x768) and by KEYBOARD (1920x1080), to the end and back via the dots;
//     a screenshot of every frame at both sizes -> tools/guide/shots/g_<id>_f<k>_<w>.png
//  5. print view renders every frame of a new diagram; reduced motion stops the animations
// Run: cd tools/guide/tests && node guide.test.mjs   (env ONLY=1a,0b  limits part 4; PARTS=1,2,3,4,5)
import { chromium } from 'playwright'; import { mirrorCDN } from '../../tests/cdn.mjs'; import path from 'path'; import { fileURLToPath } from 'url'; import fs from 'fs';
const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(here, '../../../dist/PanelGuard_Refined_Student_Lab_v2.0.html');
const SHOTS = path.resolve(here, '../shots'); fs.mkdirSync(SHOTS, { recursive: true });
const NEW = ['0a', '0b', '0c', '0d', '1a', '1b', '1c', '1d', '1e'];
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : NEW;
const PARTS = (process.env.PARTS || '1,2,3,4,5').split(',').map(Number);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a), fails = [];
const expect = (ok, what) => { log(ok ? 'OK  ' : 'FAIL', what); if (!ok) fails.push(what); };
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });

async function openPage(w, h, hash = '') {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } }); await mirrorCDN(ctx);
  const page = await ctx.newPage(); const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  page.on('dialog', (d) => { errors.push('DIALOG ' + d.type()); d.dismiss(); });
  await page.goto('file://' + DIST + hash);
  await page.waitForFunction(() => window.PG && window.PG.pack && window.PG.pack() && window.PGDiagram, null, { timeout: 180000 });
  await page.evaluate(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  return { ctx, page, errors };
}
const frameOf = (page) => page.evaluate(() => { const p = document.querySelector('#pgd-panel'); return p && p._pgd ? { i: p._pgd.cur(), n: p._pgd.n } : null; });
// target info in screen coordinates
const targets = (page) => page.evaluate(() => {
  const svg = document.querySelector('#pgd-panel .pgd-stage'); if (!svg) return [];
  const r = svg.getBoundingClientRect(), sx = r.width / 960, sy = r.height / 540;
  return [...svg.querySelectorAll('.pgd-target')].map((t, k) => {
    const g = t.querySelector('.pgd-ring').getBoundingClientRect(), to = t.getAttribute('data-pgd-to');
    let tx = null, ty = null; if (to) { const [a, b] = to.split(',').map(Number); tx = r.left + a * sx; ty = r.top + b * sy; }
    return { k, key: t.getAttribute('data-pgd-t'), act: t.getAttribute('data-pgd-act'), x: g.left + g.width / 2, y: g.top + g.height / 2, tx, ty, chip: !t.classList.contains('pgd-nochip') };
  });
});
async function act(page, t, mode) {
  const sel = `#pgd-panel .pgd-stage [data-pgd-t="${t.key}"]`;
  if (mode === 'mouse') {
    if (t.act === 'tap') await page.mouse.click(t.x, t.y);
    else if (t.act === 'hold') { await page.mouse.move(t.x, t.y); await page.mouse.down(); await page.waitForTimeout(1400); await page.mouse.up(); }
    else if (t.act === 'drag') { await page.mouse.move(t.x, t.y); await page.mouse.down(); await page.mouse.move(t.tx, t.ty, { steps: 14 }); await page.mouse.up(); }
    return;
  }
  await page.focus(sel);
  if (t.act === 'tap') await page.keyboard.press('Enter');
  else if (t.act === 'hold') { await page.keyboard.down('Space'); await page.waitForTimeout(1400); await page.keyboard.up('Space'); }
  else if (t.act === 'drag') {
    const f0 = await frameOf(page);
    for (let n = 0; n < 80; n++) {
      const cur = (await targets(page)).find((q) => q.key === t.key); if (!cur) return;   // frame moved on (live drags)
      const dx = cur.tx - cur.x, dy = cur.ty - cur.y;
      if (Math.abs(dx) < 9 && Math.abs(dy) < 9) break;
      await page.focus(sel);
      await page.keyboard.press(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp'));
      const f1 = await frameOf(page); if (f1.i !== f0.i) return;
    }
    if ((await targets(page)).find((q) => q.key === t.key)) { await page.focus(sel).catch(() => {}); await page.keyboard.press('Enter'); }
  }
}
async function drive(page, id, mode, w) {
  await page.evaluate((i) => { window.PGD.reset(i); window.PGDiagram.open(i, 'diagram'); }, id);
  await page.waitForTimeout(300);
  let f = await frameOf(page), steps = 0, shots = 0;
  const seen = new Set();
  while (f && steps < 60) {
    if (!seen.has(f.i)) { seen.add(f.i); await page.waitForTimeout(700); await page.screenshot({ path: `${SHOTS}/g_${id}_f${f.i + 1}_${w}.png` }); shots++; }
    const ts = await targets(page); if (!ts.length) break;
    const t = ts.find((q) => q.chip) || ts[0];
    await act(page, t, mode); steps++;
    await page.waitForTimeout(160);
    f = await frameOf(page);
  }
  const end = await frameOf(page);
  expect(end && end.i === end.n - 1 && seen.size === end.n, `${id} ${mode}: reached the last frame (${end && end.i + 1}/${end && end.n}) in ${steps} actions, ${shots} screenshots`);
  if (!end || end.i !== end.n - 1) return;
  // back to frame 1 via the dots, then forward to the last one
  await page.click('#pgd-panel .pgd-dot[data-k="0"]'); let b = await frameOf(page);
  const tgt = (await targets(page)).length;
  await page.click(`#pgd-panel .pgd-dot[data-k="${end.n - 1}"]`); const e2 = await frameOf(page);
  expect(b.i === 0 && tgt > 0 && e2.i === end.n - 1, `${id} ${mode}: dots go back to frame 1 (target shown again) and forward to the last`);
}

/* ---------- 1 + 2 + 3 ---------- */
if (PARTS.some((p) => p <= 3)) {
  const { ctx, page, errors } = await openPage(1366, 768);
  if (PARTS.includes(1)) {
    await page.evaluate(() => { location.hash = '#sub-0a'; }); await page.waitForTimeout(600);
    expect(await page.evaluate(() => !!document.querySelector('#pgd-launch') && !!document.querySelector('.pgd-help')), 'lab: Diagram guide launch button + "Explain this step" button present');
    const keys = await page.evaluate(() => [...document.querySelectorAll('#stage .hot')].map((e) => e.getAttribute('data-key')));
    for (const k of keys) { await page.click(`#stage .hot[data-key="${k}"]`); await page.waitForTimeout(150); }
    expect(await page.evaluate(() => !!(window.PG.S.subs['0a'] && window.PG.S.subs['0a'].mech.done)) && keys.length >= 4, `lab: Step 0a works with the guide closed (${keys.length} station parts tapped, done)`);
    expect(!(await page.evaluate(() => window.PGDiagram.isOpen())), 'lab: the guide stays closed');
    await page.screenshot({ path: `${SHOTS}/g_lab_0a_1366.png` });
    await page.click('#pgd-launch'); await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.PGDiagram.isOpen() && window.PGDiagram.selected() === window.PG.S.cur), 'launch button opens the guide at the current lab substep');
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    expect(!(await page.evaluate(() => window.PGDiagram.isOpen())), 'Esc closes the guide');
    await page.click('.pgd-help'); await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.PGDiagram.isOpen() && window.PGDiagram.selected() === '0a'), '"Explain this step" opens the guide at 0a');
    await page.click('[data-guide=close]'); await page.waitForTimeout(200);
  }
  if (PARTS.includes(3)) {
    await page.evaluate(() => window.PGDiagram.open('0a'));
    const ids = await page.evaluate(() => [...document.querySelectorAll('.pgd-list [data-lesson]')].map((b) => b.dataset.lesson));
    expect(ids.length === 55, `step list has 55 substeps (${ids.length})`);
    const soon = await page.evaluate(() => [...document.querySelectorAll('.pgd-list .pgd-soon')].length);
    expect(soon === 46, `46 substeps tagged "new diagram coming" (${soon})`);
    let bad = [];
    for (const id of ids) {
      const e0 = errors.length;
      await page.click(`.pgd-list [data-lesson="${id}"]`);
      const tabs = await page.evaluate(() => [...document.querySelectorAll('.pgd-tabs [data-tab]')].map((b) => b.dataset.tab));
      for (const t of tabs) {
        await page.click(`#pgd-tab-${t}`);
        const ok = await page.evaluate((tt) => { const p = document.querySelector('#pgd-panel'); if (tt === 'diagram') return !!p.querySelector('svg') && p.querySelector('svg').innerHTML.length > 500; return p.innerText.trim().length > 40; }, t);
        if (!ok) bad.push(id + ':' + t);
      }
      if (errors.length > e0) bad.push(id + ' errors: ' + errors.slice(e0).join(' | '));
    }
    expect(bad.length === 0, 'all 55 substeps x all tabs render with zero console errors' + (bad.length ? ' — ' + bad.slice(0, 8).join('; ') : ''));
    await page.click('.pgd-list [data-lesson="2b"]'); await page.click('#pgd-tab-diagram'); await page.waitForTimeout(200); await page.screenshot({ path: `${SHOTS}/g_legacy_2b_1366.png` });
    await page.click('#pgd-tab-code'); await page.waitForTimeout(100); await page.screenshot({ path: `${SHOTS}/g_code_2b_1366.png` });
    await page.click('#pgd-tab-overview'); await page.waitForTimeout(100); await page.screenshot({ path: `${SHOTS}/g_overview_2b_1366.png` });
    await page.click('#pgd-tab-practice'); await page.waitForTimeout(100); await page.screenshot({ path: `${SHOTS}/g_practice_2b_1366.png` });
    // search + filter + prev/next
    await page.fill('#pgd-search', 'stratify'); await page.waitForTimeout(100);
    const hits = await page.evaluate(() => [...document.querySelectorAll('.pgd-list [data-lesson]')].map((b) => b.dataset.lesson));
    expect(hits.includes('1d'), `search "stratify" finds 1d (${hits.join(',')})`);
    await page.fill('#pgd-search', ''); await page.selectOption('#pgd-stage', '5'); await page.waitForTimeout(100);
    const s5 = await page.evaluate(() => [...document.querySelectorAll('.pgd-list [data-lesson]')].map((b) => b.dataset.lesson));
    expect(s5.length === 7 && s5.every((x) => x[0] === '5'), `stage filter Step 5 shows 7 substeps (${s5.length})`);
    await page.selectOption('#pgd-stage', 'all');
    await page.click('.pgd-list [data-lesson="1e"]'); await page.click('[data-guide=next]');
    expect(await page.evaluate(() => window.PGDiagram.selected() === '2a' && location.hash === '#guide-2a'), 'Next step goes 1e -> 2a and the deep link follows (#guide-2a)');
    await page.click('[data-guide=prev]'); expect(await page.evaluate(() => window.PGDiagram.selected() === '1e'), 'Previous step goes back to 1e');
    await page.click('[data-guide=close]');
  }
  expect(errors.length === 0, 'parts 1/3: zero console errors' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 4)) : ''));
  await ctx.close();
}
if (PARTS.includes(2)) {
  const { ctx, page, errors } = await openPage(1366, 768, '#guide-1c');
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.PGDiagram.isOpen() && window.PGDiagram.selected() === '1c'), 'deep link #guide-1c opens the guide at 1c');
  expect(errors.length === 0, 'deep link: zero console errors' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 4)) : ''));
  await ctx.close();
}

/* ---------- 4: the new diagrams, mouse at 1366 and keyboard at 1920 ---------- */
if (PARTS.includes(4)) {
  for (const [mode, w, h] of [['mouse', 1366, 768], ['keyboard', 1920, 1080]]) {
    const { ctx, page, errors } = await openPage(w, h);
    for (const id of ONLY) { const e0 = errors.length; await drive(page, id, mode, w); if (errors.length > e0) expect(false, `${id} ${mode}: console errors ${errors.slice(e0).join(' | ')}`); }
    expect(errors.length === 0, `part 4 ${mode}: zero console errors` + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 4)) : ''));
    await ctx.close();
  }
}

/* ---------- 5: print + reduced motion ---------- */
if (PARTS.includes(5)) {
  const { ctx, page, errors } = await openPage(1366, 768);
  for (const id of ONLY) {
    await page.evaluate((i) => window.PGDiagram.open(i, 'diagram'), id);
    await page.click('[data-guide=print]'); await page.waitForTimeout(200);
    const r = await page.evaluate((i) => ({ printed: window.__printed, frames: document.querySelectorAll('.pgd-print .pgd-pframe').length, n: document.querySelector('#pgd-panel')._pgd.n,
      empty: [...document.querySelectorAll('.pgd-print .pgd-pstage')].filter((s) => s.innerHTML.length < 800).length }), id);
    expect(r.frames === r.n && r.empty === 0 && r.printed > 0, `${id} print: ${r.frames}/${r.n} frames as static pictures (empty ${r.empty})`);
    if (id === '1a' || id === '0b') { await page.emulateMedia({ media: 'print' }); await page.screenshot({ path: `${SHOTS}/g_print_${id}.png`, fullPage: true }); await page.emulateMedia({ media: 'screen' }); }
    await page.evaluate(() => { document.body.classList.remove('pgd-printing'); });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => { window.PGD.reset('0a'); window.PGDiagram.open('0a', 'diagram'); });
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.pgd-target .pgd-ring > *')).animationName);
  expect(anim === 'none', 'reduced motion: the target pulse is off (' + anim + ')');
  expect(errors.length === 0, 'part 5: zero console errors' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 4)) : ''));
  await ctx.close();
}
log('FAILS:', fails.length, fails.length ? JSON.stringify(fails) : '');
await browser.close(); process.exit(fails.length ? 1 : 0);
