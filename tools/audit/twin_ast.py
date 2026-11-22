# For the twins that are EXCERPTS (Steps 7-8): is each def / assignment in the displayed text identical (AST, comments ignored)
# to the one in the research script that was actually run? Lists every name that differs or is not in any run script.
import ast, json, os, glob
H = os.path.dirname(os.path.abspath(__file__)); T = json.load(open(os.path.join(H, 'twins.json')))
SRC = {os.path.basename(p): open(p).read() for p in glob.glob(os.path.join(H, '..', 'research', '*.py'))}
def defs(tree):
    out = {}
    for n in ast.walk(tree):
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)): out.setdefault(n.name, []).append(ast.dump(n, include_attributes=False))
        elif isinstance(n, ast.Assign) and len(n.targets) == 1 and isinstance(n.targets[0], ast.Name): out.setdefault(n.targets[0].id, []).append(ast.dump(n.value, include_attributes=False))
    return out
RD = {}
for k, s in SRC.items():
    try: RD[k] = defs(ast.parse(s))
    except SyntaxError as e: print('research script does not parse', k, e)
for cid in ['5b','5c','5d','5e','5f','5g','6b','6c','6d','6e','6f','7b','7c','7d','7e','7f','7g','8b','8c','8d','8e']:
    tw = T[cid]['twin']
    try: tree = ast.parse(tw)
    except SyntaxError as e: print(cid, 'DOES NOT PARSE:', e); continue
    D = defs(tree); same, diff, none = [], [], []
    for name, dumps in D.items():
        hits = [k for k, d in RD.items() if name in d]
        if not hits: none.append(name); continue
        if any(dumps[0] in RD[k][name] for k in hits): same.append(name)
        else: diff.append(name + '(' + ','.join(hits) + ')')
    print(cid, 'parses | same as run:', same, '| DIFFERENT:', diff, '| not in any run script:', none)
