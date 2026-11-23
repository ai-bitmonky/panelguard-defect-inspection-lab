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
    note: 'Byte 1,297 sits in row 20, column 17 of photo 1. Folding the line every 64 bytes builds the photo row by row.',
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
      s += px(1, PX, PY, PS, { op: 0.24 });   // a faint ghost of the photo the rows will build
      for (var rr = 1; rr < 16; rr++) s += '<line x1="' + PX + '" y1="' + (PY + rr * PS / 16) + '" x2="' + (PX + PS) + '" y2="' + (PY + rr * PS / 16) + '" stroke="#46e3ff" stroke-opacity=".08"/>';
      s += t(PX + PS / 2, PY + PS + 30, '64 empty rows wait for the line of bytes', { size: 15, a: 'middle', fill: C.dim });
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
      var RX = 600;
      s += '<g class="pgd-in"><g transform="translate(0 234)"><rect x="' + RX + '" y="96" width="310" height="190" rx="14" fill="#0a1019" stroke="#263346"/>' +
        t(RX + 22, 132, 'X.shape', { size: 20, f: 'm', fill: C.dim }) +
        t(RX + 22, 180, '(', { size: 34, f: 'm', w: 700 }) + t(RX + 46, 180, '2624', { size: 34, f: 'm', w: 700, fill: C.vi }) + t(RX + 134, 180, ',', { size: 34, f: 'm', w: 700 }) +
        t(RX + 158, 180, '64', { size: 34, f: 'm', w: 700, fill: C.cy }) + t(RX + 202, 180, ',', { size: 34, f: 'm', w: 700 }) + t(RX + 224, 180, '64', { size: 34, f: 'm', w: 700, fill: C.cy }) + t(RX + 268, 180, ')', { size: 34, f: 'm', w: 700 }) +
        t(RX + 22, 226, '● photos', { size: 18, fill: C.vi, w: 700 }) + t(RX + 22, 256, '● rows, columns', { size: 18, fill: C.cy, w: 700 }) +
        '</g></g>';
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
        s += t(400, y + 50, String(r[0]), { size: 24, a: 'middle', f: 'm', w: 700 }) + t(560, y + 50, r[1] === 1 ? '1.0' : String(r[1]), { size: 24, a: 'middle', f: 'm', w: 700, fill: r[1] >= 0.5 ? C.rd : C.gr }) + t(720, y + 50, String(r[2]), { size: 24, a: 'middle', f: 'm', w: 700, fill: C.vi });
        s += '</g>';
      }
      s += t(480, 512, 'Same position i → same cell. Never sort one without the other.', { size: 19, a: 'middle', fill: C.dim });
      return s;
    },
    work: function (c) {
      var r = D.meta(3);
      return [{ h: 'Photo X[2]' }, { v: 'cell_id[2] = 3', k: 'which cell it is' }, { v: 'prob[2] = ' + (r ? r.score : '…'), k: 'expert defect score' }, { v: 'kind[2] = ' + (r ? r.kind : '…'), k: 'cell type' },
        { t: fmt(c.counts.n) + ' photos and ' + fmt(c.counts.n) + ' label rows: one each.' }];
    } }
  ]
});

