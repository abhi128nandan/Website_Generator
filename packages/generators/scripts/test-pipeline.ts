import * as fs from 'fs/promises';
import * as path from 'path';
import { OutputSanitizer } from '../src/validators/output-sanitizer';
import { CodeExtractor } from '../src/validators/code-extractor';
import { CodeValidityGate } from '../src/validators/code-validity-gate';

const testCases = [
  {
    id: 1,
    name: 'Pure TSX output',
    input: `import React from 'react';\nexport default function App() { return (\n<div>Hello</div>\n); }\n`,
    shouldReachSyntaxGate: true
  },
  {
    id: 2,
    name: 'Output with <think>',
    input: `<think>I need to create a react component</think>\nimport React from 'react';\nexport default function App() { return (\n<div>Hello</div>\n); }\n`,
    shouldReachSyntaxGate: true
  },
  {
    id: 3,
    name: 'Output with reasoning before code',
    input: `Let me think about this. The component should be simple.\n\nimport React from 'react';\nexport default function App() { return (\n<div>Hello</div>\n); }\n`,
    shouldReachSyntaxGate: false
  },
  {
    id: 4,
    name: 'Output with reasoning after code',
    input: `import React from 'react';\nexport default function App() { return (\n<div>Hello</div>\n); }\n\nThis is the implementation of the component. I hope this helps.`,
    shouldReachSyntaxGate: false
  },
  {
    id: 5,
    name: 'Output wrapped in markdown fences',
    input: `Here is the code:\n\`\`\`tsx\nimport React from 'react';\nexport default function App() { return (\n<div>Hello</div>\n); }\n\`\`\`\nLet me know if you need anything else.`,
    shouldReachSyntaxGate: true
  },
  {
    id: 6,
    name: 'Output with malformed TSX',
    input: `import React from 'react';\nexport default function App() { return (\n<div>Hello</div>\n); \n`, // Missing brace
    shouldReachSyntaxGate: false
  }
];

async function runTests() {
  const results = [];
  let allTestsPassed = true;

  for (const testCase of testCases) {
    let reachedSyntaxGate = true;
    let failedAtStage = null;
    let reason = null;

    try {
      // Stage 1: Sanitizer
      const sanitizedResult = OutputSanitizer.sanitizeWithDiagnostics(testCase.input);
      if (!sanitizedResult.diagnostics.success) {
        reachedSyntaxGate = false;
        failedAtStage = 'OutputSanitizer';
        reason = 'Remaining reasoning indicators found';
      }

      let code = sanitizedResult.code;

      if (reachedSyntaxGate) {
        // Stage 2: Code Extractor
        const extracted = CodeExtractor.extractCodeArtifact(code, true, 'TestComponent');
        if (!extracted.success) {
          reachedSyntaxGate = false;
          failedAtStage = 'CodeExtractor';
          reason = extracted.reason;
        }
        code = extracted.code;
      }

      if (reachedSyntaxGate) {
        // Stage 3: Validity Gate
        const validityGate = CodeValidityGate.validate(code);
        if (!validityGate.isValid) {
          reachedSyntaxGate = false;
          failedAtStage = 'CodeValidityGate';
          reason = validityGate.reason;
        }
      }

      const passed = reachedSyntaxGate === testCase.shouldReachSyntaxGate;
      if (!passed) allTestsPassed = false;

      results.push({
        id: testCase.id,
        name: testCase.name,
        passed,
        expectedReachSyntaxGate: testCase.shouldReachSyntaxGate,
        actualReachSyntaxGate: reachedSyntaxGate,
        failedAtStage,
        reason
      });

    } catch (e: any) {
      results.push({
        id: testCase.id,
        name: testCase.name,
        passed: false,
        error: e.message
      });
      allTestsPassed = false;
    }
  }

  const reportPath = path.resolve(__dirname, '../../generation-artifacts/pipeline-regression-report.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify({ allTestsPassed, results }, null, 2), 'utf-8');

  console.log(`Pipeline Regression Test completed. Passed: ${allTestsPassed}`);
  if (!allTestsPassed) {
    console.error('Some tests failed!');
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
