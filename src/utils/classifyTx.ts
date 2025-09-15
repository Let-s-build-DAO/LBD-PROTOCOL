// src/lib/classifyTx.ts
import {
  decodeFunctionData,
  decodeEventLog,
  erc20Abi,
  erc721Abi,
  erc1155Abi,
  getAddress,
} from "viem";
import { getTransaction, getTransactionReceipt } from "viem/actions";
import { getClient } from "./getClient";
import { TokenTransfer } from "../models/transaction";

// Base transaction categories
export type BaseTransactionType = 
  | "TRANSFER"
  | "NFT"
  | "DEFI"
  | "GOVERNANCE"
  | "SYSTEM"
  | "UNKNOWN";

// Specific transaction subtypes
export type TransferSubType =
  | "NATIVE_TRANSFER"
  | "ERC20_TRANSFER"
  | "BATCH_TRANSFER";

export type NFTSubType =
  | "NFT_MINT"
  | "NFT_TRANSFER"
  | "NFT_BURN"
  | "NFT_APPROVAL";

export type DeFiSubType =
  | "SWAP"
  | "LIQUIDITY_ADD"
  | "LIQUIDITY_REMOVE"
  | "LENDING_DEPOSIT"
  | "LENDING_WITHDRAW"
  | "LENDING_BORROW"
  | "LENDING_REPAY"
  | "STAKING_DEPOSIT"
  | "STAKING_WITHDRAW"
  | "YIELD_HARVEST";

export type GovernanceSubType =
  | "PROPOSAL_CREATE"
  | "VOTE_CAST"
  | "DELEGATE";

export type SystemSubType =
  | "CONTRACT_DEPLOYMENT"
  | "CONTRACT_UPGRADE"
  | "PROXY_CALL";

// Event signatures for classification
const EVENT_SIGNATURES = {
  // ERC20 Events
  ERC20_TRANSFER: "Transfer(address,address,uint256)",
  ERC20_APPROVAL: "Approval(address,address,uint256)",
  
  // NFT Events
  ERC721_TRANSFER: "Transfer(address,address,uint256)",
  ERC721_APPROVAL: "Approval(address,address,uint256)",
  ERC1155_TRANSFER_SINGLE: "TransferSingle(address,address,address,uint256,uint256)",
  ERC1155_TRANSFER_BATCH: "TransferBatch(address,address,address,uint256[],uint256[])",
  
  // DeFi Events
  SWAP: "Swap(address,uint256,uint256,uint256,uint256,address)",
  MINT: "Mint(address,uint256,uint256)",
  BURN: "Burn(address,uint256,uint256,address)",
  DEPOSIT: "Deposit(address,uint256)",
  WITHDRAW: "Withdraw(address,uint256)",
  HARVEST: "Harvest(address,uint256)",
  
  // Governance Events
  PROPOSAL_CREATED: "ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)",
  VOTE_CAST: "VoteCast(address,uint256,uint8,uint256,string)"
};

export interface ClassifiedTxResult {
  baseType: BaseTransactionType;
  subType?: TransferSubType | NFTSubType | DeFiSubType | GovernanceSubType | SystemSubType;
  tokenTransfers: TokenTransfer[];
  events: Array<{
    eventName: string;
    args: any;
    address: string;
  }>;
  protocol?: {
    name: string;
    address: string;
  };
}