/* ============================ 1b  Count the cells ============================ */
var SC = [0, 0.33, 0.67, 1], SCOL = ['#3dffa0', '#d6e05a', '#ff9a4d', '#ff4d6a'], PX0 = [70, 290, 510, 730];
function piles(c, o) {
  var s = A.stage({ floor: 450 }), n = c.counts;
  SC.forEach(function (p, i) {
    var cnt = n.bins[i], nb = Math.round(cnt / 10), x = PX0[i], mono = Math.round(n.mono[i] / 10);
    var col = o.split ? function (k) { return k < mono ? '#46e3ff' : '#a98bff'; } : SCOL[i];
    var bl = A.blocks(x, 448, nb, 10, 12, 3, col);
    if (o.lazy) bl = '<g opacity="' + (p >= 0.5 ? .9 : .9) + '">' + bl + '</g>';
    var shown = o.shown && o.shown[i];
    if (o.tap && !shown) s += A.target('p' + i, '<rect x="' + (x - 6) + '" y="' + (448 - Math.ceil(nb / 10) * 15 - 6) + '" width="162" height="' + (Math.ceil(nb / 10) * 15 + 10) + '" rx="8" fill="none" stroke="#ffb547" stroke-width="2.5"/>',
      'tap this pile', x + 75, 448 - Math.ceil(nb / 10) * 15 - 26, { inner: bl, cls: i === o.lead ? '' : 'pgd-nochip' });
    else s += bl;
    s += t(x + 75, 478, String(p === 1 ? '1.0' : p), { size: 22, a: 'middle', f: 'm', w: 700, fill: SCOL[i] });
    var top = 448 - Math.ceil(nb / 10) * 15;
    if (shown || o.all) s += '<g class="' + (o.justShown === i ? 'pgd-in' : '') + '">' + t(x + 75, top - 34, fmt(cnt), { size: 24, a: 'middle', f: 'm', w: 700 }) + (lazyKnown() ? t(x + 75, top - 12, D.pct(cnt, n.n), { size: 16, a: 'middle', fill: C.dim, f: 'm' }) : '') + '</g>';
    if (o.split) s += t(x + 75, 506, 'mono ' + n.mono[i] + ' · poly ' + n.poly[i], { size: 15, a: 'middle', fill: C.dim });
    if (o.lazy) s += '<g class="pgd-grow"><g transform="translate(' + (x + 75) + ' ' + (top - 76) + ') rotate(-8)"><rect x="-38" y="-18" width="76" height="34" rx="5" fill="none" stroke="' + C.gr + '" stroke-width="3"/>' + t(0, 7, 'OK', { size: 20, a: 'middle', f: 'h', fill: C.gr }) + '</g></g>' +
      t(x + 75, 530, p >= 0.5 ? 'shipped!' : 'right', { size: 17, a: 'middle', w: 700, fill: p >= 0.5 ? C.rd : C.gr });
  });
  s += t(40, 30, '1 block = 10 cells', { size: 15, fill: C.dim, f: 'm' }) + t(40, 56, 'piles by expert score', { size: 15, fill: C.dim });
  if (o.unsure) s += '<g class="pgd-in"><path d="M' + (PX0[1]) + ' 160 v-12 H' + (PX0[2] + 150) + ' v12" stroke="#d6e05a" stroke-width="2" fill="none"/>' + t((PX0[1] + PX0[2] + 150) / 2, 136, 'experts unsure: ' + fmt(n.unsure), { size: 18, a: 'middle', fill: '#d6e05a', w: 700 }) + '</g>';
  if (o.split) s += '<g class="pgd-in"><rect x="760" y="16" width="16" height="16" rx="3" fill="#46e3ff"/>' + t(784, 30, 'mono ' + fmt(n.nMono), { size: 17, w: 700, fill: C.cy }) + '<rect x="760" y="44" width="16" height="16" rx="3" fill="#a98bff"/>' + t(784, 58, 'poly ' + fmt(n.nPoly), { size: 17, w: 700, fill: C.vi }) + '</g>';
  return s;
}
function lazyKnown() { var r = D.liveRes('1b'), p = D.liveSub('1b').pred; return !!(r || (p && p.locked)); }
D.register('1b', {
  init: function () { return { shown: [0, 0, 0, 0] }; },
  frames: [
  { cap: 'Four piles: one per expert score',
    note: 'Every cell got one of four expert scores. Tap each pile to count it.',
    svg: function (c) { var sh = c.state.shown, lead = sh.indexOf(0); return piles(c, { tap: true, shown: sh, lead: lead, justShown: c.state.just }); },
    work: function (c) {
      var n = c.counts, rows = [{ h: 'Counted so far' }], tot = 0;
      SC.forEach(function (p, i) { if (c.state.shown[i]) { rows.push({ op: tot ? '+' : '', v: fmt(n.bins[i]), k: 'score ' + (p === 1 ? '1.0' : p), col: SCOL[i] }); tot += n.bins[i]; } });
      if (tot) rows.push({ op: '=', v: fmt(tot), k: 'cells counted', res: true });
      return rows.concat([{ t: 'All piles together: <b>' + fmt(n.n) + '</b> cells.' }]);
    },
    auto: function (c) { c.state.shown = [1, 1, 1, 1]; },
    bind: function (c, root) {
      [0, 1, 2, 3].forEach(function (i) { var el = root.querySelector('[data-pgd-t=p' + i + ']'); if (el) D.onTap(el, function () { c.state.shown[i] = 1; c.state.just = i; if (c.state.shown.indexOf(0) < 0) c.next(); else { c.redraw(); var nx = root.querySelector('.pgd-target'); if (nx) try { nx.focus({ preventScroll: true }); } catch (e) {} } }); });
    } },
  { cap: 'Most cells are OK. Some had the experts unsure.',
    note: 'A cell counts as a defect when the experts gave a high score. The two middle piles are cells the experts were not sure about.',
    svg: function (c) { return piles(c, { all: true, unsure: true }) + A.target('split', '<rect x="760" y="20" width="176" height="46" rx="23" fill="#0c1520" stroke="#ffb547" stroke-width="2.5"/>', 'split by type', 848, 96, { inner: t(848, 49, 'mono | poly', { size: 18, a: 'middle', w: 700, fill: C.ink }) }); },
    work: function (c) {
      var n = c.counts;
      return [{ h: 'Defect or OK' }, { v: fmt(n.def), k: 'defects (the two high piles)', col: C.rd }, { v: fmt(n.ok), k: 'OK (the two low piles)', col: C.gr }, { op: '=', v: fmt(n.n), k: 'all cells', res: true },
        { h: 'Experts unsure' }, { v: fmt(n.bins[1]) + ' + ' + fmt(n.bins[2]), k: 'the two middle piles' }, { op: '=', v: fmt(n.unsure), k: 'cells (' + D.pct(n.unsure, n.n, 0) + ')', res: true }];
    },
    on: { split: function (c) { c.next(); } } },
  { cap: 'Two cell types inside every pile',
    note: 'Mono cells glow evenly; poly cells look spotty. Both types are in every pile.',
    svg: function (c) {
      return piles(c, { all: true, split: true }) + A.target('stamp', '<g transform="translate(640 92) rotate(-8)"><rect x="-58" y="-26" width="116" height="52" rx="8" fill="#0b2418" stroke="#ffb547" stroke-width="3"/></g>', 'a lazy model', 640, 150,
        { inner: '<g transform="translate(640 92) rotate(-8)"><path d="M-14 -40h28v14h-28z" fill="#3a4757"/>' + t(0, 9, 'OK', { size: 26, a: 'middle', f: 'h', fill: C.gr }) + '</g>' });
    },
    work: function (c) { var n = c.counts; return [{ h: 'Cell types' }, { v: fmt(n.nMono), k: 'mono', col: C.cy }, { op: '+', v: fmt(n.nPoly), k: 'poly', col: C.vi }, { op: '=', v: fmt(n.n), k: 'all cells', res: true }, { t: 'Defects: ' + fmt(n.defMono || (n.mono[2] + n.mono[3])) + ' mono, ' + fmt(n.poly[2] + n.poly[3]) + ' poly.' }]; },
    on: { stamp: function (c) { c.next(); } } },
  { cap: 'A lazy model says OK to every cell',
    note: 'It is right on every OK cell and catches no defect at all. A high accuracy can hide that.',
    svg: function (c) { return piles(c, { all: true, lazy: true }); },
    work: function (c) {
      var n = c.counts, rows = [{ h: 'Defects caught (recall)' }, { v: '0', k: 'defects it stopped' }, { op: '÷', v: fmt(n.def), k: 'all defects' }, { op: '=', v: '0%', k: 'recall', res: true },
        { h: 'Accuracy' }, { v: fmt(n.bins[0]) + ' + ' + fmt(n.bins[1]), k: 'cells it gets right (the OK piles)' }, { op: '÷', v: fmt(n.n), k: 'all cells' }];
      if (lazyKnown()) rows.push({ op: '=', v: D.pct(n.ok, n.n), k: 'accuracy', res: true });
      else rows.push({ op: '=', v: '?', k: 'answer the prediction in the lab first', res: true });
      return rows.concat([{ t: 'Judge an inspector by <b>defects caught</b>, not by accuracy.' }]);
    } }
  ]
});

