import * as ts from 'typescript';
import fs from 'fs/promises';
import path from 'path';

export interface ReactStructureValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ReactStructureValidator {
  static async validate(targetDir: string): Promise<ReactStructureValidationResult> {
    const srcDir = path.join(targetDir, 'frontend', 'src');
    const errors: string[] = [];

    try {
      // 1. Ensure App.tsx exists
      const appPath = path.join(srcDir, 'App.tsx');
      try {
        await fs.access(appPath);
      } catch {
        errors.push('App.tsx does not exist.');
      }

      // 2. Parse main.tsx and ensure it imports the correct entry file (App.tsx)
      const mainPath = path.join(srcDir, 'main.tsx');
      try {
        const mainContent = await fs.readFile(mainPath, 'utf-8');
        const sourceFile = ts.createSourceFile('main.tsx', mainContent, ts.ScriptTarget.ESNext, true);
        
        let importsApp = false;
        ts.forEachChild(sourceFile, node => {
          if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
            if (moduleSpecifier === './App' || moduleSpecifier === './App.tsx') {
              importsApp = true;
            }
          }
        });

        if (!importsApp) {
          errors.push('main.tsx does not import App.tsx.');
        }
      } catch (e) {
        errors.push('main.tsx does not exist or cannot be parsed.');
      }

      // 3. Read all files in the pages directory to ensure each has exactly one default export
      const pagesDir = path.join(srcDir, 'pages');
      try {
        const pages = await fs.readdir(pagesDir);
        for (const page of pages) {
          if (!page.endsWith('.tsx') && !page.endsWith('.ts')) continue;
          if (page === 'index.ts') continue; // skip barrel files

          const pagePath = path.join(pagesDir, page);
          const pageContent = await fs.readFile(pagePath, 'utf-8');
          const sourceFile = ts.createSourceFile(page, pageContent, ts.ScriptTarget.ESNext, true);
          
          let defaultExportCount = 0;
          ts.forEachChild(sourceFile, node => {
            if (ts.isExportAssignment(node)) {
              defaultExportCount++;
            } else if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
              if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword) && 
                  node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
                defaultExportCount++;
              }
            }
          });

          if (defaultExportCount !== 1) {
            errors.push(`Page ${page} must have exactly one default export. Found ${defaultExportCount}.`);
          }
        }
      } catch (e) {
        // pages dir might not exist, that's okay if no pages
      }

      // 4. Scan components, hooks, and services to ensure no duplicate names across the project.
      const seenNames = new Set<string>();
      
      const checkDuplicates = async (dirPath: string, category: string) => {
        try {
          const files = await fs.readdir(dirPath);
          for (const file of files) {
            if (file === 'index.ts') continue; // skip barrel files
            const baseName = path.basename(file, path.extname(file));
            if (seenNames.has(baseName)) {
              errors.push(`Duplicate name detected: ${baseName} is used in multiple places (found in ${category}).`);
            } else {
              seenNames.add(baseName);
            }
          }
        } catch { /* directory might not exist */ }
      };

      await checkDuplicates(path.join(srcDir, 'components'), 'components');
      await checkDuplicates(path.join(srcDir, 'hooks'), 'hooks');
      await checkDuplicates(path.join(srcDir, 'services'), 'services');
      await checkDuplicates(path.join(srcDir, 'pages'), 'pages');

    } catch (e: any) {
      errors.push(`Structure validation encountered an unexpected error: ${e.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
