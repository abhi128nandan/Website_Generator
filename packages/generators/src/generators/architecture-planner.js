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
exports.ArchitecturePlanner = void 0;
var ai_engine_1 = require("@website-generator/ai-engine");
var shared_1 = require("@website-generator/shared");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var ArchitecturePlanner = /** @class */ (function () {
    function ArchitecturePlanner() {
    }
    ArchitecturePlanner.plan = function (srsText, reqs, targetDir, onLog) {
        return __awaiter(this, void 0, void 0, function () {
            var provider, prompt, attempt, response, cleaned, blueprint, blueprintPath, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        onLog(2, '[planner] Analyzing requirements to generate central Architecture Blueprint...');
                        provider = ai_engine_1.ProviderFactory.getProvider();
                        prompt = "You are a Senior Staff Software Architect.\nYour job is to read the Software Requirements Specification (SRS) and output a strict JSON blueprint.\nThis blueprint will be the single source of truth for all downstream code generators to prevent inconsistencies.\n\nSRS Text:\n".concat(srsText.substring(0, 3000), "\n\nClassified Mode: ").concat(reqs.classifiedMode, "\n\nOutput ONLY valid JSON matching this exact structure, with no markdown formatting or extra text:\n{\n  \"appType\": \"e.g. crud-admin, saas-dashboard, portfolio\",\n  \"pages\": [\n    \"Dashboard\",\n    { \"name\": \"Settings\", \"isProtected\": true },\n    { \"name\": \"AdminPortal\", \"isProtected\": true, \"allowedRoles\": [\"ADMIN\", \"SUPER_ADMIN\"] }\n  ],\n  \"entities\": [\"User\", \"Post\", \"Comment\"],\n  \"apis\": [\"GET /api/users\", \"POST /api/posts\"],\n  \"capabilities\": [\n    {\n      \"name\": \"LeadScoringEngine\",\n      \"description\": \"Calculates lead scores based on interaction events\",\n      \"type\": \"workflow\",\n      \"inputs\": [\"UserActivity\"],\n      \"outputs\": [\"Score\"]\n    }\n  ],\n  \"designTokens\": {\n    \"primaryColor\": \"#000000\",\n    \"layout\": \"sidebar\"\n  }\n}\n");
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= 3)) return [3 /*break*/, 7];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, provider.generateText(prompt)];
                    case 3:
                        response = _a.sent();
                        cleaned = response.trim();
                        if (cleaned.startsWith('```json'))
                            cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
                        blueprint = JSON.parse(cleaned);
                        blueprintPath = path_1.default.join(targetDir, 'architecture.json');
                        return [4 /*yield*/, promises_1.default.writeFile(blueprintPath, JSON.stringify(blueprint, null, 2), 'utf-8')];
                    case 4:
                        _a.sent();
                        onLog(2, "[planner] Blueprint generated: ".concat(blueprint.pages.length, " pages, ").concat(blueprint.entities.length, " entities, ").concat(blueprint.apis.length, " APIs."));
                        return [2 /*return*/, blueprint];
                    case 5:
                        e_1 = _a.sent();
                        shared_1.Logger.warn("[planner] Attempt ".concat(attempt, " failed to generate valid JSON blueprint: ").concat(e_1.message));
                        attempt++;
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 1];
                    case 7: throw new Error('Failed to generate a valid Architecture Blueprint after 3 attempts.');
                }
            });
        });
    };
    return ArchitecturePlanner;
}());
exports.ArchitecturePlanner = ArchitecturePlanner;
