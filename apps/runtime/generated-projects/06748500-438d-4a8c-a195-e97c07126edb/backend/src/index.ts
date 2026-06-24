import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', appName: 'To-Do App' });
});


// --- Endpoints for Task ---

app.get('/api/tasks', async (req, res) => {
  try {
    // Description: List tasks with optional filtering and pagination
    // Business Logic: Validate query parameters (category, priority, page, limit). Fetch tasks with pagination. Return 400 if invalid filters.
    const data = await prisma.task.findMany();
    res.json(data);
  } catch (error: any) {
    console.error(`[Backend Error] ${req.method} ${req.originalUrl}`);
    console.error('Request Body:', req.body);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    // Description: Create a new task
    // Business Logic: Validate title is non-empty, dueDate is future, priority 1-5. Check categoryId exists in Category. Create task with timestamps.
    const data = await prisma.task.create({ data: req.body });
    res.status(201).json(data);
  } catch (error: any) {
    console.error(`[Backend Error] ${req.method} ${req.originalUrl}`);
    console.error('Request Body:', req.body);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    // Description: Get task by ID
    // Business Logic: Find task by ID. Return 404 if not found.
    const data = await prisma.task.findUnique({ where: { id: req.params.id } });
    res.json(data);
  } catch (error: any) {
    console.error(`[Backend Error] ${req.method} ${req.originalUrl}`);
    console.error('Request Body:', req.body);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    // Description: Update task details
    // Business Logic: Validate title/dueDate/priority if provided. Check categoryId exists. Update task with timestamps.
    const data = await prisma.task.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error: any) {
    console.error(`[Backend Error] ${req.method} ${req.originalUrl}`);
    console.error('Request Body:', req.body);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.put('/api/tasks/:id/status', async (req, res) => {
  try {
    // Description: Update task completion status
    // Business Logic: Validate status is 'completed' or 'pending'. Update status field and updatedAt.
    const data = await prisma.task.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error: any) {
    console.error(`[Backend Error] ${req.method} ${req.originalUrl}`);
    console.error('Request Body:', req.body);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.delete('/api/tasks/completed', async (req, res) => {
  try {
    // Description: Bulk delete completed tasks
    // Business Logic: Delete all tasks where status = 'completed'. Return count of deleted tasks.
    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error: any) {
    console.error(`[Backend Error] ${req.method} ${req.originalUrl}`);
    console.error('Request Body:', req.body);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// --- Endpoints for Category ---

app.get('/api/categories', async (req, res) => {
  try {
    // Description: List all categories
    // Business Logic: Return all categories with pagination (default 10 per page).
    const data = await prisma.category.findMany();
    res.json(data);
  } catch (error: any) {
    console.error(`[Backend Error] ${req.method} ${req.originalUrl}`);
    console.error('Request Body:', req.body);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    // Description: Create a new category
    // Business Logic: Validate name is non-empty. Create category with timestamps.
    const data = await prisma.category.create({ data: req.body });
    res.status(201).json(data);
  } catch (error: any) {
    console.error(`[Backend Error] ${req.method} ${req.originalUrl}`);
    console.error('Request Body:', req.body);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    // Description: Get category by ID
    // Business Logic: Find category by ID. Return 404 if not found.
    const data = await prisma.category.findUnique({ where: { id: req.params.id } });
    res.json(data);
  } catch (error: any) {
    console.error(`[Backend Error] ${req.method} ${req.originalUrl}`);
    console.error('Request Body:', req.body);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    // Description: Update category details
    // Business Logic: Validate name is non-empty. Update category with timestamps.
    const data = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error: any) {
    console.error(`[Backend Error] ${req.method} ${req.originalUrl}`);
    console.error('Request Body:', req.body);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
