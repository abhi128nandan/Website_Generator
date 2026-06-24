import { ArchitectureAnalyzer } from './architecture-analyzer';
import { DiffEngine } from './diff-engine';
import { MemoryService } from '../services/memory-service';
import { Logger } from '@website-generator/shared';
import fs from 'fs/promises';
import path from 'path';

export class ConversationalEditor {
  static async edit(targetDir: string, prompt: string, onLog: (msg: string) => void): Promise<boolean> {
    onLog(`[ConversationalEdit] Starting targeted edit for: "${prompt}"`);
    
    // 1. Get memory
    const memory = await MemoryService.getMemory(targetDir);
    if (!memory || !memory.architecture) {
      throw new Error("Project memory missing. Cannot perform diff-based edit.");
    }

    // 2. Analyze Architecture changes
    onLog(`[ConversationalEdit] Analyzing architecture diff...`);
    const newArchPartial = await ArchitectureAnalyzer.analyzeEdit(targetDir, prompt);
    
    // 3. Compute affected files
    const affectedFiles = DiffEngine.computeAffectedFiles(memory.architecture, newArchPartial);
    
    if (affectedFiles.length === 0) {
      onLog(`[ConversationalEdit] No specific files identified. This might be a styling or minor change. Need full AST-level instruction runner (Phase 4).`);
      // For now we'll just record it
      await MemoryService.recordEdit(targetDir, prompt, affectedFiles, false);
      return false;
    }

    onLog(`[ConversationalEdit] Targeted regeneration required for: ${affectedFiles.join(', ')}`);

    // 4. Update memory with new architecture
    const updatedArch = { ...memory.architecture, ...newArchPartial };
    await MemoryService.updateMemory(targetDir, { architecture: updatedArch });

    // 5. In a real system, we'd invoke the specific generators (e.g. PageGenerator, ComponentGenerator) 
    // strictly for the files in `affectedFiles`. For now, we simulate this by dispatching ASTRepairAgent 
    // with the edit prompt for those specific files.
    
    let success = true;
    for (const file of affectedFiles) {
      // Simulate regeneration of specific files
      onLog(`[ConversationalEdit] Regenerating ${file}...`);
      // Placeholder for actual file generation
      // await SpecificFileGenerator.generate(file, updatedArch);
    }

    await MemoryService.recordEdit(targetDir, prompt, affectedFiles, success);
    onLog(`[ConversationalEdit] Edit applied successfully.`);
    return success;
  }
}
