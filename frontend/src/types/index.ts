export type MilestoneStatus =
  | "Funded"
  | "Submitted"
  | "Released"
  | "Disputed"
  | "Refunded";

export interface Milestone {
  id: number;
  client: string;
  freelancer: string;
  amount: string; // 18-decimal string
  title: string;
  deliverable_url: string;
  deadline: number;
  status: MilestoneStatus;
  created_at: number;
  created_tx_hash: string | null;
  submitted_tx_hash: string | null;
  released_tx_hash: string | null;
  refunded_tx_hash: string | null;
  brief?: string | null;
  invoice_notes?: string | null;
  freelancer_email?: string | null;
  freelancer_webhook?: string | null;
  updated_at?: number;
}

export interface MilestoneEvent {
  id: number;
  milestone_id: number;
  event_name: string;
  tx_hash: string;
  block_number: number;
  timestamp: number;
  payload: any;
  explorerUrl?: string;
}

export interface MilestoneStats {
  totalLockedUSDC: string;
  totalPaidOutUSDC: string;
  totalEarnedUSDC: string;
  totalRefundedUSDC: string;
  totalMilestones: number;
  activeMilestones: number;
  completedMilestones: number;
  refundedMilestones: number;
}

export type RoleFilter = "all" | "client" | "freelancer";
export type StatusFilter = "all" | "Funded" | "Submitted" | "Released" | "Refunded";

export interface VerificationCheck {
  id: string;
  name: string;
  status: "passed" | "warning" | "failed";
  score: number;
  detail: string;
}

export interface VerificationAuditReport {
  milestoneId?: number;
  deliverableUrl: string;
  deliverableType: "github_pr" | "github_repo" | "figma" | "ipfs" | "deployment" | "generic_url";
  overallScore: number;
  grade: "A+" | "A" | "B" | "C" | "F";
  status: "PASSED" | "REVIEW_RECOMMENDED" | "FAILED";
  recommendation: "SAFE_TO_RELEASE" | "SATISFACTORY" | "MANUAL_REVIEW_REQUIRED";
  summary: string;
  checks: VerificationCheck[];
  metadata: {
    targetMilestone?: string;
    filesInspected?: number;
    testsDetected?: boolean;
    securityFlags?: number;
    inspectedAt: string;
    oracleSignature?: string;
    aiEngine?: string;
    llmConfigured?: boolean;
  };
}

export type GigStatus = "Open" | "Assigned" | "Closed";

export type GigCategory =
  | "Smart Contracts"
  | "Frontend & UI"
  | "Full-Stack"
  | "Security Audit"
  | "Design"
  | "Other";

export type GigApplicationStatus = "Pending" | "Accepted" | "Rejected";

export interface GigApplication {
  id: number;
  gig_id: number;
  freelancer: string;
  pitch: string;
  portfolio_url: string | null;
  proposed_usdc: string | null;
  status: GigApplicationStatus;
  created_at: number;
}

export interface Gig {
  id: number;
  client: string;
  title: string;
  description: string;
  category: GigCategory;
  budget_usdc: string;
  deadline_days: number;
  skills: string[];
  status: GigStatus;
  selected_freelancer: string | null;
  linked_milestone_id: number | null;
  created_at: number;
  updated_at: number;
  applications_count: number;
  applications: GigApplication[];
}

export interface EscrowPrefill {
  gigId?: number;
  freelancer?: string;
  title?: string;
  brief?: string;
  amountUSDC?: string;
  deadlineDays?: number;
}
