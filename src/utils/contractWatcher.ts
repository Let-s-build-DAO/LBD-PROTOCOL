import { Log } from "viem";
import { chains } from "../config/chainConfig";
import { saveTxDecentralized } from "./saveTxDecentralized";
import { getClient } from "./getClient";
import { Contract, IContract } from "../models/Contract";

type ActiveWatcher = {
    unwatch: () => void;
    lastActive: number;
};

const activeWatchers: Record<string, ActiveWatcher> = {};

export async function manageContractWatchers() {
    try {
        // 1️⃣ Fetch all active contracts from MongoDB
        const contracts: IContract[] = await Contract.find({ status: "active" });

        const activeKeys = new Set(
            contracts.map((c) => `${c.chain}:${c.address.toLowerCase()}`)
        );

        // 2️⃣ Remove inactive watchers
        for (const key of Object.keys(activeWatchers)) {
            if (!activeKeys.has(key)) {
                console.log(`🛑 Removing watcher for ${key}`);
                activeWatchers[key].unwatch();
                delete activeWatchers[key];
            }
        }

        // 3️⃣ Create watchers for new contracts
        for (const contract of contracts) {
            const key = `${contract.chain}:${contract.address.toLowerCase()}`;
            if (activeWatchers[key]) continue;

            const chainConfig = chains[contract.chain];
            if (!chainConfig) {
                console.warn(`⚠️ Unsupported chain: ${contract.chain}`);
                continue;
            }

            const client = await getClient(contract.chain);
            console.log(
                `👀 Starting watcher for ${contract._id} (${key})`
            );

            const unwatch = client.watchEvent({
                address: contract.address as `0x${string}`,
                onLogs: async (logs: Log[]) => {
                    for (const log of logs) {
                        if (!log.transactionHash) continue;

                        const txData = {
                            txHash: log.transactionHash,
                            chain: contract.chain,
                            contract: contract.address,
                            blockNumber: log.blockNumber ? Number(log.blockNumber) : 0,
                            timestamp: Date.now(),
                            isTestnet: chainConfig.isTestnet || false,
                            userId: contract.userId, // ✅ add user ID from contract
                        };

                        try {
                            await saveTxDecentralized(txData);
                            if (activeWatchers[key]) {
                                activeWatchers[key].lastActive = Date.now();
                            }
                        } catch (err) {
                            console.error("❌ Error saving transaction:", err);
                        }
                    }
                },
            });

            activeWatchers[key] = { unwatch, lastActive: Date.now() };
        }
    } catch (error) {
        console.error("❌ Error managing contract watchers:", error);
    }
}
