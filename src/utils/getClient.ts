import { createPublicClient, http } from "viem";
import { chains } from "../config/chainConfig";

const RETRY_LIMIT = 3;
const RETRY_DELAY_BASE = 5000; // 5 seconds

// Utility: sleep helper
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function getClient(chainKey: string) {
  const config = chains[chainKey];
  if (!config) throw new Error(`Unsupported chain: ${chainKey}`);

  const rpcUrls = config.rpcUrls;
  let lastError: any = null;

  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
    for (const rpc of rpcUrls) {
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
          transport: http(rpc),
        });

        // Quick test to verify connectivity
        await client.getBlockNumber();

        console.log(`✅ Connected to ${config.name} via ${rpc}`);
        return client;
      } catch (err: any) {
        console.warn(`❌ RPC failed for ${config.name} via ${rpc}: ${err.message}`);
        lastError = err;
      }
    }

    // If all RPCs failed, wait before retrying
    const delay = RETRY_DELAY_BASE * attempt;
    console.log(
      `🔄 All RPCs failed for ${config.name}, retrying in ${delay / 1000}s (attempt ${attempt}/${RETRY_LIMIT})...`
    );
    await sleep(delay);
  }

  console.error(`❌ All RPCs failed permanently for ${config.name}. Skipping connection.`);
  return null; // return null instead of throwing to prevent crash
}
