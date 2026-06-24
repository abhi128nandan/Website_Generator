"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderFactory = void 0;
const groq_1 = require("./groq");
const openrouter_1 = require("./openrouter");
const ollama_1 = require("./ollama");
const shared_1 = require("@website-generator/shared");
class ProviderFactory {
    static getProvider() {
        const providerName = process.env.AI_PROVIDER || 'groq';
        switch (providerName.toLowerCase()) {
            case 'groq':
                return new groq_1.GroqProvider();
            case 'openrouter':
                return new openrouter_1.OpenRouterProvider();
            case 'ollama':
                return new ollama_1.OllamaProvider();
            default:
                shared_1.Logger.warn(`Unknown AI_PROVIDER '${providerName}', falling back to Groq`);
                return new groq_1.GroqProvider();
        }
    }
}
exports.ProviderFactory = ProviderFactory;
