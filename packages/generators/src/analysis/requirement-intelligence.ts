import { NormalizedRequirements } from '@website-generator/shared';

/**
 * Requirement-driven complexity analysis.
 *
 * Derives architecture budgets from structural characteristics of requirements
 * (feature count, entity count, presence of backend/auth/API signals)
 * rather than matching application names like "calculator" or "todo".
 */

export interface RequirementProfile {
  complexity: 'low' | 'medium' | 'high';
  uiComplexity: 'minimal' | 'moderate' | 'rich';
  stateComplexity: 'trivial' | 'moderate' | 'complex';
  requiresBackend: boolean;
  requiresDatabase: boolean;
  requiresAuthentication: boolean;
  requiresRealtime: boolean;
  businessLogicComplexity: 'trivial' | 'moderate' | 'complex';
  estimatedComponents: number;
  estimatedHooks: number;
  estimatedServices: number;
  estimatedPages: number;
}

export interface ArchitectureBudget {
  size: string;
  maxComponents: number;
  maxHooks: number;
  maxServices: number;
  maxPages: number;
}

export interface GuardLimits {
  components: number;
  hooks: number;
  services: number;
  pages: number;
}

// Signal keywords organized by category — never matches application names,
// only structural/functional indicators found in feature descriptions.
const BACKEND_SIGNALS = [
  'api', 'rest', 'graphql', 'server', 'backend', 'endpoint', 'webhook',
  'microservice', 'socket', 'websocket', 'sse',
];

const DATABASE_SIGNALS = [
  'database', 'persist', 'store', 'save', 'crud', 'prisma', 'sql',
  'postgres', 'mongodb', 'redis', 'migration',
];

const AUTH_SIGNALS = [
  'auth', 'login', 'signup', 'register', 'password', 'oauth', 'jwt',
  'session', 'permission', 'role', 'access control',
];

const REALTIME_SIGNALS = [
  'real-time', 'realtime', 'live', 'streaming', 'notification',
  'push', 'websocket', 'chat', 'collaboration',
];

const RICH_UI_SIGNALS = [
  'dashboard', 'chart', 'graph', 'visualization', 'drag', 'drop',
  'kanban', 'timeline', 'calendar', 'map', 'animation', 'carousel',
  'infinite scroll', 'virtualized', 'responsive',
];

const COMPLEX_STATE_SIGNALS = [
  'undo', 'redo', 'history', 'offline', 'sync', 'cache',
  'optimistic', 'pagination', 'filter', 'sort', 'search',
  'multi-step', 'wizard', 'workflow', 'state machine',
];

function countSignals(text: string, signals: string[]): number {
  const lower = text.toLowerCase();
  return signals.filter(s => lower.includes(s)).length;
}

