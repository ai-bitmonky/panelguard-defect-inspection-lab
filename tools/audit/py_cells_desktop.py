"""AUDIT: the app's Python cells (reference answers, 1a-2e, then 8e) run in DESKTOP Python (same code the student types), then the
8e 'Same thing in plain Python' twin as displayed (learning curve + own-photo lines) in that same notebook state."""
import json, sys, os, io, contextlib, traceback, linecache, numpy as np
H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(H, '..', '..'))
T = json.load(open(os.path.join(H, 'twins.json')))
def fill(code, ref): 
    for r in ref: code = code.replace('____', r, 1)
    return code
NS = {'__name__': 'nb'}
help_src = json.load(open(os.path.join(H, 'py_help.json')))
exec(help_src, NS)
for cid in ['1a', '1b', '1c', '1d', '1e', '2a', '2b', '2c', '2d', '2e', '8e']:
    code = fill(T[cid]['code'], T[cid]['ref']).replace('/data/cells64.u8', os.path.join(ROOT, 'tools/ref/cells64.u8')).replace('/data/labels.json', os.path.join(ROOT, 'site/data/labels.json'))
    out = io.StringIO()
    try:
        with contextlib.redirect_stdout(out): exec(compile(code, 'cell ' + cid, 'exec'), NS)
        print('RAN', cid, '|', out.getvalue().strip().split('\n')[-1][:150])
    except Exception as e: print('ERROR', cid, type(e).__name__, e)
from PIL import Image
full = os.path.join(ROOT, 'site/data/full'); png = [f for f in os.listdir(full) if f.endswith('.png')][0]
Image.open(os.path.join(full, png)).save('/tmp/my_cell.png'); os.chdir('/tmp')
tw = T['8e']['twin']; fn = '/tmp/twin_8e.py'; open(fn, 'w').write(tw); linecache.checkcache(fn)
try:
    with contextlib.redirect_stdout(io.StringIO()) as o: exec(compile(tw, fn, 'exec'), NS)
    print('8e TWIN RAN as displayed | learning curve', [round(float(v), 3) for v in NS['va'].mean(axis=1)], '| own photo p_svc', round(float(NS['p_svc']), 3), '| 8e cell curve (idx_val)', [c['auc'] for c in NS['curve']])
except Exception as e: print('8e TWIN ERROR', type(e).__name__, e)
