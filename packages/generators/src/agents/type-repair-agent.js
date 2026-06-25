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
exports.TypeRepairAgent = void 0;
var ai_engine_1 = require("@website-generator/ai-engine");
var shared_1 = require("@website-generator/shared");
var ast_repair_agent_1 = require("./ast-repair-agent");
var TypeRepairAgent = /** @class */ (function () {
    function TypeRepairAgent() {
    }
    TypeRepairAgent.repair = function (targetDir, filePath, fileContent, errors) {
        return __awaiter(this, void 0, void 0, function () {
            var provider, prompt, response, patchedContent, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        shared_1.Logger.info("[TypeRepairAgent] Attempting to fix TypeScript errors in ".concat(filePath, " using Local Patching"));
                        provider = ai_engine_1.ProviderFactory.getProvider();
                        prompt = "You are an expert TypeScript Developer.\nThe following file has TypeScript compilation errors, type mismatches (e.g. null vs undefined), or interface violations.\n\nFile: ".concat(filePath, "\n\nCurrent Content:\n```typescript\n").concat(fileContent, "\n```\n\nReported TS Errors:\n").concat(errors.join('\n').substring(0, 1500), "\n\nRequirements:\n- Fix the TypeScript errors.\n- Ensure strict null checks are satisfied.\n- Do NOT add new dependencies or import non-existent files.\n- Output ONLY localized SEARCH/REPLACE blocks to patch the file. Do NOT output the entire file.\n\nFormat EXACTLY as:\nSEARCH:\n<exact lines to replace from the Current Content>\nREPLACE:\n<new lines to replace them with>\n\nRules:\n- The SEARCH block must perfectly match a continuous sequence of lines in the Current Content, including indentation and formatting.\n- The REPLACE block contains the corrected code.\n- You may use multiple SEARCH/REPLACE blocks if necessary.\n- Do not use markdown codeblocks around the SEARCH/REPLACE operations.\n- Do not output any conversational text.\n");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, provider.generateText(prompt)];
                    case 2:
                        response = _a.sent();
                        patchedContent = ast_repair_agent_1.ASTRepairAgent.applyPatch(fileContent, response);
                        return [2 /*return*/, patchedContent];
                    case 3:
                        e_1 = _a.sent();
                        shared_1.Logger.error("[TypeRepairAgent] Failed: ".concat(e_1.message));
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return TypeRepairAgent;
}());
exports.TypeRepairAgent = TypeRepairAgent;
