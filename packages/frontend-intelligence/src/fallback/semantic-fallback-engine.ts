import { DomainContext } from '../types';

export class TopologyInferenceEngine {
  static infer(domain: string): string {
    // If unknown domain, guess structural shape
    return 'CRUD-Dashboard'; // Fallback topology
  }
}

export class InteractionInferenceEngine {
  static infer(domain: string): string[] {
    return ['search', 'filter', 'data-entry'];
  }
}

export class SemanticFallbackEngine {
  static recover(intent: string): DomainContext {
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

export class SemanticLayoutSynthesizer {
  static synthesize(topology: string): any {
    return { layout: 'sidebar-main', sections: ['header', 'content', 'footer'] };
  }
}

export class FallbackValidator {
  static validate(context: DomainContext): boolean {
    return context.confidence > 0;
  }
}
