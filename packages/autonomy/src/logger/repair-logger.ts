import { StructuredLogger } from './structured-logger';
import { RepairAction } from '@paperclip/shared';

export class RepairLogger {
  private logger: StructuredLogger;

  constructor(projectId: string) {
    this.logger = new StructuredLogger({
      projectId,
      layer: 'repair-agent',
      service: 'repair-orchestrator'
    });
  }

  startRepair(action: RepairAction) {
    this.logger.child({ operation: 'repair-start' }).info(`Starting repair strategy: ${action.strategy}`, { errorId: action.errorId });
  }

  completeRepair(action: RepairAction, success: boolean, message: string) {
    const level = success ? 'info' : 'error';
    this.logger.child({ operation: 'repair-complete' })[level](`Repair ${success ? 'successful' : 'failed'}: ${message}`, { 
      errorId: action.errorId,
      strategy: action.strategy,
      status: action.status
    });
  }

  rollback(action: RepairAction, reason: string) {
    this.logger.child({ operation: 'repair-rollback' }).warn(`Rolling back repair ${action.strategy}`, { reason });
  }
}
