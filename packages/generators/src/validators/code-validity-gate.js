"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeValidityGate = void 0;
var reasoning_detector_1 = require("./reasoning-detector");
var CodeValidityGate = /** @class */ (function () {
    function CodeValidityGate() {
    }
    CodeValidityGate.validate = function (extractedCode) {
        var trimmed = extractedCode.trimStart();
        if (!trimmed) {
            return { isValid: false, reason: 'INVALID_TYPESCRIPT_ARTIFACT: Empty output' };
        }
        // 1. First non-whitespace token check
        var validStarts = ['import', 'export', 'interface', 'type', 'const', 'function', 'enum'];
        var firstWord = trimmed.split(/[\s(;{]+/, 1)[0];
        if (!validStarts.includes(firstWord)) {
            return { isValid: false, reason: "INVALID_TYPESCRIPT_ARTIFACT: Starts with invalid token '".concat(firstWord, "'") };
        }
        // 2. Reject reasoning indicators before the first TypeScript declaration
        var lines = trimmed.split('\n');
        // We will consider lines up to the first actual block/assignment as 'preamble' to check.
        // Since CodeExtractor already sliced to a valid start, the first line IS a declaration or import.
        // But we will check the first 20 lines just in case reasoning is embedded in comments or immediately after imports.
        var linesToCheck = lines.slice(0, 20).join('\n');
        var detectorResult = reasoning_detector_1.ReasoningDetector.detectReasoning(linesToCheck);
        if (detectorResult.hasReasoning) {
            return { isValid: false, reason: "INVALID_TYPESCRIPT_ARTIFACT: Contains reasoning indicator '".concat(detectorResult.matchedPhrase, "'") };
        }
        return { isValid: true };
    };
    return CodeValidityGate;
}());
exports.CodeValidityGate = CodeValidityGate;
