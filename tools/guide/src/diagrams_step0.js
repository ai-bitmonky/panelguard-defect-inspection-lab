/* PanelGuard Diagram guide — Step 0 diagrams (0a 0b 0c 0d). Uses window.PGD (engine.js).
   Real photos from the lab's pack; every number is a fact of this data set or the student's own answer. */
(function () {
'use strict';
var D = window.PGD, A = D.art, C = A.COL, t = A.t, fmt = D.fmt;
function pix(id) { return D.pixels(id); }
/* mean brightness (0-255) of a photo inside a circle (u, v, r in 0..1 photo units) */
function meanIn(id, u, v, r) {
  var p = pix(id); if (!p) return null; var s = 0, n = 0;
  for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) { var dx = (x + .5) / 64 - u, dy = (y + .5) / 64 - v; if (dx * dx + dy * dy <= r * r) { s += p[y * 64 + x]; n++; } }
  return n ? Math.round(s / n) : null;
}
function meanAll(id) { var p = pix(id); if (!p) return null; var s = 0; for (var k = 0; k < 4096; k++) s += p[k]; return Math.round(s / 4096); }
function segDist(u, v, a) { var x1 = a[0], y1 = a[1], x2 = a[2], y2 = a[3], dx = x2 - x1, dy = y2 - y1, q = Math.max(0, Math.min(1, ((u - x1) * dx + (v - y1) * dy) / (dx * dx + dy * dy))); return Math.hypot(u - x1 - q * dx, v - y1 - q * dy); }
function label(p) { return p >= 0.5 ? 'defect' : 'OK'; }

/* ============================ 0a  Walk the station ============================ */
/* the station, drawn once; `on` = how far the energy has travelled (0 off … 4 decision) */
function station(c, on, tgt) {
  var s = A.stage({ floor: 446 }), g = A.uid('st');
  s += '<defs>' + A.glow(g + 'b', 9) + A.glow(g + 'b2', 3) +
    '<linearGradient id="' + g + 'hood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d131c"/><stop offset=".5" stop-color="#18212d"/><stop offset="1" stop-color="#0d131c"/></linearGradient>' +
    '<linearGradient id="' + g + 'cone" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#bff3ff" stop-opacity=".55"/><stop offset="1" stop-color="#46e3ff" stop-opacity=".05"/></linearGradient>' +
    '<linearGradient id="' + g + 'belt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3340"/><stop offset="1" stop-color="#151b24"/></linearGradient></defs>';
  // conveyor
  s += '<rect x="170" y="404" width="560" height="22" rx="11" fill="url(#' + g + 'belt)" stroke="#3a4757"/>';
  for (var k = 0; k < 15; k++) s += '<circle cx="' + (188 + k * 37.5) + '" cy="415" r="6" fill="#1b232f" stroke="#4a5868"/>';
  s += '<path d="M200 426v20M700 426v20" stroke="#2a3340" stroke-width="8"/>';
  // the dark hood (cut open at the front)
  s += '<path d="M300 92h300l26 312H274Z" fill="url(#' + g + 'hood)" stroke="#2b3949" stroke-width="2"/>';
  s += '<path d="M318 120h264l20 280H298Z" fill="#05070b" stroke="#1d2a38"/>';
  s += t(450, 84, 'DARK HOOD', { size: 13, a: 'middle', f: 'h', fill: '#5d6b80', ls: '.2em' });
  // camera inside the hood, looking down
  s += '<g><rect x="420" y="124" width="60" height="40" rx="6" fill="#1c2633" stroke="#5d6b80"/><rect x="434" y="164" width="32" height="18" rx="3" fill="#121a24" stroke="#5d6b80"/>' +
    '<circle cx="450" cy="186" r="9" fill="#0a1019" stroke="' + (on >= 2 ? C.cy : '#5d6b80') + '" stroke-width="2"/>' +
    '<circle cx="472" cy="134" r="4" fill="' + (on >= 2 ? C.gr : '#33404f') + '"' + (on >= 2 ? ' filter="url(#' + g + 'b2)"' : '') + '/></g>';
  // the cell lying on the belt under the camera (top view through the cut-out)
  var CX = 392, CY = 286, CS = 116;
  if (on >= 1) {
    s += '<rect x="' + (CX - 14) + '" y="' + (CY - 14) + '" width="' + (CS + 28) + '" height="' + (CS + 28) + '" rx="10" fill="#46e3ff" opacity=".22" filter="url(#' + g + 'b)" class="pgd-fade"/>';
    s += '<g class="pgd-fade">' + A.cell(6, CX, CY, CS, { full: true }) + '</g>';
  } else {
    s += '<rect x="' + CX + '" y="' + CY + '" width="' + CS + '" height="' + CS + '" rx="3" fill="#0f1a33" stroke="#2c3c66"/>' +
      [0.3, 0.7].map(function (q) { return '<line x1="' + CX + '" y1="' + (CY + CS * q) + '" x2="' + (CX + CS) + '" y2="' + (CY + CS * q) + '" stroke="#6f86ad" stroke-width="2" opacity=".7"/>'; }).join('');
  }
  if (on >= 2) s += '<path d="M' + (CX + 8) + ' ' + CY + 'L442 196H458L' + (CX + CS - 8) + ' ' + CY + 'Z" fill="url(#' + g + 'cone)" class="pgd-fade"/>';
  // power supply
  s += '<g><rect x="34" y="236" width="150" height="168" rx="10" fill="#111824" stroke="#33455c" stroke-width="2"/>' +
    '<rect x="50" y="254" width="118" height="44" rx="5" fill="' + (on >= 1 ? '#062a1d' : '#070b10') + '" stroke="#263346"/>' +
    t(109, 284, on >= 1 ? 'ON' : 'OFF', { size: 22, a: 'middle', f: 'h', fill: on >= 1 ? C.gr : '#33404f' }) +
    '<circle cx="76" cy="340" r="17" fill="#1b232f" stroke="#5d6b80" stroke-width="2"/><path d="M76 340l9-9" stroke="#c6d2e2" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="138" cy="330" r="7" fill="' + C.rd + '"/><circle cx="138" cy="360" r="7" fill="#c6d2e2"/>' + t(109, 392, 'POWER', { size: 12, a: 'middle', f: 'h', fill: '#5d6b80', ls: '.2em' }) + '</g>';
  // cables: supply -> cell contacts
  var cab = 'M145 330 C230 330 250 300 ' + (CX - 2) + ' ' + (CY + 30), cab2 = 'M145 360 C240 372 260 380 ' + (CX - 2) + ' ' + (CY + 84);
  s += '<path d="' + cab + '" stroke="#5a1f2a" stroke-width="5" fill="none"/><path d="' + cab2 + '" stroke="#3a4757" stroke-width="5" fill="none"/>';
  if (on >= 1) s += '<path d="' + cab + '" stroke="' + C.rd + '" stroke-width="3" fill="none" class="pgd-flow"/><path d="' + cab2 + '" stroke="#c6d2e2" stroke-width="3" fill="none" class="pgd-flow" style="animation-direction:reverse"/>';
  // data cable camera -> screen, and the screen on its arm
  var dc = 'M480 140 C560 140 600 120 690 170';
  s += '<path d="' + dc + '" stroke="#263346" stroke-width="5" fill="none"/>';
  if (on >= 3) s += '<path d="' + dc + '" stroke="' + C.cy + '" stroke-width="3" fill="none" class="pgd-flow"/>';
  s += '<g><rect x="690" y="96" width="240" height="190" rx="12" fill="#0b1018" stroke="#33455c" stroke-width="2"/><rect x="704" y="110" width="212" height="162" rx="6" fill="#04070b"/>' +
    '<path d="M810 286v60M760 346h100" stroke="#2a3340" stroke-width="8" stroke-linecap="round"/></g>';
  if (on >= 3) {
    s += '<g class="pgd-fade">' + A.cell(6, 716, 122, 138, { full: true }) + t(872, 140, 'CELL', { size: 11, a: 'middle', f: 'h', fill: C.dim }) + t(872, 160, '6', { size: 18, a: 'middle', f: 'm', fill: C.cy }) + '</g>';
    if (on >= 4) s += '<g class="pgd-in"><rect x="858" y="186" width="50" height="30" rx="6" fill="#0b2418" stroke="' + C.gr + '"/>' + t(883, 206, 'PASS', { size: 12, a: 'middle', f: 'h', fill: C.gr }) +
      '<rect x="858" y="224" width="50" height="30" rx="6" fill="#2a0e15" stroke="' + C.rd + '"/>' + t(883, 244, 'STOP', { size: 12, a: 'middle', f: 'h', fill: C.rd }) + '</g>';
  }
  // the energy path, numbered as it is walked
  var steps = [[110, 214, 'current in'], [450, 446 + 34, 'light out'], [450, 222, 'photo'], [810, 316, 'decision']];
  steps.forEach(function (q, i) { if (on > i) s += '<g class="' + (on === i + 1 ? 'pgd-in' : '') + '"><circle cx="' + (q[0] - 62) + '" cy="' + (q[1] - 6) + '" r="12" fill="' + C.cy + '"/>' + t(q[0] - 62, q[1] - 1, String(i + 1), { size: 14, a: 'middle', f: 'h', fill: '#04121a' }) + t(q[0] - 44, q[1], q[2], { size: 18, w: 700, fill: C.cy }) + '</g>'; });
  if (tgt) s += tgt;
  return s;
}
D.register('0a', {
  frames: [
  { cap: 'A dark station and a dark cell',
    note: 'The last station of the line: a power supply, a cell on the belt under a dark hood, a camera and a screen. Nothing glows yet.',
    svg: function (c) { return station(c, 0, A.target('supply', '<rect x="28" y="230" width="162" height="180" rx="13" fill="none" stroke="#ffb547" stroke-width="3"/>', 'switch on the current', 28, 470, { la: 'start' })); },
    work: function () { return [{ h: 'What you see' }, { t: 'A solar cell turns light into current.' }, { t: 'Here we run it <b>backwards</b>: push current in, and the cell gives off a faint light.' }, { t: 'The hood keeps the room light out, so only the cell\'s own light is seen.' }]; },
    on: { supply: function (c) { c.next(); } } },
  { cap: 'Current in: the cell glows',
    note: 'Current flows from the supply into the cell. Working parts of the cell glow. Broken parts stay dark.',
    svg: function (c) { return station(c, 1, A.target('cell', '<rect x="384" y="278" width="132" height="132" rx="8" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap the glowing cell', 450, 260, {})); },
    work: function () { return [{ h: '1 · current in' }, { t: 'The glow is called <b>EL</b> (electroluminescence).' }, { v: 'bright', k: 'this part works', col: C.ink }, { v: 'dark', k: 'this part is broken or dead', col: C.dim }, { t: 'The crack on this cell (cell 6) shows as a thin dark line.' }]; },
    on: { cell: function (c) { c.next(); } } },
  { cap: 'Light out: the camera takes one photo',
    note: 'The camera in the hood catches the cell\'s light. One cell, one photo.',
    svg: function (c) { return station(c, 2, A.target('camera', '<rect x="412" y="116" width="76" height="82" rx="9" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap the camera', 450, 60, {})); },
    work: function (c) { return [{ h: '2 · light out → photo' }, { v: '1 cell', k: '= 1 photo' }, { v: '300 × 300', k: 'pixels in the camera photo' }, { v: '64 × 64', k: 'pixels in our pack (made smaller)' }, { op: '=', v: '4,096', k: 'pixels per photo in the pack', res: true }]; },
    on: { camera: function (c) { c.next(); } } },
  { cap: 'The photo goes to the screen',
    note: 'The photo travels to the screen. Now someone, or something, must judge it.',
    svg: function (c) { return station(c, 3, A.target('screen', '<rect x="684" y="90" width="252" height="202" rx="15" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap the screen', 810, 380, {})); },
    work: function (c) { return [{ h: '3 · photo on the screen' }, { v: fmt(c.counts.n), k: 'photos in this data set' }, { v: '44', k: 'solar modules they came from' }, { t: 'Experts gave every photo a defect score. You will use those scores.' }]; },
    on: { screen: function (c) { c.next(); } } },
  { cap: 'Your job: PASS or STOP for every cell',
    note: 'The whole path: current in, light out, photo, decision. Every cell gets PASS or STOP.',
    svg: function (c) { return station(c, 4, ''); },
    work: function (c) {
      return [{ h: '4 · decision' }, { v: 'PASS', k: 'the cell goes on into a panel', col: C.gr }, { v: 'STOP', k: 'the cell is taken off the line', col: C.rd },
        { h: 'The whole path' }, { t: 'current in → light out → photo → decision' }, { t: 'Later, a model will make this decision. Same photo, same two answers.' }];
    } }
  ]
});

/* ============================ 0b  See real defects (a lens) ============================ */
var SPOTS = {   // where each thing is on the photo (0..1 units), read from the real photos
  447: { kind: 'bar', ys: [0.17, 0.5, 0.83], name: 'busbar', what: 'normal' },
  6: { kind: 'seg', seg: [0.03, 0.47, 0.45, 0.03], name: 'crack', what: 'defect' },
  23: { kind: 'disc', u: 0.75, v: 0.73, r: 0.17, name: 'dark area', what: 'defect' },
  245: { kind: 'seg', seg: [0.03, 0.53, 0.66, 0.6], name: 'broken part', what: 'defect' }
};
function hit(id, u, v) {
  var s = SPOTS[id]; if (!s) return false;
  if (s.kind === 'bar') return u > 0.08 && u < 0.92 && s.ys.some(function (y) { return Math.abs(v - y) < 0.045; });
  if (s.kind === 'seg') return segDist(u, v, s.seg) < 0.06;
  return Math.hypot(u - s.u, v - s.v) < s.r;
}
function spotCenter(id) { var s = SPOTS[id]; if (s.kind === 'bar') return [0.5, s.ys[1]]; if (s.kind === 'seg') return [(s.seg[0] + s.seg[2]) / 2, (s.seg[1] + s.seg[3]) / 2]; return [s.u, s.v]; }
var LZ = 2.6, LR = 64;
/* one lens frame: photos = [[id, x, y, size]], seek = id to search */
function lensFrame(photos, seek, find, cap, note, start) {
  return {
    cap: cap, note: note,
    svg: function (c) {
      var s = A.stage(), g = A.uid('lens');
      photos.forEach(function (p) {
        s += A.cell(p[0], p[1], p[2], p[3], { full: true }) + '<rect x="' + p[1] + '" y="' + p[2] + '" width="' + p[3] + '" height="' + p[3] + '" fill="none" stroke="#263346"/>';
        var m = D.meta(p[0]); s += t(p[1], p[2] - 12, 'cell ' + p[0] + ' · ' + (m ? m.kind : ''), { size: 16, fill: C.dim, f: 'm' });
      });
      s += gallery(c, 640);
      var P1 = photos[0], L = c.state.lens || { x: P1[1] + start[0] * P1[3], y: P1[2] + start[1] * P1[3] };
      if (c.print) { var sc = spotCenter(seek), P = photos.filter(function (p) { return p[0] === seek; })[0]; L = { x: P[1] + sc[0] * P[3], y: P[2] + sc[1] * P[3] }; }
      var zoom = '<g id="' + g + 'z" transform="translate(' + L.x + ' ' + L.y + ') scale(' + LZ + ') translate(' + (-L.x) + ' ' + (-L.y) + ')">' + photos.map(function (p) { return A.cell(p[0], p[1], p[2], p[3], { full: true }); }).join('') + '</g>';
      s += '<defs><clipPath id="' + g + 'c"><circle id="' + g + 'cc" cx="' + L.x + '" cy="' + L.y + '" r="' + LR + '"/></clipPath></defs>';
      var lens = '<g id="' + g + 'L"><rect x="' + (L.x - LR) + '" y="' + (L.y - LR) + '" width="' + 2 * LR + '" height="' + 2 * LR + '" fill="#000" opacity="0"/>' +
        '<g clip-path="url(#' + g + 'c)"><circle cx="' + L.x + '" cy="' + L.y + '" r="' + LR + '" fill="#05070b"/>' + zoom + '</g>' +
        '<circle id="' + g + 'r" cx="' + L.x + '" cy="' + L.y + '" r="' + LR + '" fill="none" stroke="#c6d2e2" stroke-width="5"/>' +
        '<path id="' + g + 'h" d="M' + (L.x + LR * .72) + ' ' + (L.y + LR * .72) + 'l34 34" stroke="#8d9bb0" stroke-width="11" stroke-linecap="round"/></g>';
      var P0 = photos.filter(function (p) { return p[0] === seek; })[0], sc0 = spotCenter(seek);
      s += A.target('lens', '<circle cx="' + L.x + '" cy="' + L.y + '" r="' + (LR + 6) + '" fill="none" stroke="#ffb547" stroke-width="3" class="pgd-lring"/>', find, Math.min(840, Math.max(130, L.x)), Math.min(526, L.y + LR + 50),
        { kind: 'drag', inner: lens, to: (P0[1] + sc0[0] * P0[3]) + ',' + (P0[2] + sc0[1] * P0[3]) });
      c._lens = { g: g, photos: photos, seek: seek, L: L };
      return s;
    },
    work: function (c) {
      var m = D.meta(seek), L = c.state.lens, rows = [{ h: 'Cell ' + seek }, { v: m ? m.kind : '…', k: 'cell type' }, { v: m ? String(m.prob) : '…', k: 'expert defect score (0 to 1)' }, { v: m ? label(m.prob) : '…', k: 'what the experts say', col: m && m.prob >= 0.5 ? C.rd : C.gr }];
      var P = photos.filter(function (p) { return p[0] === seek; })[0], u = L ? (L.x - P[1]) / P[3] : null, v = L ? (L.y - P[2]) / P[3] : null, all = meanAll(seek);
      rows.push({ h: 'Brightness (0 dark … 255 white)' });
      if (u != null && u > 0 && u < 1 && v > 0 && v < 1) rows.push({ v: String(meanIn(seek, u, v, LR / LZ / P[3])), k: 'inside the lens (x ' + u.toFixed(2) + ', y ' + v.toFixed(2) + ')' });
      else rows.push({ v: '–', k: 'move the lens onto cell ' + seek });
      rows.push({ v: String(all), k: 'the whole cell, on average' });
      return rows;
    },
    auto: function (c) { var sc = spotCenter(seek); c.state.pins = (c.state.pins || []).concat([{ id: seek, u: sc[0], v: sc[1] }]); c.state.lens = null; },
    bind: function (c, root) {
      var o = c._lens, g = o.g, el = root.querySelector('[data-pgd-t=lens]');
      var zz = root.querySelector('#' + g + 'z'), cc = root.querySelector('#' + g + 'cc'), rr = root.querySelector('#' + g + 'r'), hh = root.querySelector('#' + g + 'h'), ring = root.querySelector('.pgd-lring'), chip = el.querySelector('.pgd-chip');
      var P = o.photos.filter(function (p) { return p[0] === o.seek; })[0], found = false;
      function uv(p) { return [(p.x - P[1]) / P[3], (p.y - P[2]) / P[3]]; }
      D.onDrag(root, el, { start: o.L, step: 12, live: true,
        clamp: function (p) { return { x: Math.max(LR, Math.min(960 - LR, p.x)), y: Math.max(LR, Math.min(540 - LR, p.y)) }; },
        move: function (p) {
          zz.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ') scale(' + LZ + ') translate(' + (-p.x) + ' ' + (-p.y) + ')');
          cc.setAttribute('cx', p.x); cc.setAttribute('cy', p.y); rr.setAttribute('cx', p.x); rr.setAttribute('cy', p.y); ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y);
          hh.setAttribute('d', 'M' + (p.x + LR * .72) + ' ' + (p.y + LR * .72) + 'l34 34');
          chip.setAttribute('transform', 'translate(' + (Math.min(840, Math.max(130, p.x)) - Math.min(840, Math.max(130, o.L.x))) + ' ' + (Math.min(526, p.y + LR + 50) - Math.min(526, o.L.y + LR + 50)) + ')');
          c.state.lens = { x: p.x, y: p.y };
          var q = uv(p), on = hit(o.seek, q[0], q[1]); rr.setAttribute('stroke', on ? C.gr : '#c6d2e2');
          c.rework();
        },
        drop: function (p) {
          if (found) return; var q = uv(p);
          if (hit(o.seek, q[0], q[1])) { found = true; c.state.pins = (c.state.pins || []).concat([{ id: o.seek, u: q[0], v: q[1] }]); c.state.lens = null; c.next(); }
        } });
    }
  };
}
/* the pinned finds, on the right of the stage */
function gallery(c, x0) {
  var pins = c.state.pins || [], s = t(x0 + 140, 44, 'WHAT THE LENS FOUND', { size: 13, a: 'middle', f: 'h', fill: C.dim, ls: '.16em' });
  for (var i = 0; i < 4; i++) {
    var y = 78 + i * 112, p = pins[i], g = A.uid('pin');
    s += '<rect x="' + x0 + '" y="' + y + '" width="290" height="98" rx="12" fill="#0a1019" stroke="' + (p ? '#263346' : '#1b2533') + '"' + (p ? '' : ' stroke-dasharray="5 6"') + '/>';
    if (!p) continue;
    var sp = SPOTS[p.id], m = D.meta(p.id), cx = x0 + 50, cy = y + 49, R = 38, Z = 300;
    s += '<g class="' + (i === pins.length - 1 && c.enter ? 'pgd-grow' : '') + '"><defs><clipPath id="' + g + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + R + '"/></clipPath></defs>' +
      '<g clip-path="url(#' + g + ')">' + A.cell(p.id, cx - p.u * Z, cy - p.v * Z, Z, { full: true }) + '</g><circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + (sp.what === 'normal' ? C.gr : C.rd) + '" stroke-width="3"/>' +
      t(x0 + 102, y + 40, sp.name, { size: 21, w: 700 }) + t(x0 + 102, y + 68, sp.what === 'normal' ? 'normal · cell ' + p.id : 'defect · cell ' + p.id + ' · score ' + (m ? m.prob : ''), { size: 15, fill: sp.what === 'normal' ? C.gr : C.rd }) + '</g>';
  }
  return s;
}
D.register('0b', {
  init: function () { return { pins: [], lens: null }; },
  frames: [
    lensFrame([[447, 60, 70, 400]], 447, 'drag the lens onto a dark bar', 'A good cell has dark bars too', 'The thick dark bars are busbars: metal strips that carry the current out. Every good mono cell has them.', [0.62, 0.33]),
    lensFrame([[6, 60, 70, 400]], 6, 'find the thin dark line', 'A crack: a thin dark line', 'A crack cuts the cell. The part behind it may stop working later.', [0.7, 0.72]),
    lensFrame([[23, 60, 70, 400]], 23, 'find the part that gives no light', 'A dead area: a big dark blob', 'This part of the cell makes almost no power.', [0.3, 0.3]),
    lensFrame([[74, 40, 120, 270], [245, 330, 120, 270]], 245, 'find the broken part', 'Poly cells are spotty. Find the real damage.', 'Poly cells are made of many small crystals, so a spotty glow is normal. The dark wedge on cell 245 is not.', [0.5, 0.5]),
    { cap: 'Normal marks vs real damage',
      note: 'Busbars and spotty poly texture are normal. Cracks, dark areas and broken parts are defects. Finger breaks (short dark dashes) are defects too.',
      svg: function (c) {
        var s = A.stage() + gallery(c, 640);
        s += t(60, 70, 'Also look for', { size: 18, fill: C.dim, w: 700 });
        s += A.cell(1, 60, 92, 230, { full: true }) + '<rect x="60" y="92" width="230" height="230" fill="none" stroke="#263346"/>';
        s += '<circle cx="' + (60 + 0.27 * 230) + '" cy="' + (92 + 0.5 * 230) + '" r="22" fill="none" stroke="' + C.rd + '" stroke-width="2.5"/>';
        s += t(310, 130, 'finger breaks', { size: 22, w: 700 }) + t(310, 160, 'short dark dashes', { size: 18, fill: C.dim }) + t(310, 186, 'cell 1 · score ' + (D.meta(1) ? D.meta(1).prob : ''), { size: 15, fill: C.rd, f: 'm' });
        s += '<g class="pgd-in"><rect x="60" y="360" width="540" height="140" rx="12" fill="#0a1019" stroke="#263346"/>' +
          '<circle cx="92" cy="402" r="8" fill="' + C.gr + '"/>' + t(110, 408, 'normal: busbars, spotty poly glow', { size: 19 }) +
          '<circle cx="92" cy="448" r="8" fill="' + C.rd + '"/>' + t(110, 454, 'defect: crack, dark area, broken part, finger break', { size: 19 }) + '</g>';
        return s;
      },
      work: function (c) {
        var n = c.counts;
        return [{ h: 'In the whole data set' }, { v: fmt(n.nMono), k: 'mono cells (even glow)' }, { v: fmt(n.nPoly), k: 'poly cells (spotty glow)' },
          { t: 'The data gives only a <b>score</b> per cell, not the defect name. The names here are our reading of the photos.' }];
      } }
  ]
});

