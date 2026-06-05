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
    // Description: Retrieve all tasks with optional filtering by category/priority
    // Business Logic: Apply query parameters for category and priority filters. Return paginated results with status and dueDate sorting.
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
    // Description: Create a new task with validation for required fields
    // Business Logic: Validate title is non-empty, dueDate is future date, priority is 1-5. Generate UUID for id. Set createdAt and updatedAt timestamps.
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
