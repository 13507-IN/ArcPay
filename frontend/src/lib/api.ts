import { Milestone, MilestoneStats, MilestoneEvent, Gig, GigCategory, GigApplication } from "../types";
import { Address, Hex, keccak256, toHex } from "viem";
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

export type GigAuthAction =
  | "create-gig"
  | "apply-gig"
  | "select-applicant"
  | "close-gig"
  | "link-milestone";

function hashGigPayload(payload?: Record<string, unknown> | null): Hex | null {
  if (!payload) return null;
  const sortedEntries = Object.keys(payload)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = payload[key] ?? null;
      return acc;
    }, {});
  return keccak256(toHex(JSON.stringify(sortedEntries)));
}

export function buildGigAuthorizationMessage(input: {
  action: GigAuthAction;
  address: Address;
  issuedAt: number;
  gigId?: number;
  targetId?: number;
  payload?: Record<string, unknown> | null;
}): string {
  return JSON.stringify({
    app: "ArcPay",
    action: input.action,
    chainId: 5042002,
    contractAddress: ESCROW_CONTRACT_ADDRESS.toLowerCase(),
    gigId: input.gigId ?? null,
    targetId: input.targetId ?? null,
    payloadHash: hashGigPayload(input.payload),
    wallet: input.address.toLowerCase(),
    issuedAt: input.issuedAt,
  });
}

async function parseApiResponse<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || res.statusText || fallbackMsg);
  }
  return json.data as T;
}

export async function fetchGigs(filters?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<Gig[]> {
  const url = new URL(`${API_BASE}/api/gigs`);
  if (filters?.status) url.searchParams.set("status", filters.status);
  if (filters?.category) url.searchParams.set("category", filters.category);
  if (filters?.search) url.searchParams.set("search", filters.search);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await parseApiResponse<{ gigs: Gig[] }>(res, "Failed to fetch open gigs");
  return data.gigs || [];
}

export async function createOpenGig(
  input: {
    title: string;
    description: string;
    category: GigCategory;
    budgetUsdc: string;
    deadlineDays: number;
    skills: string[];
  },
  auth: { address: Address; issuedAt: number; signature: Hex }
): Promise<Gig> {
  const res = await fetch(`${API_BASE}/api/gigs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, ...auth }),
  });
  return parseApiResponse<Gig>(res, "Failed to post open gig");
}

export async function applyToOpenGig(
  gigId: number,
  input: {
    pitch: string;
    portfolioUrl?: string;
    proposedUsdc?: string;
  },
  auth: { address: Address; issuedAt: number; signature: Hex }
): Promise<GigApplication> {
  const res = await fetch(`${API_BASE}/api/gigs/${gigId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, ...auth }),
  });
  return parseApiResponse<GigApplication>(res, "Failed to submit proposal");
}

export async function selectGigApplicant(
  gigId: number,
  applicationId: number,
  auth: { address: Address; issuedAt: number; signature: Hex }
): Promise<Gig> {
  const res = await fetch(`${API_BASE}/api/gigs/${gigId}/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicationId, ...auth }),
  });
  return parseApiResponse<Gig>(res, "Failed to select applicant");
}

export async function closeOpenGig(
  gigId: number,
  auth: { address: Address; issuedAt: number; signature: Hex }
): Promise<Gig> {
  const res = await fetch(`${API_BASE}/api/gigs/${gigId}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(auth),
  });
  return parseApiResponse<Gig>(res, "Failed to close gig");
}

export async function linkGigToMilestone(
  gigId: number,
  milestoneId: number,
  auth: { address: Address; issuedAt: number; signature: Hex }
): Promise<Gig> {
  const res = await fetch(`${API_BASE}/api/gigs/${gigId}/link-milestone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ milestoneId, ...auth }),
  });
  return parseApiResponse<Gig>(res, "Failed to link milestone to gig");
}
