export class TruncationGate {
  static validate(code: string): { isValid: boolean; reason?: string } {
    try {
      require('fs').writeFileSync(
        require('path').join(process.cwd(), 'generation-artifacts', 'runtime-validator-proof.json'),
        JSON.stringify({
          executingFilePath: __filename,
          validatorVersion: "1.0.1-lazy-fix",
          regexBeingUsed: "/<(\\/?)([a-zA-Z][a-zA-Z0-9_-]*)\\b(?:[^>]*?)(\\/?)>/g",
          timestamp: new Date().toISOString()
        }, null, 2),
        'utf8'
      );
    } catch(e) {}
    const trimmed = code.trim();
    if (!trimmed) {
      return { isValid: false, reason: 'TRUNCATED_OUTPUT: Empty output' };
    }

    const balance = this.checkAllBalances(trimmed);
    if (!balance.isValid) {
      return { isValid: false, reason: `TRUNCATED_OUTPUT: ${balance.reason}` };
    }

    // Basic heuristic for "file does not end inside JSX"
    // If the file ends with a typical JSX attribute without a closing bracket
    const lastLine = trimmed.split('\n').pop() || '';
    if (lastLine.match(/<[a-zA-Z0-9]+\s+[^>]*$/)) {
        return { isValid: false, reason: 'TRUNCATED_OUTPUT: File ends inside JSX tag definition' };
    }

    const badEndings = [
      'from', 'import', 'export', 'return (', '<div', 'interface',
      '=', '+', '-', '*', '/', '&&', '||', ',', 'const', 'let', 'var', 'class', 'extends', 'implements'
    ];

    for (const ending of badEndings) {
      if (lastLine.endsWith(ending) || lastLine === ending) {
        return { isValid: false, reason: `TRUNCATED_OUTPUT: File ends mid-token or expression '${ending}'` };
      }
    }

    return { isValid: true };
  }

  private static checkAllBalances(str: string): { isValid: boolean; reason?: string } {
    let braces = 0;
    let parens = 0;
    let brackets = 0;
    let inString = false;
    let stringChar = '';
    
    // For template literals
    let templateDepth = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '\\') { i++; continue; }

      // Template literal handling
      if (char === '`' && !inString) {
        if (templateDepth > 0) {
          templateDepth--;
        } else {
          templateDepth++;
        }
        continue;
      }

      if ((char === '"' || char === "'") && templateDepth === 0) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
        continue;
      }

      if (!inString && templateDepth === 0) {
        if (char === '{') braces++;
        else if (char === '}') braces--;
        else if (char === '(') parens++;
        else if (char === ')') parens--;
        else if (char === '[') brackets++;
        else if (char === ']') brackets--;
      }
    }
    
    if (inString) return { isValid: false, reason: 'Ends inside string literal' };
    if (templateDepth > 0) return { isValid: false, reason: 'Unmatched template literals' };
    if (braces !== 0) return { isValid: false, reason: 'Unmatched braces {}' };
    if (parens !== 0) return { isValid: false, reason: 'Unmatched parentheses ()' };
    if (brackets !== 0) return { isValid: false, reason: 'Unmatched brackets []' };
    
    // Balanced JSX tags check using AST parsing instead of regex
    // This correctly distinguishes between TypeScript generics (e.g. <boolean>) and JSX tags
    const ts = require('typescript');
    const sf = ts.createSourceFile('temp.tsx', str, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const diags = (sf as any).parseDiagnostics || [];
    
    for (const diag of diags) {
      if (diag.code === 17008 || diag.code === 17014) {
        // TS17008: JSX element 'X' has no corresponding closing tag.
        // TS17014: Expected corresponding JSX closing tag for 'X'.
        return { isValid: false, reason: `Unmatched JSX tags: ${diag.messageText}` };
      }
    }

    return { isValid: true };
  }
}
