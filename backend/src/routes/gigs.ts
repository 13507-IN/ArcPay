import { Router, Request, Response } from "express";
import { isAddress } from "viem";
import {
  createGig,
  getGigs,
  getGigById,
  applyToGig,
  selectGigApplicant,
  closeGig,
  linkGigMilestone,
} from "../db.js";
import { recoverGigSigner } from "../gigAuth.js";
import { GigCategory } from "../types.js";

const router = Router();

const VALID_CATEGORIES: GigCategory[] = [
  "Smart Contracts",
  "Frontend & UI",
  "Full-Stack",
  "Security Audit",
  "Design",
  "Other",
];

function parseGigId(raw: string | string[]): number | null {
  const val = Array.isArray(raw) ? raw[0] : raw;
  const id = parseInt(val, 10);
  return isNaN(id) || id <= 0 ? null : id;
}

/**
 * GET /api/gigs
 * Lists open/assigned/closed gigs with proposals and counts.
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const client = req.query.client as string | undefined;
    const search = req.query.search as string | undefined;

    const gigs = await getGigs({ status, category, client, search });
    res.json({ success: true, data: { gigs } });
  } catch (err: any) {
    console.error("Error in GET /api/gigs:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to load open gigs",
    });
  }
});

/**
 * GET /api/gigs/:id
 * Fetches a single gig and all freelancer proposals.
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseGigId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, error: "Invalid gig ID" });
      return;
    }

    const gig = await getGigById(id);
    if (!gig) {
      res.status(404).json({ success: false, error: "Gig not found" });
      return;
    }

    res.json({ success: true, data: gig });
  } catch (err: any) {
    console.error("Error in GET /api/gigs/:id:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to load gig details",
    });
  }
});

/**
 * POST /api/gigs
 * Creates a new open gig post authenticated by the client's wallet signature.
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      budgetUsdc,
      deadlineDays,
      skills,
      address,
      signature,
      issuedAt,
    } = req.body || {};

    if (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 140) {
      res.status(400).json({ success: false, error: "Title must be 3–140 characters" });
      return;
    }
    if (typeof description !== "string" || description.trim().length < 10 || description.trim().length > 5000) {
      res.status(400).json({ success: false, error: "Description must be 10–5000 characters" });
      return;
    }
    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ success: false, error: "Invalid gig category" });
      return;
    }

    const parsedBudget = parseFloat(String(budgetUsdc));
    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      res.status(400).json({ success: false, error: "Budget must be greater than 0 USDC" });
      return;
    }

    const parsedDays = parseInt(String(deadlineDays), 10);
    if (!Number.isFinite(parsedDays) || parsedDays < 1 || parsedDays > 365) {
      res.status(400).json({ success: false, error: "Timeline must be 1–365 days" });
      return;
    }

    if (typeof address !== "string" || !isAddress(address)) {
      res.status(400).json({ success: false, error: "Valid client wallet address required" });
      return;
    }

    const signer = await recoverGigSigner({
      action: "create-gig",
      address,
      signature,
      issuedAt,
    });

    if (!signer || signer.toLowerCase() !== address.toLowerCase()) {
      res.status(401).json({ success: false, error: "Valid wallet signature required to post a gig" });
      return;
    }

    const normalizedSkills = Array.isArray(skills)
      ? skills
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .map((s) => s.trim().slice(0, 32))
          .slice(0, 8)
      : [];

    const gig = await createGig({
      client: address,
      title,
      description,
      category,
      budget_usdc: String(budgetUsdc),
      deadline_days: parsedDays,
      skills: normalizedSkills,
    });

    res.status(201).json({ success: true, data: gig });
  } catch (err: any) {
    console.error("Error in POST /api/gigs:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to create open gig",
    });
  }
});

/**
 * POST /api/gigs/:id/apply
 * Freelancer submits a proposal to an open gig.
 */
