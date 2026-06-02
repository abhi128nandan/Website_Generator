import { StructuredLogger } from './structured-logger';
import { ErrorClassifier } from '../errors/error-classifier';
import { ErrorRegistry } from '../errors/error-registry';

export class RuntimeLogger {
  private logger: StructuredLogger;
  private projectId: string;

  constructor(projectId: string, layer: string, service: string) {
    this.projectId = projectId;
    this.logger = new StructuredLogger({
      projectId,
      layer,
      service
    });
  }

  logStdout(operation: string, data: string) {
    const lines = data.split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      this.logger.child({ operation }).info(line);
    }
  }

  logStderr(operation: string, data: string) {
    const lines = data.split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      // Pass to error classifier
      const structuredError = ErrorClassifier.classify(line, {
        layer: this.logger['baseContext'].layer || 'unknown',
        service: this.logger['baseContext'].service || 'unknown',
        operation
      });

      // Register error for root cause analysis
      ErrorRegistry.register(this.projectId, structuredError);

      this.logger.child({ 
        operation,
        category: structuredError.category
      }).error(line, { errorId: structuredError.id, repairable: structuredError.repairable });
    }
  }

  lifecycle(event: 'start' | 'stop' | 'exit', details?: Record<string, any>) {
    this.logger.child({ operation: 'lifecycle' }).info(`Process ${event}`, details);
  }
}
