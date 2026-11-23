/* PanelGuard Python kernel: Pyodide + scikit-learn.
   Runs as a module Web Worker, or (fallback) in the page, or under Node for tests.
   Messages in:  {cmd:'init', pyBase} {cmd:'data', buf, labels} {cmd:'run', id, code, probe} {cmd:'eval', id, code}
   Messages out: {type:'progress'|'ready'|'stdout'|'result'|'fatal', ...} */
(function (G) {
'use strict';

var BOOT = [
'import sys, json, traceback, time',
'_PG_NS = {"__name__": "__main__"}',
'def _pg_tb(e):',
'    tb = e.__traceback__.tb_next if e.__traceback__ is not None else None',
'    return "".join(traceback.format_exception(type(e), e, tb))',
'def _pg_exec(src):',
'    t = time.time(); err = None',
'    try:',
'        exec(compile(src, "<your code>", "exec"), _PG_NS)',
'    except BaseException as e:',
'        line = e.lineno if isinstance(e, SyntaxError) else None',
'        for fr in traceback.extract_tb(e.__traceback__):',
'            if fr.filename == "<your code>": line = fr.lineno',
'        err = {"type": type(e).__name__, "msg": str(e), "line": line, "tb": _pg_tb(e)}',
'    sys.stdout.flush(); sys.stderr.flush()',
'    return json.dumps({"error": err, "ms": int((time.time() - t) * 1000)})',
'def _pg_default(o):',
'    if hasattr(o, "tolist"): return o.tolist()',
'    if hasattr(o, "item"): return o.item()',
'    return str(o)',
'def _pg_probe(src):',
'    try:',
'        _PG_NS.pop("_r", None)',
'        exec(compile(src, "<check>", "exec"), _PG_NS)',
'        return json.dumps(_PG_NS.get("_r"), default=_pg_default)',
'    except BaseException as e:',
'        return json.dumps({"probe_error": type(e).__name__ + ": " + str(e)})'
].join('\n');

/* Tiny WebAssembly probe (8-byte empty module): compile + instantiate. False when a viewer's CSP blocks WebAssembly. */
function wasmWorks() {
  try {
    if (typeof WebAssembly === 'undefined') return Promise.resolve(false);
    return WebAssembly.instantiate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])).then(function (r) { return !!(r && r.instance); }, function () { return false; });
  } catch (e) { return Promise.resolve(false); }
}
G.PGWasmWorks = wasmWorks;

