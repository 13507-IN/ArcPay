import assert from "node:assert/strict";
import { test, describe, beforeEach, afterEach } from "node:test";
import Database from "better-sqlite3";
import { SqliteAdapter } from "../src/db/sqliteAdapter.js";
import { MongoAdapter } from "../src/db/mongoAdapter.js";
import {
  getDatabaseType,
  setAdapter,
  getAdapter,
  initDb,
  upsertMilestone,
  getMilestoneById,
  getMilestones,
  updateDeliverable,
  updateStatus,
  recordEvent,
  updateMetadata,
  calculateStats,
  getSyncState,
  setSyncState,
  closeDb,
} from "../src/db.js";

describe("SqliteAdapter Tests", () => {
  let sqliteDb: Database.Database;
  let adapter: SqliteAdapter;

  beforeEach(async () => {
    // Use an in-memory database for fast, isolated test execution
    sqliteDb = new Database(":memory:");
    adapter = new SqliteAdapter(sqliteDb);
    await adapter.initDb();
  });

  afterEach(async () => {
    await adapter.closeDb();
  });

  test("initializes tables and sync state correctly", async () => {
    await adapter.setSyncState("cursor", "12345");
    const val = await adapter.getSyncState("cursor");
    assert.equal(val, "12345");

    const nonExistent = await adapter.getSyncState("missing");
    assert.equal(nonExistent, null);
  });

  test("upsertMilestone inserts and updates milestone records", async () => {
    const client = "0x1111111111111111111111111111111111111111";
    const freelancer = "0x2222222222222222222222222222222222222222";

    await adapter.upsertMilestone({
      id: 1,
      client,
      freelancer,
      amount: "10000000000000000000", // 10 USDC (18 decimals)
      title: "Design Homepage",
      deadline: 1700000000,
      status: "Funded",
      createdAt: 1690000000,
      txHash: "0xabc1",
    });

    const m = await adapter.getMilestoneById(1);
    assert.ok(m);
    assert.equal(m.id, 1);
    assert.equal(m.client, client.toLowerCase());
    assert.equal(m.freelancer, freelancer.toLowerCase());
    assert.equal(m.amount, "10000000000000000000");
    assert.equal(m.status, "Funded");
    assert.equal(m.title, "Design Homepage");

    // Update existing milestone
    await adapter.upsertMilestone({
      id: 1,
      client,
      freelancer,
      amount: "15000000000000000000",
      title: "Design Homepage v2",
      deadline: 1700000100,
      status: "Funded",
      createdAt: 1690000000,
    });

    const updated = await adapter.getMilestoneById(1);
    assert.ok(updated);
    assert.equal(updated.amount, "15000000000000000000");
    assert.equal(updated.title, "Design Homepage v2");
  });

  test("updateDeliverable and updateStatus change milestone states", async () => {
    await adapter.upsertMilestone({
      id: 2,
      client: "0x1111111111111111111111111111111111111111",
      freelancer: "0x2222222222222222222222222222222222222222",
      amount: "5000000000000000000",
      title: "Build API",
      deadline: 1700000000,
      status: "Funded",
      createdAt: 1690000000,
    });

    await adapter.updateDeliverable(2, "https://github.com/pr/1", "0xsubmittx");
    let m = await adapter.getMilestoneById(2);
    assert.ok(m);
    assert.equal(m.status, "Submitted");
    assert.equal(m.deliverable_url, "https://github.com/pr/1");
    assert.equal(m.submitted_tx_hash, "0xsubmittx");

    await adapter.updateStatus(2, "Released", "released_tx_hash", "0xreleasetx");
    m = await adapter.getMilestoneById(2);
    assert.ok(m);
    assert.equal(m.status, "Released");
    assert.equal(m.released_tx_hash, "0xreleasetx");
  });

  test("recordEvent records and deduplicates events", async () => {
    await adapter.upsertMilestone({
      id: 3,
      client: "0x1111111111111111111111111111111111111111",
      freelancer: "0x2222222222222222222222222222222222222222",
      amount: "5000000000000000000",
      title: "Write Tests",
      deadline: 1700000000,
      status: "Funded",
      createdAt: 1690000000,
    });

    await adapter.recordEvent(
      3,
      "MilestoneCreated",
      "0xevttx",
      100,
      1690000010,
      { details: "Created" }
    );

    // Record duplicate event (same tx_hash, event_name, milestone_id)
    await adapter.recordEvent(
      3,
      "MilestoneCreated",
      "0xevttx",
      100,
      1690000010,
      { details: "Duplicate" }
    );

    const m = await adapter.getMilestoneById(3);
    assert.ok(m);
    assert.equal(m.events.length, 1);
    assert.equal(m.events[0].event_name, "MilestoneCreated");
    assert.deepEqual(m.events[0].payload, { details: "Created" });
  });

  test("updateMetadata saves off-chain metadata", async () => {
    await adapter.upsertMilestone({
      id: 4,
      client: "0x1111111111111111111111111111111111111111",
      freelancer: "0x2222222222222222222222222222222222222222",
      amount: "5000000000000000000",
      title: "Documentation",
      deadline: 1700000000,
      status: "Funded",
      createdAt: 1690000000,
    });

    const updated = await adapter.updateMetadata(4, {
      brief: "Detailed project scope",
      invoiceNotes: "Net 30 days",
      freelancerEmail: "dev@example.com",
    });

    assert.ok(updated);
    assert.equal(updated.brief, "Detailed project scope");
    assert.equal(updated.invoice_notes, "Net 30 days");
    assert.equal(updated.freelancer_email, "dev@example.com");
  });

  test("calculateStats computes accurate totals across milestones", async () => {
    const client = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const freelancer = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    // Milestone 1: Funded 10 USDC
    await adapter.upsertMilestone({
      id: 10,
      client,
      freelancer,
      amount: "10000000000000000000",
      title: "Task 1",
      deadline: 1700000000,
      status: "Funded",
      createdAt: 1690000000,
    });

    // Milestone 2: Released 20 USDC
    await adapter.upsertMilestone({
      id: 11,
      client,
      freelancer,
      amount: "20000000000000000000",
      title: "Task 2",
      deadline: 1700000000,
      status: "Released",
      createdAt: 1690000000,
    });

    // Milestone 3: Refunded 5 USDC
    await adapter.upsertMilestone({
      id: 12,
      client,
      freelancer,
      amount: "5000000000000000000",
      title: "Task 3",
      deadline: 1700000000,
      status: "Refunded",
      createdAt: 1690000000,
    });

    const globalStats = await adapter.calculateStats();
    assert.equal(globalStats.totalMilestones, 3);
    assert.equal(globalStats.activeMilestones, 1);
    assert.equal(globalStats.completedMilestones, 1);
    assert.equal(globalStats.refundedMilestones, 1);
    assert.equal(globalStats.totalLockedUSDC, "10");
    assert.equal(globalStats.totalPaidOutUSDC, "20");
    assert.equal(globalStats.totalRefundedUSDC, "5");

    const clientStats = await adapter.calculateStats(client);
    assert.equal(clientStats.totalPaidOutUSDC, "20");

    const freelancerStats = await adapter.calculateStats(freelancer);
    assert.equal(freelancerStats.totalEarnedUSDC, "20");
  });
});

