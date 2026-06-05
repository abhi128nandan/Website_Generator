# TodoManager
Type: crud-admin
Mode: Hybrid Fullstack

## Features
- Task creation with title, description, and due date
- Task status tracking (completed/pending)
- Priority settings (high/medium/low)
- Task categorization
- Responsive UI for multi-device compatibility

## Architecture
This is a **hybrid fullstack** application with a React frontend and Express backend.
No database is required.

## Prerequisites
- Node.js >= 18
- pnpm >= 9


## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment config
cp .env.example .env

# Start development servers
pnpm run dev
```

## Services
| Service  | Port | Command |
|----------|------|---------|
| Frontend | 5173 | `pnpm --dir frontend dev` |
| Backend  | 4000 | `pnpm --dir backend dev` |
