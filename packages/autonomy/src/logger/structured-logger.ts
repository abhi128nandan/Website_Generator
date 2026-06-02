import { Logger as BaseLogger, ErrorCategory } from '@paperclip/shared';

export interface StructuredLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  layer?: string;
  service?: string;
  operation?: string;
  category?: ErrorCategory;
  message: string;
  metadata?: Record<string, any>;
  projectId?: string;
}

export class StructuredLogger {
  private baseContext: Partial<StructuredLogEntry>;

  constructor(context: Partial<StructuredLogEntry> = {}) {
    this.baseContext = context;
  }

  child(context: Partial<StructuredLogEntry>): StructuredLogger {
    return new StructuredLogger({ ...this.baseContext, ...context });
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: Record<string, any>) {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      ...this.baseContext,
      message,
      metadata: metadata ? { ...this.baseContext.metadata, ...metadata } : this.baseContext.metadata
    };

    // Format for existing Logger while capturing structured data
    const formatted = JSON.stringify(entry);
    
    switch (level) {
      case 'info':
      case 'debug':
        BaseLogger.info(`[Structured] ${formatted}`);
        break;
      case 'warn':
        BaseLogger.warn(`[Structured] ${formatted}`);
        break;
      case 'error':
        BaseLogger.error(`[Structured] ${formatted}`);
        break;
    }

    // TODO: Emit to EventBus for dashboard streaming
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, any>) {
    this.log('error', message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log('debug', message, metadata);
  }
}
