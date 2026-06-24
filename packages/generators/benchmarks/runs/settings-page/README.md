# BenchmarkApp
Type: undefined
Mode: Frontend Application (No Backend/Database)

## Features
- # Settings Page SRS

## Requirements
- Render a page layout for user settings.
- Include a toggle switch for "Dark Mode" (requires internal state).
- Include an input field for "Username".
- Include a "Save Changes" button.
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
