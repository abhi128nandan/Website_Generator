# To-Do App
Type: task-management-app

## Features
- Task creation
- Task update
- Task deletion
- Task completion status tracking
- Due date setting
- Priority level assignment
- Task categorization
- Missing client-side validation for task creation (title non-empty, dueDate future, priority range)
- No filtering implementation in /api/tasks endpoint
- No pagination implementation in task listing
- Category relationship in Task model is not properly defined (string[] instead of relation)
- Missing UI for priority/category selection in task form
- No bulk delete functionality for completed tasks
- No status update endpoint or UI implementation
- Incomplete error handling in backend routes (GET /tasks/:id is cut off)
- No category management implementation in frontend

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
