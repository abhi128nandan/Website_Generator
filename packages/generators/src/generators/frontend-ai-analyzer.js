"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendAIAnalyzer = void 0;
const shared_1 = require("@website-generator/shared");
const ai_engine_1 = require("@website-generator/ai-engine");
const observability_layer_1 = require("../observability/observability-layer");
/**
 * AI-powered frontend architecture analyzer.
 *
 * Analogous to CrudGenerator.analyze() but produces a FrontendArchitecture
 * (components, services, hooks, pages) instead of CRUD entities/endpoints.
 */
class FrontendAIAnalyzer {
    static async analyze(reqs) {
        try {
            const provider = ai_engine_1.ProviderFactory.getProvider();
            const appNameLower = reqs.appName.toLowerCase();
            // Deterministic Architecture Templates
            if (appNameLower === 'calculator' || appNameLower === 'calculator app') {
                shared_1.Logger.info('[FrontendAIAnalyzer] High confidence match for Calculator. Using deterministic template.');
                reqs.frontendArchitecture = {
                    pages: [{ route: '/', componentName: 'CalculatorPage', description: 'Main calculator page' }],
                    components: [
                        { name: 'CalculatorDisplay', type: 'component', description: 'Displays current input and result' },
                        { name: 'CalculatorButtons', type: 'component', description: 'Renders the keypad buttons' }
                    ],
                    hooks: [{ name: 'useCalculator', description: 'Manages calculator state and operations' }],
                    services: []
                };
                return;
            }
            if (appNameLower === 'todo app' || appNameLower === 'todo' || appNameLower === 'todo list') {
                shared_1.Logger.info('[FrontendAIAnalyzer] High confidence match for Todo App. Using deterministic template.');
                reqs.frontendArchitecture = {
                    pages: [{ route: '/', componentName: 'TaskPage', description: 'Main todo list page' }],
                    components: [
                        { name: 'TaskForm', type: 'component', description: 'Form to add a new task' },
                        { name: 'TaskList', type: 'component', description: 'List of current tasks' }
                    ],
                    hooks: [{ name: 'useTasks', description: 'Manages task list state' }],
                    services: [{ name: 'taskApi', description: 'Service to handle task persistence' }]
                };
                return;
            }
            if (appNameLower === 'counter app' || appNameLower === 'counter') {
                shared_1.Logger.info('[FrontendAIAnalyzer] High confidence match for Counter App. Using deterministic template.');
                reqs.frontendArchitecture = {
                    pages: [{ route: '/', componentName: 'CounterPage', description: 'Main counter page' }],
                    components: [
                        { name: 'CounterDisplay', type: 'component', description: 'Displays the current count' },
                        { name: 'CounterControls', type: 'component', description: 'Buttons to increment and decrement count' }
                    ],
                    hooks: [{ name: 'useCounter', description: 'Manages counter state' }],
                    services: []
                };
                return;
            }
            let prompt = `You are a Senior Frontend Architect.
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
            const tier1Keywords = ['calculator', 'counter', 'converter', 'stopwatch', 'timer'];
            const isTier1 = tier1Keywords.some(kw => reqs.appName.toLowerCase().includes(kw) || reqs.appType.toLowerCase().includes(kw));
            if (isTier1) {
                prompt += `\n\nTIER 1 COMPLEXITY CONSTRAINTS:
- This is a simple utility application. Keep architecture absolutely minimal.
- Allowed: Exactly 1 page, 0 services, 0-1 hooks, 2-4 components.
- Forbidden: Settings pages, About pages, Search bars, Geolocation, Analytics, History services (unless explicitly requested).
- CRITICAL: Do NOT generate a service for a Tier 1 app unless it is absolutely impossible to build without one.`;
            }
            shared_1.Logger.info('[FrontendAIAnalyzer] Executing AI frontend architecture analysis...');
            const responseText = await provider.generateJSON(prompt);
            const start = responseText.indexOf('{');
            const end = responseText.lastIndexOf('}');
            if (start === -1 || end === -1 || end < start) {
                throw new Error('No JSON object found in AI response');
            }
            const jsonString = responseText.substring(start, end + 1);
            const parsed = JSON.parse(jsonString);
            const architecture = shared_1.FrontendArchitectureSchema.parse(parsed);
            // Deduplicate names: Ensure pages don't conflict with components/hooks/services
            if (architecture.pages && architecture.components) {
                for (const page of architecture.pages) {
                    if (!page.componentName.endsWith('Page')) {
                        const conflict = architecture.components.some(c => c.name === page.componentName);
                        if (conflict) {
                            page.componentName += 'Page';
                        }
                    }
                }
            }
            const targetDir = reqs.__targetDir;
            if (targetDir) {
                await observability_layer_1.GeneratorObservability.writeArtifact(targetDir, 'architecture-raw.json', architecture);
            }
            const servicesBefore = architecture.services?.length || 0;
            // Architecture Sanity Validation & Pruning
            if (isTier1) {
                shared_1.Logger.info('[FrontendAIAnalyzer] Applying Tier 1 architectural pruning...');
                if (architecture.pages && architecture.pages.length > 1) {
                    architecture.pages = architecture.pages.slice(0, 1);
                }
                // Tier 1 apps MUST NOT have services (pure local state)
                architecture.services = [];
                if (architecture.hooks && architecture.hooks.length > 2) {
                    architecture.hooks = architecture.hooks.slice(0, 2);
                }
                // Filter out forbidden components
                const forbiddenKeywords = ['setting', 'about', 'search', 'geo', 'analytic', 'history'];
                architecture.components = architecture.components.filter(c => {
                    const lowerName = c.name.toLowerCase();
                    return !forbiddenKeywords.some(kw => lowerName.includes(kw));
                });
                if (architecture.components.length > 4) {
                    architecture.components = architecture.components.slice(0, 4);
                }
            }
            const servicesAfter = architecture.services?.length || 0;
            if (reqs.classifiedMode === 'frontend-app') {
                shared_1.Logger.info(`[PRUNING]\nServices before: ${servicesBefore}\nServices after: ${servicesAfter}`);
            }
            // === Architecture Manifest Locking ===
            // Build a canonical manifest of all files that will be generated.
            // This is the single source of truth — generators must not create
            // imports outside this manifest.
            const manifest = {
                components: architecture.components
                    .filter(c => c.type !== 'page')
                    .map(c => c.name),
                hooks: architecture.hooks.map(h => h.name),
                services: architecture.services.map(s => s.name),
                pages: architecture.pages.map(p => p.componentName),
            };
            // Cross-reference validation: if services is empty, hooks should not
            // contain descriptions that reference service imports.
            if (manifest.services.length === 0 && architecture.hooks.length > 0) {
                const serviceKeywords = ['service', 'api', 'fetch from server', 'backend', 'endpoint'];
                for (const hook of architecture.hooks) {
                    const lowerDesc = hook.description.toLowerCase();
                    if (serviceKeywords.some(kw => lowerDesc.includes(kw))) {
                        // Rewrite description to avoid service references
                        hook.description = hook.description
                            .replace(/using\s+(the\s+)?[\w]+\s*service/gi, 'using React state')
                            .replace(/fetche?s?\s+(data\s+)?from\s+(the\s+)?(api|backend|server|endpoint)/gi, 'manages data using local state')
                            .replace(/calls?\s+(the\s+)?[\w]+\s*api/gi, 'uses local computation');
                        shared_1.Logger.info(`[FrontendAIAnalyzer] Rewrote hook "${hook.name}" description to remove service references (services=empty).`);
                    }
                }
            }
            shared_1.Logger.info(`[FrontendAIAnalyzer] Architecture manifest locked: ${JSON.stringify(manifest)}`);
            reqs.frontendArchitecture = architecture;
            shared_1.Logger.info(`[FrontendAIAnalyzer] AI analysis complete. Discovered ${architecture.components.length} components, ${architecture.services.length} services, ${architecture.hooks.length} hooks, and ${architecture.pages.length} pages.`);
            if (targetDir) {
                await observability_layer_1.GeneratorObservability.writeArtifact(targetDir, 'architecture-final.json', architecture);
            }
            // Consistency Check Warning
            if (reqs.classifiedMode === 'frontend-app') {
                if (architecture.services.length > 0 || reqs.database?.length > 0 || reqs.backend?.length > 0) {
                    shared_1.Logger.warn('[ARCHITECTURE WARNING] Frontend-only app contains service layer or backend configuration.');
                }
            }
        }
        catch (err) {
            shared_1.Logger.error(`[FrontendAIAnalyzer] Failed to analyze frontend architecture: ${err.message}`);
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
            shared_1.Logger.warn('[FrontendAIAnalyzer] Using minimal fallback architecture.');
        }
    }
}
exports.FrontendAIAnalyzer = FrontendAIAnalyzer;
