import fs from 'fs/promises';
import path from 'path';

export class WorkspaceValidator {
  static async validateFiles(projectRoot: string, requiredFiles: string[]): Promise<string[]> {
    const missing: string[] = [];
    
    for (const file of requiredFiles) {
      try {
        await fs.access(path.join(projectRoot, file));
      } catch {
        missing.push(file);
      }
    }
    
    return missing;
  }
}
