import { Logger } from '@website-generator/shared';
import type { ApiRoute } from '../types';

/** Valid HTTP methods we look for. */
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;
const METHOD_SET = new Set<string>(HTTP_METHODS);

/**
 * Extracts API route definitions from SRS text.
 *
 * Supported patterns:
 *   1. Inline: "GET /api/users" or "POST /api/users — Create a new user"
 *   2. Markdown tables: "| Method | Path | Description |"
 *   3. Code blocks: "`GET /api/users`"
 *   4. Bullet lists: "- GET /api/users: Fetch all users"
 */
export function extractApiRoutes(text: string): ApiRoute[] {
  const routes: ApiRoute[] = [];
  const seen = new Set<string>();

  // Strategy 1: Inline method + path patterns
  // Matches: "GET /api/users", "POST /api/users — Create a user", etc.
  const inlinePattern = new RegExp(
    `\\b(${HTTP_METHODS.join('|')})\\s+(/[\\w/{}:.-]+)(?:\\s*[-–—:|]\\s*(.+?))?(?:\\n|$)`,
    'gi'
  );
  let match: RegExpExecArray | null;

  while ((match = inlinePattern.exec(text)) !== null) {
    const route = createRoute(match[1], match[2], match[3]);
    const key = routeKey(route);
    if (!seen.has(key)) {
      seen.add(key);
      routes.push(route);
    }
  }

  // Strategy 2: Markdown tables
  const tableRoutes = extractRoutesFromTables(text);
  for (const route of tableRoutes) {
    const key = routeKey(route);
    if (!seen.has(key)) {
      seen.add(key);
      routes.push(route);
    }
  }

  // Strategy 3: Code block patterns — `GET /api/users`
  const codePattern = new RegExp(
    `\`(${HTTP_METHODS.join('|')})\\s+(/[\\w/{}:.-]+)\`(?:\\s*[-–—:|]?\\s*(.+?))?(?:\\n|$)`,
    'gi'
  );

  while ((match = codePattern.exec(text)) !== null) {
    const route = createRoute(match[1], match[2], match[3]);
    const key = routeKey(route);
    if (!seen.has(key)) {
      seen.add(key);
      routes.push(route);
    }
  }

  Logger.info(`[Parser:ApiRoutes] Extracted ${routes.length} API routes`);
  return routes;
}

/**
 * Extracts API routes from markdown tables.
 * Looks for tables with Method/Path columns.
 */
function extractRoutesFromTables(text: string): ApiRoute[] {
  const routes: ApiRoute[] = [];

  // Match table blocks: header row + separator + data rows
  const tablePattern = /\|(.+)\|\s*\n\|[-\s|]+\|\s*\n((?:\|.+\|\s*\n?)+)/g;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tablePattern.exec(text)) !== null) {
    const headers = tableMatch[1].split('|').map(h => h.trim().toLowerCase()).filter(Boolean);

    // Find column indices
    const methodCol = headers.findIndex(h =>
      ['method', 'http method', 'verb', 'http'].includes(h)
    );
    const pathCol = headers.findIndex(h =>
      ['path', 'endpoint', 'url', 'route', 'uri'].includes(h)
    );
    const descCol = headers.findIndex(h =>
      ['description', 'desc', 'details', 'purpose', 'action'].includes(h)
    );

    // Need at least method and path columns
    if (methodCol < 0 || pathCol < 0) continue;

    const dataRows = tableMatch[2].trim().split('\n');
    for (const row of dataRows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);

      const method = cells[methodCol]?.toUpperCase();
      const path = cells[pathCol];
      const description = descCol >= 0 ? cells[descCol] : '';

      if (method && METHOD_SET.has(method) && path?.startsWith('/')) {
        routes.push(createRoute(method, path, description));
      }
    }
  }

  return routes;
}

/** Creates a cleaned ApiRoute object. */
function createRoute(method: string, path: string, description?: string): ApiRoute {
  return {
    method: method.trim().toUpperCase(),
    path: path.trim(),
    description: (description || '').trim().replace(/\.$/, ''),
  };
}

/** Generates a dedup key for an API route. */
function routeKey(route: ApiRoute): string {
  return `${route.method}|${route.path}`.toLowerCase();
}
