# TodoManager
Type: crud-admin

## Features
- Task creation with title, description, due date, priority, and category
- Mark tasks as completed or pending
- Organize tasks by category or priority
- View task list with filtering options
- Set reminders for due dates (future enhancement)
- Cloud synchronization (future enhancement)
- User authentication (future enhancement)
- Functional validation crashed — unable to assess project quality

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
