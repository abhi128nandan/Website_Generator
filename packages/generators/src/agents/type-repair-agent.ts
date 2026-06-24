import { ProviderFactory } from '@website-generator/ai-engine';
import { Logger } from '@website-generator/shared';
import { ASTRepairAgent } from './ast-repair-agent';

export class TypeRepairAgent {
  static async repair(targetDir: string, filePath: string, fileContent: string, errors: string[]): Promise<string | null> {
    Logger.info(`[TypeRepairAgent] Attempting to fix TypeScript errors in ${filePath} using Local Patching`);
    const provider = ProviderFactory.getProvider();
    
    const prompt = `You are an expert TypeScript Developer.
The following file has TypeScript compilation errors, type mismatches (e.g. null vs undefined), or interface violations.

File: ${filePath}

Current Content:
\`\`\`typescript
${fileContent}
\`\`\`

Reported TS Errors:
${errors.join('\n').substring(0, 1500)}

Requirements:
- Fix the TypeScript errors.
- Ensure strict null checks are satisfied.
- Do NOT add new dependencies or import non-existent files.
- Output ONLY localized SEARCH/REPLACE blocks to patch the file. Do NOT output the entire file.

Format EXACTLY as:
SEARCH:
<exact lines to replace from the Current Content>
REPLACE:
<new lines to replace them with>

Rules:
- The SEARCH block must perfectly match a continuous sequence of lines in the Current Content, including indentation and formatting.
- The REPLACE block contains the corrected code.
- You may use multiple SEARCH/REPLACE blocks if necessary.
- Do not use markdown codeblocks around the SEARCH/REPLACE operations.
- Do not output any conversational text.
`;

    try {
      const response = await provider.generateText(prompt);
      const patchedContent = ASTRepairAgent.applyPatch(fileContent, response);
      return patchedContent;
    } catch (e: any) {
      Logger.error(`[TypeRepairAgent] Failed: ${e.message}`);
      return null;
    }
  }
}
