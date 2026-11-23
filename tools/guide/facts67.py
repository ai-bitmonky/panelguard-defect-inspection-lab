"""Diagram guide batch 4 — Step 6-7 facts. Merges keys s6 / s7 (and a few more real photos) into tools/guide/src/facts.json.
Run: python3 -I tools/guide/facts67.py   (pure Python + pillow; < 2 s)

Sources (no invented numbers):
- tools/research/step6_inputs.json — the real lab state (Step 5 logbook of the poly-gate shift, Step 4e slices, labels,
  Step 4f action boxes) AND what the JavaScript MiniCrew produced on it (tools, prompts, reports, guardrail drafts),
  written by tools/tests/js_cells6.test.mjs; the Python CrewAI twin (step6_twin.py) reproduced all of it (TWIN MATCHES).
- site/js/crew.js — the scripted model's rule sentences (to spell out the trace), the prompt slices.
- site/js/step6.js — task descriptions / expected outputs, tool descriptions.
- the lab's own number checker (6f checkReport, ported below exactly as step6_twin.check_report) for every tick / cross.
- site/js/step7.js — lamp table, CSS sizes (em of --u), unitFor(), MM_PER_PX, CAP_2M; shiftBoard(); checkerRate();
  the 7f held-back probe (first decimal +7); FIX7 faults (what the starter vs fixed console shows, per viz7 fireFault).
- tools/research/step7_gradio_smoke.log — the Python Gradio twin's real run: 30 real cells, median ms per decision,
  faults, odd answers, the report badge."""
import base64, io, json, math, os, re

here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(os.path.dirname(here))
IN = json.load(open(os.path.join(root, 'tools/research/step6_inputs.json')))
JS = IN['js']
S6JS = open(os.path.join(root, 'site/js/step6.js'), encoding='utf-8').read()
LABEL = dict(zip(IN['cell_val'], IN['y_val']))


# ---------------- the lab's number checker (6f checkReport) ----------------
def fact_numbers(v):
    if isinstance(v, bool): return []
    if isinstance(v, (int, float)): return [v]
    if isinstance(v, dict): v = list(v.values())
    return [x for item in v for x in fact_numbers(item)] if isinstance(v, list) else []


def fact_paths(v, p=''):     # every number with where it sits in the tool results
    if isinstance(v, bool): return []
    if isinstance(v, (int, float)): return [(v, p)]
    if isinstance(v, dict): return [x for k, item in v.items() for x in fact_paths(item, p + ('.' if p else '') + k)]
    if isinstance(v, list): return [x for i, item in enumerate(v) for x in fact_paths(item, p + '[%d]' % i)]
    return []


TOOLS = JS['tools']; KNOWN = fact_numbers(TOOLS); PATHS = fact_paths(TOOLS)


def tok_ok(tok):
    dp = len(tok.split('.')[1]) if '.' in tok else 0
    x = float(tok)
    hit = [p for k, p in PATHS if abs(k - x) <= 0.5 * 10 ** -dp]
    return (len(hit) > 0), (hit[0] if hit else None)


def check_report(text):       # same as the lab: units out, 1,234 -> 1234, every number vs the facts
    clean = re.sub(r'(\d),(\d{3})', r'\1\2', re.sub(r'per 1,000|per 100', ' ', text))
    wrong = [t for t in re.findall(r'\d+(?:\.\d+)?', clean) if not tok_ok(t)[0]]
    return {'ok': len(wrong) == 0, 'wrong': wrong}


def line_tokens(text):        # per report line: each number, found in the facts or not, and where
    out = []
    for ln in text.split('\n'):
        clean = re.sub(r'(\d),(\d{3})', r'\1\2', re.sub(r'per 1,000|per 100', ' ', ln))
        toks = []
        for t in re.findall(r'\d+(?:\.\d+)?', clean):
            ok, p = tok_ok(t); toks.append([t, 1 if ok else 0, p])
        out.append([ln, toks])
    return out


