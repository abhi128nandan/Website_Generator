"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqProvider = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const base_1 = require("./base");
const shared_1 = require("@website-generator/shared");
class GroqProvider extends base_1.BaseLLMProvider {
    client;
    constructor(defaultModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile') {
        super(defaultModel);
        if (!process.env.GROQ_API_KEY) {
            shared_1.Logger.error('GROQ_API_KEY is missing from environment variables');
        }
        this.client = new groq_sdk_1.default({
            apiKey: process.env.GROQ_API_KEY || 'MISSING_API_KEY',
        });
    }
    async generateText(prompt, options) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('Invalid API Key: Please check your provider settings.');
        }
        const res = await this.client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: options?.model || this.defaultModel,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens || 1500,
        });
        return res.choices[0]?.message?.content || '';
    }
    async generateJSON(prompt, options) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('Invalid API Key: Please check your provider settings.');
        }
        try {
            const res = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: options?.model || this.defaultModel,
                temperature: options?.temperature ?? 0.1, // low temp for deterministic JSON
                max_tokens: options?.maxTokens || 1500,
                response_format: { type: 'json_object' },
            });
            return res.choices[0]?.message?.content || '{}';
        }
        catch (err) {
            if (err.status === 401 || err.message?.toLowerCase().includes('api key')) {
                throw new Error('Invalid API Key: Please check your provider settings.');
            }
            throw new Error(`Provider Error: ${err.message}`);
        }
    }
    async streamText(prompt, onChunk, options) {
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
    async healthCheck() {
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
        }
        catch (err) {
            return {
                status: 'error',
                provider: 'groq',
                model: this.defaultModel,
                message: err.message
            };
        }
    }
}
exports.GroqProvider = GroqProvider;
