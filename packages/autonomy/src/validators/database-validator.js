"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseValidator = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class DatabaseValidator {
    static async validatePrismaSchema(projectRoot) {
        try {
            const schemaPath = path_1.default.join(projectRoot, 'prisma', 'schema.prisma');
            const content = await promises_1.default.readFile(schemaPath, 'utf-8');
            // Basic validation
            return content.includes('generator client') && content.includes('datasource db');
        }
        catch {
            return false;
        }
    }
    static async validateEnvUrl(projectRoot) {
        try {
            const envPath = path_1.default.join(projectRoot, '.env');
            const content = await promises_1.default.readFile(envPath, 'utf-8');
            const match = content.match(/DATABASE_URL="([^"]+)"/);
            if (!match)
                return false;
            const url = match[1];
            return url.startsWith('postgresql://') || url.startsWith('postgres://');
        }
        catch {
            return false;
        }
    }
}
exports.DatabaseValidator = DatabaseValidator;
