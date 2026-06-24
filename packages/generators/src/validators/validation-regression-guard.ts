import { ASTValidator } from './ast-validator';
import { ReactStructureValidator } from './react-structure-validator';
import fs from 'fs/promises';
import path from 'path';

export class ValidationRegressionGuard {
  static async getErrorCount(targetDir: string): Promise<number> {
    const ast = await ASTValidator.validate(targetDir);
    const react = await ReactStructureValidator.validate(targetDir);
    return ast.errors.length + react.errors.length;
  }

  static async rollbackIfWorse(
    targetDir: string,
    snapshot: Map<string, string>,
    beforeCount: number,
    afterCount: number,
    onLog: (msg: string) => Promise<void>
  ): Promise<boolean> {
    if (afterCount > beforeCount) {
      await onLog(`[REPAIR]\nRollback Triggered. Errors increased from ${beforeCount} to ${afterCount}.`);
      for (const [relPath, origText] of snapshot.entries()) {
        const absPath = path.join(targetDir, relPath);
        await fs.writeFile(absPath, origText, 'utf8');
      }
      return true; // true means rollback happened
    }
    return false;
  }
}
