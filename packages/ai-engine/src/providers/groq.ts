import Groq from 'groq-sdk';
import { BaseLLMProvider } from './base';
import { GenerateOptions, ProviderHealth } from './types';
import { Logger } from '@paperclip/shared';

export class GroqProvider extends BaseLLMProvider {
  private client: Groq;

  constructor(defaultModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile') {
    super(defaultModel);
    
    if (!process.env.GROQ_API_KEY) {
      Logger.error('GROQ_API_KEY is missing from environment variables');
    }

    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY || 'MISSING_API_KEY',
    });
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Invalid API Key: Please check your provider settings.');
    }
    const res = await this.client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: options?.model || this.defaultModel,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
    });

    return res.choices[0]?.message?.content || '';
  }

  async generateJSON(prompt: string, options?: GenerateOptions): Promise<string> {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Invalid API Key: Please check your provider settings.');
    }
    try {
      const res = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: options?.model || this.defaultModel,
        temperature: options?.temperature ?? 0.1, // low temp for deterministic JSON
        max_tokens: options?.maxTokens,
        response_format: { type: 'json_object' },
      });

      return res.choices[0]?.message?.content || '{}';
    } catch (err: any) {
      if (err.status === 401 || err.message?.toLowerCase().includes('api key')) {
        throw new Error('Invalid API Key: Please check your provider settings.');
      }
      throw new Error(`Provider Error: ${err.message}`);
    }
  }

  async streamText(prompt: string, onChunk: (chunk: string) => void, options?: GenerateOptions): Promise<void> {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Invalid API Key: Please check your provider settings.');
    }
    const stream = await this.client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: options?.model || this.defaultModel,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        onChunk(content);
      }
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('Missing API Key');
      }

      // Simple lightweight prompt to verify API connectivity
      await this.client.chat.completions.create({
        messages: [{ role: 'user', content: 'health check' }],
        model: this.defaultModel,
        max_tokens: 1,
      });

      return {
        status: 'ok',
        provider: 'groq',
        model: this.defaultModel,
        message: 'Groq API is reachable'
      };
    } catch (err: any) {
      return {
        status: 'error',
        provider: 'groq',
        model: this.defaultModel,
        message: err.message
      };
    }
  }
}
