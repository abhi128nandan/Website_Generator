import { NormalizedRequirements, CrudArchitectureSchema, Logger } from '@paperclip/shared';
import { ProviderFactory } from '@paperclip/ai-engine';

export class CrudGenerator {
  static async analyze(reqs: NormalizedRequirements): Promise<void> {
    try {
      const provider = ProviderFactory.getProvider();
      
      const prompt = `You are a Senior Software Architect.
Analyze the following application requirements and output a deterministic JSON AST representing the system's CRUD architecture.
You MUST output ONLY a valid JSON object matching the following structure exactly. Do not output markdown code blocks or any conversational text.

Structure:
{
  "entities": [
    {
      "name": "string (PascalCase, e.g. User, Task)",
      "fields": [
        {
          "name": "string (camelCase)",
          "type": "String" | "Int" | "Float" | "Boolean" | "DateTime",
          "isRequired": boolean,
          "isId": boolean (optional, use for primary keys),
          "isUnique": boolean (optional),
          "isRelation": boolean (optional),
          "relationTarget": "string (PascalCase entity name, optional)"
        }
      ]
    }
  ],
  "endpoints": [
    {
      "path": "string (e.g. /api/users)",
      "method": "GET" | "POST" | "PUT" | "DELETE",
      "entity": "string (entity name, optional)",
      "description": "string",
      "businessLogic": "string (detailed pseudo-code or functional rules for this endpoint)"
    }
  ],
  "pages": [
    {
      "route": "string (e.g. /users)",
      "componentName": "string (PascalCase)",
      "entity": "string (entity name, optional)",
      "description": "string",
      "features": ["string (list of functional features this page implements)"],
      "isDashboard": boolean (optional)
    }
  ],
  "navigation": [
    {
      "label": "string",
      "route": "string"
    }
  ]
}

Application Context:
App Name: ${reqs.appName}
App Type: ${reqs.appType}
Features: ${reqs.features.join(', ')}
Workflows: ${reqs.workflows?.join(', ') || ''}
Identified Entities: ${reqs.entities.join(', ')}

Ensure that you provide standard ID fields (id: String, isId: true) and timestamps (createdAt, updatedAt) for every entity.
Generate standard CRUD REST API endpoints AND custom endpoints containing business logic for the specific workflows.
Generate functional pages linked to these workflows (e.g., Dashboard, Logs, Analytics). Do not just list simple CRUD pages.`;

      Logger.info(`[CrudGenerator] Executing AI architecture analysis...`);
      const responseText = await provider.generateJSON(prompt);
      
      const start = responseText.indexOf('{');
      const end = responseText.lastIndexOf('}');
      if (start === -1 || end === -1 || end < start) {
        throw new Error('No JSON object found in response');
      }
      const jsonString = responseText.substring(start, end + 1);
      
      const parsed = JSON.parse(jsonString);
      const architecture = CrudArchitectureSchema.parse(parsed);
      
      reqs.architecture = architecture;
      Logger.info(`[CrudGenerator] AI analysis complete. Discovered ${architecture.entities.length} entities, ${architecture.endpoints.length} endpoints, and ${architecture.pages.length} pages.`);
    } catch (err: any) {
      Logger.error(`[CrudGenerator] Failed to analyze CRUD architecture: ${err.message}`);
      // Don't fail the entire scaffold if AI fails, just log and continue without architecture
    }
  }
}
