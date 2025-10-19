import express from "express";
import { addContract, getUserContracts, toggleContractStatus } from "../controllers/contractController";
import { authenticate } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/add", authenticate, addContract);
router.get("/:userId", authenticate, getUserContracts);
router.patch("/toggle/:id", authenticate, toggleContractStatus);

export default router;
