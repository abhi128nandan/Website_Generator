"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSRS = parseSRS;
const shared_1 = require("@website-generator/shared");
const detect_format_1 = require("./detect-format");
const pdf_reader_1 = require("./readers/pdf-reader");
const markdown_reader_1 = require("./readers/markdown-reader");
const text_reader_1 = require("./readers/text-reader");
const entity_extractor_1 = require("./extractors/entity-extractor");
const user_story_extractor_1 = require("./extractors/user-story-extractor");
const api_route_extractor_1 = require("./extractors/api-route-extractor");
const tech_stack_extractor_1 = require("./extractors/tech-stack-extractor");
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
async function parseSRS(input, format) {
    shared_1.Logger.info('[Parser] Starting SRS document parsing...');
    // Validate input
    if (!input || (typeof input === 'string' && input.trim().length === 0)) {
        throw new Error('Parser Error: Input is empty or blank');
    }
    if (Buffer.isBuffer(input) && input.length === 0) {
        throw new Error('Parser Error: Input buffer is empty');
    }
    // Step 1: Detect format
    const detectedFormat = (0, detect_format_1.detectFormat)(input, format);
    shared_1.Logger.info(`[Parser] Using format: ${detectedFormat}`);
    // Step 2: Read input via the appropriate reader
    let rawText;
    let frontmatter = {};
    switch (detectedFormat) {
        case 'pdf':
            if (!Buffer.isBuffer(input)) {
                throw new Error('Parser Error: PDF format requires a Buffer input');
            }
            rawText = await (0, pdf_reader_1.readPdf)(input);
            break;
        case 'md': {
            const mdResult = (0, markdown_reader_1.readMarkdown)(input);
            rawText = mdResult.content;
            frontmatter = mdResult.frontmatter;
            break;
        }
        case 'txt':
        default:
            rawText = (0, text_reader_1.readText)(input);
            break;
    }
    if (rawText.trim().length === 0) {
        throw new Error('Parser Error: No text content could be extracted from the document');
    }
    shared_1.Logger.info(`[Parser] Extracted ${rawText.length} characters of raw text`);
    // Step 3: Run all extractors on the raw text
    const extractedEntities = (0, entity_extractor_1.extractEntities)(rawText);
    const extractedStories = (0, user_story_extractor_1.extractUserStories)(rawText);
    const extractedRoutes = (0, api_route_extractor_1.extractApiRoutes)(rawText);
    const extractedTechStack = (0, tech_stack_extractor_1.extractTechStack)(rawText);
    // Step 4: Extract title and description
    const title = resolveTitle(rawText, frontmatter);
    const description = resolveDescription(rawText, frontmatter);
    // Step 5: Merge frontmatter fast-path with extraction results (for Markdown)
    const entities = mergeFrontmatterEntities(extractedEntities, frontmatter);
    const techStack = mergeFrontmatterTechStack(extractedTechStack, frontmatter);
    // Step 6: Assemble final result
    const result = {
        title,
        description,
        entities,
        userStories: extractedStories,
        apiRoutes: extractedRoutes,
        techStack,
    };
    shared_1.Logger.info(`[Parser] Parsing complete — ` +
        `${result.entities.length} entities, ` +
        `${result.userStories.length} user stories, ` +
        `${result.apiRoutes.length} API routes, ` +
        `tech: [${Object.values(result.techStack).filter(Boolean).join(', ')}]`);
    return result;
}
/**
 * Resolves the document title.
 * Priority: frontmatter.title > first H1 heading > first line > fallback.
 */
function resolveTitle(text, frontmatter) {
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
function resolveDescription(text, frontmatter) {
    // Check frontmatter
    if (frontmatter.description && typeof frontmatter.description === 'string') {
        return frontmatter.description.trim();
    }
    // Try to find a description/overview/introduction section
    const descSectionMatch = text.match(/^#{1,3}\s+(?:description|overview|introduction|summary|about)\s*$/im);
    if (descSectionMatch) {
        const afterSection = text.slice(descSectionMatch.index + descSectionMatch[0].length);
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
        if (/^[#|*-]/.test(cleaned))
            continue;
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
function mergeFrontmatterEntities(extracted, frontmatter) {
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
        }
        else if (fmEntity && typeof fmEntity === 'object' && fmEntity.name) {
            if (!seen.has(fmEntity.name.toLowerCase())) {
                seen.add(fmEntity.name.toLowerCase());
                const fields = Array.isArray(fmEntity.fields)
                    ? fmEntity.fields.map((f) => typeof f === 'string'
                        ? { name: f, type: 'string' }
                        : { name: f.name || f, type: f.type || 'string' })
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
function mergeFrontmatterTechStack(extracted, frontmatter) {
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
