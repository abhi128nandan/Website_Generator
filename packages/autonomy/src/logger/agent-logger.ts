import { StructuredLogger } from './structured-logger';

export class AgentLogger {
  private logger: StructuredLogger;

  constructor(projectId: string, agentName: string) {
    this.logger = new StructuredLogger({
      projectId,
      layer: 'agent',
      service: agentName
    });
  }

  stageTransition(from: string, to: string, reason?: string) {
    this.logger.child({ operation: 'transition' }).info(`Transition: ${from} -> ${to}`, { reason });
  }

  decision(action: string, reasoning: string, confidence?: number) {
    this.logger.child({ operation: 'decision' }).info(action, { reasoning, confidence });
  }

  retry(stage: string, attempt: number, maxAttempts: number) {
    this.logger.child({ operation: 'retry' }).warn(`Retry ${attempt}/${maxAttempts} for stage ${stage}`);
  }
}