/* ============================ 0c  Weigh the two mistakes ============================ */
function lanes(c, o) {
  var s = A.stage(), g = A.uid('ln');
  s += '<defs>' + A.glow(g + 'b', 6) + '</defs>';
  // belt in, then the fork
  s += '<rect x="20" y="262" width="360" height="56" rx="10" fill="#151b24" stroke="#2a3340"/>';
  for (var k = 0; k < 9; k++) s += '<line x1="' + (40 + k * 40) + '" y1="266" x2="' + (40 + k * 40) + '" y2="314" stroke="#222b37" stroke-width="3"/>';
  s += '<path d="M380 262 L470 150 H700" stroke="#2a3340" stroke-width="56" fill="none" stroke-linejoin="round" opacity=".9"/>';
  s += '<path d="M380 318 L470 430 H700" stroke="#2a3340" stroke-width="56" fill="none" stroke-linejoin="round" opacity=".9"/>';
  s += '<path d="M380 262 L470 150 H700" stroke="' + C.gr + '" stroke-width="2" fill="none" stroke-dasharray="8 10" opacity=".55"/>';
  s += '<path d="M380 318 L470 430 H700" stroke="' + C.rd + '" stroke-width="2" fill="none" stroke-dasharray="8 10" opacity=".55"/>';
  s += '<g data-zone="pass"><rect x="468" y="112" width="120" height="76" rx="10" fill="#0b2418" stroke="' + C.gr + '" stroke-width="2"/>' + t(528, 158, 'PASS', { size: 20, a: 'middle', f: 'h', fill: C.gr }) + '</g>';
  s += '<g data-zone="stop"><rect x="468" y="392" width="120" height="76" rx="10" fill="#2a0e15" stroke="' + C.rd + '" stroke-width="2"/>' + t(528, 438, 'STOP', { size: 20, a: 'middle', f: 'h', fill: C.rd }) + '</g>';
  // PASS end: a module on a roof
  s += '<g><path d="M720 132 L826 52 L932 132 Z" fill="#141c27" stroke="#33455c" stroke-width="2"/><rect x="738" y="132" width="176" height="90" fill="#0e141d" stroke="#33455c" stroke-width="2"/>' +
    '<g transform="translate(772 62) skewX(-18)">';
  for (var r = 0; r < 3; r++) for (var q = 0; q < 5; q++) s += '<rect x="' + (q * 22) + '" y="' + (r * 18) + '" width="20" height="16" fill="' + (o.roof && r === 1 && q === 2 ? '#1a0a0e' : '#173052') + '" stroke="#5c7bb0" stroke-width=".8"/>';
  s += '</g>' + t(826, 248, "customer's roof", { size: 16, a: 'middle', fill: C.dim }) + '</g>';
  // STOP end: a re-check bench with a person
  s += '<g><rect x="730" y="430" width="190" height="14" rx="4" fill="#2a3340"/><path d="M745 444v40M905 444v40" stroke="#2a3340" stroke-width="6"/>' +
    '<circle cx="860" cy="372" r="16" fill="' + (o.bench ? C.am : '#3a4757') + '"/><path d="M836 430 Q836 394 860 394 Q884 394 884 430" fill="' + (o.bench ? '#8a6420' : '#2a3340') + '"/>' +
    t(825, 510, 're-check bench', { size: 16, a: 'middle', fill: C.dim }) + '</g>';
  // the scale
  var tilt = o.scale === 2 ? -9 : o.scale === 1 ? -14 : 0;
  s += '<g transform="translate(640 290)"><path d="M0 0 L-16 34 H16 Z" fill="#2a3340"/><g transform="rotate(' + tilt + ')"><line x1="-86" y1="0" x2="86" y2="0" stroke="#8d9bb0" stroke-width="4"/>' +
    '<path d="M-86 0 L-112 40 H-60 Z" fill="none" stroke="#5d6b80" stroke-width="1.5"/><path d="M86 0 L60 40 H112 Z" fill="none" stroke="#5d6b80" stroke-width="1.5"/>' +
    (o.scale >= 1 ? '<g class="' + (o.scale === 1 && c.enter ? 'pgd-grow' : '') + '"><rect x="-108" y="14" width="44" height="26" rx="3" fill="' + C.rd + '"/><rect x="-104" y="-8" width="36" height="22" rx="3" fill="#c23a52"/></g>' : '') +
    (o.scale >= 2 ? '<g class="' + (c.enter ? 'pgd-grow' : '') + '"><rect x="74" y="28" width="24" height="12" rx="2" fill="' + C.am + '"/></g>' : '') + '</g>' +
    '<circle cx="0" cy="0" r="5" fill="#c6d2e2"/></g>';
  if (o.scale >= 1) s += t(546, 356, 'missed defect', { size: 15, fill: C.rd, a: 'middle', w: 700 });
  if (o.scale >= 2) s += t(736, 356, 'false alarm', { size: 15, fill: C.am, a: 'middle', w: 700 });
  return s;
}
function token(id, x, y, key, label, to) {
  return A.target(key, '<rect x="' + (x - 4) + '" y="' + (y - 4) + '" width="98" height="98" rx="8" fill="none" stroke="#ffb547" stroke-width="3"/>', label, x + 45, y - 22,
    { kind: 'drag', inner: A.cell(id, x, y, 90, { full: true }), to: to });
}
function laneDrag(key, zone) {
  return function (c, root) {
    var el = root.querySelector('[data-pgd-t=' + key + ']'), ring = el.querySelector('.pgd-ring'), z = root.querySelector('[data-zone=' + zone + ']');
    var d = D.onDrag(root, el, { start: { x: 0, y: 0 }, step: 20,
      move: function (p) { el.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ')'); },
      drop: function () {
        var r = ring.getBoundingClientRect(), zr = z.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, m = zr.width * 0.3;
        if (cx > zr.left - m && cx < zr.right + m && cy > zr.top - m && cy < zr.bottom + m) c.next();
        else d.set({ x: 0, y: 0 });
      } });
  };
}
D.register('0c', {
  init: function () { return {}; },
  frames: [
  { cap: 'Send a real defect down the PASS lane',
    note: 'Cell 23 has a dead area (expert score 1.0). Send it to PASS on purpose and watch what happens.',
    svg: function (c) { return lanes(c, {}) + token(23, 60, 244, 'bad', 'drag it to PASS', '528,150'); },
    work: function () { var m = D.meta(23); return [{ h: 'Cell 23' }, { v: String(m ? m.prob : '…'), k: 'expert defect score' }, { v: 'defect', k: 'what the experts say', col: C.rd }, { t: 'You are the inspector. This time you make a mistake on purpose.' }]; },
    auto: function () {},
    bind: laneDrag('bad', 'pass') },
  { cap: 'A missed defect ships to a customer',
    note: 'The bad cell went into a panel on a roof. Its dead area makes less power for years. That is a warranty claim.',
    svg: function (c) {
      return lanes(c, { roof: 1, scale: 1 }) + '<g class="pgd-in"><rect x="770" y="282" width="112" height="40" rx="8" fill="#2a0e15" stroke="' + C.rd + '"/>' + t(826, 308, 'less power', { size: 16, a: 'middle', fill: '#ff9aac', w: 700 }) + '</g>' +
        token(447, 60, 244, 'good', 'drag it to STOP', '528,430');
    },
    work: function () {
      return [{ h: 'Missed defect' }, { t: 'A <b>defect</b> that gets <b>PASS</b>.' }, { t: 'It ships. The customer finds it. Hard to fix, costly, bad name.' }, { h: 'Next: cell 447' }, { v: String(D.meta(447) ? D.meta(447).prob : '…'), k: 'expert defect score' }, { v: 'OK', k: 'a good cell', col: C.gr }];
    },
    bind: laneDrag('good', 'stop') },
  { cap: 'A false alarm costs a second look',
    note: 'The good cell went to the re-check bench. A person looks again and sends it back. It costs time, not a customer.',
    svg: function (c) {
      return lanes(c, { roof: 1, bench: 1, scale: 2 }) + '<g class="pgd-in">' + A.cell(447, 790, 380, 44, { full: true }) + '</g>' +
        A.target('scale', '<rect x="520" y="236" width="240" height="132" rx="16" fill="none" stroke="#ffb547" stroke-width="3" stroke-dasharray="6 8"/>', 'tap the scale', 640, 222, {});
    },
    work: function () { return [{ h: 'False alarm' }, { t: 'A <b>good</b> cell that gets <b>STOP</b>.' }, { t: 'A person checks it again. Time and work, but the cell is saved.' }, { h: 'On the scale' }, { v: 'missed defect', k: 'much heavier', col: C.rd }, { v: 'false alarm', k: 'lighter', col: C.am }]; },
    on: { scale: function (c) { c.next(); } } },
  { cap: 'So the line has one hard rule',
    note: 'Out of every 100 defect cells, the line must stop at least 95. At most 5 may slip through.',
    svg: function (c) {
      var s = A.stage();
      for (var i = 0; i < 100; i++) {
        var x = 80 + (i % 10) * 40, y = 70 + Math.floor(i / 10) * 40, bad = i >= 95;
        s += '<rect x="' + x + '" y="' + y + '" width="32" height="32" rx="5" fill="' + (bad ? C.rd : C.gr) + '" opacity="' + (bad ? 1 : .8) + '"' + (bad ? ' class="pgd-grow"' : '') + '/>';
      }
      s += t(280, 500, '100 defect cells', { size: 19, a: 'middle', fill: C.dim });
      s += '<g class="pgd-in"><rect x="540" y="110" width="360" height="120" rx="14" fill="#0b2418" stroke="' + C.gr + '"/>' + t(570, 160, 'STOP at least 95', { size: 30, w: 700, fill: C.gr }) + t(570, 200, 'this share is called recall', { size: 18, fill: C.dim }) + '</g>';
      s += '<g class="pgd-in2"><rect x="540" y="260" width="360" height="120" rx="14" fill="#2a0e15" stroke="' + C.rd + '"/>' + t(570, 310, 'at most 5 slip through', { size: 30, w: 700, fill: '#ff9aac' }) + t(570, 350, 'then count the false alarms it costs', { size: 18, fill: C.dim }) + '</g>';
      return s;
    },
    work: function (c) {
      var d = c.counts.def;
      return [{ h: 'The target' }, { v: '95 of 100', k: 'defects that must be stopped' }, { bar: 0.95, col: C.gr, mark: 0.95 }, { h: 'In this data set' }, { v: fmt(d), k: 'defect cells' }, { op: '×', v: '5%', k: 'may slip through' }, { op: '=', v: (d * 0.05).toFixed(2), k: 'so at most ' + Math.floor(d * 0.05) + ' cells', res: true }];
    } }
  ]
});

