import { BaseLLMProvider } from './base';
import { GenerateOptions, ProviderHealth } from './types';
import { GenerationTruncationError } from './errors';
import { Logger } from '@website-generator/shared';
import crypto from 'crypto';

export interface RetryWrapperConfig {
  maxRetries?: number;
}

export class TruncationRetryWrapper extends BaseLLMProvider {
  private provider: BaseLLMProvider;
  private maxRetries: number;

  constructor(provider: BaseLLMProvider, config?: RetryWrapperConfig) {
    super(provider.getModel());
    this.provider = provider;
    this.maxRetries = config?.maxRetries ?? 2;
  }

  private hashPrompt(prompt: string): string {
    return crypto.createHash('md5').update(prompt).digest('hex').substring(0, 8);
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    return this.withRetry(() => this.provider.generateText(prompt, options), prompt);
  }

  async generateJSON(prompt: string, options?: GenerateOptions): Promise<string> {
    return this.withRetry(() => this.provider.generateJSON(prompt, options), prompt);
  }

  async streamText(prompt: string, onChunk: (chunk: string) => void, options?: GenerateOptions): Promise<void> {
    // Streaming usually doesn't retry well mid-stream, but we'll wrap the initial call.
    return this.withRetry(() => this.provider.streamText(prompt, onChunk, options), prompt);
  }

  async healthCheck(): Promise<ProviderHealth> {
    return this.provider.healthCheck();
  }

  getModel(): string {
    return this.provider.getModel();
  }

  private async withRetry<T>(fn: () => Promise<T>, prompt: string): Promise<T> {
    let attempt = 0;
    const fingerprint = this.hashPrompt(prompt);

    while (true) {
      try {
        const result = await fn();
        if (attempt > 0) {
          Logger.info(`[TruncationRetryWrapper] [${fingerprint}] Success after ${attempt} retries.`);
        }
        return result;
      } catch (err: any) {
        if (err instanceof GenerationTruncationError) {
          Logger.warn(`[TruncationRetryWrapper] [${fingerprint}] Truncation detected: ${err.promptSize} prompt tokens, ${err.completionSize} completion tokens. Reason: ${err.finishReason}.`);
          
          if (attempt < this.maxRetries) {
            attempt++;
            Logger.warn(`[TruncationRetryWrapper] [${fingerprint}] Retrying locally (Attempt ${attempt}/${this.maxRetries})...`);
            continue;
          } else {
            Logger.error(`[TruncationRetryWrapper] [${fingerprint}] Retry exhaustion. Truncation persisted after ${this.maxRetries} retries.`);
            // Attach retry exhaustion metadata
            (err as any).retryAttempts = attempt;
            (err as any).fingerprint = fingerprint;
            throw err;
          }
        }
        throw err; // Re-throw non-truncation errors
      }
    }
  }
}
