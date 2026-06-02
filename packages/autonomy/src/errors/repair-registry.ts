import { ErrorCategory } from '@paperclip/shared';

export interface RepairContext {
  projectId: string;
  projectRoot: string;
  errorId: string;
  metadata?: Record<string, any>;
}

export interface RepairResult {
  success: boolean;
  message: string;
  actionTaken: string;
  requiresRestart?: boolean;
}

export interface RepairStrategy {
  id: string;
  name: string;
  appliesTo: ErrorCategory[];
  execute: (context: RepairContext) => Promise<RepairResult>;
}

export class RepairRegistry {
  private static strategies: Map<string, RepairStrategy> = new Map();

  static register(strategy: RepairStrategy) {
    this.strategies.set(strategy.id, strategy);
  }

  static getStrategy(id: string): RepairStrategy | undefined {
    return this.strategies.get(id);
  }

  static getStrategiesForCategory(category: ErrorCategory): RepairStrategy[] {
    return Array.from(this.strategies.values()).filter(s => s.appliesTo.includes(category));
  }
}

// Built-in strategies (to be implemented more fully in RepairAgent)
RepairRegistry.register({
  id: 'port-conflict',
  name: 'Resolve Port Conflict',
  appliesTo: [ErrorCategory.NETWORK, ErrorCategory.RUNTIME],
  execute: async (context: RepairContext) => {
    return { success: true, message: 'Reallocated port', actionTaken: 'port-incremented', requiresRestart: true };
  }
});
