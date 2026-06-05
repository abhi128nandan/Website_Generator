# TodoTaskManager
Type: crud-app
Mode: Frontend Application (No Backend/Database)

## Features
- Task creation with title/description
- Task status tracking (pending/complete)
- Due date reminders
- Task filtering by status

## Architecture
This is a **frontend-only** React/Vite application.
No backend server or database is required.

## Prerequisites
- Node.js >= 18
- pnpm >= 9

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Start development server
pnpm run dev
```

## Services
| Service  | Port | Command |
|----------|------|---------|
| Frontend | 5173 | `pnpm --dir frontend dev` |
