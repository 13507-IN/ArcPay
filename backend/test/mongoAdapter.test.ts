import assert from "node:assert/strict";
import { test, describe, beforeEach } from "node:test";
import { MongoAdapter } from "../src/db/mongoAdapter.js";

// Mock MongoDB Collection for in-memory unit verification
class MockMongoCollection {
  public docs: any[] = [];
  public indexes: any[] = [];

  async createIndex(keys: any, options?: any) {
    this.indexes.push({ keys, options });
    return "index_ok";
  }

  async findOne(filter: any, options?: any) {
    const match = this.docs.find((d) => this.matches(d, filter));
    if (!match) return null;
    return this.applyProjection(match, options?.projection);
  }

  find(filter: any = {}, options?: any) {
    let filtered = this.docs.filter((d) => this.matches(d, filter));
    const cursor = {
      _sortKey: null as any,
      _limitVal: null as number | null,
      sort(sortObj: any) {
        cursor._sortKey = sortObj;
        return cursor;
      },
      limit(n: number) {
        cursor._limitVal = n;
        return cursor;
      },
      async next() {
        const sorted = cursor.applySort(filtered);
        return sorted.length > 0 ? { ...sorted[0] } : null;
      },
      async toArray() {
        let sorted = cursor.applySort(filtered);
        if (cursor._limitVal !== null) {
          sorted = sorted.slice(0, cursor._limitVal);
        }
        return sorted.map((d) => cursor.applyProjection(d, options?.projection));
      },
      applySort(arr: any[]) {
        if (!cursor._sortKey) return arr;
        return [...arr].sort((a, b) => {
          for (const [key, dir] of Object.entries(cursor._sortKey)) {
            const valA = a[key];
            const valB = b[key];
            if (valA !== valB) {
              return (dir as number) > 0 ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
            }
          }
          return 0;
        });
      },
      applyProjection(doc: any, projection?: any) {
        const copy = { ...doc };
        if (projection?._id === 0) {
          delete copy._id;
        }
        return copy;
      },
    };
    return cursor;
  }

  async insertOne(doc: any) {
    this.docs.push({ _id: "mongo_id_" + Math.random(), ...doc });
    return { acknowledged: true, insertedId: this.docs[this.docs.length - 1]._id };
  }

  async updateOne(filter: any, update: any, options?: any) {
    const matchIndex = this.docs.findIndex((d) => this.matches(d, filter));
    if (matchIndex === -1) {
      if (options?.upsert) {
        const newDoc = { ...(update.$set || filter) };
        this.docs.push(newDoc);
        return { acknowledged: true, matchedCount: 0, upsertedCount: 1 };
      }
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    }

    if (update.$set) {
      this.docs[matchIndex] = { ...this.docs[matchIndex], ...update.$set };
    }
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  }

  private matches(doc: any, filter: any): boolean {
    if (!filter || Object.keys(filter).length === 0) return true;

    if (filter.$or && Array.isArray(filter.$or)) {
      return filter.$or.some((subFilter: any) => this.matches(doc, subFilter));
    }

    for (const [key, val] of Object.entries(filter)) {
      if (key === "$or") continue;
      if (doc[key] !== val) return false;
    }
    return true;
  }

  private applyProjection(doc: any, projection?: any) {
    const copy = { ...doc };
    if (projection?._id === 0) {
      delete copy._id;
    }
    return copy;
  }
}

class MockMongoDb {
  public collections: Map<string, MockMongoCollection> = new Map();

  collection(name: string): any {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockMongoCollection());
    }
    return this.collections.get(name);
  }
}

