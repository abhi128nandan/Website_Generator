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
exports.FunctionalFlowValidator = void 0;
var shared_1 = require("@website-generator/shared");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var FunctionalFlowValidator = /** @class */ (function () {
    function FunctionalFlowValidator() {
    }
    /**
     * Validates that a generated Todo App has functional end-to-end connections.
     * - Prisma model exists
     * - Backend routes exist (GET, POST, PUT, DELETE)
     * - Frontend forms and API calls exist
     */
    FunctionalFlowValidator.validate = function (targetDir, reqs) {
        return __awaiter(this, void 0, void 0, function () {
            function readDirRecursive(dir) {
                return __awaiter(this, void 0, void 0, function () {
                    var entries, _i, entries_1, entry, res, _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, promises_1.default.readdir(dir, { withFileTypes: true })];
                            case 1:
                                entries = _b.sent();
                                _i = 0, entries_1 = entries;
                                _b.label = 2;
                            case 2:
                                if (!(_i < entries_1.length)) return [3 /*break*/, 7];
                                entry = entries_1[_i];
                                res = path_1.default.resolve(dir, entry.name);
                                if (!entry.isDirectory()) return [3 /*break*/, 4];
                                return [4 /*yield*/, readDirRecursive(res)];
                            case 3:
                                _b.sent();
                                return [3 /*break*/, 6];
                            case 4:
                                if (!(res.endsWith('.ts') || res.endsWith('.tsx'))) return [3 /*break*/, 6];
                                _a = frontendCode;
                                return [4 /*yield*/, promises_1.default.readFile(res, 'utf-8')];
                            case 5:
                                frontendCode = _a + ((_b.sent()) + '\n');
                                _b.label = 6;
                            case 6:
                                _i++;
                                return [3 /*break*/, 2];
                            case 7: return [2 /*return*/];
                        }
                    });
                });
            }
            var appNameLower, errors, entity, schemaPath, schemaContent, e_1, backendCode, routesDir, files, _i, files_1, file, _a, indexCode, e_2, checkBackendRoute, frontendCode, e_3, hasPost, hasPut, hasDelete, hasGet;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        appNameLower = reqs.appName.toLowerCase();
                        // We only enforce this strict validator for the Todo App as requested
                        if (appNameLower !== 'todo app' && appNameLower !== 'todo') {
                            return [2 /*return*/, { isValid: true, errors: [] }];
                        }
                        shared_1.Logger.info('[FunctionalFlowValidator] Validating Todo App functional flow...');
                        errors = [];
                        entity = 'Task';
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        schemaPath = path_1.default.join(targetDir, 'database', 'prisma', 'schema.prisma');
                        return [4 /*yield*/, promises_1.default.readFile(schemaPath, 'utf-8')];
                    case 2:
                        schemaContent = _b.sent();
                        if (!schemaContent.includes('model Task {') && !schemaContent.includes('model task {')) {
                            errors.push({ entity: entity, missing: 'Prisma model (Task)' });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        errors.push({ entity: entity, missing: 'database/prisma/schema.prisma file' });
                        return [3 /*break*/, 4];
                    case 4:
                        backendCode = '';
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 12, , 13]);
                        routesDir = path_1.default.join(targetDir, 'backend', 'src', 'routes');
                        return [4 /*yield*/, promises_1.default.readdir(routesDir)];
                    case 6:
                        files = _b.sent();
                        _i = 0, files_1 = files;
                        _b.label = 7;
                    case 7:
                        if (!(_i < files_1.length)) return [3 /*break*/, 10];
                        file = files_1[_i];
                        if (!file.endsWith('.ts')) return [3 /*break*/, 9];
                        _a = backendCode;
                        return [4 /*yield*/, promises_1.default.readFile(path_1.default.join(routesDir, file), 'utf-8')];
                    case 8:
                        backendCode = _a + ((_b.sent()) + '\n');
                        _b.label = 9;
                    case 9:
                        _i++;
                        return [3 /*break*/, 7];
                    case 10: return [4 /*yield*/, promises_1.default.readFile(path_1.default.join(targetDir, 'backend', 'src', 'index.ts'), 'utf-8')];
                    case 11:
                        indexCode = _b.sent();
                        backendCode += indexCode;
                        return [3 /*break*/, 13];
                    case 12:
                        e_2 = _b.sent();
                        return [3 /*break*/, 13];
                    case 13:
                        checkBackendRoute = function (method, route) {
                            // Look for signatures like router.get('/', router.post('/', router.put('/:id'
                            // or explicit matches in index.ts like app.use('/api/tasks'
                            var lowerCode = backendCode.toLowerCase();
                            var hasMethod = lowerCode.includes("".concat(method.toLowerCase(), "('/")) || lowerCode.includes("".concat(method.toLowerCase(), "(\"/")) || lowerCode.includes("".concat(method.toLowerCase(), "(`/"));
                            var hasEndpointName = lowerCode.includes('tasks') || lowerCode.includes('todo');
                            if (!hasMethod || !hasEndpointName) {
                                errors.push({ entity: entity, missing: "".concat(method, " ").concat(route) });
                            }
                        };
                        if (backendCode) {
                            checkBackendRoute('GET', '/api/tasks');
                            checkBackendRoute('POST', '/api/tasks');
                            checkBackendRoute('PUT', '/api/tasks/:id');
                            checkBackendRoute('DELETE', '/api/tasks/:id');
                        }
                        else {
                            errors.push({ entity: entity, missing: 'Backend Routes directory/files' });
                        }
                        frontendCode = '';
                        _b.label = 14;
                    case 14:
                        _b.trys.push([14, 16, , 17]);
                        return [4 /*yield*/, readDirRecursive(path_1.default.join(targetDir, 'frontend', 'src'))];
                    case 15:
                        _b.sent();
                        return [3 /*break*/, 17];
                    case 16:
                        e_3 = _b.sent();
                        return [3 /*break*/, 17];
                    case 17:
                        if (frontendCode) {
                            // Check for form submission
                            if (!frontendCode.includes('<form') && !frontendCode.includes('onSubmit')) {
                                errors.push({ entity: entity, missing: 'Frontend form for creating tasks' });
                            }
                            hasPost = frontendCode.includes('POST') || frontendCode.includes('axios.post');
                            hasPut = frontendCode.includes('PUT') || frontendCode.includes('PATCH') || frontendCode.includes('axios.put') || frontendCode.includes('axios.patch');
                            hasDelete = frontendCode.includes('DELETE') || frontendCode.includes('axios.delete');
                            hasGet = frontendCode.includes('fetch(') || frontendCode.includes('axios.get') || frontendCode.includes('GET');
                            if (!hasGet)
                                errors.push({ entity: entity, missing: 'Frontend API call: GET tasks' });
                            if (!hasPost)
                                errors.push({ entity: entity, missing: 'Frontend API call: POST task' });
                            if (!hasPut)
                                errors.push({ entity: entity, missing: 'Frontend API call: PUT/UPDATE task' });
                            if (!hasDelete)
                                errors.push({ entity: entity, missing: 'Frontend API call: DELETE task' });
                        }
                        else {
                            errors.push({ entity: entity, missing: 'Frontend src directory/files' });
                        }
                        if (errors.length > 0) {
                            shared_1.Logger.error("[FunctionalFlowValidator] Validation failed with ".concat(errors.length, " missing links."));
                        }
                        else {
                            shared_1.Logger.info('[FunctionalFlowValidator] Todo App functional flow validated successfully.');
                        }
                        return [2 /*return*/, {
                                isValid: errors.length === 0,
                                errors: errors
                            }];
                }
            });
        });
    };
    return FunctionalFlowValidator;
}());
exports.FunctionalFlowValidator = FunctionalFlowValidator;
