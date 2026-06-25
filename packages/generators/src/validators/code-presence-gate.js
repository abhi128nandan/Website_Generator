"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodePresenceGate = void 0;
var reasoning_detector_1 = require("./reasoning-detector");
var CodePresenceGate = /** @class */ (function () {
    function CodePresenceGate() {
    }
    CodePresenceGate.validate = function (code) {
        var trimmed = code.trimStart().toLowerCase();
        var detectorResult = reasoning_detector_1.ReasoningDetector.detectReasoning(trimmed);
        if (detectorResult.hasReasoning) {
            return { isValid: false, reason: "REASONING_DETECTED: Output contains reasoning phrase '".concat(detectorResult.matchedPhrase, "'") };
        }
        return { isValid: true };
    };
    return CodePresenceGate;
}());
exports.CodePresenceGate = CodePresenceGate;
