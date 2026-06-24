# BenchmarkApp
Type: undefined
Mode: Frontend Application (No Backend/Database)

## Features
- # Navigation Bar SRS

## Requirements
- Render a `<nav>` element.
- Accept `links` prop (array of objects with `label` and `href`).
- Render an unordered list `<ul>` with list items `<li>` containing anchor `<a>` tags.
- Accept an `activeUrl` string prop and highlight the matching link.
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
