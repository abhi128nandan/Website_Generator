# BenchmarkApp
Type: undefined
Mode: Frontend Application (No Backend/Database)

## Features
- # User Profile Card SRS

## Requirements
- Render a card displaying user information.
- Accept a `user` prop containing `name`, `email`, and `avatarUrl` (all strings).
- Show an `img` tag with the avatar.
- Display the user's name as an `h2` and email as a `p`.
- Must be a functional component exported as default.


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
