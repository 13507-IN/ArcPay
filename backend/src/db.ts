import Database from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";
import { formatUnits } from "viem";
import {
  MilestoneRecord,
  MilestoneEventRecord,
  MilestoneMetadataInput,
  MilestoneStats,
  MilestoneStatus,
} from "./types.js";

const DB_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, "arcpay.sqlite");
const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY,
      client TEXT NOT NULL,
      freelancer TEXT NOT NULL,
      amount TEXT NOT NULL,
      title TEXT NOT NULL,
      deliverable_url TEXT DEFAULT '',
      deadline INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      created_tx_hash TEXT,
      submitted_tx_hash TEXT,
      released_tx_hash TEXT,
      refunded_tx_hash TEXT,
      brief TEXT,
      invoice_notes TEXT,
      freelancer_email TEXT,
      freelancer_webhook TEXT,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_milestones_client ON milestones(client);
    CREATE INDEX IF NOT EXISTS idx_milestones_freelancer ON milestones(freelancer);
    CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      milestone_id INTEGER NOT NULL,
      event_name TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      payload TEXT NOT NULL,
      FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_events_milestone_id ON events(milestone_id);
    CREATE INDEX IF NOT EXISTS idx_events_tx_hash ON events(tx_hash);

    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export function upsertMilestone(m: {
  id: number;
  client: string;
  freelancer: string;
  amount: string;
  title: string;
  deadline: number;
  status: MilestoneStatus;
  createdAt: number;
  txHash?: string;
}) {
  const existing = db
    .prepare("SELECT * FROM milestones WHERE id = ?")
    .get(m.id) as MilestoneRecord | undefined;

  const now = Math.floor(Date.now() / 1000);

  if (!existing) {
    const stmt = db.prepare(`
      INSERT INTO milestones (
        id, client, freelancer, amount, title, deadline, status,
        created_at, created_tx_hash, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      m.id,
      m.client.toLowerCase(),
      m.freelancer.toLowerCase(),
      m.amount,
      m.title,
      m.deadline,
      m.status,
      m.createdAt,
      m.txHash || null,
      now
    );
  } else {
    const stmt = db.prepare(`
      UPDATE milestones
      SET client = ?, freelancer = ?, amount = ?, title = ?, deadline = ?,
          status = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      m.client.toLowerCase(),
      m.freelancer.toLowerCase(),
      m.amount,
      m.title,
      m.deadline,
      m.status,
      now,
      m.id
    );
  }
}

export function updateDeliverable(
  id: number,
  deliverableUrl: string,
  txHash?: string
) {
  const now = Math.floor(Date.now() / 1000);
  const stmt = db.prepare(`
    UPDATE milestones
    SET deliverable_url = ?, status = 'Submitted',
        submitted_tx_hash = COALESCE(?, submitted_tx_hash),
        updated_at = ?
    WHERE id = ?
  `);
  stmt.run(deliverableUrl, txHash || null, now, id);
}

export function updateStatus(
  id: number,
  status: MilestoneStatus,
  txHashField?: "released_tx_hash" | "refunded_tx_hash",
  txHash?: string
) {
  const now = Math.floor(Date.now() / 1000);
  let query = `UPDATE milestones SET status = ?, updated_at = ?`;
  const params: any[] = [status, now];

  if (txHashField && txHash) {
    query += `, ${txHashField} = ?`;
    params.push(txHash);
  }

  query += ` WHERE id = ?`;
  params.push(id);

  db.prepare(query).run(...params);
}

