import { Router } from "express";
import {
  getAllTransactions,
  getMainnetTransactions,
  getTestnetTransactions,
  getContractTransactions,
  getUserTransactions,
} from "../controllers/transactionsController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", getAllTransactions);
router.get("/mainnet", getMainnetTransactions);
router.get("/testnet", getTestnetTransactions);
router.get("/contract/:contractAddress", authenticate, getContractTransactions);
router.get("/user/:userId", authenticate, getUserTransactions);

export default router;
