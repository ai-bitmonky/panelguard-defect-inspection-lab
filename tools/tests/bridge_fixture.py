# Test-only: the same bridge data the app gets from the Python kernel (Step 1 split, labels, Step 2 scores),
# rebuilt from tools/research (split.npz = same train_test_split calls as Step 1; svc_val.npy = Step 2 SVC pipeline).
import json, numpy as np, pathlib
R = pathlib.Path(__file__).resolve().parent.parent / 'research'
rows = json.load(open(pathlib.Path(__file__).resolve().parents[2] / 'site/data/labels.json'))['rows']
d = np.load(R / 'split.npz'); y, itr, iva = d['y'], d['itr'], d['iva']; p_val = np.load(R / 'svc_val.npy')
out = {"n": int(len(y)), "idx_train": itr.tolist(), "idx_val": iva.tolist(), "y_train": y[itr].tolist(), "y_val": y[iva].tolist(),
       "p_val": [float(v) for v in p_val], "cell_val": [rows[i][0] for i in iva], "prob_val": [rows[i][1] for i in iva], "kind_val": [rows[i][2] for i in iva], "baseline": "SVC (RBF)"}
json.dump(out, open(pathlib.Path(__file__).resolve().parent / 'bridge_fixture.json', 'w'))
print('ok', len(itr), len(iva))
