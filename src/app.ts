import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import transactionRoutes from './routes/transactions';
import { manageContractWatchers } from './utils/contractWatcher';
import authRoutes from './routes/authRoutes';
import contractRoutes from './routes/contractRoutes';
import { connectMongo } from './config/mongo';

const app = express();
app.use(express.json());
connectMongo()
// Routes

app.use("/api/auth", authRoutes);
app.use("/api/contracts", contractRoutes);
app.use('/api/transaction', transactionRoutes);

// Global Error Handler
app.use(errorHandler);

// 🚀 Start background watcher service
setInterval(manageContractWatchers, 60_000); // run every 60 seconds

export default app;
