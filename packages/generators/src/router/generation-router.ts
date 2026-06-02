import { NormalizedRequirements, Logger } from '@paperclip/shared';
import fs from 'fs/promises';
import path from 'path';
import { Scaffolder } from '../index';
import { FrontendAppGenerator } from '../generators/frontend-generator';
import { HybridGenerator } from '../generators/hybrid-generator';
import { GeneratorQualityChecker } from '../validators/generator-quality-checker';
import { FunctionalValidator } from '../validators/functional-validator';
import { CrudGenerator } from '../crud-generator';
import { FrontendAIAnalyzer } from '../generators/frontend-ai-analyzer';


/**
 * Generation Strategy Router.
 *
 * Routes classified application prompts to the correct specialized generator pipeline.
 * Preserves complete isolation between generator modes.
 *
 * Routing:
 *   - "crud-admin"        → Existing Scaffolder (ZERO changes to CRUD path)
 *   - "frontend-app"      → FrontendAppGenerator
 *   - "hybrid-fullstack"  → HybridGenerator
 *   - fallback            → Existing Scaffolder (backward compatible)
 */
export class GenerationRouter {
  static async generate(
    reqs: NormalizedRequirements,
    targetDir: string,
    onLog: (step: number, message: string) => void
  ): Promise<void> {
    const mode = reqs.classifiedMode || 'crud-admin';

    Logger.info(`[router] ═══════════════════════════════════════════`);
    Logger.info(`[router] Generation Strategy Router activated`);
    Logger.info(`[router] Classified mode: ${mode}`);
    Logger.info(`[router] Target directory: ${targetDir}`);

    onLog(3, `[router] Selected generator: ${this.getGeneratorName(mode)}`);

    let attempt = 1;
    const maxAttempts = 2;
    let isValidated = false;

    while (attempt <= maxAttempts && !isValidated) {
      Logger.info(`[router] Generation Attempt ${attempt}/${maxAttempts} for mode ${mode}`);
      try {
        switch (mode) {
          case 'frontend-app':
            Logger.info(`[router] Routing to FrontendAppGenerator`);
            Logger.info(`[router] Pipeline: AI Analysis → React/Vite scaffold → Components → Services → Hooks → Pages`);
            Logger.info(`[router] Database: NONE | Backend: NONE | Prisma: NONE`);
            await FrontendAppGenerator.generate(reqs, targetDir, onLog);
            break;

          case 'hybrid-fullstack':
            Logger.info(`[router] Routing to HybridGenerator`);
            Logger.info(`[router] Pipeline: AI Analysis → Frontend + Backend → Optional Database`);
            await HybridGenerator.generate(reqs, targetDir, onLog);
            break;

          case 'crud-admin':
          default:
            Logger.info(`[router] Routing to Scaffolder (existing CRUD pipeline)`);
            Logger.info(`[router] Pipeline: CRUD Analysis → Prisma → Express → React Dashboard`);
            Logger.info(`[router] Database: PostgreSQL | Backend: Express+Prisma | Prisma: YES`);
            await Scaffolder.generateProject(reqs, targetDir, onLog);
            break;
        }

        // --- Quality Checker ---
        onLog(5, `[router] Running static code quality checks (Attempt ${attempt})...`);
        const qualityCheck = await GeneratorQualityChecker.validate(targetDir, reqs);
        
        // --- Functional QA ---
        onLog(5, `[router] Running AI Functional Completeness QA (Attempt ${attempt})...`);
        const validation = await FunctionalValidator.validate(targetDir, reqs);

        if (qualityCheck.passed && validation.score >= 90) {
          onLog(6, `[router] Reliability checks PASSED! Functional QA Score: ${validation.score}/100.`);
          isValidated = true;
          
          // Write reliability score to metadata for dashboard tracking
          try {
            const metadataPath = path.join(targetDir, 'metadata.json');
            const metaContent = await fs.readFile(metadataPath, 'utf-8');
            const meta = JSON.parse(metaContent);
            meta.reliability = {
              buildSuccess: true,
              runtimeSuccess: true,
              apiSuccess: validation.criteria.forms >= 80,
              persistenceSuccess: validation.criteria.database >= 80,
              score: validation.score
            };
            await fs.writeFile(metadataPath, JSON.stringify(meta, null, 2), 'utf-8');
          } catch (e: any) {
            Logger.warn(`[router] Failed to write reliability metadata: ${e.message}`);
          }
        } else {
          const errors = [
            ...qualityCheck.errors,
            ...(validation.score < 90 ? [`Functional QA score is too low: ${validation.score}/100 (Required: 90)`] : [])
          ];
          onLog(5, `[router] Reliability checks FAILED on attempt ${attempt}.`);
          errors.forEach(err => onLog(5, `[QA ERROR] ${err}`));

          if (attempt < maxAttempts) {
            onLog(5, `[router] Re-analyzing and triggering regeneration attempt ${attempt + 1}...`);
            
            // Inject missing features into reqs so AI analyzes again
            reqs.features = Array.from(new Set([...reqs.features, ...validation.missingFunctionality]));
            if (!reqs.workflows) reqs.workflows = [];
            reqs.workflows = Array.from(new Set([...reqs.workflows, "Implement missing business logic and validation"]));
            
            if (mode === 'crud-admin') {
              await CrudGenerator.analyze(reqs);
            } else {
              await FrontendAIAnalyzer.analyze(reqs);
            }
            attempt++;
          } else {
            throw new Error(`Project generation failed reliability and quality validation checks:\n- ${errors.join('\n- ')}`);
          }
        }
      } catch (err: any) {
        Logger.error(`[router] Error during generation attempt ${attempt}: ${err.message}`);
        if (attempt === maxAttempts) {
          throw err;
        }
        attempt++;
      }
    }

    Logger.info(`[router] ═══════════════════════════════════════════`);
    Logger.info(`[router] Generation completed successfully for mode: ${mode}`);
  }

  private static getGeneratorName(mode: string): string {
    switch (mode) {
      case 'frontend-app': return 'frontend-generator';
      case 'hybrid-fullstack': return 'hybrid-generator';
      case 'crud-admin': return 'crud-generator (existing)';
      default: return 'crud-generator (fallback)';
    }
  }
}
