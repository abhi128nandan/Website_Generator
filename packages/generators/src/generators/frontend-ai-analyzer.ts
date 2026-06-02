import { NormalizedRequirements, FrontendArchitectureSchema, FrontendArchitecture, Logger } from '@paperclip/shared';
import { ProviderFactory } from '@paperclip/ai-engine';

/**
 * AI-powered frontend architecture analyzer.
 *
 * Analogous to CrudGenerator.analyze() but produces a FrontendArchitecture
 * (components, services, hooks, pages) instead of CRUD entities/endpoints.
 */
export class FrontendAIAnalyzer {
  static async analyze(reqs: NormalizedRequirements): Promise<void> {
    try {
      const provider = ProviderFactory.getProvider();

      const prompt = `You are a Senior Frontend Architect.
Analyze the following application requirements and output a deterministic JSON structure representing the frontend-only architecture.
You MUST output ONLY a valid JSON object matching the following structure exactly. Do not output markdown code blocks or any conversational text.

Structure:
{
  "components": [
    {
      "name": "string (PascalCase, e.g. SearchBar, WeatherCard)",
      "type": "page" | "component" | "layout",
      "description": "string describing what this component renders"
    }
  ],
  "services": [
    {
      "name": "string (camelCase, e.g. weatherApi, geolocationService)",
      "description": "string describing what this service does",
      "externalApi": "string (optional — name of the external API, e.g. OpenWeatherMap, PokeAPI. If none, omit this field entirely or use empty string. DO NOT USE null.)"
    }
  ],
  "hooks": [
    {
      "name": "string (camelCase with 'use' prefix, e.g. useWeather, useLocalStorage)",
      "description": "string describing what this hook manages"
    }
  ],
  "pages": [
    {
      "route": "string (e.g. /, /about, /settings)",
      "componentName": "string (PascalCase page component name)",
      "description": "string describing what this page shows"
    }
  ]
}

Application Context:
App Name: ${reqs.appName}
App Type: ${reqs.appType}
Features: ${reqs.features.join(', ')}

Rules:
- This is a FRONTEND-ONLY app. No database, no Prisma, no backend CRUD.
- Components should be reusable and focused on UI rendering.
- Services should handle external API calls, localStorage, or browser APIs.
- Hooks should manage stateful logic (fetching, local storage, geolocation, etc).
- Generate at least one page component and one service.
- Use modern React patterns (functional components, hooks, async/await).
- Consider responsive design, loading states, error handling, and user experience.`;

      Logger.info('[FrontendAIAnalyzer] Executing AI frontend architecture analysis...');
      const responseText = await provider.generateJSON(prompt);

      const start = responseText.indexOf('{');
      const end = responseText.lastIndexOf('}');
      if (start === -1 || end === -1 || end < start) {
        throw new Error('No JSON object found in AI response');
      }
      const jsonString = responseText.substring(start, end + 1);

      const parsed = JSON.parse(jsonString);
      const architecture = FrontendArchitectureSchema.parse(parsed);

      reqs.frontendArchitecture = architecture;
      Logger.info(`[FrontendAIAnalyzer] AI analysis complete. Discovered ${architecture.components.length} components, ${architecture.services.length} services, ${architecture.hooks.length} hooks, and ${architecture.pages.length} pages.`);
    } catch (err: any) {
      Logger.error(`[FrontendAIAnalyzer] Failed to analyze frontend architecture: ${err.message}`);
      // Provide a minimal fallback architecture so generation can continue
      reqs.frontendArchitecture = {
        components: [
          { name: 'Header', type: 'layout', description: 'Application header with navigation' },
          { name: 'MainContent', type: 'component', description: 'Primary content area' },
        ],
        services: [],
        hooks: [],
        pages: [
          { route: '/', componentName: 'Home', description: 'Main application page' },
        ],
      };
      Logger.warn('[FrontendAIAnalyzer] Using minimal fallback architecture.');
    }
  }
}
