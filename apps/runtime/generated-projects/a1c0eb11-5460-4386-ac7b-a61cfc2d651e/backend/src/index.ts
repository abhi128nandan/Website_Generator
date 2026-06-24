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
  res.json({ status: 'ok', appName: 'TodoManager' });
});


// --- Endpoints for Task ---

app.get('/api/tasks', async (req, res) => {
  try {
    // Description: Get all Tasks
    // Business Logic: Fetch and paginate Tasks
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
    // Description: Create new Task
    // Business Logic: Validate and create new Task
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
    // Description: Get Task by ID
    // Business Logic: Fetch single Task
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
    // Description: Update Task
    // Business Logic: Validate and update Task
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
    // Description: Delete Task
    // Business Logic: Remove Task
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