export class RequirementIntelligence {
  /**
   * Analyze requirements and produce a structured complexity profile.
   * Complexity is derived entirely from structural characteristics —
   * never from application names.
   */
  static analyze(reqs: NormalizedRequirements): RequirementProfile {
    const featureText = (reqs.features || []).join(' ');
    const combinedText = [
      reqs.appType || '',
      featureText,
      ...(reqs.entities || []).map((e: any) => typeof e === 'string' ? e : e.name || ''),
    ].join(' ');

    const featureCount = (reqs.features || []).length;
    const entityCount = (reqs.entities || []).length;

    // Detect structural signals
    const backendSignals = countSignals(combinedText, BACKEND_SIGNALS);
    const dbSignals = countSignals(combinedText, DATABASE_SIGNALS);
    const authSignals = countSignals(combinedText, AUTH_SIGNALS);
    const realtimeSignals = countSignals(combinedText, REALTIME_SIGNALS);
    const richUiSignals = countSignals(combinedText, RICH_UI_SIGNALS);
    const complexStateSignals = countSignals(combinedText, COMPLEX_STATE_SIGNALS);

    const requiresBackend = backendSignals > 0 || dbSignals > 0;
    const requiresDatabase = dbSignals > 0 || entityCount > 2;
    const requiresAuthentication = authSignals > 0;
    const requiresRealtime = realtimeSignals > 0;

    // --- UI Complexity ---
    let uiComplexity: RequirementProfile['uiComplexity'] = 'minimal';
    if (richUiSignals >= 3 || featureCount >= 8) {
      uiComplexity = 'rich';
    } else if (richUiSignals >= 1 || featureCount >= 5) {
      uiComplexity = 'moderate';
    }

    // --- State Complexity ---
    let stateComplexity: RequirementProfile['stateComplexity'] = 'trivial';
    if (complexStateSignals >= 3 || (entityCount >= 4 && featureCount >= 8)) {
      stateComplexity = 'complex';
    } else if (complexStateSignals >= 1 || entityCount >= 2 || featureCount >= 5) {
      stateComplexity = 'moderate';
    }

    // --- Business Logic Complexity ---
    let businessLogicComplexity: RequirementProfile['businessLogicComplexity'] = 'trivial';
    if (requiresAuthentication && requiresDatabase && featureCount >= 8) {
      businessLogicComplexity = 'complex';
    } else if (requiresBackend || entityCount >= 2 || featureCount >= 5) {
      businessLogicComplexity = 'moderate';
    }

    // --- Overall Complexity ---
    // Score-based: accumulate points from various dimensions
    let complexityScore = 0;
    complexityScore += featureCount;                         // 1 point per feature
    complexityScore += entityCount * 2;                      // 2 points per entity
    complexityScore += requiresBackend ? 3 : 0;
    complexityScore += requiresDatabase ? 3 : 0;
    complexityScore += requiresAuthentication ? 3 : 0;
    complexityScore += requiresRealtime ? 2 : 0;
    complexityScore += richUiSignals;
    complexityScore += complexStateSignals;

    let complexity: RequirementProfile['complexity'];
    if (complexityScore <= 8) {
      complexity = 'low';
    } else if (complexityScore <= 20) {
      complexity = 'medium';
    } else {
      complexity = 'high';
    }

    // --- Estimated Architecture Counts ---
    const estimates = this.estimateCounts(complexity, featureCount, entityCount, requiresBackend);

    return {
      complexity,
      uiComplexity,
      stateComplexity,
      requiresBackend,
      requiresDatabase,
      requiresAuthentication,
      requiresRealtime,
      businessLogicComplexity,
      ...estimates,
    };
  }

  /**
   * Estimate component/hook/service/page counts based on complexity tier.
   */
  private static estimateCounts(
    complexity: 'low' | 'medium' | 'high',
    featureCount: number,
    entityCount: number,
    requiresBackend: boolean
  ): Pick<RequirementProfile, 'estimatedComponents' | 'estimatedHooks' | 'estimatedServices' | 'estimatedPages'> {
    switch (complexity) {
      case 'low':
        return {
          estimatedComponents: Math.max(2, Math.min(4, featureCount)),
          estimatedHooks: Math.min(1, featureCount > 2 ? 1 : 0),
          estimatedServices: 0,
          estimatedPages: 1,
        };
      case 'medium':
        return {
          estimatedComponents: Math.max(4, Math.min(8, featureCount + entityCount)),
          estimatedHooks: Math.min(3, Math.max(1, Math.ceil(featureCount / 3))),
          estimatedServices: requiresBackend ? Math.min(2, entityCount || 1) : 0,
          estimatedPages: Math.min(4, Math.max(1, Math.ceil(featureCount / 3))),
        };
      case 'high':
        return {
          estimatedComponents: Math.max(6, Math.min(15, featureCount + entityCount * 2)),
          estimatedHooks: Math.min(6, Math.max(2, Math.ceil(featureCount / 2))),
          estimatedServices: requiresBackend ? Math.min(4, entityCount || 2) : 0,
          estimatedPages: Math.min(10, Math.max(2, Math.ceil(featureCount / 2))),
        };
    }
  }

  /**
   * Convert a RequirementProfile into an architecture budget
   * compatible with FrontendAIAnalyzer's existing budget interface.
   */
  static toBudget(profile: RequirementProfile): ArchitectureBudget {
    switch (profile.complexity) {
      case 'low':
        return {
          size: 'SMALL',
          maxComponents: 4,
          maxHooks: 1,
          maxServices: 0,
          maxPages: 1,
        };
      case 'medium':
        return {
          size: 'MEDIUM',
          maxComponents: 8,
          maxHooks: 3,
          maxServices: 2,
          maxPages: 4,
        };
      case 'high':
        return {
          size: 'LARGE',
          maxComponents: 15,
          maxHooks: 6,
          maxServices: 4,
          maxPages: 10,
        };
    }
  }

  /**
   * Convert a RequirementProfile into guard limits
   * compatible with FrontendComplexityGuard's existing limits interface.
   */
  static toGuardLimits(profile: RequirementProfile): GuardLimits {
    const budget = this.toBudget(profile);
    return {
      components: budget.maxComponents,
      hooks: budget.maxHooks,
      services: budget.maxServices,
      pages: budget.maxPages,
    };
  }
}
