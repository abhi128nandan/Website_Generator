import { NormalizedRequirements, Logger, RecoverableGenerationError } from '@website-generator/shared';
import fs from 'fs/promises';
import path from 'path';
import { FrontendAIAnalyzer } from './frontend-ai-analyzer';
import { ProviderFactory } from '@website-generator/ai-engine';
import { normalizeExpressPath } from '../compiler/path-normalizer';
import { exec } from 'child_process';
import util from 'util';
import { ASTValidator } from '../validators/ast-validator';
import { ReactStructureValidator } from '../validators/react-structure-validator';
import { PlaceholderValidator } from '../validators/placeholder-validator';
import { ImportIntegrityValidator } from '../validators/import-integrity-validator';
import { FunctionalFlowValidator } from '../validators/functional-flow-validator';
import { RepairAgent } from '../agents/repair-agent';
import { OutputSanitizer } from '../validators/output-sanitizer';
import { CodeExtractor } from '../validators/code-extractor';
import { CodeValidityGate } from '../validators/code-validity-gate';
import { CodePresenceGate } from '../validators/code-presence-gate';
import { CompilationValidator } from '../validators/compilation-validator';
import { LucideIconValidator } from '../validators/lucide-icon-validator';
import { SystemScaffold } from '../scaffold/system-scaffold';
import { NonCodeDetector } from '../validation/non-code-detector';
import { ArtifactIntegrityValidator } from '../validators/artifact-integrity-validator';
import { PipelineTracer } from '../observability/pipeline-tracer';
import { SyntaxGate } from '../validators/syntax-gate';
import { CompileGate } from '../validators/compile-gate';
import { RequestQueue } from '@website-generator/ai-engine';
import { MetricsTracker } from '../observability/metrics-tracker';

