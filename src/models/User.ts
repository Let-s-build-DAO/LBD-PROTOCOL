import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    email: string;
    otp?: string;
    otpExpiresAt?: Date;
    orgName?: string;
    createdAt: Date;
    description: string;
    isVerified: Boolean;
    hasSignedUp: Boolean;
}

const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true, lowercase: true },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    description: {type: String},
    orgName: { type: String },
    createdAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    hasSignedUp: { type: Boolean, default: false },
});

export const User = mongoose.model<IUser>("User", userSchema);
