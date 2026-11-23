"""Diagram guide batch 5 — Step 8 facts. Merges key s8 (and a few more real photos) into tools/guide/src/facts.json.
Run: python3 -I tools/guide/facts8.py   (numpy + pillow; < 3 s)

Sources (no invented numbers):
- tools/research/step8_inputs.json — the real Step 8 run (s8_e2e, fixture model) that the Python twin step8_twin.py
  reproduced (TWIN MATCHES, step8_twin_run.log): frozen settings, validation shift report, trial on the sealed tray,
  Wilson + bootstrap intervals, drift PSI (today + 4 simulated changes), learning curve.
- site/data/labels.json + tools/ref/cells64.u8 — the photos, for the reference photo numbers (8d looks()).
- facts.json s3 (validation tray per cell) — to rebuild the validation lanes per cell (checked against the 5g shift).
THE HONESTY RULE: everything under s8.test is the sealed test tray. The diagrams show it ONLY in dev unlock mode;
students see their OWN trial (liveRes 8b/8c/8d) after they ran it. Validation numbers are open."""
import base64, io, json, math, os
import numpy as np

here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(os.path.dirname(here))
IN = json.load(open(os.path.join(root, 'tools/research/step8_inputs.json')))
FJ = os.path.join(here, 'src/facts.json'); facts = json.load(open(FJ))
rows = json.load(open(os.path.join(root, 'site/data/labels.json')))['rows']
X = np.fromfile(os.path.join(root, 'tools/ref/cells64.u8'), dtype=np.uint8).reshape(-1, 64, 64)
ID2I = {r[0]: i for i, r in enumerate(rows)}
r1 = lambda x: round(float(x), 1); r3 = lambda x: round(float(x), 3); r4 = lambda x: round(float(x), 4)


def wilson(k, n, z=1.96):
    p = k / n; d = 1 + z * z / n; mid = (p + z * z / (2 * n)) / d; half = (z / d) * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return {'p': p, 'd': d, 'mid': mid, 'half': half, 'lo': 100 * max(0, mid - half), 'hi': 100 * min(1, mid + half)}


def lcg(seed):
    s = [seed % 2147483647 or 2147483646]
    def rnd():
        s[0] = (s[0] * 16807) % 2147483647; return (s[0] - 1) / 2147483646
    return rnd


def boot(rws, B=2000):
    rnd = lcg(1); out = []
    for _ in range(B):
        d = e = 0
        for _ in range(len(rws)):
            yy, pp = rws[int(rnd() * len(rws))]
            if yy == 1: d += 1; e += pp
        out.append(100 * e / d)
    out.sort(); return [out[int(0.025 * B)], out[int(0.975 * B)]]


# ---------------- frozen settings ----------------
F3 = facts['s3']; rules = facts['s5']['rules']
freeze = {'bestW': IN['bestW'], 'low': r4(IN['low']), 'high': r4(IN['high']), 'lowPoly': r4(IN['lowPoly']), 'params': F3['total'],
          'rules': rules, 'maxTries': 2, 'target': IN['trial']['target']}

# ---------------- validation, per cell (open) ----------------
V = F3['val']; lanes = []; vrows = []
for i, cid in enumerate(V['id']):
    p = IN['bestW'] * V['cnn'][i] + (1 - IN['bestW']) * V['svc'][i]
    lo = IN['lowPoly'] if V['kind'][i] == 'p' else IN['low']
    lane = 'pass' if p < lo else 'stop' if p >= IN['high'] else 'person'
    lanes.append(lane)
vr = IN['val']
cnt = {k: lanes.count(k) for k in ('pass', 'person', 'stop')}
passed = [i for i, l in enumerate(lanes) if l == 'pass' and V['y'][i] == 1]
print('validation lanes rebuilt', cnt, 'vs 5g', vr['lanes'], '; defects passed', len(passed), 'vs', vr['all']['defPassed'])
# the rounded s3 scores can sit on a gate: keep the lab's own counts, use the rebuilt per-cell lanes only for the bootstrap rows
assert len(passed) == vr['all']['defPassed'] and cnt == vr['lanes']
k, n = vr['all']['defPassed'], vr['all']['def']
vrows = [(V['y'][i], int(V['y'][i] == 1 and lanes[i] == 'pass')) for i in range(len(lanes))]   # real per-cell rows, tray order
vw = wilson(k, n); wald = [100 * (k / n - 1.96 * math.sqrt(k / n * (1 - k / n) / n)), 100 * (k / n + 1.96 * math.sqrt(k / n * (1 - k / n) / n))]
unsure_val = sum(1 for i in passed if V['prob'][i] == 0.67)
val = {'n': vr['n'], 'lanes': vr['lanes'], 'all': vr['all'], 'mono': vr['mono'], 'poly': vr['poly'], 'per1000': vr['per1000'],
       'wilson': {kk: (r4(v) if kk in ('p', 'd', 'mid', 'half') else r3(v)) for kk, v in vw.items()}, 'wald': [r3(x) for x in wald],
       'boot': [r3(x) for x in boot(vrows)], 'unsureEscapes': unsure_val, 'escapes': [V['id'][i] for i in passed], 'rows': ''.join('2' if r[1] else str(r[0]) for r in vrows)}

