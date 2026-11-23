/* PanelGuard Diagram guide — Step 4 diagrams (4a 4b 4c 4d 4e 4f). Uses window.PGD (engine.js).
   Numbers: the student's own live values when that substep passed ("your value"), else facts.json s4 made by
   tools/guide/facts45.py with the lab's own Step 4 rules on the reference CNN (test fixture, Keras twin seed 0) ("typical value").
   Code-gap answers (4b, 4c, 4d, 4e) are never written here; the 4d result stays locked until its token question is answered. */
(function () {
'use strict';
var D = window.PGD, A = D.art, C = A.COL, t = A.t, fmt = D.fmt;
var F4 = function () { return (window.PGD_FACTS || {}).s4 || {}; };
function f3(x) { return x == null || isNaN(x) ? '–' : (+x).toFixed(3); }
function p0(x) { return Math.round(100 * x) + '%'; }
function p1(x) { return (100 * x).toFixed(1) + '%'; }
function srcTag(you) { return { tag: you ? 'your value' : 'typical value' }; }
function refNote(you) { return you ? null : { t: '<i>Reference run: the lab’s Step 4 code on the Step 3 network (Keras twin, seed 0).</i>' }; }
function clean(a) { return a.filter(function (r) { return r; }); }
function snapTo(sx, sy, dx, dy, step) { return (sx + Math.round((dx - sx) / step) * step) + ',' + (sy + Math.round((dy - sy) / step) * step); }
function at(o, id) { return (o || []).filter(function (q) { return q.id === id; })[0]; }

/* ---------- heat pictures ---------- */
var INF = [[0, 0, 0, 4], [0.2, 40, 11, 84], [0.4, 101, 21, 110], [0.6, 159, 42, 99], [0.75, 212, 72, 66], [0.88, 245, 125, 21], [1, 252, 255, 164]];
function inferno(v) {
  v = Math.max(0, Math.min(1, v)); for (var k = 1; k < INF.length; k++) if (v <= INF[k][0]) { var a = INF[k - 1], b = INF[k], f = (v - a[0]) / (b[0] - a[0]); return [a[1] + f * (b[1] - a[1]), a[2] + f * (b[2] - a[2]), a[3] + f * (b[3] - a[3])]; }
  return INF[INF.length - 1].slice(1);
}
function hex(rgb) { return '#' + rgb.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
var HC = {};
/* vals: n*n numbers. o: {max, alpha (fade the cold end), div (blue for negatives)} */
function heatURL(vals, n, key, o) {
  o = o || {}; if (HC[key]) return HC[key];
  try {
    var mx = o.max || Math.max.apply(null, vals.map(Math.abs)) || 1, cv = document.createElement('canvas'); cv.width = cv.height = n;
    var x = cv.getContext('2d'), im = x.createImageData(n, n);
    for (var i = 0; i < n * n; i++) {
      var v = vals[i] / mx, k = 4 * i, rgb;
      if (o.div && v < 0) { var u = Math.min(1, -v); rgb = [40 + 30 * u, 110 + 60 * u, 190 + 60 * u]; im.data[k + 3] = o.alpha ? Math.round(255 * Math.min(1, 0.25 + u)) : 255; }
      else { rgb = inferno(v); var va = o.floor ? Math.max(0, (v - o.floor) / (1 - o.floor)) : Math.max(0, v); im.data[k + 3] = o.alpha ? Math.round(255 * Math.min(1, Math.pow(va, 0.7) * 1.3)) : 255; }
      im.data[k] = rgb[0]; im.data[k + 1] = rgb[1]; im.data[k + 2] = rgb[2];
    }
    x.putImageData(im, 0, 0); return (HC[key] = cv.toDataURL('image/png'));
  } catch (e) { return ''; }
}
function img(href, x, y, s, o) { o = o || {}; return href ? '<image href="' + href + '" x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" preserveAspectRatio="none"' + (o.px ? ' style="image-rendering:pixelated"' : '') + (o.op != null ? ' opacity="' + o.op + '"' : '') + (o.cls ? ' class="' + o.cls + '"' : '') + '/>' : ''; }
/* a colour scale with real ticks */
function scaleBar(x, y, w, max, lab) {
  var id = A.uid('sb'), s = '<defs><linearGradient id="' + id + '">' + [0, .2, .4, .6, .75, .88, 1].map(function (v) { return '<stop offset="' + v + '" stop-color="' + hex(inferno(v)) + '"/>'; }).join('') + '</linearGradient></defs>';
  s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="12" rx="3" fill="url(#' + id + ')"/>';
  [0, 0.5, 1].forEach(function (f) { s += '<line x1="' + (x + f * w) + '" x2="' + (x + f * w) + '" y1="' + (y + 12) + '" y2="' + (y + 18) + '" stroke="#5d6b80"/>' + t(x + f * w, y + 34, f3(f * max), { size: 14, a: f === 0 ? 'start' : f === 1 ? 'end' : 'middle', f: 'm', fill: C.dim }); });
  if (lab) s += t(x + w / 2, y - 8, lab, { size: 14, a: 'middle', fill: C.dim });
  return s;
}
function meanOf(id) { var px = D.pixels(id); if (!px) return 128; var s = 0; for (var i = 0; i < 4096; i++) s += px[i]; return s / 4096; }

/* ============================ 4b  The cover-up test ============================ */
/* the cover-up map of one cell: the student's own (4b passed) or the reference run */
function cov4(id) {
  var r = D.liveRes('4b'), k = r && r.ids ? r.ids.indexOf(id) : -1;
  if (k >= 0 && r.maps && r.maps[k]) return { map: r.maps[k], base: r.bases[k], you: true };
  var f = at(F4().paint, id); return f ? { map: f.cover, base: f.score, you: false } : null;
}
var PB = { x: 56, y: 70, s: 384, k: 6 };            // the photo: 64 px x 6
var MB = { x: 662, y: 92, cs: 18 };                  // the map: 15 x 15 squares
var SB = { x: 512, y: 92, h: 300 };                  // the score meter: 0..1 over 300 px
function spotXY(r, c) { return [PB.x + c * 4 * PB.k, PB.y + r * 4 * PB.k]; }
function maxOf(m) { var b = 0, k = 0; m.forEach(function (v, i) { if (v > b) { b = v; k = i; } }); return { v: b, r: Math.floor(k / 15), c: k % 15 }; }
function meter4b(V, st) {
  var s = '', y0 = SB.y + SB.h, Y = function (v) { return y0 - v * SB.h; }, now = V.base - V.map[st.r * 15 + st.c], drop = V.map[st.r * 15 + st.c];
  s += t(SB.x + 52, SB.y - 30, 'SCORE', { size: 14, f: 'h', a: 'middle', fill: C.dim, ls: '.1em' });
  [0, 0.25, 0.5, 0.75, 1].forEach(function (v) { s += '<line x1="' + (SB.x - 4) + '" x2="' + (SB.x + 112) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#16273a"/>' + t(SB.x - 8, Y(v) + 5, v === 0 || v === 1 ? String(v) : v.toFixed(2), { size: 14, a: 'end', f: 'm', fill: C.dim2 }); });
  // before
  s += '<rect x="' + SB.x + '" y="' + Y(V.base) + '" width="44" height="' + (V.base * SB.h) + '" rx="4" fill="#46e3ff" fill-opacity=".85"/>';
  s += t(SB.x + 22, Y(V.base) - 8, f3(V.base), { size: 15, a: 'middle', f: 'm', w: 700, fill: C.cy });
  s += t(SB.x + 22, y0 + 22, 'before', { size: 15, a: 'middle', fill: C.dim });
  // now (with the tile)
  s += '<rect x="' + (SB.x + 64) + '" y="' + Y(now) + '" width="44" height="' + Math.max(0, now * SB.h) + '" rx="4" fill="#9fb4c9"/>';
  if (drop > 0.001) s += '<rect x="' + (SB.x + 64) + '" y="' + Y(V.base) + '" width="44" height="' + (drop * SB.h) + '" rx="4" fill="#ff4d6a" fill-opacity=".25" stroke="#ff4d6a" stroke-width="2" stroke-dasharray="4 3"/>' +
    '';
  s += t(SB.x + 86, Y(V.base) - 8, drop > 0.0005 ? '−' + f3(drop) : f3(now), { size: 15, a: 'middle', f: 'm', w: 700, fill: drop > 0.0005 ? '#ff8aa0' : '#cfe0f0' });
  s += t(SB.x + 86, y0 + 22, 'covered', { size: 15, a: 'middle', fill: C.dim });
  return s;
}
function map4b(V, st, o) {
  o = o || {}; var s = '', mx = maxOf(V.map).v || 1;
  s += t(MB.x, MB.y - 30, 'COVER-UP MAP', { size: 14, f: 'h', fill: C.dim, ls: '.1em' }) + t(MB.x + 15 * MB.cs, MB.y - 30, '15 × 15 spots', { size: 14, a: 'end', f: 'm', fill: C.dim2 });
  s += '<rect x="' + (MB.x - 4) + '" y="' + (MB.y - 4) + '" width="' + (15 * MB.cs + 8) + '" height="' + (15 * MB.cs + 8) + '" rx="6" fill="#04070c" stroke="#22384d"/>';
  for (var r = 0; r < 15; r++) for (var c = 0; c < 15; c++) {
    var k = r * 15 + c, seen = o.all || st.seen.indexOf(k) >= 0, v = V.map[k], x = MB.x + c * MB.cs, y = MB.y + r * MB.cs;
    s += '<rect x="' + x + '" y="' + y + '" width="' + (MB.cs - 1.5) + '" height="' + (MB.cs - 1.5) + '" rx="2" fill="' + (seen ? hex(inferno(0.1 + 0.9 * Math.max(0, v) / mx)) : '#0b121b') + '"' + (seen ? '' : ' stroke="#15202d"') +
      (o.all && o.seq ? ' class="pgd-seq" style="animation-delay:' + (r * 70) + 'ms"' : '') + '/>';
  }
  if (!o.noCur) { var cx = MB.x + st.c * MB.cs, cy = MB.y + st.r * MB.cs; s += '<rect x="' + (cx - 2) + '" y="' + (cy - 2) + '" width="' + (MB.cs + 2.5) + '" height="' + (MB.cs + 2.5) + '" rx="3" fill="none" stroke="#ffb547" stroke-width="2.5"/>'; }
  s += scaleBar(MB.x, MB.y + 15 * MB.cs + 30, 15 * MB.cs, mx, 'score drop');
  return s;
}
function photo4b(fx, st, o) {
  o = o || {}; var s = '', P = PB;
  s += A.glass(P.x - 16, P.y - 16, P.s + 32, P.s + 32, { fx: fx, col: '#2b4760' });
  s += A.cell(496, P.x, P.y, P.s, { full: true, r: 2 });
  if (o.heat) s += img(o.heat, P.x, P.y, P.s, { op: 0.75, cls: 'pgd-fade' });
  // the spot grid: one faint dot per spot centre
  for (var r = 0; r < 15; r++) for (var c = 0; c < 15; c++) { var q = spotXY(r, c), on = st.seen.indexOf(r * 15 + c) >= 0; s += '<circle cx="' + (q[0] + 24) + '" cy="' + (q[1] + 24) + '" r="' + (on ? 2.2 : 1.4) + '" fill="' + (on ? '#ffb547' : '#ffffff') + '" opacity="' + (on ? .75 : .28) + '"/>'; }
  return s;
}
function tile4b(st, gray) {
  var q = spotXY(st.r, st.c), g = Math.round(gray);
  return '<rect x="' + (q[0] - 1) + '" y="' + (q[1] - 1) + '" width="50" height="50" rx="3" fill="rgb(' + g + ',' + g + ',' + g + ')" stroke="#e6eef8" stroke-width="2" filter="drop-shadow(0 4px 6px rgba(0,0,0,.7))"/>' +
    '<path d="M' + (q[0] + 6) + ' ' + (q[1] + 6) + 'h36v36h-36z" fill="none" stroke="#000" stroke-opacity=".15"/>';
}
function where4b(st) {   // the tile's place in pixels
  var r0 = st.r * 4, c0 = st.c * 4;
  return t(MB.x - 4, 466, 'tile on spot ' + st.r + ', ' + st.c, { size: 16, w: 700, fill: C.am }) + t(MB.x - 4, 490, 'rows ' + r0 + '–' + (r0 + 7) + ' · columns ' + c0 + '–' + (c0 + 7), { size: 15, f: 'm', fill: C.dim });
}
function scene4b(c, o) {
  o = o || {}; var V = cov4(496), fx = A.fx(), st = c.state, s = A.stage() + fx.defs;
  if (!V) return s + t(480, 270, 'Loading the map…', { a: 'middle', fill: C.dim });
  s += t(PB.x - 16, 40, 'CELL 496 · A REAL CRACKED CELL', { size: 15, f: 'h', fill: C.dim, ls: '.08em' });
  s += '<g id="ph4b">' + photo4b(fx, st, o) + '</g>';
  s += '<g id="mt4b">' + meter4b(V, st) + '</g>';
  s += '<g id="mp4b">' + map4b(V, st, o) + '</g>';
  s += '<g id="wh4b">' + (o.noWhere ? '' : where4b(st)) + '</g>';
  return s;
}
function upd4b(c, root) {   // live redraw of the parts that change while the tile moves
  var V = cov4(496), st = c.state, fx = A.fx();
  var m = root.querySelector('#mt4b'); if (m) m.innerHTML = meter4b(V, st);
  m = root.querySelector('#mp4b'); if (m) m.innerHTML = map4b(V, st);
  m = root.querySelector('#wh4b'); if (m) m.innerHTML = where4b(st);
  m = root.querySelector('#ph4b'); if (m) m.innerHTML = photo4b(fx, st);
  c.rework();
}
function work4b(c) {
  var V = cov4(496), st = c.state; if (!V) return [];
  var d = V.map[st.r * 15 + st.c], mx = maxOf(V.map);
  return clean([{ h: 'One spot' }, { v: f3(V.base), k: 'score before: nothing covered' }, { op: '−', v: f3(V.base - d), k: 'score with the tile on ' + 'spot ' + st.r + ', ' + st.c },
    { op: '=', v: f3(d), k: 'the drop at this spot', res: true, col: d >= 0.5 * mx.v ? C.gr : null }, { bar: Math.max(0, d) / mx.v, col: '#ff8a5c', mark: 0.5 },
    { t: 'Biggest drop on this cell: <b>' + f3(mx.v) + '</b>. The white mark is half of it.' },
    srcTag(V.you), refNote(V.you)]);
}
D.register('4b', {
  init: function () { return { r: 0, c: 14, seen: [14] }; },
  frames: [
  { cap: 'Hide one small part. Does the score fall?',
    note: 'A gray tile, 8 by 8 pixels, covers one spot of the photo. The network scores the covered photo again. The drop tells how much it needed that spot.',
    svg: function (c) {
      var st = c.state, q = spotXY(st.r, st.c), V = cov4(496), s = scene4b(c);
      if (!V) return s;
      var best = maxOf(V.map), b = spotXY(best.r, best.c);
      s += A.target('tile', tile4b(st, meanOf(496)), 'drag the gray tile', q[0] + 24, PB.y + PB.s + 34 > 0 ? PB.y + PB.s + 40 : 0, { kind: 'drag', to: snapTo(q[0] + 24, q[1] + 24, b[0] + 24, b[1] + 24, 24) });
      return s;
    },
    work: work4b,
    bind: function (c, root) {
      var st = c.state, V = cov4(496); if (!V) return;
      var el = root.querySelector('[data-pgd-t=tile]'), q0 = spotXY(st.r, st.c), sx = q0[0] + 24, sy = q0[1] + 24;
      function spotOf(p) { return { r: Math.max(0, Math.min(14, Math.round((p.y - PB.y - 24) / 24))), c: Math.max(0, Math.min(14, Math.round((p.x - PB.x - 24) / 24))) }; }
      D.onDrag(root, el, { start: { x: sx, y: sy }, step: 24,
        clamp: function (p) { return { x: Math.max(PB.x + 24, Math.min(PB.x + 24 + 14 * 24, p.x)), y: Math.max(PB.y + 24, Math.min(PB.y + 24 + 14 * 24, p.y)) }; },
        move: function (p) {
          var sp = spotOf(p), q = spotXY(sp.r, sp.c);
          el.setAttribute('transform', 'translate(' + (q[0] + 24 - sx) + ' ' + (q[1] + 24 - sy) + ')');
          if (sp.r !== st.r || sp.c !== st.c) { st.r = sp.r; st.c = sp.c; var k = sp.r * 15 + sp.c; if (st.seen.indexOf(k) < 0) st.seen.push(k); upd4b(c, root); }
        },
        drop: function () { if (st.seen.length >= 6) c.next(); } });   // tried a few spots: the idea is seen
    },
    auto: function (c) { var st = c.state; [13, 12, 11, 10, 9].forEach(function (q) { st.seen.push(q); }); st.c = 9; } },
  { cap: 'Now every spot, one after another',
    note: 'The same test on all 225 spots fills the cover-up map: one square per spot, brighter where the score fell more.',
    svg: function (c) {
      var s = scene4b(c, { noWhere: 1 }), st = c.state;
      s += tile4b(st, meanOf(496));
      s += A.target('sweep', '<rect x="' + (MB.x + 40) + '" y="' + (MB.y + 15 * MB.cs / 2 - 26) + '" width="' + (15 * MB.cs - 80) + '" height="52" rx="14" fill="#0b121b" fill-opacity=".92" stroke="#ffb547" stroke-width="2.5"/>',
        'test all 225 spots', MB.x + 15 * MB.cs / 2, MB.y + 15 * MB.cs / 2 + 62, { inner: t(MB.x + 15 * MB.cs / 2, MB.y + 15 * MB.cs / 2 + 7, 'SWEEP', { size: 20, a: 'middle', f: 'h', fill: C.am, ls: '.12em' }) });
      return s;
    },
    work: function (c) {
      var V = cov4(496); if (!V) return [];
      var st = c.state; return clean([{ h: 'How many spots' }, { v: '(64 − 8) ÷ 4 + 1', k: 'tile 8 px wide, moved 4 px each time' }, { op: '=', v: '15', k: 'spots across (and 15 down)' }, { op: '=', v: '15 × 15 = 225', k: 'spots in the map', res: true },
        { h: 'Tested so far' }, { v: st.seen.length + ' of 225', k: 'by hand, with the tile' }, { t: 'The lab does the other spots in one go: it makes 225 covered copies of the photo and scores them all at once.' }, srcTag(V.you), refNote(V.you)]);
    },
    on: { sweep: function (c) { c.state.all = 1; c.next(); } },
    auto: function (c) { c.state.all = 1; } },
  { cap: 'Bright square = the network needed that spot',
    note: 'The brightest squares sit on the crack: covering them made the score fall most. Dark squares did not matter.',
    svg: function (c) {
      var V = cov4(496), st = c.state, s = scene4b(c, { all: 1, seq: 1, noCur: 1, noWhere: 1 }); if (!V) return s; void st;
      var b = maxOf(V.map), x = MB.x + b.c * MB.cs, y = MB.y + b.r * MB.cs;
      s += A.target('hot', '<rect x="' + (x - 4) + '" y="' + (y - 4) + '" width="' + (MB.cs + 6) + '" height="' + (MB.cs + 6) + '" rx="4" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap the brightest square', MB.x + 15 * MB.cs / 2, MB.y - 56 < 30 ? 30 : MB.y - 52, {});
      return s;
    },
    work: function (c) {
      var V = cov4(496); if (!V) return [];
      var mx = maxOf(V.map), n = V.map.filter(function (v) { return v >= 0.5 * mx.v; }).length, neg = V.map.filter(function (v) { return v < 0; }).length;
      return clean([{ h: 'The whole map' }, { v: '225', k: 'spots' }, { v: String(n), k: 'spots with a drop of at least half the biggest (' + f3(mx.v / 2) + ')' }, { v: String(neg), k: 'spots where the score went UP a little (shown black)' }, srcTag(V.you), refNote(V.you)]);
    },
    on: { hot: function (c) { var V = cov4(496), b = maxOf(V.map); c.state.r = b.r; c.state.c = b.c; c.state.pick = 1; c.next(); } },
    auto: function (c) { var V = cov4(496), b = maxOf(V.map); c.state.r = b.r; c.state.c = b.c; c.state.pick = 1; } },
  { cap: 'Is that spot on the crack?',
    note: 'The tile goes back on the photo at the brightest square. That is the part the network needed most. Check: is it the crack, or something else?',
    svg: function (c) {
      var V = cov4(496), st = c.state, s = scene4b(c, { all: 1, noCur: 1, noWhere: 1 }); if (!V) return s;
      var b = maxOf(V.map), q = spotXY(b.r, b.c), mx = MB.x + b.c * MB.cs + MB.cs / 2, my = MB.y + b.r * MB.cs + MB.cs / 2;
      s += '<path class="pgd-draw" style="--len:700" d="M' + mx + ' ' + my + 'C' + (mx - 120) + ' ' + (my + 90) + ' ' + (q[0] + 160) + ' ' + (q[1] + 90) + ' ' + (q[0] + 50) + ' ' + (q[1] + 24) + '" stroke="#ffb547" stroke-width="2.5" fill="none" stroke-dasharray="6 5"/>';
      s += '<rect x="' + (mx - MB.cs / 2 - 4) + '" y="' + (my - MB.cs / 2 - 4) + '" width="' + (MB.cs + 6) + '" height="' + (MB.cs + 6) + '" rx="4" fill="none" stroke="#ffb547" stroke-width="3"/>';
      s += '<g class="pgd-pop">' + tile4b({ r: b.r, c: b.c }, meanOf(496)) + '<rect x="' + (q[0] - 5) + '" y="' + (q[1] - 5) + '" width="58" height="58" rx="5" fill="none" stroke="#ffb547" stroke-width="3"/></g>';
      s += A.tag(q[0] + 58, q[1] - 10, 'drop ' + f3(b.v), '#ff8a5c', { size: 15 });
      s += t(MB.x - 4, 466, 'biggest drop: spot ' + b.r + ', ' + b.c, { size: 16, w: 700, fill: C.am }) + t(MB.x - 4, 490, 'rows ' + 4 * b.r + '–' + (4 * b.r + 7) + ' · columns ' + 4 * b.c + '–' + (4 * b.c + 7), { size: 15, f: 'm', fill: C.dim });
      s += A.target('more', '<rect x="' + (SB.x - 30) + '" y="438" width="150" height="56" rx="12" fill="#0b121b" stroke="#ffb547" stroke-width="2.5"/>', 'two more cells', SB.x + 45, 522, { inner: t(SB.x + 45, 474, '+2 CELLS', { size: 17, a: 'middle', f: 'h', fill: C.am }) });
      return s;
    },
    work: function (c) {
      var V = cov4(496); if (!V) return [];
      var b = maxOf(V.map);
      return clean([{ h: 'The brightest square' }, { v: 'spot ' + b.r + ', ' + b.c, k: 'row × 4 and column × 4 give its pixels' }, { v: f3(b.v), k: 'drop: ' + p0(b.v / V.base) + ' of the score ' + f3(V.base), res: true },
        V.you ? { t: 'Look at the photo: is this the crack, or the border or a corner?' } : { t: 'On cell 496 it is the <b>bottom-left corner</b>, not the long crack. The network leans on the corner. Step 4f keeps such cases: “looked at the wrong place”.' },
        srcTag(V.you), refNote(V.you)]);
    },
    on: { more: function (c) { c.next(); } } },
  { cap: 'The test on three cracked cells',
    note: 'The map, laid over each photo, shows where covering hurt the score. Each square is 4 by 4 pixels, so the map is a little blurry.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs, ids = [496, 1088, 379];
      s += t(40, 40, 'COVER-UP MAP OVER THE PHOTO · 3 REAL CRACKED CELLS', { size: 15, f: 'h', fill: C.dim, ls: '.08em' });
      ids.forEach(function (id, j) {
        var V = cov4(id); if (!V) return;
        var x = 48 + j * 300, y = 74, S = 260, mx = maxOf(V.map);
        s += A.glass(x - 12, y - 12, S + 24, S + 128, { fx: fx, col: j === 0 ? '#7a5a2a' : '#2b4760' });
        s += A.cell(id, x, y, S, { full: true, r: 2 }) + '<rect x="' + x + '" y="' + y + '" width="' + S + '" height="' + S + '" fill="#000" opacity=".3"/>';
        // the 15 x 15 spot map covers pixels 0..63 with 8 px tiles every 4 px: centre squares of 4 px, offset 2 px
        s += '<g class="pgd-fade">' + img(heatURL(V.map.map(function (v) { return Math.max(0, v); }), 15, 'c4b' + id + (V.you ? 'y' : ''), { alpha: 1, max: mx.v }), x + S * 2 / 64, y + S * 2 / 64, S * 60 / 64, { op: 0.95 }) + '</g>';
        s += t(x, y + S + 32, 'cell ' + id, { size: 17, w: 700, fill: '#fff' }) + t(x + S, y + S + 32, 'score ' + f3(V.base), { size: 16, a: 'end', f: 'm', fill: C.cy });
        s += t(x, y + S + 60, 'biggest drop', { size: 15, fill: C.dim }) + t(x + S, y + S + 60, f3(mx.v), { size: 16, a: 'end', f: 'm', w: 700, fill: '#ff8a5c' });
        s += t(x, y + S + 86, 'that is ' + p0(mx.v / V.base) + ' of its score', { size: 15, fill: C.dim });
      });
      return s;
    },
    work: function (c) {
      var rows = [{ h: 'Biggest drop ÷ score' }], you = false;
      [496, 1088, 379].forEach(function (id) { var V = cov4(id); if (!V) return; you = you || V.you; var mx = maxOf(V.map).v; rows.push({ v: f3(mx) + ' ÷ ' + f3(V.base), k: '= ' + p0(mx / V.base) + ' · cell ' + id }); });
      rows.push({ t: 'One tile never hides the whole crack, so the score falls only part of the way.' }, srcTag(you), refNote(you));
      return clean(rows);
    } }
  ]
});


/* block 3 of the network: its size shows (the 3c code gap holds its filter count) only after 3c is passed */
function k3() { return D.liveRes('3c') || D.predDone('3c') ? '64' : '?'; }

/* ============================ 4a  Mark where YOU look ============================ */
var PA = { x: 56, y: 70, s: 384, k: 6 };
function hot4a(id) {   // the network's hottest 410 pixels: from the student's own 4c run when passed, else the reference run
  var r = D.liveRes('4c'), c = r && r.cells ? r.cells.filter(function (q) { return q.id === id; })[0] : null;
  if (c && c.up && c.up.length === 4096) { var o = []; for (var i = 0; i < 4096; i++) o.push(i); o.sort(function (a, b) { return c.up[b] - c.up[a]; }); return { hot: o.slice(0, 410), you: true }; }
  var f = at(F4().paint, id); return f ? { hot: f.hot, you: false } : null;
}
function pixPath(list, x0, y0, k) { return list.map(function (p) { return 'M' + (x0 + (p % 64) * k) + ' ' + (y0 + Math.floor(p / 64) * k) + 'h' + k + 'v' + k + 'h-' + k + 'z'; }).join(''); }
function paint4a(st, o) {
  o = o || {}; var s = '', P = PA, H = o.hot ? hot4a(496) : null, set = {};
  st.paint.forEach(function (p) { set[p] = 1; });
  if (H) {
    var both = H.hot.filter(function (p) { return set[p]; }), net = H.hot.filter(function (p) { return !set[p]; }), mine = st.paint.filter(function (p) { return H.hot.indexOf(p) < 0; });
    s += '<path d="' + pixPath(mine, P.x, P.y, P.k) + '" fill="#46e3ff" fill-opacity=".5"/>';
    s += '<path class="pgd-fade" d="' + pixPath(net, P.x, P.y, P.k) + '" fill="#ff8a2a" fill-opacity=".62"/>';
    s += '<path class="pgd-fade" d="' + pixPath(both, P.x, P.y, P.k) + '" fill="#ffffff" fill-opacity=".92"/>';
  } else s += '<path d="' + pixPath(st.paint, P.x, P.y, P.k) + '" fill="#46e3ff" fill-opacity=".55"/>';
  return s;
}
function brush4a(x, y) {
  return '<g transform="translate(' + x + ' ' + y + ') scale(1.5) translate(' + (-x) + ' ' + (-y) + ')"><circle cx="' + x + '" cy="' + y + '" r="15" fill="#46e3ff" fill-opacity=".25" stroke="#46e3ff" stroke-width="2"/>' +
    '<path d="M' + (x + 4) + ' ' + (y - 4) + 'L' + (x + 46) + ' ' + (y - 46) + '" stroke="#c98a4a" stroke-width="9" stroke-linecap="round"/><path d="M' + (x + 30) + ' ' + (y - 30) + 'L' + (x + 46) + ' ' + (y - 46) + '" stroke="#e6eef8" stroke-width="9" stroke-linecap="round"/>' +
    '<path d="M' + (x - 2) + ' ' + (y + 2) + 'L' + (x + 8) + ' ' + (y - 8) + '" stroke="#46e3ff" stroke-width="8" stroke-linecap="round"/></g>';
}
function base4a(c, fx, o) {
  o = o || {}; var st = c.state, s = A.stage() + fx.defs, P = PA;
  s += t(P.x - 16, 40, 'CELL 496 · YOU ARE THE EXPERT', { size: 15, f: 'h', fill: C.dim, ls: '.08em' });
  s += A.glass(P.x - 16, P.y - 16, P.s + 32, P.s + 32, { fx: fx, col: '#2b4760' }) + A.cell(496, P.x, P.y, P.s, { full: true, r: 2 });
  s += '<g id="pt4a">' + paint4a(st, o) + '</g>';
  return s;
}
function stat4a(st, o) {   // the right-hand panel
  o = o || {}; var s = '', x = 486, H = hot4a(496), n = st.paint.length;
  s += t(x, 92, 'YOUR PAINT', { size: 15, f: 'h', fill: C.cy, ls: '.1em' }) + t(x, 136, fmt(n) + ' px', { size: 34, f: 'm', w: 700, fill: '#fff' }) + t(x, 162, 'of 4,096 pixels = ' + p1(n / 4096), { size: 16, fill: C.dim });
  if (o.hot && H) {
    var set = {}; st.paint.forEach(function (p) { set[p] = 1; }); var k = H.hot.filter(function (p) { return set[p]; }).length, chance = n / 4096;
    s += '<g class="pgd-in">' + t(x, 222, 'NETWORK’S HOTTEST 10%', { size: 15, f: 'h', fill: '#ff8a2a', ls: '.1em' }) + t(x, 264, '410 px', { size: 34, f: 'm', w: 700, fill: '#fff' }) + t(x, 290, 'from its Grad-CAM map (4c)', { size: 16, fill: C.dim }) + '</g>';
    s += '<g class="pgd-in2">' + A.glass(x - 14, 318, 446, 168, { col: '#8a7a3a' }) + t(x, 352, 'INSIDE YOUR PAINT', { size: 15, f: 'h', fill: '#fff', ls: '.1em' }) +
      '<text x="' + x + '" y="408" font-family="' + A.FM + '" font-size="46" font-weight="700" fill="#fff" data-pgd-from="0">' + k + '</text>' + t(x + 26 + String(k).length * 26, 406, 'of 410 = ' + p1(k / 410), { size: 22, f: 'm', w: 700, fill: '#ffcf6b' }) +
      t(x, 440, 'by chance (random spots): ' + p1(chance), { size: 16, fill: C.dim }) + t(x, 466, k / 410 > 2 * chance ? 'more than chance: you and the network agree a little' : 'about chance or less: you looked at different places', { size: 16, w: 700, fill: k / 410 > 2 * chance ? C.gr : '#ff8aa0' }) + '</g>';
    s += '<g transform="translate(' + x + ' 506)">' + '<rect width="16" height="16" fill="#46e3ff" fill-opacity=".6"/>' + t(22, 13, 'only you', { size: 15, fill: C.dim }) + '<rect x="110" width="16" height="16" fill="#ff8a2a"/>' + t(132, 13, 'only the network', { size: 15, fill: C.dim }) + '<rect x="282" width="16" height="16" fill="#fff"/>' + t(304, 13, 'both', { size: 15, fill: C.dim }) + '</g>';
  }
  return s;
}
function work4a(c, hot) {
  var st = c.state, n = st.paint.length, H = hot4a(496), r = [{ h: 'Your paint' }, { v: fmt(n) + ' px', k: 'painted' }, { op: '÷', v: '4,096', k: 'pixels in the photo' }, { op: '=', v: p1(n / 4096), k: 'of the photo', res: true }];
  if (hot && H) {
    var set = {}; st.paint.forEach(function (p) { set[p] = 1; }); var k = H.hot.filter(function (p) { return set[p]; }).length;
    r.push({ h: 'Overlap, pixel by pixel' }, { v: '10% × 4,096 ≈ 410', k: 'the network’s hottest pixels' }, { v: k + ' ÷ 410', k: 'hot pixels inside your paint' }, { op: '=', v: p1(k / 410), k: 'agreement', res: true },
      { t: 'If the hot pixels were scattered at random, ' + p1(n / 4096) + ' would land in your paint (your share of the photo).' }, srcTag(H.you), H.you ? null : refNote(false));
  } else if (n < 30) r.push({ t: 'Paint at least 30 pixels over the defect.' });
  return clean(r);
}
D.register('4a', {
  init: function () { return { paint: [] }; },
  frames: [
  { cap: 'You are the expert: paint over the defect',
    note: 'Paint over the place that makes this cell bad. Later we check if the network looks at the same place.',
    svg: function (c) {
      var fx = A.fx(), st = c.state, s = base4a(c, fx) + '<g id="st4a">' + stat4a(st) + '</g>', bx = PA.x + PA.s + 40, by = PA.y + 31 * PA.k;
      s += A.target('brush', brush4a(bx, by), 'paint over the defect', bx + 150, by + 70, { kind: 'drag', to: snapTo(bx, by, PA.x + 34 * PA.k, by, 12) });
      return s;
    },
    work: function (c) { return work4a(c, false); },
    bind: function (c, root) {
      var st = c.state, el = root.querySelector('[data-pgd-t=brush]'), bx = PA.x + PA.s + 40, by = PA.y + 31 * PA.k, set = {};
      st.paint.forEach(function (p) { set[p] = 1; });
      function dab(p) {
        var cr = Math.floor((p.y - PA.y) / PA.k), cc = Math.floor((p.x - PA.x) / PA.k), add = 0;
        for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) { if (i * i + j * j > 5) continue; var r = cr + i, q = cc + j; if (r < 0 || q < 0 || r > 63 || q > 63) continue; var k = r * 64 + q; if (!set[k]) { set[k] = 1; st.paint.push(k); add++; } }
        if (add) { root.querySelector('#pt4a').innerHTML = paint4a(st); root.querySelector('#st4a').innerHTML = stat4a(st); c.rework(); }
      }
      var last = null;
      D.onDrag(root, el, { start: { x: bx, y: by }, step: 12,
        clamp: function (p) { return { x: Math.max(PA.x, Math.min(bx, p.x)), y: Math.max(PA.y, Math.min(PA.y + PA.s - 1, p.y)) }; },
        move: function (p) {
          el.setAttribute('transform', 'translate(' + (p.x - bx) + ' ' + (p.y - by) + ')');
          if (p.x < PA.x + PA.s) { if (last) { var d = Math.hypot(p.x - last.x, p.y - last.y), n = Math.ceil(d / 4); for (var u = 1; u <= n; u++) dab({ x: last.x + (p.x - last.x) * u / n, y: last.y + (p.y - last.y) * u / n }); } else dab(p); last = p; } else last = null;
        },
        drop: function () { last = null; if (st.paint.length >= 30) c.next(); } });
    },
    auto: function (c) { var st = c.state; for (var r = 28; r < 34; r++) for (var q = 26; q < 42; q++) st.paint.push(r * 64 + q); } },
  { cap: 'Where did the network look?',
    note: 'Turn on the network view. It lights the 410 pixels (10%) that pushed its defect score most, from Grad-CAM in 4c.',
    svg: function (c) {
      var fx = A.fx(), st = c.state, s = base4a(c, fx) + stat4a(st), x = 486;
      s += A.target('view', '<rect x="' + x + '" y="210" width="300" height="70" rx="35" fill="#0b121b" stroke="#ff8a2a" stroke-width="2.5"/><circle cx="' + (x + 36) + '" cy="245" r="24" fill="#3a4757"/>', 'turn on the network view', x + 150, 314,
        { inner: t(x + 74, 252, 'NETWORK VIEW: OFF', { size: 17, f: 'h', fill: '#ff8a2a', ls: '.06em' }) });
      return s;
    },
    work: function (c) { return work4a(c, false); },
    on: { view: function (c) { c.state.view = 1; c.next(); } },
    auto: function (c) { c.state.view = 1; } },
  { cap: 'Your paint and the network’s hot spots',
    note: 'White pixels are where you and the network agree. Count them: that share, compared with chance, tells how much you agree.',
    svg: function (c) { var fx = A.fx(), st = c.state; return base4a(c, fx, { hot: 1 }) + stat4a(st, { hot: 1 }); },
    work: function (c) { return work4a(c, true); } }
  ]
});

/* ============================ 4c  Ask the network directly ============================ */
var P4 = function () { return F4().parts || {}; };
var BX = [{ x: 200, f: 96, lab: '64 × 64 × 16', n: 3 }, { x: 352, f: 78, lab: '32 × 32 × 32', n: 5 }, { x: 494, f: 62, lab: '16 × 16 × ', n: 8 }, { x: 626, f: 46, lab: '8 × 8 × 128', n: 11 }];
var BC4 = ['#46e3ff', '#3dffa0', '#a98bff', '#ffb547'], YC = 168, RAIL = 300;
function cam4c(id) {   // the Grad-CAM map: the student's own (4c passed) or the reference run
  var r = D.liveRes('4c'), c = r && r.cells ? r.cells.filter(function (q) { return q.id === id; })[0] : null;
  if (c && c.cam) return { cam: c.cam, cover: c.cover, score: c.score, you: true, tag: c.tag };
  var f = at(F4().paint, id) || at(F4().picks, id); return f ? { cam: f.cam, cover: f.cover, score: f.score, you: false, tag: f.tag } : null;
}
function net4c(fx, lit, o) {
  o = o || {}; var s = '', P = P4();
  s += A.photoCard(496, 40, YC - 60, 120, { fx: fx, label: 'cell 496' });
  var prev = 166;
  BX.forEach(function (b, k) {
    var on = lit.indexOf(k) >= 0, col = BC4[k];
    s += A.arrow(prev + 6, YC, b.x - 8, YC, '#5d6b80', { w: 2, head: 8 });
    for (var q = b.n - 1; q >= 0; q--) { var sx = b.x + q * 4, sy = YC - b.f / 2 - q * 3; s += '<rect x="' + sx + '" y="' + sy + '" width="' + b.f + '" height="' + b.f + '" rx="3" fill="' + (q ? '#0f2233' : on ? '#1d1433' : '#0a1622') + '" stroke="' + col + '" stroke-opacity="' + (q ? (on ? .6 : .3) : .95) + '"' + (on && !q ? ' filter="url(#' + fx.gl + ')"' : '') + '/>'; }
    if (k === 2 && P.maps) s += img(heatURL(P.maps[0], 16, 'm4c0', { max: Math.max.apply(null, P.maps[0]) }), b.x, YC - b.f / 2, b.f, { px: 1, op: on ? 1 : .55 });
    s += t(b.x + b.f / 2 + b.n * 2, YC + b.f / 2 + 26, 'block ' + (k + 1), { size: 16, a: 'middle', w: 700, fill: col }) + t(b.x + b.f / 2 + b.n * 2, YC + b.f / 2 + 46, k === 2 ? b.lab + k3() : b.lab, { size: 14, a: 'middle', f: 'm', fill: C.dim });
    prev = b.x + b.f + b.n * 4;
  });
  s += A.arrow(prev + 6, YC, 780, YC, '#5d6b80', { w: 2, head: 8 });
  var V = cam4c(496);
  s += A.glass(784, YC - 54, 146, 108, { fx: fx, col: '#ff4d6a' }) + t(857, YC - 22, 'DEFECT SCORE', { size: 14, a: 'middle', f: 'h', fill: '#ff8aa0', ls: '.06em' }) + t(857, YC + 18, V ? f3(V.score) : '–', { size: 32, a: 'middle', f: 'm', w: 700, fill: '#fff' });
  return s;
}
function cord4c(x1, lit) {   // the why? cord from the score back to x1 along the rail
  var s = '<path d="M857 ' + (YC + 54) + 'V' + RAIL + 'H' + x1 + '" stroke="#ff4d6a" stroke-width="4" fill="none" stroke-linecap="round"' + (lit ? ' filter="drop-shadow(0 0 6px #ff4d6a)"' : '') + '/>';
  return s;
}
function handle4c(x) { return '<g><circle cx="' + x + '" cy="' + RAIL + '" r="18" fill="#2a0d16" stroke="#ff4d6a" stroke-width="3"/>' + t(x, RAIL + 6, 'why?', { size: 15, a: 'middle', w: 700, fill: '#ff8aa0' }) + '</g>'; }
function work4cA(c) {
  var V = cam4c(496); return clean([{ h: 'The question' }, { t: 'Which places of the photo pushed the defect score <b>' + (V ? f3(V.score) : '') + '</b> up?' },
    { h: 'Where we ask' }, { v: '16 × 16 × ' + k3(), k: 'block 3: ' + k3() + ' feature maps, each 16 × 16' }, { v: '64 ÷ 16 = 4', k: 'one square of a map = 4 × 4 pixels of the photo' }, srcTag(V && V.you)]);
}
D.register('4c', {
  init: function () { return { x: 857 }; },
  frames: [
  { cap: 'Ask the network: why this score?',
    note: 'Grad-CAM starts at the score and walks back into the network, to the feature maps of block 3. Those maps still know WHERE things are.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs + t(40, 40, 'THE NETWORK · CELL 496', { size: 15, f: 'h', fill: C.dim, ls: '.08em' }) + net4c(fx, []);
      s += '<line x1="190" x2="857" y1="' + RAIL + '" y2="' + RAIL + '" stroke="#2b3a4c" stroke-width="10" stroke-linecap="round"/>' + '<g id="cd4c">' + cord4c(857) + '</g>';
      var b3 = BX[2], tx = b3.x + b3.f / 2 + 16;
      s += '<path d="M' + tx + ' ' + (RAIL - 22) + 'V' + (YC + b3.f / 2 + 54) + '" stroke="#a98bff" stroke-dasharray="4 4"/>' + '<circle cx="' + tx + '" cy="' + RAIL + '" r="22" fill="none" stroke="#a98bff" stroke-width="2.5" stroke-dasharray="5 4"/>';
      s += A.target('cord', handle4c(857), 'pull the why? cord back', 690, RAIL + 60, { kind: 'drag', to: snapTo(857, RAIL, tx, RAIL, 16) });
      s += A.glass(40, 392, 880, 128, { fx: fx, col: '#22384d' }) + t(60, 424, 'WHY BLOCK 3?', { size: 15, f: 'h', fill: '#a98bff', ls: '.1em' });
      s += t(60, 456, 'Blocks 1–2: small details, no meaning yet.', { size: 17, fill: '#c7d4e4' }) + t(60, 484, 'Block 4: 8 × 8, too coarse to show the place.', { size: 17, fill: '#c7d4e4' }) + t(500, 456, 'Block 3: 16 × 16 maps that already', { size: 17, fill: '#fff' }) + t(500, 484, 'react to defects, and still show where.', { size: 17, fill: '#fff' });
      return s;
    },
    work: work4cA,
    bind: function (c, root) {
      var el = root.querySelector('[data-pgd-t=cord]'), b3 = BX[2], tx = b3.x + b3.f / 2 + 16, cd = root.querySelector('#cd4c');
      D.onDrag(root, el, { start: { x: 857, y: RAIL }, step: 16,
        clamp: function (p) { return { x: Math.max(tx - 40, Math.min(857, p.x)), y: RAIL }; },
        move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - 857) + ' 0)'); cd.innerHTML = cord4c(p.x, true); },
        drop: function (p) { if (Math.abs(p.x - tx) < 30) { c.state.at3 = 1; c.next(); } } });
    },
    auto: function (c) { c.state.at3 = 1; } },
  { cap: 'Block 3 holds many maps. Each gets a weight.',
    note: 'For every map, Grad-CAM asks: if this map were a bit brighter, how much would the score rise? The average answer is that map’s weight.',
    svg: function (c) {
      var fx = A.fx(), P = P4(), s = A.stage() + fx.defs; if (!P.maps) return s;
      s += t(40, 40, 'BLOCK 3 OF CELL 496 · ' + k3() + ' MAPS OF 16 × 16 · THE 6 THAT MATTER MOST', { size: 15, f: 'h', fill: '#a98bff', ls: '.06em' });
      P.top.forEach(function (ch, j) {
        var x = 40 + j * 148, y = 74, S = 120, w = P.w[ch];
        s += '<g class="pgd-in"><rect x="' + (x - 6) + '" y="' + (y - 6) + '" width="' + (S + 12) + '" height="' + (S + 82) + '" rx="10" fill="#0b121b" stroke="#2b3a4c"/>' + img(heatURL(P.maps[j], 16, 'm4c' + j, { max: Math.max.apply(null, P.maps[j]) }), x, y, S, { px: 1 });
        s += t(x + S / 2, y + S + 26, 'map ' + ch, { size: 15, a: 'middle', f: 'm', fill: C.dim }) + A.tag(x + S / 2, y + S + 60, '× ' + (w >= 0 ? '+' : '') + w.toFixed(5), w >= 0 ? C.gr : C.rd, { a: 'middle', size: 14 }) + '</g>';
      });
      s += t(40, 300, k3() === '?' ? '+ the other maps with smaller weights: some push the score up (+), some push it down (−)' : '+ 58 maps with smaller weights: ' + P.nPos + ' push the score up (+), ' + P.nNeg + ' push it down (−)', { size: 16, fill: C.dim });
      s += A.target('sum', '<circle cx="480" cy="412" r="54" fill="#0b121b" stroke="#ffb547" stroke-width="3"/>', 'weigh and add them up', 480, 500, { inner: t(480, 432, 'Σ', { size: 58, a: 'middle', f: 'm', w: 700, fill: C.am }) });
      for (var j = 0; j < 6; j++) s += '<path d="M' + (100 + j * 148) + ' 316C' + (100 + j * 148) + ' 360 480 340 480 356" stroke="#3a4757" stroke-width="1.5" fill="none"/>';
      return s;
    },
    work: function (c) {
      var P = P4(); if (!P.w) return [];
      return clean([{ h: 'Weight of one map' }, { t: 'Average, over its 16 × 16 squares, of how much each square pushes the score up.' }].concat(P.top.slice(0, 3).map(function (ch) { return { v: (P.w[ch] >= 0 ? '+' : '') + P.w[ch].toFixed(5), k: 'map ' + ch }; }))
        .concat([{ t: 'The weights are small because one square of one map changes the score only a little.' }, srcTag(false), refNote(false)]));
    },
    on: { sum: function (c) { c.next(); } } },
  { cap: 'Add the weighted maps. Keep only the positive part.',
    note: 'Map × its weight, all added up, gives one 16 × 16 map. Negative squares pushed the score DOWN, so they are set to 0.',
    svg: function (c) {
      var fx = A.fx(), P = P4(), s = A.stage() + fx.defs, st = c.state; if (!P.raw) return s;
      var raw = P.raw, mx = Math.max.apply(null, raw.map(Math.abs)), x = 60, y = 70, S = 300;
      s += t(x, 50, st.relu ? 'AFTER: NEGATIVES SET TO 0' : 'THE WEIGHTED SUM', { size: 15, f: 'h', fill: C.dim, ls: '.08em' });
      s += img(heatURL(st.relu ? raw.map(function (v) { return Math.max(0, v); }) : raw, 16, 'raw4c' + (st.relu ? 'r' : ''), { div: 1, max: mx }), x, y, S, { px: 1 });
      s += '<rect x="' + x + '" y="' + y + '" width="' + S + '" height="' + S + '" fill="none" stroke="#3a4757"/>';
      var hr = P.hot[0], hc = P.hot[1], cs = S / 16; s += '<rect x="' + (x + hc * cs) + '" y="' + (y + hr * cs) + '" width="' + cs + '" height="' + cs + '" fill="none" stroke="#fff" stroke-width="2.5"/>';
      s += A.tag(x + hc * cs + cs + 10, y + hr * cs + cs / 2 + 6, 'row ' + hr + ', col ' + hc + ': ' + (raw[hr * 16 + hc] * 1000).toFixed(2) + ' ‰', '#fff', { size: 14 });
      // the 16 x 16 grid: coarse
      for (var i = 1; i < 16; i++) s += '<path d="M' + (x + i * cs) + ' ' + y + 'v' + S + 'M' + x + ' ' + (y + i * cs) + 'h' + S + '" stroke="#000" stroke-opacity=".25"/>';
      s += t(x, y + S + 28, '16 × 16 squares: each one is 4 × 4 pixels of the photo', { size: 15, fill: C.dim });
      var neg = raw.filter(function (v) { return v < 0; }).length;
      s += '<g transform="translate(' + (x + S + 50) + ' 90)">' + '<rect width="18" height="18" fill="#4a8fd9"/>' + t(28, 15, neg + (neg === 1 ? ' square' : ' squares') + ' below 0 (pushed the score down)', { size: 16, fill: '#9cc4ef' }) +
        '<rect y="34" width="18" height="18" fill="#f57d15"/>' + t(28, 49, (256 - neg) + ' squares above 0 (pushed it up)', { size: 16, fill: '#ffcf8a' }) + '</g>';
      if (!st.relu) s += A.target('relu', '<rect x="430" y="210" width="420" height="80" rx="14" fill="#0b121b" stroke="#ffb547" stroke-width="2.5"/>', 'drop the negative squares', 640, 318,
        { inner: t(640, 246, 'below 0  →  0', { size: 24, a: 'middle', f: 'm', w: 700, fill: C.am }) + t(640, 274, 'keep only what pushed towards “defect”', { size: 15, a: 'middle', fill: C.dim }) });
      return s;
    },
    work: function (c) {
      var P = P4(); if (!P.terms) return [];
      var T = P.terms, top = T.slice(0, 3), rest = T.slice(3).reduce(function (z, q) { return z + q[1] * q[2]; }, 0), tot = T.reduce(function (z, q) { return z + q[1] * q[2]; }, 0);
      var r = [{ h: 'The hottest square (row ' + P.hot[0] + ', col ' + P.hot[1] + ')' }];
      top.forEach(function (q, j) { r.push({ op: j ? '+' : '', v: q[1].toFixed(2) + ' × ' + q[2].toFixed(5), k: 'map ' + q[0] + ': value × weight' }); });
      r.push({ op: '+', v: (rest * 1000).toFixed(2) + ' ‰', k: 'all the other maps' }, { op: '=', v: (tot * 1000).toFixed(2) + ' ‰', k: 'its heat (‰ = thousandths)', res: true }, { t: 'Below 0 would become 0. Above 0 stays.' }, srcTag(false), refNote(false));
      return r;
    },
    on: { relu: function (c) { c.state.relu = 1; c.next(); } },
    auto: function (c) { c.state.relu = 1; } },
  { cap: 'Two ways, one answer? Grad-CAM vs the cover-up test',
    note: 'Grad-CAM asks the network once. The cover-up test needs 225 runs. If both light the same place, trust grows. Each Grad-CAM square is 4 × 4 pixels: coarse.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs, rows = [496].concat((F4().picks || []).map(function (q) { return q.id; }));
      s += t(40, 36, 'GRAD-CAM (16 × 16)   ·   COVER-UP (15 × 15)   ·   4 REAL CELLS', { size: 15, f: 'h', fill: C.dim, ls: '.06em' });
      rows.forEach(function (id, j) {
        var V = cam4c(id); if (!V) return;
        var x = 40 + j * 226, y = 60, S = 96, tag = id === 496 ? 'cracked (you painted it)' : V.tag || '';
        s += A.glass(x - 8, y - 8, 214, 460, { fx: fx, col: j === 2 ? '#7a2a3a' : j === 3 ? '#7a5a2a' : '#2b4760' });
        s += t(x, y + 18, 'cell ' + id, { size: 18, w: 700, fill: '#fff' }) + t(x + 198, y + 18, f3(V.score), { size: 16, a: 'end', f: 'm', fill: C.cy });
        s += t(x, y + 42, tag, { size: 15, fill: j === 2 ? '#ff8aa0' : j === 3 ? '#ffcf6b' : C.dim });
        var y1 = y + 58; s += A.cell(id, x, y1, 198, { full: true }) + '<rect x="' + x + '" y="' + y1 + '" width="198" height="198" fill="#000" opacity=".3"/>' + img(heatURL(V.cam, 16, 'g4c' + id, { alpha: 1 }), x, y1, 198, { px: 1, op: .9 });
        s += t(x, y1 + 220, 'Grad-CAM', { size: 15, w: 700, fill: '#ff8a2a' });
        var y2 = y1 + 232; s += A.cell(id, x, y2, 150, {}) + '<rect x="' + x + '" y="' + y2 + '" width="150" height="150" fill="#000" opacity=".3"/>' + img(heatURL(V.cover.map(function (v) { return Math.max(0, v); }), 15, 'v4c' + id, { alpha: 1 }), x + 150 * 2 / 64, y2 + 150 * 2 / 64, 150 * 60 / 64, { op: .9 });
        s += t(x + 158, y2 + 20, 'cover-', { size: 15, w: 700, fill: '#c7d4e4' }) + t(x + 158, y2 + 40, 'up', { size: 15, w: 700, fill: '#c7d4e4' }) + t(x + 158, y2 + 64, '225', { size: 14, f: 'm', fill: C.dim }) + t(x + 158, y2 + 82, 'runs', { size: 14, fill: C.dim });
      });
      return s;
    },
    work: function (c) {
      var V = cam4c(496), F = F4(); return clean([{ h: 'Cost of each map' }, { v: '1 + 1', k: 'Grad-CAM: one run forward, one back' }, { v: '1 + 225', k: 'cover-up: one run per spot' },
        { h: 'Picked from the validation tray' }, { t: 'Caught = highest score among real defects. Missed = a real defect under the 95%-recall cut (' + f3(F.cut) + '). False alarm = the good cell with the highest score.' },
        { t: 'Cell 496: both maps light the <b>bottom-left corner</b>, not the long crack.' }, srcTag(V && V.you), refNote(V && V.you)]);
    } }
  ]
});

