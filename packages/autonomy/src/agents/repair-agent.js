"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepairAgent = void 0;
const repair_registry_1 = require("../errors/repair-registry");
const repair_logger_1 = require("../logger/repair-logger");
const crypto_1 = require("crypto");
class RepairAgent {
    context;
    logger;
    constructor(context) {
        this.context = context;
        this.logger = new repair_logger_1.RepairLogger(context.projectId);
    }
    async repair(diagnosis) {
        if (!diagnosis.repairable || !diagnosis.repairStrategy) {
            return { success: false, message: 'Error is not repairable or lacks a strategy', actionTaken: 'none' };
        }
        const strategy = repair_registry_1.RepairRegistry.getStrategy(diagnosis.repairStrategy);
        if (!strategy) {
            return { success: false, message: `Unknown repair strategy: ${diagnosis.repairStrategy}`, actionTaken: 'none' };
        }
        const action = {
            id: (0, crypto_1.randomUUID)(),
            timestamp: new Date().toISOString(),
            errorId: diagnosis.originalError.id,
            strategy: strategy.id,
            status: 'pending'
        };
        this.logger.startRepair(action);
        action.status = 'executing';
        try {
            // Execute the repair
            const result = await strategy.execute({
                projectId: this.context.projectId,
                projectRoot: this.context.projectRoot,
                errorId: diagnosis.originalError.id,
                metadata: diagnosis.originalError.metadata
            });
            action.status = result.success ? 'success' : 'failed';
            action.details = result.message;
            this.logger.completeRepair(action, result.success, result.message);
            return result;
        }
        catch (e) {
            action.status = 'failed';
            action.details = e.message;
            this.logger.completeRepair(action, false, e.message);
            return { success: false, message: `Repair execution failed: ${e.message}`, actionTaken: 'error' };
        }
    }
}
exports.RepairAgent = RepairAgent;
