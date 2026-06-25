"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtifactIntegrityValidator = void 0;
var ts = require("typescript");
var reasoning_detector_1 = require("./reasoning-detector");
var ArtifactIntegrityValidator = /** @class */ (function () {
    function ArtifactIntegrityValidator() {
    }
    ArtifactIntegrityValidator.validate = function (content, artifactName, isTsx) {
        var trimmed = content.trim();
        if (!trimmed) {
            return { valid: false, reason: "Empty response" };
        }
        var preview = trimmed.substring(0, 100).replace(/\n/g, ' ');
        // Length check
        if (trimmed.length < 30) {
            return { valid: false, reason: "Output length < minimum threshold", preview: preview };
        }
        var lower = trimmed.toLowerCase();
        // Specific phrase check
        var detectorResult = reasoning_detector_1.ReasoningDetector.detectReasoning(trimmed);
        if (detectorResult.hasReasoning) {
            return { valid: false, reason: "Contains natural language phrase: '".concat(detectorResult.matchedPhrase, "'"), preview: preview };
        }
        // Start check
        var validStarters = ['import', 'export', 'interface', 'type', 'const', 'function', 'let', 'class'];
        var firstWord = trimmed.split(/\s+/)[0];
        if (!validStarters.includes(firstWord)) {
            return { valid: false, reason: "Does not start with valid TS token. Started with: '".concat(firstWord, "'"), preview: preview };
        }
        // TSX Balance Check for braces, parentheses, quotes
        if (!this.checkBalance(trimmed, '{', '}')) {
            return { valid: false, reason: "INCOMPLETE_ARTIFACT: Unbalanced braces {}", preview: preview };
        }
        if (!this.checkBalance(trimmed, '(', ')')) {
            return { valid: false, reason: "INCOMPLETE_ARTIFACT: Unbalanced parentheses ()", preview: preview };
        }
        if (isTsx) {
            if (!this.checkJsxBalance(trimmed)) {
                return { valid: false, reason: "INCOMPLETE_ARTIFACT: Unbalanced JSX angle brackets <>", preview: preview };
            }
        }
        if (!this.checkQuotesBalance(trimmed, '"') || !this.checkQuotesBalance(trimmed, "'") || !this.checkQuotesBalance(trimmed, '`')) {
            return { valid: false, reason: "INCOMPLETE_ARTIFACT: Unbalanced quotes", preview: preview };
        }
        // AST-based Validation
        var sourceFile = ts.createSourceFile('temp.tsx', trimmed, ts.ScriptTarget.Latest, true, isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        var hasExport = false;
        var hasJsxReturn = false;
        var hasHookFunction = false;
        var checkNode = function (node) {
            var _a;
            // Check for exports
            if (ts.isExportAssignment(node) ||
                ts.isExportDeclaration(node) ||
                (ts.canHaveModifiers(node) && ((_a = ts.getModifiers(node)) === null || _a === void 0 ? void 0 : _a.some(function (m) { return m.kind === ts.SyntaxKind.ExportKeyword; })))) {
                hasExport = true;
            }
            // Check for JSX return in components
            if (isTsx && ts.isReturnStatement(node) && node.expression) {
                var expr = node.expression;
                if (ts.isJsxElement(expr) ||
                    ts.isJsxSelfClosingElement(expr) ||
                    ts.isJsxFragment(expr) ||
                    (ts.isParenthesizedExpression(expr) && (ts.isJsxElement(expr.expression) ||
                        ts.isJsxSelfClosingElement(expr.expression) ||
                        ts.isJsxFragment(expr.expression)))) {
                    hasJsxReturn = true;
                }
                else if (ts.isConditionalExpression(expr)) {
                    // Basic support for ternary return
                    hasJsxReturn = true;
                }
            }
            // Check for hook functions
            if (!isTsx && artifactName.startsWith('use')) {
                if (ts.isFunctionDeclaration(node) && node.name && node.name.text.startsWith('use')) {
                    hasHookFunction = true;
                }
                else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text.startsWith('use')) {
                    hasHookFunction = true;
                }
            }
            ts.forEachChild(node, checkNode);
        };
        checkNode(sourceFile);
        if (!hasExport) {
            return { valid: false, reason: "Missing export statement", preview: preview };
        }
        if (isTsx && !hasJsxReturn) {
            // It's possible the component just returns null or fragments, but we expect UI
            // Fallback check just in case AST traversal missed something nested
            if (!trimmed.includes('return <') && !trimmed.includes('return (')) {
                return { valid: false, reason: "Component missing JSX return statement", preview: preview };
            }
        }
        else if (!isTsx && artifactName.startsWith('use')) {
            if (!hasHookFunction) {
                return { valid: false, reason: "Hook missing function definition starting with 'use'", preview: preview };
            }
        }
        return { valid: true };
    };
    ArtifactIntegrityValidator.checkBalance = function (str, open, close) {
        var count = 0;
        for (var i = 0; i < str.length; i++) {
            if (str[i] === '\\') {
                i++;
                continue;
            } // Skip escaped characters
            if (str[i] === open)
                count++;
            else if (str[i] === close)
                count--;
        }
        return count === 0;
    };
    ArtifactIntegrityValidator.checkQuotesBalance = function (str, quote) {
        var count = 0;
        var escaped = false;
        for (var i = 0; i < str.length; i++) {
            if (str[i] === '\\') {
                escaped = !escaped;
                continue;
            }
            if (str[i] === quote && !escaped) {
                count++;
            }
            escaped = false;
        }
        return count % 2 === 0;
    };
    ArtifactIntegrityValidator.checkJsxBalance = function (str) {
        // Strip common math/arrow operators before counting
        var cleaned = str.replace(/=>/g, '').replace(/<=/g, '').replace(/>=/g, '');
        var opens = (cleaned.match(/</g) || []).length;
        var closes = (cleaned.match(/>/g) || []).length;
        return opens === closes;
    };
    return ArtifactIntegrityValidator;
}());
exports.ArtifactIntegrityValidator = ArtifactIntegrityValidator;
