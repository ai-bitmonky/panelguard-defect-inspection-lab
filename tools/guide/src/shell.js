/* PanelGuard Diagram guide — the shell: a full-screen overlay with a step list (search + stage filter), four tabs per
   substep (Overview / Diagram / Code explained / Hints & checks), Print this step, Previous / Next, deep links
   (#guide-1a or ?guide=1a) and the launch buttons the lab uses (window.PGDiagram.help(id) on every lab page).
   Text content comes from window.PGTeach.data (the old guide's data, kept as it is). Every substep's diagram comes from window.PGD.
   Chrome (v3.0): a one-time "how diagrams work" strip above the first diagram, and an "All diagrams" grid (55 lazy thumbnails by
   step, done marks from the lab) reachable from the header. */
(function () {
'use strict';
var T = window.PGTeach, D = window.PGD;
if (!T || !T.data) { try { console.log('[guide] PGTeach data missing: guide not built'); } catch (e) {} return; }
var esc = D.esc;
var IDS = Object.keys(T.data);
var info = function (id) { return T.data[id]; };
var selected = IDS[0], tab = 'overview', dialog = null, filter = 'all', query = '', returnFocus = null, oldHash = null, gridOn = false;
var TABN = { overview: 'Overview', diagram: 'Diagram', code: 'Code explained', practice: 'Hints & checks' };
function tabsFor(id) { return info(id).blocks.length ? ['overview', 'diagram', 'code', 'practice'] : ['overview', 'diagram', 'practice']; }
function labDone(id) { try { return !!(window.PG && window.PG.passed && window.PG.passed(id)); } catch (e) { return false; } }
var HINT_KEY = 'pgd-hint-v3';
function hintSeen() { try { return localStorage.getItem(HINT_KEY) === '1'; } catch (e) { return true; } }
var STAGES = {};
IDS.forEach(function (id) { if (!STAGES[id[0]]) STAGES[id[0]] = info(id).stageTitle; });

/* ---------- tab content ---------- */
function overview(id) {
  var d = info(id);
  return '<div class="pgd-ov">' +
    '<section class="pgd-aim"><p class="pgd-k">The aim</p><h3>' + esc(d.mission) + '</h3><p class="pgd-why">' + esc(d.why) + '</p></section>' +
    '<section class="pgd-io"><div class="pgd-io-c in"><p class="pgd-k">You start with</p><p>' + esc(d.input) + '</p></div>' +
    '<div class="pgd-io-arrow" aria-hidden="true"><svg viewBox="0 0 60 24"><path d="M2 12H52" stroke="#46e3ff" stroke-width="2.5" stroke-linecap="round"/><path d="M44 4L56 12L44 20" fill="none" stroke="#46e3ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
    '<div class="pgd-io-c out"><p class="pgd-k">You make</p><p>' + esc(d.output) + '</p></div></section>' +
    '<section class="pgd-done"><p class="pgd-k">Done looks like</p><p>' + esc(d.check) + '</p></section>' +
    '<details class="pgd-more"><summary>Where this fits in the course</summary><p>' + esc(d.stagePurpose) + '</p></details></div>';
}
function codeView(id, printing) {
  var d = info(id);
  if (!d.blocks.length) return '<p class="pgd-intro">This step is a hands-on activity. There is no starter code.</p>';
  return '<div class="pgd-code"><div class="pgd-code-top"><p class="pgd-meta"><span class="pgd-lang ' + d.lang + '">' + (d.lang === 'py' ? 'Python' : 'JavaScript') + '</span>' + d.blocks.length + ' parts · line numbers of the starter code</p>' +
    (printing ? '' : '<div class="pgd-code-actions"><button type="button" data-guide="expand">Open all</button><button type="button" data-guide="collapse">Close all</button></div>') + '</div>' +
    (d.hasTwin ? '<p class="pgd-intro">This explains the cell you run. The Python twin stays read-only.</p>' : '') +
    d.blocks.map(function (b, i) {
      return '<details class="pgd-block"' + (printing || i === 0 ? ' open' : '') + '><summary><span class="pgd-part">' + String(i + 1).padStart(2, '0') + '</span><span class="pgd-bt">' + esc(b.title) + '</span><small>lines ' + b.start + '–' + b.end + '</small></summary>' +
        '<div class="pgd-bbody"><p>' + esc(b.explain) + '</p><div class="pgd-src" tabindex="0" role="region" aria-label="Starter lines ' + b.start + ' to ' + b.end + '"><pre><code>' +
        b.code.replace(/^\n/, '').split('\n').map(function (line, j) { return '<span class="pgd-line"><span class="pgd-ln" aria-hidden="true">' + (b.start + j) + '</span><span class="pgd-lc">' + (esc(line).replace(/____/g, '<mark>____</mark>') || ' ') + '</span></span>'; }).join('') +
        '</code></pre></div></div></details>';
    }).join('') + '<div class="pgd-extra">' + T.syntax(d) + '</div><p class="pgd-foot">Line numbers can move after you edit the starter. This page never changes your code.</p></div>';
}
function practice(id) {
  var d = info(id);
  return '<div class="pgd-pr">' +
    (d.gaps.length ? '<p class="pgd-intro">Open a gap for a hint. The answer stays hidden until you ask.</p><div class="pgd-gaps">' + d.gaps.map(function (g) {
      return '<details class="pgd-gap"><summary><span class="pgd-gn">Gap ' + g.number + '</span><small>line ' + g.line + '</small></summary><p>' + esc(g.hint) + '</p>' +
        '<details class="pgd-ans"><summary>Show what to type</summary><p><code>' + esc(g.answer) + '</code></p></details></details>';
    }).join('') + '</div>' : '') +
    (id === '7g' ? '<div class="pgd-extra">' + T.bugs(id) + '</div>' : '') +
    '<section class="pgd-done"><p class="pgd-k">Check the result</p><p>' + esc(d.check) + '</p></section>' +
    '<section class="pgd-q"><p class="pgd-k">Think it through</p><p class="pgd-qq">' + esc(d.question) + '</p><details class="pgd-ans"><summary>Show the answer</summary><p>' + esc(d.answer) + '</p></details></section></div>';
}

/* ---------- list ---------- */
function visibleIds() {
  return IDS.filter(function (id) { return (filter === 'all' || id[0] === filter) && (!query || (id + ' ' + info(id).name + ' ' + JSON.stringify(info(id))).toLowerCase().indexOf(query) >= 0); });
}
function renderNav() {
  var vis = visibleIds(), prev = '', html = '';
  vis.forEach(function (id) {
    if (id[0] !== prev) { prev = id[0]; html += '<h3 class="pgd-sh"><span>STEP ' + id[0] + '</span>' + esc(STAGES[id[0]]) + '</h3>'; }
    html += '<button type="button" class="pgd-item' + (id === selected ? ' cur' : '') + '" data-lesson="' + id + '"' + (id === selected ? ' aria-current="step"' : '') + '>' +
      '<span class="pgd-num">' + id + '</span><span class="pgd-nm">' + esc(info(id).name) + '</span>' + (labDone(id) ? '<span class="pgd-done-dot" title="done in the lab" aria-label="done in the lab">✓</span>' : '') + '</button>';
  });
  dialog.querySelector('.pgd-list').innerHTML = html || '<p class="pgd-empty">No step matches. Try another word.</p>';
  dialog.querySelector('.pgd-count').textContent = vis.length + ' of ' + IDS.length + ' steps';
}
function renderStep() {
  if (tabsFor(selected).indexOf(tab) < 0) tab = 'overview';
  var d = info(selected);
  dialog.querySelector('.pgd-kick').innerHTML = '<span>STEP ' + selected[0] + '</span>' + esc(d.stageTitle);
  dialog.querySelector('#pgd-title').innerHTML = '<span class="pgd-tid">' + selected + '</span>' + esc(d.name);
  dialog.querySelector('.pgd-tabs').innerHTML = tabsFor(selected).map(function (t) {
    return '<button type="button" role="tab" id="pgd-tab-' + t + '" aria-controls="pgd-panel" aria-selected="' + (t === tab) + '" tabindex="' + (t === tab ? 0 : -1) + '" data-tab="' + t + '">' + TABN[t] + '</button>';
  }).join('');
  var panel = dialog.querySelector('#pgd-panel');
  panel.setAttribute('aria-labelledby', 'pgd-tab-' + tab);
  panel.className = 'pgd-panel tab-' + tab;
  if (tab === 'diagram') { panel.innerHTML = ''; D.mount(panel, selected); if (!hintSeen()) addHint(panel); }
  else panel.innerHTML = tab === 'code' ? codeView(selected) : tab === 'practice' ? practice(selected) : overview(selected);
  panel.scrollTop = 0;
  var i = IDS.indexOf(selected);
  dialog.querySelector('[data-guide=prev]').disabled = i === 0;
  dialog.querySelector('[data-guide=next]').disabled = i === IDS.length - 1;
  dialog.querySelector('[data-guide=prev] .pgd-pn').textContent = i > 0 ? IDS[i - 1] + ' · ' + info(IDS[i - 1]).name : '';
  dialog.querySelector('[data-guide=next] .pgd-pn').textContent = i < IDS.length - 1 ? IDS[i + 1] + ' · ' + info(IDS[i + 1]).name : '';
  dialog.querySelector('.pgd-pos').textContent = (i + 1) + ' / ' + IDS.length;
  renderNav();
  setHash('#guide-' + selected);
}
/* ---------- the one-time "how diagrams work" strip (never covers the picture) ---------- */
function addHint(panel) {
  var h = document.createElement('div'); h.className = 'pgd-hint'; h.setAttribute('role', 'note');
  h.innerHTML = '<p><b>How the diagrams work:</b> <span class="pgd-hk"><i class="pgd-hchip">TAP</i> do the action written on the orange label, right on the picture.</span>' +
    '<span class="pgd-hk"><i class="pgd-hdot"></i> the dots under the picture go back to an earlier frame.</span><span class="pgd-hk">The right strip works out the numbers.</span></p>' +
    '<button type="button" class="pgd-btn" data-guide="hint">Got it</button>';
  panel.insertBefore(h, panel.firstChild);
}
/* ---------- All diagrams: a grid of the 55 diagrams by step (thumbnails drawn lazily, frame 1 of each) ---------- */
var io = null;
function renderGrid() {
  var panel = dialog.querySelector('#pgd-panel'), prev = '', html = '', done = 0;
  IDS.forEach(function (id) {
    if (id[0] !== prev) { if (prev) html += '</div>'; prev = id[0]; html += '<h3 class="pgd-gh"><span>STEP ' + id[0] + '</span>' + esc(STAGES[id[0]]) + '</h3><div class="pgd-grid">'; }
    var ok = labDone(id); if (ok) done++;
    html += '<button type="button" class="pgd-gcard' + (id === selected ? ' cur' : '') + '" data-grid="' + id + '" aria-label="' + id + ' ' + esc(info(id).name) + (ok ? ', done in the lab' : ', not done yet') + '">' +
      '<span class="pgd-gthumb" data-thumb="' + id + '"></span><span class="pgd-gname"><b>' + id + '</b>' + esc(info(id).name) + '</span><span class="pgd-gmark ' + (ok ? 'ok' : '') + '" aria-hidden="true">' + (ok ? '✓ done' : 'not done') + '</span></button>';
  });
  panel.className = 'pgd-panel tab-grid';
  panel.innerHTML = '<div class="pgd-gtop"><p>All ' + IDS.length + ' diagrams · <b>' + done + '</b> substeps done in the lab. Pick one to open its diagram.</p></div>' + html + '</div>';
  dialog.querySelector('.pgd-kick').innerHTML = '<span>OVERVIEW</span>All diagrams';
  dialog.querySelector('#pgd-title').innerHTML = '<span class="pgd-tid">55</span>All diagrams';
  dialog.querySelector('.pgd-tabs').innerHTML = '<button type="button" role="tab" id="pgd-tab-back" aria-selected="false" data-gridback="1">← Back to ' + selected + '</button>';
  panel.setAttribute('aria-labelledby', 'pgd-title');
  var thumbs = panel.querySelectorAll('[data-thumb]');
  function draw(el) { if (el.firstChild) return; el.innerHTML = '<svg viewBox="0 0 960 540" aria-hidden="true" focusable="false">' + D.thumbSVG(el.getAttribute('data-thumb')) + '</svg>'; }
  if (io) io.disconnect();
  if ('IntersectionObserver' in window) { io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { draw(e.target); io.unobserve(e.target); } }); }, { root: panel, rootMargin: '200px' }); thumbs.forEach(function (el) { io.observe(el); }); }
  else thumbs.forEach(draw);
  panel.scrollTop = 0;
  var cur = panel.querySelector('.pgd-gcard.cur'); if (cur) { try { cur.focus({ preventScroll: false }); } catch (e) {} }
}
function showGrid(on) { gridOn = on; dialog.querySelector('[data-guide=grid]').setAttribute('aria-pressed', on ? 'true' : 'false'); if (on) renderGrid(); else renderStep(); }
function setHash(h) { try { if (h) history.replaceState(history.state, '', location.pathname + location.search + h); } catch (e) {} }
function select(id) { if (!T.data[id]) return; selected = id; gridOn = false; dialog.querySelector('[data-guide=grid]').setAttribute('aria-pressed', 'false'); renderStep(); }

