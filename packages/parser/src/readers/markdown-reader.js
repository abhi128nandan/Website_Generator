"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readMarkdown = readMarkdown;
const shared_1 = require("@website-generator/shared");
const gray_matter_1 = __importDefault(require("gray-matter"));
/**
 * Reads a Markdown document, separating YAML frontmatter from body content.
 *
 * Frontmatter example:
 * ```yaml
 * ---
 * title: My SRS Document
 * entities:
 *   - name: User
 *     fields: [name, email, password]
 * tech_stack:
 *   frontend: React
 *   backend: Express
 * ---
 * ```
 */
function readMarkdown(input) {
    const text = Buffer.isBuffer(input) ? input.toString('utf-8') : input;
    shared_1.Logger.info('[Parser:Markdown] Parsing markdown document...');
    try {
        const { data: frontmatter, content } = (0, gray_matter_1.default)(text);
        const hasFrontmatter = Object.keys(frontmatter).length > 0;
        if (hasFrontmatter) {
            shared_1.Logger.info(`[Parser:Markdown] Extracted frontmatter with keys: ${Object.keys(frontmatter).join(', ')}`);
        }
        else {
            shared_1.Logger.info('[Parser:Markdown] No frontmatter found, using full content');
        }
        return {
            frontmatter,
            content: cleanMarkdownText(content),
        };
    }
    catch (err) {
        shared_1.Logger.warn(`[Parser:Markdown] gray-matter failed (${err.message}), treating as raw text`);
        return {
            frontmatter: {},
            content: cleanMarkdownText(text),
        };
    }
}
/** Cleans markdown text while preserving structural formatting. */
function cleanMarkdownText(text) {
    return text
        .replace(/\0/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
