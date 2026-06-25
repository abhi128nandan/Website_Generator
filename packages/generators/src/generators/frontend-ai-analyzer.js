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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendAIAnalyzer = void 0;
var shared_1 = require("@website-generator/shared");
var ai_engine_1 = require("@website-generator/ai-engine");
var observability_layer_1 = require("../observability/observability-layer");
var requirement_intelligence_1 = require("../analysis/requirement-intelligence");
var frontend_complexity_guard_1 = require("../validators/frontend-complexity-guard");
/**
 * AI-powered frontend architecture analyzer.
 *
 * Analogous to CrudGenerator.analyze() but produces a FrontendArchitecture
 * (components, services, hooks, pages) instead of CRUD entities/endpoints.
 */
var FrontendAIAnalyzer = /** @class */ (function () {
    function FrontendAIAnalyzer() {
    }
    FrontendAIAnalyzer.analyze = function (reqs) {
        return __awaiter(this, void 0, void 0, function () {
            var provider, profile, budget, blueprint, blueprintContext, pageNames, prompt_1, targetDir, architecture, parsed, valid, attempt, maxAttempts, responseText, start, end, jsonString, guardErr_1, _loop_1, _i, _a, page, complexity, manifest, serviceKeywords, _loop_2, _b, _c, hook, metadata, err_1;
            var _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 14, , 15]);
                        provider = ai_engine_1.ProviderFactory.getProvider();
                        profile = requirement_intelligence_1.RequirementIntelligence.analyze(reqs);
                        budget = requirement_intelligence_1.RequirementIntelligence.toBudget(profile);
                        shared_1.Logger.info("[FrontendAIAnalyzer] Requirement profile: complexity=".concat(profile.complexity, ", ui=").concat(profile.uiComplexity, ", state=").concat(profile.stateComplexity, ", backend=").concat(profile.requiresBackend, ", db=").concat(profile.requiresDatabase, ", auth=").concat(profile.requiresAuthentication));
                        blueprint = reqs.blueprint;
                        blueprintContext = '';
                        if (blueprint) {
                            pageNames = (blueprint.pages || []).map(function (p) { return typeof p === 'string' ? p : p.name; });
                            blueprintContext = "\nAuthoritative Business Context:\nPages: ".concat(pageNames.join(', '), "\nEntities: ").concat((blueprint.entities || []).join(', '), "\nAPIs: ").concat((blueprint.apis || []).join(', '), "\n\nUse the following business blueprint as authoritative context.\nDo not invent conflicting pages.\nDo not invent conflicting entities.\nDo not invent conflicting API domains.\nPhysical React architecture may extend this blueprint but must remain consistent with it.\n");
                        }
                        prompt_1 = "You are a Senior Frontend Architect.\nAnalyze the following application requirements and output a deterministic JSON structure representing the frontend-only architecture.\nYou MUST output ONLY a valid JSON object matching the following structure exactly. Do not output markdown code blocks or any conversational text.\n".concat(blueprintContext, "\nStructure:\n{\n  \"complexityScore\": \"simple\" | \"medium\" | \"complex\",\n  \"components\": [\n    {\n      \"name\": \"string (PascalCase, e.g. SearchBar, WeatherCard)\",\n      \"type\": \"page\" | \"component\" | \"layout\",\n      \"description\": \"string describing what this component renders\"\n    }\n  ],\n  \"services\": [\n    {\n      \"name\": \"string (camelCase, e.g. weatherApi, geolocationService)\",\n      \"description\": \"string describing what this service does\",\n      \"externalApi\": \"string (optional \u2014 name of the external API, e.g. OpenWeatherMap, PokeAPI. If none, omit this field entirely or use empty string. DO NOT USE null.)\",\n      \"endpoints\": [\n        {\n          \"method\": \"GET | POST | PUT | PATCH | DELETE\",\n          \"path\": \"string (e.g. /api/users)\",\n          \"description\": \"string describing what this endpoint does\"\n        }\n      ]\n    }\n  ],\n  \"hooks\": [\n    {\n      \"name\": \"string (camelCase with 'use' prefix, e.g. useWeather, useLocalStorage)\",\n      \"description\": \"string describing what this hook manages\"\n    }\n  ],\n  \"pages\": [\n    {\n      \"route\": \"string (e.g. /, /about, /settings)\",\n      \"componentName\": \"string (PascalCase page component name)\",\n      \"description\": \"string describing what this page shows\",\n      \"isProtected\": \"boolean (optional, true if access is restricted to authenticated users. Default is false)\",\n      \"allowedRoles\": \"array of strings (optional, e.g. ['USER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']. Omit or use empty array if any authenticated user can access)\"\n    }\n  ]\n}\n\nApplication Context:\nApp Name: ").concat(reqs.appName, "\nApp Type: ").concat(reqs.appType, "\nFeatures: ").concat(reqs.features.join(', '), "\n\nRules:\n- This is a FRONTEND-ONLY app. No database, no Prisma, no backend CRUD.\n- Components should be reusable and focused on UI rendering.\n- Services should handle external API calls, localStorage, or browser APIs.\n- Hooks should manage stateful logic (fetching, local storage, geolocation, etc).\n- Generate at least one page component.\n- Use modern React patterns (functional components, hooks, async/await).\n- Consider responsive design, loading states, error handling, and user experience.\n- If 'Authoritative Business Context' contains APIs, you MUST map those explicit endpoints into the corresponding service.endpoints array.\n\nSTRICT ARCHITECTURE BUDGET:\nThis application has been classified as ").concat(budget.size, " complexity. You MUST stay strictly within the following limits to prevent over-decomposition:\n- MAXIMUM Components: ").concat(budget.maxComponents, "\n- MAXIMUM Hooks: ").concat(budget.maxHooks, "\n- MAXIMUM Services: ").concat(budget.maxServices, "\n- MAXIMUM Pages: ").concat(budget.maxPages, "\n\nIf the application is simple, prefer inline state over creating custom hooks, prefer monolithic components over deep decomposition, and do NOT create services unless explicitly requested.\n\nHOOK BUDGET RULES\nGenerate a custom hook ONLY if at least one condition is true:\n1. The hook encapsulates API communication.\n2. The hook contains multi-step business logic.\n3. The hook is expected to be reused by 2 or more components.\n\nDo NOT generate hooks for:\n* Single useState wrappers.\n* useToggle patterns.\n* useInput patterns.\n* Local component state.\n\nPrefer local React state instead.\n\nCONTEXT BUDGET RULES\nGenerate Context Providers ONLY if:\n1. State is shared across multiple pages.\n2. State is consumed by 3 or more components.\n3. State represents Auth, Theme, Configuration, or Application-level data.\n\nDo NOT generate Context Providers for:\n* Single-page state.\n* Single-feature state.\n* Local component state.\n\nPrefer props or local state instead.\n\nCOMPONENT BUDGET RULES\nCreate a separate component ONLY if:\n1. It is reused.\n2. It has a distinct responsibility.\n3. It contains meaningful UI complexity.\n\nAvoid fragmenting UI into tiny wrapper components.\n\nDo NOT generate:\n* CardTitle\n* CardBody\n* Tiny presentational wrappers\n\nunless explicitly reused.");
                        targetDir = reqs.__targetDir;
                        architecture = null;
                        parsed = null;
                        valid = false;
                        attempt = 1;
                        maxAttempts = 3;
                        _f.label = 1;
                    case 1:
                        if (!(!valid && attempt <= maxAttempts)) return [3 /*break*/, 8];
                        shared_1.Logger.info("[FrontendAIAnalyzer] Executing AI frontend architecture analysis (Attempt ".concat(attempt, "/").concat(maxAttempts, ")..."));
                        return [4 /*yield*/, provider.generateJSON(prompt_1)];
                    case 2:
                        responseText = _f.sent();
                        start = responseText.indexOf('{');
                        end = responseText.lastIndexOf('}');
                        if (start === -1 || end === -1 || end < start) {
                            throw new Error('No JSON object found in AI response');
                        }
                        jsonString = responseText.substring(start, end + 1);
                        parsed = JSON.parse(jsonString);
                        architecture = shared_1.FrontendArchitectureSchema.parse(parsed);
                        _f.label = 3;
                    case 3:
                        _f.trys.push([3, 6, , 7]);
                        if (!targetDir) return [3 /*break*/, 5];
                        return [4 /*yield*/, frontend_complexity_guard_1.FrontendComplexityGuard.validate(__assign(__assign({}, reqs), { frontendArchitecture: architecture }), targetDir)];
                    case 4:
                        _f.sent();
                        _f.label = 5;
                    case 5:
                        valid = true;
                        return [3 /*break*/, 7];
                    case 6:
                        guardErr_1 = _f.sent();
                        shared_1.Logger.warn("[FrontendAIAnalyzer] Discarding generated architecture because it failed ComplexityGuard: ".concat(guardErr_1.message));
                        attempt++;
                        if (attempt > maxAttempts) {
                            throw new Error("Failed to generate an architecture within complexity limits after ".concat(maxAttempts, " attempts: ").concat(guardErr_1.message));
                        }
                        return [3 /*break*/, 7];
                    case 7: return [3 /*break*/, 1];
                    case 8:
                        // Deduplicate names: Ensure pages don't conflict with components/hooks/services
                        if (architecture.pages && architecture.components) {
                            _loop_1 = function (page) {
                                if (!page.componentName.endsWith('Page')) {
                                    var conflict = architecture.components.some(function (c) { return c.name === page.componentName; });
                                    if (conflict) {
                                        page.componentName += 'Page';
                                    }
                                }
                            };
                            for (_i = 0, _a = architecture.pages; _i < _a.length; _i++) {
                                page = _a[_i];
                                _loop_1(page);
                            }
                        }
                        if (!targetDir) return [3 /*break*/, 10];
                        return [4 /*yield*/, observability_layer_1.GeneratorObservability.writeArtifact(targetDir, 'architecture-raw.json', architecture)];
                    case 9:
                        _f.sent();
                        _f.label = 10;
                    case 10:
                        complexity = parsed.complexityScore || 'medium';
                        delete parsed.complexityScore;
                        if (architecture.complexityScore) {
                            delete architecture.complexityScore;
                        }
                        shared_1.Logger.info("[FrontendAIAnalyzer] AI determined complexity: ".concat(complexity));
                        manifest = {
                            components: architecture.components
                                .filter(function (c) { return c.type !== 'page'; })
                                .map(function (c) { return c.name; }),
                            hooks: architecture.hooks.map(function (h) { return h.name; }),
                            services: architecture.services.map(function (s) { return s.name; }),
                            pages: architecture.pages.map(function (p) { return p.componentName; }),
                        };
                        // Cross-reference validation: if services is empty, hooks should not
                        // contain descriptions that reference service imports.
                        if (manifest.services.length === 0 && architecture.hooks.length > 0) {
                            serviceKeywords = ['service', 'api', 'fetch from server', 'backend', 'endpoint'];
                            _loop_2 = function (hook) {
                                var lowerDesc = hook.description.toLowerCase();
                                if (serviceKeywords.some(function (kw) { return lowerDesc.includes(kw); })) {
                                    // Rewrite description to avoid service references
                                    hook.description = hook.description
                                        .replace(/using\s+(the\s+)?[\w]+\s*service/gi, 'using React state')
                                        .replace(/fetche?s?\s+(data\s+)?from\s+(the\s+)?(api|backend|server|endpoint)/gi, 'manages data using local state')
                                        .replace(/calls?\s+(the\s+)?[\w]+\s*api/gi, 'uses local computation');
                                    shared_1.Logger.info("[FrontendAIAnalyzer] Rewrote hook \"".concat(hook.name, "\" description to remove service references (services=empty)."));
                                }
                            };
                            for (_b = 0, _c = architecture.hooks; _b < _c.length; _b++) {
                                hook = _c[_b];
                                _loop_2(hook);
                            }
                        }
                        shared_1.Logger.info("[FrontendAIAnalyzer] Architecture manifest locked: ".concat(JSON.stringify(manifest)));
                        reqs.frontendArchitecture = architecture;
                        shared_1.Logger.info("[FrontendAIAnalyzer] AI analysis complete. Discovered ".concat(architecture.components.length, " components, ").concat(architecture.services.length, " services, ").concat(architecture.hooks.length, " hooks, and ").concat(architecture.pages.length, " pages."));
                        if (!targetDir) return [3 /*break*/, 13];
                        metadata = { complexityScore: complexity };
                        return [4 /*yield*/, observability_layer_1.GeneratorObservability.writeArtifact(targetDir, 'metadata.json', metadata)];
                    case 11:
                        _f.sent();
                        return [4 /*yield*/, observability_layer_1.GeneratorObservability.writeArtifact(targetDir, 'architecture-final.json', architecture)];
                    case 12:
                        _f.sent();
                        _f.label = 13;
                    case 13:
                        // Consistency Check Warning
                        if (reqs.classifiedMode === 'frontend-app') {
                            if (architecture.services.length > 0 || ((_d = reqs.database) === null || _d === void 0 ? void 0 : _d.length) > 0 || ((_e = reqs.backend) === null || _e === void 0 ? void 0 : _e.length) > 0) {
                                shared_1.Logger.warn('[ARCHITECTURE WARNING] Frontend-only app contains service layer or backend configuration.');
                            }
                        }
                        return [3 /*break*/, 15];
                    case 14:
                        err_1 = _f.sent();
                        shared_1.Logger.error("[FrontendAIAnalyzer] Failed to analyze frontend architecture: ".concat(err_1.message));
                        // Provide a minimal fallback architecture so generation can continue
                        reqs.frontendArchitecture = {
                            components: [
                                { name: 'Header', type: 'layout', description: 'Application header with navigation' },
                                { name: 'MainContent', type: 'component', description: 'Primary content area' },
                            ],
                            services: [],
                            hooks: [],
                            pages: [
                                { route: '/', componentName: 'Home', description: 'Main application page', isProtected: false, allowedRoles: [] },
                            ],
                        };
                        shared_1.Logger.warn('[FrontendAIAnalyzer] Using minimal fallback architecture.');
                        return [3 /*break*/, 15];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    return FrontendAIAnalyzer;
}());
exports.FrontendAIAnalyzer = FrontendAIAnalyzer;
