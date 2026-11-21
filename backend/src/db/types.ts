import {
  MilestoneRecord,
  MilestoneEventRecord,
  MilestoneMetadataInput,
  MilestoneStats,
  MilestoneStatus,
} from "../types.js";

export type DatabaseType = "mongodb";

export type EnrichedMilestone = MilestoneRecord & {
  events: (MilestoneEventRecord & { payload: any })[];
};

export interface DatabaseAdapter {
  initDb(): Promise<void>;
  closeDb(): Promise<void>;
  upsertMilestone(m: {
    id: number;
    client: string;
    freelancer: string;
    amount: string;
    title: string;
    deadline: number;
    status: MilestoneStatus;
    createdAt: number;
    txHash?: string;
  }): Promise<void>;
  updateDeliverable(
    id: number,
    deliverableUrl: string,
    txHash?: string
  ): Promise<void>;
  updateStatus(
    id: number,
    status: MilestoneStatus,
    txHashField?: "released_tx_hash" | "refunded_tx_hash",
    txHash?: string
  ): Promise<void>;
  recordEvent(
    milestoneId: number,
    eventName: string,
    txHash: string,
    blockNumber: number,
    timestamp: number,
    payload: any
  ): Promise<void>;
  getMilestoneById(id: number): Promise<EnrichedMilestone | null>;
  getMilestones(address?: string): Promise<MilestoneRecord[]>;
  updateMetadata(
    id: number,
    data: MilestoneMetadataInput
  ): Promise<EnrichedMilestone | null>;
  calculateStats(address?: string): Promise<MilestoneStats>;
  getSyncState(key: string): Promise<string | null>;
  setSyncState(key: string, value: string): Promise<void>;
}
