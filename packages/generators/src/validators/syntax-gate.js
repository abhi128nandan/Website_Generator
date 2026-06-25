"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntaxGate = void 0;
var ts = require("typescript");
var SyntaxGate = /** @class */ (function () {
    function SyntaxGate() {
    }
    SyntaxGate.validate = function (content, isTsx) {
        // 1. Check for Forbidden Tokens
        for (var _i = 0, _a = this.FORBIDDEN_TOKENS; _i < _a.length; _i++) {
            var token = _a[_i];
            if (content.includes(token)) {
                return {
                    isValid: false,
                    error: "Contains forbidden LLM reasoning artifact token: \"".concat(token, "\"")
                };
            }
        }
        // 2. Fast AST Validation
        var sourceFile = ts.createSourceFile(isTsx ? 'temp.tsx' : 'temp.ts', content, ts.ScriptTarget.Latest, true, isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        var parseDiagnostics = sourceFile.parseDiagnostics;
        if (parseDiagnostics && parseDiagnostics.length > 0) {
            // Get the first error message
            var firstError = parseDiagnostics[0];
            var message = typeof firstError.messageText === 'string'
                ? firstError.messageText
                : firstError.messageText.messageText;
            var pos = sourceFile.getLineAndCharacterOfPosition(firstError.start);
            return {
                isValid: false,
                error: "Syntax Error at line ".concat(pos.line + 1, ": ").concat(message)
            };
        }
        return { isValid: true };
    };
    SyntaxGate.FORBIDDEN_TOKENS = [
        '<think',
        '</think',
        '<reasoning',
        '</reasoning',
        '~~~',
        'Here is the code',
        'This component',
        'I will create',
        '```'
    ];
    return SyntaxGate;
}());
exports.SyntaxGate = SyntaxGate;
