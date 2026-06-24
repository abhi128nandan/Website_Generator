"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendValidator = void 0;
class FrontendValidator {
    static validate(ast) {
        if (!ast.components || ast.components.length === 0)
            return false;
        // Validate semantic integrity
        const hasMeaningfulComponents = ast.components.some(c => c.purpose && c.purpose !== 'generic');
        if (!hasMeaningfulComponents)
            return false;
        // Validate layout correctness
        if (ast.isFallback) {
            // If fallback, ensure it actually produced fallback components
            if (!ast.fallbackLayer)
                return false;
        }
        return true;
    }
}
exports.FrontendValidator = FrontendValidator;
