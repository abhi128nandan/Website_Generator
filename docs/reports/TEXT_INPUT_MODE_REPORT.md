# Direct Text Generation Mode Report

## Overview
The Website Generator Core platform now fully supports **Direct Text Generation Mode**, providing developers a blazing-fast testing and prototyping experience without requiring them to build or upload PDF/Markdown files first.

## Architecture Changes
### Unified Generation Pipeline (`apps/server/src/routes/generate.ts`)
We refactored the extraction entry-point to consolidate request processing. We implemented `normalizeInput(req)` to act as an ingress normalization layer:
- **`multipart/form-data` (File Upload):** Buffers the file to `DocumentParser.extractRawText()` returning cleaned string content.
- **`application/json` (Text Mode):** Completely bypasses the parser overhead, returning the `req.body.text` directly.

This guarantees exactly *zero* logic duplication. The unified payload is then funneled natively into `generatePipeline(projectId, rawText)` where the generic AI extraction and code scaffolding occurs.

### Frontend Modernization (`apps/web/src/App.tsx`)
Added a responsive split-mode UI to support real-time generation:
- Stateful `upload` and `text` tabs to cleanly manage contextual rendering.
- A built-in text area optimized with sample scaffold prompts (`Build a Todo App with...`).
- Auto-character tracking for debugging payload sizes.
- Flexible POST payloads utilizing `fetch` intelligently (FormData for files, JSON strings for text input).

## PDF Parsing Bug Fix (`packages/ai-engine/src/parser.ts`)
**Issue:** `"pdf is not a function"`
**Cause:** Node.js v22 strict ESM evaluation caused the legacy CommonJS `require('pdf-parse')` to export as an unpredictable module namespace (`{ default: Function }` vs direct function mapping).
**Fix:** Refactored the require to a standard ES module default import (`import pdf from 'pdf-parse'`) and safely asserted the type signature to navigate TypeScript's module resolution errors cleanly (`const parsePdf: any = pdf;`).

## Validation Results
1. Text Generation successfully bypasses the parser.
2. PDF Uploads correctly extract using the patched parser.
3. Both architectures merge cleanly into the unified Zod extraction engine.
4. Server Streaming Events (SSE) and Project Registration logs remain unaffected.
5. `pnpm turbo build` verified end-to-end with no TypeScript compilation errors.
