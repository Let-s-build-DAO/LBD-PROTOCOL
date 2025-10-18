// src/lib/saveTxDecentralized.ts
import { Transaction } from "../models/transaction";
import { chains } from "../config/chainConfig";

interface TxData {
    txHash: string;
    chain: string;
    contract: string;
    blockNumber: bigint | number;
    timestamp: number;
    project?: string;
}

export async function saveTxDecentralized(data: TxData) {
    try {
        const chainConfig = chains[data.chain];

        if (!chainConfig) {
            console.warn(`⚠️ Skipping unknown chain: ${data.chain}`);
            return;
        }

        // Prevent duplicate tx entries
        const existing = await Transaction.findOne({ txHash: data.txHash });
        if (existing) return;

        const tx = new Transaction({
            txHash: data.txHash,
            chain: data.chain,
            contract: data.contract,
            blockNumber: Number(data.blockNumber),
            timestamp: data.timestamp,
            project: data.project ?? "Unknown",
            isTestnet: chainConfig.isTestnet,
        });

        await tx.save();

        console.log(
            `✅ Saved tx ${data.txHash} on ${data.chain} (${chainConfig.isTestnet ? "testnet" : "mainnet"})`
        );
    } catch (err) {
        console.error("❌ Error saving transaction:", err);
    }
}
