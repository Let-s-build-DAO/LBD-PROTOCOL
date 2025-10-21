import { Log, createPublicClient, http } from "viem";
import { getClient } from "./getClient";
import { saveTxDecentralized } from "./saveTxDecentralized";
import { Contract, IContract } from "../models/Contract";
import { chains } from "../config/chainConfig";

type ActiveWatcher = {
    unwatch: () => void;
    lastActive: number;
};

const activeWatchers: Record<string, ActiveWatcher> = {};

export async function manageContractWatchers() {
    const contracts: IContract[] = await Contract.find({ status: "active" });

    const activeKeys = new Set(
        contracts.map((c) => `${c.chain}:${c.address.toLowerCase()}`)
    );

    // 🧹 Clean up inactive watchers
    for (const key of Object.keys(activeWatchers)) {
        if (!activeKeys.has(key)) {
            console.log(`🛑 Removing watcher for ${key}`);
            activeWatchers[key].unwatch();
            delete activeWatchers[key];
        }
    }

    // 👀 Start watchers for active contracts
    for (const contract of contracts) {
        const key = `${contract.chain}:${contract.address.toLowerCase()}`;
        if (activeWatchers[key]) continue;

        const chainConfig = chains[contract.chain];
        if (!chainConfig) {
            console.warn(`⚠️ Unsupported chain: ${contract.chain}`);
            continue;
        }

        const client = await getClient(contract.chain);
        if (!client) {
            console.warn(`⚠️ Skipping ${contract.chain}:${contract.address} — no valid client`);
            continue;
        }
        console.log(`👁️ Watching ALL transactions for ${contract.address} on ${contract.chain}`);

        // ✅ Watch blocks and scan for txs touching this contract
        const unwatch = client.watchBlocks({
            onBlock: async (block) => {
                if (!block?.transactions?.length) return;

                for (const txHash of block.transactions) {
                    try {
                        const tx = await client.getTransaction({ hash: txHash });

                        // 🧠 Check if the contract is involved (as sender or receiver)
                        if (
                            tx.to?.toLowerCase() === contract.address.toLowerCase() ||
                            tx.from.toLowerCase() === contract.address.toLowerCase()
                        ) {
                            const txData = {
                                txHash,
                                chain: contract.chain,
                                contract: contract.address,
                                blockNumber: Number(block.number),
                                timestamp: Number(block.timestamp) * 1000,
                                isTestnet: chainConfig.isTestnet || false,
                                userId: contract.userId,
                            };

                            await saveTxDecentralized(txData);
                            if (activeWatchers[key]) {
                                activeWatchers[key].lastActive = Date.now();
                            }

                            console.log(`📦 Tx found for ${contract.address}: ${txHash}`);
                        }
                    } catch (err) {
                        console.error(`⚠️ Error fetching transaction ${txHash}:`, err);
                    }
                }
            },
            onError: (err) => {
                console.error(`❌ Watcher error for ${contract.address}:`, err);
            },
        });

        activeWatchers[key] = { unwatch, lastActive: Date.now() };
    }
}
