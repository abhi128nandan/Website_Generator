import { ProviderFactory } from '@paperclip/ai-engine';
import { Logger } from '@paperclip/shared';
import fs from 'fs/promises';
import path from 'path';
import { ASTValidator } from '../validators/ast-validator';
import { ReactStructureValidator } from '../validators/react-structure-validator';

export class RepairAgent {
  private static async logRepair(targetDir: string, message: string) {
    console.log(message);
    try {
      const logPath = path.join(targetDir, 'logs', 'generation.log');
      const timestamp = new Date().toISOString();
      const logLine = `[${timestamp}] Step 5/6 [IN-PROGRESS]: ${message}\n`;
      await fs.appendFile(logPath, logLine, 'utf8');
    } catch (e) {
      // ignore if path not writable or doesn't exist
    }
  }

  static async repair(targetDir: string, errors: string[]): Promise<boolean> {
    Logger.info(`[RepairAgent] Attempting to repair generated files. Error count: ${errors.length}`);
    const provider = ProviderFactory.getProvider();
    
    // Parse errors to guess which files failed
    // Example error format: "frontend/src/App.tsx:10:5 - error TS1234: message" or build error mentioning a file
    const fileSet = new Set<string>();
    for (const err of errors) {
      const match = err.match(/(frontend[\\/]src[\\/][^:]+\.tsx?)/);
      if (match) {
        fileSet.add(match[1]);
      }
    }

    // If no specific files detected, try looking at vite/tsc build errors
    if (fileSet.size === 0) {
      for (const err of errors) {
        const match = err.match(/src[\\/]([^:]+\.tsx?)/);
        if (match) {
          fileSet.add('frontend/src/' + match[1].replace(/\\/g, '/'));
        }
      }
    }

    if (fileSet.size === 0) {
      Logger.warn(`[RepairAgent] Could not identify specific files to repair from errors.`);
      return false; // Can't repair if we don't know which file failed
    }

    Logger.info(`[RepairAgent] Identified files to repair: ${Array.from(fileSet).join(', ')}`);

    // 1. Snapshot error count before repair
    const astBefore = await ASTValidator.validate(targetDir);
    const reactBefore = await ReactStructureValidator.validate(targetDir);
    const X = astBefore.errors.length + reactBefore.errors.length;

    await this.logRepair(targetDir, "[REPAIR]\nSnapshot Created");
    await this.logRepair(targetDir, `[REPAIR]\nError Count Before: ${X}`);

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

    for (const relFilePath of fileSet) {
      const absPath = path.join(targetDir, relFilePath);
      const fileContent = snapshot.get(relFilePath);
      if (fileContent === undefined) continue;

      const prompt = `You are an expert React/TypeScript Developer and Bug Fixer.
The following file has compilation or structural errors.

File: ${relFilePath}

Current Content:
\`\`\`typescript
${fileContent}
\`\`\`

Reported Errors:
${errors.join('\n').substring(0, 2000)}

Requirements:
- Fix the errors mentioned.
- Ensure all imports resolve correctly.
- Fix any duplicate declarations or syntax errors.
- Output ONLY the raw corrected TS/TSX code within a markdown code block. Do not include conversational text or explanations.
`;

      try {
        const response = await provider.generateText(prompt);
        const codeMatch = response.match(/```[a-z]*\n([\s\S]*?)```/);
        const correctedCode = codeMatch ? codeMatch[1].trim() : response.trim();
        await fs.writeFile(absPath, correctedCode);
        Logger.info(`[RepairAgent] Successfully repaired ${relFilePath}`);
        modifiedAny = true;
      } catch (err: any) {
        Logger.error(`[RepairAgent] Failed to repair ${relFilePath}: ${err.message}`);
        // Restore snapshot if we failed mid-loop
        if (modifiedAny) {
          for (const [pathKey, origText] of snapshot.entries()) {
            await fs.writeFile(path.join(targetDir, pathKey), origText, 'utf8');
          }
        }
        return false;
      }
    }

    if (modifiedAny) {
      await this.logRepair(targetDir, "[REPAIR]\nRepair Applied");

      // 3. Post-repair validation
      const astAfter = await ASTValidator.validate(targetDir);
      const reactAfter = await ReactStructureValidator.validate(targetDir);
      const Y = astAfter.errors.length + reactAfter.errors.length;

      await this.logRepair(targetDir, `[REPAIR]\nError Count After: ${Y}`);

      // 4. Compare and rollback if worse
      if (Y > X) {
        await this.logRepair(targetDir, "[REPAIR]\nRollback Triggered");
        for (const [pathKey, origText] of snapshot.entries()) {
          await fs.writeFile(path.join(targetDir, pathKey), origText, 'utf8');
        }
        return false;
      }
    }

    return true;
  }
}
