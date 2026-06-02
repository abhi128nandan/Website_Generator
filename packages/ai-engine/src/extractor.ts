import { Logger, RequirementsSchema, NormalizedRequirements } from '@paperclip/shared';
import { ProviderFactory, BaseLLMProvider } from './providers';

export class RequirementExtractor {
  async extractRequirements(rawText: string, maxRetries = 3): Promise<NormalizedRequirements> {
    const provider = ProviderFactory.getProvider();
    const prompt = this.buildPrompt(rawText);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        Logger.info(`Extracting requirements using ${provider.constructor.name} (Attempt ${attempt}/${maxRetries})...`);
        
        // Use the provider's generateJSON which asks for JSON output deterministically
        const responseText = await provider.generateJSON(prompt);
        
        const jsonString = this.extractJson(responseText);
        const parsed = JSON.parse(jsonString);
        
        // Validate with Zod
        const validated = RequirementsSchema.parse(parsed);
        Logger.info('Successfully extracted and validated requirements');
        return validated;
      } catch (err: any) {
        Logger.error(`Extraction attempt ${attempt} failed: ${err.message}`);
        
        // If it's an API key issue, fail immediately instead of retrying
        if (err.message.includes('Invalid API Key') || err.message.includes('Provider Error')) {
          throw new Error(err.message);
        }

        if (attempt === maxRetries) {
          throw new Error(`Failed to extract requirements after ${maxRetries} attempts.`);
        }
        // exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error('Unreachable');
  }

  private buildPrompt(rawText: string): string {
    return `You are a strict requirement extraction system.
Analyze the following Software Requirement Specification (SRS) and extract the system architecture.
You MUST output ONLY a valid JSON object matching the following structure exactly. Do not output markdown code blocks or any conversational text.

Structure:
{
  "appName": "string (Invent a name if not specified, DO NOT leave empty)",
  "appType": "string (e.g. crud-admin, frontend-app, DO NOT leave empty)",
  "frontend": ["string"],
  "backend": ["string"],
  "database": ["string"],
  "features": ["string (Must contain at least one feature)"],
  "workflows": ["string"],
  "entities": ["string"],
  "routes": ["string"]
}

SRS Content:
${rawText}
`;
  }

  private extractJson(text: string): string {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
      throw new Error('No JSON object found in response');
    }
    return text.substring(start, end + 1);
  }
}

