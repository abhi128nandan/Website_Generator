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
exports.ReactStructureValidator = void 0;
var ts = require("typescript");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var ReactStructureValidator = /** @class */ (function () {
    function ReactStructureValidator() {
    }
    ReactStructureValidator.validate = function (targetDir) {
        return __awaiter(this, void 0, void 0, function () {
            var srcDir, errors, appPath, _a, mainPath, mainContent, sourceFile, importsApp_1, e_1, pagesDir, pages, _loop_1, _i, pages_1, page, e_2, seenNames_1, checkDuplicates, e_3;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        srcDir = path_1.default.join(targetDir, 'frontend', 'src');
                        errors = [];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 22, , 23]);
                        appPath = path_1.default.join(srcDir, 'App.tsx');
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, promises_1.default.access(appPath)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        errors.push('App.tsx does not exist.');
                        return [3 /*break*/, 5];
                    case 5:
                        mainPath = path_1.default.join(srcDir, 'main.tsx');
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, promises_1.default.readFile(mainPath, 'utf-8')];
                    case 7:
                        mainContent = _b.sent();
                        sourceFile = ts.createSourceFile('main.tsx', mainContent, ts.ScriptTarget.ESNext, true);
                        importsApp_1 = false;
                        ts.forEachChild(sourceFile, function (node) {
                            if (ts.isImportDeclaration(node)) {
                                var moduleSpecifier = node.moduleSpecifier.text;
                                if (moduleSpecifier === './App' || moduleSpecifier === './App.tsx') {
                                    importsApp_1 = true;
                                }
                            }
                        });
                        if (!importsApp_1) {
                            errors.push('main.tsx does not import App.tsx.');
                        }
                        return [3 /*break*/, 9];
                    case 8:
                        e_1 = _b.sent();
                        errors.push('main.tsx does not exist or cannot be parsed.');
                        return [3 /*break*/, 9];
                    case 9:
                        pagesDir = path_1.default.join(srcDir, 'pages');
                        _b.label = 10;
                    case 10:
                        _b.trys.push([10, 16, , 17]);
                        return [4 /*yield*/, promises_1.default.readdir(pagesDir)];
                    case 11:
                        pages = _b.sent();
                        _loop_1 = function (page) {
                            var pagePath, pageContent, sourceFile, defaultExportCount;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        if (!page.endsWith('.tsx') && !page.endsWith('.ts'))
                                            return [2 /*return*/, "continue"];
                                        if (page === 'index.ts')
                                            return [2 /*return*/, "continue"]; // skip barrel files
                                        pagePath = path_1.default.join(pagesDir, page);
                                        return [4 /*yield*/, promises_1.default.readFile(pagePath, 'utf-8')];
                                    case 1:
                                        pageContent = _c.sent();
                                        sourceFile = ts.createSourceFile(page, pageContent, ts.ScriptTarget.ESNext, true);
                                        defaultExportCount = 0;
                                        ts.forEachChild(sourceFile, function (node) {
                                            var _a, _b;
                                            if (ts.isExportAssignment(node)) {
                                                defaultExportCount++;
                                            }
                                            else if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
                                                if (((_a = node.modifiers) === null || _a === void 0 ? void 0 : _a.some(function (m) { return m.kind === ts.SyntaxKind.DefaultKeyword; })) &&
                                                    ((_b = node.modifiers) === null || _b === void 0 ? void 0 : _b.some(function (m) { return m.kind === ts.SyntaxKind.ExportKeyword; }))) {
                                                    defaultExportCount++;
                                                }
                                            }
                                        });
                                        if (defaultExportCount !== 1) {
                                            errors.push("Page ".concat(page, " must have exactly one default export. Found ").concat(defaultExportCount, "."));
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, pages_1 = pages;
                        _b.label = 12;
                    case 12:
                        if (!(_i < pages_1.length)) return [3 /*break*/, 15];
                        page = pages_1[_i];
                        return [5 /*yield**/, _loop_1(page)];
                    case 13:
                        _b.sent();
                        _b.label = 14;
                    case 14:
                        _i++;
                        return [3 /*break*/, 12];
                    case 15: return [3 /*break*/, 17];
                    case 16:
                        e_2 = _b.sent();
                        return [3 /*break*/, 17];
                    case 17:
                        seenNames_1 = new Set();
                        checkDuplicates = function (dirPath, category) { return __awaiter(_this, void 0, void 0, function () {
                            var files, _i, files_1, file, baseName, _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, promises_1.default.readdir(dirPath)];
                                    case 1:
                                        files = _b.sent();
                                        for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                                            file = files_1[_i];
                                            if (file === 'index.ts')
                                                continue; // skip barrel files
                                            baseName = path_1.default.basename(file, path_1.default.extname(file));
                                            if (seenNames_1.has(baseName)) {
                                                errors.push("Duplicate name detected: ".concat(baseName, " is used in multiple places (found in ").concat(category, ")."));
                                            }
                                            else {
                                                seenNames_1.add(baseName);
                                            }
                                        }
                                        return [3 /*break*/, 3];
                                    case 2:
                                        _a = _b.sent();
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, checkDuplicates(path_1.default.join(srcDir, 'components'), 'components')];
                    case 18:
                        _b.sent();
                        return [4 /*yield*/, checkDuplicates(path_1.default.join(srcDir, 'hooks'), 'hooks')];
                    case 19:
                        _b.sent();
                        return [4 /*yield*/, checkDuplicates(path_1.default.join(srcDir, 'services'), 'services')];
                    case 20:
                        _b.sent();
                        return [4 /*yield*/, checkDuplicates(path_1.default.join(srcDir, 'pages'), 'pages')];
                    case 21:
                        _b.sent();
                        return [3 /*break*/, 23];
                    case 22:
                        e_3 = _b.sent();
                        errors.push("Structure validation encountered an unexpected error: ".concat(e_3.message));
                        return [3 /*break*/, 23];
                    case 23: return [2 /*return*/, {
                            isValid: errors.length === 0,
                            errors: errors
                        }];
                }
            });
        });
    };
    return ReactStructureValidator;
}());
exports.ReactStructureValidator = ReactStructureValidator;
