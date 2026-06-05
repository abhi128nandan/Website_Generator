/**
 * @srs-gen/parser — SRS Document Parser
 *
 * Parses Software Requirements Specification documents (PDF, Markdown, plain text)
 * into structured ParsedSRS objects using deterministic heuristic extraction.
 *
 * This is the pre-LLM stage — it extracts what it can from the raw document
 * without making any AI calls. The ai-engine package enriches the output later.
 *
 * @example
 * ```typescript
 * import { parseSRS } from '@srs-gen/parser';
 *
 * // From a string
 * const result = await parseSRS(markdownContent, 'md');
 *
 * // From a buffer (e.g., uploaded file)
 * const result = await parseSRS(pdfBuffer, 'pdf');
 *
 * // Auto-detect format
 * const result = await parseSRS(someContent);
 * ```
 */

// Public API
export { parseSRS } from './parser';

// Types
export type {
  ParsedSRS,
  ParsedEntity,
  EntityField,
  UserStory,
  ApiRoute,
  TechStack,
  SrsFormat,
  MarkdownReadResult,
} from './types';

// Individual extractors (for advanced usage)
export { extractEntities } from './extractors/entity-extractor';
export { extractUserStories } from './extractors/user-story-extractor';
export { extractApiRoutes } from './extractors/api-route-extractor';
export { extractTechStack } from './extractors/tech-stack-extractor';

// Format detection
export { detectFormat } from './detect-format';