/* ============================ 4d  Is the heat map honest? ============================ */
function del4d() {   // the deletion check over every real validation defect: the student's own run (4d passed) or the reference run
  var r = D.liveRes('4d'); if (r && r.n) return { n: r.n, hot: r.dropHot, rand: r.dropRand, wins: r.wins, s0: r.s0, dh: r.dh, dr: r.dr, you: true };
  var F = F4().del; return F ? { n: F.n, hot: F.dropHot, rand: F.dropRand, wins: F.wins, s0: F.s0, dh: F.dh, dr: F.dr, you: false } : null;
}
var open4d = function () { return D.predDone('4d'); };
function plate4d(x, y, S, kind, k, P, fx, open) {
  var s = '', pix = kind === 'hot' ? P.hotPix : P.randPix, n = k ? P.k[k - 1] : 0, sc = k ? P[kind][k - 1] : P.s0, g = Math.round(meanOf(496));
  s += A.glass(x - 18, y - 92, S + 36, S + 128, { fx: fx, col: kind === 'hot' ? '#8a4a2a' : '#3a4a5a' });
  s += t(x, y - 62, kind === 'hot' ? 'HOTTEST 10% FIRST' : 'RANDOM 10%', { size: 16, f: 'h', fill: kind === 'hot' ? '#ff8a2a' : '#9fb4c9', ls: '.08em' });
  // the score bar
  var bw = S, bx = x, by = y - 44;
  s += '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="16" rx="8" fill="#16202c"/>';
  if (open) s += '<rect x="' + bx + '" y="' + by + '" width="' + (bw * sc).toFixed(1) + '" height="16" rx="8" fill="' + (kind === 'hot' ? '#ff8a2a' : '#9fb4c9') + '"/>' + '<line x1="' + (bx + bw * P.s0) + '" x2="' + (bx + bw * P.s0) + '" y1="' + (by - 5) + '" y2="' + (by + 21) + '" stroke="#fff" stroke-width="2"/>' +
    '<text x="' + (bx + bw) + '" y="' + (y - 62) + '" text-anchor="end" font-family="' + A.FM + '" font-size="17" font-weight="700" fill="#fff" data-pgd-from="' + (k > 1 ? P[kind][k - 2] : P.s0) + '">' + f3(sc) + '</text>';
  else s += A.lock(bx + 8, by + 13, 'after your token answer');
  s += A.cell(496, x, y, S, { full: true, r: 2 });
  var shown = pix.slice(0, n), k6 = S / 64;
  if (kind === 'hot' && !n) s += img(heatURL(F4().paint[0].cam, 16, 'h4d', { alpha: 1, floor: 0.25 }), x, y, S, { op: .8 });
  s += '<path class="pgd-pop" d="' + pixPath(shown, x, y, k6) + '" fill="rgb(' + g + ',' + g + ',' + g + ')"/>';
  s += t(x, y + S + 26, n + ' of 4,096 pixels grayed', { size: 15, f: 'm', fill: C.dim });
  return s;
}
D.register('4d', {
  init: function () { return { k: 0 }; },
  frames: [
  { cap: 'A fair race: gray out the hottest pixels, or random ones',
    note: 'Two copies of the same cracked cell. Each punch grays 2% more pixels on both: the hottest ones on the left, random ones on the right. Which score falls faster?',
    svg: function (c) {
      var fx = A.fx(), P = F4().punch, st = c.state, s = A.stage() + fx.defs, op = open4d(); if (!P) return s;
      s += plate4d(64, 120, 300, 'hot', st.k, P, fx, op) + plate4d(596, 120, 300, 'rand', st.k, P, fx, op);
      // the press between the plates
      s += '<rect x="420" y="96" width="120" height="16" rx="4" fill="url(#' + fx.mt + ')"/><rect x="474" y="112" width="12" height="80" fill="#3a4757"/>';
      s += t(480, 360, (st.k * 2) + '%', { size: 40, a: 'middle', f: 'm', w: 700, fill: '#fff' }) + t(480, 386, 'grayed so far', { size: 15, a: 'middle', fill: C.dim });
      if (st.k < 5) s += A.target('punch', '<circle cx="480" cy="236" r="40" fill="#3a1206" stroke="#ff8a2a" stroke-width="3"/><circle cx="480" cy="236" r="28" fill="#ff8a2a" fill-opacity=".85"/>', 'punch 2% more', 480, 300, { inner: t(480, 243, 'PUNCH', { size: 15, a: 'middle', f: 'h', fill: '#1a0a02' }) });
      return s;
    },
    work: function (c) {
      var P = F4().punch, st = c.state, op = open4d(); if (!P) return [];
      var r = [{ h: 'Pixels grayed on each copy' }, { v: '2% × 4,096 ≈ 82', k: 'per punch' }, { v: st.k + ' × 82 = ' + (st.k ? P.k[st.k - 1] : 0), k: 'so far (5 punches = 10% = 410)' }];
      if (!op) r.push({ h: 'Scores' }, { t: 'Locked: answer the token question of 4d in the lab first. Then the scores show here.' });
      else if (st.k) r.push({ h: 'Score now' }, { v: f3(P.s0) + ' → ' + f3(P.hot[st.k - 1]), k: 'hottest first: drop ' + f3(P.s0 - P.hot[st.k - 1]) }, { v: f3(P.s0) + ' → ' + f3(P.rand[st.k - 1]), k: 'random: drop ' + f3(P.s0 - P.rand[st.k - 1]) });
      r.push({ tag: 'typical value' }, { t: '<i>Cell 496, reference run of the lab’s 4d code (its own random pixel list).</i>' });
      return r;
    },
    on: { punch: function (c) { var st = c.state; st.k++; if (st.k >= 5) c.next(); else c.redraw(true); } },
    auto: function (c) { c.state.k = 5; } },
  { cap: 'One cell is not proof. Race every real defect.',
    note: 'The same race on all the real defects of the validation tray. Compare the average drop.',
    svg: function (c) {
      var fx = A.fx(), P = F4().punch, st = c.state, s = A.stage() + fx.defs, op = open4d(), R = del4d(); if (!P || !R) return s;
      s += plate4d(64, 120, 300, 'hot', 5, P, fx, op) + plate4d(596, 120, 300, 'rand', 5, P, fx, op);
      s += A.target('race', '<rect x="400" y="196" width="160" height="86" rx="14" fill="#0b121b" stroke="#ffb547" stroke-width="2.5"/>', 'race all ' + R.n + ' defects', 480, 312, { inner: t(480, 234, 'RACE', { size: 22, a: 'middle', f: 'h', fill: C.am }) + t(480, 262, 'ALL ' + R.n, { size: 17, a: 'middle', f: 'm', fill: C.am }) });
      return s;
    },
    work: function (c) {
      var P = F4().punch, op = open4d(); if (!P) return [];
      return op ? [{ h: 'Cell 496 at 10%' }, { v: f3(P.s0 - P.hot[4]), k: 'drop, hottest first' }, { v: f3(P.s0 - P.rand[4]), k: 'drop, random' }, { t: 'At 10% the two copies end almost level on this cell. One cell can be luck.' }, { tag: 'typical value' }]
        : [{ t: 'Locked: answer the token question of 4d in the lab first.' }];
    },
    on: { race: function (c) { c.next(); } } },
  { cap: 'The verdict: is the heat map honest?',
    note: 'If graying the hottest pixels hurts the score more than graying random pixels, the map points at evidence the network really uses.',
    svg: function (c) {
      var fx = A.fx(), s = A.stage() + fx.defs, R = del4d(), op = open4d(); if (!R) return s;
      s += t(40, 40, 'AVERAGE SCORE DROP OVER ' + R.n + ' REAL DEFECTS · 10% GRAYED', { size: 15, f: 'h', fill: C.dim, ls: '.08em' });
      if (!op) { s += A.glass(240, 160, 480, 160, { fx: fx, col: '#5d6b80' }) + A.lock(300, 236, 'the result shows after your token answer in 4d') + t(480, 290, 'Put your tokens in the lab first.', { size: 17, a: 'middle', fill: C.dim }); return s; }
      var ch = A.chart({ x: 220, y: 80, w: 660, h: 150, xd: [0, 0.15], yd: [0, 2], xt: [0, 0.05, 0.10, 0.15], fx: function (v) { return v.toFixed(2); } });
      s += ch.svg.replace(/<rect[^>]*opacity=".55"\/>/, '');
      [['hottest 10%', R.hot, '#ff8a2a'], ['random 10%', R.rand, '#9fb4c9']].forEach(function (b, j) {
        var y = 104 + j * 62; s += t(206, y + 26, b[0], { size: 17, a: 'end', w: 700, fill: b[2] }) + '<rect class="pgd-in" x="220" y="' + y + '" width="' + (ch.X(b[1]) - 220) + '" height="38" rx="6" fill="' + b[2] + '"/>' + t(ch.X(b[1]) + 10, y + 27, f3(b[1]), { size: 20, f: 'm', w: 700, fill: '#fff' });
      });
      // one dot per defect: did the hottest pixels hurt more?
      s += t(40, 300, 'EACH DOT = ONE REAL DEFECT · orange: hottest hurt more · gray: random hurt more', { size: 15, fill: C.dim });
      var cols = 33; R.dh.forEach(function (v, i) { var w = v > R.dr[i], x = 52 + (i % cols) * 26, y = 330 + Math.floor(i / cols) * 26; s += '<circle class="pgd-seq" style="animation-delay:' + (i * 6) + 'ms" cx="' + x + '" cy="' + y + '" r="9" fill="' + (w ? '#ff8a2a' : '#3a4757') + '"/>'; });
      var good = R.hot > 1.5 * R.rand && R.hot - R.rand > 0.03;
      s += t(40, 488 + 22, (good ? 'Honest enough: ' : 'Only partly honest: ') + 'the hottest pixels hurt ' + (R.hot / Math.max(1e-6, R.rand)).toFixed(1) + '× more on average, but win on only ' + R.wins + ' of ' + R.n + ' defects.', { size: 17, w: 700, fill: good ? C.gr : C.am });
      return s;
    },
    work: function (c) {
      var R = del4d(), op = open4d(); if (!R) return [];
      if (!op) return [{ t: 'Locked: answer the token question of 4d in the lab first.' }];
      return clean([{ h: 'Average drop' }, { v: f3(R.hot), k: 'hottest 10% grayed' }, { op: '÷', v: f3(R.rand), k: 'random 10% grayed' }, { op: '=', v: (R.hot / Math.max(1e-6, R.rand)).toFixed(1) + ' ×', k: 'more harm from the hot pixels', res: true },
        { h: 'Defect by defect' }, { v: R.wins + ' ÷ ' + R.n, k: 'defects where the hottest hurt more' }, { op: '=', v: p0(R.wins / R.n), k: 'not every time', res: true }, srcTag(R.you), refNote(R.you)]);
    } }
  ]
});


