#!/usr/bin/env python3
"""Build ONE self-contained HTML file from site/ (same code, no fork).

- every <script src="js/..."> is inlined, plus js/pyworker.js (the page-thread kernel core and the worker source)
- own data files go into window.PG_EMBED (text inline, binaries base64); engine.js pgFetch() reads them
- Pyodide still comes from the single PYODIDE_BASE constant in engine.js (CDN)
Usage: python3 tools/build_single.py
"""
import base64, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
OUT = ROOT / 'dist' / 'PanelGuard_Defect_Inspection_Lab_v0.1.html'
TYPES = {'.png': 'image/png', '.json': 'application/json', '.md': 'text/markdown', '.js': 'text/javascript'}


def safe(js):            # nothing inside may close the <script> element
    return js.replace('</script', '<\\/script').replace('<!--', '<\\!--')


def main():
    emb = {}
    def add(rel, binary=False):
        f = SITE / rel
        t = TYPES[f.suffix]
        emb[rel] = {'type': t, 'b64': base64.b64encode(f.read_bytes()).decode()} if binary else {'type': t, 'text': f.read_text('utf-8')}
    add('data/labels.json'); add('data/full/index.json'); add('data/LICENSE.md'); add('js/pyworker.js')
    add('data/cells64_atlas.png', True)
    for pid in json.loads((SITE / 'data/full/index.json').read_text()):
        add('data/full/cell%04d.png' % pid, True)

    html = (SITE / 'index.html').read_text('utf-8')
    scripts = re.findall(r'<script src="(js/[\w.]+)"></script>', html)
    assert scripts, 'no scripts found'
    for s in scripts:
        html = html.replace('<script src="%s"></script>' % s, '<script>/* %s */\n%s\n</script>' % (s, safe((SITE / s).read_text('utf-8'))), 1)
    embed = '<script>window.PG_EMBED = %s;</script>\n<script>/* js/pyworker.js (kernel core for the page-thread fallback) */\n%s\n</script>\n' % (
        safe(json.dumps(emb, separators=(',', ':'))), safe((SITE / 'js/pyworker.js').read_text('utf-8')))
    first = html.index('<script>/* js/')
    html = html[:first] + embed + html[first:]
    left = re.findall(r'(?:src|href)="(?!https?:|data:|#)([^"]+)"', html)
    assert not left, 'relative references left: %s' % left
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, 'utf-8')
    print('wrote', OUT, '%.2f MB' % (OUT.stat().st_size / 1048576), '| embedded files:', len(emb))


if __name__ == '__main__':
    main()
