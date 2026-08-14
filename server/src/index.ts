import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('TokTickIT API is running');
});

export const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
