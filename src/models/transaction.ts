import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  txHash: string;
  chain: string;
  contract: string;
  blockNumber: number;
  timestamp: number;
  isTestnet?: boolean;
  userId: mongoose.Types.ObjectId;
}

const TransactionSchema = new Schema<ITransaction>({
  txHash: { type: String, required: true },
  chain: { type: String, required: true },
  contract: { type: String, required: true },
  blockNumber: { type: Number, required: true },
  timestamp: { type: Number, required: true },
  isTestnet: { type: Boolean, default: false },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);
