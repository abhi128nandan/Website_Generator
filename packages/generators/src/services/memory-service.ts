import fs from 'fs/promises';
import path from 'path';
import { ProjectMemory, Logger } from '@website-generator/shared';

export class MemoryService {
  static async initMemory(targetDir: string, projectId: string, architecture: any, features: string[]): Promise<ProjectMemory> {
    const memoryPath = path.join(targetDir, 'memory.json');
    const memory: ProjectMemory = {
      projectId,
      architecture,
      features,
      components: [],
      edits: [],
      userPreferences: {},
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString()
    };

    await fs.writeFile(memoryPath, JSON.stringify(memory, null, 2), 'utf-8');
    return memory;
  }

  static async getMemory(targetDir: string): Promise<ProjectMemory | null> {
    const memoryPath = path.join(targetDir, 'memory.json');
    try {
      const data = await fs.readFile(memoryPath, 'utf-8');
      return JSON.parse(data) as ProjectMemory;
    } catch {
      return null;
    }
  }

  static async updateMemory(targetDir: string, update: Partial<ProjectMemory>): Promise<ProjectMemory | null> {
    const memory = await this.getMemory(targetDir);
    if (!memory) return null;

    const updatedMemory = {
      ...memory,
      ...update,
      lastEditedAt: new Date().toISOString()
    };

    const memoryPath = path.join(targetDir, 'memory.json');
    await fs.writeFile(memoryPath, JSON.stringify(updatedMemory, null, 2), 'utf-8');
    return updatedMemory;
  }

  static async recordEdit(targetDir: string, userPrompt: string, affectedFiles: string[], success: boolean) {
    const memory = await this.getMemory(targetDir);
    if (!memory) return;

    memory.edits.push({
      timestamp: new Date().toISOString(),
      userPrompt,
      affectedFiles,
      success
    });

    await this.updateMemory(targetDir, { edits: memory.edits });
  }
}
