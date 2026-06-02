import fs from 'fs/promises';
import path from 'path';

export class EnvGenerator {
  static getSlug(appName: string): string {
    return appName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'generated_app';
  }

  static async generate(targetDir: string, appName: string): Promise<void> {
    const dbSlug = 'paperclip_generated';
    const dbUrl = `postgresql://postgres:postgres@localhost:5432/${dbSlug}`;

    // 1. Write .env.example AND .env to root, database, and backend
    const envExample = [
      `DATABASE_URL=${dbUrl}`,
      'PORT=4000',
      ''
    ].join('\n');
    await fs.writeFile(path.join(targetDir, '.env.example'), envExample, 'utf-8');
    await fs.writeFile(path.join(targetDir, '.env'), envExample, 'utf-8');
    
    // Write to database directory so Prisma CLI can resolve it during execution
    try {
      await fs.mkdir(path.join(targetDir, 'database'), { recursive: true });
      await fs.writeFile(path.join(targetDir, 'database', '.env'), envExample, 'utf-8');
    } catch {}

    // Write to backend directory so the server can resolve it at runtime
    try {
      await fs.mkdir(path.join(targetDir, 'backend'), { recursive: true });
      await fs.writeFile(path.join(targetDir, 'backend', '.env'), envExample, 'utf-8');
    } catch {}

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
    await fs.writeFile(path.join(targetDir, 'docker-compose.yml'), dockerCompose, 'utf-8');
  }

  static async validateDatabaseUrl(dbUrl: string): Promise<boolean> {
    if (!dbUrl) return false;
    try {
      const parsedUrl = new URL(dbUrl);
      const isPostgres = parsedUrl.protocol === 'postgresql:' || parsedUrl.protocol === 'postgres:';
      const hasHostname = !!parsedUrl.hostname;
      const hasPort = !!parsedUrl.port;
      const hasDbName = Boolean(parsedUrl.pathname && parsedUrl.pathname.length > 1);
      
      return Boolean(isPostgres && hasHostname && hasPort && hasDbName);
    } catch {
      return false;
    }
  }

  static async validateAndRepair(targetDir: string, appName: string): Promise<void> {
    const envExamplePath = path.join(targetDir, '.env.example');
    let needsRepair = false;

    try {
      const content = await fs.readFile(envExamplePath, 'utf-8');
      const lines = content.split('\n');
      const dbUrlLine = lines.find(l => l.startsWith('DATABASE_URL='));
      
      if (!dbUrlLine) {
        needsRepair = true;
      } else {
        const url = dbUrlLine.split('=')[1]?.replace(/['"]/g, '').trim();
        const isValid = await this.validateDatabaseUrl(url);
        if (!isValid) {
          needsRepair = true;
        }
      }
    } catch {
      // file missing or unreadable
      needsRepair = true;
    }

    if (needsRepair) {
      console.log('[EnvGenerator] Invalid or missing DATABASE_URL detected. Executing auto-repair...');
      await this.generate(targetDir, appName);
    } else {
      // Ensure .env exists in all necessary locations even if .env.example was valid
      const locations = [
        path.join(targetDir, '.env'),
        path.join(targetDir, 'database', '.env'),
        path.join(targetDir, 'backend', '.env')
      ];
      
      const content = await fs.readFile(envExamplePath, 'utf-8');
      
      for (const envPath of locations) {
        try {
          await fs.access(envPath);
        } catch {
          // If it doesn't exist, make sure dir exists and write it
          try {
            await fs.mkdir(path.dirname(envPath), { recursive: true });
            await fs.writeFile(envPath, content, 'utf-8');
          } catch {}
        }
      }
    }
  }
}
