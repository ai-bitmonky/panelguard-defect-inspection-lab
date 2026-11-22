/* PanelGuard Step 8 visuals and hands-on mechanics: freeze sheet + range guess + seal (8a), trial card (8b), lever (8c),
   interval (8c), drift matrix (8d), own photo + learning curve + shopping list (8e), acceptance sheet + stamp (8f),
   the line recap + final test + take it home (8g). Every number comes from the student's own runs. */
(function () {
'use strict';
var H = function () { return window.PGViz._h; };
function el(t, c, h) { return H().el(t, c, h); }
function card(p, t, s) { return H().card(p, t, s); }
function tiles(p, l) { return H().tiles(p, l); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function U() { return window.PG_STEP8_UTIL; }
function f0(x) { return x == null || isNaN(x) ? '?' : Math.round(x).toLocaleString('en-US'); }
function f1(x) { return x == null || isNaN(x) ? '?' : (Math.round(10 * x) / 10).toFixed(1); }
function f3(x) { return x == null || isNaN(x) ? '?' : (+x).toFixed(3); }
function noData(host, api, what) { host.appendChild(el('div', 'verdict', api.review ? 'Review mode: press “Run up to here” (below the code) to load real data for this page.' : what)); }
function shake(e) { if (e && e.animate) e.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 }); }
var C = { cy: '#46e3ff', am: '#ffb547', gr: '#3dffa0', rd: '#ff4d6a', vi: '#a98bff', dim: '#8d9bb0', ink: '#e6eef8' };
function why(e, title) {
  if (!e) return el('span');
  var d = el('details', 'why');
  d.innerHTML = '<summary>' + esc(title || 'WHY (tap to open)') + '</summary><div class="wb">' +
    '<div class="lab">WHAT WAS ASKED</div>' + e.asked + '<div class="lab">HOW TO GET IT, STEP BY STEP</div><ol>' + e.steps.filter(Boolean).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' +
    (e.page ? '<div class="lab">WHERE YOU SAW IT</div>' + e.page : '') + '<div class="lab">COMMON TRAP</div>' + e.trap + '<div class="rem">⟶ ' + e.remember + '</div></div>';
  return d;
}
/* the plain honesty flag on every test result */
function flag(host, h) {
  if (!h) return;
  if (h.frozen && h.ok === false) {
    var d = el('div', 'verdict bad', '<b style="font-size:17px">⚠ NOT AN HONEST TEST ANY MORE.</b> After the seal broke, these frozen values changed: <b>' + esc(h.changed.join(', ')) + '</b>. The test tray now helped to choose the settings, so its numbers are too hopeful. An honest test needs a NEW sealed tray.');
    d.setAttribute('data-flag8', 'dishonest'); host.appendChild(d);
  } else if (h.frozen && h.ok) { var g = el('div', 'hint', '🔒 Frozen since the seal broke' + (h.at ? ' (' + esc(h.at) + ')' : '') + ': model, blend, gates and flow unchanged.'); g.setAttribute('data-flag8', 'honest'); host.appendChild(g); }
  else if (!h.frozen) host.appendChild(el('div', 'hint', 'No freeze sheet recorded here' + (window.PG && window.PG.review && window.PG.review() ? ' (review mode)' : '') + '.'));
}
/* a number line 0..max ("defects passed per 100") with bands, dots and marks; returns an SVG string */
function numLine(o) {
  var W = 600, H0 = o.h || 86, x0 = 24, x1 = W - 16, mx = o.max || 20, X = function (v) { return x0 + (x1 - x0) * Math.max(0, Math.min(mx, v)) / mx; }, y = H0 - 26, s = '';
  (o.bands || []).forEach(function (b, i) { var yy = y - 14 - (o.gap || 13) * i; s += '<rect x="' + X(b.a) + '" y="' + (yy - 5) + '" width="' + Math.max(2, X(b.b) - X(b.a)) + '" height="10" rx="5" fill="' + b.c + '" opacity="' + (b.o || 0.55) + '"' + (b.dash ? ' stroke="' + b.c + '" stroke-dasharray="4 3" fill-opacity="0.12"' : '') + '/>' + (b.label ? '<text x="' + (X(b.b) + 5) + '" y="' + (yy + 4) + '" font-size="11" fill="' + b.c + '">' + esc(b.label) + '</text>' : ''); });
  s += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + y + '" y2="' + y + '" stroke="#3a4658" stroke-width="2"/>';
  for (var v = 0; v <= mx; v++) { var big = v % (o.major || 5) === 0; s += '<line x1="' + X(v) + '" x2="' + X(v) + '" y1="' + (y - (big ? 6 : 3)) + '" y2="' + (y + (big ? 6 : 3)) + '" stroke="#5d6b80"/>' + (big ? '<text x="' + X(v) + '" y="' + (y + 19) + '" font-size="11" fill="#8d9bb0" text-anchor="middle">' + v + '</text>' : ''); }
  if (o.target != null) s += '<line x1="' + X(o.target) + '" x2="' + X(o.target) + '" y1="8" y2="' + (y + 8) + '" stroke="#ffb547" stroke-width="2" stroke-dasharray="5 3"/><text x="' + (X(o.target) + 4) + '" y="16" font-size="11" fill="#ffb547">target ' + o.target + '</text>';
  (o.dots || []).forEach(function (d) { s += '<circle cx="' + X(d.v) + '" cy="' + (d.y != null ? d.y : y) + '" r="' + (d.r || 6) + '" fill="' + d.c + '" stroke="#05070b" stroke-width="1.5"/>' + (d.label ? '<text x="' + X(d.v) + '" y="' + ((d.y != null ? d.y : y) - 10) + '" font-size="11" fill="' + d.c + '" text-anchor="middle">' + esc(d.label) + '</text>' : ''); });
  return '<svg viewBox="0 0 ' + W + ' ' + H0 + '" style="width:100%;height:auto;display:block">' + s + (o.extra || '') + '</svg>';
}
function lockSVG(on) { return '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" fill="' + (on ? '#3dffa0' : 'none') + '" stroke="' + (on ? '#3dffa0' : '#8d9bb0') + '" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0' + (on ? 'v3' : '') + '" fill="none" stroke="' + (on ? '#3dffa0' : '#8d9bb0') + '" stroke-width="2"/></svg>'; }
function thumbOf(api, id, s, border) { try { return H().thumb(api, id, s, border); } catch (e) { return el('span'); } }
function photoCanvas(photo, s) { var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'), im = g.createImageData(64, 64); for (var i = 0; i < 4096; i++) { var v = photo[i]; im.data[4 * i] = im.data[4 * i + 1] = im.data[4 * i + 2] = v; im.data[4 * i + 3] = 255; } g.putImageData(im, 0, 0); c.style.cssText = 'width:' + s + 'px;height:' + s + 'px;image-rendering:pixelated;border-radius:3px'; return c; }

/* ================= 8a: freeze sheet, range guess, the seal ================= */
var LINES = [['model', 'Model', 'your Step 3 CNN weights'], ['bestW', 'Blend weight', 'CNN share in the 3f blend'], ['low', 'Low gate (mono)', 'below it: auto-pass'], ['lowPoly', 'Low gate (poly)', 'below it: auto-pass, poly cells'], ['high', 'High gate', 'from it: auto-stop'], ['flow', 'Flow', 'stations, photo rules, reshoot cap']];
function lineValue(k, f, key) {
  if (k === 'model') return '<code>' + esc((key || 'model').replace(/^indexeddb:\/\//, '')) + '</code> · checksum <b>' + esc(f.model) + '</b> · ' + f0(f.params) + ' numbers';
  if (k === 'flow') return 'check_photo → score → route → person → record · ' + f.maxTries + ' photos max · dark &lt; ' + f.rules[0] + ', blank &lt; ' + f.rules[1] + ', flat &lt; ' + f.rules[2] + ' · sig <b>' + esc(f.flow) + '</b>';
  return '<b>' + (k === 'bestW' ? f[k] : f3(f[k])) + '</b>';
}
function sceneFreeze(s, stage, out, api) {
  var m = api.mech; m.locks = m.locks || {}; if (!m.range) m.range = [2, 8];
  var F = null, val = null, key = (api.getMech('3e') || {}).modelKey;
  function load() { return api.jsEval(function (NS, pg) { var f = U().freezeOf(NS); if (!f || !NS.auditLog || !pg.shiftReport) return null; return { f: f, val: U().valReport(NS, pg), h: U().honesty(NS, pg) }; }); }
  stage.innerHTML = '<div class="hint" style="padding:12px">Reading your frozen settings…</div>';
  load().then(function (x) { if (!x) { stage.innerHTML = ''; noData(stage, api, 'Finish Steps 3–7 first: the freeze sheet reads your model, gates and flow.'); side(); return; } F = x.f; val = x.val; draw(); side(x.h); });
  function allLocked() { return LINES.every(function (l) { return m.locks[l[0]]; }); }
  function draw() {
    stage.innerHTML = '';
    var w = el('div'); w.style.cssText = 'padding:10px 12px'; stage.appendChild(w);
    /* 1. the freeze sheet */
    var sh = el('div'); sh.id = 'freeze8'; sh.style.cssText = 'background:#f2efe6;color:#1b2230;border-radius:8px;padding:10px 14px;box-shadow:0 4px 18px #0008;font-family:Rajdhani,Arial';
    sh.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-family:Orbitron,Arial;letter-spacing:.12em;font-size:13px">FREEZE SHEET · LINE TRIAL</b><span style="font-size:12px;color:#5a6270">tap each line to lock it</span></div>';
    LINES.forEach(function (l) {
      var on = !!m.locks[l[0]], row = el('div');
      row.setAttribute('data-lock8', l[0]); row.style.cssText = 'display:flex;gap:10px;align-items:center;padding:6px 4px;border-top:1px solid #cfc8b8;cursor:' + (on ? 'default' : 'pointer') + ';' + (on ? 'background:#e3eadf' : '');
      row.innerHTML = '<span style="flex:none">' + lockSVG(on).replace(/#8d9bb0/g, '#7a8290').replace(/#3dffa0/g, '#14804a') + '</span><span style="flex:none;width:118px;font-weight:700">' + esc(l[1]) + '</span><span style="flex:1;font-size:14px">' + lineValue(l[0], F, key).replace(/<code>/g, '<code style="background:#e6e1d5;color:#1b2230;border-color:#cfc8b8">') + '<br><span style="font-size:12px;color:#5a6270">' + esc(l[2]) + '</span></span>';
      if (!on) row.onclick = function () { m.locks[l[0]] = 1; api.setMech({ locks: m.locks }); draw(); side(); };
      sh.appendChild(row);
    });
    w.appendChild(sh);
    /* 2. the range guess on a number line (one check) */
    var g = el('div', 'pred'); g.style.marginTop = '12px'; g.id = 'guess8';
    g.innerHTML = '<h3>YOUR GUESS · ONE TRY</h3><p>Of every <b>100 defects on new cells</b>, how many will <b>pass</b> the frozen line? Drag the two ends of the band to the range you expect, then tap “Lock my range”.</p>';
    var nl = el('div'); nl.style.cssText = 'position:relative;user-select:none;touch-action:none'; g.appendChild(nl);
    var res = api.res('8b'), real = res && res.trial ? res.trial.all.per100 : null;
    function drawNL() {
      var dots = [{ v: m.range[0], c: '#46e3ff', r: 9, label: f1(m.range[0]) }, { v: m.range[1], c: '#46e3ff', r: 9, label: f1(m.range[1]) }];
      if (val) dots.push({ v: val.all.per100, c: '#a98bff', r: 5, y: 34, label: 'validation ' + f1(val.all.per100) });
      if (m.rangeLocked && real != null) dots.push({ v: real, c: '#ffb547', r: 7, y: 16, label: 'test ' + f1(real) });
      nl.innerHTML = numLine({ max: 20, target: 5, h: 96, bands: [{ a: m.range[0], b: m.range[1], c: '#46e3ff', o: 0.35 }], dots: dots });
    }
    drawNL();
    if (!m.rangeLocked) {
      var dragging = null;
      var at = function (e) { var r = nl.getBoundingClientRect(), v = (e.clientX - r.left) / r.width * 600; return Math.round(Math.max(0, Math.min(20, (v - 24) / (600 - 40) * 20)) * 2) / 2; };
      nl.addEventListener('pointerdown', function (e) { var v = at(e); dragging = Math.abs(v - m.range[0]) <= Math.abs(v - m.range[1]) ? 0 : 1; nl.setPointerCapture(e.pointerId); move(e); });
      nl.addEventListener('pointermove', function (e) { if (dragging != null) move(e); });
      nl.addEventListener('pointerup', function () { if (dragging != null) { dragging = null; api.setMech({ range: m.range }); } });
      var move = function (e) { var v = at(e); m.range[dragging] = v; if (m.range[0] > m.range[1]) { m.range = [m.range[1], m.range[0]]; dragging = 1 - dragging; } drawNL(); txt.textContent = 'Your range: ' + f1(m.range[0]) + ' to ' + f1(m.range[1]) + ' defects passed per 100.'; };
      var txt = el('div', 'hint', 'Your range: ' + f1(m.range[0]) + ' to ' + f1(m.range[1]) + ' defects passed per 100.'); g.appendChild(txt);
      var lb = el('button', 'btn', 'Lock my range'); lb.id = 'lockrange8';
      var ln = el('span', 'hint', allLocked() ? 'One try. The answer comes after the trial (8b).' : 'Lock all 6 lines of the freeze sheet first.');
      lb.disabled = !allLocked();
      lb.onclick = function () { if (m.range[1] - m.range[0] < 0.5) { ln.textContent = 'Make the band at least 0.5 wide.'; shake(nl); return; } api.setMech({ range: m.range.slice(), rangeLocked: 1 }); m.rangeLocked = 1; draw(); side(); };
      var row = el('div', 'row'); row.style.marginTop = '6px'; row.appendChild(lb); row.appendChild(ln); g.appendChild(row);
    } else if (real == null) g.appendChild(el('div', 'verdict', 'Range locked: <b>' + f1(m.range[0]) + ' to ' + f1(m.range[1]) + '</b> per 100. The answer comes after the trial (8b).'));
    else {
      var inside = real >= m.range[0] && real <= m.range[1];
      g.appendChild(el('div', 'verdict ' + (inside ? 'good' : 'bad'), (inside ? '✓ Inside your range. ' : '✗ Outside your range. ') + 'You said <b>' + f1(m.range[0]) + ' to ' + f1(m.range[1]) + '</b>. The trial: <b>' + res.trial.all.defPassed + ' of ' + res.trial.all.def + ' = ' + f1(real) + ' per 100</b> (validation was ' + f1(res.val.all.per100) + ').'));
      g.appendChild(why({ asked: 'Guess the honest number before you see it: how many of 100 defects on NEW cells pass the frozen line.',
        steps: ['On validation ' + res.val.all.defPassed + ' of ' + res.val.all.def + ' defects passed = ' + f1(res.val.all.per100) + ' per 100. But the gates were TUNED on those cells.',
                'Tuned settings fit their own tray a little too well, so new cells usually do a bit worse.',
                'The test tray has only ' + res.trial.all.def + ' defects: one more or one less escape moves the number by ' + f1(100 / res.trial.all.def) + '. A good guess is a band, not a point.',
                'Real result: ' + f1(real) + ' per 100.'],
        trap: 'Guessing exactly the validation number. The tray you tuned on flatters you.', remember: 'Expect new cells to do a bit worse than the tray you tuned on.' }));
    }
    w.appendChild(g);
    /* 3. the seal: press and hold */
    var sealBox = el('div'); sealBox.style.cssText = 'margin-top:12px;display:flex;gap:14px;align-items:center;flex-wrap:wrap';
    var open = !!m.sealOpen;
    sealBox.innerHTML = '<svg viewBox="0 0 220 120" style="width:240px;flex:none"><rect x="10" y="30" width="200" height="80" rx="8" fill="#151c27" stroke="#3a4658" stroke-width="2"/>' +
      Array.from({ length: 30 }, function (_, i) { return '<rect x="' + (20 + (i % 10) * 19) + '" y="' + (40 + Math.floor(i / 10) * 22) + '" width="15" height="18" rx="2" fill="#2a3442"/>'; }).join('') +
      (open ? '<path d="M10 62 L70 52 L60 72 L120 58 L110 78 L210 64" fill="none" stroke="#ff4d6a" stroke-width="5" stroke-linecap="round" opacity=".7"/><text x="110" y="24" font-size="13" fill="#ffb547" text-anchor="middle" font-family="Orbitron,Arial">OPEN · ONE WAY</text>'
            : '<rect x="0" y="58" width="220" height="16" fill="#ff4d6a"/><text x="110" y="70" font-size="11" fill="#fff" text-anchor="middle" font-family="Orbitron,Arial" letter-spacing="2">SEALED SINCE STEP 1</text><text x="110" y="24" font-size="13" fill="#8d9bb0" text-anchor="middle" font-family="Orbitron,Arial">TEST TRAY</text>') + '</svg>';
    var hold = el('div'); hold.style.cssText = 'flex:1;min-width:220px';
    if (open) hold.innerHTML = '<div class="verdict good" data-seal8="open"><b>Seal broken' + (m.openedAt ? ' at ' + esc(m.openedAt) : '') + '.</b> Everything on the sheet is frozen. Now run the trial in 8b. There is no way to close it again.</div>';
    else {
      var hb = el('button', 'btn'); hb.id = 'seal8'; hb.style.cssText = 'position:relative;overflow:hidden;font-size:16px;padding:12px 18px;border-color:#ff4d6a;min-width:250px';
      hb.innerHTML = '<span style="position:absolute;left:0;top:0;bottom:0;width:0;background:#ff4d6a55" id="sealbar8"></span><span style="position:relative">PRESS AND HOLD 2 s TO BREAK THE SEAL</span>';
      var ready = allLocked() && m.rangeLocked; hb.disabled = !ready;
      hold.appendChild(hb); hold.appendChild(el('div', 'hint', ready ? 'Let go early and nothing happens. Once it breaks, it stays open.' : 'First lock all 6 lines and your range.'));
      var t0 = 0, raf = 0;
      var bar = function () { var k = Math.min(1, (performance.now() - t0) / 2000); hb.querySelector('#sealbar8').style.width = (100 * k) + '%'; if (k >= 1) return breakSeal(); raf = requestAnimationFrame(bar); };
      var stop = function () { if (!t0) return; t0 = 0; cancelAnimationFrame(raf); var b = hb.querySelector('#sealbar8'); if (b) b.style.width = '0'; };
      hb.addEventListener('pointerdown', function (e) { if (hb.disabled) return; e.preventDefault(); t0 = performance.now(); raf = requestAnimationFrame(bar); });
      hb.addEventListener('pointerup', stop); hb.addEventListener('pointerleave', stop); hb.addEventListener('pointercancel', stop);
      hb.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !t0 && !hb.disabled) { e.preventDefault(); t0 = performance.now(); raf = requestAnimationFrame(bar); } });
      hb.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') stop(); });
    }
    sealBox.appendChild(hold); w.appendChild(sealBox);
  }
  function breakSeal() {
    load().then(function (x) {
      if (!x) return;
      var now = new Date(), at = now.toLocaleDateString('en-GB') + ' ' + now.toTimeString().slice(0, 5);
      api.setMech({ sealOpen: 1, frozen: x.f, openedAt: at, done: 1 }); m.sealOpen = 1; F = x.f; draw(); side({ frozen: true, ok: true, changed: [], at: at });
    });
  }
  function side(h) {
    out.innerHTML = '';
    var c = card(out, 'WHAT YOU KNOW SO FAR', 'Validation tray: the cells you tuned the gates on.');
    if (val) tiles(c, [[f1(val.all.per100), 'defects passed per 100 (' + val.all.defPassed + ' of ' + val.all.def + ')', val.all.per100 <= 5 ? 'g' : 'r'], [f0(val.per1000.person), 'to a person per 1,000', 'a'], [val.all.goodStopped + ' of ' + val.all.good, 'good cells stopped', '']]);
    c.appendChild(el('p', null, 'These numbers are a little <b>too hopeful</b>: the gates were chosen on these same cells. The sealed tray (' + (val ? val.n : 525) + ' cells, never used) gives the honest number — <b>once</b>.'));
    var c2 = card(out, 'THE RULE FROM NOW ON', '');
    c2.appendChild(el('ul', null, '<li>Every line on the sheet is frozen.</li><li>If you re-run an earlier cell and a frozen value changes, every test result shows a red <b>“not an honest test any more”</b> flag.</li><li>If the trial misses the target, you report it. You do <b>not</b> move a gate and test again on the same tray.</li>'));
    var st = card(out, 'STATUS', '');
    tiles(st, [[LINES.filter(function (l) { return m.locks[l[0]]; }).length + ' / 6', 'lines locked', allLocked() ? 'g' : ''], [m.rangeLocked ? 'locked' : '—', 'your range', m.rangeLocked ? 'g' : ''], [m.sealOpen ? 'OPEN' : 'sealed', 'test tray', m.sealOpen ? 'a' : '']]);
    if (m.sealOpen) flag(st, h);
  }
  return {};
}

/* ================= 8b: the trial card ================= */
function trialCard(r, host, api) {
  if (!r || r.missing) { noData(host, api, 'Run the cell first.'); return; }
  flag(host, r.honest);
  if (r.review) host.appendChild(el('div', 'hint', 'Review mode: the seal check is skipped here; the student\'s seal is not touched.'));
  var t = r.trial, v = r.val, met = t.all.per100 <= t.target;
  var c = card(host, 'LINE TRIAL · ' + r.n + ' SEALED CELLS', 'Frozen model, blend, gates and flow. One run. A perfect checker answers the person\'s queue (an assumption).');
  var big = el('div'); big.id = 'trial8'; big.setAttribute('data-met', met ? '1' : '0');
  big.style.cssText = 'display:flex;align-items:center;gap:14px;padding:10px 12px;border-radius:10px;border:2px solid ' + (met ? '#1f6b44' : '#6b1f30') + ';background:' + (met ? '#0b2418' : '#2a0e16');
  big.innerHTML = '<div style="font:700 34px Orbitron,Arial;color:' + (met ? C.gr : C.rd) + '">' + f1(t.all.per100) + '</div><div><b style="font-size:17px">' + (met ? 'TARGET MET on the test tray' : 'TARGET MISSED on the test tray') + '</b><br>defects passed per 100 · ' + t.all.defPassed + ' of ' + t.all.def + ' defects went out · target at most ' + t.target + '</div>';
  c.appendChild(big);
  var rows = [['Defects passed per 100', f1(v.all.per100) + ' <span class="hint">(' + v.all.defPassed + '/' + v.all.def + ')</span>', f1(t.all.per100) + ' <span class="hint">(' + t.all.defPassed + '/' + t.all.def + ')</span>', t.all.per100 > v.all.per100],
    ['Auto-pass per 1,000', f0(v.per1000.pass), f0(t.per1000.pass)], ['To a person per 1,000', f0(v.per1000.person), f0(t.per1000.person), t.per1000.person > v.per1000.person],
    ['Auto-stop per 1,000', f0(v.per1000.stop), f0(t.per1000.stop)], ['Good cells stopped', v.all.goodStopped + ' of ' + v.all.good, t.all.goodStopped + ' of ' + t.all.good, t.all.goodStopPer100 > v.all.goodStopPer100],
    ['Mono: defects passed per 100', f1(v.mono.per100) + ' <span class="hint">(' + v.mono.defPassed + '/' + v.mono.def + ')</span>', f1(t.mono.per100) + ' <span class="hint">(' + t.mono.defPassed + '/' + t.mono.def + ')</span>', t.mono.per100 > v.mono.per100],
    ['Poly: defects passed per 100', f1(v.poly.per100) + ' <span class="hint">(' + v.poly.defPassed + '/' + v.poly.def + ')</span>', f1(t.poly.per100) + ' <span class="hint">(' + t.poly.defPassed + '/' + t.poly.def + ')</span>', t.poly.per100 > v.poly.per100]];
  c.appendChild(el('table', 'tbl', '<tr><th></th><th>VALIDATION<br><span style="font-weight:400">gates tuned here</span></th><th>TEST<br><span style="font-weight:400">sealed, never used</span></th></tr>' +
    rows.map(function (x) { return '<tr><td style="font-family:inherit;font-size:14px">' + x[0] + '</td><td>' + x[1] + '</td><td' + (x[3] ? ' style="color:#ffb547"' : '') + '>' + x[2] + '</td></tr>'; }).join('')));
  var nl = el('div'); nl.style.marginTop = '8px';
  var bands = r.range && r.rangeLocked ? [{ a: r.range[0], b: r.range[1], c: '#46e3ff', o: 0.3, label: 'your guess' }] : [];
  nl.innerHTML = numLine({ max: 20, target: t.target, h: 96, bands: bands, dots: [{ v: v.all.per100, c: '#a98bff', r: 5, y: 40, label: 'validation ' + f1(v.all.per100) }, { v: t.all.per100, c: met ? C.gr : C.rd, r: 8, label: 'test ' + f1(t.all.per100) }] });
  c.appendChild(nl);
  if (r.range && r.rangeLocked) { var ins = t.all.per100 >= r.range[0] && t.all.per100 <= r.range[1]; c.appendChild(el('div', 'hint', 'Your guess (8a): ' + f1(r.range[0]) + ' to ' + f1(r.range[1]) + ' per 100 → ' + (ins ? '<b style="color:#3dffa0">inside</b>' : '<b style="color:#ff4d6a">outside</b>') + '.')); }
  var say = card(host, 'WHAT THIS MEANS', '');
  if (!met) say.appendChild(el('div', null, '<p><b>The target is missed on cells the model has never seen.</b> Validation said ' + f1(v.all.per100) + ' per 100; the test tray says ' + f1(t.all.per100) + '.</p><p>Why did validation look better? The gates were <b>tuned on validation</b>: they fit those cells a little too well.</p><p><b>Do not re-tune the gates on the test tray.</b> Then it is not a test any more. The honest next step: change the system on train/validation (more photos, better labels, a stricter low gate), then test on a NEW sealed tray.</p>'));
  else say.appendChild(el('div', null, '<p><b>The target is met on new cells:</b> ' + f1(t.all.per100) + ' per 100 (validation ' + f1(v.all.per100) + ').</p><p>But the tray has only ' + t.all.def + ' defects: one more escape moves the number by ' + f1(100 / t.all.def) + '. 8c checks how sure this is. ' + (t.all.per100 > v.all.per100 ? 'The test number is worse than validation — normal, because the gates were tuned on validation.' : 'The test number is not worse than validation — with so few defects, that can be luck.') + '</p>'));
  if (t.escapes.length) {
    var e = card(host, 'THE DEFECTS THAT WENT OUT', t.escapes.length + ' real defects on the test tray passed. ' + (t.unsureEscapes ? t.unsureEscapes + ' of them the experts were unsure about (score 0.67).' : 'The experts were sure about all of them.'));
    var row = el('div'); row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap'; e.appendChild(row);
    t.escapes.slice(0, 12).forEach(function (id) { var sc = r.scores.filter(function (x) { return x[0] === id; })[0]; var d = el('div', null, ''); d.style.cssText = 'text-align:center;font-size:12px;color:#8d9bb0'; d.appendChild(thumbOf(api, id, 64, '#ff4d6a')); d.appendChild(el('div', null, 'cell ' + id + '<br>' + (sc ? sc[1] + ' · ' + f3(sc[2]) : ''))); row.appendChild(d); });
  }
}

/* ================= 8c: the lever (pre, before RUN) ================= */
function lever(box, api) {
  var m = api.mech; m.dots = m.dots || []; m.pulls = m.pulls || 0;
  var rows = null, real = null;
  box.innerHTML = '';
  var c = el('div', 'card'); box.appendChild(c);
  c.appendChild(el('h2', null, '<span class="k">✋</span>Redraw the shift'));
  c.appendChild(el('p', 'goalline', 'Each pull draws a new shift of ' + '525' + ' cells from the test tray, at random, with replacement (some cells twice, some not at all) — and drops its “defects passed per 100” on the line.'));
  var g = el('div'); g.style.cssText = 'display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap'; c.appendChild(g);
  var lv = el('div'); lv.id = 'lever8'; lv.style.cssText = 'flex:none;width:90px;height:150px;position:relative;cursor:grab;touch-action:none;user-select:none';
  var plot = el('div'); plot.style.cssText = 'flex:1;min-width:260px'; g.appendChild(lv); g.appendChild(plot);
  var info = el('div', 'hint'); c.appendChild(info);
  var fast = el('button', 'btn small', 'Pull 10 at once'); fast.id = 'lever8x10'; fast.disabled = true; c.appendChild(fast);
  function drawLever(k) { var y = 22 + 80 * k; lv.innerHTML = '<svg viewBox="0 0 90 150" style="width:90px;height:150px"><rect x="10" y="40" width="44" height="100" rx="8" fill="#151c27" stroke="#3a4658" stroke-width="2"/><text x="32" y="96" font-size="10" fill="#8d9bb0" text-anchor="middle" font-family="Orbitron,Arial">SHIFT</text><text x="32" y="110" font-size="10" fill="#8d9bb0" text-anchor="middle" font-family="Orbitron,Arial">×' + m.pulls + '</text><rect x="60" y="20" width="8" height="110" rx="4" fill="#2a3442"/><line x1="64" y1="' + (y + 10) + '" x2="54" y2="80" stroke="#8d9bb0" stroke-width="5" stroke-linecap="round"/><circle cx="64" cy="' + (y + 6) + '" r="12" fill="#ff4d6a" stroke="#fff" stroke-width="2"/><text x="64" y="146" font-size="10" fill="#ffb547" text-anchor="middle">PULL ↓</text></svg>'; }
  function per100(rs) { var d = 0, e = 0; for (var i = 0; i < rs.length; i++) { var x = rs[Math.floor(Math.random() * rs.length)]; if (x.y === 1) { d++; if (x.passed) e++; } } return d ? 100 * e / d : 0; }
  function stack() {
    var cnt = {}, dots = m.dots.map(function (v) { var b = Math.round(v * 2) / 2, k = cnt[b] = (cnt[b] || 0) + 1; return { v: b, c: '#46e3ff', r: 4, y: 102 - 7 * k }; });
    var top = Math.max(1, Math.max.apply(null, Object.keys(cnt).map(function (k) { return cnt[k]; }).concat([1])));
    var h = Math.max(130, 130 + 7 * (top - 13)); dots.forEach(function (d) { d.y += h - 130; });
    if (real != null) dots.push({ v: real, c: '#ffb547', r: 7, y: h - 26, label: 'your trial ' + f1(real) });
    plot.innerHTML = numLine({ max: 12, major: 2, target: 5, h: h, dots: dots });
    var s = m.dots.slice().sort(function (a, b) { return a - b; }), n = s.length;
    info.innerHTML = n ? n + ' shifts · lowest <b>' + f1(s[0]) + '</b> · highest <b>' + f1(s[n - 1]) + '</b>' + (n >= 20 ? ' · middle 95%: <b>' + f1(s[Math.floor(0.025 * n)]) + ' to ' + f1(s[Math.min(n - 1, Math.floor(0.975 * n))]) + '</b>' : '') + ' defects passed per 100. ' + (n < 40 ? 'Pull ' + (40 - n) + ' more.' : 'The spread is the uncertainty of one small tray.') : 'Pull the lever (drag the red knob down, or tap it).';
  }
  function pull(k) { if (!rows) return; for (var i = 0; i < k; i++) m.dots.push(Math.round(10 * per100(rows)) / 10); m.pulls += k; api.setMech({ dots: m.dots, pulls: m.pulls }); drawLever(0); stack(); fast.disabled = m.pulls < 10; }
  drawLever(0);
  var y0 = null, k0 = 0;
  lv.addEventListener('pointerdown', function (e) { if (!rows) return; y0 = e.clientY; k0 = 0; lv.setPointerCapture(e.pointerId); });
  lv.addEventListener('pointermove', function (e) { if (y0 == null) return; k0 = Math.max(0, Math.min(1, (e.clientY - y0) / 70)); drawLever(k0); });
  lv.addEventListener('pointerup', function () { if (y0 == null) return; y0 = null; drawLever(1); setTimeout(function () { pull(1); }, 120); });
  fast.onclick = function () { pull(10); };
  api.jsEval(function (NS) { if (!NS.trialLog || !NS.tray) return null; return { rows: NS.trialLog.map(function (r) { return { y: NS.tray.labelOf(r.id), passed: r.decision === 'pass' }; }), real: NS.trial.all.per100 }; }).then(function (x) {
    if (!x) { info.textContent = api.review ? 'Review mode: run 8b (Run up to here on 8b) to fill the lever with real cells.' : 'Run 8b first: the lever redraws the cells of your trial.'; return; }
    rows = x.rows; real = x.real; fast.disabled = m.pulls < 10; stack();
  });
}
function intervalCard(r, host, api) {
  if (!r || r.missing) { noData(host, api, 'Run the cell first.'); return; }
  flag(host, r.honest);
  var c = card(host, 'HOW SURE · DEFECTS PASSED PER 100', 'From one tray of ' + r.n + ' real defects (' + r.k + ' passed).');
  var b = el('div'); b.id = 'interval8';
  var cnt = {}, dots = (r.pulls || []).map(function (v) { var q = Math.round(v * 2) / 2, k = cnt[q] = (cnt[q] || 0) + 1; return { v: q, c: '#46e3ff88', r: 3, y: 104 - 6 * k }; });
  dots.push({ v: r.point, c: C.am, r: 7 });
  b.innerHTML = (r.pulls && r.pulls.length ? '<div class="hint">dots: your ' + r.pulls.length + ' lever pulls · orange: the trial (' + f1(r.point) + ')</div>' : '') + numLine({ max: 12, major: 2, target: r.target, h: 200, gap: 17, dots: dots, bands: [{ a: r.ref[0], b: r.ref[1], c: C.gr, label: 'Wilson 95%' }, { a: r.boot[0], b: r.boot[1], c: C.cy, label: 'bootstrap 95%' }, { a: Math.max(0, r.wald[0]), b: r.wald[1], c: C.dim, dash: 1, label: 'plain ±1.96 spread (Wald)' + (r.wald[0] < 0 ? ', dips below 0' : '') }] });
  c.appendChild(b);
  var ok = r.ref[1] <= r.target;
  var line = el('div', 'verdict ' + (ok ? 'good' : 'bad'), '<b style="font-size:17px">Between ' + f1(r.ref[0]) + ' and ' + f1(r.ref[1]) + ' defects passed per 100.</b><br>' + (ok ? 'The whole interval is under the target of ' + r.target + '.' : r.ref[0] > r.target ? 'The whole interval is ABOVE the target of ' + r.target + ': the target is missed.' : 'The interval crosses the target of ' + r.target + ': the trial cannot promise the target.'));
  line.id = 'intline8'; line.setAttribute('data-under', ok ? '1' : '0'); c.appendChild(line);
  c.appendChild(el('p', 'hint', 'Why Wilson: with a small count (' + r.k + ') the plain rule is too narrow and can go below 0. Wilson stays between 0 and 100 and is close to the bootstrap from 2,000 redrawn shifts. Your lever dots are the same idea, by hand.'));
}

/* ================= 8d: drift card + the alarm matrix ================= */
var ALS = [['score', 'Score'], ['bright', 'Brightness'], ['contrast', 'Contrast'], ['sharp', 'Sharpness']];
function gauge(v) { var w = Math.min(100, 100 * v / 0.5); var col = v > 0.25 ? C.rd : v > 0.1 ? C.am : C.gr; return '<div style="position:relative;height:12px;background:#121a24;border-radius:6px;min-width:60px"><div style="position:absolute;left:0;top:0;bottom:0;width:' + w + '%;background:' + col + ';border-radius:6px"></div><i style="position:absolute;left:20%;top:-2px;bottom:-2px;width:1px;background:#5d6b80"></i><i style="position:absolute;left:50%;top:-3px;bottom:-3px;width:2px;background:#e6eef8"></i></div><div style="font:12px Space Mono,monospace;color:' + col + '">' + v.toFixed(3) + '</div>'; }
function driftCard(r, host, api) {
  if (!r || r.missing) { noData(host, api, 'Run the cell first.'); return; }
  var m = api.mech; m.matrix = m.matrix || {};
  var c = card(host, 'TODAY · THE TEST TRAY AS ONE SHIFT', 'Same factory, cells the model never saw. Reference: the validation tray. PSI: below 0.1 calm · 0.1–0.25 watch · above 0.25 act (rules of thumb, not laws).');
  var g = el('div'); g.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px'; c.appendChild(g);
  ALS.forEach(function (a) { var d = el('div', null, '<div style="font-size:13px;color:#8d9bb0">' + a[1] + '</div>' + gauge(r.today[a[0]])); g.appendChild(d); });
  c.appendChild(el('div', 'hint', r.today.ring.length ? 'Today rings: ' + r.today.ring.join(', ') + '.' : 'Today: no alarm rings — as it should for cells from the same factory.'));
  var s = card(host, 'FOUR CHANGES · SIMULATED', 'Built here from real test photos. They show what each alarm can see. They are NOT real factory data.');
  var thumbs = el('div'); thumbs.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:6px'; s.appendChild(thumbs);
  Object.keys(r.info).forEach(function (k) { var d = el('div', null, '<b style="font-size:13px">' + esc(r.info[k].name) + '</b><div class="hint" style="font-size:12px">' + esc(r.info[k].what) + '</div>'); d.setAttribute('data-sim8', k); d.style.cssText = 'background:#0a1019;border:1px solid #263346;border-radius:8px;padding:6px'; thumbs.appendChild(d); });
  api.jsEval(function (NS, pg) { return pg.openTest().then(function (t) { var sims = pg.driftScenarios(t), o = {}; for (var k in sims) { var c0 = sims[k].cells[0]; o[k] = { before: pg.card(c0.id).photo, after: c0.photo, id: c0.id }; } return o; }); }).then(function (x) {
    if (!x) return; Object.keys(x).forEach(function (k) { var d = thumbs.querySelector('[data-sim8="' + k + '"]'); if (!d) return; var row = el('div'); row.style.cssText = 'display:flex;gap:4px;margin-top:4px'; row.appendChild(photoCanvas(x[k].before, 46)); row.appendChild(el('span', 'hint', '→')); row.appendChild(photoCanvas(x[k].after, 46)); d.appendChild(row); });
  });
  /* the matrix: which alarm rings for which change? */
  var mx = card(host, 'WHICH ALARM CATCHES WHICH CHANGE?', m.matrixLocked ? 'Your ticks against the real alarm values.' : 'Tap a box to tick “I expect this alarm to ring” (PSI above ' + r.ALARM + '). Leave it empty if you expect calm. Then one check.');
  var tb = el('table', 'tbl'); tb.id = 'matrix8'; mx.appendChild(tb);
  function drawM() {
    var h = '<tr><th>change</th>' + ALS.map(function (a) { return '<th>' + a[1] + '</th>'; }).join('') + '</tr>', right = 0, all = 0;
    Object.keys(r.alarms).forEach(function (k) {
      h += '<tr><td style="font-family:inherit;font-size:14px">' + esc(r.info[k].name) + '</td>';
      ALS.forEach(function (a) {
        var key = k + '|' + a[0], tick = !!m.matrix[key], v = r.alarms[k][a[0]], rings = v > r.ALARM, ok = tick === rings; all++; if (ok) right++;
        h += '<td data-cell8="' + key + '" style="cursor:' + (m.matrixLocked ? 'default' : 'pointer') + ';text-align:center;' + (m.matrixLocked ? 'background:' + (rings ? '#3a1414' : '#0b2418') : '') + '">' + (tick ? '<b style="color:#46e3ff">✓ ring</b>' : '<span style="color:#5d6b80">·</span>') + (m.matrixLocked ? '<br><span style="color:' + (rings ? C.rd : C.gr) + '">' + v.toFixed(2) + '</span> ' + (ok ? '✓' : '<b style="color:#ff4d6a">✗</b>') : '') + '</td>';
      });
      h += '</tr>';
    });
    tb.innerHTML = h;
    if (!m.matrixLocked) tb.querySelectorAll('[data-cell8]').forEach(function (td) { td.onclick = function () { var k = td.getAttribute('data-cell8'); if (m.matrix[k]) delete m.matrix[k]; else m.matrix[k] = 1; api.setMech({ matrix: m.matrix }); drawM(); }; });
    return { right: right, all: all };
  }
  var sc = drawM();
  if (!m.matrixLocked) { var b = el('button', 'btn', 'Check my matrix'); b.id = 'matrixcheck8'; b.style.marginTop = '8px'; b.onclick = function () { var x = drawM(); api.setMech({ matrixLocked: 1, nRight: x.right, nAll: x.all }); m.matrixLocked = 1; host.innerHTML = ''; driftCard(r, host, api); }; mx.appendChild(b); mx.appendChild(el('span', 'hint', ' One try.')); }
  else {
    mx.appendChild(el('div', 'verdict ' + (sc.right >= sc.all - 3 ? 'good' : 'bad'), sc.right + ' of ' + sc.all + ' boxes right. Red = this alarm really rings (PSI above ' + r.ALARM + ').'));
    var NM = { score: 'score', bright: 'brightness', contrast: 'contrast', sharp: 'sharpness' }, CAUSE = { dark: 'every pixel is darker', blur: 'sharp edges are smoothed away', poly: 'the photos are normal, only the MIX of cell types changed', fault: 'only 1 cell in 4 changed' };
    mx.appendChild(why({ asked: 'Match each change to the alarm that can see it, then compare with the real values.', steps: Object.keys(r.alarms).map(function (k) { var a = r.alarms[k], on = ALS.filter(function (x) { return a[x[0]] > r.ALARM; }), off = ALS.filter(function (x) { return a[x[0]] <= r.ALARM; });
        return '<b>' + esc(r.info[k].name) + '</b> (' + CAUSE[k] + '): ' + (on.length ? 'rings on ' + on.map(function (x) { return NM[x[0]] + ' ' + a[x[0]].toFixed(2); }).join(', ') : 'no alarm rings') + (off.length ? '; calm on ' + off.map(function (x) { return NM[x[0]] + ' ' + a[x[0]].toFixed(2); }).join(', ') : '') + '.'; }).concat([(function () { var mxv = Math.max(r.today.score, r.today.bright, r.today.contrast, r.today.sharp); return 'Today (the real test tray): highest value ' + mxv.toFixed(3) + (mxv < 0.1 ? ' — calm, as expected for cells from the same factory.' : mxv <= r.ALARM ? ' — watch.' : ' — an alarm rings even on real cells.'); })()]),
      trap: 'Watching only the score. A change can move the photos (and hurt the model) while the score mix moves less — the photo numbers often see it first.', remember: 'Several cheap alarms beat one clever one.' }, 'WHY (tap to open)'));
  }
}

window.PGViz8 = { freeze: sceneFreeze, trialCard: trialCard, lever: lever, intervalCard: intervalCard, driftCard: driftCard, _: { el: el, card: card, tiles: tiles, esc: esc, why: why, flag: flag, numLine: numLine, f0: f0, f1: f1, f3: f3, noData: noData, shake: shake, photoCanvas: photoCanvas, thumbOf: thumbOf, C: C } };
})();
