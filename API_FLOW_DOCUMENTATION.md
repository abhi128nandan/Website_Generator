# API Flow Documentation

This document outlines the specific HTTP endpoints handling the AI Application Generation Pipeline.

## Endpoints

### 1. `POST /api/generate`
**Description:** Main ingestion endpoint for SRS document uploads.
- **Request Type:** `multipart/form-data`
- **Body Params:**
  - `srs` (File): PDF, TXT, or MD format.
- **Response:**
  - `200 OK`: Returns `{ "projectId": "uuid" }` signifying generation has been kicked off in the background.

**Lifecycle:**
1. Validates presence of `req.file`.
2. Instantiates a unique `projectId` and adds a pending project to the JSON Registry.
3. Kicks off `generatePipeline()` asynchronously.
4. If `generatePipeline()` throws an error, captures it and updates registry status to `error`.

### 2. `GET /api/projects/:id/logs`
**Description:** SSE endpoint for streaming live progress to the frontend UI.
- **Request Type:** `GET`
- **Response Type:** `text/event-stream`
- **Payload Format:** JSON serialized `GenerationEvent`:
  \`\`\`json
  {
    "step": number,
    "totalSteps": number,
    "message": string,
    "status": "pending" | "in-progress" | "completed" | "error"
  }
  \`\`\`
- **Behavior:** The stream is closed automatically once an event with status `completed` or `error` is transmitted.

### 3. `GET /api/projects`
**Description:** Retrieves the list of generated or generating projects from the lightweight JSON registry.
- **Request Type:** `GET`
- **Response:** Array of `GeneratedProject` metadata.
