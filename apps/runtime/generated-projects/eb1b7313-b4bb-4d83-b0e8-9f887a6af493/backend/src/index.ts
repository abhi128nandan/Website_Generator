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
    // Description: Fetch tasks with optional filtering by category/priority
    // Business Logic: Apply query filters: if category exists, join with Category; if priority exists, validate against [low, medium, high]
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
    // Description: Create new task with validation
    // Business Logic: Validate title is non-empty, dueDate is valid date, priority is low/medium/high, status is pending/completed, categoryId exists in Category
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
    // Description: Fetch single task by ID
    // Business Logic: Verify task exists and return with related Category data
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
    // Description: Update task with validation
    // Business Logic: Validate all fields; ensure categoryId exists in Category; update updatedAt timestamp
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
    // Description: Update task status
    // Business Logic: Validate status is pending/completed; update updatedAt timestamp
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

app.put('/api/tasks/:id/priority', async (req, res) => {
  try {
    // Description: Update task priority
    // Business Logic: Validate priority is low/medium/high; update updatedAt timestamp
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

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    // Description: Delete task
    // Business Logic: Verify task exists; soft delete or permanent deletion based on business rules
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
    // Description: Fetch all categories
    // Business Logic: Return list of available categories
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
    // Description: Create new category
    // Business Logic: Validate name is unique and non-empty
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
