import express from "express";
import { sendOTP, verifyOTP, fillUserDetails } from "../controllers/authController";

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/fill-details", fillUserDetails);

export default router;
