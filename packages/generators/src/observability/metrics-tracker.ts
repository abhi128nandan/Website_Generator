import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Logger } from '@website-generator/shared';

export interface GenerationMetrics {
  totalRuns: number;
  successfulRuns: number;
  successfulBuilds: number;
  successfulFunctionalTests: number;
  totalRepairAttempts: number;
  totalGenerationTimeMs: number;
  
  // Derived metrics
  generationSuccessRate: number;
  buildSuccessRate: number;
  functionalSuccessRate: number;
  repairRate: number;
  averageGenerationTimeMs: number;

  // New Observability Metrics
  classificationFailures: number;
  syntaxGateFailures: number;
  compileGateFailures: number;
  parserFailures: number;
  successfulGenerations: number;
  commonTsErrors: Record<string, number>;
  commonBuildErrors: Record<string, number>;
}

export class MetricsTracker {
  private static getMetricsPath(): string {
    const homeDir = os.homedir();
    const websiteGeneratorDir = path.join(homeDir, '.websiteGenerator');
    return path.join(websiteGeneratorDir, 'metrics.json');
  }

  static async loadMetrics(): Promise<GenerationMetrics> {
    const metricsPath = this.getMetricsPath();
    try {
      const data = await fs.readFile(metricsPath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
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
        successfulGenerations: 0,
        commonTsErrors: {},
        commonBuildErrors: {}
      };
    }
  }

  static async incrementMetric(metric: keyof GenerationMetrics, amount: number = 1): Promise<void> {
    const metricsPath = this.getMetricsPath();
    await fs.mkdir(path.dirname(metricsPath), { recursive: true });
    const metrics = await this.loadMetrics();
    
    // Ensure all metrics are initialized to prevent NaN
    if (metrics.classificationFailures === undefined) metrics.classificationFailures = 0;
    if (metrics.syntaxGateFailures === undefined) metrics.syntaxGateFailures = 0;
    if (metrics.compileGateFailures === undefined) metrics.compileGateFailures = 0;
    if (metrics.parserFailures === undefined) metrics.parserFailures = 0;
    if (metrics.successfulGenerations === undefined) metrics.successfulGenerations = 0;

    (metrics as any)[metric] += amount;
    
    try {
      await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2));
    } catch (e: any) {
      Logger.warn(`[MetricsTracker] Failed to increment metric ${metric}: ${e.message}`);
    }
  }

  static async recordError(errorCategory: 'TS' | 'BUILD', errorMessage: string): Promise<void> {
    const metricsPath = this.getMetricsPath();
    const metrics = await this.loadMetrics();
    
    if (!metrics.commonTsErrors) metrics.commonTsErrors = {};
    if (!metrics.commonBuildErrors) metrics.commonBuildErrors = {};

    // Simplistic extraction of error code or key phrase
    let key = errorMessage.substring(0, 50).replace(/(\r\n|\n|\r)/gm, " ");
    
    if (errorCategory === 'TS') {
      const tsMatch = errorMessage.match(/TS\d+/);
      if (tsMatch) key = tsMatch[0];
      metrics.commonTsErrors[key] = (metrics.commonTsErrors[key] || 0) + 1;
    } else {
      metrics.commonBuildErrors[key] = (metrics.commonBuildErrors[key] || 0) + 1;
    }

    try {
      await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2));
    } catch (e: any) {
      Logger.warn(`[MetricsTracker] Failed to record error metric: ${e.message}`);
    }
  }

  static async recordRun(runData: {
    success: boolean;
    buildSuccess: boolean;
    functionalSuccess: boolean;
    repairAttempts: number;
    generationTimeMs: number;
  }): Promise<GenerationMetrics> {
    const metricsPath = this.getMetricsPath();
    await fs.mkdir(path.dirname(metricsPath), { recursive: true });

    const metrics = await this.loadMetrics();

    metrics.totalRuns += 1;
    if (runData.success) metrics.successfulRuns += 1;
    if (runData.buildSuccess) metrics.successfulBuilds += 1;
    if (runData.functionalSuccess) metrics.successfulFunctionalTests += 1;
    metrics.totalRepairAttempts += runData.repairAttempts;
    metrics.totalGenerationTimeMs += runData.generationTimeMs;

    // Recalculate derived
    metrics.generationSuccessRate = metrics.successfulRuns / metrics.totalRuns;
    metrics.buildSuccessRate = metrics.successfulBuilds / metrics.totalRuns;
    metrics.functionalSuccessRate = metrics.successfulFunctionalTests / metrics.totalRuns;
    metrics.repairRate = metrics.totalRepairAttempts / metrics.totalRuns;
    metrics.averageGenerationTimeMs = metrics.totalGenerationTimeMs / metrics.totalRuns;

    try {
      await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2));
      Logger.info(`[MetricsTracker] Successfully recorded metrics to ${metricsPath}`);
    } catch (e: any) {
      Logger.warn(`[MetricsTracker] Failed to record metrics: ${e.message}`);
    }

    return metrics;
  }
}
