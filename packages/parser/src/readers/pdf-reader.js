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
exports.readPdf = readPdf;
const shared_1 = require("@website-generator/shared");
const pdfParse = __importStar(require("pdf-parse"));
const document_sanity_validator_1 = require("../document-sanity-validator");
/**
 * Extracts raw text from a PDF buffer.
 *
 * Uses pdf-parse with CJS/ESM interop handling (same pattern as
 * the existing ai-engine/parser.ts). Falls back to raw UTF-8
 * decoding for malformed PDFs.
 */
async function readPdf(buffer) {
    shared_1.Logger.info('[Parser:PDF] Parsing PDF document...');
    // Resolve the actual callable from CJS/ESM interop variations
    let parser = pdfParse;
    if (typeof parser !== 'function' && parser && typeof parser.default === 'function') {
        parser = parser.default;
    }
    if (typeof parser !== 'function' && parser && typeof parser.pdf === 'function') {
        parser = parser.pdf;
    }
    if (typeof parser !== 'function') {
        shared_1.Logger.warn('[Parser:PDF] pdf-parse function not resolved, falling back to raw text');
        return cleanText(buffer.toString('utf-8'));
    }
    try {
        const data = await parser(buffer);
        shared_1.Logger.info(`[Parser:PDF] Extracted ${data.text.length} characters`);
        const clean = cleanText(data.text);
        document_sanity_validator_1.DocumentSanityValidator.validate(clean);
        return clean;
    }
    catch (err) {
        if (err.message?.includes('DOCUMENT_EXTRACTION_INVALID')) {
            throw err;
        }
        shared_1.Logger.warn(`[Parser:PDF] pdf-parse failed (${err.message}), falling back to raw text`);
        const cleanFallback = cleanText(buffer.toString('utf-8'));
        document_sanity_validator_1.DocumentSanityValidator.validate(cleanFallback);
        return cleanFallback;
    }
}
/** Cleans extracted text: removes null bytes, normalizes newlines, collapses whitespace. */
function cleanText(text) {
    return text
        .replace(/\0/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
