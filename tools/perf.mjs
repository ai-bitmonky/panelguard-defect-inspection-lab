import { loadPyodide } from '../site/pyodide/pyodide.mjs';
import fs from 'fs';
const py = await loadPyodide({ indexURL: new URL('../site/pyodide/', import.meta.url).pathname });
await py.loadPackage(['numpy','scipy','scikit-learn'],{messageCallback:()=>{}});
py.FS.mkdir('/data'); py.FS.writeFile('/data/cells64.u8', fs.readFileSync('../site/data/cells64.u8'));
py.FS.writeFile('/data/labels.json', fs.readFileSync('../site/data/labels.json'));
const code = fs.readFileSync(process.argv[2],'utf8');
const t=Date.now(); py.setStdout({batched:s=>console.log(s)});
await py.runPythonAsync(code); console.log('total',(Date.now()-t)/1000);
