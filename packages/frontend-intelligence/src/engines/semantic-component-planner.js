"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticComponentPlanner = void 0;
class SemanticComponentPlanner {
    static async plan(domainContext) {
        // Generate semantic UI components instead of generic <Card> blocks
        return [
            {
                name: `${domainContext.entities[0] || 'Domain'}Dashboard`,
                purpose: 'Main dashboard view',
                props: [],
                states: ['loading', 'idle', 'error'],
                interactions: ['mount', 'refresh'],
                dependencies: []
            }
        ];
    }
}
exports.SemanticComponentPlanner = SemanticComponentPlanner;
