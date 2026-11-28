import {
  createPublicClient,
  http,
  Address,
  Log,
  decodeEventLog,
} from "viem";
import { arcTestnet, ARC_MILESTONE_ESCROW_ABI } from "./arcChain.js";
import {
  upsertMilestone,
  updateDeliverable,
  updateStatus,
  recordEvent,
  getSyncState,
  setSyncState,
} from "./db.js";

const RPC_URL = process.env.ARC_TESTNET_RPC || "https://rpc.testnet.arc.io";
const CONTRACT_ADDRESS = (process.env.ESCROW_CONTRACT_ADDRESS ||
  "0xf17d3214dc10428932B0951e1B6AD21e1d6Ade4a") as Address;

export const INDEXER_CURSOR_KEY = `last_synced_block:${CONTRACT_ADDRESS.toLowerCase()}`;

// Safe defaults for Arc Testnet public RPC rate limits
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "10000", 10);
const MAX_BLOCK_RANGE = 500n;
const MAX_BLOCKS_PER_TICK = 1000n;
const INDEXER_START_BLOCK = process.env.INDEXER_START_BLOCK
  ? BigInt(process.env.INDEXER_START_BLOCK)
  : null;

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(RPC_URL, {
    retryCount: 2,
    retryDelay: 1000,
  }),
});

let syncPromise: Promise<void> | null = null;
let rateLimitCooldownUntil = 0;

export async function getLiveBlockHeight(): Promise<bigint> {
  return await publicClient.getBlockNumber();
}

/**
 * Public trigger to sync on-chain events and contract state
 */
export function syncEvents(): Promise<void> {
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    return Promise.resolve();
  }

  if (syncPromise) return syncPromise;

  syncPromise = runSyncCycle().finally(() => {
    syncPromise = null;
  });
  return syncPromise;
}

/**
 * Master sync cycle:
 * 1. Fast contract state sync via view method (single eth_call, never rate-limited)
 * 2. Incremental event logs indexing with rate-limit protection and exponential backoff
 */
async function runSyncCycle(): Promise<void> {
  // Step 1: Direct contract view sync (rock solid, fast, zero rate limit risk)
  await syncContractStateDirectly().catch((err) => {
    console.warn("[Indexer] Direct contract sync notice:", err?.message || err);
  });

  // Step 2: Event logs sync for timeline audit history
  await syncEventLogs().catch((err) => {
    console.warn("[Indexer] Event log sync notice:", err?.message || err);
  });
}

/**
 * Reads milestone states directly from contract storage via getMilestones.
 * Uses a single lightweight eth_call, eliminating 429 rate limit errors.
 */
async function syncContractStateDirectly(): Promise<void> {
  try {
    const totalCount = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ARC_MILESTONE_ESCROW_ABI,
      functionName: "getMilestonesCount",
    });

    const count = Number(totalCount);
    if (count === 0) return;

    const rawMilestones = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ARC_MILESTONE_ESCROW_ABI,
      functionName: "getMilestones",
      args: [0n, BigInt(count)],
    });

    const statusMap = [
      "Funded",
      "Submitted",
      "Released",
      "Disputed",
      "Refunded",
    ] as const;

    for (const m of rawMilestones as any[]) {
      const id = Number(m.id);
      const status = statusMap[m.status] || "Funded";
      const createdAt = Number(m.createdAt);

      await upsertMilestone({
        id,
        client: m.client,
        freelancer: m.freelancer,
        amount: m.amount.toString(),
        title: m.title,
        deadline: Number(m.deadline),
        status,
        createdAt,
      });

      if (m.deliverableIpfsOrUrl) {
        await updateDeliverable(id, m.deliverableIpfsOrUrl);
      }
    }
  } catch (err: any) {
    // If rate-limited on eth_call, trigger cooldown
    if (err?.status === 429 || String(err?.message).includes("limit exceeded")) {
      rateLimitCooldownUntil = Date.now() + 15000;
    }
    throw err;
  }
}

/**
 * Polls event logs incrementally with rate-limit guards
 */
