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
exports.CompileGate = void 0;
const ts = __importStar(require("typescript"));
class CompileGate {
    static validate(content, isTsx) {
        // 1. Check for basic transpilation errors (invalid JSX, malformed syntax)
        const compilerOptions = {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            jsx: isTsx ? ts.JsxEmit.ReactJSX : ts.JsxEmit.None,
            strict: true,
            noEmitOnError: true,
        };
        const transpileResult = ts.transpileModule(content, {
            compilerOptions,
            fileName: isTsx ? 'temp.tsx' : 'temp.ts',
            reportDiagnostics: true,
        });
        if (transpileResult.diagnostics && transpileResult.diagnostics.length > 0) {
            // Find the first error
            const firstError = transpileResult.diagnostics.find(d => d.category === ts.DiagnosticCategory.Error);
            if (firstError) {
                const message = ts.flattenDiagnosticMessageText(firstError.messageText, '\n');
                if (firstError.file && firstError.start !== undefined) {
                    const { line } = ts.getLineAndCharacterOfPosition(firstError.file, firstError.start);
                    return { isValid: false, error: `Transpilation failed at line ${line + 1}: ${message}` };
                }
                return { isValid: false, error: `Transpilation failed: ${message}` };
            }
        }
        // 2. Fast AST Validation for missing exports
        const sourceFile = ts.createSourceFile(isTsx ? 'temp.tsx' : 'temp.ts', content, ts.ScriptTarget.Latest, true, isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        let hasExport = false;
        let hasDefaultExport = false;
        ts.forEachChild(sourceFile, node => {
            if (ts.isExportAssignment(node)) {
                hasExport = true;
                hasDefaultExport = true;
            }
            else if (ts.isExportDeclaration(node)) {
                hasExport = true;
            }
            else {
                const mods = node.modifiers;
                if (mods) {
                    const hasExportModifier = mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
                    const hasDefaultModifier = mods.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
                    if (hasExportModifier)
                        hasExport = true;
                    if (hasDefaultModifier)
                        hasDefaultExport = true;
                }
            }
        });
        if (!hasExport) {
            return { isValid: false, error: `File is missing exports. Must contain at least one export.` };
        }
        // Pages and components generally need default exports in this architecture,
        // but the prompt explicitly requires them. If it's a TSX file, let's enforce a default export.
        if (isTsx && !hasDefaultExport) {
            return { isValid: false, error: `TSX component must have exactly one default export.` };
        }
        return { isValid: true };
    }
}
exports.CompileGate = CompileGate;
