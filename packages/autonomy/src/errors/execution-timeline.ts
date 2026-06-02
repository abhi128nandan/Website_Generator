export interface TimelineEvent {
  timestamp: string;
  type: 'info' | 'warn' | 'error' | 'stage-change' | 'repair' | 'checkpoint';
  stage: string;
  message: string;
  error?: any;
  duration?: number;
}

export class ExecutionTimeline {
  private events: TimelineEvent[] = [];

  append(event: Omit<TimelineEvent, 'timestamp'>) {
    this.events.push({
      ...event,
      timestamp: new Date().toISOString()
    });
  }

  snapshot(): TimelineEvent[] {
    return [...this.events];
  }

  since(timestamp: string): TimelineEvent[] {
    const targetTime = new Date(timestamp).getTime();
    return this.events.filter(e => new Date(e.timestamp).getTime() > targetTime);
  }

  clear() {
    this.events = [];
  }
}
