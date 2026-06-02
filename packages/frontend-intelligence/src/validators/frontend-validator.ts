import { SemanticAST } from '../types';

export class FrontendValidator {
  static validate(ast: SemanticAST): boolean {
    if (!ast.components || ast.components.length === 0) return false;
    
    // Validate semantic integrity
    const hasMeaningfulComponents = ast.components.some(c => c.purpose && c.purpose !== 'generic');
    if (!hasMeaningfulComponents) return false;

    // Validate layout correctness
    if (ast.isFallback) {
      // If fallback, ensure it actually produced fallback components
      if (!ast.fallbackLayer) return false;
    }

    return true;
  }
}
