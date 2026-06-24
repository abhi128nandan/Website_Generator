"use strict";
/**
 * @srs-gen/parser — Test suite
 *
 * Run with: npx tsx src/__tests__/parser.test.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const entity_extractor_1 = require("../extractors/entity-extractor");
const user_story_extractor_1 = require("../extractors/user-story-extractor");
const api_route_extractor_1 = require("../extractors/api-route-extractor");
const tech_stack_extractor_1 = require("../extractors/tech-stack-extractor");
const detect_format_1 = require("../detect-format");
// ─── Test helpers ───────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];
function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  ✅ ${message}`);
    }
    else {
        failed++;
        failures.push(message);
        console.log(`  ❌ ${message}`);
    }
}
function assertEq(actual, expected, message) {
    assert(actual === expected, `${message} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`);
}
function assertGte(actual, min, message) {
    assert(actual >= min, `${message} (expected >= ${min}, got: ${actual})`);
}
function section(name) {
    console.log(`\n━━━ ${name} ━━━`);
}
// ─── Test fixtures ──────────────────────────────────────────
const MARKDOWN_SRS = `---
title: Task Manager Pro
description: A project management tool with team collaboration features.
tech_stack:
  frontend: React
  backend: Express
  database: PostgreSQL
entities:
  - name: Project
    fields: [name, description, status, deadline]
---

# Task Manager Pro

## Overview
A comprehensive task management application for teams.

## User Stories
- As a manager, I want to create projects, so that I can organize work.
- As a team member, I want to view my assigned tasks, so that I know what to work on.
- As an admin, I want to manage user permissions.

## Data Models

### Entity: Task
- id
- title
- description: string
- status
- assigneeId
- projectId

### Entity: User
- id
- name
- email: string
- role

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/projects | List all projects |
| POST | /api/projects | Create a new project |
| GET | /api/tasks | List tasks |
| POST | /api/tasks | Create a task |
| PUT | /api/tasks/:id | Update a task |
| DELETE | /api/tasks/:id | Delete a task |
`;
const PLAIN_TEXT_SRS = `
Software Requirements Specification
Task Tracker Application

Description:
A simple task tracking tool for individual developers.

The system should allow users to create, read, update, and delete tasks.
The application will use React for the frontend and Express for the backend
with a MongoDB database.

As a user, I want to create new tasks, so that I can track my work.
As a user, I want to mark tasks as complete.
As a user, I want to filter tasks by status, so that I can focus on what matters.

The API will expose the following endpoints:
GET /api/tasks - List all tasks
POST /api/tasks - Create a new task
PUT /api/tasks/:id - Update a task
DELETE /api/tasks/:id - Delete a task

Data model:
Task (title, description, status, priority, dueDate, createdAt)
Category (name, color, description)
`;
const MINIMAL_SRS = `
Build me a blog app.

Users can write posts and leave comments.
As a blogger, I want to write articles, so that I can share my thoughts.

Tech: React, Express, PostgreSQL

Post (title, content, author, publishedAt)
Comment (text, author, postId)
`;
// ─── Tests ──────────────────────────────────────────────────
async function runTests() {
    console.log('🧪 @srs-gen/parser — Test Suite\n');
    // ── Format Detection ──────────────────────────────────
    section('Format Detection');
    assertEq((0, detect_format_1.detectFormat)('# Hello World\n\n- item', 'md'), 'md', 'Explicit hint returns hint');
    assertEq((0, detect_format_1.detectFormat)('plain text here', 'txt'), 'txt', 'Explicit txt hint');
    assertEq((0, detect_format_1.detectFormat)('just some plain text without any markdown'), 'txt', 'Plain text auto-detect');
    const pdfBuffer = Buffer.from('%PDF-1.4 fake content');
    assertEq((0, detect_format_1.detectFormat)(pdfBuffer), 'pdf', 'PDF magic bytes detected');
    const textBuffer = Buffer.from('just text in a buffer');
    assertEq((0, detect_format_1.detectFormat)(textBuffer), 'txt', 'Non-PDF buffer defaults to txt');
    // ── Entity Extraction ─────────────────────────────────
    section('Entity Extraction');
    const entities1 = (0, entity_extractor_1.extractEntities)('Task (title, description, status, priority)');
    assertGte(entities1.length, 1, 'Inline entity extraction finds Task');
    if (entities1.length > 0) {
        assertEq(entities1[0].name, 'Task', 'Entity name is Task');
        assertGte(entities1[0].fields.length, 4, 'Task has at least 4 fields');
    }
    const entitiesSection = (0, entity_extractor_1.extractEntities)(`
### Entity: User
- name
- email: string
- age
  `);
    assertGte(entitiesSection.length, 1, 'Section heading entity extraction');
    if (entitiesSection.length > 0) {
        assertEq(entitiesSection[0].name, 'User', 'Section entity name is User');
        assertGte(entitiesSection[0].fields.length, 2, 'Section entity has fields');
    }
    const entitiesTable = (0, entity_extractor_1.extractEntities)(`
### User
| Field | Type |
|-------|------|
| name  | string |
| email | string |
| age   | number |
  `);
    assertGte(entitiesTable.length, 1, 'Table entity extraction');
    if (entitiesTable.length > 0) {
        assertGte(entitiesTable[0].fields.length, 3, 'Table entity has 3 fields');
    }
    // ── User Story Extraction ─────────────────────────────
    section('User Story Extraction');
    const stories1 = (0, user_story_extractor_1.extractUserStories)('As a manager, I want to create projects, so that I can organize work.');
    assertGte(stories1.length, 1, 'Canonical user story extracted');
    if (stories1.length > 0) {
        assertEq(stories1[0].role, 'manager', 'Role is manager');
        assert(stories1[0].action.includes('create projects'), 'Action contains create projects');
        assert(stories1[0].benefit.includes('organize work'), 'Benefit contains organize work');
    }
    const stories2 = (0, user_story_extractor_1.extractUserStories)('As an admin, I want to manage user permissions.');
    assertGte(stories2.length, 1, 'Short-form user story extracted');
    if (stories2.length > 0) {
        assertEq(stories2[0].role, 'admin', 'Short-form role is admin');
    }
    const storiesSection = (0, user_story_extractor_1.extractUserStories)(`
## User Stories
- As a user, I want to sign up, so that I can use the app.
- View dashboard metrics
- As a developer, I want to deploy code.
  `);
    assertGte(storiesSection.length, 3, 'Section-scoped stories extracted (canonical + free-form)');
    // ── API Route Extraction ──────────────────────────────
    section('API Route Extraction');
    const routes1 = (0, api_route_extractor_1.extractApiRoutes)('GET /api/users - List all users');
    assertGte(routes1.length, 1, 'Inline route extracted');
    if (routes1.length > 0) {
        assertEq(routes1[0].method, 'GET', 'Route method is GET');
        assertEq(routes1[0].path, '/api/users', 'Route path is /api/users');
    }
    const routesTable = (0, api_route_extractor_1.extractApiRoutes)(`
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tasks | List tasks |
| POST | /api/tasks | Create task |
| DELETE | /api/tasks/:id | Delete task |
  `);
    assertGte(routesTable.length, 3, 'Table routes extracted (3 rows)');
    const routesCode = (0, api_route_extractor_1.extractApiRoutes)('Use `GET /api/health` to check status');
    assertGte(routesCode.length, 1, 'Code block route extracted');
    // ── Tech Stack Extraction ─────────────────────────────
    section('Tech Stack Extraction');
    const tech1 = (0, tech_stack_extractor_1.extractTechStack)('We will use React for the frontend and Express for the backend with PostgreSQL.');
    assertEq(tech1.frontend, 'React', 'Frontend detected as React');
    assertEq(tech1.backend, 'Express', 'Backend detected as Express');
    assertEq(tech1.database, 'PostgreSQL', 'Database detected as PostgreSQL');
    const tech2 = (0, tech_stack_extractor_1.extractTechStack)('Built with Vue.js, NestJS, and MongoDB');
    assertEq(tech2.frontend, 'Vue', 'Frontend detected as Vue');
    assertEq(tech2.backend, 'NestJS', 'Backend detected as NestJS');
    assertEq(tech2.database, 'MongoDB', 'Database detected as MongoDB');
    // ── Full Parser: Markdown with Frontmatter ────────────
    section('Full Parser: Markdown with Frontmatter');
    const mdResult = await (0, index_1.parseSRS)(MARKDOWN_SRS, 'md');
    assertEq(mdResult.title, 'Task Manager Pro', 'MD title from frontmatter');
    assert(mdResult.description.length > 0, 'MD description is non-empty');
    assertGte(mdResult.entities.length, 2, 'MD has at least 2 entities (Task + User from sections, Project from frontmatter)');
    assertGte(mdResult.userStories.length, 3, 'MD has at least 3 user stories');
    assertGte(mdResult.apiRoutes.length, 5, 'MD has at least 5 API routes');
    assertEq(mdResult.techStack.frontend, 'React', 'MD tech stack frontend from frontmatter');
    assertEq(mdResult.techStack.backend, 'Express', 'MD tech stack backend from frontmatter');
    assertEq(mdResult.techStack.database, 'PostgreSQL', 'MD tech stack database from frontmatter');
    // ── Full Parser: Plain Text ───────────────────────────
    section('Full Parser: Plain Text');
    const txtResult = await (0, index_1.parseSRS)(PLAIN_TEXT_SRS, 'txt');
    assert(txtResult.title.length > 0, 'TXT title extracted');
    assertGte(txtResult.entities.length, 1, 'TXT has at least 1 entity');
    assertGte(txtResult.userStories.length, 2, 'TXT has at least 2 user stories');
    assertGte(txtResult.apiRoutes.length, 4, 'TXT has at least 4 API routes');
    assertEq(txtResult.techStack.frontend, 'React', 'TXT tech stack frontend');
    assertEq(txtResult.techStack.backend, 'Express', 'TXT tech stack backend');
    assertEq(txtResult.techStack.database, 'MongoDB', 'TXT tech stack database');
    // ── Full Parser: Minimal SRS ──────────────────────────
    section('Full Parser: Minimal SRS');
    const minResult = await (0, index_1.parseSRS)(MINIMAL_SRS, 'txt');
    assertGte(minResult.entities.length, 2, 'Minimal has at least 2 entities (Post + Comment)');
    assertGte(minResult.userStories.length, 1, 'Minimal has at least 1 user story');
    assertEq(minResult.techStack.frontend, 'React', 'Minimal tech frontend');
    assertEq(minResult.techStack.backend, 'Express', 'Minimal tech backend');
    assertEq(minResult.techStack.database, 'PostgreSQL', 'Minimal tech database');
    // ── Edge Cases ────────────────────────────────────────
    section('Edge Cases');
    try {
        await (0, index_1.parseSRS)('', 'txt');
        assert(false, 'Empty input should throw');
    }
    catch (e) {
        assert(e.message.includes('empty'), 'Empty input throws meaningful error');
    }
    try {
        await (0, index_1.parseSRS)(Buffer.alloc(0), 'pdf');
        assert(false, 'Empty buffer should throw');
    }
    catch (e) {
        assert(e.message.includes('empty'), 'Empty buffer throws meaningful error');
    }
    // ── Summary ───────────────────────────────────────────
    console.log('\n' + '═'.repeat(50));
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    if (failures.length > 0) {
        console.log('\n❌ Failures:');
        failures.forEach(f => console.log(`   - ${f}`));
        process.exit(1);
    }
    else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    }
}
runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
