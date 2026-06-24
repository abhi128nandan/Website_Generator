import { ProviderFactory } from '@website-generator/ai-engine';
import { Logger } from '@website-generator/shared';

export class ASTRepairAgent {
  static async repair(targetDir: string, filePath: string, fileContent: string, errors: string[]): Promise<string | null> {
    Logger.info(`[ASTRepairAgent] Attempting to fix syntax/AST errors in ${filePath} using Local Patching`);
    const provider = ProviderFactory.getProvider();
    
    const prompt = `You are an expert React/TypeScript Developer and AST Fixer.
The following file has syntax errors, missing exports, missing imports, or malformed JSX.

File: ${filePath}

Current Content:
\`\`\`typescript
${fileContent}
\`\`\`

Reported Errors:
${errors.join('\n').substring(0, 1500)}

Requirements:
- Fix the syntax errors and malformed JSX.
- Fix any missing imports or missing exports.
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
      const patchedContent = this.applyPatch(fileContent, response);
      return patchedContent;
    } catch (e: any) {
      Logger.error(`[ASTRepairAgent] Failed: ${e.message}`);
      return null;
    }
  }

  static applyPatch(original: string, patch: string): string {
    let result = original;
    // Strip markdown codeblocks if the LLM wrapped the whole response
    const cleanPatch = patch.replace(/```(?:typescript|ts|javascript|js)?\n/gi, '').replace(/```/g, '');
    
    const blocks = cleanPatch.split(/SEARCH:\s*\n/g).filter(b => b.trim().length > 0);
    
    let appliedCount = 0;

    for (const block of blocks) {
      const parts = block.split(/REPLACE:\s*\n/);
      if (parts.length !== 2) continue;
      
      let searchStr = parts[0].trim();
      let replaceStr = parts[1].trimEnd();

      // Ensure consistent newlines for matching
      const normalizedResult = result.replace(/\r\n/g, '\n');

      // Create a normalized comparison layer using a flexible regex
      // 1. Escape all regex special characters
      const escapedSearch = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 2. Replace any whitespace sequence (spaces, tabs, newlines) with a flexible \s+ matcher
      // This natively normalizes indentation, repeated spaces, and collapsed blank lines
      const flexibleSearchRegex = escapedSearch.replace(/\s+/g, '\\s+');
      
      const matchRegex = new RegExp(flexibleSearchRegex);
      const match = normalizedResult.match(matchRegex);

      if (match) {
        // match[0] contains the exact original un-normalized string from the target file
        result = normalizedResult.replace(match[0], replaceStr);
        appliedCount++;
      } else {
        Logger.warn(`[ASTRepairAgent] SEARCH block did not match content after normalization.`);
      }
    }
    
    if (appliedCount === 0) {
       Logger.warn(`[ASTRepairAgent] No patches were successfully applied.`);
       // Fallback to original string if no patches applied successfully, 
       // but maybe it's better to return the original so rollback triggers safely if needed.
    }

    return result;
  }
}
