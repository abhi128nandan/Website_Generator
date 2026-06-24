"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootCauseEngine = void 0;
const shared_1 = require("@website-generator/shared");
class RootCauseEngine {
    // Dependency order: earlier items cause downstream failures
    static CAUSAL_HIERARCHY = [
        shared_1.ErrorCategory.INFRASTRUCTURE,
        shared_1.ErrorCategory.ENVIRONMENT,
        shared_1.ErrorCategory.DEPENDENCY,
        shared_1.ErrorCategory.FILESYSTEM,
        shared_1.ErrorCategory.DATABASE,
        shared_1.ErrorCategory.BACKEND,
        shared_1.ErrorCategory.FRONTEND,
        shared_1.ErrorCategory.RUNTIME,
        shared_1.ErrorCategory.NETWORK,
        shared_1.ErrorCategory.SECURITY,
        shared_1.ErrorCategory.VALIDATION,
        shared_1.ErrorCategory.GENERATION,
        shared_1.ErrorCategory.ORCHESTRATION,
        shared_1.ErrorCategory.AGENT
    ];
    static analyze(errors) {
        if (errors.length === 0)
            return null;
        // 1. Sort by timestamp ascending
        const sortedErrors = [...errors].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        // 2. Filter out downstream noise by finding the highest priority category
        let highestPriorityError = sortedErrors[0];
        let highestPriorityIndex = this.CAUSAL_HIERARCHY.indexOf(highestPriorityError.category);
        for (const error of sortedErrors) {
            const priorityIndex = this.CAUSAL_HIERARCHY.indexOf(error.category);
            // Lower index means higher priority (more fundamental root cause)
            if (priorityIndex !== -1 && (highestPriorityIndex === -1 || priorityIndex < highestPriorityIndex)) {
                highestPriorityError = error;
                highestPriorityIndex = priorityIndex;
            }
        }
        // Determine confidence based on error specifics
        let confidence = 0.8;
        if (highestPriorityError.suggestedRepair)
            confidence = 0.95;
        return {
            rootCause: highestPriorityError.rawMessage,
            category: highestPriorityError.category,
            repairable: highestPriorityError.repairable,
            repairStrategy: highestPriorityError.suggestedRepair,
            confidence,
            originalError: highestPriorityError
        };
    }
}
exports.RootCauseEngine = RootCauseEngine;
