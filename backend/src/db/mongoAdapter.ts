import { MongoClient, Db, MongoClientOptions } from "mongodb";
import {
  MilestoneRecord,
  MilestoneEventRecord,
  MilestoneMetadataInput,
  MilestoneStats,
  MilestoneStatus,
} from "../types.js";
import { DatabaseAdapter, EnrichedMilestone } from "./types.js";
import { calculateMilestoneStats } from "./stats.js";

export class MongoAdapter implements DatabaseAdapter {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private uri: string;
  private dbName: string;
  private clientOptions?: MongoClientOptions;

  constructor(
    customClientOrUri?: string | MongoClient,
    customDbNameOrDb?: string | Db,
    options?: MongoClientOptions
  ) {
    if (customClientOrUri instanceof MongoClient) {
      this.client = customClientOrUri;
      if (customDbNameOrDb && typeof customDbNameOrDb !== "string") {
        this.db = customDbNameOrDb;
      }
      this.uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
      this.dbName = process.env.MONGODB_DB_NAME || "arcpay";
      return;
    }

    if (customDbNameOrDb && typeof customDbNameOrDb !== "string") {
      this.db = customDbNameOrDb;
    }

    this.uri =
      customClientOrUri ||
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017";
    this.dbName =
      (typeof customDbNameOrDb === "string" ? customDbNameOrDb : undefined) ||
      process.env.MONGODB_DB_NAME ||
      "arcpay";
    this.clientOptions = options;
  }

  public getRawDb(): Db {
    if (!this.db) {
      throw new Error(
        "MongoDB has not been initialized. Call initDb() before accessing the database."
      );
    }
    return this.db;
  }

  public getRawClient(): MongoClient | null {
    return this.client;
  }

  public async initDb(): Promise<void> {
    if (!this.db) {
      if (!this.client) {
        this.client = new MongoClient(this.uri, {
          serverSelectionTimeoutMS: 5000,
          ...this.clientOptions,
        });
      }
      await this.client.connect();
      this.db = this.client.db(this.dbName);
    }

    // Initialize collections and create optimal indexes
    const milestones = this.db.collection("milestones");
    await milestones.createIndex({ id: 1 }, { unique: true });
    await milestones.createIndex({ client: 1 });
    await milestones.createIndex({ freelancer: 1 });
    await milestones.createIndex({ status: 1 });

    const events = this.db.collection("events");
    await events.createIndex({ milestone_id: 1 });
    await events.createIndex({ tx_hash: 1 });
    await events.createIndex(
      { tx_hash: 1, event_name: 1, milestone_id: 1 },
      { background: true }
    );

    const syncState = this.db.collection("sync_state");
    await syncState.createIndex({ key: 1 }, { unique: true });
  }

