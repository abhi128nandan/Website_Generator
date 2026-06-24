# To-Do App
Type: task-management-app

## Features
- Task creation with title, description, due date, and priority
- Task status tracking (completed/pending)
- Task categorization by tags or labels
- Responsive UI for cross-device compatibility
- Task update functionality (status/priority changes)
- Category-based filtering implementation
- Due date range filtering
- Frontend validation for required fields
- Edit task form implementation
- Priority validation (1-5 range)
- Future date validation for dueDate
- Category relationship management

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
