import { Logger } from '@paperclip/shared';
import * as pdfParse from 'pdf-parse';

export class DocumentParser {
  /**
   * Extracts raw text from an uploaded file buffer.
   * Handles PDF, TXT, and Markdown files.
   *
   * @param buffer The file content as a Buffer.
   * @param mimeType The MIME type of the file.
   * @returns Cleaned raw text string.
   */
  static async extractRawText(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        Logger.info('[Parser] Parsing PDF document...');
        
        let parser: any = pdfParse;
        
        // Handle varying shapes of CJS/ESM interop imports
        if (typeof parser !== 'function' && parser && typeof parser.default === 'function') {
          parser = parser.default;
        }
        if (typeof parser !== 'function' && parser && typeof parser.pdf === 'function') {
          parser = parser.pdf;
        }
        if (typeof parser !== 'function') {
          throw new Error('PDF parser function not found due to ESM/CJS mismatch.');
        }
            
        let data;
        try {
          data = await parser(buffer);
          Logger.info('[Parser] PDF parsed successfully');
        } catch (pdfError: any) {
          Logger.warn(`[Parser] PDF parse failed (${pdfError.message}), falling back to text parsing...`);
          // Fallback in case of a fake/malformed PDF (like a .txt saved as .pdf)
          data = { text: buffer.toString('utf-8') };
        }
        const text = this.cleanText(data.text);
        Logger.info(`[Parser] Extracted chars: ${text.length}`);
        return text;
      } else if (
        mimeType === 'text/plain' ||
        mimeType === 'text/markdown' ||
        mimeType === 'application/octet-stream' // sometimes MD files are sent as octet-stream
      ) {
        Logger.info('[Parser] Parsing text/markdown document...');
        const text = this.cleanText(buffer.toString('utf-8'));
        Logger.info(`[Parser] Extracted chars: ${text.length}`);
        return text;
      } else {
        Logger.error(`[Parser] Unsupported mime type: ${mimeType}`);
        throw new Error(`Unsupported mime type: ${mimeType}`);
      }
    } catch (err: any) {
      Logger.error(`[Parser] Document parsing failed: ${err.message}`, err);
      throw new Error(`Document parsing failed: ${err.message}`);
    }
  }

  /**
   * Cleans text by removing excessive whitespace and null characters.
   */
  private static cleanText(text: string): string {
    return text
      .replace(/\0/g, '') // Remove null bytes
      .replace(/\r\n/g, '\n') // Normalize newlines
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .trim();
  }
}
