"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
const base_1 = require("./base");
class OllamaProvider extends base_1.BaseLLMProvider {
    baseUrl;
    constructor(defaultModel = process.env.OLLAMA_MODEL || 'llama3') {
        super(defaultModel);
        this.baseUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    }
    async fetchCompletions(prompt, options, jsonMode = false) {
        const payload = {
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
        }
        catch (e) {
            if (e.code === 'ECONNREFUSED') {
                throw new Error('Ollama is offline or not running.');
            }
            throw e;
        }
    }
    async generateText(prompt, options) {
        const data = await this.fetchCompletions(prompt, options, false);
        return data.message?.content || '';
    }
    async generateJSON(prompt, options) {
        const data = await this.fetchCompletions(prompt, options, true);
        return data.message?.content || '{}';
    }
    async streamText(prompt, onChunk, options) {
        const payload = {
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
            if (!reader)
                return;
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(l => l.trim().length > 0);
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        const content = data.message?.content;
                        if (content)
                            onChunk(content);
                    }
                    catch (e) {
                        // Ignore parsing errors
                    }
                }
            }
        }
        catch (e) {
            if (e.code === 'ECONNREFUSED') {
                throw new Error('Ollama is offline or not running.');
            }
            throw e;
        }
    }
    async healthCheck() {
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
        }
        catch (err) {
            return {
                status: 'error',
                provider: 'ollama',
                model: this.defaultModel,
                message: err.code === 'ECONNREFUSED' ? 'Ollama is offline' : err.message
            };
        }
    }
}
exports.OllamaProvider = OllamaProvider;
