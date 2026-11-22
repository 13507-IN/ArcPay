import { Address } from "viem";

export const ESCROW_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS ||
  "0xf17d3214dc10428932B0951e1B6AD21e1d6Ade4a") as Address;

export const ARC_MILESTONE_ESCROW_ABI = [
  {
    type: "function",
    name: "createMilestone",
    inputs: [
      { name: "_freelancer", type: "address", internalType: "address" },
      { name: "_title", type: "string", internalType: "string" },
      { name: "_deadline", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "submitWork",
    inputs: [
      { name: "_id", type: "uint256", internalType: "uint256" },
      { name: "_deliverableUrl", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "releasePayment",
    inputs: [{ name: "_id", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "refundClient",
    inputs: [{ name: "_id", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getMilestone",
    inputs: [{ name: "_id", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct ArcMilestoneEscrow.Milestone",
        components: [
          { name: "id", type: "uint256", internalType: "uint256" },
          { name: "client", type: "address", internalType: "address" },
          { name: "freelancer", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "title", type: "string", internalType: "string" },
          { name: "deliverableIpfsOrUrl", type: "string", internalType: "string" },
          { name: "deadline", type: "uint256", internalType: "uint256" },
          { name: "status", type: "uint8", internalType: "enum ArcMilestoneEscrow.Status" },
          { name: "createdAt", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMilestonesCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getClientMilestones",
    inputs: [{ name: "_client", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getFreelancerMilestones",
    inputs: [{ name: "_freelancer", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMilestones",
    inputs: [
      { name: "_offset", type: "uint256", internalType: "uint256" },
      { name: "_limit", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct ArcMilestoneEscrow.Milestone[]",
        components: [
          { name: "id", type: "uint256", internalType: "uint256" },
          { name: "client", type: "address", internalType: "address" },
          { name: "freelancer", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "title", type: "string", internalType: "string" },
          { name: "deliverableIpfsOrUrl", type: "string", internalType: "string" },
          { name: "deadline", type: "uint256", internalType: "uint256" },
          { name: "status", type: "uint8", internalType: "enum ArcMilestoneEscrow.Status" },
          { name: "createdAt", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "MilestoneCreated",
    inputs: [
      { name: "id", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "client", type: "address", indexed: true, internalType: "address" },
      { name: "freelancer", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "title", type: "string", indexed: false, internalType: "string" },
      { name: "deadline", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WorkSubmitted",
    inputs: [
      { name: "id", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "freelancer", type: "address", indexed: true, internalType: "address" },
      { name: "deliverableUrl", type: "string", indexed: false, internalType: "string" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PaymentReleased",
    inputs: [
      { name: "id", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "client", type: "address", indexed: true, internalType: "address" },
      { name: "freelancer", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ClientRefunded",
    inputs: [
      { name: "id", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "client", type: "address", indexed: true, internalType: "address" },
      { name: "refundedBy", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
] as const;
