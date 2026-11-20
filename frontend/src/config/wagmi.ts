import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { arcTestnet } from "./arcChain";

const rawProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const isValidProjectId =
  rawProjectId &&
  rawProjectId !== "YOUR_WALLETCONNECT_PROJECT_ID" &&
  rawProjectId.length >= 32;

const projectId = isValidProjectId
  ? rawProjectId
  : "3a8170812b534d0ff9d794f168fa4d80";

const walletsList = [injectedWallet, rainbowWallet];
if (projectId) {
  walletsList.push(walletConnectWallet);
}

const connectors = connectorsForWallets(
  [
    {
      groupName: "Supported Wallets",
      wallets: walletsList,
    },
  ],
  {
    appName: "ArcPay",
    projectId,
  }
);

export const config = createConfig({
  connectors,
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(
      process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.io"
    ),
  },
  ssr: true,
});
