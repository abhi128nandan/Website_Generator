# TodoManager
Type: crud-admin

## Features
- Task creation with title, description, due date, priority
- Task status tracking (completed/pending)
- Task categorization
- Edit and delete tasks
- Responsive UI for multiple devices
- Missing PUT/PATCH endpoint for task updates
- Missing DELETE endpoint for task deletion
- No form implementation for task editing/deletion
- No validation for required task fields (title, category)
- Incomplete task status toggle logic (mark as complete)
- Dashboard metrics not connected to actual task data
- Navigation buttons without backend integration

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
