/* PanelGuard — course content. Engine reads window.PG_STEPS. Steps 3-8 plug in later as data. */
(function (G) {
'use strict';
var V = function () { return G.PGViz; };       // renderers live in viz.js (browser only)

/* ---------- shared probe helper (Python) ---------- */
var PY_HELP = [
'import json as _json, base64 as _b64m',
'def _pg_b64(a):',
'    import numpy as _np',
'    return _b64m.b64encode(_np.ascontiguousarray(a).astype(_np.uint8).tobytes()).decode()',
'def _pg_has(*names):',
'    return [n for n in names if n not in globals()]'
].join('\n');

/* ---------- STEP 0: no code ---------- */
var GAME = [6, 447, 245, 74, 23, 987, 96, 1, 11, 143, 49, 905];

var step0 = {
  id: 0, title: 'Meet the line', short: 'The EL camera station and the job',
  story: 'You run the last camera station of a solar module line. A current makes every cell glow. The camera takes one photo per cell. You must say PASS or STOP.',
  substeps: [
    { id: '0a', name: 'Walk the station', kind: 'scene',
      goal: 'Tap the four parts of the station to see what each one does.',
      needText: 'tap all 4 glowing parts of the station',
      scene: 'station' },
    { id: '0b', name: 'See real defects', kind: 'scene',
      goal: 'Flip each card. Compare a good cell with a bad one.',
      needText: 'flip all 6 photo cards',
      scene: 'defects',
      cards: [
        { id: 447, tag: 'Good mono cell', note: 'Even glow. The dark bars are the metal busbars. That is normal.' },
        { id: 74, tag: 'Good poly cell', note: 'Spotty glow is normal for poly cells (many small crystals). Tricky!' },
        { id: 6, tag: 'Crack', note: 'A thin dark line across the cell. Part of the cell may stop working later.' },
        { id: 23, tag: 'Dark (dead) area', note: 'A big dark blob: this part makes almost no power.' },
        { id: 1, tag: 'Finger breaks', note: 'Short dark dashes: thin metal fingers are broken, current cannot flow out.' },
        { id: 245, tag: 'Poly cell, broken part', note: 'Dark wedge on a poly cell. Harder to see in the noisy texture.' }
      ],
      honest: 'The data set gives only an expert defect score per cell, not the defect type. The type names here are our reading of each photo.' },
    { id: '0c', name: 'Weigh the two mistakes', kind: 'scene',
      goal: 'Drag each mistake to its cost.',
      needText: 'drag both mistake cards to the right cost',
      scene: 'mistakes' },
    { id: '0d', name: 'Inspect 12 cells', kind: 'scene',
      goal: 'You are the inspector. Tap PASS or STOP for each of 12 real cells.',
      needText: 'decide PASS or STOP for all 12 cells',
      scene: 'game', game: GAME }
  ]
};

/* ---------- STEP 1 ---------- */
var step1 = {
  id: 1, title: 'Get the data ready', short: 'numpy: load, count, label, split, scale',
  story: 'The factory saved 2,624 real EL photos from 44 modules. Experts marked each one. Make them ready for a model.',
  substeps: [
  { id: '1a', name: 'Load the pack', kind: 'code',
    goal: 'Read all photos into one numpy array X.',
    task: [
      'Gap 1: each pixel is one byte, 0 to 255, never below 0. Type the numpy type name for that (8-bit, unsigned).',
      'Gap 2: the file has 10,747,904 bytes. One photo is 64 × 64 = 4,096 bytes. Type how many photos that makes.'
    ],
    code: [
'import numpy as np',
'import json',
'',
'# 1. Read the pack: one long line of bytes, one byte per pixel',
"raw = np.fromfile('/data/cells64.u8', dtype=np.____)",
"print('values in the file:', raw.size)",
'',
'# 2. Cut the long line into photos: (photos, rows, columns)',
'X = raw.reshape(____, 64, 64)',
'',
'# 3. Read the expert labels',
"rows = json.load(open('/data/labels.json'))['rows']",
'cell_id = np.array([r[0] for r in rows])',
'prob    = np.array([r[1] for r in rows])   # 0, 0.33, 0.67 or 1.0',
'kind    = np.array([r[2] for r in rows])   # mono or poly',
'',
"print('X shape:', X.shape, '  type:', X.dtype)",
"print('darkest pixel:', X.min(), '  brightest pixel:', X.max())"
    ].join('\n'),
    probe: [
'_m = _pg_has("X", "prob", "kind", "cell_id")',
'if _m: _r = {"missing": _m}',
'else:',
'    _s = np.linspace(0, len(X) - 1, 96).astype(int)',
'    _r = {"shape": list(X.shape), "dtype": str(X.dtype), "min": int(X.min()), "max": int(X.max()),',
'          "n_labels": int(len(prob)),',
'          "thumbs": _pg_b64(X[_s]) if X.ndim == 3 and X.shape[1:] == (64, 64) and str(X.dtype) == "uint8" else None,',
'          "ids": [int(cell_id[i]) for i in _s], "probs": [float(prob[i]) for i in _s], "kinds": [str(kind[i]) for i in _s]}'
    ].join('\n'),
    check: function (r) {
      if (r.missing) return { pass: false, msg: 'These names are missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
      if (r.dtype !== 'uint8') return { pass: false, msg: 'X has type ' + r.dtype + '. One pixel = one byte from 0 to 255. Which numpy type is that?' };
      if (r.min < 0) return { pass: false, msg: 'Some pixels are below 0. Pixels are never negative.' };
      if (r.shape.join(',') !== '2624,64,64') return { pass: false, msg: 'X shape is (' + r.shape.join(', ') + '). We need (photos, 64, 64) with every photo used.' };
      if (r.n_labels !== r.shape[0]) return { pass: false, msg: 'Photos and labels do not match: ' + r.shape[0] + ' photos, ' + r.n_labels + ' labels.' };
      return { pass: true, msg: 'X holds ' + r.shape[0] + ' photos of 64 × 64 pixels, values ' + r.min + ' to ' + r.max + '.' };
    },
    example: '<p>A small test file holds <b>5 photos</b> of <b>10 × 10</b> pixels, each pixel stored as a signed 16-bit number.</p>' +
      '<pre>raw = np.fromfile(\'demo.bin\', dtype=np.int16)\nprint(raw.size)            # 500\nimgs = raw.reshape(5, 10, 10)   # 500 / (10*10) = 5</pre>' +
      '<p>The type tells numpy how many bytes make one number. The first number in reshape = total values ÷ values per photo.</p>',
    render: function (r, el, api) { V().wall(r, el, api); },
    mechNeed: function (m) { return (m && m.opened >= 2) ? null : 'tap 2 photos on the wall to look closely'; },
    explain: function (r) { return {
      asked: 'Read the byte file into a 3-D array: photos × rows × columns.',
      steps: ['Each pixel is one byte from 0 to 255 → <code>np.uint8</code> (unsigned 8-bit).',
              'The file has ' + (r.shape[0] * 4096).toLocaleString() + ' values. One photo = 64 × 64 = 4,096 values.',
              (r.shape[0] * 4096).toLocaleString() + ' ÷ 4,096 = <b>' + r.shape[0] + '</b> photos → <code>reshape(' + r.shape[0] + ', 64, 64)</code>.',
              'Pixel range we got: ' + r.min + ' to ' + r.max + '. Bright = cell glows = makes power.'],
      trap: '<code>np.int8</code> reads 200 as −56 (signed). <code>np.float32</code> eats 4 bytes per number, so the count is wrong and reshape fails.',
      remember: 'dtype says how to read the bytes; shape says how to cut them.' }; }
  },
  { id: '1b', name: 'Count the cells', kind: 'code',
    goal: 'Count OK vs defect, mono vs poly, and the cells where experts were not sure.',
    predict: { format: 'number', unit: '%',
      q: 'Before you run: a lazy model says <b>OK for every cell</b>. What accuracy (percent of cells it gets right) will it score? Type a whole number.',
      answer: function (D) { return 100 * D.nOk / D.n; }, tol: 1.5,
      reveal: function (D) { return { asked: 'Accuracy of a model that never says defect.',
        steps: ['A cell is a defect when experts gave 0.67 or 1.0. That is ' + D.nDef + ' of ' + D.n + ' cells.',
                'The lazy model is right on every OK cell: ' + D.nOk + ' cells.',
                D.nOk + ' ÷ ' + D.n + ' = <b>' + (100 * D.nOk / D.n).toFixed(1) + '%</b> accuracy.',
                'But it catches 0 of ' + D.nDef + ' defects: recall = 0%. Every bad cell ships.'],
        trap: 'A high accuracy looks good but can hide a model that catches nothing.',
        remember: 'Judge an inspector by defects caught (recall), not by accuracy.' }; } },
    task: [
      'Gap 1: type the cell type to count (the other one is poly). Keep the quotes.',
      'Gap 2: the experts were unsure when they gave 0.33 or one more value. Type that value.'
    ],
    code: [
'n = len(prob)',
'n_defect = int((prob >= 0.5).sum())      # experts said 0.67 or 1.0',
'n_ok = n - n_defect',
'',
"n_mono = int((kind == '____').sum())",
'n_poly = n - n_mono',
'',
'n_unsure = int(np.isin(prob, [0.33, ____]).sum())',
'',
'lazy_accuracy = n_ok / n                 # a model that always says OK',
"print('OK:', n_ok, ' defect:', n_defect)",
"print('mono:', n_mono, ' poly:', n_poly, ' experts unsure:', n_unsure)",
"print('lazy model accuracy: %.1f%%  but it catches 0 defects' % (100 * lazy_accuracy))"
    ].join('\n'),
    probe: [
'_m = _pg_has("n_ok", "n_defect", "n_mono", "n_poly", "n_unsure")',
'if _m: _r = {"missing": _m}',
'else:',
'    _r = {"n": int(n), "ok": int(n_ok), "defect": int(n_defect), "mono": int(n_mono), "poly": int(n_poly), "unsure": int(n_unsure),',
'          "true_mono": int((kind == "mono").sum()), "true_unsure": int(np.isin(prob, [0.33, 0.67]).sum()),',
'          "grid": {f"{t}|{p}": int(((kind == t) & (prob == p)).sum()) for t in ["mono", "poly"] for p in [0.0, 0.33, 0.67, 1.0]}}'
    ].join('\n'),
    check: function (r) {
      if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
      if (r.mono !== r.true_mono) return { pass: false, msg: 'n_mono = ' + r.mono + '. That is not the mono count. Type the word exactly as in the labels: all small letters.' };
      if (r.unsure !== r.true_unsure) return { pass: false, msg: 'n_unsure = ' + r.unsure + '. The unsure values are the two in the middle of 0, 0.33, ?, 1.0.' };
      return { pass: true, msg: r.ok + ' OK, ' + r.defect + ' defect, ' + r.unsure + ' unsure cells.' };
    },
    example: '<p>Another lot: <code>colour = np.array([\'red\',\'blue\',\'red\'])</code>, <code>score = np.array([0.1, 0.5, 0.9])</code>.</p>' +
      '<pre>n_red = int((colour == \'red\').sum())          # 2\nn_mid = int(np.isin(score, [0.4, 0.5]).sum())  # 1</pre>' +
      '<p><code>==</code> gives True/False per item; <code>.sum()</code> counts the Trues.</p>',
    render: function (r, el, api) { V().unitChart(r, el, api); },
    explain: function (r) { return {
      asked: 'Count cells by label, by cell type, and the unsure ones.',
      steps: ['<code>kind == \'mono\'</code> gives True for each mono cell; summing gives <b>' + r.mono + '</b>. Poly = ' + r.n + ' − ' + r.mono + ' = ' + r.poly + '.',
              'Unsure = experts gave 0.33 or 0.67: <b>' + r.unsure + '</b> cells (' + (100 * r.unsure / r.n).toFixed(0) + '% of all).',
              'Defects: ' + r.defect + ' of ' + r.n + ' = ' + (100 * r.defect / r.n).toFixed(1) + '%. Most cells are OK.'],
      trap: 'Labels are not perfect truth. ' + r.unsure + ' cells had expert doubt. A model will also struggle there.',
      remember: 'Count first. Know how rare the thing you hunt is.' }; }
  },
  { id: '1c', name: 'Make the label', kind: 'code',
    goal: 'Turn the expert score into a yes/no label y: 1 = defect, 0 = OK.',
    task: ['Gap 1: type the cut value. Cells at or above it are defects. Our rule: 0.67 and 1.0 are defects; 0 and 0.33 are OK. Pick a number between them.'],
    code: [
'# 1 = defect, 0 = OK',
'y = (prob >= ____).astype(int)',
'',
"print('defect cells:', y.sum(), '  OK cells:', len(y) - y.sum())"
    ].join('\n'),
    probe: [
'_m = _pg_has("y")',
'if _m: _r = {"missing": _m}',
'else:',
'    _r = {"n_def": int(np.asarray(y).sum()), "n": int(len(y)), "uniq": sorted(set(int(v) for v in np.unique(y))),',
'          "bins": [int((prob == p).sum()) for p in [0.0, 0.33, 0.67, 1.0]]}'
    ].join('\n'),
    check: function (r) {
      if (r.missing) return { pass: false, msg: 'y is missing. Run the cell.' };
      var want = r.bins[2] + r.bins[3];
      if (r.uniq.join() !== '0,1') return { pass: false, msg: r.uniq.length === 1 ? 'y must hold 0 (good) and 1 (defect). Now EVERY cell gets ' + r.uniq[0] + ': your cut puts all cells on one side. Move your cut.' : 'y must hold only 0 and 1. Now it holds: ' + r.uniq.join(', ') + '.' };
      if (r.n_def !== want) return { pass: false, msg: 'y marks ' + r.n_def + ' defects. Our rule (0.67 and 1.0) gives ' + want + '. Move your cut.' };
      return { pass: true, msg: 'y marks ' + r.n_def + ' defects and ' + (r.n - r.n_def) + ' OK cells.' };
    },
    example: '<p>Exam marks <code>m = np.array([35, 50, 72, 90])</code>. Pass mark: 40 or more.</p><pre>passed = (m >= 40).astype(int)   # [0, 1, 1, 1]</pre>',
    render: function (r, el, api) { V().binLine(r, el, api); },
    mechNeed: function (m) { return (m && m.moves >= 2) ? null : 'drag the yellow line to two other places'; },
    explain: function (r) { return {
      asked: 'Make y = 1 when the expert score is 0.67 or 1.0.',
      steps: ['Scores come in 4 bins: 0 (' + r.bins[0] + '), 0.33 (' + r.bins[1] + '), 0.67 (' + r.bins[2] + '), 1.0 (' + r.bins[3] + ').',
              'Any cut above 0.33 and up to 0.67 splits them the same way, e.g. 0.5.',
              'Defects = ' + r.bins[2] + ' + ' + r.bins[3] + ' = <b>' + (r.bins[2] + r.bins[3]) + '</b>.'],
      trap: 'Cut at 0.33 and you add ' + r.bins[1] + ' doubtful cells as defects. Cut at 1.0 and you drop ' + r.bins[2] + ' real ones.',
      remember: 'The label is a choice. Write the rule down.' }; }
  },
  { id: '1d', name: 'Split the data', kind: 'code',
    goal: 'Split cells into three trays: train 60%, validation 20%, test 20%. Same defect share in each.',
    task: ['Gap 1: tell train_test_split to keep the same defect share in each tray. Type the label array name.'],
    code: [
'from sklearn.model_selection import train_test_split',
'',
'idx = np.arange(len(y))              # cell numbers 0 .. 2623',
'',
'# 60% train, 40% rest -- keep the defect share equal',
'idx_train, idx_rest = train_test_split(idx, test_size=0.4, stratify=____, random_state=42)',
'',
'# rest -> 20% validation, 20% test',
'idx_val, idx_test = train_test_split(idx_rest, test_size=0.5, stratify=y[idx_rest], random_state=42)',
'',
'for name, part in [("train", idx_train), ("validation", idx_val), ("test", idx_test)]:',
"    print(f'{name:11s} {len(part):5d} cells   defects: {y[part].mean():.1%}')"
    ].join('\n'),
    probe: [
'_m = _pg_has("idx_train", "idx_val", "idx_test")',
'if _m: _r = {"missing": _m}',
'else:',
'    from sklearn.model_selection import train_test_split as _tts',
'    _a, _b = _tts(np.arange(len(y)), test_size=0.4, stratify=y, random_state=42)',
'    _c, _d = _tts(_b, test_size=0.5, stratify=y[_b], random_state=42)',
'    _r = {"sizes": [len(idx_train), len(idx_val), len(idx_test)],',
'          "defects": [int(y[idx_train].sum()), int(y[idx_val].sum()), int(y[idx_test].sum())],',
'          "overlap": int(len(set(idx_train) & set(idx_val)) + len(set(idx_train) & set(idx_test)) + len(set(idx_val) & set(idx_test))),',
'          "same": bool(np.array_equal(np.sort(idx_train), np.sort(_a)) and np.array_equal(np.sort(idx_val), np.sort(_c)))}',
'def _pg_dice(seed):',
'    from sklearn.model_selection import train_test_split as _tts',
'    a, b = _tts(np.arange(len(y)), test_size=0.4, random_state=seed)',
'    c, d = _tts(b, test_size=0.5, random_state=seed)',
'    return {"seed": seed, "share": [float(y[a].mean()), float(y[c].mean()), float(y[d].mean())]}'
    ].join('\n'),
    check: function (r) {
      if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the cell.' };
      if (r.overlap) return { pass: false, msg: r.overlap + ' cells sit in two trays. Trays must not share cells.' };
      if (!r.same) return { pass: false, msg: 'The trays are not split by the label. Defect share per tray: ' +
        r.defects.map(function (d, i) { return (100 * d / r.sizes[i]).toFixed(1) + '%'; }).join(' / ') + '. Stratify on the label you made in 1c.' };
      return { pass: true, msg: 'Trays: ' + r.sizes.join(' / ') + ' cells, defect share equal.' };
    },
    example: '<p>Split 100 patients into two groups so each group has the same share of sick people (array <code>sick</code>):</p>' +
      '<pre>a, b = train_test_split(ids, test_size=0.3,\n                        stratify=sick, random_state=7)</pre>',
    render: function (r, el, api) { V().trays(r, el, api); },
    mechNeed: function (m) { return (m && m.rolls >= 3) ? null : 'roll the "shuffle without stratify" dice 3 times'; },
    explain: function (r) { return {
      asked: 'Split into 60 / 20 / 20 with the same defect share in each tray.',
      steps: ['2,624 × 0.6 ≈ ' + r.sizes[0] + ' train. The other ' + (r.sizes[1] + r.sizes[2]) + ' are halved: ' + r.sizes[1] + ' validation, ' + r.sizes[2] + ' test.',
              '<code>stratify=y</code> keeps defects at ' + (100 * r.defects[0] / r.sizes[0]).toFixed(1) + '% / ' + (100 * r.defects[1] / r.sizes[1]).toFixed(1) + '% / ' + (100 * r.defects[2] / r.sizes[2]).toFixed(1) + '%.',
              'random_state=42 makes the same split every run, so numbers can be checked.',
              'Train = learn. Validation = choose settings. Test = sealed, opened once at the very end (Step 8).'],
      trap: 'Without stratify the share drifts by luck. Tuning on the test tray makes your final score a lie.',
      remember: 'Seal the test tray. Open it once.' }; }
  },
  { id: '1e', name: 'Scale and flatten', kind: 'code',
    goal: 'Make pixels 0 to 1, and make each photo one long row of numbers.',
    task: ['Gap 1: type the number to divide by so that the brightest pixel (255) becomes 1.0.',
           'Gap 2: type how many numbers one flat photo has (64 × 64).'],
    code: [
'Xs = X.astype(np.float32) / ____        # 0..255  ->  0..1',
'',
'Xflat = Xs.reshape(len(Xs), ____)       # one row per photo',
'',
"print('smallest:', Xs.min(), ' largest:', Xs.max())",
"print('Xflat shape:', Xflat.shape)"
    ].join('\n'),
    probe: [
'_m = _pg_has("Xs", "Xflat")',
'if _m: _r = {"missing": _m}',
'else:',
'    _k = int(np.where(cell_id == 6)[0][0])',
'    _r = {"min": float(Xs.min()), "max": float(Xs.max()), "flat": list(Xflat.shape), "dtype": str(Xs.dtype),',
'          "cell": int(cell_id[_k]), "prob": float(prob[_k]), "grid": np.round(Xs[_k], 2).ravel().tolist()}'
    ].join('\n'),
    check: function (r) {
      if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the cell.' };
      if (Math.abs(r.max - 1) > 1e-6) return { pass: false, msg: 'The largest value is ' + r.max.toFixed(4) + '. It must be exactly 1.0. 255 ÷ ? = 1.' };
      if (r.flat.join() !== '2624,4096') return { pass: false, msg: 'Xflat shape is (' + r.flat.join(', ') + '). One photo has 64 × 64 numbers.' };
      return { pass: true, msg: 'Pixels now run 0 to 1. Xflat is 2,624 rows × 4,096 numbers.' };
    },
    example: '<p>Exam marks out of 80: <code>m / 80</code> puts them on 0..1. A 3-photo stack of 5 × 5: <code>imgs.reshape(3, 25)</code>.</p>',
    render: function (r, el, api) { V().lens(r, el, api); },
    mechNeed: function (m) { return (m && m.found) ? null : 'drag the lens until it covers the darkest pixel of the cell'; },
    explain: function (r) { return {
      asked: 'Scale to 0..1 and flatten each photo.',
      steps: ['Brightest pixel 255 ÷ <b>255</b> = 1.0. Darkest stays ' + r.min.toFixed(2) + '.',
              '64 × 64 = <b>4,096</b> numbers per photo → Xflat is (2624, 4096).',
              'On cell ' + r.cell + ' the crack and busbars are the small numbers. A model only ever sees these numbers.'],
      trap: 'Dividing by 256 gives max 0.996, not 1. Reshape with 64 keeps the wrong count and fails.',
      remember: 'To a model a photo is just a row of numbers.' }; }
  }
  ]
};

/* ---------- STEP 2 ---------- */
var step2 = {
  id: 2, title: 'First inspector with scikit-learn', short: 'features, 3 models, cutoff, report card',
  story: 'Build a first automatic inspector with classic machine learning. Goal: stop at least 95 of every 100 defective cells. Then count the cost honestly.',
  substeps: [
  { id: '2a', name: 'Build the features', kind: 'code',
    goal: 'Turn each photo into numbers that matter. Then measure which mix works best.',
    task: ['Gap 1: PCA must learn only from the train tray. Type the name of the train index array.',
           'Then use the chips on the right: measure at least 3 mixes, and keep the best one.'],
    code: [
'from sklearn.decomposition import PCA',
'',
'# A. Line finder: in each 16x16 box, how strong the edges are in 9 directions',
'#    (cracks and broken fingers are sharp dark lines)',
'def line_finder(imgs, box=16, bins=9):',
'    gx = np.zeros_like(imgs); gy = np.zeros_like(imgs)',
'    gx[:, :, 1:-1] = imgs[:, :, 2:] - imgs[:, :, :-2]     # change left -> right',
'    gy[:, 1:-1, :] = imgs[:, 2:, :] - imgs[:, :-2, :]     # change top -> bottom',
'    strength = np.hypot(gx, gy)',
'    angle = np.minimum((np.arctan2(gy, gx) % np.pi) / np.pi * bins, bins - 1).astype(int)',
'    n, h, w = imgs.shape; g = h // box',
'    H = np.stack([np.where(angle == k, strength, 0).reshape(n, g, box, g, box).sum(axis=(2, 4))',
'                  for k in range(bins)], axis=-1)',
'    H /= np.linalg.norm(H, axis=3, keepdims=True) + 1e-3',
'    return H.reshape(n, -1)                    # 4 x 4 boxes x 9 directions = 144',
'',
'# B. Dark map: how dark each row, each column and each 8x8 patch is',
'def dark_map(imgs):',
'    n = len(imgs)',
'    rows = imgs.mean(axis=2)                   # 64 row averages',
'    cols = imgs.mean(axis=1)                   # 64 column averages',
'    dark = imgs < imgs.mean(axis=(1, 2), keepdims=True) - 0.15',
'    patches = dark.reshape(n, 8, 8, 8, 8).mean(axis=(2, 4)).reshape(n, -1)   # 64',
'    spread = imgs.std(axis=(1, 2))[:, None]    # 1',
'    return np.hstack([rows, cols, patches, spread])                        # 193',
'',
'# C. Pixel summary: shrink to 32x32, then PCA squeezes 1,024 pixels into 40 numbers',
'small = Xflat.reshape(len(Xflat), 32, 2, 32, 2).mean(axis=(2, 4)).reshape(len(Xflat), -1)',
"pca = PCA(n_components=40, svd_solver='full', random_state=0)",
'pca.fit(small[____])                 # learn the summary from the TRAIN tray only',
'',
'A = line_finder(Xs)',
'B = dark_map(Xs)',
'C = pca.transform(small)',
'F = np.hstack([A, B, C])',
"print('line finder', A.shape, ' dark map', B.shape, ' pixel summary', C.shape, ' -> F', F.shape)",
'',
'# quick measure: 3-fold ranking score (ROC AUC) on the TRAIN tray only',
'from sklearn.svm import SVC',
'from sklearn.pipeline import make_pipeline',
'from sklearn.preprocessing import StandardScaler',
'from sklearn.model_selection import StratifiedKFold, cross_val_score',
'def quick_score(F_try):',
'    pipe = make_pipeline(StandardScaler(), SVC(C=3))',
'    s = cross_val_score(pipe, F_try[idx_train], y[idx_train], scoring="roc_auc",',
'                        cv=StratifiedKFold(3, shuffle=True, random_state=0))',
'    return round(float(s.mean()), 3)'
    ].join('\n'),
    probe: [
'_m = _pg_has("A", "B", "C", "F", "pca", "quick_score")',
'if _m: _r = {"missing": _m}',
'else:',
'    _r = {"A": list(A.shape), "B": list(B.shape), "C": list(C.shape), "F": list(F.shape),',
'          "pca_n": int(getattr(pca, "n_samples_", -1)), "n_train": int(len(idx_train)), "n_val": int(len(idx_val)),',
'          "var": round(float(pca.explained_variance_ratio_.sum()), 3),',
'          "nan": bool(np.isnan(F).any()),',
'          "fit_train": bool(getattr(pca, "n_samples_", -1) == len(idx_train) and np.allclose(pca.mean_, small[idx_train].mean(axis=0), atol=1e-5))}',
'_PG_BLOCKS = {"A": "A", "B": "B", "C": "C", "R": "Xflat"}',
'def _pg_mix(keys):',
'    import time as _t',
'    t = _t.time(); M = np.hstack([globals()[_PG_BLOCKS[k]] for k in keys])',
'    return {"keys": keys, "auc": quick_score(M), "dims": int(M.shape[1]), "sec": round(_t.time() - t, 1)}'
    ].join('\n'),
    check: function (r) {
      if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the cell.' };
      if (!r.fit_train) {
        if (r.pca_n === 2624) return { pass: false, msg: 'PCA learned from all 2,624 cells, including validation and test. That leaks. Use the train tray only.' };
        if (r.pca_n === r.n_val) return { pass: false, msg: 'PCA learned from ' + r.pca_n + ' cells: that is a validation or test tray. Use the train tray.' };
        return { pass: false, msg: 'PCA learned from ' + r.pca_n + ' cells. It must learn from the ' + r.n_train + ' train cells.' };
      }
      if (r.nan) return { pass: false, msg: 'F has empty (NaN) values.' };
      return { pass: true, msg: 'Features ready: ' + r.F[1] + ' numbers per cell. PCA keeps ' + Math.round(r.var * 100) + '% of the pixel variation.' };
    },
    example: '<p>A shop learns "typical basket size" from <b>last year</b> only, then uses it on this year:</p>' +
      '<pre>scaler.fit(sales[idx_lastyear])\nz = scaler.transform(sales)</pre><p>Learn from the training part; apply to every part.</p>',
    render: function (r, el, api) { V().chips(r, el, api); },
    mechNeed: function (m) { return (m && m.mixes >= 3 && m.kept) ? null : (!m || m.mixes < 3 ? 'measure at least 3 different feature mixes with the chips (' + ((m && m.mixes) || 0) + ' done)' : 'tap "Use this mix" on the mix you keep'); },
    explain: function (r, m) { return {
      asked: 'Make features, fit PCA on train only, and pick a mix by measurement.',
      steps: ['Line finder: 4 × 4 boxes × 9 directions = ' + r.A[1] + ' numbers. Dark map: 64 + 64 + 64 + 1 = ' + r.B[1] + '. PCA: ' + r.C[1] + '.',
              '<code>pca.fit(small[idx_train])</code> learns from ' + r.n_train + ' cells only; then it transforms all 2,624.',
              (m && m.best ? 'Your best measured mix: <b>' + m.best.keys.join(' + ') + '</b>, ranking score ' + m.best.auc + '.' : 'The chips gave a real score for each mix.')],
      trap: 'Fitting PCA on all cells lets the model peek at validation and test photos. Scores then look better than they will be on the line.',
      remember: 'Anything that learns from data learns from train only.' }; }
  },
  { id: '2b', name: 'Train three inspectors', kind: 'code',
    goal: 'Train 3 kinds of model. Score each with 5-fold cross-validation on the train tray.',
    predict: { format: 'bet', q: 'Before you run: which model will get the best score? Tap one card to bet.',
      options: ['Logistic regression', 'Random forest', 'SVC (RBF)'] },
    task: ['Gap 1: type the number of folds (the plan says 5).',
           'Gap 2: the labels must be the same cells as the features. Type the train index array name.'],
    code: [
'from sklearn.pipeline import Pipeline',
'from sklearn.linear_model import LogisticRegression',
'from sklearn.ensemble import RandomForestClassifier',
'import time',
'',
'models = {',
"    'Logistic regression': LogisticRegression(C=0.1, max_iter=2000),",
"    'Random forest':       RandomForestClassifier(n_estimators=100, random_state=0),",
"    'SVC (RBF)':           SVC(C=3, probability=True, random_state=0),",
'}',
'folds = StratifiedKFold(n_splits=____, shuffle=True, random_state=0)',
'',
'scores, seconds = {}, {}',
'for name, model in models.items():',
"    pipe = Pipeline([('scale', StandardScaler()), ('model', model)])",
'    t = time.time()',
"    s = cross_val_score(pipe, F[idx_train], y[____], cv=folds, scoring='roc_auc')",
'    scores[name], seconds[name] = s, time.time() - t',
"    print(f'{name:20s} ranking score {s.mean():.3f}  (folds: {np.round(s, 3)})  {seconds[name]:.0f}s')",
'',
'best_name = max(scores, key=lambda k: scores[k].mean())',
"best = Pipeline([('scale', StandardScaler()), ('model', models[best_name])])",
'best.fit(F[idx_train], y[idx_train])',
"print('best:', best_name)"
    ].join('\n'),
    probe: [
'_m = _pg_has("scores", "best", "best_name", "folds")',
'if _m: _r = {"missing": _m}',
'else:',
'    _r = {"k": int(folds.get_n_splits()), "best": best_name,',
'          "models": [{"name": k, "folds": [round(float(v), 3) for v in s], "mean": round(float(s.mean()), 3), "sec": round(float(seconds.get(k, 0)), 1)} for k, s in scores.items()],',
'          "fitted_on": int(getattr(best, "n_features_in_", -1)), "F_cols": int(F.shape[1])}'
    ].join('\n'),
    check: function (r) {
      if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the cell.' };
      if (r.k !== 5) return { pass: false, msg: 'You used ' + r.k + ' folds. The plan says 5.' };
      if (r.models.length < 3) return { pass: false, msg: 'Only ' + r.models.length + ' models were scored. Keep all three.' };
      return { pass: true, msg: 'Best: ' + r.best + ' with ranking score ' + r.models.filter(function (x) { return x.name === r.best; })[0].mean + '.' };
    },
    example: '<p>Score a model on 4 folds of a <b>price</b> data set:</p><pre>cv = KFold(n_splits=4, shuffle=True, random_state=1)\ns = cross_val_score(model, P[idx_fit], price[idx_fit], cv=cv)</pre><p>Features and target use the <b>same</b> rows.</p>',
    render: function (r, el, api) { V().race(r, el, api); },
    explain: function (r) {
      var b = r.models.slice().sort(function (a, c) { return c.mean - a.mean; });
      return {
      asked: 'Score 3 models fairly with 5-fold cross-validation on train only.',
      steps: ['Each model is trained 5 times; each time 1/5 of the train tray is held out and scored.',
              'Mean ranking scores: ' + b.map(function (x) { return x.name + ' ' + x.mean; }).join(', ') + '.',
              'The best, <b>' + r.best + '</b>, is then trained once on the whole train tray.'],
      trap: '<code>y[idx_val]</code> with <code>F[idx_train]</code> pairs photos with the wrong labels (and the lengths differ).',
      remember: 'Compare models on folds of train. Keep validation for later choices.' }; }
  },
  { id: '2c', name: 'Read scores, not verdicts', kind: 'code',
    goal: 'Get a defect score (0 to 1) for each validation cell. Then you choose the cutoff.',
    task: ['Gap 1: predict_proba gives two columns: [chance of OK, chance of defect]. Type the column number for defect.',
           'Then drag the gate on the right until at least 95 of 100 defects are stopped.'],
    code: [
'p_val = best.predict_proba(F[idx_val])[:, ____]     # defect score per cell',
'y_val = y[idx_val]',
'',
"print('validation cells:', len(p_val), '  real defects:', y_val.sum())",
"print('first 5 scores:', np.round(p_val[:5], 2))"
    ].join('\n'),
    probe: [
'_m = _pg_has("p_val", "y_val")',
'if _m: _r = {"missing": _m}',
'else:',
'    from sklearn.metrics import roc_auc_score as _auc',
'    _ref = best.predict_proba(F[idx_val])[:, 1]',
'    _r = {"same": bool(len(p_val) == len(_ref) and np.allclose(p_val, _ref)), "auc": round(float(_auc(y_val, p_val)), 3),',
'          "cells": [[int(cell_id[i]), round(float(s), 4), int(t), float(prob[i]), str(kind[i])] for i, s, t in zip(idx_val, p_val, y_val)]}'
    ].join('\n'),
    check: function (r) {
      if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the cell.' };
      if (!r.same) return { pass: false, msg: 'These are not the defect scores. With them, defects get LOWER scores (ranking score ' + r.auc + '). Pick the other column.' };
      return { pass: true, msg: r.cells.length + ' validation cells scored. Ranking score ' + r.auc + '.' };
    },
    example: '<p>A spam filter: <code>proba = clf.predict_proba(M)</code> gives columns [not spam, spam] in the order of <code>clf.classes_</code> = [0, 1]. The spam chance is <code>proba[:, 1]</code>; for a 3-class model the third class is <code>[:, 2]</code>.</p>',
    render: function (r, el, api) { V().gate(r, el, api); },
    mechNeed: function (m) { return (m && m.hit) ? null : 'drag the gate until recall reaches 95% or more'; },
    explain: function (r, m) { return {
      asked: 'Take the defect column of predict_proba for the validation cells.',
      steps: ['<code>best.classes_</code> is [0, 1], so column 1 = chance of defect.',
              'Ranking score on validation: ' + r.auc + ' (1.0 = every defect above every good cell).',
              (m && m.hitAt != null ? 'You reached 95% recall with the gate at ' + m.hitAt.toFixed(2) + ', and saw how many good cells got stopped with them.' : '')],
      trap: 'Column 0 is the chance of OK; using it turns the inspector upside down.',
      remember: 'A model gives a score. You choose where to stop.' }; }
  },
  { id: '2d', name: 'Hit the target', kind: 'code',
    goal: 'Let code find the highest cutoff that still catches 95% of defects.',
    predict: { format: 'chart', q: 'Before you run: tap on the line where you think the answer will be (the highest cutoff with recall ≥ 95%).' },
    task: ['Gap 1: write the target as a fraction (95% of 1).'],
    code: [
'from sklearn.metrics import precision_recall_curve',
'',
'precision, recall, cutoffs = precision_recall_curve(y_val, p_val)',
'',
'ok = recall[:-1] >= ____        # cutoffs that keep the target',
'cut = cutoffs[ok].max()        # the highest one stops the fewest good cells',
'',
"print('cutoff:', round(float(cut), 3))",
"print('recall at cutoff:', round(float(recall[:-1][cutoffs == cut][0]), 3))"
    ].join('\n'),
    probe: [
'_m = _pg_has("cut", "p_val", "y_val")',
'if _m: _r = {"missing": _m}',
'else:',
'    _pr, _rc, _th = precision_recall_curve(y_val, p_val)',
'    _best = float(_th[_rc[:-1] >= 0.95].max())',
'    _pred = p_val >= cut',
'    _r = {"cut": float(cut), "best": _best, "rec": float((_pred & (y_val == 1)).sum() / y_val.sum()),',
'          "prec": float((_pred & (y_val == 1)).sum() / max(1, _pred.sum())),',
'          "curve": [[round(float(t), 4), round(float(r), 4), round(float(p), 4)] for t, r, p in zip(_th, _rc[:-1], _pr[:-1])]}'
    ].join('\n'),
    preProbe: [
'from sklearn.metrics import precision_recall_curve',
'_pr, _rc, _th = precision_recall_curve(y_val, p_val)',
'_r = {"curve": [[round(float(t), 4), round(float(r), 4), round(float(p), 4)] for t, r, p in zip(_th, _rc[:-1], _pr[:-1])]}'
    ].join('\n'),
    check: function (r) {
      if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the cell.' };
      if (r.rec < 0.95) return { pass: false, msg: 'At your cutoff ' + r.cut.toFixed(3) + ' recall is only ' + (100 * r.rec).toFixed(1) + '%. The target is 95%.' };
      if (Math.abs(r.cut - r.best) > 1e-9) return { pass: false, msg: 'Recall is fine, but cutoff ' + r.cut.toFixed(3) + ' is not the highest one that keeps 95%. You stop more good cells than needed.' };
      return { pass: true, msg: 'Cutoff ' + r.cut.toFixed(3) + ' keeps recall ' + (100 * r.rec).toFixed(1) + '%.' };
    },
    example: '<p>A smoke alarm must catch 90% of real fires. With arrays <code>catch_rate</code> and <code>level</code>:</p><pre>good = catch_rate[:-1] >= 0.90\nlevel_to_use = level[good].max()</pre>',
    render: function (r, el, api) { V().target(r, el, api); },
    explain: function (r, m) { return {
      asked: 'Find the highest cutoff where recall is still at least 0.95.',
      steps: ['precision_recall_curve tries every cutoff and gives recall at each.',
              '<code>recall[:-1] >= 0.95</code> keeps the cutoffs that hit the target (the last recall value has no cutoff).',
              'The highest of them is <b>' + r.cut.toFixed(3) + '</b>: recall ' + (100 * r.rec).toFixed(1) + '%, precision ' + (100 * r.prec).toFixed(1) + '%.',
              (m && m.guess != null ? 'Your guess was ' + m.guess.toFixed(2) + '.' : '')],
      trap: 'Typing 95 instead of 0.95: recall is never above 1, so nothing is kept and <code>.max()</code> fails.',
      remember: 'Fix the recall you need, then take the highest cutoff that keeps it.' }; }
  },
  { id: '2e', name: 'Write the report card', kind: 'code',
    goal: 'Count every hit and every mistake at your cutoff. Validation only: the test tray stays sealed.',
    task: ['Gap 1: type the variable that holds your cutoff from 2d.',
           'Gap 2: the false-alarm rate = good cells stopped ÷ all good cells. All good cells = fp + ?'],
    code: [
'from sklearn.metrics import confusion_matrix',
'',
'pred = (p_val >= ____).astype(int)          # 1 = STOP',
'tn, fp, fn, tp = confusion_matrix(y_val, pred).ravel()',
'',
'rec = tp / (tp + fn)                        # defects caught',
'false_alarm = fp / (fp + ____)              # good cells stopped',
'per_1000 = 1000 / len(y_val)',
'',
"print(f'caught {tp}, missed {fn}, good cells stopped {fp}, good cells passed {tn}')",
"print(f'recall {rec:.1%}   false-alarm rate {false_alarm:.1%}')",
"print(f'per 1,000 cells: {tp*per_1000:.0f} defects caught, {fn*per_1000:.0f} missed, {fp*per_1000:.0f} good cells stopped')"
    ].join('\n'),
    probe: [
'_m = _pg_has("tn", "fp", "fn", "tp", "rec", "false_alarm", "pred")',
'if _m: _r = {"missing": _m}',
'else:',
'    def _pick(t, p):',
'        sel = (y_val == t) & (pred == p)',
'        return [[int(cell_id[j]), float(prob[j]), str(kind[j]), round(float(s), 3)] for j, s in zip(idx_val[sel], p_val[sel])]',
'    _r = {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp), "rec": float(rec), "far": float(false_alarm),',
'          "true_far": float(fp / (fp + tn)), "cut_used": float(np.min(p_val[pred == 1])) if pred.sum() else None, "cut": float(cut),',
'          "n": int(len(y_val)), "TP": _pick(1, 1), "FN": _pick(1, 0), "FP": _pick(0, 1), "TN": _pick(0, 0)}'
    ].join('\n'),
    check: function (r) {
      if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the cell.' };
      if (r.rec < 0.95) return { pass: false, msg: 'Recall is ' + (100 * r.rec).toFixed(1) + '%. Use the cutoff you found in 2d, not a new number.' };
      if (r.cut_used != null && r.cut_used < r.cut - 1e-9) return { pass: false, msg: 'You stop cells below the 2d cutoff. Use the variable from 2d.' };
      if (Math.abs(r.far - r.true_far) > 1e-9) return { pass: false, msg: 'False-alarm rate came out ' + (100 * r.far).toFixed(1) + '%. Divide by ALL good cells: stopped ones (fp) plus passed ones.' };
      return { pass: true, msg: 'Recall ' + (100 * r.rec).toFixed(1) + '%, false-alarm rate ' + (100 * r.far).toFixed(1) + '%.' };
    },
    example: '<p>A metal detector at a gate: 40 people carry metal, it beeps for 38; 960 carry none, it beeps for 120.</p><pre>catch_rate  = 38 / (38 + 2)      # 95%\nfalse_beeps = 120 / (120 + 840)  # 12.5%</pre>',
    render: function (r, el, api) { V().report(r, el, api); },
    mechNeed: function (m) { return (m && m.sorted) ? null : 'sort every missed defect into a reason box, then tap "Check my sort"'; },
    explain: function (r) { var k = 1000 / r.n; return {
      asked: 'Count TP, FN, FP, TN at the 2d cutoff and turn them into rates.',
      steps: ['Caught ' + r.tp + ' of ' + (r.tp + r.fn) + ' defects → recall ' + (100 * r.rec).toFixed(1) + '%.',
              'Good cells stopped: ' + r.fp + ' of ' + (r.fp + r.tn) + ' → false-alarm rate ' + (100 * r.far).toFixed(1) + '%.',
              'Per 1,000 cells: ' + Math.round(r.tp * k) + ' caught, ' + Math.round(r.fn * k) + ' missed, ' + Math.round(r.fp * k) + ' good cells sent to re-check.'],
      trap: 'fp / (fp + tp) is a different number (share of stops that were wrong). The false-alarm rate divides by all good cells.',
      remember: 'Report both: what you catch and what it costs.' }; }
  }
  ]
};

var LOCKED = [
  { id: 3, title: 'Train a CNN with Keras + TensorFlow' },   // replaced by js/step3.js when loaded
  { id: 4, title: 'See what the model looks at (heat maps, error gallery)' },
  { id: 5, title: 'Wire the inspection flow with LangGraph (pass / stop / send to human)' },
  { id: 6, title: 'Add the CrewAI quality crew (inspector, root-cause analyst, shift-report writer)' },
  { id: 7, title: 'Build the operator console UI' },
  { id: 8, title: 'Line trial on the sealed test set, drift watch, and retrain on your own factory photos' }
];

/* Reference answers (review mode only: "Fill reference answer" / "Run up to here") */
var REF = { '1a': ['uint8', '2624'], '1b': ['mono', '0.67'], '1c': ['0.5'], '1d': ['y'], '1e': ['255', '4096'],
  '2a': ['idx_train'], '2b': ['5', 'idx_train'], '2c': ['1'], '2d': ['0.95'], '2e': ['cut', 'tn'] };
[step1, step2].forEach(function (st) { st.substeps.forEach(function (s) { if (REF[s.id]) s.ref = REF[s.id]; }); });

G.PG_STEPS = [step0, step1, step2].concat(LOCKED.map(function (s) {
  return { id: s.id, title: s.title, locked: true, substeps: [] };
}));
G.PG_PY_HELP = PY_HELP;
})(typeof window !== 'undefined' ? window : globalThis);
