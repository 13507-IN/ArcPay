import { Router, Request, Response } from "express";
import {
  getMilestones,
  getMilestoneById,
  updateMetadata,
  calculateStats,
} from "../db.js";
import { recoverMetadataSigner } from "../metadataAuth.js";
import { isAddress } from "viem";
import { inspectDeliverable } from "../services/aiVerifier.js";

const router = Router();

/**
 * GET /api/milestones
 * Query params: ?address=0x... (optional)
 * Returns filtered milestones and aggregated financial stats (locked, paid, earned).
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const address = req.query.address as string | undefined;

    const milestones = await getMilestones(address);
    const stats = await calculateStats(address);

    res.json({
      success: true,
      data: {
        milestones,
        stats,
      },
    });
  } catch (err: any) {
    console.error("Error in GET /api/milestones:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Internal server error",
    });
  }
});

/**
 * GET /api/milestones/:id
 * Fetches milestone timeline, off-chain notes, and Arc Explorer links.
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ success: false, error: "Invalid milestone ID" });
      return;
    }

    const milestone = await getMilestoneById(id);
    if (!milestone) {
      res.status(404).json({ success: false, error: "Milestone not found" });
      return;
    }

    // Append explorer links for convenience
    const explorerBase = "https://explorer.testnet.arc.io/tx";
    const enhancedEvents = milestone.events.map((e) => ({
      ...e,
      explorerUrl: `${explorerBase}/${e.tx_hash}`,
    }));

    res.json({
      success: true,
      data: {
        ...milestone,
        events: enhancedEvents,
        explorerLinks: {
          createdTx: milestone.created_tx_hash
            ? `${explorerBase}/${milestone.created_tx_hash}`
            : null,
          submittedTx: milestone.submitted_tx_hash
            ? `${explorerBase}/${milestone.submitted_tx_hash}`
            : null,
          releasedTx: milestone.released_tx_hash
            ? `${explorerBase}/${milestone.released_tx_hash}`
            : null,
          refundedTx: milestone.refunded_tx_hash
            ? `${explorerBase}/${milestone.refunded_tx_hash}`
            : null,
        },
      },
    });
  } catch (err: any) {
    console.error("Error in GET /api/milestones/:id:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Internal server error",
    });
  }
});

/**
 * POST /api/milestones/:id/metadata
 * Stores off-chain project briefs, invoice notes, or freelancer email/webhook preferences.
 */
router.post("/:id/metadata", async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      res.status(400).json({ success: false, error: "A JSON object is required" });
      return;
    }

    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ success: false, error: "Invalid milestone ID" });
      return;
    }

    const {
      brief,
      invoiceNotes,
      freelancerEmail,
      freelancerWebhook,
      address,
      signature,
      issuedAt,
    } = req.body;

    const metadata = { brief, invoiceNotes, freelancerEmail, freelancerWebhook };
    const maxLengths: Record<keyof typeof metadata, number> = {
      brief: 10_000,
      invoiceNotes: 10_000,
      freelancerEmail: 320,
      freelancerWebhook: 2_048,
    };
    for (const [field, value] of Object.entries(metadata)) {
      if (
        value !== undefined &&
        (typeof value !== "string" ||
          value.length > maxLengths[field as keyof typeof metadata])
      ) {
        res.status(400).json({
          success: false,
          error: `Invalid ${field} value`,
        });
        return;
      }
    }

    const milestone = await getMilestoneById(id);
    if (!milestone) {
      res.status(404).json({
        success: false,
        error: "Milestone not found to attach metadata",
      });
      return;
    }

    if (typeof address !== "string" || !isAddress(address)) {
      res.status(400).json({
        success: false,
        error: "A valid signing wallet address is required",
      });
      return;
    }

    const signer = await recoverMetadataSigner({
      address,
      signature,
      issuedAt,
      milestoneId: id,
      metadata,
    });
    const normalizedAddress = address.toLowerCase();
    const isMilestoneParty =
      milestone.client === normalizedAddress ||
      milestone.freelancer === normalizedAddress;

    if (!signer || signer.toLowerCase() !== normalizedAddress || !isMilestoneParty) {
      res.status(401).json({
        success: false,
        error: "A recent signature from a milestone party is required",
      });
      return;
    }

    const updated = await updateMetadata(id, metadata);
    res.json({
      success: true,
      message: "Milestone metadata saved successfully",
      data: updated,
    });
  } catch (err: any) {
    console.error("Error in POST /api/milestones/:id/metadata:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Internal server error",
    });
  }
});

/**
 * POST /api/milestones/verify
 * Public deliverable inspection endpoint (pre-submission check)
 */
router.post("/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const { deliverableUrl, title, brief } = req.body;
    if (!deliverableUrl || typeof deliverableUrl !== "string") {
      res.status(400).json({ success: false, error: "A deliverable URL is required" });
      return;
    }

    const report = inspectDeliverable({ deliverableUrl, title, brief });
    res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    console.error("Error in POST /api/milestones/verify:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Verification inspection failed",
    });
  }
});

/**
 * POST /api/milestones/:id/verify
 * Audits a specific milestone's submitted deliverable and generates a verifiable audit report
 */
router.post("/:id/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ success: false, error: "Invalid milestone ID" });
      return;
    }

    const milestone = await getMilestoneById(id);
    if (!milestone) {
      res.status(404).json({ success: false, error: "Milestone not found" });
      return;
    }

    const deliverableUrl = req.body?.deliverableUrl || milestone.deliverable_url;
    if (!deliverableUrl) {
      res.status(400).json({
        success: false,
        error: "No deliverable URL has been submitted for this milestone",
      });
      return;
    }

    const report = inspectDeliverable({
      deliverableUrl,
      title: milestone.title,
      brief: milestone.brief || undefined,
      milestoneId: id,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    console.error("Error in POST /api/milestones/:id/verify:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Milestone verification audit failed",
    });
  }
});

export default router;
