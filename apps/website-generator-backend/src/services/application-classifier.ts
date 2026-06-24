import { Logger, ApplicationMode, ClassificationResult, NormalizedRequirements } from '@website-generator/shared';
import { ProviderFactory } from '@website-generator/ai-engine';

// --- Keyword dictionaries for heuristic classification ---

const KEYWORD_MAP: Record<ApplicationMode, string[]> = {
  'crud-admin': [
    'manage', 'dashboard', 'admin', 'inventory', 'employee', 'database',
    'crud', 'analytics', 'saas', 'erp', 'crm', 'backoffice', 'table',
    'entity', 'record', 'management', 'tracking', 'system', 'portal',
    'report', 'data entry', 'workflow', 'staff', 'customer', 'order',
    'product catalog', 'warehouse', 'task manager', 'project management',
    'booking system', 'appointment', 'scheduling',
  ],
  'frontend-app': [
    'weather', 'game', 'portfolio', 'animation', 'landing page', 'calculator',
    'ui', 'responsive', 'frontend', 'html', 'css', 'timer', 'clock',
    'converter', 'visualization', 'chart', 'quiz', 'survey form', 'todo',
    'countdown', 'music player', 'video player', 'gallery', 'slideshow',
    'recipe', 'markdown', 'drawing', 'paint', 'typing', 'flashcard',
    'pomodoro', 'stopwatch', 'color picker', 'gradient generator',
    'meme generator', 'qr code', 'bmi calculator', 'tip calculator',
    'unit converter', 'dictionary', 'trivia', 'memory game', 'tic tac toe',
    'snake game', 'tetris', 'pixel art',
  ],
  'hybrid-fullstack': [
    'auth', 'login', 'payments', 'realtime', 'social', 'ai assistant',
    'ecommerce', 'collaborative', 'chat', 'marketplace', 'subscription',
    'notification', 'signup', 'oauth', 'stripe', 'checkout', 'cart',
    'messaging', 'feed', 'followers', 'comments', 'likes', 'profile',
    'upload', 'file sharing', 'video call', 'forum', 'blog platform',
    'learning management', 'course platform',
  ],
};

/**
 * Scans prompt text against curated keyword lists and returns
 * per-mode scores normalised to 0-100.
 */
function runKeywordHeuristics(text: string): Record<ApplicationMode, { score: number; matched: string[] }> {
  const lower = text.toLowerCase();

  const results: Record<ApplicationMode, { score: number; matched: string[] }> = {
    'crud-admin': { score: 0, matched: [] },
    'frontend-app': { score: 0, matched: [] },
    'hybrid-fullstack': { score: 0, matched: [] },
  };

  for (const [mode, keywords] of Object.entries(KEYWORD_MAP) as [ApplicationMode, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        results[mode].score += 1;
        results[mode].matched.push(kw);
      }
    }
  }

  // Normalise scores to 0-100
  const maxPossible = Math.max(
    results['crud-admin'].score,
    results['frontend-app'].score,
    results['hybrid-fullstack'].score,
    1, // prevent divide-by-zero
  );

  for (const mode of Object.keys(results) as ApplicationMode[]) {
    results[mode].score = Math.round((results[mode].score / maxPossible) * 100);
  }

  return results;
}

/**
 * Calls the configured LLM provider for semantic classification.
 * Returns a structured classification result from the AI.
 */
async function runAIClassification(rawText: string): Promise<{
  mode: ApplicationMode;
  confidence: number;
  reasoning: string;
  suggestedFeatures: string[];
}> {
  const provider = ProviderFactory.getProvider();

  const prompt = `You are an expert application architect and intent classifier.

Analyze the following user prompt and classify what TYPE of application they want to build.

You MUST output ONLY a valid JSON object matching this structure exactly. Do not output markdown code blocks or any conversational text.

Structure:
{
  "mode": "crud-admin" | "frontend-app" | "hybrid-fullstack",
  "confidence": number (0-100),
  "reasoning": "string explaining why this mode was selected",
  "suggestedFeatures": ["string array of recommended features for this app type"]
}

Classification rules:
- "crud-admin": Apps that primarily manage data records — inventory, CRM, ERP, admin dashboards, task/project management systems, SaaS backoffice tools. These need databases, CRUD APIs, and admin UIs.
- "frontend-app": Apps that are primarily UI-driven with no persistent backend — weather apps, calculators, games, portfolios, landing pages, animation tools, media players, visualization tools. These use React/Vite with API integrations and local state only.
- "hybrid-fullstack": Apps that need both a rich frontend AND a backend but are NOT simple CRUD — social media, ecommerce, auth-based apps, realtime collaboration, AI-powered tools, chat apps, marketplace platforms.

User Prompt:
${rawText}`;

  const responseText = await provider.generateJSON(prompt);

  const start = responseText.indexOf('{');
  const end = responseText.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in AI classification response');
  }

  const parsed = JSON.parse(responseText.substring(start, end + 1));

  // Validate mode
  const validModes: ApplicationMode[] = ['crud-admin', 'frontend-app', 'hybrid-fullstack'];
  if (!validModes.includes(parsed.mode)) {
    throw new Error(`Invalid mode from AI: ${parsed.mode}`);
  }

  return {
    mode: parsed.mode as ApplicationMode,
    confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
    reasoning: String(parsed.reasoning || ''),
    suggestedFeatures: Array.isArray(parsed.suggestedFeatures) ? parsed.suggestedFeatures.map(String) : [],
  };
}

