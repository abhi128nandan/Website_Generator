# BenchmarkApp
Type: undefined
Mode: Frontend Application (No Backend/Database)

## Features
- # Tooltip Component SRS

## Requirements
- Render a wrapper `div` that listens to `onMouseEnter` and `onMouseLeave`.
- Accept `content` prop (string) to show inside the tooltip.
- Accept `children` prop (React node) which triggers the tooltip.
- Use state to track visibility.
- Render the tooltip absolutely positioned if visible.
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
