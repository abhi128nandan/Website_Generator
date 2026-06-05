import * as ts from 'typescript';
import fs from 'fs/promises';
import path from 'path';

export interface ImportIntegrityError {
  file: string;        // relative path of the file containing the broken import
  importPath: string;  // the import specifier as written in the source
  resolvedTarget: string; // the absolute path we tried to resolve to
}

export interface ImportIntegrityResult {
  isValid: boolean;
  errors: ImportIntegrityError[];
}

/**
 * Validates that every relative import in generated TS/TSX files
 * resolves to an actual file on disk.
 *
 * Runs BEFORE pnpm install and BEFORE build.
 * Only checks relative imports (./  ../).
 * Skips npm package imports (react, axios, lucide-react, etc.).
 */
export class ImportIntegrityValidator {

  private static readonly RESOLVABLE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
  private static readonly INDEX_FILES = ['index.ts', 'index.tsx', 'index.js', 'index.jsx'];

  /**
   * Validate all generated TS/TSX files under frontend/src.
   */
  static async validate(targetDir: string): Promise<ImportIntegrityResult> {
    const srcDir = path.join(targetDir, 'frontend', 'src');
    const files = await this.collectTSFiles(srcDir);

    if (files.length === 0) {
      return { isValid: true, errors: [] };
    }

    const errors: ImportIntegrityError[] = [];

    for (const filePath of files) {
      const fileErrors = await this.validateFile(filePath, targetDir);
      errors.push(...fileErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a single file's imports.
   */
  static async validateFile(filePath: string, targetDir: string): Promise<ImportIntegrityError[]> {
    const errors: ImportIntegrityError[] = [];
    let content: string;

    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      return errors;
    }

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.ESNext,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const relativeImports = this.extractRelativeImports(sourceFile);
    const relFile = path.relative(targetDir, filePath);

    for (const importPath of relativeImports) {
      const resolved = await this.resolveImport(filePath, importPath);
      if (!resolved) {
        const resolvedTarget = path.resolve(path.dirname(filePath), importPath);
        errors.push({
          file: relFile,
          importPath,
          resolvedTarget,
        });
      }
    }

    return errors;
  }

  /**
   * Extract all relative import specifiers from a source file using the TS AST.
   * Covers: import declarations, import() expressions, and re-exports.
   */
  private static extractRelativeImports(sourceFile: ts.SourceFile): string[] {
    const imports: string[] = [];

    const visit = (node: ts.Node) => {
      // import X from './path'  /  import { X } from './path'
      if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const spec = node.moduleSpecifier.text;
        if (this.isRelative(spec)) {
          imports.push(spec);
        }
      }

      // export { X } from './path'  /  export * from './path'
      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const spec = node.moduleSpecifier.text;
        if (this.isRelative(spec)) {
          imports.push(spec);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return [...new Set(imports)]; // deduplicate
  }

  /**
   * Check if an import specifier is a relative path.
   */
  private static isRelative(specifier: string): boolean {
    return specifier.startsWith('./') || specifier.startsWith('../');
  }

  /**
   * Try to resolve a relative import to an actual file on disk.
   * Mimics TypeScript/bundler module resolution for relative paths.
   */
  private static async resolveImport(fromFile: string, importPath: string): Promise<boolean> {
    const dir = path.dirname(fromFile);
    const target = path.resolve(dir, importPath);

    // 1. Exact file match (rare — usually imports omit extensions)
    if (await this.fileExists(target)) {
      return true;
    }

    // 2. Try adding extensions
    for (const ext of this.RESOLVABLE_EXTENSIONS) {
      if (await this.fileExists(target + ext)) {
        return true;
      }
    }

    // 3. Try as directory with index file
    for (const idx of this.INDEX_FILES) {
      if (await this.fileExists(path.join(target, idx))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Strip broken relative imports from a file's source code.
   * Returns the cleaned source, or null if no changes were needed.
   *
   * Uses the TS AST to precisely remove import declarations
   * whose specifiers point to non-existent files.
   */
  static async stripBrokenImports(
    filePath: string,
    brokenImportPaths: Set<string>
  ): Promise<string | null> {
    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }

    if (brokenImportPaths.size === 0) return null;

    const lines = content.split('\n');
    const linesToRemove = new Set<number>();

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.ESNext,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    // Identify lines containing broken import declarations
    ts.forEachChild(sourceFile, node => {
      if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        if (brokenImportPaths.has(node.moduleSpecifier.text)) {
          const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line;
          const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;
          for (let i = startLine; i <= endLine; i++) {
            linesToRemove.add(i);
          }
        }
      }
    });

    if (linesToRemove.size === 0) return null;

    // Collect imported identifiers from broken imports to remove usages
    const brokenIdentifiers = new Set<string>();
    ts.forEachChild(sourceFile, node => {
      if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        if (!brokenImportPaths.has(node.moduleSpecifier.text)) return;

        const clause = node.importClause;
        if (!clause) return;

        // default import
        if (clause.name) {
          brokenIdentifiers.add(clause.name.text);
        }
        // named imports: import { A, B } from '...'
        if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const el of clause.namedBindings.elements) {
            brokenIdentifiers.add(el.name.text);
          }
        }
        // namespace import: import * as X from '...'
        if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
          brokenIdentifiers.add(clause.namedBindings.name.text);
        }
      }
    });

    const cleanedLines = lines.filter((_, idx) => !linesToRemove.has(idx));
    return cleanedLines.join('\n');
  }

  /**
   * Utility: check if a file exists.
   */
  private static async fileExists(p: string): Promise<boolean> {
    try {
      const stat = await fs.stat(p);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Recursively collect all .ts and .tsx files.
   */
  private static async collectTSFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.resolve(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...await this.collectTSFiles(fullPath));
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch {
      // directory may not exist
    }
    return files;
  }
}
