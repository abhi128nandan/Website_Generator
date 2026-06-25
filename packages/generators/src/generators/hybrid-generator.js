"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.HybridGenerator = void 0;
var shared_1 = require("@website-generator/shared");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var frontend_ai_analyzer_1 = require("./frontend-ai-analyzer");
var ai_engine_1 = require("@website-generator/ai-engine");
var path_normalizer_1 = require("../compiler/path-normalizer");
var child_process_1 = require("child_process");
var util_1 = require("util");
var ast_validator_1 = require("../validators/ast-validator");
var react_structure_validator_1 = require("../validators/react-structure-validator");
var placeholder_validator_1 = require("../validators/placeholder-validator");
var import_integrity_validator_1 = require("../validators/import-integrity-validator");
var functional_flow_validator_1 = require("../validators/functional-flow-validator");
var repair_agent_1 = require("../agents/repair-agent");
var output_sanitizer_1 = require("../validators/output-sanitizer");
var code_extractor_1 = require("../validators/code-extractor");
var code_validity_gate_1 = require("../validators/code-validity-gate");
var compilation_validator_1 = require("../validators/compilation-validator");
var lucide_icon_validator_1 = require("../validators/lucide-icon-validator");
var system_scaffold_1 = require("../scaffold/system-scaffold");
var non_code_detector_1 = require("../validation/non-code-detector");
var artifact_integrity_validator_1 = require("../validators/artifact-integrity-validator");
var pipeline_tracer_1 = require("../observability/pipeline-tracer");
var syntax_gate_1 = require("../validators/syntax-gate");
var compile_gate_1 = require("../validators/compile-gate");
var ai_engine_2 = require("@website-generator/ai-engine");
var metrics_tracker_1 = require("../observability/metrics-tracker");
var execPromise = util_1.default.promisify(child_process_1.exec);
/**
 * Generates a hybrid fullstack application.
 *
 * Combines:
 * - Rich component-based frontend (same as FrontendAppGenerator)
 * - Lightweight Express backend (service-oriented, NOT entity-CRUD)
 * - Optional database (only if AI detects persistence requirements)
 *
 * Does NOT generate:
 * - CRUD admin dashboard tables/forms
 * - Entity-centric CRUD APIs
 * - Prisma schema (unless explicitly needed)
 */
