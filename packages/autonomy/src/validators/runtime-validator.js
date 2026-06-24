"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeValidator = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class RuntimeValidator {
    static async validateTopology(projectRoot) {
        try {
            const runtimePath = path_1.default.join(projectRoot, 'runtime.json');
            const data = await promises_1.default.readFile(runtimePath, 'utf-8');
            const topology = JSON.parse(data);
            // Basic structure validation
            if (!topology.processes || !Array.isArray(topology.processes)) {
                return null;
            }
            // Verify process IDs actually exist (simplified for windows/linux compatibility)
            // In a real implementation this would check process tree
            return topology;
        }
        catch {
            return null;
        }
    }
}
exports.RuntimeValidator = RuntimeValidator;
