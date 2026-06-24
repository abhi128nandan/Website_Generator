"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsTracker = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const shared_1 = require("@website-generator/shared");
class MetricsTracker {
    static getMetricsPath() {
        const homeDir = os_1.default.homedir();
        const websiteGeneratorDir = path_1.default.join(homeDir, '.websiteGenerator');
        return path_1.default.join(websiteGeneratorDir, 'metrics.json');
    }
    static async loadMetrics() {
        const metricsPath = this.getMetricsPath();
        try {
            const data = await promises_1.default.readFile(metricsPath, 'utf-8');
            return JSON.parse(data);
        }
        catch (e) {
            // Return default if it doesn't exist
            return {
                totalRuns: 0,
                successfulRuns: 0,
                successfulBuilds: 0,
                successfulFunctionalTests: 0,
                totalRepairAttempts: 0,
                totalGenerationTimeMs: 0,
                generationSuccessRate: 0,
                buildSuccessRate: 0,
                functionalSuccessRate: 0,
                repairRate: 0,
                averageGenerationTimeMs: 0,
                classificationFailures: 0,
                syntaxGateFailures: 0,
                compileGateFailures: 0,
                parserFailures: 0,
                successfulGenerations: 0
            };
        }
    }
    static async incrementMetric(metric, amount = 1) {
        const metricsPath = this.getMetricsPath();
        await promises_1.default.mkdir(path_1.default.dirname(metricsPath), { recursive: true });
        const metrics = await this.loadMetrics();
        // Ensure all metrics are initialized to prevent NaN
        if (metrics.classificationFailures === undefined)
            metrics.classificationFailures = 0;
        if (metrics.syntaxGateFailures === undefined)
            metrics.syntaxGateFailures = 0;
        if (metrics.compileGateFailures === undefined)
            metrics.compileGateFailures = 0;
        if (metrics.parserFailures === undefined)
            metrics.parserFailures = 0;
        if (metrics.successfulGenerations === undefined)
            metrics.successfulGenerations = 0;
        metrics[metric] += amount;
        try {
            await promises_1.default.writeFile(metricsPath, JSON.stringify(metrics, null, 2));
        }
        catch (e) {
            shared_1.Logger.warn(`[MetricsTracker] Failed to increment metric ${metric}: ${e.message}`);
        }
    }
    static async recordRun(runData) {
        const metricsPath = this.getMetricsPath();
        await promises_1.default.mkdir(path_1.default.dirname(metricsPath), { recursive: true });
        const metrics = await this.loadMetrics();
        metrics.totalRuns += 1;
        if (runData.success)
            metrics.successfulRuns += 1;
        if (runData.buildSuccess)
            metrics.successfulBuilds += 1;
        if (runData.functionalSuccess)
            metrics.successfulFunctionalTests += 1;
        metrics.totalRepairAttempts += runData.repairAttempts;
        metrics.totalGenerationTimeMs += runData.generationTimeMs;
        // Recalculate derived
        metrics.generationSuccessRate = metrics.successfulRuns / metrics.totalRuns;
        metrics.buildSuccessRate = metrics.successfulBuilds / metrics.totalRuns;
        metrics.functionalSuccessRate = metrics.successfulFunctionalTests / metrics.totalRuns;
        metrics.repairRate = metrics.totalRepairAttempts / metrics.totalRuns;
        metrics.averageGenerationTimeMs = metrics.totalGenerationTimeMs / metrics.totalRuns;
        try {
            await promises_1.default.writeFile(metricsPath, JSON.stringify(metrics, null, 2));
            shared_1.Logger.info(`[MetricsTracker] Successfully recorded metrics to ${metricsPath}`);
        }
        catch (e) {
            shared_1.Logger.warn(`[MetricsTracker] Failed to record metrics: ${e.message}`);
        }
        return metrics;
    }
}
exports.MetricsTracker = MetricsTracker;
