# TaskMate
Type: social-task-management
Mode: Hybrid Fullstack (with Database)

## Features
- Task creation
- Task deletion
- Task completion toggle
- Priority assignment
- Category associations
- Real-time collaborative chat
- User authentication

## Architecture
This is a **hybrid fullstack** application with a React frontend and Express backend.
PostgreSQL is used for data persistence.

## Prerequisites
- Node.js >= 18
- pnpm >= 9
- PostgreSQL running on localhost:5432

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment config
cp .env.example .env

# 3. Generate Prisma client and push schema
pnpm --filter database run generate
pnpm --filter database run push

# Start development servers
pnpm run dev
```

## Services
| Service  | Port | Command |
|----------|------|---------|
| Frontend | 5173 | `pnpm --dir frontend dev` |
| Backend  | 4000 | `pnpm --dir backend dev` |