export function recordEvent(
  milestoneId: number,
  eventName: string,
  txHash: string,
  blockNumber: number,
  timestamp: number,
  payload: any
) {
  // Check if already recorded to avoid duplicates on re-index
  const existing = db
    .prepare(
      "SELECT id FROM events WHERE tx_hash = ? AND event_name = ? AND milestone_id = ?"
    )
    .get(txHash, eventName, milestoneId);

  if (!existing) {
    const stmt = db.prepare(`
      INSERT INTO events (
        milestone_id, event_name, tx_hash, block_number, timestamp, payload
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      milestoneId,
      eventName,
      txHash,
      blockNumber,
      timestamp,
      JSON.stringify(payload)
    );
  }
}

export function getMilestoneById(id: number) {
  const milestone = db
    .prepare("SELECT * FROM milestones WHERE id = ?")
    .get(id) as MilestoneRecord | undefined;

  if (!milestone) return null;

  const events = db
    .prepare("SELECT * FROM events WHERE milestone_id = ? ORDER BY block_number ASC, id ASC")
    .all(id) as MilestoneEventRecord[];

  return {
    ...milestone,
    events: events.map((e) => ({
      ...e,
      payload: JSON.parse(e.payload),
    })),
  };
}

export function getMilestones(address?: string) {
  let query = "SELECT * FROM milestones";
  const params: any[] = [];

  if (address) {
    const addr = address.toLowerCase();
    query += " WHERE client = ? OR freelancer = ?";
    params.push(addr, addr);
  }

  query += " ORDER BY id DESC";
  return db.prepare(query).all(...params) as MilestoneRecord[];
}

export function updateMetadata(id: number, data: MilestoneMetadataInput) {
  const existing = db.prepare("SELECT id FROM milestones WHERE id = ?").get(id);
  if (!existing) return null;

  const updates: string[] = [];
  const params: any[] = [];

  if (data.brief !== undefined) {
    updates.push("brief = ?");
    params.push(data.brief);
  }
  if (data.invoiceNotes !== undefined) {
    updates.push("invoice_notes = ?");
    params.push(data.invoiceNotes);
  }
  if (data.freelancerEmail !== undefined) {
    updates.push("freelancer_email = ?");
    params.push(data.freelancerEmail);
  }
  if (data.freelancerWebhook !== undefined) {
    updates.push("freelancer_webhook = ?");
    params.push(data.freelancerWebhook);
  }

  if (updates.length > 0) {
    updates.push("updated_at = ?");
    params.push(Math.floor(Date.now() / 1000));
    params.push(id);

    const query = `UPDATE milestones SET ${updates.join(", ")} WHERE id = ?`;
    db.prepare(query).run(...params);
  }

  return getMilestoneById(id);
}

export function calculateStats(address?: string): MilestoneStats {
  const milestones = getMilestones(address);

  let totalLockedWei = 0n;
  let totalPaidOutWei = 0n;
  let totalEarnedWei = 0n;
  let totalRefundedWei = 0n;

  let activeCount = 0;
  let completedCount = 0;
  let refundedCount = 0;

  const targetAddr = address ? address.toLowerCase() : null;

  for (const m of milestones) {
    const amt = BigInt(m.amount);

    if (m.status === "Funded" || m.status === "Submitted") {
      totalLockedWei += amt;
      activeCount++;
    } else if (m.status === "Released") {
      completedCount++;
      if (!targetAddr || m.client === targetAddr) {
        totalPaidOutWei += amt;
      }
      if (!targetAddr || m.freelancer === targetAddr) {
        totalEarnedWei += amt;
      }
    } else if (m.status === "Refunded") {
      refundedCount++;
      totalRefundedWei += amt;
    }
  }

  return {
    totalLockedUSDC: formatUnits(totalLockedWei, 18),
    totalPaidOutUSDC: formatUnits(totalPaidOutWei, 18),
    totalEarnedUSDC: formatUnits(totalEarnedWei, 18),
    totalRefundedUSDC: formatUnits(totalRefundedWei, 18),
    totalMilestones: milestones.length,
    activeMilestones: activeCount,
    completedMilestones: completedCount,
    refundedMilestones: refundedCount,
  };
}

export function getSyncState(key: string): string | null {
  const row = db.prepare("SELECT value FROM sync_state WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row ? row.value : null;
}

export function setSyncState(key: string, value: string) {
  db.prepare(`
    INSERT INTO sync_state (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

export { db };
