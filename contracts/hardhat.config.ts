import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const ARC_TESTNET_RPC = process.env.ARC_TESTNET_RPC || "https://rpc.testnet.arc.io";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    arcTestnet: {
      url: ARC_TESTNET_RPC,
      chainId: 5042002,
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000001" ? [PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      arcTestnet: "any",
    },
    customChains: [
      {
        network: "arcTestnet",
        chainId: 5042002,
        urls: {
          apiURL: "https://explorer.testnet.arc.io/api",
          browserURL: "https://explorer.testnet.arc.io",
        },
      },
    ],
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
