import { Logger } from '@website-generator/shared';
import type { ParsedSRS, SrsFormat, ParsedEntity, TechStack } from './types';
import { detectFormat } from './detect-format';
import { readPdf } from './readers/pdf-reader';
import { readMarkdown } from './readers/markdown-reader';
import { readText } from './readers/text-reader';
import { extractEntities } from './extractors/entity-extractor';
import { extractUserStories } from './extractors/user-story-extractor';
import { extractApiRoutes } from './extractors/api-route-extractor';
import { extractTechStack } from './extractors/tech-stack-extractor';

/**
 * Parses an SRS document into a structured ParsedSRS object.
 *
 * This is the core orchestrator that:
 *   1. Detects the input format (or uses the explicit hint)
 *   2. Reads the input via the appropriate reader
 *   3. Runs all extractors on the raw text
 *   4. For Markdown: merges frontmatter fast-path results with extraction results
 *   5. Assembles and returns the final ParsedSRS
 *
 * @param input - File content as a string or Buffer
 * @param format - Optional format hint ('pdf', 'md', 'txt'). Auto-detected if omitted.
 * @returns Structured ParsedSRS object
 */
export async function parseSRS(
  input: string | Buffer,
  format?: SrsFormat
): Promise<ParsedSRS> {
  Logger.info('[Parser] Starting SRS document parsing...');

  // Validate input
  if (!input || (typeof input === 'string' && input.trim().length === 0)) {
    throw new Error('Parser Error: Input is empty or blank');
  }
  if (Buffer.isBuffer(input) && input.length === 0) {
    throw new Error('Parser Error: Input buffer is empty');
  }

  // Step 1: Detect format
  const detectedFormat = detectFormat(input, format);
  Logger.info(`[Parser] Using format: ${detectedFormat}`);

  // Step 2: Read input via the appropriate reader
  let rawText: string;
  let frontmatter: Record<string, any> = {};

  switch (detectedFormat) {
    case 'pdf':
      if (!Buffer.isBuffer(input)) {
        throw new Error('Parser Error: PDF format requires a Buffer input');
      }
      rawText = await readPdf(input);
      break;

    case 'md': {
      const mdResult = readMarkdown(input);
      rawText = mdResult.content;
      frontmatter = mdResult.frontmatter;
      break;
    }

    case 'txt':
    default:
      rawText = readText(input);
      break;
  }

  if (rawText.trim().length === 0) {
    throw new Error('Parser Error: No text content could be extracted from the document');
  }

  Logger.info(`[Parser] Extracted ${rawText.length} characters of raw text`);

  // Step 3: Run all extractors on the raw text
  const extractedEntities = extractEntities(rawText);
  const extractedStories = extractUserStories(rawText);
  const extractedRoutes = extractApiRoutes(rawText);
  const extractedTechStack = extractTechStack(rawText);

  // Step 4: Extract title and description
  const title = resolveTitle(rawText, frontmatter);
  const description = resolveDescription(rawText, frontmatter);

  // Step 5: Merge frontmatter fast-path with extraction results (for Markdown)
  const entities = mergeFrontmatterEntities(extractedEntities, frontmatter);
  const techStack = mergeFrontmatterTechStack(extractedTechStack, frontmatter);

  // Step 6: Assemble final result
  const result: ParsedSRS = {
    title,
    description,
    entities,
    userStories: extractedStories,
    apiRoutes: extractedRoutes,
    techStack,
  };

  Logger.info(
    `[Parser] Parsing complete — ` +
    `${result.entities.length} entities, ` +
    `${result.userStories.length} user stories, ` +
    `${result.apiRoutes.length} API routes, ` +
    `tech: [${Object.values(result.techStack).filter(Boolean).join(', ')}]`
  );

  return result;
}

/**
 * Resolves the document title.
 * Priority: frontmatter.title > first H1 heading > first line > fallback.
 */
