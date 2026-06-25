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
exports.MetricsTracker = void 0;
var promises_1 = require("fs/promises");
var path_1 = require("path");
var os_1 = require("os");
var shared_1 = require("@website-generator/shared");
var MetricsTracker = /** @class */ (function () {
    function MetricsTracker() {
    }
    MetricsTracker.getMetricsPath = function () {
        var homeDir = os_1.default.homedir();
        var websiteGeneratorDir = path_1.default.join(homeDir, '.websiteGenerator');
        return path_1.default.join(websiteGeneratorDir, 'metrics.json');
    };
    MetricsTracker.loadMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var metricsPath, data, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        metricsPath = this.getMetricsPath();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, promises_1.default.readFile(metricsPath, 'utf-8')];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, JSON.parse(data)];
                    case 3:
                        e_1 = _a.sent();
                        // Return default if it doesn't exist
                        return [2 /*return*/, {
                                totalRuns: 0,
                                successfulRuns: 0,
                                successfulBuilds: 0,
                                successfulFunctionalTests: 0,
                                totalRepairAttempts: 0,
                                totalGenerationTimeMs: 0,
                                generationSuccessRate: 0,
                                buildSuccessRate: 0,
                                functionalSuccessRate: 0,
                                repairRate: 0,
                                averageGenerationTimeMs: 0,
                                classificationFailures: 0,
                                syntaxGateFailures: 0,
                                compileGateFailures: 0,
                                parserFailures: 0,
                                successfulGenerations: 0,
                                commonTsErrors: {},
                                commonBuildErrors: {}
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MetricsTracker.incrementMetric = function (metric_1) {
        return __awaiter(this, arguments, void 0, function (metric, amount) {
            var metricsPath, metrics, e_2;
            if (amount === void 0) { amount = 1; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        metricsPath = this.getMetricsPath();
                        return [4 /*yield*/, promises_1.default.mkdir(path_1.default.dirname(metricsPath), { recursive: true })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.loadMetrics()];
                    case 2:
                        metrics = _a.sent();
                        // Ensure all metrics are initialized to prevent NaN
                        if (metrics.classificationFailures === undefined)
                            metrics.classificationFailures = 0;
                        if (metrics.syntaxGateFailures === undefined)
                            metrics.syntaxGateFailures = 0;
                        if (metrics.compileGateFailures === undefined)
                            metrics.compileGateFailures = 0;
                        if (metrics.parserFailures === undefined)
                            metrics.parserFailures = 0;
                        if (metrics.successfulGenerations === undefined)
                            metrics.successfulGenerations = 0;
                        metrics[metric] += amount;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, promises_1.default.writeFile(metricsPath, JSON.stringify(metrics, null, 2))];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        e_2 = _a.sent();
                        shared_1.Logger.warn("[MetricsTracker] Failed to increment metric ".concat(metric, ": ").concat(e_2.message));
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    MetricsTracker.recordError = function (errorCategory, errorMessage) {
        return __awaiter(this, void 0, void 0, function () {
            var metricsPath, metrics, key, tsMatch, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        metricsPath = this.getMetricsPath();
                        return [4 /*yield*/, this.loadMetrics()];
                    case 1:
                        metrics = _a.sent();
                        if (!metrics.commonTsErrors)
                            metrics.commonTsErrors = {};
                        if (!metrics.commonBuildErrors)
                            metrics.commonBuildErrors = {};
                        key = errorMessage.substring(0, 50).replace(/(\r\n|\n|\r)/gm, " ");
                        if (errorCategory === 'TS') {
                            tsMatch = errorMessage.match(/TS\d+/);
                            if (tsMatch)
                                key = tsMatch[0];
                            metrics.commonTsErrors[key] = (metrics.commonTsErrors[key] || 0) + 1;
                        }
                        else {
                            metrics.commonBuildErrors[key] = (metrics.commonBuildErrors[key] || 0) + 1;
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, promises_1.default.writeFile(metricsPath, JSON.stringify(metrics, null, 2))];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_3 = _a.sent();
                        shared_1.Logger.warn("[MetricsTracker] Failed to record error metric: ".concat(e_3.message));
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    MetricsTracker.recordRun = function (runData) {
        return __awaiter(this, void 0, void 0, function () {
            var metricsPath, metrics, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        metricsPath = this.getMetricsPath();
                        return [4 /*yield*/, promises_1.default.mkdir(path_1.default.dirname(metricsPath), { recursive: true })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.loadMetrics()];
                    case 2:
                        metrics = _a.sent();
                        metrics.totalRuns += 1;
                        if (runData.success)
                            metrics.successfulRuns += 1;
                        if (runData.buildSuccess)
                            metrics.successfulBuilds += 1;
                        if (runData.functionalSuccess)
                            metrics.successfulFunctionalTests += 1;
                        metrics.totalRepairAttempts += runData.repairAttempts;
                        metrics.totalGenerationTimeMs += runData.generationTimeMs;
                        // Recalculate derived
                        metrics.generationSuccessRate = metrics.successfulRuns / metrics.totalRuns;
                        metrics.buildSuccessRate = metrics.successfulBuilds / metrics.totalRuns;
                        metrics.functionalSuccessRate = metrics.successfulFunctionalTests / metrics.totalRuns;
                        metrics.repairRate = metrics.totalRepairAttempts / metrics.totalRuns;
                        metrics.averageGenerationTimeMs = metrics.totalGenerationTimeMs / metrics.totalRuns;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, promises_1.default.writeFile(metricsPath, JSON.stringify(metrics, null, 2))];
                    case 4:
                        _a.sent();
                        shared_1.Logger.info("[MetricsTracker] Successfully recorded metrics to ".concat(metricsPath));
                        return [3 /*break*/, 6];
                    case 5:
                        e_4 = _a.sent();
                        shared_1.Logger.warn("[MetricsTracker] Failed to record metrics: ".concat(e_4.message));
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, metrics];
                }
            });
        });
    };
    return MetricsTracker;
}());
exports.MetricsTracker = MetricsTracker;
