"use client";

import React from "react";
import { MilestoneStats } from "../types";

interface OverviewMetricsProps {
  stats: MilestoneStats | null;
  isLoading: boolean;
}

export function OverviewMetrics({ stats, isLoading }: OverviewMetricsProps) {
  const lockedUSDC = stats ? parseFloat(stats.totalLockedUSDC || "0") : 0;
  const paidUSDC = stats ? parseFloat(stats.totalPaidOutUSDC || "0") : 0;
  const activeCount = stats?.activeMilestones || 0;
  const formatUSDC = (amount: number) =>
    amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 md:grid-cols-3">
      <article className="bg-slate-900 px-5 py-4">
        <h2 className="text-sm font-medium text-slate-300">
          Active escrow locked
        </h2>
        <p className="mt-3 flex items-baseline gap-2 text-2xl font-semibold tabular-nums text-white">
          {isLoading ? "…" : formatUSDC(lockedUSDC)}
          <span className="text-sm font-medium text-slate-300">USDC</span>
        </p>
        <p className="mt-1 text-sm text-slate-300">
          {activeCount} active milestone{activeCount === 1 ? "" : "s"}
        </p>
      </article>

      <article className="bg-slate-900 px-5 py-4">
        <h2 className="text-sm font-medium text-slate-300">Total paid out</h2>
        <p className="mt-3 flex items-baseline gap-2 text-2xl font-semibold tabular-nums text-white">
          {isLoading ? "…" : formatUSDC(paidUSDC)}
          <span className="text-sm font-medium text-slate-300">USDC</span>
        </p>
        <p className="mt-1 text-sm text-slate-300">Released to freelancers</p>
      </article>

      <article className="bg-slate-900 px-5 py-4">
        <h2 className="text-sm font-medium text-slate-300">
          Average settlement time
        </h2>
        <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
          &lt;1s
        </p>
        <p className="mt-1 text-sm text-slate-300">
          Arc deterministic finality
        </p>
      </article>
    </div>
  );
}
