import { formatUnits } from "viem";
import { MilestoneRecord, MilestoneStats } from "../types.js";

export function calculateMilestoneStats(
  milestones: MilestoneRecord[],
  address?: string
): MilestoneStats {
  let totalLockedWei = 0n;
  let totalPaidOutWei = 0n;
  let totalEarnedWei = 0n;
  let totalRefundedWei = 0n;

  let activeCount = 0;
  let completedCount = 0;
  let refundedCount = 0;

  const targetAddr = address ? address.toLowerCase() : null;

  for (const m of milestones) {
    const amt = BigInt(m.amount);

    if (m.status === "Funded" || m.status === "Submitted") {
      totalLockedWei += amt;
      activeCount++;
    } else if (m.status === "Released") {
      completedCount++;
      if (!targetAddr || m.client === targetAddr) {
        totalPaidOutWei += amt;
      }
      if (!targetAddr || m.freelancer === targetAddr) {
        totalEarnedWei += amt;
      }
    } else if (m.status === "Refunded") {
      refundedCount++;
      totalRefundedWei += amt;
    }
  }

  return {
    totalLockedUSDC: formatUnits(totalLockedWei, 18),
    totalPaidOutUSDC: formatUnits(totalPaidOutWei, 18),
    totalEarnedUSDC: formatUnits(totalEarnedWei, 18),
    totalRefundedUSDC: formatUnits(totalRefundedWei, 18),
    totalMilestones: milestones.length,
    activeMilestones: activeCount,
    completedMilestones: completedCount,
    refundedMilestones: refundedCount,
  };
}
