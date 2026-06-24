# TodoManager
Type: task-management-crm

## Features
- Task creation with title/description
- Task completion status tracking
- Due date and priority settings
- Task categorization
- Cross-device compatibility
- Filter tasks by category/priority logic not explicitly implemented
- Mark task as complete workflow not visible in coverage
- Delete completed tasks functionality missing
- Input validation rules for task creation/editing not specified in evidence
- Priority/category filtering parameters not shown in API route implementations
- Filter tasks by category/priority (no evidence of filtering logic in backend or frontend)
- Mark task as complete (no implementation in backend routes or frontend UI)
- Delete completed tasks (missing bulk/delete-completed endpoint)
- Input validation for task creation/editing (error states exist but no validation rules shown)
- Filter tasks by category/priority (no backend route/filtering logic)
- Delete completed tasks (no bulk deletion endpoint)
- Mark task as complete (no specific status update logic)
- Input validation rules (no explicit validation implementation details)
- Task completion status update logic not visible in evidence
- Input validation rules for task fields (e.g., required fields, priority ranges)
- Bulk delete of completed tasks functionality
- Category/priority filtering UI controls missing from frontend evidence

## Architecture
This is a **standalone pnpm workspace** project.
The database connects to the central Website Generator PostgreSQL instance.

## Prerequisites
- Node.js >= 18
- pnpm >= 9
- PostgreSQL running on localhost:5432

## Getting Started

```bash
# 1. Install all dependencies from the project root
pnpm install

# 2. Copy environment config
cp .env.example .env

# 3. Generate Prisma client and push schema
pnpm --filter database run generate
pnpm --filter database run push

# 4. Start development servers
pnpm run dev
```

## Services
| Service  | Port | Command |
|----------|------|---------|
| Frontend | 5173 | `pnpm --filter frontend run dev` |
| Backend  | 4000 | `pnpm --filter backend run dev` |

## Prisma Commands
```bash
# Generate Prisma client
pnpm --filter database run generate

# Push schema to database
pnpm --filter database run push
```

## Standalone Usage
This project is a fully standalone pnpm workspace.
You can copy it anywhere and run it independently — no parent monorepo required.
