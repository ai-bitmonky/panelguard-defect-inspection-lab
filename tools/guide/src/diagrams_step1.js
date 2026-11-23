/* PanelGuard Diagram guide — Step 1 diagrams (1a 1b 1c 1d 1e). Uses window.PGD (engine.js).
   Every number is a fact of this data set (labels.json, the photo pack, tools/guide/src/facts.json made by facts.py)
   or the student's own live value (tagged "your value"). */
(function () {
'use strict';
var D = window.PGD, A = D.art, C = A.COL, t = A.t, fmt = D.fmt;
var F = function () { return window.PGD_FACTS || {}; };

/* a strip image of n bytes of the pack starting at byte b0 (1 px high, stretched in the SVG) */
var RIB = {};
function ribbonURL(b0, n) {
  var key = b0 + ':' + n; if (RIB[key]) return RIB[key];
  var p = (function () { try { return window.PG && window.PG.pack && window.PG.pack(); } catch (e) { return null; } })(); if (!p) return '';
  var cv = document.createElement('canvas'); cv.width = n; cv.height = 1;
  var x = cv.getContext('2d'), im = x.createImageData(n, 1);
  for (var k = 0; k < n; k++) { var v = p[b0 + k]; im.data[4 * k] = im.data[4 * k + 1] = im.data[4 * k + 2] = v; im.data[4 * k + 3] = 255; }
  x.putImageData(im, 0, 0); return (RIB[key] = cv.toDataURL('image/png'));
}
function byteAt(i) { try { var p = window.PG.pack(); return p ? p[i] : null; } catch (e) { return null; } }
function gray(v) { v = Math.max(0, Math.min(255, Math.round(v))); return 'rgb(' + v + ',' + v + ',' + v + ')'; }
function ink(v) { return v > 140 ? '#081018' : '#e6eef8'; }
function px(id, x, y, s, o) { o = o || {}; o.px = true; return A.cell(id, x, y, s, o); }
function liveTag(live) { return live ? { tag: 'your value' } : { tag: 'typical value' }; }

/* ============================ 1a  Load the pack ============================ */
var B0 = 20 * 64 + 14;   // byte 1,294 = photo 1, row 20, column 14
D.register('1a', {
  init: function () { return { rows: 0, stack: 0 }; },
  frames: [
  { cap: 'The file is one long line of bytes',
    note: 'The pack is one long line of numbers. Each number is one byte, one pixel. The pattern repeats every 64 bytes.',
    svg: function (c) {
      var s = A.stage(), url = ribbonURL(0, 1536), X0 = 236, WR = 690, sc = WR / 1536;
      // the file: a data cartridge
      s += '<g><rect x="34" y="104" width="170" height="210" rx="14" fill="#0d1622" stroke="#2b4157" stroke-width="2"/><path d="M34 140h170" stroke="#1d2e40" stroke-width="2"/>' +
        '<rect x="52" y="118" width="64" height="10" rx="3" fill="#1aa6c9" opacity=".7"/>' +
        [0, 1, 2, 3, 4, 5].map(function (k) { return '<rect x="' + (54 + k * 24) + '" y="292" width="14" height="22" rx="2" fill="#c9a24a" opacity=".85"/>'; }).join('') +
        t(119, 196, 'cells64.u8', { size: 21, a: 'middle', f: 'm', w: 700 }) + t(119, 226, 'the photo pack', { size: 17, a: 'middle', fill: C.dim }) +
        t(119, 262, fmt(c.counts.bytes) + ' B', { size: 17, a: 'middle', f: 'm', fill: C.cy }) + '</g>';
      // the ribbon (first 24 rows of photo 1 = bytes 0 … 1,535)
      s += '<path d="M204 170 C220 170 220 166 ' + X0 + ' 166" stroke="#2b4157" stroke-width="2" fill="none"/>';
      s += url ? '<image href="' + url + '" x="' + X0 + '" y="146" width="' + WR + '" height="44" preserveAspectRatio="none" style="image-rendering:pixelated"/>' : '<rect x="' + X0 + '" y="146" width="' + WR + '" height="44" fill="#111824"/>';
      s += '<rect x="' + X0 + '" y="146" width="' + WR + '" height="44" fill="none" stroke="#46e3ff" stroke-opacity=".5"/>';
      for (var k = 0; k <= 24; k++) s += '<line x1="' + (X0 + k * 64 * sc) + '" y1="' + (k % 4 ? 192 : 190) + '" x2="' + (X0 + k * 64 * sc) + '" y2="' + (k % 4 ? 198 : 206) + '" stroke="#46e3ff" stroke-opacity="' + (k % 4 ? .35 : .8) + '"/>';
      [[0, 'byte 0'], [640, '640'], [1280, '1,280']].forEach(function (q) { s += t(X0 + q[0] * sc, 226, q[1], { size: 15, f: 'm', fill: C.dim, a: q[0] ? 'middle' : 'start' }); });
      s += t(X0 + WR, 132, '… on to byte ' + fmt(c.counts.bytes - 1), { size: 16, a: 'end', fill: C.dim, f: 'm' });
      s += A.tag(X0 + 64 * sc / 2, 128, 'every 64', C.am, { a: 'middle', size: 14 });
      s += '<path d="M' + X0 + ' 136 v4 h' + (64 * sc) + ' v-4" stroke="#ffb547" fill="none" stroke-width="1.6"/>';
      // magnifier: bytes 1,294 … 1,301
      var mx = X0 + B0 * sc, mw = 8 * sc;
      s += '<rect x="' + (mx - 1) + '" y="142" width="' + (mw + 2) + '" height="52" fill="none" stroke="#ffb547" stroke-width="2"/>';
      s += '<path d="M' + mx + ' 194 L262 300 M' + (mx + mw) + ' 194 L898 300" stroke="#ffb547" stroke-opacity=".5" stroke-dasharray="4 5"/>';
      for (var j = 0; j < 8; j++) {
        var v = byteAt(B0 + j), x = 262 + j * 80;
        var sq = '<rect x="' + x + '' + '" y="300" width="72" height="72" rx="8" fill="' + (v == null ? '#111824' : gray(v)) + '" stroke="#0a0e15" stroke-width="2"/>' +
          t(x + 36, 345, v == null ? '…' : String(v), { size: 24, a: 'middle', f: 'm', w: 700, fill: v == null ? C.dim : ink(v) });
        if (j === 3) s += A.target('byte', '<rect x="' + (x - 5) + '" y="295" width="82" height="82" rx="11" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap a byte', x + 36, 420, { inner: sq });
        else s += sq;
        s += t(x + 36, 396, fmt(B0 + j), { size: 13, a: 'middle', f: 'm', fill: C.dim2 });
      }
      s += t(262, 288, 'bytes ' + fmt(B0) + ' … ' + fmt(B0 + 7), { size: 16, fill: C.am, f: 'm' });
      s += t(480, 500, 'One byte = one pixel. Dark = little light, bright = much light.', { size: 19, a: 'middle', fill: C.dim });
      return s;
    },
    work: function (c) {
      return [{ h: 'The file' }, { v: fmt(c.counts.bytes), k: 'bytes in the file' }, { v: '1 byte', k: '= 1 pixel' }, { v: '0 … 255', k: 'what one byte can hold (never below 0)' },
        { t: 'Look at the ribbon: dark, bright, dark … the pattern repeats every <b>64</b> bytes.' }];
    },
    on: { byte: function (c) { c.next(); } } },

  { cap: 'Fold the line: 64 bytes make one row',
    note: 'Byte 1,294 sits in row 20, column 14 of photo 1. Folding the line every 64 bytes builds the photo row by row.',
    svg: function (c) {
      var s = A.stage(), v = byteAt(B0 + 3), b = B0 + 3, r = Math.floor(b / 64), cl = b % 64;
      // left: the byte and the gray scale
      s += '<g class="pgd-in"><rect x="40" y="60" width="110" height="110" rx="12" fill="' + (v == null ? '#111824' : gray(v)) + '" stroke="#ffb547" stroke-width="3"/>' +
        t(95, 128, v == null ? '…' : String(v), { size: 38, a: 'middle', f: 'm', w: 700, fill: v == null ? C.dim : ink(v) }) +
        t(170, 92, 'byte ' + fmt(b), { size: 20, f: 'm', fill: C.am }) + t(170, 122, 'row ' + r + ', column ' + cl, { size: 22, w: 700 }) + t(170, 150, 'of photo 1', { size: 18, fill: C.dim }) + '</g>';
      var gid = A.uid('gs');
      s += '<defs><linearGradient id="' + gid + '"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>';
      s += '<rect x="40" y="226" width="380" height="26" rx="4" fill="url(#' + gid + ')"/>' + t(40, 276, '0', { size: 16, f: 'm', fill: C.dim }) + t(420, 276, '255', { size: 16, f: 'm', fill: C.dim, a: 'end' }) +
        t(40, 214, 'how bright', { size: 17, fill: C.dim });
      if (v != null) s += '<path d="M' + (40 + 380 * v / 255) + ' 220 v38" stroke="#ffb547" stroke-width="3"/>' + A.tag(40 + 380 * v / 255, 302, String(v), C.am, { a: 'middle' });
      // middle: the ribbon feeding in
      var url = ribbonURL(c.state.rows * 64, 64 * 6);
      s += t(40, 362, 'the line of bytes', { size: 17, fill: C.dim });
      s += url ? '<image href="' + url + '" x="40" y="374" width="380" height="30" preserveAspectRatio="none" style="image-rendering:pixelated"/>' : '';
      s += '<rect x="40" y="374" width="380" height="30" fill="none" stroke="#46e3ff" stroke-opacity=".5"/>';
      s += '<path d="M420 389 C470 389 480 140 530 140" stroke="#46e3ff" stroke-opacity=".35" stroke-width="2" fill="none" stroke-dasharray="6 6" class="pgd-flow"/>';
      // right: the photo forming, one row per 64 bytes
      var PX = 560, PY = 90, PS = 320, cid = A.uid('fold');
      s += '<defs><clipPath id="' + cid + '"><rect id="' + cid + 'r" x="' + PX + '" y="' + PY + '" width="' + PS + '" height="' + (PS * c.state.rows / 64) + '"/></clipPath></defs>';
      s += '<rect x="' + PX + '" y="' + PY + '" width="' + PS + '" height="' + PS + '" fill="#0a1019" stroke="#263346" stroke-dasharray="5 5"/>';
      s += px(1, PX, PY, PS, { clip: cid });
      for (var k = 1; k < 8; k++) s += '<line x1="' + PX + '" y1="' + (PY + k * PS / 8) + '" x2="' + (PX - 8) + '" y2="' + (PY + k * PS / 8) + '" stroke="#46e3ff" stroke-opacity=".4"/>';
      s += t(PX - 14, PY + 14, 'row 0', { size: 14, f: 'm', fill: C.dim, a: 'end' }) + t(PX - 14, PY + PS, 'row 63', { size: 14, f: 'm', fill: C.dim, a: 'end' });
      s += '<text id="' + cid + 't" x="' + (PX + PS / 2) + '" y="' + (PY - 14) + '" font-family="' + A.FM + '" font-size="17" font-weight="700" fill="' + C.cy + '" text-anchor="middle">' + c.state.rows + ' of 64 rows</text>';
      // the handle
      var hy = PY + PS * c.state.rows / 64;
      s += '<g id="' + cid + 'h" transform="translate(0 ' + (hy - PY) + ')">' +
        A.target('fold', '<rect x="' + (PX - 6) + '" y="' + (PY - 7) + '" width="' + (PS + 12) + '" height="14" rx="7" fill="#ffb547"/>' +
          '<path d="M' + (PX + PS / 2 - 10) + ' ' + (PY - 1) + 'h20M' + (PX + PS / 2 - 10) + ' ' + (PY + 3) + 'h20" stroke="#1a1103" stroke-width="2"/>', 'drag down to fold', PX + PS / 2, PY + 38, { kind: 'drag', to: (PX + PS / 2) + ',' + (PY + PS + 4) }) + '</g>';
      c._fold = { cid: cid, PX: PX, PY: PY, PS: PS };
      return s;
    },
    work: function (c) {
      var b = B0 + 3, r = Math.floor(b / 64);
      return [{ h: 'Where is byte ' + fmt(b) + '?' }, { v: fmt(b), k: 'byte number' }, { op: '÷', v: '64', k: 'bytes in one row' }, { op: '=', v: r + ' rest ' + (b - r * 64), k: 'row ' + r + ', column ' + (b - r * 64), res: true },
        { h: 'Rows folded' }, { v: c.state.rows + ' × 64 = ' + fmt(c.state.rows * 64), k: 'bytes used so far' }];
    },
    auto: function (c) { c.state.rows = 64; },
    bind: function (c, root) {
      var f = c._fold, el = root.querySelector('[data-pgd-t=fold]'), g = root.querySelector('#' + f.cid + 'h'), clip = root.querySelector('#' + f.cid + 'r'), lab = root.querySelector('#' + f.cid + 't');
      function rowsAt(p) { return Math.max(0, Math.min(64, Math.round((p.y - f.PY) / f.PS * 64))); }
      D.onDrag(root, el, { start: { x: f.PX + f.PS / 2, y: f.PY + f.PS * c.state.rows / 64 }, step: f.PS / 16, live: true,
        clamp: function (p) { return { x: f.PX + f.PS / 2, y: Math.max(f.PY, Math.min(f.PY + f.PS, p.y)) }; },
        move: function (p) { var r = rowsAt(p); g.setAttribute('transform', 'translate(0 ' + (r * f.PS / 64) + ')'); clip.setAttribute('height', r * f.PS / 64); lab.textContent = r + ' of 64 rows'; c.state.rows = r; c.rework(); },
        drop: function (p) { if (rowsAt(p) >= 64) { c.state.rows = 64; c.next(); } } });
    } },

  { cap: '64 rows of 64 pixels: one photo',
    note: 'One photo is a 64 by 64 grid. Every pixel has a place: (row, column). Pull the photos together to stack all of them.',
    svg: function (c) {
      var s = A.stage(), PX = 70, PY = 70, PS = 320, v = byteAt(B0 + 3);
      s += px(1, PX, PY, PS) + '<rect x="' + PX + '" y="' + PY + '" width="' + PS + '" height="' + PS + '" fill="none" stroke="#46e3ff" stroke-opacity=".6"/>';
      // axes
      s += A.arrow(PX, PY - 18, PX + PS, PY - 18, C.cy, { w: 2 }) + t(PX + PS / 2, PY - 28, 'columns 0 … 63', { size: 16, a: 'middle', fill: C.cy });
      s += A.arrow(PX - 18, PY, PX - 18, PY + PS, C.cy, { w: 2 }) + '<text x="' + (PX - 28) + '" y="' + (PY + PS / 2) + '" font-family="' + A.FB + '" font-size="16" font-weight="600" fill="' + C.cy + '" text-anchor="middle" transform="rotate(-90 ' + (PX - 28) + ' ' + (PY + PS / 2) + ')">rows 0 … 63</text>';
      var r = 20, cl = 17, cx = PX + (cl + .5) * PS / 64, cy = PY + (r + .5) * PS / 64;
      s += '<rect x="' + (PX + cl * 5) + '" y="' + (PY + r * 5) + '" width="5" height="5" fill="none" stroke="#ffb547" stroke-width="2"/>';
      s += '<path d="M' + cx + ' ' + cy + 'L' + (PX + PS + 20) + ' ' + (PY + 40) + '" stroke="#ffb547" stroke-width="1.5"/>' + A.tag(PX + PS + 20, PY + 46, '(row 20, col 17) = ' + (v == null ? '…' : v), C.am, { size: 15 });
      s += t(PX + PS / 2, PY + PS + 34, '4,096 pixels in one photo', { size: 19, a: 'middle', w: 700 });
      // right: the other photos waiting, and the stack handle
      var n = Math.max(1, c.state.stack);
      var SX = 560, SY = 190;
      for (var k = Math.min(n, 12) - 1; k >= 0; k--) s += '<g opacity="' + (1 - k * .05) + '">' + px(k + 1, SX + k * 16, SY - k * 12, 200, { r: 2 }) + '<rect x="' + (SX + k * 16) + '" y="' + (SY - k * 12) + '" width="200" height="200" fill="none" stroke="#46e3ff" stroke-opacity=".45"/></g>';
      s += t(SX + 100, SY + 236, n > 1 ? n + ' photos stacked' : 'photo 1', { size: 17, a: 'middle', f: 'm', fill: C.cy, cls: 'pgd-stacklab' });
      for (var g = 11; g >= 1; g--) s += '<rect x="' + (SX + g * 16) + '" y="' + (SY - g * 12) + '" width="200" height="200" fill="none" stroke="#46e3ff" stroke-opacity="' + (n > g ? 0 : .18) + '" stroke-dasharray="4 6"/>';
      var hx = SX + 220 + Math.min(n, 12) * 16;
      s += A.target('stack', '<circle cx="' + hx + '" cy="' + (SY + 100) + '" r="20" fill="#ffb547"/><path d="M' + (hx - 7) + ' ' + (SY + 92) + 'l8 8-8 8M' + (hx + 1) + ' ' + (SY + 92) + 'l8 8-8 8" stroke="#1a1103" stroke-width="2.4" fill="none"/>',
        'drag right to stack', hx - 30, SY + 300, { kind: 'drag', to: '930,' + (SY + 100) });
      c._st = { SX: SX, SY: SY, hx0: SX + 236 };
      return s;
    },
    work: function () { return [{ h: 'One photo' }, { v: '64', k: 'bytes in one row' }, { op: '×', v: '64', k: 'rows in one photo' }, { op: '=', v: '4,096', k: 'bytes in one photo', res: true }, { t: 'Pixel (row 20, column 17) sits at byte 20 × 64 + 17 = <b>1,297</b>.' }]; },
    auto: function (c) { c.state.stack = 12; },
    bind: function (c, root) {
      var el = root.querySelector('[data-pgd-t=stack]'), st = c._st, x0 = st.hx0 + 16;
      D.onDrag(root, el, { start: { x: x0, y: st.SY + 100 }, step: 24, live: true,
        clamp: function (p) { return { x: Math.max(x0, Math.min(940, p.x)), y: st.SY + 100 }; },
        move: function (p) { var n = Math.max(1, Math.min(12, 1 + Math.round((p.x - x0) / 26))); el.setAttribute('transform', 'translate(' + (p.x - x0) + ' 0)'); var l = root.querySelector('.pgd-stacklab'); if (l) l.textContent = n > 1 ? n + ' photos stacked' : 'photo 1'; },
        drop: function (p) { if (p.x >= 900) { c.state.stack = 12; c.next(); } } });
    } },

  { cap: 'All photos in one block: (photos, rows, columns)',
    note: 'The bytes are now a block of 2,624 photos, each 64 rows by 64 columns. X[2] is the third photo (counting starts at 0).',
    svg: function (c) {
      var s = A.stage(), FX = 110, FY = 300, S = 170, DX = 26, DY = -17, n = 12;
      for (var k = n - 1; k >= 0; k--) {
        var x = FX + k * DX, y = FY + k * DY;
        if (k === 2) {   // X[2] is lifted out of the block: the target
          s += A.target('pick', '<rect x="' + (x - 5) + '" y="' + (y - 115) + '" width="' + (S + 10) + '" height="' + (S + 10) + '" rx="5" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap X[2]', x + S + 92, y - 112,
            { inner: px(3, x, y - 110, S, { r: 2 }) + A.tag(x + 8, y - 82, 'X[2]', C.am, { size: 16 }) });
          continue;
        }
        s += px(k + 1, x, y, S, { r: 2 }) + '<rect x="' + x + '" y="' + y + '" width="' + S + '" height="' + S + '" fill="none" stroke="#46e3ff" stroke-opacity=".4"/>';
        if (k === 0) s += A.tag(x + 8, y + 28, 'X[0]', C.cy, { size: 15 });
      }
      var bx = FX + (n - 1) * DX, by = FY + (n - 1) * DY;
      // axis 0 along the depth, axis 1 + 2 on the front photo
      s += A.arrow(FX + S + 12, FY + S + 6, bx + S + 12, by + S + 6, C.vi, { w: 2.4 }) + t(bx + S + 24, by + S + 4, 'photos (axis 0)', { size: 18, fill: C.vi, w: 700 });
      s += A.arrow(FX - 16, FY, FX - 16, FY + S, C.cy, { w: 2.2 }) + '<text x="' + (FX - 26) + '" y="' + (FY + S / 2) + '" font-family="' + A.FB + '" font-size="16" font-weight="600" fill="' + C.cy + '" text-anchor="middle" transform="rotate(-90 ' + (FX - 26) + ' ' + (FY + S / 2) + ')">rows (axis 1)</text>';
      s += A.arrow(FX, FY + S + 16, FX + S, FY + S + 16, C.cy, { w: 2.2 }) + t(FX + S / 2, FY + S + 40, 'columns (axis 2)', { size: 16, fill: C.cy, a: 'middle' });
      // right panel: the shape, colour-coded
      var RX = 610;
      s += '<g class="pgd-in" transform="translate(0 214)"><rect x="' + RX + '" y="96" width="310" height="190" rx="14" fill="#0a1019" stroke="#263346"/>' +
        t(RX + 22, 132, 'X.shape', { size: 20, f: 'm', fill: C.dim }) +
        t(RX + 22, 180, '(', { size: 34, f: 'm', w: 700 }) + t(RX + 46, 180, '2624', { size: 34, f: 'm', w: 700, fill: C.vi }) + t(RX + 134, 180, ',', { size: 34, f: 'm', w: 700 }) +
        t(RX + 158, 180, '64', { size: 34, f: 'm', w: 700, fill: C.cy }) + t(RX + 202, 180, ',', { size: 34, f: 'm', w: 700 }) + t(RX + 224, 180, '64', { size: 34, f: 'm', w: 700, fill: C.cy }) + t(RX + 268, 180, ')', { size: 34, f: 'm', w: 700 }) +
        t(RX + 22, 226, '● photos', { size: 18, fill: C.vi, w: 700 }) + t(RX + 22, 256, '● rows, columns', { size: 18, fill: C.cy, w: 700 }) +
        '</g>';
      return s;
    },
    work: function (c) {
      var L = D.liveRes('1a'), rows = [{ h: 'How many photos?' }, { v: fmt(c.counts.bytes), k: 'bytes in the file' }, { op: '÷', v: '4,096', k: 'bytes in one photo' }, { op: '=', v: fmt(c.counts.n), k: 'photos', res: true },
        { t: 'So the block is <b>(' + fmt(c.counts.n) + ', 64, 64)</b>: photos, rows, columns.' }];
      if (L) rows.push(liveTag(true), { v: '(' + L.shape.join(', ') + ')', k: 'your X.shape' }, { v: L.min + ' … ' + L.max, k: 'your darkest … brightest pixel' });
      return rows;
    },
    on: { pick: function (c) { c.next(); } } },

  { cap: 'Each photo keeps its label in the same order',
    note: 'Photo number i in X belongs to row i of the labels: cell_id, expert score and cell type line up by position.',
    svg: function (c) {
      var s = A.stage(), L = (function () { try { return JSON.parse(window.PG_EMBED['data/labels.json'].text).rows; } catch (e) { return []; } })();
      var cols = [['i', 70], ['photo X[i]', 190], ['cell_id[i]', 400], ['prob[i]', 560], ['kind[i]', 720]];
      cols.forEach(function (q) { s += t(q[1], 92, q[0], { size: 17, f: 'm', fill: C.dim, a: 'middle', w: 700 }); });
      s += '<line x1="40" y1="106" x2="920" y2="106" stroke="#263346"/>';
      for (var i = 0; i < 4; i++) {
        var y = 118 + i * 96, r = L[i] || ['…', '…', '…'], hl = i === 2;
        s += '<g class="' + (hl ? 'pgd-in' : '') + '">' + (hl ? '<rect x="40" y="' + (y - 4) + '" width="880" height="92" rx="10" fill="#1c1606" stroke="#ffb547" stroke-opacity=".7"/>' : '');
        s += t(70, y + 50, String(i), { size: 26, a: 'middle', f: 'm', w: 700, fill: hl ? C.am : C.ink });
        s += px(r[0], 150, y + 2, 80, { r: 2 });
        s += A.arrow(250, y + 42, 330, y + 42, hl ? C.am : '#33455c', { w: 2 });
        s += t(400, y + 50, String(r[0]), { size: 24, a: 'middle', f: 'm', w: 700 }) + t(560, y + 50, String(r[1]), { size: 24, a: 'middle', f: 'm', w: 700, fill: r[1] >= 0.5 ? C.rd : C.gr }) + t(720, y + 50, String(r[2]), { size: 24, a: 'middle', f: 'm', w: 700, fill: C.vi });
        s += '</g>';
      }
      s += t(480, 512, 'Same position i → same cell. Never sort one without the other.', { size: 19, a: 'middle', fill: C.dim });
      return s;
    },
    work: function (c) {
      var r = D.meta(3);
      return [{ h: 'Photo X[2]' }, { v: 'cell_id[2] = 3', k: 'which cell it is' }, { v: 'prob[2] = ' + (r ? r.prob : '…'), k: 'expert defect score' }, { v: 'kind[2] = ' + (r ? r.kind : '…'), k: 'cell type' },
        { t: fmt(c.counts.n) + ' photos and ' + fmt(c.counts.n) + ' label rows: one each.' }];
    } }
  ]
});
})();
