"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scaffolder = exports.MetricsTracker = exports.GeneratorObservability = exports.GeneratorQualityChecker = exports.FrontendAIAnalyzer = exports.HybridGenerator = exports.FrontendAppGenerator = exports.GenerationRouter = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const root_1 = require("./templates/root");
const backend_1 = require("./templates/backend");
const database_1 = require("./templates/database");
const crud_generator_1 = require("./crud-generator");
const relation_normalizer_1 = require("./compiler/relation-normalizer");
// --- Multi-Mode Generation Exports ---
var generation_router_1 = require("./router/generation-router");
Object.defineProperty(exports, "GenerationRouter", { enumerable: true, get: function () { return generation_router_1.GenerationRouter; } });
var frontend_generator_1 = require("./generators/frontend-generator");
Object.defineProperty(exports, "FrontendAppGenerator", { enumerable: true, get: function () { return frontend_generator_1.FrontendAppGenerator; } });
var hybrid_generator_1 = require("./generators/hybrid-generator");
Object.defineProperty(exports, "HybridGenerator", { enumerable: true, get: function () { return hybrid_generator_1.HybridGenerator; } });
var frontend_ai_analyzer_1 = require("./generators/frontend-ai-analyzer");
Object.defineProperty(exports, "FrontendAIAnalyzer", { enumerable: true, get: function () { return frontend_ai_analyzer_1.FrontendAIAnalyzer; } });
var generator_quality_checker_1 = require("./validators/generator-quality-checker");
Object.defineProperty(exports, "GeneratorQualityChecker", { enumerable: true, get: function () { return generator_quality_checker_1.GeneratorQualityChecker; } });
var observability_layer_1 = require("./observability/observability-layer");
Object.defineProperty(exports, "GeneratorObservability", { enumerable: true, get: function () { return observability_layer_1.GeneratorObservability; } });
var metrics_tracker_1 = require("./observability/metrics-tracker");
Object.defineProperty(exports, "MetricsTracker", { enumerable: true, get: function () { return metrics_tracker_1.MetricsTracker; } });
class Scaffolder {
    static async generateProject(reqs, targetDir, onLog) {
        // === STEP 1: Generate root workspace FIRST ===
        onLog(3, `[generator] Creating NEW isolated project: ${path_1.default.basename(targetDir)}`);
        onLog(3, `[generator] Project root:\n${targetDir}`);
        onLog(3, '[generator] Cleaning existing directory (if any)...');
        onLog(3, '[generator] Writing root workspace files...');
        await root_1.RootWorkspaceGenerator.generate(targetDir, reqs.appName, reqs.appType, reqs.features);
        // === ENVIRONMENT & DOCKER ===
        onLog(3, '[generator] Bootstrapping environment and infrastructure configuration...');
        const { EnvGenerator } = require('./runtime/env-generator');
        await EnvGenerator.generate(targetDir, reqs.appName);
        // Check for existing schema to prevent field disappearance during regeneration
        let existingEntities = [];
        try {
            const existingSchema = await promises_1.default.readFile(path_1.default.join(targetDir, 'database/prisma/schema.prisma'), 'utf-8');
            existingEntities = relation_normalizer_1.RelationNormalizer.parseExistingSchema(existingSchema);
            onLog(3, `[generator] Found existing Prisma schema with ${existingEntities.length} models for preservation.`);
        }
        catch {
            // No existing schema
        }
        // === AI ARCHITECTURE ANALYSIS ===
        onLog(3, '[generator] Executing AI architecture analysis...');
        await crud_generator_1.CrudGenerator.analyze(reqs);
        // === CANONICAL ENTITY NORMALIZATION ===
        if (reqs.architecture && reqs.architecture.entities) {
            onLog(3, '[generator] Applying canonical entity normalization & field preservation...');
            reqs.architecture.entities = relation_normalizer_1.RelationNormalizer.normalize(reqs.architecture.entities, existingEntities);
        }
        // Validate root files exist before proceeding
        await root_1.RootWorkspaceGenerator.validate(targetDir);
        onLog(3, '[generator] Generated:\n- package.json\n- pnpm-workspace.yaml\n- .npmrc\n- .gitignore');
        onLog(3, '[generator] Workspace root validated successfully.');
        // === STEP 2: Generate sub-packages ===
        onLog(4, `[generator] Writing frontend files...`);
        const { FrontendRouter } = require('./router/frontend-router');
        await FrontendRouter.generate(targetDir, reqs);
        onLog(4, `[generator] Writing backend files...`);
        await backend_1.BackendGenerator.generate(targetDir, reqs);
        onLog(4, `[generator] Writing database files...`);
        await database_1.DatabaseGenerator.generate(targetDir, reqs);
        // === STEP 3: Validate sub-package files ===
        onLog(5, '[generator] Validating generated workspace structure...');
        const requiredSubFiles = [
            'frontend/package.json',
            'backend/package.json',
            'database/package.json',
            'database/prisma/schema.prisma',
        ];
        const missing = [];
        for (const file of requiredSubFiles) {
            try {
                await promises_1.default.access(path_1.default.join(targetDir, file));
            }
            catch {
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
            const metadataPath = path_1.default.join(targetDir, 'metadata.json');
            const existingMeta = JSON.parse(await promises_1.default.readFile(metadataPath, 'utf-8'));
            const updatedMeta = {
                ...existingMeta,
                ...reqs,
                updatedAt: new Date().toISOString(),
                generatorVersion: '1.0.0',
                workspaceIntegrity: true
            };
            await promises_1.default.writeFile(metadataPath, JSON.stringify(updatedMeta, null, 2), 'utf-8');
        }
        catch (e) {
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
        await promises_1.default.writeFile(path_1.default.join(targetDir, 'generated-files.json'), JSON.stringify(generatedFiles, null, 2), 'utf-8');
        onLog(6, `[generator] Final generated files:\n- package.json\n- pnpm-workspace.yaml\n- .npmrc\n- .gitignore`);
        onLog(6, `[generator] Final scaffold file count: ${generatedFiles.files.length}`);
        onLog(6, `[generator] Project tree:\n${path_1.default.basename(targetDir)}/\n├── package.json\n├── pnpm-workspace.yaml\n├── frontend/\n├── backend/\n└── database/`);
        onLog(6, '[generator] Finalizing project...');
    }
}
exports.Scaffolder = Scaffolder;
