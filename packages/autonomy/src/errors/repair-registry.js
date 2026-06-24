"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepairRegistry = void 0;
const shared_1 = require("@website-generator/shared");
class RepairRegistry {
    static strategies = new Map();
    static register(strategy) {
        this.strategies.set(strategy.id, strategy);
    }
    static getStrategy(id) {
        return this.strategies.get(id);
    }
    static getStrategiesForCategory(category) {
        return Array.from(this.strategies.values()).filter(s => s.appliesTo.includes(category));
    }
}
exports.RepairRegistry = RepairRegistry;
// Built-in strategies (to be implemented more fully in RepairAgent)
RepairRegistry.register({
    id: 'port-conflict',
    name: 'Resolve Port Conflict',
    appliesTo: [shared_1.ErrorCategory.NETWORK, shared_1.ErrorCategory.RUNTIME],
    execute: async (context) => {
        return { success: true, message: 'Reallocated port', actionTaken: 'port-incremented', requiresRestart: true };
    }
});
