"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCategory = exports.FrontendArchitectureSchema = exports.ValidationSchema = exports.CrudArchitectureSchema = exports.RequirementsSchema = exports.Logger = exports.CONSTANTS = void 0;
exports.CONSTANTS = {
    APP_NAME: 'Website Generator',
    VERSION: '1.0.0',
};
class Logger {
    static info(message, ...meta) {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...meta);
    }
    static error(message, error) {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
    }
    static warn(message, ...meta) {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...meta);
    }
}
exports.Logger = Logger;
const zod_1 = require("zod");
exports.RequirementsSchema = zod_1.z.object({
    appName: zod_1.z.string().min(1, 'App name cannot be empty'),
    appType: zod_1.z.string().min(1, 'App type cannot be empty'),
    frontend: zod_1.z.array(zod_1.z.string()).default([]),
    backend: zod_1.z.array(zod_1.z.string()).default([]),
    database: zod_1.z.array(zod_1.z.string()).default([]),
    features: zod_1.z.array(zod_1.z.string()).min(1, 'Must extract at least one feature'),
    workflows: zod_1.z.array(zod_1.z.string()).default([]),
    entities: zod_1.z.array(zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.object({
            name: zod_1.z.string(),
            fields: zod_1.z.array(zod_1.z.string()).optional(),
            validations: zod_1.z.array(zod_1.z.string()).optional(),
            relationships: zod_1.z.array(zod_1.z.string()).optional(),
        }),
        zod_1.z.any()
    ])).default([]),
    routes: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.CrudArchitectureSchema = zod_1.z.object({
    entities: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        fields: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            type: zod_1.z.enum(['String', 'Int', 'Float', 'Boolean', 'DateTime']),
            isRequired: zod_1.z.boolean(),
            isId: zod_1.z.boolean().optional(),
            isUnique: zod_1.z.boolean().optional(),
            isRelation: zod_1.z.boolean().optional(),
            relationTarget: zod_1.z.string().optional(),
            isArray: zod_1.z.boolean().optional(),
            hasDefault: zod_1.z.boolean().optional()
        })).default([])
    })).default([]),
    endpoints: zod_1.z.array(zod_1.z.object({
        path: zod_1.z.string(),
        method: zod_1.z.enum(['GET', 'POST', 'PUT', 'DELETE']),
        entity: zod_1.z.string().optional(),
        description: zod_1.z.string(),
        businessLogic: zod_1.z.string().optional()
    })).default([]),
    pages: zod_1.z.array(zod_1.z.object({
        route: zod_1.z.string(),
        componentName: zod_1.z.string(),
        entity: zod_1.z.string().optional(),
        description: zod_1.z.string(),
        features: zod_1.z.array(zod_1.z.string()).optional(),
        isDashboard: zod_1.z.boolean().optional()
    })).default([]),
    navigation: zod_1.z.array(zod_1.z.object({
        label: zod_1.z.string(),
        route: zod_1.z.string()
    })).optional().default([])
});
exports.ValidationSchema = zod_1.z.object({
    score: zod_1.z.number(),
    criteria: zod_1.z.object({
        architecture: zod_1.z.number().optional().default(0),
        typeScriptCompile: zod_1.z.number().optional().default(0),
        importResolution: zod_1.z.number().optional().default(0),
        reactStructure: zod_1.z.number().optional().default(0),
        buildSuccess: zod_1.z.number().optional().default(0),
        businessLogic: zod_1.z.number().optional().default(0),
        frontend: zod_1.z.number().optional().default(0),
        navigation: zod_1.z.number().optional().default(0),
        forms: zod_1.z.number().optional().default(0),
        validation: zod_1.z.number().optional().default(0),
        // Legacy fields (kept for backward compat with old generations)
        database: zod_1.z.number().optional().default(0),
        backend: zod_1.z.number().optional().default(0),
    }),
    missingFunctionality: zod_1.z.array(zod_1.z.string()),
    feedback: zod_1.z.string()
});
exports.FrontendArchitectureSchema = zod_1.z.object({
    components: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        type: zod_1.z.enum(['page', 'component', 'layout']),
        description: zod_1.z.string(),
    })).default([]),
    services: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        externalApi: zod_1.z.string().nullable().optional(),
    })).default([]),
    hooks: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        description: zod_1.z.string(),
    })).default([]),
    pages: zod_1.z.array(zod_1.z.object({
        route: zod_1.z.string(),
        componentName: zod_1.z.string(),
        description: zod_1.z.string(),
    })).default([]),
});
__exportStar(require("./network/findAvailablePort"), exports);
// --- Autonomy Types ---
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["INFRASTRUCTURE"] = "INFRASTRUCTURE";
    ErrorCategory["ENVIRONMENT"] = "ENVIRONMENT";
    ErrorCategory["DEPENDENCY"] = "DEPENDENCY";
    ErrorCategory["GENERATION"] = "GENERATION";
    ErrorCategory["VALIDATION"] = "VALIDATION";
    ErrorCategory["RUNTIME"] = "RUNTIME";
    ErrorCategory["NETWORK"] = "NETWORK";
    ErrorCategory["FILESYSTEM"] = "FILESYSTEM";
    ErrorCategory["ORCHESTRATION"] = "ORCHESTRATION";
    ErrorCategory["AGENT"] = "AGENT";
    ErrorCategory["DATABASE"] = "DATABASE";
    ErrorCategory["FRONTEND"] = "FRONTEND";
    ErrorCategory["BACKEND"] = "BACKEND";
    ErrorCategory["SECURITY"] = "SECURITY";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
