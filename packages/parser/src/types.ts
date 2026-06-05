/**
 * @srs-gen/parser — Type definitions for parsed SRS documents.
 *
 * These types represent the structured output of deterministic SRS parsing.
 * Field types default to 'string'; the ai-engine package refines them later.
 */

/** A single field within a data entity. */
export interface EntityField {
  name: string;
  /** Default 'string' — refined by ai-engine after LLM enrichment. */
  type: string;
}

/** A data entity (model) extracted from the SRS. */
export interface ParsedEntity {
  name: string;
  fields: EntityField[];
}

/** A user story in the canonical "As a / I want / So that" format. */
export interface UserStory {
  role: string;
  action: string;
  benefit: string;
}

/** An API route extracted from the SRS. */
export interface ApiRoute {
  method: string;   // GET, POST, PUT, DELETE, PATCH
  path: string;     // e.g. /api/users, /auth/login
  description: string;
}

/** Technology stack preferences extracted from the SRS. */
export interface TechStack {
  frontend?: string;
  backend?: string;
  database?: string;
}

/** Supported SRS input formats. */
export type SrsFormat = 'pdf' | 'md' | 'txt';

/**
 * The fully structured output of parsing an SRS document.
 * This is the pre-LLM representation — deterministically extracted
 * from the raw document via regex and heuristic analysis.
 */
export interface ParsedSRS {
  title: string;
  description: string;
  entities: ParsedEntity[];
  userStories: UserStory[];
  apiRoutes: ApiRoute[];
  techStack: TechStack;
}

/** Internal intermediate result from a markdown reader. */
export interface MarkdownReadResult {
  frontmatter: Record<string, any>;
  content: string;
}
