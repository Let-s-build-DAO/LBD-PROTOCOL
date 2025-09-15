// src/lib/getClient.ts
import { createPublicClient, http } from "viem";
import { chains } from "../config/chainConfig"; // the new dynamic chains file

export async function getClient(chainKey: string) {
  const config = chains[chainKey];
  if (!config) throw new Error(`Unsupported chain: ${chainKey}`);

  return createPublicClient({
    chain: {
      id: config.id,
      name: config.name,
      nativeCurrency: config.nativeCurrency ?? {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: { http: config.rpcUrls },
      },
    //   blockExplorers: config.blockExplorers ?? [],
    },
    transport: http(config.rpcUrls[0]),
  });
}
