import { MongoClient, Db, MongoClientOptions } from "mongodb";
import {
  MilestoneRecord,
  MilestoneEventRecord,
  MilestoneMetadataInput,
  MilestoneStats,
  MilestoneStatus,
  MilestoneAiAuditSummary,
  PlatformAnalytics,
  GigRecord,
  GigCategory,
  GigApplicationRecord,
  EnrichedGig,
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

    const gigs = this.db.collection("gigs");
    await gigs.createIndex({ id: 1 }, { unique: true });
    await gigs.createIndex({ status: 1 });
    await gigs.createIndex({ category: 1 });
    await gigs.createIndex({ client: 1 });

    const gigApplications = this.db.collection("gig_applications");
    await gigApplications.createIndex({ id: 1 }, { unique: true });
    await gigApplications.createIndex({ gig_id: 1 });
    await gigApplications.createIndex({ gig_id: 1, freelancer: 1 }, { unique: true });
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

  public async createGig(input: {
    client: string;
    title: string;
    description: string;
    category: GigCategory;
    budget_usdc: string;
    deadline_days: number;
    skills: string[];
  }): Promise<EnrichedGig> {
    const db = this.getRawDb();
    const gigs = db.collection<GigRecord>("gigs");
    const last = await gigs
      .find({}, { projection: { id: 1 } })
      .sort({ id: -1 })
      .limit(1)
      .next();
    const nextId = last && typeof last.id === "number" ? last.id + 1 : 1;
    const now = Math.floor(Date.now() / 1000);

    const record: GigRecord = {
      id: nextId,
      client: input.client.toLowerCase(),
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      budget_usdc: input.budget_usdc.trim(),
      deadline_days: input.deadline_days,
      skills: input.skills,
      status: "Open",
      selected_freelancer: null,
      linked_milestone_id: null,
      created_at: now,
      updated_at: now,
    };

    await gigs.insertOne({ ...record });
    return { ...record, applications_count: 0, applications: [] };
  }

  public async getGigs(filters?: {
    status?: string;
    category?: string;
    client?: string;
    search?: string;
  }): Promise<EnrichedGig[]> {
    const db = this.getRawDb();
    const gigsCol = db.collection<GigRecord>("gigs");
    const appsCol = db.collection<GigApplicationRecord>("gig_applications");

    const query: Record<string, any> = {};
    if (filters?.status && filters.status !== "all") {
      query.status = filters.status;
    }
    if (filters?.category && filters.category !== "all") {
      query.category = filters.category;
    }
    if (filters?.client) {
      query.client = filters.client.toLowerCase();
    }
    if (filters?.search && filters.search.trim()) {
      const escaped = filters.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { skills: regex },
        { client: regex },
      ];
    }

    const gigList = await gigsCol
      .find(query, { projection: { _id: 0 } })
      .sort({ id: -1 })
      .toArray();

    if (gigList.length === 0) return [];

    const gigIds = gigList.map((g) => g.id);
    const allApps = await appsCol
      .find({ gig_id: { $in: gigIds } }, { projection: { _id: 0 } })
      .sort({ created_at: -1, id: -1 })
      .toArray();

    const appsByGig = new Map<number, GigApplicationRecord[]>();
    for (const app of allApps) {
      const list = appsByGig.get(app.gig_id) || [];
      list.push(app as unknown as GigApplicationRecord);
      appsByGig.set(app.gig_id, list);
    }

    return gigList.map((g) => {
      const apps = appsByGig.get(g.id) || [];
      return {
        ...(g as unknown as GigRecord),
        applications_count: apps.length,
        applications: apps,
      };
    });
  }

  public async getGigById(id: number): Promise<EnrichedGig | null> {
    const db = this.getRawDb();
    const gig = await db
      .collection<GigRecord>("gigs")
      .findOne({ id }, { projection: { _id: 0 } });
    if (!gig) return null;

    const apps = await db
      .collection<GigApplicationRecord>("gig_applications")
      .find({ gig_id: id }, { projection: { _id: 0 } })
      .sort({ created_at: -1, id: -1 })
      .toArray();

    return {
      ...(gig as unknown as GigRecord),
      applications_count: apps.length,
      applications: apps as unknown as GigApplicationRecord[],
    };
  }

  public async applyToGig(input: {
    gig_id: number;
    freelancer: string;
    pitch: string;
    portfolio_url?: string | null;
    proposed_usdc?: string | null;
  }): Promise<GigApplicationRecord> {
    const db = this.getRawDb();
    const appsCol = db.collection<GigApplicationRecord>("gig_applications");
    const freelancer = input.freelancer.toLowerCase();
    const now = Math.floor(Date.now() / 1000);

    const existing = await appsCol.findOne(
      { gig_id: input.gig_id, freelancer },
      { projection: { _id: 0 } }
    );

    if (existing) {
      await appsCol.updateOne(
        { gig_id: input.gig_id, freelancer },
        {
          $set: {
            pitch: input.pitch.trim(),
            portfolio_url: input.portfolio_url?.trim() || null,
            proposed_usdc: input.proposed_usdc?.trim() || null,
            created_at: now,
          },
        }
      );
      return {
        ...(existing as unknown as GigApplicationRecord),
        pitch: input.pitch.trim(),
        portfolio_url: input.portfolio_url?.trim() || null,
        proposed_usdc: input.proposed_usdc?.trim() || null,
        created_at: now,
      };
    }

    const last = await appsCol
      .find({}, { projection: { id: 1 } })
      .sort({ id: -1 })
      .limit(1)
      .next();
    const nextId = last && typeof last.id === "number" ? last.id + 1 : 1;

    const record: GigApplicationRecord = {
      id: nextId,
      gig_id: input.gig_id,
      freelancer,
      pitch: input.pitch.trim(),
      portfolio_url: input.portfolio_url?.trim() || null,
      proposed_usdc: input.proposed_usdc?.trim() || null,
      status: "Pending",
      created_at: now,
    };

    await appsCol.insertOne({ ...record });
    return record;
  }

  public async selectGigApplicant(
    gigId: number,
    applicationId: number
  ): Promise<EnrichedGig | null> {
    const db = this.getRawDb();
    const gigsCol = db.collection<GigRecord>("gigs");
    const appsCol = db.collection<GigApplicationRecord>("gig_applications");

    const selectedApp = await appsCol.findOne({
      id: applicationId,
      gig_id: gigId,
    });
    if (!selectedApp) return null;

    const now = Math.floor(Date.now() / 1000);

    await appsCol.updateOne(
      { id: applicationId, gig_id: gigId },
      { $set: { status: "Accepted" } }
    );
    await appsCol.updateMany(
      { gig_id: gigId, id: { $ne: applicationId } },
      { $set: { status: "Rejected" } }
    );
    await gigsCol.updateOne(
      { id: gigId },
      {
        $set: {
          status: "Assigned",
          selected_freelancer: selectedApp.freelancer.toLowerCase(),
          updated_at: now,
        },
      }
    );

    return this.getGigById(gigId);
  }

  public async closeGig(gigId: number): Promise<EnrichedGig | null> {
    const db = this.getRawDb();
    const now = Math.floor(Date.now() / 1000);
    await db.collection<GigRecord>("gigs").updateOne(
      { id: gigId },
      { $set: { status: "Closed", updated_at: now } }
    );
    return this.getGigById(gigId);
  }

  public async linkGigMilestone(
    gigId: number,
    milestoneId: number
  ): Promise<EnrichedGig | null> {
    const db = this.getRawDb();
    const now = Math.floor(Date.now() / 1000);
    await db.collection<GigRecord>("gigs").updateOne(
      { id: gigId },
      {
        $set: {
          status: "Assigned",
          linked_milestone_id: milestoneId,
          updated_at: now,
        },
      }
    );
    return this.getGigById(gigId);
  }

  public async saveMilestoneAudit(
    milestoneId: number,
    audit: MilestoneAiAuditSummary
  ): Promise<void> {
    const db = this.getRawDb();
    const now = Math.floor(Date.now() / 1000);
    await db.collection<MilestoneRecord>("milestones").updateOne(
      { id: milestoneId },
      {
        $set: {
          ai_audit: audit,
          updated_at: now,
        },
      }
    );
  }

  public async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    const db = this.getRawDb();
    const [milestones, gigs, apps] = await Promise.all([
      db
        .collection<MilestoneRecord>("milestones")
        .find({}, { projection: { client: 1, freelancer: 1, amount: 1, status: 1, ai_audit: 1 } })
        .toArray(),
      db
        .collection<GigRecord>("gigs")
        .find({}, { projection: { client: 1, status: 1 } })
        .toArray(),
      db
        .collection<GigApplicationRecord>("gig_applications")
        .find({}, { projection: { freelancer: 1 } })
        .toArray(),
    ]);

    const clients = new Set<string>();
    const freelancers = new Set<string>();
    const allWallets = new Set<string>();

    let auditsCompleted = 0;
    let auditsFailed = 0;

    for (const m of milestones) {
      if (m.client) {
        clients.add(m.client.toLowerCase());
        allWallets.add(m.client.toLowerCase());
      }
      if (m.freelancer) {
        freelancers.add(m.freelancer.toLowerCase());
        allWallets.add(m.freelancer.toLowerCase());
      }
      if (m.ai_audit) {
        auditsCompleted += 1;
        if (m.ai_audit.status === "FAILED") {
          auditsFailed += 1;
        }
      }
    }

    let openGigs = 0;
    for (const g of gigs) {
      if (g.client) {
        clients.add(g.client.toLowerCase());
        allWallets.add(g.client.toLowerCase());
      }
      if (g.status === "Open") openGigs += 1;
    }

    for (const a of apps) {
      if (a.freelancer) {
        freelancers.add(a.freelancer.toLowerCase());
        allWallets.add(a.freelancer.toLowerCase());
      }
    }

    const stats = calculateMilestoneStats(milestones as unknown as MilestoneRecord[]);

    return {
      uniqueWallets: allWallets.size,
      uniqueClients: clients.size,
      uniqueFreelancers: freelancers.size,
      totalMilestones: stats.totalMilestones,
      activeMilestones: stats.activeMilestones,
      completedMilestones: stats.completedMilestones,
      totalLockedUSDC: stats.totalLockedUSDC,
      totalPaidOutUSDC: stats.totalPaidOutUSDC,
      totalGigs: gigs.length,
      openGigs,
      totalProposals: apps.length,
      auditsCompleted,
      auditsFailed,
      generatedAt: new Date().toISOString(),
    };
  }
}
