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
        var sanitized = rawContent;
        var thinkBlockCount = 0;
        var artifactCount = 0;
        // 1. Count and remove well-formed think blocks
        var wellFormedThinkRegex = /<(?:think|thinking|reasoning|analysis)>[\s\S]*?<\/(?:think|thinking|reasoning|analysis)>/gi;
        var matches = rawContent.match(wellFormedThinkRegex);
        if (matches) {
            thinkBlockCount += matches.length;
        }
        sanitized = sanitized.replace(wellFormedThinkRegex, '');
        // 1b. Handle unclosed/truncated think blocks (thinking model ran out of tokens)
        // Strip from opening tag to just before the first import/export line
        var unclosedThinkRegex = /<(?:think|thinking|reasoning|analysis)>[\s\S]*?(?=\n\s*(?:import|export)\b)/gi;
        var unclosedMatches = sanitized.match(unclosedThinkRegex);
        if (unclosedMatches) {
            thinkBlockCount += unclosedMatches.length;
        }
        sanitized = sanitized.replace(unclosedThinkRegex, '\n');
        // 2. Extract markdown blocks
        var markdownRegex = /```[a-z]*\n([\s\S]*?)\n```/g;
        var match;
        var foundCodeBlock = false;
        var extractedCode = '';
        while ((match = markdownRegex.exec(sanitized)) !== null) {
            foundCodeBlock = true;
            extractedCode += match[1] + '\n';
            artifactCount++;
        }
        if (foundCodeBlock && extractedCode.trim().length > 0) {
            sanitized = extractedCode;
        }
        // 3. Remove any remaining stray unclosed opening tags
        var strayOpeningRegex = /<(?:think|thinking|reasoning|analysis)>/gi;
        var openingMatches = sanitized.match(strayOpeningRegex);
        if (openingMatches)
            thinkBlockCount += openingMatches.length;
        sanitized = sanitized.replace(strayOpeningRegex, '');
        // 4. Remove any remaining stray closing tags
        var strayClosingRegex = /<\/(?:think|thinking|reasoning|analysis)>/gi;
        sanitized = sanitized.replace(strayClosingRegex, '');
        // 5. Remove leftover markdown fences
        sanitized = sanitized.replace(/```[a-z]*\n?/g, '');
        sanitized = sanitized.replace(/```/g, '');
        // 6. Remove common conversational prefixes
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
        sanitized = sanitized.trim();
        // 7. Check if reasoning survived sanitization
        var reasoningKeywords = [
            /let me/i, /i think/i, /perhaps/i, /maybe/i, /the component/i,
            /the hook/i, /the service/i, /first we/i, /next we/i, /wait,/i, /hmm/i,
            /let's/i, /i will/i, /i'll/i
        ];
        var remainingReasoningIndicators = [];
        // Only check the first few lines to avoid false positives in valid comments
        var topLines = sanitized.split('\n').slice(0, 15).join('\n');
        for (var _a = 0, reasoningKeywords_1 = reasoningKeywords; _a < reasoningKeywords_1.length; _a++) {
            var keyword = reasoningKeywords_1[_a];
            var match_1 = topLines.match(keyword);
            if (match_1) {
                remainingReasoningIndicators.push(match_1[0]);
            }
        }
        var success = remainingReasoningIndicators.length === 0 && thinkBlockCount === 0 && artifactCount === 0;
        return {
            code: sanitized,
            diagnostics: {
                rawLength: rawContent.length,
                sanitizedLength: sanitized.length,
                removedThinkBlocks: thinkBlockCount,
                removedArtifacts: artifactCount,
                remainingReasoningIndicators: remainingReasoningIndicators,
                success: success
            }
        };
    };
    return OutputSanitizer;
}());
exports.OutputSanitizer = OutputSanitizer;
