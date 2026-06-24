"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFormat = detectFormat;
const shared_1 = require("@website-generator/shared");
/** PDF files start with this magic byte sequence. */
const PDF_MAGIC = Buffer.from('%PDF');
/**
 * Detects the format of an SRS input.
 *
 * Priority:
 *   1. Explicit hint (if provided)
 *   2. PDF magic bytes (Buffer inputs)
 *   3. Markdown heading heuristic (string inputs)
 *   4. Fallback to 'txt'
 */
function detectFormat(input, hint) {
    if (hint) {
        shared_1.Logger.info(`[Parser] Format hint provided: ${hint}`);
        return hint;
    }
    // Check for PDF magic bytes in Buffer inputs
    if (Buffer.isBuffer(input)) {
        if (input.length >= 4 && input.subarray(0, 4).equals(PDF_MAGIC)) {
            shared_1.Logger.info('[Parser] Detected PDF format via magic bytes');
            return 'pdf';
        }
        // Try to decode as UTF-8 and check for markdown patterns
        const text = input.toString('utf-8', 0, Math.min(input.length, 1024));
        if (looksLikeMarkdown(text)) {
            shared_1.Logger.info('[Parser] Detected Markdown format via content heuristics');
            return 'md';
        }
        shared_1.Logger.info('[Parser] Buffer input, defaulting to txt format');
        return 'txt';
    }
    // String inputs — check for markdown patterns
    if (looksLikeMarkdown(input)) {
        shared_1.Logger.info('[Parser] Detected Markdown format via content heuristics');
        return 'md';
    }
    shared_1.Logger.info('[Parser] Defaulting to txt format');
    return 'txt';
}
/**
 * Checks if text content appears to be Markdown.
 * Looks for: headings (# / ##), frontmatter (---), fenced code blocks, links.
 */
function looksLikeMarkdown(text) {
    const sample = text.slice(0, 2048);
    const indicators = [
        /^---\s*$/m, // YAML frontmatter delimiter
        /^#{1,6}\s+\S/m, // ATX headings
        /^\|.+\|.+\|/m, // Markdown tables
        /```[\s\S]*?```/, // Fenced code blocks
        /\[.+?\]\(.+?\)/, // Markdown links
        /^\s*[-*+]\s+/m, // Unordered lists (weak signal, needs 2+ indicators)
    ];
    let matchCount = 0;
    for (const pattern of indicators) {
        if (pattern.test(sample))
            matchCount++;
    }
    // Need at least 2 markdown indicators to be confident
    return matchCount >= 2;
}
