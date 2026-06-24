"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerationRouter = void 0;
const shared_1 = require("@website-generator/shared");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const index_1 = require("../index");
const frontend_generator_1 = require("../generators/frontend-generator");
const hybrid_generator_1 = require("../generators/hybrid-generator");
const generator_quality_checker_1 = require("../validators/generator-quality-checker");
const functional_validator_1 = require("../validators/functional-validator");
const crud_generator_1 = require("../crud-generator");
const frontend_ai_analyzer_1 = require("../generators/frontend-ai-analyzer");
const repair_agent_1 = require("../agents/repair-agent");
const observability_layer_1 = require("../observability/observability-layer");
const metrics_tracker_1 = require("../observability/metrics-tracker");
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
class GenerationRouter {
    static async generate(reqs, targetDir, onLog) {
        const mode = reqs.classifiedMode || 'crud-admin';
        shared_1.Logger.info(`[router] ═══════════════════════════════════════════`);
        shared_1.Logger.info(`[router] Generation Strategy Router activated`);
        shared_1.Logger.info(`[router] Classified mode: ${mode}`);
        shared_1.Logger.info(`[router] Target directory: ${targetDir}`);
        onLog(3, `[router] Selected generator: ${this.getGeneratorName(mode)}`);
        const repairAttemptsLog = [];
        const buildErrorsLog = [];
        let qaScoreBreakdownLog = null;
        const startTime = Date.now();
        let attempt = 1;
        const maxAttempts = 2;
        let isValidated = false;
        let functionalSuccess = false;
        let totalRepairs = 0;
        while (attempt <= maxAttempts && !isValidated) {
            shared_1.Logger.info(`[router] Generation Attempt ${attempt}/${maxAttempts} for mode ${mode}`);
            try {
                switch (mode) {
                    case 'frontend-app':
                        shared_1.Logger.info(`[router] Routing to FrontendAppGenerator`);
                        shared_1.Logger.info(`[router] Pipeline: AI Analysis → React/Vite scaffold → Components → Services → Hooks → Pages`);
                        shared_1.Logger.info(`[router] Database: NONE | Backend: NONE | Prisma: NONE`);
                        await frontend_generator_1.FrontendAppGenerator.generate(reqs, targetDir, onLog);
                        break;
                    case 'hybrid-fullstack':
                        shared_1.Logger.info(`[router] Routing to HybridGenerator`);
                        shared_1.Logger.info(`[router] Pipeline: AI Analysis → Frontend + Backend → Optional Database`);
                        await hybrid_generator_1.HybridGenerator.generate(reqs, targetDir, onLog);
                        break;
                    case 'crud-admin':
                    default:
                        shared_1.Logger.info(`[router] Routing to Scaffolder (existing CRUD pipeline)`);
                        shared_1.Logger.info(`[router] Pipeline: CRUD Analysis → Prisma → Express → React Dashboard`);
                        shared_1.Logger.info(`[router] Database: PostgreSQL | Backend: Express+Prisma | Prisma: YES`);
                        await index_1.Scaffolder.generateProject(reqs, targetDir, onLog);
                        break;
                }
                // --- Quality Checker ---
                onLog(5, `[router] Running static code quality checks (Attempt ${attempt})...`);
                let qualityCheck = await generator_quality_checker_1.GeneratorQualityChecker.validate(targetDir, reqs);
                if (!qualityCheck.passed) {
                    onLog(5, `[router] Quality checks failed. Invoking RepairAgent...`);
                    buildErrorsLog.push(...qualityCheck.errors);
                    const repaired = await repair_agent_1.RepairAgent.repair(targetDir, qualityCheck.errors);
                    totalRepairs++;
                    repairAttemptsLog.push({
                        attempt,
                        stage: 'quality-checks',
                        errors: [...qualityCheck.errors],
                        repaired
                    });
                    if (repaired) {
                        onLog(5, `[router] RepairAgent applied fixes. Re-running quality checks...`);
                        qualityCheck = await generator_quality_checker_1.GeneratorQualityChecker.validate(targetDir, reqs);
                        if (!qualityCheck.passed) {
                            buildErrorsLog.push(...qualityCheck.errors);
                        }
                    }
                    else {
                        onLog(5, `[router] RepairAgent could not fix the errors.`);
                    }
                }
                // --- Functional QA ---
                onLog(5, `[router] Running AI Functional Completeness QA (Attempt ${attempt})...`);
                const validation = await functional_validator_1.FunctionalValidator.validate(targetDir, reqs);
                qaScoreBreakdownLog = validation;
                if (qualityCheck.passed && validation.score >= 90) {
                    onLog(6, `[router] Reliability checks PASSED! Functional QA Score: ${validation.score}/100.`);
                    isValidated = true;
                    functionalSuccess = true;
                    onLog(5, `[router] Project generation completely successful. AST, TypeScript, and Functional Flow Validated.`);
                    try {
                        const metadataPath = path_1.default.join(targetDir, 'website-generator-metadata.json');
                        const meta = {
                            generatedAt: new Date().toISOString(),
                            appName: reqs.appName,
                            classifiedMode: mode,
                            score: validation.score,
                            reliability: {
                                buildSuccess: true,
                                runtimeSuccess: true,
                                apiSuccess: validation.criteria.forms >= 80,
                                persistenceSuccess: validation.criteria.database >= 80,
                                score: validation.score
                            }
                        };
                        await promises_1.default.writeFile(metadataPath, JSON.stringify(meta, null, 2), 'utf-8');
                    }
                    catch (e) {
                        shared_1.Logger.warn(`[router] Failed to write reliability metadata: ${e.message}`);
                    }
                }
                else {
                    const errors = [
                        ...qualityCheck.errors,
                        ...(validation.score < 90 ? [`Functional QA score is too low: ${validation.score}/100 (Required: 90)`] : [])
                    ];
                    buildErrorsLog.push(...errors);
                    onLog(5, `[router] Reliability checks FAILED on attempt ${attempt}.`);
                    errors.forEach(err => onLog(5, `[QA ERROR] ${err}`));
                    if (attempt < maxAttempts) {
                        onLog(5, `[router] Re-analyzing and triggering regeneration attempt ${attempt + 1}...`);
                        // Inject missing features into reqs so AI analyzes again
                        reqs.features = Array.from(new Set([...reqs.features, ...validation.missingFunctionality]));
                        if (!reqs.workflows)
                            reqs.workflows = [];
                        reqs.workflows = Array.from(new Set([...reqs.workflows, "Implement missing business logic and validation"]));
                        if (mode === 'crud-admin') {
                            await crud_generator_1.CrudGenerator.analyze(reqs);
                        }
                        else {
                            reqs.__targetDir = targetDir;
                            await frontend_ai_analyzer_1.FrontendAIAnalyzer.analyze(reqs);
                        }
                        attempt++;
                    }
                    else {
                        throw new Error(`Project generation failed reliability and quality validation checks:\n- ${errors.join('\n- ')}`);
                    }
                }
            }
            catch (err) {
                shared_1.Logger.error(`[router] Error during generation attempt ${attempt}: ${err.message}`);
                buildErrorsLog.push(err.message || String(err));
                if (attempt === maxAttempts) {
                    // Save observability report before throwing
                    await observability_layer_1.GeneratorObservability.save(targetDir, reqs, buildErrorsLog, qaScoreBreakdownLog, repairAttemptsLog);
                    await metrics_tracker_1.MetricsTracker.recordRun({
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
        // Save observability report on success
        await observability_layer_1.GeneratorObservability.save(targetDir, reqs, buildErrorsLog, qaScoreBreakdownLog, repairAttemptsLog);
        await metrics_tracker_1.MetricsTracker.recordRun({
            success: isValidated,
            buildSuccess: buildErrorsLog.length === 0,
            functionalSuccess,
            repairAttempts: totalRepairs,
            generationTimeMs: Date.now() - startTime
        });
        shared_1.Logger.info(`[router] ═══════════════════════════════════════════`);
        shared_1.Logger.info(`[router] Generation completed successfully for mode: ${mode}`);
    }
    static getGeneratorName(mode) {
        switch (mode) {
            case 'frontend-app': return 'frontend-generator';
            case 'hybrid-fullstack': return 'hybrid-generator';
            case 'crud-admin': return 'crud-generator (existing)';
            default: return 'crud-generator (fallback)';
        }
    }
}
exports.GenerationRouter = GenerationRouter;
