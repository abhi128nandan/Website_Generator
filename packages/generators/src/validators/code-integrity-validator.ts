import { ReasoningDetector } from './reasoning-detector';

export interface CodeIntegrityResult {
  valid: boolean;
  reason?: string;
  preview?: string;
}

export class CodeIntegrityValidator {
  static validate(content: string, artifactName: string, isTsx: boolean): CodeIntegrityResult {
    const trimmed = content.trim();
    if (!trimmed) {
      return { valid: false, reason: "Empty response", preview: "" };
    }

    const lower = trimmed.toLowerCase();
    const preview = trimmed.substring(0, 100).replace(/\n/g, ' ');

    // 1. Reject specific reasoning phrases
    const detectorResult = ReasoningDetector.detectReasoning(trimmed);
    if (detectorResult.hasReasoning) {
      return { valid: false, reason: `Contains reasoning phrase: '${detectorResult.matchedPhrase}'`, preview };
    }

    // 2. Reject if starts with plain English
    const validStarters = ['import', 'export', 'interface', 'type', 'const', 'let', 'function', 'class', 'enum'];
    const firstWord = trimmed.split(/\s+/)[0];
    if (!validStarters.includes(firstWord)) {
      return { valid: false, reason: `Starts with invalid token: '${firstWord}'`, preview };
    }

    // 3. Reject if doesn't contain at least one required keyword
    const hasRequiredKeyword = validStarters.some(keyword => new RegExp(`\\b${keyword}\\b`).test(trimmed));
    if (!hasRequiredKeyword) {
      return { valid: false, reason: "Missing required TypeScript keywords", preview };
    }

    // 4. Reject if contains more than 2 consecutive English sentences
    const sentences = trimmed.split(/(?<=\.)\s+/);
    let consecutiveEnglish = 0;
    
    for (const sentence of sentences) {
      const sTrimmed = sentence.trim();
      // Check if it looks like a plain English sentence: starts with capital, ends with period, no typical code characters
      if (/^[A-Z][^=;<>{}]*\.$/.test(sTrimmed)) {
        consecutiveEnglish++;
        if (consecutiveEnglish > 2) {
          return { valid: false, reason: "Contains more than 2 consecutive English sentences", preview };
        }
      } else {
        consecutiveEnglish = 0;
      }
    }

    // 5. Artifact-type validation
    let artifactType: 'hook' | 'component' | 'service';
    if (artifactName.startsWith('use')) {
      artifactType = 'hook';
    } else if (!isTsx) {
      artifactType = 'service';
    } else {
      artifactType = 'component';
    }

    if (artifactType === 'hook') {
      if (!trimmed.includes('export')) {
        return { valid: false, reason: "Hook missing export statement", preview };
      }
      if (!trimmed.includes('useState') && !trimmed.includes('useEffect') && !trimmed.includes('useCallback')) {
        return { valid: false, reason: "Hook missing useState, useEffect, or useCallback", preview };
      }
    } else if (artifactType === 'component') {
      if (!trimmed.includes('export')) {
        return { valid: false, reason: "Component missing export statement", preview };
      }
      if (!trimmed.includes('return (')) {
        return { valid: false, reason: "Component missing 'return ('", preview };
      }
    } else if (artifactType === 'service') {
      if (!trimmed.includes('export')) {
        return { valid: false, reason: "Service missing export statement", preview };
      }
    }

    return { valid: true };
  }
}