/**
 * Application Intent Classifier.
 *
 * Combines fast keyword heuristics (30% weight) with LLM semantic analysis (70% weight)
 * to determine application type BEFORE generation begins.
 *
 * Falls back to 'crud-admin' on any error — preserving backward compatibility.
 */
export class ApplicationClassifier {
  static async classify(rawText: string, reqs: NormalizedRequirements): Promise<ClassificationResult> {
    Logger.info('[Classifier] ═══════════════════════════════════════════');
    Logger.info('[Classifier] Starting application intent classification...');
    Logger.info(`[Classifier] Prompt length: ${rawText.length} chars`);
    Logger.info(`[Classifier] App name: ${reqs.appName}`);
    Logger.info(`[Classifier] App type (from extractor): ${reqs.appType}`);

    // ── Step 1: Keyword heuristics ──
    Logger.info('[Classifier] Running keyword heuristic analysis...');
    const heuristics = runKeywordHeuristics(rawText + ' ' + reqs.appType + ' ' + reqs.features.join(' '));

    Logger.info(`[Classifier] Heuristic scores:`);
    Logger.info(`[Classifier]   crud-admin:       ${heuristics['crud-admin'].score}% (${heuristics['crud-admin'].matched.join(', ') || 'none'})`);
    Logger.info(`[Classifier]   frontend-app:     ${heuristics['frontend-app'].score}% (${heuristics['frontend-app'].matched.join(', ') || 'none'})`);
    Logger.info(`[Classifier]   hybrid-fullstack: ${heuristics['hybrid-fullstack'].score}% (${heuristics['hybrid-fullstack'].matched.join(', ') || 'none'})`);

    // ── Step 2: AI semantic classification ──
    let aiResult: { mode: ApplicationMode; confidence: number; reasoning: string; suggestedFeatures: string[] };

    try {
      Logger.info('[Classifier] Running AI semantic classification...');
      aiResult = await runAIClassification(rawText);
      Logger.info(`[Classifier] AI result: mode=${aiResult.mode}, confidence=${aiResult.confidence}%`);
      Logger.info(`[Classifier] AI reasoning: ${aiResult.reasoning}`);
    } catch (err: any) {
      Logger.warn(`[Classifier] AI classification failed: ${err.message}`);
      Logger.warn('[Classifier] Falling back to heuristic-only classification');

      // Use heuristics only
      const bestHeuristic = (Object.entries(heuristics) as [ApplicationMode, { score: number; matched: string[] }][])
        .sort((a, b) => b[1].score - a[1].score)[0];

      const fallbackMode = bestHeuristic[1].score > 0 ? bestHeuristic[0] : 'crud-admin';

      const result: ClassificationResult = {
        mode: fallbackMode,
        confidence: bestHeuristic[1].score > 0 ? bestHeuristic[1].score : 60,
        reasoning: `Heuristic-only fallback (AI unavailable). Matched keywords: ${bestHeuristic[1].matched.join(', ') || 'none'}`,
        keywords: bestHeuristic[1].matched,
        suggestedFeatures: [],
      };

      Logger.info(`[Classifier] ═══════════════════════════════════════════`);
      Logger.info(`[AI] Detected application type: ${result.mode}`);
      Logger.info(`[AI] Confidence: ${result.confidence}%`);
      Logger.info(`[router] Selected generator: ${result.mode === 'crud-admin' ? 'crud-generator' : result.mode === 'frontend-app' ? 'frontend-generator' : 'hybrid-generator'}`);
      return result;
    }

    // ── Step 3: Merge scores (30% heuristic + 70% AI) ──
    const modes: ApplicationMode[] = ['crud-admin', 'frontend-app', 'hybrid-fullstack'];
    const combinedScores: Record<ApplicationMode, number> = {
      'crud-admin': 0,
      'frontend-app': 0,
      'hybrid-fullstack': 0,
    };

    for (const mode of modes) {
      const hScore = heuristics[mode].score;
      const aScore = mode === aiResult.mode ? aiResult.confidence : Math.max(0, 20 - aiResult.confidence * 0.3);
      combinedScores[mode] = Math.round(0.3 * hScore + 0.7 * aScore);
    }

    Logger.info(`[Classifier] Combined scores (30% heuristic + 70% AI):`);
    Logger.info(`[Classifier]   crud-admin:       ${combinedScores['crud-admin']}%`);
    Logger.info(`[Classifier]   frontend-app:     ${combinedScores['frontend-app']}%`);
    Logger.info(`[Classifier]   hybrid-fullstack: ${combinedScores['hybrid-fullstack']}%`);

    // Pick the mode with the highest combined score
    const selectedMode = modes.reduce((best, mode) =>
      combinedScores[mode] > combinedScores[best] ? mode : best
    );

    // Collect all matched keywords across all modes
    const allMatchedKeywords = [
      ...heuristics['crud-admin'].matched,
      ...heuristics['frontend-app'].matched,
      ...heuristics['hybrid-fullstack'].matched,
    ];

    const result: ClassificationResult = {
      mode: selectedMode,
      confidence: combinedScores[selectedMode],
      reasoning: aiResult.reasoning,
      keywords: allMatchedKeywords,
      suggestedFeatures: aiResult.suggestedFeatures,
    };

    Logger.info(`[Classifier] ═══════════════════════════════════════════`);
    Logger.info(`[AI] Detected application type: ${result.mode}`);
    Logger.info(`[AI] Confidence: ${result.confidence}%`);
    Logger.info(`[router] Selected generator: ${result.mode === 'crud-admin' ? 'crud-generator' : result.mode === 'frontend-app' ? 'frontend-generator' : 'hybrid-generator'}`);

    return result;
  }
}
