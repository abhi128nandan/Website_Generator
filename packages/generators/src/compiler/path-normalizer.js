"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeExpressPath = normalizeExpressPath;
/**
 * Normalizes OpenAPI/Swagger-style route parameters (e.g., /api/users/{id})
 * to Express-style colon route parameters (e.g., /api/users/:id).
 */
function normalizeExpressPath(path) {
    return path.replace(/\{([^}]+)\}/g, ':$1');
}
