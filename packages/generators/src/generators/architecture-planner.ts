import { ProviderFactory } from '@website-generator/ai-engine';
import { Logger, NormalizedRequirements } from '@website-generator/shared';
import fs from 'fs/promises';
import path from 'path';

export interface ArchitectureBlueprint {
  appType: string;
  pages: (string | { name: string; route?: string; isProtected?: boolean; allowedRoles?: string[] })[];
  entities: string[];
  apis: string[];
  designTokens: {
    primaryColor: string;
    layout: string;
  };
}

export class ArchitecturePlanner {
  static async plan(
    srsText: string,
    reqs: NormalizedRequirements,
    targetDir: string,
    onLog: (step: number, message: string) => void
  ): Promise<ArchitectureBlueprint> {
    onLog(2, '[planner] Analyzing requirements to generate central Architecture Blueprint...');
    
    const provider = ProviderFactory.getProvider();
    
    const prompt = `You are a Senior Staff Software Architect.
Your job is to read the Software Requirements Specification (SRS) and output a strict JSON blueprint.
This blueprint will be the single source of truth for all downstream code generators to prevent inconsistencies.

SRS Text:
${srsText.substring(0, 3000)}

Classified Mode: ${reqs.classifiedMode}

Output ONLY valid JSON matching this exact structure, with no markdown formatting or extra text:
{
  "appType": "e.g. crud-admin, saas-dashboard, portfolio",
  "pages": [
    "Dashboard",
    { "name": "Settings", "isProtected": true },
    { "name": "AdminPortal", "isProtected": true, "allowedRoles": ["ADMIN", "SUPER_ADMIN"] }
  ],
  "entities": ["User", "Post", "Comment"],
  "apis": ["GET /api/users", "POST /api/posts"],
  "designTokens": {
    "primaryColor": "#000000",
    "layout": "sidebar"
  }
}
`;

    let attempt = 1;
    while (attempt <= 3) {
      try {
        const response = await provider.generateText(prompt);
        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const blueprint: ArchitectureBlueprint = JSON.parse(cleaned);
        
        // Write the blueprint to the target directory
        const blueprintPath = path.join(targetDir, 'architecture.json');
        await fs.writeFile(blueprintPath, JSON.stringify(blueprint, null, 2), 'utf-8');
        
        onLog(2, `[planner] Blueprint generated: ${blueprint.pages.length} pages, ${blueprint.entities.length} entities, ${blueprint.apis.length} APIs.`);
        
        return blueprint;
      } catch (e: any) {
        Logger.warn(`[planner] Attempt ${attempt} failed to generate valid JSON blueprint: ${e.message}`);
        attempt++;
      }
    }

    throw new Error('Failed to generate a valid Architecture Blueprint after 3 attempts.');
  }
}
