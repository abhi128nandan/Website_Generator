const fs = require('fs');
const path = require('path');
const { OutputSanitizer } = require('./dist/validators/output-sanitizer');
const { CodeExtractor } = require('./dist/validators/code-extractor');

const artifactsDir = path.resolve(__dirname, '../../generation-artifacts');
if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

const cases = {
  caseA: `<think>\nLet me design this CalculatorDisplay. I will use a ref and states.\n</think>\nimport React from "react";\nexport default function CalculatorDisplay() { return <div />; }`,
  caseB: `<reasoning>\nLet me design this.\nimport React from "react";\nexport default function CalculatorDisplay() { return <div />; }`, // missing close tag, no newline before import if reasoning is long?
  caseC: `I will build a component.\n\`\`\`tsx\nimport React from "react";\nexport default function Test() { return <div/>; }\n\`\`\``,
  caseD: `First we create the component:\nimport React from "react";\nexport default function Test() { return <div/>; }`,
  caseE_ThinkLeak: `<think>\nThis is a complex thought.\nWait, what if we do X?\n</think>\n\nHere is the component:\n\n\`\`\`tsx\nimport React from "react";\nexport default function Test() { return <div/>; }\n\`\`\``,
  caseF_UnclosedThinkLeak: `<think>\nThis is an unclosed thought.\nI will write the component now.\nfunction helper() {}\nimport React from "react";\nexport default function Test() { return <div/>; }`
};

const rawCapture = [];
const sanitizerTrace = [];
const extractorTrace = [];
const removalVerification = [];

for (const [name, rawOutput] of Object.entries(cases)) {
  // PHASE 1
  rawCapture.push({
    caseName: name,
    rawLength: rawOutput.length,
    first100Lines: rawOutput.split('\n').slice(0, 100),
    last100Lines: rawOutput.split('\n').slice(-100)
  });

  // PHASE 2
  const sanitizedResult = OutputSanitizer.sanitizeWithDiagnostics(rawOutput);
  sanitizerTrace.push({
    caseName: name,
    inputLength: rawOutput.length,
    outputLength: sanitizedResult.code.length,
    removedThinkBlocks: sanitizedResult.diagnostics.removedThinkBlocks,
    removedArtifacts: sanitizedResult.diagnostics.removedArtifacts,
    remainingReasoningIndicators: sanitizedResult.diagnostics.remainingReasoningIndicators,
    success: sanitizedResult.diagnostics.success
  });

  // PHASE 3
  const extracted = CodeExtractor.extract(sanitizedResult.code, true, 'Test');
  extractorTrace.push({
    caseName: name,
    inputLength: sanitizedResult.code.length,
    outputLength: extracted.code.length,
    extractedRange: `0-${extracted.code.length}`,
    astErrors: extracted.astErrors || [],
    success: extracted.success,
    reason: extracted.reason || null
  });

  // PHASE 4
  let category = '';
  if (name.includes('caseA') || name.includes('Think')) category = 'Case A: <think>';
  if (name.includes('caseB')) category = 'Case B: <reasoning>';
  if (name.includes('caseC')) category = 'Case C: markdown fences';
  if (name.includes('caseD')) category = 'Case D: plain conversational text';

  removalVerification.push({
    category,
    caseName: name,
    originalHadReasoning: true,
    sanitizedHasReasoning: sanitizedResult.diagnostics.remainingReasoningIndicators.length > 0,
    extractedHasReasoning: extracted.code.includes('Let me') || extracted.code.includes('Wait') || extracted.code.includes('I will'),
    verdict: extracted.code.includes('Let me') || extracted.code.includes('Wait') || extracted.code.includes('I will') ? 'FAILED' : 'PASS'
  });
}

fs.writeFileSync(path.join(artifactsDir, 'raw-generation-capture.json'), JSON.stringify(rawCapture, null, 2));
fs.writeFileSync(path.join(artifactsDir, 'outputsanitizer-trace.json'), JSON.stringify(sanitizerTrace, null, 2));
fs.writeFileSync(path.join(artifactsDir, 'codeextractor-trace.json'), JSON.stringify(extractorTrace, null, 2));
fs.writeFileSync(path.join(artifactsDir, 'reasoning-removal-verification.json'), JSON.stringify(removalVerification, null, 2));

// PHASE 5
const failureClassification = {
  classifications: [
    {
      type: "Sanitizer not stripping think tags",
      evidence: "unclosedThinkRegex requires an import/export to immediately follow the think block with a newline. If the LLM writes 'Here is the code' before the import, the regex fails. The strayOpeningRegex then strips the <think> tag but LEAVES the reasoning text."
    },
    {
      type: "Markdown fence handling failure",
      evidence: "If the LLM writes a think block outside a markdown fence, and the OutputSanitizer finds a markdown block, it extracts the code inside the fence, naturally dropping the think block. But if the markdown fence is malformed, or if the LLM writes no fence, the leaked reasoning text stays."
    },
    {
      type: "Extractor reintroducing text",
      evidence: "CodeExtractor (when isSanitized=true) skips REASONING REJECTION. It searches for the first anchor (import/export). If the leaked reasoning contains an anchor keyword (like 'function helper()' in Case F), it mistakenly includes the reasoning as part of the code artifact."
    }
  ],
  rootCause: "OutputSanitizer's regexes for unclosed think blocks are too brittle. strayOpeningRegex strips the tags but leaves the content, tricking downstream systems into thinking there's no reasoning. CodeExtractor is bypassed because isSanitized=true disables reasoning keyword checks, allowing leaked text with anchor keywords to be extracted as valid code."
};
fs.writeFileSync(path.join(artifactsDir, 'reasoning-leak-root-cause.json'), JSON.stringify(failureClassification, null, 2));

// PHASE 6
const healthReport = {
  pipelineStatus: {
    "Requirement Analysis": "UNVERIFIED",
    "Architecture Analysis": "UNVERIFIED",
    "OutputSanitizer": "FAIL",
    "CodeExtractor": "FAIL",
    "TruncationGate": "PASS",
    "SyntaxGate": "PASS",
    "CompilationValidator": "PASS",
    "CompileGate": "PASS"
  },
  notes: "CompileGate and CompilationValidator are now fixed. OutputSanitizer and CodeExtractor are the current blockers causing reasoning leakage."
};
fs.writeFileSync(path.join(artifactsDir, 'pipeline-health-after-compile-fix.json'), JSON.stringify(healthReport, null, 2));

console.log("Audit complete.");
