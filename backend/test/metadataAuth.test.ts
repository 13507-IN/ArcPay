import assert from "node:assert/strict";
import { test } from "node:test";
import { privateKeyToAccount } from "viem/accounts";
import {
  buildMetadataAuthorizationMessage,
  recoverMetadataSigner,
} from "../src/metadataAuth.js";

const account = privateKeyToAccount(
  `0x${"11".repeat(32)}` as `0x${string}`
);
const metadata = {
  brief: "Deliver the approved landing page.",
  invoiceNotes: "Invoice on acceptance.",
};

test("metadata authorization recovers the signing milestone wallet", async () => {
  process.env.ESCROW_CONTRACT_ADDRESS =
    "0x2222222222222222222222222222222222222222";
  const issuedAt = Date.now();
  const message = buildMetadataAuthorizationMessage({
    address: account.address,
    milestoneId: 7,
    issuedAt,
    metadata,
  });
  const signature = await account.signMessage({ message });

  const recovered = await recoverMetadataSigner({
    address: account.address,
    signature,
    issuedAt,
    milestoneId: 7,
    metadata,
  });

  assert.equal(recovered?.toLowerCase(), account.address.toLowerCase());
});

test("metadata authorization cannot be reused for modified fields", async () => {
  const issuedAt = Date.now();
  const message = buildMetadataAuthorizationMessage({
    address: account.address,
    milestoneId: 7,
    issuedAt,
    metadata,
  });
  const signature = await account.signMessage({ message });

  const recovered = await recoverMetadataSigner({
    address: account.address,
    signature,
    issuedAt,
    milestoneId: 7,
    metadata: { ...metadata, brief: "Changed after signing." },
  });

  assert.notEqual(recovered?.toLowerCase(), account.address.toLowerCase());
});

test("expired metadata authorization is rejected", async () => {
  const issuedAt = Date.now() - 6 * 60 * 1000;
  const message = buildMetadataAuthorizationMessage({
    address: account.address,
    milestoneId: 7,
    issuedAt,
    metadata,
  });
  const signature = await account.signMessage({ message });

  const recovered = await recoverMetadataSigner({
    address: account.address,
    signature,
    issuedAt,
    milestoneId: 7,
    metadata,
  });

  assert.equal(recovered, null);
});
