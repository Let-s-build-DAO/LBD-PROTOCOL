import { Router } from "express";
import {
  getAllTransactions,
  getMainnetTransactions,
  getTestnetTransactions,
  getContractTransactions,
  getUserTransactions,
} from "../controllers/transactionsController";

const router = Router();

router.get("/", getAllTransactions);
router.get("/mainnet", getMainnetTransactions);
router.get("/testnet", getTestnetTransactions);
router.get("/contract/:contractAddress", getContractTransactions);
router.get("/user/:userId", getUserTransactions);

export default router;