/* ============================ 0d  Inspect 12 cells: the four boxes ============================ */
var GAME = [6, 447, 245, 74, 23, 987, 96, 1, 11, 143, 49, 905];
var BOX = { caught: [200, 196, 'caught', C.gr], missed: [520, 196, 'missed', C.rd], fa: [200, 360, 'false alarm', C.am], ok: [520, 360, 'correctly passed', C.cy] };
function labAnswers() { var m = (D.liveSub('0d').mech || {}).choices || {}; return GAME.every(function (id) { return m[id] != null; }) ? m : null; }
function boxOf(id, stop) { var d = D.meta(id).prob >= 0.5; return d ? (stop ? 'caught' : 'missed') : (stop ? 'fa' : 'ok'); }
function tally(ch) { var n = { caught: 0, missed: 0, fa: 0, ok: 0 }; GAME.forEach(function (id) { if (ch[id] != null) n[boxOf(id, ch[id])]++; }); return n; }
function fourBoxes(c, o) {
  var s = A.stage(), ch = c.state.ch, n = tally(ch);
  // the rack of 12
  GAME.forEach(function (id, i) {
    var x = 40 + i * 74, y = 34;
    if (ch[id] != null) { s += '<rect x="' + x + '" y="' + y + '" width="64" height="64" rx="4" fill="none" stroke="#1b2533" stroke-dasharray="4 4"/>'; return; }
    var img = A.cell(id, x, y, 64, { full: true });
    if (o.sort && c.state.sel === id) {
      s += '<rect x="' + (x - 4) + '" y="' + (y - 4) + '" width="72" height="72" rx="6" fill="none" stroke="#fff" stroke-width="2"/>' + img;
    } else if (o.sort && c.state.sel != null) s += '<g opacity=".4">' + img + '</g>';
    else if (o.sort) { var lead = firstOpen(ch) === id; s += A.target('c' + id, '<rect x="' + (x - 3) + '" y="' + (y - 3) + '" width="70" height="70" rx="5" fill="none" stroke="#ffb547" stroke-width="2"/>', lead ? 'tap a cell' : 'cell ' + id, Math.max(90, x + 32), y + 98, { inner: img, cls: lead ? '' : 'pgd-nochip' }); }
    else s += img;
  });
  // answer chips under the chosen cell (only when the lab has no answers yet)
  if (o.sort && c.state.sel != null) {
    var k = GAME.indexOf(c.state.sel), x0 = Math.max(80, Math.min(880, 40 + k * 74 + 32));
    s += A.target('pass', '<rect x="' + (x0 - 92) + '" y="112" width="84" height="36" rx="8" fill="#0b2418" stroke="' + C.gr + '" stroke-width="2"/>', 'PASS', x0 - 50, 0, { inner: t(x0 - 50, 136, 'PASS', { size: 15, a: 'middle', f: 'h', fill: C.gr }), cls: 'pgd-nochip' }) + t(x0, 170, 'your call?', { size: 15, a: 'middle', fill: C.am, w: 700 });
    s += A.target('stop', '<rect x="' + (x0 + 8) + '" y="112" width="84" height="36" rx="8" fill="#2a0e15" stroke="' + C.rd + '" stroke-width="2"/>', 'STOP', x0 + 50, 0, { inner: t(x0 + 50, 136, 'STOP', { size: 15, a: 'middle', f: 'h', fill: C.rd }), cls: 'pgd-nochip' });
  }
  // headers
  s += t(350, 182, 'you said STOP', { size: 17, a: 'middle', fill: C.rd, w: 700 }) + t(670, 182, 'you said PASS', { size: 17, a: 'middle', fill: C.gr, w: 700 });
  s += t(186, 268, 'experts:', { size: 15, a: 'end', fill: C.dim }) + t(186, 290, 'defect', { size: 19, a: 'end', w: 700, fill: C.rd }) + t(186, 432, 'experts:', { size: 15, a: 'end', fill: C.dim }) + t(186, 454, 'OK', { size: 19, a: 'end', w: 700, fill: C.gr });
  Object.keys(BOX).forEach(function (b) {
    var q = BOX[b], hl = (o.row === 'def' && (b === 'caught' || b === 'missed')) || (o.row === 'ok' && (b === 'fa' || b === 'ok')), dim = o.row && !hl;
    s += '<g opacity="' + (dim ? .35 : 1) + '"><rect x="' + q[0] + '" y="' + q[1] + '" width="300" height="148" rx="12" fill="#0a1019" stroke="' + q[3] + '" stroke-opacity="' + (hl ? 1 : .5) + '" stroke-width="' + (hl ? 2.5 : 1.5) + '"/>' +
      t(q[0] + 16, q[1] + 30, q[2], { size: 18, w: 700, fill: q[3] }) + t(q[0] + 284, q[1] + 36, String(n[b]), { size: 34, a: 'end', f: 'm', w: 700, fill: q[3] });
    var j = 0; GAME.forEach(function (id) { if (ch[id] != null && boxOf(id, ch[id]) === b) { s += '<g class="' + (c.state.last === id && c.enter !== false ? 'pgd-grow' : '') + '">' + A.cell(id, q[0] + 16 + j * 46, q[1] + 82, 42, { full: true }) + '</g>'; j++; } });
    s += '</g>';
  });
  return s;
}
function firstOpen(ch) { for (var i = 0; i < GAME.length; i++) if (ch[GAME[i]] == null) return GAME[i]; return null; }
function src(c) { return c.state.fromLab ? 'your answers in the lab (0d)' : 'your answers here'; }
D.register('0d', {
  init: function () { var L = labAnswers(); return { ch: {}, sel: null, fromLab: !!L, lab: L }; },
  frames: [
  { cap: 'Sort the 12 cells into four boxes',
    note: 'Each cell lands in a box: what you said (STOP or PASS) against what the experts said (defect or OK).',
    svg: function (c) { return fourBoxes(c, { sort: true }); },
    work: function (c) {
      var n = tally(c.state.ch), k = Object.keys(c.state.ch).length;
      return [{ h: 'Sorted ' + k + ' of 12' }, { v: String(n.caught), k: 'caught: defect, you said STOP', col: C.gr }, { v: String(n.missed), k: 'missed: defect, you said PASS', col: C.rd },
        { v: String(n.fa), k: 'false alarm: OK, you said STOP', col: C.am }, { v: String(n.ok), k: 'correctly passed: OK, you said PASS', col: C.cy }, { tag: 'your value' }, { t: 'From ' + src(c) + '.' }];
    },
    auto: function (c) { var L = c.state.lab; GAME.forEach(function (id) { c.state.ch[id] = L ? L[id] : (D.meta(id).prob >= 0.5 ? 1 : 0); }); },
    bind: function (c, root) {
      function place(id, v) { c.state.ch[id] = v; c.state.sel = null; c.state.last = id; if (Object.keys(c.state.ch).length >= 12) c.next(); else { c.redraw(); var nx = root.querySelector('.pgd-target'); if (nx) try { nx.focus({ preventScroll: true }); } catch (e) {} } }
      GAME.forEach(function (id) {
        var el = root.querySelector('[data-pgd-t=c' + id + ']'); if (!el) return;
        D.onTap(el, function () { if (c.state.lab) place(id, c.state.lab[id]); else { c.state.sel = id; c.redraw(); var p = root.querySelector('[data-pgd-t=pass]'); if (p) try { p.focus({ preventScroll: true }); } catch (e) {} } });
      });
      ['pass', 'stop'].forEach(function (k) { var el = root.querySelector('[data-pgd-t=' + k + ']'); if (el) D.onTap(el, function () { place(c.state.sel, k === 'stop' ? 1 : 0); }); });
    } },
  { cap: 'Look at the defect row',
    note: 'The top row holds the 6 real defects: the ones you caught and the ones you missed.',
    svg: function (c) { return fourBoxes(c, {}) + A.target('def', '<rect x="194" y="190" width="632" height="160" rx="15" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap the defect row', 510, 352, {}); },
    work: function (c) { var n = tally(c.state.ch); return [{ h: 'The four boxes' }, { v: n.caught + ' · ' + n.missed, k: 'caught · missed' }, { v: n.fa + ' · ' + n.ok, k: 'false alarm · correctly passed' }, { op: '=', v: '12', k: 'cells', res: true }]; },
    on: { def: function (c) { c.next(); } } },
  { cap: 'Recall: how many defects did you stop?',
    note: 'Recall = caught ÷ all real defects. The line needs at least 95%.',
    svg: function (c) { return fourBoxes(c, { row: 'def' }) + A.target('okr', '<rect x="194" y="354" width="632" height="160" rx="15" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap the OK row', 510, 524, {}); },
    work: function (c) {
      var n = tally(c.state.ch), d = n.caught + n.missed;
      return [{ h: 'Recall' }, { v: String(n.caught), k: 'caught' }, { op: '÷', v: String(d), k: 'all real defects (caught + missed)' }, { op: '=', v: D.pct(n.caught, d, 0), k: 'recall', res: true }, { bar: d ? n.caught / d : 0, col: n.caught / d >= .95 ? C.gr : C.rd, mark: .95 }, { t: 'target: at least 95%' }, { tag: 'your value' }];
    },
    on: { okr: function (c) { c.next(); } } },
  { cap: 'False alarms: how many good cells did you stop?',
    note: 'False-alarm share = false alarms ÷ all good cells. Lower is better, but recall comes first.',
    svg: function (c) { return fourBoxes(c, { row: 'ok' }); },
    work: function (c) {
      var n = tally(c.state.ch), g = n.fa + n.ok, d = n.caught + n.missed;
      return [{ h: 'False alarms' }, { v: String(n.fa), k: 'false alarms' }, { op: '÷', v: String(g), k: 'all good cells' }, { op: '=', v: D.pct(n.fa, g, 0), k: 'good cells stopped', res: true },
        { h: 'Your scoreboard' }, { v: D.pct(n.caught, d, 0) + ' · ' + D.pct(n.fa, g, 0), k: 'recall · false alarms' }, { tag: 'your value' }, { t: 'Every model in this course gets the same two numbers.' }];
    } }
  ]
});
})();
