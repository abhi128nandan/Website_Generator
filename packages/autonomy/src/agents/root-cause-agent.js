"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootCauseAgent = void 0;
const error_registry_1 = require("../errors/error-registry");
const root_cause_engine_1 = require("../errors/root-cause-engine");
const agent_logger_1 = require("../logger/agent-logger");
class RootCauseAgent {
    context;
    logger;
    constructor(context) {
        this.context = context;
        this.logger = new agent_logger_1.AgentLogger(context.projectId, 'RootCauseAnalyzer');
    }
    analyze() {
        this.logger.stageTransition('pipeline', 'root-cause-analysis', 'Error detected');
        // 1. Collect all structured errors for this project
        const errors = error_registry_1.ErrorRegistry.getTimeline(this.context.projectId);
        if (errors.length === 0) {
            this.logger.decision('skip-analysis', 'No errors found in registry');
            return null;
        }
        // 2. Run deterministic analysis engine
        const diagnosis = root_cause_engine_1.RootCauseEngine.analyze(errors);
        if (diagnosis) {
            this.logger.decision('identified-root-cause', diagnosis.rootCause, diagnosis.confidence);
            this.logger.decision('repair-strategy-selected', diagnosis.repairStrategy || 'none', diagnosis.confidence);
        }
        else {
            this.logger.decision('analysis-failed', 'Could not determine root cause from errors');
        }
        return diagnosis;
    }
}
exports.RootCauseAgent = RootCauseAgent;
