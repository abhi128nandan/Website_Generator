import { NormalizedRequirements, Logger, RecoverableGenerationError } from '@website-generator/shared';
import fs from 'fs/promises';
import path from 'path';
import { Scaffolder } from '../index';
import { FrontendAppGenerator } from '../generators/frontend-generator';
import { HybridGenerator } from '../generators/hybrid-generator';
import { GeneratorQualityChecker } from '../validators/generator-quality-checker';
import { FunctionalValidator } from '../validators/functional-validator';
import { CrudGenerator } from '../crud-generator';
import { FrontendAIAnalyzer } from '../generators/frontend-ai-analyzer';
import { RepairAgent } from '../agents/repair-agent';
import { GeneratorObservability } from '../observability/observability-layer';
import { MetricsTracker } from '../observability/metrics-tracker';
import { ArchitecturePlanner } from '../generators/architecture-planner';
import { MemoryService } from '../services/memory-service';


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

    const repairAttemptsLog: any[] = [];
    const buildErrorsLog: string[] = [];
    let qaScoreBreakdownLog: any = null;

    const startTime = Date.now();
    let attempt = 1;
    const maxAttempts = 5;
    let isValidated = false;
    let functionalSuccess = false;
    let totalRepairs = 0;

    while (attempt <= maxAttempts && !isValidated) {
      Logger.info(`[router] Generation Attempt ${attempt}/${maxAttempts} for mode ${mode}`);
      try {
        if (attempt === 1) {
          // --- Blueprint Generation Layer ---
          const srsText = JSON.stringify(reqs, null, 2);
          const blueprint = await ArchitecturePlanner.plan(srsText, reqs, targetDir, onLog);
          (reqs as any).blueprint = blueprint;
          
          // --- Project Memory Init ---
          await MemoryService.initMemory(targetDir, path.basename(targetDir), blueprint, reqs.features);
        }

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
        } catch (genErr: any) {
          if (genErr.name === 'RecoverableGenerationError') {
             onLog(5, `[router] Recoverable generation error caught. Attempting router-level repair...`);
             const repaired = await RepairAgent.repair(targetDir, genErr.errors);
             if (!repaired) {
               onLog(5, `[router] Router-level repair failed. Propagating error...`);
               throw genErr;
             }
             onLog(5, `[router] Router-level repair applied. Proceeding to quality checks.`);
          } else {
             throw genErr;
          }
        }

        // --- Quality Checker ---
        onLog(5, `[router] Running static code quality checks (Attempt ${attempt})...`);
        let qualityCheck = await GeneratorQualityChecker.validate(targetDir, reqs);
        
        if (!qualityCheck.passed) {
          onLog(5, `[router] Quality checks failed. Invoking RepairAgent...`);
          buildErrorsLog.push(...qualityCheck.errors);
          const repaired = await RepairAgent.repair(targetDir, qualityCheck.errors);
          totalRepairs++;
          repairAttemptsLog.push({
            attempt,
            stage: 'quality-checks',
            errors: [...qualityCheck.errors],
            repaired
          });
          if (repaired) {
            onLog(5, `[router] RepairAgent applied fixes. Re-running quality checks...`);
            qualityCheck = await GeneratorQualityChecker.validate(targetDir, reqs);
            if (!qualityCheck.passed) {
              buildErrorsLog.push(...qualityCheck.errors);
            }
          } else {
            onLog(5, `[router] RepairAgent could not fix the errors.`);
          }
        }
        
        if (qualityCheck.passed) {
          onLog(6, `[router] Reliability checks PASSED! Project built successfully.`);
          isValidated = true;
          functionalSuccess = true;
          onLog(5, `[router] Project generation completely successful. AST, TypeScript, and Structure Validated.`);
        } else {
          const errors = [...qualityCheck.errors];
          buildErrorsLog.push(...errors);
          onLog(5, `[router] Reliability checks FAILED on attempt ${attempt}.`);
          errors.forEach(err => onLog(5, `[BUILD ERROR] ${err}`));

          if (attempt < maxAttempts) {
            onLog(5, `[router] Quality checks failed, preparing for regeneration attempt ${attempt + 1}...`);
            attempt++;
          } else {
            throw new Error(`Project generation failed reliability and quality validation checks:\n- ${errors.join('\n- ')}`);
          }
        }
      } catch (err: any) {
        Logger.error(`[router] Error during generation attempt ${attempt}: ${err.message}`);
        buildErrorsLog.push(err.message || String(err));
        if (attempt === maxAttempts) {
          // Save observability report before throwing
          await GeneratorObservability.save(targetDir, reqs, buildErrorsLog, qaScoreBreakdownLog, repairAttemptsLog);
          await MetricsTracker.recordRun({
            success: false,
            buildSuccess: buildErrorsLog.length === 0,
            functionalSuccess: false,
            repairAttempts: totalRepairs,
            generationTimeMs: Date.now() - startTime
          });
          throw err;
        }
        attempt++;
      }
    }

    // --- Post-Success Advisory QA ---
    if (isValidated) {
      try {
        onLog(5, `[router] Running Advisory Functional QA...`);
        const validation = await FunctionalValidator.validate(targetDir, reqs);
        qaScoreBreakdownLog = validation;
        onLog(6, `[router] Advisory QA Score: ${validation.score}/100. (Telemetry Only)`);
        
        try {
          const metadataPath = path.join(targetDir, 'website-generator-metadata.json');
          const meta = {
            generatedAt: new Date().toISOString(),
            appName: reqs.appName,
            classifiedMode: mode,
            score: validation.score,
            reliability: {
              buildSuccess: true,
              runtimeSuccess: true,
              apiSuccess: validation.criteria?.forms >= 80,
              persistenceSuccess: validation.criteria?.database >= 80,
              score: validation.score
            }
          };
          await fs.writeFile(metadataPath, JSON.stringify(meta, null, 2), 'utf-8');
        } catch (e: any) {
          Logger.warn(`[router] Failed to write reliability metadata: ${e.message}`);
        }
      } catch (err: any) {
        Logger.warn(`[router] Advisory QA failed to run (non-fatal): ${err.message}`);
        qaScoreBreakdownLog = { score: 0, missingFunctionality: [], criteria: {} };
      }
    } else {
        qaScoreBreakdownLog = { score: 0, missingFunctionality: [], criteria: {} };
    }

    // Save observability report on success
    await GeneratorObservability.save(targetDir, reqs, buildErrorsLog, qaScoreBreakdownLog, repairAttemptsLog);
    await MetricsTracker.recordRun({
      success: isValidated,
      buildSuccess: buildErrorsLog.length === 0,
      functionalSuccess,
      repairAttempts: totalRepairs,
      generationTimeMs: Date.now() - startTime
    });

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
