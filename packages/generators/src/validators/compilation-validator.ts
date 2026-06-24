import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

export interface CompilationValidationResult {
  success: boolean;
  diagnostics: ts.Diagnostic[];
  errorCategory?: string;
}

export class CompilationValidator {
  static validate(content: string, isTsx: boolean, targetDir?: string): CompilationValidationResult {
    try {
      const result = this._validateOriginal(content, isTsx, targetDir);
      this._logTrace('CompilationValidator', true, result, null, content);
      return result;
    } catch (err: any) {
      this._logTrace('CompilationValidator', false, null, err.message, content);
      throw err;
    }
  }

  private static _logTrace(validatorName: string, pass: boolean, returnValue: any, error: any, content: string) {
    try {
      const fs = require('fs');
      const path = require('path');
      const artifactsDir = 'c:/website-generator-core/website-generator-core/generation-artifacts';
      if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
      const tracePath = path.join(artifactsDir, 'compiler-gate-execution-trace.json');
      let traceData: any[] = [];
      if (fs.existsSync(tracePath)) {
        try { traceData = JSON.parse(fs.readFileSync(tracePath, 'utf8')); } catch(e){}
      }
      
      const success = returnValue ? (returnValue.success !== undefined ? returnValue.success : returnValue.isValid) : false;
      traceData.push({
        validatorName,
        pass: success,
        exactReturnValue: returnValue,
        exactThrownError: error
      });
      fs.writeFileSync(tracePath, JSON.stringify(traceData, null, 2));

      // PHASE 3: Capture Final Source
      const sourceTracePath = path.join(artifactsDir, 'compiler-input-trace.json');
      let sourceData: any[] = [];
      if (fs.existsSync(sourceTracePath)) {
        try { sourceData = JSON.parse(fs.readFileSync(sourceTracePath, 'utf8')); } catch(e){}
      }
      sourceData.push({
        validatorName,
        timestamp: new Date().toISOString(),
        finalCompilerInput: content
      });
      fs.writeFileSync(sourceTracePath, JSON.stringify(sourceData, null, 2));

    } catch (e) {
      console.error('Failed to write trace', e);
    }
  }

