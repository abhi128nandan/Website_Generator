import { ProviderFactory } from '@website-generator/ai-engine';
import { Logger } from '@website-generator/shared';

export class BuildRepairAgent {
  static async repair(targetDir: string, buildLog: string): Promise<string | null> {
    Logger.info(`[BuildRepairAgent] Attempting to analyze and fix build failure`);
    const provider = ProviderFactory.getProvider();
    
    const prompt = `You are a DevOps and Build System Expert.
The Vite/pnpm build has failed.

Build Log:
${buildLog.substring(buildLog.length - 3000)}

Analyze the log to determine the root cause (e.g., missing dependency, bad configuration, circular dependency).
If it requires fixing a specific file (like package.json, vite.config.ts, or a source file), provide the fix.

Format your response EXACTLY as:
FILE: path/to/file
\`\`\`
<corrected file content>
\`\`\`

If multiple files need fixing, repeat the format.
`;

    try {
      const response = await provider.generateText(prompt);
      return response; // The orchestrator will parse this
    } catch (e: any) {
      Logger.error(`[BuildRepairAgent] Failed: ${e.message}`);
      return null;
    }
  }
}