function resolveTitle(text: string, frontmatter: Record<string, any>): string {
  // Check frontmatter
  if (frontmatter.title && typeof frontmatter.title === 'string') {
    return frontmatter.title.trim();
  }
  if (frontmatter.name && typeof frontmatter.name === 'string') {
    return frontmatter.name.trim();
  }

  // Find first H1 heading
  const h1Match = text.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Find a line containing "SRS" or "Software Requirements"
  const srsLineMatch = text.match(/^(.*(SRS|Software Requirement|Requirements Specification).*)$/im);
  if (srsLineMatch) {
    return srsLineMatch[1].trim().slice(0, 120);
  }

  // Fallback: first non-empty line, truncated
  const firstLine = text.split('\n').find(line => line.trim().length > 0);
  return firstLine ? firstLine.trim().slice(0, 120) : 'Untitled SRS Document';
}

/**
 * Resolves the document description.
 * Priority: frontmatter.description > text after title heading > first paragraph.
 */
function resolveDescription(text: string, frontmatter: Record<string, any>): string {
  // Check frontmatter
  if (frontmatter.description && typeof frontmatter.description === 'string') {
    return frontmatter.description.trim();
  }

  // Try to find a description/overview/introduction section
  const descSectionMatch = text.match(
    /^#{1,3}\s+(?:description|overview|introduction|summary|about)\s*$/im
  );

  if (descSectionMatch) {
    const afterSection = text.slice(descSectionMatch.index! + descSectionMatch[0].length);
    const nextHeading = afterSection.search(/^#{1,3}\s+/m);
    const sectionText = nextHeading >= 0
      ? afterSection.slice(0, nextHeading)
      : afterSection.slice(0, 500);

    const desc = sectionText.trim().split('\n').filter(l => l.trim()).join(' ');
    if (desc.length > 10) {
      return desc.slice(0, 500);
    }
  }

  // Fallback: first paragraph after any heading
  const paragraphs = text.split(/\n\n+/);
  for (const para of paragraphs) {
    const cleaned = para.trim();
    // Skip headings, tables, bullets
    if (/^[#|*-]/.test(cleaned)) continue;
    if (cleaned.length > 20) {
      return cleaned.slice(0, 500);
    }
  }

  return '';
}

/**
 * Merges entities extracted from text with entities from frontmatter.
 * Frontmatter entities take precedence for duplicate names.
 */
function mergeFrontmatterEntities(
  extracted: ParsedEntity[],
  frontmatter: Record<string, any>
): ParsedEntity[] {
  if (!frontmatter.entities || !Array.isArray(frontmatter.entities)) {
    return extracted;
  }

  const merged = [...extracted];
  const seen = new Set(extracted.map(e => e.name.toLowerCase()));

  for (const fmEntity of frontmatter.entities) {
    if (typeof fmEntity === 'string') {
      if (!seen.has(fmEntity.toLowerCase())) {
        seen.add(fmEntity.toLowerCase());
        merged.push({ name: fmEntity, fields: [] });
      }
    } else if (fmEntity && typeof fmEntity === 'object' && fmEntity.name) {
      if (!seen.has(fmEntity.name.toLowerCase())) {
        seen.add(fmEntity.name.toLowerCase());
        const fields = Array.isArray(fmEntity.fields)
          ? fmEntity.fields.map((f: any) =>
              typeof f === 'string'
                ? { name: f, type: 'string' }
                : { name: f.name || f, type: f.type || 'string' }
            )
          : [];
        merged.push({ name: fmEntity.name, fields });
      }
    }
  }

  return merged;
}

/**
 * Merges tech stack from text extraction with frontmatter tech stack.
 * Frontmatter values override extracted values.
 */
function mergeFrontmatterTechStack(
  extracted: TechStack,
  frontmatter: Record<string, any>
): TechStack {
  const fmTech = frontmatter.tech_stack || frontmatter.techStack || frontmatter.technology;
  if (!fmTech || typeof fmTech !== 'object') {
    return extracted;
  }

  return {
    frontend: fmTech.frontend || extracted.frontend,
    backend: fmTech.backend || extracted.backend,
    database: fmTech.database || extracted.database,
  };
}