/* ============================ 4e  Where does it fail? ============================ */
function slices4e() {   // the mistakes at the Step 3 gates, grouped (same rules as the lab's lanesFor)
  var G = D.S3 && D.S3.gates(); if (!G) return null;
  var v = G.B.v, y = G.y, s = G.s, lo = G.G.low, hi = Math.max(G.G.high, lo), all = [];
  for (var i = 0; i < y.length; i++) all.push({ i: i, id: v.id[i], y: y[i], kind: v.kind[i] === 'p' ? 'poly' : 'mono', sure: v.prob[i] === 0 || v.prob[i] === 1, lane: s[i] < lo ? 'pass' : s[i] >= hi ? 'stop' : 'person', s: s[i] });
  function grp(f) { var g = { n: 0, def: 0, defPass: 0, ok: 0, okStop: 0, person: 0, cells: [] }; all.forEach(function (c) { if (!f(c)) return; g.n++; if (c.lane === 'person') g.person++; if (c.y) { g.def++; if (c.lane === 'pass') { g.defPass++; g.cells.push(c); } } else { g.ok++; if (c.lane === 'stop') { g.okStop++; g.cells.push(c); } } }); return g; }
  return { all: grp(function () { return true; }), mono: grp(function (c) { return c.kind === 'mono'; }), poly: grp(function (c) { return c.kind === 'poly'; }),
    sure: grp(function (c) { return c.sure; }), unsure: grp(function (c) { return !c.sure; }), you: G.you, low: lo, high: hi };
}
var TAGS4E = { kind: { lab: 'cell type', sub: 'mono or poly', col: '#46e3ff' }, sure: { lab: 'expert sure?', sub: '0 or 1 · 0.33 or 0.67', col: '#a98bff' }, num: { lab: 'cell number', sub: 'a different number per cell', col: '#8d9bb0' } };
function mcard(c, x, y, S, rot) {   // one mistake: a real photo, red ring = defect passed, amber = good cell stopped
  var col = c.y ? '#ff4d6a' : '#ffb547';
  return '<g' + (rot ? ' transform="rotate(' + rot + ' ' + (x + S / 2) + ' ' + (y + S / 2) + ')"' : '') + '><rect x="' + (x - 4) + '" y="' + (y - 4) + '" width="' + (S + 8) + '" height="' + (S + 8) + '" rx="5" fill="#0b121b" stroke="' + col + '" stroke-width="2.5"/>' + A.cell(c.id, x, y, S, {}) + '</g>';
}
function dots4e(x, y, g, cols, r) {   // every defect of the group as a dot; red = passed with no check
  var s = '', gap = 2 * r + 3, k = 0;
  for (var i = 0; i < g.def; i++) { var red = i < g.defPass; s += '<circle class="pgd-seq" style="animation-delay:' + (i * 4) + 'ms" cx="' + (x + r + (k % cols) * gap) + '" cy="' + (y + r + Math.floor(k / cols) * gap) + '" r="' + r + '" fill="' + (red ? '#ff4d6a' : '#2f4a63') + '"/>'; k++; }
  return { svg: s, h: Math.ceil(g.def / cols) * gap };
}
function col4e(x, w, name, g, col, fx, o) {
  o = o || {}; var s = A.glass(x, 64, w, 452, { fx: fx, col: col });
  s += t(x + 18, 96, name.toUpperCase(), { size: 17, f: 'h', fill: col, ls: '.08em' }) + t(x + w - 18, 96, g.n + ' cells', { size: 15, a: 'end', f: 'm', fill: C.dim });
  var rate = g.def ? g.defPass / g.def : 0;
  s += '<text x="' + (x + 18) + '" y="146" font-family="' + A.FM + '" font-size="40" font-weight="700" fill="' + (rate > 0.05 ? '#ff8aa0' : '#fff') + '">' + p1(rate) + '</text>';
  s += t(x + 18, 172, g.defPass + ' of ' + g.def + ' defects passed with no check', { size: 15, fill: C.dim });
  var D2 = dots4e(x + 18, 190, g, Math.floor((w - 36) / 13), 5); s += D2.svg;
  if (o.few) s += '<path d="M' + (x + 14) + ' ' + (196 + D2.h) + 'h' + (w - 28) + '" stroke="#ffb547" stroke-width="2" stroke-dasharray="5 4"/>' + t(x + 18, 220 + D2.h, 'Few dots: 1 cell = ' + (100 / g.def).toFixed(1) + ' points', { size: 15, w: 700, fill: C.am });
  var yc = Math.max(300, 250 + D2.h + (o.few ? 30 : 0));
  s += t(x + 18, yc, 'the mistakes', { size: 15, fill: C.dim });
  g.cells.slice(0, 8).forEach(function (c, j) { s += mcard(c, x + 18 + (j % 4) * 62, yc + 14 + Math.floor(j / 4) * 62, 50); });
  s += t(x + 18, 500, 'to a person: ' + p0(g.person / g.n) + ' of its cells', { size: 15, f: 'm', fill: '#ffcf6b' });
  return s;
}
function shelf4e(st, fx, want) {
  var s = A.glass(640, 64, 290, 452, { fx: fx, col: '#2b4157' }) + t(660, 96, 'TAGS', { size: 15, f: 'h', fill: C.dim, ls: '.1em' });
  ['kind', 'sure', 'num'].forEach(function (k, j) {
    var T = TAGS4E[k], used = st.used.indexOf(k) >= 0, y = 126 + j * 112;
    if (used) { s += '<rect x="660" y="' + y + '" width="250" height="84" rx="12" fill="none" stroke="' + T.col + '" stroke-opacity=".4" stroke-dasharray="5 5"/>' + t(785, y + 48, 'used ✓', { size: 16, a: 'middle', fill: T.col }); return; }
    var shape = '<path d="M672 ' + y + 'h226a12 12 0 0 1 12 12v60a12 12 0 0 1 -12 12h-226l-12 -42z" fill="#0b121b" stroke="' + T.col + '" stroke-width="2"/><circle cx="684" cy="' + (y + 42) + '" r="6" fill="none" stroke="' + T.col + '" stroke-width="2"/>' +
      t(700, y + 36, T.lab, { size: 20, w: 700, fill: T.col }) + t(700, y + 62, T.sub, { size: 14, fill: C.dim });
    if (k === want || k === 'num') s += '';
    s += '<g data-tag="' + k + '">' + shape + '</g>';
  });
  if (st.msg) s += t(785, 480, st.msg, { size: 15, a: 'middle', w: 700, fill: '#ff8aa0', cls: 'pgd-shake' });
  return s;
}
function tagTargets(st, want) {   // the asked tag first (keyboard order); the decoy can be dragged too
  var s = '';
  [want, 'num'].forEach(function (k) {
    if (!k || st.used.indexOf(k) >= 0) return;
    var j = ['kind', 'sure', 'num'].indexOf(k), y = 126 + j * 112;
    s += A.target('t_' + k, '<rect x="656" y="' + (y - 4) + '" width="262" height="92" rx="14" fill="none" stroke="#ffb547" stroke-width="2"/>', '', 0, 0, { kind: 'drag', cls: 'pgd-nochip', to: snapTo(785, y + 42, 320, 290, 24) });
  });
  return s;
}
function bind4e(c, root, want) {
  var st = c.state;
  [want, 'num'].forEach(function (k) {
    var el = root.querySelector('[data-pgd-t="t_' + k + '"]'); if (!el) return;
    var j = ['kind', 'sure', 'num'].indexOf(k), y = 126 + j * 112, tg = root.querySelector('[data-tag="' + k + '"]'), sx = 785, sy = y + 42;
    var drag = D.onDrag(root, el, { start: { x: sx, y: sy }, step: 24,
      move: function (p) { var tr = 'translate(' + (p.x - sx) + ' ' + (p.y - sy) + ')'; el.setAttribute('transform', tr); if (tg) tg.setAttribute('transform', tr); },
      drop: function (p) {
        if (p.x < 620) { if (k === 'num') { st.msg = 'One cell per group: a rate of 1 cell says nothing.'; c.redraw(true); return; } st.used.push(k); st.msg = ''; c.next(); return; }
        el.removeAttribute('transform'); if (tg) tg.removeAttribute('transform'); drag.set({ x: sx, y: sy }); el.removeAttribute('transform'); if (tg) tg.removeAttribute('transform');
      } });
  });
}
D.register('4e', {
  init: function () { return { used: [], msg: '' }; },
  frames: [
  { cap: 'All mistakes in one pile: one number',
    note: 'At the Step 3 gates, a few real defects pass with no check and a few good cells are stopped. One overall rate can hide a weak group.',
    svg: function (c) {
      var R = slices4e(), fx = A.fx(), st = c.state, s = A.stage() + fx.defs; if (!R) return s;
      s += A.glass(28, 64, 592, 452, { fx: fx, col: '#7a2a3a' }) + t(48, 96, 'THE MISTAKES PILE · VALIDATION TRAY', { size: 15, f: 'h', fill: '#ff8aa0', ls: '.08em' });
      s += '<text x="48" y="150" font-family="' + A.FM + '" font-size="44" font-weight="700" fill="#fff">' + p1(R.all.defPass / R.all.def) + '</text>' + t(250, 132, R.all.defPass + ' of ' + R.all.def + ' defects passed', { size: 17, w: 700, fill: '#ff8aa0' }) + t(250, 156, R.all.okStop + ' of ' + R.all.ok + ' good cells stopped', { size: 17, w: 700, fill: '#ffcf6b' });
      var cells = R.all.cells, rots = [-8, 5, -3, 9, -6, 3, 7, -9, 4, -4, 8, -2];
      cells.forEach(function (q, j) { s += mcard(q, 70 + (j % 6) * 86 + (j % 2) * 8, 196 + Math.floor(j / 6) * 104 + (j % 3) * 10, 70, rots[j % rots.length]); });
      s += '<g transform="translate(48 486)"><rect width="16" height="16" rx="3" fill="none" stroke="#ff4d6a" stroke-width="2.5"/>' + t(24, 13, 'defect passed', { size: 15, fill: C.dim }) + '<rect x="170" width="16" height="16" rx="3" fill="none" stroke="#ffb547" stroke-width="2.5"/>' + t(194, 13, 'good cell stopped', { size: 15, fill: C.dim }) + '</g>';
      s += shelf4e(st, fx, 'kind') + tagTargets(st, 'kind');
      s += '<g class="pgd-chip"><rect x="650" y="452" width="270" height="30" rx="15" fill="#ffb547"/>' + t(785, 473, 'DRAG A TAG ONTO THE PILE', { size: 14, a: 'middle', w: 700, fill: '#1a1103', ls: '.05em' }) + '</g>';
      return s;
    },
    work: function (c) {
      var R = slices4e(); if (!R) return [];
      return clean([{ h: 'All validation cells' }, { v: R.all.defPass + ' ÷ ' + R.all.def, k: 'defects passed ÷ all defects' }, { op: '=', v: p1(R.all.defPass / R.all.def), k: 'passed with no check (rule: 5% or less)', res: true },
        { v: R.all.okStop + ' ÷ ' + R.all.ok, k: 'good cells stopped ÷ all good' }, { op: '=', v: p1(R.all.okStop / R.all.ok), k: 'stopped by mistake' }, { t: 'Lanes from your Step 3 gates: below ' + f3(R.low) + ' pass, from ' + f3(R.high) + ' stop.' }, srcTag(R.you), refNote(R.you)]);
    },
    bind: function (c, root) { bind4e(c, root, 'kind'); },
    auto: function (c) { c.state.used = ['kind']; } },
  { cap: 'Split by cell type: poly lets more slip through',
    note: 'The same count, done once for mono cells and once for poly cells. Each dot is one real defect; red ones passed with no check.',
    svg: function (c) {
      var R = slices4e(), fx = A.fx(), st = c.state, s = A.stage() + fx.defs; if (!R) return s;
      s += col4e(28, 290, 'mono', R.mono, '#46e3ff', fx) + col4e(330, 290, 'poly', R.poly, '#a98bff', fx);
      s += shelf4e(st, fx, 'sure') + tagTargets(st, 'sure');
      s += '<g class="pgd-chip"><rect x="650" y="452" width="270" height="30" rx="15" fill="#ffb547"/>' + t(785, 473, 'DRAG THE NEXT TAG', { size: 14, a: 'middle', w: 700, fill: '#1a1103', ls: '.05em' }) + '</g>';
      return s;
    },
    work: function (c) {
      var R = slices4e(); if (!R) return [];
      return clean([{ h: 'Defects passed, per group' }, { v: R.mono.defPass + ' ÷ ' + R.mono.def + ' = ' + p1(R.mono.defPass / R.mono.def), k: 'mono' }, { v: R.poly.defPass + ' ÷ ' + R.poly.def + ' = ' + p1(R.poly.defPass / R.poly.def), k: 'poly', res: true },
        { t: 'Same gates, same rule. The overall ' + p1(R.all.defPass / R.all.def) + ' was an average of these two.' }, srcTag(R.you), refNote(R.you)]);
    },
    bind: function (c, root) { bind4e(c, root, 'sure'); },
    auto: function (c) { c.state.used = ['kind', 'sure']; } },
  { cap: 'Split by the experts: unsure cells are hard, and the group is small',
    note: 'Cells the experts were unsure about fail more often and go to a person more often. But that group has few defects, so its rate is shaky.',
    svg: function (c) {
      var R = slices4e(), fx = A.fx(), st = c.state, s = A.stage() + fx.defs; if (!R) return s;
      s += col4e(28, 290, 'experts sure', R.sure, '#3dffa0', fx) + col4e(330, 290, 'experts unsure', R.unsure, '#ffb547', fx, { few: R.unsure.def < 30 });
      s += A.glass(640, 64, 290, 452, { fx: fx, col: '#2b4157' }) + t(660, 96, 'WHAT WE LEARN', { size: 15, f: 'h', fill: C.dim, ls: '.1em' });
      var L = [['Poly: ' + p1(R.poly.defPass / R.poly.def), 'vs mono ' + p1(R.mono.defPass / R.mono.def)], ['Unsure: ' + p1(R.unsure.defPass / R.unsure.def), 'vs sure ' + p1(R.sure.defPass / R.sure.def)], ['Unsure to a person:', p0(R.unsure.person / R.unsure.n) + ' vs ' + p0(R.sure.person / R.sure.n)]];
      L.forEach(function (q, j) { s += t(660, 146 + j * 80, q[0], { size: 20, f: 'm', w: 700, fill: '#fff' }) + t(660, 172 + j * 80, q[1], { size: 16, fill: C.dim }); });
      s += t(660, 410, 'Weak spots go on the', { size: 17, fill: '#c7d4e4' }) + t(660, 434, 'to-do list (4f).', { size: 17, fill: '#c7d4e4' });
      return s;
    },
    work: function (c) {
      var R = slices4e(); if (!R) return [];
      return clean([{ h: 'Defects passed, per group' }, { v: R.sure.defPass + ' ÷ ' + R.sure.def + ' = ' + p1(R.sure.defPass / R.sure.def), k: 'experts sure' }, { v: R.unsure.defPass + ' ÷ ' + R.unsure.def + ' = ' + p1(R.unsure.defPass / R.unsure.def), k: 'experts unsure', res: true },
        { h: 'Why small groups are shaky' }, { v: '1 ÷ ' + R.unsure.def + ' = ' + p1(1 / R.unsure.def), k: 'one cell more or less moves the unsure rate this much' }, { v: '1 ÷ ' + R.sure.def + ' = ' + p1(1 / R.sure.def), k: 'for the sure group' }, srcTag(R.you), refNote(R.you)]);
    } }
  ]
});

