"""Compute every dataset fact the Step 0-1 diagrams show. Writes tools/guide/src/facts.json.
Run: python3 -I tools/guide/facts.py  (needs numpy, scikit-learn, Pillow)"""
import json, os, numpy as np
from PIL import Image
from sklearn.model_selection import train_test_split
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(os.path.dirname(here))
lab = json.load(open(os.path.join(root, 'site/data/labels.json')))
rows = lab['rows']; cid = np.array([r[0] for r in rows]); prob = np.array([r[1] for r in rows]); kind = np.array([r[2] for r in rows])
n = len(rows); y = (prob >= 0.5).astype(int)
atlas = np.array(Image.open(os.path.join(root, 'site/data/cells64_atlas.png')))
if atlas.ndim == 3: atlas = atlas[..., 0]
cols = atlas.shape[1] // 64
X = np.stack([atlas[(i // cols) * 64:(i // cols) * 64 + 64, (i % cols) * 64:(i % cols) * 64 + 64] for i in range(n)])
F = {}
F['n'] = n; F['bytes'] = int(X.size); F['perPhoto'] = 4096
F['pmin'] = int(X.min()); F['pmax'] = int(X.max())
F['bins'] = [int((prob == p).sum()) for p in [0.0, 0.33, 0.67, 1.0]]
F['binsMono'] = [int(((prob == p) & (kind == 'mono')).sum()) for p in [0.0, 0.33, 0.67, 1.0]]
F['binsPoly'] = [int(((prob == p) & (kind == 'poly')).sum()) for p in [0.0, 0.33, 0.67, 1.0]]
F['mono'] = int((kind == 'mono').sum()); F['poly'] = n - F['mono']
F['def'] = int(y.sum()); F['ok'] = n - F['def']
F['defMono'] = int(y[kind == 'mono'].sum()); F['defPoly'] = int(y[kind == 'poly'].sum())
idx = np.arange(n)
a, b = train_test_split(idx, test_size=0.4, stratify=y, random_state=42)
c, d = train_test_split(b, test_size=0.5, stratify=y[b], random_state=42)
F['split'] = {'sizes': [len(a), len(c), len(d)], 'defects': [int(y[a].sum()), int(y[c].sum()), int(y[d].sum())]}
a2, b2 = train_test_split(idx, test_size=0.4, random_state=42)
c2, d2 = train_test_split(b2, test_size=0.5, random_state=42)
F['splitRandom'] = {'sizes': [len(a2), len(c2), len(d2)], 'defects': [int(y[a2].sum()), int(y[c2].sum()), int(y[d2].sum())], 'seed': 42}
# extra seeds without stratify: range of the test-tray share
sh = []
for s in range(200):
    p, q = train_test_split(idx, test_size=0.4, random_state=s); r_, t_ = train_test_split(q, test_size=0.5, random_state=s); sh.append(int(y[t_].sum()))
F['randTestDefRange'] = [min(sh), max(sh)]
GAME = [6, 447, 245, 74, 23, 987, 96, 1, 11, 143, 49, 905]
F['game'] = [[g, float(prob[cid == g][0]), str(kind[cid == g][0])] for g in GAME]
CARDS = [447, 74, 6, 23, 1, 245]
F['cards'] = [[g, float(prob[cid == g][0]), str(kind[cid == g][0])] for g in CARDS]
# 1e: 8x8 patch of cell 6 with the darkest 8x8 mean (crack) away from the edge
k = int(np.where(cid == 6)[0][0]); im = X[k].astype(int)
best = (0, 24, 28)   # the 8 x 8 patch with the dark spot on the crack and a piece of busbar (row 24-31, column 28-35)
F['patch'] = {'cell': 6, 'y': best[1], 'x': best[2], 'vals': im[best[1]:best[1] + 8, best[2]:best[2] + 8].tolist()}
F['cell6'] = {'min': int(im.min()), 'max': int(im.max())}
FJ = os.path.join(here, 'src/facts.json')
old = json.load(open(FJ)) if os.path.exists(FJ) else {}
old.update(F)   # keeps the Step 2-3 keys made by facts23.py
json.dump(old, open(FJ, 'w'), separators=(',', ':'))
print(json.dumps({k: v for k, v in F.items() if k != 'patch'}, indent=None)[:3000]); print(F['patch'])
