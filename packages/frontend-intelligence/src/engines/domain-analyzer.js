"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainAnalyzer = void 0;
const ai_engine_1 = require("@website-generator/ai-engine");
class DomainAnalyzer {
    static async analyze(intent) {
        const prompt = `Analyze the following application intent and extract domain context.
Intent: "${intent}"
Return a JSON object with: domain, confidence (0-1), uxPatterns (string[]), primaryActions (string[]), entities (string[]), visualStyle, interactionModels (string[]).`;
        try {
            const provider = ai_engine_1.ProviderFactory.getProvider();
            const response = await provider.generateJSON(prompt);
            // In a real implementation, we would safely parse the JSON.
            // For now, returning a mock based on the response or a dummy if parsing fails.
            return JSON.parse(response);
        }
        catch (e) {
            // Fallback inference handled later
            throw new Error("Domain inference failed");
        }
    }
}
exports.DomainAnalyzer = DomainAnalyzer;