export async function classifyTransaction(txHash: `0x${string}`, chainId: string): Promise<ClassifiedTxResult> {
  const client = getClient(chainId);
  const tx = await getTransaction(await client, { hash: txHash });
  const receipt = await getTransactionReceipt(await client, { hash: txHash });

  const result: ClassifiedTxResult = {
    baseType: "UNKNOWN",
    tokenTransfers: [],
    events: [],
  };

  // Check for contract deployment
  if (!tx.to) {
    result.baseType = "SYSTEM";
    result.subType = "CONTRACT_DEPLOYMENT";
    return result;
  }

  // Check for native transfer
  if (tx.input === "0x" && tx.value > 0n) {
    result.baseType = "TRANSFER";
    result.subType = "NATIVE_TRANSFER";
    return result;
  }

  // Process all transaction events
  for (const log of receipt.logs) {
    // Try to decode the event
    let eventDecoded: any;
    let eventName: string = "";

    // Try ERC20
    try {
      eventDecoded = decodeEventLog({
        abi: erc20Abi,
        data: log.data,
        topics: log.topics,
      });
      eventName = eventDecoded.eventName;

      if (eventName === "Transfer") {
        result.baseType = "TRANSFER";
        result.subType = "ERC20_TRANSFER";
        result.tokenTransfers.push({
          token: log.address,
          amount: eventDecoded.args.value.toString(),
          from: eventDecoded.args.from,
          to: eventDecoded.args.to,
          usdValue: undefined,
        });
      }
    } catch {}

    // Try ERC721
    try {
      eventDecoded = decodeEventLog({
        abi: erc721Abi,
        data: log.data,
        topics: log.topics,
      });
      eventName = eventDecoded.eventName;

      if (eventName === "Transfer") {
        result.baseType = "NFT";
        if (eventDecoded.args.from === getAddress("0x0000000000000000000000000000000000000000")) {
          result.subType = "NFT_MINT";
        } else {
          result.subType = "NFT_TRANSFER";
        }
        result.tokenTransfers.push({
          token: log.address,
          amount: "1",
          from: eventDecoded.args.from,
          to: eventDecoded.args.to,
          usdValue: undefined,
        });
      }
    } catch {}

    // Try ERC1155
    try {
      eventDecoded = decodeEventLog({
        abi: erc1155Abi,
        data: log.data,
        topics: log.topics,
      });
      eventName = eventDecoded.eventName;

      if (["TransferSingle", "TransferBatch"].includes(eventName)) {
        result.baseType = "NFT";
        result.subType = "NFT_TRANSFER";
        
        if (eventName === "TransferSingle") {
          result.tokenTransfers.push({
            token: log.address,
            amount: eventDecoded.args.value.toString(),
            from: eventDecoded.args.from,
            to: eventDecoded.args.to,
            usdValue: undefined,
          });
        } else { // TransferBatch
          eventDecoded.args.ids.forEach((id: bigint, i: number) => {
            result.tokenTransfers.push({
              token: log.address,
              amount: eventDecoded.args.values[i].toString(),
              from: eventDecoded.args.from,
              to: eventDecoded.args.to,
              usdValue: undefined,
            });
          });
        }
      }
    } catch {}

    // Store all successfully decoded events
    if (eventDecoded) {
      result.events.push({
        eventName,
        args: eventDecoded.args,
        address: log.address,
      });
    }
  }

  // If we haven't classified the transaction yet, try to classify based on method signature
  if (result.baseType === "UNKNOWN" && tx.input.length >= 10) {
    try {
      // Try to decode the function call
      const methodSig = tx.input.slice(0, 10);
      
      // Add common DeFi method signatures
      if (["0x7ff36ab5", "0x38ed1739"].includes(methodSig)) { // Uniswap swap methods
        result.baseType = "DEFI";
        result.subType = "SWAP";
      } else if (["0xe8e33700", "0xf305d719"].includes(methodSig)) { // Add liquidity
        result.baseType = "DEFI";
        result.subType = "LIQUIDITY_ADD";
      } else if (["0x2e1a7d4d", "0xdb006a75"].includes(methodSig)) { // Withdrawals
        result.baseType = "DEFI";
        result.subType = "LENDING_WITHDRAW";
      } else if (methodSig === "0xc5ebeaec") { // Borrow
        result.baseType = "DEFI";
        result.subType = "LENDING_BORROW";
      }
    } catch {}
  }

  return result;
}
