// Test-only stand-in for the CDN: serves the SAME Pyodide 314.0.8 files from tools/cdn-mirror (outside site/)
// when the page asks for the real constant URL. The real jsdelivr host is NOT reachable from this sandbox.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
export const CDN = 'https://cdn.jsdelivr.net/pyodide/v314.0.8/full/';
const MIRROR = path.resolve(here, '../cdn-mirror/pyodide/v314.0.8/full') + '/';
const T = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.zip': 'application/zip', '.whl': 'application/zip' };
export const hits = [];
export async function mirrorCDN(ctx, { block = false } = {}) {
  await ctx.route(CDN + '**', async (route) => {
    const name = route.request().url().slice(CDN.length).split('?')[0];
    hits.push(name);
    if (block) return route.abort('connectionrefused');
    const f = MIRROR + name;
    if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: 'nf', headers: { 'access-control-allow-origin': '*' } });
    return route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': T[path.extname(f)] || 'application/octet-stream', 'access-control-allow-origin': '*' } });
  });
}
