import { ProviderFactory } from '@website-generator/ai-engine';
import { Logger } from '@website-generator/shared';
import { MemoryService } from '../services/memory-service';
import { ArchitectureBlueprint } from '../generators/architecture-planner';

export class ArchitectureAnalyzer {
  static async analyzeEdit(targetDir: string, prompt: string): Promise<Partial<ArchitectureBlueprint>> {
    Logger.info(`[ArchitectureAnalyzer] Analyzing edit prompt: "${prompt}"`);
    const provider = ProviderFactory.getProvider();
    
    const memory = await MemoryService.getMemory(targetDir);
    if (!memory) {
      throw new Error('Project memory not found. Cannot perform conversational edit.');
    }

    const aiPrompt = `You are a Senior Software Architect.
The user wants to make an edit to their existing project.

Current Architecture:
\`\`\`json
${JSON.stringify(memory.architecture, null, 2)}
\`\`\`

User Request:
"${prompt}"

Determine how the architecture should change. Output ONLY a valid JSON object representing the UPDATED architecture blueprint.
Only include the fields that need to change, or the full new architecture. No markdown formatting.
`;

    const response = await provider.generateText(aiPrompt);
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleaned);
  }
}
