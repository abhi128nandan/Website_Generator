import { OutputSanitizer } from '../src/validators/output-sanitizer';
import { CodeExtractor } from '../src/validators/code-extractor';

const rawOutput = `let me think...
perhaps I should use a div.

\`\`\`tsx
import React from 'react';

export default function TestComponent() {
  return <div>Test</div>;
}
\`\`\``;

const sanitizedResult = OutputSanitizer.sanitizeWithDiagnostics(rawOutput);
console.log("Sanitized Code:", sanitizedResult.code);

const rawOutput2 = `import React from 'react';\n\nexport default function TestComponent() {\n  return <div>Test</div>;\n}`;
const extractedResult2 = CodeExtractor.extract(rawOutput2, true, 'TestComponent');
console.log("Extracted Result 2:", extractedResult2);
