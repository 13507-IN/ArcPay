export type MilestoneStatus =
  | "Funded"
  | "Submitted"
  | "Released"
  | "Disputed"
  | "Refunded";

export interface MilestoneRecord {
  id: number;
  client: string;
  freelancer: string;
  amount: string; // Stored as wei / 18 decimals string
  title: string;
  deliverable_url: string;
  deadline: number;
  status: MilestoneStatus;
  created_at: number;
  created_tx_hash: string | null;
  submitted_tx_hash: string | null;
  released_tx_hash: string | null;
  refunded_tx_hash: string | null;
  brief: string | null;
  invoice_notes: string | null;
  freelancer_email: string | null;
  freelancer_webhook: string | null;
  updated_at: number;
}

export interface MilestoneEventRecord {
  id: number;
  milestone_id: number;
  event_name: string;
  tx_hash: string;
  block_number: number;
  timestamp: number;
  payload: string;
}

export interface MilestoneMetadataInput {
  brief?: string;
  invoiceNotes?: string;
  freelancerEmail?: string;
  freelancerWebhook?: string;
}

export interface MilestoneStats {
  totalLockedUSDC: string; // 18-decimal sum formatted
  totalPaidOutUSDC: string; // 18-decimal sum formatted
  totalEarnedUSDC: string; // 18-decimal sum formatted
  totalRefundedUSDC: string; // 18-decimal sum formatted
  totalMilestones: number;
  activeMilestones: number;
  completedMilestones: number;
  refundedMilestones: number;
}
