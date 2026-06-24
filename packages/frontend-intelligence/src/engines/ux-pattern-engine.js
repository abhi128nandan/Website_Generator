"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UXPatternEngine = void 0;
class UXPatternEngine {
    static determinePattern(domain) {
        if (domain.uxPatterns.includes('search UX'))
            return 'search-interface';
        if (domain.uxPatterns.includes('dashboard'))
            return 'dashboard-layout';
        return 'generic-flow';
    }
}
exports.UXPatternEngine = UXPatternEngine;
