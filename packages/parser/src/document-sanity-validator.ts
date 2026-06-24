import { Logger } from '@website-generator/shared';

export class DocumentSanityValidator {
  static validate(text: string): void {
    if (!text || text.length === 0) {
      throw new Error('DOCUMENT_EXTRACTION_INVALID: Extracted document is empty.');
    }

    if (text.length < 100) {
      const metadataKeywords = ['ReportLab', 'PDF generated', 'CreationDate', 'Producer'];
      let metadataLength = 0;
      
      for (const kw of metadataKeywords) {
        const count = text.split(kw).length - 1;
        metadataLength += count * kw.length;
      }
      
      const metadataRatio = metadataLength / text.length;
      
      if (metadataRatio > 0.4) {
        throw new Error(`DOCUMENT_EXTRACTION_INVALID: Document length is ${text.length} (< 100) and consists mostly of PDF metadata (ratio: ${(metadataRatio * 100).toFixed(1)}%).`);
      }
    }
  }
}