const execPromise = util.promisify(exec);
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
export class HybridGenerator {
  static async generate(
    reqs: NormalizedRequirements,
    targetDir: string,
    onLog: (step: number, message: string) => void
  ): Promise<void> {

    // === STEP 1: AI Architecture Analysis ===
    onLog(3, '[hybrid-generator] Executing AI architecture analysis...');
    
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
          onLog(3, '[hybrid-generator] Found existing architecture. Reusing instead of regenerating...');
          reqs.frontendArchitecture = cachedArch;
        } else {
          onLog(3, '[hybrid-generator] Invalid cached architecture. Discarding and regenerating...');
          await fs.unlink(archPath).catch(() => {});
        }
      }
    } catch(e) {}

    if (!reqs.frontendArchitecture) {
      (reqs as any).__targetDir = targetDir;
      await FrontendAIAnalyzer.analyze(reqs);
    }

    const arch = reqs.frontendArchitecture!;
    
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

    onLog(3, `[hybrid-generator] Architecture: ${arch.components.length} components, ${arch.services.length} services, ${arch.hooks.length} hooks, ${arch.pages.length} pages`);

    // Determine if database is needed based on features/entities
    const needsDatabase = this.detectDatabaseNeed(reqs);
    onLog(3, `[hybrid-generator] Database required: ${needsDatabase ? 'YES' : 'NO'}`);

    // === STEP 2: Root workspace ===
    onLog(3, '[hybrid-generator] Writing root workspace files...');
    await this.generateRootWorkspace(targetDir, reqs, needsDatabase);

    // === STEP 3: Frontend ===
    const frontendDir = path.join(targetDir, 'frontend');
    onLog(4, '[hybrid-generator] Writing frontend package...');
    await this.generateFrontendPackage(frontendDir, reqs, onLog);

    // === STEP 4: Backend ===
    const backendDir = path.join(targetDir, 'backend');
    onLog(4, '[hybrid-generator] Writing backend package...');
    await this.generateBackendPackage(backendDir, reqs, needsDatabase);

    // === STEP 5: Optional database ===
    if (needsDatabase) {
      const dbDir = path.join(targetDir, 'database');
      onLog(4, '[hybrid-generator] Writing database package...');
      await this.generateDatabasePackage(dbDir, reqs);
    }

    // === STEP 6: Validate ===
    onLog(5, '[hybrid-generator] Validating generated structure...');
    const requiredFiles = [
      'frontend/package.json',
      'backend/package.json',
    ];
    if (needsDatabase) {
      requiredFiles.push('database/package.json');
    }

    const missing: string[] = [];
    for (const file of requiredFiles) {
      try {
        await fs.access(path.join(targetDir, file));
      } catch {
        missing.push(file);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Hybrid scaffold validation failed. Missing files: ${missing.join(', ')}`);
    }

    // === STEP 4.5: Generate Manifest ===
    onLog(5, 'Creating generated-manifest.json...');
    const manifest = {
      pages: arch.pages?.map(p => p.componentName) || [],
      components: arch.components?.map(c => c.name) || [],
      hooks: arch.hooks?.map(h => h.name) || [],
      services: arch.services?.map(s => s.name) || [],
      routes: arch.pages?.map(p => p.route) || [],
      prismaModels: reqs.entities?.map((e: any) => e.name) || []
    };
    await fs.writeFile(path.join(targetDir, 'generated-manifest.json'), JSON.stringify(manifest, null, 2));

    // === STEP 5: Validation and Repair Loop ===
    onLog(5, 'Starting validation and repair loop...');
    let buildPassed = false;
    let repairAttempts = 0;
    const maxRepairAttempts = 3;
    let previousErrorCount = Infinity;

    while (!buildPassed && repairAttempts <= maxRepairAttempts) {
      if (repairAttempts > 0) {
        onLog(5, `[hybrid-generator] Repair attempt ${repairAttempts}/${maxRepairAttempts}...`);
      }

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
          await execPromise('pnpm install --no-frozen-lockfile', { cwd: targetDir });
          onLog(5, '[VALIDATION] pnpm build');
          const { stdout } = await execPromise('pnpm run build', { cwd: targetDir });
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
    onLog(5, '[hybrid-generator] All packages validated.');

    // === STEP 6.5: Functional Flow Validation ===
    onLog(5, '[hybrid-generator] Running Functional Flow Validation...');
    const flowRes = await FunctionalFlowValidator.validate(targetDir, reqs);
    if (!flowRes.isValid) {
      const err = flowRes.errors[0];
      throw new Error(`Entity: ${err.entity}\nMissing: ${err.missing}`);
    }

    // === STEP 7: Metadata ===
    await MetricsTracker.incrementMetric('successfulGenerations');
    onLog(5, '[hybrid-generator] Updating project metadata...');
    try {
      const metadataPath = path.join(targetDir, 'metadata.json');
      const existingMeta = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      const updatedMeta = {
        ...existingMeta,
        ...reqs,
        classifiedMode: 'hybrid-fullstack',
        needsDatabase,
        updatedAt: new Date().toISOString(),
        generatorVersion: '2.0.0',
        generatorMode: 'hybrid-fullstack',
        workspaceIntegrity: true,
      };
      await fs.writeFile(metadataPath, JSON.stringify(updatedMeta, null, 2), 'utf-8');
    } catch (e) {
      onLog(5, '[WARN] Failed to merge metadata.json');
    }

    const workspacePackages = ['frontend/', 'backend/'];
    if (needsDatabase) workspacePackages.push('database/');

    const generatedFiles = {
      files: [
        'package.json', 'pnpm-workspace.yaml', '.npmrc', '.gitignore',
        '.env.example', 'README.md', 'metadata.json', 'generated-files.json',
        ...workspacePackages,
      ],
    };
    await fs.writeFile(
      path.join(targetDir, 'generated-files.json'),
      JSON.stringify(generatedFiles, null, 2),
      'utf-8'
    );

    const tree = needsDatabase
      ? `${path.basename(targetDir)}/\n├── package.json\n├── pnpm-workspace.yaml\n├── frontend/\n├── backend/\n└── database/`
      : `${path.basename(targetDir)}/\n├── package.json\n├── pnpm-workspace.yaml\n├── frontend/\n└── backend/`;

    onLog(6, `[hybrid-generator] Final scaffold file count: ${generatedFiles.files.length}`);
    onLog(6, `[hybrid-generator] Project tree:\n${tree}`);
    onLog(6, '[hybrid-generator] Finalizing project...');
    
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
  // Detect if the app needs a database
  // ─────────────────────────────────────────────

  private static detectDatabaseNeed(reqs: NormalizedRequirements): boolean {
    const dbKeywords = [
      'database', 'persist', 'store', 'save', 'user account', 'signup',
      'login', 'auth', 'profile', 'post', 'comment', 'order', 'product',
      'transaction', 'payment', 'subscription', 'cart', 'wishlist',
    ];
    const combinedText = [reqs.appType, ...reqs.features, ...reqs.entities].join(' ').toLowerCase();
    return dbKeywords.some(kw => combinedText.includes(kw)) || reqs.entities.length > 2;
  }

  // ─────────────────────────────────────────────
  // Root workspace
  // ─────────────────────────────────────────────

  private static async generateRootWorkspace(targetDir: string, reqs: NormalizedRequirements, needsDb: boolean): Promise<void> {
    await fs.mkdir(targetDir, { recursive: true });

    const slug = reqs.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'generated-app';
    const workspaces = needsDb ? ['frontend', 'backend', 'database'] : ['frontend', 'backend'];

    const rootPackageJson = {
      name: slug,
      private: true,
      version: '0.0.0',
      workspaces,
      scripts: {
        dev: 'concurrently "pnpm --dir backend dev" "pnpm --dir frontend dev"',
        build: 'pnpm -r build',
      },
      devDependencies: {
        concurrently: '^9.0.0',
        typescript: '^5.5.3',
        ...(needsDb ? { prisma: '^5.22.0' } : {}),
      },
    };
    await fs.writeFile(path.join(targetDir, 'package.json'), JSON.stringify(rootPackageJson, null, 2), 'utf-8');

    const wsEntries = workspaces.map(w => `  - ${w}`).join('\n');
    const pnpmWorkspace = `packages:\n${wsEntries}\n`;
    await fs.writeFile(path.join(targetDir, 'pnpm-workspace.yaml'), pnpmWorkspace, 'utf-8');

    const npmrc = ['auto-install-peers=true', 'strict-peer-dependencies=false', ''].join('\n');
    await fs.writeFile(path.join(targetDir, '.npmrc'), npmrc, 'utf-8');

    const gitignore = ['node_modules', 'dist', '.env', '.next', 'coverage', '.prisma', 'generated', ''].join('\n');
    await fs.writeFile(path.join(targetDir, '.gitignore'), gitignore, 'utf-8');

    // .env.example
    let envContent = 'PORT=4000\nVITE_API_URL=http://localhost:4000\n';
    if (needsDb) {
      const dbSlug = 'websiteGenerator_generated';
      envContent += `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/${dbSlug}\n`;
    }
    await fs.writeFile(path.join(targetDir, '.env.example'), envContent, 'utf-8');
    await fs.writeFile(path.join(targetDir, '.env'), envContent, 'utf-8');

    // Docker compose (only if DB needed)
    if (needsDb) {
      const dockerCompose = `version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: websiteGenerator_generated
    ports:
      - "5432:5432"
`;
      await fs.writeFile(path.join(targetDir, 'docker-compose.yml'), dockerCompose, 'utf-8');
    }

    // README
    const readme = `# ${reqs.appName}
Type: ${reqs.appType}
Mode: Hybrid Fullstack${needsDb ? ' (with Database)' : ''}

## Features
${reqs.features.map(f => `- ${f}`).join('\n')}

## Architecture
This is a **hybrid fullstack** application with a React frontend and Express backend.
${needsDb ? 'PostgreSQL is used for data persistence.' : 'No database is required.'}

## Prerequisites
- Node.js >= 18
- pnpm >= 9
${needsDb ? '- PostgreSQL running on localhost:5432' : ''}

## Getting Started

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Copy environment config
cp .env.example .env
${needsDb ? `
# 3. Generate Prisma client and push schema
pnpm --filter database run generate
pnpm --filter database run push
` : ''}
# Start development servers
pnpm run dev
\`\`\`

## Services
| Service  | Port | Command |
|----------|------|---------|
| Frontend | 5173 | \`pnpm --dir frontend dev\` |
| Backend  | 4000 | \`pnpm --dir backend dev\` |
`;
    await fs.writeFile(path.join(targetDir, 'README.md'), readme, 'utf-8');
  }

  // ─────────────────────────────────────────────
  // Frontend package (similar to FrontendAppGenerator)
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
      } catch(e) {}

      try {
        const reportPath = path.join(artifactsDir, 'sanitizer-report.json');
        let reports: any[] = [];
        try { reports = JSON.parse(await fs.readFile(reportPath, 'utf-8')); } catch(e) {}
        reports.push({
          artifact: artifactName,
          attempt: attempts,
          diagnostics: sanitizedResult.diagnostics,
          timestamp: new Date().toISOString()
        });
        await fs.writeFile(reportPath, JSON.stringify(reports, null, 2), 'utf-8');
      } catch(e) {}
      
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
        if (!extracted.success) {
          if (extracted.reason?.startsWith('INCOMPLETE_ARTIFACT')) {
            throw new Error(extracted.reason);
          }
          throw new Error(extracted.reason || "INVALID_CODE_ARTIFACT");
        }
        extractedCode = extracted.code;
        
        const validityGate = CodeValidityGate.validate(extractedCode);
        if (!validityGate.isValid) {
          throw new Error(validityGate.reason || "INVALID_TYPESCRIPT_ARTIFACT");
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

        const { BusinessLogicAudit } = require('./business-logic-audit');
        if (isTsx) {
          BusinessLogicAudit.auditFrontend(extractedCode, []);
        }
        
        const { PlaceholderBusinessLogicValidator } = require('../validators/placeholder-validator');
        PlaceholderBusinessLogicValidator.audit(extractedCode);
      } catch (err: any) {
        onLog(4, `[GENERATION]\nArtifact: ${artifactName}\nAttempt: ${attempts}\n\nCodeValidation:\nFAILED\n\nReason:\n${err.message}`);
        await this.recordRootCause(targetDir, artifactName, attempts, 'NonCodeDetector', 'INVALID_NON_CODE_OUTPUT', err.message, 1);
        lastContent = aiResponse;
        lastErrorMessage = err.message;
        try { await PipelineTracer.updateHealth(targetDir, 'corruption'); } catch(e){}
        
        let failureStage = 'CodeValidation';
        if (err.message.includes('REASONING_DETECTED')) failureStage = 'CodePresenceGate';
        else if (err.message.includes('INVALID_REASONING_ARTIFACT')) failureStage = 'CodeExtractor';
        else if (err.message.includes('Contains reasoning phrase') || err.message.includes('English sentences')) failureStage = 'ArtifactIntegrityValidator';
        
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
        
        continue;
      }
      
      try {
        const extractedOutputDir = path.join(artifactsDir, 'extracted-output');
        await fs.mkdir(extractedOutputDir, { recursive: true });
        const extractedResponsePath = path.join(extractedOutputDir, `${artifactName}.attempt${attempts}.tsx`);
        await fs.writeFile(extractedResponsePath, extractedCode, 'utf-8');
      } catch(e) {}
      
      code = extractedCode;
      
      lastContent = code;
      
      onLog(4, '[PIPELINE]\nSyntaxGate executed');
      try {
        const pipelinePath = path.join(artifactsDir, 'pipeline-order.json');
        let order: string[] = [];
        try { order = JSON.parse(await fs.readFile(pipelinePath, 'utf-8')); } catch(e) {}
        order.push(`[Attempt ${attempts}] SyntaxGate executed`);
        await fs.writeFile(pipelinePath, JSON.stringify(order, null, 2), 'utf-8');
      } catch(e) {}
      
      const rawContainsThink = aiResponse.toLowerCase().includes('<think');
      const sanitizedContainsThink = code.toLowerCase().includes('<think');
      const rawContainsFence = aiResponse.includes('```');
      const sanitizedContainsFence = code.includes('```');
      
      console.log(`[DEBUG]
RAW OUTPUT LENGTH: ${aiResponse.length}
SANITIZED OUTPUT LENGTH: ${code.length}
rawContainsThink=${rawContainsThink}
sanitizedContainsThink=${sanitizedContainsThink}
rawContainsFence=${rawContainsFence}
sanitizedContainsFence=${sanitizedContainsFence}`);

      const conversationalPrefixes = [
        /^here is/i, /^sure/i, /^this component/i, /^typescript\s*$/im, /^tsx\s*$/im
      ];
      const hasConversationalPrefix = conversationalPrefixes.some(p => p.test(code.trimStart()));

      if (hasConversationalPrefix) {
        onLog(4, `[GENERATION]\nArtifact: ${artifactName}\nAttempt: ${attempts}\n\nPreParseGate:\nFAILED\n\nReason:\nOutput starts with forbidden conversational text.`);
        await this.recordRootCause(targetDir, artifactName, attempts, 'PreParseGate', 'CONVERSATIONAL_TEXT', 'Output contains conversational prefix', 1);
        continue;
      }

      console.log("[DEBUG] extracted code preview", code.slice(0, 200));

      const syntaxGate = SyntaxGate.validate(code, isTsx);
      if (!syntaxGate.isValid) {
        onLog(4, `[GENERATION]\nArtifact: ${artifactName}\nAttempt: ${attempts}\n\nSyntaxGate:\nFAILED\n\nReason:\n${syntaxGate.error}`);
        onLog(4, `[SYNTAX FAILURE]\nArtifact: ${artifactName}\nGenerated Output Preview: ${code.slice(0, 300)}\nParser Error:\n${syntaxGate.error}\n\nFirst 20 lines:\n${code.split('\\n').slice(0, 20).join('\\n')}`);
        
        await this.recordRootCause(targetDir, artifactName, attempts, 'SyntaxGate', 'SYNTAX_ERROR', syntaxGate.error || 'Syntax parsing failed', 1);
        lastContent = extractedCode || code;
        lastErrorMessage = syntaxGate.error || 'Syntax parsing failed';
        await MetricsTracker.incrementMetric('syntaxGateFailures');
        
        try {
          const gateReportPath = path.join(artifactsDir, 'gate-report.json');
          let reports: any[] = [];
          try { reports = JSON.parse(await fs.readFile(gateReportPath, 'utf-8')); } catch(e) {}
          reports.push({ artifact: artifactName, attempt: attempts, gate: 'SyntaxGate', error: syntaxGate.error, timestamp: new Date().toISOString() });
          await fs.writeFile(gateReportPath, JSON.stringify(reports, null, 2), 'utf-8');
          
          const syntaxFailReportPath = path.join(artifactsDir, 'syntax-failure-report.json');
          let syntaxReports: any[] = [];
          try { syntaxReports = JSON.parse(await fs.readFile(syntaxFailReportPath, 'utf-8')); } catch(e) {}
          syntaxReports.push({
            artifact: artifactName,
            rawPreview: aiResponse.slice(0, 300),
            sanitizedPreview: code.slice(0, 300),
            parserError: syntaxGate.error
          });
          await fs.writeFile(syntaxFailReportPath, JSON.stringify(syntaxReports, null, 2), 'utf-8');
        } catch(e) {}
        
        try {
          if (trace) {
            trace.syntaxGate.passed = false;
            trace.syntaxGate.error = syntaxGate.error;
            await PipelineTracer.saveTrace(targetDir, trace);
            await PipelineTracer.updateHealth(targetDir, 'syntax');
          }
        } catch(e) {}
        
        continue;
      }
      
      onLog(4, '[PIPELINE]\nCompileGate executed');
      try {
        const pipelinePath = path.join(artifactsDir, 'pipeline-order.json');
        let order: string[] = [];
        try { order = JSON.parse(await fs.readFile(pipelinePath, 'utf-8')); } catch(e) {}
        order.push(`[Attempt ${attempts}] CompileGate executed`);
        await fs.writeFile(pipelinePath, JSON.stringify(order, null, 2), 'utf-8');
      } catch(e) {}
      
      const compileGate = CompileGate.validate(code, isTsx, artifactName, artifactsDir);
      if (!compileGate.isValid) {
        // Find line number from TS error if present (e.g. line 17)
        const lineMatch = compileGate.error?.match(/Line (\d+)/i) || compileGate.error?.match(/\((\d+),/);
        const line = lineMatch ? parseInt(lineMatch[1]) : 1;
        // Simple extraction for errorCode if it looks like TS1005
        const codeMatch = compileGate.error?.match(/(TS\d+)/);
        const errorCode = codeMatch ? codeMatch[1] : 'COMPILE_ERROR';
        
        onLog(4, `[GENERATION]\nArtifact: ${artifactName}\nAttempt: ${attempts}\n\nCompileGate:\nFAILED\n\n${errorCode} ${compileGate.error}\n\nLine ${line}`);
        await this.recordRootCause(targetDir, artifactName, attempts, 'CompileGate', errorCode, compileGate.error || 'Compilation failed', line);
        lastContent = extractedCode || code;
        lastErrorMessage = compileGate.error || 'Compilation failed';
        await MetricsTracker.incrementMetric('compileGateFailures');
        
        try {
          const gateReportPath = path.join(artifactsDir, 'gate-report.json');
          let reports: any[] = [];
          try { reports = JSON.parse(await fs.readFile(gateReportPath, 'utf-8')); } catch(e) {}
          reports.push({ artifact: artifactName, attempt: attempts, gate: 'CompileGate', error: compileGate.error, timestamp: new Date().toISOString() });
          await fs.writeFile(gateReportPath, JSON.stringify(reports, null, 2), 'utf-8');
        } catch(e) {}
        
        try {
          if (trace) {
            trace.compileGate.passed = false;
            trace.compileGate.error = compileGate.error;
            await PipelineTracer.saveTrace(targetDir, trace);
            await PipelineTracer.updateHealth(targetDir, 'compile');
          }
        } catch(e) {}
        
        continue;
      }
      
      try {
        if (trace) {
          trace.syntaxGate.passed = true;
          trace.compileGate.passed = true;
          await PipelineTracer.saveTrace(targetDir, trace);
          await PipelineTracer.updateHealth(targetDir, 'success');
        }
      } catch(e) {}
      
      if (code.includes('<TRACEABILITY_FAILURE>')) {
        throw new Error('Generation failure: Missing requirement coverage detected by LLM during generation.');
      }
      
      return code;
    }
    
    const failedArtifactsDir = path.join(targetDir, 'generation-artifacts', 'failed-artifacts');
    await fs.mkdir(failedArtifactsDir, { recursive: true });
    const ext = isTsx ? 'tsx' : 'ts';
    await fs.writeFile(path.join(failedArtifactsDir, `${artifactName}.attempt${attempts}.${ext}`), lastContent, 'utf-8');
    
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

    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
