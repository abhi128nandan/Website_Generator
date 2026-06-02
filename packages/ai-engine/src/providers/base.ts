import { GenerateOptions, ProviderHealth } from './types';

export abstract class BaseLLMProvider {
  protected defaultModel: string;

  constructor(defaultModel: string) {
    this.defaultModel = defaultModel;
  }

  /**
   * Generates a plain text response from the provider.
   */
  abstract generateText(prompt: string, options?: GenerateOptions): Promise<string>;

  /**
   * Generates a strictly structured JSON response from the provider.
   */
  abstract generateJSON(prompt: string, options?: GenerateOptions): Promise<string>;

  /**
   * Streams a text response from the provider (useful for logs/UI).
   */
  abstract streamText(prompt: string, onChunk: (chunk: string) => void, options?: GenerateOptions): Promise<void>;

  /**
   * Checks the health and connectivity of the provider.
   */
  abstract healthCheck(): Promise<ProviderHealth>;

  /**
   * Returns the currently configured model.
   */
  getModel(): string {
    return this.defaultModel;
  }
}
