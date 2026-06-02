import { NormalizedRequirements, Logger } from '@paperclip/shared';
import fs from 'fs/promises';
import path from 'path';
import { FrontendAIAnalyzer } from './frontend-ai-analyzer';
import { ProviderFactory } from '@paperclip/ai-engine';
import { exec } from 'child_process';
import util from 'util';
import { ASTValidator } from '../validators/ast-validator';
import { ReactStructureValidator } from '../validators/react-structure-validator';
import { PlaceholderValidator } from '../validators/placeholder-validator';
import { RepairAgent } from '../agents/repair-agent';

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
    await FrontendAIAnalyzer.analyze(reqs);

    const arch = reqs.frontendArchitecture!;
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

    // === STEP 4.5: Auto Repair Loop (Phase 7) ===
    onLog(5, '[frontend-generator] Starting Auto Repair Loop...');
    let buildPassed = false;
    let repairAttempts = 0;
    const maxRepairAttempts = 3;
    let previousErrorCount = Infinity;

    while (!buildPassed && repairAttempts <= maxRepairAttempts) {
      if (repairAttempts > 0) {
        onLog(5, `[frontend-generator] Repair attempt ${repairAttempts}/${maxRepairAttempts}...`);
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
          throw new Error(`Validation/Build failed. Errors:\n${allErrors.slice(0, 10).join('\n')}`);
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

    onLog(5, '[VALIDATION] All validation checks passed. Build successful!');

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
    const servicesDir = path.join(srcDir, 'services');
    const hooksDir = path.join(srcDir, 'hooks');
    const pagesDir = path.join(srcDir, 'pages');

    await fs.mkdir(componentsDir, { recursive: true });
    await fs.mkdir(servicesDir, { recursive: true });
    await fs.mkdir(hooksDir, { recursive: true });
    await fs.mkdir(pagesDir, { recursive: true });

    const arch = reqs.frontendArchitecture;

    // === Generate components ===
    if (arch && arch.components.length > 0) {
      for (const comp of arch.components) {
        if (comp.type === 'page') continue; // Pages go in pages/
        onLog(4, `[frontend-generator] Generating AI Component: ${comp.name}...`);
        
        const prompt = `You are an expert React and Tailwind developer building components for a ${reqs.appName} application.
App Features: ${reqs.features.join(', ')}

Task: Write a fully functional, production-ready React component named "${comp.name}".
Description: ${comp.description}

Requirements:
- Use TypeScript and functional components.
- Use Tailwind CSS for all styling, ensuring it looks beautiful, premium, and modern.
- For icons, ONLY use 'lucide-react'. Valid icon names include: Search, Cloud, Sun, Moon, Wind, Droplets, Thermometer, MapPin, Clock, RefreshCw, Loader, AlertCircle, ChevronDown, ChevronUp, X, Menu, Home, Settings, Star, Heart, Eye, Trash2, Edit, Plus, Check, ArrowLeft, ArrowRight. Do NOT use icon names from other libraries (no Fi*, no Magnifying*, no Fa* prefixes).
- Accept props via a typed interface and export the component as default export.
- Add reasonable interactive elements, hover states, and animations via Tailwind.
- Do NOT import any relative files, pages, hooks, or services. All styling and rendering logic must be self-contained in this single component file.
- Output ONLY the raw TSX code within a markdown code block. Do not include conversational text.
`;
        try {
          const aiResponse = await this.generateTextWithRetry(provider, prompt);
          const compTsx = this.extractCodeBlock(aiResponse);
          await fs.writeFile(path.join(componentsDir, `${comp.name}.tsx`), compTsx);
        } catch (e: any) {
          onLog(4, `[WARN] Failed to generate component ${comp.name}: ${e.message}`);
          if (this.isDailyRateLimit(e)) throw e;
        }
      }
    }

    // === Generate services ===
    if (arch && arch.services.length > 0) {
      for (const svc of arch.services) {
        onLog(4, `[frontend-generator] Generating AI Service: ${svc.name}...`);
        
        const prompt = `You are an expert TypeScript developer building API services for a ${reqs.appName} application.
App Features: ${reqs.features.join(', ')}

Task: Write a fully functional API service named "${svc.name}".
Description: ${svc.description}
External API Required: ${svc.externalApi ? svc.externalApi : 'None. Assume a local generic REST backend.'}

Requirements:
- Use 'axios' for HTTP requests.
- If it connects to a local backend, use \`const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';\` and request standard routes.
- If it connects to a specific external API (like OpenWeatherMap, REST Countries, etc.), implement actual endpoints with the correct parameter names. For OpenWeatherMap, use \`appid\` (NOT \`apiKey\`) as the query parameter.
- Export the service as a NAMED export: \`export const ${svc.name} = { ... }\`. The object must contain fully typed async methods.
- Provide realistic default implementations or fallbacks if the API key or endpoint fails.
- Do NOT import any relative modules or non-existent files. All helper functions and domain logic must be contained entirely within this single file. If accessing browser APIs (like Notification, Geolocation, localStorage), use the standard browser global objects directly (e.g. window.Notification or navigator.geolocation), do NOT write relative imports for them.
- If using try/catch, DO NOT type the catch variable as \`any\` (e.g. use \`catch (e)\` or \`catch (error)\`, NOT \`catch (e: any)\`).
- Output ONLY the raw TS code within a markdown code block. Do not include conversational text.
`;
        try {
          const aiResponse = await this.generateTextWithRetry(provider, prompt);
          const svcTs = this.extractCodeBlock(aiResponse);
          await fs.writeFile(path.join(servicesDir, `${svc.name}.ts`), svcTs);
        } catch (e: any) {
          onLog(4, `[WARN] Failed to generate service ${svc.name}: ${e.message}`);
          if (this.isDailyRateLimit(e)) throw e;
        }
      }
    }

    // === Generate hooks (with service interface injection) ===
    // Read generated service source code to inject method signatures into hook prompts
    const serviceSignatures: Record<string, string> = {};
    if (arch && arch.services.length > 0) {
      for (const svc of arch.services) {
        try {
          const svcCode = await fs.readFile(path.join(servicesDir, `${svc.name}.ts`), 'utf-8');
          serviceSignatures[svc.name] = svcCode;
        } catch { /* service file missing — skip */ }
      }
    }

    if (arch && arch.hooks.length > 0) {
      for (const hook of arch.hooks) {
        onLog(4, `[frontend-generator] Generating AI Hook: ${hook.name}...`);
        
        const servicesList = arch.services.map(s => s.name).join(', ');
        // Build service context with actual method signatures
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
- Import services using exact filenames. Example: \`import { weatherApiService } from '../services/weatherApiService'\`.
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
          await fs.writeFile(path.join(hooksDir, `${hook.name}.ts`), hookTs);
        } catch (e: any) {
          onLog(4, `[WARN] Failed to generate hook ${hook.name}: ${e.message}`);
          if (this.isDailyRateLimit(e)) throw e;
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

    if (arch && arch.pages.length > 0) {
      for (const page of arch.pages) {
        onLog(4, `[frontend-generator] Generating AI Page: ${page.componentName}...`);
        
        const hooksList = arch.hooks.map(h => h.name).join(', ');
        const componentsList = arch.components.filter(c => c.type !== 'page').map(c => c.name).join(', ');
        
        // Build context with actual hook return types and component props
        let hookContext = '';
        for (const [hookName, hookCode] of Object.entries(hookSignatures)) {
          hookContext += `\n--- Hook: ${hookName} (import { ${hookName} } from '../hooks/${hookName}') ---\n${hookCode.substring(0, 1200)}\n`;
        }
        let compContext = '';
        for (const [compName, compCode] of Object.entries(componentSignatures)) {
          compContext += `\n--- Component: ${compName} (import ${compName} from '../components/${compName}') ---\n${compCode.substring(0, 1200)}\n`;
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
- Integrate state management using the available hooks. No local mock data generators.
- Layout beautifully using Tailwind CSS.
- For icons, ONLY use 'lucide-react' with valid names: Search, Cloud, Sun, Wind, Droplets, Thermometer, MapPin, Clock, RefreshCw, Loader, AlertCircle, X, Menu, Home, Settings, Star, Eye, Trash2, Edit, Plus, Check, ArrowLeft, ArrowRight. Do NOT use FiSearch, MagnifyingGlass, or other non-lucide names. ALL icons used MUST be imported individually from 'lucide-react'. Do NOT use dynamic JSX like \`<IconMap[name] />\` or \`import * as Icons\`.
- Handle null values properly (e.g. if a string might be null, do not pass it to a string-only prop without fallback).
- Return the full React functional component as default export.
- CRITICAL: DO NOT import any external libraries except 'react', 'react-router-dom', and 'lucide-react'.
- DO NOT import 'tailwindcss/theming', 'vite-env-dots', '@transitive-bull/lucide-react', or ANY other fake libraries.
- If you need icons, import EXACTLY from 'lucide-react' (e.g. \`import { Search } from 'lucide-react'\`). Do NOT import from '@transitive-bull/lucide-react' or anything else.
- DO NOT use the React class component \`Component\`, always use functional components (\`React.FC\`).
- Output ONLY the raw TSX code within a markdown code block. Do not include conversational text.
`;
        try {
          const aiResponse = await this.generateTextWithRetry(provider, prompt);
          const pageTsx = this.extractCodeBlock(aiResponse);
          await fs.writeFile(path.join(pagesDir, `${page.componentName}.tsx`), pageTsx);
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
    await fs.writeFile(path.join(componentsDir, 'index.ts'), componentsIndex);

    // 2. Services index
    let servicesIndex = '';
    if (arch && arch.services.length > 0) {
      for (const svc of arch.services) {
        servicesIndex += `export * from './${svc.name}';\n`;
      }
    }
    await fs.writeFile(path.join(servicesDir, 'index.ts'), servicesIndex);

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

    // === App.tsx ===
    let appTsx = `import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
`;

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
        appTsx += `        <Route path="${page.route}" element={<${page.componentName} />} />\n`;
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

  private static async generateTextWithRetry(provider: any, prompt: string, maxRetries = 5, delayMs = 10000): Promise<string> {
    let lastError: any = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await provider.generateText(prompt);
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || '';
        const errStr = JSON.stringify(err) || '';

        // If daily token limit is exhausted, abort immediately — retries are pointless
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
