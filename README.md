# LBD-PROTOCOL 🌍 On-Chain Intelligence Hub


LBD decentralized intelligence hub for analyzing and enriching blockchain transactions in Africa.  
This project tracks transactions, decodes token transfers, enriches with USD values, tags projects/regions, and labels risk levels — all while storing data in a decentralized database (OrbitDB).

---

## 🚀 Tech Stack

### Backend
- **Node.js + TypeScript** — backend API
- **Express.js** — REST API routing
- **ethers.js** — blockchain RPC interactions
- **OrbitDB + IPFS** — decentralized database for storing enriched data

### Frontend (planned)
- **Next.js / React** — UI for explorers & dashboards
- **Tailwind CSS** — modern styling
- **Recharts / D3** — visualization of transactions & analytics
- **React Query**

---

## 📂 Project Structure


---

## 📡 API Workflow

1. Client sends `txHash` and `chain` to the API.  
2. Backend queries blockchain RPC for transaction, receipt, and block data.  
3. Enrichment logic adds:  
   - Native value in USD  
   - Gas fees in USD  
   - ERC20 token transfers (decoded from logs)  
   - Activity type classification  
   - Project tagging & regional tags  
   - Risk label  
4. Enriched transaction is stored in OrbitDB.  
5. Response is sent back to the client.

---

## 🧠 Enriched Transaction Data Object

Example response:

```json
{
  "txHash": "0xabc123...",
  "chain": "polygon",
  "blockNumber": 456789,
  "timestamp": "2025-09-11T19:00:00Z",
  "fromAddr": "0xAlice",
  "toAddr": "0xBob",
  "nativeValue": "1.23",
  "nativeSymbol": "MATIC",
  "usdValue": 0.75,
  "gasUsed": "21000",
  "gasFeeUsd": 0.01,
  "tokenTransfers": [
    {
      "token": "USDC",
      "amount": "50",
      "usdValue": 50
    }
  ],
  "activityType": "token_transfer",
  "projectTag": "Aave",
  "regionTags": ["Kenya"],
  "riskLabel": "low"
}