/* ============================ 1c  Make the label ============================ */
var LX = function (p) { return 110 + p * 740; }, GAPS = [(LX(0) + LX(0.33)) / 2, (LX(0.33) + LX(0.67)) / 2, (LX(0.67) + LX(1)) / 2];
var GAPN = ['between the 1st and 2nd pile', 'between the 2nd and 3rd pile', 'between the 3rd and 4th pile'];
function defAt(c, g) { var b = c.counts.bins, k = 0; for (var i = g + 1; i < 4; i++) k += b[i]; return k; }
function cutScene(c, cutX, live) {
  var s = A.stage({ floor: 430 }), b = c.counts.bins, H = 270;
  s += '<line x1="70" y1="430" x2="890" y2="430" stroke="#5d6b80" stroke-width="2"/>';
  SC.forEach(function (p, i) {
    var x = LX(p), h = Math.max(6, H * b[i] / 1508), def = x > cutX;
    s += '<rect class="pgd-bar" data-i="' + i + '" x="' + (x - 42) + '" y="' + (430 - h) + '" width="84" height="' + h + '" rx="5" fill="' + (def ? C.rd : C.gr) + '" opacity=".85"/>';
    s += t(x, 420 - h, fmt(b[i]), { size: 20, a: 'middle', f: 'm', w: 700 });
    s += t(x, 462, p === 1 ? '1.0' : String(p), { size: 20, a: 'middle', f: 'm', fill: C.dim });
    s += '<text class="pgd-y" data-i="' + i + '" x="' + x + '" y="492" font-family="' + A.FM + '" font-size="17" font-weight="700" text-anchor="middle" fill="' + (def ? C.rd : C.gr) + '">y = ' + (def ? 1 : 0) + '</text>';
  });
  s += t(70, 522, 'expert score', { size: 15, fill: C.dim });
  return s;
}
D.register('1c', {
  init: function () { return { cutX: 900, gap: -1, seen: [0, 0, 0] }; },
  frames: [
  { cap: 'Drag the cut line: left is OK, right is defect',
    note: 'Wherever the cut stands, piles on its right get y = 1 (defect) and piles on its left get y = 0 (OK). Try each gap.',
    svg: function (c) {
      var x = c.state.cutX, nx = c.state.seen.indexOf(0);
      var s = cutScene(c, x);
      s += '<g id="pgd-cut">' + A.target('cut', '<line x1="' + x + '" y1="70" x2="' + x + '" y2="440" stroke="#ffb547" stroke-width="4"/><circle cx="' + x + '" cy="70" r="14" fill="#ffb547"/>', 'drag the cut', x, 40, { kind: 'drag', la: 'end', to: (nx >= 0 ? GAPS[nx] : GAPS[1]) + ',250' }) + '</g>';
      s += '<text id="pgd-cutn" x="40" y="40" font-family="' + A.FB + '" font-size="20" font-weight="700" fill="' + C.ink + '">defects: ' + fmt(c.state.gap < 0 ? 0 : defAt(c, c.state.gap)) + '</text>';
      return s;
    },
    work: function (c) {
      var rows = [{ h: 'Gaps you tried' }];
      [0, 1, 2].forEach(function (g) { if (c.state.seen[g]) rows.push({ v: fmt(defAt(c, g)), k: 'defects with the cut ' + GAPN[g], col: g === c.state.gap ? C.am : C.cy }); });
      if (!c.state.seen.some(Boolean)) rows.push({ t: 'Drop the cut in a gap between two piles.' });
      rows.push({ t: 'Try all three gaps: ' + c.state.seen.filter(Boolean).length + ' of 3.' });
      return rows;
    },
    auto: function (c) { c.state.seen = [1, 1, 1]; c.state.gap = 2; c.state.cutX = GAPS[2]; },
    bind: function (c, root) {
      var el = root.querySelector('[data-pgd-t=cut]'), x0 = c.state.cutX, lab = root.querySelector('#pgd-cutn');
      function paint(x) {
        root.querySelectorAll('.pgd-bar').forEach(function (r) { var i = +r.getAttribute('data-i'), def = LX(SC[i]) > x; r.setAttribute('fill', def ? C.rd : C.gr); });
        root.querySelectorAll('.pgd-y').forEach(function (r) { var i = +r.getAttribute('data-i'), def = LX(SC[i]) > x; r.setAttribute('fill', def ? C.rd : C.gr); r.textContent = 'y = ' + (def ? 1 : 0); });
        var k = 0; SC.forEach(function (p, i) { if (LX(p) > x) k += c.counts.bins[i]; }); lab.textContent = 'defects: ' + fmt(k);
      }
      var d = D.onDrag(root, el, { start: { x: x0, y: 250 }, step: 30,
        clamp: function (p) { return { x: Math.max(60, Math.min(900, p.x)), y: 250 }; },
        move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - x0) + ' 0)'); paint(p.x); },
        drop: function (p) {
          var best = 0; GAPS.forEach(function (g, i) { if (Math.abs(g - p.x) < Math.abs(GAPS[best] - p.x)) best = i; });
          if (Math.abs(GAPS[best] - p.x) > 90) return;
          d.set({ x: GAPS[best], y: 250 }); c.state.gap = best; c.state.seen[best] = 1; c.state.cutX = GAPS[best];
          if (c.state.seen.indexOf(0) < 0) c.next(); else { c.redraw(); var t2 = root.querySelector('[data-pgd-t=cut]'); if (t2) try { t2.focus({ preventScroll: true }); } catch (e) {} }
        } });
    } },
  { cap: 'Your cut turns every score into 0 or 1',
    note: 'The first 12 cells of the data set with their expert scores. Your cut decides each label y.',
    svg: function (c) {
      var s = A.stage(), L = labelsRows();
      for (var i = 0; i < 12; i++) { var x = 40 + i * 74, r = L[i]; s += A.cell(r[0], x, 120, 64, { full: true }) + t(x + 32, 214, r[1] === 1 ? '1.0' : String(r[1]), { size: 18, a: 'middle', f: 'm', fill: SCOL[SC.indexOf(r[1])] }); }
      s += t(40, 100, 'cells 1 … 12', { size: 16, fill: C.dim, f: 'm' }) + t(40, 214, '', {});
      s += A.target('make', '<rect x="380" y="300" width="200" height="60" rx="30" fill="#0c1520" stroke="#ffb547" stroke-width="3"/>', 'tap to make y', 480, 400, { inner: t(480, 338, 'score → y', { size: 22, a: 'middle', f: 'm', w: 700 }) });
      return s;
    },
    work: function (c) { return [{ h: 'Your cut' }, { v: GAPN[c.state.gap] || '–', k: 'where it stands' }, { v: fmt(defAt(c, c.state.gap)), k: 'cells that will get y = 1' }]; },
    on: { make: function (c) { c.next(); } } },
  { cap: 'The label y: 1 = defect, 0 = OK',
    note: 'A label is a choice. Write the rule down, because every later number depends on it.',
    svg: function (c) {
      var s = A.stage(), L = labelsRows(), g = c.state.gap, cut = GAPS[g];
      for (var i = 0; i < 12; i++) {
        var x = 40 + i * 74, r = L[i], y1 = LX(r[1]) > cut;
        s += A.cell(r[0], x, 120, 64, { full: true }) + t(x + 32, 214, r[1] === 1 ? '1.0' : String(r[1]), { size: 18, a: 'middle', f: 'm', fill: SCOL[SC.indexOf(r[1])] });
        s += '<g class="pgd-in"><path d="M' + (x + 32) + ' 226v26" stroke="#5d6b80" stroke-width="2"/><rect x="' + (x + 6) + '" y="258" width="52" height="46" rx="8" fill="' + (y1 ? '#2a0e15' : '#0b2418') + '" stroke="' + (y1 ? C.rd : C.gr) + '"/>' + t(x + 32, 289, String(y1 ? 1 : 0), { size: 24, a: 'middle', f: 'm', w: 700, fill: y1 ? C.rd : C.gr }) + '</g>';
      }
      s += t(40, 340, 'y', { size: 18, f: 'm', fill: C.dim });
      var k = defAt(c, g), rule = c.counts.def;
      s += '<g class="pgd-in2"><rect x="40" y="390" width="880" height="100" rx="14" fill="#0a1019" stroke="' + (k === rule ? C.gr : C.am) + '"/>' +
        t(70, 432, 'Your cut: ' + fmt(k) + ' defects', { size: 24, w: 700 }) +
        t(70, 466, k === rule ? 'Same as the lab\'s rule: the two high piles are defects.' : 'The lab\'s rule (the two high piles are defects) gives ' + fmt(rule) + '. Move your cut in the lab.', { size: 18, fill: k === rule ? C.gr : C.am }) + '</g>';
      return s;
    },
    work: function (c) {
      var b = c.counts.bins, g = c.state.gap, rows = [{ h: 'Count the 1s' }], first = true;
      for (var i = g + 1; i < 4; i++) { rows.push({ op: first ? '' : '+', v: fmt(b[i]), k: 'pile ' + (SC[i] === 1 ? '1.0' : SC[i]) }); first = false; }
      rows.push({ op: '=', v: fmt(defAt(c, g)), k: 'cells with y = 1', res: true });
      var L = D.liveRes('1c'); if (L) rows.push({ tag: 'your value' }, { v: fmt(L.n_def), k: 'defects in your y (lab)' });
      return rows;
    } }
  ]
});
function labelsRows() { try { return JSON.parse(window.PG_EMBED['data/labels.json'].text).rows; } catch (e) { return []; } }

