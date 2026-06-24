"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratorObservability = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const shared_1 = require("@website-generator/shared");
class GeneratorObservability {
    static async save(targetDir, reqs, buildErrors, qaScoringBreakdown, repairAttempts) {
        try {
            const projectId = path_1.default.basename(targetDir);
            const fileTree = await this.getFileTree(targetDir);
            const data = {
                projectId,
                appName: reqs.appName || 'Unknown',
                appType: reqs.appType || 'Unknown',
                classifiedMode: reqs.classifiedMode || 'Unknown',
                timestamp: new Date().toISOString(),
                architectureAnalysis: {
                    classifiedMode: reqs.classifiedMode || 'Unknown',
                    appName: reqs.appName || '',
                    features: reqs.features || [],
                    workflows: reqs.workflows || [],
                    routes: reqs.routes || []
                },
                frontendPlan: reqs.frontendArchitecture || null,
                backendPlan: reqs.architecture?.endpoints || null,
                databasePlan: reqs.architecture?.entities || null,
                generatedFileTree: fileTree,
                buildErrors,
                qaScoringBreakdown: qaScoringBreakdown ? {
                    score: qaScoringBreakdown.score,
                    criteria: qaScoringBreakdown.criteria,
                    missingFunctionality: qaScoringBreakdown.missingFunctionality || [],
                    feedback: qaScoringBreakdown.feedback || ''
                } : null,
                repairAttempts
            };
            const artifactsDir = path_1.default.join(targetDir, 'generation-artifacts');
            await promises_1.default.mkdir(artifactsDir, { recursive: true });
            // If we have a contract from the bypass
            if (reqs.__canonicalContract) {
                await promises_1.default.writeFile(path_1.default.join(artifactsDir, 'contract.json'), JSON.stringify(reqs.__canonicalContract, null, 2));
            }
            await promises_1.default.writeFile(path_1.default.join(artifactsDir, 'architecture.json'), JSON.stringify({
                entities: data.databasePlan,
                endpoints: data.backendPlan,
                pages: data.frontendPlan?.pages || []
            }, null, 2));
            await promises_1.default.writeFile(path_1.default.join(artifactsDir, 'frontend-plan.json'), JSON.stringify(data.frontendPlan || {}, null, 2));
            await promises_1.default.writeFile(path_1.default.join(artifactsDir, 'backend-plan.json'), JSON.stringify(data.backendPlan || [], null, 2));
            await promises_1.default.writeFile(path_1.default.join(artifactsDir, 'validation-report.json'), JSON.stringify({
                buildErrors: data.buildErrors,
                repairAttempts: data.repairAttempts
            }, null, 2));
            // Build report will just hold what we know so far
            await promises_1.default.writeFile(path_1.default.join(artifactsDir, 'build-report.json'), JSON.stringify({
                status: data.buildErrors.length === 0 ? 'SUCCESS' : 'FAILED',
                errorCount: data.buildErrors.length
            }, null, 2));
            await promises_1.default.writeFile(path_1.default.join(artifactsDir, 'functional-report.json'), JSON.stringify({
                qaScoringBreakdown: data.qaScoringBreakdown
            }, null, 2));
            shared_1.Logger.info(`[observability] Artifacts successfully saved to ${artifactsDir}`);
        }
        catch (e) {
            shared_1.Logger.warn(`[observability] Failed to save generation artifacts: ${e.message}`);
        }
    }
    static async writeArtifact(targetDir, filename, data) {
        try {
            const artifactsDir = path_1.default.join(targetDir, 'generation-artifacts');
            await promises_1.default.mkdir(artifactsDir, { recursive: true });
            await promises_1.default.writeFile(path_1.default.join(artifactsDir, filename), JSON.stringify(data, null, 2), 'utf-8');
        }
        catch (e) {
            shared_1.Logger.warn(`[observability] Failed to write artifact ${filename}: ${e.message}`);
        }
    }
    static async getFileTree(dir, baseDir = dir) {
        const files = [];
        try {
            const entries = await promises_1.default.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(dir, entry.name);
                const relPath = path_1.default.relative(baseDir, fullPath).replace(/\\/g, '/');
                // Skip node_modules, .git, and dist to avoid huge bloat
                if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
                    continue;
                }
                if (entry.isDirectory()) {
                    files.push(relPath + '/');
                    files.push(...(await this.getFileTree(fullPath, baseDir)));
                }
                else {
                    files.push(relPath);
                }
            }
        }
        catch (e) {
            // ignore
        }
        return files;
    }
}
exports.GeneratorObservability = GeneratorObservability;
