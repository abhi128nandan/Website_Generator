import * as ts from 'typescript';
import { ReasoningDetector } from './reasoning-detector';

export interface ArtifactIntegrityResult {
  valid: boolean;
  reason?: string;
  preview?: string;
}

export class ArtifactIntegrityValidator {
  static validate(content: string, artifactName: string, isTsx: boolean): ArtifactIntegrityResult {
    const trimmed = content.trim();
    if (!trimmed) {
      return { valid: false, reason: "Empty response" };
    }

    const preview = trimmed.substring(0, 100).replace(/\n/g, ' ');

    // Length check
    if (trimmed.length < 30) {
      return { valid: false, reason: "Output length < minimum threshold", preview };
    }

    const lower = trimmed.toLowerCase();

    // Specific phrase check
    const detectorResult = ReasoningDetector.detectReasoning(trimmed);
    if (detectorResult.hasReasoning) {
      return { valid: false, reason: `Contains natural language phrase: '${detectorResult.matchedPhrase}'`, preview };
    }

    // Start check
    const validStarters = ['import', 'export', 'interface', 'type', 'const', 'function', 'let', 'class'];
    const firstWord = trimmed.split(/\s+/)[0];
    if (!validStarters.includes(firstWord)) {
      return { valid: false, reason: `Does not start with valid TS token. Started with: '${firstWord}'`, preview };
    }

    // TSX Balance Check for braces, parentheses, quotes
    if (!this.checkBalance(trimmed, '{', '}')) {
      return { valid: false, reason: "INCOMPLETE_ARTIFACT: Unbalanced braces {}", preview };
    }
    if (!this.checkBalance(trimmed, '(', ')')) {
      return { valid: false, reason: "INCOMPLETE_ARTIFACT: Unbalanced parentheses ()", preview };
    }
    if (isTsx) {
      if (!this.checkJsxBalance(trimmed)) {
        return { valid: false, reason: "INCOMPLETE_ARTIFACT: Unbalanced JSX angle brackets <>", preview };
      }
    }
    if (!this.checkQuotesBalance(trimmed, '"') || !this.checkQuotesBalance(trimmed, "'") || !this.checkQuotesBalance(trimmed, '`')) {
      return { valid: false, reason: "INCOMPLETE_ARTIFACT: Unbalanced quotes", preview };
    }

    // AST-based Validation
    const sourceFile = ts.createSourceFile(
      'temp.tsx',
      trimmed,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    let hasExport = false;
    let hasJsxReturn = false;
    let hasHookFunction = false;

    const checkNode = (node: ts.Node) => {
      // Check for exports
      if (
        ts.isExportAssignment(node) || 
        ts.isExportDeclaration(node) || 
        (ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((m: any) => m.kind === ts.SyntaxKind.ExportKeyword))
      ) {
        hasExport = true;
      }

      // Check for JSX return in components
      if (isTsx && ts.isReturnStatement(node) && node.expression) {
        const expr = node.expression;
        if (
          ts.isJsxElement(expr) || 
          ts.isJsxSelfClosingElement(expr) || 
          ts.isJsxFragment(expr) || 
          (ts.isParenthesizedExpression(expr) && (
            ts.isJsxElement(expr.expression) || 
            ts.isJsxSelfClosingElement(expr.expression) || 
            ts.isJsxFragment(expr.expression)
          ))
        ) {
          hasJsxReturn = true;
        } else if (ts.isConditionalExpression(expr)) {
           // Basic support for ternary return
           hasJsxReturn = true;
        }
      }

      // Check for hook functions
      if (!isTsx && artifactName.startsWith('use')) {
        if (ts.isFunctionDeclaration(node) && node.name && node.name.text.startsWith('use')) {
          hasHookFunction = true;
        } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text.startsWith('use')) {
          hasHookFunction = true;
        }
      }

      ts.forEachChild(node, checkNode);
    };

    checkNode(sourceFile);

    if (!hasExport) {
      return { valid: false, reason: "Missing export statement", preview };
    }

    if (isTsx && !hasJsxReturn) {
      // It's possible the component just returns null or fragments, but we expect UI
      // Fallback check just in case AST traversal missed something nested
      if (!trimmed.includes('return <') && !trimmed.includes('return (')) {
        return { valid: false, reason: "Component missing JSX return statement", preview };
      }
    } else if (!isTsx && artifactName.startsWith('use')) {
      if (!hasHookFunction) {
        return { valid: false, reason: "Hook missing function definition starting with 'use'", preview };
      }
    }

    return { valid: true };
  }

  private static checkBalance(str: string, open: string, close: string): boolean {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '\\') { i++; continue; } // Skip escaped characters
      if (str[i] === open) count++;
      else if (str[i] === close) count--;
    }
    return count === 0;
  }

  private static checkQuotesBalance(str: string, quote: string): boolean {
    let count = 0;
    let escaped = false;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '\\') {
        escaped = !escaped;
        continue;
      }
      if (str[i] === quote && !escaped) {
        count++;
      }
      escaped = false;
    }
    return count % 2 === 0;
  }

  private static checkJsxBalance(str: string): boolean {
    // Strip common math/arrow operators before counting
    const cleaned = str.replace(/=>/g, '').replace(/<=/g, '').replace(/>=/g, '');
    const opens = (cleaned.match(/</g) || []).length;
    const closes = (cleaned.match(/>/g) || []).length;
    return opens === closes;
  }
}
