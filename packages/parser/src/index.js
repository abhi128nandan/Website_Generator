"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFormat = exports.extractTechStack = exports.extractApiRoutes = exports.extractUserStories = exports.extractEntities = exports.parseSRS = void 0;
// Public API
var parser_1 = require("./parser");
Object.defineProperty(exports, "parseSRS", { enumerable: true, get: function () { return parser_1.parseSRS; } });
// Individual extractors (for advanced usage)
var entity_extractor_1 = require("./extractors/entity-extractor");
Object.defineProperty(exports, "extractEntities", { enumerable: true, get: function () { return entity_extractor_1.extractEntities; } });
var user_story_extractor_1 = require("./extractors/user-story-extractor");
Object.defineProperty(exports, "extractUserStories", { enumerable: true, get: function () { return user_story_extractor_1.extractUserStories; } });
var api_route_extractor_1 = require("./extractors/api-route-extractor");
Object.defineProperty(exports, "extractApiRoutes", { enumerable: true, get: function () { return api_route_extractor_1.extractApiRoutes; } });
var tech_stack_extractor_1 = require("./extractors/tech-stack-extractor");
Object.defineProperty(exports, "extractTechStack", { enumerable: true, get: function () { return tech_stack_extractor_1.extractTechStack; } });
// Format detection
var detect_format_1 = require("./detect-format");
Object.defineProperty(exports, "detectFormat", { enumerable: true, get: function () { return detect_format_1.detectFormat; } });