router.post("/:id/apply", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseGigId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, error: "Invalid gig ID" });
      return;
    }

    const gig = await getGigById(id);
    if (!gig) {
      res.status(404).json({ success: false, error: "Gig not found" });
      return;
    }
    if (gig.status !== "Open") {
      res.status(400).json({ success: false, error: "This gig is no longer accepting proposals" });
      return;
    }

    const { pitch, portfolioUrl, proposedUsdc, address, signature, issuedAt } = req.body || {};

    if (typeof pitch !== "string" || pitch.trim().length < 10 || pitch.trim().length > 2500) {
      res.status(400).json({ success: false, error: "Proposal pitch must be 10–2500 characters" });
      return;
    }
    if (portfolioUrl !== undefined && portfolioUrl !== null && String(portfolioUrl).length > 500) {
      res.status(400).json({ success: false, error: "Portfolio URL is too long" });
      return;
    }
    if (typeof address !== "string" || !isAddress(address)) {
      res.status(400).json({ success: false, error: "Valid freelancer wallet address required" });
      return;
    }

    const signer = await recoverGigSigner({
      action: "apply-gig",
      address,
      signature,
      issuedAt,
      gigId: id,
    });
    if (!signer || signer.toLowerCase() !== address.toLowerCase()) {
      res.status(401).json({ success: false, error: "Valid wallet signature required to apply" });
      return;
    }

    const application = await applyToGig({
      gig_id: id,
      freelancer: address,
      pitch,
      portfolio_url: portfolioUrl ? String(portfolioUrl) : null,
      proposed_usdc: proposedUsdc ? String(proposedUsdc) : null,
    });

    res.status(201).json({ success: true, data: application });
  } catch (err: any) {
    console.error("Error in POST /api/gigs/:id/apply:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to submit proposal",
    });
  }
});

/**
 * POST /api/gigs/:id/select
 * Client selects an applicant and marks the gig as Assigned.
 */
router.post("/:id/select", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseGigId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, error: "Invalid gig ID" });
      return;
    }

    const gig = await getGigById(id);
    if (!gig) {
      res.status(404).json({ success: false, error: "Gig not found" });
      return;
    }

    const { applicationId, address, signature, issuedAt } = req.body || {};
    const appId = parseInt(String(applicationId), 10);
    if (isNaN(appId) || appId <= 0) {
      res.status(400).json({ success: false, error: "Invalid application ID" });
      return;
    }
    if (typeof address !== "string" || !isAddress(address)) {
      res.status(400).json({ success: false, error: "Valid wallet address required" });
      return;
    }

    const signer = await recoverGigSigner({
      action: "select-applicant",
      address,
      signature,
      issuedAt,
      gigId: id,
      targetId: appId,
    });
    if (!signer || signer.toLowerCase() !== gig.client.toLowerCase()) {
      res.status(401).json({ success: false, error: "Only the gig client can select an applicant" });
      return;
    }

    const updated = await selectGigApplicant(id, appId);
    if (!updated) {
      res.status(404).json({ success: false, error: "Proposal not found for this gig" });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("Error in POST /api/gigs/:id/select:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to select applicant",
    });
  }
});

/**
 * POST /api/gigs/:id/close
 * Client closes an open gig.
 */
router.post("/:id/close", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseGigId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, error: "Invalid gig ID" });
      return;
    }

    const gig = await getGigById(id);
    if (!gig) {
      res.status(404).json({ success: false, error: "Gig not found" });
      return;
    }

    const { address, signature, issuedAt } = req.body || {};
    if (typeof address !== "string" || !isAddress(address)) {
      res.status(400).json({ success: false, error: "Valid wallet address required" });
      return;
    }

    const signer = await recoverGigSigner({
      action: "close-gig",
      address,
      signature,
      issuedAt,
      gigId: id,
    });
    if (!signer || signer.toLowerCase() !== gig.client.toLowerCase()) {
      res.status(401).json({ success: false, error: "Only the gig client can close this gig" });
      return;
    }

    const updated = await closeGig(id);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("Error in POST /api/gigs/:id/close:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to close gig",
    });
  }
});

/**
 * POST /api/gigs/:id/link-milestone
 * Links an on-chain funded escrow milestone ID to an assigned gig.
 */
router.post("/:id/link-milestone", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseGigId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, error: "Invalid gig ID" });
      return;
    }

    const gig = await getGigById(id);
    if (!gig) {
      res.status(404).json({ success: false, error: "Gig not found" });
      return;
    }

    const { milestoneId, address, signature, issuedAt } = req.body || {};
    const mId = parseInt(String(milestoneId), 10);
    if (isNaN(mId) || mId <= 0) {
      res.status(400).json({ success: false, error: "Invalid milestone ID" });
      return;
    }
    if (typeof address !== "string" || !isAddress(address)) {
      res.status(400).json({ success: false, error: "Valid wallet address required" });
      return;
    }

    const signer = await recoverGigSigner({
      action: "link-milestone",
      address,
      signature,
      issuedAt,
      gigId: id,
      targetId: mId,
    });
    if (!signer || signer.toLowerCase() !== gig.client.toLowerCase()) {
      res.status(401).json({ success: false, error: "Only the gig client can link a milestone" });
      return;
    }

    const updated = await linkGigMilestone(id, mId);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("Error in POST /api/gigs/:id/link-milestone:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to link milestone",
    });
  }
});

export default router;