`;
    await fs.writeFile(path.join(frontendDir, 'tailwind.config.js'), tailwindConfig);

    const postcssConfig = `export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
`;
    await fs.writeFile(path.join(frontendDir, 'postcss.config.js'), postcssConfig);

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

    const srcDir = path.join(frontendDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.mkdir(path.join(srcDir, 'components'), { recursive: true });
    await fs.mkdir(path.join(srcDir, 'services'), { recursive: true });
    await fs.mkdir(path.join(srcDir, 'hooks'), { recursive: true });
    await fs.mkdir(path.join(srcDir, 'pages'), { recursive: true });

    const mainTsx = SystemScaffold.getMainTsxContent();
    await fs.writeFile(path.join(srcDir, 'main.tsx'), mainTsx);

    // Error Authority Scaffold
    await SystemScaffold.generateErrorAuthority(srcDir);

    // Query Authority Scaffold
    await SystemScaffold.generateQueryAuthority(srcDir);

    // Auth Authority Scaffold
    await SystemScaffold.generateAuthAuthority(srcDir);

    const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #f8fafc;
  -webkit-font-smoothing: antialiased;
}
`;
    await fs.writeFile(path.join(srcDir, 'index.css'), indexCss);

    // vite-env.d.ts — fixes import.meta.env TS errors
    const viteEnvDts = `/// <reference types="vite/client" />\n`;
    await fs.writeFile(path.join(srcDir, 'vite-env.d.ts'), viteEnvDts);

    const arch = reqs.frontendArchitecture;

    // === App.tsx ===
    const hasProtectedPages = arch && arch.pages.some((p: any) => p.isProtected);
    let appTsx = `import React from 'react'\nimport { BrowserRouter, Routes, Route } from 'react-router-dom'\n`;
    if (hasProtectedPages) {
      appTsx = `import React from 'react'\nimport { BrowserRouter, Routes, Route } from 'react-router-dom'\nimport { ProtectedRoute } from './components/system/ProtectedRoute'\n`;
    }
    if (arch && arch.pages.length > 0) {
      for (const page of arch.pages) {
        appTsx += `import ${page.componentName} from './pages/${page.componentName}'\n`;
      }
    }
    appTsx += `\nfunction App() {\n  return (\n    <BrowserRouter>\n      <Routes>\n`;
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
            </div>
          </div>
        } />\n`;
    }
    appTsx += `      </Routes>\n    </BrowserRouter>\n  )\n}\n\nexport default App\n`;
    await fs.writeFile(path.join(srcDir, 'App.tsx'), appTsx);

    // === Generate components ===
    if (arch && arch.components.length > 0) {
      for (const comp of arch.components) {
        if (comp.type === 'page') continue;

        const compPath = path.join(srcDir, 'components', `${comp.name}.tsx`);
        if (await fs.stat(compPath).catch(() => false)) {
          onLog(4, `[hybrid-generator] Skipping AI Component: ${comp.name} (already exists)`);
          continue;
        }

        onLog(4, `[hybrid-generator] Generating AI Component: ${comp.name}...`);
        
        const prompt = `You are an expert React and Tailwind developer building components for a ${reqs.appName} application.
