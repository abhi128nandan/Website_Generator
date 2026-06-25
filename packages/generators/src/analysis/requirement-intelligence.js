"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirementIntelligence = void 0;
// Signal keywords organized by category — never matches application names,
// only structural/functional indicators found in feature descriptions.
var BACKEND_SIGNALS = [
    'api', 'rest', 'graphql', 'server', 'backend', 'endpoint', 'webhook',
    'microservice', 'socket', 'websocket', 'sse',
];
var DATABASE_SIGNALS = [
    'database', 'persist', 'store', 'save', 'crud', 'prisma', 'sql',
    'postgres', 'mongodb', 'redis', 'migration',
];
var AUTH_SIGNALS = [
    'auth', 'login', 'signup', 'register', 'password', 'oauth', 'jwt',
    'session', 'permission', 'role', 'access control',
];
var REALTIME_SIGNALS = [
    'real-time', 'realtime', 'live', 'streaming', 'notification',
    'push', 'websocket', 'chat', 'collaboration',
];
var RICH_UI_SIGNALS = [
    'dashboard', 'chart', 'graph', 'visualization', 'drag', 'drop',
    'kanban', 'timeline', 'calendar', 'map', 'animation', 'carousel',
    'infinite scroll', 'virtualized', 'responsive',
];
var COMPLEX_STATE_SIGNALS = [
    'undo', 'redo', 'history', 'offline', 'sync', 'cache',
    'optimistic', 'pagination', 'filter', 'sort', 'search',
    'multi-step', 'wizard', 'workflow', 'state machine',
];
function countSignals(text, signals) {
    var lower = text.toLowerCase();
    return signals.filter(function (s) { return lower.includes(s); }).length;
}
var RequirementIntelligence = /** @class */ (function () {
    function RequirementIntelligence() {
    }
    /**
     * Analyze requirements and produce a structured complexity profile.
     * Complexity is derived entirely from structural characteristics —
     * never from application names.
     */
    RequirementIntelligence.analyze = function (reqs) {
        var featureText = (reqs.features || []).join(' ');
        var combinedText = __spreadArray([
            reqs.appType || '',
            featureText
        ], (reqs.entities || []).map(function (e) { return typeof e === 'string' ? e : e.name || ''; }), true).join(' ');
        var featureCount = (reqs.features || []).length;
        var entityCount = (reqs.entities || []).length;
        // Detect structural signals
        var backendSignals = countSignals(combinedText, BACKEND_SIGNALS);
        var dbSignals = countSignals(combinedText, DATABASE_SIGNALS);
        var authSignals = countSignals(combinedText, AUTH_SIGNALS);
        var realtimeSignals = countSignals(combinedText, REALTIME_SIGNALS);
        var richUiSignals = countSignals(combinedText, RICH_UI_SIGNALS);
        var complexStateSignals = countSignals(combinedText, COMPLEX_STATE_SIGNALS);
        var requiresBackend = backendSignals > 0 || dbSignals > 0;
        var requiresDatabase = dbSignals > 0 || entityCount > 2;
        var requiresAuthentication = authSignals > 0;
        var requiresRealtime = realtimeSignals > 0;
        // --- UI Complexity ---
        var uiComplexity = 'minimal';
        if (richUiSignals >= 3 || featureCount >= 8) {
            uiComplexity = 'rich';
        }
        else if (richUiSignals >= 1 || featureCount >= 5) {
            uiComplexity = 'moderate';
        }
        // --- State Complexity ---
        var stateComplexity = 'trivial';
        if (complexStateSignals >= 3 || (entityCount >= 4 && featureCount >= 8)) {
            stateComplexity = 'complex';
        }
        else if (complexStateSignals >= 1 || entityCount >= 2 || featureCount >= 5) {
            stateComplexity = 'moderate';
        }
        // --- Business Logic Complexity ---
        var businessLogicComplexity = 'trivial';
        if (requiresAuthentication && requiresDatabase && featureCount >= 8) {
            businessLogicComplexity = 'complex';
        }
        else if (requiresBackend || entityCount >= 2 || featureCount >= 5) {
            businessLogicComplexity = 'moderate';
        }
        // --- Overall Complexity ---
        // Score-based: accumulate points from various dimensions
        var complexityScore = 0;
        complexityScore += featureCount; // 1 point per feature
        complexityScore += entityCount * 2; // 2 points per entity
        complexityScore += requiresBackend ? 3 : 0;
        complexityScore += requiresDatabase ? 3 : 0;
        complexityScore += requiresAuthentication ? 3 : 0;
        complexityScore += requiresRealtime ? 2 : 0;
        complexityScore += richUiSignals;
        complexityScore += complexStateSignals;
        var complexity;
        if (complexityScore <= 8) {
            complexity = 'low';
        }
        else if (complexityScore <= 20) {
            complexity = 'medium';
        }
        else {
            complexity = 'high';
        }
        // --- Estimated Architecture Counts ---
        var estimates = this.estimateCounts(complexity, featureCount, entityCount, requiresBackend);
        return __assign({ complexity: complexity, uiComplexity: uiComplexity, stateComplexity: stateComplexity, requiresBackend: requiresBackend, requiresDatabase: requiresDatabase, requiresAuthentication: requiresAuthentication, requiresRealtime: requiresRealtime, businessLogicComplexity: businessLogicComplexity }, estimates);
    };
    /**
     * Estimate component/hook/service/page counts based on complexity tier.
     */
    RequirementIntelligence.estimateCounts = function (complexity, featureCount, entityCount, requiresBackend) {
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
    };
    /**
     * Convert a RequirementProfile into an architecture budget
     * compatible with FrontendAIAnalyzer's existing budget interface.
     */
    RequirementIntelligence.toBudget = function (profile) {
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
    };
    /**
     * Convert a RequirementProfile into guard limits
     * compatible with FrontendComplexityGuard's existing limits interface.
     */
    RequirementIntelligence.toGuardLimits = function (profile) {
        var budget = this.toBudget(profile);
        return {
            components: budget.maxComponents,
            hooks: budget.maxHooks,
            services: budget.maxServices,
            pages: budget.maxPages,
        };
    };
    return RequirementIntelligence;
}());
exports.RequirementIntelligence = RequirementIntelligence;
