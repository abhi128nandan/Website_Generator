# Repository Audit Report

This report presents a comprehensive audit of the Website Generator Core monorepo repository before cleanup.

## 1. Current Folder Structure
```
c:/website-generator-core/website-generator-core
├── apps/
│   ├── server/          # Express backend application
│   └── web/             # React + Vite frontend application
├── docker/              # Docker infrastructure configurations
├── generated-apps/      # Dynamic project generation outputs (local/untracked)
├── packages/
│   ├── ai-engine/       # AI provider integration layer
│   ├── autonomy/        # Pipeline orchestration and error correction
│   ├── db/              # Database schema and Prisma configuration
│   ├── frontend-intelligence/  # Intelligence fallback compilers
│   ├── generators/      # Code templates and AST/functional validators
│   └── shared/          # Shared type declarations and helpers
├── scratch/             # Local scratchpad and temporary verification files
└── docs/                # [NEW] Documentation directory
```

## 2. Findings & Categorization

### SAFE_TO_DELETE
The following files are compiled JS build artifacts that were accidentally outputted into TypeScript source directories. They should be deleted to prevent source contamination.
- `packages/generators/src/validators/ast-validator.js`
- `packages/generators/src/validators/ast-validator.js.map`
- `packages/generators/src/validators/functional-validator.js`
- `packages/generators/src/validators/functional-validator.js.map`
- `packages/generators/src/validators/react-structure-validator.js`
- `packages/generators/src/validators/react-structure-validator.js.map`
- `packages/generators/src/agents/repair-agent.js`
- `packages/generators/src/agents/repair-agent.js.map`

### SAFE_TO_MOVE
The following files are documentation files currently cluttering the root directory. They should be moved to organized folders under `docs/`.
- `GENERATOR_ARCHITECTURE.md` ➔ `docs/architecture/GENERATOR_ARCHITECTURE.md`
- `PROVIDER_ARCHITECTURE.md` ➔ `docs/architecture/PROVIDER_ARCHITECTURE.md`
- `API_FLOW_DOCUMENTATION.md` ➔ `docs/architecture/API_FLOW_DOCUMENTATION.md`
- `GROQ_INTEGRATION_GUIDE.md` ➔ `docs/integrations/GROQ_INTEGRATION_GUIDE.md`
- `GENERATION_PIPELINE_REPORT.md` ➔ `docs/reports/GENERATION_PIPELINE_REPORT.md`
- `NODE_RUNTIME_STABILIZATION_REPORT.md` ➔ `docs/reports/NODE_RUNTIME_STABILIZATION_REPORT.md`
- `PDF_PARSER_FIX_REPORT.md` ➔ `docs/reports/PDF_PARSER_FIX_REPORT.md`
- `PDF_UPLOAD_PIPELINE_FIX_REPORT.md` ➔ `docs/reports/PDF_UPLOAD_PIPELINE_FIX_REPORT.md`
- `PLATFORM_STABILIZATION_REPORT.md` ➔ `docs/reports/PLATFORM_STABILIZATION_REPORT.md`
- `PROVIDER_MIGRATION_REPORT.md` ➔ `docs/reports/PROVIDER_MIGRATION_REPORT.md`
- `TEXT_INPUT_MODE_REPORT.md` ➔ `docs/reports/TEXT_INPUT_MODE_REPORT.md`

The following files are unreferenced mock payloads or testing scripts that are safe to move into `archive/unused-candidates/`:
- `generate_weather.json` ➔ `archive/unused-candidates/generate_weather.json`
- `packages/ai-engine/test-groq.js` ➔ `archive/unused-candidates/packages/ai-engine/test-groq.js`
- `packages/ai-engine/test-pdf.js` ➔ `archive/unused-candidates/packages/ai-engine/test-pdf.js`
- `packages/ai-engine/test-pdf.ts` ➔ `archive/unused-candidates/packages/ai-engine/test-pdf.ts`

### REQUIRES_VERIFICATION
- `apps/server/src/runtime/__tests__/run_audit.js`: Not imported anywhere, but is a test script that triggers E2E project audit. Should be updated with new relative paths and preserved inside its test folder.
- `generated-apps/projects.json` & `C:\Users\abhi9\Website GeneratorProjects\projects.json`: Dynamic projects databases. Need to be merged and placed inside `runtime/projects.json` with absolute paths updated dynamically.

### DO_NOT_TOUCH
All business logic files inside `apps/` and `packages/` should be left completely intact, except for target path configurations in `apps/server/src/registry.ts`, `apps/server/src/routes/generate.ts`, and `apps/server/src/processManager.ts` (which need port updates or project generation path updates).
