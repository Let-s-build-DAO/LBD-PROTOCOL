import { Request, Response } from 'express';
import { Transaction } from '../models/transaction';
import { enrichTx } from '../utils/enrich';

// In-memory store for demo purposes
const transactions: Transaction[] = [];

export const createTransaction = async (req: Request, res: Response) => {
    const { txHash, chainKey } = req.body;
    if (!txHash || !chainKey) {
        return res.status(400).json({ message: 'txHash and chainKey are required' });
    }
    try {
        const transaction = await enrichTx(txHash, chainKey);
        transactions.push(transaction);
        res.status(201).json(transaction);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const getAllTransactions = (req: Request, res: Response) => {
    res.json(transactions);
};

export const getTransactionByHash = (req: Request, res: Response) => {
    const txHash = req.params.txHash;
    const transaction = transactions.find(tx => tx.txHash === txHash);
    if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
};
