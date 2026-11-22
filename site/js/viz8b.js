/* PanelGuard Step 8 visuals, part 2: own photo + learning curve + shopping list (8e), the acceptance sheet (8f),
   the recap line + final test + take it home (8g). Registers into window.PGViz8. */
(function () {
'use strict';
var X8 = function () { return window.PGViz8._; };
function el(t, c, h) { return X8().el(t, c, h); }
function card(p, t, s) { return X8().card(p, t, s); }
function tiles(p, l) { return X8().tiles(p, l); }
function esc(s) { return X8().esc(s); }
function f0(x) { return X8().f0(x); } function f1(x) { return X8().f1(x); } function f3(x) { return X8().f3(x); }
function why(e, t) { return X8().why(e, t); }
function shake(e) { X8().shake(e); }
var C = { cy: '#46e3ff', am: '#ffb547', gr: '#3dffa0', rd: '#ff4d6a', vi: '#a98bff', dim: '#8d9bb0' };
var BOX = [['more', 'Need more photos like this', '#46e3ff'], ['label', 'Ask the expert to re-check the label', '#d6e05a'], ['sharp', 'Needs a sharper photo', '#a98bff'], ['wrong', 'Model looked at the wrong place', '#ff8a5c']];
function copyBtn(text, label, id) {
  var b = el('button', 'btn small', label || '⧉ Copy'); if (id) b.id = id;
  b.onclick = function () { var t = typeof text === 'function' ? text() : text, o = b.textContent, ok = function () { b.textContent = '✓ Copied'; setTimeout(function () { b.textContent = o; }, 1200); };
    var fb = function () { try { var x = document.createElement('textarea'); x.style.cssText = 'position:fixed;opacity:0'; x.value = t; document.body.appendChild(x); x.select(); document.execCommand('copy'); x.remove(); ok(); } catch (e) { b.textContent = 'Copy blocked here'; } };
    try { navigator.clipboard.writeText(t).then(ok, fb); } catch (e) { fb(); } };
  return b;
}

/* ================= 8e: learning curve, own photo, shopping list ================= */
function curveSVG(c) {
  var W = 560, H = 190, x0 = 46, x1 = W - 46, y0 = 18, y1 = H - 34, n = c.length;
  var lo = Math.min.apply(null, c.map(function (x) { return x.auc; })) - 0.02, hi = Math.max.apply(null, c.map(function (x) { return x.auc; })) + 0.01;
  var fhi = Math.max.apply(null, c.map(function (x) { return x.far; })) * 1.15 || 1;
  var X = function (i) { return x0 + (x1 - x0) * i / (n - 1); }, Y = function (v) { return y1 - (y1 - y0) * (v - lo) / (hi - lo); }, YF = function (v) { return y1 - (y1 - y0) * v / fhi; };
  var s = '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + y1 + '" y2="' + y1 + '" stroke="#3a4658"/>';
  s += '<polyline fill="none" stroke="#3dffa0" stroke-width="3" points="' + c.map(function (p, i) { return X(i) + ',' + Y(p.auc); }).join(' ') + '"/>';
  s += '<polyline fill="none" stroke="#ff4d6a" stroke-width="2" stroke-dasharray="6 4" points="' + c.map(function (p, i) { return X(i) + ',' + YF(p.far); }).join(' ') + '"/>';
  c.forEach(function (p, i) { s += '<circle cx="' + X(i) + '" cy="' + Y(p.auc) + '" r="5" fill="#3dffa0"/><text x="' + X(i) + '" y="' + (Y(p.auc) - 9) + '" font-size="12" fill="#3dffa0" text-anchor="middle">' + p.auc.toFixed(3) + '</text>' +
    '<circle cx="' + X(i) + '" cy="' + YF(p.far) + '" r="4" fill="#ff4d6a"/><text x="' + X(i) + '" y="' + (YF(p.far) + 16) + '" font-size="11" fill="#ff4d6a" text-anchor="middle">' + (100 * p.far).toFixed(1) + '%</text>' +
    '<text x="' + X(i) + '" y="' + (H - 16) + '" font-size="12" fill="#c6d2e2" text-anchor="middle">' + p.photos + ' photos</text><text x="' + X(i) + '" y="' + (H - 3) + '" font-size="10" fill="#8d9bb0" text-anchor="middle">' + Math.round(100 * p.share) + '% · ' + p.defects + ' defects</text>'; });
  s += '<text x="4" y="14" font-size="11" fill="#3dffa0">— ranking score (validation)</text><text x="' + (W - 4) + '" y="14" font-size="11" fill="#ff4d6a" text-anchor="end">- - good cells stopped at 95%</text>';
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block">' + s + '</svg>';
}
function toGray64(img) {
  var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d');
  var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, s = Math.min(w, h);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, 64, 64);          // centre square, then 64 x 64
  var d = g.getImageData(0, 0, 64, 64).data, out = new Array(4096);
  for (var i = 0; i < 4096; i++) out[i] = Math.round(0.299 * d[4 * i] + 0.587 * d[4 * i + 1] + 0.114 * d[4 * i + 2]);
  return out;
}
function notElPicture() {     /* a picture that is NOT an EL cell, drawn here (sky, sun, a roof) */
  var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#7ec8ff'); gr.addColorStop(1, '#e8f4ff'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(196, 60, 32, 0, 7); g.fill();
  g.fillStyle = '#8a4b2a'; g.beginPath(); g.moveTo(20, 170); g.lineTo(128, 96); g.lineTo(236, 170); g.fill(); g.fillStyle = '#c9b89a'; g.fillRect(44, 170, 168, 86);
  return c;
}
function ownCard(r, host, api) {
  if (!r || r.missing) { X8().noData(host, api, 'Run the cell first.'); return; }
  var m = api.mech, c = r.curve, a = c[0], b = c[c.length - 1], h = c[c.length - 2];
  var lc = card(host, 'WHAT MORE LABELLED PHOTOS BUY', 'The Step 2 inspector (' + esc(r.model) + ') trained on part of the train tray, scored on the same 525 validation cells. Measured just now.');
  var cv = el('div'); cv.id = 'curve8'; cv.innerHTML = curveSVG(c); lc.appendChild(cv);
  var gain = b.auc - h.auc;
  lc.appendChild(el('div', 'verdict ' + (gain > 0.01 ? 'good' : ''), 'Last doubling (' + h.photos + ' → ' + b.photos + ' photos): ranking score ' + (gain >= 0 ? '+' : '') + gain.toFixed(3) + ', good cells stopped ' + (100 * h.far).toFixed(1) + '% → ' + (100 * b.far).toFixed(1) + '%. ' + (gain > 0.01 ? 'Still rising: more labelled photos of this kind should help.' : 'Almost flat: more of the SAME kind of photo buys little. Better labels and new kinds of defects may buy more.') + ' (One random order; another order could move these by a little.)'));
  /* own photo */
  var oc = card(host, 'YOUR OWN PHOTO', 'Load a photo from your computer. It is resized to 64 × 64 grey and scored by your frozen system. Nothing leaves this browser.');
  oc.appendChild(el('div', 'verdict bad', '<b>Warning:</b> this model only knows <b>electroluminescence (EL) photos of one solar cell</b> — taken in the dark, the cell glowing under current, cut out and straightened, 64 × 64 grey. A phone photo of a panel still gets a number, but the number means nothing.'));
  var row = el('div', 'row'); row.style.marginTop = '8px'; oc.appendChild(row);
  var inp = el('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.id = 'own8file'; inp.style.cssText = 'font-size:13px;color:#c6d2e2;max-width:230px';
  var s1 = el('button', 'btn small', 'Sample: a sealed test cell'); s1.id = 'own8cell';
  var s2 = el('button', 'btn small', 'Sample: not an EL photo'); s2.id = 'own8sky';
  var polyB = el('label', 'hint', '<input type="checkbox" id="own8poly"> it is a poly cell');
  row.appendChild(inp); row.appendChild(s1); row.appendChild(s2); row.appendChild(polyB);
  var res = el('div'); res.id = 'own8res'; oc.appendChild(res);
  function score(photo, what) {
    res.innerHTML = '<div class="hint">Scoring…</div>';
    var poly = !!oc.querySelector('#own8poly').checked;
    api.jsEval(async function (NS, pg, tf) {
      if (!NS.model || !NS.REFD || !NS.looks) return { err: 'Run 8d first: the distance check reuses your drift signal.' };
      var cnn = tf.tidy(function () { return NS.model.predict(tf.tensor(photo, [1, 64, 64, 1], 'float32').div(255)).dataSync()[0]; });
      var svc = await pg.svcOfPhoto(photo), p = NS.bestW * cnn + (1 - NS.bestW) * svc, prob = pg.problemOf(photo), lk = NS.looks(photo), pct = {};
      ['bright', 'contrast', 'sharp'].forEach(function (k) { var ref = NS.REFD[k], below = ref.filter(function (v) { return v < lk[k]; }).length; pct[k] = { v: lk[k], pct: 100 * below / ref.length, lo: Math.min.apply(null, ref), hi: Math.max.apply(null, ref) }; });
      var refS = NS.REFD.score, sb = refS.filter(function (v) { return v < cnn; }).length;
      return { cnn: cnn, svc: svc, p: p, problem: prob, lane: prob ? 'person' : pg.laneOf(p, poly ? NS.lowPoly : NS.low, NS.high), pct: pct, scorePct: 100 * sb / refS.length, low: poly ? NS.lowPoly : NS.low, high: NS.high };
    }).then(function (x) {
      res.innerHTML = '';
      if (!x || x.err) { res.appendChild(el('div', 'verdict', x && x.err ? x.err : 'Could not score: the model is not loaded here.')); return; }
      var far = Object.keys(x.pct).filter(function (k) { return x.pct[k].pct < 1 || x.pct[k].pct > 99; });
      var LAMP = { pass: ['PASS', '●', C.gr], person: ['CHECK', '▲', C.am], stop: ['STOP', '■', C.rd] }[x.lane], g = el('div'); g.style.cssText = 'display:flex;gap:12px;align-items:center;margin-top:8px;flex-wrap:wrap';
      g.appendChild(X8().photoCanvas(photo, 128));
      g.appendChild(el('div', null, '<div style="font:700 30px Orbitron,Arial;color:' + LAMP[2] + '">' + LAMP[1] + ' ' + LAMP[0] + '</div><div class="hint">' + esc(what) + '</div><div style="font-size:14px">score ' + x.p.toFixed(3) + ' (CNN ' + x.cnn.toFixed(3) + ', Step 2 ' + x.svc.toFixed(3) + ') · pass below ' + x.low.toFixed(3) + ' · stop from ' + x.high.toFixed(3) + (x.problem ? '<br><b>Photo check: ' + esc(x.problem) + '</b> → a person decides' : '') + '</div>'));
      res.appendChild(g);
      var NM = { bright: 'brightness', contrast: 'contrast', sharp: 'sharpness' };
      var t = el('table', 'tbl', '<tr><th>photo number</th><th>this photo</th><th>training photos (validation)</th><th>where it falls</th></tr>' + Object.keys(x.pct).map(function (k) { var q = x.pct[k]; var out = q.pct < 1 || q.pct > 99; return '<tr><td style="font-family:inherit">' + NM[k] + '</td><td>' + q.v.toFixed(1) + '</td><td>' + q.lo.toFixed(1) + ' to ' + q.hi.toFixed(1) + '</td><td style="color:' + (out ? C.rd : C.gr) + '">' + (q.pct < 1 ? 'lower than 99% of them' : q.pct > 99 ? 'higher than 99% of them' : 'percentile ' + f0(q.pct)) + '</td></tr>'; }).join(''));
      res.appendChild(t);
      res.appendChild(el('div', 'verdict ' + (far.length ? 'bad' : 'good'), far.length ? '<b>Far from the training photos</b> (' + far.map(function (k) { return NM[k]; }).join(', ') + ' outside what the model has seen). Do not trust this verdict.' : 'The photo numbers sit inside the range of the training photos. The verdict is meaningful only if it really is an EL photo of one cell.'));
      api.setMech({ tried: 1, ownLast: { what: what, lane: x.lane, p: x.p, far: far } }); m.tried = 1; side();
    });
  }
  inp.onchange = function () {
    var f = inp.files && inp.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () { var im = new Image(); im.onload = function () { score(toGray64(im), 'your photo: ' + f.name + ' (' + (im.naturalWidth || '?') + ' × ' + (im.naturalHeight || '?') + ' px)'); }; im.onerror = function () { res.innerHTML = ''; res.appendChild(el('div', 'verdict bad', 'This file could not be read as a picture.')); }; im.src = rd.result; };
    rd.readAsDataURL(f);
  };
  s1.onclick = function () { api.jsEval(function (NS, pg) { return pg.openTest().then(function (t) { var id = t.cell_test.filter(function (c, i) { return t.y_test[i] === 1; })[3] || t.cell_test[0]; return { id: id, photo: pg.card(id).photo, kind: pg.card(id).kind, y: t.labelOf(id) }; }); }).then(function (x) { if (!x) return; oc.querySelector('#own8poly').checked = x.kind === 'poly'; score(x.photo, 'sample: sealed test cell ' + x.id + ' (' + x.kind + ', experts: ' + (x.y ? 'defect' : 'OK') + ')'); }); };
  s2.onclick = function () { score(toGray64(notElPicture()), 'sample: a drawing of a house, not an EL photo'); };
  if (m.ownLast) res.appendChild(el('div', 'hint', 'Last photo: ' + esc(m.ownLast.what) + ' → ' + esc(m.ownLast.lane) + (m.ownLast.far && m.ownLast.far.length ? ' (far from the training photos)' : '') + '.'));
  /* the data shopping list (from the Step 4f boxes) */
  var sl = card(host, 'THE DATA SHOPPING LIST', 'Your Step 4f to-do boxes become what to buy next. Tap “Add” on each box.');
  var acts = (api.getMech('4f') || {}).actions || {}; m.list = m.list || {};
  var lines = el('ol'); lines.id = 'shop8';
  function lineOf(k) {
    var n = (acts[k] || []).length, ids = (acts[k] || []).slice(0, 4).join(', ');
    return { more: 'Collect new labelled EL photos like cells ' + (ids || '—') + ' (' + n + ' in the box). The curve says the last doubling bought ' + (gain >= 0 ? '+' : '') + gain.toFixed(3) + ' ranking score' + (gain > 0.01 ? ': worth buying.' : ': buy NEW kinds of defects, not more of the same.'),
      label: 'Ask the experts to re-label ' + n + ' cells (' + (ids || '—') + ') — and the test-tray cells they were unsure about. Noisy labels cap what more photos can buy.',
      sharp: 'Fix the camera or reshoot ' + n + ' cells (' + (ids || '—') + '): a sharper photo is cheaper than a better model.',
      wrong: 'Collect photos with the defect in other places, and check ' + n + ' cells (' + (ids || '—') + ') where the model looked at the wrong spot.' }[k];
  }
  var bx = el('div'); bx.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px'; sl.appendChild(bx);
  function side() {
    bx.innerHTML = ''; lines.innerHTML = '';
    BOX.forEach(function (bb) {
      var k = bb[0], d = el('div'); d.setAttribute('data-box8', k); d.style.cssText = 'border:1px solid ' + bb[2] + ';border-radius:8px;padding:6px;background:#0a1019';
      d.appendChild(el('div', null, '<b style="color:' + bb[2] + '">' + esc(bb[1]) + '</b> <span class="hint">· ' + (acts[k] || []).length + ' cells</span>'));
      var th = el('div'); th.style.cssText = 'display:flex;gap:3px;margin:4px 0'; (acts[k] || []).slice(0, 5).forEach(function (id) { th.appendChild(X8().thumbOf(api, id, 34)); }); d.appendChild(th);
      var add = el('button', 'btn small', m.list[k] ? '✓ On the list' : 'Add'); add.disabled = !!m.list[k];
      add.onclick = function () { m.list[k] = 1; var all = BOX.every(function (q) { return m.list[q[0]]; }); api.setMech({ list: m.list, listDone: all ? 1 : 0 }); side(); };
      d.appendChild(add); bx.appendChild(d);
      if (m.list[k]) lines.appendChild(el('li', null, esc(lineOf(k))));
    });
    if (!Object.keys(acts).length) sl.appendChild(el('div', 'hint', 'No Step 4f boxes found' + (api.review ? ' (review mode)' : '') + ': the lines will say 0 cells.'));
  }
  side(); sl.appendChild(lines);
  sl.appendChild(copyBtn(function () { return 'DATA SHOPPING LIST\n' + BOX.filter(function (q) { return m.list[q[0]]; }).map(function (q, i) { return (i + 1) + '. ' + lineOf(q[0]); }).join('\n'); }, '⧉ Copy the list', 'shop8copy'));
}

/* ================= 8f: the acceptance sheet ================= */
var CONDS = [['c_bigger', 'A bigger trial on a NEW sealed tray before full speed'], ['c_second', 'A second checker on every shift'], ['c_poly', 'Watch poly cells separately on the shift board'], ['c_labels', 'Experts re-check the unsure labels'], ['c_drift', 'Run the drift alarm every shift; stop and re-check when it rings'],
  ['x_gates', 'Move the gates using the test-tray results', 'Refused: that tunes on the test tray. After it, no honest number is left.'], ['x_skip', 'Skip the person\'s queue when the line is busy', 'Refused: the unsure cells then pass unchecked — that is where the defects hide.']];
function acceptFacts(api) {
  var t = api.res('8b'), iv = api.res('8c'), d = api.res('8d'), lc = api.res('8e'), rate = (api.getMech('7d') || {}).rate;
  if (!t || !t.trial || !iv || !iv.ref) return null;
  var T = t.trial, share = T.lanes.person / T.n, needed = Math.round(30 * 60 * share), checkers = rate && rate.perHour ? Math.ceil(needed / rate.perHour) : null;
  var F = { t: t, iv: iv, d: d, lc: lc, rate: rate, T: T, share: share, needed: needed, checkers: checkers, lo: iv.ref[0], hi: iv.ref[1], point: T.all.per100, target: T.target, honest: t.honest };
  F.missed = F.point > F.target || F.lo > F.target; F.straddle = !F.missed && F.hi > F.target;
  F.polyRisk = T.poly.per100 > T.target || T.poly.per100 > T.mono.per100;
  F.dishonest = !!(F.honest && F.honest.frozen && F.honest.ok === false);
  F.need = []; if (F.straddle) F.need.push('c_bigger'); if (checkers == null || checkers > 1) F.need.push('c_second'); if (F.polyRisk) F.need.push('c_poly'); if (T.unsureEscapes > 0) F.need.push('c_labels');
  return F;
}
function judge(F, dec, ticks) {
  var why = [], forb = CONDS.filter(function (c) { return c[2] && ticks[c[0]]; });
  forb.forEach(function (c) { why.push(c[2]); });
  if (F.dishonest && dec !== 'nogo') why.push('The test is not honest any more (' + F.honest.changed.join(', ') + ' changed after the seal broke). Only no-go fits until a new sealed tray is tested.');
  if (F.missed && dec !== 'nogo') why.push('The trial measured ' + f1(F.point) + ' defects passed per 100' + (F.lo > F.target ? ' and even the bottom of the interval (' + f1(F.lo) + ') is above ' : ', above the target of ') + F.target + '. Conditions cannot fix a miss you measured: change the system, then test on a new sealed tray.');
  if (dec === 'go') {
    if (CONDS.some(function (c) { return !c[2] && ticks[c[0]]; })) why.push('You ticked conditions, but “GO” means no conditions. Choose “GO WITH CONDITIONS”, or untick them.');
    if (F.straddle) why.push('“Go” with no conditions is refused: the interval reaches ' + f1(F.hi) + ' per 100, above the target of ' + F.target + '.');
    if (F.checkers == null) why.push('“Go” is refused: one checker\'s capacity was not measured (7d).'); else if (F.checkers > 1) why.push('“Go” is refused: the flow sends ' + f0(F.needed) + ' cells per hour to a person, one checker does ' + f0(F.rate.perHour) + ' → ' + F.checkers + ' checkers needed.');
    if (F.polyRisk) why.push('“Go” is refused: poly cells let ' + f1(F.T.poly.per100) + ' of 100 defects pass (mono ' + f1(F.T.mono.per100) + ').');
    if (F.T.unsureEscapes) why.push('“Go” is refused: ' + F.T.unsureEscapes + ' of the defects that passed had unsure expert labels.');
  }
  if (dec === 'cond') {
    var any = CONDS.filter(function (c) { return !c[2] && ticks[c[0]]; }).length;
    if (!any) why.push('“Go with conditions” needs at least one condition ticked.');
    F.need.forEach(function (k) { if (!ticks[k]) why.push('Missing condition: “' + CONDS.filter(function (c) { return c[0] === k; })[0][1] + '” — ' + ({ c_bigger: 'the interval goes up to ' + f1(F.hi) + ', above ' + F.target + '.', c_second: F.checkers == null ? 'one checker\'s capacity was not measured.' : F.checkers + ' checkers are needed for ' + f0(F.needed) + ' cells per hour.', c_poly: 'poly ' + f1(F.T.poly.per100) + ' vs mono ' + f1(F.T.mono.per100) + ' per 100.', c_labels: F.T.unsureEscapes + ' defect' + (F.T.unsureEscapes > 1 ? 's' : '') + ' that passed had an unsure label.' }[k])); });
  }
  if (dec !== 'nogo' && !ticks.c_drift && !(dec === 'go')) why.push('Missing condition: “Run the drift alarm every shift” — on the line there are no labels, the alarm is the only early warning.');
  return why;
}
function sceneAcceptance(s, stage, out, api, hLive) {
  var m = api.mech; m.ticks = m.ticks || {};
  if (hLive === undefined) { stage.innerHTML = '<div class="hint" style="padding:12px">Reading your numbers…</div>'; api.jsEval(function (NS, pg) { return window.PG_STEP8_UTIL.honesty(NS, pg); }).then(function (h) { sceneAcceptance(s, stage, out, api, h || null); }); return {}; }
  var F = acceptFacts(api);
  if (F && hLive) { F.honest = hLive; F.dishonest = !!(hLive.frozen && hLive.ok === false); }
  stage.innerHTML = ''; out.innerHTML = '';
  if (!F) { X8().noData(stage, api, 'Finish 8b and 8c first: the sheet is filled from the trial and its interval.', 'Review mode: open 8c, press “Run up to here”, then come back: the sheet is filled from the trial and its interval.'); return {}; }
  var w = el('div'); w.style.cssText = 'padding:10px 12px'; stage.appendChild(w);
  var sh = el('div'); sh.id = 'sheet8'; sh.style.cssText = 'position:relative;background:#f2efe6;color:#1b2230;border-radius:8px;padding:12px 16px;box-shadow:0 4px 18px #0008;font-family:Rajdhani,Arial;font-size:15px';
  var light = function (ok) { return '<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background:' + (ok === true ? '#1f9d55' : ok === false ? '#d23a4a' : '#d9a21b') + ';margin-right:6px;vertical-align:-1px"></span>'; };
  var rows = [
    ['Target vs interval', 'at most ' + F.target + ' defects passed per 100 · trial ' + f1(F.point) + ' · 95% interval <b>' + f1(F.lo) + ' to ' + f1(F.hi) + '</b>', F.missed ? false : F.straddle ? null : true],
    ['Human load', f0(F.needed) + ' cells per hour to a person at 30 cells/min (' + f1(100 * F.share) + '% of the trial) · one checker measured: ' + (F.rate ? f0(F.rate.perHour) + ' per hour (' + f1(F.rate.medianSeconds) + ' s per cell, 7d)' : 'not measured') + (F.checkers ? ' → <b>' + F.checkers + ' checker' + (F.checkers > 1 ? 's' : '') + '</b>' : ''), F.checkers === 1 ? true : false],
    ['Poly risk', 'poly ' + f1(F.T.poly.per100) + ' vs mono ' + f1(F.T.mono.per100) + ' defects passed per 100 (' + F.T.poly.defPassed + '/' + F.T.poly.def + ' vs ' + F.T.mono.defPassed + '/' + F.T.mono.def + ')', F.polyRisk ? null : true],
    ['Unsure labels', F.T.unsureEscapes + ' of ' + F.T.escapes.length + ' defects that passed had an unsure expert label (0.67)', F.T.unsureEscapes ? null : true],
    ['Drift plan', F.d ? 'PSI alarm on score, brightness, contrast, sharpness · act above ' + F.d.ALARM + ' · today ' + (F.d.today.ring.length ? 'RINGS (' + F.d.today.ring.join(', ') + ')' : 'calm') : 'not built (8d)', F.d ? (F.d.today.ring.length ? false : true) : false],
    ['Honest test', F.honest && F.honest.frozen ? (F.honest.ok ? 'frozen values unchanged since the seal broke' + (F.honest.at ? ' (' + esc(F.honest.at) + ')' : '') : '<b>NOT honest:</b> ' + esc(F.honest.changed.join(', ')) + ' changed') : 'no freeze sheet recorded', F.honest && F.honest.frozen ? F.honest.ok : null]];
  sh.innerHTML = '<b style="font-family:Orbitron,Arial;letter-spacing:.12em;font-size:13px">ACCEPTANCE SHEET · EL INSPECTION STATION</b><div style="font-size:12px;color:#5a6270">for the plant manager · filled from your real numbers</div>' +
    rows.map(function (x) { return '<div style="display:flex;gap:8px;padding:6px 0;border-top:1px solid #cfc8b8"><span style="flex:none;width:140px;font-weight:700">' + light(x[2]) + x[0] + '</span><span style="flex:1">' + x[1] + '</span></div>'; }).join('');
  w.appendChild(sh);
  var dec = el('div'); dec.style.cssText = 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap'; w.appendChild(dec);
  [['go', 'GO', 'run the line as built', C.gr], ['cond', 'GO WITH CONDITIONS', 'run it, but only with the ticked conditions', C.am], ['nogo', 'NO-GO', 'do not run it yet', C.rd]].forEach(function (d) {
    var b = el('button', 'bet' + (m.dec === d[0] ? ' sel' : ''), '<div class="bi" style="color:' + d[3] + '">' + d[1] + '</div>' + esc(d[2])); b.setAttribute('data-dec8', d[0]); b.style.flex = '1';
    b.disabled = !!m.done; b.onclick = function () { api.setMech({ dec: d[0] }); m.dec = d[0]; sceneAcceptance(s, stage, out, api, F.honest); };
    dec.appendChild(b);
  });
  var cl = el('div'); cl.style.cssText = 'margin-top:10px'; cl.appendChild(el('b', null, 'Conditions (tick all that apply)'));
  CONDS.forEach(function (c) { var l = el('label', null, '<input type="checkbox" data-cond8="' + c[0] + '"' + (m.ticks[c[0]] ? ' checked' : '') + (m.done ? ' disabled' : '') + '> ' + esc(c[1])); l.style.cssText = 'display:block;padding:3px 0;font-size:15px;cursor:pointer'; l.querySelector('input').onchange = function (e) { if (e.target.checked) m.ticks[c[0]] = 1; else delete m.ticks[c[0]]; api.setMech({ ticks: m.ticks }); }; cl.appendChild(l); });
  w.appendChild(cl);
  var st = el('button', 'btn run', '⬤ STAMP THE DECISION'); st.id = 'stamp8'; st.style.marginTop = '10px'; st.disabled = !m.dec || !!m.done;
  var msg = el('div'); msg.id = 'stampmsg8';
  st.onclick = function () {
    var w2 = judge(F, m.dec, m.ticks);
    if (w2.length) { msg.innerHTML = ''; msg.appendChild(el('div', 'verdict bad', '<b>The sheet refuses this decision:</b><ul style="margin:4px 0">' + w2.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>')); shake(sh); api.setMech({ refused: (m.refused || 0) + 1 }); return; }
    var note = m.dec === 'nogo' && !F.missed && !F.dishonest ? ' The numbers would also allow a go with conditions; a no-go is still a careful, valid choice.' : '';
    api.setMech({ done: 1, stamped: { dec: m.dec, ticks: Object.keys(m.ticks), at: new Date().toLocaleString() } }); m.done = 1;
    sceneAcceptance(s, stage, out, api, F.honest); var x = stage.querySelector('#stampmsg8'); if (x) x.appendChild(el('div', 'verdict good', 'Stamped. The decision fits the numbers.' + note));
  };
  w.appendChild(st); w.appendChild(msg);
  if (m.done && m.stamped) { var sp = el('div', null, { go: 'GO', cond: 'GO WITH CONDITIONS', nogo: 'NO-GO' }[m.stamped.dec]); sp.setAttribute('data-stamp8', m.stamped.dec); sp.style.cssText = 'position:absolute;right:14px;bottom:8px;transform:rotate(-8deg);font:900 26px Orbitron,Arial;letter-spacing:.08em;padding:6px 12px;border:4px solid ' + { go: '#1f9d55', cond: '#c98a0b', nogo: '#d23a4a' }[m.stamped.dec] + ';color:' + { go: '#1f9d55', cond: '#c98a0b', nogo: '#d23a4a' }[m.stamped.dec] + ';border-radius:8px;opacity:.85;pointer-events:none'; sh.style.paddingBottom = '62px'; sh.appendChild(sp);
    msg.appendChild(el('div', 'verdict good', 'Stamped ' + esc(m.stamped.at) + (m.stamped.ticks.length ? ' with: ' + esc(m.stamped.ticks.map(function (k) { return CONDS.filter(function (c) { return c[0] === k; })[0][1]; }).join(' · ')) : '') + '.')); }
  var c1 = card(out, 'WHAT THE SHEET CHECKS', 'Your choice is yours. The sheet only refuses a choice that does not fit the numbers.');
  c1.appendChild(el('ul', null, '<li><b>GO</b> needs: the whole interval under ' + F.target + ', one checker enough, no poly risk, no unsure escapes, an honest test.</li><li><b>GO WITH CONDITIONS</b> needs a condition for every open risk, and the drift alarm.</li><li><b>NO-GO</b> always fits. It is the only fit when the trial missed, or the test is no longer honest.</li><li>Two conditions are traps: they look helpful but break the honest test or the safety rule.</li>'));
  var c2 = card(out, 'OPEN RISKS FROM YOUR NUMBERS', '');
  c2.appendChild(el('ul', null, (F.missed ? '<li style="color:#ff4d6a">Target missed on the test tray.</li>' : '') + (F.need.length ? F.need.map(function (k) { return '<li>' + esc(CONDS.filter(function (c) { return c[0] === k; })[0][1]) + '</li>'; }).join('') : '<li>none beyond the drift plan</li>')));
  X8().flag(c2, F.honest);
  return {};
}

/* ================= 8g: the line recap, the final test, take it home ================= */
function liveData(api) {
  var R = function (k) { return api.res(k); }, D = {};
  var b2 = R('2b'), d2 = R('2d'), e3 = (api.getMech('3e') || {}).lastRes, f3r = R('3f'), g3 = R('3g'), g5 = R('5g'), sp = (R('7c') || {}).speed, rate = (api.getMech('7d') || {}).rate;
  D.t = R('8b'); D.iv = R('8c'); D.dr = R('8d'); D.lc = R('8e'); D.acc = api.getMech('8f');
  D.stages = [
    ['photos', 'Photos', 'Step 1', '2,624 real EL photos, 64 × 64 grey, split by cell into train 1,574 · validation 525 · test 525.'],
    ['svc', 'Features + SVC', 'Step 2', b2 ? 'Line finder, dark map, pixel summary → ' + esc(b2.best) + ' (ranking score ' + b2.models.filter(function (x) { return x.name === b2.best; })[0].mean + ' in 5 folds)' + (d2 ? ', cutoff ' + f3(d2.cut) + ' for 95% recall.' : '.') : 'your scikit-learn inspector.'],
    ['cnn', 'CNN', 'Step 3', e3 ? 'TensorFlow.js network trained in this browser: best validation ranking score ' + f3(e3.best && e3.best.valAuc) + ' at epoch ' + (e3.best && e3.best.epoch) + '.' : 'your Keras-style CNN.'],
    ['blend', 'Blend + gates', 'Step 3', g3 ? 'CNN weight ' + (f3r ? f3r.bestW : '?') + ' · low gate ' + f3(g3.low) + ' · high gate ' + f3(g3.high) + ' → ' + f0(1000 * g3.lanes.human) + ' of 1,000 cells to a person on validation.' : 'the blend and the two gates.'],
    ['why', 'Why maps', 'Step 4', 'Cover-up and Grad-CAM heat maps; slices showed poly cells let more defects pass; your to-do boxes became the shopping list (8e).'],
    ['flow', 'LangGraph flow', 'Step 5', g5 && g5.s3 ? 'check photo → score → route (poly gate ' + f3(g5.lowPoly) + ') → person (pause / resume) → record. Validation shift: ' + g5.s3.all.defPassed + ' of ' + g5.s3.all.def + ' defects passed.' : 'the inspection flow with the person\'s pause.'],
    ['crew', 'Crew report', 'Step 6', 'Three agents with tools write the shift report; a guardrail sends back any number no tool gave.'],
    ['console', 'Operator console', 'Step 7', (sp ? 'One real decision ' + f0(sp.medianMs) + ' ms here. ' : '') + (rate ? 'You checked a cell in ' + f1(rate.medianSeconds) + ' s = ' + f0(rate.perHour) + ' per hour.' : 'Lamp, queue, board, report, fault drill.')],
    ['trial', 'Line trial', 'Step 8', D.t && D.t.trial ? D.t.trial.all.defPassed + ' of ' + D.t.trial.all.def + ' test defects passed = ' + f1(D.t.trial.all.per100) + ' per 100' + (D.iv && D.iv.ref ? ' (95%: ' + f1(D.iv.ref[0]) + ' to ' + f1(D.iv.ref[1]) + ')' : '') + ' — target ' + (D.t.trial.all.per100 <= 5 ? 'met' : 'MISSED') + '.' : 'the sealed test, run once.'],
    ['drift', 'Drift watch', 'Step 8', D.dr && D.dr.today ? 'PSI alarms on score, brightness, contrast, sharpness; act above ' + D.dr.ALARM + '. Today: ' + (D.dr.today.ring.length ? 'rings' : 'calm') + '.' : 'label-free alarms on the line.']];
  return D;
}
function vt(D) { return D.t && D.t.trial ? D.t.trial : null; }
/* 15 questions across Steps 1-8; each has a main version [0] and a retake version [1] with other values */
function questions(D) {
  var T = vt(D), V = D.t && D.t.val, IV = D.iv && D.iv.ref;
  var tk = T ? T.all.defPassed : 4, tn = T ? T.all.def : 82, vk = V ? V.all.defPassed : 6, vn = V ? V.all.def : 165;
  var hi = IV ? IV[1] : 7.2, lo = IV ? IV[0] : 1.9;
  return [
  { id: 'q1', step: 1, fmt: 'num', v: [
    { q: 'A photo is 64 × 64 grey pixels. <b>Type how many numbers one photo is.</b>', ans: 4096, tol: 0, unit: 'numbers', ex: 'A 10 × 10 photo has 10 rows of 10 = 100 numbers.', exp: { asked: 'How many grey values make one photo.', steps: ['A grey photo has one number per pixel.', 'Rows × columns = 64 × 64 = 4,096.'], page: 'Step 1: the photo pack is 2,624 photos × 4,096 bytes.', trap: 'Adding instead of multiplying: 64 + 64 = 128.', remember: 'A grey photo is rows × columns numbers.' } },
    { q: 'A photo is 32 × 32 grey pixels. <b>Type how many numbers one photo is.</b>', ans: 1024, tol: 0, unit: 'numbers', ex: 'A 10 × 10 photo has 10 rows of 10 = 100 numbers.', exp: { asked: 'How many grey values make one 32 × 32 photo.', steps: ['One number per pixel.', '32 × 32 = 1,024.'], page: 'Step 2 shrinks each photo to 32 × 32 before the pixel summary (PCA).', trap: '32 + 32 = 64.', remember: 'A grey photo is rows × columns numbers.' } }] },
  { id: 'q2', step: 1, fmt: 'tray', opts: ['train', 'validation', 'test'], v: [
    { q: '<b>Tap the tray you use to CHOOSE settings</b>, like a cutoff or a gate.', ans: 'validation', ex: 'A cooking contest: practise on recipes (train), pick the oven heat with a friend tasting (validation), the judge tastes once (test).', exp: { asked: 'Which tray is for choosing settings.', steps: ['Train: the model learns from it.', 'Validation: you choose settings on it (cutoff, blend, gates).', 'Test: sealed, used once at the end.'], page: 'Steps 2–5 chose every gate on the 525 validation cells.', trap: 'Choosing on the test tray: then nothing honest is left to test with.', remember: 'Train learns, validation chooses, test checks once.' } },
    { q: '<b>Tap the tray that must stay sealed until the final trial.</b>', ans: 'test', ex: 'In the cooking contest, the judge\'s plate is tasted only once, at the end.', exp: { asked: 'Which tray is kept sealed.', steps: ['The test tray is never used to learn or to choose.', 'It is opened once, after everything is frozen.'], page: '8a: you froze the settings, then broke the seal.', trap: '“Just a quick look” at the test tray — it starts to steer your choices.', remember: 'Open the test tray once, after the freeze.' } }] },
  { id: 'q3', step: 2, fmt: 'order', v: [
    { q: '<b>Tap the 4 steps in the order you do them.</b>', items: ['Fit PCA on the train tray', 'Turn all photos into features with that PCA', 'Train the model on the train features', 'Score the validation cells'], ex: 'Baking: weigh flour from the practice bag → use the same scale for all bags → bake the practice cakes → taste the friend\'s cakes.', exp: { asked: 'The order that keeps validation unseen while learning.', steps: ['PCA learns its summary from train only.', 'Then the same PCA turns every photo into features.', 'The model learns from the train features.', 'Only then you score validation.'], page: 'Step 2a: pca.fit(small[idx_train]).', trap: 'Fitting PCA on all photos: it peeks at validation and test.', remember: 'Anything that learns, learns from train only.' } },
    { q: '<b>Tap the 4 steps in the order you do them.</b>', items: ['Split the cells into 3 trays', 'Fit the scaler on the train tray', 'Train the model', 'Pick the cutoff on validation'], ex: 'Sort the post into 3 piles → set the scale on pile 1 → learn from pile 1 → decide the rule with pile 2.', exp: { asked: 'The safe order from split to cutoff.', steps: ['Split first, so nothing has seen the other trays.', 'The scaler learns from train.', 'The model learns from train.', 'The cutoff is chosen on validation.'], page: 'Steps 1c and 2d.', trap: 'Picking the cutoff on train: it looks better than it is.', remember: 'Split first; learn on train; choose on validation.' } }] },
  { id: 'q4', step: 2, fmt: 'num', v: [
    { q: 'The validation tray has 80 real defects. Your cutoff stops 76 of them. <b>Type the recall in %.</b>', ans: 95, tol: 0.05, unit: '%', ex: '50 defects, 45 stopped: recall = 45 ÷ 50 = 90%.', exp: { asked: 'Recall = the share of real defects that are stopped.', steps: ['76 ÷ 80 = 0.95.', '0.95 × 100 = 95%.'], page: 'Step 2d: the target was at least 95% recall.', trap: 'Dividing by ALL cells instead of the defects.', remember: 'Recall = defects stopped ÷ real defects.' } },
    { q: 'The validation tray has 120 real defects. Your cutoff stops 108 of them. <b>Type the recall in %.</b>', ans: 90, tol: 0.05, unit: '%', ex: '50 defects, 45 stopped: recall = 45 ÷ 50 = 90%.', exp: { asked: 'Recall for 108 of 120.', steps: ['108 ÷ 120 = 0.9.', '0.9 × 100 = 90%.'], page: 'Step 2d.', trap: 'Using good cells in the bottom of the fraction.', remember: 'Recall = defects stopped ÷ real defects.' } }] },
  { id: 'q5', step: 3, fmt: 'pick', v: [
    { q: '<b>Tap the reason</b> we divide the pixels by 255 before training the CNN.', opts: ['To make the photo smaller', 'So every input is between 0 and 1, which keeps training stable', 'To remove the defects', '255 is the number of photos'], ans: 1, ex: 'Prices from 0 to 1,000 € are often divided by 1,000 so a model sees 0 to 1.', exp: { asked: 'Why the pixels are scaled.', steps: ['Pixels go from 0 to 255.', '÷ 255 puts them between 0 and 1.', 'Small, similar input sizes keep the weight updates steady.'], page: 'Step 3a: X = tf.tensor(...).div(255).', trap: 'Thinking it changes the picture: it only changes the scale.', remember: 'Scale the inputs; the picture stays the same.' } },
    { q: '<b>Tap what a first-layer convolution filter learns.</b>', opts: ['A small pattern, like an edge or a dark line', 'The label of the cell', 'The order of the photos', 'The cutoff'], ans: 0, ex: 'A 3 × 3 window that lights up wherever it sees a vertical edge.', exp: { asked: 'What one filter is.', steps: ['A filter is a small window of weights (3 × 3).', 'It slides over the photo and lights up on one pattern.', 'Training picks patterns that help, like crack edges.'], page: 'Step 3c–3d: filters and feature maps.', trap: 'Thinking one filter knows “defect”: it only knows a small pattern.', remember: 'Filters find small patterns; later layers combine them.' } }] },
  { id: 'q6', step: 3, fmt: 'lane', opts: ['pass', 'person', 'stop'], v: [
    { q: 'Low gate 0.19, high gate 0.71. A mono cell scores <b>0.15</b>. <b>Tap its lane.</b>', ans: 'pass', ex: 'Gates 0.30 and 0.80, score 0.50 → between the gates → a person.', exp: { asked: 'Which lane a score falls in.', steps: ['Below the low gate → auto-pass.', '0.15 < 0.19 → PASS.'], page: 'Step 3g and the 5g route station.', trap: 'Thinking “low score = unsure”: low means the model is sure it is OK.', remember: 'Below low: pass. From high: stop. Between: a person.' } },
    { q: 'Low gate 0.19, high gate 0.71. A cell scores <b>exactly 0.71</b>. <b>Tap its lane.</b>', ans: 'stop', ex: 'Gates 0.30 and 0.80, score 0.50 → a person.', exp: { asked: 'The lane exactly at the high gate.', steps: ['The rule is p ≥ high → stop.', '0.71 ≥ 0.71 → STOP.'], page: 'routePoly: “else if (state.p >= high) lane = \'stop\'”.', trap: 'Reading “at the gate” as between the gates.', remember: 'At the high gate the cell stops.' } }] },
  { id: 'q7', step: 4, fmt: 'tf', v: [
    { q: '<b>Tap True or False for each line.</b>', items: [['A heat map shows where the model looked.', true], ['A hot spot on a crack proves the label is right.', false], ['Covering the hottest pixels should move the score more than covering random pixels.', true]], ex: 'A shop camera heat map shows where people stood — not why they bought.', exp: { asked: 'What heat maps can and cannot tell.', steps: ['Grad-CAM / cover-up show WHERE the model looked.', 'They do not check the label: the expert does.', 'If the map is honest, hiding the hot pixels hurts the score most.'], page: 'Step 4b–4d.', trap: 'Using a heat map as proof that the model is right.', remember: 'A heat map shows where, not whether.' } },
    { q: '<b>Tap True or False for each line.</b>', items: [['A hot spot on the cell\'s frame can mean the model uses the wrong clue.', true], ['A heat map can replace the expert label.', false], ['Grad-CAM uses the last convolution block.', true]], ex: 'If a dog detector looks at the grass, it learned “grass”, not “dog”.', exp: { asked: 'Reading heat maps.', steps: ['Hot on the frame or busbar: maybe the wrong clue.', 'Labels come from experts, never from the map.', 'Grad-CAM reads the last conv block (16 × 16 here).'], page: 'Step 4c–4f.', trap: 'Trusting a pretty map.', remember: 'A heat map shows where, not whether.' } }] },
  { id: 'q8', step: 5, fmt: 'type', v: [
    { q: 'Complete the code that resumes a paused flow with the person\'s answer. <b>Type the missing word.</b><pre>line.invoke(new Command({ ____: \'stop\' }), config)</pre>', ans: 'resume', ex: 'To jump a paused flow to another node, LangGraph uses Command({ goto: \'record\' }).', exp: { asked: 'The Command option that answers a paused interrupt.', steps: ['humanCheck called interrupt() and the flow paused.', 'Command({ resume: answer }) gives interrupt() its answer.', 'The same config (thread id) finds the paused flow.'], page: 'Step 5f and 7d.', trap: 'Using update or goto: they change the state, not the answer.', remember: 'Pause with interrupt, answer with resume.' } },
    { q: 'A station pauses the flow for a person. <b>Type the LangGraph function it calls</b> (without brackets).', ans: 'interrupt', ex: 'To answer a pause you use Command({ resume: … }).', exp: { asked: 'The pause function.', steps: ['Inside humanCheck: const answer = interrupt({ id, p });', 'The flow stops there until a Command({ resume }) comes.'], page: 'Step 5f.', trap: 'Typing “pause” or “wait”.', remember: 'Pause with interrupt, answer with resume.' } }] },
  { id: 'q9', step: 5, fmt: 'num', v: [
    { q: 'MAX_TRIES = 2. A photo is too dark every time. <b>Type how many photos are taken</b> before the cell goes to a person.', ans: 2, tol: 0, unit: 'photos', ex: 'A lift tries the door 4 times (MAX = 4), then calls the service desk.', exp: { asked: 'How the reshoot cap works.', steps: ['Photo 1 bad → reshoot (tries = 2).', 'Photo 2 bad, tries = MAX_TRIES → human_check.', '2 photos.'], page: 'Step 5e: no cap = an endless loop.', trap: 'Counting the person as a photo.', remember: 'Every loop needs a way out.' } },
    { q: 'MAX_TRIES = 3. A photo is blank every time. <b>Type how many photos are taken</b> before the cell goes to a person.', ans: 3, tol: 0, unit: 'photos', ex: 'A lift tries the door 4 times, then calls the service desk.', exp: { asked: 'The cap with 3 tries.', steps: ['Photos 1 and 2 bad → reshoot each time.', 'Photo 3 bad, tries = 3 → a person.'], page: 'Step 5e.', trap: 'Thinking the cap counts reshoots only (2).', remember: 'Every loop needs a way out.' } }] },
  { id: 'q10', step: 6, fmt: 'pick', v: [
    { q: 'The writer\'s report says 9 defects passed; the tool said 6. <b>Tap what the guardrail does.</b>', opts: ['Sends the report back, naming the wrong number', 'Changes the tool result to 9', 'Lets it through: 9 is close', 'Deletes the shift'], ans: 0, ex: 'A bank checks a typed amount against the receipt and sends it back if they differ.', exp: { asked: 'What a guardrail does with a wrong number.', steps: ['Every number in the report is checked against the tool facts.', '9 is not a fact → the task fails the guardrail.', 'The agent gets the error and writes again.'], page: 'Step 6f and 7f.', trap: 'Trusting a fluent report.', remember: 'Every number must come from a tool.' } },
    { q: 'A report line has a number no tool gave. <b>Tap what the console does.</b>', opts: ['Shows it, the crew is usually right', 'Holds the report back until every number is checked', 'Rounds the number', 'Asks the operator to guess'], ans: 1, ex: 'A pharmacy will not hand out a prescription with an unknown dose.', exp: { asked: 'What happens to an unchecked number.', steps: ['makeReport runs checkReport(raw, facts()).', 'If any number is unknown, the report is held.'], page: 'Step 7f: held reports.', trap: 'Showing it with a warning nobody reads.', remember: 'Unchecked numbers never reach the operator.' } }] },
  { id: 'q11', step: 7, fmt: 'lamp', opts: ['pass', 'person', 'stop', 'none'], v: [
    { q: 'The camera PC is lost: the flow returns an error. <b>Tap the lamp the screen must show.</b>', ans: 'none', ex: 'A parcel scanner that cannot read the label shows “NO READ”, never “SHIP”.', exp: { asked: 'The safe default for a broken answer.', steps: ['An error has no lane.', 'lampOf finds no lamp → LAMPS.none → NO VERDICT.', 'The cell goes to a person.'], page: 'Step 7b and the 7g fault drill.', trap: 'Keeping the last verdict (often PASS).', remember: 'Unknown is never PASS.' } },
    { q: 'A photo was too dark twice, so the flow paused for a person. <b>Tap the lamp.</b>', ans: 'person', ex: 'A parcel scanner that reads half a label shows “HOLD” for a person.', exp: { asked: 'The lamp for a paused flow.', steps: ['After 2 bad photos the flow goes to human_check.', 'It paused (__interrupt__) → CHECK.'], page: 'Step 7b: F1 showed CHECK.', trap: 'NO VERDICT: the flow did not break, it asked a person.', remember: 'Paused = CHECK; broken = NO VERDICT.' } }] },
  { id: 'q12', step: 8, fmt: 'num', v: [
    { q: 'Your line trial: <b>' + tk + ' of ' + tn + '</b> test defects passed. <b>Type defects passed per 100</b> (one decimal).', ans: Math.round(1000 * tk / tn) / 10, tol: 0.051, unit: 'per 100', ex: '3 of 60 defects passed: 3 ÷ 60 × 100 = 5.0 per 100.', exp: { asked: 'Turn a count into “per 100”.', steps: [tk + ' ÷ ' + tn + ' = ' + (tk / tn).toFixed(4) + '.', '× 100 = ' + (100 * tk / tn).toFixed(1) + ' per 100.'], page: '8b: your trial card.', trap: 'Dividing by all 525 cells instead of the defects.', remember: 'Per 100 defects = passed ÷ defects × 100.' } },
    { q: 'On validation: <b>' + vk + ' of ' + vn + '</b> defects passed. <b>Type defects passed per 100</b> (one decimal).', ans: Math.round(1000 * vk / vn) / 10, tol: 0.051, unit: 'per 100', ex: '3 of 60 defects passed: 5.0 per 100.', exp: { asked: 'The validation number per 100.', steps: [vk + ' ÷ ' + vn + ' = ' + (vk / vn).toFixed(4) + '.', '× 100 = ' + (100 * vk / vn).toFixed(1) + '.'], page: '8b: the validation column.', trap: 'Using cells instead of defects.', remember: 'Per 100 defects = passed ÷ defects × 100.' } }] },
  { id: 'q13', step: 8, fmt: 'yn', v: [
    { q: 'Your 95% interval is <b>' + f1(lo) + ' to ' + f1(hi) + '</b> defects passed per 100. The target is at most 5. <b>Can the target be promised? Tap Yes or No.</b>', ans: hi <= 5 ? 'yes' : 'no', ex: 'A courier: late parcels 2.6 to 19.9 per 100, promise at most 10 → No, the top end is above 10.', exp: { asked: 'Whether the whole interval is under the target.', steps: ['A promise must hold even at the bad end.', 'Top end ' + f1(hi) + (hi <= 5 ? ' ≤ 5 → Yes.' : ' > 5 → No.')], page: '8c: the interval line.', trap: 'Looking at the middle of the interval only.', remember: 'Promise what the top end allows.' } },
    { q: 'An interval is <b>' + (hi <= 5 ? '2.1 to 7.9' : '0.4 to 3.8') + '</b> per 100. The target is at most 5. <b>Can the target be promised? Tap Yes or No.</b>', ans: hi <= 5 ? 'no' : 'yes', ex: 'Late parcels 2.6 to 19.9 per 100, promise at most 10 → No.', exp: { asked: 'Whole interval under 5?', steps: ['Look at the top end.', hi <= 5 ? '7.9 > 5 → No.' : '3.8 ≤ 5 → Yes.'], page: '8c.', trap: 'Reading the low end.', remember: 'Promise what the top end allows.' } }] },
  { id: 'q14', step: 8, fmt: 'scale', opts: ['calm', 'watch', 'act'], v: [
    { q: 'A drift alarm reads <b>PSI 0.31</b>. <b>Tap calm, watch or act.</b>', ans: 'act', ex: 'PSI 0.05 → calm (below 0.1).', exp: { asked: 'Reading a PSI value with the rule of thumb.', steps: ['Below 0.1 calm; 0.1 to 0.25 watch; above 0.25 act.', '0.31 > 0.25 → act.'], page: '8d: ALARM = 0.25.', trap: 'Thinking the rule is a law: it is a rule of thumb.', remember: 'No labels on the line: the alarm is your early warning.' } },
    { q: 'A drift alarm reads <b>PSI 0.17</b>. <b>Tap calm, watch or act.</b>', ans: 'watch', ex: 'PSI 0.05 → calm.', exp: { asked: 'Reading PSI 0.17.', steps: ['0.1 ≤ 0.17 ≤ 0.25 → watch.'], page: '8d.', trap: 'Acting on every small wobble.', remember: 'Watch the trend over several shifts.' } }] },
  { id: 'q15', step: 8, fmt: 'pick', v: [
    { q: 'A line trial missed the target. <b>Tap the honest next step.</b>', opts: ['Move the low gate until the test tray meets the target', 'Report the miss; improve on train / validation; test once on a NEW sealed tray', 'Remove the defects that passed from the test tray', 'Run the trial again until it passes'], ans: 1, ex: 'A medicine trial that fails is reported; a new trial with new patients is run after changes.', exp: { asked: 'What keeps the test honest after a miss.', steps: ['A miss is a result: report it.', 'Changes happen on train / validation only.', 'The new version needs NEW sealed cells.'], page: '8a–8b: the freeze and the flag.', trap: 'Moving a gate “just a little” on the test tray.', remember: 'Freeze first, test once, report what you get.' } },
    { q: 'A learning curve reads 0.874 → 0.901 → 0.903 for 25% → 50% → 100% of the photos. <b>Tap what doubling the photos again will most likely buy.</b>', opts: ['A lot: +0.03 or more', 'Very little: the curve is flat', 'Nothing can be said at all', 'It makes the model worse'], ans: 1, ex: 'A runner: 10 km in 60 → 52 → 51 min after 1, 2, 4 months of training. Month 8 will buy little.', exp: { asked: 'Reading the end of a learning curve.', steps: ['Last doubling: 0.901 → 0.903 = +0.002.', 'The curve is flat: more of the same photos buys little.'], page: '8e: your own curve.', trap: 'Assuming more data always helps a lot.', remember: 'The curve tells you what the next photos are worth.' } }] }];
}
function rightOf(Q, v, a) {
  if (a == null) return false;
  if (Q.fmt === 'num') return Math.abs(+a - v.ans) <= (v.tol || 0) + 1e-9;
  if (Q.fmt === 'order') return a.join('|') === v.items.map(function (x, i) { return i; }).join('|');
  if (Q.fmt === 'tf') return v.items.every(function (it, i) { return a[i] === it[1]; });
  if (Q.fmt === 'type') return String(a).trim().replace(/[()'"\s]/g, '').toLowerCase() === v.ans;
  return a === v.ans;
}
function ansText(Q, v, a) {
  if (a == null) return '—';
  if (Q.fmt === 'num') return a + ' ' + (v.unit || '');
  if (Q.fmt === 'order') return a.map(function (i) { return (i + 1); }).join(' → ') === '1 → 2 → 3 → 4' ? 'right order' : a.map(function (i) { return '“' + v.items[i] + '”'; }).join(' → ');
  if (Q.fmt === 'tf') return v.items.map(function (it, i) { return a[i] == null ? '?' : a[i] ? 'T' : 'F'; }).join(' ');
  if (Q.fmt === 'pick') return v.opts[a];
  return { pass: 'PASS', person: 'CHECK / a person', stop: 'STOP', none: 'NO VERDICT', yes: 'Yes', no: 'No' }[a] || String(a);
}
function correctText(Q, v) {
  if (Q.fmt === 'order') return v.items.map(function (x, i) { return (i + 1) + '. ' + x; }).join(' ');
  if (Q.fmt === 'tf') return v.items.map(function (it) { return (it[1] ? 'True' : 'False'); }).join(' · ');
  return ansText(Q, v, Q.fmt === 'num' ? v.ans : v.ans);
}
function shuffled(n, seed) { var a = []; for (var i = 0; i < n; i++) a.push(i); var r = window.PG_STEP8_UTIL.lcg(seed); for (var j = n - 1; j > 0; j--) { var k = Math.floor(r() * (j + 1)), t = a[j]; a[j] = a[k]; a[k] = t; } if (a.join() === a.slice().sort().join()) a.reverse(); return a; }
/* one question card: answer → ONE check → correct answer + collapsed explanation; locked after check or after Submit */
function qCard(Q, vi, st, ro, onCheck, num) {
  var v = Q.v[vi], d = el('div', 'vc'); d.setAttribute('data-q8', Q.id + (vi ? 'b' : '')); d.style.marginBottom = '10px';
  var head = el('div', null, '<span style="font-family:Orbitron,Arial;font-size:11px;letter-spacing:.14em;color:#46e3ff">' + (vi ? 'RETAKE · ' : '') + 'QUESTION ' + num + ' · STEP ' + Q.step + '</span>'); d.appendChild(head);
  d.appendChild(el('div', null, v.q));
  var lock = st.locked || ro, cur = st.draft != null ? st.draft : null, body = el('div'); body.style.margin = '6px 0'; d.appendChild(body);
  function set(x) { st.draft = x; cur = x; draw(); }
  function draw() {
    body.innerHTML = ''; var val = st.locked ? st.a : cur;
    if (Q.fmt === 'num' || Q.fmt === 'type') {
      var inp = el('input'); inp.type = Q.fmt === 'num' ? 'number' : 'text'; inp.step = 'any'; inp.value = val == null ? '' : val; inp.disabled = lock; inp.style.cssText = 'width:150px;padding:6px;background:#0a1019;color:#e6eef8;border:1px solid #263346;border-radius:6px;font-size:15px';
      inp.oninput = function () { st.draft = inp.value === '' ? null : Q.fmt === 'num' ? +inp.value : inp.value; cur = st.draft; ck.disabled = cur == null; };
      body.appendChild(inp); if (v.unit) body.appendChild(el('span', 'hint', ' ' + v.unit));
    } else if (Q.fmt === 'order') {
      var seq = val || [], ord = shuffled(v.items.length, Q.id.length * 7 + vi);
      var box = el('div'); box.style.cssText = 'display:flex;flex-direction:column;gap:4px';
      ord.forEach(function (i) { var pos = seq.indexOf(i), b = el('button', 'btn small', (pos >= 0 ? '<b style="color:#46e3ff">' + (pos + 1) + '.</b> ' : '') + esc(v.items[i])); b.style.textAlign = 'left'; b.disabled = lock || pos >= 0; b.onclick = function () { set(seq.concat([i])); }; box.appendChild(b); });
      body.appendChild(box); if (!lock && seq.length) { var cl = el('button', 'btn small', 'Clear order'); cl.onclick = function () { set(null); }; body.appendChild(cl); }
    } else if (Q.fmt === 'tf') {
      var a = val || [];
      v.items.forEach(function (it, i) { var r = el('div', 'row'); r.style.margin = '3px 0'; r.appendChild(el('span', null, esc(it[0]))); [true, false].forEach(function (tv) { var b = el('button', 'btn small' + (a[i] === tv ? ' on' : ''), tv ? 'True' : 'False'); b.style.cssText = a[i] === tv ? 'border-color:#46e3ff;background:#0f2232' : ''; b.disabled = lock; b.onclick = function () { var n = a.slice(); n[i] = tv; set(n); }; r.appendChild(b); }); body.appendChild(r); });
    } else {
      var opts = Q.fmt === 'pick' ? v.opts.map(function (o, i) { return [i, o]; }) : Q.fmt === 'yn' ? [['yes', 'Yes'], ['no', 'No']] : Q.fmt === 'tray' ? Q.opts.map(function (o) { return [o, o.toUpperCase() + ' TRAY']; }) : Q.fmt === 'scale' ? [['calm', 'CALM · below 0.1'], ['watch', 'WATCH · 0.1 to 0.25'], ['act', 'ACT · above 0.25']] : Q.opts.map(function (o) { return [o, { pass: '● PASS', person: '▲ CHECK', stop: '■ STOP', none: '◌ NO VERDICT' }[o]]; });
      var row = el('div'); row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap' + (Q.fmt === 'pick' ? ';flex-direction:column' : '');
      opts.forEach(function (o) { var b = el('button', 'bet' + (val === o[0] ? ' sel' : ''), esc(o[1])); b.style.cssText = 'padding:7px 12px;text-align:left;' + (Q.fmt === 'pick' ? '' : 'flex:1;text-align:center'); b.disabled = lock; b.onclick = function () { set(o[0]); }; row.appendChild(b); });
      body.appendChild(row);
    }
    ck.disabled = lock || cur == null || (Q.fmt === 'order' && (cur || []).length < v.items.length) || (Q.fmt === 'tf' && v.items.some(function (x, i) { return (cur || [])[i] == null; }));
  }
  var ex = el('details', 'ex', '<summary>Worked example (other values)</summary><div class="exb">' + v.ex + '</div>');
  var ck = el('button', 'btn', 'Check'); ck.setAttribute('data-check8', Q.id + (vi ? 'b' : ''));
  ck.onclick = function () { if (ck.disabled) return; onCheck(cur, rightOf(Q, v, cur)); };
  draw();
  var foot = el('div', 'row'); d.appendChild(foot);
  if (!st.locked && !ro) { foot.appendChild(ck); foot.appendChild(el('span', 'hint', 'One check. Then it locks.')); }
  d.appendChild(ex);
  if (st.locked || ro) {
    var ok = st.locked && st.good, txt = st.locked ? (ok ? '✓ Right.' : '✗ Not right.') + ' Your answer: <b>' + esc(ansText(Q, v, st.a)) + '</b>. ' : 'Not answered. ';
    d.appendChild(el('div', 'verdict ' + (ok ? 'good' : 'bad'), txt + 'Correct answer: <b>' + esc(correctText(Q, v)) + '</b>.'));
    d.appendChild(why(v.exp, 'EXPLANATION (tap to open)'));
  }
  return d;
}
function stagesSVG(stages, seen, sel) {
  var W = 640, Hh = 150, n = stages.length, per = 5, s = '';
  stages.forEach(function (st, i) {
    var row = Math.floor(i / per), col = row ? per - 1 - (i % per) : i % per, x = 14 + col * 124, y = 16 + row * 72, on = seen[st[0]], cur = sel === st[0];
    if (i < n - 1) { var nx = Math.floor((i + 1) / per) !== row; s += nx ? '<path d="M' + (x + 52) + ' ' + (y + 44) + ' v 28" stroke="#46e3ff" stroke-width="2" marker-end="url(#ar8)"/>' : '<path d="M' + (row ? x - 4 : x + 108) + ' ' + (y + 22) + ' h ' + (row ? -12 : 12) + '" stroke="#46e3ff" stroke-width="2" marker-end="url(#ar8)"/>'; }
    s += '<g data-stage8="' + st[0] + '" style="cursor:pointer"><rect x="' + x + '" y="' + y + '" width="104" height="44" rx="8" fill="' + (cur ? '#0f2232' : '#0c1219') + '" stroke="' + (on ? '#3dffa0' : '#3a4658') + '" stroke-width="' + (cur ? 3 : 1.5) + '"/><text x="' + (x + 52) + '" y="' + (y + 19) + '" font-size="12" fill="#e6eef8" text-anchor="middle" font-weight="700">' + esc(st[1]) + '</text><text x="' + (x + 52) + '" y="' + (y + 34) + '" font-size="10" fill="' + (on ? '#3dffa0' : '#8d9bb0') + '" text-anchor="middle">' + esc(st[2]) + (on ? ' ✓' : '') + '</text></g>';
  });
  return '<svg viewBox="0 0 ' + W + ' ' + Hh + '" style="width:100%;height:auto;display:block"><defs><marker id="ar8" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#46e3ff"/></marker></defs>' + s + '</svg>';
}
function sceneRecap(s, stage, out, api) {
  var m = api.mech; m.seen = m.seen || {}; m.q = m.q || {}; m.rq = m.rq || {};
  var D = liveData(api), QS = questions(D), sel = m.sel || null;
  function allSeen() { return D.stages.every(function (x) { return m.seen[x[0]]; }); }
  function save(p) { api.setMech(Object.assign(p || {}, { done: allSeen() && m.submitted ? 1 : 0 })); }
  function draw() {
    var sy = stage.parentNode ? stage.parentNode.scrollTop : 0;
    stage.innerHTML = '';
    var w = el('div'); w.style.cssText = 'padding:10px 12px'; stage.appendChild(w);
    w.appendChild(el('div', 'hint', 'Your line, start to end. Tap every stage: what you built there and its real number.'));
    var sv = el('div'); sv.id = 'line8'; sv.innerHTML = stagesSVG(D.stages, m.seen, sel); w.appendChild(sv);
    sv.querySelectorAll('[data-stage8]').forEach(function (g) { g.addEventListener('click', function () { var k = g.getAttribute('data-stage8'); m.seen[k] = 1; m.sel = sel = k; save({ seen: m.seen, sel: k }); draw(); side(); }); });
    var stx = D.stages.filter(function (x) { return x[0] === sel; })[0];
    w.appendChild(el('div', 'verdict', stx ? '<b>' + esc(stx[1]) + '</b> <span class="hint">· ' + esc(stx[2]) + '</span><br>' + stx[3] : 'Tap a stage.'));
    w.appendChild(el('div', 'hint', Object.keys(m.seen).length + ' of ' + D.stages.length + ' stages seen.'));
    /* the final test */
    var ft = el('div'); ft.id = 'final8'; ft.style.marginTop = '14px'; w.appendChild(ft);
    var h2 = el('h2', null, 'FINAL TEST · ' + QS.length + ' questions · Steps 1–8'); h2.style.cssText = 'font-size:17px;color:#46e3ff;margin:4px 0'; ft.appendChild(h2);
    ft.appendChild(el('p', 'hint', 'Every question says what to do. Each has one Check: then it shows the correct answer and locks. Questions you have not checked stay open until you press Submit at the end.'));
    QS.forEach(function (Q, i) { var st = m.q[Q.id] || (m.q[Q.id] = {}); ft.appendChild(qCard(Q, 0, st, !!m.submitted, function (a, good) { m.q[Q.id] = { a: a, locked: 1, good: good ? 1 : 0 }; save({ q: m.q }); draw(); side(); }, i + 1)); });
    if (!m.submitted) {
      var left = QS.filter(function (Q) { return !(m.q[Q.id] && m.q[Q.id].locked); }).length;
      var sb = el('button', 'btn run', 'SUBMIT THE TEST'); sb.id = 'submit8';
      var sn = el('span', 'hint', left ? ' ' + left + ' question' + (left > 1 ? 's' : '') + ' not checked yet: they count as not answered.' : ' All checked.');
      sb.onclick = function () { if (left && !sb.dataset.sure) { sb.dataset.sure = 1; sb.textContent = 'SUBMIT ANYWAY (' + left + ' open)'; return; } QS.forEach(function (Q) { var x = m.q[Q.id]; if (!x || !x.locked) m.q[Q.id] = { a: null, locked: 1, good: 0, unanswered: 1 }; }); m.submitted = new Date().toLocaleString(); save({ q: m.q, submitted: m.submitted }); draw(); side(); };
      var r = el('div', 'row'); r.appendChild(sb); r.appendChild(sn); ft.appendChild(r);
    } else {
      var wrong = QS.filter(function (Q) { return !m.q[Q.id].good; });
      ft.appendChild(el('div', 'verdict good', 'Submitted ' + esc(m.submitted) + '. The test is locked. Score: <b>' + (QS.length - wrong.length) + ' of ' + QS.length + '</b>.'));
      if (wrong.length) {
        var rt = el('div'); rt.id = 'retake8'; ft.appendChild(rt);
        rt.appendChild(el('h2', null, '<span style="color:#ffb547">RETAKE · </span>only the ' + wrong.length + ' question' + (wrong.length > 1 ? 's' : '') + ' you missed · other values'));
        wrong.forEach(function (Q) { var st = m.rq[Q.id] || (m.rq[Q.id] = {}); rt.appendChild(qCard(Q, 1, st, false, function (a, good) { m.rq[Q.id] = { a: a, locked: 1, good: good ? 1 : 0 }; save({ rq: m.rq }); draw(); side(); }, QS.indexOf(Q) + 1)); });
      }
    }
    if (stage.parentNode) stage.parentNode.scrollTop = sy;
  }
  function side() {
    out.innerHTML = '';
    X8().liveFlag(out, api);
    var sc = card(out, 'SCORECARD', m.submitted ? 'Final.' : 'Fills in as you check.'); sc.id = 'score8';
    var right = QS.filter(function (Q) { return m.q[Q.id] && m.q[Q.id].good; }).length;
    tiles(sc, [[right + ' / ' + QS.length, 'right', right >= 12 ? 'g' : right >= 8 ? 'a' : 'r'], [QS.filter(function (Q) { return m.q[Q.id] && m.q[Q.id].locked; }).length, 'checked', ''], [m.submitted ? 'yes' : 'no', 'submitted', m.submitted ? 'g' : '']]);
    sc.appendChild(el('table', 'tbl', '<tr><th>#</th><th>step</th><th>your answer</th><th>correct answer</th><th></th></tr>' + QS.map(function (Q, i) { var x = m.q[Q.id] || {}, v = Q.v[0], shown = x.locked; var rr = m.rq[Q.id];
      return '<tr><td>' + (i + 1) + '</td><td>' + Q.step + '</td><td style="font-family:inherit;font-size:13px">' + (x.locked ? esc(x.unanswered ? 'not answered' : ansText(Q, v, x.a)) : '—') + '</td><td style="font-family:inherit;font-size:13px">' + (shown ? esc(correctText(Q, v)) : '<span class="hint">after Check</span>') + '</td><td>' + (x.locked ? (x.good ? '<b style="color:#3dffa0">✓</b>' : '<b style="color:#ff4d6a">✗</b>') : '') + (rr && rr.locked ? ' · retake ' + (rr.good ? '<b style="color:#3dffa0">✓</b>' : '<b style="color:#ff4d6a">✗</b>') : '') + '</td></tr>'; }).join('')));
    if (m.submitted) {
      var wrong = QS.filter(function (Q) { return !m.q[Q.id].good; });
      if (wrong.length) { var sol = card(out, 'SOLUTIONS FOR YOUR WRONG ANSWERS', 'Step by step, with the numbers.'); wrong.forEach(function (Q) { var v = Q.v[0], e = v.exp, d = el('div', null, '<b>Question ' + (QS.indexOf(Q) + 1) + '.</b> ' + v.q.replace(/<pre>[\s\S]*<\/pre>/, '') + '<div class="why" style="margin-top:4px"><div class="wb" style="padding:8px 12px"><div class="lab">WHAT THE QUESTION ASKS</div>' + e.asked + '<div class="lab">HOW TO GET THE ANSWER</div><ol>' + e.steps.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol><div class="lab">WHERE YOU SAW IT</div>' + e.page + '<div class="lab">COMMON TRAP</div>' + e.trap + '<div class="rem">⟶ ' + e.remember + ' · Answer: ' + esc(correctText(Q, v)) + '</div></div></div>'); d.style.marginBottom = '8px'; sol.appendChild(d); }); }
    }
    var pv = card(out, 'YOUR PREDICTIONS DURING THE COURSE', 'Each was one try, before the run.');
    var P = window.PG && window.PG.S ? window.PG.S.subs : {}, list = ['1b', '2b', '2d', '3e', '4d', '5d', '6d', '7e'].filter(function (k) { return P[k] && P[k].pred && P[k].pred.locked; });
    pv.appendChild(el('div', 'hint', list.length ? list.map(function (k) { var p = P[k].pred; return k + ': ' + (p.good === 1 ? '✓' : p.good === 0 ? '✗' : 'locked'); }).join(' · ') + (m.range ? '' : '') : 'No predictions recorded here.'));
    var r8 = api.getMech('8a'), t = D.t && D.t.trial; if (r8 && r8.rangeLocked && t) pv.appendChild(el('div', 'hint', '8a range ' + f1(r8.range[0]) + '–' + f1(r8.range[1]) + ' vs trial ' + f1(t.all.per100) + ': ' + (t.all.per100 >= r8.range[0] && t.all.per100 <= r8.range[1] ? '✓' : '✗')));
    takeHome(out);
    limits(out, D);
    if (allSeen() && m.submitted) { var e = el('div', 'endc', '<h3 class="fh">COURSE COMPLETE — PANELGUARD</h3><p>You built a real inspection station: data, two models, gates, a flow with a person, a crew report, an operator console, an honest line trial, a drift watch and a go / no-go sheet. Every number on these pages came from your own runs.</p>'); e.id = 'done8'; out.appendChild(e); }
  }
  draw(); side();
  return {};
}
function takeHome(host) {
  var TH = window.PG_TAKEHOME;
  var c = card(host, 'TAKE IT HOME · YOUR PROJECT IN PYTHON', 'The Python twins, put together as one project that runs outside the browser.');
  if (!TH || !TH.files) { c.appendChild(el('div', 'hint', 'The project files are not in this build.')); return; }
  c.appendChild(el('div', 'hint', esc(TH.note || '')));
  TH.files.forEach(function (f) {
    var d = el('details'); d.setAttribute('data-file8', f.name); d.style.cssText = 'margin:4px 0;border:1px solid #263346;border-radius:8px;background:#0a1019';
    var sm = el('summary', null, '<b style="font-family:Space Mono,monospace">' + esc(f.name) + '</b> <span class="hint">· ' + f.text.split('\n').length + ' lines · ' + esc(f.what || '') + '</span>'); sm.style.cssText = 'cursor:pointer;padding:6px 8px'; d.appendChild(sm);
    var bar = el('div', 'row'); bar.style.padding = '0 8px'; bar.appendChild(copyBtn(f.text, '⧉ Copy ' + f.name)); d.appendChild(bar);
    var pre = el('pre'); pre.textContent = f.text; pre.style.cssText = 'max-height:260px;overflow:auto;margin:6px 8px 8px;font-size:12px;background:#06090d;padding:8px;border-radius:6px'; d.appendChild(pre);
    c.appendChild(d);
  });
  c.appendChild(copyBtn(function () { return TH.files.map(function (f) { return '# ===== ' + f.name + ' =====\n' + f.text; }).join('\n\n'); }, '⧉ Copy all files', 'copyall8'));
}
function limits(host, D) {
  var t = D.t && D.t.trial;
  var c = card(host, 'LIMITS OF THIS BUILD', 'Say these out loud before anyone uses the numbers.'); c.id = 'limits8';
  c.appendChild(el('ul', null, '<li><b>Dataset licence is non-commercial</b> (ELPV, CC BY-NC-SA 4.0): fine for learning, not for a product.</li>' +
    '<li><b>Split by cell, not by module:</b> cells from the same panel can sit in train and test, so the test can be a little too kind.</li>' +
    '<li><b>64 × 64 photos:</b> thin cracks lose detail at this size.</li>' +
    '<li><b>Label noise:</b> experts were unsure on some cells (scores 0.33 / 0.67); a “defect” here is score ≥ 0.5.</li>' +
    '<li><b>Perfect-checker assumption:</b> in the trial the person always answers like the expert. Real people miss some (Step 5g: right 9 in 10).</li>' +
    '<li><b>One small test tray:</b> ' + (t ? t.all.def + ' real defects, so one escape moves the number by ' + f1(100 / t.all.def) + ' per 100' : 'a few dozen real defects') + '. The interval in 8c says how wide that is.</li>'));
}

Object.assign(window.PGViz8, { ownCard: ownCard, acceptance: sceneAcceptance, recap: sceneRecap, _questions: questions, _rightOf: rightOf, _judge: judge, _acceptFacts: acceptFacts });
})();
