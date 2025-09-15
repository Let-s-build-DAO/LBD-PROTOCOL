import express from 'express';
import {
  createTransaction,
  getAllTransactions,
  getTransactionByHash
} from '../controllers/transactionsController';

const router = express.Router();

router.post('/', createTransaction);
router.get('/', getAllTransactions);
router.get('/:txHash', getTransactionByHash);

export default router;
