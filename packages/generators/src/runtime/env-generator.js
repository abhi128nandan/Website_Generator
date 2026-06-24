"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvGenerator = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class EnvGenerator {
    static getSlug(appName) {
        return appName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'generated_app';
    }
    static async generate(targetDir, appName) {
        const dbSlug = 'websiteGenerator_generated';
        const dbUrl = `postgresql://postgres:postgres@localhost:5432/${dbSlug}`;
        // 1. Write .env.example AND .env to root, database, and backend
        const envExample = [
            `DATABASE_URL=${dbUrl}`,
            'PORT=4000',
            ''
        ].join('\n');
        await promises_1.default.writeFile(path_1.default.join(targetDir, '.env.example'), envExample, 'utf-8');
        await promises_1.default.writeFile(path_1.default.join(targetDir, '.env'), envExample, 'utf-8');
        // Write to database directory so Prisma CLI can resolve it during execution
        try {
            await promises_1.default.mkdir(path_1.default.join(targetDir, 'database'), { recursive: true });
            await promises_1.default.writeFile(path_1.default.join(targetDir, 'database', '.env'), envExample, 'utf-8');
        }
        catch { }
        // Write to backend directory so the server can resolve it at runtime
        try {
            await promises_1.default.mkdir(path_1.default.join(targetDir, 'backend'), { recursive: true });
            await promises_1.default.writeFile(path_1.default.join(targetDir, 'backend', '.env'), envExample, 'utf-8');
        }
        catch { }
        // 2. Write docker-compose.yml
        const dockerCompose = `version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${dbSlug}
    ports:
      - "5432:5432"
`;
        await promises_1.default.writeFile(path_1.default.join(targetDir, 'docker-compose.yml'), dockerCompose, 'utf-8');
    }
    static async validateDatabaseUrl(dbUrl) {
        if (!dbUrl)
            return false;
        try {
            const parsedUrl = new URL(dbUrl);
            const isPostgres = parsedUrl.protocol === 'postgresql:' || parsedUrl.protocol === 'postgres:';
            const hasHostname = !!parsedUrl.hostname;
            const hasPort = !!parsedUrl.port;
            const hasDbName = Boolean(parsedUrl.pathname && parsedUrl.pathname.length > 1);
            return Boolean(isPostgres && hasHostname && hasPort && hasDbName);
        }
        catch {
            return false;
        }
    }
    static async validateAndRepair(targetDir, appName) {
        const envExamplePath = path_1.default.join(targetDir, '.env.example');
        let needsRepair = false;
        try {
            const content = await promises_1.default.readFile(envExamplePath, 'utf-8');
            const lines = content.split('\n');
            const dbUrlLine = lines.find(l => l.startsWith('DATABASE_URL='));
            if (!dbUrlLine) {
                needsRepair = true;
            }
            else {
                const url = dbUrlLine.split('=')[1]?.replace(/['"]/g, '').trim();
                const isValid = await this.validateDatabaseUrl(url);
                if (!isValid) {
                    needsRepair = true;
                }
            }
        }
        catch {
            // file missing or unreadable
            needsRepair = true;
        }
        if (needsRepair) {
            console.log('[EnvGenerator] Invalid or missing DATABASE_URL detected. Executing auto-repair...');
            await this.generate(targetDir, appName);
        }
        else {
            // Ensure .env exists in all necessary locations even if .env.example was valid
            const locations = [
                path_1.default.join(targetDir, '.env'),
                path_1.default.join(targetDir, 'database', '.env'),
                path_1.default.join(targetDir, 'backend', '.env')
            ];
            const content = await promises_1.default.readFile(envExamplePath, 'utf-8');
            for (const envPath of locations) {
                try {
                    await promises_1.default.access(envPath);
                }
                catch {
                    // If it doesn't exist, make sure dir exists and write it
                    try {
                        await promises_1.default.mkdir(path_1.default.dirname(envPath), { recursive: true });
                        await promises_1.default.writeFile(envPath, content, 'utf-8');
                    }
                    catch { }
                }
            }
        }
    }
}
exports.EnvGenerator = EnvGenerator;
