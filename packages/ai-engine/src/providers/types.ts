export interface ProviderHealth {
  status: 'ok' | 'error';
  provider: string;
  model: string;
  message: string;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
