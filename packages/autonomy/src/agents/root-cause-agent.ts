import { ErrorRegistry } from '../errors/error-registry';
import { RootCauseEngine, RootCauseDiagnosis } from '../errors/root-cause-engine';
import { AgentLogger } from '../logger/agent-logger';

export interface AgentContext {
  projectId: string;
  projectRoot: string;
}

export class RootCauseAgent {
  private logger: AgentLogger;

  constructor(private context: AgentContext) {
    this.logger = new AgentLogger(context.projectId, 'RootCauseAnalyzer');
  }

  analyze(): RootCauseDiagnosis | null {
    this.logger.stageTransition('pipeline', 'root-cause-analysis', 'Error detected');
    
    // 1. Collect all structured errors for this project
    const errors = ErrorRegistry.getTimeline(this.context.projectId);
    
    if (errors.length === 0) {
      this.logger.decision('skip-analysis', 'No errors found in registry');
      return null;
    }

    // 2. Run deterministic analysis engine
    const diagnosis = RootCauseEngine.analyze(errors);
    
    if (diagnosis) {
      this.logger.decision('identified-root-cause', diagnosis.rootCause, diagnosis.confidence);
      this.logger.decision('repair-strategy-selected', diagnosis.repairStrategy || 'none', diagnosis.confidence);
    } else {
      this.logger.decision('analysis-failed', 'Could not determine root cause from errors');
    }

    return diagnosis;
  }
}
