import { EventEmitter } from 'events';

export type EventType = 
  | 'stage-change'
  | 'error-detected'
  | 'repair-started'
  | 'repair-completed'
  | 'checkpoint-saved'
  | 'validation-result'
  | 'process-lifecycle'
  | 'log-entry';

export interface AutonomyEvent {
  projectId: string;
  type: EventType;
  timestamp: string;
  data: any;
}

export class AutonomyEventBus {
  private static emitter = new EventEmitter();

  static emit(projectId: string, type: EventType, data: any) {
    const event: AutonomyEvent = {
      projectId,
      type,
      timestamp: new Date().toISOString(),
      data
    };
    this.emitter.emit('event', event);
    this.emitter.emit(`project:${projectId}`, event);
  }

  static subscribe(callback: (event: AutonomyEvent) => void) {
    this.emitter.on('event', callback);
    return () => this.emitter.off('event', callback);
  }

  static subscribeToProject(projectId: string, callback: (event: AutonomyEvent) => void) {
    const eventName = `project:${projectId}`;
    this.emitter.on(eventName, callback);
    return () => this.emitter.off(eventName, callback);
  }
}
