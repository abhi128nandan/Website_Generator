"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceValidator = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class WorkspaceValidator {
    static async validateFiles(projectRoot, requiredFiles) {
        const missing = [];
        for (const file of requiredFiles) {
            try {
                await promises_1.default.access(path_1.default.join(projectRoot, file));
            }
            catch {
                missing.push(file);
            }
        }
        return missing;
    }
}
exports.WorkspaceValidator = WorkspaceValidator;
