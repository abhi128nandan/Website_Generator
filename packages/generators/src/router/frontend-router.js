"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendRouter = void 0;
const frontend_1 = require("../templates/frontend");
const frontend_intelligence_1 = require("@website-generator/frontend-intelligence");
class FrontendRouter {
    static async generate(targetDir, reqs) {
        // Check if semantic mode is enabled
        // Defaulting to fast mode unless explicitly opted in, or if it's a semantic app
        const isSemanticMode = reqs.appType.toLowerCase().includes('semantic') || reqs.appType.toLowerCase().includes('consumer') || reqs.appType.toLowerCase().includes('ai');
        if (isSemanticMode) {
            console.log('[FrontendRouter] Routing to Semantic Intelligent Mode');
            const ast = await frontend_intelligence_1.SynthesizerGraph.run(reqs.appName + " " + reqs.appType);
            // We still use the deterministic base to create the scaffolding
            await frontend_1.FrontendGenerator.generate(targetDir, reqs);
            // Then semantic compiler overrides/enriches the React components
            await frontend_intelligence_1.ReactCompiler.emit(ast, targetDir);
        }
        else {
            console.log('[FrontendRouter] Routing to Fast Deterministic Mode');
            await frontend_1.FrontendGenerator.generate(targetDir, reqs);
        }
    }
}
exports.FrontendRouter = FrontendRouter;
