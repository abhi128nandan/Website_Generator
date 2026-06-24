import ts from 'typescript';
import fs from 'fs/promises';
import path from 'path';
import { Logger } from '@website-generator/shared';

export interface DependencyError {
  file: string;
  message: string;
}

export class DependencyGraphValidator {
  static async validate(targetDir: string): Promise<DependencyError[]> {
    Logger.info(`[DependencyGraphValidator] Building AST Import Graph for ${targetDir}`);
    const srcDir = path.join(targetDir, 'frontend', 'src');
    const errors: DependencyError[] = [];

    let files: string[] = [];
    try {
      await fs.access(srcDir);
      files = await this.getAllFiles(srcDir);
    } catch {
      return errors; // No frontend to validate
    }

    const tsFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    
    // Build program
    const program = ts.createProgram(tsFiles, {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true
    });
    
    const checker = program.getTypeChecker();

    for (const sourceFile of program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile && sourceFile.fileName.includes('frontend/src')) {
        ts.forEachChild(sourceFile, node => {
          if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier)) {
              const importPath = moduleSpecifier.text;
              
              // Only check local relative imports
              if (importPath.startsWith('.')) {
                if (/\.(css|png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/i.test(importPath)) {
                  return;
                }
                const symbol = checker.getSymbolAtLocation(moduleSpecifier);
                if (!symbol) {
                  errors.push({
                    file: sourceFile.fileName,
                    message: `Cannot resolve local import '${importPath}'`
                  });
                } else {
                  // Check named vs default export mismatches
                  const importClause = node.importClause;
                  if (importClause) {
                    // Default import (e.g., import App from './App')
                    if (importClause.name) {
                      const defaultExport = checker.getExportSymbolOfSymbol(symbol);
                      // If the module has no default export, it's an error
                      if (!defaultExport || defaultExport.escapedName !== 'default' && defaultExport.escapedName !== 'export=') {
                        // Sometimes TypeScript handles this differently depending on moduleInterop, 
                        // but we can do a strict check by looking at the module's exports
                        const exports = checker.getExportsOfModule(symbol);
                        const hasDefault = exports.some(e => e.escapedName === 'default');
                        if (!hasDefault) {
                          errors.push({
                            file: sourceFile.fileName,
                            message: `Module '${importPath}' has no default export, but is imported as default.`
                          });
                        }
                      }
                    }
                    
                    // Named imports (e.g., import { App } from './App')
                    if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
                      const moduleExports = checker.getExportsOfModule(symbol);
                      const exportNames = new Set(moduleExports.map(e => e.escapedName.toString()));
                      
                      for (const element of importClause.namedBindings.elements) {
                        const importedName = (element.propertyName || element.name).text;
                        if (!exportNames.has(importedName)) {
                          errors.push({
                            file: sourceFile.fileName,
                            message: `Module '${importPath}' has no exported member '${importedName}'.`
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
      }
    }

    if (errors.length > 0) {
      Logger.warn(`[DependencyGraphValidator] Found ${errors.length} dependency errors.`);
    } else {
      Logger.info(`[DependencyGraphValidator] Import Graph is consistent.`);
    }

    return errors;
  }

  private static async getAllFiles(dir: string): Promise<string[]> {
    let results: string[] = [];
    const list = await fs.readdir(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = await fs.stat(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(await this.getAllFiles(fullPath));
      } else {
        results.push(fullPath);
      }
    }
    return results;
  }
}
