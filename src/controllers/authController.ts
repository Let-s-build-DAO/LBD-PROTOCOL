import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import nodemailer from "nodemailer";

export const sendOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        let user = await User.findOne({ email });
        if (!user) user = new User({ email });

        user.otp = otp;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your Login OTP",
            text: `Your OTP is ${otp}. It expires in 10 minutes.`,
        });

        res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        next(error);
    }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp || (user.otpExpiresAt && user.otpExpiresAt < new Date())) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        user.otp = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

export const fillUserDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, name } = req.body;
        const user = await User.findOneAndUpdate({ email }, { name }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};
