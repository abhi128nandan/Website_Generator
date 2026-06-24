"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootWorkspaceGenerator = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class RootWorkspaceGenerator {
    static async generate(targetDir, projectName, appType, features) {
        // Ensure target directory exists first
        await promises_1.default.mkdir(targetDir, { recursive: true });
        const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'generated-app';
        // 1. Root package.json
        const rootPackageJson = {
            name: slug,
            private: true,
            version: '0.0.0',
            workspaces: [
                'frontend',
                'backend',
                'database'
            ],
            scripts: {
                dev: 'concurrently "pnpm --dir backend dev" "pnpm --dir frontend dev"',
                build: 'pnpm -r build'
            },
            devDependencies: {
                concurrently: '^9.0.0',
                prisma: '^5.22.0',
                typescript: '^5.5.3'
            }
        };
        await promises_1.default.writeFile(path_1.default.join(targetDir, 'package.json'), JSON.stringify(rootPackageJson, null, 2), 'utf-8');
        // 2. pnpm-workspace.yaml
        const pnpmWorkspace = [
            'packages:',
            '  - frontend',
            '  - backend',
            '  - database',
            ''
        ].join('\n');
        await promises_1.default.writeFile(path_1.default.join(targetDir, 'pnpm-workspace.yaml'), pnpmWorkspace, 'utf-8');
        // 3. .npmrc — prevents pnpm from resolving any parent workspace
        const npmrc = [
            'auto-install-peers=true',
            'strict-peer-dependencies=false',
            ''
        ].join('\n');
        await promises_1.default.writeFile(path_1.default.join(targetDir, '.npmrc'), npmrc, 'utf-8');
        // 4. .gitignore
        const gitignore = [
            'node_modules',
            'dist',
            '.env',
            '.next',
            'coverage',
            '.prisma',
            'generated',
            ''
        ].join('\n');
        await promises_1.default.writeFile(path_1.default.join(targetDir, '.gitignore'), gitignore, 'utf-8');
        // 5. README.md
        const readme = `# ${projectName}
Type: ${appType}

## Features
${features.map(f => `- ${f}`).join('\n')}

## Architecture
This is a **standalone pnpm workspace** project.
The database connects to the central Website Generator PostgreSQL instance.

## Prerequisites
- Node.js >= 18
- pnpm >= 9
- PostgreSQL running on localhost:5432

## Getting Started

\`\`\`bash
# 1. Install all dependencies from the project root
pnpm install

# 2. Copy environment config
cp .env.example .env

# 3. Generate Prisma client and push schema
pnpm --filter database run generate
pnpm --filter database run push

# 4. Start development servers
pnpm run dev
\`\`\`

## Services
| Service  | Port | Command |
|----------|------|---------|
| Frontend | 5173 | \`pnpm --filter frontend run dev\` |
| Backend  | 4000 | \`pnpm --filter backend run dev\` |

## Prisma Commands
\`\`\`bash
# Generate Prisma client
pnpm --filter database run generate

# Push schema to database
pnpm --filter database run push
\`\`\`

## Standalone Usage
This project is a fully standalone pnpm workspace.
You can copy it anywhere and run it independently — no parent monorepo required.
`;
        await promises_1.default.writeFile(path_1.default.join(targetDir, 'README.md'), readme, 'utf-8');
    }
    /**
     * Validate that all critical root files were written successfully.
     * Throws an error if any are missing.
     */
    static async validate(targetDir) {
        const requiredFiles = [
            'package.json',
            'pnpm-workspace.yaml',
            '.npmrc',
            '.gitignore',
            '.env.example',
            'README.md',
        ];
        const missing = [];
        for (const file of requiredFiles) {
            try {
                await promises_1.default.access(path_1.default.join(targetDir, file));
            }
            catch {
                missing.push(file);
            }
        }
        if (missing.length > 0) {
            throw new Error(`Root workspace generation failed. Missing files: ${missing.join(', ')}`);
        }
    }
}
exports.RootWorkspaceGenerator = RootWorkspaceGenerator;
