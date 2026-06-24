# Enterprise CRM Platform
Type: crm-platform
Mode: Hybrid Fullstack (with Database)

## Features
- Authentication with login, registration, and logout actions
- Protected routes based on roles: USER, MANAGER, ADMIN
- Manage contacts, leads, and sales pipelines
- Role-based dashboard views where ADMIN can view all pipelines, MANAGER can assign leads, and USER can only view and update their assigned leads
- Session persistence via localStorage and loading states during authentication check
- API calls using React Query and services passing auth token in headers

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
