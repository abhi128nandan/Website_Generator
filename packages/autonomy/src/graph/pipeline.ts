import { GraphState, createInitialState } from './state';
import { GraphNode, plannerNode, generatorNode, dependencyNode, prismaNode, backendNode, frontendNode, validatorNode, errorAnalyzerNode, repairNode, retryNode, finalValidatorNode } from './nodes';
import { AgentLogger } from '../logger/agent-logger';

export class AutonomousPipeline {
  private state: GraphState;
  private logger: AgentLogger;
  private nodes: Map<string, GraphNode> = new Map();

  constructor(projectId: string, projectRoot: string, requirements?: any) {
    this.state = createInitialState(projectId, projectRoot, requirements);
    this.logger = new AgentLogger(projectId, 'PipelineOrchestrator');
    
    // Register nodes
    this.nodes.set('start', async () => ({ nextStage: 'planner' }));
    this.nodes.set('planner', plannerNode);
    this.nodes.set('generator', generatorNode);
    this.nodes.set('dependency', dependencyNode);
    this.nodes.set('prisma', prismaNode);
    this.nodes.set('backend', backendNode);
    this.nodes.set('frontend', frontendNode);
    this.nodes.set('validator', validatorNode);
    this.nodes.set('errorAnalyzer', errorAnalyzerNode);
    this.nodes.set('repair', repairNode);
    this.nodes.set('retry', retryNode);
    this.nodes.set('finalValidator', finalValidatorNode);
    this.nodes.set('end', async () => ({ status: 'completed' }));
  }

  async run(): Promise<GraphState> {
    this.state.status = 'running';
    let currentStage = 'start';
    
    while (currentStage !== 'end' && this.state.status !== 'failed') {
      this.logger.stageTransition(this.state.stage, currentStage);
      this.state.stage = currentStage as any;
      
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
        } else {
          currentStage = 'end';
        }
      } catch (err: any) {
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
