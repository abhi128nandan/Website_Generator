import { NormalizedRequirements, FrontendArchitectureSchema, FrontendArchitecture, Logger } from '@website-generator/shared';
import { ProviderFactory } from '@website-generator/ai-engine';
import { GeneratorObservability } from '../observability/observability-layer';
import { RequirementIntelligence } from '../analysis/requirement-intelligence';
import { FrontendComplexityGuard } from '../validators/frontend-complexity-guard';

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

      // Requirement-driven complexity analysis (replaces keyword-based budgets)
      const profile = RequirementIntelligence.analyze(reqs);
      const budget = RequirementIntelligence.toBudget(profile);
      Logger.info(`[FrontendAIAnalyzer] Requirement profile: complexity=${profile.complexity}, ui=${profile.uiComplexity}, state=${profile.stateComplexity}, backend=${profile.requiresBackend}, db=${profile.requiresDatabase}, auth=${profile.requiresAuthentication}`);

      const blueprint = (reqs as any).blueprint;
      let blueprintContext = '';
      if (blueprint) {
        const pageNames = (blueprint.pages || []).map((p: any) => typeof p === 'string' ? p : p.name);
        blueprintContext = `
Authoritative Business Context:
Pages: ${pageNames.join(', ')}
Entities: ${(blueprint.entities || []).join(', ')}
APIs: ${(blueprint.apis || []).join(', ')}

Use the following business blueprint as authoritative context.
Do not invent conflicting pages.
Do not invent conflicting entities.
Do not invent conflicting API domains.
Physical React architecture may extend this blueprint but must remain consistent with it.
`;
      }

      let prompt = `You are a Senior Frontend Architect.
Analyze the following application requirements and output a deterministic JSON structure representing the frontend-only architecture.
You MUST output ONLY a valid JSON object matching the following structure exactly. Do not output markdown code blocks or any conversational text.
${blueprintContext}
Structure:
{
  "complexityScore": "simple" | "medium" | "complex",
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
      "externalApi": "string (optional — name of the external API, e.g. OpenWeatherMap, PokeAPI. If none, omit this field entirely or use empty string. DO NOT USE null.)",
      "endpoints": [
        {
          "method": "GET | POST | PUT | PATCH | DELETE",
          "path": "string (e.g. /api/users)",
          "description": "string describing what this endpoint does"
        }
      ]
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
      "description": "string describing what this page shows",
      "isProtected": "boolean (optional, true if access is restricted to authenticated users. Default is false)",
      "allowedRoles": "array of strings (optional, e.g. ['USER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']. Omit or use empty array if any authenticated user can access)"
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
- Generate at least one page component.
- Use modern React patterns (functional components, hooks, async/await).
- Consider responsive design, loading states, error handling, and user experience.
- If 'Authoritative Business Context' contains APIs, you MUST map those explicit endpoints into the corresponding service.endpoints array.

STRICT ARCHITECTURE BUDGET:
This application has been classified as ${budget.size} complexity. You MUST stay strictly within the following limits to prevent over-decomposition:
- MAXIMUM Components: ${budget.maxComponents}
- MAXIMUM Hooks: ${budget.maxHooks}
- MAXIMUM Services: ${budget.maxServices}
- MAXIMUM Pages: ${budget.maxPages}

If the application is simple, prefer inline state over creating custom hooks, prefer monolithic components over deep decomposition, and do NOT create services unless explicitly requested.

HOOK BUDGET RULES
Generate a custom hook ONLY if at least one condition is true:
1. The hook encapsulates API communication.
2. The hook contains multi-step business logic.
3. The hook is expected to be reused by 2 or more components.

Do NOT generate hooks for:
* Single useState wrappers.
* useToggle patterns.
* useInput patterns.
* Local component state.

Prefer local React state instead.

CONTEXT BUDGET RULES
Generate Context Providers ONLY if:
1. State is shared across multiple pages.
2. State is consumed by 3 or more components.
3. State represents Auth, Theme, Configuration, or Application-level data.

Do NOT generate Context Providers for:
* Single-page state.
* Single-feature state.
* Local component state.

Prefer props or local state instead.

COMPONENT BUDGET RULES
Create a separate component ONLY if:
1. It is reused.
2. It has a distinct responsibility.
3. It contains meaningful UI complexity.

Avoid fragmenting UI into tiny wrapper components.

Do NOT generate:
* CardTitle
* CardBody
* Tiny presentational wrappers

unless explicitly reused.`;

      const targetDir = (reqs as any).__targetDir;
      let architecture: any = null;
      let parsed: any = null;
      let valid = false;
      let attempt = 1;
      const maxAttempts = 3;

      while (!valid && attempt <= maxAttempts) {
        Logger.info(`[FrontendAIAnalyzer] Executing AI frontend architecture analysis (Attempt ${attempt}/${maxAttempts})...`);
        const responseText = await provider.generateJSON(prompt);

        const start = responseText.indexOf('{');
        const end = responseText.lastIndexOf('}');
        if (start === -1 || end === -1 || end < start) {
          throw new Error('No JSON object found in AI response');
        }
        const jsonString = responseText.substring(start, end + 1);

        parsed = JSON.parse(jsonString);
        architecture = FrontendArchitectureSchema.parse(parsed);

        try {
          if (targetDir) {
            await FrontendComplexityGuard.validate({ ...reqs, frontendArchitecture: architecture }, targetDir);
          }
          valid = true;
        } catch (guardErr: any) {
          Logger.warn(`[FrontendAIAnalyzer] Discarding generated architecture because it failed ComplexityGuard: ${guardErr.message}`);
          attempt++;
          if (attempt > maxAttempts) {
            throw new Error(`Failed to generate an architecture within complexity limits after ${maxAttempts} attempts: ${guardErr.message}`);
          }
        }
      }

      // Deduplicate names: Ensure pages don't conflict with components/hooks/services
      if (architecture.pages && architecture.components) {
        for (const page of architecture.pages) {
          if (!page.componentName.endsWith('Page')) {
            const conflict = architecture.components.some((c: any) => c.name === page.componentName);
            if (conflict) {
              page.componentName += 'Page';
            }
          }
        }
      }

      if (targetDir) {
        await GeneratorObservability.writeArtifact(targetDir, 'architecture-raw.json', architecture);
      }

      // Architecture Sanity Validation
      const complexity = parsed.complexityScore || 'medium';
      delete parsed.complexityScore;
      if ((architecture as any).complexityScore) {
         delete (architecture as any).complexityScore;
      }
      Logger.info(`[FrontendAIAnalyzer] AI determined complexity: ${complexity}`);

      // === Architecture Manifest Locking ===
      // Build a canonical manifest of all files that will be generated.
      // This is the single source of truth — generators must not create
      // imports outside this manifest.
      const manifest = {
        components: architecture.components
          .filter((c: any) => c.type !== 'page')
          .map((c: any) => c.name),
        hooks: architecture.hooks.map((h: any) => h.name),
        services: architecture.services.map((s: any) => s.name),
        pages: architecture.pages.map((p: any) => p.componentName),
      };

      // Cross-reference validation: if services is empty, hooks should not
      // contain descriptions that reference service imports.
      if (manifest.services.length === 0 && architecture.hooks.length > 0) {
        const serviceKeywords = ['service', 'api', 'fetch from server', 'backend', 'endpoint'];
        for (const hook of architecture.hooks as any[]) {
          const lowerDesc = hook.description.toLowerCase();
          if (serviceKeywords.some(kw => lowerDesc.includes(kw))) {
            // Rewrite description to avoid service references
            hook.description = hook.description
              .replace(/using\s+(the\s+)?[\w]+\s*service/gi, 'using React state')
              .replace(/fetche?s?\s+(data\s+)?from\s+(the\s+)?(api|backend|server|endpoint)/gi, 'manages data using local state')
              .replace(/calls?\s+(the\s+)?[\w]+\s*api/gi, 'uses local computation');
            Logger.info(`[FrontendAIAnalyzer] Rewrote hook "${hook.name}" description to remove service references (services=empty).`);
          }
        }
      }

      Logger.info(`[FrontendAIAnalyzer] Architecture manifest locked: ${JSON.stringify(manifest)}`);

      reqs.frontendArchitecture = architecture;
      Logger.info(`[FrontendAIAnalyzer] AI analysis complete. Discovered ${architecture.components.length} components, ${architecture.services.length} services, ${architecture.hooks.length} hooks, and ${architecture.pages.length} pages.`);

      if (targetDir) {
        const metadata = { complexityScore: complexity };
        await GeneratorObservability.writeArtifact(targetDir, 'metadata.json', metadata);
        await GeneratorObservability.writeArtifact(targetDir, 'architecture-final.json', architecture);
      }

      // Consistency Check Warning
      if (reqs.classifiedMode === 'frontend-app') {
        if (architecture.services.length > 0 || reqs.database?.length > 0 || reqs.backend?.length > 0) {
          Logger.warn('[ARCHITECTURE WARNING] Frontend-only app contains service layer or backend configuration.');
        }
      }
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
          { route: '/', componentName: 'Home', description: 'Main application page', isProtected: false, allowedRoles: [] },
        ],
      };
      Logger.warn('[FrontendAIAnalyzer] Using minimal fallback architecture.');
    }
  }
}
