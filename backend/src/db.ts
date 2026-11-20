import {
  MilestoneRecord,
  MilestoneEventRecord,
  MilestoneMetadataInput,
  MilestoneStats,
  MilestoneStatus,
} from "./types.js";
import { DatabaseAdapter, DatabaseType, EnrichedMilestone } from "./db/types.js";
import { SqliteAdapter } from "./db/sqliteAdapter.js";
import { MongoAdapter } from "./db/mongoAdapter.js";

export { DatabaseAdapter, DatabaseType, EnrichedMilestone };
export { SqliteAdapter, MongoAdapter };

export function getDatabaseType(): DatabaseType {
  const configured = (process.env.DATABASE_TYPE || "").toLowerCase().trim();
  if (configured === "mongodb" || configured === "mongo") {
    return "mongodb";
  }
  if (configured === "sqlite") {
    return "sqlite";
  }
  if (process.env.MONGODB_URI) {
    return "mongodb";
  }
  return "sqlite";
}

let activeAdapter: DatabaseAdapter | null = null;

export function getAdapter(): DatabaseAdapter {
  if (!activeAdapter) {
    const type = getDatabaseType();
    if (type === "mongodb") {
      activeAdapter = new MongoAdapter();
    } else {
      activeAdapter = new SqliteAdapter();
    }
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

// Backward-compatibility export for direct SQLite handle access if needed
export const db = {
  get type() {
    return getDatabaseType();
  },
  get adapter() {
    return getAdapter();
  },
  prepare(sql: string) {
    const adapter = getAdapter();
    if (adapter instanceof SqliteAdapter) {
      return adapter.getRawDb().prepare(sql);
    }
    throw new Error(
      `Direct db.prepare() is only supported on SQLite adapter (current: ${getDatabaseType()})`
    );
  },
  exec(sql: string) {
    const adapter = getAdapter();
    if (adapter instanceof SqliteAdapter) {
      return adapter.getRawDb().exec(sql);
    }
    throw new Error(
      `Direct db.exec() is only supported on SQLite adapter (current: ${getDatabaseType()})`
    );
  },
  pragma(sql: string) {
    const adapter = getAdapter();
    if (adapter instanceof SqliteAdapter) {
      return adapter.getRawDb().pragma(sql);
    }
  },
};
