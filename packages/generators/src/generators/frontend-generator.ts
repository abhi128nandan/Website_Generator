import { NormalizedRequirements, Logger, RecoverableGenerationError } from '@website-generator/shared';
import fs from 'fs/promises';
import path from 'path';
import { FrontendAIAnalyzer } from './frontend-ai-analyzer';
import { ProviderFactory } from '@website-generator/ai-engine';
import { exec } from 'child_process';
import util from 'util';
import { ASTValidator } from '../validators/ast-validator';
import { ReactStructureValidator } from '../validators/react-structure-validator';
import { PlaceholderValidator } from '../validators/placeholder-validator';
import { ImportIntegrityValidator } from '../validators/import-integrity-validator';
import { RepairAgent } from '../agents/repair-agent';
import { OutputSanitizer } from '../validators/output-sanitizer';
import { CodeExtractor } from '../validators/code-extractor';
import { CodeValidityGate } from '../validators/code-validity-gate';
import { LucideIconValidator } from '../validators/lucide-icon-validator';
import { NonCodeDetector } from '../validation/non-code-detector';
import { ArtifactIntegrityValidator } from '../validators/artifact-integrity-validator';
import { PipelineTracer } from '../observability/pipeline-tracer';
import { SyntaxGate } from '../validators/syntax-gate';
import { SystemScaffold } from '../scaffold/system-scaffold';
import { CompileGate } from '../validators/compile-gate';
import { RequestQueue } from '@website-generator/ai-engine';
import { MetricsTracker } from '../observability/metrics-tracker';
import { CompilationValidator } from '../validators/compilation-validator';
import { ValidationRegressionGuard } from '../validators/validation-regression-guard';
import { FrontendComplexityGuard } from '../validators/frontend-complexity-guard';
import { CodePresenceGate } from '../validators/code-presence-gate';
import { TruncationGate } from '../validators/truncation-gate';
import { ReasoningLeakGate } from '../validators/reasoning-leak-gate';

const execPromise = util.promisify(exec);
/**
 * Generates a frontend-only React/Vite application.
 *
 * Does NOT generate:
 * - backend/ directory
 * - database/ directory
 * - Prisma schemas
 * - CRUD tables/forms
 * - Admin dashboard layout
 *
 * Generates:
 * - Root workspace (frontend-only)
 * - React/Vite app with Tailwind
 * - AI-determined components, services, hooks, pages
 * - Responsive layout
 * - API integration stubs
 */
