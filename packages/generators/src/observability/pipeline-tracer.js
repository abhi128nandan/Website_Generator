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
exports.PipelineTracer = void 0;
var fs = require("fs/promises");
var path = require("path");
var PipelineTracer = /** @class */ (function () {
    function PipelineTracer() {
    }
    PipelineTracer.getBaseDir = function (targetDir) {
        return path.join(targetDir, 'generation-artifacts', 'pipeline-trace');
    };
    PipelineTracer.initializeTrace = function (targetDir, artifact, provider, model) {
        return __awaiter(this, void 0, void 0, function () {
            var trace;
            return __generator(this, function (_a) {
                trace = {
                    artifact: artifact,
                    provider: provider,
                    model: model,
                    raw: { length: 0, startsWith: '', containsThink: false, containsFence: false },
                    sanitizer: { beforeLength: 0, afterLength: 0, removedThink: false, removedFence: false },
                    extractor: { codeStartIndex: -1, firstLine: '', startsWithImport: false, startsWithExport: false, startsWithInterface: false, startsWithConst: false },
                    syntaxGate: { passed: false, error: null },
                    compileGate: { passed: false, error: null },
                    diff: { rawToSanitizedRemoved: 0, sanitizedToExtractedRemoved: 0 }
                };
                return [2 /*return*/, trace];
            });
        });
    };
    PipelineTracer.recordRaw = function (targetDir, trace, rawText) {
        return __awaiter(this, void 0, void 0, function () {
            var artifactDir;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        trace.raw.length = rawText.length;
                        trace.raw.startsWith = rawText.substring(0, 50).replace(/\n/g, ' ');
                        trace.raw.containsThink = rawText.includes('<think>');
                        trace.raw.containsFence = rawText.includes('```');
                        artifactDir = path.join(this.getBaseDir(targetDir), trace.artifact);
                        return [4 /*yield*/, fs.mkdir(artifactDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, fs.writeFile(path.join(artifactDir, '01-raw.txt'), rawText, 'utf-8')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PipelineTracer.recordSanitized = function (targetDir, trace, sanitizedText) {
        return __awaiter(this, void 0, void 0, function () {
            var artifactDir;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        trace.sanitizer.beforeLength = trace.raw.length;
                        trace.sanitizer.afterLength = sanitizedText.length;
                        trace.sanitizer.removedThink = trace.raw.containsThink && !sanitizedText.includes('<think>');
                        trace.sanitizer.removedFence = trace.raw.containsFence && !sanitizedText.includes('```');
                        trace.diff.rawToSanitizedRemoved = trace.raw.length - sanitizedText.length;
                        artifactDir = path.join(this.getBaseDir(targetDir), trace.artifact);
                        return [4 /*yield*/, fs.writeFile(path.join(artifactDir, '02-sanitized.txt'), sanitizedText, 'utf-8')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PipelineTracer.recordExtracted = function (targetDir, trace, extractedText, sanitizedText) {
        return __awaiter(this, void 0, void 0, function () {
            var lines, firstLine, artifactDir;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lines = extractedText.trim().split('\n');
                        firstLine = lines.length > 0 ? lines[0].trim() : '';
                        trace.extractor.codeStartIndex = sanitizedText.indexOf(extractedText);
                        trace.extractor.firstLine = firstLine;
                        trace.extractor.startsWithImport = firstLine.startsWith('import');
                        trace.extractor.startsWithExport = firstLine.startsWith('export');
                        trace.extractor.startsWithInterface = firstLine.startsWith('interface');
                        trace.extractor.startsWithConst = firstLine.startsWith('const');
                        trace.diff.sanitizedToExtractedRemoved = sanitizedText.length - extractedText.length;
                        artifactDir = path.join(this.getBaseDir(targetDir), trace.artifact);
                        return [4 /*yield*/, fs.writeFile(path.join(artifactDir, '03-extracted.tsx'), extractedText, 'utf-8')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PipelineTracer.saveTrace = function (targetDir, trace) {
        return __awaiter(this, void 0, void 0, function () {
            var baseDir;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        baseDir = this.getBaseDir(targetDir);
                        return [4 /*yield*/, fs.mkdir(baseDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, fs.writeFile(path.join(baseDir, "".concat(trace.artifact, ".json")), JSON.stringify(trace, null, 2), 'utf-8')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PipelineTracer.updateHealth = function (targetDir, failureType) {
        return __awaiter(this, void 0, void 0, function () {
            var healthPath, health, data, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        healthPath = path.join(targetDir, 'generation-artifacts', 'pipeline-health.json');
                        health = {
                            artifactsGenerated: 0,
                            syntaxFailures: 0,
                            compileFailures: 0,
                            corruptionFailures: 0,
                            successfulArtifacts: 0
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs.readFile(healthPath, 'utf-8')];
                    case 2:
                        data = _a.sent();
                        health = JSON.parse(data);
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        health.artifactsGenerated++;
                        if (failureType === 'syntax')
                            health.syntaxFailures++;
                        if (failureType === 'compile')
                            health.compileFailures++;
                        if (failureType === 'corruption')
                            health.corruptionFailures++;
                        if (failureType === 'success')
                            health.successfulArtifacts++;
                        return [4 /*yield*/, fs.mkdir(path.dirname(healthPath), { recursive: true })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, fs.writeFile(healthPath, JSON.stringify(health, null, 2), 'utf-8')];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PipelineTracer.runCorruptionDetector = function (extractedText) {
        var lower = extractedText.trim().toLowerCase();
        var badStarts = [
            "let me", "i think", "perhaps", "maybe", "first", "next",
            "the component", "the hook", "the service"
        ];
        for (var _i = 0, badStarts_1 = badStarts; _i < badStarts_1.length; _i++) {
            var phrase = badStarts_1[_i];
            if (lower.startsWith(phrase)) {
                throw new Error("PIPELINE_CORRUPTION_DETECTED: Starts with '".concat(phrase, "'"));
            }
        }
        var validStarters = ['import', 'export', 'interface', 'type', 'const', 'function', 'enum'];
        var firstWord = extractedText.trim().split(/\s+/)[0];
        if (!validStarters.includes(firstWord)) {
            throw new Error("INVALID_CODE_START: Extracted output MUST start with a valid anchor. Found: '".concat(firstWord, "'"));
        }
    };
    return PipelineTracer;
}());
exports.PipelineTracer = PipelineTracer;
