import { StructuredError, RepairAction, PipelineStage, Checkpoint } from '@paperclip/shared';
import { StructuredLogEntry } from '../logger/structured-logger';

export interface RuntimeTopology {
  backendPort?: number;
  frontendPort?: number;
  databasePort?: number;
  frontendUrl?: string;
  processes: { pid: number; name: string }[];
}

export interface ArtifactManifest {
  architecture?: string;
  plan?: string;
  report?: string;
  history?: string;
}

export interface GraphState {
  projectId: string;
  stage: PipelineStage;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'repairing';
  logs: StructuredLogEntry[];
  structuredErrors: StructuredError[];
  repairs: RepairAction[];
  retries: number;
  maxRetries: number;
  runtime: RuntimeTopology;
  checkpoints: Checkpoint[];
  artifacts: ArtifactManifest;
  projectRoot: string;
  requirements?: any;
}

export function createInitialState(projectId: string, projectRoot: string, requirements?: any): GraphState {
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
