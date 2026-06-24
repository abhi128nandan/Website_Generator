import { ProviderFactory } from '@website-generator/ai-engine';
import { Logger } from '@website-generator/shared';
import fs from 'fs/promises';
import path from 'path';
import { ASTRepairAgent } from './ast-repair-agent';
import { TypeRepairAgent } from './type-repair-agent';
import { BuildRepairAgent } from './build-repair-agent';
import { FunctionalRepairAgent } from './functional-repair-agent';
import { ValidationRegressionGuard } from '../validators/validation-regression-guard';

interface FailureFingerprint {
  file: string | null;
  errorCategory: string;
  errorHash: string;
}

export class RepairAgent {
  private static lastFingerprints: Map<string, FailureFingerprint[]> = new Map();
  private static async logRepair(targetDir: string, message: string) {
    console.log(message);
    try {
      const logPath = path.join(targetDir, 'logs', 'generation.log');
      const timestamp = new Date().toISOString();
      const logLine = `[${timestamp}] Step 5/6 [IN-PROGRESS]: ${message}\n`;
      await fs.appendFile(logPath, logLine, 'utf8');
    } catch (e) {
      // ignore
    }
  }

  private static normalizeFilePath(targetDir: string, filePath: string): string {
    const normalizedTarget = targetDir.replace(/\\/g, '/');
    let normalizedFile = filePath.replace(/\\/g, '/');
    if (normalizedFile.startsWith(normalizedTarget)) {
      normalizedFile = normalizedFile.substring(normalizedTarget.length);
      if (normalizedFile.startsWith('/')) normalizedFile = normalizedFile.substring(1);
    }
    return normalizedFile;
  }

