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
exports.ValidationRegressionGuard = void 0;
var ast_validator_1 = require("./ast-validator");
var react_structure_validator_1 = require("./react-structure-validator");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var ValidationRegressionGuard = /** @class */ (function () {
    function ValidationRegressionGuard() {
    }
    ValidationRegressionGuard.getErrorCount = function (targetDir) {
        return __awaiter(this, void 0, void 0, function () {
            var ast, react;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, ast_validator_1.ASTValidator.validate(targetDir)];
                    case 1:
                        ast = _a.sent();
                        return [4 /*yield*/, react_structure_validator_1.ReactStructureValidator.validate(targetDir)];
                    case 2:
                        react = _a.sent();
                        return [2 /*return*/, ast.errors.length + react.errors.length];
                }
            });
        });
    };
    ValidationRegressionGuard.rollbackIfWorse = function (targetDir, snapshot, beforeCount, afterCount, onLog) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, relPath, origText, absPath;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(afterCount > beforeCount)) return [3 /*break*/, 6];
                        return [4 /*yield*/, onLog("[REPAIR]\nRollback Triggered. Errors increased from ".concat(beforeCount, " to ").concat(afterCount, "."))];
                    case 1:
                        _c.sent();
                        _i = 0, _a = snapshot.entries();
                        _c.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        _b = _a[_i], relPath = _b[0], origText = _b[1];
                        absPath = path_1.default.join(targetDir, relPath);
                        return [4 /*yield*/, promises_1.default.writeFile(absPath, origText, 'utf8')];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, true]; // true means rollback happened
                    case 6: return [2 /*return*/, false];
                }
            });
        });
    };
    return ValidationRegressionGuard;
}());
exports.ValidationRegressionGuard = ValidationRegressionGuard;
