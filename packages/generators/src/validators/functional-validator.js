"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionalValidator = void 0;
const shared_1 = require("@paperclip/shared");
const ai_engine_1 = require("@paperclip/ai-engine");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class FunctionalValidator {
    static async validate(targetDir, reqs) {
        try {
            const provider = ai_engine_1.ProviderFactory.getProvider();
            // Read key files to check for actual functional content
            let backendCode = '';
            let frontendApp = '';
            let schemaPrisma = '';
            let samplePage = '';
            try {
                backendCode = await promises_1.default.readFile(path_1.default.join(targetDir, 'backend', 'src', 'index.ts'), 'utf-8');
            }
            catch { }
            try {
                frontendApp = await promises_1.default.readFile(path_1.default.join(targetDir, 'frontend', 'src', 'App.tsx'), 'utf-8');
            }
            catch { }
            try {
                schemaPrisma = await promises_1.default.readFile(path_1.default.join(targetDir, 'database', 'prisma', 'schema.prisma'), 'utf-8');
            }
            catch { }
            let sampleHook = '';
            let sampleService = '';
            const arch = reqs.frontendArchitecture || reqs.architecture;
            if (arch) {
                if (arch.pages && arch.pages.length > 0) {
                    try {
                        samplePage = await promises_1.default.readFile(path_1.default.join(targetDir, 'frontend', 'src', 'pages', `${arch.pages[0].componentName}.tsx`), 'utf-8');
                    }
                    catch { }
                }
                const frontArch = reqs.frontendArchitecture;
                if (frontArch) {
                    if (frontArch.hooks && frontArch.hooks.length > 0) {
                        try {
                            sampleHook = await promises_1.default.readFile(path_1.default.join(targetDir, 'frontend', 'src', 'hooks', `${frontArch.hooks[0].name}.ts`), 'utf-8');
                        }
                        catch { }
                    }
                    if (frontArch.services && frontArch.services.length > 0) {
                        try {
                            sampleService = await promises_1.default.readFile(path_1.default.join(targetDir, 'frontend', 'src', 'services', `${frontArch.services[0].name}.ts`), 'utf-8');
                        }
                        catch { }
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
            shared_1.Logger.info(`[FunctionalValidator] Running QA on generated project...`);
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
                const sum = (crit.architecture || 100) + (crit.typeScriptCompile || 100) + (crit.importResolution || 100) + (crit.reactStructure || 100) + (crit.buildSuccess || 100) + (crit.businessLogic || 0) + (crit.frontend || 0) + (crit.navigation || 0) + (crit.forms || 0) + (crit.validation || 0);
                parsed.score = Math.round(sum / 10);
            }
            const validationResult = shared_1.ValidationSchema.parse(parsed);
            shared_1.Logger.info(`[FunctionalValidator] QA Score: ${validationResult.score}/100`);
            return validationResult;
        }
        catch (err) {
            shared_1.Logger.error(`[FunctionalValidator] Failed to validate project: ${err.message}`);
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
exports.FunctionalValidator = FunctionalValidator;
//# sourceMappingURL=functional-validator.js.map