describe("Database Configuration & Switching Tests", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    setAdapter(null);
  });

  test("getDatabaseType detects sqlite and mongodb from environment", () => {
    delete process.env.DATABASE_TYPE;
    delete process.env.MONGODB_URI;
    assert.equal(getDatabaseType(), "sqlite");

    process.env.DATABASE_TYPE = "mongodb";
    assert.equal(getDatabaseType(), "mongodb");

    process.env.DATABASE_TYPE = "mongo";
    assert.equal(getDatabaseType(), "mongodb");

    process.env.DATABASE_TYPE = "sqlite";
    assert.equal(getDatabaseType(), "sqlite");

    delete process.env.DATABASE_TYPE;
    process.env.MONGODB_URI = "mongodb://cluster.example.com:27017";
    assert.equal(getDatabaseType(), "mongodb");
  });

  test("setAdapter allows injecting custom database adapter into facade", async () => {
    const memoryDb = new Database(":memory:");
    const testAdapter = new SqliteAdapter(memoryDb);
    await testAdapter.initDb();
    setAdapter(testAdapter);

    await upsertMilestone({
      id: 99,
      client: "0x1111111111111111111111111111111111111111",
      freelancer: "0x2222222222222222222222222222222222222222",
      amount: "1000000000000000000",
      title: "Test Facade Injection",
      deadline: 1700000000,
      status: "Funded",
      createdAt: 1690000000,
    });

    const m = await getMilestoneById(99);
    assert.ok(m);
    assert.equal(m.title, "Test Facade Injection");

    await closeDb();
  });

  test("MongoAdapter class can be initialized and configured", () => {
    const adapter = new MongoAdapter("mongodb://localhost:27017", "arcpay_test");
    assert.ok(adapter instanceof MongoAdapter);
    assert.equal(typeof adapter.initDb, "function");
    assert.equal(typeof adapter.upsertMilestone, "function");
    assert.equal(typeof adapter.getMilestones, "function");
    assert.equal(typeof adapter.getMilestoneById, "function");
    assert.equal(typeof adapter.updateDeliverable, "function");
    assert.equal(typeof adapter.updateStatus, "function");
    assert.equal(typeof adapter.recordEvent, "function");
    assert.equal(typeof adapter.updateMetadata, "function");
    assert.equal(typeof adapter.calculateStats, "function");
    assert.equal(typeof adapter.getSyncState, "function");
    assert.equal(typeof adapter.setSyncState, "function");
    assert.equal(typeof adapter.closeDb, "function");
  });
});