  static _validateOriginal(content: string, isTsx: boolean, targetDir?: string): CompilationValidationResult {
    const filename = isTsx ? 'temp.tsx' : 'temp.ts';
    
    let compilerOptions: ts.CompilerOptions = {};
    let configLoaded = false;
    let resolvedConfigPath: string | undefined;

    if (targetDir) {
      // Find the config file starting from targetDir
      const configPath = ts.findConfigFile(targetDir, ts.sys.fileExists, 'tsconfig.json');
      if (configPath) {
        // Rule 2: Never fall back to generators package tsconfig
        if (!configPath.includes('packages/generators')) {
          const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
          if (configFile.config) {
            const parsedConfig = ts.parseJsonConfigFileContent(
              configFile.config,
              ts.sys,
              require('path').dirname(configPath)
            );
            compilerOptions = { ...parsedConfig.options };
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
      const fs = require('fs');
      const path = require('path');
      const artifactsDir = 'c:/website-generator-core/website-generator-core/generation-artifacts';
      if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
      const tsconfigTracePath = path.join(artifactsDir, 'runtime-tsconfig-trace.json');
      let tsconfigData: any = {};
      if (fs.existsSync(tsconfigTracePath)) {
        try { tsconfigData = JSON.parse(fs.readFileSync(tsconfigTracePath, 'utf8')); } catch(e){}
      }
      tsconfigData['CompilationValidator'] = {
        tsconfigPathLoaded: resolvedConfigPath || 'none',
        compilerOptionsLoaded: compilerOptions,
        jsxMode: compilerOptions.jsx,
        moduleResolution: compilerOptions.moduleResolution,
        typesArray: compilerOptions.types
      };
      fs.writeFileSync(tsconfigTracePath, JSON.stringify(tsconfigData, null, 2));
    } catch (e) {
      console.error('Failed to write tsconfig trace', e);
    }

    // Create an in-memory compiler host
    const compilerHost = ts.createCompilerHost(compilerOptions);
    const originalGetSourceFile = compilerHost.getSourceFile;

    compilerHost.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
      if (fileName === filename) {
        return ts.createSourceFile(fileName, content, languageVersion, true);
      }
      return originalGetSourceFile.call(compilerHost, fileName, languageVersion, onError, shouldCreateNewSourceFile);
    };

    const program = ts.createProgram([filename], compilerOptions, compilerHost);
    
    // Get all diagnostics: syntax + semantic
    const allDiagnostics = ts.getPreEmitDiagnostics(program);

    // We consider it a failure if there are any Error level diagnostics, 
    // EXCEPT those related to missing modules or JSX intrinsics which we don't have in our in-memory host
    const ignoredCodes = [
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
      7006  // Parameter implicitly has an 'any' type (happens for DOM events without types)
    ];

    const errors = allDiagnostics.filter(d => 
      d.category === ts.DiagnosticCategory.Error && 
      !ignoredCodes.includes(d.code)
    );

    if (errors.length > 0) {
      // Detailed logging for diagnostics
      console.log(`[CompilationValidator] ${errors.length} Compilation Errors Found:`);
      errors.forEach(err => {
        const message = ts.flattenDiagnosticMessageText(err.messageText, '\n');
        if (err.file && err.start !== undefined) {
          const { line, character } = ts.getLineAndCharacterOfPosition(err.file, err.start);
          console.log(`  Line ${line + 1}:${character + 1} - ${message}`);
        } else {
          console.log(`  ${message}`);
        }
      });

      // Instrumentation for diagnostics
      try {
        const artifactsDir = 'c:/website-generator-core/website-generator-core/generation-artifacts';
        if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

        // PHASE 2: Instrument CompilationValidator
        const traceData = errors.map(err => {
          const message = ts.flattenDiagnosticMessageText(err.messageText, '\n');
          return {
            diagnosticCode: err.code,
            messageText: message,
            sourceFile: err.file ? err.file.fileName : 'unknown',
            compilerOptionsUsed: compilerOptions
          };
        });
        fs.writeFileSync(path.join(artifactsDir, 'compiler-diagnostic-trace.json'), JSON.stringify(traceData, null, 2));

        // PHASE 3: Verify runtime validator
        const runtimeVerif = {
          executingFilePath: __filename,
          buildTimestamp: new Date().toISOString(),
          jsxMode: compilerOptions.jsx,
          tsconfigSource: targetDir ? ts.findConfigFile(targetDir, ts.sys.fileExists, 'tsconfig.json') : 'default'
        };
        fs.writeFileSync(path.join(artifactsDir, 'compiler-runtime-verification.json'), JSON.stringify(runtimeVerif, null, 2));

        // PHASE 4: Classify failure
        let failureClass = 'Other';
        const msgs = errors.map(e => ts.flattenDiagnosticMessageText(e.messageText, '\\n')).join(' ');
        if (errors.some(e => e.code === 2686 || e.code === 2786) || msgs.includes('React refers to a UMD global') || msgs.includes('cannot be used as a JSX component')) {
          failureClass = 'React import issue';
        } else if (errors.some(e => e.category === ts.DiagnosticCategory.Error && e.code < 2000)) {
          failureClass = 'TS syntax error';
        } else if (errors.some(e => [2304, 2552, 2307, 7026, 2503].includes(e.code)) || msgs.includes('Cannot find name')) {
          failureClass = 'Missing type';
        } else if (errors.some(e => e.code === 2792)) {
          failureClass = 'Module resolution error';
        } else if (errors.some(e => e.code === 17004) || msgs.includes('JSX')) {
          failureClass = 'JSX configuration mismatch';
        } else if (errors.some(e => e.code === 2862 || e.code === 2875)) {
          failureClass = 'Import resolution failure';
        }
        
        fs.writeFileSync(path.join(artifactsDir, 'compiler-failure-classification.json'), JSON.stringify({ classification: failureClass }, null, 2));

        // PHASE 1, 2, 3, 4: Live Compiler Trace Instrumentation
        if (content.includes('CalculatorDisplay')) {
          const liveDiagPath = path.join(artifactsDir, 'live-compiler-diagnostics.json');
          let liveDiagData: any[] = [];
          try { if (fs.existsSync(liveDiagPath)) liveDiagData = JSON.parse(fs.readFileSync(liveDiagPath, 'utf8')); } catch(e){}

          errors.forEach(err => {
            const message = ts.flattenDiagnosticMessageText(err.messageText, '\n');
            let line = 0, character = 0;
            let snippet = '';
            if (err.file && err.start !== undefined) {
              const pos = ts.getLineAndCharacterOfPosition(err.file, err.start);
              line = pos.line + 1;
              character = pos.character + 1;
              const lines = content.split('\n');
              snippet = lines[pos.line] || '';
            }
            liveDiagData.push({
              source: 'CompilationValidator',
              diagnosticCode: err.code,
              diagnosticCategory: ts.DiagnosticCategory[err.category],
              diagnosticMessage: message,
              sourceFile: err.file ? err.file.fileName : 'unknown',
              line,
              column: character,
              sourceSnippet: snippet
            });
          });
          fs.writeFileSync(liveDiagPath, JSON.stringify(liveDiagData, null, 2));

          // PHASE 2: Attempt trace
          const attemptTracePath = path.join(artifactsDir, 'calculatordisplay-attempt-trace.json');
          let attemptsData: any[] = [];
          try { if (fs.existsSync(attemptTracePath)) attemptsData = JSON.parse(fs.readFileSync(attemptTracePath, 'utf8')); } catch(e){}
          
          attemptsData.push({
            attemptNumber: attemptsData.length + 1,
            extractedTSX: content,
            validatorResult: {
              success: false,
              diagnosticCount: errors.length,
              codes: errors.map(e => e.code)
            }
          });
          fs.writeFileSync(attemptTracePath, JSON.stringify(attemptsData, null, 2));

          // PHASE 3: Runtime validator path verification
          const runtimeVerifPath = path.join(artifactsDir, 'runtime-validator-verification.json');
          const runtimeVerifData = {
            validatorFilePath: __filename,
            compileGateFilePath: 'pending',
            srcHash: require('crypto').createHash('md5').update(fs.readFileSync(__filename)).digest('hex'),
            distHash: 'runtime',
            buildTimestamp: new Date().toISOString()
          };
          fs.writeFileSync(runtimeVerifPath, JSON.stringify(runtimeVerifData, null, 2));

          // PHASE 4: Capture runtime compiler options
          const optionsPath = path.join(artifactsDir, 'runtime-compiler-options.json');
          fs.writeFileSync(optionsPath, JSON.stringify({
            CompilationValidator: {
              jsx: compilerOptions.jsx,
              target: compilerOptions.target,
              module: compilerOptions.module,
              moduleResolution: compilerOptions.moduleResolution
            }
          }, null, 2));
        }
      } catch (err) {
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
  }
}