# ---------------- the sealed test tray (locked in the diagrams) ----------------
T = IN['trial']; tw = wilson(T['all']['defPassed'], T['all']['def'])
test = {'n': T['n'], 'lanes': T['lanes'], 'all': T['all'], 'mono': T['mono'], 'poly': T['poly'], 'escapes': T['escapes'], 'unsureEscapes': T['unsureEscapes'],
        'interval': [r3(x) for x in IN['interval']], 'boot': [r3(x) for x in IN['bootInterval']], 'wilson': {kk: r4(v) if kk in ('p', 'd', 'mid', 'half') else r3(v) for kk, v in tw.items()},
        'today': IN['today']}
assert abs(tw['lo'] - IN['interval'][0]) < 1e-9 and abs(tw['hi'] - IN['interval'][1]) < 1e-9


# ---------------- 8d: drift (simulated changes on the line, PSI per alarm) ----------------
def looks(p):
    p = p.astype(float); sv = np.sort(p.ravel())
    return {'bright': p.mean(), 'contrast': sv[int(0.95 * 4096)] - sv[int(0.05 * 4096)], 'sharp': np.abs(np.diff(p, axis=1)).sum() / (64 * 63)}


ref = [looks(X[ID2I[c]]) for c in IN['cell_val']]
REFD = {kk: sorted(r1(x[kk]) for x in ref) for kk in ('bright', 'contrast', 'sharp')}
drift = {'alarm': 0.25, 'watch': 0.1, 'nRef': len(ref), 'sims': {kk: {a: r3(v) for a, v in IN['alarms'][kk].items() if a != 'ring'} for kk in IN['alarms']},
         'ring': {kk: IN['alarms'][kk]['ring'] for kk in IN['alarms']}, 'n': {'dark': 260, 'blur': 260, 'poly': sum(1 for c in IN['cell_test'][:260] if rows[ID2I[c]][2] == 'poly'), 'fault': 260},
         'refd': REFD}

# ---------------- 8e: learning curve ----------------
curve = [{'photos': c['photos'], 'defects': c['defects'], 'auc': c['auc'], 'far': c['far']} for c in IN['curve']]

# ---------------- 8g: one real cell, camera to report (validation cell 496: a mono defect the Step 4 maps painted) ----------------
i496 = V['id'].index(496)
one = {'id': 496, 'kind': V['kind'][i496], 'y': V['y'][i496], 'prob': V['prob'][i496], 'svc': V['svc'][i496], 'cnn': V['cnn'][i496],
       'blend': r3(IN['bestW'] * V['cnn'][i496] + (1 - IN['bestW']) * V['svc'][i496]), 'lane': lanes[i496], 'looks': {a: r1(v) for a, v in looks(X[ID2I[496]]).items()}}

S8 = {'freeze': freeze, 'val': val, 'test': test, 'drift': drift, 'curve': curve, 'one': one, 'split': facts['split'], 'source': IN['source']}
facts['s8'] = S8
ELPV = next((p for p in ['/tmp/elpv/src/elpv_dataset/data/images', '/home/claude/dl/x/elpv_dataset/data/images'] if os.path.isdir(p)), None)
photos = facts.get('photos', {})
if ELPV:
    from PIL import Image
    for c in [496] + val['escapes'][:4] + [2567, 1876]:
        if str(c) in photos: continue
        im = Image.open(os.path.join(ELPV, 'cell%04d.png' % c)).convert('L').resize((240, 240), Image.LANCZOS)
        bio = io.BytesIO(); im.save(bio, 'JPEG', quality=78, optimize=True); photos[str(c)] = base64.b64encode(bio.getvalue()).decode()
facts['photos'] = photos
open(FJ, 'w').write(json.dumps(facts, separators=(',', ':')))
print('val', val['all']['defPassed'], 'of', val['all']['def'], 'wilson %.2f-%.2f boot %s' % (vw['lo'], vw['hi'], val['boot']), 'unsure', unsure_val, 'escapes', val['escapes'])
print('one', one); print('photos', len(photos), '; wrote', FJ, os.path.getsize(FJ))
