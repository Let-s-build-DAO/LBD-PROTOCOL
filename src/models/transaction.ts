// src/models/transaction.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  txHash: string;
  chain: string;
  contract: string;
  blockNumber: number;
  timestamp: number;
  project?: string;
  isTestnet: boolean;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    txHash: { type: String, required: true, unique: true },
    chain: { type: String, required: true },
    contract: { type: String, required: true },
    blockNumber: { type: Number, required: true },
    timestamp: { type: Number, required: true },
    project: { type: String },
    isTestnet: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
