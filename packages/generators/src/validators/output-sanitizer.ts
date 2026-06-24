export class OutputSanitizer {
  /**
   * Sanitizes the raw LLM output, removing reasoning blocks and markdown formatting,
   * leaving only the raw source code.
   */
  static sanitize(rawContent: string): string {
    return OutputSanitizer.sanitizeWithDiagnostics(rawContent).code;
  }

  static sanitizeWithDiagnostics(rawContent: string): { code: string, diagnostics: any } {
    let sanitized = rawContent.trim();
    let thinkBlockCount = 0;
    let artifactCount = 0;

    // Remove <think> blocks ONLY at the beginning of the raw output.
    // This safely strips LLM reasoning without corrupting valid JSX inside the code.
    const startThinkRegex = /^<(?:think|thinking|reasoning|analysis)>[\s\S]*?<\/(?:think|thinking|reasoning|analysis)>/i;
    while (startThinkRegex.test(sanitized)) {
      sanitized = sanitized.replace(startThinkRegex, '').trim();
      thinkBlockCount++;
    }

    // Check for markdown code blocks
    const markdownRegex = /```(?:[a-zA-Z0-9-]*)\n([\s\S]*?)```/ig;
    let match;
    let foundCodeBlock = false;
    let extractedCode = '';
    
    while ((match = markdownRegex.exec(sanitized)) !== null) {
      foundCodeBlock = true;
      extractedCode = match[1].trim();
      artifactCount++;
    }

    // REPAIR 1: Prevent multi-file concatenation
    if (artifactCount > 1) {
      return {
        code: 'MULTI_FILE_OUTPUT_DETECTED',
        diagnostics: {
          rawLength: rawContent.length,
          sanitizedLength: 0,
          removedThinkBlocks: thinkBlockCount,
          removedArtifacts: artifactCount,
          remainingReasoningIndicators: [],
          hasUnclosedReasoning: false,
          success: false,
          error: 'MULTI_FILE_OUTPUT_DETECTED'
        }
      };
    }

    if (foundCodeBlock) {
      sanitized = extractedCode;
    } else {
      // REPAIR 3: Support Raw source code responses without bias
      const prefixes = [
        /^here is.*?\n/mi,
        /^sure.*?\n/mi,
        /^this component.*?\n/mi,
        /^typescript\n/mi,
        /^tsx\n/mi
      ];
      
      let strippedPrefixes = false;
      do {
        strippedPrefixes = false;
        sanitized = sanitized.trimStart();
        for (const prefix of prefixes) {
          if (prefix.test(sanitized)) {
            sanitized = sanitized.replace(prefix, '');
            strippedPrefixes = true;
          }
        }
      } while (strippedPrefixes);
    }

    return {
      code: sanitized,
      diagnostics: {
        rawLength: rawContent.length,
        sanitizedLength: sanitized.length,
        removedThinkBlocks: thinkBlockCount,
        removedArtifacts: artifactCount,
        remainingReasoningIndicators: [],
        hasUnclosedReasoning: false,
        success: true
      }
    };
  }
}