# ---------------- Step 6 ----------------
S6 = {'tools': TOOLS, 'prompts': JS['prompts'], 'outs': JS['outs'], 'poor': JS['poor'], 'planted': JS['planted'], 'plantedNow': JS['planted_now'],
      'onPlanted': JS['on_planted'], 'onReal': JS['on_real'], 'guarded': JS['guarded'], 'final': JS['guarded_final']}
assert check_report(JS['planted']) == JS['on_planted'], 'checker port differs on the planted copy'
assert check_report(JS['outs'][2]) == JS['on_real'], 'checker port differs on the real report'
assert check_report(JS['guarded'][0]['raw'])['wrong'] == ['8', '543'], 'draft 1 slips'
S6['lines'] = {'real': line_tokens(JS['outs'][2]), 'draft1': line_tokens(JS['guarded'][0]['raw']), 'draft2': line_tokens(JS['guarded'][1]['raw']), 'planted': line_tokens(JS['planted'])}
# workers: role / goal / backstory are inside the real prompts (P.role = 'You are {role}. {backstory}\nYour personal goal is: {goal}')
W = []
for pr in JS['prompts']:
    m = re.match(r'You are (.+?)\. (.+?)\nYour personal goal is: (.+?)\n', pr)
    tl = re.findall(r'Tool Name: (\w+)', pr)
    W.append({'role': m.group(1), 'backstory': m.group(2), 'goal': m.group(3), 'tools': tl, 'chars': len(pr)})
S6['workers'] = W
S6['toolDesc'] = {n: d for n, d in re.findall(r"name: '(\w+)', description: '([^']+)'", S6JS)}
S6['toolDesc']['shift_stats'] = re.search(r"description: '(Facts of the last shift[^']+)'", S6JS).group(1)
S6['jobs'] = [{'desc': d, 'expected': e} for d, e in re.findall(r"description: '([^']+)',\",\n\"  expected_output: '([^']+)'", S6JS)][:3]
assert len(S6['jobs']) == 3, S6['jobs']
# the trace (6e): the event types of the real run, spelled out with the scripted model's own rule sentences (crew.js)
tr, task, outs = [], -1, JS['outs']
for ev in JS['trace_types']:
    typ, _, tool = ev.partition(':')
    if typ == 'task_start': task += 1
    who = W[task]['role']
    if typ == 'task_start': tr.append([typ, task, who, S6['jobs'][task]['desc']])
    elif typ == 'thought':
        nxt = None
        for e2 in JS['trace_types'][len(tr) + 1:]:
            if e2.startswith('tool_call:'): nxt = e2.split(':')[1]; break
            if e2 == 'answer': break
        tr.append([typ, task, who, ('I need the facts from %s. I will call it.' % nxt) if nxt else 'I now know the final answer.'])
    elif typ == 'tool_call': tr.append([typ, task, who, tool + '({})'])
    elif typ == 'tool_result': tr.append([typ, task, who, json.dumps(TOOLS[tool], ensure_ascii=False, separators=(',', ':')), tool])
    elif typ == 'answer': tr.append([typ, task, who, outs[task]])
S6['trace'] = tr
S6['source'] = IN['source']

# ---------------- Step 7 ----------------
SM = open(os.path.join(root, 'tools/research/step7_gradio_smoke.log'), encoding='utf-8').read()
smoke = json.loads(SM[SM.index('{\n'):SM.rindex('}') + 1])
U = max(7, min(30, min(1920 / 64, 1080 / 36)))           # unitFor(1920, 1080): px per em of the console
MM = 527 / 1920; CAP2 = 2000 * math.tan(20 / 60 * math.pi / 180)
def readable(px):                                         # metres at which a letter of this font size still reads (20 arc-minutes)
    cap = 0.7 * px * MM; return round(2 * cap / CAP2, 2), round(cap, 1)
