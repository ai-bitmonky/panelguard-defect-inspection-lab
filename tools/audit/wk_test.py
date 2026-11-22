"""AUDIT item 7: a SECOND browser engine — WebKitGTK 2.52 (MiniBrowser via WebKitWebDriver, Selenium), site served by
serve_rewrite.mjs (Pyodide from the local mirror). Load, atlas byte hash, Steps 0-2 (review Run up to here 2e), then the fixture
start state: every Step 1-7 cell replays (JS cells of Steps 3-7 for real), then review Run up to here on 8e (8b-8d JS + 8e Python)."""
import json, time, hashlib, os, sys
from selenium import webdriver
from selenium.webdriver.webkitgtk.options import Options
os.environ['NO_PROXY'] = os.environ['no_proxy'] = 'localhost,127.0.0.1'
URL = 'http://localhost:8799/index.html'; T0 = time.time(); fails = []
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
def expect(ok, what): log('OK  ' if ok else 'FAIL', what); (fails.append(what) if not ok else None)
o = Options(); o.binary_location = '/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser'; o.add_argument('--automation')
d = webdriver.Remote('http://localhost:4445', options=o); d.set_script_timeout(3600); d.set_window_size(1366, 768)
js = d.execute_script
def wait(cond, t, what):
    t1 = time.time()
    while time.time() - t1 < t:
        try:
            if js('return ' + cond): return True
        except Exception as e: pass
        time.sleep(3)
    expect(False, 'timeout waiting for ' + what); return False
d.get(URL)
log('UA', js('return navigator.userAgent'))
wait('!!(window.PG && window.PG.S)', 120, 'app')
wait('window.PG.ready() && window.PG.JSR.ready', 1800, 'Python + TF.js ready')
log('kernels', js('return JSON.stringify({py: window.PG.K.mode, tf: window.PG.JSR.backend, gpu: (window.PG.JSR.gpu||{}).name})'), round(time.time() - T0), 's')
ref = hashlib.sha256(open('/home/claude/panelguard/tools/ref/cells64.u8', 'rb').read()).hexdigest()
got = d.execute_async_script('var done = arguments[0]; crypto.subtle.digest("SHA-256", window.PG.pack()).then(function (h) { done(Array.from(new Uint8Array(h)).map(function (x) { return x.toString(16).padStart(2, "0"); }).join("")); }, function (e) { done("ERR " + e); });')
expect(got == ref, 'atlas byte hash identical to cells64.u8 (' + got[:16] + ')')
# Step 0 pages + review Run up to here 2e (Python 1a-2e)
d.find_element('id', 'revbtn').click(); time.sleep(2)
for i in ['0a', '0b', '0c', '0d']: js("location.hash = '#sub-%s'" % i); time.sleep(1); expect(js('return window.PG.S.cur') == i, 'opens ' + i)
js("location.hash = '#sub-2e'"); time.sleep(1.5); d.find_element('id', 'runupto').click(); time.sleep(2)
wait('!window.PG.runningUpTo()', 1800, 'run up to 2e'); v = js("return window.PG.VERD['2e']"); expect(bool(v and v['pass']), '2e (Python 1a-2e) passes: ' + str(v and v['msg'])[:120])
# fixture start state, reload, every passed cell replays
log('errors so far', js('return window.__errs'))
d.find_element('id', 'revbtn').click(); time.sleep(4)
st = json.load(open('/tmp/wk_state.json'))
r = d.execute_async_script(open('/tmp/wk_fix.js').read()); expect(r == 'ok', 'fixture model saved in IndexedDB: ' + r)
js('localStorage.setItem(arguments[0], arguments[1])', st['KEY'], st['state']); d.refresh(); t = time.time()
wait("window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['7g']", 3600, 'replay of Steps 1-7')
np = js("return window.PG.ORDER.filter(function (i) { return i < '8' && !window.PG.passed(i); })")
expect(not np, 'WebKit replayed every Step 1-7 cell (JS Steps 3-7 for real) in %d s; not passed: %s' % (time.time() - t, np))
for i in ['3g', '4e', '5g', '6f', '7e']: log(i, str(js("return window.PG.VERD['%s'] && window.PG.VERD['%s'].msg" % (i, i)))[:150])
d.find_element('id', 'revbtn').click(); time.sleep(2); js("location.hash = '#sub-8e'"); time.sleep(1.5); d.find_element('id', 'runupto').click(); time.sleep(2)
wait('!window.PG.runningUpTo()', 3600, 'run up to 8e')
for i in ['8b', '8c', '8d', '8e']: v = js("return window.PG.VERD['%s']" % i); expect(bool(v and v['pass']), i + ': ' + str(v and v['msg'])[:150])
errs = js("return window.__errs || []"); expect(not errs, "zero console errors / uncaught errors in WebKit (last session): " + str(errs)[:400])
d.save_screenshot('/home/claude/panelguard/tools/audit/shots/wk_8e.png')
log('TOTAL', round(time.time() - T0), 's FAILS', len(fails), fails); d.quit()
