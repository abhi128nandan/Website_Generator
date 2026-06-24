import { NormalizedRequirements, ValidationSchema, FunctionalValidationResult, Logger } from '@website-generator/shared';
import { ProviderFactory } from '@website-generator/ai-engine';
import fs from 'fs/promises';
import path from 'path';
import { FeatureExtractor } from './feature-extractor';

export class FunctionalValidator {
  static async validate(targetDir: string, reqs: NormalizedRequirements): Promise<FunctionalValidationResult> {
    try {
      const provider = ProviderFactory.getProvider();
      
      Logger.info(`[FunctionalValidator] Running FeatureExtractor...`);
      const features = await FeatureExtractor.extract(targetDir);
      const coverageMatrixJson = JSON.stringify(features, null, 2);

      try {
        const artifactsDir = path.join(targetDir, 'generation-artifacts');
        await fs.mkdir(artifactsDir, { recursive: true });
        await fs.writeFile(path.join(artifactsDir, 'coverage-matrix.json'), coverageMatrixJson, 'utf-8');
      } catch (e) {
        Logger.warn('[FunctionalValidator] Could not write coverage-matrix.json');
      }

      const appType = (reqs as any).appType || 'Default';
      const appName = (reqs as any).appName || '';
      const featuresStr = (reqs.features || []).join(' ').toLowerCase();
      const workflowsStr = (reqs.workflows || []).join(' ').toLowerCase();
      
      const isFrontendOnly = reqs.classifiedMode === 'frontend-app';
      
      const isCalculator = appType.toLowerCase().includes('calculator') || appName.toLowerCase().includes('calc') || featuresStr.includes('calculator') || workflowsStr.includes('calculator');
      const isWeather = appType.toLowerCase().includes('weather') || appName.toLowerCase().includes('weather') || featuresStr.includes('weather');

      let promptCriteriaText = '';
      if (isCalculator) {
        promptCriteriaText = `
- architecture: Is the architecture sound and matching the requirements?
- businessLogic: Are arithmetic operations supported and bound to state?
- reactStructure: Are components structured properly?
- validation: Is there input validation?
- frontend: Is the calculator UI functional and are display updates dynamic?
- navigation: Are pages connected via routes?
- forms: Do forms submit data to endpoints?`;
      } else if (isWeather) {
        promptCriteriaText = `
- architecture: Is the architecture sound and matching the requirements?
- businessLogic: Are API requests implemented for weather data?
- reactStructure: Are components and hooks structured properly?
- frontend: Is the UI functional and responsive?
- validation: Are loading/error states handled defensively?
- navigation: Are pages connected via routes?
- forms: Do forms submit data to endpoints?`;
      } else {
        promptCriteriaText = `
- architecture: Is the architecture sound and matching the requirements?
- businessLogic: Is there evidence of domain-specific calculation/logic rather than just generic CRUD?
- reactStructure: Are components, hooks, and services structured properly?
- validation: Is there input validation?
- frontend: Is the UI functional?
- navigation: Are pages connected via routes?
- forms: Do forms submit data to endpoints?`;
      }

      const prompt = `You are a strict QA Engineer reviewing a newly generated application for functional completeness.
The goal is to ensure the application has actual working business logic, navigation, and state, rather than just static UI mockups.

App Workflows: ${reqs.workflows?.join(', ') || 'N/A'}
App Type: ${appType}

Instead of raw code, we have statically extracted the functional capabilities of the app into the following Coverage Matrix:
${coverageMatrixJson}

Score the generation out of 100 based on functional completeness. 
If a required workflow step is completely missing from the coverage matrix, heavily penalize the score.

Criteria to evaluate (0-100 each):
${promptCriteriaText.trim()}

Output ONLY a JSON object matching this structure:
{
  "criteria": {
    "architecture": 90,
    "businessLogic": 90,
    "reactStructure": 90,
    "validation": 90,
    "frontend": 90,
    "navigation": 90,
    "forms": 90
  },
  "missingFunctionality": ["list of what is missing or static"],
  "feedback": "string"
}`;

      Logger.info(`[FunctionalValidator] Running QA on Coverage Matrix...`);
      
      let parsed: any = null;
      let attempts = 0;
      while (attempts < 3) {
        try {
          const artifactsDir = path.join(targetDir, 'generation-artifacts');
          await fs.writeFile(path.join(artifactsDir, 'functional-qa-prompt.txt'), prompt, 'utf-8');
          await fs.writeFile(path.join(artifactsDir, 'functional-qa-input.json'), coverageMatrixJson, 'utf-8');

          const responseText = await provider.generateJSON(prompt);
          await fs.writeFile(path.join(artifactsDir, 'functional-qa-response.json'), responseText, 'utf-8');

          const start = responseText.indexOf('{');
          const end = responseText.lastIndexOf('}');
          if (start === -1 || end === -1 || end < start) throw new Error('No JSON object found');
          
          const rawParsed = JSON.parse(responseText.substring(start, end + 1));
          parsed = {
            score: 0,
            criteria: {
              architecture: rawParsed.criteria?.architecture || 0,
              businessLogic: rawParsed.criteria?.businessLogic || 0,
              reactStructure: rawParsed.criteria?.reactStructure || 0,
              validation: rawParsed.criteria?.validation || 0,
              frontend: rawParsed.criteria?.frontend || 0,
              navigation: rawParsed.criteria?.navigation || 0,
              forms: rawParsed.criteria?.forms || 0,
              typeScriptCompile: 100,
              importResolution: 100,
              buildSuccess: 100,
              database: 0,
              backend: 0
            },
            missingFunctionality: rawParsed.missingFunctionality || [],
            feedback: rawParsed.feedback || ''
          };
          break;
        } catch (err: any) {
          if (err.message?.includes('413') || err.message?.includes('rate_limit')) {
            Logger.warn(`[FunctionalValidator] Rate limit hit. Waiting 60s before retrying...`);
            await new Promise(resolve => setTimeout(resolve, 60000));
            attempts++;
          } else {
            throw err;
          }
        }
      }
      
      if (!parsed) {
        throw new Error('Rate limit exceeded after 3 attempts or invalid JSON');
      }

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
        const appType = (reqs as any).appType || 'Default';
        const isFrontendOnly = reqs.classifiedMode === 'frontend-app';

        let weights: Record<string, number> = {
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

        if (isFrontendOnly) {
          weights.architecture = 0;
          if (isCalculator) {
            weights.forms = 0;
            weights.navigation = 0;
            weights.validation = 0;
            weights.businessLogic = 4.0;
            weights.frontend = 4.0;
          } else if (isWeather) {
            weights.forms = 0;
            weights.validation = 1.0;
            weights.businessLogic = 3.0;
            weights.frontend = 3.0;
          }
        }

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