# the console's text blocks (site/js/step7.js CSS, full console of 7g; em x --u)
BL = [['lamp', 'verdict word', 5.2], ['buttons', 'START / STOP LINE', 1.5], ['state', 'LINE RUNNING', 1.3], ['qbtn', 'queue PASS / STOP', 1.35],
      ['speed', 'cells / min', 1.15], ['station', 'station name', 1.1], ['qhead', 'queue: n waiting', 1.05], ['counters', 'counters', 1.0]]
blocks = []
for k, name, em in BL:
    px = em * U; m, cap = readable(px); blocks.append({'k': k, 'name': name, 'em': em, 'px': round(px, 1), 'capMm': cap, 'm': m})
S7 = {'u': U, 'mmPerPx': round(MM, 4), 'cap2m': round(CAP2, 2), 'blocks': blocks,
      'lampCell': {'em': 4.2, 'px': 4.2 * U, 'm': readable(4.2 * U)[0], 'capMm': readable(4.2 * U)[1]}}
# 7b lamps + the odd answers / faults of the real Python run
S7['lamps'] = [['pass', 'PASS', 'circle'], ['person', 'CHECK', 'triangle'], ['stop', 'STOP', 'square'], ['none', 'NO VERDICT', 'ring']]
S7['odd'] = [['nothing came back', smoke['odd_answers'][0]], ['an empty answer {}', smoke['odd_answers'][1]], ['a flow error', smoke['odd_answers'][2]], ["an unknown lane 'banana'", smoke['odd_answers'][3]]]
S7['smokeFaults'] = smoke['faults']
# 7c: the first 30 cells of the validation tray, with their real lanes (the 5g logbook is in tray order)
log = IN['audit_log']
assert [r['id'] for r in log[:30]] == IN['cell_val'][:30]
first = [[r['id'], r['kind'], r['lane'], round(r['p'], 3)] for r in log[:30]]
cnt = {k: sum(1 for r in log[:30] if r['lane'] == k) for k in ('pass', 'person', 'stop')}
assert cnt == {k: smoke['30_cells'][k] for k in cnt}, (cnt, smoke['30_cells'])
S7['belt'] = {'cells': first, 'counts': cnt, 'medianMs': smoke['median_ms'], 'budgetMs': 2000, 'perMinute': 30, 'keras': smoke['keras'], 'gradio': smoke['gradio']}
# 7d: the share the flow sends to a person (checkerRate) and the person-lane cells of the tray
n, person = len(log), sum(1 for r in log if r['lane'] == 'person')
share = person / n
S7['queue'] = {'n': n, 'person': person, 'share': share, 'needed': round(30 * 60 * share), 'cells': [[r['id'], r['kind'], round(r['p'], 3), LABEL[r['id']]] for r in log if r['lane'] == 'person'][:8]}
# 7e: shiftBoard(auditLog) — blocks of 50, all / mono / poly, plus cells by type (the pie)
bl = []
for i in range(0, n, 50):
    b = {'pass': 0, 'person': 0, 'stop': 0}
    for r in log[i:i + 50]: b[r['lane']] += 1
    bl.append(b)
def group(rs):
    d = [r for r in rs if LABEL[r['id']] == 1]; e = [r for r in d if r['decision'] == 'pass']
    return {'defects': len(d), 'passed': len(e), 'per100': (math.floor(1000 * len(e) / len(d) + 0.5) / 10) if d else 0}
S7['board'] = {'cells': n, 'blocks': bl, 'all': group(log), 'target': 5, 'mono': group([r for r in log if r['kind'] == 'mono']), 'poly': group([r for r in log if r['kind'] == 'poly']),
               'types': {'mono': sum(1 for r in log if r['kind'] == 'mono'), 'poly': sum(1 for r in log if r['kind'] == 'poly')}}
