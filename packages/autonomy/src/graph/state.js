"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialState = createInitialState;
function createInitialState(projectId, projectRoot, requirements) {
    return {
        projectId,
        projectRoot,
        requirements,
        stage: 'start',
        status: 'pending',
        logs: [],
        structuredErrors: [],
        repairs: [],
        retries: 0,
        maxRetries: 10,
        runtime: { processes: [] },
        checkpoints: [],
        artifacts: {}
    };
}
