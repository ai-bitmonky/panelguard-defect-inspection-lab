"""AUDIT: the Step 8 twins (8b, 8c, 8d) EXACTLY as displayed, run on top of tools/research/step8_twin.py's state
(split, Step 2 SVC `best`, features F, Keras `model` with the browser's weights, LangGraph stations). Compares with the browser
numbers in step8_inputs.json. Names the displayed text uses but never defines are supplied and listed."""
import json, pathlib, sys, io, contextlib, linecache, traceback
import numpy as np
HERE = pathlib.Path(__file__).resolve().parent; RES = HERE.parent / 'research'
T = json.load(open(HERE / 'twins.json'))
NS = {'__name__': 'twin8', '__file__': str(RES / 'step8_twin.py')}; sys.argv = ['x']
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    try: exec(compile((RES / 'step8_twin.py').read_text().replace('sys.exit(', '(lambda *a: None)('), str(RES / 'step8_twin.py'), 'exec'), NS)
    except SystemExit: pass
print('research step8_twin.py itself ->', [l for l in buf.getvalue().split('\n') if 'TWIN' in l])
IN = NS['IN']; ok = True
SUP = '''
best_w = IN['bestW']
def card(c): c = int(c); return {'id': c, 'kind': kind[cell_id == c][0], 'photo': X[cell_id == c][0].ravel().tolist(), 'tries': 1}
def y_test_of(c): return LAB[int(c)]
'''
exec(SUP, NS); NS['trial_log'].clear()
def run(cid, extra=''):
    global ok
    fn = '/tmp/twin_' + cid + '.py'; open(fn, 'w').write(T[cid]['twin']); linecache.checkcache(fn); out = io.StringIO()
    try:
        with contextlib.redirect_stdout(out): exec(compile(T[cid]['twin'], fn, 'exec'), NS)
        print('RAN  ', cid, '|', out.getvalue().strip().replace('\n', ' / ')[:300])
    except Exception as e: ok = False; print('ERROR', cid, type(e).__name__, str(e)[:300]); traceback.print_exc(limit=2)
# 8b: X is (n,64,64) uint8 in the research state; the displayed code reshapes X[idx_test] itself
NS['X'] = NS['X']
EDGES = '''g.add_edge(START, 'check_photo'); g.add_conditional_edges('check_photo', after_check, ['score', 'reshoot', 'human_check'])
g.add_edge('reshoot', 'check_photo'); g.add_edge('score', 'route')
g.add_conditional_edges('route', lambda s: s['lane'], {'pass': 'record', 'person': 'human_check', 'stop': 'record'})
g.add_edge('human_check', 'record'); g.add_edge('record', END)'''
run('8b')
if '# ... the same edges as Step 5 ...' in T['8b']['twin']:
    print('8b AS DISPLAYED cannot run (edges left out); re-run with the Step 5 edges put in place of the comment line')
    T['8b']['twin'] = T['8b']['twin'].replace('# ... the same edges as Step 5 ...', EDGES); NS['trial_log'].clear(); ok = True; run('8b')
tl = NS['trial_log']; js = {r[0]: (r[3], r[4]) for r in IN['scores']}
d = [r['id'] for r in tl if js.get(int(r['id'])) != (r['lane'], r['decision'])]
print('8b displayed: cells', len(tl), '| differ from JS:', len(d), '| p_test vs JS max diff', float(np.abs(NS['p_test'] - np.array(IN['pTest'])).max()))
ok = ok and not d and len(tl) == 525
# 8c: the displayed text reads `trial`, `y_rows`, `passed_rows` (the JS names are trial.all / trialLog)
LABd = NS['LAB']; order = [x[0] for x in IN['scores']]; rows = sorted(tl, key=lambda r: order.index(int(r['id'])))
NS['trial'] = {'defects_passed': sum(1 for r in tl if LABd[int(r['id'])] == 1 and r['decision'] == 'pass'), 'defects': sum(LABd.values())}
NS['y_rows'] = [LABd[int(r['id'])] for r in rows]; NS['passed_rows'] = [r['decision'] == 'pass' for r in rows]
run('8c')
print('8c displayed: Wilson', round(100 * NS['lo'], 3), round(100 * NS['hi'], 3), 'vs JS', [round(x, 3) for x in IN['interval']], '| bootstrap (numpy rng)', np.percentile(NS['boot'], [2.5, 97.5]).round(2), 'vs JS (seeded LCG)', [round(x, 2) for x in IN['bootInterval']], '| under_target', NS['under_target'])
ok = ok and abs(100 * NS['lo'] - IN['interval'][0]) < 0.01 and abs(100 * NS['hi'] - IN['interval'][1]) < 0.01
# 8d
NS['p_cnn'] = np.array(IN['pCnnVal']); ID2I = NS['ID2I']
run('8d')
tp = np.array([NS['X'][ID2I[c]] for c in IN['cell_test']])
try:
    today = NS['drift'](tp, np.array(IN['pCnnTest'])); print('8d displayed drift(test tray):', {k: round(v, 4) for k, v in today.items()}, 'vs JS', IN['today'])
    ok = ok and all(abs(today[k] - IN['today'][k]) < 0.002 for k in ('score', 'bright', 'contrast', 'sharp'))
except Exception as e: ok = False; print('ERROR 8d drift', type(e).__name__, e)
print('DISPLAYED TWINS 8b-8d', 'MATCH' if ok else 'DO NOT MATCH')
