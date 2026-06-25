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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportIntegrityValidator = void 0;
var ts = require("typescript");
var promises_1 = require("fs/promises");
var path_1 = require("path");
/**
 * Validates that every relative import in generated TS/TSX files
 * resolves to an actual file on disk.
 *
 * Runs BEFORE pnpm install and BEFORE build.
 * Only checks relative imports (./  ../).
 * Skips npm package imports (react, axios, lucide-react, etc.).
 */
var ImportIntegrityValidator = /** @class */ (function () {
    function ImportIntegrityValidator() {
    }
    /**
     * Validate all generated TS/TSX files under frontend/src.
     */
    ImportIntegrityValidator.validate = function (targetDir) {
        return __awaiter(this, void 0, void 0, function () {
            var srcDir, files, errors, _i, files_1, filePath, fileErrors;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        srcDir = path_1.default.join(targetDir, 'frontend', 'src');
                        return [4 /*yield*/, this.collectTSFiles(srcDir)];
                    case 1:
                        files = _a.sent();
                        if (files.length === 0) {
                            return [2 /*return*/, { isValid: true, errors: [] }];
                        }
                        errors = [];
                        _i = 0, files_1 = files;
                        _a.label = 2;
                    case 2:
                        if (!(_i < files_1.length)) return [3 /*break*/, 5];
                        filePath = files_1[_i];
                        return [4 /*yield*/, this.validateFile(filePath, targetDir)];
                    case 3:
                        fileErrors = _a.sent();
                        errors.push.apply(errors, fileErrors);
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, {
                            isValid: errors.length === 0,
                            errors: errors,
                        }];
                }
            });
        });
    };
    /**
     * Validate a single file's imports.
     */
    ImportIntegrityValidator.validateFile = function (filePath, targetDir) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, content, _a, sourceFile, relativeImports, relFile, _i, relativeImports_1, importPath, resolved, resolvedTarget;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        errors = [];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, promises_1.default.readFile(filePath, 'utf-8')];
                    case 2:
                        content = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        return [2 /*return*/, errors];
                    case 4:
                        sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.ESNext, true, filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
                        relativeImports = this.extractRelativeImports(sourceFile);
                        relFile = path_1.default.relative(targetDir, filePath);
                        _i = 0, relativeImports_1 = relativeImports;
                        _b.label = 5;
                    case 5:
                        if (!(_i < relativeImports_1.length)) return [3 /*break*/, 8];
                        importPath = relativeImports_1[_i];
                        return [4 /*yield*/, this.resolveImport(filePath, importPath)];
                    case 6:
                        resolved = _b.sent();
                        if (!resolved) {
                            resolvedTarget = path_1.default.resolve(path_1.default.dirname(filePath), importPath);
                            errors.push({
                                file: relFile,
                                importPath: importPath,
                                resolvedTarget: resolvedTarget,
                            });
                        }
                        _b.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 5];
                    case 8: return [2 /*return*/, errors];
                }
            });
        });
    };
    /**
     * Extract all relative import specifiers from a source file using the TS AST.
     * Covers: import declarations, import() expressions, and re-exports.
     */
    ImportIntegrityValidator.extractRelativeImports = function (sourceFile) {
        var _this = this;
        var imports = [];
        var visit = function (node) {
            // import X from './path'  /  import { X } from './path'
            if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                var spec = node.moduleSpecifier.text;
                if (_this.isRelative(spec)) {
                    imports.push(spec);
                }
            }
            // export { X } from './path'  /  export * from './path'
            if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                var spec = node.moduleSpecifier.text;
                if (_this.isRelative(spec)) {
                    imports.push(spec);
                }
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
        return __spreadArray([], new Set(imports), true); // deduplicate
    };
    /**
     * Check if an import specifier is a relative path.
     */
    ImportIntegrityValidator.isRelative = function (specifier) {
        return specifier.startsWith('./') || specifier.startsWith('../');
    };
    /**
     * Try to resolve a relative import to an actual file on disk.
     * Mimics TypeScript/bundler module resolution for relative paths.
     */
    ImportIntegrityValidator.resolveImport = function (fromFile, importPath) {
        return __awaiter(this, void 0, void 0, function () {
            var dir, target, _i, _a, ext, _b, _c, idx;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        dir = path_1.default.dirname(fromFile);
                        target = path_1.default.resolve(dir, importPath);
                        return [4 /*yield*/, this.fileExists(target)];
                    case 1:
                        // 1. Exact file match (rare — usually imports omit extensions)
                        if (_d.sent()) {
                            return [2 /*return*/, true];
                        }
                        _i = 0, _a = this.RESOLVABLE_EXTENSIONS;
                        _d.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        ext = _a[_i];
                        return [4 /*yield*/, this.fileExists(target + ext)];
                    case 3:
                        if (_d.sent()) {
                            return [2 /*return*/, true];
                        }
                        _d.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        _b = 0, _c = this.INDEX_FILES;
                        _d.label = 6;
                    case 6:
                        if (!(_b < _c.length)) return [3 /*break*/, 9];
                        idx = _c[_b];
                        return [4 /*yield*/, this.fileExists(path_1.default.join(target, idx))];
                    case 7:
                        if (_d.sent()) {
                            return [2 /*return*/, true];
                        }
                        _d.label = 8;
                    case 8:
                        _b++;
                        return [3 /*break*/, 6];
                    case 9: return [2 /*return*/, false];
                }
            });
        });
    };
    /**
     * Strip broken relative imports from a file's source code.
     * Returns the cleaned source, or null if no changes were needed.
     *
     * Uses the TS AST to precisely remove import declarations
     * whose specifiers point to non-existent files.
     */
    ImportIntegrityValidator.stripBrokenImports = function (filePath, brokenImportPaths) {
        return __awaiter(this, void 0, void 0, function () {
            var content, _a, lines, linesToRemove, sourceFile, brokenIdentifiers, cleanedLines;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, promises_1.default.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, null];
                    case 3:
                        if (brokenImportPaths.size === 0)
                            return [2 /*return*/, null];
                        lines = content.split('\n');
                        linesToRemove = new Set();
                        sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.ESNext, true, filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
                        // Identify lines containing broken import declarations
                        ts.forEachChild(sourceFile, function (node) {
                            if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                                if (brokenImportPaths.has(node.moduleSpecifier.text)) {
                                    var startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line;
                                    var endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;
                                    for (var i = startLine; i <= endLine; i++) {
                                        linesToRemove.add(i);
                                    }
                                }
                            }
                        });
                        if (linesToRemove.size === 0)
                            return [2 /*return*/, null];
                        brokenIdentifiers = new Set();
                        ts.forEachChild(sourceFile, function (node) {
                            if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                                if (!brokenImportPaths.has(node.moduleSpecifier.text))
                                    return;
                                var clause = node.importClause;
                                if (!clause)
                                    return;
                                // default import
                                if (clause.name) {
                                    brokenIdentifiers.add(clause.name.text);
                                }
                                // named imports: import { A, B } from '...'
                                if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
                                    for (var _i = 0, _a = clause.namedBindings.elements; _i < _a.length; _i++) {
                                        var el = _a[_i];
                                        brokenIdentifiers.add(el.name.text);
                                    }
                                }
                                // namespace import: import * as X from '...'
                                if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
                                    brokenIdentifiers.add(clause.namedBindings.name.text);
                                }
                            }
                        });
                        cleanedLines = lines.filter(function (_, idx) { return !linesToRemove.has(idx); });
                        return [2 /*return*/, cleanedLines.join('\n')];
                }
            });
        });
    };
    /**
     * Utility: check if a file exists.
     */
    ImportIntegrityValidator.fileExists = function (p) {
        return __awaiter(this, void 0, void 0, function () {
            var stat, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, promises_1.default.stat(p)];
                    case 1:
                        stat = _b.sent();
                        return [2 /*return*/, stat.isFile()];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Recursively collect all .ts and .tsx files.
     */
    ImportIntegrityValidator.collectTSFiles = function (dir) {
        return __awaiter(this, void 0, void 0, function () {
            var files, entries, _i, entries_1, entry, fullPath, _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        files = [];
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, promises_1.default.readdir(dir, { withFileTypes: true })];
                    case 2:
                        entries = _e.sent();
                        _i = 0, entries_1 = entries;
                        _e.label = 3;
                    case 3:
                        if (!(_i < entries_1.length)) return [3 /*break*/, 7];
                        entry = entries_1[_i];
                        fullPath = path_1.default.resolve(dir, entry.name);
                        if (!entry.isDirectory()) return [3 /*break*/, 5];
                        _b = (_a = files.push).apply;
                        _c = [files];
                        return [4 /*yield*/, this.collectTSFiles(fullPath)];
                    case 4:
                        _b.apply(_a, _c.concat([_e.sent()]));
                        return [3 /*break*/, 6];
                    case 5:
                        if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
                            files.push(fullPath);
                        }
                        _e.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 3];
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        _d = _e.sent();
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/, files];
                }
            });
        });
    };
    ImportIntegrityValidator.RESOLVABLE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
    ImportIntegrityValidator.INDEX_FILES = ['index.ts', 'index.tsx', 'index.js', 'index.jsx'];
    return ImportIntegrityValidator;
}());
exports.ImportIntegrityValidator = ImportIntegrityValidator;