function Core(post, loadPyodideFn, helpCode) {
  var py = null, dataIn = false, pyIn = false, curId = null;
  var WEIGHTS = { core: 12.1, numpy: 3.0, scipy: 14.0, sklearn: 4.7 };   // MB, real file sizes
  var TOTAL = 33.8, done = 0;
  function prog(addMB, text) { done += addMB; post({ type: 'progress', pyMB: done, pyTotal: TOTAL, text: text }); }
  function maybeReady() {
    if (dataIn && pyIn) {
      var v = py.runPython('import sklearn, numpy, scipy, sys; json.dumps({"python": sys.version.split()[0], "sklearn": sklearn.__version__, "numpy": numpy.__version__, "scipy": scipy.__version__})');
      post({ type: 'ready', versions: JSON.parse(v), pyodide: py.version });
    }
  }
  var stageURL = '';
  async function init(pyBase) {
    if (!(await wasmWorks())) { post({ type: 'fatal', wasmBlocked: true, text: 'WebAssembly is blocked here' }); return; }
    try {
      prog(0, 'Starting Python (Pyodide core, 12 MB)…');
      stageURL = pyBase + 'pyodide.asm.wasm';
      py = await loadPyodideFn({ indexURL: pyBase, stdout: function () {}, stderr: function () {} });
      prog(WEIGHTS.core, 'Loading numpy (3 MB)…');
      stageURL = pyBase + 'numpy-*.whl';
      var quiet = { messageCallback: function () {}, errorCallback: function (m) { post({ type: 'stdout', id: null, text: m, err: true }); } };
      await py.loadPackage(['numpy'], quiet);
      prog(WEIGHTS.numpy, 'Loading scipy (14 MB, the biggest part)…');
      stageURL = pyBase + 'scipy-*.whl';
      await py.loadPackage(['scipy'], quiet);
      prog(WEIGHTS.scipy, 'Loading scikit-learn (5 MB)…');
      stageURL = pyBase + 'scikit_learn-*.whl';
      await py.loadPackage(['scikit-learn'], quiet);
      prog(WEIGHTS.sklearn, 'Python is ready.');
      py.runPython(BOOT);
      py.globals.set('_pg_src', helpCode || '');
      py.runPython('_pg_exec(_pg_src)');
      py.setStdout({ batched: function (s) { post({ type: 'stdout', id: curId, text: s }); } });
      py.setStderr({ batched: function (s) { post({ type: 'stdout', id: curId, text: s, err: true }); } });
      try { py.FS.mkdir('/data'); } catch (e) {}
      pyIn = true; maybeReady();
    } catch (e) {
      post({ type: 'fatal', text: 'Python could not be loaded from ' + stageURL + ' — ' + (e && e.message ? e.message : String(e)) });
    }
  }
  function data(buf, labels) {
    var go = function () {
      py.FS.writeFile('/data/cells64.u8', new Uint8Array(buf));
      py.FS.writeFile('/data/labels.json', labels);
      dataIn = true; maybeReady();
    };
    if (py && pyIn) go(); else { var t = setInterval(function () { if (py && pyIn) { clearInterval(t); go(); } }, 50); }
  }
  function run(m) {
    curId = m.id;
    var out = { type: 'result', id: m.id };
    try {
      if (m.code != null) {
        py.globals.set('_pg_src', m.code);
        var r = JSON.parse(py.runPython('_pg_exec(_pg_src)'));
        out.error = r.error; out.ms = r.ms;
      }
      if (m.probe && !out.error) {
        py.globals.set('_pg_src', m.probe);
        out.probe = JSON.parse(py.runPython('_pg_probe(_pg_src)'));
      }
    } catch (e) {
      out.error = { type: 'KernelError', msg: String(e && e.message || e), line: null, tb: String(e && e.stack || e) };
    }
    curId = null;
    post(out);
  }
  return function handle(m) {
    if (m.cmd === 'init') init(m.pyBase);
    else if (m.cmd === 'data') data(m.buf, m.labels);
    else if (m.cmd === 'run') run(m);
    else if (m.cmd === 'eval') run({ id: m.id, code: null, probe: m.code });
  };
}

G.PGKernelCore = Core;
G.PGKernelBoot = BOOT;

/* Running as a dedicated (module) worker? Pyodide 314 needs a module worker: it refuses classic workers. */
if (typeof WorkerGlobalScope !== 'undefined' && G instanceof WorkerGlobalScope) {
  var handle = null, queue = [];
  G.onmessage = function (ev) {
    var m = ev.data;
    if (m.cmd === 'init') {
      if (!handle && !G._pgProbed) { G._pgProbed = 1; wasmWorks().then(function (ok) { if (!ok) postMessage({ type: 'fatal', wasmBlocked: true, text: 'WebAssembly is blocked in this worker' }); else G.onmessage(ev); }); return; }
      // Classic worker (used inside opaque-origin sandboxes, where module blob workers fail):
      // Pyodide 314 probes importScripts() to refuse classic workers, so hide it; Pyodide itself only uses import().
      if (typeof G.importScripts === 'function') G.importScripts = function () { throw new Error('importScripts is disabled in the PanelGuard kernel'); };
      import(m.pyBase + 'pyodide.mjs').then(function (mod) {
        handle = Core(function (x) { postMessage(x); }, mod.loadPyodide, m.help);
        handle(m); queue.forEach(handle); queue = [];
      }, function (e) { postMessage({ type: 'fatal', text: 'Could not load ' + m.pyBase + 'pyodide.mjs — ' + String(e && e.message || e) }); });
    } else if (handle) handle(m); else queue.push(m);
  };
}
})(typeof self !== 'undefined' ? self : globalThis);
