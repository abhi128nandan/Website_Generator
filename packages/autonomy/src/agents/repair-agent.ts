import { RootCauseDiagnosis } from '../errors/root-cause-engine';
import { AgentContext } from './root-cause-agent';
import { RepairRegistry, RepairResult } from '../errors/repair-registry';
import { RepairLogger } from '../logger/repair-logger';
import { RepairAction } from '@website-generator/shared';
import { randomUUID } from 'crypto';

export class RepairAgent {
  private logger: RepairLogger;

  constructor(private context: AgentContext) {
    this.logger = new RepairLogger(context.projectId);
  }

  async repair(diagnosis: RootCauseDiagnosis): Promise<RepairResult> {
    if (!diagnosis.repairable || !diagnosis.repairStrategy) {
      return { success: false, message: 'Error is not repairable or lacks a strategy', actionTaken: 'none' };
    }

    const strategy = RepairRegistry.getStrategy(diagnosis.repairStrategy);
    if (!strategy) {
      return { success: false, message: `Unknown repair strategy: ${diagnosis.repairStrategy}`, actionTaken: 'none' };
    }

    const action: RepairAction = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      errorId: diagnosis.originalError.id,
      strategy: strategy.id,
      status: 'pending'
    };

    this.logger.startRepair(action);
    action.status = 'executing';

    try {
      // Execute the repair
      const result = await strategy.execute({
        projectId: this.context.projectId,
        projectRoot: this.context.projectRoot,
        errorId: diagnosis.originalError.id,
        metadata: diagnosis.originalError.metadata
      });

      action.status = result.success ? 'success' : 'failed';
      action.details = result.message;
      this.logger.completeRepair(action, result.success, result.message);

      return result;
    } catch (e: any) {
      action.status = 'failed';
      action.details = e.message;
      this.logger.completeRepair(action, false, e.message);
      
      return { success: false, message: `Repair execution failed: ${e.message}`, actionTaken: 'error' };
    }
  }
}
