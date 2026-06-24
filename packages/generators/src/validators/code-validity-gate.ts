import { ReasoningDetector } from './reasoning-detector';

export interface ValidityGateResult {
  isValid: boolean;
  reason?: string;
}

export class CodeValidityGate {
  static validate(extractedCode: string): ValidityGateResult {
    const trimmed = extractedCode.trimStart();
    if (!trimmed) {
      return { isValid: false, reason: 'INVALID_TYPESCRIPT_ARTIFACT: Empty output' };
    }

    // 1. First non-whitespace token check
    const validStarts = ['import', 'export', 'interface', 'type', 'const', 'function', 'enum'];
    const firstWord = trimmed.split(/[\s(;{]+/, 1)[0];
    
    if (!validStarts.includes(firstWord)) {
      return { isValid: false, reason: `INVALID_TYPESCRIPT_ARTIFACT: Starts with invalid token '${firstWord}'` };
    }

    // 2. Reject reasoning indicators before the first TypeScript declaration
    const lines = trimmed.split('\n');
    
    // We will consider lines up to the first actual block/assignment as 'preamble' to check.
    // Since CodeExtractor already sliced to a valid start, the first line IS a declaration or import.
    // But we will check the first 20 lines just in case reasoning is embedded in comments or immediately after imports.
    const linesToCheck = lines.slice(0, 20).join('\n');
    
    const detectorResult = ReasoningDetector.detectReasoning(linesToCheck);
    if (detectorResult.hasReasoning) {
      return { isValid: false, reason: `INVALID_TYPESCRIPT_ARTIFACT: Contains reasoning indicator '${detectorResult.matchedPhrase}'` };
    }

    return { isValid: true };
  }
}