/* ---------- print ---------- */
var sheet = null;
function cleanPrint() { document.body.classList.remove('pgd-printing'); if (sheet) sheet.innerHTML = ''; }
function printStep() {
  if (!sheet) { sheet = document.createElement('div'); sheet.className = 'pgd-print'; document.body.appendChild(sheet); }
  var d = info(selected);
  var pic = D.printHTML(selected);
  sheet.innerHTML = '<header class="pgd-ph"><p>PanelGuard · Diagram guide · Step ' + selected[0] + ' · ' + esc(d.stageTitle) + '</p><h1>' + selected + ' · ' + esc(d.name) + '</h1></header>' +
    overview(selected) + '<h2>Diagram</h2>' + pic + (d.blocks.length ? '<h2>Code explained</h2>' + codeView(selected, true) : '') + '<h2>Hints &amp; checks</h2>' + practice(selected);
  document.body.classList.add('pgd-printing');
  try { window.print(); } catch (e) { try { console.log('[guide] print failed', e && e.message); } catch (x) {} }
}

/* ---------- build ---------- */
function build() {
  dialog = document.createElement('dialog');
  dialog.className = 'pgd'; dialog.setAttribute('aria-labelledby', 'pgd-title');
  dialog.innerHTML = '<div class="pgd-shell">' +
    '<header class="pgd-top"><div class="pgd-brand"><b>PANELGUARD</b><span class="pgd-sep">/</span><span class="pgd-gt">DIAGRAM GUIDE</span></div>' +
    '<p class="pgd-sub">Pictures, code and hints for every step.</p>' +
    '<div class="pgd-acts"><button type="button" class="pgd-btn" data-guide="grid" aria-pressed="false"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3h5v5H3zM12 3h5v5h-5zM3 12h5v5H3zM12 12h5v5h-5z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>All diagrams</button><button type="button" class="pgd-btn" data-guide="print"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 8V2h10v6M5 15H3V8h14v7h-2M5 12h10v6H5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>Print this step</button>' +
    '<button type="button" class="pgd-btn pri" data-guide="close" aria-label="Close the guide and go back to the lab">Back to lab<span aria-hidden="true" class="pgd-x">✕</span></button></div></header>' +
    '<div class="pgd-body"><aside class="pgd-side" aria-label="Guide steps">' +
    '<label class="pgd-sr" for="pgd-search">Find a step</label><div class="pgd-search"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M13 13l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><input id="pgd-search" type="search" placeholder="Find a step, word or code…" autocomplete="off"></div>' +
    '<label class="pgd-sr" for="pgd-stage">Filter by stage</label><select id="pgd-stage"><option value="all">All stages</option>' +
    Object.keys(STAGES).map(function (k) { return '<option value="' + k + '">Step ' + k + ' · ' + esc(STAGES[k]) + '</option>'; }).join('') + '</select>' +
    '<p class="pgd-count" role="status"></p><nav class="pgd-list" aria-label="Steps"></nav></aside>' +
    '<main class="pgd-main"><header class="pgd-head"><div class="pgd-ht"><p class="pgd-kick"></p><h2 id="pgd-title"></h2></div><div class="pgd-tabs" role="tablist" aria-label="Help for this step"></div></header>' +
    '<section id="pgd-panel" class="pgd-panel" role="tabpanel" tabindex="-1"></section>' +
    '<footer class="pgd-foot2"><button type="button" class="pgd-nb" data-guide="prev"><span class="pgd-pa">← Previous</span><span class="pgd-pn"></span></button><span class="pgd-pos"></span><button type="button" class="pgd-nb nx" data-guide="next"><span class="pgd-pa">Next step →</span><span class="pgd-pn"></span></button></footer>' +
    '</main></div></div>';
  document.body.appendChild(dialog);
  dialog.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || !dialog.contains(b)) return;
    if (b.dataset.lesson) { select(b.dataset.lesson); var it = dialog.querySelector('[data-lesson="' + selected + '"]'); if (it) it.focus(); return; }
    if (b.dataset.grid) { tab = 'diagram'; select(b.dataset.grid); var tb0 = dialog.querySelector('#pgd-tab-diagram'); if (tb0) tb0.focus(); return; }
    if (b.dataset.gridback) { showGrid(false); return; }
    if (b.dataset.tab) { tab = b.dataset.tab; renderStep(); dialog.querySelector('#pgd-tab-' + tab).focus(); return; }
    var a = b.dataset.guide;
    if (a === 'close') dialog.close();
    if (a === 'grid') showGrid(!gridOn);
    if (a === 'hint') { try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {} var hn = dialog.querySelector('.pgd-hint'); if (hn) hn.remove(); var st = dialog.querySelector('#pgd-panel .pgd-target'); if (st) { try { st.focus(); } catch (e) {} } }
    if (a === 'print') { if (gridOn) showGrid(false); printStep(); }
    if (a === 'prev' || a === 'next') { var i = IDS.indexOf(selected) + (a === 'next' ? 1 : -1); if (IDS[i]) select(IDS[i]); }
    if (a === 'expand' || a === 'collapse') dialog.querySelectorAll('#pgd-panel .pgd-block').forEach(function (x) { x.open = a === 'expand'; });
  });
  dialog.querySelector('.pgd-tabs').addEventListener('keydown', function (e) {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) < 0) return;
    e.preventDefault(); var ts = tabsFor(selected), i = ts.indexOf(tab);
    tab = e.key === 'Home' ? ts[0] : e.key === 'End' ? ts[ts.length - 1] : ts[(i + (e.key === 'ArrowRight' ? 1 : -1) + ts.length) % ts.length];
    renderStep(); dialog.querySelector('#pgd-tab-' + tab).focus();
  });
  dialog.querySelector('#pgd-search').addEventListener('input', function (e) { query = e.target.value.trim().toLowerCase(); renderNav(); });
  dialog.querySelector('#pgd-stage').addEventListener('change', function (e) { filter = e.target.value; renderNav(); });
  dialog.addEventListener('close', function () {
    cleanPrint(); setHash(oldHash && oldHash.indexOf('#guide-') !== 0 ? oldHash : '#sub-' + (curLab() || selected));
    if (returnFocus && returnFocus.isConnected) { try { returnFocus.focus({ preventScroll: true }); } catch (e) {} }
  });
  window.addEventListener('afterprint', cleanPrint);
}
function curLab() { try { return window.PG && window.PG.S && window.PG.S.cur; } catch (e) { return null; } }
function open(id, t) {
  returnFocus = document.activeElement; oldHash = location.hash;
  if (!dialog) build();
  id = id || curLab();
  if (id && T.data[id]) { selected = id; tab = t && TABN[t] ? t : 'overview'; }
  query = ''; filter = 'all'; dialog.querySelector('#pgd-search').value = ''; dialog.querySelector('#pgd-stage').value = 'all';
  if (!dialog.open) { try { dialog.showModal(); } catch (e) { dialog.setAttribute('open', ''); } }
  gridOn = false; dialog.querySelector('[data-guide=grid]').setAttribute('aria-pressed', 'false');
  renderStep();
  var it = dialog.querySelector('[data-lesson="' + selected + '"]'); if (it) it.scrollIntoView({ block: 'nearest' });
  var tb = dialog.querySelector('#pgd-tab-' + tab); if (tb) { try { tb.focus({ preventScroll: true }); } catch (e) {} }
}
function help(id) {
  var b = document.createElement('button'); b.type = 'button'; b.className = 'pgd-help';
  b.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 11l3-3 2 2 3-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Explain this step';
  b.setAttribute('aria-label', 'Explain step ' + id + ': ' + (T.data[id] ? T.data[id].name : id)); b.setAttribute('aria-haspopup', 'dialog');
  b.onclick = function () { open(id); };
  return b;
}
window.PGDiagram = { open: open, help: help, data: T.data, svg: function (id) { return D.has(id) ? '<svg viewBox="0 0 960 540" xmlns="http://www.w3.org/2000/svg">' + D.thumbSVG(id) + '</svg>' : ''; }, panel: function (id, view) { return view === 'code' ? codeView(id) : view === 'practice' ? practice(id) : view === 'diagram' ? D.printHTML(id) : overview(id); },
  grid: function () { if (!dialog || !dialog.open) open(); showGrid(true); }, gridOn: function () { return gridOn; },
  isOpen: function () { return !!(dialog && dialog.open); }, selected: function () { return selected; }, tab: function () { return tab; } };

function launch() {
  var top = document.querySelector('.top'); if (!top || document.getElementById('pgd-launch')) return;
  var b = document.createElement('button'); b.type = 'button'; b.className = 'pgd-launch'; b.id = 'pgd-launch';
  b.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 11l3-3 2 2 3-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Diagram guide</span>';
  b.title = 'Pictures, code and hints for the step you are on'; b.setAttribute('aria-haspopup', 'dialog');
  b.onclick = function () { open(curLab()); };
  top.appendChild(b);
}
function deepLink() {
  var m = (location.hash || '').match(/^#guide-(\w+)$/) || (location.search || '').match(/[?&]guide=(\w+)/);
  if (m && T.data[m[1]]) open(m[1], ((location.search || '').match(/[?&]gtab=(\w+)/) || [])[1]);
}
launch();
if (document.readyState === 'complete') setTimeout(deepLink, 0); else window.addEventListener('load', function () { setTimeout(deepLink, 0); });
window.addEventListener('hashchange', function () { if (/^#guide-\w+$/.test(location.hash) && !(dialog && dialog.open)) deepLink(); });
})();
