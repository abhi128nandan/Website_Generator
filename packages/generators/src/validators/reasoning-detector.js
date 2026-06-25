"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReasoningDetector = void 0;
var ReasoningDetector = /** @class */ (function () {
    function ReasoningDetector() {
    }
    ReasoningDetector.detectReasoning = function (targetText) {
        var lowerText = targetText.toLowerCase();
        for (var _i = 0, _a = this.FORBIDDEN_PHRASES; _i < _a.length; _i++) {
            var phrase = _a[_i];
            // Escape any special regex characters in the phrase
            var escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
            // Use word boundaries for safe matching
            var regex = new RegExp("\\b".concat(escapedPhrase, "\\b"), 'i');
            if (regex.test(lowerText)) {
                return { hasReasoning: true, matchedPhrase: phrase };
            }
        }
        return { hasReasoning: false };
    };
    ReasoningDetector.FORBIDDEN_PHRASES = [
        "let me",
        "i think",
        "perhaps",
        "maybe",
        "okay",
        "the component",
        "the hook",
        "the service",
        "the props",
        "interface for props",
        "function for",
        "planning text",
        "design discussion",
        "architectural discussion",
        "component reasoning",
        "unfinished thoughts",
        "i will",
        "let's",
        "probably",
        "the component should",
        "the hook should",
        "hmm",
        "for example",
        "let me think",
        "the user wants",
        "first we",
        "next we",
        "i'll",
        "let's create",
        "we need to",
        "interface would be something like",
        "function will be called",
        "the user said"
    ];
    return ReasoningDetector;
}());
exports.ReasoningDetector = ReasoningDetector;
