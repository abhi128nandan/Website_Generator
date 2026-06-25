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
exports.PlaceholderBusinessLogicValidator = exports.PlaceholderValidator = void 0;
var shared_1 = require("@website-generator/shared");
var PlaceholderValidator = /** @class */ (function () {
    function PlaceholderValidator() {
    }
    PlaceholderValidator.audit = function (code) {
        PlaceholderBusinessLogicValidator.audit(code);
    };
    PlaceholderValidator.validate = function (targetDir) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, fs, path, scanDir;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        errors = [];
                        fs = require('fs').promises;
                        path = require('path');
                        scanDir = function (dir) { return __awaiter(_this, void 0, void 0, function () {
                            var entries, _i, entries_1, entry, fullPath, code, e_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 8, , 9]);
                                        return [4 /*yield*/, fs.readdir(dir, { withFileTypes: true })];
                                    case 1:
                                        entries = _a.sent();
                                        _i = 0, entries_1 = entries;
                                        _a.label = 2;
                                    case 2:
                                        if (!(_i < entries_1.length)) return [3 /*break*/, 7];
                                        entry = entries_1[_i];
                                        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git')
                                            return [3 /*break*/, 6];
                                        fullPath = path.join(dir, entry.name);
                                        if (!entry.isDirectory()) return [3 /*break*/, 4];
                                        return [4 /*yield*/, scanDir(fullPath)];
                                    case 3:
                                        _a.sent();
                                        return [3 /*break*/, 6];
                                    case 4:
                                        if (!(entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) return [3 /*break*/, 6];
                                        return [4 /*yield*/, fs.readFile(fullPath, 'utf8')];
                                    case 5:
                                        code = _a.sent();
                                        try {
                                            PlaceholderBusinessLogicValidator.audit(code);
                                        }
                                        catch (e) {
                                            errors.push({
                                                file: fullPath,
                                                message: e.message,
                                                line: 1
                                            });
                                        }
                                        _a.label = 6;
                                    case 6:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 7: return [3 /*break*/, 9];
                                    case 8:
                                        e_1 = _a.sent();
                                        return [3 /*break*/, 9];
                                    case 9: return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, scanDir(targetDir)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { isValid: errors.length === 0, errors: errors }];
                }
            });
        });
    };
    return PlaceholderValidator;
}());
exports.PlaceholderValidator = PlaceholderValidator;
var PlaceholderBusinessLogicValidator = /** @class */ (function () {
    function PlaceholderBusinessLogicValidator() {
    }
    PlaceholderBusinessLogicValidator.audit = function (code) {
        if (!code || typeof code !== 'string')
            return;
        for (var _i = 0, _a = this.FORBIDDEN_PATTERNS; _i < _a.length; _i++) {
            var pattern = _a[_i];
            var match = code.match(pattern);
            if (match) {
                shared_1.Logger.warn("[PlaceholderValidator] Code contains forbidden placeholder pattern: ".concat(pattern));
                throw new Error("CRITICAL VALIDATION FAILURE: Your code contains a forbidden placeholder ('".concat(match[0], "'). You MUST write actual executable business logic (e.g., Zod schemas, React state error handling, Prisma where clauses). Do not leave pseudo-code or comments."));
            }
        }
        // Check for conspicuously empty handlers that should contain logic
        // We shouldn't fail on perfectly normal empty interfaces, so we have to be careful
        var emptyHandlers = [
            /onSubmit=\{?\s*(?:async\s*)?(?:\([^)]*\)|[^=]*)\s*=>\s*\{\s*\}?\}?/g,
            /onClick=\{?\s*(?:async\s*)?(?:\([^)]*\)|[^=]*)\s*=>\s*\{\s*\}?\}?/g,
            /app\.(?:post|put|delete|patch)\([^,]+,\s*(?:async\s*)?(?:req,\s*res)\s*=>\s*\{\s*\}/gi
        ];
        for (var _b = 0, emptyHandlers_1 = emptyHandlers; _b < emptyHandlers_1.length; _b++) {
            var pattern = emptyHandlers_1[_b];
            if (pattern.test(code)) {
                shared_1.Logger.warn("[PlaceholderValidator] Code contains empty executable handlers.");
                throw new Error("CRITICAL VALIDATION FAILURE: Your code contains empty handlers (e.g., empty onSubmit, onClick, or Express route). You MUST provide actual executable functionality. Implement the mutation or state change.");
            }
        }
    };
    PlaceholderBusinessLogicValidator.FORBIDDEN_PATTERNS = [
        /TODO/i,
        /FIXME/i,
        /Business Logic:/i,
        /Validation goes here/i,
        /Implement logic/i,
        /Placeholder/i,
        /implement later/i,
        /\/\/ Validate /i,
        /\/\/ Apply filters/i,
        /\/\/ Check permissions/i
    ];
    return PlaceholderBusinessLogicValidator;
}());
exports.PlaceholderBusinessLogicValidator = PlaceholderBusinessLogicValidator;
