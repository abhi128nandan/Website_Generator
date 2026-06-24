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

function containsReasoning(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('let me think') || lower.includes('perhaps');
}

// 1. OutputSanitizer
const sanitizedResult = OutputSanitizer.sanitizeWithDiagnostics(rawOutput);
auditResults.push({
  validator: 'OutputSanitizer',
  inputExamined: 'raw',
  rejectionReason: sanitizedResult.diagnostics.success ? null : 'Success flag is false (Artifact count / Think block count / Reasoning indicators > 0)',
  rawContainsReasoning: containsReasoning(rawOutput),
  sanitizedContainsReasoning: containsReasoning(sanitizedResult.code),
  shouldReject: containsReasoning(sanitizedResult.code), // It should only reject if the SANITIZED code still has reasoning
  actualDecision: sanitizedResult.diagnostics.success ? 'PASS' : 'REJECT'
});

// Let's pretend the pipeline didn't throw and continued to extract
let code = sanitizedResult.code || rawOutput;
const extractedResult = CodeExtractor.extract(code);
let extractedCode = '';
if (typeof extractedResult === 'string') extractedCode = extractedResult;
else if (extractedResult && (extractedResult as any).code) extractedCode = (extractedResult as any).code;
else if (extractedResult && (extractedResult as any).extracted) extractedCode = (extractedResult as any).extracted;

// 2. ArtifactIntegrityValidator
const integrityResult = ArtifactIntegrityValidator.validate(extractedCode, 'TestComponent', true);
auditResults.push({
  validator: 'ArtifactIntegrityValidator',
  inputExamined: 'extracted',
  rejectionReason: integrityResult.valid ? null : integrityResult.reason,
  rawContainsReasoning: containsReasoning(rawOutput),
  sanitizedContainsReasoning: containsReasoning(extractedCode),
  shouldReject: false, // The extracted code is perfectly valid
  actualDecision: integrityResult.valid ? 'PASS' : 'REJECT'
});

// 3. NonCodeDetector
const nonCodeResult = NonCodeDetector.validate(extractedCode);
auditResults.push({
  validator: 'NonCodeDetector',
  inputExamined: 'extracted',
  rejectionReason: nonCodeResult.valid ? null : nonCodeResult.reason,
  rawContainsReasoning: containsReasoning(rawOutput),
  sanitizedContainsReasoning: containsReasoning(extractedCode),
  shouldReject: false,
  actualDecision: nonCodeResult.valid ? 'PASS' : 'REJECT'
});

const reportPath = path.join(process.cwd(), 'generation-artifacts', 'false-positive-audit.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2), 'utf8');

console.log('Audit complete. Check false-positive-audit.json');
