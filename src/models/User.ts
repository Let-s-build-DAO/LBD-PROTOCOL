import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    email: string;
    otp?: string;
    otpExpiresAt?: Date;
    name?: string;
    createdAt: Date;
}

const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true, lowercase: true },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    name: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>("User", userSchema);
