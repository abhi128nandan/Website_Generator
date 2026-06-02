import { GraphState } from './state';
import { RootCauseAgent } from '../agents/root-cause-agent';
import { RepairAgent } from '../agents/repair-agent';
import { ErrorRegistry } from '../errors/error-registry';

export type NodeResult = Partial<GraphState> & { nextStage?: string, error?: Error };

export type GraphNode = (state: GraphState) => Promise<NodeResult>;

export const plannerNode: GraphNode = async (state) => {
  // Mock implementation calling into @paperclip/generators (to be fully integrated later)
  return { stage: 'planner', nextStage: 'generator' };
};

export const generatorNode: GraphNode = async (state) => {
  return { stage: 'generator', nextStage: 'dependency' };
};

export const dependencyNode: GraphNode = async (state) => {
  return { stage: 'dependency', nextStage: 'prisma' };
};

export const prismaNode: GraphNode = async (state) => {
  return { stage: 'prisma', nextStage: 'backend' };
};

export const backendNode: GraphNode = async (state) => {
  return { stage: 'backend', nextStage: 'frontend' };
};

export const frontendNode: GraphNode = async (state) => {
  return { stage: 'frontend', nextStage: 'validator' };
};

export const validatorNode: GraphNode = async (state) => {
  const errors = ErrorRegistry.getTimeline(state.projectId);
  if (errors.length > 0) {
    return { stage: 'validator', status: 'failed', nextStage: 'errorAnalyzer' };
  }
  return { stage: 'validator', nextStage: 'end' };
};

export const errorAnalyzerNode: GraphNode = async (state) => {
  const agent = new RootCauseAgent({ projectId: state.projectId, projectRoot: state.projectRoot });
  const diagnosis = agent.analyze();
  
  if (diagnosis && diagnosis.repairable) {
    return { stage: 'errorAnalyzer', status: 'repairing', nextStage: 'repair' };
  }
  
  return { stage: 'errorAnalyzer', status: 'failed', nextStage: 'end' };
};

export const repairNode: GraphNode = async (state) => {
  const analyzer = new RootCauseAgent({ projectId: state.projectId, projectRoot: state.projectRoot });
  const diagnosis = analyzer.analyze();
  
  if (diagnosis) {
    const agent = new RepairAgent({ projectId: state.projectId, projectRoot: state.projectRoot });
    const result = await agent.repair(diagnosis);
    
    if (result.success) {
      return { stage: 'repair', status: 'running', nextStage: 'retry', retries: state.retries + 1 };
    }
  }
  
  return { stage: 'repair', status: 'failed', nextStage: 'end' };
};

export const retryNode: GraphNode = async (state) => {
  if (state.retries >= state.maxRetries) {
    return { stage: 'retry', status: 'failed', nextStage: 'end' };
  }
  // Simplified: retry from the last stage that failed
  // In reality we would fetch from checkpoints
  return { stage: 'retry', nextStage: 'validator' };
};

export const finalValidatorNode: GraphNode = async (state) => {
  return { stage: 'finalValidator', nextStage: 'end' };
};
