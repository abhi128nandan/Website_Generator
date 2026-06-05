import * as ts from 'typescript';
import fs from 'fs/promises';
import path from 'path';

export interface ASTValidationError {
  file: string;
  line: number;
  column: number;
  code: string | number;
  message: string;
}

export interface ASTValidationResult {
  isValid: boolean;
  errors: ASTValidationError[];
}

/**
 * TypeScript diagnostic codes to SKIP during pre-install validation.
 * These are all caused by missing node_modules (react, react-dom, lucide-react, etc.)
 * and will be resolved by `pnpm install`. Checking them before install produces
 * hundreds of false positives that waste all repair attempts.
 */
const SKIP_DIAGNOSTIC_CODES = new Set([
  // 2307 is NOT skipped globally — handled selectively below
  //       (keep for relative imports, skip for npm packages)
  2503,  // Cannot find namespace 'X'
  2304,  // Cannot find name 'X' (often JSX intrinsics when react types missing)
  2580,  // Cannot find name 'require'
  2688,  // Cannot find type definition file for 'X'
  2339,  // Property 'X' does not exist on type 'Y' (JSX intrinsics when react missing)
  2786,  // 'X' cannot be used as a JSX component
  2686,  // 'X' refers to a UMD global
  6142,  // Module 'X' was resolved to 'Y', but '--jsx' is not set
  17004, // Cannot use JSX unless the '--jsx' flag is provided
  7016,  // Could not find a declaration file for module 'X'
  7006,  // Parameter 'X' implicitly has an 'any' type (strict mode, not a code bug)
  7031,  // Binding element 'X' implicitly has an 'any' type (strict mode)
  7005,  // Variable 'X' implicitly has an 'any' type
  2877,  // This JSX tag requires the module path 'react/jsx-runtime' to exist (variant 1)
  2875,  // This JSX tag requires the module path 'react/jsx-runtime' to exist (variant 2)
  2874,  // This JSX tag requires 'React' to be in scope
  1343,  // The 'import.meta' meta-property is only allowed when --module is ... (Vite handles this)
  2614,  // Module 'X' has no exported member 'Y' (often due to missing types resolution)
  2551,  // Property 'X' does not exist on type 'Y'. Did you mean 'Z'? (cascading from missing types)
]);

