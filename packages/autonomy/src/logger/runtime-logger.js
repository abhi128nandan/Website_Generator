"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeLogger = void 0;
const structured_logger_1 = require("./structured-logger");
const error_classifier_1 = require("../errors/error-classifier");
const error_registry_1 = require("../errors/error-registry");
class RuntimeLogger {
    logger;
    projectId;
    constructor(projectId, layer, service) {
        this.projectId = projectId;
        this.logger = new structured_logger_1.StructuredLogger({
            projectId,
            layer,
            service
        });
    }
    logStdout(operation, data) {
        const lines = data.split('\n').filter(l => l.trim().length > 0);
        for (const line of lines) {
            this.logger.child({ operation }).info(line);
        }
    }
    logStderr(operation, data) {
        const lines = data.split('\n').filter(l => l.trim().length > 0);
        for (const line of lines) {
            // Pass to error classifier
            const structuredError = error_classifier_1.ErrorClassifier.classify(line, {
                layer: this.logger['baseContext'].layer || 'unknown',
                service: this.logger['baseContext'].service || 'unknown',
                operation
            });
            // Register error for root cause analysis
            error_registry_1.ErrorRegistry.register(this.projectId, structuredError);
            this.logger.child({
                operation,
                category: structuredError.category
            }).error(line, { errorId: structuredError.id, repairable: structuredError.repairable });
        }
    }
    lifecycle(event, details) {
        this.logger.child({ operation: 'lifecycle' }).info(`Process ${event}`, details);
    }
}
exports.RuntimeLogger = RuntimeLogger;
