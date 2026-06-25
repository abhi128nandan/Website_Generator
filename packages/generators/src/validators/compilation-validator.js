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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompilationValidator = void 0;
var ts = require("typescript");
var fs = require("fs");
var path = require("path");
var CompilationValidator = /** @class */ (function () {
    function CompilationValidator() {
    }
    CompilationValidator.validate = function (content, isTsx, targetDir) {
        try {
            var result = this._validateOriginal(content, isTsx, targetDir);
            this._logTrace('CompilationValidator', true, result, null, content);
            return result;
        }
        catch (err) {
            this._logTrace('CompilationValidator', false, null, err.message, content);
            throw err;
        }
    };
    CompilationValidator._logTrace = function (validatorName, pass, returnValue, error, content) {
        try {
            var fs_1 = require('fs');
            var path_1 = require('path');
            var artifactsDir = 'c:/website-generator-core/website-generator-core/generation-artifacts';
            if (!fs_1.existsSync(artifactsDir))
                fs_1.mkdirSync(artifactsDir, { recursive: true });
            var tracePath = path_1.join(artifactsDir, 'compiler-gate-execution-trace.json');
            var traceData = [];
            if (fs_1.existsSync(tracePath)) {
                try {
                    traceData = JSON.parse(fs_1.readFileSync(tracePath, 'utf8'));
                }
                catch (e) { }
            }
            var success = returnValue ? (returnValue.success !== undefined ? returnValue.success : returnValue.isValid) : false;
            traceData.push({
                validatorName: validatorName,
                pass: success,
                exactReturnValue: returnValue ? { success: returnValue.success, errorCategory: returnValue.errorCategory } : null,
                exactThrownError: error ? (error.message || String(error)) : null
            });
            fs_1.writeFileSync(tracePath, JSON.stringify(traceData, null, 2));
            // PHASE 3: Capture Final Source
            var sourceTracePath = path_1.join(artifactsDir, 'compiler-input-trace.json');
            var sourceData = [];
            if (fs_1.existsSync(sourceTracePath)) {
                try {
                    sourceData = JSON.parse(fs_1.readFileSync(sourceTracePath, 'utf8'));
                }
                catch (e) { }
            }
            sourceData.push({
                validatorName: validatorName,
                timestamp: new Date().toISOString(),
                finalCompilerInput: content
            });
            fs_1.writeFileSync(sourceTracePath, JSON.stringify(sourceData, null, 2));
        }
        catch (e) {
            console.error('Failed to write trace', e);
        }
    };
    CompilationValidator._validateOriginal = function (content, isTsx, targetDir) {
        var filename = isTsx ? 'temp.tsx' : 'temp.ts';
        var compilerOptions = {};
        var configLoaded = false;
        var resolvedConfigPath;
        if (targetDir) {
            // Find the config file starting from targetDir
            var configPath = ts.findConfigFile(targetDir, ts.sys.fileExists, 'tsconfig.json');
            if (configPath) {
                // Rule 2: Never fall back to generators package tsconfig
                if (!configPath.includes('packages/generators')) {
                    var configFile = ts.readConfigFile(configPath, ts.sys.readFile);
                    if (configFile.config) {
                        var parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, require('path').dirname(configPath));
                        compilerOptions = __assign({}, parsedConfig.options);
                        configLoaded = true;
                        resolvedConfigPath = configPath;
                    }
                }
            }
        }
        if (!configLoaded) {
            compilerOptions = {
                target: ts.ScriptTarget.ESNext,
                module: ts.ModuleKind.ESNext,
                moduleResolution: ts.ModuleResolutionKind.NodeJs,
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                lib: ['lib.dom.d.ts', 'lib.esnext.d.ts']
            };
        }
        compilerOptions.noEmit = true;
        if (isTsx && compilerOptions.jsx === undefined) {
            compilerOptions.jsx = ts.JsxEmit.ReactJSX;
        }
        // PHASE 5 — VERIFY TSCONFIG RESOLUTION
        try {
            var fs_2 = require('fs');
            var path_2 = require('path');
            var artifactsDir = 'c:/website-generator-core/website-generator-core/generation-artifacts';
            if (!fs_2.existsSync(artifactsDir))
                fs_2.mkdirSync(artifactsDir, { recursive: true });
            var tsconfigTracePath = path_2.join(artifactsDir, 'runtime-tsconfig-trace.json');
            var tsconfigData = {};
            if (fs_2.existsSync(tsconfigTracePath)) {
                try {
                    tsconfigData = JSON.parse(fs_2.readFileSync(tsconfigTracePath, 'utf8'));
                }
                catch (e) { }
            }
            tsconfigData['CompilationValidator'] = {
                tsconfigPathLoaded: resolvedConfigPath || 'none',
                compilerOptionsLoaded: compilerOptions,
                jsxMode: compilerOptions.jsx,
                moduleResolution: compilerOptions.moduleResolution,
                typesArray: compilerOptions.types
            };
            fs_2.writeFileSync(tsconfigTracePath, JSON.stringify(tsconfigData, null, 2));
        }
        catch (e) {
            console.error('Failed to write tsconfig trace', e);
        }
        // Create an in-memory compiler host
        var compilerHost = ts.createCompilerHost(compilerOptions);
        var originalGetSourceFile = compilerHost.getSourceFile;
        compilerHost.getSourceFile = function (fileName, languageVersion, onError, shouldCreateNewSourceFile) {
            if (fileName === filename) {
                return ts.createSourceFile(fileName, content, languageVersion, true);
            }
            return originalGetSourceFile.call(compilerHost, fileName, languageVersion, onError, shouldCreateNewSourceFile);
        };
        var program = ts.createProgram([filename], compilerOptions, compilerHost);
        // Get all diagnostics: syntax + semantic
        var allDiagnostics = ts.getPreEmitDiagnostics(program);
        // We consider it a failure if there are any Error level diagnostics, 
        // EXCEPT those related to missing modules or JSX intrinsics which we don't have in our in-memory host
        var ignoredCodes = [
            2307, // Cannot find module
            2792, // Cannot find module. Did you mean...
            7026, // JSX element implicitly has type 'any'
            7016, // Could not find a declaration file for module
            2503, // Cannot find namespace 'JSX'
            2552, // Cannot find name (often happens with React / globals in this env)
            2304, // Cannot find name
            6059, // File is not under 'rootDir' (expected when creating temp.tsx memory files)
            2862, // This JSX tag requires the module path 'react/jsx-runtime' to exist (missing dependencies in memory host)
            2875, // This JSX tag requires the module path 'react/jsx-runtime' to exist
            2688, // Cannot find type definition file for 'vite/client'
            7031, // Binding element implicitly has an 'any' type (happens when React.FC types are missing)
            7006 // Parameter implicitly has an 'any' type (happens for DOM events without types)
        ];
        var errors = allDiagnostics.filter(function (d) {
            return d.category === ts.DiagnosticCategory.Error &&
                !ignoredCodes.includes(d.code);
        });
        if (errors.length > 0) {
            // Detailed logging for diagnostics
            console.log("[CompilationValidator] ".concat(errors.length, " Compilation Errors Found:"));
            errors.forEach(function (err) {
                var message = ts.flattenDiagnosticMessageText(err.messageText, '\n');
                if (err.file && err.start !== undefined) {
                    var _a = ts.getLineAndCharacterOfPosition(err.file, err.start), line = _a.line, character = _a.character;
                    console.log("  Line ".concat(line + 1, ":").concat(character + 1, " - ").concat(message));
                }
                else {
                    console.log("  ".concat(message));
                }
            });
            // Instrumentation for diagnostics
            try {
                var artifactsDir = 'c:/website-generator-core/website-generator-core/generation-artifacts';
                if (!fs.existsSync(artifactsDir))
                    fs.mkdirSync(artifactsDir, { recursive: true });
                // PHASE 2: Instrument CompilationValidator
                var traceData = errors.map(function (err) {
                    var message = ts.flattenDiagnosticMessageText(err.messageText, '\n');
                    return {
                        diagnosticCode: err.code,
                        messageText: message,
                        sourceFile: err.file ? err.file.fileName : 'unknown',
                        compilerOptionsUsed: compilerOptions
                    };
                });
                fs.writeFileSync(path.join(artifactsDir, 'compiler-diagnostic-trace.json'), JSON.stringify(traceData, null, 2));
                // PHASE 3: Verify runtime validator
                var runtimeVerif = {
                    executingFilePath: __filename,
                    buildTimestamp: new Date().toISOString(),
                    jsxMode: compilerOptions.jsx,
                    tsconfigSource: targetDir ? ts.findConfigFile(targetDir, ts.sys.fileExists, 'tsconfig.json') : 'default'
                };
                fs.writeFileSync(path.join(artifactsDir, 'compiler-runtime-verification.json'), JSON.stringify(runtimeVerif, null, 2));
                // PHASE 4: Classify failure
                var failureClass = 'Other';
                var msgs = errors.map(function (e) { return ts.flattenDiagnosticMessageText(e.messageText, '\\n'); }).join(' ');
                if (errors.some(function (e) { return e.code === 2686 || e.code === 2786; }) || msgs.includes('React refers to a UMD global') || msgs.includes('cannot be used as a JSX component')) {
                    failureClass = 'React import issue';
                }
                else if (errors.some(function (e) { return e.category === ts.DiagnosticCategory.Error && e.code < 2000; })) {
                    failureClass = 'TS syntax error';
                }
                else if (errors.some(function (e) { return [2304, 2552, 2307, 7026, 2503].includes(e.code); }) || msgs.includes('Cannot find name')) {
                    failureClass = 'Missing type';
                }
                else if (errors.some(function (e) { return e.code === 2792; })) {
                    failureClass = 'Module resolution error';
                }
                else if (errors.some(function (e) { return e.code === 17004; }) || msgs.includes('JSX')) {
                    failureClass = 'JSX configuration mismatch';
                }
                else if (errors.some(function (e) { return e.code === 2862 || e.code === 2875; })) {
                    failureClass = 'Import resolution failure';
                }
                fs.writeFileSync(path.join(artifactsDir, 'compiler-failure-classification.json'), JSON.stringify({ classification: failureClass }, null, 2));
                // PHASE 1, 2, 3, 4: Live Compiler Trace Instrumentation
                if (content.includes('CalculatorDisplay')) {
                    var liveDiagPath = path.join(artifactsDir, 'live-compiler-diagnostics.json');
                    var liveDiagData_1 = [];
                    try {
                        if (fs.existsSync(liveDiagPath))
                            liveDiagData_1 = JSON.parse(fs.readFileSync(liveDiagPath, 'utf8'));
                    }
                    catch (e) { }
                    errors.forEach(function (err) {
                        var message = ts.flattenDiagnosticMessageText(err.messageText, '\n');
                        var line = 0, character = 0;
                        var snippet = '';
                        if (err.file && err.start !== undefined) {
                            var pos = ts.getLineAndCharacterOfPosition(err.file, err.start);
                            line = pos.line + 1;
                            character = pos.character + 1;
                            var lines = content.split('\n');
                            snippet = lines[pos.line] || '';
                        }
                        liveDiagData_1.push({
                            source: 'CompilationValidator',
                            diagnosticCode: err.code,
                            diagnosticCategory: ts.DiagnosticCategory[err.category],
                            diagnosticMessage: message,
                            sourceFile: err.file ? err.file.fileName : 'unknown',
                            line: line,
                            column: character,
                            sourceSnippet: snippet
                        });
                    });
                    fs.writeFileSync(liveDiagPath, JSON.stringify(liveDiagData_1, null, 2));
                    // PHASE 2: Attempt trace
                    var attemptTracePath = path.join(artifactsDir, 'calculatordisplay-attempt-trace.json');
                    var attemptsData = [];
                    try {
                        if (fs.existsSync(attemptTracePath))
                            attemptsData = JSON.parse(fs.readFileSync(attemptTracePath, 'utf8'));
                    }
                    catch (e) { }
                    attemptsData.push({
                        attemptNumber: attemptsData.length + 1,
                        extractedTSX: content,
                        validatorResult: {
                            success: false,
                            diagnosticCount: errors.length,
                            codes: errors.map(function (e) { return e.code; })
                        }
                    });
                    fs.writeFileSync(attemptTracePath, JSON.stringify(attemptsData, null, 2));
                    // PHASE 3: Runtime validator path verification
                    var runtimeVerifPath = path.join(artifactsDir, 'runtime-validator-verification.json');
                    var runtimeVerifData = {
                        validatorFilePath: __filename,
                        compileGateFilePath: 'pending',
                        srcHash: require('crypto').createHash('md5').update(fs.readFileSync(__filename)).digest('hex'),
                        distHash: 'runtime',
                        buildTimestamp: new Date().toISOString()
                    };
                    fs.writeFileSync(runtimeVerifPath, JSON.stringify(runtimeVerifData, null, 2));
                    // PHASE 4: Capture runtime compiler options
                    var optionsPath = path.join(artifactsDir, 'runtime-compiler-options.json');
                    fs.writeFileSync(optionsPath, JSON.stringify({
                        CompilationValidator: {
                            jsx: compilerOptions.jsx,
                            target: compilerOptions.target,
                            module: compilerOptions.module,
                            moduleResolution: compilerOptions.moduleResolution
                        }
                    }, null, 2));
                }
            }
            catch (err) {
                console.error('Failed to write instrumentation artifacts:', err);
            }
            return {
                success: false,
                diagnostics: errors,
                errorCategory: 'COMPILATION_VALIDATION_FAILURE'
            };
        }
        return {
            success: true,
            diagnostics: []
        };
    };
    return CompilationValidator;
}());
exports.CompilationValidator = CompilationValidator;
