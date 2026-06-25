"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTValidator = void 0;
var ts = require("typescript");
var promises_1 = require("fs/promises");
var path_1 = require("path");
/**
 * TypeScript diagnostic codes to SKIP during pre-install validation.
 * These are all caused by missing node_modules (react, react-dom, lucide-react, etc.)
 * and will be resolved by `pnpm install`. Checking them before install produces
 * hundreds of false positives that waste all repair attempts.
 */
var SKIP_DIAGNOSTIC_CODES = new Set([
    // 2307 is NOT skipped globally — handled selectively below
    //       (keep for relative imports, skip for npm packages)
    2503, // Cannot find namespace 'X'
    2304, // Cannot find name 'X' (often JSX intrinsics when react types missing)
    2580, // Cannot find name 'require'
    2688, // Cannot find type definition file for 'X'
    2339, // Property 'X' does not exist on type 'Y' (JSX intrinsics when react missing)
    2786, // 'X' cannot be used as a JSX component
    2686, // 'X' refers to a UMD global
    6142, // Module 'X' was resolved to 'Y', but '--jsx' is not set
    17004, // Cannot use JSX unless the '--jsx' flag is provided
    7016, // Could not find a declaration file for module 'X'
    7006, // Parameter 'X' implicitly has an 'any' type (strict mode, not a code bug)
    7031, // Binding element 'X' implicitly has an 'any' type (strict mode)
    7005, // Variable 'X' implicitly has an 'any' type
    2877, // This JSX tag requires the module path 'react/jsx-runtime' to exist (variant 1)
    2875, // This JSX tag requires the module path 'react/jsx-runtime' to exist (variant 2)
    2874, // This JSX tag requires 'React' to be in scope
    1343, // The 'import.meta' meta-property is only allowed when --module is ... (Vite handles this)
    2614, // Module 'X' has no exported member 'Y' (often due to missing types resolution)
    2551, // Property 'X' does not exist on type 'Y'. Did you mean 'Z'? (cascading from missing types)
]);
var ASTValidator = /** @class */ (function () {
    function ASTValidator() {
    }
    /**
     * Validates the generated TS/TSX files using the TypeScript Compiler API.
     *
     * This runs BEFORE `pnpm install`, so it deliberately skips errors caused by
     * missing node_modules (module resolution, JSX runtime, implicit any from
     * missing type declarations).
     *
     * It focuses on catching real code-structural issues:
     * - Syntax errors (malformed code)
     * - Duplicate declarations (same identifier declared twice)
     * - Duplicate default exports
     * - Other structural TypeScript errors
     */
    ASTValidator.validate = function (targetDir) {
        return __awaiter(this, void 0, void 0, function () {
            function collectFiles(dir) {
                return __awaiter(this, void 0, void 0, function () {
                    var entries, _i, entries_1, entry, res, e_2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 7, , 8]);
                                return [4 /*yield*/, promises_1.default.readdir(dir, { withFileTypes: true })];
                            case 1:
                                entries = _a.sent();
                                _i = 0, entries_1 = entries;
                                _a.label = 2;
                            case 2:
                                if (!(_i < entries_1.length)) return [3 /*break*/, 6];
                                entry = entries_1[_i];
                                res = path_1.default.resolve(dir, entry.name);
                                if (res.includes('node_modules') || res.includes('dist') || res.includes('build') || res.includes('coverage') || res.includes('.generated') || res.includes('.logs'))
                                    return [3 /*break*/, 5];
                                if (!entry.isDirectory()) return [3 /*break*/, 4];
                                return [4 /*yield*/, collectFiles(res)];
                            case 3:
                                _a.sent();
                                return [3 /*break*/, 5];
                            case 4:
                                if (res.endsWith('.ts') || res.endsWith('.tsx')) {
                                    fileNames.push(res);
                                }
                                _a.label = 5;
                            case 5:
                                _i++;
                                return [3 /*break*/, 2];
                            case 6: return [3 /*break*/, 8];
                            case 7:
                                e_2 = _a.sent();
                                return [3 /*break*/, 8];
                            case 8: return [2 /*return*/];
                        }
                    });
                });
            }
            var frontendSrc, backendSrc, fileNames, errors, _i, fileNames_1, fileName, content, sourceFile, syntaxDiags, _a, syntaxDiags_1, diag, _b, line, character, message, relName, e_1, relName, program, diagnostics, uniqueMap, _c, errors_1, err, uniqueErrors, slicedErrors;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        frontendSrc = path_1.default.join(targetDir, 'frontend', 'src');
                        backendSrc = path_1.default.join(targetDir, 'backend', 'src');
                        fileNames = [];
                        return [4 /*yield*/, collectFiles(frontendSrc)];
                    case 1:
                        _d.sent();
                        return [4 /*yield*/, collectFiles(backendSrc)];
                    case 2:
                        _d.sent();
                        if (fileNames.length === 0) {
                            return [2 /*return*/, { isValid: false, errors: [{ file: 'unknown', line: 1, column: 1, code: 'NO_FILES', message: 'No TypeScript files found in frontend/src or backend/src.' }] }];
                        }
                        errors = [];
                        _i = 0, fileNames_1 = fileNames;
                        _d.label = 3;
                    case 3:
                        if (!(_i < fileNames_1.length)) return [3 /*break*/, 8];
                        fileName = fileNames_1[_i];
                        _d.label = 4;
                    case 4:
                        _d.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, promises_1.default.readFile(fileName, 'utf-8')];
                    case 5:
                        content = _d.sent();
                        sourceFile = ts.createSourceFile(fileName, content, ts.ScriptTarget.ESNext, true, // setParentNodes
                        fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
                        syntaxDiags = sourceFile.parseDiagnostics;
                        if (syntaxDiags && syntaxDiags.length > 0) {
                            for (_a = 0, syntaxDiags_1 = syntaxDiags; _a < syntaxDiags_1.length; _a++) {
                                diag = syntaxDiags_1[_a];
                                if (diag.category !== ts.DiagnosticCategory.Error)
                                    continue;
                                _b = ts.getLineAndCharacterOfPosition(sourceFile, diag.start), line = _b.line, character = _b.character;
                                message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
                                relName = path_1.default.relative(targetDir, fileName).replace(/\\/g, '/');
                                errors.push({
                                    file: relName,
                                    line: line + 1,
                                    column: character + 1,
                                    code: diag.code || 'SYNTAX',
                                    message: "[SYNTAX] ".concat(message)
                                });
                            }
                        }
                        // --- Phase 2: Duplicate declaration detection (AST walk) ---
                        ASTValidator.checkDuplicateDeclarations(sourceFile, targetDir, errors);
                        return [3 /*break*/, 7];
                    case 6:
                        e_1 = _d.sent();
                        relName = path_1.default.relative(targetDir, fileName).replace(/\\/g, '/');
                        errors.push({
                            file: relName,
                            line: 1,
                            column: 1,
                            code: 'PARSE_FAILED',
                            message: "Failed to parse: ".concat(e_1.message)
                        });
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 3];
                    case 8:
                        program = ts.createProgram(fileNames, {
                            noEmit: true,
                            strict: false, // Don't flag implicit-any etc. before deps are installed
                            target: ts.ScriptTarget.ESNext,
                            moduleResolution: ts.ModuleResolutionKind.Bundler,
                            allowImportingTsExtensions: true,
                            jsx: ts.JsxEmit.ReactJSX,
                            esModuleInterop: true,
                            skipLibCheck: true,
                            baseUrl: targetDir
                        });
                        diagnostics = ts.getPreEmitDiagnostics(program);
                        diagnostics.forEach(function (diag) {
                            if (diag.category !== ts.DiagnosticCategory.Error)
                                return;
                            // Skip diagnostics caused by missing node_modules
                            if (SKIP_DIAGNOSTIC_CODES.has(diag.code))
                                return;
                            // TS2307 "Cannot find module" — selective handling:
                            // Keep the error for relative imports (./  ../) which indicate broken generated code.
                            // Skip for npm package imports which will resolve after pnpm install.
                            if (diag.code === 2307) {
                                var message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
                                // Extract module specifier from "Cannot find module './foo' or its corresponding type declarations."
                                var moduleMatch = message.match(/Cannot find module '([^']+)'/);
                                if (moduleMatch) {
                                    var moduleName = moduleMatch[1];
                                    if (!moduleName.startsWith('./') && !moduleName.startsWith('../')) {
                                        // npm package — skip (will resolve after install)
                                        return;
                                    }
                                    // relative import — this is a real bug, keep the error
                                }
                            }
                            if (diag.file) {
                                var _a = ts.getLineAndCharacterOfPosition(diag.file, diag.start), line = _a.line, character = _a.character;
                                var message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
                                var fileName = path_1.default.relative(targetDir, diag.file.fileName).replace(/\\/g, '/');
                                errors.push({
                                    file: fileName,
                                    line: line + 1,
                                    column: character + 1,
                                    code: diag.code,
                                    message: "[TS".concat(diag.code, "] ").concat(message)
                                });
                            }
                            else {
                                errors.push({
                                    file: 'unknown',
                                    line: 1,
                                    column: 1,
                                    code: diag.code,
                                    message: "[TS".concat(diag.code, "] ").concat(ts.flattenDiagnosticMessageText(diag.messageText, '\n'))
                                });
                            }
                        });
                        uniqueMap = new Map();
                        for (_c = 0, errors_1 = errors; _c < errors_1.length; _c++) {
                            err = errors_1[_c];
                            // Use just the file as the key to only keep the very first root error found in that file
                            if (!uniqueMap.has(err.file)) {
                                uniqueMap.set(err.file, err);
                            }
                        }
                        uniqueErrors = Array.from(uniqueMap.values());
                        slicedErrors = uniqueErrors.slice(0, 20);
                        return [2 /*return*/, {
                                isValid: errors.length === 0,
                                errors: slicedErrors
                            }];
                }
            });
        });
    };
    /**
     * Walks the AST to detect duplicate top-level declarations and duplicate
     * default exports within a single file — the most common AI generation defect.
     */
    ASTValidator.checkDuplicateDeclarations = function (sourceFile, targetDir, errors) {
        var _a, _b;
        var relName = path_1.default.relative(targetDir, sourceFile.fileName).replace(/\\/g, '/');
        var topLevelNames = new Map(); // name -> count
        var defaultExportCount = 0;
        for (var _i = 0, _c = sourceFile.statements; _i < _c.length; _i++) {
            var stmt = _c[_i];
            // Count default exports
            if (ts.isExportAssignment(stmt)) {
                defaultExportCount++;
            }
            if ((ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt)) &&
                ((_a = stmt.modifiers) === null || _a === void 0 ? void 0 : _a.some(function (m) { return m.kind === ts.SyntaxKind.ExportKeyword; })) &&
                ((_b = stmt.modifiers) === null || _b === void 0 ? void 0 : _b.some(function (m) { return m.kind === ts.SyntaxKind.DefaultKeyword; }))) {
                defaultExportCount++;
            }
            // Track top-level declaration names
            var name_1 = void 0;
            if (ts.isFunctionDeclaration(stmt) && stmt.name) {
                name_1 = stmt.name.text;
            }
            else if (ts.isClassDeclaration(stmt) && stmt.name) {
                name_1 = stmt.name.text;
            }
            else if (ts.isInterfaceDeclaration(stmt)) {
                name_1 = stmt.name.text;
            }
            else if (ts.isTypeAliasDeclaration(stmt)) {
                name_1 = stmt.name.text;
            }
            else if (ts.isEnumDeclaration(stmt)) {
                name_1 = stmt.name.text;
            }
            else if (ts.isVariableStatement(stmt)) {
                for (var _d = 0, _e = stmt.declarationList.declarations; _d < _e.length; _d++) {
                    var decl = _e[_d];
                    if (ts.isIdentifier(decl.name)) {
                        var varName = decl.name.text;
                        topLevelNames.set(varName, (topLevelNames.get(varName) || 0) + 1);
                    }
                }
            }
            if (name_1) {
                topLevelNames.set(name_1, (topLevelNames.get(name_1) || 0) + 1);
            }
        }
        // Report duplicate declarations
        for (var _f = 0, topLevelNames_1 = topLevelNames; _f < topLevelNames_1.length; _f++) {
            var _g = topLevelNames_1[_f], name_2 = _g[0], count = _g[1];
            if (count > 1) {
                errors.push({
                    file: relName,
                    line: 1,
                    column: 1,
                    code: 'DUPLICATE_DECLARATION',
                    message: "[DUPLICATE] Identifier '".concat(name_2, "' is declared ").concat(count, " times at the top level")
                });
            }
        }
        // Report duplicate default exports
        if (defaultExportCount > 1) {
            errors.push({
                file: relName,
                line: 1,
                column: 1,
                code: 'DUPLICATE_DEFAULT_EXPORT',
                message: "[DUPLICATE] File has ".concat(defaultExportCount, " default exports (expected at most 1)")
            });
        }
        // Special Rule: Check for missing default exports in frontend/src/pages
        if ((relName.includes('frontend/src/pages/') || relName.includes('src/pages/')) && !relName.endsWith('index.ts') && !relName.endsWith('index.tsx')) {
            if (defaultExportCount !== 1) {
                errors.push({
                    file: relName,
                    line: 1,
                    column: 1,
                    code: 'PAGE_DEFAULT_EXPORT_MISSING',
                    message: 'Page must export exactly one default component'
                });
            }
        }
    };
    return ASTValidator;
}());
exports.ASTValidator = ASTValidator;
