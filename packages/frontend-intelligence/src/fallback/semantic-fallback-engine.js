"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackValidator = exports.SemanticLayoutSynthesizer = exports.SemanticFallbackEngine = exports.InteractionInferenceEngine = exports.TopologyInferenceEngine = void 0;
class TopologyInferenceEngine {
    static infer(domain) {
        // If unknown domain, guess structural shape
        return 'CRUD-Dashboard'; // Fallback topology
    }
}
exports.TopologyInferenceEngine = TopologyInferenceEngine;
class InteractionInferenceEngine {
    static infer(domain) {
        return ['search', 'filter', 'data-entry'];
    }
}
exports.InteractionInferenceEngine = InteractionInferenceEngine;
class SemanticFallbackEngine {
    static recover(intent) {
        const topology = TopologyInferenceEngine.infer(intent);
        const interactions = InteractionInferenceEngine.infer(intent);
        return {
            domain: intent,
            confidence: 0.1, // Low confidence fallback
            uxPatterns: [topology],
            primaryActions: interactions,
            entities: ['Item'],
            visualStyle: 'clean-minimalist',
            interactionModels: interactions
        };
    }
}
exports.SemanticFallbackEngine = SemanticFallbackEngine;
class SemanticLayoutSynthesizer {
    static synthesize(topology) {
        return { layout: 'sidebar-main', sections: ['header', 'content', 'footer'] };
    }
}
exports.SemanticLayoutSynthesizer = SemanticLayoutSynthesizer;
class FallbackValidator {
    static validate(context) {
        return context.confidence > 0;
    }
}
exports.FallbackValidator = FallbackValidator;
