const fs = require('fs');
const path = require('path');
const { OutputSanitizer } = require('./dist/validators/output-sanitizer');
const { CodeExtractor } = require('./dist/validators/code-extractor');

const artifactsDir = path.resolve(__dirname, '../../generation-artifacts');

const cases = {
  'clean TSX': `import React from "react";\nexport default function Test() { return <div/>; }`,
  'markdown fences': `Here is the code:\n\`\`\`tsx\nimport React from "react";\nexport default function Test() { return <div/>; }\n\`\`\``,
  'closed think block': `<think>\nLet me design this.\n</think>\nimport React from "react";\nexport default function Test() { return <div/>; }`,
  'unclosed think block': `<think>\nLet me design this.\nimport React from "react";\nexport default function Test() { return <div/>; }`,
  'reasoning before imports': `First we need to set up the component.\nimport React from "react";\nexport default function Test() { return <div/>; }`,
  'reasoning before exports': `import React from "react";\nLet me export the component now.\nexport default function Test() { return <div/>; }`,
  'reasoning containing keyword \'function\'': `I will function this way.\nimport React from "react";\nexport default function Test() { return <div/>; }`,
  'reasoning containing keyword \'import\'': `Let's import the component.\nimport React from "react";\nexport default function Test() { return <div/>; }`
};

const report = {};

for (const [name, rawOutput] of Object.entries(cases)) {
  const sanitizedResult = OutputSanitizer.sanitizeWithDiagnostics(rawOutput);
  
  // Notice we use true for isSanitized to test CodeExtractor's new hardening
  const extracted = CodeExtractor.extract(sanitizedResult.code, true, 'Test');
  
  let passed = false;
  if (name === 'clean TSX' || name === 'markdown fences' || name === 'closed think block') {
    // These should completely succeed with no reasoning
    passed = sanitizedResult.diagnostics.success && extracted.success && !extracted.code.includes('Let me');
  } else {
    // The malformed ones should FAIL extraction/sanitization instead of silently leaking reasoning
    passed = !sanitizedResult.diagnostics.success || !extracted.success;
  }

  report[name] = {
    PASS: passed,
    sanitizedSuccess: sanitizedResult.diagnostics.success,
    extractedSuccess: extracted.success,
    extractedCodePreview: extracted.code ? extracted.code.substring(0, 50).replace(/\\n/g, ' ') : null,
    reason: extracted.reason || null
  };
}

fs.writeFileSync(path.join(artifactsDir, 'reasoning-regression-report.json'), JSON.stringify(report, null, 2));
console.log("Regression complete", report);
