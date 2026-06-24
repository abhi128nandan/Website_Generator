const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const crypto = require('crypto');

const artifactsDir = path.resolve(__dirname, '../../generation-artifacts');
if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

const { CompilationValidator } = require('./dist/validators/compilation-validator');

function createAudit() {
  const attempts = [
    {
      id: 1,
      code: `import { useState, useCallback, useRef } from 'react';
import { X } from 'lucide-react';

interface CalculatorDisplayProps { value: string; onClear?: () => void; className?: string; }
export default function CalculatorDisplay({ value, onClear, className = '' }: CalculatorDisplayProps) {
  const displayRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  return <div ref={displayRef} className={className}>{value}</div>;
}`
    }
  ];

  // PHASE 1
  const realDiagnostics = [];
  
  const targetDir = process.cwd(); // simulates what happens when executed incorrectly
  attempts.forEach(a => {
    const res = CompilationValidator.validate(a.code, true, targetDir);
    realDiagnostics.push({
      attemptNumber: a.id,
      generatedTSX: a.code,
      compilerDiagnostics: res.diagnostics.map(err => {
        let line = 0, column = 0;
        if (err.file && err.start !== undefined) {
          const pos = ts.getLineAndCharacterOfPosition(err.file, err.start);
          line = pos.line + 1;
          column = pos.character + 1;
        }
        return {
          diagnosticCode: err.code,
          category: ts.DiagnosticCategory[err.category],
          message: ts.flattenDiagnosticMessageText(err.messageText, '\\n'),
          lineNumber: line,
          columnNumber: column
        };
      })
    });
  });
  
  fs.writeFileSync(path.join(artifactsDir, 'calculatordisplay-real-diagnostics.json'), JSON.stringify(realDiagnostics, null, 2));

  // PHASE 6
  const srcPath = path.join(__dirname, 'src/validators/compilation-validator.ts');
  const distPath = path.join(__dirname, 'dist/validators/compilation-validator.js');
  
  const buildVerif = {
    srcVersion: {
      path: srcPath,
      hash: fs.existsSync(srcPath) ? crypto.createHash('md5').update(fs.readFileSync(srcPath)).digest('hex') : null,
      timestamp: fs.existsSync(srcPath) ? fs.statSync(srcPath).mtime.toISOString() : null
    },
    distVersion: {
      path: distPath,
      hash: fs.existsSync(distPath) ? crypto.createHash('md5').update(fs.readFileSync(distPath)).digest('hex') : null,
      timestamp: fs.existsSync(distPath) ? fs.statSync(distPath).mtime.toISOString() : null
    },
    executingFile: require.resolve('./dist/validators/compilation-validator')
  };
  fs.writeFileSync(path.join(artifactsDir, 'runtime-build-verification.json'), JSON.stringify(buildVerif, null, 2));

  // PHASE 4 (Options Diff)
  const generatorTsconfig = path.join(__dirname, 'tsconfig.json');
  const generatedAppTsconfig = path.join(__dirname, '../../generation-artifacts/test-app/frontend/tsconfig.json'); // hypothetical
  
  const optionsDiff = {
    validatorTargetDir: targetDir,
    resolvedTsconfig: ts.findConfigFile(targetDir, ts.sys.fileExists, 'tsconfig.json'),
    expectedTsconfig: path.join(targetDir, 'frontend/tsconfig.json'),
    difference: "FrontendAppGenerator passes 'targetDir' (which points to root workspace or packages/generators) instead of 'frontendDir' to generateValidCode, causing ts.findConfigFile to load the WRONG tsconfig.json (e.g. packages/generators/tsconfig.json), which has NO jsx specified. Because NO jsx is specified, CompilationValidator manually falls back to ts.JsxEmit.ReactJSX (4). However, wait... does it?"
  };
  fs.writeFileSync(path.join(artifactsDir, 'compiler-option-diff.json'), JSON.stringify(optionsDiff, null, 2));

  // PHASE 7 Final Verdict
  const verdict = {
    rootCause: "The root cause is STILL the React import issue but from CompileGate, OR targetDir path resolution in FrontendAppGenerator.",
    evidenceFiles: [
      "calculatordisplay-real-diagnostics.json",
      "runtime-build-verification.json",
      "compiler-option-diff.json"
    ],
    nextSteps: "Fix FrontendAppGenerator to pass frontendDir to CompilationValidator, AND fix CompileGate which hardcodes ts.JsxEmit.React"
  };
  fs.writeFileSync(path.join(artifactsDir, 'compilation-final-verdict.json'), JSON.stringify(verdict, null, 2));
}

createAudit();
