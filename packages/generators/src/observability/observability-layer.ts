import fs from 'fs/promises';
import path from 'path';
import { NormalizedRequirements, Logger } from '@paperclip/shared';

export interface ObservabilityData {
  projectId: string;
  appName: string;
  appType: string;
  classifiedMode: string;
  timestamp: string;
  architectureAnalysis: {
    classifiedMode: string;
    appName: string;
    features: string[];
    workflows: string[];
    routes: string[];
  };
  frontendPlan: any;
  backendPlan: any;
  databasePlan: any;
  generatedFileTree: string[];
  buildErrors: string[];
  qaScoringBreakdown: {
    score: number;
    criteria: any;
    missingFunctionality: string[];
    feedback: string;
  } | null;
  repairAttempts: {
    attempt: number;
    stage: string;
    errors: string[];
    repaired: boolean;
  }[];
}

export class GeneratorObservability {
  static async save(
    targetDir: string,
    reqs: NormalizedRequirements,
    buildErrors: string[],
    qaScoringBreakdown: any | null,
    repairAttempts: any[]
  ): Promise<void> {
    try {
      const projectId = path.basename(targetDir);
      const fileTree = await this.getFileTree(targetDir);

      const data: ObservabilityData = {
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

      const artifactsDir = path.join(targetDir, 'generation-artifacts');
      await fs.mkdir(artifactsDir, { recursive: true });

      // If we have a contract from the bypass
      if ((reqs as any).__canonicalContract) {
        await fs.writeFile(path.join(artifactsDir, 'contract.json'), JSON.stringify((reqs as any).__canonicalContract, null, 2));
      }

      await fs.writeFile(path.join(artifactsDir, 'architecture.json'), JSON.stringify({
        entities: data.databasePlan,
        endpoints: data.backendPlan,
        pages: data.frontendPlan?.pages || []
      }, null, 2));

      await fs.writeFile(path.join(artifactsDir, 'frontend-plan.json'), JSON.stringify(data.frontendPlan || {}, null, 2));
      await fs.writeFile(path.join(artifactsDir, 'backend-plan.json'), JSON.stringify(data.backendPlan || [], null, 2));

      await fs.writeFile(path.join(artifactsDir, 'validation-report.json'), JSON.stringify({
        buildErrors: data.buildErrors,
        repairAttempts: data.repairAttempts
      }, null, 2));

      // Build report will just hold what we know so far
      await fs.writeFile(path.join(artifactsDir, 'build-report.json'), JSON.stringify({
        status: data.buildErrors.length === 0 ? 'SUCCESS' : 'FAILED',
        errorCount: data.buildErrors.length
      }, null, 2));

      await fs.writeFile(path.join(artifactsDir, 'functional-report.json'), JSON.stringify({
        qaScoringBreakdown: data.qaScoringBreakdown
      }, null, 2));

      Logger.info(`[observability] Artifacts successfully saved to ${artifactsDir}`);
    } catch (e: any) {
      Logger.warn(`[observability] Failed to save generation artifacts: ${e.message}`);
    }
  }

  private static async getFileTree(dir: string, baseDir = dir): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        // Skip node_modules, .git, and dist to avoid huge bloat
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
          continue;
        }
        if (entry.isDirectory()) {
          files.push(relPath + '/');
          files.push(...(await this.getFileTree(fullPath, baseDir)));
        } else {
          files.push(relPath);
        }
      }
    } catch (e) {
      // ignore
    }
    return files;
  }
}
