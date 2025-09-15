import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import transactionRoutes from './routes/transactions';

const app = express();

app.use(express.json());

// Routes
app.use('/api/transaction', transactionRoutes);

app.use(errorHandler);

export default app;