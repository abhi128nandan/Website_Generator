import { BaseLLMProvider } from './base';
import { GenerateOptions, ProviderHealth } from './types';
import { Logger } from '@paperclip/shared';

export class OpenRouterProvider extends BaseLLMProvider {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(defaultModel = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-70b-instruct') {
    super(defaultModel);
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      Logger.error('OPENROUTER_API_KEY is missing from environment variables');
    }
  }

  private async fetchCompletions(prompt: string, options?: GenerateOptions, jsonMode = false): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Invalid API Key: Please check your provider settings.');
    }

    const payload: any = {
      model: options?.model || this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? (jsonMode ? 0.1 : 0.7),
    };

    if (options?.maxTokens) {
      payload.max_tokens = options.maxTokens;
    }

    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Invalid API Key: Please check your provider settings.');
      }
      throw new Error(`Provider Error: HTTP ${res.status}`);
    }

    return await res.json();
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const data = await this.fetchCompletions(prompt, options, false);
    return data.choices?.[0]?.message?.content || '';
  }

  async generateJSON(prompt: string, options?: GenerateOptions): Promise<string> {
    const data = await this.fetchCompletions(prompt, options, true);
    return data.choices?.[0]?.message?.content || '{}';
  }

  async streamText(prompt: string, onChunk: (chunk: string) => void, options?: GenerateOptions): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Invalid API Key: Please check your provider settings.');
    }

    const payload: any = {
      model: options?.model || this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? 0.7,
      stream: true
    };

    if (options?.maxTokens) {
      payload.max_tokens = options.maxTokens;
    }

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Invalid API Key: Please check your provider settings.');
      }
      throw new Error(`Provider Error: HTTP ${res.status}`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        const dataStr = line.replace('data: ', '').trim();
        if (dataStr === '[DONE]') continue;
        try {
          const data = JSON.parse(dataStr);
          const content = data.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch (e) {
          // Ignore parsing errors for incomplete chunks
        }
      }
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    try {
      if (!this.apiKey) {
        throw new Error('Missing API Key');
      }

      await this.fetchCompletions('hello', { maxTokens: 1 }, false);

      return {
        status: 'ok',
        provider: 'openrouter',
        model: this.defaultModel,
        message: 'OpenRouter API is reachable'
      };
    } catch (err: any) {
      return {
        status: 'error',
        provider: 'openrouter',
        model: this.defaultModel,
        message: err.message
      };
    }
  }
}
