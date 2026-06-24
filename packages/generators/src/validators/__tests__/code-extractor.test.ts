import { CodeExtractor } from '../code-extractor';
import { OutputSanitizer } from '../output-sanitizer';

describe('CodeExtractor with OutputSanitizer integration', () => {
  it('Case A: reasoning before code, sanitizer removes reasoning, valid TSX remains, extraction succeeds', () => {
    const rawOutput = `Let me think first about how to build this...
Okay, here is the component.
\`\`\`tsx
import React from 'react';

// The first component is rendered
export default function MyComponent() {
  return <div>First!</div>;
}
\`\`\`
`;
    // Sanitizer removes the block before the fence.
    const sanitizedResult = OutputSanitizer.sanitizeWithDiagnostics(rawOutput);
    expect(sanitizedResult.diagnostics.success).toBe(true);

    // Extraction should succeed on the sanitized output, ignoring the word "first" in the valid TSX comment/jsx.
    const extracted = CodeExtractor.extractCodeArtifact(sanitizedResult.code, true, 'MyComponent', true);
    
    expect(extracted.success).toBe(true);
    expect(extracted.code).toContain('export default function MyComponent()');
  });

  it('Case B: reasoning after code, sanitizer removes reasoning, valid TSX remains, extraction succeeds', () => {
    const rawOutput = `
\`\`\`tsx
import React from 'react';
// We render the component here
export default function MyComponent() {
  return <div>Component</div>;
}
\`\`\`
I think this looks good. Let me know if you need anything else!
`;
    // Sanitizer removes the block after the fence.
    const sanitizedResult = OutputSanitizer.sanitizeWithDiagnostics(rawOutput);
    expect(sanitizedResult.diagnostics.success).toBe(true);

    // Extraction should succeed on the sanitized output, ignoring "the component" string in valid TSX comment
    const extracted = CodeExtractor.extractCodeArtifact(sanitizedResult.code, true, 'MyComponent', true);
    
    expect(extracted.success).toBe(true);
    expect(extracted.code).toContain('export default function MyComponent()');
  });

  it('Case C: reasoning survives sanitization, extraction fails', () => {
    // Here, there are no fences, and reasoning is mixed into the text
    const rawOutput = `Let me think...
import React from 'react';
export default function MyComponent() {
  return <div>First!</div>;
}`;

    // Sanitizer cannot remove this because it's not well-formed markdown/xml
    const sanitizedResult = OutputSanitizer.sanitizeWithDiagnostics(rawOutput);
    
    // OutputSanitizer should report failure because it detected reasoning without fences
    expect(sanitizedResult.diagnostics.success).toBe(false);

    // If we were to pass this to CodeExtractor with isSanitized=false (because sanitization failed or wasn't trusted)
    const extracted = CodeExtractor.extractCodeArtifact(sanitizedResult.code, true, 'MyComponent', false);
    
    expect(extracted.success).toBe(false);
    expect(extracted.reason).toContain('Reasoning detected ->');
  });
});