describe("MongoAdapter with Mock Database", () => {
  let mockDb: MockMongoDb;
  let adapter: MongoAdapter;

  beforeEach(() => {
    mockDb = new MockMongoDb();
    // Instantiate adapter with mock db
    adapter = new MongoAdapter("mongodb://mock:27017", mockDb as any);
  });

  test("initDb sets up collections and indexes", async () => {
    await adapter.initDb();
    const milestonesCol = mockDb.collections.get("milestones");
    const eventsCol = mockDb.collections.get("events");
    const syncStateCol = mockDb.collections.get("sync_state");

    assert.ok(milestonesCol);
    assert.ok(eventsCol);
    assert.ok(syncStateCol);
    assert.ok(milestonesCol.indexes.length >= 4);
    assert.ok(eventsCol.indexes.length >= 3);
  });

  test("upsertMilestone, updateDeliverable, and updateStatus in MongoDB", async () => {
    await adapter.initDb();

    await adapter.upsertMilestone({
      id: 101,
      client: "0xClientAddress",
      freelancer: "0xFreelancerAddress",
      amount: "50000000000000000000",
      title: "Full-Stack DApp",
      deadline: 1800000000,
      status: "Funded",
      createdAt: 1700000000,
      txHash: "0xcreatedTx",
    });

    let m = await adapter.getMilestoneById(101);
    assert.ok(m);
    assert.equal(m.id, 101);
    assert.equal(m.client, "0xclientaddress");
    assert.equal(m.freelancer, "0xfreelanceraddress");
    assert.equal(m.status, "Funded");

    await adapter.updateDeliverable(101, "https://ipfs.io/ipfs/QmHash", "0xsubmitTx");
    m = await adapter.getMilestoneById(101);
    assert.ok(m);
    assert.equal(m.status, "Submitted");
    assert.equal(m.deliverable_url, "https://ipfs.io/ipfs/QmHash");
    assert.equal(m.submitted_tx_hash, "0xsubmitTx");

    await adapter.updateStatus(101, "Released", "released_tx_hash", "0xreleaseTx");
    m = await adapter.getMilestoneById(101);
    assert.ok(m);
    assert.equal(m.status, "Released");
    assert.equal(m.released_tx_hash, "0xreleaseTx");
  });

  test("recordEvent and getMilestoneById event timeline in MongoDB", async () => {
    await adapter.initDb();

    await adapter.upsertMilestone({
      id: 202,
      client: "0xAlice",
      freelancer: "0xBob",
      amount: "1000000000000000000",
      title: "Smart Contract Audit",
      deadline: 1800000000,
      status: "Funded",
      createdAt: 1700000000,
    });

    await adapter.recordEvent(
      202,
      "MilestoneCreated",
      "0xtx1",
      1000,
      1700000001,
      { amount: "1000000000000000000" }
    );

    // Duplicate check
    await adapter.recordEvent(
      202,
      "MilestoneCreated",
      "0xtx1",
      1000,
      1700000001,
      { amount: "1000000000000000000" }
    );

    await adapter.recordEvent(
      202,
      "PaymentReleased",
      "0xtx2",
      1005,
      1700000050,
      { releasedTo: "0xBob" }
    );

    const m = await adapter.getMilestoneById(202);
    assert.ok(m);
    assert.equal(m.events.length, 2);
    assert.equal(m.events[0].event_name, "MilestoneCreated");
    assert.equal(m.events[1].event_name, "PaymentReleased");
  });

  test("updateMetadata and calculateStats in MongoDB", async () => {
    await adapter.initDb();

    await adapter.upsertMilestone({
      id: 303,
      client: "0xclient1",
      freelancer: "0xfreelancer1",
      amount: "25000000000000000000", // 25 USDC
      title: "UI Design",
      deadline: 1800000000,
      status: "Funded",
      createdAt: 1700000000,
    });

    const updated = await adapter.updateMetadata(303, {
      brief: "Figma wireframes delivered",
      invoiceNotes: "Due on sign-off",
      freelancerEmail: "freelancer@example.com",
    });

    assert.ok(updated);
    assert.equal(updated.brief, "Figma wireframes delivered");
    assert.equal(updated.invoice_notes, "Due on sign-off");
    assert.equal(updated.freelancer_email, "freelancer@example.com");

    const stats = await adapter.calculateStats();
    assert.equal(stats.totalMilestones, 1);
    assert.equal(stats.activeMilestones, 1);
    assert.equal(stats.totalLockedUSDC, "25");
  });

  test("sync state get and set in MongoDB", async () => {
    await adapter.initDb();

    await adapter.setSyncState("cursor_block", "75000000");
    const val = await adapter.getSyncState("cursor_block");
    assert.equal(val, "75000000");
  });
});