/* ============================ 1d  Split the data ============================ */
var TR = [['TRAIN', 262, 320, C.cy, 'learn'], ['VALIDATION', 612, 146, C.vi, 'choose settings'], ['TEST', 792, 146, C.am, 'final check, once']];
function trays(c, o) {
  var s = A.stage({ floor: 470 }), F0 = (window.PGD_FACTS || {}), sp = o.strat ? F0.split : F0.splitRandom, n = c.counts;
  // the deck
  if (!o.dealt) {
    for (var k = 6; k >= 0; k--) s += '<rect x="' + (40 + k * 3) + '" y="' + (190 - k * 5) + '" width="170" height="230" rx="10" fill="#111824" stroke="#33455c"/>';
    s += A.cell(447, 62, 210, 70, { full: true }) + A.cell(23, 130, 210, 70, { full: true }) + A.cell(245, 62, 290, 70, { full: true }) + A.cell(74, 130, 290, 70, { full: true });
    s += t(125, 400, fmt(n.n) + ' cells', { size: 20, a: 'middle', w: 700 }) + t(155, 456, fmt(n.def) + ' defects · ' + D.pct(n.def, n.n), { size: 17, a: 'middle', fill: C.rd });
  }
  TR.forEach(function (q, i) {
    var x = q[1], w = q[2], y = 300;
    s += '<path d="M' + (x - 10) + ' ' + (y + 120) + 'h' + (w + 20) + 'l-14 40H' + (x + 4) + 'Z" fill="#111a27" stroke="' + q[3] + '"/>';
    s += t(x + w / 2, y + 190, q[0], { size: 15, a: 'middle', f: 'h', fill: q[3] }) + t(x + w / 2, y + 214, q[4], { size: 15, a: 'middle', fill: C.dim });
    if (o.dealt && sp) {
      var nb = Math.round(sp.sizes[i] / 25), red = Math.round(sp.defects[i] / 25), cols = i === 0 ? 18 : 8;
      s += '<g class="' + (o.anim ? 'pgd-in' : '') + '">' + A.blocks(x + 4, y + 118, nb, cols, 14, 3, function (j) { return j < red ? C.rd : '#2a4a6a'; }) + '</g>';
      var sh = sp.defects[i] / sp.sizes[i], top = y + 118 - Math.ceil(nb / cols) * 17;
      s += t(x + w / 2, top - 62, fmt(sp.sizes[i]) + ' cells', { size: 18, a: 'middle', w: 700 }) + t(x + w / 2, top - 38, fmt(sp.defects[i]) + ' defects', { size: 16, a: 'middle', f: 'm', fill: '#ff8a9c' }) + t(x + w / 2, top - 14, D.pct(sp.defects[i], sp.sizes[i]), { size: 18, a: 'middle', f: 'm', w: 700, fill: q[3] });
    }
  });
  if (o.dealt && sp) {   // the share meter: every tray against the whole set
    var M = function (v) { return 330 + (v - 0.26) / 0.12 * 560; }, all = n.def / n.n;
    s += '<line x1="330" y1="70" x2="890" y2="70" stroke="#263346" stroke-width="2"/>';
    [0.28, 0.31, 0.34, 0.37].forEach(function (v) { s += '<line x1="' + M(v) + '" y1="64" x2="' + M(v) + '" y2="76" stroke="#5d6b80"/>' + t(M(v), 96, Math.round(v * 100) + '%', { size: 14, a: 'middle', f: 'm', fill: C.dim }); });
    s += '<line x1="' + M(all) + '" y1="50" x2="' + M(all) + '" y2="80" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/>' + t(M(all), 44, 'whole set ' + D.pct(n.def, n.n), { size: 14, a: 'middle', fill: '#fff' });
    TR.forEach(function (q, i) { s += '<circle cx="' + M(sp.defects[i] / sp.sizes[i]) + '" cy="70" r="8" fill="' + q[3] + '" stroke="#05070b" stroke-width="2"/>'; });
    s += t(330, 124, 'defect share in each tray', { size: 15, fill: C.dim });
  }
  return s;
}
function toggle(on, x, y) {
  return '<rect x="' + x + '" y="' + y + '" width="96" height="44" rx="22" fill="' + (on ? '#0b2418' : '#1b2533') + '" stroke="' + (on ? C.gr : '#5d6b80') + '" stroke-width="2"/>' +
    t(x + 110, y + 22, 'keep the defect share', { size: 17, w: 700 }) + t(x + 110, y + 42, 'the same in each tray', { size: 17, w: 700 });
}
D.register('1d', {
  frames: [
  { cap: 'Deal 2,624 cells into three trays',
    note: 'Train 60% to learn, validation 20% to choose settings, test 20% kept sealed for the end.',
    svg: function (c) { return trays(c, {}) + A.target('deal', '<rect x="32" y="154" width="196" height="276" rx="12" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap to deal', 130, 130, {}); },
    work: function (c) { var n = c.counts.n; return [{ h: 'Tray sizes' }, { v: fmt(n), k: 'cells' }, { op: '×', v: '60%', k: 'for train' }, { op: '=', v: fmt(n * 0.6, 1), k: 'so ' + fmt(Math.ceil(n * 0.6 - 0.5)) + ' train cells', res: true }, { v: fmt(n - 1574) + ' ÷ 2', k: 'the rest, halved' }, { op: '=', v: '525 · 525', k: 'validation · test', res: true }]; },
    on: { deal: function (c) { c.next(); } } },
  { cap: 'A plain shuffle: the trays get different defect shares',
    note: 'One random split (seed 42) without keeping the share. The test tray gets more defects than the others by luck.',
    svg: function (c) {
      return trays(c, { dealt: true, anim: c.enter }) + toggle(false, 40, 150) +
        A.target('sw', '<circle cx="62" cy="172" r="18" fill="#c6d2e2"/>', 'slide to turn on', 40, 230, { kind: 'drag', la: 'start', to: '114,172' });
    },
    work: function (c) { var sp = (window.PGD_FACTS || {}).splitRandom; return [{ h: 'Defect share, plain shuffle' }].concat(sp ? sp.sizes.map(function (z, i) { return { v: sp.defects[i] + ' ÷ ' + fmt(z) + ' = ' + D.pct(sp.defects[i], z), k: TR[i][0].toLowerCase() + ' tray', col: TR[i][3] }; }) : []).concat([{ v: D.pct(c.counts.def, c.counts.n), k: 'whole set' }, { t: 'A test tray with extra defects makes the final score unfair.' }]); },
    auto: function () {},
    bind: function (c, root) {
      var el = root.querySelector('[data-pgd-t=sw]');
      D.onDrag(root, el, { start: { x: 62, y: 172 }, step: 26, live: true,
        clamp: function (p) { return { x: Math.max(62, Math.min(114, p.x)), y: 172 }; },
        move: function (p) { el.setAttribute('transform', 'translate(' + (p.x - 62) + ' 0)'); },
        drop: function (p) { if (p.x >= 108) c.next(); } });
    } },
  { cap: 'Keep the share: every tray looks like the whole set',
    note: 'Now each tray has the same defect share as the whole set. Seal the test tray: it stays shut until Step 8.',
    svg: function (c) {
      var s = trays(c, { dealt: true, strat: true, anim: c.enter }) + toggle(true, 40, 150) + '<circle cx="118" cy="172" r="18" fill="' + C.gr + '"/>';
      s += A.target('seal', '<rect x="776" y="196" width="178" height="282" rx="12" fill="none" stroke="#ffb547" stroke-width="3"/><circle id="pgd-sealp" cx="865" cy="160" r="20" fill="none" stroke="#ffb547" stroke-width="5" stroke-dasharray="0 126" transform="rotate(-90 865 160)"/>',
        'hold to seal', 940, 120, { kind: 'hold', la: 'end', inner: '<circle cx="865" cy="160" r="20" fill="none" stroke="#33455c" stroke-width="5"/>' });
      return s;
    },
    work: function (c) {
      var sp = (window.PGD_FACTS || {}).split, L = D.liveRes('1d'), rows = [{ h: 'Defect share, kept the same' }];
      (L || sp).sizes.forEach(function (z, i) { var d = (L || sp).defects[i]; rows.push({ v: d + ' ÷ ' + fmt(z) + ' = ' + D.pct(d, z), k: TR[i][0].toLowerCase() + ' tray', col: TR[i][3] }); });
      rows.push(L ? { tag: 'your value' } : { tag: 'typical value' });
      return rows;
    },
    bind: function (c, root) {
      var el = root.querySelector('[data-pgd-t=seal]'), p = root.querySelector('#pgd-sealp');
      D.onHold(el, { ms: 1100, progress: function (f) { p.setAttribute('stroke-dasharray', (126 * f) + ' 126'); }, done: function () { c.next(); } });
    } },
  { cap: 'Train to learn, validation to choose, test once',
    note: 'The test tray stays sealed. Tuning on it would make the final score a lie.',
    svg: function (c) {
      var s = trays(c, { dealt: true, strat: true }) + toggle(true, 40, 150) + '<circle cx="118" cy="172" r="18" fill="' + C.gr + '"/>';
      s += '<g class="pgd-grow"><g transform="translate(865 330) rotate(-10)"><rect x="-86" y="-24" width="172" height="48" rx="6" fill="#5a1220" stroke="' + C.rd + '" stroke-width="2"/>' + t(0, -2, 'SEALED', { size: 18, a: 'middle', f: 'h', fill: '#ffd1d9' }) + t(0, 17, 'open in Step 8', { size: 14, a: 'middle', fill: '#ffd1d9' }) + '</g></g>';
      return s;
    },
    work: function () { return [{ h: 'What each tray is for' }, { v: 'train', k: 'the model learns from it', col: C.cy }, { v: 'validation', k: 'you compare and choose settings', col: C.vi }, { v: 'test', k: 'opened once, at the very end', col: C.am }, { t: 'The same seed gives the same split every run, so numbers can be checked.' }]; } }
  ]
});

