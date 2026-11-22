// Test-only server for non-Playwright browsers (no request interception there): serves site/ and tools/cdn-mirror, and in the
// served engine.js ONLY, points PYODIDE_BASE at the local mirror (the shipped files are not changed).
import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const SITE = path.resolve(here, '../../site'); const MIR = path.resolve(here, '../cdn-mirror');
const PORT = +(process.argv[2] || 8799);
const T = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.zip': 'application/zip', '.whl': 'application/zip', '.png': 'image/png', '.md': 'text/markdown', '.css': 'text/css' };
http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
  const f = u.startsWith('/cdnmirror/') ? path.join(MIR, u.slice(10)) : path.join(SITE, u);
  const h = { 'access-control-allow-origin': '*', 'content-type': T[path.extname(f)] || 'application/octet-stream' };
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404, h); return r.end('nf'); }
  if (u === '/index.html') { r.writeHead(200, h); return r.end(fs.readFileSync(f, 'utf8').replace('<head>', '<head><script>window.__errs=[];addEventListener("error",function(e){__errs.push("ERR "+e.message)});addEventListener("unhandledrejection",function(e){__errs.push("UNH "+String(e.reason&&e.reason.message||e.reason))});(function(){var ce=console.error;console.error=function(){__errs.push([].slice.call(arguments).join(" "));ce.apply(console,arguments)}})();</script>')); }
  if (u === '/js/engine.js') { r.writeHead(200, h); return r.end(fs.readFileSync(f, 'utf8').replace("'https://cdn.jsdelivr.net/pyodide/v314.0.8/full/'", `'http://localhost:${PORT}/cdnmirror/pyodide/v314.0.8/full/'`)); }
  r.writeHead(200, h); fs.createReadStream(f).pipe(r);
}).listen(PORT, () => console.log('serving on', PORT));
