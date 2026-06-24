# TodoManager
Type: crud-admin

## Features
- Task creation with title/description
- Task status tracking (pending/completed)
- Due date and priority settings
- Task categorization
- Cross-device compatibility
- Edit task endpoint missing in backend
- Mark task as complete functionality not implemented
- Delete completed tasks endpoint missing
- Filter by category/priority not implemented in backend or frontend
- Task model lacks category/priority fields in database schema
- No form validation implementation shown in frontend
- TaskEditPage implementation not visible in code samples
- No UI for task completion toggle in TaskListPage

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
