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
exports.SyntaxGate = void 0;
const ts = __importStar(require("typescript"));
class SyntaxGate {
    static FORBIDDEN_TOKENS = [
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
    static validate(content, isTsx) {
        // 1. Check for Forbidden Tokens
        for (const token of this.FORBIDDEN_TOKENS) {
            if (content.includes(token)) {
                return {
                    isValid: false,
                    error: `Contains forbidden LLM reasoning artifact token: "${token}"`
                };
            }
        }
        // 2. Fast AST Validation
        const sourceFile = ts.createSourceFile(isTsx ? 'temp.tsx' : 'temp.ts', content, ts.ScriptTarget.Latest, true, isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        const parseDiagnostics = sourceFile.parseDiagnostics;
        if (parseDiagnostics && parseDiagnostics.length > 0) {
            // Get the first error message
            const firstError = parseDiagnostics[0];
            let message = typeof firstError.messageText === 'string'
                ? firstError.messageText
                : firstError.messageText.messageText;
            const pos = sourceFile.getLineAndCharacterOfPosition(firstError.start);
            return {
                isValid: false,
                error: `Syntax Error at line ${pos.line + 1}: ${message}`
            };
        }
        return { isValid: true };
    }
}
exports.SyntaxGate = SyntaxGate;
