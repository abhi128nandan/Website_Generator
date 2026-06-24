"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalValidatorNode = exports.retryNode = exports.repairNode = exports.errorAnalyzerNode = exports.validatorNode = exports.frontendNode = exports.backendNode = exports.prismaNode = exports.dependencyNode = exports.generatorNode = exports.plannerNode = void 0;
const root_cause_agent_1 = require("../agents/root-cause-agent");
const repair_agent_1 = require("../agents/repair-agent");
const error_registry_1 = require("../errors/error-registry");
const plannerNode = async (state) => {
    // Mock implementation calling into @website-generator/generators (to be fully integrated later)
    return { stage: 'planner', nextStage: 'generator' };
};
exports.plannerNode = plannerNode;
const generatorNode = async (state) => {
    return { stage: 'generator', nextStage: 'dependency' };
};
exports.generatorNode = generatorNode;
const dependencyNode = async (state) => {
    return { stage: 'dependency', nextStage: 'prisma' };
};
exports.dependencyNode = dependencyNode;
const prismaNode = async (state) => {
    return { stage: 'prisma', nextStage: 'backend' };
};
exports.prismaNode = prismaNode;
const backendNode = async (state) => {
    return { stage: 'backend', nextStage: 'frontend' };
};
exports.backendNode = backendNode;
const frontendNode = async (state) => {
    return { stage: 'frontend', nextStage: 'validator' };
};
exports.frontendNode = frontendNode;
const validatorNode = async (state) => {
    const errors = error_registry_1.ErrorRegistry.getTimeline(state.projectId);
    if (errors.length > 0) {
        return { stage: 'validator', status: 'failed', nextStage: 'errorAnalyzer' };
    }
    return { stage: 'validator', nextStage: 'end' };
};
exports.validatorNode = validatorNode;
const errorAnalyzerNode = async (state) => {
    const agent = new root_cause_agent_1.RootCauseAgent({ projectId: state.projectId, projectRoot: state.projectRoot });
    const diagnosis = agent.analyze();
    if (diagnosis && diagnosis.repairable) {
        return { stage: 'errorAnalyzer', status: 'repairing', nextStage: 'repair' };
    }
    return { stage: 'errorAnalyzer', status: 'failed', nextStage: 'end' };
};
exports.errorAnalyzerNode = errorAnalyzerNode;
const repairNode = async (state) => {
    const analyzer = new root_cause_agent_1.RootCauseAgent({ projectId: state.projectId, projectRoot: state.projectRoot });
    const diagnosis = analyzer.analyze();
    if (diagnosis) {
        const agent = new repair_agent_1.RepairAgent({ projectId: state.projectId, projectRoot: state.projectRoot });
        const result = await agent.repair(diagnosis);
        if (result.success) {
            return { stage: 'repair', status: 'running', nextStage: 'retry', retries: state.retries + 1 };
        }
    }
    return { stage: 'repair', status: 'failed', nextStage: 'end' };
};
exports.repairNode = repairNode;
const retryNode = async (state) => {
    if (state.retries >= state.maxRetries) {
        return { stage: 'retry', status: 'failed', nextStage: 'end' };
    }
    // Simplified: retry from the last stage that failed
    // In reality we would fetch from checkpoints
    return { stage: 'retry', nextStage: 'validator' };
};
exports.retryNode = retryNode;
const finalValidatorNode = async (state) => {
    return { stage: 'finalValidator', nextStage: 'end' };
};
exports.finalValidatorNode = finalValidatorNode;
