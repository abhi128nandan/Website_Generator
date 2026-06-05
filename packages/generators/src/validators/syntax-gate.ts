import * as ts from 'typescript';

export interface SyntaxGateResult {
  isValid: boolean;
  error?: string;
}

export class SyntaxGate {
  private static FORBIDDEN_TOKENS = [
    '<think',
    '</think',
    '<reasoning',
    '</reasoning',
    '~~~',
    'Here is the code',
    'This component',
    'I will create',
    '```'
  ];

  static validate(content: string, isTsx: boolean): SyntaxGateResult {
    // 1. Check for Forbidden Tokens
    for (const token of this.FORBIDDEN_TOKENS) {
      if (content.includes(token)) {
        return {
          isValid: false,
          error: `Contains forbidden LLM reasoning artifact token: "${token}"`
        };
      }
    }

    // 2. Fast AST Validation
    const sourceFile = ts.createSourceFile(
      isTsx ? 'temp.tsx' : 'temp.ts',
      content,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const parseDiagnostics = (sourceFile as any).parseDiagnostics;
    if (parseDiagnostics && parseDiagnostics.length > 0) {
      // Get the first error message
      const firstError = parseDiagnostics[0];
      let message = typeof firstError.messageText === 'string' 
        ? firstError.messageText 
        : firstError.messageText.messageText;
      
      const pos = sourceFile.getLineAndCharacterOfPosition(firstError.start);
      return {
        isValid: false,
        error: `Syntax Error at line ${pos.line + 1}: ${message}`
      };
    }

    return { isValid: true };
  }
}
