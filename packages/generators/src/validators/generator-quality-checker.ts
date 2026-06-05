import fs from 'fs/promises';
import path from 'path';
import { NormalizedRequirements, Logger } from '@paperclip/shared';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
export interface QualityValidationResult {
  passed: boolean;
  errors: string[];
}

export class GeneratorQualityChecker {
  /**
   * Performs physical sanity checks on the generated code directory.
   * Scans for:
   * 1. Missing component, hook, or service files identified in architecture.
   * 2. Broken TypeScript relative imports.
   * 3. TODO placeholders and mockup fallback strings.
   * 4. Swagger curly brace syntax in Express routes.
   */
  static async validate(targetDir: string, reqs: NormalizedRequirements): Promise<QualityValidationResult> {
    const errors: string[] = [];
    const frontendDir = path.join(targetDir, 'frontend');
    const backendDir = path.join(targetDir, 'backend');
    
    // --- 1. Check Hook & Service File Coverage ---
    const arch = reqs.frontendArchitecture;
    if (arch) {
      if (arch.services) {
        for (const svc of arch.services) {
          const filePath = path.join(frontendDir, 'src', 'services', `${svc.name}.ts`);
          try {
            const stats = await fs.stat(filePath);
            if (stats.size === 0) {
              errors.push(`Service file ${svc.name}.ts is empty.`);
            }
          } catch {
            errors.push(`Required service file is missing: frontend/src/services/${svc.name}.ts`);
          }
        }
      }
      
      if (arch.hooks) {
        for (const hook of arch.hooks) {
          const filePath = path.join(frontendDir, 'src', 'hooks', `${hook.name}.ts`);
          try {
            const stats = await fs.stat(filePath);
            if (stats.size === 0) {
              errors.push(`Hook file ${hook.name}.ts is empty.`);
            }
          } catch {
            errors.push(`Required hook file is missing: frontend/src/hooks/${hook.name}.ts`);
          }
        }
      }
    }

    // --- 1.5. File Integrity Check ---
    const essentialFiles = [
      path.join(frontendDir, 'src', 'App.tsx'),
      path.join(frontendDir, 'src', 'main.tsx'),
      path.join(frontendDir, 'package.json'),
      path.join(frontendDir, 'index.html'),
    ];

    for (const filePath of essentialFiles) {
      try {
        await fs.access(filePath);
      } catch {
        const relPath = path.relative(targetDir, filePath);
        errors.push(`[Integrity] Essential file is missing: ${relPath}`);
      }
    }

    // --- 2. Check TS imports and Placeholder Content ---
    const srcDir = path.join(frontendDir, 'src');
    try {
      await this.scanDirRecursive(srcDir, async (filePath) => {
        const ext = path.extname(filePath);
        if (ext === '.ts' || ext === '.tsx') {
          const content = await fs.readFile(filePath, 'utf-8');
          const relPath = path.relative(targetDir, filePath);

          // A. Scan for placeholder strings
          const forbiddenPlaceholders = [
            '// TODO',
            'TODO: Implement',
            'Feature One',
            'Feature Two',
            'Feature Three',
            'Static cards',
            'Empty dashboard',
          ];
          
          for (const ph of forbiddenPlaceholders) {
            if (content.includes(ph)) {
              errors.push(`[Placeholder] File ${relPath} contains forbidden placeholder pattern: "${ph}"`);
            }
          }

          // Specific check for stub hooks returning null / empty state bypassing fetches
          if (filePath.includes('hooks') && content.includes('setData(null)') && content.includes('// TODO')) {
            errors.push(`[Stub Hook] Hook ${relPath} appears to be an unimplemented mock template.`);
          }

          // B. Scan for broken imports
          const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
          let match;
          while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (importPath.startsWith('.')) {
              const resolvedDir = path.dirname(filePath);
              const targetPath = path.resolve(resolvedDir, importPath);
              const possibleExtensions = ['.ts', '.tsx', '.js', '.jsx'];
              let resolved = false;

              // Check with exact name first (in case extension is already present in import path)
              try {
                const stat = await fs.stat(targetPath);
                if (stat.isDirectory()) {
                  // If it's a directory, check for index files
                  for (const possibleExt of possibleExtensions) {
                    try {
                      await fs.access(path.join(targetPath, 'index' + possibleExt));
                      resolved = true;
                      break;
                    } catch {}
                  }
                } else {
                  resolved = true;
                }
              } catch {}

              if (!resolved) {
                for (const possibleExt of possibleExtensions) {
                  try {
                    await fs.access(targetPath + possibleExt);
                    resolved = true;
                    break;
                  } catch {}
                }
              }

              // Try as directory (e.g. index.ts)
              if (!resolved) {
                for (const possibleExt of possibleExtensions) {
                  try {
                    await fs.access(path.join(targetPath, 'index' + possibleExt));
                    resolved = true;
                    break;
                  } catch {}
                }
              }

              if (!resolved) {
                errors.push(`[Broken Import] File ${relPath} imports relative path "${importPath}" which cannot be resolved.`);
              }
            }
          }
        }
      });
    } catch (e: any) {
      Logger.warn(`[QualityChecker] Failed to scan frontend directory: ${e.message}`);
    }

    // --- 3. Scan Express Routes for Swagger Braces ---
    try {
      const backendSrcDir = path.join(backendDir, 'src');
      await fs.access(backendSrcDir);
      
      await this.scanDirRecursive(backendSrcDir, async (filePath) => {
        const ext = path.extname(filePath);
        if (ext === '.ts') {
          const content = await fs.readFile(filePath, 'utf-8');
          const relPath = path.relative(targetDir, filePath);
          
          // Check for Swagger braces in app.get/post/put/delete routes
          const routeBracesRegex = /app\.(get|post|put|delete|use)\s*\(\s*['"][^'"]*\{[^'"]+\}[^'"]*['"]/i;
          if (routeBracesRegex.test(content)) {
            errors.push(`[Swagger Route Path] Express route in backend/${relPath} contains OpenAPI parameter brackets (e.g. {id}) instead of Express colon notation (e.g. :id).`);
          }
        }
      });
    } catch {}

    // --- 4. Build Validation ---
    try {
      await fs.access(frontendDir);
      Logger.info(`[QualityChecker] Running build validation in ${frontendDir}...`);
      try {
        await execPromise('pnpm install --no-frozen-lockfile', { cwd: frontendDir });
        await execPromise('pnpm build', { cwd: frontendDir });
      } catch (e: any) {
        errors.push(`[Build Error] Frontend build failed:\n${e.stdout}\n${e.stderr}\n${e.message}`);
      }
    } catch {
      // frontend dir doesn't exist, skip build
    }

    const passed = errors.length === 0;
    Logger.info(`[QualityChecker] Quality validation complete. Passed: ${passed}. Errors found: ${errors.length}`);
    if (!passed) {
      errors.forEach(err => Logger.warn(`[QualityChecker Error] ${err}`));
    }

    return { passed, errors };
  }

  private static async scanDirRecursive(dir: string, onFile: (filePath: string) => Promise<void>): Promise<void> {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await this.scanDirRecursive(fullPath, onFile);
      } else {
        await onFile(fullPath);
      }
    }
  }
}