  private static extractFilePath(targetDir: string, errorString: string, rawError?: any): string | null {
    if (rawError && typeof rawError === 'object' && rawError.type === 'BUILD_DIAGNOSTIC') {
      return this.normalizeFilePath(targetDir, rawError.file);
    }

    const depMatch = errorString.match(/\[Dependency Error\]\s*(.*?):/i);
    if (depMatch) return this.normalizeFilePath(targetDir, depMatch[1].trim());
    
    const pageMatch = errorString.match(/Page\s+([^\s]+)\s+must/i);
    if (pageMatch) return `frontend/src/pages/${pageMatch[1]}`;
    
    const missingMatch = errorString.match(/is missing:\s*(frontend[\\\/]src[\\\/][^\s]+\.tsx?)/i);
    if (missingMatch) return this.normalizeFilePath(targetDir, missingMatch[1]);

    const genericMatch = errorString.match(/((?:[A-Za-z]:[\\\/])?.*?(?:frontend|backend)[\\\/]src[\\\/][^\s:(]+\.tsx?)/i);
    if (genericMatch) return this.normalizeFilePath(targetDir, genericMatch[1]);
    
    return null;
  }

  private static async createMissingFiles(targetDir: string, errors: any[]): Promise<number> {
    let created = 0;
    for (const err of errors) {
      const errStr = typeof err === 'object' ? JSON.stringify(err) : String(err);
      
      const cssMatch = errStr.match(/Cannot resolve local import '(\.\/.*?\.css)'/i);
      if (cssMatch) {
        const sourceMatch = this.extractFilePath(targetDir, errStr);
        if (sourceMatch) {
          const cssPath = path.join(targetDir, path.dirname(sourceMatch), cssMatch[1]);
          try {
             await fs.writeFile(cssPath, '/* Generated CSS */\n', 'utf-8');
             created++;
          } catch(e) {}
        }
      }
      
      const missingMatch = errStr.match(/Required (service|hook) file is missing:\s*(frontend[\\\/]src[\\\/][^\s]+\.ts)/i);
      if (missingMatch) {
         const type = missingMatch[1].toLowerCase();
         const filePath = missingMatch[2];
         const absPath = path.join(targetDir, filePath);
         try {
           const baseName = path.basename(filePath, '.ts');
           let content = '';
           if (type === 'service') {
             content = `export const ${baseName} = {};\n`;
           } else if (type === 'hook') {
             content = `export function ${baseName}() { return {}; }\n`;
           }
           await fs.writeFile(absPath, content, 'utf-8');
           created++;
         } catch(e) {}
      }
    }
    return created;
  }

  static async repair(targetDir: string, errors: any[]): Promise<boolean> {
    Logger.info(`[RepairAgent] Dispatching repair. Error count: ${errors.length}`);
    
    // Categorize error type
    let errorCategory: 'AST' | 'TYPE' | 'BUILD' | 'FUNCTIONAL' = 'BUILD';
    const errorString = errors.map(e => typeof e === 'object' ? JSON.stringify(e) : String(e)).join(' ').toLowerCase();

    if (errorString.includes('functional qa score') || errorString.includes('functional')) {
      errorCategory = 'FUNCTIONAL';
    } else if (errorString.includes('ts1') || errorString.includes('ts2') || errorString.includes('type')) {
      errorCategory = 'TYPE';
    } else if (errorString.includes('syntax') || errorString.includes('malformed') || errorString.includes('import') || errorString.includes('export')) {
      errorCategory = 'AST';
    } else if (errorString.includes('vite') || errorString.includes('pnpm') || errorString.includes('build error')) {
      errorCategory = 'BUILD';
    }

    Logger.info(`[RepairAgent] Error categorized as: ${errorCategory}`);
    await this.logRepair(targetDir, `[REPAIR] Triggering specialized agent: ${errorCategory}RepairAgent`);

    // Parse errors to guess which files failed
    const fileSet = new Set<string>();
    const repairTraces: any[] = [];
    const currentFingerprints: FailureFingerprint[] = [];

    for (const err of errors) {
      const errorStringLocal = typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err);
      let detectedFile: string | null = null;
      
      if (typeof err === 'object' && err !== null && 'file' in err) {
        if ('type' in err && err.type === 'BUILD_DIAGNOSTIC') {
           detectedFile = this.normalizeFilePath(targetDir, err.file);
        } else {
           detectedFile = this.normalizeFilePath(targetDir, err.file);
        }
      } else if (typeof err === 'string') {
        detectedFile = this.extractFilePath(targetDir, errorStringLocal, err);
      }
      
      if (detectedFile) {
        fileSet.add(detectedFile);
      }

      const fp: FailureFingerprint = {
        file: detectedFile,
        errorCategory: errorCategory,
        errorHash: errorStringLocal
      };
      currentFingerprints.push(fp);

      repairTraces.push({
        error: errorStringLocal,
        fileDetected: !!detectedFile,
        file: detectedFile || '',
        repairType: errorCategory,
        result: 'pending'
      });
    }

    // --- Loop Detection (P0-E) ---
    const last = this.lastFingerprints.get(targetDir) || [];
    let isLoop = false;
    
    if (last.length > 0 && last.length === currentFingerprints.length) {
      isLoop = currentFingerprints.every((fp, i) => 
        fp.errorHash === last[i].errorHash && 
        fp.file === last[i].file && 
        fp.errorCategory === last[i].errorCategory
      );
    }

    if (isLoop) {
      Logger.warn(`[RepairAgent] Loop Detection: Identical failure fingerprint detected from previous attempt. Escaping infinite repair loop.`);
      repairTraces.forEach(t => t.result = 'skipped - loop detected');
      await this.writeTraces(targetDir, repairTraces);
      return false; // Escalate immediately
    }

    this.lastFingerprints.set(targetDir, currentFingerprints);
    // --- End Loop Detection ---

    const createdCount = await this.createMissingFiles(targetDir, errors);
    if (createdCount > 0) {
      Logger.info(`[RepairAgent] Created ${createdCount} missing files.`);
    }

    if (fileSet.size === 0 && errorCategory !== 'BUILD') {
      Logger.warn(`[RepairAgent] Could not identify specific files to repair from errors.`);
      repairTraces.forEach(t => t.result = 'skipped - no file');
      await this.writeTraces(targetDir, repairTraces);
      return false; 
    }

    // 1. Snapshot error count before repair
    const initialErrorCount = await ValidationRegressionGuard.getErrorCount(targetDir);

    // 2. Snapshot file contents before repair
    const snapshot = new Map<string, string>();
    for (const relFilePath of fileSet) {
      const absPath = path.join(targetDir, relFilePath);
      try {
        const content = await fs.readFile(absPath, 'utf-8');
        snapshot.set(relFilePath, content);
      } catch {}
    }

    let modifiedAny = false;

    if (errorCategory === 'BUILD') {
      const fixResult = await BuildRepairAgent.repair(targetDir, errors.map(e => typeof e === 'object' ? JSON.stringify(e) : String(e)).join('\n'));
      if (fixResult) {
        // Implement parsing of BuildRepairAgent format:
        // FILE: path
        // ```
        // content
        // ```
        const regex = /FILE:\s*([^\n]+)\n```(?:[a-z]*)\n([\s\S]*?)```/g;
        let match;
        while ((match = regex.exec(fixResult)) !== null) {
          const filePath = match[1].trim();
          const correctedContent = match[2].trim();
          const absPath = path.join(targetDir, filePath);
          
          try {
            await fs.writeFile(absPath, correctedContent);
            modifiedAny = true;
          } catch(e: any) {
            Logger.warn(`Failed to write build fix to ${absPath}: ${e.message}`);
          }
        }
      }
    } else {
      for (const relFilePath of fileSet) {
        const absPath = path.join(targetDir, relFilePath);
        const fileContent = snapshot.get(relFilePath);
        if (fileContent === undefined) continue;

        let correctedCode: string | null = null;

        if (errorCategory === 'AST') {
          correctedCode = await ASTRepairAgent.repair(targetDir, relFilePath, fileContent, errors.map(e => typeof e === 'object' ? JSON.stringify(e) : String(e)));
        } else if (errorCategory === 'TYPE') {
          correctedCode = await TypeRepairAgent.repair(targetDir, relFilePath, fileContent, errors.map(e => typeof e === 'object' ? JSON.stringify(e) : String(e)));
        } else if (errorCategory === 'FUNCTIONAL') {
          correctedCode = await FunctionalRepairAgent.repair(targetDir, relFilePath, fileContent, errors.map(e => typeof e === 'object' ? JSON.stringify(e) : String(e)));
        }

        if (correctedCode) {
          const lowerCode = correctedCode.toLowerCase();
          if (lowerCode.includes('welcome to') || lowerCode.includes('// todo') || lowerCode.includes('placeholder')) {
             Logger.warn(`[RepairAgent] Rejected placeholder fix for ${relFilePath}`);
             continue;
          }
          await fs.writeFile(absPath, correctedCode);
          Logger.info(`[RepairAgent] Successfully applied fix to ${relFilePath}`);
          modifiedAny = true;
        }
      }
    }

    if (modifiedAny) {
      await this.logRepair(targetDir, "[REPAIR]\nRepair Applied");

      // 3. Post-repair validation
      const finalErrorCount = await ValidationRegressionGuard.getErrorCount(targetDir);
      await this.logRepair(targetDir, `[REPAIR]\nError Count After: ${finalErrorCount}`);

      // 4. Compare and rollback if worse
      const reverted = await ValidationRegressionGuard.rollbackIfWorse(
        targetDir,
        snapshot,
        initialErrorCount,
        finalErrorCount,
        async (msg) => this.logRepair(targetDir, msg)
      );

      repairTraces.forEach(t => t.result = reverted ? 'rolled-back' : 'success');
      await this.writeTraces(targetDir, repairTraces);

      if (reverted) return false;
      return finalErrorCount === 0 || finalErrorCount < initialErrorCount;
    }

    repairTraces.forEach(t => t.result = 'failed - no modification');
    await this.writeTraces(targetDir, repairTraces);
    return false;
  }

  private static async writeTraces(targetDir: string, traces: any[]) {
    try {
      const artifactsDir = path.join(targetDir, 'generation-artifacts');
      await fs.mkdir(artifactsDir, { recursive: true });
      const tracePath = path.join(artifactsDir, 'repair-trace.json');
      
      let existing: any[] = [];
      try {
        const content = await fs.readFile(tracePath, 'utf-8');
        existing = JSON.parse(content);
      } catch (e) {}
      
      existing.push(...traces);
      await fs.writeFile(tracePath, JSON.stringify(existing, null, 2), 'utf-8');
    } catch (e) {
      Logger.warn(`[RepairAgent] Could not write repair traces: ${(e as any).message}`);
    }
  }
}
