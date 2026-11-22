/* PanelGuard scene art: the final EL inspection station of a solar module line. Pure SVG. */
(function () {
'use strict';
var BELT_IDS = [447, 6, 74, 23, 905, 245, 96, 49];
var uid = 0;

function blueCell(x, y, s) {   // an unpowered mono cell: dark blue with silver busbars and cut corners
  var c = s * 0.14;
  return '<path d="M' + (x + c) + ' ' + y + 'h' + (s - 2 * c) + 'l' + c + ' ' + c + 'v' + (s - 2 * c) + 'l' + (-c) + ' ' + c + 'h' + (-(s - 2 * c)) + 'l' + (-c) + ' ' + (-c) + 'v' + (-(s - 2 * c)) + 'z" fill="#0d1f4a" stroke="#2a4a8a" stroke-width="1"/>' +
    '<g stroke="#9fb4d6" stroke-width="1.6" opacity=".8"><line x1="' + x + '" y1="' + (y + s * .3) + '" x2="' + (x + s) + '" y2="' + (y + s * .3) + '"/><line x1="' + x + '" y1="' + (y + s * .7) + '" x2="' + (x + s) + '" y2="' + (y + s * .7) + '"/></g>' +
    '<g stroke="#4a6aa8" stroke-width=".4" opacity=".6">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (k) { return '<line x1="' + (x + k * s / 10) + '" y1="' + y + '" x2="' + (x + k * s / 10) + '" y2="' + (y + s) + '"/>'; }).join('') + '</g>';
}

/* opts: {hot:true (hotspots for 0a), monitor:'text', visited:{}, score:null} */
function station(opts) {
  opts = opts || {};
  var id = 'st' + (++uid), W = 800, H = 300;
  var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (opts.vb || '0 0 800 300') + '" role="img" aria-label="EL inspection station: conveyor, dark camera hood, monitor and pass/stop sorter">';
  s += '<defs>' +
    '<linearGradient id="' + id + 'bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060a12"/><stop offset=".62" stop-color="#0a1220"/><stop offset="1" stop-color="#04060a"/></linearGradient>' +
    '<linearGradient id="' + id + 'belt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3340"/><stop offset="1" stop-color="#151b24"/></linearGradient>' +
    '<linearGradient id="' + id + 'hood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#10151d"/><stop offset=".5" stop-color="#1b232f"/><stop offset="1" stop-color="#10151d"/></linearGradient>' +
    '<radialGradient id="' + id + 'glow"><stop offset="0" stop-color="#bff3ff" stop-opacity=".55"/><stop offset="1" stop-color="#46e3ff" stop-opacity="0"/></radialGradient>' +
    '<filter id="' + id + 'b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>' +
    '<filter id="' + id + 'b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>' +
    '<clipPath id="' + id + 'in"><rect x="338" y="120" width="124" height="110"/></clipPath>' +
    '<clipPath id="' + id + 'out"><path d="M0 0H338V300H0ZM462 0H800V300H462Z"/></clipPath>' +
    '<pattern id="' + id + 'grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#12304a" stroke-width=".6"/></pattern>' +
    '</defs>';
  // room
  s += '<rect width="800" height="300" fill="url(#' + id + 'bg)"/>';
  s += '<rect y="232" width="800" height="68" fill="url(#' + id + 'grid)" opacity=".7"/>';
  s += '<g opacity=".5">' + [80, 240, 560, 720].map(function (x) { return '<rect x="' + (x - 40) + '" y="6" width="80" height="4" rx="2" fill="#9fe9ff"/><rect x="' + (x - 60) + '" y="10" width="120" height="40" fill="url(#' + id + 'glow)" opacity=".35"/>'; }).join('') + '</g>';
  s += '<text x="14" y="26" font-family="Orbitron,Arial,sans-serif" font-size="10" fill="#3f6b88" letter-spacing="2">LINE 3 · FINAL EL STATION</text>';
  // legs + belt
  s += '<g fill="#1a222d">' + [40, 200, 600, 700].map(function (x) { return '<rect x="' + x + '" y="226" width="10" height="56"/>'; }).join('') + '</g>';
  s += '<path d="M0 196H730L748 206V226H0Z" fill="url(#' + id + 'belt)"/>';
  s += '<rect x="0" y="194" width="730" height="4" fill="#3b4656"/>';
  s += '<g>' + Array.apply(null, Array(19)).map(function (_, k) { return '<circle cx="' + (20 + k * 38) + '" cy="216" r="7" fill="#0d1218" stroke="#3a4555"/><circle cx="' + (20 + k * 38) + '" cy="216" r="2" fill="#5d6b80"/>'; }).join('') + '</g>';
  s += '<line x1="0" y1="200" x2="730" y2="200" stroke="#55657a" stroke-width="1" stroke-dasharray="3 9"><animate attributeName="stroke-dashoffset" from="24" to="0" dur=".8s" repeatCount="indefinite"/></line>';
  // moving cells: two layers (blue outside the hood, real EL photo inside)
  var cells = '', el = '';
  BELT_IDS.forEach(function (cid, k) {
    var begin = (-k * 1.5) + 's';
    var anim = '<animateTransform attributeName="transform" type="translate" from="-80 0" to="820 0" dur="12s" begin="' + begin + '" repeatCount="indefinite"/>';
    cells += '<g>' + anim + blueCell(0, 150, 44) + '</g>';
    el += '<g>' + anim + '<rect x="-3" y="147" width="50" height="50" fill="#bff3ff" opacity=".25" filter="url(#' + id + 'b2)"/><image data-cell="' + cid + '" x="0" y="150" width="44" height="44" preserveAspectRatio="none"/></g>';
  });
  s += '<g clip-path="url(#' + id + 'out)">' + cells + '</g>';
  // hood back + cutaway inside
  s += '<rect x="338" y="120" width="124" height="80" fill="#020406"/>';
  s += '<g clip-path="url(#' + id + 'in)">' + el + '</g>';
  // contact probes inside hood
  s += '<g data-hot="contacts"><path d="M352 120V146M448 120V146" stroke="#c9a14a" stroke-width="3"/><circle cx="352" cy="147" r="3" fill="#ffcf6b"/><circle cx="448" cy="147" r="3" fill="#ffcf6b"/>' +
       '<path d="M352 120C352 100 330 96 318 96M448 120C448 100 470 96 486 96" fill="none" stroke="#c9a14a" stroke-width="1.5" stroke-dasharray="2 2"/>' +
       '<text x="300" y="92" font-family="Space Mono,monospace" font-size="9" fill="#ffcf6b">+</text><text x="490" y="92" font-family="Space Mono,monospace" font-size="9" fill="#ffcf6b">−</text></g>';
  // hood shell (cut-away frame)
  s += '<path d="M330 40H470L478 50V200H470V122H330V200H322V50Z" fill="url(#' + id + 'hood)" stroke="#2c3a4c"/>';
  s += '<rect x="330" y="122" width="140" height="80" fill="none" stroke="#46e3ff" stroke-opacity=".5" stroke-dasharray="4 4"/>';
  s += '<text x="400" y="116" text-anchor="middle" font-family="Rajdhani,Arial,sans-serif" font-size="10" fill="#6c8aa6">cut-away view · inside it is dark</text>';
  // camera
  s += '<g data-hot="camera"><rect x="380" y="52" width="40" height="34" rx="4" fill="#0b0f15" stroke="#46e3ff" stroke-opacity=".6"/><rect x="390" y="86" width="20" height="14" fill="#141b25" stroke="#2f4054"/>' +
       '<circle cx="400" cy="101" r="7" fill="#08202a" stroke="#46e3ff"/><circle cx="400" cy="101" r="3" fill="#46e3ff"><animate attributeName="opacity" values="1;.3;1" dur="2s" repeatCount="indefinite"/></circle>' +
       '<path d="M393 106L360 190H440L407 106Z" fill="#46e3ff" opacity=".07"/></g>';
  s += '<text x="400" y="34" text-anchor="middle" font-family="Orbitron,Arial,sans-serif" font-size="10" font-weight="700" fill="#9fe9ff" letter-spacing="2">EL CAMERA</text>';
  s += '<circle cx="462" cy="48" r="3" fill="#3dffa0"><animate attributeName="opacity" values="1;.2;1" dur="1.3s" repeatCount="indefinite"/></circle>';
  // monitor
  s += '<g data-hot="monitor"><path d="M520 140V120H560" stroke="#2c3a4c" stroke-width="4" fill="none"/>' +
       '<rect x="540" y="36" width="150" height="88" rx="6" fill="#070b10" stroke="#46e3ff" stroke-opacity=".7"/>' +
       '<image data-cell="' + (opts.monitorCell || 6) + '" x="548" y="44" width="68" height="68" preserveAspectRatio="none"/>' +
       '<rect x="548" y="44" width="68" height="68" fill="none" stroke="#46e3ff" stroke-opacity=".4"/>' +
       '<text x="624" y="58" font-family="Orbitron,Arial,sans-serif" font-size="8" fill="#6c8aa6">' + (opts.monitorTitle || 'CELL 0006') + '</text>' +
       '<text x="624" y="80" font-family="Orbitron,Arial,sans-serif" font-size="13" font-weight="700" fill="' + (opts.monitorColor || '#ff4d6a') + '">' + (opts.monitor || 'STOP?') + '</text>' +
       '<text x="624" y="100" font-family="Rajdhani,Arial,sans-serif" font-size="10" fill="#8d9bb0">' + (opts.monitorSub || 'you decide') + '</text></g>';
  // sorter
  s += '<g data-hot="sorter"><path d="M730 196L790 196" stroke="#2c6a4a" stroke-width="6"/><path d="M736 206L770 262H796L760 206Z" fill="#2a0e15" stroke="#7a2232"/>' +
       '<rect x="722" y="168" width="8" height="30" fill="#556" /><path d="M730 172L760 196" stroke="#cfd8e3" stroke-width="3"/>' +
       '<circle cx="752" cy="150" r="7" fill="#3dffa0" opacity=".9"/><circle cx="752" cy="150" r="14" fill="#3dffa0" opacity=".25" filter="url(#' + id + 'b)"/>' +
       '<circle cx="776" cy="150" r="7" fill="#ff4d6a" opacity=".9"><animate attributeName="opacity" values=".9;.3;.9" dur="1.1s" repeatCount="indefinite"/></circle>' +
       '<text x="760" y="188" text-anchor="middle" font-family="Orbitron,Arial,sans-serif" font-size="8" fill="#3dffa0">PASS →</text>' +
       '<text x="770" y="280" text-anchor="middle" font-family="Orbitron,Arial,sans-serif" font-size="8" fill="#ff4d6a">STOP ↓ RE-CHECK</text></g>';
  // hotspots
  if (opts.hot) {
    var HS = [['camera', 400, 70, '1'], ['contacts', 352, 147, '2'], ['monitor', 615, 80, '3'], ['sorter', 760, 170, '4']];
    HS.forEach(function (p) {
      var seen = opts.visited && opts.visited[p[0]];
      s += '<g class="hot" data-key="' + p[0] + '" style="cursor:pointer" tabindex="0" role="button" aria-label="station part ' + p[3] + '">' +
        '<circle cx="' + p[1] + '" cy="' + p[2] + '" r="22" fill="transparent"/>' +
        '<circle cx="' + p[1] + '" cy="' + p[2] + '" r="13" fill="none" stroke="' + (seen ? '#3dffa0' : '#ffb547') + '" stroke-width="2">' + (seen ? '' : '<animate attributeName="r" values="11;17;11" dur="1.6s" repeatCount="indefinite"/>') + '</circle>' +
        '<circle cx="' + (p[1] + 13) + '" cy="' + (p[2] - 13) + '" r="8" fill="' + (seen ? '#3dffa0' : '#ffb547') + '"/>' +
        '<text x="' + (p[1] + 13) + '" y="' + (p[2] - 9.5) + '" text-anchor="middle" font-family="Orbitron,Arial,sans-serif" font-size="9" font-weight="900" fill="#1a1000">' + (seen ? '✓' : p[3]) + '</text>' +
        (seen ? '' : '<text x="' + p[1] + '" y="' + (p[2] + 30) + '" text-anchor="middle" font-family="Rajdhani,Arial,sans-serif" font-size="11" font-weight="700" fill="#ffb547">tap</text>') + '</g>';
    });
  }
  return s + '</svg>';
}

/* fill <image data-cell> with real photos (full PNG if shipped, else the 64px pack) */
function fillImages(root, api) {
  [].forEach.call(root.querySelectorAll('image[data-cell]'), function (im) {
    var cid = +im.getAttribute('data-cell');
    api.cellURL(cid).then(function (u) {
      if (u) { im.setAttribute('href', u); return; }
      var c = api.canvas && api.canvas(cid); if (c) im.setAttribute('href', c.toDataURL());
    });
  });
}

var MON = {
  0: { monitor: 'STOP?', monitorSub: 'you decide', monitorTitle: 'CELL 0006' },
  1: { monitor: '2,624', monitorSub: 'real photos', monitorTitle: 'DATA', monitorColor: '#46e3ff' },
  2: { monitor: 'SCORE', monitorSub: 'model decides', monitorTitle: 'MODEL', monitorColor: '#ffb547' },
  4: { monitor: 'WHY?', monitorSub: 'heat maps', monitorTitle: 'EXPLAIN', monitorColor: '#ff8a5c' },
  3: { monitor: 'CNN', monitorSub: 'learns filters', monitorTitle: 'NETWORK', monitorColor: '#a98bff' },
  5: { monitor: 'ROUTE', monitorSub: 'pass · person · stop', monitorTitle: 'FLOW', monitorColor: '#3dffa0' },
  6: { monitor: 'REPORT', monitorSub: 'crew · tools · check', monitorTitle: 'CREW', monitorColor: '#a98bff' },
  7: { monitor: 'PASS', monitorSub: 'word · shape · colour', monitorTitle: 'CONSOLE', monitorColor: '#2ee07a' }
};
function banner(el, stepId, api) {
  var o = Object.assign({ vb: '290 20 510 210' }, MON[stepId] || MON[0]);
  el.innerHTML = station(o);
  fillImages(el, api);
}
window.PGArt = { station: station, banner: banner, fillImages: fillImages, blueCell: blueCell };
})();
