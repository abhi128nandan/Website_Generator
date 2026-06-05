import { Logger } from '@paperclip/shared';
import type { ParsedEntity, EntityField } from '../types';

/**
 * Extracts data entities/models from SRS text using multiple heuristic patterns.
 *
 * Supported patterns:
 *   1. Section-scoped definitions: "### Entity: User" or "## Data Models"
 *   2. Inline definitions: "User (name, email, age)"
 *   3. Markdown tables: "| Field | Type |"
 *   4. Bullet lists: "- User: name (string), email (string)"
 *   5. Colon-separated: "User: name, email, password"
 */
export function extractEntities(text: string): ParsedEntity[] {
  const entities: ParsedEntity[] = [];
  const seen = new Set<string>();

  // Strategy 1: Section headings with field bullets underneath
  //   ### Entity: User
  //   - name: string
  //   - email: string
  const sectionPattern = /^#{1,4}\s+(?:entity|model|table|schema)[:\s]+(\w+)\s*$/gim;
  let match: RegExpExecArray | null;

  while ((match = sectionPattern.exec(text)) !== null) {
    const entityName = capitalize(match[1]);
    if (seen.has(entityName.toLowerCase())) continue;

    // Collect bullet items following this heading
    const afterHeading = text.slice(match.index + match[0].length);
    const fields = extractFieldsFromBullets(afterHeading);

    if (fields.length > 0) {
      seen.add(entityName.toLowerCase());
      entities.push({ name: entityName, fields });
    }
  }

  // Strategy 2: Inline parenthetical — "User (name, email, age)"
  const inlinePattern = /\b([A-Z][a-zA-Z]+)\s*\(([^)]+)\)/g;
  while ((match = inlinePattern.exec(text)) !== null) {
    const entityName = match[1];
    // Filter out common false positives
    if (isCommonWord(entityName)) continue;
    if (seen.has(entityName.toLowerCase())) continue;

    const fieldNames = match[2].split(',').map(f => f.trim()).filter(Boolean);
    if (fieldNames.length < 2) continue; // need at least 2 fields to be an entity

    const fields = fieldNames.map(name => parseFieldWithType(name));
    seen.add(entityName.toLowerCase());
    entities.push({ name: entityName, fields });
  }

  // Strategy 3: Markdown tables
  //   | Field | Type | Required |
  //   |-------|------|----------|
  //   | name  | string | yes   |
  const tableEntities = extractEntitiesFromTables(text);
  for (const entity of tableEntities) {
    if (!seen.has(entity.name.toLowerCase())) {
      seen.add(entity.name.toLowerCase());
      entities.push(entity);
    }
  }

  // Strategy 4: Colon-separated definitions — "User: name, email, password"
  const colonPattern = /^[-*]?\s*([A-Z][a-zA-Z]+)\s*:\s*(.+)$/gm;
  while ((match = colonPattern.exec(text)) !== null) {
    const entityName = match[1];
    if (isCommonWord(entityName)) continue;
    if (seen.has(entityName.toLowerCase())) continue;

    const fieldNames = match[2].split(',').map(f => f.trim()).filter(Boolean);
    if (fieldNames.length < 2) continue;

    const fields = fieldNames.map(name => parseFieldWithType(name));
    seen.add(entityName.toLowerCase());
    entities.push({ name: entityName, fields });
  }

  Logger.info(`[Parser:Entities] Extracted ${entities.length} entities`);
  return entities;
}

/**
 * Extracts fields from bullet points following a section heading.
 * Stops at the next heading or double newline.
 */
