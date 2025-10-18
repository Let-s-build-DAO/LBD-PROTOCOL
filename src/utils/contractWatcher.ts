import { createPublicClient, http, Log } from "viem";
import { chains } from "../config/chainConfig";
import { saveTxDecentralized } from "./saveTxDecentralized";
import { getClient } from "./getClient";
import { Contract, IContract } from "../models/contract";

type ActiveWatcher = {
    unwatch: () => void;
    lastActive: number;
};

const activeWatchers: Record<string, ActiveWatcher> = {};

export async function manageContractWatchers() {
    // 1️⃣ Fetch all active contracts from MongoDB
    const contracts: IContract[] = await Contract.find({ status: "active" });

    const activeKeys = new Set(
        contracts.map(
            (c) => `${c.chain}:${c.address.toLowerCase()}`
        )
    );

    // 2️⃣ Remove watchers that are no longer active
    for (const key of Object.keys(activeWatchers)) {
        if (!activeKeys.has(key)) {
            console.log(`🛑 Removing watcher for ${key}`);
            activeWatchers[key].unwatch();
            delete activeWatchers[key];
        }
    }

    // 3️⃣ Create watchers for newly active contracts
    for (const contract of contracts) {
        const key = `${contract.chain}:${contract.address.toLowerCase()}`;
        if (!activeWatchers[key]) {
            const chainConfig = chains[contract.chain];
            if (!chainConfig) {
                console.warn(`⚠️ Unsupported chain: ${contract.chain}`);
                continue;
            }

            const client = await getClient(contract.chain);
            console.log(`👀 Starting watcher for ${contract.label || contract._id} (${key})`);

            const unwatch = client.watchEvent({
                address: contract.address as `0x${string}`,
                onLogs: async (logs: Log[]) => {
                    for (const log of logs) {
                        const txData = {
                            txHash: log.transactionHash as string,
                            chain: contract.chain,
                            contract: contract.address,
                            blockNumber: log.blockNumber ? Number(log.blockNumber) : 0,
                            timestamp: Date.now(),
                            project: contract.label || "Unknown",
                        };
                        await saveTxDecentralized(txData);
                        activeWatchers[key].lastActive = Date.now();
                    }
                },
            });

            activeWatchers[key] = { unwatch, lastActive: Date.now() };
        }
    }
}
