# PDF Upload Pipeline Fix Report

## Root Cause
The `parsePdf is not a function` error originated from an ESM/CommonJS compatibility mismatch within the TypeScript/Turbo monorepo environment (specifically running under Node 22). When `pdf-parse` (a CommonJS library) is imported into the ESM-compiled runtime, its default export is frequently wrapped into a namespace object (e.g. `{ default: [Function] }`). 

Consequently, standard invocations like `pdf(buffer)` evaluate to an object rather than an executable function, triggering a runtime `TypeError`, crashing the asynchronous generation pipeline, and resulting in an unhandled HTTP request drop or confusing `400 Bad Request` states.

## Import Compatibility Strategy
We completely replaced the fragile default import with a robust namespace fallback heuristic:

```ts
import * as pdfParse from 'pdf-parse';

let parser: any;
if (typeof (pdfParse as any).default === 'function') {
  parser = (pdfParse as any).default;
} else if (typeof pdfParse === 'function') {
  parser = pdfParse;
} else if (typeof (pdfParse as any).pdf === 'function') {
  parser = (pdfParse as any).pdf;
} else {
  throw new Error('PDF parser function not found due to ESM/CJS mismatch.');
}
```

This guarantees the runtime will dynamically locate the actual parsing function regardless of how `ts-node` or the bundler restructures the module boundary.

## Parser Architecture
We hardened `DocumentParser.extractRawText(buffer, mimeType)` into a stable, deterministic class method with comprehensive diagnostic logging and error handling.

### Mime Support Table
| MIME Type | Handling Strategy |
|-----------|-------------------|
| `application/pdf` | Evaluated via `pdf-parse` fallback logic. Returns cleaned text. |
| `text/plain` | Directly decoded using `utf-8` buffer conversion. |
| `text/markdown` | Directly decoded using `utf-8` buffer conversion. |
| `application/octet-stream` | Treated as text/markdown to support edge-case CLI uploads. |
| *Unsupported* | Fast-fails via `throw new Error("Unsupported mime type")`. |

## API Route Hardening (`generate.ts`)
The `POST /api/generate` handler was updated to process parsing **synchronously** within the try/catch block.
- **Before:** Parser exceptions were swallowed by background promises, silently failing the request.
- **After:** Parser errors are caught instantly, gracefully returning a structured `400` JSON error:
  ```json
  { "error": "Document parsing failed", "details": "..." }
  ```

## Frontend Hardening (`App.tsx`)
The React application's `handleGenerate` method now properly parses HTTP `4xx` error payloads instead of just throwing generic "Upload failed" messages. 
- It halts infinite retries.
- It displays the explicit backend error cleanly within the SSE Generation Progress panel (e.g., `[6/6] Failed: Document parsing failed - Unsupported mime type`).

## Validation Results
1. **End-to-End Build:** `pnpm turbo build` completes successfully with zero type errors.
2. **File Processing:** Uploading actual PDFs correctly identifies the parsing function and extracts text without runtime crashes.
3. **Graceful Failures:** Invalid files (unsupported mimes) result in proper `[6/6] Failed` logs on the frontend UI without crashing the Express server.
4. **SSE Logs:** Real-time generation progress logs remain completely unimpacted.
