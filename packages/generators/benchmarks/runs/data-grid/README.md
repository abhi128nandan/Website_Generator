# BenchmarkApp
Type: undefined
Mode: Frontend Application (No Backend/Database)

## Features
- # Data Grid Component SRS

## Requirements
- Render a `table` element.
- Accept `columns` prop (array of strings).
- Accept `data` prop (array of objects).
- Dynamically render table headers based on columns.
- Dynamically render table rows based on data.
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
