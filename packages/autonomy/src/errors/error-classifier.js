"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorClassifier = void 0;
const shared_1 = require("@website-generator/shared");
const crypto_1 = require("crypto");
const ERROR_PATTERNS = [
    {
        regex: /EADDRINUSE|address already in use/i,
        category: shared_1.ErrorCategory.NETWORK,
        severity: 'HIGH',
        repairable: true,
        suggestedRepair: 'port-conflict'
    },
    {
        regex: /Cannot find module|module not found|Failed to resolve import/i,
        category: shared_1.ErrorCategory.DEPENDENCY,
        severity: 'HIGH',
        repairable: true,
        suggestedRepair: 'missing-dependency'
    },
    {
        regex: /DATABASE_URL|Invalid URL|malformed/i,
        category: shared_1.ErrorCategory.ENVIRONMENT,
        severity: 'CRITICAL',
        repairable: true,
        suggestedRepair: 'malformed-database-url'
    },
    {
        regex: /ENOENT|no such file or directory/i,
        category: shared_1.ErrorCategory.FILESYSTEM,
        severity: 'HIGH',
        repairable: true,
        suggestedRepair: 'missing-workspace-files'
    },
    {
        regex: /PrismaClientInitializationError|Prisma Client could not be located/i,
        category: shared_1.ErrorCategory.DATABASE,
        severity: 'HIGH',
        repairable: true,
        suggestedRepair: 'prisma-install-failure'
    },
    {
        regex: /SIGTERM|SIGKILL|exited with code/i,
        category: shared_1.ErrorCategory.RUNTIME,
        severity: 'HIGH',
        repairable: true,
        suggestedRepair: 'orphan-processes'
    },
    {
        regex: /package\.json missing/i,
        category: shared_1.ErrorCategory.FILESYSTEM,
        severity: 'CRITICAL',
        repairable: true,
        suggestedRepair: 'missing-package-json'
    }
    // Add more patterns to reach the 92 expected
];
class ErrorClassifier {
    static classify(rawMessage, context) {
        let matchedPattern;
        for (const pattern of ERROR_PATTERNS) {
            if (pattern.regex.test(rawMessage)) {
                matchedPattern = pattern;
                break;
            }
        }
        // Default unclassified error
        if (!matchedPattern) {
            return {
                id: (0, crypto_1.randomUUID)(),
                timestamp: new Date().toISOString(),
                category: shared_1.ErrorCategory.RUNTIME,
                severity: 'MEDIUM',
                layer: context.layer,
                service: context.service,
                operation: context.operation,
                rawMessage,
                repairable: false,
                stackTrace: context.stackTrace
            };
        }
        return {
            id: (0, crypto_1.randomUUID)(),
            timestamp: new Date().toISOString(),
            category: matchedPattern.category,
            severity: matchedPattern.severity,
            layer: context.layer,
            service: context.service,
            operation: context.operation,
            rawMessage,
            repairable: matchedPattern.repairable,
            suggestedRepair: matchedPattern.suggestedRepair,
            stackTrace: context.stackTrace
        };
    }
}
exports.ErrorClassifier = ErrorClassifier;
