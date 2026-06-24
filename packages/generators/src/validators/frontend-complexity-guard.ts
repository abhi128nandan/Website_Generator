import fs from 'fs/promises';
import path from 'path';
import { RequirementIntelligence } from '../analysis/requirement-intelligence';

export class FrontendComplexityGuard {
  static async validate(reqs: any, targetDir: string): Promise<boolean> {
    const arch = reqs.frontendArchitecture;
    if (!arch) return true;

    // Requirement-driven limits (replaces keyword-based limits)
    const profile = RequirementIntelligence.analyze(reqs);
    const limits = RequirementIntelligence.toGuardLimits(profile);

    if (limits) {
      const componentsCount = arch.components?.length || 0;
      const hooksCount = arch.hooks?.length || 0;
      const servicesCount = arch.services?.length || 0;
      const pagesCount = arch.pages?.length || 0;

      const report = {
        appType: profile.complexity,
        limits,
        actual: { components: componentsCount, hooks: hooksCount, services: servicesCount, pages: pagesCount },
        rejected: false,
        reason: ''
      };

      let rejectionRule = '';
      if (componentsCount > limits.components) rejectionRule = `components (${componentsCount}) exceeds limit (${limits.components})`;
      else if (hooksCount > limits.hooks) rejectionRule = `hooks (${hooksCount}) exceeds limit (${limits.hooks})`;
      else if (servicesCount > limits.services) rejectionRule = `services (${servicesCount}) exceeds limit (${limits.services})`;
      else if (pagesCount > limits.pages) rejectionRule = `pages (${pagesCount}) exceeds limit (${limits.pages})`;

      const artifactsDir = path.join(targetDir, 'generation-artifacts');
      await fs.mkdir(artifactsDir, { recursive: true });

      if (rejectionRule) {
        report.rejected = true;
        report.reason = 'Architecture exceeds complexity limits: ' + rejectionRule;
        
        const debugPayload = {
          architecture: arch,
          counts: {
            components: componentsCount,
            pages: pagesCount,
            services: servicesCount,
            hooks: hooksCount
          },
          thresholds: limits,
          rejectionRule: rejectionRule,
          timestamp: new Date().toISOString()
        };
        
        await fs.writeFile(path.join(artifactsDir, 'complexity-debug.json'), JSON.stringify(debugPayload, null, 2), 'utf-8');
      }

      await fs.writeFile(path.join(artifactsDir, 'complexity-report.json'), JSON.stringify(report, null, 2), 'utf-8');

      if (report.rejected) {
        throw new Error(`COMPLEXITY_GUARD_FAILED: ${report.reason}`);
      }
    }

    return true;
  }
}
