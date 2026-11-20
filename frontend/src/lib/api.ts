import { Milestone, MilestoneStats, MilestoneEvent } from "../types";
import { Address, Hex } from "viem";
import { ESCROW_CONTRACT_ADDRESS } from "../config/contracts";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function fetchMilestones(address?: string): Promise<{
  milestones: Milestone[];
  stats: MilestoneStats;
}> {
  const url = new URL(`${API_BASE}/api/milestones`);
  if (address) {
    url.searchParams.set("address", address);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch milestones: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

export async function fetchMilestoneDetails(id: number): Promise<
  Milestone & {
    events: MilestoneEvent[];
    explorerLinks: {
      createdTx: string | null;
      submittedTx: string | null;
      releasedTx: string | null;
      refundedTx: string | null;
    };
  }
> {
  const res = await fetch(`${API_BASE}/api/milestones/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch milestone details: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

export async function saveMilestoneMetadata(
  id: number,
  data: {
    brief?: string;
    invoiceNotes?: string;
    freelancerEmail?: string;
    freelancerWebhook?: string;
  },
  authorization: {
    address: Address;
    issuedAt: number;
    signature: Hex;
  },
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/milestones/${id}/metadata`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...data, ...authorization }),
  });

  if (!res.ok) {
    throw new Error(`Failed to save metadata: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

export function buildMetadataAuthorizationMessage(
  address: Address,
  milestoneId: number,
  issuedAt: number,
  metadata: {
    brief?: string;
    invoiceNotes?: string;
    freelancerEmail?: string;
    freelancerWebhook?: string;
  },
): string {
  return JSON.stringify({
    app: "ArcPay",
    action: "update-milestone-metadata",
    chainId: 5042002,
    contractAddress: ESCROW_CONTRACT_ADDRESS.toLowerCase(),
    milestoneId,
    wallet: address.toLowerCase(),
    issuedAt,
    metadata: {
      brief: metadata.brief ?? null,
      invoiceNotes: metadata.invoiceNotes ?? null,
      freelancerEmail: metadata.freelancerEmail ?? null,
      freelancerWebhook: metadata.freelancerWebhook ?? null,
    },
  });
}

export async function checkBackendHealth(): Promise<{
  status: string;
  network: string;
  chainId: number;
  liveBlockHeight?: string;
  contractAddress?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
    return await res.json();
  } catch (err: any) {
    return {
      status: "unreachable",
      network: "Arc Testnet",
      chainId: 5042002,
    };
  }
}
