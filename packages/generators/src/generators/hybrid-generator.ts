import { NormalizedRequirements, Logger } from '@paperclip/shared';
import fs from 'fs/promises';
import path from 'path';
import { FrontendAIAnalyzer } from './frontend-ai-analyzer';
import { ProviderFactory } from '@paperclip/ai-engine';
import { normalizeExpressPath } from '../compiler/path-normalizer';
import { exec } from 'child_process';
import util from 'util';
import { ASTValidator } from '../validators/ast-validator';
import { ReactStructureValidator } from '../validators/react-structure-validator';
import { PlaceholderValidator } from '../validators/placeholder-validator';
import { RepairAgent } from '../agents/repair-agent';

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
    await FrontendAIAnalyzer.analyze(reqs);

    const arch = reqs.frontendArchitecture!;
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

    onLog(5, '[hybrid-generator] Starting Auto Repair Loop...');
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
        onLog(5, `[VALIDATION] AST Validation Failed: ${astRes.errors.length} errors`);
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
          throw new Error(`Validation/Build failed. Errors:\n${allErrors.slice(0, 10).join('\n')}`);
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

    onLog(5, '[hybrid-generator] All packages validated.');

    // === STEP 7: Metadata ===
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
      const dbSlug = 'paperclip_generated';
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
      POSTGRES_DB: paperclip_generated
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

    const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
    await fs.writeFile(path.join(srcDir, 'main.tsx'), mainTsx);

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

    // === Generate components ===
    if (arch && arch.components.length > 0) {
      for (const comp of arch.components) {
        if (comp.type === 'page') continue;
        onLog(4, `[hybrid-generator] Generating AI Component: ${comp.name}...`);
        
        const prompt = `You are an expert React and Tailwind developer building components for a ${reqs.appName} application.
App Features: ${reqs.features.join(', ')}

Task: Write a fully functional, production-ready React component named "${comp.name}".
Description: ${comp.description}

Requirements:
- Use TypeScript and functional components.
- Use Tailwind CSS for all styling, ensuring it looks beautiful, premium, and modern.
- For icons, ONLY use 'lucide-react'. Valid icon names include: Search, Cloud, Sun, Moon, Wind, Droplets, Thermometer, MapPin, Clock, RefreshCw, Loader, AlertCircle, ChevronDown, ChevronUp, X, Menu, Home, Settings, Star, Heart, Eye, Trash2, Edit, Plus, Check, ArrowLeft, ArrowRight. Do NOT use icon names from other libraries (no Fi*, no Magnifying*, no Fa* prefixes).
- Accept props via a typed interface and export the component as default export.
- Add reasonable interactive elements, hover states, and animations.
- Do NOT import any relative files, pages, hooks, or services. All styling and rendering logic must be self-contained in this single component file.
- Output ONLY the raw TSX code within a markdown code block. Do not include conversational text.
`;
        try {
          const aiResponse = await this.generateTextWithRetry(provider, prompt);
          const compTsx = this.extractCodeBlock(aiResponse);
          await fs.writeFile(path.join(srcDir, 'components', `${comp.name}.tsx`), compTsx);
        } catch (e: any) {
          onLog(4, `[WARN] Failed to generate component ${comp.name}: ${e.message}`);
          if (this.isDailyRateLimit(e)) throw e;
        }
      }
    }

    // === Generate services ===
    if (arch && arch.services.length > 0) {
      for (const svc of arch.services) {
        onLog(4, `[hybrid-generator] Generating AI Service: ${svc.name}...`);
        
        const prompt = `You are an expert TypeScript developer building API services for a ${reqs.appName} application.
App Features: ${reqs.features.join(', ')}

Task: Write a fully functional API service named "${svc.name}".
Description: ${svc.description}
External API Required: ${svc.externalApi ? svc.externalApi : 'None. Assume a local Express API backend.'}

Requirements:
- Use 'axios' for HTTP requests.
- If it connects to a local backend, use \`const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';\` and request standard routes.
- If it connects to a specific external API (like OpenWeatherMap, REST Countries, etc.), implement actual endpoints with the correct parameter names. For OpenWeatherMap, use \`appid\` (NOT \`apiKey\`) as the query parameter.
- Export the service as a NAMED export: \`export const ${svc.name} = { ... }\`. The object must contain fully typed async methods.
- Provide realistic default implementations or fallbacks if the API key or endpoint fails.
- Do NOT import any relative modules or non-existent files. All helper functions and domain logic must be contained entirely within this single file.
- If using try/catch, DO NOT type the catch variable as \`any\` (e.g. use \`catch (e)\` or \`catch (error)\`, NOT \`catch (e: any)\`).
- Output ONLY the raw TS code within a markdown code block. Do not include conversational text.
`;
        try {
          const aiResponse = await this.generateTextWithRetry(provider, prompt);
          const svcTs = this.extractCodeBlock(aiResponse);
          await fs.writeFile(path.join(srcDir, 'services', `${svc.name}.ts`), svcTs);
        } catch (e: any) {
          onLog(4, `[WARN] Failed to generate service ${svc.name}: ${e.message}`);
          if (this.isDailyRateLimit(e)) throw e;
        }
      }
    }

    // === Generate hooks (with service interface injection) ===
    const serviceSignatures: Record<string, string> = {};
    if (arch && arch.services.length > 0) {
      for (const svc of arch.services) {
        try {
          const svcCode = await fs.readFile(path.join(srcDir, 'services', `${svc.name}.ts`), 'utf-8');
          serviceSignatures[svc.name] = svcCode;
        } catch { /* skip */ }
      }
    }

    if (arch && arch.hooks.length > 0) {
      for (const hook of arch.hooks) {
        onLog(4, `[hybrid-generator] Generating AI Hook: ${hook.name}...`);
        
        const servicesList = arch.services.map(s => s.name).join(', ');
        let serviceContext = `Available services: ${servicesList}`;
        for (const [svcName, svcCode] of Object.entries(serviceSignatures)) {
          serviceContext += `\n\n--- Service: ${svcName} (../services/${svcName}) ---\n${svcCode.substring(0, 1500)}`;
        }

        const prompt = `You are an expert React developer building custom hooks for a ${reqs.appName} application.
App Features: ${reqs.features.join(', ')}

Task: Write a fully functional custom React hook named "${hook.name}".
Description: ${hook.description}

Context — ACTUAL SERVICE CODE (you MUST use only the method names shown here):
${serviceContext}

Requirements:
- Use standard React hooks (useState, useEffect, useCallback).
- Import services using named imports like: \`import { ${servicesList} } from '../services/[serviceName]'\`. specifically match \`import { serviceName } from '../services/serviceName'\`.
- CRITICAL: Only call methods that ACTUALLY EXIST in the service code shown above. Do NOT assume a service exports another service. Do NOT invent method names.
- Export the hook as a NAMED export: \`export function ${hook.name}(...) { ... }\` or \`export const ${hook.name} = (...) => { ... }\`. Do NOT use export default.
- Return state (data, loading, error) and any relevant mutator/refresh functions.
- Do NOT import any relative modules or helper files other than the listed services.
- If using try/catch, DO NOT type the catch variable as \`any\` (e.g. use \`catch (e)\` or \`catch (error)\`, NOT \`catch (e: any)\`).
- Output ONLY the raw TS code within a markdown code block. Do not include conversational text.
`;
        try {
          const aiResponse = await this.generateTextWithRetry(provider, prompt);
          const hookTs = this.extractCodeBlock(aiResponse);
          await fs.writeFile(path.join(srcDir, 'hooks', `${hook.name}.ts`), hookTs);
        } catch (e: any) {
          onLog(4, `[WARN] Failed to generate hook ${hook.name}: ${e.message}`);
          if (this.isDailyRateLimit(e)) throw e;
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
        onLog(4, `[hybrid-generator] Generating AI Page: ${page.componentName}...`);
        const hooksList = arch.hooks.map(h => h.name).join(', ');
        const componentsList = arch.components.filter(c => c.type !== 'page').map(c => c.name).join(', ');

        let hookContext = '';
        for (const [hookName, hookCode] of Object.entries(hookSignatures)) {
          hookContext += `\n--- Hook: ${hookName} (import { ${hookName} } from '../hooks/${hookName}') ---\n${hookCode.substring(0, 1200)}\n`;
        }
        let compContext = '';
        for (const [compName, compCode] of Object.entries(componentSignatures)) {
          compContext += `\n--- Component: ${compName} (import ${compName} from '../components/${compName}') ---\n${compCode.substring(0, 1200)}\n`;
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
- Output ONLY the raw TSX code within a markdown code block. Do not include conversational text.
`;
        try {
          const aiResponse = await this.generateTextWithRetry(provider, prompt);
          const pageTsx = this.extractCodeBlock(aiResponse);
          await fs.writeFile(path.join(srcDir, 'pages', `${page.componentName}.tsx`), pageTsx);
        } catch (e: any) {
          onLog(4, `[WARN] Failed to generate page ${page.componentName}: ${e.message}`);
          if (this.isDailyRateLimit(e)) throw e;
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

    // App.tsx
    let appTsx = `import React from 'react'\nimport { BrowserRouter, Routes, Route } from 'react-router-dom'\n`;
    if (arch && arch.pages.length > 0) {
      for (const page of arch.pages) {
        appTsx += `import ${page.componentName} from './pages/${page.componentName}'\n`;
      }
    }
    appTsx += `\nfunction App() {\n  return (\n    <BrowserRouter>\n      <Routes>\n`;
    if (arch && arch.pages.length > 0) {
      for (const page of arch.pages) {
        appTsx += `        <Route path="${page.route}" element={<${page.componentName} />} />\n`;
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
`;

      try {
        const response = await this.generateTextWithRetry(provider, apiPrompt);
        indexTs = this.extractCodeBlock(response);
      } catch (e: any) {
        Logger.warn(`[hybrid-generator] Failed to generate dynamic backend: ${e.message}. Falling back to stub.`);
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

  private static async generateTextWithRetry(provider: any, prompt: string, maxRetries = 3, delayMs = 1500): Promise<string> {
    let lastError: any = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await provider.generateText(prompt);
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || '';
        const errStr = JSON.stringify(err) || '';

        // If daily token limit is exhausted, abort immediately
        if (this.isDailyRateLimit(err)) {
          throw new Error(`Daily API token limit exhausted. Cannot generate code. ${errMsg}`);
        }

        const isRateLimit = errMsg.includes('429') || errMsg.includes('rate_limit') || errMsg.includes('Rate limit') || errStr.includes('429');
        
        if (isRateLimit || attempt < maxRetries) {
          const waitTime = isRateLimit ? delayMs * 2 * attempt : delayMs * attempt;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw err;
        }
      }
    }
    throw lastError;
  }
}
