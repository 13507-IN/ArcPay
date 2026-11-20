import { defineChain } from "viem";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.io"],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://explorer.testnet.arc.io",
    },
  },
  testnet: true,
});