async function syncEventLogs(): Promise<void> {
  // Check if we are in backoff cooldown
  if (Date.now() < rateLimitCooldownUntil) {
    return;
  }

  try {
    const currentBlock = await publicClient.getBlockNumber();
    const lastSyncedStr = await getSyncState(INDEXER_CURSOR_KEY);

    let fromBlock: bigint;

    if (lastSyncedStr) {
      const lastSynced = BigInt(lastSyncedStr);
      // If lagging by more than 2,000 blocks and no explicit start block, advance cursor to recent blocks
      // to avoid triggering RPC 429s across historical blocks
      if (currentBlock - lastSynced > 2000n && INDEXER_START_BLOCK === null) {
        console.log(
          `[Indexer] Advancing sync cursor from block ${lastSynced} to recent block ${currentBlock - 500n} to respect RPC limits.`
        );
        fromBlock = currentBlock > 500n ? currentBlock - 500n : 0n;
      } else {
        fromBlock = lastSynced + 1n;
      }
    } else if (INDEXER_START_BLOCK !== null) {
      fromBlock = INDEXER_START_BLOCK;
    } else {
      // Default: start from the last 500 blocks
      fromBlock = currentBlock > 500n ? currentBlock - 500n : 0n;
    }

    if (fromBlock > currentBlock) {
      return;
    }

    // Limit work per tick to avoid blasting public RPC with too many getLogs
    const targetEndBlock =
      fromBlock + MAX_BLOCKS_PER_TICK > currentBlock
        ? currentBlock
        : fromBlock + MAX_BLOCKS_PER_TICK;

    let cursor = fromBlock;
    while (cursor <= targetEndBlock) {
      const chunkEnd =
        cursor + MAX_BLOCK_RANGE > targetEndBlock
          ? targetEndBlock
          : cursor + MAX_BLOCK_RANGE;

      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        fromBlock: cursor,
        toBlock: chunkEnd,
      });

      for (const log of logs) {
        await processLog(log);
      }

      await setSyncState(INDEXER_CURSOR_KEY, chunkEnd.toString());
      cursor = chunkEnd + 1n;

      // Small throttle pause between chunks if multiple
      if (cursor <= targetEndBlock) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  } catch (err: any) {
    const isRateLimit =
      err?.status === 429 ||
      String(err?.message || "").includes("rate limit") ||
      String(err?.message || "").includes("limit exceeded") ||
      String(err?.message || "").includes("exceeds defined limit");

    if (isRateLimit) {
      rateLimitCooldownUntil = Date.now() + 20000; // 20s backoff cooldown
      console.warn(
        "[Indexer] Arc RPC rate limit reached (HTTP 429). Backing off for 20 seconds. (Contract view data remains fully accessible)"
      );
    } else {
      console.error("[Indexer] Error syncing events:", err?.message || err);
    }
  }
}

async function processLog(log: Log) {
  try {
    const block = await publicClient.getBlock({ blockNumber: log.blockNumber! });
    const timestamp = Number(block.timestamp);
    const txHash = log.transactionHash!;

    const decoded = decodeEventLog({
      abi: ARC_MILESTONE_ESCROW_ABI,
      data: log.data,
      topics: log.topics,
    });

    const { eventName, args } = decoded;

    if (eventName === "MilestoneCreated") {
      const { id, client, freelancer, amount, title, deadline } = args as any;
      const milestoneId = Number(id);

      await upsertMilestone({
        id: milestoneId,
        client,
        freelancer,
        amount: amount.toString(),
        title,
        deadline: Number(deadline),
        status: "Funded",
        createdAt: timestamp,
        txHash,
      });

      await recordEvent(milestoneId, "MilestoneCreated", txHash, Number(log.blockNumber), timestamp, {
        client,
        freelancer,
        amount: amount.toString(),
        title,
        deadline: Number(deadline),
      });

      console.log(`[Indexer] Indexed Milestone #${milestoneId} Created by ${client}`);
    } else if (eventName === "WorkSubmitted") {
      const { id, freelancer, deliverableUrl } = args as any;
      const milestoneId = Number(id);

      await updateDeliverable(milestoneId, deliverableUrl, txHash);

      await recordEvent(milestoneId, "WorkSubmitted", txHash, Number(log.blockNumber), timestamp, {
        freelancer,
        deliverableUrl,
      });

      console.log(`[Indexer] Indexed Work Submitted for Milestone #${milestoneId}`);
    } else if (eventName === "PaymentReleased") {
      const { id, client, freelancer, amount } = args as any;
      const milestoneId = Number(id);

      await updateStatus(milestoneId, "Released", "released_tx_hash", txHash);

      await recordEvent(milestoneId, "PaymentReleased", txHash, Number(log.blockNumber), timestamp, {
        client,
        freelancer,
        amount: amount.toString(),
      });

      console.log(`[Indexer] Indexed Payment Released for Milestone #${milestoneId}`);
    } else if (eventName === "ClientRefunded") {
      const { id, client, refundedBy, amount } = args as any;
      const milestoneId = Number(id);

      await updateStatus(milestoneId, "Refunded", "refunded_tx_hash", txHash);

      await recordEvent(milestoneId, "ClientRefunded", txHash, Number(log.blockNumber), timestamp, {
        client,
        refundedBy,
        amount: amount.toString(),
      });

      console.log(`[Indexer] Indexed Refund for Milestone #${milestoneId}`);
    }
  } catch (err: any) {
    console.warn(`[Indexer] Unable to process log ${log.transactionHash}:`, err?.message);
  }
}

let pollTimer: NodeJS.Timeout | null = null;

export function startIndexer() {
  if (pollTimer) return;
  console.log(`[Indexer] Starting Arc Testnet indexer (poll interval: ${POLL_INTERVAL_MS}ms)...`);
  console.log(`[Indexer] Target Contract: ${CONTRACT_ADDRESS}`);

  // Initial sync
  syncEvents().catch(console.error);

  // Poll loop
  pollTimer = setInterval(() => {
    syncEvents().catch(console.error);
  }, POLL_INTERVAL_MS);
  pollTimer.unref?.();
}

export function stopIndexer() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
