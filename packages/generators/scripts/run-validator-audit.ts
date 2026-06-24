import { OutputSanitizer } from '../src/validators/output-sanitizer';
import { ArtifactIntegrityValidator } from '../src/validators/artifact-integrity-validator';
import { NonCodeDetector } from '../src/validation/non-code-detector';
import { CodeExtractor } from '../src/validators/code-extractor';
import fs from 'fs';
import path from 'path';

const rawOutput = `let me think...
perhaps I should use a div.

\`\`\`tsx
import React from 'react';

export default function TestComponent() {
  return <div>Test</div>;
}
\`\`\``;

const auditResults: any[] = [];

// 1. OutputSanitizer
const sanitizedResult = OutputSanitizer.sanitizeWithDiagnostics(rawOutput);
auditResults.push({
  validator: 'OutputSanitizer',
  input: 'raw',
  decision: sanitizedResult.diagnostics.success ? 'PASS' : 'REJECT',
  expectedDecision: 'PASS',
  falsePositive: !sanitizedResult.diagnostics.success
});

let code = sanitizedResult.code || rawOutput;
const extractedResult = CodeExtractor.extract(code, true, 'TestComponent');
let extractedCode = '';
if (typeof extractedResult === 'string') extractedCode = extractedResult;
else if (extractedResult && (extractedResult as any).code) extractedCode = (extractedResult as any).code;

auditResults.push({
  validator: 'CodeExtractor',
  input: 'sanitized',
  decision: extractedResult.success ? 'PASS' : 'REJECT',
  expectedDecision: 'PASS',
  falsePositive: !extractedResult.success
});

// 2. ArtifactIntegrityValidator
const integrityResult = ArtifactIntegrityValidator.validate(extractedCode, 'TestComponent', true);
auditResults.push({
  validator: 'ArtifactIntegrityValidator',
  input: 'extracted',
  decision: integrityResult.valid ? 'PASS' : 'REJECT',
  expectedDecision: 'PASS',
  falsePositive: !integrityResult.valid
});

// 3. NonCodeDetector
const nonCodeResult = NonCodeDetector.validate(extractedCode);
auditResults.push({
  validator: 'NonCodeDetector',
  input: 'extracted',
  decision: nonCodeResult.valid ? 'PASS' : 'REJECT',
  expectedDecision: 'PASS',
  falsePositive: !nonCodeResult.valid
});

const reportPath = path.join(process.cwd(), 'generation-artifacts', 'validator-audit.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2), 'utf8');

console.log('Audit complete. Check validator-audit.json');
