export interface TokenTransfer {
  token: string;
  amount: string;
  from: string;
  to: string;
  usdValue: number | undefined;
}

export interface Transaction {
  txHash: string;
  chain: string;
  blockNumber: number;
  timestamp: string;
  fromAddr: string;
  toAddr: string;
  nativeValue: string;
  nativeSymbol: string;
  usdValue: number | undefined;
  gasUsed: string;
  gasFeeUsd: number | undefined;
  tokenTransfers: TokenTransfer[];
  activityType: string;
  projectTag: string | undefined;
}
