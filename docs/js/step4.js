/* PanelGuard — Step 4 content: See what the model looks at (cover-up test, Grad-CAM, deletion test, slices, to-do list).
   Uses the trained CNN from Step 3 (the same `model` name in the JS notebook). Every map and number is computed live. */
(function (G) {
'use strict';
var V = function () { return G.PGViz4; };
var J = function () { return G.PGJS; };
function f3(x) { return x == null || isNaN(x) ? '—' : (+x).toFixed(3); }
function pc(x, d) { return (100 * x).toFixed(d == null ? 1 : d) + '%'; }
var PAINT = [496, 1088, 379];      // 3 real validation defects with clear cracks (expert score 1.0)

/* ---------- helpers given to the student code as pg.* (also used by the checkers as the reference) ---------- */
function extra(pg) {
  var tf = G.tf;
  function meanOf(img) { return img.mean().dataSync()[0]; }
  function grayPatch(img, r, c, size) {                      // copy of img [64,64,1] with a size x size patch set to the photo's mean
    var d = img.dataSync().slice(), m = 0, i, x, y; for (i = 0; i < 4096; i++) m += d[i]; m /= 4096;
    for (y = Math.max(0, r); y < Math.min(64, r + size); y++) for (x = Math.max(0, c); x < Math.min(64, c + size); x++) d[y * 64 + x] = m;
    return tf.tensor3d(d, [64, 64, 1]);
  }
  function grayOut(img, pix) { var d = img.dataSync().slice(), m = 0, i; for (i = 0; i < 4096; i++) m += d[i]; m /= 4096; pix.forEach(function (p) { d[p] = m; }); return tf.tensor3d(d, [64, 64, 1]); }
  function randomPixels(k, seed) { var s = (seed * 9301 + 49297) % 233280 + 1, a = []; for (var i = 0; i < 4096; i++) a.push(i); for (i = 4095; i > 0; i--) { s = (s * 9301 + 49297) % 233280; var j = Math.floor(s / 233280 * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a.slice(0, k); }
  function upsample(cam) {                                   // [16,16] tensor or array -> Float32Array(4096), bilinear
    return tf.tidy(function () { var t = cam.shape ? cam : tf.tensor2d(cam, [16, 16]); return tf.image.resizeBilinear(t.reshape([t.shape[0], t.shape[1], 1]), [64, 64], false, true).dataSync(); });
  }
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function refCoverUp(model, img) {
    return tf.tidy(function () {
      var base = model.predict(img.expandDims(0)).dataSync()[0], cov = [];
      for (var r = 0; r < 15; r++) for (var c = 0; c < 15; c++) cov.push(grayPatch(img, r * 4, c * 4, 8));
      var s = model.predict(tf.stack(cov)).dataSync(); return Array.from(s, function (v) { return base - v; });
    });
  }
  function refGradCam(model, img) {
    var L = model.layers.filter(function (l) { return l.getClassName() !== 'InputLayer'; });
    var acts = L.filter(function (l) { return l.getClassName() === 'Activation'; }), cut = L.indexOf(acts[2]);
    var front = L.slice(0, cut + 1), back = L.slice(cut + 1), run = function (ls, x) { return ls.reduce(function (t, l) { return l.apply(t); }, x); };
    return tf.tidy(function () {
      var A = run(front, img.expandDims(0)), g = tf.grad(function (a) { return run(back, a).sum(); })(A);
      return tf.relu(A.mul(g.mean([0, 1, 2])).sum(-1).squeeze([0]));
    });
  }
  var valIdx = {}; pg.cell_val.forEach(function (id, i) { valIdx[id] = i; });
  var dI = []; pg.y_val.forEach(function (v, i) { if (v === 1) dI.push(i); });
  return { paintCells: PAINT, valIndex: function (id) { return valIdx[id]; }, defectIdx: dI, grayPatch: grayPatch, grayOut: grayOut, randomPixels: randomPixels,
    upsample: upsample, mean: mean, refCoverUp: refCoverUp, refGradCam: refGradCam, meanOf: meanOf };
}
function cellOf(NS, i) { return NS.xVal.slice([i, 0, 0, 0], [1, 64, 64, 1]).squeeze([0]); }
function round3(a) { return Array.prototype.map.call(a, function (v) { return Math.round(v * 1000) / 1000; }); }
function close(a, b, tol) { if (!a || !b || a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > (tol || 1e-4)) return false; return true; }
function heatInPaint(cam64, mask) {                         // share of the hottest 10% of pixels that fall inside the painted area
  if (!mask || !mask.length) return null;
  var set = {}; mask.forEach(function (p) { set[p] = 1; });
  var order = Array.from(cam64.keys()).sort(function (a, b) { return cam64[b] - cam64[a]; }).slice(0, 410), n = 0;
  order.forEach(function (p) { if (set[p]) n++; }); return { share: n / 410, chance: mask.length / 4096 };
}
function needModel(NS) { if (!NS.model || !NS.xVal) return 'There is no trained model in memory. Train it in 3e first (or reload: a saved model comes back by itself).'; return null; }

/* ================= 4a: paint (no code) ================= */
var s4a = { id: '4a', name: 'Mark where YOU look', kind: 'scene', scene: 'paint', cells: PAINT,
  goal: 'You are the expert. Paint over the defect on 3 real cells. Later we check if the network looks at the same place.',
  needText: 'paint over the defect on all 3 cells (at least a small patch on each)' };

/* ================= 4b: cover-up (occlusion) ================= */
var s4b = { id: '4b', name: 'The cover-up test', kind: 'code', lang: 'js',
  goal: 'Hide one small part of the photo. If the score falls, the network was using that part.',
  pre: { need: function (m) { return m.patchOk ? null : 'drag the gray patch over the photo until the score falls by at least half of the biggest drop'; }, render: function (box, api) { V().patchPlay(box, api); } },
  task: [
    'Gap 1: the patch moves STEP pixels each time. Type the name STEP so that row r starts at r × STEP.',
    'Gap 2: the map must store how much the score DROPS: score before minus score after. Type the name of the score before.'
  ],
  code: [
'// Cover-up test: slide an 8 x 8 gray patch over the photo, 4 pixels at a time',
'const SIZE = 8, STEP = 4;',
'const N = (64 - SIZE) / STEP + 1;                      // 15 spots across, 15 down',
'',
'function coverUp(img) {                                // img: one photo, shape [64, 64, 1]',
'  return tf.tidy(() => {',
'    const base = model.predict(img.expandDims(0)).dataSync()[0];    // score with nothing covered',
'    const covered = [];',
'    for (let r = 0; r < N; r++)',
'      for (let c = 0; c < N; c++)',
'        covered.push(pg.grayPatch(img, r * ____, c * STEP, SIZE));',
'    const scores = model.predict(tf.stack(covered)).dataSync();',
'    return Array.from(scores, (s) => ____ - s);         // how much the score DROPS at each spot',
'  });',
'}',
'',
'const first = xVal.slice([pg.valIndex(pg.paintCells[0]), 0, 0, 0], [1, 64, 64, 1]).squeeze([0]);',
'const coverMap = coverUp(first);                       // the first cell you painted in 4a',
"console.log('spots:', coverMap.length, '  biggest drop:', Math.max(...coverMap).toFixed(3));"
  ].join('\n'),
  twin: [
'SIZE, STEP = 8, 4',
'N = (64 - SIZE) // STEP + 1                            # 15 spots across, 15 down',
'',
'def gray_patch(img, r, c, size):',
'    out = img.copy()',
'    out[r:r + size, c:c + size] = img.mean()',
'    return out',
'',
'def cover_up(img):                                     # img: (64, 64, 1)',
'    base = float(model.predict(img[None], verbose=0)[0, 0])',
'    covered = np.stack([gray_patch(img, r * STEP, c * STEP, SIZE) for r in range(N) for c in range(N)])',
'    return base - model.predict(covered, verbose=0).ravel()',
'',
'PAINT_CELLS = [496, 1088, 379]',
'val_ids = [rows[i][0] for i in idx_val]',
'cover_map = cover_up(x_val[val_ids.index(PAINT_CELLS[0])])',
"print('spots:', cover_map.size, '  biggest drop:', round(float(cover_map.max()), 3))"
  ].join('\n'),
  probe: async function (NS, pg, tf) {
    var nm = needModel(NS); if (nm) throw J().CheckError(nm);
    if (typeof NS.coverUp !== 'function' || !NS.coverMap) return { missing: ['coverUp', 'coverMap'] };
    var maps = [], bases = [], ok = true;
    for (var k = 0; k < PAINT.length; k++) {
      var img = cellOf(NS, pg.valIndex(PAINT[k])), ref = pg.refCoverUp(NS.model, img);
      if (k === 0) ok = close(NS.coverMap, ref, 1e-4);
      bases.push(NS.model.predict(img.expandDims(0)).dataSync()[0]); maps.push(round3(ref)); img.dispose();
    }
    var neg = NS.coverMap.filter(function (v) { return v < -1e-6; }).length;
    return { ok: ok, len: NS.coverMap.length, neg: neg, maps: maps, bases: bases, ids: PAINT, rough: pg.rough };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (r.len !== 225) return { pass: false, msg: 'The map has ' + r.len + ' spots. It should have 15 × 15 = 225.' };
    if (!r.ok && r.neg > 200) return { pass: false, msg: 'Almost every number in your map is below zero: it stores the covered score, not the DROP. Drop = score before − score after.' };
    if (!r.ok) return { pass: false, msg: 'Your map does not match the cover-up rule. Row r of patches must start at r × STEP pixels, like the columns (c × STEP).' };
    return { pass: true, msg: 'Cover-up map ready: 225 spots per cell. Biggest drop on cell ' + r.ids[0] + ': ' + f3(Math.max.apply(null, r.maps[0])) + ' (score ' + f3(r.bases[0]) + ').' };
  },
  example: '<p>Find which of <b>6 shelves</b> in a fridge makes it warm. Remove one shelf at a time, every 2nd slot, and store how much the temperature <b>falls</b>:</p><pre>for (let k = 0; k < 3; k++) fall.push(tempBefore - tempWithout(k * 2));</pre><p>Before minus after = how much that part mattered.</p>',
  render: function (r, el, api) { V().coverResult(r, el, api); },
  explain: function (r) { return {
    asked: 'Slide a gray patch over the photo and store the score drop at each spot.',
    steps: ['Patch 8 × 8 pixels, moved 4 pixels at a time: (64 − 8) ÷ 4 + 1 = 15 spots across, 15 down, 225 in all.',
            'Row r starts at r × STEP, column c at c × STEP: the patch walks the whole photo.',
            'Drop = score with nothing covered − score with the patch. On cell ' + r.ids[0] + ': biggest drop ' + f3(Math.max.apply(null, r.maps[0])) + ' from a score of ' + f3(r.bases[0]) + '.',
            'Big drop = the network needed that spot to say “defect”.'],
    trap: 'Storing the covered score itself (not the drop) paints the whole map, so you cannot see what mattered.',
    remember: 'Hide a part. If the answer changes, that part mattered.' }; }
};

/* ================= 4c: Grad-CAM ================= */
var s4c = { id: '4c', name: 'Ask the network directly', kind: 'code', lang: 'js',
  goal: 'Ask the network itself which places pushed its score up (Grad-CAM). Then compare three maps: the network, the cover-up test, and you.',
  task: [
    'Gap 1: use block 3. Blocks are counted from 0 (0, 1, 2, 3). Type the number for block 3.',
    'Gap 2: each feature map is multiplied by its weight. Type the name of the weights variable.',
    'Gap 3: keep only the parts that push towards “defect” (below zero becomes 0). Type the TensorFlow.js function name for that.',
    'Then press and hold on each heat map to look at the photo underneath.'
  ],
  code: [
"const L = model.layers.filter((l) => l.getClassName() !== 'InputLayer');",
"const acts = L.filter((l) => l.getClassName() === 'Activation');   // the ReLU after each block",
'const cut = L.indexOf(acts[____]);                                // block 3 (count from 0)',
'const front = L.slice(0, cut + 1), back = L.slice(cut + 1);',
'const run = (layers, x) => layers.reduce((t, l) => l.apply(t), x);',
'',
'function gradCam(img) {                               // img [64, 64, 1]  ->  map [16, 16]',
'  return tf.tidy(() => {',
'    const A = run(front, img.expandDims(0));           // block-3 feature maps [1, 16, 16, 64]',
'    const g = tf.grad((a) => run(back, a).sum())(A);   // how much each value pushes the score up',
'    const w = g.mean([0, 1, 2]);                       // one weight per feature map',
'    const cam = A.mul(____).sum(-1).squeeze([0]);      // weighted sum of the 64 maps',
'    return tf.____(cam);                               // keep only what pushes towards “defect”',
'  });',
'}',
'',
'const cam0 = gradCam(first);                          // first painted cell (from 4b)',
"console.log('Grad-CAM grid:', cam0.shape);"
  ].join('\n'),
  twin: [
'import tensorflow as tf',
'',
'L = model.layers',
'acts = [l for l in L if isinstance(l, layers.Activation)]   # the ReLU after each block',
'cut = L.index(acts[2])                                       # block 3 (count from 0)',
'front, back = L[:cut + 1], L[cut + 1:]',
'',
'def run(ls, x):',
'    for l in ls:',
'        x = l(x, training=False)',
'    return x',
'',
'def grad_cam(img):                                    # img (64, 64, 1)  ->  map (16, 16)',
'    A = run(front, tf.constant(img[None]))             # block-3 feature maps (1, 16, 16, 64)',
'    with tf.GradientTape() as tape:',
'        tape.watch(A)',
'        s = tf.reduce_sum(run(back, A))',
'    g = tape.gradient(s, A)                            # how much each value pushes the score up',
'    w = tf.reduce_mean(g, axis=(0, 1, 2))              # one weight per feature map',
'    cam = tf.reduce_sum(A * w, axis=-1)[0]             # weighted sum of the 64 maps',
'    return tf.nn.relu(cam).numpy()                     # keep only what pushes towards "defect"',
'',
'cam0 = grad_cam(x_val[val_ids.index(PAINT_CELLS[0])])',
"print('Grad-CAM grid:', cam0.shape)"
  ].join('\n'),
  probe: async function (NS, pg, tf) {
    var nm = needModel(NS); if (nm) throw J().CheckError(nm);
    if (typeof NS.gradCam !== 'function' || !NS.cam0) return { missing: ['gradCam', 'cam0'] };
    var grid = NS.cam0.shape.slice();
    var y = pg.y_val, pv = NS.model.predict(NS.xVal), p = Array.prototype.slice.call(await pv.data()); pv.dispose();
    var cut = J().cutAt(y, p, 0.95), dI = pg.defectIdx;
    var caught = dI.filter(function (i) { return p[i] >= cut; }).sort(function (a, b) { return p[b] - p[a]; });
    var missed = dI.filter(function (i) { return p[i] < cut; }).sort(function (a, b) { return (pg.prob_val[b] - pg.prob_val[a]) || (p[a] - p[b]); });
    var fa = p.map(function (v, i) { return i; }).filter(function (i) { return y[i] === 0; }).sort(function (a, b) { return p[b] - p[a]; });
    var pick = PAINT.map(function (id, k) { return { i: pg.valIndex(id), tag: 'you painted (' + (k + 1) + ')' }; })
      .concat([{ i: caught.filter(function (i) { return PAINT.indexOf(pg.cell_val[i]) < 0; })[0], tag: 'caught defect' }, { i: missed[0], tag: 'missed defect' }, { i: fa[0], tag: 'false alarm' }])
      .filter(function (x) { return x.i != null; });
    var ok = grid.join() === '16,16', out = [];
    for (var k = 0; k < pick.length; k++) {
      var img = cellOf(NS, pick[k].i), mine = NS.gradCam(img), ref = pg.refGradCam(NS.model, img);
      var a = await mine.data(), b = await ref.data(); if (ok && !close(a, b, 1e-4 * Math.max(1e-3, Math.max.apply(null, b)) + 1e-6)) ok = false;
      var up = pg.upsample(ref), cov = pg.refCoverUp(NS.model, img);
      out.push({ id: pg.cell_val[pick[k].i], tag: pick[k].tag, score: p[pick[k].i], y: y[pick[k].i], prob: pg.prob_val[pick[k].i], kind: pg.kind_val[pick[k].i], cam: round3(b), cover: round3(cov) });
      mine.dispose(); ref.dispose(); img.dispose();
      out[k].up = Array.prototype.slice.call(up);
    }
    /* A well-trained-enough model can have only positive weights w at block 3: then abs() and relu() give the same map.
       So also compare once with the last layer's weights flipped (w < 0, the map turns negative), then put them back exactly. */
    if (ok && pick.length) {
      var lastL = NS.model.layers[NS.model.layers.length - 1], W0 = lastL.getWeights().map(function (t) { return t.clone(); }), neg0 = W0[0].neg();
      try {
        lastL.setWeights([neg0].concat(W0.slice(1)));
        var img2 = cellOf(NS, pick[0].i), m2 = NS.gradCam(img2), r2 = pg.refGradCam(NS.model, img2), a2 = await m2.data(), b2 = await r2.data();
        if (!close(a2, b2, 1e-4 * Math.max(1e-3, Math.max.apply(null, b2)) + 1e-6)) ok = false;
        m2.dispose(); r2.dispose(); img2.dispose();
      } finally { lastL.setWeights(W0); W0.forEach(function (t) { t.dispose(); }); neg0.dispose(); }
    }
    return { ok: ok, grid: grid, cut: cut, cells: out, rough: pg.rough, neg: Array.prototype.some.call(await NS.cam0.data(), function (v) { return v < 0; }) };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run 4b first, then this whole cell.' };
    if (r.grid.join() !== '16,16') return { pass: false, msg: 'Your map is ' + r.grid.join(' × ') + '. Block 3 gives 16 × 16. Count the blocks from 0: 0, 1, 2, 3.' };
    if (r.neg) return { pass: false, msg: 'Your map still has values below zero. The last step must turn every negative value into 0.' };
    if (!r.ok) return { pass: false, msg: 'Your map differs from Grad-CAM. Multiply each feature map by its ONE weight w (the average gradient), add them up, then keep only the positive part.' };
    return { pass: true, msg: 'Grad-CAM works: a 16 × 16 map per cell (each square covers 4 × 4 pixels). Shown for ' + r.cells.length + ' real cells.' };
  },
  example: '<p>A judge scores a dish from 3 tastes: sweet, salt, sour. How much each taste changes the score (its weight): 0.5, −0.2, 0.1. The taste levels on one spoon: 4, 2, 6.</p><pre>const total = 4 * 0.5 + 2 * -0.2 + 6 * 0.1;   // 2.2\nconst kept = Math.max(0, total);              // only the positive part</pre><p>Weighted sum, then keep only the part that pushes the score up.</p>',
  render: function (r, el, api) { V().camCompare(r, el, api); },
  mechNeed: function (m) { return m && (m.peek || 0) >= 3 ? null : 'press and hold on 3 heat maps to look at the photo underneath (' + ((m && m.peek) || 0) + ' of 3)'; },
  explain: function (r) { var c = r.cells[0]; return {
    asked: 'Grad-CAM: weight each block-3 feature map by how much it pushes the defect score, add them, keep the positive part.',
    steps: ['Block 3 sees the photo as 64 feature maps of 16 × 16. That is why the map is coarse: one square = 4 × 4 pixels.',
            'tf.grad gives, for every value in those maps, how much it pushes the score up. Averaging over the 16 × 16 places gives one weight w per map.',
            'Weighted sum of the 64 maps → one 16 × 16 map. relu keeps only what pushes towards “defect”.',
            'Cell ' + c.id + ': score ' + f3(c.score) + '. Compare the three pictures: the network, the cover-up test, and your painting.'],
    trap: 'Block 4 (8 × 8) is even coarser; block 2 is sharper but in our tests it pointed at the right place less often.',
    remember: 'Grad-CAM = feature maps × their importance, positive part only.' }; }
};

/* ================= 4d: deletion test ================= */
var s4d = { id: '4d', name: 'Is the heat map honest?', kind: 'code', lang: 'js',
  goal: 'A heat map can look nice and still be wrong. Test it: gray out the hottest pixels, or random pixels, and see which hurts the score more.',
  predict: { format: 'tokens',
    q: 'Before you run: we gray out <b>10%</b> of the pixels of every real defect. Option A: the <b>hottest</b> 10% in the Grad-CAM map. Option B: a <b>random</b> 10%. Which makes the defect score drop more? <b>Put your 10 tokens</b> on the answers (more tokens = more sure), then tap <b>Check</b>. One try.',
    options: ['A: hottest 10% drops it more', 'B: random 10% drops it more', 'About the same'], right: 0,
    reveal: { asked: 'Whether graying out the pixels the map calls important hurts the score more than graying out random pixels.',
      steps: ['If the map is honest, the hottest pixels are the ones the network uses.',
              'Remove them and the network loses its evidence: the score should drop MORE than after removing random pixels.',
              'If both drops are about the same, the map is only a pretty picture.',
              'Your run below measures both drops on every real defect in the validation tray.'],
      trap: 'Trusting a heat map because it “looks right”. Test it.',
      remember: 'An honest heat map: removing the hot part hurts most.' } },
  task: [
    'Gap 1: 10% written as a fraction of 1.',
    'Gap 2: take the first K pixels of the hottest-first list. Type the variable that holds that count.'
  ],
  code: [
'// Deletion test on every real defect of the validation tray',
'const K = Math.round(____ * 4096);                     // 10% of the 4,096 pixels',
'const hotImgs = [], randImgs = [], idx = pg.defectIdx;',
'for (const i of idx) {',
'  const img = xVal.slice([i, 0, 0, 0], [1, 64, 64, 1]).squeeze([0]);',
'  const cam = pg.upsample(gradCam(img));               // Grad-CAM stretched to 64 x 64',
'  const order = Array.from(cam.keys()).sort((a, b) => cam[b] - cam[a]);   // hottest pixel first',
'  hotImgs.push(pg.grayOut(img, order.slice(0, ____)));',
'  randImgs.push(pg.grayOut(img, pg.randomPixels(K, i)));',
'}',
'const s0 = Array.from(model.predict(tf.gather(xVal, idx)).dataSync());',
'const sHot = Array.from(model.predict(tf.stack(hotImgs)).dataSync());',
'const sRand = Array.from(model.predict(tf.stack(randImgs)).dataSync());',
'const dropHot = pg.mean(s0.map((s, j) => s - sHot[j]));',
'const dropRand = pg.mean(s0.map((s, j) => s - sRand[j]));',
"console.log('defects:', idx.length, '  drop (hottest 10%):', dropHot.toFixed(3), '  drop (random 10%):', dropRand.toFixed(3));"
  ].join('\n'),
  twin: [
'K = round(0.1 * 4096)                                  # 10% of the 4,096 pixels',
'def_idx = np.where(y_val == 1)[0]',
'rng = np.random.default_rng(0)',
'hot_imgs, rand_imgs = [], []',
'for i in def_idx:',
'    img = x_val[i]',
"    cam = tf.image.resize(grad_cam(img)[..., None], (64, 64), method='bilinear').numpy().ravel()",
'    hot = np.argsort(-cam)[:K]                         # hottest pixels first',
'    rnd = rng.choice(4096, K, replace=False)',
'    a = img.ravel().copy(); a[hot] = img.mean(); hot_imgs.append(a.reshape(64, 64, 1))',
'    b = img.ravel().copy(); b[rnd] = img.mean(); rand_imgs.append(b.reshape(64, 64, 1))',
's0 = model.predict(x_val[def_idx], verbose=0).ravel()',
'drop_hot = float((s0 - model.predict(np.array(hot_imgs), verbose=0).ravel()).mean())',
'drop_rand = float((s0 - model.predict(np.array(rand_imgs), verbose=0).ravel()).mean())',
"print('defects:', len(def_idx), '  drop (hottest 10%):', round(drop_hot, 3), '  drop (random 10%):', round(drop_rand, 3))"
  ].join('\n'),
  probe: async function (NS, pg, tf) {
    if (!NS.hotImgs || !('dropHot' in NS)) return { missing: ['hotImgs', 'dropHot'] };
    var img = cellOf(NS, NS.idx[0]), a = await img.data(), b = await NS.hotImgs[0].data(), changed = 0; img.dispose();
    for (var q = 0; q < 4096; q++) if (Math.abs(a[q] - b[q]) > 1e-7) changed++;
    var dh = NS.s0.map(function (s, j) { return s - NS.sHot[j]; }), dr = NS.s0.map(function (s, j) { return s - NS.sRand[j]; });
    var wins = dh.filter(function (v, j) { return v > dr[j]; }).length;
    return { K: NS.K, changed: changed, n: NS.idx.length, dropHot: NS.dropHot, dropRand: NS.dropRand, wins: wins, s0: pg.mean(NS.s0), dh: round3(dh), dr: round3(dr), rough: pg.rough };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell (4c must be done first).' };
    if (r.K !== 410) return { pass: false, msg: 'K = ' + r.K + ' pixels. 10% of 4,096 is about 410: write 10% as a fraction of 1.' };
    if (r.changed > r.K) return { pass: false, msg: 'Your “hottest” image has ' + r.changed + ' pixels grayed out, more than K = ' + r.K + '. Take only the first K of the hottest-first list.' };
    if (r.changed < 0.5 * r.K) return { pass: false, msg: 'Only ' + r.changed + ' pixels were grayed out. Take the first K (' + r.K + ') of the hottest-first list.' };
    return { pass: true, msg: 'Deletion test on ' + r.n + ' real defects: hottest 10% → score drops ' + f3(r.dropHot) + ' on average; random 10% → ' + f3(r.dropRand) + '.' };
  },
  example: '<p>A detective has a list of 50 clues, sorted from strongest to weakest. To test them, remove the <b>top 20%</b> and see if the case falls apart:</p><pre>const k = Math.round(0.2 * 50);          // 10 clues\nconst removed = clues.slice(0, k);</pre>',
  render: function (r, el, api) { V().deletion(r, el, api); },
  explain: function (r) { return {
    asked: 'Gray out the hottest 10% vs a random 10% of each defect photo and compare the score drops.',
    steps: ['10% of 4,096 pixels = ' + r.K + '. The hottest ' + r.K + ' come from the Grad-CAM map stretched to 64 × 64.',
            'On ' + r.n + ' real validation defects (average score ' + f3(r.s0) + ').',
            'Average drop: hottest ' + f3(r.dropHot) + ' vs random ' + f3(r.dropRand) + '. The hottest area hurt more on ' + r.wins + ' of ' + r.n + ' defects (' + pc(r.wins / r.n, 0) + ').',
            r.dropHot > 1.5 * r.dropRand && r.dropHot - r.dropRand > 0.03 ? 'So the map points at evidence the network really uses.' : 'The gap is small: the map is only partly honest. Do not over-trust it.'],
    trap: 'Graying out ALL pixels drops every score: that tells you nothing about the map.',
    remember: 'Test a heat map by removing what it calls important.' }; }
};

/* ================= 4e: slices ================= */
var s4e = { id: '4e', name: 'Where does it fail?', kind: 'code', lang: 'js',
  goal: 'An average can hide a weak spot. Split the validation cells into groups and count the mistakes in each group, at your Step 3 gates.',
  pre: { need: function (m) { return m.rows && m.rows.length === 2 ? null : 'drag the two useful chips into the table rows'; }, render: function (box, api) { V().slicePlay(box, api); } },
  task: [
    'Gap 1: a defect in the auto-pass lane is a defect passed by mistake. Type the lane name, with quotes, exactly as written in the code.',
    'Gap 2: the other cell type (the first is mono). Keep the quotes.'
  ],
  code: [
'// Count the lanes for one group of validation cells, at your Step 3 gates (low, high)',
'function lanesFor(keep) {                             // keep(i) is true for the cells in this group',
'  const g = { n: 0, def: 0, defPass: 0, ok: 0, okStop: 0, person: 0 };',
'  yVal.forEach((y, i) => {',
'    if (!keep(i)) return;',
"    const lane = pBlend[i] < low ? 'pass' : pBlend[i] >= Math.max(high, low) ? 'stop' : 'person';",
"    g.n++; if (lane === 'person') g.person++;",
"    if (y === 1) { g.def++; if (lane === ____) g.defPass++; }",
"    else { g.ok++; if (lane === 'stop') g.okStop++; }",
'  });',
'  return g;',
'}',
'',
"const mono = lanesFor((i) => pg.kind_val[i] === 'mono');",
'const poly = lanesFor((i) => pg.kind_val[i] === ____);',
'const sure = lanesFor((i) => pg.prob_val[i] === 0 || pg.prob_val[i] === 1);     // experts sure',
'const unsure = lanesFor((i) => pg.prob_val[i] > 0 && pg.prob_val[i] < 1);      // experts said 0.33 or 0.67',
"console.log('mono', mono, '\\npoly', poly, '\\nsure', sure, '\\nunsure', unsure);"
  ].join('\n'),
  twin: [
"kind_v, prob_v = kind[idx_val], prob[idx_val]",
"lane = np.where(p_blend < low, 'pass', np.where(p_blend >= max(high, low), 'stop', 'person'))",
'',
'def lanes_for(keep):',
'    d, g = keep & (y_val == 1), keep & (y_val == 0)',
"    return dict(n=int(keep.sum()), defects=int(d.sum()), defects_passed=int((d & (lane == 'pass')).sum()),",
"                good=int(g.sum()), good_stopped=int((g & (lane == 'stop')).sum()), person=int((keep & (lane == 'person')).sum()))",
'',
'sure = np.isin(prob_v, [0, 1])',
"for name, keep in [('mono', kind_v == 'mono'), ('poly', kind_v == 'poly'), ('sure', sure), ('unsure', ~sure)]:",
'    print(name, lanes_for(keep))'
  ].join('\n'),
  probe: async function (NS, pg) {
    var miss = ['mono', 'poly', 'sure', 'unsure', 'low', 'high', 'pBlend'].filter(function (k) { return !(k in NS); });
    if (miss.length) return { missing: miss };
    var y = pg.y_val, s = NS.pBlend, lo = NS.low, hi = Math.max(NS.high, NS.low);
    function ref(keep) { var g = { n: 0, def: 0, defPass: 0, ok: 0, okStop: 0, person: 0 }; y.forEach(function (v, i) { if (!keep(i)) return; var lane = s[i] < lo ? 'pass' : s[i] >= hi ? 'stop' : 'person'; g.n++; if (lane === 'person') g.person++; if (v === 1) { g.def++; if (lane === 'pass') g.defPass++; } else { g.ok++; if (lane === 'stop') g.okStop++; } }); return g; }
    var R = { mono: ref(function (i) { return pg.kind_val[i] === 'mono'; }), poly: ref(function (i) { return pg.kind_val[i] === 'poly'; }),
      sure: ref(function (i) { return pg.prob_val[i] === 0 || pg.prob_val[i] === 1; }), unsure: ref(function (i) { return pg.prob_val[i] > 0 && pg.prob_val[i] < 1; }) };
    var each = {}; Object.keys(R).forEach(function (k) { each[k] = JSON.stringify(R[k]) === JSON.stringify({ n: NS[k].n, def: NS[k].def, defPass: NS[k].defPass, ok: NS[k].ok, okStop: NS[k].okStop, person: NS[k].person }); });
    var same = Object.keys(each).every(function (k) { return each[k]; });
    return { same: same, each: each, mine: { mono: NS.mono, poly: NS.poly }, R: R, low: lo, high: NS.high, all: ref(function () { return true; }) };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run 3f and 3g first, then this whole cell.' };
    if (!(r.mine.poly && r.mine.poly.n) || (!r.each.poly && r.each.mono)) return { pass: false, msg: 'Your poly group is not the poly cells (' + ((r.mine.poly && r.mine.poly.n) || 0) + ' cells; there are ' + r.R.poly.n + '). The other cell type is written \'poly\', small letters, in quotes.' };
    if (!r.same) return { pass: false, msg: 'Your counts of defects passed by mistake do not match. A defect passes by mistake when its lane is the auto-pass lane: \'pass\'.' };
    return { pass: true, msg: 'Slice table ready: 4 groups counted at your gates (low ' + f3(r.low) + ', high ' + f3(r.high) + ').' };
  },
  example: '<p>A bus company checks lateness by <b>route</b> and by <b>weather</b>:</p><pre>const rainy = countFor((t) => trips[t].weather === \'rain\');\nif (status === \'late\') g.late++;</pre><p>Same counting rule, run once per group. Text values are compared in quotes.</p>',
  render: function (r, el, api) { V().sliceTable(r, el, api); },
  explain: function (r) { var R = r.R, d = function (g) { return g.def ? g.defPass / g.def : 0; }; return {
    asked: 'Count, per group, the defects passed by mistake, the good cells auto-stopped, and the cells sent to a person.',
    steps: ['The lane of each cell comes from your Step 3 gates: below ' + f3(r.low) + ' = pass, at or above ' + f3(Math.max(r.high, r.low)) + ' = stop, between = person.',
            'Mono: ' + R.mono.defPass + ' of ' + R.mono.def + ' defects passed (' + pc(d(R.mono), 0) + '). Poly: ' + R.poly.defPass + ' of ' + R.poly.def + ' (' + pc(d(R.poly), 0) + ').',
            'Experts sure: ' + pc(R.sure.person / R.sure.n, 0) + ' of cells to a person. Experts unsure: ' + pc(R.unsure.person / R.unsure.n, 0) + '.',
            'Small groups give shaky rates: ' + R.unsure.def + ' unsure defects and ' + R.poly.def + ' poly defects here.'],
    trap: 'One overall number (4.8% passed) can hide a group where far more slip through.',
    remember: 'Always split the mistakes by group before you trust a model.' }; }
};

/* ================= 4f: to-do list (no code) ================= */
var s4f = { id: '4f', name: 'Turn mistakes into a to-do list', kind: 'scene', scene: 'todo',
  goal: 'Look at the real mistakes with their heat maps. Put each one in an action box. There is no single right answer.',
  needText: 'sort every mistake into an action box, then tap “Done sorting”' };

var step4 = { id: 4, title: 'See what the model looks at', short: 'heat maps, deletion test, slices, to-do list',
  story: 'Before this model touches a real line, check that it stops cells for the right reason — the crack or the dark area — and not for the busbars, the border or the texture.',
  substeps: [s4a, s4b, s4c, s4d, s4e, s4f] };

var REF4 = { '4b': ['STEP', 'base'], '4c': ['2', 'w', 'relu'], '4d': ['0.1', 'K'], '4e': ["'pass'", "'poly'"] };
step4.substeps.forEach(function (s) { if (REF4[s.id]) s.ref = REF4[s.id]; });

G.PG_STEP4 = step4;
var prevExtra = G.PG_PG_EXTRA;
G.PG_PG_EXTRA = function (pg) { var o = prevExtra ? prevExtra(pg) : {}; return Object.assign(o, extra(pg)); };
G.PG_STEP4_heatInPaint = heatInPaint;
if (G.PG_STEPS) { var i4 = G.PG_STEPS.findIndex(function (s) { return s.id === 4; }); if (i4 >= 0) G.PG_STEPS[i4] = step4; }
})(typeof window !== 'undefined' ? window : globalThis);
