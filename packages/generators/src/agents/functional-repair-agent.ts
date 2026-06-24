import { ProviderFactory } from '@website-generator/ai-engine';
import { Logger } from '@website-generator/shared';

export class FunctionalRepairAgent {
  static async repair(targetDir: string, filePath: string, fileContent: string, errors: string[]): Promise<string | null> {
    Logger.info(`[FunctionalRepairAgent] Attempting to fix functional/business logic errors in ${filePath}`);
    const provider = ProviderFactory.getProvider();
    
    const prompt = `You are a Senior Product Engineer.
The following file is missing required business logic, forms, handlers, or routes.

File: ${filePath}

Current Content:
\`\`\`typescript
${fileContent}
\`\`\`

Reported QA/Functional Failures:
${errors.join('\n').substring(0, 1500)}

Requirements:
- Implement the missing business logic, handlers, or forms.
- Ensure state management and API calls are correctly wired up.
- Output ONLY the raw corrected TS/TSX code within a markdown code block. Do not include conversational text.
`;

    try {
      const response = await provider.generateText(prompt);
      const codeMatch = response.match(/```[a-z]*\n([\s\S]*?)```/);
      return codeMatch ? codeMatch[1].trim() : response.trim();
    } catch (e: any) {
      Logger.error(`[FunctionalRepairAgent] Failed: ${e.message}`);
      return null;
    }
  }
}
