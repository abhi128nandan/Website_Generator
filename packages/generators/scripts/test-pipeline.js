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
var fs = require("fs/promises");
var path = require("path");
var output_sanitizer_1 = require("../src/validators/output-sanitizer");
var code_extractor_1 = require("../src/validators/code-extractor");
var code_validity_gate_1 = require("../src/validators/code-validity-gate");
var testCases = [
    {
        id: 1,
        name: 'Pure TSX output',
        input: "import React from 'react';\nexport default function App() { return (\n<div>Hello</div>\n); }\n",
        shouldReachSyntaxGate: true
    },
    {
        id: 2,
        name: 'Output with <think>',
        input: "<think>I need to create a react component</think>\nimport React from 'react';\nexport default function App() { return (\n<div>Hello</div>\n); }\n",
        shouldReachSyntaxGate: false
    },
    {
        id: 3,
        name: 'Output with reasoning before code',
        input: "Let me think about this. The component should be simple.\n\nimport React from 'react';\nexport default function App() { return (\n<div>Hello</div>\n); }\n",
        shouldReachSyntaxGate: false
    },
    {
        id: 4,
        name: 'Output with reasoning after code',
        input: "import React from 'react';\nexport default function App() { return (\n<div>Hello</div>\n); }\n\nThis is the implementation of the component. I hope this helps.",
        shouldReachSyntaxGate: false
    },
    {
        id: 5,
        name: 'Output wrapped in markdown fences',
        input: "Here is the code:\n```tsx\nimport React from 'react';\nexport default function App() { return (\n<div>Hello</div>\n); }\n```\nLet me know if you need anything else.",
        shouldReachSyntaxGate: false
    },
    {
        id: 6,
        name: 'Output with malformed TSX',
        input: "import React from 'react';\nexport default function App() { return (\n<div>Hello</div>\n); \n", // Missing brace
        shouldReachSyntaxGate: false
    }
];
function runTests() {
    return __awaiter(this, void 0, void 0, function () {
        var results, allTestsPassed, _i, testCases_1, testCase, reachedSyntaxGate, failedAtStage, reason, sanitizedResult, code, extracted, validityGate, passed, reportPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    results = [];
                    allTestsPassed = true;
                    for (_i = 0, testCases_1 = testCases; _i < testCases_1.length; _i++) {
                        testCase = testCases_1[_i];
                        reachedSyntaxGate = true;
                        failedAtStage = null;
                        reason = null;
                        try {
                            sanitizedResult = output_sanitizer_1.OutputSanitizer.sanitizeWithDiagnostics(testCase.input);
                            if (!sanitizedResult.diagnostics.success) {
                                reachedSyntaxGate = false;
                                failedAtStage = 'OutputSanitizer';
                                reason = 'Remaining reasoning indicators found';
                            }
                            code = sanitizedResult.code;
                            if (reachedSyntaxGate) {
                                extracted = code_extractor_1.CodeExtractor.extractCodeArtifact(code, true, 'TestComponent');
                                if (!extracted.success) {
                                    reachedSyntaxGate = false;
                                    failedAtStage = 'CodeExtractor';
                                    reason = extracted.reason;
                                }
                                code = extracted.code;
                            }
                            if (reachedSyntaxGate) {
                                validityGate = code_validity_gate_1.CodeValidityGate.validate(code);
                                if (!validityGate.isValid) {
                                    reachedSyntaxGate = false;
                                    failedAtStage = 'CodeValidityGate';
                                    reason = validityGate.reason;
                                }
                            }
                            passed = reachedSyntaxGate === testCase.shouldReachSyntaxGate;
                            if (!passed)
                                allTestsPassed = false;
                            results.push({
                                id: testCase.id,
                                name: testCase.name,
                                passed: passed,
                                expectedReachSyntaxGate: testCase.shouldReachSyntaxGate,
                                actualReachSyntaxGate: reachedSyntaxGate,
                                failedAtStage: failedAtStage,
                                reason: reason
                            });
                        }
                        catch (e) {
                            results.push({
                                id: testCase.id,
                                name: testCase.name,
                                passed: false,
                                error: e.message
                            });
                            allTestsPassed = false;
                        }
                    }
                    reportPath = path.resolve(__dirname, '../../generation-artifacts/pipeline-regression-report.json');
                    return [4 /*yield*/, fs.mkdir(path.dirname(reportPath), { recursive: true })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fs.writeFile(reportPath, JSON.stringify({ allTestsPassed: allTestsPassed, results: results }, null, 2), 'utf-8')];
                case 2:
                    _a.sent();
                    console.log("Pipeline Regression Test completed. Passed: ".concat(allTestsPassed));
                    if (!allTestsPassed) {
                        console.error('Some tests failed!');
                        process.exit(1);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
runTests().catch(function (e) {
    console.error(e);
    process.exit(1);
});
