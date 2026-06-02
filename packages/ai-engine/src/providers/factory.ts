import { BaseLLMProvider } from './base';
import { GroqProvider } from './groq';
import { OpenRouterProvider } from './openrouter';
import { OllamaProvider } from './ollama';
import { Logger } from '@paperclip/shared';

export class ProviderFactory {
  static getProvider(): BaseLLMProvider {
    const providerName = process.env.AI_PROVIDER || 'groq';

    switch (providerName.toLowerCase()) {
      case 'groq':
        return new GroqProvider();
      
      case 'openrouter':
        return new OpenRouterProvider();
        
      case 'ollama':
        return new OllamaProvider();
      
      default:
        Logger.warn(`Unknown AI_PROVIDER '${providerName}', falling back to Groq`);
        return new GroqProvider();
    }
  }
}
