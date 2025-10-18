import * as allChains from "viem/chains";

export type ChainConfig = {
  id: number;
  name: string;
  rpcUrls: string[];
  blockExplorers?: { name: string; url: string }[];
  nativeCurrency?: { name: string; symbol: string; decimals: number };
  isTestnet: boolean; 
};

// Convert viem chains into a usable config object
export const chains: Record<string, ChainConfig> = Object.fromEntries(
  Object.entries(allChains).map(([key, chain]) => [
    key,
    {
      id: chain.id,
      name: chain.name,
      rpcUrls: chain.rpcUrls.default.http.slice(),
      blockExplorers: chain.blockExplorers
        ? Object.values(chain.blockExplorers).map((exp) => ({
            name: exp.name,
            url: exp.url,
          }))
        : [],
      nativeCurrency: chain.nativeCurrency,
      isTestnet: chain.testnet ?? false, 
    },
  ])
);
