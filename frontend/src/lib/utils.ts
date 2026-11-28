import { formatUnits } from "viem";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Milestone, MilestoneStats } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(
    address.length - chars
  )}`;
}

/**
 * On Arc, native USDC uses 18 decimals when read from getBalance or msg.value.
 */
export function formatUSDC(amountWei: string | bigint | number): string {
  try {
    const raw = typeof amountWei === "bigint" ? amountWei : BigInt(amountWei || 0);
    const formatted = formatUnits(raw, 18);
    const num = parseFloat(formatted);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(num);
  } catch {
    return "0.00";
  }
}

export function formatDate(timestampSec: number): string {
  if (!timestampSec) return "N/A";
  const date = new Date(timestampSec * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRemainingTime(deadlineSec: number): {
  isExpired: boolean;
  text: string;
} {
  const now = Math.floor(Date.now() / 1000);
  const diff = deadlineSec - now;

  if (diff <= 0) {
    const passed = Math.abs(diff);
    const days = Math.floor(passed / 86400);
    const hours = Math.floor((passed % 86400) / 3600);
    if (days > 0) return { isExpired: true, text: `Expired ${days}d ago` };
    if (hours > 0) return { isExpired: true, text: `Expired ${hours}h ago` };
    return { isExpired: true, text: "Expired recently" };
  }

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return { isExpired: false, text: `${days}d ${hours}h left` };
  if (hours > 0) return { isExpired: false, text: `${hours}h ${minutes}m left` };
  return { isExpired: false, text: `${minutes}m left` };
}

export function getExplorerTxUrl(txHash: string): string {
  const base =
    process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://explorer.testnet.arc.io";
  return `${base}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  const base =
    process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://explorer.testnet.arc.io";
  return `${base}/address/${address}`;
}

/**
 * Prevents javascript:/data: XSS href injection and safely translates ipfs:// URLs.
 */
export function toSafeExternalUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("ipfs://")) {
    const cidPath = trimmed.slice("ipfs://".length).replace(/^\/+/, "");
    if (!/^[a-zA-Z0-9._\-/]+$/.test(cidPath)) return null;
    return `https://ipfs.io/ipfs/${cidPath}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Computes OverviewMetrics client-side when falling back directly to on-chain RPC reads.
 */
export function computeStatsFromMilestones(
  milestones: Milestone[],
  address?: string
): MilestoneStats {
  const userAddr = address?.toLowerCase();
  let lockedWei = 0n;
  let paidOutWei = 0n;
  let earnedWei = 0n;
  let refundedWei = 0n;
  let activeMilestones = 0;
  let completedMilestones = 0;
  let refundedMilestones = 0;

  for (const m of milestones) {
    let amt = 0n;
    try {
      amt = BigInt(m.amount || "0");
    } catch {
      amt = 0n;
    }

    const isClient = userAddr ? m.client.toLowerCase() === userAddr : true;
    const isFreelancer = userAddr ? m.freelancer.toLowerCase() === userAddr : true;
    const isParty = isClient || isFreelancer;

    if (m.status === "Funded" || m.status === "Submitted" || m.status === "Disputed") {
      if (isParty) {
        lockedWei += amt;
        activeMilestones += 1;
      }
    } else if (m.status === "Released") {
      if (isClient || !userAddr) paidOutWei += amt;
      if (isFreelancer) earnedWei += amt;
      if (isParty) completedMilestones += 1;
    } else if (m.status === "Refunded") {
      if (isParty) {
        refundedWei += amt;
        refundedMilestones += 1;
      }
    }
  }

  return {
    totalLockedUSDC: formatUnits(lockedWei, 18),
    totalPaidOutUSDC: formatUnits(paidOutWei, 18),
    totalEarnedUSDC: formatUnits(earnedWei, 18),
    totalRefundedUSDC: formatUnits(refundedWei, 18),
    totalMilestones: userAddr
      ? milestones.filter(
          (m) =>
            m.client.toLowerCase() === userAddr ||
            m.freelancer.toLowerCase() === userAddr
        ).length
      : milestones.length,
    activeMilestones,
    completedMilestones,
    refundedMilestones,
  };
}
