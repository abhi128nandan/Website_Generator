import { CodeExtractor } from '../src/validators/code-extractor';

const rawOutput2 = `import React from 'react';\n\nexport default function TestComponent() {\n  return <div>Test</div>;\n}`;
const extractedResult2 = CodeExtractor.extract(rawOutput2, true, 'TestComponent');

console.log("Extraction is:", extractedResult2);
