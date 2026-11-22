"""AUDIT: run the Step 5 Python twins EXACTLY as the app displays them (twins.json = SUBS[id].twin), in course order, in one
namespace. Only the names the twins take from the notebook (data, card, shoot, fault_cards, unsure_cells, label_of,
shift_report, right_nine_in_ten, val_ids, p_blend, low, high, y_val, kind_v) are given by a preamble (borrowed from
tools/research/step5_twin.py). Compares the three shifts with the JavaScript LangGraph run (step5_inputs.json)."""
import json, pathlib, sys, traceback, re, io, contextlib, linecache
HERE = pathlib.Path(__file__).resolve().parent; RES = HERE.parent / 'research'
T = json.load(open(HERE / 'twins.json'))
src = (RES / 'step5_twin.py').read_text()
pre = src.split("print('langgraph', version('langgraph')")[0]          # data + helpers only (no checks)
NS = {'__name__': 'twin5', '__file__': str(RES / 'step5_twin.py')}
sys.argv = ['x', str(RES / 'step5_inputs.json')]
exec(compile(pre, 'preamble(step5_twin.py helpers)', 'exec'), NS)
# names the twins use that the preamble does not define
exec(compile('''
fault_cards = [card(f) for f, _, _ in FAULTS]
def unsure_cells(k):
    ids = [c for i, c in enumerate(val_ids) if low <= p_blend[i] < high]
    return ids[:k]
''', 'preamble-extra', 'exec'), NS)
# remove the preamble's own station/graph definitions so the twins must define them
for k in ['Cell', 'check_photo', 'score', 'route', 'record', 'reshoot', 'after_check', 'human_check', 'build_line', 'run_shift', 'perfect', 'audit_log', 'MAX_TRIES', 'photo_problem', 'DARK', 'BLANK', 'FLAT']: NS.pop(k, None)
ok = True
for cid in ['5b', '5c', '5d', '5e', '5f', '5g']:
    out = io.StringIO()
    try:
        with contextlib.redirect_stdout(out): fn = '/tmp/twin_' + cid + '.py'; open(fn, 'w').write(T[cid]['twin']); linecache.checkcache(fn); exec(compile(T[cid]['twin'], fn, 'exec'), NS)
        print('RAN  ', cid, '|', out.getvalue().strip().replace('\n', ' / ')[:300])
    except Exception as e:
        ok = False; print('ERROR', cid, type(e).__name__, str(e)[:300]); traceback.print_exc(limit=1)
INP = json.loads((RES / 'step5_inputs.json').read_text())
for nm in ['shift1', 'shift2', 'shift3']:
    a = NS.get(nm); b = INP['js'][nm]
    same = a is not None and json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)
    ok = ok and same
    print('MATCH ' if same else 'DIFFER', nm, '' if same or a is None else '\n  py ' + json.dumps(a, sort_keys=True)[:400] + '\n  js ' + json.dumps(b, sort_keys=True)[:400])
# decide() works on the paused threads (5f)
try:
    outs = [NS['decide'](c, 'stop')['decision'] for c in NS['threads']]; print('5f decide on', len(outs), 'paused threads ->', outs)
except Exception as e: ok = False; print('ERROR 5f decide', e)
print('DISPLAYED TWINS 5', 'MATCH' if ok else 'DO NOT MATCH')
