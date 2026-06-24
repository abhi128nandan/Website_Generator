"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseGenerator = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const relation_normalizer_1 = require("../compiler/relation-normalizer");
const env_generator_1 = require("../runtime/env-generator");
const execPromise = util_1.default.promisify(child_process_1.exec);
class DatabaseGenerator {
    static async generate(targetDir, reqs) {
        const dbDir = path_1.default.join(targetDir, 'database');
        await promises_1.default.mkdir(dbDir, { recursive: true });
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
        await promises_1.default.writeFile(path_1.default.join(dbDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        const prismaDir = path_1.default.join(dbDir, 'prisma');
        await promises_1.default.mkdir(prismaDir, { recursive: true });
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
                await env_generator_1.EnvGenerator.validateAndRepair(targetDir, reqs.appName);
                console.log('[Prisma Compiler] Bootstrapping Prisma CLI via pnpm install...');
                await execPromise('pnpm install --no-frozen-lockfile', {
                    cwd: targetDir,
                    env: { ...process.env, CI: 'true' }
                });
            }
            catch (err) {
                console.warn(`[Prisma Compiler] Early pnpm install or env validation failed: ${err.message}`);
            }
            while (!isValid && maxRetries > 0) {
                try {
                    // Entities are already normalized by the central extraction pipeline
                    const normalizedEntities = currentEntities;
                    // Internal Pre-compilation check
                    relation_normalizer_1.RelationNormalizer.validate(normalizedEntities);
                    let schemaPrismaContent = schemaPrisma + relation_normalizer_1.RelationNormalizer.render(normalizedEntities);
                    // Temporarily hardcode for validation to bypass ANY dotenv issues
                    const validationSchema = schemaPrismaContent.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url = "postgresql://postgres:postgres@localhost:5432/websiteGenerator_generated"');
                    await promises_1.default.writeFile(path_1.default.join(prismaDir, 'schema.prisma'), validationSchema);
                    // External Prisma validation directly in dbDir
                    await execPromise('npx prisma validate', { cwd: dbDir });
                    // Restore env variable after validation
                    await promises_1.default.writeFile(path_1.default.join(prismaDir, 'schema.prisma'), schemaPrismaContent);
                    isValid = true;
                }
                catch (err) {
                    lastError = err.stderr || err.message;
                    console.warn(`[Prisma Compiler] Validation failed. Retries left: ${maxRetries - 1}`);
                    console.warn(lastError);
                    maxRetries--;
                    if (maxRetries > 0) {
                        currentEntities = relation_normalizer_1.RelationNormalizer.autoRepair(currentEntities, lastError);
                    }
                }
            }
            if (!isValid) {
                console.error(`[Prisma Compiler Fatal Error]\n${lastError}`);
                throw new Error(`Prisma schema validation failed after auto-repair attempts:\n${lastError}`);
            }
        }
        else if (reqs.entities && reqs.entities.length > 0) {
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
            await promises_1.default.writeFile(path_1.default.join(prismaDir, 'schema.prisma'), schemaPrisma);
            try {
                await env_generator_1.EnvGenerator.validateAndRepair(targetDir, reqs.appName);
                console.log('[Prisma Compiler Fallback] Bootstrapping Prisma CLI via pnpm install...');
                await execPromise('pnpm install --no-frozen-lockfile', {
                    cwd: targetDir,
                    env: { ...process.env, CI: 'true' }
                });
            }
            catch (err) {
                console.warn(`[Prisma Compiler] Early pnpm install or env validation failed: ${err.message}`);
            }
            try {
                const validationSchema = schemaPrisma.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url = "postgresql://postgres:postgres@localhost:5432/websiteGenerator_generated"');
                await promises_1.default.writeFile(path_1.default.join(prismaDir, 'schema.prisma'), validationSchema);
                await execPromise('npx prisma validate', { cwd: dbDir });
                await promises_1.default.writeFile(path_1.default.join(prismaDir, 'schema.prisma'), schemaPrisma);
            }
            catch (err) {
                throw new Error(`Fallback Prisma schema validation failed:\n${err.stderr || err.message}`);
            }
        }
        else {
            await promises_1.default.writeFile(path_1.default.join(prismaDir, 'schema.prisma'), schemaPrisma);
        }
    }
}
exports.DatabaseGenerator = DatabaseGenerator;
