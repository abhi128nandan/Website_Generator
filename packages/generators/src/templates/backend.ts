import { NormalizedRequirements } from '@paperclip/shared';
import fs from 'fs/promises';
import path from 'path';
import { normalizeExpressPath } from '../compiler/path-normalizer';

export class BackendGenerator {
  static async generate(targetDir: string, reqs: NormalizedRequirements): Promise<void> {
    const backendDir = path.join(targetDir, 'backend');
    await fs.mkdir(backendDir, { recursive: true });

    // Express + TS scaffold
    const packageJson = {
      name: 'backend',
      private: true,
      version: '0.0.0',
      scripts: {
        dev: 'ts-node-dev src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js'
      },
      dependencies: {
        '@prisma/client': '^5.22.0',
        cors: '^2.8.5',
        dotenv: '^16.4.5',
        express: '^4.19.2'
      },
      devDependencies: {
        '@types/cors': '^2.8.17',
        '@types/express': '^4.17.21',
        '@types/node': '^20.14.9',
        'ts-node-dev': '^2.0.0',
        typescript: '^5.5.3'
      }
    };
    await fs.writeFile(path.join(backendDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    const tsconfig = {
      compilerOptions: {
        target: 'es2022',
        module: 'commonjs',
        rootDir: './src',
        outDir: './dist',
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        strict: true,
        skipLibCheck: true
      },
      include: ['src/**/*']
    };
    await fs.writeFile(path.join(backendDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

    // Basic src
    const srcDir = path.join(backendDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    let indexTs = `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', appName: '${reqs.appName}' });
});

`;

    if (reqs.architecture && reqs.architecture.endpoints && reqs.architecture.endpoints.length > 0) {
      // Generate Custom Endpoints
      const endpointsByEntity: Record<string, any[]> = {};
      const customEndpoints: any[] = [];
      
      reqs.architecture.endpoints.forEach(ep => {
        if (ep.entity) {
          if (!endpointsByEntity[ep.entity]) endpointsByEntity[ep.entity] = [];
          endpointsByEntity[ep.entity].push(ep);
        } else {
          customEndpoints.push(ep);
        }
      });

      // Grouped Endpoints
      Object.keys(endpointsByEntity).forEach(entityName => {
        indexTs += `\n// --- Endpoints for ${entityName} ---\n`;
        endpointsByEntity[entityName].forEach(ep => {
          const normalizedPath = normalizeExpressPath(ep.path);
          indexTs += `
app.${ep.method.toLowerCase()}('${normalizedPath}', async (req, res) => {
  try {
    // Description: ${ep.description}
    // Business Logic: ${ep.businessLogic || 'Standard CRUD operation'}
    `;
          
          if (ep.method === 'GET' && normalizedPath.includes('/:id')) {
             indexTs += `const data = await prisma.${entityName.charAt(0).toLowerCase() + entityName.slice(1)}.findUnique({ where: { id: req.params.id } });\n    res.json(data);`;
          } else if (ep.method === 'GET') {
             indexTs += `const data = await prisma.${entityName.charAt(0).toLowerCase() + entityName.slice(1)}.findMany();\n    res.json(data);`;
          } else if (ep.method === 'POST') {
             indexTs += `const data = await prisma.${entityName.charAt(0).toLowerCase() + entityName.slice(1)}.create({ data: req.body });\n    res.status(201).json(data);`;
          } else if (ep.method === 'PUT') {
             indexTs += `const data = await prisma.${entityName.charAt(0).toLowerCase() + entityName.slice(1)}.update({ where: { id: req.params.id }, data: req.body });\n    res.json(data);`;
          } else if (ep.method === 'DELETE') {
             indexTs += `await prisma.${entityName.charAt(0).toLowerCase() + entityName.slice(1)}.delete({ where: { id: req.params.id } });\n    res.status(204).send();`;
          } else {
             indexTs += `res.json({ message: 'Not implemented' });`;
          }

          indexTs += `
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
`;
        });
      });

      // Global Custom Endpoints
      if (customEndpoints.length > 0) {
        indexTs += `\n// --- Custom Business Logic Endpoints ---\n`;
        customEndpoints.forEach(ep => {
          const normalizedPath = normalizeExpressPath(ep.path);
          indexTs += `
app.${ep.method.toLowerCase()}('${normalizedPath}', async (req, res) => {
  try {
    // Description: ${ep.description}
    // Business Logic: ${ep.businessLogic || 'Perform custom calculations'}
    // TODO: Implement generated business logic dynamically
    res.json({ message: 'Custom endpoint ${normalizedPath} executed successfully', logic: '${ep.businessLogic}' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
`;
        });
      }

    } else {
      indexTs += `${reqs.routes.map(r => `app.use('/api${r.startsWith('/') ? r : `/${r}`}', (req, res) => res.json({ message: 'Route ${r} pending implementation' }));`).join('\n')}\n`;
    }

    indexTs += `
app.listen(port, () => {
  console.log(\`Server is running on port \${port}\`);
});
`;
    await fs.writeFile(path.join(srcDir, 'index.ts'), indexTs);
  }
}
