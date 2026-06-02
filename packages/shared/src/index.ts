export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CONSTANTS = {
  APP_NAME: 'Paperclip Core',
  VERSION: '1.0.0',
};

export class Logger {
  static info(message: string, ...meta: any[]) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...meta);
  }
  
  static error(message: string, error?: any) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }
  
  static warn(message: string, ...meta: any[]) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...meta);
  }
}

import { z } from 'zod';

export const RequirementsSchema = z.object({
  appName: z.string().min(1, 'App name cannot be empty'),
  appType: z.string().min(1, 'App type cannot be empty'),
  frontend: z.array(z.string()),
  backend: z.array(z.string()),
  database: z.array(z.string()),
  features: z.array(z.string()).min(1, 'Must extract at least one feature'),
  workflows: z.array(z.string()),
  entities: z.array(z.string()),
  routes: z.array(z.string()),
});

export const CrudArchitectureSchema = z.object({
  entities: z.array(z.object({
    name: z.string(),
    fields: z.array(z.object({
      name: z.string(),
      type: z.enum(['String', 'Int', 'Float', 'Boolean', 'DateTime']),
      isRequired: z.boolean(),
      isId: z.boolean().optional(),
      isUnique: z.boolean().optional(),
      isRelation: z.boolean().optional(),
      relationTarget: z.string().optional()
    }))
  })),
  endpoints: z.array(z.object({
    path: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    entity: z.string().optional(),
    description: z.string(),
    businessLogic: z.string().optional()
  })),
  pages: z.array(z.object({
    route: z.string(),
    componentName: z.string(),
    entity: z.string().optional(),
    description: z.string(),
    features: z.array(z.string()).optional(),
    isDashboard: z.boolean().optional()
  })),
  navigation: z.array(z.object({
    label: z.string(),
    route: z.string()
  })).optional()
});

export const ValidationSchema = z.object({
  score: z.number(),
  criteria: z.object({
    architecture: z.number().optional().default(0),
    typeScriptCompile: z.number().optional().default(0),
    importResolution: z.number().optional().default(0),
    reactStructure: z.number().optional().default(0),
    buildSuccess: z.number().optional().default(0),
    businessLogic: z.number().optional().default(0),
    frontend: z.number().optional().default(0),
    navigation: z.number().optional().default(0),
    forms: z.number().optional().default(0),
    validation: z.number().optional().default(0),
    // Legacy fields (kept for backward compat with old generations)
    database: z.number().optional().default(0),
    backend: z.number().optional().default(0),
  }),
  missingFunctionality: z.array(z.string()),
  feedback: z.string()
});

export type FunctionalValidationResult = z.infer<typeof ValidationSchema>;

export type CrudArchitecture = z.infer<typeof CrudArchitectureSchema>;

// --- Multi-Mode Generation Types ---

export type ApplicationMode = 'crud-admin' | 'frontend-app' | 'hybrid-fullstack';

export interface ClassificationResult {
  mode: ApplicationMode;
  confidence: number;            // 0-100
  reasoning: string;
  keywords: string[];            // matched keywords from prompt
  suggestedFeatures: string[];   // mode-specific feature suggestions
}

export const FrontendArchitectureSchema = z.object({
  components: z.array(z.object({
    name: z.string(),
    type: z.enum(['page', 'component', 'layout']),
    description: z.string(),
  })),
  services: z.array(z.object({
    name: z.string(),
    description: z.string(),
    externalApi: z.string().nullable().optional(),
  })),
  hooks: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })),
  pages: z.array(z.object({
    route: z.string(),
    componentName: z.string(),
    description: z.string(),
  })),
});

export type FrontendArchitecture = z.infer<typeof FrontendArchitectureSchema>;

export type NormalizedRequirements = z.infer<typeof RequirementsSchema> & {
  architecture?: CrudArchitecture;
  classifiedMode?: ApplicationMode;
  frontendArchitecture?: FrontendArchitecture;
};

export interface GenerationEvent {
  step: number;
  totalSteps: number;
  message: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

export interface GeneratedProject {
  id: string;
  name: string;
  createdAt: string;
  status: 'generating' | 'completed' | 'error';
  stack?: string[];
  inputType?: 'upload' | 'text';
  generatedFiles?: string[];
  logsPath?: string;
  rootPath?: string;
  path?: string; // Legacy
  metadata?: NormalizedRequirements;
}

export * from './network/findAvailablePort';

// --- Autonomy Types ---
export enum ErrorCategory {
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  ENVIRONMENT = 'ENVIRONMENT',
  DEPENDENCY = 'DEPENDENCY',
  GENERATION = 'GENERATION',
  VALIDATION = 'VALIDATION',
  RUNTIME = 'RUNTIME',
  NETWORK = 'NETWORK',
  FILESYSTEM = 'FILESYSTEM',
  ORCHESTRATION = 'ORCHESTRATION',
  AGENT = 'AGENT',
  DATABASE = 'DATABASE',
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  SECURITY = 'SECURITY'
}

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface StructuredError {
  id: string;
  timestamp: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  layer: string;
  service: string;
  operation: string;
  rawMessage: string;
  rootCause?: string;
  repairable: boolean;
  suggestedRepair?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}

export interface RepairAction {
  id: string;
  timestamp: string;
  errorId: string;
  strategy: string;
  status: 'pending' | 'executing' | 'success' | 'failed' | 'rolled-back';
  details?: string;
}

export type PipelineStage = 'start' | 'planner' | 'generator' | 'dependency' | 'prisma' | 'backend' | 'frontend' | 'validator' | 'errorAnalyzer' | 'repair' | 'retry' | 'finalValidator' | 'end';

export interface Checkpoint {
  id: string;
  projectId: string;
  stage: PipelineStage;
  timestamp: string;
  stateSnapshot: any;
  hash: string;
}
