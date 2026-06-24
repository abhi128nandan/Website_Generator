"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentLogger = void 0;
const structured_logger_1 = require("./structured-logger");
class AgentLogger {
    logger;
    constructor(projectId, agentName) {
        this.logger = new structured_logger_1.StructuredLogger({
            projectId,
            layer: 'agent',
            service: agentName
        });
    }
    stageTransition(from, to, reason) {
        this.logger.child({ operation: 'transition' }).info(`Transition: ${from} -> ${to}`, { reason });
    }
    decision(action, reasoning, confidence) {
        this.logger.child({ operation: 'decision' }).info(action, { reasoning, confidence });
    }
    retry(stage, attempt, maxAttempts) {
        this.logger.child({ operation: 'retry' }).warn(`Retry ${attempt}/${maxAttempts} for stage ${stage}`);
    }
}
exports.AgentLogger = AgentLogger;