  public async closeDb(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  public async upsertMilestone(m: {
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
    const db = this.getRawDb();
    const collection = db.collection<MilestoneRecord>("milestones");
    const existing = await collection.findOne({ id: m.id });
    const now = Math.floor(Date.now() / 1000);

    if (!existing) {
      const doc: MilestoneRecord = {
        id: m.id,
        client: m.client.toLowerCase(),
        freelancer: m.freelancer.toLowerCase(),
        amount: m.amount,
        title: m.title,
        deliverable_url: "",
        deadline: m.deadline,
        status: m.status,
        created_at: m.createdAt,
        created_tx_hash: m.txHash || null,
        submitted_tx_hash: null,
        released_tx_hash: null,
        refunded_tx_hash: null,
        brief: null,
        invoice_notes: null,
        freelancer_email: null,
        freelancer_webhook: null,
        updated_at: now,
      };
      await collection.insertOne(doc as any);
    } else {
      await collection.updateOne(
        { id: m.id },
        {
          $set: {
            client: m.client.toLowerCase(),
            freelancer: m.freelancer.toLowerCase(),
            amount: m.amount,
            title: m.title,
            deadline: m.deadline,
            status: m.status,
            updated_at: now,
          },
        }
      );
    }
  }

  public async updateDeliverable(
    id: number,
    deliverableUrl: string,
    txHash?: string
  ): Promise<void> {
    const db = this.getRawDb();
    const collection = db.collection("milestones");
    const now = Math.floor(Date.now() / 1000);

    const updateFields: Record<string, any> = {
      deliverable_url: deliverableUrl,
      status: "Submitted",
      updated_at: now,
    };
    if (txHash) {
      updateFields.submitted_tx_hash = txHash;
    }

    await collection.updateOne({ id }, { $set: updateFields });
  }

  public async updateStatus(
    id: number,
    status: MilestoneStatus,
    txHashField?: "released_tx_hash" | "refunded_tx_hash",
    txHash?: string
  ): Promise<void> {
    const db = this.getRawDb();
    const collection = db.collection("milestones");
    const now = Math.floor(Date.now() / 1000);

    const updateFields: Record<string, any> = {
      status,
      updated_at: now,
    };
    if (txHashField && txHash) {
      updateFields[txHashField] = txHash;
    }

    await collection.updateOne({ id }, { $set: updateFields });
  }

  public async recordEvent(
    milestoneId: number,
    eventName: string,
    txHash: string,
    blockNumber: number,
    timestamp: number,
    payload: any
  ): Promise<void> {
    const db = this.getRawDb();
    const collection = db.collection("events");

    const existing = await collection.findOne({
      tx_hash: txHash,
      event_name: eventName,
      milestone_id: milestoneId,
    });

    if (!existing) {
      const lastEvent = await collection
        .find({}, { projection: { id: 1 } })
        .sort({ id: -1 })
        .limit(1)
        .next();
      const nextId =
        lastEvent && typeof (lastEvent as any).id === "number"
          ? (lastEvent as any).id + 1
          : 1;

      await collection.insertOne({
        id: nextId,
        milestone_id: milestoneId,
        event_name: eventName,
        tx_hash: txHash,
        block_number: blockNumber,
        timestamp,
        payload:
          typeof payload === "string" ? payload : JSON.stringify(payload),
      });
    }
  }

  public async getMilestoneById(id: number): Promise<EnrichedMilestone | null> {
    const db = this.getRawDb();
    const milestones = db.collection<MilestoneRecord>("milestones");
    const milestone = await milestones.findOne(
      { id },
      { projection: { _id: 0 } }
    );
    if (!milestone) return null;

    const events = db.collection("events");
    const rawEvents = await events
      .find({ milestone_id: id }, { projection: { _id: 0 } })
      .sort({ block_number: 1, id: 1 })
      .toArray();

    return {
      ...(milestone as MilestoneRecord),
      events: rawEvents.map((e: any) => ({
        id: e.id,
        milestone_id: e.milestone_id,
        event_name: e.event_name,
        tx_hash: e.tx_hash,
        block_number: e.block_number,
        timestamp: e.timestamp,
        payload:
          typeof e.payload === "string" ? JSON.parse(e.payload) : e.payload,
      })),
    };
  }

  public async getMilestones(address?: string): Promise<MilestoneRecord[]> {
    const db = this.getRawDb();
    const milestones = db.collection<MilestoneRecord>("milestones");
    const filter: any = {};

    if (address) {
      const addr = address.toLowerCase();
      filter.$or = [{ client: addr }, { freelancer: addr }];
    }

    const results = await milestones
      .find(filter, { projection: { _id: 0 } })
      .sort({ id: -1 })
      .toArray();

    return results as unknown as MilestoneRecord[];
  }

  public async updateMetadata(
    id: number,
    data: MilestoneMetadataInput
  ): Promise<EnrichedMilestone | null> {
    const db = this.getRawDb();
    const milestones = db.collection<MilestoneRecord>("milestones");
    const existing = await milestones.findOne({ id });
    if (!existing) return null;

    const updates: Record<string, any> = {};
    if (data.brief !== undefined) updates.brief = data.brief;
    if (data.invoiceNotes !== undefined) updates.invoice_notes = data.invoiceNotes;
    if (data.freelancerEmail !== undefined)
      updates.freelancer_email = data.freelancerEmail;
    if (data.freelancerWebhook !== undefined)
      updates.freelancer_webhook = data.freelancerWebhook;

    if (Object.keys(updates).length > 0) {
      updates.updated_at = Math.floor(Date.now() / 1000);
      await milestones.updateOne({ id }, { $set: updates });
    }

    return this.getMilestoneById(id);
  }

  public async calculateStats(address?: string): Promise<MilestoneStats> {
    const milestones = await this.getMilestones(address);
    return calculateMilestoneStats(milestones, address);
  }

  public async getSyncState(key: string): Promise<string | null> {
    const db = this.getRawDb();
    const row = await db.collection("sync_state").findOne({ key });
    return row ? (row.value as string) : null;
  }

  public async setSyncState(key: string, value: string): Promise<void> {
    const db = this.getRawDb();
    await db.collection("sync_state").updateOne(
      { key },
      { $set: { key, value } },
      { upsert: true }
    );
  }
}
