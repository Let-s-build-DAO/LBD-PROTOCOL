// src/lib/enrich.ts
import { getTransaction, getBlock, getTransactionReceipt } from "viem/actions";
import { decodeEventLog } from "viem";
import { formatEther, erc20Abi, erc721Abi, erc1155Abi } from "viem";
import { getClient } from "./getClient";
import { chains } from "../config/chainConfig";
import { Transaction } from "../models/transaction";
import { classifyTransaction } from "./classifyTx";


export async function enrichTx(txHash: string, chainKey: string): Promise<Transaction> {
    const client = await getClient(chainKey);
    const chainConfig = chains[chainKey];
    if (!chainConfig) throw new Error(`Unsupported chain: ${chainKey}`);

    // Fetch tx details
    const hash = txHash.startsWith("0x") ? (txHash as `0x${string}`) : (`0x${txHash}` as `0x${string}`);
    const tx = await getTransaction(client, { hash });
    const receipt = await getTransactionReceipt(client, { hash });
    const block = await getBlock(client, { blockNumber: tx.blockNumber });

    // Format values
    const nativeValue = tx.value ? formatEther(tx.value) : "0";
    const gasUsed = Number(receipt.gasUsed);
    const gasPrice = Number(tx.gasPrice ?? 0n);
    const gasFeeNative = (gasUsed * gasPrice) / 1e18;

    // ---- Use classifyTransaction for activity type ----
    let activityType = "contract_interaction";
    let tokenTransfers: Transaction["tokenTransfers"] = [];
    try {
        const classified = await classifyTransaction(hash as `0x${string}`, chainKey);
        console.log(classified);
        activityType = classified.baseType;
        tokenTransfers = classified.tokenTransfers;
    } catch (e) {
        console.error("Error classifying transaction:", e);
    }

    // Return enriched object
    return {
        txHash,
        chain: chainConfig.name,
        blockNumber: Number(tx.blockNumber),
        timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
        fromAddr: tx.from,
        toAddr: tx.to ?? "",
        nativeValue,
        nativeSymbol: chainConfig.nativeCurrency?.symbol ?? "ETH",
        usdValue: undefined, // TODO: price oracle
        gasUsed: gasUsed.toString(),
        gasFeeUsd: undefined, // TODO: price oracle
        tokenTransfers,
        activityType,
        projectTag: undefined,
    };
}
