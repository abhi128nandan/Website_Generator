"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonCodeDetector = void 0;
var ts = require("typescript");
var NonCodeDetector = /** @class */ (function () {
    function NonCodeDetector() {
    }
    NonCodeDetector.validate = function (content) {
        var trimmed = content.trim();
        if (!trimmed) {
            return { valid: false, reason: "EMPTY_RESPONSE" };
        }
        var lowerContent = trimmed.toLowerCase();
        // 1. Check for prohibited English phrases
        var prohibitedPhrases = [
            "let me think",
            "first i need",
            "the user wants",
            "let's build",
            "okay, let's",
            "we need to",
            "i should",
            "the component should",
            "the calculator should"
        ];
        for (var _i = 0, prohibitedPhrases_1 = prohibitedPhrases; _i < prohibitedPhrases_1.length; _i++) {
            var phrase = prohibitedPhrases_1[_i];
            if (lowerContent.includes(phrase)) {
                return { valid: false, reason: "CONTAINS_PLANNING_TEXT: ".concat(phrase) };
            }
        }
        // 2. Reject if first non-whitespace token is not a valid TS/TSX starter
        var validStarters = [
            'import', 'export', 'interface', 'type', 'const',
            'let', 'function', 'class', 'enum'
        ];
        var firstWord = trimmed.split(/\s+/)[0];
        if (!validStarters.includes(firstWord)) {
            return { valid: false, reason: "INVALID_START_TOKEN: ".concat(firstWord) };
        }
        // 3. Reject if more than 30% of lines are plain English sentences
        // We'll use a basic heuristic: lines that start with a capital letter, 
        // don't contain typical code symbols, and end with a period.
        var lines = trimmed.split('\n');
        var englishLineCount = 0;
        for (var _a = 0, lines_1 = lines; _a < lines_1.length; _a++) {
            var line = lines_1[_a];
            var trimmedLine = line.trim();
            if (!trimmedLine)
                continue;
            // If it's a comment, it's fine. If it's not a comment, check if it's an English sentence.
            if (!trimmedLine.startsWith('//') && !trimmedLine.startsWith('/*') && !trimmedLine.startsWith('*')) {
                var isEnglishSentence = /^[A-Z][^=;<>{}]*\.$/.test(trimmedLine);
                if (isEnglishSentence) {
                    englishLineCount++;
                }
            }
        }
        var validLinesCount = lines.filter(function (l) { return l.trim().length > 0; }).length;
        if (validLinesCount > 0 && (englishLineCount / validLinesCount) > 0.3) {
            return { valid: false, reason: "TOO_MUCH_PROSE" };
        }
        // 4. Reject if parser cannot identify a TypeScript AST root node
        try {
            var sourceFile = ts.createSourceFile('temp.tsx', trimmed, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
            // If there are no statements, it's not valid code
            if (sourceFile.statements.length === 0) {
                return { valid: false, reason: "NO_AST_STATEMENTS" };
            }
        }
        catch (err) {
            return { valid: false, reason: "AST_PARSE_ERROR: ".concat(err.message) };
        }
        return { valid: true };
    };
    return NonCodeDetector;
}());
exports.NonCodeDetector = NonCodeDetector;
