"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutonomousPipeline = void 0;
const state_1 = require("./state");
const nodes_1 = require("./nodes");
const agent_logger_1 = require("../logger/agent-logger");
class AutonomousPipeline {
    state;
    logger;
    nodes = new Map();
    constructor(projectId, projectRoot, requirements) {
        this.state = (0, state_1.createInitialState)(projectId, projectRoot, requirements);
        this.logger = new agent_logger_1.AgentLogger(projectId, 'PipelineOrchestrator');
        // Register nodes
        this.nodes.set('start', async () => ({ nextStage: 'planner' }));
        this.nodes.set('planner', nodes_1.plannerNode);
        this.nodes.set('generator', nodes_1.generatorNode);
        this.nodes.set('dependency', nodes_1.dependencyNode);
        this.nodes.set('prisma', nodes_1.prismaNode);
        this.nodes.set('backend', nodes_1.backendNode);
        this.nodes.set('frontend', nodes_1.frontendNode);
        this.nodes.set('validator', nodes_1.validatorNode);
        this.nodes.set('errorAnalyzer', nodes_1.errorAnalyzerNode);
        this.nodes.set('repair', nodes_1.repairNode);
        this.nodes.set('retry', nodes_1.retryNode);
        this.nodes.set('finalValidator', nodes_1.finalValidatorNode);
        this.nodes.set('end', async () => ({ status: 'completed' }));
    }
    async run() {
        this.state.status = 'running';
        let currentStage = 'start';
        while (currentStage !== 'end' && this.state.status !== 'failed') {
            this.logger.stageTransition(this.state.stage, currentStage);
            this.state.stage = currentStage;
            const node = this.nodes.get(currentStage);
            if (!node) {
                this.state.status = 'failed';
                this.logger.decision('abort', `Unknown stage: ${currentStage}`);
                break;
            }
            try {
                const result = await node(this.state);
                // Merge state
                Object.assign(this.state, result);
                if (result.error) {
                    this.state.status = 'failed';
                    break;
                }
                if (result.nextStage) {
                    currentStage = result.nextStage;
                }
                else {
                    currentStage = 'end';
                }
            }
            catch (err) {
                this.logger.decision('node-execution-failed', err.message);
                this.state.status = 'failed';
                // In full impl, this routes to errorAnalyzer instead of aborting
                currentStage = 'errorAnalyzer';
            }
        }
        if (this.state.status !== 'failed') {
            this.state.status = 'completed';
        }
        return this.state;
    }
}
exports.AutonomousPipeline = AutonomousPipeline;
