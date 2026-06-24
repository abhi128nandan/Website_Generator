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
  res.json({ status: 'ok', appName: 'TaskMaster' });
});


// --- Endpoints for Task ---

app.get('/api/tasks', async (req, res) => {
  try {
    // Description: Retrieve all tasks with optional category filter
    // Business Logic: if categoryId query param exists: filter tasks by categoryId. Return paginated results with sort by priority/dueDate
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
    // Business Logic: Validate title is non-empty, priority 1-5, categoryId exists. Assign createdAt/updatedAt timestamps
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

app.put('/api/tasks/:id', async (req, res) => {
  try {
    // Description: Update a task by ID
    // Business Logic: Validate priority 1-5 if updating. Update updatedAt timestamp. Allow partial updates
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

app.put('/api/tasks/:id/complete', async (req, res) => {
  try {
    // Description: Toggle task completion status
    // Business Logic: Set completed = !currentValue. Update updatedAt timestamp
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
    // Description: Delete all completed tasks
    // Business Logic: Find all tasks where completed=true and delete them in batch
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
    // Description: Retrieve all categories
    // Business Logic: Return all categories with colorCode formatting validation
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
    // Business Logic: Validate name uniqueness and colorCode is 6-character hex. Assign createdAt/updatedAt
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
