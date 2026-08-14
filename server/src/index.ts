import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('TokTickIT API is running');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'TokTickIT API' });
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
