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
exports.ASTRepairAgent = void 0;
var ai_engine_1 = require("@website-generator/ai-engine");
var shared_1 = require("@website-generator/shared");
var ASTRepairAgent = /** @class */ (function () {
    function ASTRepairAgent() {
    }
    ASTRepairAgent.repair = function (targetDir, filePath, fileContent, errors) {
        return __awaiter(this, void 0, void 0, function () {
            var provider, prompt, response, patchedContent, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        shared_1.Logger.info("[ASTRepairAgent] Attempting to fix syntax/AST errors in ".concat(filePath, " using Local Patching"));
                        provider = ai_engine_1.ProviderFactory.getProvider();
                        prompt = "You are an expert React/TypeScript Developer and AST Fixer.\nThe following file has syntax errors, missing exports, missing imports, or malformed JSX.\n\nFile: ".concat(filePath, "\n\nCurrent Content:\n```typescript\n").concat(fileContent, "\n```\n\nReported Errors:\n").concat(errors.join('\n').substring(0, 1500), "\n\nRequirements:\n- Fix the syntax errors and malformed JSX.\n- Fix any missing imports or missing exports.\n- Output ONLY localized SEARCH/REPLACE blocks to patch the file. Do NOT output the entire file.\n\nFormat EXACTLY as:\nSEARCH:\n<exact lines to replace from the Current Content>\nREPLACE:\n<new lines to replace them with>\n\nRules:\n- The SEARCH block must perfectly match a continuous sequence of lines in the Current Content, including indentation and formatting.\n- The REPLACE block contains the corrected code.\n- You may use multiple SEARCH/REPLACE blocks if necessary.\n- Do not use markdown codeblocks around the SEARCH/REPLACE operations.\n- Do not output any conversational text.\n");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, provider.generateText(prompt)];
                    case 2:
                        response = _a.sent();
                        patchedContent = this.applyPatch(fileContent, response);
                        return [2 /*return*/, patchedContent];
                    case 3:
                        e_1 = _a.sent();
                        shared_1.Logger.error("[ASTRepairAgent] Failed: ".concat(e_1.message));
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ASTRepairAgent.applyPatch = function (original, patch) {
        var result = original;
        // Strip markdown codeblocks if the LLM wrapped the whole response
        var cleanPatch = patch.replace(/```(?:typescript|ts|javascript|js)?\n/gi, '').replace(/```/g, '');
        var blocks = cleanPatch.split(/SEARCH:\s*\n/g).filter(function (b) { return b.trim().length > 0; });
        var appliedCount = 0;
        for (var _i = 0, blocks_1 = blocks; _i < blocks_1.length; _i++) {
            var block = blocks_1[_i];
            var parts = block.split(/REPLACE:\s*\n/);
            if (parts.length !== 2)
                continue;
            var searchStr = parts[0].trim();
            var replaceStr = parts[1].trimEnd();
            // Ensure consistent newlines for matching
            var normalizedResult = result.replace(/\r\n/g, '\n');
            // Create a normalized comparison layer using a flexible regex
            // 1. Escape all regex special characters
            var escapedSearch = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // 2. Replace any whitespace sequence (spaces, tabs, newlines) with a flexible \s+ matcher
            // This natively normalizes indentation, repeated spaces, and collapsed blank lines
            var flexibleSearchRegex = escapedSearch.replace(/\s+/g, '\\s+');
            var matchRegex = new RegExp(flexibleSearchRegex);
            var match = normalizedResult.match(matchRegex);
            if (match) {
                // match[0] contains the exact original un-normalized string from the target file
                result = normalizedResult.replace(match[0], replaceStr);
                appliedCount++;
            }
            else {
                shared_1.Logger.warn("[ASTRepairAgent] SEARCH block did not match content after normalization.");
            }
        }
        if (appliedCount === 0) {
            shared_1.Logger.warn("[ASTRepairAgent] No patches were successfully applied.");
            // Fallback to original string if no patches applied successfully, 
            // but maybe it's better to return the original so rollback triggers safely if needed.
        }
        return result;
    };
    return ASTRepairAgent;
}());
exports.ASTRepairAgent = ASTRepairAgent;