function extractFieldsFromBullets(text: string): EntityField[] {
  const fields: EntityField[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    // Stop at next heading
    if (/^#{1,6}\s/.test(line)) break;
    // Stop at empty line after we've found some fields
    if (line.trim() === '' && fields.length > 0) break;

    // Match bullet items: "- name: string" or "- name (string)" or just "- name"
    const bulletMatch = line.match(/^\s*[-*+]\s+(\w[\w\s]*?)(?:\s*[:(]\s*(\w+)\s*\)?\s*)?$/);
    if (bulletMatch) {
      fields.push({
        name: bulletMatch[1].trim(),
        type: bulletMatch[2] || 'string',
      });
    }
  }

  return fields;
}

/**
 * Extracts entities from markdown tables.
 * Looks for tables preceded by an entity-name heading.
 */
function extractEntitiesFromTables(text: string): ParsedEntity[] {
  const entities: ParsedEntity[] = [];

  // Find table blocks preceded by headings
  const sections = text.split(/^(#{1,4}\s+.+)$/m);

  for (let i = 0; i < sections.length - 1; i++) {
    const headingMatch = sections[i].match(/^#{1,4}\s+(.+)$/);
    if (!headingMatch) continue;

    const heading = headingMatch[1].trim();
    const content = sections[i + 1] || '';

    // Check if the content section has a table
    const tableMatch = content.match(/\|(.+)\|\s*\n\|[-\s|]+\|\s*\n((?:\|.+\|\s*\n?)+)/);
    if (!tableMatch) continue;

    // Parse header row to see if it looks like field definitions
    const headers = tableMatch[1].split('|').map(h => h.trim().toLowerCase()).filter(Boolean);
    const hasFieldColumn = headers.some(h => ['field', 'name', 'column', 'attribute', 'property'].includes(h));
    const hasTypeColumn = headers.some(h => ['type', 'data type', 'datatype'].includes(h));

    if (!hasFieldColumn) continue;

    const fieldColIndex = headers.findIndex(h => ['field', 'name', 'column', 'attribute', 'property'].includes(h));
    const typeColIndex = hasTypeColumn
      ? headers.findIndex(h => ['type', 'data type', 'datatype'].includes(h))
      : -1;

    // Parse data rows
    const dataRows = tableMatch[2].trim().split('\n');
    const fields: EntityField[] = [];

    for (const row of dataRows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length <= fieldColIndex) continue;

      fields.push({
        name: cells[fieldColIndex],
        type: typeColIndex >= 0 && cells[typeColIndex] ? cells[typeColIndex] : 'string',
      });
    }

    if (fields.length > 0) {
      // Use heading as entity name, strip common prefixes
      const entityName = capitalize(
        heading.replace(/^(entity|model|table|schema)[:\s]*/i, '').trim()
      );
      entities.push({ name: entityName, fields });
    }
  }

  return entities;
}

/**
 * Parses a field string that may include a type annotation.
 * Examples: "name", "email (string)", "age: number", "name:string"
 */
function parseFieldWithType(raw: string): EntityField {
  // "field (type)" pattern
  const parenMatch = raw.match(/^(\w[\w\s]*?)\s*\(\s*(\w+)\s*\)$/);
  if (parenMatch) {
    return { name: parenMatch[1].trim(), type: parenMatch[2] };
  }

  // "field: type" pattern
  const colonMatch = raw.match(/^(\w[\w\s]*?)\s*:\s*(\w+)$/);
  if (colonMatch) {
    return { name: colonMatch[1].trim(), type: colonMatch[2] };
  }

  // Just a field name, default type to string
  return { name: raw.trim(), type: 'string' };
}

/** Capitalizes the first letter of a string. */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Common English words that look like entity names but aren't. */
const COMMON_WORDS = new Set([
  'the', 'this', 'that', 'with', 'from', 'have', 'will', 'should',
  'must', 'can', 'could', 'would', 'each', 'every', 'some', 'any',
  'all', 'both', 'either', 'neither', 'not', 'but', 'and', 'for',
  'when', 'where', 'while', 'then', 'than', 'once', 'here',
  'there', 'these', 'those', 'such', 'only', 'also', 'just',
  'into', 'over', 'after', 'before', 'between', 'through',
  'note', 'notes', 'example', 'examples', 'see', 'below',
  'above', 'following', 'table', 'figure', 'section',
  'appendix', 'reference', 'version', 'date', 'author',
  'string', 'number', 'boolean', 'integer', 'float', 'array',
  'object', 'null', 'undefined', 'true', 'false',
  'get', 'post', 'put', 'delete', 'patch',
]);

function isCommonWord(word: string): boolean {
  return COMMON_WORDS.has(word.toLowerCase());
}
