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
exports.RepairAgent = void 0;
var shared_1 = require("@website-generator/shared");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var ast_repair_agent_1 = require("./ast-repair-agent");
var type_repair_agent_1 = require("./type-repair-agent");
var build_repair_agent_1 = require("./build-repair-agent");
var functional_repair_agent_1 = require("./functional-repair-agent");
var validation_regression_guard_1 = require("../validators/validation-regression-guard");
var RepairAgent = /** @class */ (function () {
    function RepairAgent() {
    }
    RepairAgent.logRepair = function (targetDir, message) {
        return __awaiter(this, void 0, void 0, function () {
            var logPath, timestamp, logLine, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log(message);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        logPath = path_1.default.join(targetDir, 'logs', 'generation.log');
                        timestamp = new Date().toISOString();
                        logLine = "[".concat(timestamp, "] Step 5/6 [IN-PROGRESS]: ").concat(message, "\n");
                        return [4 /*yield*/, promises_1.default.appendFile(logPath, logLine, 'utf8')];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RepairAgent.normalizeFilePath = function (targetDir, filePath) {
        var normalizedTarget = targetDir.replace(/\\/g, '/');
        var normalizedFile = filePath.replace(/\\/g, '/');
        if (normalizedFile.startsWith(normalizedTarget)) {
            normalizedFile = normalizedFile.substring(normalizedTarget.length);
            if (normalizedFile.startsWith('/'))
                normalizedFile = normalizedFile.substring(1);
        }
        return normalizedFile;
    };
    RepairAgent.extractFilePath = function (targetDir, errorString, rawError) {
        if (rawError && typeof rawError === 'object' && rawError.type === 'BUILD_DIAGNOSTIC') {
            return this.normalizeFilePath(targetDir, rawError.file);
        }
        var depMatch = errorString.match(/\[Dependency Error\]\s*(.*?):/i);
        if (depMatch)
            return this.normalizeFilePath(targetDir, depMatch[1].trim());
        var pageMatch = errorString.match(/Page\s+([^\s]+)\s+must/i);
        if (pageMatch)
            return "frontend/src/pages/".concat(pageMatch[1]);
        var missingMatch = errorString.match(/is missing:\s*(frontend[\\\/]src[\\\/][^\s]+\.tsx?)/i);
        if (missingMatch)
            return this.normalizeFilePath(targetDir, missingMatch[1]);
        var genericMatch = errorString.match(/((?:[A-Za-z]:[\\\/])?.*?(?:frontend|backend)[\\\/]src[\\\/][^\s:(]+\.tsx?)/i);
        if (genericMatch)
            return this.normalizeFilePath(targetDir, genericMatch[1]);
        return null;
    };
    RepairAgent.createMissingFiles = function (targetDir, errors) {
        return __awaiter(this, void 0, void 0, function () {
            var created, _i, errors_1, err, errStr, cssMatch, sourceMatch, cssPath, e_2, missingMatch, type, filePath, absPath, baseName, content, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        created = 0;
                        _i = 0, errors_1 = errors;
                        _a.label = 1;
                    case 1:
                        if (!(_i < errors_1.length)) return [3 /*break*/, 10];
                        err = errors_1[_i];
                        errStr = typeof err === 'object' ? JSON.stringify(err) : String(err);
                        cssMatch = errStr.match(/Cannot resolve local import '(\.\/.*?\.css)'/i);
                        if (!cssMatch) return [3 /*break*/, 5];
                        sourceMatch = this.extractFilePath(targetDir, errStr);
                        if (!sourceMatch) return [3 /*break*/, 5];
                        cssPath = path_1.default.join(targetDir, path_1.default.dirname(sourceMatch), cssMatch[1]);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, promises_1.default.writeFile(cssPath, '/* Generated CSS */\n', 'utf-8')];
                    case 3:
                        _a.sent();
                        created++;
                        return [3 /*break*/, 5];
                    case 4:
                        e_2 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        missingMatch = errStr.match(/Required (service|hook) file is missing:\s*(frontend[\\\/]src[\\\/][^\s]+\.ts)/i);
                        if (!missingMatch) return [3 /*break*/, 9];
                        type = missingMatch[1].toLowerCase();
                        filePath = missingMatch[2];
                        absPath = path_1.default.join(targetDir, filePath);
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 8, , 9]);
                        baseName = path_1.default.basename(filePath, '.ts');
                        content = '';
                        if (type === 'service') {
                            content = "export const ".concat(baseName, " = {};\n");
                        }
                        else if (type === 'hook') {
                            content = "export function ".concat(baseName, "() { return {}; }\n");
                        }
                        return [4 /*yield*/, promises_1.default.writeFile(absPath, content, 'utf-8')];
                    case 7:
                        _a.sent();
                        created++;
                        return [3 /*break*/, 9];
                    case 8:
                        e_3 = _a.sent();
                        return [3 /*break*/, 9];
                    case 9:
                        _i++;
                        return [3 /*break*/, 1];
                    case 10: return [2 /*return*/, created];
                }
            });
        });
    };
    RepairAgent.repair = function (targetDir, errors) {
        return __awaiter(this, void 0, void 0, function () {
            var errorCategory, errorString, fileSet, repairTraces, currentFingerprints, _i, errors_2, err, errorStringLocal, detectedFile, fp, last, isLoop, createdCount, initialErrorCount, snapshot, _a, fileSet_1, relFilePath, absPath, content, _b, modifiedAny, fixResult, regex, match, filePath, correctedContent, absPath, e_4, _c, fileSet_2, relFilePath, absPath, fileContent, correctedCode, lowerCode, finalErrorCount, reverted_1;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        shared_1.Logger.info("[RepairAgent] Dispatching repair. Error count: ".concat(errors.length));
                        errorCategory = 'BUILD';
                        errorString = errors.map(function (e) { return typeof e === 'object' ? JSON.stringify(e) : String(e); }).join(' ').toLowerCase();
                        if (errorString.includes('functional qa score') || errorString.includes('functional')) {
                            errorCategory = 'FUNCTIONAL';
                        }
                        else if (errorString.includes('ts1') || errorString.includes('ts2') || errorString.includes('type')) {
                            errorCategory = 'TYPE';
                        }
                        else if (errorString.includes('syntax') || errorString.includes('malformed') || errorString.includes('import') || errorString.includes('export')) {
                            errorCategory = 'AST';
                        }
                        else if (errorString.includes('vite') || errorString.includes('pnpm') || errorString.includes('build error')) {
                            errorCategory = 'BUILD';
                        }
                        shared_1.Logger.info("[RepairAgent] Error categorized as: ".concat(errorCategory));
                        return [4 /*yield*/, this.logRepair(targetDir, "[REPAIR] Triggering specialized agent: ".concat(errorCategory, "RepairAgent"))];
                    case 1:
                        _d.sent();
                        fileSet = new Set();
                        repairTraces = [];
                        currentFingerprints = [];
                        for (_i = 0, errors_2 = errors; _i < errors_2.length; _i++) {
                            err = errors_2[_i];
                            errorStringLocal = typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err);
                            detectedFile = null;
                            if (typeof err === 'object' && err !== null && 'file' in err) {
                                if ('type' in err && err.type === 'BUILD_DIAGNOSTIC') {
                                    detectedFile = this.normalizeFilePath(targetDir, err.file);
                                }
                                else {
                                    detectedFile = this.normalizeFilePath(targetDir, err.file);
                                }
                            }
                            else if (typeof err === 'string') {
                                detectedFile = this.extractFilePath(targetDir, errorStringLocal, err);
                            }
                            if (detectedFile) {
                                fileSet.add(detectedFile);
                            }
                            fp = {
                                file: detectedFile,
                                errorCategory: errorCategory,
                                errorHash: errorStringLocal
                            };
                            currentFingerprints.push(fp);
                            repairTraces.push({
                                error: errorStringLocal,
                                fileDetected: !!detectedFile,
                                file: detectedFile || '',
                                repairType: errorCategory,
                                result: 'pending'
                            });
                        }
                        last = this.lastFingerprints.get(targetDir) || [];
                        isLoop = false;
                        if (last.length > 0 && last.length === currentFingerprints.length) {
                            isLoop = currentFingerprints.every(function (fp, i) {
                                return fp.errorHash === last[i].errorHash &&
                                    fp.file === last[i].file &&
                                    fp.errorCategory === last[i].errorCategory;
                            });
                        }
                        if (!isLoop) return [3 /*break*/, 3];
                        shared_1.Logger.warn("[RepairAgent] Loop Detection: Identical failure fingerprint detected from previous attempt. Escaping infinite repair loop.");
                        repairTraces.forEach(function (t) { return t.result = 'skipped - loop detected'; });
                        return [4 /*yield*/, this.writeTraces(targetDir, repairTraces)];
                    case 2:
                        _d.sent();
                        return [2 /*return*/, false]; // Escalate immediately
                    case 3:
                        this.lastFingerprints.set(targetDir, currentFingerprints);
                        return [4 /*yield*/, this.createMissingFiles(targetDir, errors)];
                    case 4:
                        createdCount = _d.sent();
                        if (createdCount > 0) {
                            shared_1.Logger.info("[RepairAgent] Created ".concat(createdCount, " missing files."));
                        }
                        if (!(fileSet.size === 0 && errorCategory !== 'BUILD')) return [3 /*break*/, 6];
                        shared_1.Logger.warn("[RepairAgent] Could not identify specific files to repair from errors.");
                        repairTraces.forEach(function (t) { return t.result = 'skipped - no file'; });
                        return [4 /*yield*/, this.writeTraces(targetDir, repairTraces)];
                    case 5:
                        _d.sent();
                        return [2 /*return*/, false];
                    case 6: return [4 /*yield*/, validation_regression_guard_1.ValidationRegressionGuard.getErrorCount(targetDir)];
                    case 7:
                        initialErrorCount = _d.sent();
                        snapshot = new Map();
                        _a = 0, fileSet_1 = fileSet;
                        _d.label = 8;
                    case 8:
                        if (!(_a < fileSet_1.length)) return [3 /*break*/, 13];
                        relFilePath = fileSet_1[_a];
                        absPath = path_1.default.join(targetDir, relFilePath);
                        _d.label = 9;
                    case 9:
                        _d.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, promises_1.default.readFile(absPath, 'utf-8')];
                    case 10:
                        content = _d.sent();
                        snapshot.set(relFilePath, content);
                        return [3 /*break*/, 12];
                    case 11:
                        _b = _d.sent();
                        return [3 /*break*/, 12];
                    case 12:
                        _a++;
                        return [3 /*break*/, 8];
                    case 13:
                        modifiedAny = false;
                        if (!(errorCategory === 'BUILD')) return [3 /*break*/, 21];
                        return [4 /*yield*/, build_repair_agent_1.BuildRepairAgent.repair(targetDir, errors.map(function (e) { return typeof e === 'object' ? JSON.stringify(e) : String(e); }).join('\n'))];
                    case 14:
                        fixResult = _d.sent();
                        if (!fixResult) return [3 /*break*/, 20];
                        regex = /FILE:\s*([^\n]+)\n```(?:[a-z]*)\n([\s\S]*?)```/g;
                        match = void 0;
                        _d.label = 15;
                    case 15:
                        if (!((match = regex.exec(fixResult)) !== null)) return [3 /*break*/, 20];
                        filePath = match[1].trim();
                        correctedContent = match[2].trim();
                        absPath = path_1.default.join(targetDir, filePath);
                        _d.label = 16;
                    case 16:
                        _d.trys.push([16, 18, , 19]);
                        return [4 /*yield*/, promises_1.default.writeFile(absPath, correctedContent)];
                    case 17:
                        _d.sent();
                        modifiedAny = true;
                        return [3 /*break*/, 19];
                    case 18:
                        e_4 = _d.sent();
                        shared_1.Logger.warn("Failed to write build fix to ".concat(absPath, ": ").concat(e_4.message));
                        return [3 /*break*/, 19];
                    case 19: return [3 /*break*/, 15];
                    case 20: return [3 /*break*/, 31];
                    case 21:
                        _c = 0, fileSet_2 = fileSet;
                        _d.label = 22;
                    case 22:
                        if (!(_c < fileSet_2.length)) return [3 /*break*/, 31];
                        relFilePath = fileSet_2[_c];
                        absPath = path_1.default.join(targetDir, relFilePath);
                        fileContent = snapshot.get(relFilePath);
                        if (fileContent === undefined)
                            return [3 /*break*/, 30];
                        correctedCode = null;
                        if (!(errorCategory === 'AST')) return [3 /*break*/, 24];
                        return [4 /*yield*/, ast_repair_agent_1.ASTRepairAgent.repair(targetDir, relFilePath, fileContent, errors.map(function (e) { return typeof e === 'object' ? JSON.stringify(e) : String(e); }))];
                    case 23:
                        correctedCode = _d.sent();
                        return [3 /*break*/, 28];
                    case 24:
                        if (!(errorCategory === 'TYPE')) return [3 /*break*/, 26];
                        return [4 /*yield*/, type_repair_agent_1.TypeRepairAgent.repair(targetDir, relFilePath, fileContent, errors.map(function (e) { return typeof e === 'object' ? JSON.stringify(e) : String(e); }))];
                    case 25:
                        correctedCode = _d.sent();
                        return [3 /*break*/, 28];
                    case 26:
                        if (!(errorCategory === 'FUNCTIONAL')) return [3 /*break*/, 28];
                        return [4 /*yield*/, functional_repair_agent_1.FunctionalRepairAgent.repair(targetDir, relFilePath, fileContent, errors.map(function (e) { return typeof e === 'object' ? JSON.stringify(e) : String(e); }))];
                    case 27:
                        correctedCode = _d.sent();
                        _d.label = 28;
                    case 28:
                        if (!correctedCode) return [3 /*break*/, 30];
                        lowerCode = correctedCode.toLowerCase();
                        if (lowerCode.includes('welcome to') || lowerCode.includes('// todo') || lowerCode.includes('placeholder')) {
                            shared_1.Logger.warn("[RepairAgent] Rejected placeholder fix for ".concat(relFilePath));
                            return [3 /*break*/, 30];
                        }
                        return [4 /*yield*/, promises_1.default.writeFile(absPath, correctedCode)];
                    case 29:
                        _d.sent();
                        shared_1.Logger.info("[RepairAgent] Successfully applied fix to ".concat(relFilePath));
                        modifiedAny = true;
                        _d.label = 30;
                    case 30:
                        _c++;
                        return [3 /*break*/, 22];
                    case 31:
                        if (!modifiedAny) return [3 /*break*/, 37];
                        return [4 /*yield*/, this.logRepair(targetDir, "[REPAIR]\nRepair Applied")];
                    case 32:
                        _d.sent();
                        return [4 /*yield*/, validation_regression_guard_1.ValidationRegressionGuard.getErrorCount(targetDir)];
                    case 33:
                        finalErrorCount = _d.sent();
                        return [4 /*yield*/, this.logRepair(targetDir, "[REPAIR]\nError Count After: ".concat(finalErrorCount))];
                    case 34:
                        _d.sent();
                        return [4 /*yield*/, validation_regression_guard_1.ValidationRegressionGuard.rollbackIfWorse(targetDir, snapshot, initialErrorCount, finalErrorCount, function (msg) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, this.logRepair(targetDir, msg)];
                            }); }); })];
                    case 35:
                        reverted_1 = _d.sent();
                        repairTraces.forEach(function (t) { return t.result = reverted_1 ? 'rolled-back' : 'success'; });
                        return [4 /*yield*/, this.writeTraces(targetDir, repairTraces)];
                    case 36:
                        _d.sent();
                        if (reverted_1)
                            return [2 /*return*/, false];
                        return [2 /*return*/, finalErrorCount === 0 || finalErrorCount < initialErrorCount];
                    case 37:
                        repairTraces.forEach(function (t) { return t.result = 'failed - no modification'; });
                        return [4 /*yield*/, this.writeTraces(targetDir, repairTraces)];
                    case 38:
                        _d.sent();
                        return [2 /*return*/, false];
                }
            });
        });
    };
    RepairAgent.writeTraces = function (targetDir, traces) {
        return __awaiter(this, void 0, void 0, function () {
            var artifactsDir, tracePath, existing, content, e_5, e_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        artifactsDir = path_1.default.join(targetDir, 'generation-artifacts');
                        return [4 /*yield*/, promises_1.default.mkdir(artifactsDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        tracePath = path_1.default.join(artifactsDir, 'repair-trace.json');
                        existing = [];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, promises_1.default.readFile(tracePath, 'utf-8')];
                    case 3:
                        content = _a.sent();
                        existing = JSON.parse(content);
                        return [3 /*break*/, 5];
                    case 4:
                        e_5 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        existing.push.apply(existing, traces);
                        return [4 /*yield*/, promises_1.default.writeFile(tracePath, JSON.stringify(existing, null, 2), 'utf-8')];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        e_6 = _a.sent();
                        shared_1.Logger.warn("[RepairAgent] Could not write repair traces: ".concat(e_6.message));
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    RepairAgent.lastFingerprints = new Map();
    return RepairAgent;
}());
exports.RepairAgent = RepairAgent;
