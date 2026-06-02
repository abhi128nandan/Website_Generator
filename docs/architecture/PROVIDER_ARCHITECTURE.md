# AI Provider Architecture

To remove rigid coupling to any specific AI vendor, the system now utilizes a clean Provider Abstraction Layer (PAL).

## Directory Structure
\`\`\`
packages/ai-engine/src/providers/
├── base.ts      # Abstract BaseLLMProvider interface
├── groq.ts      # Active implementation using groq-sdk
├── factory.ts   # ProviderFactory to bootstrap environments
├── types.ts     # GenerateOptions and ProviderHealth types
└── index.ts     # Module exports
\`\`\`

## Interface Design
Every provider must extend `BaseLLMProvider`, which guarantees the following contract:

1. **`generateText(prompt, options)`**: Raw string inference.
2. **`generateJSON(prompt, options)`**: Forced, deterministic JSON extraction.
3. **`streamText(prompt, onChunk, options)`**: Real-time SSE streaming functionality for responsive UI generation.
4. **`healthCheck()`**: Validates network connectivity and authentication context.

## Provider Factory
The `ProviderFactory` reads `process.env.AI_PROVIDER` and returns the correctly bootstrapped subclass.

## Future-Proof Extension Strategy
To add a new provider (e.g. OpenAI or Claude):
1. Create `openai.ts` implementing `BaseLLMProvider`.
2. Map their specific SDK payload in `generateJSON` (e.g. `response_format: { type: "json_object" }`).
3. Add the `openai` switch case to `ProviderFactory`.
4. Configure `.env` with `AI_PROVIDER=openai`. 

This guarantees that the downstream pipeline logic (`RequirementExtractor` and `Scaffolder`) will **never** need to be rewritten to accommodate a new inference provider.
