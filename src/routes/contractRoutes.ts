import express from "express";
import { addContract, getUserContracts, toggleContractStatus } from "../controllers/contractController";

const router = express.Router();

router.post("/add", addContract);
router.get("/:userId", getUserContracts);
router.patch("/toggle/:id", toggleContractStatus);

export default router;
