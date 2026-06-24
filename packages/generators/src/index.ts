import { NormalizedRequirements } from '@website-generator/shared';
import fs from 'fs/promises';
import path from 'path';
import { RootWorkspaceGenerator } from './templates/root';
import { FrontendGenerator } from './templates/frontend';
import { BackendGenerator } from './templates/backend';
import { DatabaseGenerator } from './templates/database';
import { CrudGenerator } from './crud-generator';
import { FunctionalValidator } from './validators/functional-validator';
import { RelationNormalizer } from './compiler/relation-normalizer';

// --- Multi-Mode Generation Exports ---
export { GenerationRouter } from './router/generation-router';
export { FrontendAppGenerator } from './generators/frontend-generator';
export { HybridGenerator } from './generators/hybrid-generator';
export { FrontendAIAnalyzer } from './generators/frontend-ai-analyzer';
export { GeneratorQualityChecker } from './validators/generator-quality-checker';
export { GeneratorObservability } from './observability/observability-layer';
export { MetricsTracker } from './observability/metrics-tracker';
export { ConversationalEditor } from './agents/conversational-editor';



export class Scaffolder {
  static async generateProject(
    reqs: NormalizedRequirements,
    targetDir: string,
    onLog: (step: number, message: string) => void
  ): Promise<void> {
    
    // === STEP 1: Generate root workspace FIRST ===
    onLog(3, `[generator] Creating NEW isolated project: ${path.basename(targetDir)}`);
    onLog(3, `[generator] Project root:\n${targetDir}`);
    onLog(3, '[generator] Cleaning existing directory (if any)...');
    
    onLog(3, '[generator] Writing root workspace files...');
    await RootWorkspaceGenerator.generate(targetDir, reqs.appName, reqs.appType, reqs.features);
    
    // === ENVIRONMENT & DOCKER ===
    onLog(3, '[generator] Bootstrapping environment and infrastructure configuration...');
    const { EnvGenerator } = require('./runtime/env-generator');
    await EnvGenerator.generate(targetDir, reqs.appName);
    
    // Check for existing schema to prevent field disappearance during regeneration
    let existingEntities: any[] = [];
    try {
      const existingSchema = await fs.readFile(path.join(targetDir, 'database/prisma/schema.prisma'), 'utf-8');
      existingEntities = RelationNormalizer.parseExistingSchema(existingSchema);
      onLog(3, `[generator] Found existing Prisma schema with ${existingEntities.length} models for preservation.`);
    } catch {
      // No existing schema
    }

    // === AI ARCHITECTURE ANALYSIS ===
    onLog(3, '[generator] Executing AI architecture analysis...');
    await CrudGenerator.analyze(reqs);
    
    // === CANONICAL ENTITY NORMALIZATION ===
    if (reqs.architecture && reqs.architecture.entities) {
      onLog(3, '[generator] Applying canonical entity normalization & field preservation...');
      reqs.architecture.entities = RelationNormalizer.normalize(reqs.architecture.entities, existingEntities) as any;
    }
    
    // Validate root files exist before proceeding
    await RootWorkspaceGenerator.validate(targetDir);
    
    onLog(3, '[generator] Generated:\n- package.json\n- pnpm-workspace.yaml\n- .npmrc\n- .gitignore');
    onLog(3, '[generator] Workspace root validated successfully.');
    
    // === STEP 2: Generate sub-packages ===
    onLog(4, `[generator] Writing frontend files...`);
    const { FrontendRouter } = require('./router/frontend-router');
    await FrontendRouter.generate(targetDir, reqs);
    
    onLog(4, `[generator] Writing backend files...`);
    await BackendGenerator.generate(targetDir, reqs);
    
    onLog(4, `[generator] Writing database files...`);
    await DatabaseGenerator.generate(targetDir, reqs);
    
    // === STEP 3: Validate sub-package files ===
    onLog(5, '[generator] Validating generated workspace structure...');
    const requiredSubFiles = [
      'frontend/package.json',
      'backend/package.json',
      'database/package.json',
      'database/prisma/schema.prisma',
    ];
    
    const missing: string[] = [];
    for (const file of requiredSubFiles) {
      try {
        await fs.access(path.join(targetDir, file));
      } catch {
        missing.push(file);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Scaffold validation failed. Missing sub-package files: ${missing.join(', ')}`);
    }
    
    onLog(5, '[generator] All workspace packages validated physically.');
    
    // === STEP 4: Write metadata ===
    onLog(5, '[generator] Updating project metadata...');
    try {
      const metadataPath = path.join(targetDir, 'metadata.json');
      const existingMeta = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      const updatedMeta = {
        ...existingMeta,
        ...reqs,
        updatedAt: new Date().toISOString(),
        generatorVersion: '1.0.0',
        workspaceIntegrity: true
      };
      await fs.writeFile(metadataPath, JSON.stringify(updatedMeta, null, 2), 'utf-8');
    } catch (e) {
      onLog(5, '[WARN] Failed to merge metadata.json');
    }

    const generatedFiles = {
      files: [
        'package.json',
        'pnpm-workspace.yaml',
        '.npmrc',
        '.gitignore',
        '.env.example',
        'docker-compose.yml',
        'README.md',
        'metadata.json',
        'generated-files.json',
        'frontend/',
        'backend/',
        'database/'
      ]
    };
    await fs.writeFile(
      path.join(targetDir, 'generated-files.json'),
      JSON.stringify(generatedFiles, null, 2),
      'utf-8'
    );

    onLog(6, `[generator] Final generated files:\n- package.json\n- pnpm-workspace.yaml\n- .npmrc\n- .gitignore`);
    onLog(6, `[generator] Final scaffold file count: ${generatedFiles.files.length}`);
    onLog(6, `[generator] Project tree:\n${path.basename(targetDir)}/\n├── package.json\n├── pnpm-workspace.yaml\n├── frontend/\n├── backend/\n└── database/`);
    
    onLog(6, '[generator] Finalizing project...');
  }
}