var HybridGenerator = /** @class */ (function () {
    function HybridGenerator() {
    }
    HybridGenerator.generate = function (reqs, targetDir, onLog) {
        return __awaiter(this, void 0, void 0, function () {
            var artifactsDir, reqsSummaryPath, oldReqsStr, e_1, archPath, isValid, cachedArch, _a, _b, FrontendArchitectureSchema, FrontendComplexityGuard, crypto_1, oldHash, newHash, e_2, e_3, arch, artifactsDir, reqFeaturesLower, hasAuthFeature, hasAuthService, e_4, needsDatabase, frontendDir, backendDir, dbDir, requiredFiles, missing, _i, requiredFiles_1, file, _c, manifest, buildPassed, repairAttempts, maxRepairAttempts, previousErrorCount, astRes, rootError, reactRes, placeholderRes, allErrors, buildOutput, buildError, stdout, e_5, formattedErrors, repaired, flowRes, err, metadataPath, existingMeta, _d, _e, updatedMeta, e_6, workspacePackages, generatedFiles, tree, artifactsDir, gateReportPath, gateFailures, _f, _g, e_7, provider, summary, e_8;
            var _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
            return __generator(this, function (_y) {
                switch (_y.label) {
                    case 0:
                        // === STEP 1: AI Architecture Analysis ===
                        onLog(3, '[hybrid-generator] Executing AI architecture analysis...');
                        _y.label = 1;
                    case 1:
                        _y.trys.push([1, 17, , 18]);
                        artifactsDir = path_1.default.join(targetDir, 'generation-artifacts');
                        return [4 /*yield*/, promises_1.default.mkdir(artifactsDir, { recursive: true })];
                    case 2:
                        _y.sent();
                        reqsSummaryPath = path_1.default.join(artifactsDir, 'requirements-summary.json');
                        oldReqsStr = null;
                        _y.label = 3;
                    case 3:
                        _y.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, promises_1.default.readFile(reqsSummaryPath, 'utf-8')];
                    case 4:
                        oldReqsStr = _y.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _y.sent();
                        return [3 /*break*/, 6];
                    case 6: return [4 /*yield*/, promises_1.default.writeFile(reqsSummaryPath, JSON.stringify(reqs, null, 2), 'utf-8')];
                    case 7:
                        _y.sent();
                        archPath = path_1.default.join(artifactsDir, 'architecture-final.json');
                        return [4 /*yield*/, promises_1.default.stat(archPath).catch(function () { return false; })];
                    case 8:
                        if (!_y.sent()) return [3 /*break*/, 16];
                        isValid = true;
                        cachedArch = null;
                        _y.label = 9;
                    case 9:
                        _y.trys.push([9, 12, , 13]);
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, promises_1.default.readFile(archPath, 'utf-8')];
                    case 10:
                        cachedArch = _b.apply(_a, [_y.sent()]);
                        FrontendArchitectureSchema = require('@website-generator/shared').FrontendArchitectureSchema;
                        FrontendArchitectureSchema.parse(cachedArch);
                        FrontendComplexityGuard = require('../validators/frontend-complexity-guard').FrontendComplexityGuard;
                        return [4 /*yield*/, FrontendComplexityGuard.validate(__assign(__assign({}, reqs), { frontendArchitecture: cachedArch }), targetDir)];
                    case 11:
                        _y.sent();
                        if (oldReqsStr) {
                            crypto_1 = require('crypto');
                            oldHash = crypto_1.createHash('md5').update(oldReqsStr).digest('hex');
                            newHash = crypto_1.createHash('md5').update(JSON.stringify(reqs, null, 2)).digest('hex');
                            if (oldHash !== newHash) {
                                isValid = false;
                            }
                        }
                        return [3 /*break*/, 13];
                    case 12:
                        e_2 = _y.sent();
                        isValid = false;
                        return [3 /*break*/, 13];
                    case 13:
                        if (!isValid) return [3 /*break*/, 14];
                        onLog(3, '[hybrid-generator] Found existing architecture. Reusing instead of regenerating...');
                        reqs.frontendArchitecture = cachedArch;
                        return [3 /*break*/, 16];
                    case 14:
                        onLog(3, '[hybrid-generator] Invalid cached architecture. Discarding and regenerating...');
                        return [4 /*yield*/, promises_1.default.unlink(archPath).catch(function () { })];
                    case 15:
                        _y.sent();
                        _y.label = 16;
                    case 16: return [3 /*break*/, 18];
                    case 17:
                        e_3 = _y.sent();
                        return [3 /*break*/, 18];
                    case 18:
                        if (!!reqs.frontendArchitecture) return [3 /*break*/, 20];
                        reqs.__targetDir = targetDir;
                        return [4 /*yield*/, frontend_ai_analyzer_1.FrontendAIAnalyzer.analyze(reqs)];
                    case 19:
                        _y.sent();
                        _y.label = 20;
                    case 20:
                        arch = reqs.frontendArchitecture;
                        _y.label = 21;
                    case 21:
                        _y.trys.push([21, 23, , 24]);
                        artifactsDir = path_1.default.join(targetDir, 'generation-artifacts');
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'architecture-audit.json'), JSON.stringify(arch, null, 2), 'utf-8')];
                    case 22:
                        _y.sent();
                        reqFeaturesLower = reqs.features.join(' ').toLowerCase();
                        hasAuthFeature = reqFeaturesLower.includes('auth') || reqFeaturesLower.includes('login') || reqFeaturesLower.includes('signup');
                        hasAuthService = arch.services.some(function (s) { return s.name.toLowerCase().includes('auth'); });
                        if (hasAuthService && !hasAuthFeature) {
                            onLog(4, '[ARCHITECTURE WARNING] Discovered an authService but authentication was not explicitly requested in features.');
                        }
                        return [3 /*break*/, 24];
                    case 23:
                        e_4 = _y.sent();
                        return [3 /*break*/, 24];
                    case 24:
                        onLog(3, "[hybrid-generator] Architecture: ".concat(arch.components.length, " components, ").concat(arch.services.length, " services, ").concat(arch.hooks.length, " hooks, ").concat(arch.pages.length, " pages"));
                        needsDatabase = this.detectDatabaseNeed(reqs);
                        onLog(3, "[hybrid-generator] Database required: ".concat(needsDatabase ? 'YES' : 'NO'));
                        // === STEP 2: Root workspace ===
                        onLog(3, '[hybrid-generator] Writing root workspace files...');
                        return [4 /*yield*/, this.generateRootWorkspace(targetDir, reqs, needsDatabase)];
                    case 25:
                        _y.sent();
                        frontendDir = path_1.default.join(targetDir, 'frontend');
                        onLog(4, '[hybrid-generator] Writing frontend package...');
                        return [4 /*yield*/, this.generateFrontendPackage(frontendDir, reqs, onLog)];
                    case 26:
                        _y.sent();
                        backendDir = path_1.default.join(targetDir, 'backend');
                        onLog(4, '[hybrid-generator] Writing backend package...');
                        return [4 /*yield*/, this.generateBackendPackage(backendDir, reqs, needsDatabase, onLog)];
                    case 27:
                        _y.sent();
                        if (!needsDatabase) return [3 /*break*/, 29];
                        dbDir = path_1.default.join(targetDir, 'database');
                        onLog(4, '[hybrid-generator] Writing database package...');
                        return [4 /*yield*/, this.generateDatabasePackage(dbDir, reqs)];
                    case 28:
                        _y.sent();
                        _y.label = 29;
                    case 29:
                        // === STEP 6: Validate ===
                        onLog(5, '[hybrid-generator] Validating generated structure...');
                        requiredFiles = [
                            'frontend/package.json',
                            'backend/package.json',
                        ];
                        if (needsDatabase) {
                            requiredFiles.push('database/package.json');
                        }
                        missing = [];
                        _i = 0, requiredFiles_1 = requiredFiles;
                        _y.label = 30;
                    case 30:
                        if (!(_i < requiredFiles_1.length)) return [3 /*break*/, 35];
                        file = requiredFiles_1[_i];
                        _y.label = 31;
                    case 31:
                        _y.trys.push([31, 33, , 34]);
                        return [4 /*yield*/, promises_1.default.access(path_1.default.join(targetDir, file))];
                    case 32:
                        _y.sent();
                        return [3 /*break*/, 34];
                    case 33:
                        _c = _y.sent();
                        missing.push(file);
                        return [3 /*break*/, 34];
                    case 34:
                        _i++;
                        return [3 /*break*/, 30];
                    case 35:
                        if (missing.length > 0) {
                            throw new Error("Hybrid scaffold validation failed. Missing files: ".concat(missing.join(', ')));
                        }
                        // === STEP 4.5: Generate Manifest ===
                        onLog(5, 'Creating generated-manifest.json...');
                        manifest = {
                            pages: ((_h = arch.pages) === null || _h === void 0 ? void 0 : _h.map(function (p) { return p.componentName; })) || [],
                            components: ((_j = arch.components) === null || _j === void 0 ? void 0 : _j.map(function (c) { return c.name; })) || [],
                            hooks: ((_k = arch.hooks) === null || _k === void 0 ? void 0 : _k.map(function (h) { return h.name; })) || [],
                            services: ((_l = arch.services) === null || _l === void 0 ? void 0 : _l.map(function (s) { return s.name; })) || [],
                            routes: ((_m = arch.pages) === null || _m === void 0 ? void 0 : _m.map(function (p) { return p.route; })) || [],
                            prismaModels: ((_o = reqs.entities) === null || _o === void 0 ? void 0 : _o.map(function (e) { return e.name; })) || []
                        };
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(targetDir, 'generated-manifest.json'), JSON.stringify(manifest, null, 2))];
                    case 36:
                        _y.sent();
                        // === STEP 5: Validation and Repair Loop ===
                        onLog(5, 'Starting validation and repair loop...');
                        buildPassed = false;
                        repairAttempts = 0;
                        maxRepairAttempts = 3;
                        previousErrorCount = Infinity;
                        _y.label = 37;
                    case 37:
                        if (!(!buildPassed && repairAttempts <= maxRepairAttempts)) return [3 /*break*/, 51];
                        if (repairAttempts > 0) {
                            onLog(5, "[hybrid-generator] Repair attempt ".concat(repairAttempts, "/").concat(maxRepairAttempts, "..."));
                        }
                        // --- AST Validation ---
                        onLog(5, '[VALIDATION] AST Validation Started');
                        return [4 /*yield*/, ast_validator_1.ASTValidator.validate(targetDir)];
                    case 38:
                        astRes = _y.sent();
                        if (!astRes.isValid) return [3 /*break*/, 39];
                        onLog(5, '[VALIDATION] AST Validation Passed');
                        return [3 /*break*/, 41];
                    case 39:
                        rootError = astRes.errors[0];
                        onLog(5, "Root Cause:\n".concat(rootError.file, "\n").concat(rootError.message, "\nLine ").concat(rootError.line));
                        return [4 /*yield*/, this.recordRootCause(targetDir, path_1.default.basename(rootError.file), repairAttempts + 1, 'ASTValidator', 'AST_ERROR', rootError.message, rootError.line || 1)];
                    case 40:
                        _y.sent();
                        _y.label = 41;
                    case 41:
                        // --- React Structure Validation ---
                        onLog(5, '[VALIDATION] React Structure Validation Started');
                        return [4 /*yield*/, react_structure_validator_1.ReactStructureValidator.validate(targetDir)];
                    case 42:
                        reactRes = _y.sent();
                        if (reactRes.isValid) {
                            onLog(5, '[VALIDATION] React Structure Validation Passed');
                        }
                        else {
                            onLog(5, "[VALIDATION] React Structure Validation Failed: ".concat(reactRes.errors.join(', ')));
                        }
                        // --- Placeholder Detection Validation ---
                        onLog(5, '[VALIDATION] Placeholder Detection Started');
                        return [4 /*yield*/, placeholder_validator_1.PlaceholderValidator.validate(targetDir)];
                    case 43:
                        placeholderRes = _y.sent();
                        if (placeholderRes.isValid) {
                            onLog(5, '[VALIDATION] Placeholder Detection Passed');
                        }
                        else {
                            onLog(5, "[VALIDATION] Placeholder Detection Failed: ".concat(placeholderRes.errors.join(', ')));
                        }
                        allErrors = __spreadArray(__spreadArray(__spreadArray([], astRes.errors, true), reactRes.errors, true), placeholderRes.errors, true);
                        buildOutput = '';
                        buildError = null;
                        if (!(allErrors.length === 0)) return [3 /*break*/, 48];
                        // Run pnpm build
                        onLog(5, '[VALIDATION] Build Validation Started');
                        onLog(5, '[VALIDATION] pnpm install --no-frozen-lockfile');
                        _y.label = 44;
                    case 44:
                        _y.trys.push([44, 47, , 48]);
                        return [4 /*yield*/, execPromise('pnpm install --no-frozen-lockfile', { cwd: targetDir })];
                    case 45:
                        _y.sent();
                        onLog(5, '[VALIDATION] pnpm build');
                        return [4 /*yield*/, execPromise('pnpm run build', { cwd: targetDir })];
                    case 46:
                        stdout = (_y.sent()).stdout;
                        buildOutput = stdout;
                        buildPassed = true; // Build passed!
                        onLog(5, '[VALIDATION] Build Passed');
                        onLog(5, '[VALIDATION] Exit Code: 0');
                        return [3 /*break*/, 48];
                    case 47:
                        e_5 = _y.sent();
                        buildError = e_5.stdout + '\n' + e_5.stderr + '\n' + e_5.message;
                        allErrors.push(buildError);
                        onLog(5, '[VALIDATION] Build Failed');
                        return [3 /*break*/, 48];
                    case 48:
                        if (!!buildPassed) return [3 /*break*/, 50];
                        if (repairAttempts >= maxRepairAttempts) {
                            onLog(5, "[VALIDATION] Validation/Build failed after ".concat(maxRepairAttempts, " repair attempts."));
                            formattedErrors = allErrors.slice(0, 10).map(function (e) { return typeof e === 'string' ? e : "[".concat(e.file, "] ").concat(e.message); });
                            throw new shared_1.RecoverableGenerationError(formattedErrors);
                        }
                        if (repairAttempts > 0 && allErrors.length > previousErrorCount) {
                            onLog(5, "[VALIDATION] WARNING: Error count increased from ".concat(previousErrorCount, " to ").concat(allErrors.length, " after repair. Repair may have introduced new issues."));
                        }
                        previousErrorCount = allErrors.length;
                        onLog(5, "[VALIDATION] Found ".concat(allErrors.length, " errors. Invoking RepairAgent..."));
                        onLog(5, "[VALIDATION] Repair Attempt ".concat(repairAttempts + 1, " Started"));
                        return [4 /*yield*/, repair_agent_1.RepairAgent.repair(targetDir, allErrors)];
                    case 49:
                        repaired = _y.sent();
                        onLog(5, "[VALIDATION] Repair Attempt ".concat(repairAttempts + 1, " Completed"));
                        if (repaired) {
                            onLog(5, "[VALIDATION] RepairAgent completed successfully.");
                        }
                        else {
                            onLog(5, "[VALIDATION] RepairAgent could not identify specific files to repair.");
                        }
                        _y.label = 50;
                    case 50:
                        repairAttempts++;
                        return [3 /*break*/, 37];
                    case 51:
                        if (!buildPassed) {
                            throw new shared_1.RecoverableGenerationError(['Validation failed after max repair attempts and the loop exited without success.']);
                        }
                        onLog(5, '[hybrid-generator] All packages validated.');
                        // === STEP 6.5: Functional Flow Validation ===
                        onLog(5, '[hybrid-generator] Running Functional Flow Validation...');
                        return [4 /*yield*/, functional_flow_validator_1.FunctionalFlowValidator.validate(targetDir, reqs)];
                    case 52:
                        flowRes = _y.sent();
                        if (!flowRes.isValid) {
                            err = flowRes.errors[0];
                            throw new Error("Entity: ".concat(err.entity, "\nMissing: ").concat(err.missing));
                        }
                        // === STEP 7: Metadata ===
                        return [4 /*yield*/, metrics_tracker_1.MetricsTracker.incrementMetric('successfulGenerations')];
                    case 53:
                        // === STEP 7: Metadata ===
                        _y.sent();
                        onLog(5, '[hybrid-generator] Updating project metadata...');
                        _y.label = 54;
                    case 54:
                        _y.trys.push([54, 57, , 58]);
                        metadataPath = path_1.default.join(targetDir, 'metadata.json');
                        _e = (_d = JSON).parse;
                        return [4 /*yield*/, promises_1.default.readFile(metadataPath, 'utf-8')];
                    case 55:
                        existingMeta = _e.apply(_d, [_y.sent()]);
                        updatedMeta = __assign(__assign(__assign({}, existingMeta), reqs), { classifiedMode: 'hybrid-fullstack', needsDatabase: needsDatabase, updatedAt: new Date().toISOString(), generatorVersion: '2.0.0', generatorMode: 'hybrid-fullstack', workspaceIntegrity: true });
                        return [4 /*yield*/, promises_1.default.writeFile(metadataPath, JSON.stringify(updatedMeta, null, 2), 'utf-8')];
                    case 56:
                        _y.sent();
                        return [3 /*break*/, 58];
                    case 57:
                        e_6 = _y.sent();
                        onLog(5, '[WARN] Failed to merge metadata.json');
                        return [3 /*break*/, 58];
                    case 58:
                        workspacePackages = ['frontend/', 'backend/'];
                        if (needsDatabase)
                            workspacePackages.push('database/');
                        generatedFiles = {
                            files: __spreadArray([
                                'package.json', 'pnpm-workspace.yaml', '.npmrc', '.gitignore',
                                '.env.example', 'README.md', 'metadata.json', 'generated-files.json'
                            ], workspacePackages, true),
                        };
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(targetDir, 'generated-files.json'), JSON.stringify(generatedFiles, null, 2), 'utf-8')];
                    case 59:
                        _y.sent();
                        tree = needsDatabase
                            ? "".concat(path_1.default.basename(targetDir), "/\n\u251C\u2500\u2500 package.json\n\u251C\u2500\u2500 pnpm-workspace.yaml\n\u251C\u2500\u2500 frontend/\n\u251C\u2500\u2500 backend/\n\u2514\u2500\u2500 database/")
                            : "".concat(path_1.default.basename(targetDir), "/\n\u251C\u2500\u2500 package.json\n\u251C\u2500\u2500 pnpm-workspace.yaml\n\u251C\u2500\u2500 frontend/\n\u2514\u2500\u2500 backend/");
                        onLog(6, "[hybrid-generator] Final scaffold file count: ".concat(generatedFiles.files.length));
                        onLog(6, "[hybrid-generator] Project tree:\n".concat(tree));
                        onLog(6, '[hybrid-generator] Finalizing project...');
                        _y.label = 60;
                    case 60:
                        _y.trys.push([60, 66, , 67]);
                        artifactsDir = path_1.default.join(targetDir, 'generation-artifacts');
                        gateReportPath = path_1.default.join(artifactsDir, 'gate-report.json');
                        gateFailures = 0;
                        _y.label = 61;
                    case 61:
                        _y.trys.push([61, 63, , 64]);
                        _g = (_f = JSON).parse;
                        return [4 /*yield*/, promises_1.default.readFile(gateReportPath, 'utf-8')];
                    case 62:
                        gateFailures = _g.apply(_f, [_y.sent()]).length;
                        return [3 /*break*/, 64];
                    case 63:
                        e_7 = _y.sent();
                        return [3 /*break*/, 64];
                    case 64:
                        provider = ai_engine_1.ProviderFactory.getProvider();
                        summary = {
                            provider: (_s = (_r = (_q = (_p = provider === null || provider === void 0 ? void 0 : provider.constructor) === null || _p === void 0 ? void 0 : _p.name) === null || _q === void 0 ? void 0 : _q.replace('Provider', '')) === null || _r === void 0 ? void 0 : _r.toLowerCase()) !== null && _s !== void 0 ? _s : 'unknown',
                            model: (_u = (_t = provider === null || provider === void 0 ? void 0 : provider.getModel) === null || _t === void 0 ? void 0 : _t.call(provider)) !== null && _u !== void 0 ? _u : 'unknown',
                            components: ((_v = arch.components) === null || _v === void 0 ? void 0 : _v.length) || 0,
                            hooks: ((_w = arch.hooks) === null || _w === void 0 ? void 0 : _w.length) || 0,
                            services: ((_x = arch.services) === null || _x === void 0 ? void 0 : _x.length) || 0,
                            gateFailures: gateFailures
                        };
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'generation-summary.json'), JSON.stringify(summary, null, 2), 'utf-8')];
                    case 65:
                        _y.sent();
                        return [3 /*break*/, 67];
                    case 66:
                        e_8 = _y.sent();
                        return [3 /*break*/, 67];
                    case 67: return [2 /*return*/];
                }
            });
        });
    };
    // ─────────────────────────────────────────────
    // Detect if the app needs a database
    // ─────────────────────────────────────────────
    HybridGenerator.detectDatabaseNeed = function (reqs) {
        var dbKeywords = [
            'database', 'persist', 'store', 'save', 'user account', 'signup',
            'login', 'auth', 'profile', 'post', 'comment', 'order', 'product',
            'transaction', 'payment', 'subscription', 'cart', 'wishlist',
        ];
        var combinedText = __spreadArray(__spreadArray([reqs.appType], reqs.features, true), reqs.entities, true).join(' ').toLowerCase();
        return dbKeywords.some(function (kw) { return combinedText.includes(kw); }) || reqs.entities.length > 2;
    };
    // ─────────────────────────────────────────────
    // Root workspace
    // ─────────────────────────────────────────────
    HybridGenerator.generateRootWorkspace = function (targetDir, reqs, needsDb) {
        return __awaiter(this, void 0, void 0, function () {
            var slug, workspaces, rootPackageJson, wsEntries, pnpmWorkspace, npmrc, gitignore, envContent, dbSlug, dockerCompose, readme;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, promises_1.default.mkdir(targetDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        slug = reqs.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'generated-app';
                        workspaces = needsDb ? ['frontend', 'backend', 'database'] : ['frontend', 'backend'];
                        rootPackageJson = {
                            name: slug,
                            private: true,
                            version: '0.0.0',
                            workspaces: workspaces,
                            scripts: {
                                dev: 'concurrently "pnpm --dir backend dev" "pnpm --dir frontend dev"',
                                build: 'pnpm -r build',
                            },
                            devDependencies: __assign({ concurrently: '^9.0.0', typescript: '^5.5.3' }, (needsDb ? { prisma: '^5.22.0' } : {})),
                        };
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(targetDir, 'package.json'), JSON.stringify(rootPackageJson, null, 2), 'utf-8')];
                    case 2:
                        _a.sent();
                        wsEntries = workspaces.map(function (w) { return "  - ".concat(w); }).join('\n');
                        pnpmWorkspace = "packages:\n".concat(wsEntries, "\n");
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(targetDir, 'pnpm-workspace.yaml'), pnpmWorkspace, 'utf-8')];
                    case 3:
                        _a.sent();
                        npmrc = ['auto-install-peers=true', 'strict-peer-dependencies=false', ''].join('\n');
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(targetDir, '.npmrc'), npmrc, 'utf-8')];
                    case 4:
                        _a.sent();
                        gitignore = ['node_modules', 'dist', '.env', '.next', 'coverage', '.prisma', 'generated', ''].join('\n');
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(targetDir, '.gitignore'), gitignore, 'utf-8')];
                    case 5:
                        _a.sent();
                        envContent = 'PORT=4000\nVITE_API_URL=http://localhost:4000\n';
                        if (needsDb) {
                            dbSlug = 'websiteGenerator_generated';
                            envContent += "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/".concat(dbSlug, "\n");
                        }
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(targetDir, '.env.example'), envContent, 'utf-8')];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(targetDir, '.env'), envContent, 'utf-8')];
                    case 7:
                        _a.sent();
                        if (!needsDb) return [3 /*break*/, 9];
                        dockerCompose = "version: '3.8'\nservices:\n  db:\n    image: postgres:15\n    environment:\n      POSTGRES_USER: postgres\n      POSTGRES_PASSWORD: postgres\n      POSTGRES_DB: websiteGenerator_generated\n    ports:\n      - \"5432:5432\"\n";
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(targetDir, 'docker-compose.yml'), dockerCompose, 'utf-8')];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9:
                        readme = "# ".concat(reqs.appName, "\nType: ").concat(reqs.appType, "\nMode: Hybrid Fullstack").concat(needsDb ? ' (with Database)' : '', "\n\n## Features\n").concat(reqs.features.map(function (f) { return "- ".concat(f); }).join('\n'), "\n\n## Architecture\nThis is a **hybrid fullstack** application with a React frontend and Express backend.\n").concat(needsDb ? 'PostgreSQL is used for data persistence.' : 'No database is required.', "\n\n## Prerequisites\n- Node.js >= 18\n- pnpm >= 9\n").concat(needsDb ? '- PostgreSQL running on localhost:5432' : '', "\n\n## Getting Started\n\n```bash\n# 1. Install dependencies\npnpm install\n\n# 2. Copy environment config\ncp .env.example .env\n").concat(needsDb ? "\n# 3. Generate Prisma client and push schema\npnpm --filter database run generate\npnpm --filter database run push\n" : '', "\n# Start development servers\npnpm run dev\n```\n\n## Services\n| Service  | Port | Command |\n|----------|------|---------|\n| Frontend | 5173 | `pnpm --dir frontend dev` |\n| Backend  | 4000 | `pnpm --dir backend dev` |\n");
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(targetDir, 'README.md'), readme, 'utf-8')];
                    case 10:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // ─────────────────────────────────────────────
    // Frontend package (similar to FrontendAppGenerator)
    // ─────────────────────────────────────────────
    HybridGenerator.extractCodeBlock = function (text) {
        var match = text.match(/```[a-z]*\n([\s\S]*?)```/);
        return match ? match[1].trim() : text.trim();
    };
    HybridGenerator.generateValidCode = function (provider, prompt, isTsx, artifactName, targetDir, onLog) {
        return __awaiter(this, void 0, void 0, function () {
            var attempts, maxRetries, lastContent, lastErrorMessage, artifactsDir, finalPromptPath, promptData, _a, _b, e_9, e_10, _loop_1, this_1, state_1, failedArtifactsDir, ext;
            var _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        attempts = 0;
                        maxRetries = 3;
                        lastContent = '';
                        lastErrorMessage = '';
                        artifactsDir = path_1.default.join(targetDir, 'generation-artifacts');
                        return [4 /*yield*/, promises_1.default.mkdir(artifactsDir, { recursive: true })];
                    case 1:
                        _h.sent();
                        _h.label = 2;
                    case 2:
                        _h.trys.push([2, 8, , 9]);
                        finalPromptPath = path_1.default.join(artifactsDir, 'final-prompt.json');
                        promptData = [];
                        _h.label = 3;
                    case 3:
                        _h.trys.push([3, 5, , 6]);
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, promises_1.default.readFile(finalPromptPath, 'utf-8')];
                    case 4:
                        promptData = _b.apply(_a, [_h.sent()]);
                        return [3 /*break*/, 6];
                    case 5:
                        e_9 = _h.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        promptData = promptData.filter(function (d) { return d.artifact !== artifactName; });
                        promptData.push({ artifact: artifactName, prompt: prompt });
                        return [4 /*yield*/, promises_1.default.writeFile(finalPromptPath, JSON.stringify(promptData, null, 2), 'utf-8')];
                    case 7:
                        _h.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        e_10 = _h.sent();
                        return [3 /*break*/, 9];
                    case 9:
                        _loop_1 = function () {
                            var currentPrompt, cascadeTracePath, cascadeTrace, _j, _k, e_11, e_12, aiResponse, trace, e_13, rawOutputDir, aiResponsePath, e_14, sanitizedResult, code, e_15, pipelinePath, order, _l, _m, e_16, e_17, sanitizedOutputDir, sanitizedResponsePath, e_18, reportPath, reports, _o, _p, e_19, e_20, extractedCode, diagnosticIntegrityResult, diagnosticCompilationResult, pipelinePath, order, _q, _r, e_21, e_22, extracted, validityGate, iconValidation, e_23, integrityResult, first20Raw, first20Sanitized, reportPath, reportData, fsSync, compilationResult, nonCodeResult, BusinessLogicAudit, PlaceholderBusinessLogicValidator, err_1, e_24, failureStage, debugPath, debugData, _s, _t, e_25, e_26, debugPath, debugData, _u, _v, e_27, e_28, extractedOutputDir, extractedResponsePath, e_29, pipelinePath, order, _w, _x, e_30, e_31, rawContainsThink, sanitizedContainsThink, rawContainsFence, sanitizedContainsFence, conversationalPrefixes, hasConversationalPrefix, syntaxGate, gateReportPath, reports, _y, _z, e_32, syntaxFailReportPath, syntaxReports, _0, _1, e_33, e_34, e_35, pipelinePath, order, _2, _3, e_36, e_37, compileGate, lineMatch, line, codeMatch, errorCode, gateReportPath, reports, _4, _5, e_38, e_39, e_40, e_41;
                            return __generator(this, function (_6) {
                                switch (_6.label) {
                                    case 0:
                                        attempts++;
                                        currentPrompt = prompt;
                                        if (!(attempts > 1)) return [3 /*break*/, 8];
                                        if (lastContent && lastContent.length > 50) {
                                            currentPrompt = "".concat(prompt, "\n\nHere is your previous attempt which failed validation:\n```tsx\n").concat(lastContent, "\n```\n\nIt failed with this error:\n").concat(lastErrorMessage, "\n\nCRITICAL FIX REQUIRED: Fix ONLY this exact error. Do NOT rewrite the entire component. Do NOT add new features. Do NOT change the layout or logic unless directly related to the error. Return the FULL updated file, but KEEP your changes strictly limited to the repair.\n\nRETURN ONLY COMPLETE TYPESCRIPT/TSX SOURCE CODE.");
                                        }
                                        else {
                                            currentPrompt += "\n\nRETURN ONLY COMPLETE TYPESCRIPT/TSX SOURCE CODE.\nDO NOT EXPLAIN.\nDO NOT REASON.\nDO NOT DESCRIBE.\nDO NOT USE NATURAL LANGUAGE.\nDO NOT STOP MID-FILE.\nRETURN THE FULL FILE FROM FIRST LINE TO LAST LINE.\n";
                                            if (lastErrorMessage) {
                                                if (lastErrorMessage.includes('COMPONENT_TOO_LARGE')) {
                                                    currentPrompt += "\n\nCRITICAL FIX REQUIRED: The previous attempt failed because the component was too large. YOU MUST extract child components and avoid monolithic 'God Objects'. Do not inline all JSX and state. You MUST import and compose your sibling components based on the architecture manifest.\n";
                                                }
                                                else if (lastErrorMessage.includes('COMPILE_ERROR')) {
                                                    currentPrompt += "\n\nCRITICAL FIX REQUIRED: The previous attempt failed compilation with the following error:\n".concat(lastErrorMessage, "\nPlease fix the TypeScript errors in your next response.\n");
                                                }
                                                else {
                                                    currentPrompt += "\n\nCRITICAL FIX REQUIRED: The previous attempt failed with the following error:\n".concat(lastErrorMessage, "\nPlease fix this error in your next response.\n");
                                                }
                                            }
                                        }
                                        _6.label = 1;
                                    case 1:
                                        _6.trys.push([1, 7, , 8]);
                                        cascadeTracePath = path_1.default.join(artifactsDir, 'retry-cascade-trace.json');
                                        cascadeTrace = [];
                                        _6.label = 2;
                                    case 2:
                                        _6.trys.push([2, 4, , 5]);
                                        _k = (_j = JSON).parse;
                                        return [4 /*yield*/, promises_1.default.readFile(cascadeTracePath, 'utf-8')];
                                    case 3:
                                        cascadeTrace = _k.apply(_j, [_6.sent()]);
                                        return [3 /*break*/, 5];
                                    case 4:
                                        e_11 = _6.sent();
                                        return [3 /*break*/, 5];
                                    case 5:
                                        cascadeTrace.push({
                                            artifact: artifactName,
                                            attempt: attempts,
                                            previousFailureReason: lastErrorMessage,
                                            retryPromptLength: currentPrompt.length,
                                            lastContentSize: lastContent ? lastContent.length : 0,
                                            timestamp: new Date().toISOString()
                                        });
                                        return [4 /*yield*/, promises_1.default.writeFile(cascadeTracePath, JSON.stringify(cascadeTrace, null, 2), 'utf-8')];
                                    case 6:
                                        _6.sent();
                                        return [3 /*break*/, 8];
                                    case 7:
                                        e_12 = _6.sent();
                                        return [3 /*break*/, 8];
                                    case 8: return [4 /*yield*/, this_1.generateTextWithRetry(provider, currentPrompt)];
                                    case 9:
                                        aiResponse = _6.sent();
                                        trace = null;
                                        _6.label = 10;
                                    case 10:
                                        _6.trys.push([10, 13, , 14]);
                                        return [4 /*yield*/, pipeline_tracer_1.PipelineTracer.initializeTrace(targetDir, artifactName, provider.id || 'unknown', provider.model || 'unknown')];
                                    case 11:
                                        trace = _6.sent();
                                        return [4 /*yield*/, pipeline_tracer_1.PipelineTracer.recordRaw(targetDir, trace, aiResponse)];
                                    case 12:
                                        _6.sent();
                                        return [3 /*break*/, 14];
                                    case 13:
                                        e_13 = _6.sent();
                                        return [3 /*break*/, 14];
                                    case 14:
                                        _6.trys.push([14, 17, , 18]);
                                        rawOutputDir = path_1.default.join(artifactsDir, 'raw-output');
                                        return [4 /*yield*/, promises_1.default.mkdir(rawOutputDir, { recursive: true })];
                                    case 15:
                                        _6.sent();
                                        aiResponsePath = path_1.default.join(rawOutputDir, "".concat(artifactName, ".attempt").concat(attempts, ".txt"));
                                        return [4 /*yield*/, promises_1.default.writeFile(aiResponsePath, aiResponse, 'utf-8')];
                                    case 16:
                                        _6.sent();
                                        return [3 /*break*/, 18];
                                    case 17:
                                        e_14 = _6.sent();
                                        return [3 /*break*/, 18];
                                    case 18:
                                        // [PIPELINE] output sanitizer
                                        onLog(4, '[PIPELINE]\nOutputSanitizer executed');
                                        sanitizedResult = output_sanitizer_1.OutputSanitizer.sanitizeWithDiagnostics(aiResponse);
                                        code = sanitizedResult.code;
                                        if (!code) {
                                            code = this_1.extractCodeBlock(aiResponse);
                                            sanitizedResult = output_sanitizer_1.OutputSanitizer.sanitizeWithDiagnostics(code);
                                            code = sanitizedResult.code;
                                        }
                                        _6.label = 19;
                                    case 19:
                                        _6.trys.push([19, 22, , 23]);
                                        if (!trace) return [3 /*break*/, 21];
                                        return [4 /*yield*/, pipeline_tracer_1.PipelineTracer.recordSanitized(targetDir, trace, code)];
                                    case 20:
                                        _6.sent();
                                        _6.label = 21;
                                    case 21: return [3 /*break*/, 23];
                                    case 22:
                                        e_15 = _6.sent();
                                        return [3 /*break*/, 23];
                                    case 23:
                                        _6.trys.push([23, 29, , 30]);
                                        pipelinePath = path_1.default.join(artifactsDir, 'pipeline-order.json');
                                        order = [];
                                        _6.label = 24;
                                    case 24:
                                        _6.trys.push([24, 26, , 27]);
                                        _m = (_l = JSON).parse;
                                        return [4 /*yield*/, promises_1.default.readFile(pipelinePath, 'utf-8')];
                                    case 25:
                                        order = _m.apply(_l, [_6.sent()]);
                                        return [3 /*break*/, 27];
                                    case 26:
                                        e_16 = _6.sent();
                                        return [3 /*break*/, 27];
                                    case 27:
                                        order.push("[Attempt ".concat(attempts, "] OutputSanitizer executed"));
                                        return [4 /*yield*/, promises_1.default.writeFile(pipelinePath, JSON.stringify(order, null, 2), 'utf-8')];
                                    case 28:
                                        _6.sent();
                                        return [3 /*break*/, 30];
                                    case 29:
                                        e_17 = _6.sent();
                                        return [3 /*break*/, 30];
                                    case 30:
                                        _6.trys.push([30, 33, , 34]);
                                        sanitizedOutputDir = path_1.default.join(artifactsDir, 'sanitized-output');
                                        return [4 /*yield*/, promises_1.default.mkdir(sanitizedOutputDir, { recursive: true })];
                                    case 31:
                                        _6.sent();
                                        sanitizedResponsePath = path_1.default.join(sanitizedOutputDir, "".concat(artifactName, ".attempt").concat(attempts, ".txt"));
                                        return [4 /*yield*/, promises_1.default.writeFile(sanitizedResponsePath, code, 'utf-8')];
                                    case 32:
                                        _6.sent();
                                        return [3 /*break*/, 34];
                                    case 33:
                                        e_18 = _6.sent();
                                        return [3 /*break*/, 34];
                                    case 34:
                                        _6.trys.push([34, 40, , 41]);
                                        reportPath = path_1.default.join(artifactsDir, 'sanitizer-report.json');
                                        reports = [];
                                        _6.label = 35;
                                    case 35:
                                        _6.trys.push([35, 37, , 38]);
                                        _p = (_o = JSON).parse;
                                        return [4 /*yield*/, promises_1.default.readFile(reportPath, 'utf-8')];
                                    case 36:
                                        reports = _p.apply(_o, [_6.sent()]);
                                        return [3 /*break*/, 38];
                                    case 37:
                                        e_19 = _6.sent();
                                        return [3 /*break*/, 38];
                                    case 38:
                                        reports.push({
                                            artifact: artifactName,
                                            attempt: attempts,
                                            diagnostics: sanitizedResult.diagnostics,
                                            timestamp: new Date().toISOString()
                                        });
                                        return [4 /*yield*/, promises_1.default.writeFile(reportPath, JSON.stringify(reports, null, 2), 'utf-8')];
                                    case 39:
                                        _6.sent();
                                        return [3 /*break*/, 41];
                                    case 40:
                                        e_20 = _6.sent();
                                        return [3 /*break*/, 41];
                                    case 41:
                                        onLog(4, '[PIPELINE]\nCodeExtractor executed');
                                        extractedCode = code;
                                        diagnosticIntegrityResult = null;
                                        diagnosticCompilationResult = null;
                                        _6.label = 42;
                                    case 42:
                                        _6.trys.push([42, 48, , 49]);
                                        pipelinePath = path_1.default.join(artifactsDir, 'pipeline-order.json');
                                        order = [];
                                        _6.label = 43;
                                    case 43:
                                        _6.trys.push([43, 45, , 46]);
                                        _r = (_q = JSON).parse;
                                        return [4 /*yield*/, promises_1.default.readFile(pipelinePath, 'utf-8')];
                                    case 44:
                                        order = _r.apply(_q, [_6.sent()]);
                                        return [3 /*break*/, 46];
                                    case 45:
                                        e_21 = _6.sent();
                                        return [3 /*break*/, 46];
                                    case 46:
                                        order.push("[Attempt ".concat(attempts, "] CodeExtractor executed"));
                                        return [4 /*yield*/, promises_1.default.writeFile(pipelinePath, JSON.stringify(order, null, 2), 'utf-8')];
                                    case 47:
                                        _6.sent();
                                        return [3 /*break*/, 49];
                                    case 48:
                                        e_22 = _6.sent();
                                        return [3 /*break*/, 49];
                                    case 49:
                                        _6.trys.push([49, 55, , 79]);
                                        extracted = code_extractor_1.CodeExtractor.extractCodeArtifact(code, isTsx, artifactName, true);
                                        if (!extracted.success) {
                                            if ((_c = extracted.reason) === null || _c === void 0 ? void 0 : _c.startsWith('INCOMPLETE_ARTIFACT')) {
                                                throw new Error(extracted.reason);
                                            }
                                            throw new Error(extracted.reason || "INVALID_CODE_ARTIFACT");
                                        }
                                        extractedCode = extracted.code;
                                        validityGate = code_validity_gate_1.CodeValidityGate.validate(extractedCode);
                                        if (!validityGate.isValid) {
                                            throw new Error(validityGate.reason || "INVALID_TYPESCRIPT_ARTIFACT");
                                        }
                                        iconValidation = lucide_icon_validator_1.LucideIconValidator.validate(extractedCode);
                                        if (!iconValidation.isValid) {
                                            throw new Error(iconValidation.reason || "INVALID_LUCIDE_ICON");
                                        }
                                        _6.label = 50;
                                    case 50:
                                        _6.trys.push([50, 53, , 54]);
                                        if (!trace) return [3 /*break*/, 52];
                                        return [4 /*yield*/, pipeline_tracer_1.PipelineTracer.recordExtracted(targetDir, trace, extractedCode, code)];
                                    case 51:
                                        _6.sent();
                                        _6.label = 52;
                                    case 52:
                                        pipeline_tracer_1.PipelineTracer.runCorruptionDetector(extractedCode);
                                        return [3 /*break*/, 54];
                                    case 53:
                                        e_23 = _6.sent();
                                        throw new Error(e_23.message);
                                    case 54:
                                        integrityResult = artifact_integrity_validator_1.ArtifactIntegrityValidator.validate(extractedCode, artifactName, isTsx);
                                        diagnosticIntegrityResult = integrityResult;
                                        if (!integrityResult.valid) {
                                            onLog(4, "[ARTIFACT INTEGRITY FAILURE]\nArtifact: ".concat(artifactName, "\nReason: ").concat(integrityResult.reason, "\nPreview: ").concat(integrityResult.preview));
                                            if ((_d = integrityResult.reason) === null || _d === void 0 ? void 0 : _d.startsWith('INCOMPLETE_ARTIFACT')) {
                                                throw new Error("INCOMPLETE_ARTIFACT: " + integrityResult.reason);
                                            }
                                            else {
                                                try {
                                                    first20Raw = aiResponse.split('\n').slice(0, 20).join('\n');
                                                    first20Sanitized = extractedCode.split('\n').slice(0, 20).join('\n');
                                                    reportPath = path_1.default.join(process.cwd(), 'generation-artifacts', 'rejection-report.json');
                                                    reportData = [];
                                                    fsSync = require('fs');
                                                    if (fsSync.existsSync(reportPath)) {
                                                        try {
                                                            reportData = JSON.parse(fsSync.readFileSync(reportPath, 'utf8'));
                                                        }
                                                        catch (e) { }
                                                    }
                                                    reportData.push({
                                                        artifact: artifactName,
                                                        rawOutputFirst20: first20Raw,
                                                        sanitizedOutputFirst20: first20Sanitized,
                                                        rejectionRule: "ArtifactIntegrityValidator: " + integrityResult.reason
                                                    });
                                                    fsSync.mkdirSync(path_1.default.dirname(reportPath), { recursive: true });
                                                    fsSync.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf8');
                                                }
                                                catch (e) { }
                                                throw new Error("ARTIFACT_INTEGRITY_FAILURE: " + integrityResult.reason);
                                            }
                                        }
                                        compilationResult = compilation_validator_1.CompilationValidator.validate(extractedCode, isTsx, targetDir);
                                        diagnosticCompilationResult = compilationResult;
                                        if (!compilationResult.success) {
                                            throw new Error("COMPILATION_VALIDATION_FAILURE");
                                        }
                                        nonCodeResult = non_code_detector_1.NonCodeDetector.validate(extractedCode);
                                        if (!nonCodeResult.valid) {
                                            throw new Error(nonCodeResult.reason);
                                        }
                                        BusinessLogicAudit = require('./business-logic-audit').BusinessLogicAudit;
                                        if (isTsx) {
                                            BusinessLogicAudit.auditFrontend(extractedCode, []);
                                        }
                                        PlaceholderBusinessLogicValidator = require('../validators/placeholder-validator').PlaceholderBusinessLogicValidator;
                                        PlaceholderBusinessLogicValidator.audit(extractedCode);
                                        return [3 /*break*/, 79];
                                    case 55:
                                        err_1 = _6.sent();
                                        onLog(4, "[GENERATION]\nArtifact: ".concat(artifactName, "\nAttempt: ").concat(attempts, "\n\nCodeValidation:\nFAILED\n\nReason:\n").concat(err_1.message));
                                        return [4 /*yield*/, this_1.recordRootCause(targetDir, artifactName, attempts, 'NonCodeDetector', 'INVALID_NON_CODE_OUTPUT', err_1.message, 1)];
                                    case 56:
                                        _6.sent();
                                        lastContent = aiResponse;
                                        lastErrorMessage = err_1.message;
                                        _6.label = 57;
                                    case 57:
                                        _6.trys.push([57, 59, , 60]);
                                        return [4 /*yield*/, pipeline_tracer_1.PipelineTracer.updateHealth(targetDir, 'corruption')];
                                    case 58:
                                        _6.sent();
                                        return [3 /*break*/, 60];
                                    case 59:
                                        e_24 = _6.sent();
                                        return [3 /*break*/, 60];
                                    case 60:
                                        failureStage = 'CodeValidation';
                                        if (err_1.message.includes('REASONING_DETECTED'))
                                            failureStage = 'CodePresenceGate';
                                        else if (err_1.message.includes('INVALID_REASONING_ARTIFACT'))
                                            failureStage = 'CodeExtractor';
                                        else if (err_1.message.includes('Contains reasoning phrase') || err_1.message.includes('English sentences'))
                                            failureStage = 'ArtifactIntegrityValidator';
                                        if (!(err_1.message.includes('REASONING') || err_1.message.includes('OUTPUT_SANITIZER_FAILURE') || err_1.message.includes('reasoning phrase') || err_1.message.includes('English sentences'))) return [3 /*break*/, 68];
                                        _6.label = 61;
                                    case 61:
                                        _6.trys.push([61, 67, , 68]);
                                        debugPath = path_1.default.join(artifactsDir, 'reasoning-failure-debug.json');
                                        debugData = [];
                                        _6.label = 62;
                                    case 62:
                                        _6.trys.push([62, 64, , 65]);
                                        _t = (_s = JSON).parse;
                                        return [4 /*yield*/, promises_1.default.readFile(debugPath, 'utf-8')];
                                    case 63:
                                        debugData = _t.apply(_s, [_6.sent()]);
                                        return [3 /*break*/, 65];
                                    case 64:
                                        e_25 = _6.sent();
                                        return [3 /*break*/, 65];
                                    case 65:
                                        debugData.push({
                                            componentName: artifactName,
                                            rawOutput: aiResponse,
                                            sanitizedOutput: code,
                                            extractedCode: extractedCode || null,
                                            integrityValidatorResult: diagnosticIntegrityResult || null,
                                            compilationValidatorResult: diagnosticCompilationResult || null,
                                            exactFailureStage: failureStage
                                        });
                                        return [4 /*yield*/, promises_1.default.writeFile(debugPath, JSON.stringify(debugData, null, 2), 'utf-8')];
                                    case 66:
                                        _6.sent();
                                        return [3 /*break*/, 68];
                                    case 67:
                                        e_26 = _6.sent();
                                        return [3 /*break*/, 68];
                                    case 68:
                                        _6.trys.push([68, 77, , 78]);
                                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'raw-output.txt'), aiResponse, 'utf-8')];
                                    case 69:
                                        _6.sent();
                                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'sanitized-output.txt'), code, 'utf-8')];
                                    case 70:
                                        _6.sent();
                                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(artifactsDir, 'extracted-output.txt'), extractedCode, 'utf-8')];
                                    case 71:
                                        _6.sent();
                                        debugPath = path_1.default.join(artifactsDir, 'pipeline-debug.json');
                                        debugData = [];
                                        _6.label = 72;
                                    case 72:
                                        _6.trys.push([72, 74, , 75]);
                                        _v = (_u = JSON).parse;
                                        return [4 /*yield*/, promises_1.default.readFile(debugPath, 'utf-8')];
                                    case 73:
                                        debugData = _v.apply(_u, [_6.sent()]);
                                        return [3 /*break*/, 75];
                                    case 74:
                                        e_27 = _6.sent();
                                        return [3 /*break*/, 75];
                                    case 75:
                                        debugData.push({
                                            componentName: artifactName,
                                            rawOutput: aiResponse,
                                            sanitizedOutput: code,
                                            extractedCode: extractedCode,
                                            failureCategory: err_1.message,
                                            validatorResults: {
                                                artifactIntegrity: diagnosticIntegrityResult,
                                                compilation: diagnosticCompilationResult
                                            },
                                            timestamp: new Date().toISOString()
                                        });
                                        return [4 /*yield*/, promises_1.default.writeFile(debugPath, JSON.stringify(debugData, null, 2), 'utf-8')];
                                    case 76:
                                        _6.sent();
                                        return [3 /*break*/, 78];
                                    case 77:
                                        e_28 = _6.sent();
                                        return [3 /*break*/, 78];
                                    case 78: return [2 /*return*/, "continue"];
                                    case 79:
                                        _6.trys.push([79, 82, , 83]);
                                        extractedOutputDir = path_1.default.join(artifactsDir, 'extracted-output');
                                        return [4 /*yield*/, promises_1.default.mkdir(extractedOutputDir, { recursive: true })];
                                    case 80:
                                        _6.sent();
                                        extractedResponsePath = path_1.default.join(extractedOutputDir, "".concat(artifactName, ".attempt").concat(attempts, ".tsx"));
                                        return [4 /*yield*/, promises_1.default.writeFile(extractedResponsePath, extractedCode, 'utf-8')];
                                    case 81:
                                        _6.sent();
                                        return [3 /*break*/, 83];
                                    case 82:
                                        e_29 = _6.sent();
                                        return [3 /*break*/, 83];
                                    case 83:
                                        code = extractedCode;
                                        lastContent = code;
                                        onLog(4, '[PIPELINE]\nSyntaxGate executed');
                                        _6.label = 84;
                                    case 84:
                                        _6.trys.push([84, 90, , 91]);
                                        pipelinePath = path_1.default.join(artifactsDir, 'pipeline-order.json');
                                        order = [];
                                        _6.label = 85;
                                    case 85:
                                        _6.trys.push([85, 87, , 88]);
                                        _x = (_w = JSON).parse;
                                        return [4 /*yield*/, promises_1.default.readFile(pipelinePath, 'utf-8')];
                                    case 86:
                                        order = _x.apply(_w, [_6.sent()]);
                                        return [3 /*break*/, 88];
                                    case 87:
                                        e_30 = _6.sent();
                                        return [3 /*break*/, 88];
                                    case 88:
                                        order.push("[Attempt ".concat(attempts, "] SyntaxGate executed"));
                                        return [4 /*yield*/, promises_1.default.writeFile(pipelinePath, JSON.stringify(order, null, 2), 'utf-8')];
                                    case 89:
                                        _6.sent();
                                        return [3 /*break*/, 91];
                                    case 90:
                                        e_31 = _6.sent();
                                        return [3 /*break*/, 91];
                                    case 91:
                                        rawContainsThink = aiResponse.toLowerCase().includes('<think');
                                        sanitizedContainsThink = code.toLowerCase().includes('<think');
                                        rawContainsFence = aiResponse.includes('```');
                                        sanitizedContainsFence = code.includes('```');
                                        console.log("[DEBUG]\nRAW OUTPUT LENGTH: ".concat(aiResponse.length, "\nSANITIZED OUTPUT LENGTH: ").concat(code.length, "\nrawContainsThink=").concat(rawContainsThink, "\nsanitizedContainsThink=").concat(sanitizedContainsThink, "\nrawContainsFence=").concat(rawContainsFence, "\nsanitizedContainsFence=").concat(sanitizedContainsFence));
                                        conversationalPrefixes = [
                                            /^here is/i, /^sure/i, /^this component/i, /^typescript\s*$/im, /^tsx\s*$/im
                                        ];
                                        hasConversationalPrefix = conversationalPrefixes.some(function (p) { return p.test(code.trimStart()); });
                                        if (!hasConversationalPrefix) return [3 /*break*/, 93];
                                        onLog(4, "[GENERATION]\nArtifact: ".concat(artifactName, "\nAttempt: ").concat(attempts, "\n\nPreParseGate:\nFAILED\n\nReason:\nOutput starts with forbidden conversational text."));
                                        return [4 /*yield*/, this_1.recordRootCause(targetDir, artifactName, attempts, 'PreParseGate', 'CONVERSATIONAL_TEXT', 'Output contains conversational prefix', 1)];
                                    case 92:
                                        _6.sent();
                                        return [2 /*return*/, "continue"];
                                    case 93:
                                        console.log("[DEBUG] extracted code preview", code.slice(0, 200));
                                        syntaxGate = syntax_gate_1.SyntaxGate.validate(code, isTsx);
                                        if (!!syntaxGate.isValid) return [3 /*break*/, 114];
                                        onLog(4, "[GENERATION]\nArtifact: ".concat(artifactName, "\nAttempt: ").concat(attempts, "\n\nSyntaxGate:\nFAILED\n\nReason:\n").concat(syntaxGate.error));
                                        onLog(4, "[SYNTAX FAILURE]\nArtifact: ".concat(artifactName, "\nGenerated Output Preview: ").concat(code.slice(0, 300), "\nParser Error:\n").concat(syntaxGate.error, "\n\nFirst 20 lines:\n").concat(code.split('\\n').slice(0, 20).join('\\n')));
                                        return [4 /*yield*/, this_1.recordRootCause(targetDir, artifactName, attempts, 'SyntaxGate', 'SYNTAX_ERROR', syntaxGate.error || 'Syntax parsing failed', 1)];
                                    case 94:
                                        _6.sent();
                                        lastContent = extractedCode || code;
                                        lastErrorMessage = syntaxGate.error || 'Syntax parsing failed';
                                        return [4 /*yield*/, metrics_tracker_1.MetricsTracker.incrementMetric('syntaxGateFailures')];
                                    case 95:
                                        _6.sent();
                                        _6.label = 96;
                                    case 96:
                                        _6.trys.push([96, 107, , 108]);
                                        gateReportPath = path_1.default.join(artifactsDir, 'gate-report.json');
                                        reports = [];
                                        _6.label = 97;
                                    case 97:
                                        _6.trys.push([97, 99, , 100]);
                                        _z = (_y = JSON).parse;
                                        return [4 /*yield*/, promises_1.default.readFile(gateReportPath, 'utf-8')];
                                    case 98:
                                        reports = _z.apply(_y, [_6.sent()]);
                                        return [3 /*break*/, 100];
                                    case 99:
                                        e_32 = _6.sent();
                                        return [3 /*break*/, 100];
                                    case 100:
                                        reports.push({ artifact: artifactName, attempt: attempts, gate: 'SyntaxGate', error: syntaxGate.error, timestamp: new Date().toISOString() });
                                        return [4 /*yield*/, promises_1.default.writeFile(gateReportPath, JSON.stringify(reports, null, 2), 'utf-8')];
                                    case 101:
                                        _6.sent();
                                        syntaxFailReportPath = path_1.default.join(artifactsDir, 'syntax-failure-report.json');
                                        syntaxReports = [];
                                        _6.label = 102;
                                    case 102:
                                        _6.trys.push([102, 104, , 105]);
                                        _1 = (_0 = JSON).parse;
                                        return [4 /*yield*/, promises_1.default.readFile(syntaxFailReportPath, 'utf-8')];
                                    case 103:
                                        syntaxReports = _1.apply(_0, [_6.sent()]);
                                        return [3 /*break*/, 105];
                                    case 104:
                                        e_33 = _6.sent();
                                        return [3 /*break*/, 105];
                                    case 105:
                                        syntaxReports.push({
                                            artifact: artifactName,
                                            rawPreview: aiResponse.slice(0, 300),
                                            sanitizedPreview: code.slice(0, 300),
                                            parserError: syntaxGate.error
                                        });
                                        return [4 /*yield*/, promises_1.default.writeFile(syntaxFailReportPath, JSON.stringify(syntaxReports, null, 2), 'utf-8')];
                                    case 106:
                                        _6.sent();
                                        return [3 /*break*/, 108];
                                    case 107:
                                        e_34 = _6.sent();
                                        return [3 /*break*/, 108];
                                    case 108:
                                        _6.trys.push([108, 112, , 113]);
                                        if (!trace) return [3 /*break*/, 111];
                                        trace.syntaxGate.passed = false;
                                        trace.syntaxGate.error = syntaxGate.error;
                                        return [4 /*yield*/, pipeline_tracer_1.PipelineTracer.saveTrace(targetDir, trace)];
                                    case 109:
                                        _6.sent();
                                        return [4 /*yield*/, pipeline_tracer_1.PipelineTracer.updateHealth(targetDir, 'syntax')];
                                    case 110:
                                        _6.sent();
                                        _6.label = 111;
                                    case 111: return [3 /*break*/, 113];
                                    case 112:
                                        e_35 = _6.sent();
                                        return [3 /*break*/, 113];
                                    case 113: return [2 /*return*/, "continue"];
                                    case 114:
                                        onLog(4, '[PIPELINE]\nCompileGate executed');
                                        _6.label = 115;
                                    case 115:
                                        _6.trys.push([115, 121, , 122]);
                                        pipelinePath = path_1.default.join(artifactsDir, 'pipeline-order.json');
                                        order = [];
                                        _6.label = 116;
                                    case 116:
                                        _6.trys.push([116, 118, , 119]);
                                        _3 = (_2 = JSON).parse;
                                        return [4 /*yield*/, promises_1.default.readFile(pipelinePath, 'utf-8')];
                                    case 117:
                                        order = _3.apply(_2, [_6.sent()]);
                                        return [3 /*break*/, 119];
                                    case 118:
                                        e_36 = _6.sent();
                                        return [3 /*break*/, 119];
                                    case 119:
                                        order.push("[Attempt ".concat(attempts, "] CompileGate executed"));
                                        return [4 /*yield*/, promises_1.default.writeFile(pipelinePath, JSON.stringify(order, null, 2), 'utf-8')];
                                    case 120:
                                        _6.sent();
                                        return [3 /*break*/, 122];
                                    case 121:
                                        e_37 = _6.sent();
                                        return [3 /*break*/, 122];
                                    case 122:
                                        compileGate = compile_gate_1.CompileGate.validate(code, isTsx, artifactName, artifactsDir);
                                        if (!!compileGate.isValid) return [3 /*break*/, 138];
                                        lineMatch = ((_e = compileGate.error) === null || _e === void 0 ? void 0 : _e.match(/Line (\d+)/i)) || ((_f = compileGate.error) === null || _f === void 0 ? void 0 : _f.match(/\((\d+),/));
                                        line = lineMatch ? parseInt(lineMatch[1]) : 1;
                                        codeMatch = (_g = compileGate.error) === null || _g === void 0 ? void 0 : _g.match(/(TS\d+)/);
                                        errorCode = codeMatch ? codeMatch[1] : 'COMPILE_ERROR';
                                        onLog(4, "[GENERATION]\nArtifact: ".concat(artifactName, "\nAttempt: ").concat(attempts, "\n\nCompileGate:\nFAILED\n\n").concat(errorCode, " ").concat(compileGate.error, "\n\nLine ").concat(line));
                                        return [4 /*yield*/, this_1.recordRootCause(targetDir, artifactName, attempts, 'CompileGate', errorCode, compileGate.error || 'Compilation failed', line)];
                                    case 123:
                                        _6.sent();
                                        lastContent = extractedCode || code;
                                        lastErrorMessage = compileGate.error || 'Compilation failed';
                                        return [4 /*yield*/, metrics_tracker_1.MetricsTracker.incrementMetric('compileGateFailures')];
                                    case 124:
                                        _6.sent();
                                        _6.label = 125;
                                    case 125:
                                        _6.trys.push([125, 131, , 132]);
                                        gateReportPath = path_1.default.join(artifactsDir, 'gate-report.json');
                                        reports = [];
                                        _6.label = 126;
                                    case 126:
                                        _6.trys.push([126, 128, , 129]);
                                        _5 = (_4 = JSON).parse;
                                        return [4 /*yield*/, promises_1.default.readFile(gateReportPath, 'utf-8')];
                                    case 127:
                                        reports = _5.apply(_4, [_6.sent()]);
                                        return [3 /*break*/, 129];
                                    case 128:
                                        e_38 = _6.sent();
                                        return [3 /*break*/, 129];
                                    case 129:
                                        reports.push({ artifact: artifactName, attempt: attempts, gate: 'CompileGate', error: compileGate.error, timestamp: new Date().toISOString() });
                                        return [4 /*yield*/, promises_1.default.writeFile(gateReportPath, JSON.stringify(reports, null, 2), 'utf-8')];
                                    case 130:
                                        _6.sent();
                                        return [3 /*break*/, 132];
                                    case 131:
                                        e_39 = _6.sent();
                                        return [3 /*break*/, 132];
                                    case 132:
                                        _6.trys.push([132, 136, , 137]);
                                        if (!trace) return [3 /*break*/, 135];
                                        trace.compileGate.passed = false;
                                        trace.compileGate.error = compileGate.error;
                                        return [4 /*yield*/, pipeline_tracer_1.PipelineTracer.saveTrace(targetDir, trace)];
                                    case 133:
                                        _6.sent();
                                        return [4 /*yield*/, pipeline_tracer_1.PipelineTracer.updateHealth(targetDir, 'compile')];
                                    case 134:
                                        _6.sent();
                                        _6.label = 135;
                                    case 135: return [3 /*break*/, 137];
                                    case 136:
                                        e_40 = _6.sent();
                                        return [3 /*break*/, 137];
                                    case 137: return [2 /*return*/, "continue"];
                                    case 138:
                                        _6.trys.push([138, 142, , 143]);
                                        if (!trace) return [3 /*break*/, 141];
                                        trace.syntaxGate.passed = true;
                                        trace.compileGate.passed = true;
                                        return [4 /*yield*/, pipeline_tracer_1.PipelineTracer.saveTrace(targetDir, trace)];
                                    case 139:
                                        _6.sent();
                                        return [4 /*yield*/, pipeline_tracer_1.PipelineTracer.updateHealth(targetDir, 'success')];
                                    case 140:
                                        _6.sent();
                                        _6.label = 141;
                                    case 141: return [3 /*break*/, 143];
                                    case 142:
                                        e_41 = _6.sent();
                                        return [3 /*break*/, 143];
                                    case 143:
                                        if (code.includes('<TRACEABILITY_FAILURE>')) {
                                            throw new Error('Generation failure: Missing requirement coverage detected by LLM during generation.');
                                        }
                                        return [2 /*return*/, { value: code }];
                                }
                            });
                        };
                        this_1 = this;
                        _h.label = 10;
                    case 10:
                        if (!(attempts < maxRetries)) return [3 /*break*/, 12];
                        return [5 /*yield**/, _loop_1()];
                    case 11:
                        state_1 = _h.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        return [3 /*break*/, 10];
                    case 12:
                        failedArtifactsDir = path_1.default.join(targetDir, 'generation-artifacts', 'failed-artifacts');
                        return [4 /*yield*/, promises_1.default.mkdir(failedArtifactsDir, { recursive: true })];
                    case 13:
                        _h.sent();
                        ext = isTsx ? 'tsx' : 'ts';
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(failedArtifactsDir, "".concat(artifactName, ".attempt").concat(attempts, ".").concat(ext)), lastContent, 'utf-8')];
                    case 14:
                        _h.sent();
                        throw new Error("Generation gates failed after ".concat(maxRetries, " attempts. Generation aborted for this artifact."));
                }
            });
        });
    };
    HybridGenerator.recordRootCause = function (targetDir, artifact, attempt, gate, errorCode, message, line) {
        return __awaiter(this, void 0, void 0, function () {
            var reportPath, data, content, e_42, e_43;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        reportPath = path_1.default.join(targetDir, 'generation-artifacts', 'root-cause-report.json');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, promises_1.default.mkdir(path_1.default.dirname(reportPath), { recursive: true })];
                    case 2:
                        _a.sent();
                        data = [];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, promises_1.default.readFile(reportPath, 'utf-8')];
                    case 4:
                        content = _a.sent();
                        data = JSON.parse(content);
                        return [3 /*break*/, 6];
                    case 5:
                        e_42 = _a.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        if (!!data.some(function (d) { return d.artifact === artifact; })) return [3 /*break*/, 8];
                        data.push({ artifact: artifact, attempt: attempt, gate: gate, errorCode: errorCode, message: message, line: line });
                        return [4 /*yield*/, promises_1.default.writeFile(reportPath, JSON.stringify(data, null, 2), 'utf-8')];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        e_43 = _a.sent();
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    HybridGenerator.generateFrontendPackage = function (frontendDir, reqs, onLog) {
        return __awaiter(this, void 0, void 0, function () {
            var provider, packageJson, viteConfig, tailwindConfig, postcssConfig, indexHtml, srcDir, mainTsx, indexCss, viteEnvDts, arch, hasProtectedPages, appTsx, _i, _a, page, _b, _c, page, element, rolesAttr, _d, _e, comp, compPath, prompt_1, compTsx, e_44, _f, _g, svc, svcPath, apiAuthorityRules, prompt_2, svcTs, e_45, serviceSignatures, hasServices, _h, _j, svc, svcCode, _k, _l, _m, hook, hookPath, serviceBlock, serviceRequirements, servicesList, serviceContext, _o, _p, _q, svcName, svcCode, prompt_3, hookTs, e_46, hookSignatures, _r, _s, hook, hookCode, _t, componentSignatures, _u, _v, comp, compCode, _w, _x, _y, page, pagePath, hooksList, componentsList, hookContext, _z, _0, _1, hookName, hookCode, compContext, _2, _3, _4, compName, compCode, prompt_4, pageTsx, e_47, componentsIndex, _5, _6, comp, servicesIndex, _7, _8, svc, hooksIndex, _9, _10, hook, pagesIndex, _11, _12, page, projectRoot, importResult, brokenByFile, _13, _14, err, absPath, _15, _16, _17, absFilePath, brokenPaths, cleaned, recheck, _18, _19, err, tsconfig;
            return __generator(this, function (_20) {
                switch (_20.label) {
                    case 0:
                        provider = ai_engine_1.ProviderFactory.getProvider();
                        return [4 /*yield*/, promises_1.default.mkdir(frontendDir, { recursive: true })];
                    case 1:
                        _20.sent();
                        packageJson = {
                            name: 'frontend',
                            private: true,
                            version: '0.0.0',
                            type: 'module',
                            scripts: {
                                dev: 'vite',
                                build: 'tsc -b && vite build',
                                lint: 'eslint .',
                                preview: 'vite preview',
                            },
                            dependencies: {
                                react: '^18.3.1',
                                'react-dom': '^18.3.1',
                                axios: '^1.7.2',
                                'react-router-dom': '^6.25.0',
                                'lucide-react': '^0.408.0',
                                '@tanstack/react-query': '^5.51.11',
                            },
                            devDependencies: {
                                '@types/react': '^18.3.3',
                                '@types/react-dom': '^18.3.0',
                                '@vitejs/plugin-react': '^4.3.1',
                                autoprefixer: '^10.4.19',
                                postcss: '^8.4.39',
                                tailwindcss: '^3.4.4',
                                typescript: '^5.5.3',
                                vite: '^5.3.4',
                            },
                        };
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(frontendDir, 'package.json'), JSON.stringify(packageJson, null, 2))];
                    case 2:
                        _20.sent();
                        viteConfig = "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,\n    strictPort: true,\n  }\n})\n";
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(frontendDir, 'vite.config.ts'), viteConfig)];
                    case 3:
                        _20.sent();
                        tailwindConfig = "/** @type {import('tailwindcss').Config} */\nexport default {\n  content: [\"./index.html\", \"./src/**/*.{js,ts,jsx,tsx}\"],\n  theme: { extend: {} },\n  plugins: [],\n}\n";
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(frontendDir, 'tailwind.config.js'), tailwindConfig)];
                    case 4:
                        _20.sent();
                        postcssConfig = "export default {\n  plugins: { tailwindcss: {}, autoprefixer: {} },\n}\n";
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(frontendDir, 'postcss.config.js'), postcssConfig)];
                    case 5:
                        _20.sent();
                        indexHtml = "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>".concat(reqs.appName, "</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>\n");
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(frontendDir, 'index.html'), indexHtml)];
                    case 6:
                        _20.sent();
                        srcDir = path_1.default.join(frontendDir, 'src');
                        return [4 /*yield*/, promises_1.default.mkdir(srcDir, { recursive: true })];
                    case 7:
                        _20.sent();
                        return [4 /*yield*/, promises_1.default.mkdir(path_1.default.join(srcDir, 'components'), { recursive: true })];
                    case 8:
                        _20.sent();
                        return [4 /*yield*/, promises_1.default.mkdir(path_1.default.join(srcDir, 'services'), { recursive: true })];
                    case 9:
                        _20.sent();
                        return [4 /*yield*/, promises_1.default.mkdir(path_1.default.join(srcDir, 'hooks'), { recursive: true })];
                    case 10:
                        _20.sent();
                        return [4 /*yield*/, promises_1.default.mkdir(path_1.default.join(srcDir, 'pages'), { recursive: true })];
                    case 11:
                        _20.sent();
                        mainTsx = system_scaffold_1.SystemScaffold.getMainTsxContent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(srcDir, 'main.tsx'), mainTsx)];
                    case 12:
                        _20.sent();
                        // Error Authority Scaffold
                        return [4 /*yield*/, system_scaffold_1.SystemScaffold.generateErrorAuthority(srcDir)];
                    case 13:
                        // Error Authority Scaffold
                        _20.sent();
                        // Query Authority Scaffold
                        return [4 /*yield*/, system_scaffold_1.SystemScaffold.generateQueryAuthority(srcDir)];
                    case 14:
                        // Query Authority Scaffold
                        _20.sent();
                        // Auth Authority Scaffold
                        return [4 /*yield*/, system_scaffold_1.SystemScaffold.generateAuthAuthority(srcDir)];
                    case 15:
                        // Auth Authority Scaffold
                        _20.sent();
                        indexCss = "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody {\n  margin: 0;\n  font-family: 'Inter', system-ui, -apple-system, sans-serif;\n  background: #f8fafc;\n  -webkit-font-smoothing: antialiased;\n}\n";
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(srcDir, 'index.css'), indexCss)];
                    case 16:
                        _20.sent();
                        viteEnvDts = "/// <reference types=\"vite/client\" />\n";
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(srcDir, 'vite-env.d.ts'), viteEnvDts)];
                    case 17:
                        _20.sent();
                        arch = reqs.frontendArchitecture;
                        hasProtectedPages = arch && arch.pages.some(function (p) { return p.isProtected; });
                        appTsx = "import React from 'react'\nimport { BrowserRouter, Routes, Route } from 'react-router-dom'\n";
                        if (hasProtectedPages) {
                            appTsx = "import React from 'react'\nimport { BrowserRouter, Routes, Route } from 'react-router-dom'\nimport { ProtectedRoute } from './components/system/ProtectedRoute'\n";
                        }
                        if (arch && arch.pages.length > 0) {
                            for (_i = 0, _a = arch.pages; _i < _a.length; _i++) {
                                page = _a[_i];
                                appTsx += "import ".concat(page.componentName, " from './pages/").concat(page.componentName, "'\n");
                            }
                        }
                        appTsx += "\nfunction App() {\n  return (\n    <BrowserRouter>\n      <Routes>\n";
                        if (arch && arch.pages.length > 0) {
                            for (_b = 0, _c = arch.pages; _b < _c.length; _b++) {
                                page = _c[_b];
                                element = "<".concat(page.componentName, " />");
                                if (page.isProtected) {
                                    rolesAttr = page.allowedRoles && page.allowedRoles.length > 0
                                        ? " allowedRoles={[".concat(page.allowedRoles.map(function (r) { return "'".concat(r, "'"); }).join(', '), "]}")
                                        : '';
                                    element = "<ProtectedRoute".concat(rolesAttr, ">").concat(element, "</ProtectedRoute>");
                                }
                                appTsx += "        <Route path=\"".concat(page.route, "\" element={").concat(element, "} />\n");
                            }
                        }
                        else {
                            appTsx += "        <Route path=\"/\" element={\n          <div className=\"min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden\">\n            <div className=\"absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 blur-[120px] rounded-full mix-blend-screen\" />\n            <div className=\"absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-600/20 blur-[120px] rounded-full mix-blend-screen\" />\n            <div className=\"relative z-10 text-center px-4 max-w-4xl mx-auto\">\n              <div className=\"inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-8 backdrop-blur-md\">\n                <span className=\"w-2 h-2 rounded-full bg-indigo-400 animate-pulse\" />\n                ".concat(reqs.appType, "\n              </div>\n              <h1 className=\"text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 mb-6 tracking-tight\">\n                ").concat(reqs.appName, "\n              </h1>\n              <p className=\"text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed\">\n                A next-generation platform featuring ").concat(reqs.features.slice(0, 3).join(', '), " and more.\n              </p>\n            </div>\n          </div>\n        } />\n");
                        }
                        appTsx += "      </Routes>\n    </BrowserRouter>\n  )\n}\n\nexport default App\n";
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(srcDir, 'App.tsx'), appTsx)];
                    case 18:
                        _20.sent();
                        if (!(arch && arch.components.length > 0)) return [3 /*break*/, 26];
                        _d = 0, _e = arch.components;
                        _20.label = 19;
                    case 19:
                        if (!(_d < _e.length)) return [3 /*break*/, 26];
                        comp = _e[_d];
                        if (comp.type === 'page')
                            return [3 /*break*/, 25];
                        compPath = path_1.default.join(srcDir, 'components', "".concat(comp.name, ".tsx"));
                        return [4 /*yield*/, promises_1.default.stat(compPath).catch(function () { return false; })];
                    case 20:
                        if (_20.sent()) {
                            onLog(4, "[hybrid-generator] Skipping AI Component: ".concat(comp.name, " (already exists)"));
                            return [3 /*break*/, 25];
                        }
                        onLog(4, "[hybrid-generator] Generating AI Component: ".concat(comp.name, "..."));
                        prompt_1 = "You are an expert React and Tailwind developer building components for a ".concat(reqs.appName, " application.\nApp Features: ").concat(reqs.features.join(', '), "\n\nTask: Write a fully functional, production-ready React component named \"").concat(comp.name, "\".\nDescription: ").concat(comp.description, "\n\nRequirements:\n- Use TypeScript and functional components.\n- Use Tailwind CSS for all styling, ensuring it looks beautiful, premium, and modern.\n- For icons, ONLY use 'lucide-react'. Valid icon names include: Equal, Divide, Minus, Plus, Search, Cloud, Sun, Moon, Wind, Droplets, Thermometer, MapPin, Clock, RefreshCw, Loader, AlertCircle, ChevronDown, ChevronUp, X, Menu, Home, Settings, Star, Heart, Eye, Trash2, Edit, Check, ArrowLeft, ArrowRight. Do NOT use 'Equals' or 'EqualsNot', use 'Equal' and 'NotEqualTo' instead. Do NOT use icon names from other libraries (no Fi*, no Magnifying*, no Fa* prefixes).\n- Accept props via a typed interface and export the component as default export.\n- Add reasonable interactive elements, hover states, and animations.\n- Do NOT import any relative files, pages, hooks, or services. All styling and rendering logic must be self-contained in this single component file.\n- Return ONLY valid TypeScript/TSX source code. Do NOT explain. Do NOT reason. Do NOT describe. Do NOT use markdown fences. Do NOT use conversational text.\n\nHOOK CONTRACT RULES\nIf a generated custom hook exists for this feature:\n- You MUST import and use the hook.\n- DO NOT duplicate hook logic.\n- DO NOT write inline useEffect fetching logic.\n- DO NOT directly fetch data inside the component.\nViolations are forbidden.\n\nSERVICE CONTRACT RULES\nIf a generated Service exists:\n- All API access MUST go through the Service.\n- Components MUST NOT call fetch().\n- Components MUST NOT call axios directly.\n- Components MUST consume Services through Hooks whenever available.\nViolations are forbidden.\n\nCONTEXT CONTRACT RULES\nIf Context Providers are generated:\n- They MUST be mounted.\n- The root application tree MUST be wrapped.\n- Generated components MUST consume the generated Context.\nDo not create duplicate local state when Context exists.\n\nAUTHENTICATION AUTHORITY RULES\n- Authentication state MUST come from useAuth().\n- Components MUST NOT implement their own authentication contexts.\n- Components MUST NOT store authentication state in local React state.\n- Role authorization MUST use ProtectedRoute.\n- Pages MUST NOT implement custom role routing or perform manual redirects.\n- Route protection MUST be delegated to ProtectedRoute.\n- Services MUST remain authentication-agnostic and MUST NOT import React hooks.\n\nARCHITECTURE CONTRACT\nGenerated architecture is authoritative.\nGenerated Components must consume:\n- Services\n- Hooks\n- Contexts\ninstead of recreating them.\nDo not generate parallel implementations.\n\nFORBIDDEN:\n- Do NOT use placeholder comments like \"TODO\", \"FIXME\", \"Business Logic:\", \"Validation goes here\", \"Implement logic\", \"Placeholder\", or \"implement later\".\n- Do NOT use pseudo-code.\n- Do NOT leave empty handlers or functions.\n\nREQUIRED:\n- Executable validation (e.g. Zod schemas or manual client-side if-statements)\n- Executable state mutations and API calls\n- Executable error handling (display error messages to the user)\n\nReturn ONLY valid TypeScript or TSX source code.\nDo NOT explain your reasoning.\nDo NOT describe the solution.\nDo NOT provide planning text.\nDo NOT provide markdown.\nDo NOT provide code fences.\nDo NOT include comments outside the source file.\nYour entire response must be a compilable source file.\n");
                        _20.label = 21;
                    case 21:
                        _20.trys.push([21, 24, , 25]);
                        return [4 /*yield*/, this.generateValidCode(provider, prompt_1, true, comp.name, frontendDir, onLog)];
                    case 22:
                        compTsx = _20.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(srcDir, 'components', "".concat(comp.name, ".tsx")), compTsx)];
                    case 23:
                        _20.sent();
                        return [3 /*break*/, 25];
                    case 24:
                        e_44 = _20.sent();
                        onLog(4, "[FATAL] Generation Failed: Invalid AI output detected. (".concat(e_44.message, ")"));
                        throw e_44;
                    case 25:
                        _d++;
                        return [3 /*break*/, 19];
                    case 26:
                        if (!(arch && arch.services.length > 0)) return [3 /*break*/, 34];
                        _f = 0, _g = arch.services;
                        _20.label = 27;
                    case 27:
                        if (!(_f < _g.length)) return [3 /*break*/, 34];
                        svc = _g[_f];
                        svcPath = path_1.default.join(srcDir, 'services', "".concat(svc.name, ".ts"));
                        return [4 /*yield*/, promises_1.default.stat(svcPath).catch(function () { return false; })];
                    case 28:
                        if (_20.sent()) {
                            onLog(4, "[hybrid-generator] Skipping AI Service: ".concat(svc.name, " (already exists)"));
                            return [3 /*break*/, 33];
                        }
                        onLog(4, "[hybrid-generator] Generating AI Service: ".concat(svc.name, "..."));
                        apiAuthorityRules = svc.endpoints && svc.endpoints.length > 0
                            ? "\nAPI AUTHORITY RULES:\n- You MUST implement every endpoint listed below.\n- Do NOT invent endpoints.\n- Do NOT omit endpoints.\n- Use the specified HTTP methods exactly.\n- Use the specified paths exactly.\nEndpoints are authoritative. Do not infer alternatives.\n".concat(svc.endpoints.map(function (e) { return "[".concat(e.method, "] ").concat(e.path, ": ").concat(e.description); }).join('\n'), "\n")
                            : '';
                        prompt_2 = "You are an expert TypeScript developer building API services for a ".concat(reqs.appName, " application.\nApp Features: ").concat(reqs.features.join(', '), "\n\nTask: Write a fully functional API service named \"").concat(svc.name, "\".\nDescription: ").concat(svc.description, "\nExternal API Required: ").concat(svc.externalApi ? svc.externalApi : 'None. Assume a local Express API backend.', "\n").concat(apiAuthorityRules, "\n\nRequirements:\n- Use 'axios' for HTTP requests.\n- If it connects to a local backend, use `const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';` and request standard routes.\n- If it connects to a specific external API (like OpenWeatherMap, REST Countries, etc.), implement actual endpoints with the correct parameter names. For OpenWeatherMap, use `appid` (NOT `apiKey`) as the query parameter.\n- Export the service as a NAMED export: `export const ").concat(svc.name, " = { ... }`. The object must contain fully typed async methods.\n- Provide realistic default implementations or fallbacks if the API key or endpoint fails.\n- Do NOT import any relative modules or non-existent files. All helper functions and domain logic must be contained entirely within this single file.\n- If using try/catch, DO NOT type the catch variable as `any` (e.g. use `catch (e)` or `catch (error)`, NOT `catch (e: any)`).\n- Services MUST remain authentication-agnostic and MUST NOT import React hooks (such as useAuth()). All auth tokens or headers must be passed as pure function arguments.\n- Return ONLY valid TypeScript/TSX source code. Do NOT explain. Do NOT reason. Do NOT describe. Do NOT use markdown fences. Do NOT use conversational text.\n\nFORBIDDEN:\n- Do NOT use placeholder comments like \"TODO\", \"FIXME\", \"Business Logic:\", \"Validation goes here\", \"Implement logic\", \"Placeholder\", or \"implement later\".\n- Do NOT use pseudo-code.\n- Do NOT leave empty handlers or functions.\n\nREQUIRED:\n- Executable validation (e.g. Zod schemas or manual client-side if-statements)\n- Executable state mutations and API calls\n- Executable error handling (display error messages to the user)\n\nReturn ONLY valid TypeScript or TSX source code.\nDo NOT explain your reasoning.\nDo NOT describe the solution.\nDo NOT provide planning text.\nDo NOT provide markdown.\nDo NOT provide code fences.\nDo NOT include comments outside the source file.\nYour entire response must be a compilable source file.\n");
                        _20.label = 29;
                    case 29:
                        _20.trys.push([29, 32, , 33]);
                        return [4 /*yield*/, this.generateValidCode(provider, prompt_2, false, svc.name, frontendDir, onLog)];
                    case 30:
                        svcTs = _20.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(srcDir, 'services', "".concat(svc.name, ".ts")), svcTs)];
                    case 31:
                        _20.sent();
                        return [3 /*break*/, 33];
                    case 32:
                        e_45 = _20.sent();
                        onLog(4, "[FATAL] Generation Failed: Invalid AI output detected. (".concat(e_45.message, ")"));
                        throw e_45;
                    case 33:
                        _f++;
                        return [3 /*break*/, 27];
                    case 34:
                        serviceSignatures = {};
                        hasServices = arch ? arch.services.length > 0 : false;
                        if (!hasServices) return [3 /*break*/, 40];
                        _h = 0, _j = arch.services;
                        _20.label = 35;
                    case 35:
                        if (!(_h < _j.length)) return [3 /*break*/, 40];
                        svc = _j[_h];
                        _20.label = 36;
                    case 36:
                        _20.trys.push([36, 38, , 39]);
                        return [4 /*yield*/, promises_1.default.readFile(path_1.default.join(srcDir, 'services', "".concat(svc.name, ".ts")), 'utf-8')];
                    case 37:
                        svcCode = _20.sent();
                        serviceSignatures[svc.name] = svcCode;
                        return [3 /*break*/, 39];
                    case 38:
                        _k = _20.sent();
                        return [3 /*break*/, 39];
                    case 39:
                        _h++;
                        return [3 /*break*/, 35];
                    case 40:
                        if (!(arch && arch.hooks.length > 0)) return [3 /*break*/, 48];
                        _l = 0, _m = arch.hooks;
                        _20.label = 41;
                    case 41:
                        if (!(_l < _m.length)) return [3 /*break*/, 48];
                        hook = _m[_l];
                        hookPath = path_1.default.join(srcDir, 'hooks', "".concat(hook.name, ".ts"));
                        return [4 /*yield*/, promises_1.default.stat(hookPath).catch(function () { return false; })];
                    case 42:
                        if (_20.sent()) {
                            onLog(4, "[hybrid-generator] Skipping AI Hook: ".concat(hook.name, " (already exists)"));
                            return [3 /*break*/, 47];
                        }
                        onLog(4, "[hybrid-generator] Generating AI Hook: ".concat(hook.name, "..."));
                        serviceBlock = void 0;
                        serviceRequirements = void 0;
                        if (hasServices && Object.keys(serviceSignatures).length > 0) {
                            servicesList = arch.services.map(function (s) { return s.name; }).join(', ');
                            serviceContext = "Available services: ".concat(servicesList);
                            for (_o = 0, _p = Object.entries(serviceSignatures); _o < _p.length; _o++) {
                                _q = _p[_o], svcName = _q[0], svcCode = _q[1];
                                serviceContext += "\n\n--- Service: ".concat(svcName, " (../services/").concat(svcName, ") ---\n").concat(svcCode.substring(0, 1500));
                            }
                            serviceBlock = "Context \u2014 ACTUAL SERVICE CODE (you MUST use only the method names shown here):\n".concat(serviceContext);
                            serviceRequirements = "- Import services using named imports like: `import { serviceName } from '../services/serviceName'`.\n- CRITICAL: Only call methods that ACTUALLY EXIST in the service code shown above. Do NOT assume a service exports another service. Do NOT invent method names.\n- Do NOT import any relative modules or helper files other than the listed services.";
                        }
                        else {
                            serviceBlock = "IMPORTANT: This application has NO services. There are NO service files. The services/ directory does not exist.";
                            serviceRequirements = "- CRITICAL: Do NOT import any service files. There are NO services in this application.\n- CRITICAL: Do NOT import any relative modules. No ./services, no ../services, no ./utils, no ./helpers.\n- All data and logic must be SELF-CONTAINED in this hook using React state (useState), localStorage, or in-memory computation.\n- Do NOT generate imports for files that do not exist.";
                        }
                        prompt_3 = "You are an expert React developer building custom hooks for a ".concat(reqs.appName, " application.\nApp Features: ").concat(reqs.features.join(', '), "\n\nTask: Write a fully functional custom React hook named \"").concat(hook.name, "\".\nDescription: ").concat(hook.description, "\n\n").concat(serviceBlock, "\n\nREACT QUERY AUTHORITY RULES:\n- Server state MUST use `useQuery` from `@tanstack/react-query`.\n- Mutations MUST use `useMutation` from `@tanstack/react-query`.\n- Do NOT use `useEffect` for API fetching.\n- Do NOT manually synchronize server state with `useState`.\n- Do NOT prop-drill refresh callbacks.\n- Query keys MUST follow authority contract (deterministic arrays):\n  - Collection: `['entityName']` (e.g. `['users']`)\n  - Detail: `['entityName', id]` (e.g. `['users', id]`)\n  - Nested: `['entityName', id, 'relation']` (e.g. `['projects', projectId, 'tasks']`)\n- Mutations MUST automatically call `queryClient.invalidateQueries({ queryKey: [...] })` in `onSuccess` to synchronize state.\n- Import `useQueryClient` to access the query client for invalidation.\n- Prefer authoritative endpoint contracts from the service. Do not invent endpoint behavior.\n\nRequirements:\n- Use `@tanstack/react-query` for all server state and mutations.\n- Do NOT use `useEffect` or `useState` for data fetching.\n").concat(serviceRequirements, "\n- Export the hook as a NAMED export: `export function ").concat(hook.name, "(...) { ... }` or `export const ").concat(hook.name, " = (...) => { ... }`. Do NOT use export default.\n- Return state (data, loading, error) and any relevant mutator/refresh functions.\n- If using try/catch, DO NOT type the catch variable as `any` (e.g. use `catch (e)` or `catch (error)`, NOT `catch (e: any)`).\n- Query hooks should obtain the auth token via const { user } = useAuth() and pass it as an argument to services (e.g. service.getUsers(user?.token)). Do NOT store auth state locally in the hook. If useAuth is consumed, import it using: `import { useAuth } from './useAuth'` or `import { useAuth } from '../hooks/useAuth'` depending on the directory.\n- Return ONLY valid TypeScript/TSX source code. Do NOT explain. Do NOT reason. Do NOT describe. Do NOT use markdown fences. Do NOT use conversational text.\n\nFORBIDDEN:\n- Do NOT use placeholder comments like \"TODO\", \"FIXME\", \"Business Logic:\", \"Validation goes here\", \"Implement logic\", \"Placeholder\", or \"implement later\".\n- Do NOT use pseudo-code.\n- Do NOT leave empty handlers or functions.\n\nREQUIRED:\n- Executable validation (e.g. Zod schemas or manual client-side if-statements)\n- Executable state mutations and API calls\n- Executable error handling (display error messages to the user)\n\nReturn ONLY valid TypeScript or TSX source code.\nDo NOT explain your reasoning.\nDo NOT describe the solution.\nDo NOT provide planning text.\nDo NOT provide markdown.\nDo NOT provide code fences.\nDo NOT include comments outside the source file.\nYour entire response must be a compilable source file.\n");
                        _20.label = 43;
                    case 43:
                        _20.trys.push([43, 46, , 47]);
                        return [4 /*yield*/, this.generateValidCode(provider, prompt_3, false, hook.name, frontendDir, onLog)];
                    case 44:
                        hookTs = _20.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(srcDir, 'hooks', "".concat(hook.name, ".ts")), hookTs)];
                    case 45:
                        _20.sent();
                        return [3 /*break*/, 47];
                    case 46:
                        e_46 = _20.sent();
                        onLog(4, "[FATAL] Generation Failed: Invalid AI output detected. (".concat(e_46.message, ")"));
                        throw e_46;
                    case 47:
                        _l++;
                        return [3 /*break*/, 41];
                    case 48:
                        hookSignatures = {};
                        if (!(arch && arch.hooks.length > 0)) return [3 /*break*/, 54];
                        _r = 0, _s = arch.hooks;
                        _20.label = 49;
                    case 49:
                        if (!(_r < _s.length)) return [3 /*break*/, 54];
                        hook = _s[_r];
                        _20.label = 50;
                    case 50:
                        _20.trys.push([50, 52, , 53]);
                        return [4 /*yield*/, promises_1.default.readFile(path_1.default.join(srcDir, 'hooks', "".concat(hook.name, ".ts")), 'utf-8')];
                    case 51:
                        hookCode = _20.sent();
                        hookSignatures[hook.name] = hookCode;
                        return [3 /*break*/, 53];
                    case 52:
                        _t = _20.sent();
                        return [3 /*break*/, 53];
                    case 53:
                        _r++;
                        return [3 /*break*/, 49];
                    case 54:
                        componentSignatures = {};
                        if (!(arch && arch.components.length > 0)) return [3 /*break*/, 60];
                        _u = 0, _v = arch.components;
                        _20.label = 55;
                    case 55:
                        if (!(_u < _v.length)) return [3 /*break*/, 60];
                        comp = _v[_u];
                        if (comp.type === 'page')
                            return [3 /*break*/, 59];
                        _20.label = 56;
                    case 56:
                        _20.trys.push([56, 58, , 59]);
                        return [4 /*yield*/, promises_1.default.readFile(path_1.default.join(srcDir, 'components', "".concat(comp.name, ".tsx")), 'utf-8')];
                    case 57:
                        compCode = _20.sent();
                        componentSignatures[comp.name] = compCode;
                        return [3 /*break*/, 59];
                    case 58:
                        _w = _20.sent();
                        return [3 /*break*/, 59];
                    case 59:
                        _u++;
                        return [3 /*break*/, 55];
                    case 60:
                        if (!(arch && arch.pages.length > 0)) return [3 /*break*/, 68];
                        _x = 0, _y = arch.pages;
                        _20.label = 61;
                    case 61:
                        if (!(_x < _y.length)) return [3 /*break*/, 68];
                        page = _y[_x];
                        pagePath = path_1.default.join(srcDir, 'pages', "".concat(page.componentName, ".tsx"));
                        return [4 /*yield*/, promises_1.default.stat(pagePath).catch(function () { return false; })];
                    case 62:
                        if (_20.sent()) {
                            onLog(4, "[hybrid-generator] Skipping AI Page: ".concat(page.componentName, " (already exists)"));
                            return [3 /*break*/, 67];
                        }
                        onLog(4, "[hybrid-generator] Generating AI Page: ".concat(page.componentName, "..."));
                        hooksList = arch.hooks.map(function (h) { return h.name; }).join(', ');
                        componentsList = arch.components.filter(function (c) { return c.type !== 'page'; }).map(function (c) { return c.name; }).join(', ');
                        hookContext = '';
                        for (_z = 0, _0 = Object.entries(hookSignatures); _z < _0.length; _z++) {
                            _1 = _0[_z], hookName = _1[0], hookCode = _1[1];
                            hookContext += "\n--- Hook: ".concat(hookName, " (import { ").concat(hookName, " } from '../hooks/").concat(hookName, "') ---\n").concat(this.extractContract(hookCode), "\n");
                        }
                        compContext = '';
                        for (_2 = 0, _3 = Object.entries(componentSignatures); _2 < _3.length; _2++) {
                            _4 = _3[_2], compName = _4[0], compCode = _4[1];
                            compContext += "\n--- Component: ".concat(compName, " (import ").concat(compName, " from '../components/").concat(compName, "') ---\n").concat(this.extractContract(compCode), "\n");
                        }
                        prompt_4 = "You are an expert React developer building pages for a ".concat(reqs.appName, " application.\nApp Features: ").concat(reqs.features.join(', '), "\n\nTask: Write a fully functional React page component named \"").concat(page.componentName, "\".\nDescription: ").concat(page.description, "\n\nACTUAL HOOK CODE (use ONLY the return values and function signatures shown here):\n").concat(hookContext || 'No hooks available.', "\n\nACTUAL COMPONENT CODE (use ONLY the props interfaces shown here):\n").concat(compContext || 'No components available.', "\n\nRequirements:\n- Import hooks using named imports: `import { hookName } from '../hooks/hookName'` if applicable.\n- Import components using default imports: `import ComponentName from '../components/ComponentName'` if applicable.\n- CRITICAL: Only use return values/methods that EXIST in the actual hook code above. Only pass props that EXIST in the component interfaces above.\n- Integrate state management using the available hooks. No local mock data generators.\n- Layout beautifully using Tailwind CSS.\n- For icons, ONLY use 'lucide-react' with valid names: Search, Cloud, Sun, Wind, Droplets, Thermometer, MapPin, Clock, RefreshCw, Loader, AlertCircle, X, Menu, Home, Settings, Star, Eye, Trash2, Edit, Plus, Check, ArrowLeft, ArrowRight. Do NOT use FiSearch, MagnifyingGlass, or other non-lucide names. ALL icons used MUST be imported from 'lucide-react'.\n- Handle null values properly (e.g. if a string might be null, do not pass it to a string-only prop without fallback).\n- Return the full React functional component as default export.\n- Do NOT import other pages, or components/hooks not in the lists above.\n- If using try/catch, DO NOT type the catch variable as `any` (e.g. use `catch (e)` or `catch (error)`, NOT `catch (e: any)`).\n- BUSINESS LOGIC: You MUST fetch real data using the provided hooks and endpoints.\n- UI FEEDBACK: You MUST implement explicit loading spinners/states and explicit error states/banners.\n- MUTATIONS: You MUST wire form `onSubmit` handlers to perform client-side validation, and invoke mutation hooks to refresh data or update the UI optimally after successful submissions.\n- TRACEABILITY: Verify that every feature listed in 'App Features' related to this page is implemented. If you cannot implement all required features, you MUST output the exact string <TRACEABILITY_FAILURE> instead of code.\n- Return ONLY valid TypeScript/TSX source code. Do NOT explain. Do NOT reason. Do NOT describe. Do NOT use markdown fences. Do NOT use conversational text.\n\nHOOK CONTRACT RULES\nIf a generated custom hook exists for this feature:\n- You MUST import and use the hook.\n- DO NOT duplicate hook logic.\n- DO NOT write inline useEffect fetching logic.\n- DO NOT directly fetch data inside the component.\nViolations are forbidden.\n\nSERVICE CONTRACT RULES\nIf a generated Service exists:\n- All API access MUST go through the Service.\n- Components MUST NOT call fetch().\n- Components MUST NOT call axios directly.\n- Components MUST consume Services through Hooks whenever available.\nViolations are forbidden.\n\nCONTEXT CONTRACT RULES\nIf Context Providers are generated:\n- They MUST be mounted.\n- The root application tree MUST be wrapped.\n- Generated components MUST consume the generated Context.\nDo not create duplicate local state when Context exists.\n\nAUTHENTICATION AUTHORITY RULES\n- Authentication state MUST come from useAuth().\n- Components MUST NOT implement their own authentication contexts.\n- Components MUST NOT store authentication state in local React state.\n- Role authorization MUST use ProtectedRoute.\n- Pages MUST NOT implement custom role routing or perform manual redirects.\n- Route protection MUST be delegated to ProtectedRoute.\n- Services MUST remain authentication-agnostic and MUST NOT import React hooks.\n\nARCHITECTURE CONTRACT\nGenerated architecture is authoritative.\nGenerated Components must consume:\n- Services\n- Hooks\n- Contexts\ninstead of recreating them.\nDo not generate parallel implementations.\n\nFORBIDDEN:\n- Do NOT use placeholder comments like \"TODO\", \"FIXME\", \"Business Logic:\", \"Validation goes here\", \"Implement logic\", \"Placeholder\", or \"implement later\".\n- Do NOT use pseudo-code.\n- Do NOT leave empty handlers or functions.\n\nREQUIRED:\n- Executable validation (e.g. Zod schemas or manual client-side if-statements)\n- Executable state mutations and API calls\n- Executable error handling (display error messages to the user)\n\nReturn ONLY valid TypeScript or TSX source code.\nDo NOT explain your reasoning.\nDo NOT describe the solution.\nDo NOT provide planning text.\nDo NOT provide markdown.\nDo NOT provide code fences.\nDo NOT include comments outside the source file.\nYour entire response must be a compilable source file.\n");
                        _20.label = 63;
                    case 63:
                        _20.trys.push([63, 66, , 67]);
                        return [4 /*yield*/, this.generateValidCode(provider, prompt_4, true, page.componentName, frontendDir, onLog)];
                    case 64:
                        pageTsx = _20.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(srcDir, 'pages', "".concat(page.componentName, ".tsx")), pageTsx)];
                    case 65:
                        _20.sent();
                        return [3 /*break*/, 67];
                    case 66:
                        e_47 = _20.sent();
                        onLog(4, "[FATAL] Generation Failed: Invalid AI output detected. (".concat(e_47.message, ")"));
                        throw e_47;
                    case 67:
                        _x++;
                        return [3 /*break*/, 61];
                    case 68:
                        componentsIndex = '';
                        if (arch && arch.components.length > 0) {
                            for (_5 = 0, _6 = arch.components; _5 < _6.length; _5++) {
                                comp = _6[_5];
                                if (comp.type === 'page')
                                    continue;
                                componentsIndex += "export { default as ".concat(comp.name, " } from './").concat(comp.name, "';\n");
                            }
                        }
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(srcDir, 'components', 'index.ts'), componentsIndex)];
                    case 69:
                        _20.sent();
                        servicesIndex = '';
                        if (arch && arch.services.length > 0) {
                            for (_7 = 0, _8 = arch.services; _7 < _8.length; _7++) {
                                svc = _8[_7];
                                servicesIndex += "export * from './".concat(svc.name, "';\n");
                            }
                        }
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(srcDir, 'services', 'index.ts'), servicesIndex)];
                    case 70:
                        _20.sent();
                        hooksIndex = '';
                        if (arch && arch.hooks.length > 0) {
                            for (_9 = 0, _10 = arch.hooks; _9 < _10.length; _9++) {
                                hook = _10[_9];
                                hooksIndex += "export * from './".concat(hook.name, "';\n");
                            }
                        }
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(srcDir, 'hooks', 'index.ts'), hooksIndex)];
                    case 71:
                        _20.sent();
                        pagesIndex = '';
                        if (arch && arch.pages.length > 0) {
                            for (_11 = 0, _12 = arch.pages; _11 < _12.length; _11++) {
                                page = _12[_11];
                                pagesIndex += "export { default as ".concat(page.componentName, " } from './").concat(page.componentName, "';\n");
                            }
                        }
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(srcDir, 'pages', 'index.ts'), pagesIndex)];
                    case 72:
                        _20.sent();
                        projectRoot = path_1.default.dirname(frontendDir);
                        onLog(4, '[hybrid-generator] Running Import Integrity Validation...');
                        return [4 /*yield*/, import_integrity_validator_1.ImportIntegrityValidator.validate(projectRoot)];
                    case 73:
                        importResult = _20.sent();
                        if (!!importResult.isValid) return [3 /*break*/, 80];
                        onLog(4, "[hybrid-generator] Found ".concat(importResult.errors.length, " broken import(s). Stripping..."));
                        brokenByFile = new Map();
                        for (_13 = 0, _14 = importResult.errors; _13 < _14.length; _13++) {
                            err = _14[_13];
                            absPath = path_1.default.join(projectRoot, err.file);
                            if (!brokenByFile.has(absPath)) {
                                brokenByFile.set(absPath, new Set());
                            }
                            brokenByFile.get(absPath).add(err.importPath);
                        }
                        _15 = 0, _16 = brokenByFile.entries();
                        _20.label = 74;
                    case 74:
                        if (!(_15 < _16.length)) return [3 /*break*/, 78];
                        _17 = _16[_15], absFilePath = _17[0], brokenPaths = _17[1];
                        onLog(4, "[hybrid-generator] Stripping ".concat(brokenPaths.size, " broken import(s) from ").concat(path_1.default.relative(projectRoot, absFilePath)));
                        return [4 /*yield*/, import_integrity_validator_1.ImportIntegrityValidator.stripBrokenImports(absFilePath, brokenPaths)];
                    case 75:
                        cleaned = _20.sent();
                        if (!(cleaned !== null)) return [3 /*break*/, 77];
                        return [4 /*yield*/, promises_1.default.writeFile(absFilePath, cleaned, 'utf-8')];
                    case 76:
                        _20.sent();
                        _20.label = 77;
                    case 77:
                        _15++;
                        return [3 /*break*/, 74];
                    case 78: return [4 /*yield*/, import_integrity_validator_1.ImportIntegrityValidator.validate(projectRoot)];
                    case 79:
                        recheck = _20.sent();
                        if (!recheck.isValid) {
                            onLog(4, "[hybrid-generator] WARNING: ".concat(recheck.errors.length, " broken import(s) remain after stripping."));
                            for (_18 = 0, _19 = recheck.errors; _18 < _19.length; _18++) {
                                err = _19[_18];
                                onLog(4, "[hybrid-generator]   ".concat(err.file, ": import '").concat(err.importPath, "' \u2192 not found"));
                            }
                        }
                        else {
                            onLog(4, '[hybrid-generator] Import Integrity Validation PASSED after cleanup.');
                        }
                        return [3 /*break*/, 81];
                    case 80:
                        onLog(4, '[hybrid-generator] Import Integrity Validation PASSED.');
                        _20.label = 81;
                    case 81:
                        tsconfig = {
                            compilerOptions: {
                                target: 'ES2020', useDefineForClassFields: true,
                                lib: ['ES2020', 'DOM', 'DOM.Iterable'], module: 'ESNext',
                                skipLibCheck: true, moduleResolution: 'bundler',
                                allowImportingTsExtensions: true, isolatedModules: true,
                                moduleDetection: 'force', noEmit: true, jsx: 'react-jsx',
                                strict: true, noUnusedLocals: false, noUnusedParameters: false,
                            },
                            include: ['src'],
                        };
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(frontendDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))];
                    case 82:
                        _20.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    HybridGenerator.generateBackendPackage = function (backendDir, reqs, needsDb, onLog) {
        return __awaiter(this, void 0, void 0, function () {
            var dependencies, packageJson, tsconfig, srcDir, indexTs, arch, provider, apiPrompt, backendPassed, backendAttempts, currentBackendPrompt, _a, BusinessLogicAudit, RequirementCoverageAudit, response, PlaceholderBusinessLogicValidator, e_48, _i, _b, svc, normalizedPath, enginesDir, capabilityInterfaceCode, generatedCapabilities, _c, _d, cap, enginePrompt, engineTs, e_49, runtimeDir, registryImports, registryMap, _e, generatedCapabilities_1, name_1, runtimeTs, indexPath, indexContent, runtimeImport, routeBlock;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, promises_1.default.mkdir(backendDir, { recursive: true })];
                    case 1:
                        _f.sent();
                        dependencies = {
                            cors: '^2.8.5',
                            dotenv: '^16.4.5',
                            express: '^4.19.2',
                            zod: '^3.23.8',
                        };
                        if (needsDb) {
                            dependencies['@prisma/client'] = '^5.22.0';
                        }
                        packageJson = {
                            name: 'backend',
                            private: true,
                            version: '0.0.0',
                            scripts: {
                                dev: 'ts-node-dev src/index.ts',
                                build: 'tsc',
                                start: 'node dist/index.js',
                            },
                            dependencies: dependencies,
                            devDependencies: {
                                '@types/cors': '^2.8.17',
                                '@types/express': '^4.17.21',
                                '@types/node': '^20.14.9',
                                'ts-node-dev': '^2.0.0',
                                typescript: '^5.5.3',
                            },
                        };
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(backendDir, 'package.json'), JSON.stringify(packageJson, null, 2))];
                    case 2:
                        _f.sent();
                        tsconfig = {
                            compilerOptions: {
                                target: 'es2022', module: 'commonjs', rootDir: './src', outDir: './dist',
                                esModuleInterop: true, forceConsistentCasingInFileNames: true, strict: true, skipLibCheck: true,
                            },
                            include: ['src/**/*'],
                        };
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(backendDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))];
                    case 3:
                        _f.sent();
                        srcDir = path_1.default.join(backendDir, 'src');
                        return [4 /*yield*/, promises_1.default.mkdir(srcDir, { recursive: true })];
                    case 4:
                        _f.sent();
                        indexTs = '';
                        arch = reqs.frontendArchitecture;
                        provider = ai_engine_1.ProviderFactory.getProvider();
                        if (!(arch && arch.services.length > 0)) return [3 /*break*/, 10];
                        apiPrompt = "You are an expert backend engineer. Write a fully functional, production-ready Express server file index.ts in TypeScript for the application \"".concat(reqs.appName, "\".\nApp Features: ").concat(reqs.features.join(', '), "\nDatabase Enabled: ").concat(needsDb ? 'YES (Prisma client is available and imported from @prisma/client)' : 'NO', "\nEntities: ").concat(reqs.entities.join(', '), "\nServices: ").concat(arch.services.map(function (s) { return "".concat(s.name, " (").concat(s.description, ")"); }).join(', '), "\n\nRequirements:\n- Import 'express', 'cors', 'dotenv', and (if database is enabled) 'PrismaClient' from '@prisma/client'.\n- Initialize Express, CORS, and JSON parsing middlewares.\n- Connect to the database using PrismaClient (if database is enabled).\n- Implement working Express endpoints matching the frontend services: ").concat(arch.services.map(function (s) { return s.name; }).join(', '), ".\n- Ensure Express route parameters are written with colon notation (e.g. '/api/users/:id'), NEVER Swagger curly brace notation.\n- If database is enabled, perform actual Prisma queries to persist and retrieve data for these endpoints. E.g. `await prisma.user.findMany()` or query the appropriate generated Prisma models.\n- Implement proper REST standards (GET to query, POST to create, PUT to update, DELETE to delete).\n- Do not include conversational text or markdown code blocks inside the output other than the raw typescript code.\n- BUSINESS LOGIC: You MUST validate required fields, numeric ranges, and enums. NEVER pass req.body directly into Prisma without manual validation and field extraction. You MUST use Zod or similar explicit validation.\n- ERROR HANDLING: You MUST return 400 Bad Request for invalid input and 404 Not Found when referenced entities do not exist. Return structured JSON error responses.\n- TRACEABILITY: Verify that every feature listed in 'App Features' related to the backend is implemented. If you cannot implement all required features, you MUST output the exact string <TRACEABILITY_FAILURE> instead of code.\n\nFORBIDDEN:\n- Do NOT use placeholder comments like \"TODO\", \"FIXME\", \"Business Logic:\", \"Validation goes here\", \"Implement logic\", \"Placeholder\", or \"implement later\".\n- Do NOT use pseudo-code.\n- Do NOT leave empty handlers or functions.\n\nREQUIRED:\n- Executable validation (e.g. Zod schemas)\n- Executable filtering (e.g. Prisma where clauses)\n- Executable mutations\n- Executable error handling\n");
                        backendPassed = false;
                        backendAttempts = 0;
                        currentBackendPrompt = apiPrompt;
                        _a = require('./business-logic-audit'), BusinessLogicAudit = _a.BusinessLogicAudit, RequirementCoverageAudit = _a.RequirementCoverageAudit;
                        _f.label = 5;
                    case 5:
                        if (!(!backendPassed && backendAttempts < 3)) return [3 /*break*/, 10];
                        backendAttempts++;
                        _f.label = 6;
                    case 6:
                        _f.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, this.generateTextWithRetry(provider, currentBackendPrompt)];
                    case 7:
                        response = _f.sent();
                        indexTs = this.extractCodeBlock(response);
                        RequirementCoverageAudit.audit(response, reqs.features);
                        BusinessLogicAudit.auditBackend(indexTs, reqs.features);
                        PlaceholderBusinessLogicValidator = require('../validators/placeholder-validator').PlaceholderBusinessLogicValidator;
                        PlaceholderBusinessLogicValidator.audit(indexTs);
                        backendPassed = true;
                        return [3 /*break*/, 9];
                    case 8:
                        e_48 = _f.sent();
                        shared_1.Logger.warn("[hybrid-generator] Backend generation attempt ".concat(backendAttempts, " failed: ").concat(e_48.message));
                        if (backendAttempts >= 3) {
                            indexTs = '';
                            shared_1.Logger.warn("[hybrid-generator] Failed to generate dynamic backend after 3 attempts. Falling back to stub.");
                        }
                        else {
                            currentBackendPrompt = apiPrompt + "\n\nCRITICAL FIX REQUIRED: Your previous attempt failed with the following error:\n".concat(e_48.message, "\nPlease fix this error in your next response. Do NOT provide explanations, only return the complete fixed typescript source code.");
                        }
                        return [3 /*break*/, 9];
                    case 9: return [3 /*break*/, 5];
                    case 10:
                        if (!indexTs) {
                            // Fallback stub generation
                            indexTs = "import express from 'express';\nimport cors from 'cors';\nimport dotenv from 'dotenv';\n".concat(needsDb ? "import { PrismaClient } from '@prisma/client';" : '', "\n\ndotenv.config();\n\nconst app = express();\nconst port = process.env.PORT || 4000;\n").concat(needsDb ? 'const prisma = new PrismaClient();' : '', "\n\napp.use(cors());\napp.use(express.json());\n\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'ok', appName: '").concat(reqs.appName, "', mode: 'hybrid-fullstack' });\n});\n\n");
                            if (arch && arch.services.length > 0) {
                                for (_i = 0, _b = arch.services; _i < _b.length; _i++) {
                                    svc = _b[_i];
                                    normalizedPath = (0, path_normalizer_1.normalizeExpressPath)("/api/".concat(svc.name));
                                    indexTs += "// --- API: ".concat(svc.name, " ---\n// ").concat(svc.description, "\napp.get('").concat(normalizedPath, "', async (req, res) => {\n  try {\n    res.json({ message: '").concat(svc.name, " endpoint active', data: [] });\n  } catch (error: any) {\n    res.status(500).json({ error: error.message });\n  }\n});\n\napp.post('").concat(normalizedPath, "', async (req, res) => {\n  try {\n    res.status(201).json({ message: '").concat(svc.name, " created', data: req.body });\n  } catch (error: any) {\n    res.status(400).json({ error: error.message });\n  }\n});\n\n");
                                }
                            }
                            indexTs += "app.listen(port, () => {\n  console.log(`Server is running on port ${port}`);\n});\n";
                        }
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(srcDir, 'index.ts'), indexTs)];
                    case 11:
                        _f.sent();
                        if (!(arch && arch.capabilities && arch.capabilities.length > 0)) return [3 /*break*/, 26];
                        enginesDir = path_1.default.join(srcDir, 'engines');
                        return [4 /*yield*/, promises_1.default.mkdir(enginesDir, { recursive: true })];
                    case 12:
                        _f.sent();
                        capabilityInterfaceCode = "import { z } from 'zod';\nexport interface Capability<I = any, O = any> {\n  inputSchema: z.ZodType<I>;\n  outputSchema: z.ZodType<O>;\n  execute(input: I): Promise<O>;\n}\n";
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(enginesDir, 'Capability.ts'), capabilityInterfaceCode)];
                    case 13:
                        _f.sent();
                        generatedCapabilities = [];
                        _c = 0, _d = arch.capabilities;
                        _f.label = 14;
                    case 14:
                        if (!(_c < _d.length)) return [3 /*break*/, 20];
                        cap = _d[_c];
                        onLog(4, "[hybrid-generator] Generating AI Engine for Capability: ".concat(cap.name, "..."));
                        enginePrompt = "You are an expert Backend Engineer and Software Architect. Write a fully functional, self-contained business logic engine class in TypeScript for a ".concat(reqs.appName, " application.\nCapability Name: ").concat(cap.name, "\nDescription: ").concat(cap.description, "\nCapability Type: ").concat(cap.type, "\nInputs: ").concat(cap.inputs ? cap.inputs.join(', ') : 'None specified', "\nOutputs: ").concat(cap.outputs ? cap.outputs.join(', ') : 'None specified', "\n\nRequirements:\n- Output a single TypeScript file that exports a class representing this engine.\n- The class MUST implement the Capability interface. You MUST import it as follows: `import { Capability } from './Capability';`\n- DTO VALIDATION (CRITICAL): You MUST import 'z' from 'zod'. You MUST define and export strict Zod schemas for both input and output named `").concat(cap.name, "InputSchema` and `").concat(cap.name, "OutputSchema`. Use `.strict()` for objects to reject unknown properties.\n- The class MUST assign these schemas to `inputSchema` and `outputSchema` instance properties.\n- The class MUST expose an `async execute(input: z.infer<typeof ").concat(cap.name, "InputSchema>): Promise<z.infer<typeof ").concat(cap.name, "OutputSchema>>` method.\n- Implement the ACTUAL logic inside the execute method (e.g. math algorithms, data transformations, workflow steps).\n- Do NOT use placeholder comments like \"TODO\", \"Business Logic Goes Here\", or \"Placeholder\".\n- Do NOT write Express route handlers. This must be pure, testable backend business logic.\n- Do NOT attempt to connect to the database directly unless passing PrismaClient as a dependency injection.\n- Return ONLY valid TypeScript source code. Do NOT explain. Do NOT use markdown fences. Do NOT provide comments outside the source file.\n");
                        _f.label = 15;
                    case 15:
                        _f.trys.push([15, 18, , 19]);
                        return [4 /*yield*/, this.generateValidCode(provider, enginePrompt, false, cap.name, backendDir, onLog)];
                    case 16:
                        engineTs = _f.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(enginesDir, "".concat(cap.name, ".ts")), engineTs)];
                    case 17:
                        _f.sent();
                        generatedCapabilities.push(cap.name);
                        return [3 /*break*/, 19];
                    case 18:
                        e_49 = _f.sent();
                        onLog(4, "[WARN] Generation Failed for Engine ".concat(cap.name, ": ").concat(e_49.message));
                        return [3 /*break*/, 19];
                    case 19:
                        _c++;
                        return [3 /*break*/, 14];
                    case 20:
                        if (!(generatedCapabilities.length > 0)) return [3 /*break*/, 26];
                        onLog(4, "[hybrid-generator] Generating Runtime Adapter Authority...");
                        runtimeDir = path_1.default.join(srcDir, 'runtime');
                        return [4 /*yield*/, promises_1.default.mkdir(runtimeDir, { recursive: true })];
                    case 21:
                        _f.sent();
                        registryImports = "import { Capability } from '../engines/Capability';\n";
                        registryMap = "export const CapabilityRegistry: Record<string, Capability> = {\n";
                        for (_e = 0, generatedCapabilities_1 = generatedCapabilities; _e < generatedCapabilities_1.length; _e++) {
                            name_1 = generatedCapabilities_1[_e];
                            registryImports += "import ".concat(name_1, " from '../engines/").concat(name_1, "';\n");
                            registryMap += "  \"".concat(name_1, "\": new ").concat(name_1, "(),\n");
                        }
                        registryMap += "};\n";
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(runtimeDir, 'CapabilityRegistry.ts'), registryImports + '\n' + registryMap)];
                    case 22:
                        _f.sent();
                        runtimeTs = "import { CapabilityRegistry } from './CapabilityRegistry';\n\nexport class CapabilityRuntime {\n  async execute(capabilityName: string, input: any): Promise<any> {\n    const engine = CapabilityRegistry[capabilityName];\n    if (!engine) {\n      throw new Error(`Capability Engine '${capabilityName}' not found in Registry.`);\n    }\n    \n    if (typeof engine.execute !== 'function') {\n      throw new Error(`Engine '${capabilityName}' does not implement the Capability execute() contract.`);\n    }\n\n    if (!engine.inputSchema) {\n      throw new Error(`Engine '${capabilityName}' is missing DTO Validation Schema. Execution blocked for security.`);\n    }\n\n    const parsed = engine.inputSchema.safeParse(input);\n    if (!parsed.success) {\n      const error = new Error(\"DTO Validation Failed\");\n      (error as any).status = 400;\n      (error as any).issues = parsed.error.issues;\n      throw error;\n    }\n\n    return await engine.execute(parsed.data);\n  }\n}\n";
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(runtimeDir, 'CapabilityRuntime.ts'), runtimeTs)];
                    case 23:
                        _f.sent();
                        indexPath = path_1.default.join(srcDir, 'index.ts');
                        return [4 /*yield*/, promises_1.default.readFile(indexPath, 'utf-8')];
                    case 24:
                        indexContent = _f.sent();
                        runtimeImport = "import { CapabilityRuntime } from './runtime/CapabilityRuntime';\nconst capabilityRuntime = new CapabilityRuntime();\n";
                        if (indexContent.includes('import express')) {
                            indexContent = indexContent.replace('import express', runtimeImport + 'import express');
                        }
                        else {
                            indexContent = runtimeImport + indexContent;
                        }
                        routeBlock = "\n// --- Capability Runtime API ---\napp.post('/api/capabilities/:name', async (req, res) => {\n  try {\n    const result = await capabilityRuntime.execute(req.params.name, req.body);\n    res.json(result);\n  } catch (error: any) {\n    const status = error.status || 500;\n    res.status(status).json({ error: error.message, issues: error.issues });\n  }\n});\n\n";
                        if (indexContent.includes('app.listen(')) {
                            indexContent = indexContent.replace('app.listen(', routeBlock + 'app.listen(');
                        }
                        else {
                            indexContent += '\n' + routeBlock;
                        }
                        return [4 /*yield*/, promises_1.default.writeFile(indexPath, indexContent)];
                    case 25:
                        _f.sent();
                        _f.label = 26;
                    case 26: return [2 /*return*/];
                }
            });
        });
    };
    // ─────────────────────────────────────────────
    // Optional database package (minimal Prisma)
    // ─────────────────────────────────────────────
    HybridGenerator.generateDatabasePackage = function (dbDir, reqs) {
        return __awaiter(this, void 0, void 0, function () {
            var packageJson, prismaDir, prismaModels, provider, schemaPrompt, response, extracted, e_50, schemaPrisma;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, promises_1.default.mkdir(dbDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        packageJson = {
                            name: 'database',
                            private: true,
                            version: '0.0.0',
                            scripts: {
                                generate: 'prisma generate',
                                push: 'prisma db push',
                            },
                            dependencies: {
                                '@prisma/client': '^5.22.0',
                                dotenv: '^16.4.5',
                            },
                            devDependencies: {
                                prisma: '^5.22.0',
                            },
                        };
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(dbDir, 'package.json'), JSON.stringify(packageJson, null, 2))];
                    case 2:
                        _a.sent();
                        prismaDir = path_1.default.join(dbDir, 'prisma');
                        return [4 /*yield*/, promises_1.default.mkdir(prismaDir, { recursive: true })];
                    case 3:
                        _a.sent();
                        prismaModels = "model User {\n  id        String   @id @default(uuid())\n  email     String   @unique\n  name      String?\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n";
                        provider = ai_engine_1.ProviderFactory.getProvider();
                        schemaPrompt = "You are a database architect. Write a set of valid Prisma models for the PostgreSQL database of an application named \"".concat(reqs.appName, "\".\nApp Features: ").concat(reqs.features.join(', '), "\nIdentified Entities: ").concat(reqs.entities.join(', '), "\n\nRequirements:\n- Create models that represent the application's entities and their relationships.\n- Ensure proper relationships between models (e.g., using @relation, relational fields, and mapping/references).\n- Provide typical fields like ID (String @id @default(uuid())), timestamps (createdAt, updatedAt), and descriptive domain fields (strings, ints, booleans, DateTimes).\n- Output ONLY the Prisma model definitions (do NOT output datasource db or generator client blocks).\n- Output ONLY valid Prisma code inside a markdown code block. Do not include conversational text.\n");
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this.generateTextWithRetry(provider, schemaPrompt)];
                    case 5:
                        response = _a.sent();
                        extracted = this.extractCodeBlock(response);
                        if (extracted && extracted.trim().startsWith('model')) {
                            prismaModels = extracted;
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        e_50 = _a.sent();
                        shared_1.Logger.warn("[hybrid-generator] Failed to generate dynamic Prisma schema: ".concat(e_50.message, ". Using default User model."));
                        return [3 /*break*/, 7];
                    case 7:
                        schemaPrisma = "datasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\ngenerator client {\n  provider = \"prisma-client-js\"\n}\n\n".concat(prismaModels, "\n");
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(prismaDir, 'schema.prisma'), schemaPrisma)];
                    case 8:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    HybridGenerator.isDailyRateLimit = function (err) {
        var msg = (err === null || err === void 0 ? void 0 : err.message) || '';
        return msg.includes('tokens per day') || msg.includes('TPD');
    };
    HybridGenerator.generateTextWithRetry = function (provider, prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var response, e_51;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, ai_engine_2.RequestQueue.enqueue(function () { return provider.generateText(prompt); })];
                    case 1:
                        response = (_c.sent());
                        if (response.includes('<TRACEABILITY_FAILURE>')) {
                            throw new Error('Generation failure: Missing requirement coverage detected by LLM during generation.');
                        }
                        return [2 /*return*/, response];
                    case 2:
                        e_51 = _c.sent();
                        if (((_a = e_51.message) === null || _a === void 0 ? void 0 : _a.includes('API Key')) || ((_b = e_51.message) === null || _b === void 0 ? void 0 : _b.includes('provider settings'))) {
                            throw new Error("LLM_CONFIGURATION_FAILURE: ".concat(e_51.message));
                        }
                        throw e_51;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    HybridGenerator.extractContract = function (code) {
        var contract = '';
        var lines = code.split('\n');
        var capturing = false;
        var bracketCount = 0;
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            if (line.trim().startsWith('import'))
                continue;
            if (line.includes('interface ') || line.includes('type ')) {
                capturing = true;
            }
            if (capturing) {
                contract += line + '\n';
                if (line.includes('{'))
                    bracketCount += (line.match(/\{/g) || []).length;
                if (line.includes('}'))
                    bracketCount -= (line.match(/\}/g) || []).length;
                if (bracketCount <= 0 && line.includes('}')) {
                    capturing = false;
                    bracketCount = 0;
                }
                continue;
            }
            if (line.includes('export default function') || line.includes('export const') || line.includes('export function') || line.includes('export class')) {
                var signature = line.split('{')[0].trim();
                contract += signature + (signature.endsWith(';') ? '\n' : ';\n');
            }
        }
        return contract.trim() || code.substring(0, 300);
    };
    return HybridGenerator;
}());
exports.HybridGenerator = HybridGenerator;
