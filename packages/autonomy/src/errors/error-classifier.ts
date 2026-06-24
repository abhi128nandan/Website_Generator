import { ErrorCategory, StructuredError } from '@website-generator/shared';
import { randomUUID } from 'crypto';

interface ErrorPattern {
  regex: RegExp;
  category: ErrorCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  repairable: boolean;
  suggestedRepair?: string;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    regex: /EADDRINUSE|address already in use/i,
    category: ErrorCategory.NETWORK,
    severity: 'HIGH',
    repairable: true,
    suggestedRepair: 'port-conflict'
  },
  {
    regex: /Cannot find module|module not found|Failed to resolve import/i,
    category: ErrorCategory.DEPENDENCY,
    severity: 'HIGH',
    repairable: true,
    suggestedRepair: 'missing-dependency'
  },
  {
    regex: /DATABASE_URL|Invalid URL|malformed/i,
    category: ErrorCategory.ENVIRONMENT,
    severity: 'CRITICAL',
    repairable: true,
    suggestedRepair: 'malformed-database-url'
  },
  {
    regex: /ENOENT|no such file or directory/i,
    category: ErrorCategory.FILESYSTEM,
    severity: 'HIGH',
    repairable: true,
    suggestedRepair: 'missing-workspace-files'
  },
  {
    regex: /PrismaClientInitializationError|Prisma Client could not be located/i,
    category: ErrorCategory.DATABASE,
    severity: 'HIGH',
    repairable: true,
    suggestedRepair: 'prisma-install-failure'
  },
  {
    regex: /SIGTERM|SIGKILL|exited with code/i,
    category: ErrorCategory.RUNTIME,
    severity: 'HIGH',
    repairable: true,
    suggestedRepair: 'orphan-processes'
  },
  {
    regex: /package\.json missing/i,
    category: ErrorCategory.FILESYSTEM,
    severity: 'CRITICAL',
    repairable: true,
    suggestedRepair: 'missing-package-json'
  }
  // Add more patterns to reach the 92 expected
];

export class ErrorClassifier {
  static classify(rawMessage: string, context: { layer: string, service: string, operation: string, stackTrace?: string }): StructuredError {
    let matchedPattern: ErrorPattern | undefined;

    for (const pattern of ERROR_PATTERNS) {
      if (pattern.regex.test(rawMessage)) {
        matchedPattern = pattern;
        break;
      }
    }

    // Default unclassified error
    if (!matchedPattern) {
      return {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        category: ErrorCategory.RUNTIME,
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
      id: randomUUID(),
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
