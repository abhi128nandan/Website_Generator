"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepairLogger = void 0;
const structured_logger_1 = require("./structured-logger");
class RepairLogger {
    logger;
    constructor(projectId) {
        this.logger = new structured_logger_1.StructuredLogger({
            projectId,
            layer: 'repair-agent',
            service: 'repair-orchestrator'
        });
    }
    startRepair(action) {
        this.logger.child({ operation: 'repair-start' }).info(`Starting repair strategy: ${action.strategy}`, { errorId: action.errorId });
    }
    completeRepair(action, success, message) {
        const level = success ? 'info' : 'error';
        this.logger.child({ operation: 'repair-complete' })[level](`Repair ${success ? 'successful' : 'failed'}: ${message}`, {
            errorId: action.errorId,
            strategy: action.strategy,
            status: action.status
        });
    }
    rollback(action, reason) {
        this.logger.child({ operation: 'repair-rollback' }).warn(`Rolling back repair ${action.strategy}`, { reason });
    }
}
exports.RepairLogger = RepairLogger;
