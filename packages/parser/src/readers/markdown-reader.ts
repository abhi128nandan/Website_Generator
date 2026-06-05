import { Logger } from '@paperclip/shared';
import matter from 'gray-matter';
import type { MarkdownReadResult } from '../types';

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
export function readMarkdown(input: string | Buffer): MarkdownReadResult {
  const text = Buffer.isBuffer(input) ? input.toString('utf-8') : input;
  Logger.info('[Parser:Markdown] Parsing markdown document...');

  try {
    const { data: frontmatter, content } = matter(text);
    const hasFrontmatter = Object.keys(frontmatter).length > 0;

    if (hasFrontmatter) {
      Logger.info(`[Parser:Markdown] Extracted frontmatter with keys: ${Object.keys(frontmatter).join(', ')}`);
    } else {
      Logger.info('[Parser:Markdown] No frontmatter found, using full content');
    }

    return {
      frontmatter,
      content: cleanMarkdownText(content),
    };
  } catch (err: any) {
    Logger.warn(`[Parser:Markdown] gray-matter failed (${err.message}), treating as raw text`);
    return {
      frontmatter: {},
      content: cleanMarkdownText(text),
    };
  }
}

/** Cleans markdown text while preserving structural formatting. */
function cleanMarkdownText(text: string): string {
  return text
    .replace(/\0/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
