import { BaseLLMProvider } from './base';
import { GenerateOptions, ProviderHealth } from './types';
import { Logger } from '@website-generator/shared';

export class OpenAICompatibleProvider extends BaseLLMProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(defaultModel = process.env.OPENAI_COMPATIBLE_MODEL || 'gpt-3.5-turbo') {
    super(defaultModel);
    this.apiKey = process.env.OPENAI_COMPATIBLE_API_KEY || '';
    this.baseUrl = process.env.OPENAI_COMPATIBLE_BASE_URL || 'http://localhost:8080/v1/chat/completions';
    
    if (!this.apiKey && this.baseUrl.includes('api.openai.com')) {
      Logger.warn('OPENAI_COMPATIBLE_API_KEY is missing, which might be required for your base URL');
    }
  }

  private async fetchCompletions(prompt: string, options?: GenerateOptions, jsonMode = false): Promise<any> {
    const model = options?.model || this.defaultModel;
    const isThinkingModel = /qwen|deepseek|qwq/i.test(model);

    const messages: any[] = [];
    if (!jsonMode) {
      messages.push({ role: 'system', content: 'You are a source code generator. Output ONLY valid source code. The first non-whitespace characters of your response must be an import or export statement. Do not include explanations, reasoning, markdown fences, or natural language.' });
    }
    messages.push({ role: 'user', content: prompt });

    const payload: any = {
      model,
      messages,
      temperature: options?.temperature ?? (jsonMode ? 0.1 : 0.7),
      max_tokens: options?.maxTokens || 4096,
    };

    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    if (isThinkingModel) {
      payload.reasoning = { effort: 'none' };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers,
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
    const payload: any = {
      model: options?.model || this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? 0.7,
      stream: true
    };

    if (options?.maxTokens) {
      payload.max_tokens = options.maxTokens;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers,
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
      await this.fetchCompletions('hello', { maxTokens: 1 }, false);

      return {
        status: 'ok',
        provider: 'openai-compatible',
        model: this.defaultModel,
        message: 'OpenAI-compatible API is reachable'
      };
    } catch (err: any) {
      return {
        status: 'error',
        provider: 'openai-compatible',
        model: this.defaultModel,
        message: err.message
      };
    }
  }
}
