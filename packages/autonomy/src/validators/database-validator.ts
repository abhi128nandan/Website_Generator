import fs from 'fs/promises';
import path from 'path';

export class DatabaseValidator {
  static async validatePrismaSchema(projectRoot: string): Promise<boolean> {
    try {
      const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
      const content = await fs.readFile(schemaPath, 'utf-8');
      
      // Basic validation
      return content.includes('generator client') && content.includes('datasource db');
    } catch {
      return false;
    }
  }

  static async validateEnvUrl(projectRoot: string): Promise<boolean> {
    try {
      const envPath = path.join(projectRoot, '.env');
      const content = await fs.readFile(envPath, 'utf-8');
      
      const match = content.match(/DATABASE_URL="([^"]+)"/);
      if (!match) return false;
      
      const url = match[1];
      return url.startsWith('postgresql://') || url.startsWith('postgres://');
    } catch {
      return false;
    }
  }
}
