# BenchmarkApp
Type: undefined
Mode: Frontend Application (No Backend/Database)

## Features
- # Modal Component SRS

## Requirements
- Render a fixed overlay `div` containing a modal content `div`.
- Accept an `isOpen` prop (boolean). If false, return null.
- Accept an `onClose` prop (function) to trigger when clicking the overlay or a close button.
- Render `children` inside the modal content.
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
