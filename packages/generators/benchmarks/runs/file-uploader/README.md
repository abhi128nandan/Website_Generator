# BenchmarkApp
Type: undefined
Mode: Frontend Application (No Backend/Database)

## Features
- # File Uploader SRS

## Requirements
- Render an `<input type="file">`.
- Accept an `onUpload` prop (function).
- Use state to track the currently selected file.
- Render a "Upload" button that triggers the `onUpload` callback with the selected file.
- Show the selected file name.
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
