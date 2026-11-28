import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { Server } from "node:http";
import { initDb, closeDb, getSyncState, getDatabaseType } from "./db.js";
import {
  startIndexer,
  stopIndexer,
  getLiveBlockHeight,
  INDEXER_CURSOR_KEY,
} from "./indexer.js";
import milestonesRouter from "./routes/milestones.js";
import gigsRouter from "./routes/gigs.js";
import analyticsRouter from "./routes/analytics.js";
import {
  securityHeaders,
  isAllowedCorsOrigin,
  createRateLimiter,
} from "./middleware/security.js";

const app = express();
const PORT = process.env.PORT || 3001;
const CONTRACT_ADDRESS =
  process.env.ESCROW_CONTRACT_ADDRESS ||
  "0xf17d3214dc10428932B0951e1B6AD21e1d6Ade4a";
const RPC_URL = process.env.ARC_TESTNET_RPC || "https://rpc.testnet.arc.io";

// Security & Hardening Middleware
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "32kb" }));

const apiRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 120,
  message: "Rate limit exceeded (120 requests/min). Please retry shortly.",
});
app.use("/api", apiRateLimiter);

// Register API Routes
app.use("/api/milestones", milestonesRouter);
app.use("/api/gigs", gigsRouter);
app.use("/api/analytics", analyticsRouter);

/**
 * GET /api/health
 * Verifies live RPC connection to Arc Testnet, database status, AI readiness, and block height.
 */
app.get("/api/health", async (_req: Request, res: Response): Promise<void> => {
  const aiConfigured = Boolean(
    process.env.CEREBRAS_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      (process.env.AI_API_KEY && process.env.AI_BASE_URL)
  );

  try {
    const liveBlock = await getLiveBlockHeight();
    const lastSynced = await getSyncState(INDEXER_CURSOR_KEY);

    res.json({
      status: "healthy",
      database: getDatabaseType(),
      network: "Arc Testnet",
      chainId: 5042002,
      rpcUrl: RPC_URL,
      contractAddress: CONTRACT_ADDRESS,
      liveBlockHeight: liveBlock.toString(),
      lastSyncedBlock: lastSynced || "Not started",
      aiConfigured,
      githubTokenConfigured: Boolean(process.env.GITHUB_TOKEN),
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: "degraded",
      database: getDatabaseType(),
      network: "Arc Testnet",
      chainId: 5042002,
      rpcUrl: RPC_URL,
      aiConfigured,
      error: err?.message || "Failed to reach Arc Testnet RPC",
      timestamp: new Date().toISOString(),
    });
  }
});

let httpServer: Server | null = null;
let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[ArcPay] Received ${signal}. Shutting down gracefully...`);
  stopIndexer();

  if (httpServer) {
    await new Promise<void>((resolve) => {
      httpServer!.close(() => resolve());
    });
  }
  await closeDb();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

// Start Server and Database
async function startServer() {
  await initDb();
  startIndexer();

  httpServer = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`   ArcPay Backend API running on port ${PORT} `);
    console.log(`   Database   : ${getDatabaseType().toUpperCase()}`);
    console.log(`   Target RPC : ${RPC_URL}                      `);
    console.log(`   Chain ID   : 5042002 (Arc Testnet)           `);
    console.log(`   Health     : http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start ArcPay backend:", err);
  const errMsg =
    String(err?.message || "") + String(err?.cause?.message || "");
  if (
    errMsg.includes("SSL alert number 80") ||
    errMsg.includes("tlsv1 alert internal error") ||
    err?.name === "MongoServerSelectionError"
  ) {
    console.error("\n=======================================================");
    console.error(" [MongoDB Atlas Diagnostic Tip]");
    console.error(
      " 'SSL alert number 80' / 'tlsv1 alert internal error' indicates MongoDB Atlas is blocking Render's IP address."
    );
    console.error(" Resolution:");
    console.error(" 1. Go to cloud.mongodb.com -> Select your Cluster");
    console.error(" 2. In the left sidebar, click 'Network Access'");
    console.error(" 3. Click '+ Add IP Address'");
    console.error(" 4. Choose 'Allow Access from Anywhere' (0.0.0.0/0)");
    console.error(" 5. Click 'Confirm' and wait 1 minute for it to apply.");
    console.error("=======================================================\n");
  }
  process.exit(1);
});