export class FrontendAppGenerator {
  static async generate(
    reqs: NormalizedRequirements,
    targetDir: string,
    onLog: (step: number, message: string) => void
  ): Promise<void> {

    // === STEP 1: AI Architecture Analysis ===
    onLog(3, '[frontend-generator] Executing AI frontend architecture analysis...');
    
    try {
      const artifactsDir = path.join(targetDir, 'generation-artifacts');
      await fs.mkdir(artifactsDir, { recursive: true });
      
      const reqsSummaryPath = path.join(artifactsDir, 'requirements-summary.json');
      let oldReqsStr = null;
      try { oldReqsStr = await fs.readFile(reqsSummaryPath, 'utf-8'); } catch(e) {}
      
      await fs.writeFile(reqsSummaryPath, JSON.stringify(reqs, null, 2), 'utf-8');
      
      const archPath = path.join(artifactsDir, 'architecture-final.json');
      if (await fs.stat(archPath).catch(() => false)) {
        let isValid = true;
        let cachedArch: any = null;
        try {
          cachedArch = JSON.parse(await fs.readFile(archPath, 'utf-8'));
          
          const { FrontendArchitectureSchema } = require('@website-generator/shared');
          FrontendArchitectureSchema.parse(cachedArch);
          
          const { FrontendComplexityGuard } = require('../validators/frontend-complexity-guard');
          await FrontendComplexityGuard.validate({ ...reqs, frontendArchitecture: cachedArch }, targetDir);
          
          if (oldReqsStr) {
            const crypto = require('crypto');
            const oldHash = crypto.createHash('md5').update(oldReqsStr).digest('hex');
            const newHash = crypto.createHash('md5').update(JSON.stringify(reqs, null, 2)).digest('hex');
            if (oldHash !== newHash) {
              isValid = false;
            }
          }
        } catch (e) {
          isValid = false;
        }

        if (isValid) {
          onLog(3, '[frontend-generator] Found existing architecture. Reusing instead of regenerating...');
          reqs.frontendArchitecture = cachedArch;
        } else {
          onLog(3, '[frontend-generator] Invalid cached architecture. Discarding and regenerating...');
          await fs.unlink(archPath).catch(() => {});
        }
      }
    } catch(e) {}

    if (!reqs.frontendArchitecture) {
      (reqs as any).__targetDir = targetDir;
      await FrontendAIAnalyzer.analyze(reqs);
    }

    const arch = reqs.frontendArchitecture!;
    
    // PHASE 3: Frontend Complexity Guard
    await FrontendComplexityGuard.validate(reqs, targetDir);

    try {
      const artifactsDir = path.join(targetDir, 'generation-artifacts');
      await fs.writeFile(path.join(artifactsDir, 'architecture-audit.json'), JSON.stringify(arch, null, 2), 'utf-8');
      
      const reqFeaturesLower = reqs.features.join(' ').toLowerCase();
      const hasAuthFeature = reqFeaturesLower.includes('auth') || reqFeaturesLower.includes('login') || reqFeaturesLower.includes('signup');
      const hasAuthService = arch.services.some(s => s.name.toLowerCase().includes('auth'));
      if (hasAuthService && !hasAuthFeature) {
        onLog(4, '[ARCHITECTURE WARNING] Discovered an authService but authentication was not explicitly requested in features.');
      }
    } catch(e) {}

    onLog(3, `[frontend-generator] Architecture: ${arch.components.length} components, ${arch.services.length} services, ${arch.hooks.length} hooks, ${arch.pages.length} pages`);

    // === STEP 2: Root workspace (frontend-only) ===
    onLog(3, '[frontend-generator] Writing root workspace files (frontend-only mode)...');
    await this.generateRootWorkspace(targetDir, reqs);

    // === STEP 3: Frontend package ===
    const frontendDir = path.join(targetDir, 'frontend');
    onLog(4, '[frontend-generator] Writing frontend package...');
    await this.generateFrontendPackage(frontendDir, reqs, onLog);

    // === STEP 4: Validate ===
    onLog(5, '[frontend-generator] Validating generated structure...');
    const requiredFiles = [
      'frontend/package.json',
      'frontend/vite.config.ts',
      'frontend/index.html',
    ];

    const missing: string[] = [];
    for (const file of requiredFiles) {
      try {
        await fs.access(path.join(targetDir, file));
      } catch {
        missing.push(file);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Frontend scaffold validation failed. Missing files: ${missing.join(', ')}`);
    }
    onLog(5, '[frontend-generator] All frontend files validated.');

    // === STEP 4.5: Generate Manifest ===
    onLog(5, 'Creating generated-manifest.json...');
    const manifest = {
      pages: arch.pages?.map(p => p.componentName) || [],
      components: arch.components?.map(c => c.name) || [],
      hooks: arch.hooks?.map(h => h.name) || [],
      services: arch.services?.map(s => s.name) || [],
      routes: arch.pages?.map(p => p.route) || [],
      prismaModels: []
    };
    await fs.writeFile(path.join(targetDir, 'generated-manifest.json'), JSON.stringify(manifest, null, 2));

    // === STEP 5: Validation and Repair Loop ===
    onLog(5, 'Starting validation and repair loop...');
    let buildPassed = false;
    let repairAttempts = 0;
    const maxRepairAttempts = 3;
    let previousErrorCount = Infinity;

    while (!buildPassed && repairAttempts <= maxRepairAttempts) {
      // --- AST Validation ---
      onLog(5, '[VALIDATION] AST Validation Started');
      const astRes = await ASTValidator.validate(targetDir);
      if (astRes.isValid) {
        onLog(5, '[VALIDATION] AST Validation Passed');
      } else {
        const rootError = astRes.errors[0];
        onLog(5, `Root Cause:\n${rootError.file}\n${rootError.message}\nLine ${rootError.line}`);
        await this.recordRootCause(targetDir, path.basename(rootError.file), repairAttempts + 1, 'ASTValidator', 'AST_ERROR', rootError.message, rootError.line || 1);
      }

      // --- React Structure Validation ---
      onLog(5, '[VALIDATION] React Structure Validation Started');
      const reactRes = await ReactStructureValidator.validate(targetDir);
      if (reactRes.isValid) {
        onLog(5, '[VALIDATION] React Structure Validation Passed');
      } else {
        onLog(5, `[VALIDATION] React Structure Validation Failed: ${reactRes.errors.join(', ')}`);
      }

      // --- Placeholder Detection Validation ---
      onLog(5, '[VALIDATION] Placeholder Detection Started');
      const placeholderRes = await PlaceholderValidator.validate(targetDir);
      if (placeholderRes.isValid) {
        onLog(5, '[VALIDATION] Placeholder Detection Passed');
      } else {
        onLog(5, `[VALIDATION] Placeholder Detection Failed: ${placeholderRes.errors.join(', ')}`);
      }
      
      const allErrors = [...astRes.errors, ...reactRes.errors, ...placeholderRes.errors];
      
      let buildOutput = '';
      let buildError = null;
      if (allErrors.length === 0) {
        // Run pnpm build
        onLog(5, '[VALIDATION] Build Validation Started');
        onLog(5, '[VALIDATION] pnpm install --no-frozen-lockfile');
        try {
          await execPromise('pnpm install --no-frozen-lockfile', { cwd: frontendDir });
          onLog(5, '[VALIDATION] pnpm build');
          const { stdout } = await execPromise('pnpm build', { cwd: frontendDir });
          buildOutput = stdout;
          buildPassed = true; // Build passed!
          onLog(5, '[VALIDATION] Build Passed');
          onLog(5, '[VALIDATION] Exit Code: 0');
        } catch (e: any) {
          buildError = e.stdout + '\n' + e.stderr + '\n' + e.message;
          allErrors.push(buildError);
          onLog(5, '[VALIDATION] Build Failed');
        }
      }

      if (!buildPassed) {
        if (repairAttempts >= maxRepairAttempts) {
          onLog(5, `[VALIDATION] Validation/Build failed after ${maxRepairAttempts} repair attempts.`);
          const formattedErrors = allErrors.slice(0, 10).map((e: any) => typeof e === 'string' ? e : `[${e.file}] ${e.message}`);
          throw new RecoverableGenerationError(formattedErrors);
        }

        // Error regression check: if errors increased after repair, note it
        if (repairAttempts > 0 && allErrors.length > previousErrorCount) {
          onLog(5, `[VALIDATION] WARNING: Error count increased from ${previousErrorCount} to ${allErrors.length} after repair. Repair may have introduced new issues.`);
        }
        previousErrorCount = allErrors.length;
        
        onLog(5, `[VALIDATION] Found ${allErrors.length} errors. Invoking RepairAgent...`);
        onLog(5, `[VALIDATION] Repair Attempt ${repairAttempts + 1} Started`);
        const repaired = await RepairAgent.repair(targetDir, allErrors);
        onLog(5, `[VALIDATION] Repair Attempt ${repairAttempts + 1} Completed`);
        if (repaired) {
          onLog(5, `[VALIDATION] RepairAgent completed successfully.`);
        } else {
          onLog(5, `[VALIDATION] RepairAgent could not identify specific files to repair.`);
        }
      }

      repairAttempts++;
    }

    if (!buildPassed) {
      throw new RecoverableGenerationError(['Validation failed after max repair attempts and the loop exited without success.']);
    }
    onLog(5, '[VALIDATION] All validation checks passed. Build successful!');
    await MetricsTracker.incrementMetric('successfulGenerations');

    // === STEP 5: Metadata ===
    onLog(5, '[frontend-generator] Updating project metadata...');
    try {
      const metadataPath = path.join(targetDir, 'metadata.json');
      const existingMeta = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      const updatedMeta = {
        ...existingMeta,
        ...reqs,
        classifiedMode: 'frontend-app',
        updatedAt: new Date().toISOString(),
        generatorVersion: '2.0.0',
        generatorMode: 'frontend-app',
        workspaceIntegrity: true,
      };
      await fs.writeFile(metadataPath, JSON.stringify(updatedMeta, null, 2), 'utf-8');
    } catch (e) {
      onLog(5, '[WARN] Failed to merge metadata.json');
    }

    const generatedFiles = {
      files: [
        'package.json',
        'pnpm-workspace.yaml',
        '.npmrc',
        '.gitignore',
        '.env.example',
        'README.md',
        'metadata.json',
        'generated-files.json',
        'frontend/',
      ],
    };
    await fs.writeFile(
      path.join(targetDir, 'generated-files.json'),
      JSON.stringify(generatedFiles, null, 2),
      'utf-8'
    );

    onLog(6, `[frontend-generator] Final scaffold file count: ${generatedFiles.files.length}`);
    onLog(6, `[frontend-generator] Project tree:\n${path.basename(targetDir)}/\n├── package.json\n├── pnpm-workspace.yaml\n└── frontend/\n    ├── src/\n    │   ├── components/\n    │   ├── services/\n    │   ├── hooks/\n    │   └── pages/\n    └── index.html`);
    onLog(6, '[frontend-generator] Finalizing project...');
    
    // === Write Generation Summary ===
    try {
      const artifactsDir = path.join(targetDir, 'generation-artifacts');
      const gateReportPath = path.join(artifactsDir, 'gate-report.json');
      let gateFailures = 0;
      try { gateFailures = JSON.parse(await fs.readFile(gateReportPath, 'utf-8')).length; } catch(e) {}
      
      const provider = ProviderFactory.getProvider();
      const summary = {
        provider: provider?.constructor?.name?.replace('Provider', '')?.toLowerCase() ?? 'unknown',
        model: provider?.getModel?.() ?? 'unknown',
        components: arch.components?.length || 0,
        hooks: arch.hooks?.length || 0,
        services: arch.services?.length || 0,
        gateFailures
      };
      await fs.writeFile(path.join(artifactsDir, 'generation-summary.json'), JSON.stringify(summary, null, 2), 'utf-8');
    } catch(e) {}
  }

  // ─────────────────────────────────────────────
  // Root workspace — frontend-only variant
  // ─────────────────────────────────────────────

  private static async generateRootWorkspace(targetDir: string, reqs: NormalizedRequirements): Promise<void> {
    await fs.mkdir(targetDir, { recursive: true });

    const slug = reqs.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'generated-app';

    // Root package.json — NO backend/database references
    const rootPackageJson = {
      name: slug,
      private: true,
      version: '0.0.0',
      workspaces: ['frontend'],
      scripts: {
        dev: 'pnpm --dir frontend dev',
        build: 'pnpm -r build',
      },
      devDependencies: {
        concurrently: '^9.0.0',
        typescript: '^5.5.3',
      },
    };
    await fs.writeFile(path.join(targetDir, 'package.json'), JSON.stringify(rootPackageJson, null, 2), 'utf-8');

    // pnpm-workspace — frontend only
    const pnpmWorkspace = ['packages:', '  - frontend', ''].join('\n');
    await fs.writeFile(path.join(targetDir, 'pnpm-workspace.yaml'), pnpmWorkspace, 'utf-8');

    // .npmrc
    const npmrc = ['auto-install-peers=true', 'strict-peer-dependencies=false', ''].join('\n');
    await fs.writeFile(path.join(targetDir, '.npmrc'), npmrc, 'utf-8');

    // .gitignore
    const gitignore = ['node_modules', 'dist', '.env', '.next', 'coverage', ''].join('\n');
    await fs.writeFile(path.join(targetDir, '.gitignore'), gitignore, 'utf-8');

    // .env.example — no DATABASE_URL
    const envExample = ['VITE_API_URL=', ''].join('\n');
    await fs.writeFile(path.join(targetDir, '.env.example'), envExample, 'utf-8');
    await fs.writeFile(path.join(targetDir, '.env'), envExample, 'utf-8');

    // README.md
    const readme = `# ${reqs.appName}
Type: ${reqs.appType}
Mode: Frontend Application (No Backend/Database)

## Features
${reqs.features.map(f => `- ${f}`).join('\n')}

## Architecture
This is a **frontend-only** React/Vite application.
No backend server or database is required.

## Prerequisites
- Node.js >= 18
- pnpm >= 9

## Getting Started

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Start development server
pnpm run dev
\`\`\`

## Services
| Service  | Port | Command |
|----------|------|---------|
| Frontend | 5173 | \`pnpm --dir frontend dev\` |
`;
    await fs.writeFile(path.join(targetDir, 'README.md'), readme, 'utf-8');
  }

  // ─────────────────────────────────────────────
  // Frontend package
  // ─────────────────────────────────────────────

  private static extractCodeBlock(text: string): string {
    const match = text.match(/```[a-z]*\n([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  }

  private static async generateValidCode(
    provider: any, 
    prompt: string, 
    isTsx: boolean, 
    artifactName: string, 
    targetDir: string, 
    onLog: (level: number, msg: string) => void
  ): Promise<string> {
    let attempts = 0;
    const maxRetries = 3;
    let lastContent = '';
    let lastErrorMessage = '';
    
    const artifactsDir = path.join(targetDir, 'generation-artifacts');
    await fs.mkdir(artifactsDir, { recursive: true });
    
    try {
      const finalPromptPath = path.join(artifactsDir, 'final-prompt.json');
      let promptData: any[] = [];
      try { promptData = JSON.parse(await fs.readFile(finalPromptPath, 'utf-8')); } catch(e) {}
      promptData = promptData.filter((d: any) => d.artifact !== artifactName);
      promptData.push({ artifact: artifactName, prompt: prompt });
      await fs.writeFile(finalPromptPath, JSON.stringify(promptData, null, 2), 'utf-8');
    } catch(e) {}
    
    while (attempts < maxRetries) {
      attempts++;
      let currentPrompt = prompt;
      
      let pipelineIntegrity = {
        artifact: artifactName,
        attempt: attempts,
        rawOutputValid: false,
        sanitizerPassed: false,
        extractorPassed: false,
        structurePassed: false,
        syntaxPassed: false,
        compilePassed: false
      };

      if (attempts > 1) {
        if (lastContent && lastContent.length > 50) {
          currentPrompt = `${prompt}\n\nHere is your previous attempt which failed validation:\n\`\`\`tsx\n${lastContent}\n\`\`\`\n\nIt failed with this error:\n${lastErrorMessage}\n\nCRITICAL FIX REQUIRED: Fix ONLY this exact error. Do NOT rewrite the entire component. Do NOT add new features. Do NOT change the layout or logic unless directly related to the error. Return the FULL updated file, but KEEP your changes strictly limited to the repair.\n\nRETURN ONLY COMPLETE TYPESCRIPT/TSX SOURCE CODE.`;
        } else {
          currentPrompt += `\n\nRETURN ONLY COMPLETE TYPESCRIPT/TSX SOURCE CODE.\nDO NOT EXPLAIN.\nDO NOT REASON.\nDO NOT DESCRIBE.\nDO NOT USE NATURAL LANGUAGE.\nDO NOT STOP MID-FILE.\nRETURN THE FULL FILE FROM FIRST LINE TO LAST LINE.\n`;
          if (lastErrorMessage) {
            if (lastErrorMessage.includes('COMPONENT_TOO_LARGE')) {
              currentPrompt += `\n\nCRITICAL FIX REQUIRED: The previous attempt failed because the component was too large. YOU MUST extract child components and avoid monolithic 'God Objects'. Do not inline all JSX and state. You MUST import and compose your sibling components based on the architecture manifest.\n`;
            } else if (lastErrorMessage.includes('COMPILE_ERROR')) {
              currentPrompt += `\n\nCRITICAL FIX REQUIRED: The previous attempt failed compilation with the following error:\n${lastErrorMessage}\nPlease fix the TypeScript errors in your next response.\n`;
            } else {
              currentPrompt += `\n\nCRITICAL FIX REQUIRED: The previous attempt failed with the following error:\n${lastErrorMessage}\nPlease fix this error in your next response.\n`;
            }
          }
        }
        
        try {
          const cascadeTracePath = path.join(artifactsDir, 'retry-cascade-trace.json');
          let cascadeTrace: any[] = [];
          try { cascadeTrace = JSON.parse(await fs.readFile(cascadeTracePath, 'utf-8')); } catch(e) {}
          cascadeTrace.push({
            artifact: artifactName,
            attempt: attempts,
            previousFailureReason: lastErrorMessage,
            retryPromptLength: currentPrompt.length,
            lastContentSize: lastContent ? lastContent.length : 0,
            timestamp: new Date().toISOString()
          });
          await fs.writeFile(cascadeTracePath, JSON.stringify(cascadeTrace, null, 2), 'utf-8');
        } catch(e) {}
      }
      const aiResponse = await this.generateTextWithRetry(provider, currentPrompt);
      
      let trace: any = null;
      try {
        trace = await PipelineTracer.initializeTrace(targetDir, artifactName, provider.id || 'unknown', provider.model || 'unknown');
        await PipelineTracer.recordRaw(targetDir, trace, aiResponse);
      } catch(e) {}

      try {
        const rawOutputDir = path.join(artifactsDir, 'raw-output');
        await fs.mkdir(rawOutputDir, { recursive: true });
        const aiResponsePath = path.join(rawOutputDir, `${artifactName}.attempt${attempts}.txt`);
        await fs.writeFile(aiResponsePath, aiResponse, 'utf-8');

        // PHASE 1: PIPELINE TRACE
        const traceDir = path.join(artifactsDir, 'pipeline-trace');
        await fs.mkdir(traceDir, { recursive: true });
        await fs.writeFile(path.join(traceDir, `${artifactName.toLowerCase()}.raw.txt`), aiResponse, 'utf-8');
      } catch(e) {}
      
      // [PIPELINE] output sanitizer
      onLog(4, '[PIPELINE]\nOutputSanitizer executed');
      let sanitizedResult = OutputSanitizer.sanitizeWithDiagnostics(aiResponse);
      let code = sanitizedResult.code;
      if (!code) {
        code = this.extractCodeBlock(aiResponse);
        sanitizedResult = OutputSanitizer.sanitizeWithDiagnostics(code);
        code = sanitizedResult.code;
      }
      
      try {
        if (trace) await PipelineTracer.recordSanitized(targetDir, trace, code);
      } catch(e) {}

      try {
        const pipelinePath = path.join(artifactsDir, 'pipeline-order.json');
        let order: string[] = [];
        try { order = JSON.parse(await fs.readFile(pipelinePath, 'utf-8')); } catch(e) {}
        order.push(`[Attempt ${attempts}] OutputSanitizer executed`);
        await fs.writeFile(pipelinePath, JSON.stringify(order, null, 2), 'utf-8');
      } catch(e) {}

      try {
        const sanitizedOutputDir = path.join(artifactsDir, 'sanitized-output');
        await fs.mkdir(sanitizedOutputDir, { recursive: true });
        const sanitizedResponsePath = path.join(sanitizedOutputDir, `${artifactName}.attempt${attempts}.txt`);
        await fs.writeFile(sanitizedResponsePath, code, 'utf-8');

        // PHASE 1: PIPELINE TRACE
        const traceDir = path.join(artifactsDir, 'pipeline-trace');
        await fs.writeFile(path.join(traceDir, `${artifactName.toLowerCase()}.sanitized.txt`), code, 'utf-8');
      } catch(e) {}

      try {
        const reportPath = path.join(artifactsDir, 'output-sanitizer-audit.json');
        let reports: any[] = [];
        try { reports = JSON.parse(await fs.readFile(reportPath, 'utf-8')); } catch(e) {}
        reports.push({
          artifact: artifactName,
          attempt: attempts,
          removedTokens: sanitizedResult.diagnostics.removedThinkBlocks,
          remainingReasoningIndicators: sanitizedResult.diagnostics.remainingReasoningIndicators,
          success: sanitizedResult.diagnostics.success,
          timestamp: new Date().toISOString()
        });
        await fs.writeFile(reportPath, JSON.stringify(reports, null, 2), 'utf-8');
      } catch(e) {}
      
      if (!sanitizedResult.diagnostics.success) {
        try {
          const first20Raw = aiResponse.split('\n').slice(0, 20).join('\n');
          const first20Sanitized = code.split('\n').slice(0, 20).join('\n');
          const reportPath = path.join(process.cwd(), 'generation-artifacts', 'rejection-report.json');
          let reportData: any[] = [];
          const fsSync = require('fs');
          if (fsSync.existsSync(reportPath)) {
            try { reportData = JSON.parse(fsSync.readFileSync(reportPath, 'utf8')); } catch(e){}
          }
          reportData.push({
            artifact: artifactName,
            rawOutputFirst20: first20Raw,
            sanitizedOutputFirst20: first20Sanitized,
            rejectionRule: "OutputSanitizer: " + JSON.stringify(sanitizedResult.diagnostics.remainingReasoningIndicators)
          });
          fsSync.mkdirSync(path.dirname(reportPath), { recursive: true });
          fsSync.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf8');
        } catch(e) {}
        
        try {
          const debugPath = path.join(artifactsDir, 'pipeline-debug.json');
          let debugData: any[] = [];
          try { debugData = JSON.parse(await fs.readFile(debugPath, 'utf-8')); } catch(e) {}
          debugData.push({
            componentName: artifactName,
            rawOutput: aiResponse,
            sanitizedOutput: code,
            extractedCode: null,
            failureCategory: "OUTPUT_SANITIZER_FAILURE",
            validatorResults: {
              artifactIntegrity: null,
              compilation: null
            },
            timestamp: new Date().toISOString()
          });
          await fs.writeFile(debugPath, JSON.stringify(debugData, null, 2), 'utf-8');
        } catch(e) {}
        
        try {
          const debugPath = path.join(artifactsDir, 'reasoning-failure-debug.json');
          let debugData: any[] = [];
          try { debugData = JSON.parse(await fs.readFile(debugPath, 'utf-8')); } catch(e) {}
          debugData.push({
            componentName: artifactName,
            rawOutput: aiResponse,
            sanitizedOutput: code,
            extractedCode: null,
            integrityValidatorResult: null,
            compilationValidatorResult: null,
            exactFailureStage: "OutputSanitizer"
          });
          await fs.writeFile(debugPath, JSON.stringify(debugData, null, 2), 'utf-8');
        } catch(e) {}
        
        throw new Error("OUTPUT_SANITIZER_FAILURE");
      }
      
      pipelineIntegrity.rawOutputValid = true;
      pipelineIntegrity.sanitizerPassed = true;
      
      onLog(4, '[PIPELINE]\nCodeExtractor executed');
      let extractedCode = code;
      let diagnosticIntegrityResult: any = null;
      let diagnosticCompilationResult: any = null;
      try {
        const pipelinePath = path.join(artifactsDir, 'pipeline-order.json');
        let order: string[] = [];
        try { order = JSON.parse(await fs.readFile(pipelinePath, 'utf-8')); } catch(e) {}
        order.push(`[Attempt ${attempts}] CodeExtractor executed`);
        await fs.writeFile(pipelinePath, JSON.stringify(order, null, 2), 'utf-8');
      } catch(e) {}
      
      try {
        const extracted = CodeExtractor.extractCodeArtifact(code, isTsx, artifactName, true);
        
        try {
          const reportPath = path.join(artifactsDir, 'code-extractor-audit.json');
          let reports: any[] = [];
          try { reports = JSON.parse(await fs.readFile(reportPath, 'utf-8')); } catch(e) {}
          reports.push({
            artifact: artifactName,
            attempt: attempts,
            success: extracted.success,
            astErrors: extracted.astErrors || [],
            reason: extracted.reason,
            timestamp: new Date().toISOString()
          });
          await fs.writeFile(reportPath, JSON.stringify(reports, null, 2), 'utf-8');
        } catch(e) {}

        if (!extracted.success) {
          if (extracted.reason?.startsWith('INCOMPLETE_ARTIFACT')) {
            throw new Error(extracted.reason);
          }
          throw new Error(extracted.reason || "INVALID_CODE_ARTIFACT");
        }
        extractedCode = extracted.code;
        
        const presenceGate = CodePresenceGate.validate(extractedCode);
        if (!presenceGate.isValid) {
          throw new Error(presenceGate.reason || "INVALID_TYPESCRIPT_ARTIFACT");
        }

        const truncationGate = TruncationGate.validate(extractedCode);
        if (!truncationGate.isValid) {
          throw new Error(truncationGate.reason || "TRUNCATED_ARTIFACT");
        }

        const iconValidation = LucideIconValidator.validate(extractedCode);
        if (!iconValidation.isValid) {
          throw new Error(iconValidation.reason || "INVALID_LUCIDE_ICON");
        }
        
        try {
          if (trace) await PipelineTracer.recordExtracted(targetDir, trace, extractedCode, code);
          PipelineTracer.runCorruptionDetector(extractedCode);
        } catch(e: any) {
          throw new Error(e.message);
        }

        const integrityResult = ArtifactIntegrityValidator.validate(extractedCode, artifactName, isTsx);
        diagnosticIntegrityResult = integrityResult;
        if (!integrityResult.valid) {
          onLog(4, `[ARTIFACT INTEGRITY FAILURE]\nArtifact: ${artifactName}\nReason: ${integrityResult.reason}\nPreview: ${integrityResult.preview}`);
          if (integrityResult.reason?.startsWith('INCOMPLETE_ARTIFACT')) {
            throw new Error("INCOMPLETE_ARTIFACT: " + integrityResult.reason);
          } else {
            try {
              const first20Raw = aiResponse.split('\n').slice(0, 20).join('\n');
              const first20Sanitized = extractedCode.split('\n').slice(0, 20).join('\n');
              const reportPath = path.join(process.cwd(), 'generation-artifacts', 'rejection-report.json');
              let reportData: any[] = [];
              const fsSync = require('fs');
              if (fsSync.existsSync(reportPath)) {
                try { reportData = JSON.parse(fsSync.readFileSync(reportPath, 'utf8')); } catch(e){}
              }
              reportData.push({
                artifact: artifactName,
                rawOutputFirst20: first20Raw,
                sanitizedOutputFirst20: first20Sanitized,
                rejectionRule: "ArtifactIntegrityValidator: " + integrityResult.reason
              });
              fsSync.mkdirSync(path.dirname(reportPath), { recursive: true });
              fsSync.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf8');
            } catch(e) {}
            throw new Error("ARTIFACT_INTEGRITY_FAILURE: " + integrityResult.reason);
          }
        }

        const compilationResult = CompilationValidator.validate(extractedCode, isTsx, targetDir);
        diagnosticCompilationResult = compilationResult;
        if (!compilationResult.success) {
          throw new Error("COMPILATION_VALIDATION_FAILURE");
        }

        const nonCodeResult = NonCodeDetector.validate(extractedCode);
        if (!nonCodeResult.valid) {
          throw new Error(nonCodeResult.reason);
        }

        const reasoningLeakGate = ReasoningLeakGate.validate(extractedCode);
        if (!reasoningLeakGate.isValid) {
          throw new Error("REASONING_LEAK: " + (reasoningLeakGate.reason || "Reasoning leak detected"));
        }

        const syntaxGate = SyntaxGate.validate(extractedCode, isTsx);
        if (!syntaxGate.isValid) {
          throw new Error("SYNTAX_ERROR: " + (syntaxGate.error || "Syntax parsing failed"));
        }

        const compileGate = CompileGate.validate(extractedCode, isTsx, artifactName, artifactsDir);
        if (!compileGate.isValid) {
          throw new Error("COMPILE_ERROR: " + (compileGate.error || "Compilation failed"));
        }

        const { BusinessLogicAudit } = require('./business-logic-audit');
        if (isTsx) {
          BusinessLogicAudit.auditFrontend(extractedCode, []);
        }
        
        const { PlaceholderBusinessLogicValidator } = require('../validators/placeholder-validator');
        PlaceholderBusinessLogicValidator.audit(extractedCode);
      } catch (err: any) {
        onLog(4, `[GENERATION]\nArtifact: ${artifactName}\nAttempt: ${attempts}\n\nCodeValidation:\nFAILED\n\nReason:\n${err.message}`);
        
        // Automatic RootCauseRecorder
        let failureStage = 'CodeValidation';
        if (err.message.includes('REASONING_DETECTED')) failureStage = 'CodePresenceGate';
        else if (err.message.includes('TRUNCATED_ARTIFACT')) failureStage = 'TruncationGate';
        else if (err.message.includes('AST_ERROR')) failureStage = 'CodeExtractor';
        else if (err.message.includes('INVALID_REASONING_ARTIFACT')) failureStage = 'CodeExtractor';
        else if (err.message.includes('Contains reasoning phrase') || err.message.includes('English sentences')) failureStage = 'ArtifactIntegrityValidator';
        else if (err.message.includes('REASONING_LEAK')) failureStage = 'ReasoningLeakGate';
        else if (err.message.includes('SYNTAX_ERROR')) failureStage = 'SyntaxGate';
        else if (err.message.includes('COMPILE_ERROR')) failureStage = 'CompileGate';


        const rootCauseReportPath = path.join(artifactsDir, 'root-cause-analysis.json');
        let rcrData: any[] = [];
        try { rcrData = JSON.parse(await fs.readFile(rootCauseReportPath, 'utf-8')); } catch(e) {}
        rcrData.push({
          artifact: artifactName,
          failureStage: failureStage,
          errorMessage: err.message,
          rawStartsWith: aiResponse.slice(0, 50).replace(/\n/g, '\\n'),
          sanitizedStartsWith: (code || '').slice(0, 50).replace(/\n/g, '\\n'),
          extractedStartsWith: (extractedCode || '').slice(0, 50).replace(/\n/g, '\\n'),
          reasoningDetected: err.message.includes('REASONING'),
          truncationDetected: err.message.includes('TRUNCATED'),
          timestamp: new Date().toISOString()
        });
        await fs.writeFile(rootCauseReportPath, JSON.stringify(rcrData, null, 2), 'utf-8');

        try { await PipelineTracer.updateHealth(targetDir, 'corruption'); } catch(e){}
        
        if (err.message.includes('REASONING') || err.message.includes('OUTPUT_SANITIZER_FAILURE') || err.message.includes('reasoning phrase') || err.message.includes('English sentences')) {
          try {
            const debugPath = path.join(artifactsDir, 'reasoning-failure-debug.json');
            let debugData: any[] = [];
            try { debugData = JSON.parse(await fs.readFile(debugPath, 'utf-8')); } catch(e) {}
            debugData.push({
              componentName: artifactName,
              rawOutput: aiResponse,
              sanitizedOutput: code,
              extractedCode: extractedCode || null,
              integrityValidatorResult: diagnosticIntegrityResult || null,
              compilationValidatorResult: diagnosticCompilationResult || null,
              exactFailureStage: failureStage
            });
            await fs.writeFile(debugPath, JSON.stringify(debugData, null, 2), 'utf-8');
          } catch(e) {}
        }
        
        // DIAGNOSTIC LOGGING FOR EVERY FAILURE
        try {
          await fs.writeFile(path.join(artifactsDir, 'raw-output.txt'), aiResponse, 'utf-8');
          await fs.writeFile(path.join(artifactsDir, 'sanitized-output.txt'), code, 'utf-8');
          await fs.writeFile(path.join(artifactsDir, 'extracted-output.txt'), extractedCode, 'utf-8');
          
          const debugPath = path.join(artifactsDir, 'pipeline-debug.json');
          let debugData: any[] = [];
          try { debugData = JSON.parse(await fs.readFile(debugPath, 'utf-8')); } catch(e) {}
          debugData.push({
            componentName: artifactName,
            rawOutput: aiResponse,
            sanitizedOutput: code,
            extractedCode: extractedCode,
            failureCategory: err.message,
            validatorResults: {
              artifactIntegrity: diagnosticIntegrityResult,
              compilation: diagnosticCompilationResult
            },
            timestamp: new Date().toISOString()
          });
          await fs.writeFile(debugPath, JSON.stringify(debugData, null, 2), 'utf-8');
        } catch(e) {}
        
        lastErrorMessage = err.message;
        continue;
      }
      
      try {
        const extractedOutputDir = path.join(artifactsDir, 'extracted-output');
        await fs.mkdir(extractedOutputDir, { recursive: true });
        const extractedResponsePath = path.join(extractedOutputDir, `${artifactName}.attempt${attempts}.tsx`);
        await fs.writeFile(extractedResponsePath, extractedCode, 'utf-8');

        // PHASE 1: PIPELINE TRACE
        const traceDir = path.join(artifactsDir, 'pipeline-trace');
        await fs.writeFile(path.join(traceDir, `${artifactName.toLowerCase()}.extracted.txt`), extractedCode, 'utf-8');
      } catch(e) {}
      
      code = extractedCode;
      
      lastContent = code;
      
      // Duplicate pipeline logic removed in favor of unified try/catch block upstream.
      
      // PHASE 1: PIPELINE TRACE
      try {
        const traceDir = path.join(artifactsDir, 'pipeline-trace');
        await fs.writeFile(path.join(traceDir, `${artifactName.toLowerCase()}.compilegate.txt`), code, 'utf-8');
        await fs.writeFile(path.join(traceDir, `${artifactName.toLowerCase()}.final.tsx`), code, 'utf-8');
      } catch(e) {}
      
      try {
        if (trace) {
          trace.syntaxGate.passed = true;
          trace.compileGate.passed = true;
          await PipelineTracer.saveTrace(targetDir, trace);
          await PipelineTracer.updateHealth(targetDir, 'success');
        }
      } catch(e) {}
      
      try {
        const healthPath = path.join(artifactsDir, 'artifact-health.json');
        let healthData: any[] = [];
        try { healthData = JSON.parse(await fs.readFile(healthPath, 'utf-8')); } catch(e) {}
        healthData.push({
          artifact: artifactName,
          passedOutputSanitizer: true,
          passedCodeExtractor: true,
          passedCodePresenceGate: true,
          passedTruncationGate: true,
          passedAST: true,
          passedSyntaxGate: true,
          passedCompileGate: true
        });
        await fs.writeFile(healthPath, JSON.stringify(healthData, null, 2), 'utf-8');
      } catch (e) {}
      
      return code;
    }
    
    const failedArtifactsDir = path.join(targetDir, 'generation-artifacts', 'failed-artifacts');
    await fs.mkdir(failedArtifactsDir, { recursive: true });
    const ext = isTsx ? 'tsx' : 'ts';
    await fs.writeFile(path.join(failedArtifactsDir, `${artifactName}.attempt${attempts}.${ext}`), lastContent, 'utf-8');
    
    try {
        const healthPath = path.join(artifactsDir, 'artifact-health.json');
        let healthData: any[] = [];
        try { healthData = JSON.parse(await fs.readFile(healthPath, 'utf-8')); } catch(e) {}
        healthData.push({
          artifact: artifactName,
          passedOutputSanitizer: false,
          passedCodeExtractor: false,
          passedCodePresenceGate: false,
          passedTruncationGate: false,
          passedAST: false,
          passedSyntaxGate: false,
          passedCompileGate: false
        });
        await fs.writeFile(healthPath, JSON.stringify(healthData, null, 2), 'utf-8');
    } catch (e) {}

    throw new Error(`Generation gates failed after ${maxRetries} attempts. Generation aborted for this artifact.`);
  }

