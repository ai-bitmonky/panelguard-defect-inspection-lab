// Right answer + plausible wrong answers for every gap (test-only; never shipped).
export const FILLS = {
  '1a': { right: ['uint8', '2624'], wrong: [['int8', '2624'], ['float32', '2624'], ['uint8', '64']], alsoRight: [['uint8', '-1']] },
  '1b': { right: ['mono', '0.67'], wrong: [['Mono', '0.67'], ['mono', '1.0'], ['mono', '0.5']] },
  '1c': { right: ['0.5'], wrong: [['0.33'], ['1.0'], ['0']], alsoRight: [['0.67'], ['0.6']] },
  '1d': { right: ['y'], wrong: [['None'], ['kind'], ['prob']] },
  '1e': { right: ['255', '4096'], wrong: [['256', '4096'], ['100', '4096'], ['255', '64']], alsoRight: [['255', '-1'], ['255.0', '64*64']] },
  '2a': { right: ['idx_train'], wrong: [[':'], ['idx_val'], ['idx_test']] },
  '2b': { right: ['5', 'idx_train'], wrong: [['3', 'idx_train'], ['5', 'idx_val'], ['1', 'idx_train']] },
  '2c': { right: ['1'], wrong: [['0'], ['2']] },
  '2d': { right: ['0.95'], wrong: [['95'], ['0.5'], ['0.9']] },
  '2e': { right: ['cut', 'tn'], wrong: [['0.5', 'tn'], ['cut', 'tp'], ['0.05', 'tn']] },
};
export function fill(code, vals) { let i = 0; return code.replace(/____/g, () => vals[i++]); }
// Step 3 (JavaScript cells)
Object.assign(FILLS, {
  '3a': { right: ['[2624, 64, 64, 1]', '255'], wrong: [['[64, 64, 2624, 1]', '255'], ['[2624, 64, 64]', '255'], ['[2624, 64, 64, 1]', '256'], ['[2624, 64, 64, 3]', '255']] },
  '3c': { right: ['1', '64', '1'], wrong: [['3', '64', '1'], ['1', '48', '1'], ['1', '64', '2']] },
  '3d': { right: ['2'], wrong: [['1'], ['0'], ['3']] },
  '3e': { right: ['binaryCrossentropy', 'nDef'], wrong: [['meanSquaredError', 'nDef'], ['binaryCrossEntropy', 'nDef'], ['binaryCrossentropy', 'nOk']] },
  '3f': { right: ['i', 'bestFar'], wrong: [['0', 'bestFar'], ['i', '1'], ['i', 'far']] },
  '3g': { right: ['0.05', '0.95'], wrong: [['5', '0.95'], ['0.95', '0.95'], ['0.05', '0.5']] },
});
// Step 4 (JavaScript cells)
Object.assign(FILLS, {
  '4b': { right: ['STEP', 'base'], wrong: [['SIZE', 'base'], ['STEP', '0'], ['1', 'base']] },
  '4c': { right: ['2', 'w', 'relu'], wrong: [['3', 'w', 'relu'], ['2', 'g', 'relu'], ['2', 'w', 'abs']] },
  '4d': { right: ['0.1', 'K'], wrong: [['10', 'K'], ['0.01', 'K'], ['0.1', '4096']] },
  '4e': { right: ["'pass'", "'poly'"], wrong: [["'stop'", "'poly'"], ["'pass'", "'mono'"], ["'person'", "'poly'"]] },
});
// Step 5 (JavaScript cells, LangGraph)
Object.assign(FILLS, {
  '5b': { right: ['concat', '[]'], wrong: [['push', '[]'], ['concat', 'null'], ['concat', "''"]] },
  '5c': { right: ['p', "'score'"], wrong: [['score', "'score'"], ['p', 'END'], ['p', 'score']] },
  '5d': { right: ['high', "'human_check'"], wrong: [['low', "'human_check'"], ['high', "'record'"], ['high', "'person'"]] },
  '5e': { right: ['2', "'human_check'"], wrong: [['Infinity', "'human_check'"], ['2', "'reshoot'"], ['2', "'record'"], ['3', "'human_check'"]] },
  '5f': { right: ['memory', 'resume'], wrong: [['undefined', 'resume'], ['memory', 'goto'], ['memory', 'update']] },
  '5g': { right: ['0.05', "'poly'"], wrong: [['5', "'poly'"], ['0.05', "'mono'"], ['0.5', "'poly'"]] },
});
