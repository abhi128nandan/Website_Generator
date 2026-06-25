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
exports.FrontendComplexityGuard = void 0;
var promises_1 = require("fs/promises");
var path_1 = require("path");
var requirement_intelligence_1 = require("../analysis/requirement-intelligence");
var FrontendComplexityGuard = /** @class */ (function () {
    function FrontendComplexityGuard() {
    }
    FrontendComplexityGuard.validate = function (reqs, targetDir) {
        return __awaiter(this, void 0, void 0, function () {
            var arch, profile, limits, componentsCount, hooksCount, servicesCount, pagesCount, report, rejectionRule, artifactsDir, debugPayload;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        arch = reqs.frontendArchitecture;
                        if (!arch)
                            return [2 /*return*/, true];
                        profile = requirement_intelligence_1.RequirementIntelligence.analyze(reqs);
                        limits = requirement_intelligence_1.RequirementIntelligence.toGuardLimits(profile);
                        if (!limits) return [3 /*break*/, 5];
                        componentsCount = ((_a = arch.components) === null || _a === void 0 ? void 0 : _a.length) || 0;
                        hooksCount = ((_b = arch.hooks) === null || _b === void 0 ? void 0 : _b.length) || 0;
                        servicesCount = ((_c = arch.services) === null || _c === void 0 ? void 0 : _c.length) || 0;
                        pagesCount = ((_d = arch.pages) === null || _d === void 0 ? void 0 : _d.length) || 0;
                        report = {
                            appType: profile.complexity,
                            limits: limits,
                            actual: { components: componentsCount, hooks: hooksCount, services: servicesCount, pages: pagesCount },
                            rejected: false,
                            reason: ''
                        };
                        rejectionRule = '';
                        if (componentsCount > limits.components)
                            rejectionRule = "components (".concat(componentsCount, ") exceeds limit (").concat(limits.components, ")");
                        else if (hooksCount > limits.hooks)
                            rejectionRule = "hooks (".concat(hooksCount, ") exceeds limit (").concat(limits.hooks, ")");
                        else if (servicesCount > limits.services)
                            rejectionRule = "services (".concat(servicesCount, ") exceeds limit (").concat(limits.services, ")");
                        else if (pagesCount > limits.pages)
                            rejectionRule = "pages (".concat(pagesCount, ") exceeds limit (").concat(limits.pages, ")");
                        artifactsDir = path_1.default.join(targetDir, 'generation-artifacts');
                        return [4 /*yield*/, promises_1.default.mkdir(artifactsDir, { recursive: true })];
                    case 1:
                        _e.sent();
                        if (!rejectionRule) return [3 /*break*/, 3];
                        report.rejected = true;
                        report.reason = 'Architecture exceeds complexity limits: ' + rejectionRule;
                        debugPayload = {
                            architecture: arch,
                            counts: {
                                components: componentsCount,
                                pages: pagesCount,
                                services: servicesCount,
                                hooks: hooksCount
                            },
                            thresholds: limits,
                            rejectionRule: rejectionRule,
                            timestamp: new Date().toISOString()
                        };
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'complexity-debug.json'), JSON.stringify(debugPayload, null, 2), 'utf-8')];
                    case 2:
                        _e.sent();
                        _e.label = 3;
                    case 3: return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'complexity-report.json'), JSON.stringify(report, null, 2), 'utf-8')];
                    case 4:
                        _e.sent();
                        if (report.rejected) {
                            throw new Error("COMPLEXITY_GUARD_FAILED: ".concat(report.reason));
                        }
                        _e.label = 5;
                    case 5: return [2 /*return*/, true];
                }
            });
        });
    };
    return FrontendComplexityGuard;
}());
exports.FrontendComplexityGuard = FrontendComplexityGuard;
