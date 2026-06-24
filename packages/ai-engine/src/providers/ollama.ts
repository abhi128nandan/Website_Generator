import { BaseLLMProvider } from './base';
import { GenerateOptions, ProviderHealth } from './types';
import { Logger } from '@website-generator/shared';

export class OllamaProvider extends BaseLLMProvider {
  private baseUrl: string;

  constructor(defaultModel = process.env.OLLAMA_MODEL || 'llama3') {
    super(defaultModel);
    this.baseUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  }

  private async fetchCompletions(prompt: string, options?: GenerateOptions, jsonMode = false): Promise<any> {
    const payload: any = {
      model: options?.model || this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      options: {
        temperature: options?.temperature ?? (jsonMode ? 0.1 : 0.7),
      },
      stream: false
    };

    if (jsonMode) {
      payload.format = 'json';
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Provider Error: HTTP ${res.status}`);
      }

      return await res.json();
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED') {
        throw new Error('Ollama is offline or not running.');
      }
      throw e;
    }
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const data = await this.fetchCompletions(prompt, options, false);
    return data.message?.content || '';
  }

  async generateJSON(prompt: string, options?: GenerateOptions): Promise<string> {
    const data = await this.fetchCompletions(prompt, options, true);
    return data.message?.content || '{}';
  }

  async streamText(prompt: string, onChunk: (chunk: string) => void, options?: GenerateOptions): Promise<void> {
    const payload: any = {
      model: options?.model || this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      options: {
        temperature: options?.temperature ?? 0.7,
      },
      stream: true
    };

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Provider Error: HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim().length > 0);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            const content = data.message?.content;
            if (content) onChunk(content);
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED') {
        throw new Error('Ollama is offline or not running.');
      }
      throw e;
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) {
        throw new Error('Ollama returned error');
      }

      return {
        status: 'ok',
        provider: 'ollama',
        model: this.defaultModel,
        message: 'Ollama is reachable'
      };
    } catch (err: any) {
      return {
        status: 'error',
        provider: 'ollama',
        model: this.defaultModel,
        message: err.code === 'ECONNREFUSED' ? 'Ollama is offline' : err.message
      };
    }
  }
}
