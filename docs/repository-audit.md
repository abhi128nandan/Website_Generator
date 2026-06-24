# Repository Audit Report

This report documents the verification of files and dependencies marked as unused by `knip`. Each item has been verified against the entire repository to ensure no dynamic imports, file system scans, scripts, or future templates rely on it.

## 1. Safe Removal Candidates (Phase 2)

These files satisfy all conditions: they are not imported anywhere, not dynamically loaded, not referenced by scripts or tests, not used by runtime file scanning, not referenced by documentation, and not part of the active generation flow.

| File Path | Why Flagged | Verification Result | Safe to Delete? |
|-----------|-------------|---------------------|-----------------|
| `test-ast-validator.js` | Unreferenced script | Not referenced anywhere in the repository. | Yes |
| `test-groq-models.js` | Unreferenced script | Not referenced anywhere in the repository. | Yes |
| `test-loop.js` | Unreferenced script | Not referenced anywhere in the repository. | Yes |
| `test-norm.ts` | Unreferenced script | Not referenced anywhere in the repository. | Yes |
| `test-phase1-e2e.js` | Unreferenced script | Not referenced anywhere in the repository. | Yes |
| `test-post.js` | Unreferenced script | Not referenced anywhere in the repository. | Yes |
| `test-quality-checker.ts` | Unreferenced script | Not referenced anywhere in the repository. | Yes |
| `test-regex.js` | Unreferenced script | Not referenced anywhere in the repository. | Yes |
| `test-zod.ts` | Unreferenced script | Not referenced anywhere in the repository. | Yes |
| `test-zod2.js` | Unreferenced script | Not referenced anywhere in the repository. | Yes |
| `test-zod3.mjs` | Unreferenced script | Not referenced anywhere in the repository. | Yes |
| `test-target-dir/frontend/src/App.tsx` | Unreferenced file | Leftover artifact from previous testing output. | Yes |
| `test-target-dir/frontend/src/main.tsx` | Unreferenced file | Leftover artifact from previous testing output. | Yes |
| `packages/parser/src/__tests__/run-tests.mjs` | Unreferenced script | Only referenced within itself in a comment. No package.json scripts use it. | Yes |
| `archive/unused-candidates/migrate-projects.js` | Unreferenced | Already moved to archive, no active usage. | Yes |
| `archive/unused-candidates/packages/ai-engine/test-groq.js` | Unreferenced | Already moved to archive, no active usage. | Yes |
| `archive/unused-candidates/packages/ai-engine/test-pdf.js` | Unreferenced | Already moved to archive, no active usage. | Yes |
| `archive/unused-candidates/packages/ai-engine/test-pdf.ts` | Unreferenced | Already moved to archive, no active usage. | Yes |

## 2. Manual Review Required (Phase 3)

The following files were explicitly marked for manual review. They will NOT be deleted automatically.

| File / Component | Verification Result | Recommendation | Safe to Delete? |
|------------------|---------------------|----------------|-----------------|
| `apps/website-generator-backend/src/runtime/__tests__/*` | Mentioned in `docs/reports/unused-files-report.md` and old `tsconfig.json` entries. However, `run_audit.js`, `test_functional_validator_failure.ts`, `test_repair_agent.ts`, `test_repair_rollback.ts` are not executed by any active test suites or NPM scripts. | These appear to be obsolete unit tests for the backend runtime environment. | **Requires User Approval** |
| `apps/website-generator-backend/src/runtime/__tests__/process-registry.test.ts` | Not imported anywhere. Contains an isolated test suite for the `ProcessRegistry`. | Obsolete test file. | **Requires User Approval** |
| `trigger.js` | Unreferenced script. Not found anywhere in the repository except its own file. | Appears obsolete (likely an ad-hoc run script). | **Requires User Approval** |
| `PortManager` (`apps/website-generator-backend/src/runtime/port-manager.ts`) | The class `PortManager` is exported, but only the instance `portManager` is used. | The class export is obsolete, but the file itself is actively used to export `portManager`. Remove only the `export` keyword from the class. | **Requires User Approval (Modify, not Delete)** |
| `ProcessRegistry` (`apps/website-generator-backend/src/runtime/process-registry.ts`) | The class `ProcessRegistry` is exported, but only the instance `processRegistry` is used. It is imported by `process-registry.test.ts` which is itself obsolete. | The class export is obsolete. Remove only the `export` keyword from the class. | **Requires User Approval (Modify, not Delete)** |
| `archive/*` | Unused candidates moved during previous cleanups. | Obsolete files. | **Requires User Approval** |

## 3. Dependency Cleanup (Phase 4)

The following dependencies were flagged as unused by Knip. Each has been thoroughly checked.

| Package | Dependency | Verification Result | Safe to Remove? |
|---------|------------|---------------------|-----------------|
| `apps/website-generator-backend` | `@website-generator/db` | No imports in `apps/website-generator-backend` code. The backend is an API gateway that does not use the Prisma DB package directly. | Yes |
| `apps/website-generator-frontend` | `react-router-dom` | No imports in `apps/website-generator-frontend` code. While it is heavily used by generated *templates* (e.g., `App.tsx` string interpolation in generators), the frontend dashboard application itself does not import it. | Yes |
| `packages/ai-engine` | `zod` | No imports in `packages/ai-engine` code. It relies on `RequirementsSchema` from `@website-generator/shared` instead. | Yes |
| `packages/frontend-intelligence`| `@website-generator/shared` | No imports anywhere in `packages/frontend-intelligence` code. | Yes |
| `packages/frontend-intelligence`| `@langchain/langgraph` | No imports anywhere in `packages/frontend-intelligence` code. Langchain logic was likely moved to `ai-engine` or deprecated. | Yes |
| `packages/frontend-intelligence`| `@langchain/core` | No imports anywhere in `packages/frontend-intelligence` code. | Yes |
| `apps/website-generator-backend` | `@types/pdf-parse` (dev) | No imports. PDF parsing is handled by `ai-engine`. | Yes |
| `packages/ai-engine` | `@types/multer` (dev) | No imports. | Yes |
