"""AUDIT: run the Step 6 CrewAI twins EXACTLY as displayed (6b-6f), in order, one namespace. The preamble (from
tools/research/step6_twin.py, everything before its checks) gives the lab state + the scripted brain's rules; the displayed
twins then define the tools/agents/tasks/crews themselves. Names the twins assume but never define are supplied and listed."""
import json, pathlib, sys, traceback, io, contextlib, os, linecache
HERE = pathlib.Path(__file__).resolve().parent; RES = HERE.parent / 'research'
T = json.load(open(HERE / 'twins.json'))
src = (RES / 'step6_twin.py').read_text()
pre = src.split('print("crewai", crewai.__version__')[0]
NS = {'__name__': 'twin6', '__file__': str(RES / 'step6_twin.py')}
sys.argv = ['x', str(RES / 'step6_inputs.json')]
exec(compile(pre, 'preamble(step6_twin.py)', 'exec'), NS)
IN, JS = NS['IN'], NS['JS']
RS = NS['ScriptedLLM']
# supplied names (not defined by any displayed twin)
SUPPLIED = '''
audit_log = IN["audit_log"]
_sr = shift_report
def shift_report(rows):                      # the JS pg.shiftReport shape (all.def), as 6b expects
    R = _sr(rows)
    for g in ("all", "mono", "poly"): R[g]["def"] = R[g].pop("defs")
    R["lanes"]["pass"] = R["lanes"].pop("pass_")
    return R
slices = IN["slices"]
def slice_facts(s): return f_slice_table()
_RS = ScriptedLLM
def scripted_step(messages, slips=0): return _RS(model="scripted-rules", slips=slips).call(messages)
'''
exec(compile(SUPPLIED, 'supplied', 'exec'), NS)
for k in ['shift_stats', 'slice_table', 'brain', 'inspector', 'analyst', 'writer', 'ScriptedLLM', 'hire', 'tasks', 'facts', 'fact_numbers', 'check_report', 'report_guardrail']: NS.pop(k, None)
# worst_cases / action_list: the 6b twin says "the same pattern (tools/research/step6_twin.py)" -> take them from there
NS['worst_cases'] = NS['make_tool']('worst_cases', NS['f_worst_cases']); NS['action_list'] = NS['make_tool']('action_list', NS['f_action_list'])
ok = True; res = {}
for cid in ['6b', '6c', '6d', '6e', '6f']:
    out = io.StringIO()
    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(io.StringIO()): fn = '/tmp/twin_' + cid + '.py'; open(fn, 'w').write(T[cid]['twin']); linecache.checkcache(fn); exec(compile(T[cid]['twin'], fn, 'exec'), NS)
        res[cid] = out.getvalue(); print('RAN  ', cid, '|', out.getvalue().strip().replace('\n', ' / ')[:400])
    except Exception as e:
        ok = False; print('ERROR', cid, type(e).__name__, str(e).replace('\n', ' / ')[:400])
def cmp(name, a, b):
    global ok
    s = a == b; ok = ok and s; print('SAME ' if s else 'DIFF ', name, '' if s else '\n   py: ' + str(a)[:600].replace('\n', ' / ') + '\n   js: ' + str(b)[:600].replace('\n', ' / '))
try: cmp('6b tool shift_stats', json.loads(NS['shift_stats'].run()), JS['tools']['shift_stats'])
except Exception as e: ok = False; print('ERROR shift_stats.run', e)
try: cmp('6b tool slice_table', json.loads(NS['slice_table'].run()), JS['tools']['slice_table'])
except Exception as e: ok = False; print('ERROR slice_table.run', e)
if 'order_result' in NS: cmp('6d order_result (right order) = the 6e report', NS['order_result'].raw, JS['outs'][2])
if 'shift_result' in NS: cmp('6e report', NS['shift_result'].raw, JS['outs'][2]); print('6e trace steps:', len(NS.get('trace', [])), '(JS trace has', len(JS['trace_types']), 'events; Python verified twin got 8 steps with fresh agents)')
if 'guarded' in NS: cmp('6f guarded final', NS['guarded'].raw, JS['guarded_final'])
print('DISPLAYED TWINS 6', 'MATCH' if ok else 'DO NOT MATCH')