assert S7['board']['all']['passed'] == smoke['board']['passed'] and S7['board']['all']['per100'] == smoke['board']['per100']
# 7f: the real report (guardrail drafts) and the lab's held-back probe (first "a.b" number +7)
fin = JS['guarded_final']
held = re.sub(r'(\d+)\.(\d)', lambda m: str(int(m.group(1)) + 7) + '.' + m.group(2), fin, count=1)
S7['report'] = {'final': fin, 'removed': check_report(JS['guarded'][0]['raw'])['wrong'], 'drafts': len(JS['guarded']), 'badge': smoke['report']['badge'],
                'held': held, 'heldCheck': check_report(held), 'finalCheck': check_report(fin)}
assert S7['report']['finalCheck']['ok'] and not S7['report']['heldCheck']['ok']
# 7g: the fault drill — what the operator sees on the starter (bugs) vs the fixed console (viz7 FAULTS7 + fireFault; checked by s7_e2e)
S7['faults'] = [
    {'k': 'camera', 'name': 'Camera fault', 'what': 'lens cap on: a spoiled photo after a PASS cell', 'cell': 2567,
     'buggy': {'lamp': 'PASS', 'counted': 'PASS', 'queued': True}, 'fixed': {'lamp': 'CHECK', 'counted': 'CHECK', 'queued': True}},
    {'k': 'model', 'name': 'Model not loaded', 'what': 'the PC restarted: no model, after a PASS cell',
     'buggy': {'lamp': 'PASS', 'counted': 'PASS', 'queued': False}, 'fixed': {'lamp': 'NO VERDICT', 'counted': 'NO VERDICT', 'queued': True}},
    {'k': 'flow', 'name': 'Flow error', 'what': 'a cell with no photo data, after a PASS cell',
     'buggy': {'lamp': 'PASS', 'counted': 'PASS', 'queued': False}, 'fixed': {'lamp': 'NO VERDICT', 'counted': 'NO VERDICT', 'queued': True}},
    {'k': 'empty', 'name': 'Empty queue', 'what': 'nothing waits, and the operator presses P',
     'buggy': {'lamp': None, 'counted': None, 'queued': False, 'moved': False}, 'fixed': {'lamp': None, 'counted': None, 'queued': False, 'moved': False}}]
S7['answerBack'] = {'buggy': 2, 'fixed': 1}     # a cell answered by the person: counted twice (starter) vs once (fixed)
S7['smoke'] = {'30': smoke['30_cells'], 'answer': smoke['answer_resumed'], 'why': smoke['why']}

# ---------------- a few more real photos (the cells 6-7 show big) ----------------
ELPV = next((p for p in ['/tmp/elpv/src/elpv_dataset/data/images', '/home/claude/dl/x/elpv_dataset/data/images'] if os.path.isdir(p)), None)
FJ = os.path.join(here, 'src/facts.json')
facts = json.load(open(FJ))
photos = facts.get('photos', {})
want = [c[0] for c in first[:12]] + [c[0] for c in S7['queue']['cells'][:6]] + [895, 801]
if ELPV:
    from PIL import Image
    for c in dict.fromkeys(want):
        if str(c) in photos: continue
        im = Image.open(os.path.join(ELPV, 'cell%04d.png' % c)).convert('L').resize((240, 240), Image.LANCZOS)
        bio = io.BytesIO(); im.save(bio, 'JPEG', quality=78, optimize=True); photos[str(c)] = base64.b64encode(bio.getvalue()).decode()
facts['s6'] = S6; facts['s7'] = S7; facts['photos'] = photos
open(FJ, 'w').write(json.dumps(facts, separators=(',', ':')))
print('s6 trace', len(tr), 'events; workers', [w['role'] for w in W])
print('s7 belt', cnt, 'median', smoke['median_ms'], 'ms; queue share %.3f needed %d/h' % (share, S7['queue']['needed']), '; board', S7['board']['all'], S7['board']['mono'], S7['board']['poly'])
print('s7 lamp cell %.0f px -> %.2f m; console %s' % (4.2 * U, readable(4.2 * U)[0], blocks[0]), '; held', S7['report']['heldCheck'])
print('photos', len(photos), '; wrote', FJ, os.path.getsize(FJ), 'bytes')
