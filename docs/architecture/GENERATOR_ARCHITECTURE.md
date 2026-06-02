# Generator Architecture

## Module Responsibilities

The generation system utilizes a separated, additive module architecture across workspace boundaries:

### 1. `@paperclip/ai-engine`
- **`parser.ts`**: Provides `extractRawText()`. Strips null bytes, normalizes whitespace, and extracts PDF content using `pdf-parse` or parses pure text files.
- **`extractor.ts`**: Implements `extractRequirements()`. Exclusively responsible for prompting `Ollama` (`qwen2.5-coder:7b`) to map the SRS to a deterministic JSON architecture. Enforces Zod schema validation and retry logic.

### 2. `@paperclip/generators`
- **`templates/frontend.ts`**: Procedurally generates a Vite + React + Tailwind scaffold in the `frontend` subdirectory of the generated target.
- **`templates/backend.ts`**: Procedurally generates an Express API scaffold configured with TypeScript, `dotenv`, and dynamically inserts mapped routes.
- **`templates/database.ts`**: Scaffolds a Prisma schema connecting to PostgreSQL, procedurally creating simple `model` configurations for any extracted database entities.
- **`index.ts`**: Orchestrates `Scaffolder.generateProject()`. Connects templates, writes the base `README.md`, `docker-compose.yml`, and root environment configurations.

### 3. `@paperclip/shared`
- Exposes strict TypeScript boundaries (`RequirementsSchema`, `NormalizedRequirements`, `GenerationEvent`) ensuring data validation is identical between the Node Server, Generators, AI-Engine, and React Web UI.

## Error Recovery Strategy
- **Zod Exceptions:** On JSON malformation (often seen with small LLMs hallucinating markdown ticks), the extractor attempts exponential backoff and retries the prompt.
- **Pipeline Failure:** If an exception bubbles up to the orchestrating `generatePipeline()`, a terminal error is dispatched to the SSE stream. The lightweight JSON Project Registry is safely updated to `error` state.

## Future Scaling Recommendations
1. Integrate queue systems (e.g., BullMQ) for heavy traffic generation.
2. Upgrade lightweight JSON registry (`projects.json`) to Prisma / PostgreSQL once DB persistence becomes necessary.
3. Migrate Server-Sent Events to persistent Websockets if bi-directional interaction (e.g., human-in-the-loop chat) is required.
