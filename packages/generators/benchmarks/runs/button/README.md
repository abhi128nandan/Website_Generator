# BenchmarkApp
Type: undefined
Mode: Frontend Application (No Backend/Database)

## Features
- # Button Component SRS

## Requirements
- Render a `<button>` element.
- Accept a `label` prop (string) to display text inside the button.
- Accept an `onClick` prop (function) to handle click events.
- Accept a `variant` prop ('primary', 'secondary', 'danger') to style the button differently.
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
