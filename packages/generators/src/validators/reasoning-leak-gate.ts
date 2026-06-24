import { ReasoningDetector } from './reasoning-detector';

export class ReasoningLeakGate {
  static validate(code: string): { isValid: boolean; reason?: string } {
    const lines = code.split('\n').slice(0, 30);
    const targetText = lines.join('\n').toLowerCase();

    const detectorResult = ReasoningDetector.detectReasoning(targetText);
    if (detectorResult.hasReasoning) {
      return { isValid: false, reason: `REASONING_LEAK: Contains forbidden phrase '${detectorResult.matchedPhrase}' in first 30 lines.` };
    }

    return { isValid: true };
  }
}
