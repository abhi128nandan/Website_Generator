/**
 * Normalizes OpenAPI/Swagger-style route parameters (e.g., /api/users/{id})
 * to Express-style colon route parameters (e.g., /api/users/:id).
 */
export function normalizeExpressPath(path: string): string {
  return path.replace(/\{([^}]+)\}/g, ':$1');
}
