import { Logger } from '@website-generator/shared';

export class PlaceholderValidator {
  static audit(code: string): void {
    PlaceholderBusinessLogicValidator.audit(code);
  }

  static async validate(targetDir: string): Promise<{isValid: boolean, errors: any[]}> {
    const errors: any[] = [];
    const fs = require('fs').promises;
    const path = require('path');
    
    const scanDir = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            const code = await fs.readFile(fullPath, 'utf8');
            try {
              PlaceholderBusinessLogicValidator.audit(code);
            } catch (e: any) {
              errors.push({
                file: fullPath,
                message: e.message,
                line: 1
              });
            }
          }
        }
      } catch (e) {}
    };
    
    await scanDir(targetDir);
    return { isValid: errors.length === 0, errors };
  }
}

export class PlaceholderBusinessLogicValidator {
  private static readonly FORBIDDEN_PATTERNS = [
    /TODO/i,
    /FIXME/i,
    /Business Logic:/i,
    /Validation goes here/i,
    /Implement logic/i,
    /Placeholder/i,
    /implement later/i,
    /\/\/ Validate /i,
    /\/\/ Apply filters/i,
    /\/\/ Check permissions/i
  ];

  static audit(code: string): void {
    if (!code || typeof code !== 'string') return;

    for (const pattern of this.FORBIDDEN_PATTERNS) {
      const match = code.match(pattern);
      if (match) {
        Logger.warn(`[PlaceholderValidator] Code contains forbidden placeholder pattern: ${pattern}`);
        throw new Error(`CRITICAL VALIDATION FAILURE: Your code contains a forbidden placeholder ('${match[0]}'). You MUST write actual executable business logic (e.g., Zod schemas, React state error handling, Prisma where clauses). Do not leave pseudo-code or comments.`);
      }
    }
    
    // Check for conspicuously empty handlers that should contain logic
    // We shouldn't fail on perfectly normal empty interfaces, so we have to be careful
    const emptyHandlers = [
      /onSubmit=\{?\s*(?:async\s*)?(?:\([^)]*\)|[^=]*)\s*=>\s*\{\s*\}?\}?/g,
      /onClick=\{?\s*(?:async\s*)?(?:\([^)]*\)|[^=]*)\s*=>\s*\{\s*\}?\}?/g,
      /app\.(?:post|put|delete|patch)\([^,]+,\s*(?:async\s*)?(?:req,\s*res)\s*=>\s*\{\s*\}/gi
    ];

    for (const pattern of emptyHandlers) {
      if (pattern.test(code)) {
        Logger.warn(`[PlaceholderValidator] Code contains empty executable handlers.`);
        throw new Error(`CRITICAL VALIDATION FAILURE: Your code contains empty handlers (e.g., empty onSubmit, onClick, or Express route). You MUST provide actual executable functionality. Implement the mutation or state change.`);
      }
    }
  }
}
