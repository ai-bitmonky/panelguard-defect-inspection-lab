import { loadPyodide } from '../site/pyodide/pyodide.mjs';
const t0=Date.now();
const py = await loadPyodide({ indexURL: new URL('../site/pyodide/', import.meta.url).pathname });
await py.loadPackage(['numpy','scipy','scikit-learn']);
console.log('loaded', (Date.now()-t0)/1000);
console.log(py.runPython('import sklearn,numpy,scipy,sys; f"{sys.version} sk{sklearn.__version__} np{numpy.__version__} sp{scipy.__version__}"'));
