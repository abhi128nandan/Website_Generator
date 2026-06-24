import * as ts from 'typescript';
import { ReasoningDetector } from './reasoning-detector';

export interface ExtractorResult {
  success: boolean;
  code: string;
  reason?: string;
  astErrors?: any[];
}

export class CodeExtractor {
  static extractCodeArtifact(rawOutput: string, isTsx: boolean, artifactName: string, isSanitized: boolean = false): ExtractorResult {
    // STEP 2: REASONING REJECTION
    // ALWAYS check for reasoning tokens, even if sanitized. Remove trust assumption.
    const detectorResult = ReasoningDetector.detectReasoning(rawOutput);
    if (detectorResult.hasReasoning) {
      return { success: false, code: '', reason: `INVALID_REASONING_ARTIFACT: Reasoning detected -> '${detectorResult.matchedPhrase}'` };
    }

    // Check for non-code English sentences at the start of raw output
    const firstLineText = rawOutput.trim().split('\n')[0];
    if (firstLineText && /^[A-Z][a-z\s]+[\.\?\!]$/.test(firstLineText.trim())) {
        return { success: false, code: '', reason: 'INVALID_REASONING_ARTIFACT: Starts with non-code English sentence' };
    }

    // STEP 1 & 3: AST Boundary Detection & Graceful Failure
    let extracted = rawOutput;
    const codeFenceRegex = /```(?:[a-zA-Z0-9-]*)\n([\s\S]*?)```/i;
    const match = rawOutput.match(codeFenceRegex);
    if (match && match[1]) {
      extracted = match[1];
    }
    
    const finalCode = extracted.trim();

    // REPAIR 1: Anchor Detection. Allow CSS files without TS mandatory anchors.
    const isCss = artifactName.toLowerCase().endsWith('.css') || finalCode.includes('@tailwind') || (finalCode.includes('{') && finalCode.includes(';') && !finalCode.includes('function') && !finalCode.includes('export'));
    
    if (isCss) {
        return { success: true, code: finalCode, astErrors: [] };
    }

    // Parse extracted output with TypeScript AST
    const sourceFile = ts.createSourceFile('temp.tsx', finalCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const parseErrors = (sourceFile as any).parseDiagnostics || [];
    
    // REPAIR 4: Graceful Failure. Never silently modify valid code. Return LOW_EXTRACTION_CONFIDENCE.
    if (parseErrors.length > 0) {
      const errorCodes = parseErrors.map((e: any) => e.code);
      if (errorCodes.includes(17008) || errorCodes.includes(1002) || errorCodes.includes(1005)) {
        try {
          const fsObj = require('fs');
          const pathObj = require('path');
          const reportPath = pathObj.join(process.cwd(), '..', '..', 'generation-artifacts', 'truncation-classifier-report.json');
          let reportData: any[] = [];
          try { reportData = JSON.parse(fsObj.readFileSync(reportPath, 'utf-8')); } catch(e) {}
          reportData.push({
            outputLength: finalCode.length,
            final500Characters: finalCode.slice(-500),
            parserDiagnostics: parseErrors.map((e: any) => ({ code: e.code, message: typeof e.messageText === 'string' ? e.messageText : e.messageText?.messageText })),
            timestamp: new Date().toISOString()
          });
          fsObj.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
        } catch(e) {}
        
        return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: AST failures imply source ended abruptly', astErrors: parseErrors };
      }
      return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: AST parsing failed', astErrors: parseErrors };
    }

    // REPAIR 2 & 3: Helper Preservation and AST Boundary Detection
    // The previous logic sliced off helper functions after the final export.
    // We now completely trust the valid AST and preserve the entire artifact.

    // STEP 5: MINIMUM STRUCTURE VALIDATION
    let artifactType: 'hook' | 'component' | 'service';
    if (artifactName.startsWith('use')) {
      artifactType = 'hook';
    } else if (!isTsx) {
      artifactType = 'service';
    } else {
      artifactType = 'component';
    }

    if (artifactType === 'component') {
      if (!finalCode.includes('export default') || (!finalCode.includes('return (') && !finalCode.includes('return <'))) {
        return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: Component missing export default or return (' };
      }
    } else if (artifactType === 'hook') {
      if (!finalCode.includes('export') || !finalCode.includes('use')) {
        return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: Hook missing export or use' };
      }
    } else if (artifactType === 'service') {
      if (!finalCode.includes('export')) {
        return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: Service missing export' };
      }
    }

    // STEP 4: TRUNCATION DETECTION (Balance Check)
    if (!this.checkBalance(finalCode, '{', '}')) {
      return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: Unbalanced braces {}' };
    }
    if (!this.checkBalance(finalCode, '(', ')')) {
      return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: Unbalanced parentheses ()' };
    }
    if (!this.checkBalance(finalCode, '[', ']')) {
      return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: Unbalanced brackets []' };
    }

    return {
      success: true,
      code: finalCode,
      astErrors: parseErrors
    };
  }
  
  static extract(sanitizedCode: string, isTsx: boolean = true, artifactName: string = 'Component'): ExtractorResult {
     return this.extractCodeArtifact(sanitizedCode, isTsx, artifactName, true);
  }

  private static checkBalance(str: string, open: string, close: string): boolean {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '\\') { i++; continue; }
      if (str[i] === open) count++;
      else if (str[i] === close) count--;
    }
    return count === 0;
  }
}
