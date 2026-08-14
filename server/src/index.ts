import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('TokTickIT API is running');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'TokTickIT API' });
});

export const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
