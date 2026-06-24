"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredLogger = void 0;
const shared_1 = require("@website-generator/shared");
class StructuredLogger {
    baseContext;
    constructor(context = {}) {
        this.baseContext = context;
    }
    child(context) {
        return new StructuredLogger({ ...this.baseContext, ...context });
    }
    log(level, message, metadata) {
        const entry = {
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
                shared_1.Logger.info(`[Structured] ${formatted}`);
                break;
            case 'warn':
                shared_1.Logger.warn(`[Structured] ${formatted}`);
                break;
            case 'error':
                shared_1.Logger.error(`[Structured] ${formatted}`);
                break;
        }
        // TODO: Emit to EventBus for dashboard streaming
    }
    info(message, metadata) {
        this.log('info', message, metadata);
    }
    warn(message, metadata) {
        this.log('warn', message, metadata);
    }
    error(message, metadata) {
        this.log('error', message, metadata);
    }
    debug(message, metadata) {
        this.log('debug', message, metadata);
    }
}
exports.StructuredLogger = StructuredLogger;
