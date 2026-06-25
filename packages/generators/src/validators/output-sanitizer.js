"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputSanitizer = void 0;
var OutputSanitizer = /** @class */ (function () {
    function OutputSanitizer() {
    }
    /**
     * Sanitizes the raw LLM output, removing reasoning blocks and markdown formatting,
     * leaving only the raw source code.
     */
    OutputSanitizer.sanitize = function (rawContent) {
        return OutputSanitizer.sanitizeWithDiagnostics(rawContent).code;
    };
    OutputSanitizer.sanitizeWithDiagnostics = function (rawContent) {
        var sanitized = rawContent.trim();
        var thinkBlockCount = 0;
        var artifactCount = 0;
        // Remove <think> blocks ONLY at the beginning of the raw output.
        // This safely strips LLM reasoning without corrupting valid JSX inside the code.
        var startThinkRegex = /^<(?:think|thinking|reasoning|analysis)>[\s\S]*?<\/(?:think|thinking|reasoning|analysis)>/i;
        while (startThinkRegex.test(sanitized)) {
            sanitized = sanitized.replace(startThinkRegex, '').trim();
            thinkBlockCount++;
        }
        // Check for markdown code blocks
        var markdownRegex = /```(?:[a-zA-Z0-9-]*)\n([\s\S]*?)```/ig;
        var match;
        var foundCodeBlock = false;
        var extractedCode = '';
        while ((match = markdownRegex.exec(sanitized)) !== null) {
            foundCodeBlock = true;
            extractedCode = match[1].trim();
            artifactCount++;
        }
        // REPAIR 1: Prevent multi-file concatenation
        if (artifactCount > 1) {
            return {
                code: 'MULTI_FILE_OUTPUT_DETECTED',
                diagnostics: {
                    rawLength: rawContent.length,
                    sanitizedLength: 0,
                    removedThinkBlocks: thinkBlockCount,
                    removedArtifacts: artifactCount,
                    remainingReasoningIndicators: [],
                    hasUnclosedReasoning: false,
                    success: false,
                    error: 'MULTI_FILE_OUTPUT_DETECTED'
                }
            };
        }
        if (foundCodeBlock) {
            sanitized = extractedCode;
        }
        else {
            // REPAIR 3: Support Raw source code responses without bias
            var prefixes = [
                /^here is.*?\n/mi,
                /^sure.*?\n/mi,
                /^this component.*?\n/mi,
                /^typescript\n/mi,
                /^tsx\n/mi
            ];
            var strippedPrefixes = false;
            do {
                strippedPrefixes = false;
                sanitized = sanitized.trimStart();
                for (var _i = 0, prefixes_1 = prefixes; _i < prefixes_1.length; _i++) {
                    var prefix = prefixes_1[_i];
                    if (prefix.test(sanitized)) {
                        sanitized = sanitized.replace(prefix, '');
                        strippedPrefixes = true;
                    }
                }
            } while (strippedPrefixes);
        }
        return {
            code: sanitized,
            diagnostics: {
                rawLength: rawContent.length,
                sanitizedLength: sanitized.length,
                removedThinkBlocks: thinkBlockCount,
                removedArtifacts: artifactCount,
                remainingReasoningIndicators: [],
                hasUnclosedReasoning: false,
                success: true
            }
        };
    };
    return OutputSanitizer;
}());
exports.OutputSanitizer = OutputSanitizer;
