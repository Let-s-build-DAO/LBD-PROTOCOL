import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

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
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"LB Alliance" <${process.env.EMAIL_USER}>`, // ✅ must match SMTP user
            to: email,
            subject: "Your OTP",
            text: `Your OTP is ${otp}. It expires in 10 minutes.`,
        });

        res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        next(error);
        console.log(error)
    }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user || user.otp !== otp || (user.otpExpiresAt && user.otpExpiresAt < new Date())) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // clear OTP fields
        user.otp = undefined;
        user.otpExpiresAt = undefined;

        // determine if new or returning user
        const isNewUser = !user.hasSignedUp; // use a flag to know if profile setup done

        // mark user as verified (for both new and returning)
        user.isVerified = true;
        await user.save();

        // if returning user, issue token
        if (!isNewUser) {
            const token = jwt.sign(
                { id: user._id, email: user.email },
                process.env.JWT_SECRET!,
                { expiresIn: "7d" }
            );

            return res.json({
                success: true,
                isNewUser: false,
                token,
                user,
            });
        }

        // if new user
        return res.json({
            success: true,
            isNewUser: true,
            user,
        });

    } catch (error) {
        next(error);
    }
};

export const fillUserDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, orgName, description } = req.body;
        const user = await User.findOneAndUpdate({ email }, { orgName, description, hasSignedUp: true }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};
