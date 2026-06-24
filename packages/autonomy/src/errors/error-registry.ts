import { StructuredError } from '@website-generator/shared';

export class ErrorRegistry {
  private static errors: Map<string, StructuredError[]> = new Map();
  private static MAX_ERRORS_PER_PROJECT = 500;

  static register(projectId: string, error: StructuredError): void {
    const projectErrors = this.errors.get(projectId) || [];
    
    // Deduplication check based on operation and message within recent time frame (last 5s)
    const threshold = Date.now() - 5000;
    const isDuplicate = projectErrors.some(e => 
      e.operation === error.operation && 
      e.rawMessage === error.rawMessage &&
      new Date(e.timestamp).getTime() > threshold
    );

    if (isDuplicate) return;

    projectErrors.push(error);
    
    // Eviction policy
    if (projectErrors.length > this.MAX_ERRORS_PER_PROJECT) {
      projectErrors.shift();
    }

    this.errors.set(projectId, projectErrors);
  }

  static getTimeline(projectId: string): StructuredError[] {
    return this.errors.get(projectId) || [];
  }

  static query(projectId: string, filter?: { category?: string, severity?: string, service?: string }): StructuredError[] {
    let projectErrors = this.getTimeline(projectId);
    
    if (filter) {
      if (filter.category) projectErrors = projectErrors.filter(e => e.category === filter.category);
      if (filter.severity) projectErrors = projectErrors.filter(e => e.severity === filter.severity);
      if (filter.service) projectErrors = projectErrors.filter(e => e.service === filter.service);
    }
    
    return projectErrors;
  }

  static clear(projectId: string): void {
    this.errors.delete(projectId);
  }
}
