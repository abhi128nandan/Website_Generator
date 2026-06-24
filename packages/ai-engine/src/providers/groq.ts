import Groq from 'groq-sdk';
import { BaseLLMProvider } from './base';
import { GenerateOptions, ProviderHealth } from './types';
import { Logger } from '@website-generator/shared';
import { GenerationTruncationError } from './errors';
import fs from 'fs';
import path from 'path';

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

    const model = options?.model || this.defaultModel;
    const isThinkingModel = /qwen|deepseek|qwq/i.test(model);

    const params: Record<string, unknown> = {
      messages: [
        { role: 'system', content: 'You are a source code generator. Output ONLY valid source code. The first non-whitespace characters of your response must be an import or export statement. Do not include explanations, reasoning, markdown fences, or natural language.' },
        { role: 'user', content: prompt }
      ],
      model,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || 4096,
    };

    // Suppress thinking/reasoning output for thinking-capable models
    if (isThinkingModel) {
      params.reasoning_format = 'hidden';
    }

    const res = await this.client.chat.completions.create(params as any);
    
    const finishReason = res.choices[0]?.finish_reason || 'unknown';
    const promptTokens = res.usage?.prompt_tokens || 0;
    const completionTokens = res.usage?.completion_tokens || 0;
    
    const logData = {
      timestamp: new Date().toISOString(),
      provider: 'groq',
      model,
      requested_max_tokens: params.max_tokens,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      finish_reason: finishReason
    };

    const artifactsDir = 'c:\\website-generator-core\\website-generator-core\\generation-artifacts';
    const reportPath = path.join(artifactsDir, 'token-report.json');
    try {
      if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
      fs.appendFileSync(reportPath, JSON.stringify(logData) + '\n', 'utf8');
    } catch (e) {
      Logger.error(`Failed to write token report: ${e}`);
    }

    if (['length', 'max_tokens', 'token_limit'].includes(finishReason)) {
      Logger.warn(`[GroqProvider] TRUNCATED_OUTPUT detected. Finish reason: ${finishReason}`);
      throw new GenerationTruncationError('Generation truncated by provider', 'groq', model, finishReason, promptTokens, completionTokens);
    }

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
        max_tokens: options?.maxTokens || 4096,
        response_format: { type: 'json_object' },
      });

      const finishReason = res.choices[0]?.finish_reason || 'unknown';
      const promptTokens = res.usage?.prompt_tokens || 0;
      const completionTokens = res.usage?.completion_tokens || 0;

      const logData = {
        timestamp: new Date().toISOString(),
        provider: 'groq',
        model: options?.model || this.defaultModel,
        requested_max_tokens: options?.maxTokens || 4096,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        finish_reason: finishReason
      };

      const artifactsDir = 'c:\\website-generator-core\\website-generator-core\\generation-artifacts';
      const reportPath = path.join(artifactsDir, 'token-report.json');
      try {
        if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
        fs.appendFileSync(reportPath, JSON.stringify(logData) + '\n', 'utf8');
      } catch (e) {
        Logger.error(`Failed to write token report: ${e}`);
      }

      if (['length', 'max_tokens', 'token_limit'].includes(finishReason)) {
        Logger.warn(`[GroqProvider] TRUNCATED_OUTPUT detected in JSON. Finish reason: ${finishReason}`);
        throw new GenerationTruncationError('JSON generation truncated by provider', 'groq', options?.model || this.defaultModel, finishReason, promptTokens, completionTokens);
      }

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
      max_tokens: options?.maxTokens || 1500,
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