  private static async recordRootCause(targetDir: string, artifact: string, attempt: number, gate: string, errorCode: string, message: string, line: number) {
    const reportPath = path.join(targetDir, 'generation-artifacts', 'root-cause-report.json');
    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      let data: any[] = [];
      try {
        const content = await fs.readFile(reportPath, 'utf-8');
        data = JSON.parse(content);
      } catch (e) {}
      
      // Only record the first root cause for an artifact
      if (!data.some(d => d.artifact === artifact)) {
        data.push({ artifact, attempt, gate, errorCode, message, line });
        await fs.writeFile(reportPath, JSON.stringify(data, null, 2), 'utf-8');
      }
    } catch (e) {}
  }

  private static async generateFrontendPackage(frontendDir: string, reqs: NormalizedRequirements, onLog: (step: number, message: string) => void): Promise<void> {
    const provider = ProviderFactory.getProvider();
    await fs.mkdir(frontendDir, { recursive: true });

    // package.json — NO Prisma, NO admin dependencies
    const packageJson = {
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
    await fs.writeFile(path.join(frontendDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // vite.config.ts
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: true,
  }
})
`;
    await fs.writeFile(path.join(frontendDir, 'vite.config.ts'), viteConfig);

    // tailwind.config.js
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
    await fs.writeFile(path.join(frontendDir, 'tailwind.config.js'), tailwindConfig);

    // postcss.config.js
    const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
    await fs.writeFile(path.join(frontendDir, 'postcss.config.js'), postcssConfig);

    // tsconfig.json
    const tsconfigJson = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`;
    await fs.writeFile(path.join(frontendDir, 'tsconfig.json'), tsconfigJson);

    // tsconfig.node.json
    const tsconfigNodeJson = `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`;
    await fs.writeFile(path.join(frontendDir, 'tsconfig.node.json'), tsconfigNodeJson);

    // index.html
    const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${reqs.appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
    await fs.writeFile(path.join(frontendDir, 'index.html'), indexHtml);

    // === src/ ===
    const srcDir = path.join(frontendDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    // main.tsx
    const mainTsx = SystemScaffold.getMainTsxContent();
    await fs.writeFile(path.join(srcDir, 'main.tsx'), mainTsx);

    // Error Authority Scaffold
    await SystemScaffold.generateErrorAuthority(srcDir);

    // Query Authority Scaffold
    await SystemScaffold.generateQueryAuthority(srcDir);

    // Auth Authority Scaffold
    await SystemScaffold.generateAuthAuthority(srcDir);

    // index.css
    const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --bg: #f8fafc;
  --surface: #ffffff;
  --text: #0f172a;
  --text-secondary: #64748b;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}
`;
    await fs.writeFile(path.join(srcDir, 'index.css'), indexCss);

    // vite-env.d.ts — fixes import.meta.env TS errors
    const viteEnvDts = `/// <reference types="vite/client" />\n`;
    await fs.writeFile(path.join(srcDir, 'vite-env.d.ts'), viteEnvDts);

    // Create directories
    const componentsDir = path.join(srcDir, 'components');
    const hooksDir = path.join(srcDir, 'hooks');
    const pagesDir = path.join(srcDir, 'pages');

    await fs.mkdir(componentsDir, { recursive: true });
    await fs.mkdir(hooksDir, { recursive: true });
    await fs.mkdir(pagesDir, { recursive: true });

    const arch = reqs.frontendArchitecture;
    const hasServices = arch ? arch.services.length > 0 : false;

    // Only create services directory if the architecture actually has services
    const servicesDir = path.join(srcDir, 'services');
    if (hasServices) {
      await fs.mkdir(servicesDir, { recursive: true });
    }

    // === App.tsx ===
    const hasProtectedPages = arch && arch.pages.some((p: any) => p.isProtected);
    let appTsx = `import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
`;
    if (hasProtectedPages) {
      appTsx += `import { ProtectedRoute } from './components/system/ProtectedRoute'\n`;
    }

    // Import pages
    if (arch && arch.pages.length > 0) {
      for (const page of arch.pages) {
        appTsx += `import ${page.componentName} from './pages/${page.componentName}'\n`;
      }
    }

    appTsx += `
function App() {
  return (
    <BrowserRouter>
      <Routes>
`;

    if (arch && arch.pages.length > 0) {
      for (const page of arch.pages) {
        let element = `<${page.componentName} />`;
        if (page.isProtected) {
          const rolesAttr = page.allowedRoles && page.allowedRoles.length > 0
            ? ` allowedRoles={[${page.allowedRoles.map((r: string) => `'${r}'`).join(', ')}]}`
            : '';
          element = `<ProtectedRoute${rolesAttr}>${element}</ProtectedRoute>`;
        }
        appTsx += `        <Route path="${page.route}" element={${element}} />\n`;
      }
    } else {
      appTsx += `        <Route path="/" element={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-600/20 blur-[120px] rounded-full mix-blend-screen" />
            
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-8 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                ${reqs.appType}
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 mb-6 tracking-tight">
                ${reqs.appName}
              </h1>
              <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                A next-generation platform featuring ${reqs.features.slice(0,3).join(', ')} and more.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {arch && arch.pages && arch.pages.length > 0 ? (
                  <Link to={arch.pages[0].route} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all hover:shadow-[0_0_40px_8px_rgba(79,70,229,0.3)] hover:-translate-y-1">
                    Launch Dashboard
                  </Link>
                ) : null}
                <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold transition-all backdrop-blur-sm">
                  Documentation
                </button>
              </div>
            </div>
          </div>
        } />\n`;
    }

    appTsx += `      </Routes>
    </BrowserRouter>
  )
}

export default App
`;
    await fs.writeFile(path.join(srcDir, 'App.tsx'), appTsx);

    // === Generate components ===
    if (arch && arch.components.length > 0) {
      for (const comp of arch.components) {
        if (comp.type === 'page') continue; // Pages go in pages/

        const compPath = path.join(componentsDir, `${comp.name}.tsx`);
        if (await fs.stat(compPath).catch(() => false)) {
          onLog(4, `[frontend-generator] Skipping AI Component: ${comp.name} (already exists)`);
          continue;
        }

        onLog(4, `[frontend-generator] Generating AI Component: ${comp.name}...`);
        
        const prompt = `You are an expert React and Tailwind developer building components for a ${reqs.appName} application.
App Features: ${reqs.features.join(', ')}

Task: Write a fully functional, production-ready React component named "${comp.name}".
Description: ${comp.description}

Requirements:
- Use TypeScript and functional components.
- Use Tailwind CSS for all styling, ensuring it looks beautiful, premium, and modern.
- For icons, ONLY use named imports from 'lucide-react' (e.g. \`import { Search, Home } from 'lucide-react';\`). Do NOT use default imports or wildcard imports like \`import * as Lucide\`. Valid icon names include: Equal, Divide, Minus, Plus, Search, Cloud, Sun, Moon, Wind, Droplets, Thermometer, MapPin, Clock, RefreshCw, Loader, AlertCircle, ChevronDown, ChevronUp, X, Menu, Home, Settings, Star, Heart, Eye, Trash2, Edit, Check, ArrowLeft, ArrowRight. Do NOT use 'Equals' or 'EqualsNot', use 'Equal' and 'NotEqualTo' instead. Do NOT use icon names from other libraries (no Fi*, no Magnifying*, no Fa* prefixes).
- Accept props via a typed interface and export the component as default export. Props in your TypeScript interfaces should be optional (using '?') unless they are absolutely critical for the component to render.
- Add reasonable interactive elements, hover states, and animations via Tailwind.
- IMPORTANT ARCHITECTURE ENFORCEMENT: You MUST import and compose your sibling components based on the architecture manifest. Do NOT reimplement responsibilities that belong to your children. Avoid monolithic 'God Objects'. Keep components under 120 lines (or 250 for Pages/Layouts). All styling and rendering logic must be self-contained or delegated to subcomponents.
- CRITICAL: Return ONLY executable source code. Your response must begin with an import or export statement. Do NOT include ANY text before the first import. Do NOT explain, reason, describe, plan, or analyze. Do NOT use markdown fences or code blocks. Do NOT wrap response in <think>, <reasoning>, or similar tags.

HOOK CONTRACT RULES
If a generated custom hook exists for this feature:
- You MUST import and use the hook.
- DO NOT duplicate hook logic.
- DO NOT write inline useEffect fetching logic.
- DO NOT directly fetch data inside the component.
Violations are forbidden.

SERVICE CONTRACT RULES
If a generated Service exists:
- All API access MUST go through the Service.
- Components MUST NOT call fetch().
- Components MUST NOT call axios directly.
- Components MUST consume Services through Hooks whenever available.
Violations are forbidden.

CONTEXT CONTRACT RULES
If Context Providers are generated:
- They MUST be mounted.
- The root application tree MUST be wrapped.
- Generated components MUST consume the generated Context.
Do not create duplicate local state when Context exists.

AUTHENTICATION AUTHORITY RULES
- Authentication state MUST come from useAuth().
- Components MUST NOT implement their own authentication contexts.
- Components MUST NOT store authentication state in local React state.
- Role authorization MUST use ProtectedRoute.
- Pages MUST NOT implement custom role routing or perform manual redirects.
- Route protection MUST be delegated to ProtectedRoute.
- Services MUST remain authentication-agnostic and MUST NOT import React hooks.

ARCHITECTURE CONTRACT
Generated architecture is authoritative.
Generated Components must consume:
- Services
- Hooks
- Contexts
instead of recreating them.
Do not generate parallel implementations.

FORBIDDEN:
- Do NOT use placeholder comments like "TODO", "FIXME", "Business Logic:", "Validation goes here", "Implement logic", "Placeholder", or "implement later".
- Do NOT use pseudo-code.
- Do NOT leave empty handlers or functions.

REQUIRED:
- Executable validation (e.g. Zod schemas or manual client-side if-statements)
- Executable state mutations and API calls
- Executable error handling (display error messages to the user)
YOU MUST OUTPUT ONLY VALID SOURCE CODE.
DO NOT explain.
DO NOT describe.
DO NOT plan.
DO NOT think aloud.
DO NOT include reasoning.
DO NOT include notes.
DO NOT include markdown.
DO NOT include code fences.
DO NOT include prose before imports.
DO NOT include prose after export statements.
OUTPUT MUST START WITH:
import
or
interface
or
type
or
export
OUTPUT MUST END WITH A COMPLETE VALID FILE.

Return ONLY valid TypeScript or TSX source code.
Do NOT explain your reasoning.
Do NOT describe the solution.
Do NOT provide planning text.
Do NOT provide markdown.
Do NOT provide code fences.
Do NOT include comments outside the source file.
Your entire response must be a compilable source file.
`;
        try {
          const compTsx = await this.generateValidCode(provider, prompt, true, comp.name, frontendDir, onLog);
          await fs.writeFile(path.join(componentsDir, `${comp.name}.tsx`), compTsx);
        } catch (e: any) {
          onLog(4, `[FATAL] Generation Failed: Invalid AI output detected. (${e.message})`);
          throw e;
        }
      }
    }

    // === Generate services (only if architecture declares services) ===
    if (hasServices) {
      for (const svc of arch!.services) {
        const svcPath = path.join(servicesDir, `${svc.name}.ts`);
        if (await fs.stat(svcPath).catch(() => false)) {
          onLog(4, `[frontend-generator] Skipping AI Service: ${svc.name} (already exists)`);
          continue;
        }

        onLog(4, `[frontend-generator] Generating AI Service: ${svc.name}...`);
        
        const apiAuthorityRules = (svc as any).endpoints && (svc as any).endpoints.length > 0
          ? `\nAPI AUTHORITY RULES:\n- You MUST implement every endpoint listed below.\n- Do NOT invent endpoints.\n- Do NOT omit endpoints.\n- Use the specified HTTP methods exactly.\n- Use the specified paths exactly.\nEndpoints are authoritative. Do not infer alternatives.\n${(svc as any).endpoints.map((e: any) => `[${e.method}] ${e.path}: ${e.description}`).join('\n')}\n`
          : '';

        const prompt = `You are an expert TypeScript developer building API services for a ${reqs.appName} application.
App Features: ${reqs.features.join(', ')}

Task: Write a fully functional API service named "${svc.name}".
Description: ${svc.description}
External API Required: ${svc.externalApi ? svc.externalApi : 'None. Assume a local generic REST backend.'}
${apiAuthorityRules}

Requirements:
- If this service connects to an external API or local backend, use 'axios' for HTTP requests.
- If this service handles localStorage or pure math, DO NOT use axios. Return plain objects or primitive values. Ensure your exported function signatures exactly match the actual return type (e.g. do not type as AxiosResponse if you return a plain object).
- If it connects to a local backend, use \`const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';\` and request standard routes.
- If it connects to a specific external API (like OpenWeatherMap, REST Countries, etc.), implement actual endpoints with the correct parameter names. For OpenWeatherMap, use \`appid\` (NOT \`apiKey\`) as the query parameter.
- Export the service as a NAMED export: \`export const ${svc.name} = { ... }\`. The object must contain fully typed async methods.
- Provide realistic default implementations or fallbacks if the API key or endpoint fails.
- Do NOT import any relative modules or non-existent files. All helper functions and domain logic must be contained entirely within this single file. If accessing browser APIs (like Notification, Geolocation, localStorage), use the standard browser global objects directly (e.g. window.Notification or navigator.geolocation), do NOT write relative imports for them.
- If using try/catch, DO NOT type the catch variable as \`any\` (e.g. use \`catch (e)\` or \`catch (error)\`, NOT \`catch (e: any)\`).
- Services MUST remain authentication-agnostic and MUST NOT import React hooks (such as useAuth()). All auth tokens or headers must be passed as pure function arguments.
- CRITICAL: Return ONLY executable source code. Your response must begin with an import or export statement. Do NOT include ANY text before the first import. Do NOT explain, reason, describe, plan, or analyze. Do NOT use markdown fences or code blocks. Do NOT wrap response in <think>, <reasoning>, or similar tags.

FORBIDDEN:
- Do NOT use placeholder comments like "TODO", "FIXME", "Business Logic:", "Validation goes here", "Implement logic", "Placeholder", or "implement later".
- Do NOT use pseudo-code.
- Do NOT leave empty handlers or functions.

REQUIRED:
- Executable validation (e.g. Zod schemas or manual client-side if-statements)
- Executable state mutations and API calls
- Executable error handling (display error messages to the user)
YOU MUST OUTPUT ONLY VALID SOURCE CODE.
DO NOT explain.
DO NOT describe.
DO NOT plan.
DO NOT think aloud.
DO NOT include reasoning.
DO NOT include notes.
DO NOT include markdown.
DO NOT include code fences.
DO NOT include prose before imports.
DO NOT include prose after export statements.
OUTPUT MUST START WITH:
import
or
interface
or
type
or
export
OUTPUT MUST END WITH A COMPLETE VALID FILE.

Return ONLY valid TypeScript or TSX source code.
Do NOT explain your reasoning.
Do NOT describe the solution.
Do NOT provide planning text.
Do NOT provide markdown.
Do NOT provide code fences.
Do NOT include comments outside the source file.
Your entire response must be a compilable source file.
`;
        try {
          const svcTs = await this.generateValidCode(provider, prompt, false, svc.name, frontendDir, onLog);
          await fs.writeFile(path.join(servicesDir, `${svc.name}.ts`), svcTs);
        } catch (e: any) {
          onLog(4, `[FATAL] Generation Failed: Invalid AI output detected. (${e.message})`);
          throw e;
        }
      }
    }

    // === Generate hooks (with service-aware prompt conditioning) ===
    // Read generated service source code to inject method signatures into hook prompts
    const serviceSignatures: Record<string, string> = {};
    if (hasServices) {
      for (const svc of arch!.services) {
        try {
          const svcCode = await fs.readFile(path.join(servicesDir, `${svc.name}.ts`), 'utf-8');
          serviceSignatures[svc.name] = svcCode;
        } catch { /* service file missing — skip */ }
      }
    }

    // === Generate hooks ===
    if (arch && arch.hooks.length > 0) {
      for (const hook of arch.hooks) {
        const hookPath = path.join(hooksDir, `${hook.name}.ts`);
        if (await fs.stat(hookPath).catch(() => false)) {
          onLog(4, `[frontend-generator] Skipping AI Hook: ${hook.name} (already exists)`);
          continue;
        }

        onLog(4, `[frontend-generator] Generating AI Hook: ${hook.name}...`);

        let serviceBlock: string;
        let serviceRequirements: string;

        if (hasServices && Object.keys(serviceSignatures).length > 0) {
          // Services exist — inject their actual code for the AI to reference
          const servicesList = arch.services.map(s => s.name).join(', ');
          let serviceContext = `Available services: ${servicesList}`;
          for (const [svcName, svcCode] of Object.entries(serviceSignatures)) {
            serviceContext += `\n\n--- Service: ${svcName} (../services/${svcName}) ---\n${svcCode.substring(0, 1500)}`;
          }
          serviceBlock = `Context — ACTUAL SERVICE CODE (you MUST use only the method names shown here):\n${serviceContext}`;
          serviceRequirements = `- Import services using exact filenames. Example: \`import { weatherApiService } from '../services/weatherApiService'\`.
- CRITICAL: Only call methods that ACTUALLY EXIST in the service code shown above. Do NOT assume a service exports another service. Do NOT invent method names.
- Do NOT import any relative modules or helper files other than the listed services.`;
        } else {
          // NO services — hard constraint to prevent phantom service imports
          serviceBlock = `IMPORTANT: This application has NO services. There are NO service files. The services/ directory does not exist.`;
          serviceRequirements = `- CRITICAL: Do NOT import any service files. There are NO services in this application.
- CRITICAL: Do NOT import any relative modules. No ./services, no ../services, no ./utils, no ./helpers.
- All data and logic must be SELF-CONTAINED in this hook using React state (useState), localStorage, or in-memory computation.
- Do NOT generate imports for files that do not exist.`;
        }

        const hookApiAuthorityRules = (hasServices && Object.keys(serviceSignatures).length > 0)
          ? `\nREACT QUERY AUTHORITY RULES:
- Server state MUST use \`useQuery\` from \`@tanstack/react-query\`.
- Mutations MUST use \`useMutation\` from \`@tanstack/react-query\`.
- Do NOT use \`useEffect\` for API fetching.
- Do NOT manually synchronize server state with \`useState\`.
- Do NOT prop-drill refresh callbacks.
- Query keys MUST follow authority contract (deterministic arrays):
  - Collection: \`['entityName']\` (e.g. \`['users']\`)
  - Detail: \`['entityName', id]\` (e.g. \`['users', id]\`)
  - Nested: \`['entityName', id, 'relation']\` (e.g. \`['projects', projectId, 'tasks']\`)
- Mutations MUST automatically call \`queryClient.invalidateQueries({ queryKey: [...] })\` in \`onSuccess\` to synchronize state.
- Import \`useQueryClient\` to access the query client for invalidation.
- Prefer authoritative endpoint contracts from the service. Do not invent endpoint behavior.\n`
          : '';

        const prompt = `You are an expert React developer building custom hooks for a ${reqs.appName} application.
App Features: ${reqs.features.join(', ')}

Task: Write a fully functional custom React hook named "${hook.name}".
Description: ${hook.description}

${serviceBlock}
${hookApiAuthorityRules}

Requirements:
- Use \`@tanstack/react-query\` for all server state and mutations.
- Do NOT use \`useEffect\` or \`useState\` for data fetching.
${serviceRequirements}
- Export the hook as a NAMED export: \`export function ${hook.name}(...) { ... }\` or \`export const ${hook.name} = (...) => { ... }\`. Do NOT use export default.
- Return state (data, loading, error) and any relevant mutator/refresh functions.
- If using try/catch, DO NOT type the catch variable as \`any\` (e.g. use \`catch (e)\` or \`catch (error)\`, NOT \`catch (e: any)\`).
- Query hooks should obtain the auth token via const { user } = useAuth() and pass it as an argument to services (e.g. service.getUsers(user?.token)). Do NOT store auth state locally in the hook. If useAuth is consumed, import it using: \`import { useAuth } from './useAuth'\` or \`import { useAuth } from '../hooks/useAuth'\` depending on the directory.
- CRITICAL: Return ONLY executable source code. Your response must begin with an import or export statement. Do NOT include ANY text before the first import. Do NOT explain, reason, describe, plan, or analyze. Do NOT use markdown fences or code blocks. Do NOT wrap response in <think>, <reasoning>, or similar tags.

FORBIDDEN:
- Do NOT use placeholder comments like "TODO", "FIXME", "Business Logic:", "Validation goes here", "Implement logic", "Placeholder", or "implement later".
- Do NOT use pseudo-code.
- Do NOT leave empty handlers or functions.

REQUIRED:
- Executable validation (e.g. Zod schemas or manual client-side if-statements)
- Executable state mutations and API calls
- Executable error handling (display error messages to the user)
YOU MUST OUTPUT ONLY VALID SOURCE CODE.
DO NOT explain.
DO NOT describe.
DO NOT plan.
DO NOT think aloud.
DO NOT include reasoning.
DO NOT include notes.
DO NOT include markdown.
DO NOT include code fences.
DO NOT include prose before imports.
DO NOT include prose after export statements.
OUTPUT MUST START WITH:
import
or
interface
or
type
or
export
OUTPUT MUST END WITH A COMPLETE VALID FILE.

Return ONLY valid TypeScript or TSX source code.
Do NOT explain your reasoning.
Do NOT describe the solution.
Do NOT provide planning text.
Do NOT provide markdown.
Do NOT provide code fences.
Do NOT include comments outside the source file.
Your entire response must be a compilable source file.
`;
        try {
          const hookTs = await this.generateValidCode(provider, prompt, false, hook.name, frontendDir, onLog);
          await fs.writeFile(path.join(hooksDir, `${hook.name}.ts`), hookTs);
        } catch (e: any) {
          onLog(4, `[FATAL] Generation Failed: Invalid AI output detected. (${e.message})`);
          throw e;
        }
      }
    }

    // === Generate pages (with hook + component interface injection) ===
    // Read generated hooks and components to inject their signatures into page prompts
    const hookSignatures: Record<string, string> = {};
    if (arch && arch.hooks.length > 0) {
      for (const hook of arch.hooks) {
        try {
          const hookCode = await fs.readFile(path.join(hooksDir, `${hook.name}.ts`), 'utf-8');
          hookSignatures[hook.name] = hookCode;
        } catch { /* hook file missing */ }
      }
    }
    const componentSignatures: Record<string, string> = {};
    if (arch && arch.components.length > 0) {
      for (const comp of arch.components) {
        if (comp.type === 'page') continue;
        try {
          const compCode = await fs.readFile(path.join(componentsDir, `${comp.name}.tsx`), 'utf-8');
          componentSignatures[comp.name] = compCode;
        } catch { /* component file missing */ }
      }
    }

    // === Generate pages ===
    if (arch && arch.pages.length > 0) {
      for (const page of arch.pages) {
        const pagePath = path.join(pagesDir, `${page.componentName}.tsx`);
        if (await fs.stat(pagePath).catch(() => false)) {
          onLog(4, `[frontend-generator] Skipping AI Page: ${page.componentName} (already exists)`);
          continue;
        }

        onLog(4, `[frontend-generator] Generating AI Page: ${page.componentName}...`);
        
        const hooksList = arch.hooks.map(h => h.name).join(', ');
        const componentsList = arch.components.filter(c => c.type !== 'page').map(c => c.name).join(', ');
        
        // Build context with actual hook return types and component props
        let hookContext = '';
        for (const [hookName, hookCode] of Object.entries(hookSignatures)) {
          hookContext += `\n--- Hook: ${hookName} (import { ${hookName} } from '../hooks/${hookName}') ---\n${this.extractContract(hookCode)}\n`;
        }
        let compContext = '';
        for (const [compName, compCode] of Object.entries(componentSignatures)) {
          compContext += `\n--- Component: ${compName} (import ${compName} from '../components/${compName}') ---\n${this.extractContract(compCode)}\n`;
        }

        const prompt = `You are an expert React and Tailwind developer assembling pages for a ${reqs.appName} application.
App Features: ${reqs.features.join(', ')}

Task: Write a fully functional, production-ready React page component named "${page.componentName}".
Description: ${page.description}

ACTUAL HOOK CODE (use ONLY the return values and function signatures shown here):
${hookContext || 'No hooks available.'}

ACTUAL COMPONENT CODE (use ONLY the props interfaces shown here):
${compContext || 'No components available.'}

Requirements:
- Import hooks using named imports: \`import { hookName } from '../hooks/hookName'\` if applicable.
- Import components using default imports: \`import ComponentName from '../components/ComponentName'\` if applicable.
- CRITICAL: Only use return values/methods that EXIST in the actual hook code above. Only pass props that EXIST in the component interfaces above.
- CRITICAL: Do NOT invent, assume, or import any local components that are not explicitly provided in the ACTUAL COMPONENT CODE section. Use only those components or standard HTML elements.
- Integrate state management using the available hooks. No local mock data generators.
- Layout beautifully using Tailwind CSS.
- For icons, ONLY use 'lucide-react' with valid names: Search, Cloud, Sun, Wind, Droplets, Thermometer, MapPin, Clock, RefreshCw, Loader, AlertCircle, X, Menu, Home, Settings, Star, Eye, Trash2, Edit, Plus, Check, ArrowLeft, ArrowRight. Do NOT use FiSearch, MagnifyingGlass, or other non-lucide names. ALL icons used MUST be imported individually from 'lucide-react'. Do NOT use dynamic JSX like \`<IconMap[name] />\` or \`import * as Icons\`.
- Handle null values properly (e.g. if a string might be null, do not pass it to a string-only prop without fallback).
- Return the full React functional component as default export.
- CRITICAL: DO NOT import any external libraries except 'react', 'react-router-dom', and 'lucide-react'.
- DO NOT import 'tailwindcss/theming', 'vite-env-dots', '@transitive-bull/lucide-react', or ANY other fake libraries.
- If you need icons, import EXACTLY from 'lucide-react' (e.g. \`import { Search } from 'lucide-react'\`). Do NOT import from '@transitive-bull/lucide-react' or anything else.
- DO NOT use the React class component \`Component\`, always use functional components (\`React.FC\`).
- CRITICAL: Return ONLY executable source code. Your response must begin with an import or export statement. Do NOT include ANY text before the first import. Do NOT explain, reason, describe, plan, or analyze. Do NOT use markdown fences or code blocks. Do NOT wrap response in <think>, <reasoning>, or similar tags.

HOOK CONTRACT RULES
If a generated custom hook exists for this feature:
- You MUST import and use the hook.
- DO NOT duplicate hook logic.
- DO NOT write inline useEffect fetching logic.
- DO NOT directly fetch data inside the component.
Violations are forbidden.

SERVICE CONTRACT RULES
If a generated Service exists:
- All API access MUST go through the Service.
- Components MUST NOT call fetch().
- Components MUST NOT call axios directly.
- Components MUST consume Services through Hooks whenever available.
Violations are forbidden.

CONTEXT CONTRACT RULES
If Context Providers are generated:
- They MUST be mounted.
- The root application tree MUST be wrapped.
- Generated components MUST consume the generated Context.
Do not create duplicate local state when Context exists.

AUTHENTICATION AUTHORITY RULES
- Authentication state MUST come from useAuth().
- Components MUST NOT implement their own authentication contexts.
- Components MUST NOT store authentication state in local React state.
- Role authorization MUST use ProtectedRoute.
- Pages MUST NOT implement custom role routing or perform manual redirects.
- Route protection MUST be delegated to ProtectedRoute.
- Services MUST remain authentication-agnostic and MUST NOT import React hooks.

ARCHITECTURE CONTRACT
Generated architecture is authoritative.
Generated Components must consume:
- Services
- Hooks
- Contexts
instead of recreating them.
Do not generate parallel implementations.

FORBIDDEN:
- Do NOT use placeholder comments like "TODO", "FIXME", "Business Logic:", "Validation goes here", "Implement logic", "Placeholder", or "implement later".
- Do NOT use pseudo-code.
- Do NOT leave empty handlers or functions.

REQUIRED:
- Executable validation (e.g. Zod schemas or manual client-side if-statements)
- Executable state mutations and API calls
- Executable error handling (display error messages to the user)
YOU MUST OUTPUT ONLY VALID SOURCE CODE.
DO NOT explain.
DO NOT describe.
DO NOT plan.
DO NOT think aloud.
DO NOT include reasoning.
DO NOT include notes.
DO NOT include markdown.
DO NOT include code fences.
DO NOT include prose before imports.
DO NOT include prose after export statements.
OUTPUT MUST START WITH:
import
or
interface
or
type
or
export
OUTPUT MUST END WITH A COMPLETE VALID FILE.

Return ONLY valid TypeScript or TSX source code.
Do NOT explain your reasoning.
Do NOT describe the solution.
Do NOT provide planning text.
Do NOT provide markdown.
Do NOT provide code fences.
Do NOT include comments outside the source file.
Your entire response must be a compilable source file.
`;
        try {
          const pageTsx = await this.generateValidCode(provider, prompt, true, page.componentName, frontendDir, onLog);
          await fs.writeFile(path.join(pagesDir, `${page.componentName}.tsx`), pageTsx);
        } catch (e: any) {
          if (e.message?.includes('API Key') || e.message?.includes('provider settings')) {
            throw new Error(`LLM_CONFIGURATION_FAILURE: ${e.message}`);
          }
          onLog(4, `[FATAL] Generation Failed: Invalid AI output detected. (${e.message})`);
          throw e;
        }
      }
    }

    // === Generate index.ts barrel files ===
    // 1. Components index
    let componentsIndex = '';
    if (arch && arch.components.length > 0) {
      for (const comp of arch.components) {
        if (comp.type === 'page') continue;
        componentsIndex += `export { default as ${comp.name} } from './${comp.name}';\n`;
      }
    }
    await fs.writeFile(path.join(componentsDir, 'index.ts'), componentsIndex);

    // 2. Services index (only if services exist)
    if (hasServices) {
      let servicesIndex = '';
      for (const svc of arch!.services) {
        servicesIndex += `export * from './${svc.name}';\n`;
      }
      await fs.writeFile(path.join(servicesDir, 'index.ts'), servicesIndex);
    }

    // 3. Hooks index
    let hooksIndex = '';
    if (arch && arch.hooks.length > 0) {
      for (const hook of arch.hooks) {
        hooksIndex += `export * from './${hook.name}';\n`;
      }
    }
    await fs.writeFile(path.join(hooksDir, 'index.ts'), hooksIndex);

    // 4. Pages index
    let pagesIndex = '';
    if (arch && arch.pages.length > 0) {
      for (const page of arch.pages) {
        pagesIndex += `export { default as ${page.componentName} } from './${page.componentName}';\n`;
      }
    }
    await fs.writeFile(path.join(pagesDir, 'index.ts'), pagesIndex);

    // === IMPORT INTEGRITY VALIDATION ===
    // After all files are generated, validate every relative import resolves.
    // If broken imports are found, strip them deterministically (no AI involved).
    const projectRoot = path.dirname(frontendDir); // frontendDir = targetDir/frontend
    onLog(4, '[frontend-generator] Running Import Integrity Validation...');
    const importResult = await ImportIntegrityValidator.validate(projectRoot);
    if (!importResult.isValid) {
      onLog(4, `[frontend-generator] Found ${importResult.errors.length} broken import(s). Stripping...`);
      // Group broken imports by file
      const brokenByFile = new Map<string, Set<string>>();
      for (const err of importResult.errors) {
        const absPath = path.join(projectRoot, err.file);
        if (!brokenByFile.has(absPath)) {
          brokenByFile.set(absPath, new Set());
        }
        brokenByFile.get(absPath)!.add(err.importPath);
      }

      for (const [absFilePath, brokenPaths] of brokenByFile.entries()) {
        onLog(4, `[frontend-generator] Stripping ${brokenPaths.size} broken import(s) from ${path.relative(projectRoot, absFilePath)}`);
        const cleaned = await ImportIntegrityValidator.stripBrokenImports(absFilePath, brokenPaths);
        if (cleaned !== null) {
          await fs.writeFile(absFilePath, cleaned, 'utf-8');
        }
      }

      // Re-validate after stripping
      const recheck = await ImportIntegrityValidator.validate(projectRoot);
      if (!recheck.isValid) {
        onLog(4, `[frontend-generator] WARNING: ${recheck.errors.length} broken import(s) remain after stripping.`);
        for (const err of recheck.errors) {
          onLog(4, `[frontend-generator]   ${err.file}: import '${err.importPath}' → not found`);
        }
      } else {
        onLog(4, '[frontend-generator] Import Integrity Validation PASSED after cleanup.');
      }
    } else {
      onLog(4, '[frontend-generator] Import Integrity Validation PASSED.');
    }


    // tsconfig for frontend
    const tsconfig = {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        isolatedModules: true,
        moduleDetection: 'force',
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noFallthroughCasesInSwitch: true,
      },
      include: ['src'],
    };
    await fs.writeFile(path.join(frontendDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
  }

  private static isDailyRateLimit(err: any): boolean {
    const msg = err?.message || '';
    return msg.includes('tokens per day') || msg.includes('TPD');
  }

  private static async generateTextWithRetry(provider: any, prompt: string): Promise<string> {
    try {
      return await RequestQueue.enqueue(() => provider.generateText(prompt));
    } catch (e: any) {
      if (e.message?.includes('API Key') || e.message?.includes('provider settings')) {
        throw new Error(`LLM_CONFIGURATION_FAILURE: ${e.message}`);
      }
      throw e;
    }
  }
  private static extractContract(code: string): string {
    let contract = '';
    const lines = code.split('\n');
    let capturing = false;
    let bracketCount = 0;
    
    for (const line of lines) {
        if (line.trim().startsWith('import')) continue;
        
        if (line.includes('interface ') || line.includes('type ')) {
            capturing = true;
        }
        
        if (capturing) {
            contract += line + '\n';
            if (line.includes('{')) bracketCount += (line.match(/\{/g) || []).length;
            if (line.includes('}')) bracketCount -= (line.match(/\}/g) || []).length;
            if (bracketCount <= 0 && line.includes('}')) {
                capturing = false;
                bracketCount = 0;
            }
            continue;
        }
        
        if (line.includes('export default function') || line.includes('export const') || line.includes('export function') || line.includes('export class')) {
            const signature = line.split('{')[0].trim();
            contract += signature + (signature.endsWith(';') ? '\n' : ';\n');
        }
    }
    
    return contract.trim() || code.substring(0, 300);
  }
}
