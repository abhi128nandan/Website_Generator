import { BaseLLMProvider } from './base';
import { GroqProvider } from './groq';
import { OpenRouterProvider } from './openrouter';
import { OllamaProvider } from './ollama';
import { OpenAICompatibleProvider } from './openai-compatible';
import { Logger } from '@website-generator/shared';
import { TruncationRetryWrapper } from './retry-wrapper';

export class ProviderFactory {
  static getProvider(): BaseLLMProvider {
    const providerName = process.env.AI_PROVIDER || 'groq';

    let provider: BaseLLMProvider;

    switch (providerName.toLowerCase()) {
      case 'groq':
        provider = new GroqProvider();
        break;
      
      case 'openrouter':
        provider = new OpenRouterProvider();
        break;
        
      case 'ollama':
        provider = new OllamaProvider();
        break;
        
      case 'openai-compatible':
        provider = new OpenAICompatibleProvider();
        break;
      
      default:
        Logger.warn(`Unknown AI_PROVIDER '${providerName}', falling back to Groq`);
        provider = new GroqProvider();
        break;
    }

    return new TruncationRetryWrapper(provider);
  }
}