/* ============================ 1e  Scale and flatten ============================ */
var PR = 24, PC = 28;
function patch() {   // the 8 x 8 patch of cell 6 (rows 24-31, columns 28-35): the student's scaled values when 1e passed
  var L = D.liveRes('1e'), p = D.pixels(6), F0 = (window.PGD_FACTS || {}).patch, v = [], live = false;
  for (var r = 0; r < 8; r++) { v.push([]); for (var k = 0; k < 8; k++) v[r].push(p ? p[(PR + r) * 64 + PC + k] : F0.vals[r][k]); }
  var sc = v.map(function (row) { return row.map(function (x) { return x / 255; }); });
  if (L && L.grid && L.cell === 6) { live = true; sc = v.map(function (row, r) { return row.map(function (x, k) { return L.grid[(PR + r) * 64 + PC + k]; }); }); }
  return { raw: v, sc: sc, live: live };
}
function grid8(c, mode, rowsGone, tgtRow) {
  var P = patch(), s = '', S = 50, X0 = 60, Y0 = 56;
  for (var r = 0; r < 8; r++) {
    if (r < rowsGone) { s += '<rect x="' + X0 + '" y="' + (Y0 + r * S) + '" width="' + 8 * S + '" height="' + S + '" fill="none" stroke="#1b2533" stroke-dasharray="4 5"/>'; continue; }
    var row = '';
    for (var k = 0; k < 8; k++) {
      var v = P.raw[r][k], x = X0 + k * S, y = Y0 + r * S;
      row += '<rect x="' + x + '" y="' + y + '" width="' + S + '" height="' + S + '" fill="' + gray(v) + '" stroke="#05070b"/>' +
        t(x + S / 2, y + S / 2 + 6, mode === 'raw' ? String(v) : P.sc[r][k].toFixed(2), { size: mode === 'raw' ? 18 : 16, a: 'middle', f: 'm', w: 700, fill: ink(v) });
    }
    if (r === tgtRow) s += A.target('row', '<rect x="' + (X0 - 4) + '" y="' + (Y0 + r * S - 3) + '" width="' + (8 * S + 8) + '" height="' + (S + 6) + '" rx="5" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap row ' + r, X0 + 8 * S + 16, Y0 + r * S + S / 2 + 4, { la: 'start', inner: row });
    else s += row;
  }
  s += t(X0, Y0 - 14, 'rows 24–31, columns 28–35 of cell 6', { size: 15, f: 'm', fill: C.dim });
  return s;
}
function flatLine(c, n, P) {   // the first n rows laid end to end
  var s = '', S = 13.5, X0 = 48, Y = 494;
  s += '<rect x="' + (X0 - 4) + '" y="' + (Y - 4) + '" width="' + (64 * S + 8) + '" height="' + (S + 8) + '" rx="4" fill="none" stroke="#263346"/>';
  for (var r = 0; r < n; r++) for (var k = 0; k < 8; k++) { var v = P.raw[r][k]; s += '<rect x="' + (X0 + (r * 8 + k) * S) + '" y="' + Y + '" width="' + (S - 1) + '" height="' + S + '" fill="' + gray(v) + '"' + (r === n - 1 && c.enter ? ' class="pgd-grow"' : '') + '/>'; }
  for (var q = 0; q < n; q++) s += t(X0 + q * 8 * S + 4 * S, Y + 36, 'row ' + q, { size: 12, a: 'middle', f: 'm', fill: C.dim2 });
  s += t(X0, Y - 14, 'one long line: ' + n * 8 + ' of 64 numbers', { size: 15, f: 'm', fill: C.cy });
  return s;
}
D.register('1e', {
  init: function () { return { gone: 0 }; },
  frames: [
  { cap: 'Zoom into a small patch of a real photo',
    note: 'Cell 6 has a crack and a dark spot. The patch holds 8 by 8 of its 4,096 pixels.',
    svg: function (c) {
      var s = A.stage(), X = 60, Y = 60, Z = 6;
      s += px(6, X, Y, 64 * Z) + '<rect x="' + X + '" y="' + Y + '" width="' + 64 * Z + '" height="' + 64 * Z + '" fill="none" stroke="#263346"/>';
      s += A.target('patch', '<rect x="' + (X + PC * Z - 3) + '" y="' + (Y + PR * Z - 3) + '" width="' + (8 * Z + 6) + '" height="' + (8 * Z + 6) + '" fill="none" stroke="#ffb547" stroke-width="3"/>', 'tap the patch', X + PC * Z + 24, Y + PR * Z - 22, {});
      s += A.tag(X + PC * Z + 60, Y + PR * Z + 40, '(row 24, col 28)', C.am, { size: 14 });
      s += t(520, 120, 'cell 6', { size: 24, w: 700 }) + t(520, 152, '64 × 64 pixels', { size: 19, fill: C.dim });
      var gid = A.uid('g6'), p6 = D.pixels(6), mn = 255, mx = 0; if (p6) for (var k = 0; k < 4096; k++) { mn = Math.min(mn, p6[k]); mx = Math.max(mx, p6[k]); }
      s += '<defs><linearGradient id="' + gid + '"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect x="520" y="230" width="380" height="26" rx="4" fill="url(#' + gid + ')"/>' +
        t(520, 280, '0', { size: 15, f: 'm', fill: C.dim }) + t(900, 280, '255', { size: 15, f: 'm', fill: C.dim, a: 'end' }) + t(520, 216, 'how bright a pixel can be', { size: 17, fill: C.dim });
      if (p6) [[mn, 'darkest'], [mx, 'brightest']].forEach(function (q, j) { var xx = 520 + 380 * q[0] / 255; s += '<path d="M' + xx + ' 224v38" stroke="#ffb547" stroke-width="3"/>' + A.tag(xx, 312 + j * 34, q[1] + ' ' + q[0], C.am, { a: 'middle', size: 14 }); });
      return s;
    },
    work: function (c) { var m = D.pixels(6), mn = 255, mx = 0; if (m) for (var k = 0; k < 4096; k++) { mn = Math.min(mn, m[k]); mx = Math.max(mx, m[k]); } return [{ h: 'Cell 6' }, { v: m ? mn + ' … ' + mx : '…', k: 'darkest … brightest pixel' }, { v: '0 … 255', k: 'what any pixel can be' }]; },
    on: { patch: function (c) { c.next(); } } },
  { cap: 'The patch is just numbers from 0 to 255',
    note: 'Dark spot = small numbers, bright glass = big numbers. Next: put every number on a 0 to 1 scale.',
    svg: function (c) {
      var s = A.stage() + grid8(c, 'raw', 0, -1);
      s += A.target('div', '<rect x="600" y="200" width="200" height="80" rx="40" fill="#0c1520" stroke="#ffb547" stroke-width="3"/>', 'tap to scale', 700, 320, { inner: t(700, 252, '÷ 255', { size: 34, a: 'middle', f: 'm', w: 700, fill: C.am }) });
      return s;
    },
    work: function () { var P = patch(), mn = Math.min.apply(null, [].concat.apply([], P.raw)), mx = Math.max.apply(null, [].concat.apply([], P.raw)); return [{ h: 'In this patch' }, { v: String(mn), k: 'darkest (the dark spot)' }, { v: String(mx), k: 'brightest' }, { h: 'The goal' }, { t: 'Brightest possible pixel 255 should become <b>1.0</b>, black 0 stays <b>0</b>.' }]; },
    on: { div: function (c) { c.next(); } } },
  { cap: 'Every number now sits between 0 and 1',
    note: 'Same picture, new scale. Now unroll the grid: tap the rows one by one to lay them end to end.',
    svg: function (c) { var P = patch(); return A.stage() + grid8(c, 'sc', c.state.gone, c.state.gone) + flatLine(c, c.state.gone, P); },
    work: function (c) {
      var P = patch(), mn = Math.min.apply(null, [].concat.apply([], P.raw)), rows = [{ h: 'Scale' }, { v: '255 ÷ 255', k: 'the brightest possible pixel' }, { op: '=', v: '1.00', k: '', res: true }, { v: mn + ' ÷ 255', k: 'the dark spot' }, { op: '=', v: P.sc[5][5] != null ? (mn / 255).toFixed(2) : '', k: '', res: true }];
      rows.push(P.live ? { tag: 'your value' } : { tag: 'typical value' });
      rows.push({ h: 'Unroll' }, { v: c.state.gone + ' × 8 = ' + c.state.gone * 8, k: 'numbers in the line so far' });
      return rows;
    },
    auto: function (c) { c.state.gone = 8; },
    bind: function (c, root) {
      var el = root.querySelector('[data-pgd-t=row]'); if (!el) return;
      D.onTap(el, function () { c.state.gone++; if (c.state.gone >= 8) c.next(); else { c.redraw(); var nx = root.querySelector('[data-pgd-t=row]'); if (nx) try { nx.focus({ preventScroll: true }); } catch (e) {} } });
    } },
  { cap: 'One photo becomes one long row of numbers',
    note: 'The patch made a line of 64. A whole photo makes a line of 4,096. Stack one line per photo: that is Xflat.',
    svg: function (c) {
      var P = patch(), s = A.stage() + flatLine(c, 8, P);
      // Xflat: one row per photo
      s += '<g class="pgd-in"><rect x="300" y="70" width="560" height="300" rx="6" fill="#0a1019" stroke="#263346"/>';
      for (var r = 0; r < 14; r++) s += '<rect x="304" y="' + (76 + r * 20.5) + '" width="552" height="16" rx="2" fill="' + (r === 5 ? '#46e3ff' : '#16263a') + '" opacity="' + (r === 5 ? .85 : 1) + '"/>';
      s += t(296, 86, 'photo 0', { size: 13, a: 'end', f: 'm', fill: C.dim }) + t(296, 194, 'cell 6', { size: 14, a: 'end', f: 'm', fill: C.cy, w: 700 }) + t(296, 364, 'photo 2,623', { size: 13, a: 'end', f: 'm', fill: C.dim });
      s += A.arrow(304, 394, 856, 394, C.cy, { w: 2 }) + t(580, 420, '4,096 numbers per row', { size: 17, a: 'middle', fill: C.cy, w: 700 });
      s += A.arrow(880, 70, 880, 370, C.vi, { w: 2 }) + '<text x="906" y="220" font-family="' + A.FB + '" font-size="17" font-weight="700" fill="' + C.vi + '" text-anchor="middle" transform="rotate(90 906 220)">2,624 rows</text>';
      s += t(60, 110, 'Xflat', { size: 30, f: 'm', w: 700 }) + t(60, 140, 'one row per photo', { size: 17, fill: C.dim }) + '</g>';
      return s;
    },
    work: function (c) {
      var L = D.liveRes('1e'), rows = [{ h: 'Line length' }, { v: '8 × 8', k: 'this patch' }, { op: '=', v: '64', k: 'numbers', res: true }, { v: '64 × 64', k: 'a whole photo' }, { op: '=', v: '4,096', k: 'numbers per row of Xflat', res: true }, { v: '(' + fmt(c.counts.n) + ', 4,096)', k: 'Xflat: photos × numbers' }];
      if (L) rows.push({ tag: 'your value' }, { v: '(' + L.flat.join(', ') + ')', k: 'your Xflat.shape' }, { v: L.min.toFixed(2) + ' … ' + L.max.toFixed(2), k: 'your smallest … largest' });
      return rows;
    } }
  ]
});
})();
