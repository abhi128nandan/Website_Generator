"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeExtractor = void 0;
var ts = require("typescript");
var reasoning_detector_1 = require("./reasoning-detector");
var CodeExtractor = /** @class */ (function () {
    function CodeExtractor() {
    }
    CodeExtractor.extractCodeArtifact = function (rawOutput, isTsx, artifactName, isSanitized) {
        if (isSanitized === void 0) { isSanitized = false; }
        // STEP 2: REASONING REJECTION
        // ALWAYS check for reasoning tokens, even if sanitized. Remove trust assumption.
        var detectorResult = reasoning_detector_1.ReasoningDetector.detectReasoning(rawOutput);
        if (detectorResult.hasReasoning) {
            return { success: false, code: '', reason: "INVALID_REASONING_ARTIFACT: Reasoning detected -> '".concat(detectorResult.matchedPhrase, "'") };
        }
        // Check for non-code English sentences at the start of raw output
        var firstLineText = rawOutput.trim().split('\n')[0];
        if (firstLineText && /^[A-Z][a-z\s]+[\.\?\!]$/.test(firstLineText.trim())) {
            return { success: false, code: '', reason: 'INVALID_REASONING_ARTIFACT: Starts with non-code English sentence' };
        }
        // STEP 1 & 3: AST Boundary Detection & Graceful Failure
        var extracted = rawOutput;
        var codeFenceRegex = /```(?:[a-zA-Z0-9-]*)\n([\s\S]*?)```/i;
        var match = rawOutput.match(codeFenceRegex);
        if (match && match[1]) {
            extracted = match[1];
        }
        var finalCode = extracted.trim();
        // REPAIR 1: Anchor Detection. Allow CSS files without TS mandatory anchors.
        var isCss = artifactName.toLowerCase().endsWith('.css') || finalCode.includes('@tailwind') || (finalCode.includes('{') && finalCode.includes(';') && !finalCode.includes('function') && !finalCode.includes('export'));
        if (isCss) {
            return { success: true, code: finalCode, astErrors: [] };
        }
        // Parse extracted output with TypeScript AST
        var sourceFile = ts.createSourceFile('temp.tsx', finalCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        var parseErrors = sourceFile.parseDiagnostics || [];
        // REPAIR 4: Graceful Failure. Never silently modify valid code. Return LOW_EXTRACTION_CONFIDENCE.
        if (parseErrors.length > 0) {
            var errorCodes = parseErrors.map(function (e) { return e.code; });
            if (errorCodes.includes(17008) || errorCodes.includes(1002) || errorCodes.includes(1005)) {
                try {
                    var fsObj = require('fs');
                    var pathObj = require('path');
                    var reportPath = pathObj.join(process.cwd(), '..', '..', 'generation-artifacts', 'truncation-classifier-report.json');
                    var reportData = [];
                    try {
                        reportData = JSON.parse(fsObj.readFileSync(reportPath, 'utf-8'));
                    }
                    catch (e) { }
                    reportData.push({
                        outputLength: finalCode.length,
                        final500Characters: finalCode.slice(-500),
                        parserDiagnostics: parseErrors.map(function (e) { var _a; return ({ code: e.code, message: typeof e.messageText === 'string' ? e.messageText : (_a = e.messageText) === null || _a === void 0 ? void 0 : _a.messageText }); }),
                        timestamp: new Date().toISOString()
                    });
                    fsObj.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
                }
                catch (e) { }
                return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: AST failures imply source ended abruptly', astErrors: parseErrors };
            }
            return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: AST parsing failed', astErrors: parseErrors };
        }
        // REPAIR 2 & 3: Helper Preservation and AST Boundary Detection
        // The previous logic sliced off helper functions after the final export.
        // We now completely trust the valid AST and preserve the entire artifact.
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
            if (!finalCode.includes('export default') || (!finalCode.includes('return (') && !finalCode.includes('return <'))) {
                return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: Component missing export default or return (' };
            }
        }
        else if (artifactType === 'hook') {
            if (!finalCode.includes('export') || !finalCode.includes('use')) {
                return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: Hook missing export or use' };
            }
        }
        else if (artifactType === 'service') {
            if (!finalCode.includes('export')) {
                return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: Service missing export' };
            }
        }
        // STEP 4: TRUNCATION DETECTION (Balance Check)
        if (!this.checkBalance(finalCode, '{', '}')) {
            return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: Unbalanced braces {}' };
        }
        if (!this.checkBalance(finalCode, '(', ')')) {
            return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: Unbalanced parentheses ()' };
        }
        if (!this.checkBalance(finalCode, '[', ']')) {
            return { success: false, code: finalCode, reason: 'LOW_EXTRACTION_CONFIDENCE: Unbalanced brackets []' };
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
        return this.extractCodeArtifact(sanitizedCode, isTsx, artifactName, true);
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
