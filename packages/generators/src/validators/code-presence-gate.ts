import { ReasoningDetector } from './reasoning-detector';

export class CodePresenceGate {
  static validate(code: string): { isValid: boolean; reason?: string } {
    const trimmed = code.trimStart().toLowerCase();
    
    const detectorResult = ReasoningDetector.detectReasoning(trimmed);
    if (detectorResult.hasReasoning) {
      return { isValid: false, reason: `REASONING_DETECTED: Output contains reasoning phrase '${detectorResult.matchedPhrase}'` };
    }

    return { isValid: true };
  }
}
