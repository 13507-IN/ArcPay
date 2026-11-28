import assert from "node:assert/strict";
import { test } from "node:test";
import { privateKeyToAccount } from "viem/accounts";
import { buildGigAuthorizationMessage, recoverGigSigner } from "../src/gigAuth.js";
import { isAllowedCorsOrigin } from "../src/middleware/security.js";
import { inspectDeliverable } from "../src/services/aiVerifier.js";

const account = privateKeyToAccount(
  `0x${"22".repeat(32)}` as `0x${string}`
);

test("gigAuth binds payload and rejects modified budget or pitch", async () => {
  const issuedAt = Date.now();
  const payload = {
    title: "Build Escrow Dashboard",
    description: "Full React + Arc escrow panel",
    category: "Frontend & UI",
    budgetUsdc: "250",
    deadlineDays: 7,
    skills: ["React", "Next.js"],
  };

  const message = buildGigAuthorizationMessage({
    action: "create-gig",
    address: account.address,
    issuedAt,
    payload,
  });

  const signature = await account.signMessage({ message });

  const validSigner = await recoverGigSigner({
    action: "create-gig",
    address: account.address,
    signature,
    issuedAt,
    payload,
  });
  assert.equal(validSigner?.toLowerCase(), account.address.toLowerCase());

  const tamperedSigner = await recoverGigSigner({
    action: "create-gig",
    address: account.address,
    signature,
    issuedAt,
    payload: { ...payload, budgetUsdc: "99999" },
  });
  assert.notEqual(tamperedSigner?.toLowerCase(), account.address.toLowerCase());
});

test("isAllowedCorsOrigin allows localhost and Vercel, rejects unknown origins in production", () => {
  const prevEnv = process.env.NODE_ENV;
  const prevCors = process.env.CORS_ORIGINS;
  try {
    process.env.NODE_ENV = "production";
    delete process.env.CORS_ORIGINS;

    assert.equal(isAllowedCorsOrigin("http://localhost:3000"), true);
    assert.equal(isAllowedCorsOrigin("https://arcpay-preview.vercel.app"), true);
    assert.equal(isAllowedCorsOrigin("https://evil-phishing-site.com"), false);
  } finally {
    process.env.NODE_ENV = prevEnv;
    if (prevCors === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = prevCors;
  }
});

test("aiVerifier SSRF guard blocks localhost and cloud metadata endpoints", async () => {
  const targets = [
    "http://127.0.0.1:3001/api/health",
    "http://169.254.169.254/latest/meta-data/",
    "http://localhost:8080/admin",
  ];

  for (const target of targets) {
    const report = await inspectDeliverable({
      deliverableUrl: target,
      title: "Test Deliverable",
      forceRefresh: true,
    });
    assert.equal(report.status, "FAILED");
    assert.equal(report.checks[0]?.status, "failed");
  }
});
