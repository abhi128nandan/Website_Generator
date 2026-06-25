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
exports.GeneratorObservability = void 0;
var promises_1 = require("fs/promises");
var path_1 = require("path");
var shared_1 = require("@website-generator/shared");
var GeneratorObservability = /** @class */ (function () {
    function GeneratorObservability() {
    }
    GeneratorObservability.save = function (targetDir, reqs, buildErrors, qaScoringBreakdown, repairAttempts) {
        return __awaiter(this, void 0, void 0, function () {
            var projectId, fileTree, data, artifactsDir, e_1;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 11, , 12]);
                        projectId = path_1.default.basename(targetDir);
                        return [4 /*yield*/, this.getFileTree(targetDir)];
                    case 1:
                        fileTree = _d.sent();
                        data = {
                            projectId: projectId,
                            appName: reqs.appName || 'Unknown',
                            appType: reqs.appType || 'Unknown',
                            classifiedMode: reqs.classifiedMode || 'Unknown',
                            timestamp: new Date().toISOString(),
                            architectureAnalysis: {
                                classifiedMode: reqs.classifiedMode || 'Unknown',
                                appName: reqs.appName || '',
                                features: reqs.features || [],
                                workflows: reqs.workflows || [],
                                routes: reqs.routes || []
                            },
                            frontendPlan: reqs.frontendArchitecture || null,
                            backendPlan: ((_a = reqs.architecture) === null || _a === void 0 ? void 0 : _a.endpoints) || null,
                            databasePlan: ((_b = reqs.architecture) === null || _b === void 0 ? void 0 : _b.entities) || null,
                            generatedFileTree: fileTree,
                            buildErrors: buildErrors,
                            qaScoringBreakdown: qaScoringBreakdown ? {
                                score: qaScoringBreakdown.score,
                                criteria: qaScoringBreakdown.criteria,
                                missingFunctionality: qaScoringBreakdown.missingFunctionality || [],
                                feedback: qaScoringBreakdown.feedback || ''
                            } : null,
                            repairAttempts: repairAttempts
                        };
                        artifactsDir = path_1.default.join(targetDir, 'generation-artifacts');
                        return [4 /*yield*/, promises_1.default.mkdir(artifactsDir, { recursive: true })];
                    case 2:
                        _d.sent();
                        if (!reqs.__canonicalContract) return [3 /*break*/, 4];
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'contract.json'), JSON.stringify(reqs.__canonicalContract, null, 2))];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4: return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'architecture.json'), JSON.stringify({
                            entities: data.databasePlan,
                            endpoints: data.backendPlan,
                            pages: ((_c = data.frontendPlan) === null || _c === void 0 ? void 0 : _c.pages) || []
                        }, null, 2))];
                    case 5:
                        _d.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'frontend-plan.json'), JSON.stringify(data.frontendPlan || {}, null, 2))];
                    case 6:
                        _d.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'backend-plan.json'), JSON.stringify(data.backendPlan || [], null, 2))];
                    case 7:
                        _d.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'validation-report.json'), JSON.stringify({
                                buildErrors: data.buildErrors,
                                repairAttempts: data.repairAttempts
                            }, null, 2))];
                    case 8:
                        _d.sent();
                        // Build report will just hold what we know so far
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'build-report.json'), JSON.stringify({
                                status: data.buildErrors.length === 0 ? 'SUCCESS' : 'FAILED',
                                errorCount: data.buildErrors.length
                            }, null, 2))];
                    case 9:
                        // Build report will just hold what we know so far
                        _d.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'functional-report.json'), JSON.stringify({
                                qaScoringBreakdown: data.qaScoringBreakdown
                            }, null, 2))];
                    case 10:
                        _d.sent();
                        shared_1.Logger.info("[observability] Artifacts successfully saved to ".concat(artifactsDir));
                        return [3 /*break*/, 12];
                    case 11:
                        e_1 = _d.sent();
                        shared_1.Logger.warn("[observability] Failed to save generation artifacts: ".concat(e_1.message));
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    GeneratorObservability.writeArtifact = function (targetDir, filename, data) {
        return __awaiter(this, void 0, void 0, function () {
            var artifactsDir, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        artifactsDir = path_1.default.join(targetDir, 'generation-artifacts');
                        return [4 /*yield*/, promises_1.default.mkdir(artifactsDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, filename), JSON.stringify(data, null, 2), 'utf-8')];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _a.sent();
                        shared_1.Logger.warn("[observability] Failed to write artifact ".concat(filename, ": ").concat(e_2.message));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GeneratorObservability.getFileTree = function (dir_1) {
        return __awaiter(this, arguments, void 0, function (dir, baseDir) {
            var files, entries, _i, entries_1, entry, fullPath, relPath, _a, _b, _c, e_3;
            if (baseDir === void 0) { baseDir = dir; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        files = [];
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, promises_1.default.readdir(dir, { withFileTypes: true })];
                    case 2:
                        entries = _d.sent();
                        _i = 0, entries_1 = entries;
                        _d.label = 3;
                    case 3:
                        if (!(_i < entries_1.length)) return [3 /*break*/, 7];
                        entry = entries_1[_i];
                        fullPath = path_1.default.join(dir, entry.name);
                        relPath = path_1.default.relative(baseDir, fullPath).replace(/\\/g, '/');
                        // Skip node_modules, .git, and dist to avoid huge bloat
                        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
                            return [3 /*break*/, 6];
                        }
                        if (!entry.isDirectory()) return [3 /*break*/, 5];
                        files.push(relPath + '/');
                        _b = (_a = files.push).apply;
                        _c = [files];
                        return [4 /*yield*/, this.getFileTree(fullPath, baseDir)];
                    case 4:
                        _b.apply(_a, _c.concat([(_d.sent())]));
                        return [3 /*break*/, 6];
                    case 5:
                        files.push(relPath);
                        _d.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 3];
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        e_3 = _d.sent();
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/, files];
                }
            });
        });
    };
    return GeneratorObservability;
}());
exports.GeneratorObservability = GeneratorObservability;
