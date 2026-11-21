import assert from "node:assert/strict";
import { test, describe, afterEach } from "node:test";
import { MongoAdapter } from "../src/db/mongoAdapter.js";
import {
  getDatabaseType,
  getAdapter,
  setAdapter,
  upsertMilestone,
  getMilestoneById,
} from "../src/db.js";

describe("Database configuration (MongoDB only)", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    setAdapter(null);
  });

  test("getDatabaseType always returns mongodb", () => {
    delete process.env.DATABASE_TYPE;
    assert.equal(getDatabaseType(), "mongodb");

    process.env.DATABASE_TYPE = "mongodb";
    assert.equal(getDatabaseType(), "mongodb");

    process.env.DATABASE_TYPE = "mongo";
    assert.equal(getDatabaseType(), "mongodb");

    process.env.DATABASE_TYPE = "sqlite";
    assert.equal(getDatabaseType(), "mongodb");
  });

  test("getAdapter returns a MongoAdapter by default", () => {
    setAdapter(null);
    assert.ok(getAdapter() instanceof MongoAdapter);
  });

  test("setAdapter allows injecting a custom database adapter into facade", async () => {
    let captured: any = null;
    const fakeAdapter = {
      upsertMilestone: async (m: any) => {
        captured = m;
      },
      getMilestoneById: async (id: number) => ({
        id,
        title: "Test Facade Injection",
      }),
    } as any;

    setAdapter(fakeAdapter);

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

    assert.equal(captured.id, 99);

    const m = await getMilestoneById(99);
    assert.ok(m);
    assert.equal(m.title, "Test Facade Injection");
  });
});
