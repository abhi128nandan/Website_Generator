export class OutputSanitizer {
  /**
   * Sanitizes the raw LLM output, removing reasoning blocks and markdown formatting,
   * leaving only the raw source code.
   */
  static sanitize(rawContent: string): string {
    let sanitized = rawContent;

    // 1. Remove <think>...</think> and <reasoning>...</reasoning>
    // The dotAll (/s) flag is necessary because the blocks can span multiple lines.
    sanitized = sanitized.replace(/<(?:think|reasoning|analysis)>[\s\S]*?<\/(?:think|reasoning|analysis)>/gi, '');

    // 2. Remove markdown code fences ```tsx ... ``` or ``` ... ```
    // Match starting fence with optional language identifier, capture content, and match ending fence.
    const markdownRegex = /```[a-z]*\n([\s\S]*?)\n```/g;
    let match;
    let foundCodeBlock = false;
    let extractedCode = '';
    
    // If the entire response is wrapped in a code block or contains multiple, we extract just the code
    while ((match = markdownRegex.exec(sanitized)) !== null) {
      foundCodeBlock = true;
      extractedCode += match[1] + '\n';
    }

    if (foundCodeBlock && extractedCode.trim().length > 0) {
      sanitized = extractedCode;
    }

    // 3. Strip leading and trailing whitespace
    return sanitized.trim();
  }
}
