# For every displayed twin: is its exact text inside a research script that was run? Which script, and is it line-for-line contiguous?
import json, os, glob, sys
T = json.load(open(os.path.join(os.path.dirname(__file__), 'twins.json')))
scripts = {p: open(p).read() for p in glob.glob(os.path.join(os.path.dirname(__file__), '..', 'research', '*.py'))}
norm = lambda s: '\n'.join(l.rstrip() for l in s.strip('\n').split('\n'))
for cid, v in T.items():
    if not v['twin']: continue
    tw = norm(v['twin']); hit = [os.path.basename(p) for p, s in scripts.items() if tw in norm(s)]
    if hit: print(cid, 'VERBATIM in', hit); continue
    # line-level: which lines are missing from every script
    lines = [l.strip() for l in tw.split('\n') if l.strip() and not l.strip().startswith('#')]
    best = None
    for p, s in scripts.items():
        ss = set(x.strip() for x in s.split('\n')); miss = [l for l in lines if l not in ss]
        if best is None or len(miss) < len(best[1]): best = (os.path.basename(p), miss)
    print(cid, 'NOT verbatim; closest', best[0], 'missing', len(best[1]), 'of', len(lines), 'lines:', best[1][:6])
