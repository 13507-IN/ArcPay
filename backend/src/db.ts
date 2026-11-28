import {
  MilestoneRecord,
  MilestoneEventRecord,
  MilestoneMetadataInput,
  MilestoneStats,
  MilestoneStatus,
  MilestoneAiAuditSummary,
  PlatformAnalytics,
  GigCategory,
  GigApplicationRecord,
  EnrichedGig,
} from "./types.js";
import { DatabaseAdapter, DatabaseType, EnrichedMilestone } from "./db/types.js";
import { MongoAdapter } from "./db/mongoAdapter.js";

export { DatabaseAdapter, DatabaseType, EnrichedMilestone };
export { MongoAdapter };

export function getDatabaseType(): DatabaseType {
  return "mongodb";
}

let activeAdapter: DatabaseAdapter | null = null;

export function getAdapter(): DatabaseAdapter {
  if (!activeAdapter) {
    activeAdapter = new MongoAdapter();
  }
  return activeAdapter;
}

export function setAdapter(adapter: DatabaseAdapter | null): void {
  activeAdapter = adapter;
}

export async function initDb(): Promise<void> {
  const adapter = getAdapter();
  await adapter.initDb();
}

export async function closeDb(): Promise<void> {
  if (activeAdapter) {
    await activeAdapter.closeDb();
    activeAdapter = null;
  }
}

export async function upsertMilestone(m: {
  id: number;
  client: string;
  freelancer: string;
  amount: string;
  title: string;
  deadline: number;
  status: MilestoneStatus;
  createdAt: number;
  txHash?: string;
}): Promise<void> {
  return getAdapter().upsertMilestone(m);
}

export async function updateDeliverable(
  id: number,
  deliverableUrl: string,
  txHash?: string
): Promise<void> {
  return getAdapter().updateDeliverable(id, deliverableUrl, txHash);
}

export async function updateStatus(
  id: number,
  status: MilestoneStatus,
  txHashField?: "released_tx_hash" | "refunded_tx_hash",
  txHash?: string
): Promise<void> {
  return getAdapter().updateStatus(id, status, txHashField, txHash);
}

export async function recordEvent(
  milestoneId: number,
  eventName: string,
  txHash: string,
  blockNumber: number,
  timestamp: number,
  payload: any
): Promise<void> {
  return getAdapter().recordEvent(
    milestoneId,
    eventName,
    txHash,
    blockNumber,
    timestamp,
    payload
  );
}

export async function getMilestoneById(
  id: number
): Promise<EnrichedMilestone | null> {
  return getAdapter().getMilestoneById(id);
}

export async function getMilestones(
  address?: string
): Promise<MilestoneRecord[]> {
  return getAdapter().getMilestones(address);
}

export async function updateMetadata(
  id: number,
  data: MilestoneMetadataInput
): Promise<EnrichedMilestone | null> {
  return getAdapter().updateMetadata(id, data);
}

export async function calculateStats(
  address?: string
): Promise<MilestoneStats> {
  return getAdapter().calculateStats(address);
}

export async function getSyncState(key: string): Promise<string | null> {
  return getAdapter().getSyncState(key);
}

export async function setSyncState(
  key: string,
  value: string
): Promise<void> {
  return getAdapter().setSyncState(key, value);
}

export async function createGig(input: {
  client: string;
  title: string;
  description: string;
  category: GigCategory;
  budget_usdc: string;
  deadline_days: number;
  skills: string[];
}): Promise<EnrichedGig> {
  return getAdapter().createGig(input);
}

export async function getGigs(filters?: {
  status?: string;
  category?: string;
  client?: string;
  search?: string;
}): Promise<EnrichedGig[]> {
  return getAdapter().getGigs(filters);
}

export async function getGigById(id: number): Promise<EnrichedGig | null> {
  return getAdapter().getGigById(id);
}

export async function applyToGig(input: {
  gig_id: number;
  freelancer: string;
  pitch: string;
  portfolio_url?: string | null;
  proposed_usdc?: string | null;
}): Promise<GigApplicationRecord> {
  return getAdapter().applyToGig(input);
}

export async function selectGigApplicant(
  gigId: number,
  applicationId: number
): Promise<EnrichedGig | null> {
  return getAdapter().selectGigApplicant(gigId, applicationId);
}

export async function closeGig(gigId: number): Promise<EnrichedGig | null> {
  return getAdapter().closeGig(gigId);
}

export async function linkGigMilestone(
  gigId: number,
  milestoneId: number
): Promise<EnrichedGig | null> {
  return getAdapter().linkGigMilestone(gigId, milestoneId);
}

export async function saveMilestoneAudit(
  milestoneId: number,
  audit: MilestoneAiAuditSummary
): Promise<void> {
  return getAdapter().saveMilestoneAudit(milestoneId, audit);
}

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  return getAdapter().getPlatformAnalytics();
}
