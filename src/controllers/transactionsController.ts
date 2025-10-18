import { Request, Response } from "express";
import { Transaction } from "../models/Transaction";

/**
 * GET /api/transactions
 * Returns all transactions
 */
export const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const transactions = await Transaction.find().sort({ timestamp: -1 });
        res.status(200).json(transactions);
    } catch (err) {
        console.error("❌ Error fetching all transactions:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET /api/transactions/mainnet
 * Returns only mainnet transactions
 */
export const getMainnetTransactions = async (req: Request, res: Response) => {
    try {
        const transactions = await Transaction.find({ isTestnet: false }).sort({ timestamp: -1 });
        res.status(200).json(transactions);
    } catch (err) {
        console.error("❌ Error fetching mainnet transactions:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET /api/transactions/testnet
 * Returns only testnet transactions
 */
export const getTestnetTransactions = async (req: Request, res: Response) => {
    try {
        const transactions = await Transaction.find({ isTestnet: true }).sort({ timestamp: -1 });
        res.status(200).json(transactions);
    } catch (err) {
        console.error("❌ Error fetching testnet transactions:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET /api/transactions/contract/:contractAddress
 * Returns all transactions for a specific contract
 */
export const getContractTransactions = async (req: Request, res: Response) => {
    try {
        const { contractAddress } = req.params;
        const transactions = await Transaction.find({
            contract: contractAddress.toLowerCase(),
        }).sort({ timestamp: -1 });

        res.status(200).json(transactions);
    } catch (err) {
        console.error("❌ Error fetching contract transactions:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET /api/transactions/user/:userId
 * Returns all transactions for a specific user
 */
export const getUserTransactions = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const transactions = await Transaction.find({ userId }).sort({ timestamp: -1 });

        res.status(200).json(transactions);
    } catch (err) {
        console.error("❌ Error fetching user transactions:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
