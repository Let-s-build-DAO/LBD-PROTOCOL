// src/lib/getClient.ts
import { createPublicClient, http, PublicClient } from "viem";
import { chains } from "../config/chainConfig";

const clientPool: Record<string, PublicClient> = {};
const rpcIndex: Record<string, number> = {};
const reconnectTimers: Record<string, NodeJS.Timeout> = {};

const RETRY_INTERVAL_MS = 60_000; // 1 min retry

function getNextRpc(chainKey: string): string {
  const config = chains[chainKey];
  if (!config) throw new Error(`Unsupported chain: ${chainKey}`);

  rpcIndex[chainKey] = (rpcIndex[chainKey] ?? 0) % config.rpcUrls.length;
  const rpc = config.rpcUrls[rpcIndex[chainKey]];
  rpcIndex[chainKey] = (rpcIndex[chainKey] + 1) % config.rpcUrls.length;
  return rpc;
}

async function tryCreateClient(chainKey: string): Promise<PublicClient | null> {
  const config = chains[chainKey];
  if (!config) throw new Error(`Unsupported chain: ${chainKey}`);

  let rpcUrl = getNextRpc(chainKey);
  let attempts = 0;

  while (attempts < config.rpcUrls.length) {
    try {
      const client = createPublicClient({
        chain: {
          id: config.id,
          name: config.name,
          nativeCurrency: config.nativeCurrency ?? {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: { default: { http: config.rpcUrls } },
        },
        transport: http(rpcUrl),
      });

      await client.getBlockNumber(); // Health check
      console.log(
        `✅ Connected to ${config.name} (${config.isTestnet ? "Testnet" : "Mainnet"}) via ${rpcUrl}`
      );
      return client;
    } catch (err) {
      console.warn(`⚠️ RPC failed for ${config.name} (${rpcUrl}): ${String(err)}`);
      rpcUrl = getNextRpc(chainKey);
      attempts++;
    }
  }

  console.error(`❌ All RPCs failed for ${config.name}`);
  return null;
}

async function scheduleReconnect(chainKey: string) {
  if (reconnectTimers[chainKey]) return; // already scheduled

  console.log(`🔄 Scheduling reconnection for ${chainKey}...`);
  reconnectTimers[chainKey] = setInterval(async () => {
    const client = await tryCreateClient(chainKey);
    if (client) {
      clientPool[chainKey] = client;
      clearInterval(reconnectTimers[chainKey]);
      delete reconnectTimers[chainKey];
      console.log(`✅ Reconnected successfully to ${chainKey}`);
    }
  }, RETRY_INTERVAL_MS);
}

export async function getClient(chainKey: string): Promise<PublicClient> {
  if (clientPool[chainKey]) return clientPool[chainKey];

  const client = await tryCreateClient(chainKey);
  if (!client) {
    await scheduleReconnect(chainKey);
    throw new Error(`All RPCs failed for ${chainKey}, retrying in background.`);
  }

  clientPool[chainKey] = client;
  return client;
}
