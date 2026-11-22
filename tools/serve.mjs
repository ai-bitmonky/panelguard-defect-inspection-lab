import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve(process.argv[2] || '../site'); const port = +(process.argv[3] || 8765);
const T = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.zip': 'application/zip', '.whl': 'application/zip', '.png': 'image/png', '.u8': 'application/octet-stream', '.md': 'text/markdown' };
http.createServer((q, s) => {
  const p = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root)) { s.writeHead(403); return s.end(); }
  fs.stat(p, (e, st) => { if (e) { s.writeHead(404); return s.end('nf'); }
    s.writeHead(200, { ...(process.env.CORS ? { 'access-control-allow-origin': '*' } : {}), ...(process.env.CSP && p.endsWith('.html') ? { 'content-security-policy': process.env.CSP } : {}), 'content-type': T[path.extname(p)] || 'application/octet-stream', 'content-length': st.size }); fs.createReadStream(p).pipe(s); });
}).listen(port, () => console.log('serving', root, port));
