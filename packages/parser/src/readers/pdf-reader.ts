import { Logger } from '@website-generator/shared';
import * as pdfParse from 'pdf-parse';
import { DocumentSanityValidator } from '../document-sanity-validator';

/**
 * Extracts raw text from a PDF buffer.
 *
 * Uses pdf-parse with CJS/ESM interop handling (same pattern as
 * the existing ai-engine/parser.ts). Falls back to raw UTF-8
 * decoding for malformed PDFs.
 */
export async function readPdf(buffer: Buffer): Promise<string> {
  Logger.info('[Parser:PDF] Parsing PDF document...');

  // Resolve the actual callable from CJS/ESM interop variations
  let parser: any = pdfParse;
  if (typeof parser !== 'function' && parser && typeof parser.default === 'function') {
    parser = parser.default;
  }
  if (typeof parser !== 'function' && parser && typeof parser.pdf === 'function') {
    parser = parser.pdf;
  }
  if (typeof parser !== 'function') {
    Logger.warn('[Parser:PDF] pdf-parse function not resolved, falling back to raw text');
    return cleanText(buffer.toString('utf-8'));
  }

  try {
    const data = await parser(buffer);
    Logger.info(`[Parser:PDF] Extracted ${data.text.length} characters`);
    const clean = cleanText(data.text);
    DocumentSanityValidator.validate(clean);
    return clean;
  } catch (err: any) {
    if (err.message?.includes('DOCUMENT_EXTRACTION_INVALID')) {
      throw err;
    }
    Logger.warn(`[Parser:PDF] pdf-parse failed (${err.message}), falling back to raw text`);
    const cleanFallback = cleanText(buffer.toString('utf-8'));
    DocumentSanityValidator.validate(cleanFallback);
    return cleanFallback;
  }
}

/** Cleans extracted text: removes null bytes, normalizes newlines, collapses whitespace. */
function cleanText(text: string): string {
  return text
    .replace(/\0/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
