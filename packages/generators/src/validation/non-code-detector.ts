import * as ts from 'typescript';

export interface NonCodeResult {
  valid: boolean;
  reason?: string;
}

export class NonCodeDetector {
  static validate(content: string): NonCodeResult {
    const trimmed = content.trim();
    if (!trimmed) {
      return { valid: false, reason: "EMPTY_RESPONSE" };
    }

    const lowerContent = trimmed.toLowerCase();

    // 1. Check for prohibited English phrases
    const prohibitedPhrases = [
      "let me think",
      "first i need",
      "the user wants",
      "let's build",
      "okay, let's",
      "we need to",
      "i should",
      "the component should",
      "the calculator should"
    ];

    for (const phrase of prohibitedPhrases) {
      if (lowerContent.includes(phrase)) {
        return { valid: false, reason: `CONTAINS_PLANNING_TEXT: ${phrase}` };
      }
    }

    // 2. Reject if first non-whitespace token is not a valid TS/TSX starter
    const validStarters = [
      'import', 'export', 'interface', 'type', 'const',
      'let', 'function', 'class', 'enum'
    ];
    const firstWord = trimmed.split(/\s+/)[0];
    if (!validStarters.includes(firstWord)) {
      return { valid: false, reason: `INVALID_START_TOKEN: ${firstWord}` };
    }

    // 3. Reject if more than 30% of lines are plain English sentences
    // We'll use a basic heuristic: lines that start with a capital letter, 
    // don't contain typical code symbols, and end with a period.
    const lines = trimmed.split('\n');
    let englishLineCount = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // If it's a comment, it's fine. If it's not a comment, check if it's an English sentence.
      if (!trimmedLine.startsWith('//') && !trimmedLine.startsWith('/*') && !trimmedLine.startsWith('*')) {
        const isEnglishSentence = /^[A-Z][^=;<>{}]*\.$/.test(trimmedLine);
        if (isEnglishSentence) {
          englishLineCount++;
        }
      }
    }

    const validLinesCount = lines.filter(l => l.trim().length > 0).length;
    if (validLinesCount > 0 && (englishLineCount / validLinesCount) > 0.3) {
      return { valid: false, reason: "TOO_MUCH_PROSE" };
    }

    // 4. Reject if parser cannot identify a TypeScript AST root node
    try {
      const sourceFile = ts.createSourceFile(
        'temp.tsx',
        trimmed,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      // If there are no statements, it's not valid code
      if (sourceFile.statements.length === 0) {
        return { valid: false, reason: "NO_AST_STATEMENTS" };
      }
    } catch (err: any) {
      return { valid: false, reason: `AST_PARSE_ERROR: ${err.message}` };
    }

    return { valid: true };
  }
}
