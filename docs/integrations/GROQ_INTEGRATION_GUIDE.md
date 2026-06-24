# Groq Integration Guide

This guide details how to configure and utilize Groq as the AI inference backend for the `website-generator-core` generation pipeline.

## Environment Setup
Groq relies on your personal or enterprise API key. Update your `.env` file at the root of the project to look like the following:

\`\`\`env
# AI Provider Configuration
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
\`\`\`

## Model Selection
By default, the engine is configured to use `llama-3.3-70b-versatile`. This model offers excellent performance for zero-shot JSON extraction tasks. You can switch this to `mixtral-8x7b-32768` or `llama-3.1-8b-instant` via the `GROQ_MODEL` environment variable.

## Validating Connectivity
When you boot the server via `pnpm run dev`, you will automatically see LLM diagnostics logged directly to the console:
\`\`\`
[LLM] Provider: groq
[LLM] Model: llama-3.3-70b-versatile
[LLM] Connectivity: healthy
\`\`\`
If the API key is missing or invalid, it will indicate an `unhealthy` state with the corresponding error message from the Groq SDK.
