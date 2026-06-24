"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentParser = void 0;
const shared_1 = require("@website-generator/shared");
const pdfParse = __importStar(require("pdf-parse"));
class DocumentParser {
    /**
     * Extracts raw text from an uploaded file buffer.
     * Handles PDF, TXT, and Markdown files.
     *
     * @param buffer The file content as a Buffer.
     * @param mimeType The MIME type of the file.
     * @returns Cleaned raw text string.
     */
    static async extractRawText(buffer, mimeType) {
        try {
            if (mimeType === 'application/pdf') {
                shared_1.Logger.info('[Parser] Parsing PDF document...');
                let parser = pdfParse;
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
                    shared_1.Logger.info('[Parser] PDF parsed successfully');
                }
                catch (pdfError) {
                    shared_1.Logger.warn(`[Parser] PDF parse failed (${pdfError.message}), falling back to text parsing...`);
                    // Fallback in case of a fake/malformed PDF (like a .txt saved as .pdf)
                    data = { text: buffer.toString('utf-8') };
                }
                const text = this.cleanText(data.text);
                shared_1.Logger.info(`[Parser] Extracted chars: ${text.length}`);
                return text;
            }
            else if (mimeType === 'text/plain' ||
                mimeType === 'text/markdown' ||
                mimeType === 'application/octet-stream' // sometimes MD files are sent as octet-stream
            ) {
                shared_1.Logger.info('[Parser] Parsing text/markdown document...');
                const text = this.cleanText(buffer.toString('utf-8'));
                shared_1.Logger.info(`[Parser] Extracted chars: ${text.length}`);
                return text;
            }
            else {
                shared_1.Logger.error(`[Parser] Unsupported mime type: ${mimeType}`);
                throw new Error(`Unsupported mime type: ${mimeType}`);
            }
        }
        catch (err) {
            shared_1.Logger.error(`[Parser] Document parsing failed: ${err.message}`, err);
            throw new Error(`Document parsing failed: ${err.message}`);
        }
    }
    /**
     * Cleans text by removing excessive whitespace and null characters.
     */
    static cleanText(text) {
        return text
            .replace(/\0/g, '') // Remove null bytes
            .replace(/\r\n/g, '\n') // Normalize newlines
            .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
            .trim();
    }
}
exports.DocumentParser = DocumentParser;
