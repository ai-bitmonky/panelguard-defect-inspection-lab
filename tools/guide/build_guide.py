"""Build the lab with the NEW Diagram guide.
Takes tools/guide/base/PanelGuard_Refined_Student_Lab_base.html, removes the old guide UI script (script B: DATA + SVGs + overlay)
and its style block, keeps the old guide's text data (script A: window.PGTeach), injects the new guide from tools/guide/src,
and writes dist/PanelGuard_Refined_Student_Lab_v<VERSION>.html. The lab itself is not changed.
Run: python3 -I tools/guide/build_guide.py [--out path]"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(HERE, 'src')
VERSION = '2.3'
BASE = os.path.join(HERE, 'base', 'PanelGuard_Refined_Student_Lab_base.html')
OUT = os.path.join(ROOT, 'dist', 'PanelGuard_Refined_Student_Lab_v%s.html' % VERSION)
# load order: data first, then the engine, the diagram files (one per step group), the shell last
JS = ['legacy.js', 'engine.js', 'diagrams_step0.js', 'diagrams_step1.js', 'diagrams_step2.js', 'diagrams_step3.js', 'diagrams_step4.js', 'diagrams_step5.js', 'diagrams_step6.js', 'diagrams_step7.js', 'shell.js']


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def block(html, opener, tag):
    """(start, end) of the first <tag>…</tag> whose text starts with opener."""
    i = html.find(opener)
    if i < 0:
        raise SystemExit('not found: %r' % opener[:60])
    j = html.find('</%s>' % tag, i)
    return i, j + len('</%s>' % tag)


def main():
    out = OUT
    if '--out' in sys.argv:
        out = sys.argv[sys.argv.index('--out') + 1]
    html = read(BASE)
    n0 = len(html)
    # 1. the old guide's style block
    a, b = block(html, '<style>\n.pgr-step-help', 'style')
    css = read(os.path.join(SRC, 'guide.css'))
    assert '</style' not in css
    html = html[:a] + '<style id="pgd-css">\n' + css + '\n</style>' + html[b:]
    # 2. the old guide UI script (B); script A (window.PGTeach) stays
    a, b = block(html, "<script>\n(function(){\n'use strict';\nconst DATA=", 'script')
    assert 'window.PGTeach' in html[:a], 'script A (PGTeach) must come before script B'
    facts = json.load(open(os.path.join(SRC, 'facts.json'), encoding='utf-8'))
    parts = ['<script id="pgd-facts">window.PGD_FACTS = %s;</script>' % json.dumps(facts, separators=(',', ':'))]
    for name in JS:
        js = read(os.path.join(SRC, name))
        if re.search(r'</script', js, re.I):
            raise SystemExit('%s contains </script' % name)
        parts.append('<script id="pgd-%s">\n/* tools/guide/src/%s */\n%s\n</script>' % (name.replace('.js', ''), name, js))
    html = html[:a] + '\n'.join(parts) + html[b:]
    # 3. sanity: no old guide left, engine still last
    assert 'function buildGuide(){dialog=' not in html and '.pgr-step-help' not in html
    assert html.rfind('/* js/engine.js */') > html.rfind('pgd-shell'), 'the guide must load before engine.js'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    print('wrote %s  (%s bytes; base %s)' % (os.path.relpath(out, ROOT), format(len(html.encode('utf-8')), ','), format(n0, ',')))


if __name__ == '__main__':
    main()
