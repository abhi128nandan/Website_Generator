"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeExtractor = void 0;
var ts = require("typescript");
var CodeExtractor = /** @class */ (function () {
    function CodeExtractor() {
    }
    CodeExtractor.extractCodeArtifact = function (rawOutput, isTsx, artifactName) {
        // STEP 2: REASONING REJECTION
        // Check entire raw output for reasoning tokens
        var lowerRaw = rawOutput.toLowerCase();
        var reasoningPhrases = [
            "let me", "i think", "perhaps", "maybe",
            "the component", "the hook", "the service"
        ];
        for (var _i = 0, reasoningPhrases_1 = reasoningPhrases; _i < reasoningPhrases_1.length; _i++) {
            var phrase = reasoningPhrases_1[_i];
            if (lowerRaw.includes(phrase)) {
                return { success: false, code: '', reason: "INVALID_REASONING_ARTIFACT: Reasoning detected -> '".concat(phrase, "'") };
            }
        }
        // STEP 1 & 3: STRICT CODE START DETECTION (findCodeStart)
        var validAnchorRegex = /^(import\b|export\b|interface\s+[A-Za-z0-9_]+|type\s+[A-Za-z0-9_]+|const\s+[A-Za-z0-9_]+|function\s+[A-Za-z0-9_]+|enum\s+[A-Za-z0-9_]+)/;
        // First, try to extract from markdown fences if they exist, but we still apply anchor search on the result
        var extracted = rawOutput;
        var codeFenceRegex = /```(?:[a-zA-Z0-9]*)?\n([\s\S]*?)```/i;
        var match = rawOutput.match(codeFenceRegex);
        if (match && match[1]) {
            extracted = match[1];
        }
        var lines = extracted.split('\n');
        var firstValidLineIdx = -1;
        for (var i = 0; i < lines.length; i++) {
            var lineTrim = lines[i].trim();
            if (!lineTrim)
                continue;
            if (validAnchorRegex.test(lineTrim)) {
                firstValidLineIdx = i;
                break;
            }
        }
        if (firstValidLineIdx === -1) {
            return { success: false, code: '', reason: 'INVALID_CODE_ARTIFACT: No valid code anchor found' };
        }
        // Discard everything before the first anchor
        var cleanLines = lines.slice(firstValidLineIdx);
        var finalCode = cleanLines.join('\n').trim();
        // Parse extracted output with TypeScript AST
        var sourceFile = ts.createSourceFile('temp.tsx', finalCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        var parseErrors = sourceFile.parseDiagnostics || [];
        // Reject non-code output using INVALID_CODE_ARTIFACT
        if (parseErrors.length > 0) {
            return { success: false, code: '', reason: 'INVALID_CODE_ARTIFACT: AST parsing failed', astErrors: parseErrors };
        }
        // Ensure extraction stops at valid TypeScript artifact boundaries.
        var validEndPos = finalCode.length;
        var foundExport = false;
        for (var _a = 0, _b = sourceFile.statements; _a < _b.length; _a++) {
            var stmt = _b[_a];
            if (ts.isExportAssignment(stmt) || ts.isExportDeclaration(stmt) || (ts.isVariableStatement(stmt) && stmt.modifiers && stmt.modifiers.some(function (m) { return m.kind === ts.SyntaxKind.ExportKeyword; }))) {
                foundExport = true;
                validEndPos = stmt.getEnd();
            }
            if (foundExport && stmt.getStart(sourceFile) >= validEndPos) {
                // Is it trailing garbage? Expressions or unknown syntax usually mapped to ExpressionStatement or VariableStatement
                if (ts.isExpressionStatement(stmt) || stmt.kind === ts.SyntaxKind.Unknown || ts.isVariableStatement(stmt)) {
                    validEndPos = stmt.getStart(sourceFile);
                    break;
                }
            }
        }
        finalCode = finalCode.substring(0, validEndPos).trim();
        // STEP 5: MINIMUM STRUCTURE VALIDATION
        var artifactType;
        if (artifactName.startsWith('use')) {
            artifactType = 'hook';
        }
        else if (!isTsx) {
            artifactType = 'service';
        }
        else {
            artifactType = 'component';
        }
        if (artifactType === 'component') {
            if (!finalCode.includes('export default') || !finalCode.includes('return (')) {
                return { success: false, code: '', reason: 'INVALID_CODE_ARTIFACT: Component missing export default or return (' };
            }
        }
        else if (artifactType === 'hook') {
            if (!finalCode.includes('export') || !finalCode.includes('use')) {
                return { success: false, code: '', reason: 'INVALID_CODE_ARTIFACT: Hook missing export or use' };
            }
        }
        else if (artifactType === 'service') {
            if (!finalCode.includes('export')) {
                return { success: false, code: '', reason: 'INVALID_CODE_ARTIFACT: Service missing export' };
            }
        }
        // STEP 4: TRUNCATION DETECTION (Balance Check)
        if (!this.checkBalance(finalCode, '{', '}')) {
            return { success: false, code: '', reason: 'INCOMPLETE_ARTIFACT: Unbalanced braces {}' };
        }
        if (!this.checkBalance(finalCode, '(', ')')) {
            return { success: false, code: '', reason: 'INCOMPLETE_ARTIFACT: Unbalanced parentheses ()' };
        }
        if (!this.checkBalance(finalCode, '[', ']')) {
            return { success: false, code: '', reason: 'INCOMPLETE_ARTIFACT: Unbalanced brackets []' };
        }
        return {
            success: true,
            code: finalCode,
            astErrors: parseErrors
        };
    };
    CodeExtractor.extract = function (sanitizedCode, isTsx, artifactName) {
        if (isTsx === void 0) { isTsx = true; }
        if (artifactName === void 0) { artifactName = 'Component'; }
        return this.extractCodeArtifact(sanitizedCode, isTsx, artifactName);
    };
    CodeExtractor.checkBalance = function (str, open, close) {
        var count = 0;
        for (var i = 0; i < str.length; i++) {
            if (str[i] === '\\') {
                i++;
                continue;
            }
            if (str[i] === open)
                count++;
            else if (str[i] === close)
                count--;
        }
        return count === 0;
    };
    return CodeExtractor;
}());
exports.CodeExtractor = CodeExtractor;