App Features: ${reqs.features.join(', ')}

Task: Write a fully functional, production-ready React component named "${comp.name}".
Description: ${comp.description}

Requirements:
- Use TypeScript and functional components.
- Use Tailwind CSS for all styling, ensuring it looks beautiful, premium, and modern.
- For icons, ONLY use 'lucide-react'. Valid icon names include: Equal, Divide, Minus, Plus, Search, Cloud, Sun, Moon, Wind, Droplets, Thermometer, MapPin, Clock, RefreshCw, Loader, AlertCircle, ChevronDown, ChevronUp, X, Menu, Home, Settings, Star, Heart, Eye, Trash2, Edit, Check, ArrowLeft, ArrowRight. Do NOT use 'Equals' or 'EqualsNot', use 'Equal' and 'NotEqualTo' instead. Do NOT use icon names from other libraries (no Fi*, no Magnifying*, no Fa* prefixes).
- Accept props via a typed interface and export the component as default export.
- Add reasonable interactive elements, hover states, and animations.
- Do NOT import any relative files, pages, hooks, or services. All styling and rendering logic must be self-contained in this single component file.
- Return ONLY valid TypeScript/TSX source code. Do NOT explain. Do NOT reason. Do NOT describe. Do NOT use markdown fences. Do NOT use conversational text.

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
          await fs.writeFile(path.join(srcDir, 'components', `${comp.name}.tsx`), compTsx);
        } catch (e: any) {
          onLog(4, `[FATAL] Generation Failed: Invalid AI output detected. (${e.message})`);
          throw e;
        }
      }
    }

    // === Generate services ===
    if (arch && arch.services.length > 0) {
      for (const svc of arch.services) {
        const svcPath = path.join(srcDir, 'services', `${svc.name}.ts`);
        if (await fs.stat(svcPath).catch(() => false)) {
          onLog(4, `[hybrid-generator] Skipping AI Service: ${svc.name} (already exists)`);
          continue;
        }

        onLog(4, `[hybrid-generator] Generating AI Service: ${svc.name}...`);
        
        const apiAuthorityRules = (svc as any).endpoints && (svc as any).endpoints.length > 0
          ? `\nAPI AUTHORITY RULES:\n- You MUST implement every endpoint listed below.\n- Do NOT invent endpoints.\n- Do NOT omit endpoints.\n- Use the specified HTTP methods exactly.\n- Use the specified paths exactly.\nEndpoints are authoritative. Do not infer alternatives.\n${(svc as any).endpoints.map((e: any) => `[${e.method}] ${e.path}: ${e.description}`).join('\n')}\n`
          : '';

        const prompt = `You are an expert TypeScript developer building API services for a ${reqs.appName} application.
App Features: ${reqs.features.join(', ')}

Task: Write a fully functional API service named "${svc.name}".
Description: ${svc.description}
External API Required: ${svc.externalApi ? svc.externalApi : 'None. Assume a local Express API backend.'}
${apiAuthorityRules}

Requirements:
- Use 'axios' for HTTP requests.
- If it connects to a local backend, use \`const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';\` and request standard routes.
- If it connects to a specific external API (like OpenWeatherMap, REST Countries, etc.), implement actual endpoints with the correct parameter names. For OpenWeatherMap, use \`appid\` (NOT \`apiKey\`) as the query parameter.
- Export the service as a NAMED export: \`export const ${svc.name} = { ... }\`. The object must contain fully typed async methods.
- Provide realistic default implementations or fallbacks if the API key or endpoint fails.
- Do NOT import any relative modules or non-existent files. All helper functions and domain logic must be contained entirely within this single file.
- If using try/catch, DO NOT type the catch variable as \`any\` (e.g. use \`catch (e)\` or \`catch (error)\`, NOT \`catch (e: any)\`).
- Services MUST remain authentication-agnostic and MUST NOT import React hooks (such as useAuth()). All auth tokens or headers must be passed as pure function arguments.
- Return ONLY valid TypeScript/TSX source code. Do NOT explain. Do NOT reason. Do NOT describe. Do NOT use markdown fences. Do NOT use conversational text.

FORBIDDEN:
- Do NOT use placeholder comments like "TODO", "FIXME", "Business Logic:", "Validation goes here", "Implement logic", "Placeholder", or "implement later".
- Do NOT use pseudo-code.
- Do NOT leave empty handlers or functions.

REQUIRED:
- Executable validation (e.g. Zod schemas or manual client-side if-statements)
- Executable state mutations and API calls
- Executable error handling (display error messages to the user)

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
          await fs.writeFile(path.join(srcDir, 'services', `${svc.name}.ts`), svcTs);
        } catch (e: any) {
          onLog(4, `[FATAL] Generation Failed: Invalid AI output detected. (${e.message})`);
          throw e;
        }
      }
    }

    // === Generate hooks (with service-aware prompt conditioning) ===
    const serviceSignatures: Record<string, string> = {};
    const hasServices = arch ? arch.services.length > 0 : false;
    if (hasServices) {
      for (const svc of arch!.services) {
        try {
          const svcCode = await fs.readFile(path.join(srcDir, 'services', `${svc.name}.ts`), 'utf-8');
          serviceSignatures[svc.name] = svcCode;
        } catch { /* skip */ }
      }
    }

    if (arch && arch.hooks.length > 0) {
      for (const hook of arch.hooks) {
        const hookPath = path.join(srcDir, 'hooks', `${hook.name}.ts`);
        if (await fs.stat(hookPath).catch(() => false)) {
          onLog(4, `[hybrid-generator] Skipping AI Hook: ${hook.name} (already exists)`);
          continue;
        }

        onLog(4, `[hybrid-generator] Generating AI Hook: ${hook.name}...`);

        let serviceBlock: string;
        let serviceRequirements: string;

        if (hasServices && Object.keys(serviceSignatures).length > 0) {
          const servicesList = arch.services.map(s => s.name).join(', ');
          let serviceContext = `Available services: ${servicesList}`;
          for (const [svcName, svcCode] of Object.entries(serviceSignatures)) {
            serviceContext += `\n\n--- Service: ${svcName} (../services/${svcName}) ---\n${svcCode.substring(0, 1500)}`;
          }
          serviceBlock = `Context — ACTUAL SERVICE CODE (you MUST use only the method names shown here):\n${serviceContext}`;
          serviceRequirements = `- Import services using named imports like: \`import { serviceName } from '../services/serviceName'\`.
- CRITICAL: Only call methods that ACTUALLY EXIST in the service code shown above. Do NOT assume a service exports another service. Do NOT invent method names.
- Do NOT import any relative modules or helper files other than the listed services.`;
        } else {
          serviceBlock = `IMPORTANT: This application has NO services. There are NO service files. The services/ directory does not exist.`;
          serviceRequirements = `- CRITICAL: Do NOT import any service files. There are NO services in this application.
- CRITICAL: Do NOT import any relative modules. No ./services, no ../services, no ./utils, no ./helpers.
- All data and logic must be SELF-CONTAINED in this hook using React state (useState), localStorage, or in-memory computation.
- Do NOT generate imports for files that do not exist.`;
        }

        const prompt = `You are an expert React developer building custom hooks for a ${reqs.appName} application.
App Features: ${reqs.features.join(', ')}

Task: Write a fully functional custom React hook named "${hook.name}".
Description: ${hook.description}

${serviceBlock}

REACT QUERY AUTHORITY RULES:
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
- Prefer authoritative endpoint contracts from the service. Do not invent endpoint behavior.

Requirements:
- Use \`@tanstack/react-query\` for all server state and mutations.
- Do NOT use \`useEffect\` or \`useState\` for data fetching.
${serviceRequirements}
- Export the hook as a NAMED export: \`export function ${hook.name}(...) { ... }\` or \`export const ${hook.name} = (...) => { ... }\`. Do NOT use export default.
- Return state (data, loading, error) and any relevant mutator/refresh functions.
- If using try/catch, DO NOT type the catch variable as \`any\` (e.g. use \`catch (e)\` or \`catch (error)\`, NOT \`catch (e: any)\`).
- Query hooks should obtain the auth token via const { user } = useAuth() and pass it as an argument to services (e.g. service.getUsers(user?.token)). Do NOT store auth state locally in the hook. If useAuth is consumed, import it using: \`import { useAuth } from './useAuth'\` or \`import { useAuth } from '../hooks/useAuth'\` depending on the directory.
- Return ONLY valid TypeScript/TSX source code. Do NOT explain. Do NOT reason. Do NOT describe. Do NOT use markdown fences. Do NOT use conversational text.

FORBIDDEN:
- Do NOT use placeholder comments like "TODO", "FIXME", "Business Logic:", "Validation goes here", "Implement logic", "Placeholder", or "implement later".
- Do NOT use pseudo-code.
- Do NOT leave empty handlers or functions.

REQUIRED:
- Executable validation (e.g. Zod schemas or manual client-side if-statements)
- Executable state mutations and API calls
- Executable error handling (display error messages to the user)

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
          await fs.writeFile(path.join(srcDir, 'hooks', `${hook.name}.ts`), hookTs);
        } catch (e: any) {
          onLog(4, `[FATAL] Generation Failed: Invalid AI output detected. (${e.message})`);
          throw e;
        }
      }
    }

    // === Generate pages (with hook + component interface injection) ===
    const hookSignatures: Record<string, string> = {};
    if (arch && arch.hooks.length > 0) {
      for (const hook of arch.hooks) {
        try {
          const hookCode = await fs.readFile(path.join(srcDir, 'hooks', `${hook.name}.ts`), 'utf-8');
          hookSignatures[hook.name] = hookCode;
        } catch { /* skip */ }
      }
    }
    const componentSignatures: Record<string, string> = {};
    if (arch && arch.components.length > 0) {
      for (const comp of arch.components) {
        if (comp.type === 'page') continue;
        try {
          const compCode = await fs.readFile(path.join(srcDir, 'components', `${comp.name}.tsx`), 'utf-8');
          componentSignatures[comp.name] = compCode;
        } catch { /* skip */ }
      }
    }

    if (arch && arch.pages.length > 0) {
      for (const page of arch.pages) {
        const pagePath = path.join(srcDir, 'pages', `${page.componentName}.tsx`);
        if (await fs.stat(pagePath).catch(() => false)) {
          onLog(4, `[hybrid-generator] Skipping AI Page: ${page.componentName} (already exists)`);
          continue;
        }

        onLog(4, `[hybrid-generator] Generating AI Page: ${page.componentName}...`);
        const hooksList = arch.hooks.map(h => h.name).join(', ');
        const componentsList = arch.components.filter(c => c.type !== 'page').map(c => c.name).join(', ');

        let hookContext = '';
        for (const [hookName, hookCode] of Object.entries(hookSignatures)) {
          hookContext += `\n--- Hook: ${hookName} (import { ${hookName} } from '../hooks/${hookName}') ---\n${this.extractContract(hookCode)}\n`;
        }
        let compContext = '';
        for (const [compName, compCode] of Object.entries(componentSignatures)) {
          compContext += `\n--- Component: ${compName} (import ${compName} from '../components/${compName}') ---\n${this.extractContract(compCode)}\n`;
        }

        const prompt = `You are an expert React developer building pages for a ${reqs.appName} application.
App Features: ${reqs.features.join(', ')}

Task: Write a fully functional React page component named "${page.componentName}".
Description: ${page.description}

ACTUAL HOOK CODE (use ONLY the return values and function signatures shown here):
${hookContext || 'No hooks available.'}

ACTUAL COMPONENT CODE (use ONLY the props interfaces shown here):
${compContext || 'No components available.'}

Requirements:
- Import hooks using named imports: \`import { hookName } from '../hooks/hookName'\` if applicable.
- Import components using default imports: \`import ComponentName from '../components/ComponentName'\` if applicable.
- CRITICAL: Only use return values/methods that EXIST in the actual hook code above. Only pass props that EXIST in the component interfaces above.
- Integrate state management using the available hooks. No local mock data generators.
- Layout beautifully using Tailwind CSS.
- For icons, ONLY use 'lucide-react' with valid names: Search, Cloud, Sun, Wind, Droplets, Thermometer, MapPin, Clock, RefreshCw, Loader, AlertCircle, X, Menu, Home, Settings, Star, Eye, Trash2, Edit, Plus, Check, ArrowLeft, ArrowRight. Do NOT use FiSearch, MagnifyingGlass, or other non-lucide names. ALL icons used MUST be imported from 'lucide-react'.
- Handle null values properly (e.g. if a string might be null, do not pass it to a string-only prop without fallback).
- Return the full React functional component as default export.
- Do NOT import other pages, or components/hooks not in the lists above.
- If using try/catch, DO NOT type the catch variable as \`any\` (e.g. use \`catch (e)\` or \`catch (error)\`, NOT \`catch (e: any)\`).
- BUSINESS LOGIC: You MUST fetch real data using the provided hooks and endpoints.
- UI FEEDBACK: You MUST implement explicit loading spinners/states and explicit error states/banners.
- MUTATIONS: You MUST wire form \`onSubmit\` handlers to perform client-side validation, and invoke mutation hooks to refresh data or update the UI optimally after successful submissions.
- TRACEABILITY: Verify that every feature listed in 'App Features' related to this page is implemented. If you cannot implement all required features, you MUST output the exact string <TRACEABILITY_FAILURE> instead of code.
- Return ONLY valid TypeScript/TSX source code. Do NOT explain. Do NOT reason. Do NOT describe. Do NOT use markdown fences. Do NOT use conversational text.

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
          await fs.writeFile(path.join(srcDir, 'pages', `${page.componentName}.tsx`), pageTsx);
        } catch (e: any) {
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
    await fs.writeFile(path.join(srcDir, 'components', 'index.ts'), componentsIndex);

    // 2. Services index
    let servicesIndex = '';
    if (arch && arch.services.length > 0) {
      for (const svc of arch.services) {
        servicesIndex += `export * from './${svc.name}';\n`;
      }
    }
    await fs.writeFile(path.join(srcDir, 'services', 'index.ts'), servicesIndex);

    // 3. Hooks index
    let hooksIndex = '';
    if (arch && arch.hooks.length > 0) {
      for (const hook of arch.hooks) {
        hooksIndex += `export * from './${hook.name}';\n`;
      }
    }
    await fs.writeFile(path.join(srcDir, 'hooks', 'index.ts'), hooksIndex);

    // 4. Pages index
    let pagesIndex = '';
    if (arch && arch.pages.length > 0) {
      for (const page of arch.pages) {
        pagesIndex += `export { default as ${page.componentName} } from './${page.componentName}';\n`;
      }
    }
    await fs.writeFile(path.join(srcDir, 'pages', 'index.ts'), pagesIndex);

    // === IMPORT INTEGRITY VALIDATION ===
    // After all files are generated, validate every relative import resolves.
    // If broken imports are found, strip them deterministically (no AI involved).
    const projectRoot = path.dirname(frontendDir); // frontendDir = targetDir/frontend
    onLog(4, '[hybrid-generator] Running Import Integrity Validation...');
    const importResult = await ImportIntegrityValidator.validate(projectRoot);
    if (!importResult.isValid) {
      onLog(4, `[hybrid-generator] Found ${importResult.errors.length} broken import(s). Stripping...`);
      const brokenByFile = new Map<string, Set<string>>();
      for (const err of importResult.errors) {
        const absPath = path.join(projectRoot, err.file);
        if (!brokenByFile.has(absPath)) {
          brokenByFile.set(absPath, new Set());
        }
        brokenByFile.get(absPath)!.add(err.importPath);
      }

      for (const [absFilePath, brokenPaths] of brokenByFile.entries()) {
        onLog(4, `[hybrid-generator] Stripping ${brokenPaths.size} broken import(s) from ${path.relative(projectRoot, absFilePath)}`);
        const cleaned = await ImportIntegrityValidator.stripBrokenImports(absFilePath, brokenPaths);
        if (cleaned !== null) {
          await fs.writeFile(absFilePath, cleaned, 'utf-8');
        }
      }

      const recheck = await ImportIntegrityValidator.validate(projectRoot);
      if (!recheck.isValid) {
        onLog(4, `[hybrid-generator] WARNING: ${recheck.errors.length} broken import(s) remain after stripping.`);
        for (const err of recheck.errors) {
          onLog(4, `[hybrid-generator]   ${err.file}: import '${err.importPath}' → not found`);
        }
      } else {
        onLog(4, '[hybrid-generator] Import Integrity Validation PASSED after cleanup.');
      }
    } else {
      onLog(4, '[hybrid-generator] Import Integrity Validation PASSED.');
    }

    const tsconfig = {
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
    await fs.writeFile(path.join(frontendDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
  }

  private static async generateBackendPackage(backendDir: string, reqs: NormalizedRequirements, needsDb: boolean): Promise<void> {
    await fs.mkdir(backendDir, { recursive: true });

    const dependencies: Record<string, string> = {
      cors: '^2.8.5',
      dotenv: '^16.4.5',
      express: '^4.19.2',
    };
    if (needsDb) {
      dependencies['@prisma/client'] = '^5.22.0';
    }

    const packageJson = {
      name: 'backend',
      private: true,
      version: '0.0.0',
      scripts: {
        dev: 'ts-node-dev src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js',
      },
      dependencies,
      devDependencies: {
        '@types/cors': '^2.8.17',
        '@types/express': '^4.17.21',
        '@types/node': '^20.14.9',
        'ts-node-dev': '^2.0.0',
        typescript: '^5.5.3',
      },
    };
    await fs.writeFile(path.join(backendDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    const tsconfig = {
      compilerOptions: {
        target: 'es2022', module: 'commonjs', rootDir: './src', outDir: './dist',
        esModuleInterop: true, forceConsistentCasingInFileNames: true, strict: true, skipLibCheck: true,
      },
      include: ['src/**/*'],
    };
    await fs.writeFile(path.join(backendDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

    const srcDir = path.join(backendDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    let indexTs = '';
    const arch = reqs.frontendArchitecture;
    const provider = ProviderFactory.getProvider();

    if (arch && arch.services.length > 0) {
      const apiPrompt = `You are an expert backend engineer. Write a fully functional, production-ready Express server file index.ts in TypeScript for the application "${reqs.appName}".
App Features: ${reqs.features.join(', ')}
Database Enabled: ${needsDb ? 'YES (Prisma client is available and imported from @prisma/client)' : 'NO'}
Entities: ${reqs.entities.join(', ')}
Services: ${arch.services.map(s => `${s.name} (${s.description})`).join(', ')}

Requirements:
- Import 'express', 'cors', 'dotenv', and (if database is enabled) 'PrismaClient' from '@prisma/client'.
- Initialize Express, CORS, and JSON parsing middlewares.
- Connect to the database using PrismaClient (if database is enabled).
- Implement working Express endpoints matching the frontend services: ${arch.services.map(s => s.name).join(', ')}.
- Ensure Express route parameters are written with colon notation (e.g. '/api/users/:id'), NEVER Swagger curly brace notation.
- If database is enabled, perform actual Prisma queries to persist and retrieve data for these endpoints. E.g. \`await prisma.user.findMany()\` or query the appropriate generated Prisma models.
- Implement proper REST standards (GET to query, POST to create, PUT to update, DELETE to delete).
- Do not include conversational text or markdown code blocks inside the output other than the raw typescript code.
- BUSINESS LOGIC: You MUST validate required fields, numeric ranges, and enums. NEVER pass req.body directly into Prisma without manual validation and field extraction. You MUST use Zod or similar explicit validation.
- ERROR HANDLING: You MUST return 400 Bad Request for invalid input and 404 Not Found when referenced entities do not exist. Return structured JSON error responses.
- TRACEABILITY: Verify that every feature listed in 'App Features' related to the backend is implemented. If you cannot implement all required features, you MUST output the exact string <TRACEABILITY_FAILURE> instead of code.

FORBIDDEN:
- Do NOT use placeholder comments like "TODO", "FIXME", "Business Logic:", "Validation goes here", "Implement logic", "Placeholder", or "implement later".
- Do NOT use pseudo-code.
- Do NOT leave empty handlers or functions.

REQUIRED:
- Executable validation (e.g. Zod schemas)
- Executable filtering (e.g. Prisma where clauses)
- Executable mutations
- Executable error handling
`;

      let backendPassed = false;
      let backendAttempts = 0;
      let currentBackendPrompt = apiPrompt;
      const { BusinessLogicAudit, RequirementCoverageAudit } = require('./business-logic-audit');

      while (!backendPassed && backendAttempts < 3) {
        backendAttempts++;
        try {
          const response = await this.generateTextWithRetry(provider, currentBackendPrompt);
          indexTs = this.extractCodeBlock(response);
          RequirementCoverageAudit.audit(response, reqs.features);
          BusinessLogicAudit.auditBackend(indexTs, reqs.features);
          const { PlaceholderBusinessLogicValidator } = require('../validators/placeholder-validator');
          PlaceholderBusinessLogicValidator.audit(indexTs);
          backendPassed = true;
        } catch (e: any) {
          Logger.warn(`[hybrid-generator] Backend generation attempt ${backendAttempts} failed: ${e.message}`);
          if (backendAttempts >= 3) {
            indexTs = '';
            Logger.warn(`[hybrid-generator] Failed to generate dynamic backend after 3 attempts. Falling back to stub.`);
          } else {
            currentBackendPrompt = apiPrompt + `\n\nCRITICAL FIX REQUIRED: Your previous attempt failed with the following error:\n${e.message}\nPlease fix this error in your next response. Do NOT provide explanations, only return the complete fixed typescript source code.`;
          }
        }
      }
    }

    if (!indexTs) {
      // Fallback stub generation
      indexTs = `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
${needsDb ? "import { PrismaClient } from '@prisma/client';" : ''}

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
${needsDb ? 'const prisma = new PrismaClient();' : ''}

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', appName: '${reqs.appName}', mode: 'hybrid-fullstack' });
});

`;

      if (arch && arch.services.length > 0) {
        for (const svc of arch.services) {
          const normalizedPath = normalizeExpressPath(`/api/${svc.name}`);
          indexTs += `// --- API: ${svc.name} ---
// ${svc.description}
app.get('${normalizedPath}', async (req, res) => {
  try {
    res.json({ message: '${svc.name} endpoint active', data: [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('${normalizedPath}', async (req, res) => {
  try {
    res.status(201).json({ message: '${svc.name} created', data: req.body });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

`;
        }
      }

      indexTs += `app.listen(port, () => {
  console.log(\`Server is running on port \${port}\`);
});
`;
    }

    await fs.writeFile(path.join(srcDir, 'index.ts'), indexTs);
  }

  // ─────────────────────────────────────────────
  // Optional database package (minimal Prisma)
  // ─────────────────────────────────────────────

  private static async generateDatabasePackage(dbDir: string, reqs: NormalizedRequirements): Promise<void> {
    await fs.mkdir(dbDir, { recursive: true });

    const packageJson = {
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
    await fs.writeFile(path.join(dbDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    const prismaDir = path.join(dbDir, 'prisma');
    await fs.mkdir(prismaDir, { recursive: true });

    let prismaModels = `model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

    const provider = ProviderFactory.getProvider();
    const schemaPrompt = `You are a database architect. Write a set of valid Prisma models for the PostgreSQL database of an application named "${reqs.appName}".
App Features: ${reqs.features.join(', ')}
Identified Entities: ${reqs.entities.join(', ')}

Requirements:
- Create models that represent the application's entities and their relationships.
- Ensure proper relationships between models (e.g., using @relation, relational fields, and mapping/references).
- Provide typical fields like ID (String @id @default(uuid())), timestamps (createdAt, updatedAt), and descriptive domain fields (strings, ints, booleans, DateTimes).
- Output ONLY the Prisma model definitions (do NOT output datasource db or generator client blocks).
- Output ONLY valid Prisma code inside a markdown code block. Do not include conversational text.
`;

    try {
      const response = await this.generateTextWithRetry(provider, schemaPrompt);
      const extracted = this.extractCodeBlock(response);
      if (extracted && extracted.trim().startsWith('model')) {
        prismaModels = extracted;
      }
    } catch (e: any) {
      Logger.warn(`[hybrid-generator] Failed to generate dynamic Prisma schema: ${e.message}. Using default User model.`);
    }

    const schemaPrisma = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

${prismaModels}
`;
    await fs.writeFile(path.join(prismaDir, 'schema.prisma'), schemaPrisma);
  }

  private static isDailyRateLimit(err: any): boolean {
    const msg = err?.message || '';
    return msg.includes('tokens per day') || msg.includes('TPD');
  }

  private static async generateTextWithRetry(provider: any, prompt: string): Promise<string> {
    try {
      const response = (await RequestQueue.enqueue(() => provider.generateText(prompt))) as string;
      if (response.includes('<TRACEABILITY_FAILURE>')) {
        throw new Error('Generation failure: Missing requirement coverage detected by LLM during generation.');
      }
      return response;
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
