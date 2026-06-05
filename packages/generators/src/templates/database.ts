import { NormalizedRequirements } from '@paperclip/shared';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { RelationNormalizer } from '../compiler/relation-normalizer';
import { EnvGenerator } from '../runtime/env-generator';

const execPromise = util.promisify(exec);


export class DatabaseGenerator {
  static async generate(targetDir: string, reqs: NormalizedRequirements): Promise<void> {
    const dbDir = path.join(targetDir, 'database');
    await fs.mkdir(dbDir, { recursive: true });

    const packageJson = {
      name: 'database',
      private: true,
      version: '0.0.0',
      scripts: {
        generate: 'prisma generate',
        push: 'prisma db push'
      },
      dependencies: {
        '@prisma/client': '^5.22.0',
        dotenv: '^16.4.5'
      },
      devDependencies: {
        prisma: '^5.22.0'
      }
    };
    await fs.writeFile(path.join(dbDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    const prismaDir = path.join(dbDir, 'prisma');
    await fs.mkdir(prismaDir, { recursive: true });

    let schemaPrisma = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
`;

    if (reqs.architecture && reqs.architecture.entities.length > 0) {
      let currentEntities = reqs.architecture.entities;
      let maxRetries = 3;
      let isValid = false;
      let lastError = '';

      try {
        await EnvGenerator.validateAndRepair(targetDir, reqs.appName);
        console.log('[Prisma Compiler] Bootstrapping Prisma CLI via pnpm install...');
        await execPromise('pnpm install --no-frozen-lockfile', { 
          cwd: targetDir, 
          env: { ...process.env, CI: 'true' } 
        });
      } catch (err: any) {
        console.warn(`[Prisma Compiler] Early pnpm install or env validation failed: ${err.message}`);
      }

      while (!isValid && maxRetries > 0) {
        try {
          // Entities are already normalized by the central extraction pipeline
          const normalizedEntities = currentEntities;
          
          // Internal Pre-compilation check
          RelationNormalizer.validate(normalizedEntities);
          
          let schemaPrismaContent = schemaPrisma + RelationNormalizer.render(normalizedEntities);
          
          // Temporarily hardcode for validation to bypass ANY dotenv issues
          const validationSchema = schemaPrismaContent.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url = "postgresql://postgres:postgres@localhost:5432/paperclip_generated"');
          await fs.writeFile(path.join(prismaDir, 'schema.prisma'), validationSchema);

          // External Prisma validation directly in dbDir
          await execPromise('npx prisma validate', { cwd: dbDir });
          
          // Restore env variable after validation
          await fs.writeFile(path.join(prismaDir, 'schema.prisma'), schemaPrismaContent);
          
          isValid = true;
        } catch (err: any) {
          lastError = err.stderr || err.message;
          console.warn(`[Prisma Compiler] Validation failed. Retries left: ${maxRetries - 1}`);
          console.warn(lastError);
          maxRetries--;
          
          if (maxRetries > 0) {
            currentEntities = RelationNormalizer.autoRepair(currentEntities, lastError);
          }
        }
      }

      if (!isValid) {
        console.error(`[Prisma Compiler Fatal Error]\n${lastError}`);
        throw new Error(`Prisma schema validation failed after auto-repair attempts:\n${lastError}`);
      }
    } else if (reqs.entities && reqs.entities.length > 0) {
      reqs.entities.forEach(entity => {
        // Fallback schema
        const modelName = entity.replace(/[^a-zA-Z0-9]/g, '');
        if (modelName) {
          schemaPrisma += `\nmodel ${modelName} {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}\n`;
        }
      });
      await fs.writeFile(path.join(prismaDir, 'schema.prisma'), schemaPrisma);
      
      try {
        await EnvGenerator.validateAndRepair(targetDir, reqs.appName);
        console.log('[Prisma Compiler Fallback] Bootstrapping Prisma CLI via pnpm install...');
        await execPromise('pnpm install --no-frozen-lockfile', { 
          cwd: targetDir, 
          env: { ...process.env, CI: 'true' } 
        });
      } catch (err: any) {
        console.warn(`[Prisma Compiler] Early pnpm install or env validation failed: ${err.message}`);
      }

      try {
        const validationSchema = schemaPrisma.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url = "postgresql://postgres:postgres@localhost:5432/paperclip_generated"');
        await fs.writeFile(path.join(prismaDir, 'schema.prisma'), validationSchema);
        
        await execPromise('npx prisma validate', { cwd: dbDir });
        
        await fs.writeFile(path.join(prismaDir, 'schema.prisma'), schemaPrisma);
      } catch (err: any) {
        throw new Error(`Fallback Prisma schema validation failed:\n${err.stderr || err.message}`);
      }
    } else {
      await fs.writeFile(path.join(prismaDir, 'schema.prisma'), schemaPrisma);
    }
  }
}