export class ASTValidator {
  /**
   * Validates the generated TS/TSX files using the TypeScript Compiler API.
   * 
   * This runs BEFORE `pnpm install`, so it deliberately skips errors caused by
   * missing node_modules (module resolution, JSX runtime, implicit any from
   * missing type declarations). 
   * 
   * It focuses on catching real code-structural issues:
   * - Syntax errors (malformed code)
   * - Duplicate declarations (same identifier declared twice)
   * - Duplicate default exports
   * - Other structural TypeScript errors
   */
  static async validate(targetDir: string): Promise<ASTValidationResult> {
    const frontendSrc = path.join(targetDir, 'frontend', 'src');
    const backendSrc = path.join(targetDir, 'backend', 'src');
    
    // Find all ts and tsx files
    const fileNames: string[] = [];
    async function collectFiles(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const res = path.resolve(dir, entry.name);
          if (res.includes('node_modules') || res.includes('dist') || res.includes('build') || res.includes('coverage') || res.includes('.generated') || res.includes('.logs')) continue;
          
          if (entry.isDirectory()) {
            await collectFiles(res);
          } else if (res.endsWith('.ts') || res.endsWith('.tsx')) {
            fileNames.push(res);
          }
        }
      } catch (e) {
        // Source dir might not exist if generation totally failed
      }
    }
    
    await collectFiles(frontendSrc);
    await collectFiles(backendSrc);
    
    if (fileNames.length === 0) {
      return { isValid: false, errors: [{ file: 'unknown', line: 1, column: 1, code: 'NO_FILES', message: 'No TypeScript files found in frontend/src or backend/src.' }] };
    }

    const errors: ASTValidationError[] = [];

    // --- Phase 1: Syntax-only parsing (per-file) ---
    // Parse each file individually to catch syntax errors without type-checking
    for (const fileName of fileNames) {
      try {
        const content = await fs.readFile(fileName, 'utf-8');
        const sourceFile = ts.createSourceFile(
          fileName,
          content,
          ts.ScriptTarget.ESNext,
          true, // setParentNodes
          fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
        );

        // Check for syntax-level parse diagnostics
        const syntaxDiags = (sourceFile as any).parseDiagnostics;
        if (syntaxDiags && syntaxDiags.length > 0) {
          for (const diag of syntaxDiags) {
            if (diag.category !== ts.DiagnosticCategory.Error) continue;
            const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, diag.start!);
            const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
            const relName = path.relative(targetDir, fileName).replace(/\\/g, '/');
            errors.push({
              file: relName,
              line: line + 1,
              column: character + 1,
              code: diag.code || 'SYNTAX',
              message: `[SYNTAX] ${message}`
            });
          }
        }

        // --- Phase 2: Duplicate declaration detection (AST walk) ---
        ASTValidator.checkDuplicateDeclarations(sourceFile, targetDir, errors);
      } catch (e: any) {
        const relName = path.relative(targetDir, fileName).replace(/\\/g, '/');
        errors.push({
          file: relName,
          line: 1,
          column: 1,
          code: 'PARSE_FAILED',
          message: `Failed to parse: ${e.message}`
        });
      }
    }

    // --- Phase 3: Semantic diagnostics (filtered) ---
    // Run full program but only keep diagnostics that are NOT caused by missing node_modules
    const program = ts.createProgram(fileNames, {
      noEmit: true,
      strict: false, // Don't flag implicit-any etc. before deps are installed
      target: ts.ScriptTarget.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      allowImportingTsExtensions: true,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      skipLibCheck: true,
      baseUrl: targetDir
    });

    const diagnostics = ts.getPreEmitDiagnostics(program);

    diagnostics.forEach(diag => {
      if (diag.category !== ts.DiagnosticCategory.Error) return;
      
      // Skip diagnostics caused by missing node_modules
      if (SKIP_DIAGNOSTIC_CODES.has(diag.code)) return;

      // TS2307 "Cannot find module" — selective handling:
      // Keep the error for relative imports (./  ../) which indicate broken generated code.
      // Skip for npm package imports which will resolve after pnpm install.
      if (diag.code === 2307) {
        const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
        // Extract module specifier from "Cannot find module './foo' or its corresponding type declarations."
        const moduleMatch = message.match(/Cannot find module '([^']+)'/);
        if (moduleMatch) {
          const moduleName = moduleMatch[1];
          if (!moduleName.startsWith('./') && !moduleName.startsWith('../')) {
            // npm package — skip (will resolve after install)
            return;
          }
          // relative import — this is a real bug, keep the error
        }
      }

      if (diag.file) {
        const { line, character } = ts.getLineAndCharacterOfPosition(diag.file, diag.start!);
        const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
        const fileName = path.relative(targetDir, diag.file.fileName).replace(/\\/g, '/');
        errors.push({
          file: fileName,
          line: line + 1,
          column: character + 1,
          code: diag.code,
          message: `[TS${diag.code}] ${message}`
        });
      } else {
        errors.push({
          file: 'unknown',
          line: 1,
          column: 1,
          code: diag.code,
          message: `[TS${diag.code}] ${ts.flattenDiagnosticMessageText(diag.messageText, '\n')}`
        });
      }
    });
    // De-duplicate errors: keep only the first error per file to stop cascading errors
    const uniqueMap = new Map<string, ASTValidationError>();
    for (const err of errors) {
      // Use just the file as the key to only keep the very first root error found in that file
      if (!uniqueMap.has(err.file)) {
        uniqueMap.set(err.file, err);
      }
    }
    const uniqueErrors = Array.from(uniqueMap.values());
    
    // Slice to maximum 20 root errors
    const slicedErrors = uniqueErrors.slice(0, 20);

    return {
      isValid: errors.length === 0,
      errors: slicedErrors
    };
  }

  /**
   * Walks the AST to detect duplicate top-level declarations and duplicate
   * default exports within a single file — the most common AI generation defect.
   */
  private static checkDuplicateDeclarations(
    sourceFile: ts.SourceFile,
    targetDir: string,
    errors: ASTValidationError[]
  ): void {
    const relName = path.relative(targetDir, sourceFile.fileName).replace(/\\/g, '/');
    const topLevelNames = new Map<string, number>(); // name -> count
    let defaultExportCount = 0;

    for (const stmt of sourceFile.statements) {
      // Count default exports
      if (ts.isExportAssignment(stmt)) {
        defaultExportCount++;
      }
      if (
        (ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt)) &&
        stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) &&
        stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)
      ) {
        defaultExportCount++;
      }

      // Track top-level declaration names
      let name: string | undefined;
      if (ts.isFunctionDeclaration(stmt) && stmt.name) {
        name = stmt.name.text;
      } else if (ts.isClassDeclaration(stmt) && stmt.name) {
        name = stmt.name.text;
      } else if (ts.isInterfaceDeclaration(stmt)) {
        name = stmt.name.text;
      } else if (ts.isTypeAliasDeclaration(stmt)) {
        name = stmt.name.text;
      } else if (ts.isEnumDeclaration(stmt)) {
        name = stmt.name.text;
      } else if (ts.isVariableStatement(stmt)) {
        for (const decl of stmt.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            const varName = decl.name.text;
            topLevelNames.set(varName, (topLevelNames.get(varName) || 0) + 1);
          }
        }
      }

      if (name) {
        topLevelNames.set(name, (topLevelNames.get(name) || 0) + 1);
      }
    }

    // Report duplicate declarations
    for (const [name, count] of topLevelNames) {
      if (count > 1) {
        errors.push({
          file: relName,
          line: 1,
          column: 1,
          code: 'DUPLICATE_DECLARATION',
          message: `[DUPLICATE] Identifier '${name}' is declared ${count} times at the top level`
        });
      }
    }

    // Report duplicate default exports
    if (defaultExportCount > 1) {
      errors.push({
        file: relName,
        line: 1,
        column: 1,
        code: 'DUPLICATE_DEFAULT_EXPORT',
        message: `[DUPLICATE] File has ${defaultExportCount} default exports (expected at most 1)`
      });
    }

    // Special Rule: Check for missing default exports in frontend/src/pages
    if (relName.includes('frontend/src/pages/') || relName.includes('src/pages/')) {
      if (defaultExportCount !== 1) {
        errors.push({
          file: relName,
          line: 1,
          column: 1,
          code: 'PAGE_DEFAULT_EXPORT_MISSING',
          message: 'Page must export exactly one default component'
        });
      }
    }
  }
}
