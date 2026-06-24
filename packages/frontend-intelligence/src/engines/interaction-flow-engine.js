"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionFlowEngine = void 0;
class InteractionFlowEngine {
    static mapFlows(components) {
        return components.map(c => ({
            trigger: `user interacts with ${c.name}`,
            states: c.states,
            transitions: ['fade-in', 'slide-up'],
            loadingBehavior: 'skeleton',
            errorBehavior: 'toast',
            successBehavior: 'update-ui'
        }));
    }
}
exports.InteractionFlowEngine = InteractionFlowEngine;
