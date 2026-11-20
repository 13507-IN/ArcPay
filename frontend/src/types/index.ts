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
