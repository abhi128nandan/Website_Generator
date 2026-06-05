import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Logger } from '@paperclip/shared';

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
}

export class MetricsTracker {
  private static getMetricsPath(): string {
    const homeDir = os.homedir();
    const paperclipDir = path.join(homeDir, '.paperclip');
    return path.join(paperclipDir, 'metrics.json');
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
        averageGenerationTimeMs: 0
      };
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
