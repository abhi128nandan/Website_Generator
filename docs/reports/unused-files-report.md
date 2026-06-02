# Unused Files Report

This report documents the unreferenced files identified during the repository audit and details where they have been archived.

## Methodology
Every file in the repository was analyzed for reference paths including:
- Standard ES Module imports (`import ... from '...'`)
- CommonJS `require()` calls
- Dynamic imports (`import(...)`)
- Configuration mappings (`package.json`, `tsconfig.json`, `turbo.json`, `pnpm-workspace.yaml`)
- Script and build pipelines

Files with 0 references across all categories were flagged as unused candidates and archived to preserve the option for restoration.

---

## 1. Archived Files

The following files had zero active references in the codebase and were moved to `archive/unused-candidates/` to keep the active source trees clean:

### Root Level
- **`generate_weather.json`** ➔ `archive/unused-candidates/generate_weather.json`
  - *Reason:* A static JSON payload used as a prompt template for weather tracker generation testing. Not directly read or loaded by any application logic.

### Package: `@paperclip/ai-engine`
- **`packages/ai-engine/test-groq.js`** ➔ `archive/unused-candidates/packages/ai-engine/test-groq.js`
  - *Reason:* A historical testing script for Groq API connectivity. Replaced by verified scratch diagnostics.
- **`packages/ai-engine/test-pdf.js`** ➔ `archive/unused-candidates/packages/ai-engine/test-pdf.js`
  - *Reason:* A raw JavaScript PDF-parsing test script. Replaced by pipeline E2E tests.
- **`packages/ai-engine/test-pdf.ts`** ➔ `archive/unused-candidates/packages/ai-engine/test-pdf.ts`
  - *Reason:* A TypeScript variation of the PDF parsing test. Unimported and unused.

---

## 2. Preserved Files (Requires Verification)

The following files are not imported by the main applications but are preserved in place because they serve as utility test suites or E2E audit scripts:
- **`apps/server/src/runtime/__tests__/run_audit.js`**
  - *Reason:* An E2E pipeline regression script used to verify multi-mode generator outputs. Updated to point to new `runtime/` path parameters.
- **`apps/server/src/runtime/__tests__/test_repair_rollback.ts`**
  - *Reason:* Unit test suite for Phase 12 Repair Agent rollback safety.
- **`apps/server/src/runtime/__tests__/test_repair_agent.ts`**
  - *Reason:* Unit test suite for general repair functionality.
- **`apps/server/src/runtime/__tests__/process-registry.test.ts`**
  - *Reason:* Port and process allocation test suite.
