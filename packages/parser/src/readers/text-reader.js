"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readText = readText;
const shared_1 = require("@website-generator/shared");
/**
 * Reads plain text input with basic cleanup.
 * This is the simplest reader — just hygiene normalization.
 */
function readText(input) {
    const text = Buffer.isBuffer(input) ? input.toString('utf-8') : input;
    shared_1.Logger.info(`[Parser:Text] Processing plain text (${text.length} chars)`);
    return text
        .replace(/\0/g, '') // Remove null bytes
        .replace(/\r\n/g, '\n') // Normalize CRLF → LF
        .replace(/\r/g, '\n') // Normalize CR → LF
        .replace(/\n{3,}/g, '\n\n') // Collapse excessive blank lines
        .replace(/\t/g, '  ') // Normalize tabs to spaces
        .trim();
}
