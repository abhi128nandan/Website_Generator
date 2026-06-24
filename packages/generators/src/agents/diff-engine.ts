import { Logger } from '@website-generator/shared';
import { ArchitectureBlueprint } from '../generators/architecture-planner';

export class DiffEngine {
  static computeAffectedFiles(oldArch: ArchitectureBlueprint, newArch: Partial<ArchitectureBlueprint>): string[] {
    Logger.info(`[DiffEngine] Computing affected files...`);
    const affectedFiles: string[] = [];

    // Compare pages
    if (newArch.pages && Array.isArray(newArch.pages)) {
      const addedPages = newArch.pages.filter(p => !oldArch.pages?.includes(p));
      const removedPages = (oldArch.pages || []).filter(p => !newArch.pages!.includes(p));
      
      addedPages.forEach(p => affectedFiles.push(`frontend/src/pages/${p}.tsx`));
      removedPages.forEach(p => affectedFiles.push(`frontend/src/pages/${p}.tsx`)); // Marked for deletion or cleanup

      // If pages changed, App.tsx / Routing probably changed
      if (addedPages.length > 0 || removedPages.length > 0) {
        affectedFiles.push('frontend/src/App.tsx');
      }
    }

    // Compare entities
    if (newArch.entities && Array.isArray(newArch.entities)) {
      const addedEntities = newArch.entities.filter(e => !oldArch.entities?.includes(e));
      addedEntities.forEach(e => affectedFiles.push(`backend/src/models/${e}.ts`));
      
      // If entities changed, maybe schema.prisma changed
      if (addedEntities.length > 0) {
        affectedFiles.push('database/schema.prisma');
      }
    }

    // Compare design tokens
    if (newArch.designTokens) {
      if (JSON.stringify(oldArch.designTokens) !== JSON.stringify(newArch.designTokens)) {
        affectedFiles.push('frontend/src/index.css');
        affectedFiles.push('frontend/tailwind.config.js');
      }
    }

    // Deduplicate
    const uniqueFiles = Array.from(new Set(affectedFiles));
    Logger.info(`[DiffEngine] Found ${uniqueFiles.length} affected files: ${uniqueFiles.join(', ')}`);
    return uniqueFiles;
  }
}