/* ============================ 4f  Turn mistakes into a to-do list ============================ */
var BOX4F = [['more', 'more photos', 'like this one', '#46e3ff'], ['label', 're-check', 'the label', '#d6e05a'], ['sharp', 'a sharper', 'photo', '#a98bff'], ['wrong', 'looked at the', 'wrong place', '#ff8a5c']];
function cases4f() {
  var T = F4().todo || [], miss = T.filter(function (q) { return q.kind === 'missed'; }).slice(0, 3), fa = T.filter(function (q) { return q.kind === 'fa'; }).slice(0, 3);
  return miss.concat(fa);
}
function card4f(q, x, y, S, o) {
  o = o || {}; var col = q.kind === 'missed' ? '#ff4d6a' : '#ffb547', s = '';
  s += '<rect x="' + (x - 8) + '" y="' + (y - 8) + '" width="' + (S + 16) + '" height="' + (S + (o.small ? 36 : 64)) + '" rx="6" fill="#e9e4d8"' + (o.fx ? ' filter="url(#' + o.fx.sh + ')"' : '') + '/>';
  s += A.cell(q.id, x, y, S, { full: true, r: 1 }) + img(heatURL(q.cam, 16, 'f4' + q.id, { alpha: 1, floor: 0.45 }), x, y, S, { px: 1, op: .75 });
  s += '<circle cx="' + (x + S / 2) + '" cy="' + (y - 2) + '" r="6" fill="' + col + '" stroke="#5a1020"/>';
  if (o.back) s += t(x, y + S + 20, 'expert ' + q.prob + ' · ' + q.type, { size: 14, f: 'm', w: 700, fill: q.prob > 0 && q.prob < 1 ? '#8a6a00' : '#283445' });
  else s += t(x, y + S + 20, q.kind === 'missed' ? 'missed defect' : 'false alarm', { size: o.small ? 14 : 15, w: 700, fill: q.kind === 'missed' ? '#b0102e' : '#9a5a00' });
  if (!o.small) s += t(x, y + S + 42, 'score ' + f3(q.b), { size: 14, f: 'm', fill: '#283445' });
  return s;
}
function board4f(c, fx, o) {
  o = o || {}; var st = c.state, Q = cases4f(), s = '';
  BOX4F.forEach(function (b, k) {
    var x = 28 + k * 228, y = 280, w = 216, h = 236, n = Q.filter(function (q) { return st.pin[q.id] === b[0]; });
    s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="#2a2016" stroke="' + b[3] + '" stroke-opacity=".7" stroke-width="2"/>' + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="url(#' + fx.vg + ')" opacity=".4"/>';
    s += t(x + 14, y + 28, b[1].toUpperCase(), { size: 15, f: 'h', fill: b[3], ls: '.06em' }) + t(x + 14, y + 48, b[2].toUpperCase(), { size: 15, f: 'h', fill: b[3], ls: '.06em' });
    s += '<circle cx="' + (x + w - 26) + '" cy="' + (y + 32) + '" r="18" fill="#0b121b" stroke="' + b[3] + '"/>' + '<text x="' + (x + w - 26) + '" y="' + (y + 39) + '" text-anchor="middle" font-family="' + A.FM + '" font-size="20" font-weight="700" fill="#fff">' + n.length + '</text>';
    n.forEach(function (q, j) { s += '<g class="' + (st.last === q.id ? 'pgd-pop' : '') + '">' + card4f(q, x + 16 + (j % 3) * 66, y + 72 + Math.floor(j / 3) * 86, 46, { small: 1, back: o.back }) + '</g>'; });
    if (st.held && !o.done) s += A.target('b_' + b[0], '<rect x="' + (x - 3) + '" y="' + (y - 3) + '" width="' + (w + 6) + '" height="' + (h + 6) + '" rx="14" fill="none" stroke="#ffb547" stroke-width="2.5" stroke-dasharray="6 5"/>', 'pin here', x + w / 2, y + h - 20, { cls: k ? 'pgd-nochip' : '' });
  });
  return s;
}
function rail4f(c, fx, kind) {
  var st = c.state, Q = cases4f(), s = '';
  Q.forEach(function (q, j) {
    if (st.pin[q.id]) return;
    var x = 44 + j * 152, y = 64, S = 116, act = q.kind === kind, held = st.held === q.id;
    var g = '<g' + (act ? '' : ' opacity=".35"') + (held ? ' transform="translate(0 -10)"' : '') + '>' + card4f(q, x, y, S, { fx: fx }) + (held ? '<rect x="' + (x - 10) + '" y="' + (y - 10) + '" width="' + (S + 20) + '" height="' + (S + 68) + '" rx="8" fill="none" stroke="#fff" stroke-width="3"/>' : '') + '</g>';
    if (act && !st.held) s += A.target('c_' + q.id, '<rect x="' + (x - 10) + '" y="' + (y - 10) + '" width="' + (S + 20) + '" height="' + (S + 68) + '" rx="8" fill="none" stroke="#ffb547" stroke-width="2.5"/>', 'pick up a case', x + S / 2, 240, { inner: g, cls: s.indexOf('pgd-target') >= 0 ? 'pgd-nochip' : '' });
    else s += g;
  });
  return s;
}
function on4f(kind) {
  var o = {};
  cases4f().forEach(function (q) { o['c_' + q.id] = function (c) { c.state.held = q.id; c.redraw(true); }; });
  BOX4F.forEach(function (b) { o['b_' + b[0]] = function (c) { var st = c.state; if (!st.held) return; st.pin[st.held] = b[0]; st.last = st.held; st.held = null; var left = cases4f().filter(function (q) { return q.kind === kind && !st.pin[q.id]; }).length; if (!left) c.next(); else c.redraw(true); }; });
  return o;
}
function work4f(c, done) {
  var st = c.state, Q = cases4f(), r = [{ h: 'The board' }];
  BOX4F.forEach(function (b) { r.push({ v: String(Q.filter(function (q) { return st.pin[q.id] === b[0]; }).length), k: b[1] + ' ' + b[2] }); });
  r.push({ t: 'No single right box. Is the defect tiny? The label doubtful? The photo blurry? The heat somewhere silly?' });
  if (done) {
    var un = Q.filter(function (q) { return q.prob > 0 && q.prob < 1; }), inLab = un.filter(function (q) { return st.pin[q.id] === 'label'; }).length;
    r.push({ h: 'The label file says' }, { v: un.length + ' of ' + Q.length, k: 'cards had an unsure expert score (0.33 or 0.67)' }, { v: inLab + ' of ' + un.length, k: 'of those you put in “re-check the label”' });
  }
  r.push({ tag: 'typical value' }, { t: '<i>Real mistakes at the reference gates (' + (F4().gates || []).map(f3).join(' / ') + '); heat = Grad-CAM.</i>' });
  return r;
}
D.register('4f', {
  init: function () { return { pin: {}, held: null, last: null }; },
  frames: [
  { cap: 'Defects that slipped through: what would fix each one?',
    note: 'Three real defects passed with no check. The heat shows where the network looked. Pin each case to the action that would help most.',
    svg: function (c) { var fx = A.fx(); return A.stage() + fx.defs + rail4f(c, fx, 'missed') + board4f(c, fx); },
    work: function (c) { return work4f(c, false); }, on: on4f('missed'),
    auto: function (c) { var Q = cases4f(); c.state.pin[Q[0].id] = 'more'; c.state.pin[Q[1].id] = 'wrong'; c.state.pin[Q[2].id] = 'label'; } },
  { cap: 'False alarms: good cells it was most sure were bad',
    note: 'Three good cells got the highest scores. Pin these too.',
    svg: function (c) { var fx = A.fx(); return A.stage() + fx.defs + rail4f(c, fx, 'fa') + board4f(c, fx); },
    work: function (c) { return work4f(c, false); }, on: on4f('fa'),
    auto: function (c) { var Q = cases4f(); c.state.pin[Q[3].id] = 'label'; c.state.pin[Q[4].id] = 'wrong'; c.state.pin[Q[5].id] = 'sharp'; } },
  { cap: 'Your to-do list, with what the label file says',
    note: 'Turn the cards over: the label file gives the expert score and the cell type. The board is the start of Step 8’s action list.',
    svg: function (c) {
      var fx = A.fx(), Q = cases4f(), st = c.state, s = A.stage() + fx.defs + board4f(c, fx, { back: 1, done: 1 });
      var un = Q.filter(function (q) { return q.prob > 0 && q.prob < 1; }).length, poly = Q.filter(function (q) { return q.type === 'poly'; }).length;
      s += A.glass(28, 56, 904, 200, { fx: fx, col: '#2b4157' }) + t(52, 92, 'ACTION LIST', { size: 16, f: 'h', fill: C.am, ls: '.1em' });
      BOX4F.forEach(function (b, k) { var n = Q.filter(function (q) { return st.pin[q.id] === b[0]; }).length; s += '<text x="' + (52 + k * 220) + '" y="160" font-family="' + A.FM + '" font-size="44" font-weight="700" fill="' + b[3] + '" class="pgd-pop">' + n + '</text>' + t(52 + k * 220 + 36, 140, b[1], { size: 16, fill: '#c7d4e4' }) + t(52 + k * 220 + 36, 162, b[2], { size: 16, fill: '#c7d4e4' }); });
      s += t(52, 214, un + ' of these ' + Q.length + ' cards had an unsure expert score · ' + poly + ' are poly cells (4e: poly is the weak group)', { size: 17, w: 700, fill: '#fff' });
      return s;
    },
    work: function (c) { return work4f(c, true); } }
  ]
});

})();
