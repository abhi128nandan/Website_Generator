import { NormalizedRequirements, ValidationSchema, FunctionalValidationResult, Logger } from '@paperclip/shared';
import { ProviderFactory } from '@paperclip/ai-engine';
import fs from 'fs/promises';
import path from 'path';

export class FunctionalValidator {
  static async validate(targetDir: string, reqs: NormalizedRequirements): Promise<FunctionalValidationResult> {
    try {
      const provider = ProviderFactory.getProvider();
      
      // Read key files to check for actual functional content
      let backendCode = '';
      let frontendApp = '';
      let schemaPrisma = '';
      let samplePage = '';

      try { backendCode = await fs.readFile(path.join(targetDir, 'backend', 'src', 'index.ts'), 'utf-8'); } catch {}
      try { frontendApp = await fs.readFile(path.join(targetDir, 'frontend', 'src', 'App.tsx'), 'utf-8'); } catch {}
      try { schemaPrisma = await fs.readFile(path.join(targetDir, 'database', 'prisma', 'schema.prisma'), 'utf-8'); } catch {}
      
      let sampleHook = '';
      let sampleService = '';

      const arch = reqs.frontendArchitecture || reqs.architecture;
      if (arch) {
        if (arch.pages && arch.pages.length > 0) {
          try { 
            samplePage = await fs.readFile(path.join(targetDir, 'frontend', 'src', 'pages', `${arch.pages[0].componentName}.tsx`), 'utf-8'); 
          } catch {}
        }
        
        const frontArch = reqs.frontendArchitecture;
        if (frontArch) {
          if (frontArch.hooks && frontArch.hooks.length > 0) {
            try { 
              sampleHook = await fs.readFile(path.join(targetDir, 'frontend', 'src', 'hooks', `${frontArch.hooks[0].name}.ts`), 'utf-8'); 
            } catch {}
          }
          if (frontArch.services && frontArch.services.length > 0) {
            try { 
              sampleService = await fs.readFile(path.join(targetDir, 'frontend', 'src', 'services', `${frontArch.services[0].name}.ts`), 'utf-8'); 
            } catch {}
          }
        }
      }

      const prompt = `You are a strict QA Engineer reviewing a newly generated application for functional completeness.
The goal is to ensure the application has actual working business logic, navigation, and state, rather than just static UI mockups.

App Workflows: ${reqs.workflows?.join(', ') || 'N/A'}

Review the following generated code fragments:
--- BACKEND (index.ts) ---
${backendCode.substring(0, 2000)}...

--- FRONTEND (App.tsx) ---
${frontendApp.substring(0, 2000)}...

--- SAMPLE PAGE ---
${samplePage.substring(0, 2000)}...

--- SAMPLE HOOK ---
${sampleHook.substring(0, 1500)}...

--- SAMPLE SERVICE ---
${sampleService.substring(0, 1500)}...

--- DATABASE (schema.prisma) ---
${schemaPrisma.substring(0, 1000)}...

Score the generation out of 100 based on functional completeness. 
Criteria to evaluate (0-100 each, then average for total score):
- architecture: Is the architecture sound and matching the requirements?
- typeScriptCompile: Is the TypeScript code well-typed (assume 100 if we reached this step successfully)?
- importResolution: Do imports look correct (assume 100 if we reached this step)?
- reactStructure: Are components, hooks, and services structured properly?
- buildSuccess: Does it look like it would build cleanly (assume 100)?
- businessLogic: Is there evidence of domain-specific calculation/logic rather than just generic CRUD?
- frontend: Is the UI functional (not just 'Feature One', 'Feature Two')?
- navigation: Are pages connected via routes?
- forms: Do forms submit data to endpoints?
- validation: Is there input validation?

Output ONLY a JSON object matching this structure:
{
  "score": 85,
  "criteria": {
    "architecture": 90,
    "typeScriptCompile": 100,
    "importResolution": 100,
    "reactStructure": 90,
    "buildSuccess": 100,
    "businessLogic": 75,
    "frontend": 85,
    "navigation": 100,
    "forms": 90,
    "validation": 70
  },
  "missingFunctionality": ["list of what is missing or static"],
  "feedback": "string"
}`;

      Logger.info(`[FunctionalValidator] Running QA on generated project...`);
      const responseText = await provider.generateJSON(prompt);
      
      const start = responseText.indexOf('{');
      const end = responseText.lastIndexOf('}');
      if (start === -1 || end === -1 || end < start) {
        throw new Error('No JSON object found in response');
      }
      const jsonString = responseText.substring(start, end + 1);
      
      const parsed = JSON.parse(jsonString);

      if (reqs.classifiedMode === 'frontend-app') {
        // frontend apps skip backend validation
      }

      // Recalculate overall score based on the updated criteria
      const crit = parsed.criteria;
      if (crit) {
        const isFallback = !reqs.architecture && reqs.classifiedMode !== 'frontend-app';
        if (isFallback) {
          Logger.warn('[FunctionalValidator] Fallback generation detected. Applying heavy penalty.');
          crit.architecture = 0;
          crit.businessLogic = Math.min(crit.businessLogic || 0, 20);
        }

        // Ensure architecture success/schema success are weighted properly
        const weights: Record<string, number> = {
          architecture: 3.0,
          businessLogic: 2.0,
          frontend: 1.5,
          forms: 1.5,
          validation: 1.0,
          typeScriptCompile: 1.0,
          importResolution: 1.0,
          reactStructure: 1.0,
          buildSuccess: 1.0,
          navigation: 1.0
        };

        let sum = 0;
        let totalWeight = 0;
        for (const [key, weight] of Object.entries(weights)) {
          sum += (crit[key as keyof typeof crit] || 0) * weight;
          totalWeight += weight;
        }
        
        parsed.score = Math.round(sum / totalWeight);
      }

      const validationResult = ValidationSchema.parse(parsed);
      
      Logger.info(`[FunctionalValidator] QA Score: ${validationResult.score}/100`);
      return validationResult;
    } catch (err: any) {
      Logger.error(`[FunctionalValidator] Failed to validate project: ${err.message}`);
      // Crash = score 0 so generation does NOT silently pass
      return {
        score: 0,
        criteria: { architecture: 0, typeScriptCompile: 0, importResolution: 0, reactStructure: 0, buildSuccess: 0, businessLogic: 0, frontend: 0, navigation: 0, forms: 0, validation: 0, database: 0, backend: 0 },
        missingFunctionality: ['Functional validation crashed — unable to assess project quality'],
        feedback: `Validation crashed: ${err.message}`
      };
    }
  }
}
