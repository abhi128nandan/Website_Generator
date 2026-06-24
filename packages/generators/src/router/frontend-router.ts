import { NormalizedRequirements } from '@website-generator/shared';
import { FrontendGenerator } from '../templates/frontend';
import { SynthesizerGraph, ReactCompiler } from '@website-generator/frontend-intelligence';

export class FrontendRouter {
  static async generate(targetDir: string, reqs: NormalizedRequirements): Promise<void> {
    // Check if semantic mode is enabled
    // Defaulting to fast mode unless explicitly opted in, or if it's a semantic app
    const isSemanticMode = reqs.appType.toLowerCase().includes('semantic') || reqs.appType.toLowerCase().includes('consumer') || reqs.appType.toLowerCase().includes('ai');

    if (isSemanticMode) {
      console.log('[FrontendRouter] Routing to Semantic Intelligent Mode');
      const ast = await SynthesizerGraph.run(reqs.appName + " " + reqs.appType);
      
      // We still use the deterministic base to create the scaffolding
      await FrontendGenerator.generate(targetDir, reqs);
      
      // Then semantic compiler overrides/enriches the React components
      await ReactCompiler.emit(ast, targetDir);
    } else {
      console.log('[FrontendRouter] Routing to Fast Deterministic Mode');
      await FrontendGenerator.generate(targetDir, reqs);
    }
  }
}
