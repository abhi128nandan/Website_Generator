# TaskMaster
Type: crud-admin

## Features
- Task creation with title/description
- Task status tracking (pending/completed)
- Priority settings (low/medium/high)
- Due date management
- Task categorization
- Cross-device compatibility
- Filtering by category/priority in GET /api/tasks
- Actual validation implementation in POST/PUT endpoints
- PUT/PATCH endpoints for editing tasks
- DELETE endpoint for task deletion
- Form submission handlers in TaskForm/TaskEditForm components
- Real data fetching/display logic in dashboard components
- Category relationship handling in Task model (should be relation, not String[])

## Architecture
This is a **standalone pnpm workspace** project.
The database connects to the central Website Generator Core PostgreSQL instance.

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
