import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory cache for dataApi
const dataCache: { [key: string]: any } = {};

// dataApi endpoint to fetch and cache external data
app.get('/api/data', async (req, res) => {
  // Simulate fetching data from an external source
  const externalData = {
    message: 'This is external data',
    timestamp: new Date().toISOString(),
  };

  // Cache the data with a key (e.g., based on query parameters if needed)
  const cacheKey = 'latestData';
  dataCache[cacheKey] = externalData;

  res.json({
    status: 'success',
    data: externalData,
  });
});

// geolocationService endpoint to handle location data from clients
app.post('/api/location', (req, res) => {
  const { latitude, longitude } = req.body;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({
      status: 'error',
      message: 'Latitude and longitude must be numbers',
    });
  }

  // In a real application, you might validate or store this data
  res.json({
    status: 'success',
    receivedLocation: { latitude, longitude },
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`UnnamedApp server running on http://localhost:${PORT}`);
  console.log('Endpoints available:');
  console.log('- GET /api/data (fetches and caches external data)');
  console.log('- POST /api/location (receives geolocation coordinates)');
});