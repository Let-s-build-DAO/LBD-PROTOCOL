import mongoose, { Document, Schema } from "mongoose";

export interface IContract extends Document {
    userId: mongoose.Types.ObjectId;
    address: string;
    chain: string;
    status: "active" | "inactive";
    createdAt: Date;
    updatedAt: Date;
}

const contractSchema = new Schema<IContract>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        address: { type: String, required: true, lowercase: true },
        chain: { type: String, required: true },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    { timestamps: true }
);

export const Contract = mongoose.model<IContract>("Contract", contractSchema);
