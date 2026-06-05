import * as ts from 'typescript';

export interface CompileGateResult {
  isValid: boolean;
  error?: string;
}

export class CompileGate {
  static validate(content: string, isTsx: boolean): CompileGateResult {
    // 1. Check for basic transpilation errors (invalid JSX, malformed syntax)
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: isTsx ? ts.JsxEmit.ReactJSX : ts.JsxEmit.None,
      strict: true,
      noEmitOnError: true,
    };

    const transpileResult = ts.transpileModule(content, {
      compilerOptions,
      fileName: isTsx ? 'temp.tsx' : 'temp.ts',
      reportDiagnostics: true,
    });

    if (transpileResult.diagnostics && transpileResult.diagnostics.length > 0) {
      // Find the first error
      const firstError = transpileResult.diagnostics.find(d => d.category === ts.DiagnosticCategory.Error);
      if (firstError) {
        const message = ts.flattenDiagnosticMessageText(firstError.messageText, '\n');
        if (firstError.file && firstError.start !== undefined) {
          const { line } = ts.getLineAndCharacterOfPosition(firstError.file, firstError.start);
          return { isValid: false, error: `Transpilation failed at line ${line + 1}: ${message}` };
        }
        return { isValid: false, error: `Transpilation failed: ${message}` };
      }
    }

    // 2. Fast AST Validation for missing exports
    const sourceFile = ts.createSourceFile(
      isTsx ? 'temp.tsx' : 'temp.ts',
      content,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    let hasExport = false;
    let hasDefaultExport = false;

    ts.forEachChild(sourceFile, node => {
      if (ts.isExportAssignment(node)) {
        hasExport = true;
        hasDefaultExport = true;
      } else if (ts.isExportDeclaration(node)) {
        hasExport = true;
      } else {
        const mods = (node as any).modifiers;
        if (mods) {
          const hasExportModifier = mods.some((m: any) => m.kind === ts.SyntaxKind.ExportKeyword);
          const hasDefaultModifier = mods.some((m: any) => m.kind === ts.SyntaxKind.DefaultKeyword);
          if (hasExportModifier) hasExport = true;
          if (hasDefaultModifier) hasDefaultExport = true;
        }
      }
    });

    if (!hasExport) {
      return { isValid: false, error: `File is missing exports. Must contain at least one export.` };
    }

    // Pages and components generally need default exports in this architecture,
    // but the prompt explicitly requires them. If it's a TSX file, let's enforce a default export.
    if (isTsx && !hasDefaultExport) {
      return { isValid: false, error: `TSX component must have exactly one default export.` };
    }

    return { isValid: true };
  }
}
