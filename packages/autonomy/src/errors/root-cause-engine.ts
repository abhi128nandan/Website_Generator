import { ErrorCategory, StructuredError } from '@paperclip/shared';

export interface RootCauseDiagnosis {
  rootCause: string;
  category: ErrorCategory;
  repairable: boolean;
  repairStrategy?: string;
  confidence: number;
  originalError: StructuredError;
}

export class RootCauseEngine {
  // Dependency order: earlier items cause downstream failures
  private static CAUSAL_HIERARCHY = [
    ErrorCategory.INFRASTRUCTURE,
    ErrorCategory.ENVIRONMENT,
    ErrorCategory.DEPENDENCY,
    ErrorCategory.FILESYSTEM,
    ErrorCategory.DATABASE,
    ErrorCategory.BACKEND,
    ErrorCategory.FRONTEND,
    ErrorCategory.RUNTIME,
    ErrorCategory.NETWORK,
    ErrorCategory.SECURITY,
    ErrorCategory.VALIDATION,
    ErrorCategory.GENERATION,
    ErrorCategory.ORCHESTRATION,
    ErrorCategory.AGENT
  ];

  static analyze(errors: StructuredError[]): RootCauseDiagnosis | null {
    if (errors.length === 0) return null;

    // 1. Sort by timestamp ascending
    const sortedErrors = [...errors].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

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
    if (highestPriorityError.suggestedRepair) confidence = 0.95;

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
