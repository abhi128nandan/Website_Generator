const fs = require('fs');
const path = require('path');
const { CompilationValidator } = require('./dist/validators/compilation-validator');
const { CompileGate } = require('./dist/validators/compile-gate');

const cases = {
  'ModernReactComponent': 'export default function Test() { return <div>Hello</div>; }',
  'LegacyReactComponent': 'import React from "react";\nexport default function Test() { return <div>Hello</div>; }',
  'GenericState': 'import { useState } from "react";\nexport default function Test() { const [a, b] = useState<boolean>(); return <div/>; }',
  'GenericRef': 'import { useRef } from "react";\nexport default function Test() { const a = useRef<HTMLInputElement>(); return <div/>; }'
};

const targetDir = process.cwd(); // This is the root of the generators package where tsconfig is blocked

const report = {};
for (const [name, code] of Object.entries(cases)) {
  const compRes = CompilationValidator.validate(code, true, targetDir);
  const gateRes = CompileGate.validate(code, true, name, path.join(targetDir, '../../generation-artifacts'));
  
  report[name] = {
    CompilationValidator: {
      success: compRes.success,
      diagnostics: compRes.diagnostics.map(d => d.messageText)
    },
    CompileGate: {
      success: gateRes.isValid,
      error: gateRes.error || null,
      transpileErrors: gateRes.transpileErrors || []
    }
  };
}

const artifactsDir = path.resolve(__dirname, '../../generation-artifacts');
fs.writeFileSync(path.join(artifactsDir, 'compiler-regression-results.json'), JSON.stringify(report, null, 2));

console.log("Regression testing finished.", report);
