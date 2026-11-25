import { VerificationAuditReport } from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Calls the backend Autonomous AI Deliverable Verification Oracle.
 * Never returns fake passing scores if the backend is unreachable.
 */
export async function verifyDeliverable(params: {
  deliverableUrl: string;
  title?: string;
  brief?: string;
  milestoneId?: number;
}): Promise<VerificationAuditReport> {
  const { deliverableUrl, title = "", brief = "", milestoneId } = params;

  try {
    const endpoint = milestoneId
      ? `${API_BASE}/api/milestones/${milestoneId}/verify`
      : `${API_BASE}/api/milestones/verify`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliverableUrl, title, brief }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }

    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.error || `Backend returned HTTP ${res.status}`);
  } catch (err: any) {
    return {
      milestoneId,
      deliverableUrl: deliverableUrl.trim(),
      deliverableType: "generic_url",
      overallScore: 0,
      grade: "F",
      status: "FAILED",
      recommendation: "MANUAL_REVIEW_REQUIRED",
      summary: `Verification Oracle unreachable (${err?.message || "network error"}). Cannot verify deliverable automatically — manual review required.`,
      checks: [
        {
          id: "oracle_connection",
          name: "AI Verification Oracle Connection",
          status: "failed",
          score: 0,
          detail: `Could not reach backend verifier at ${API_BASE}. Make sure the backend server is running.`,
        },
      ],
      metadata: {
        targetMilestone: title,
        filesInspected: 0,
        testsDetected: false,
        securityFlags: 1,
        inspectedAt: new Date().toISOString(),
        aiEngine: "offline",
        llmConfigured: false,
      },
    };
  }
}
