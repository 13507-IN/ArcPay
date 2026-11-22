"use client";

import React from "react";
import { Lock, CheckCircle2, Zap } from "lucide-react";
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Metric 1 */}
      <article className="relative overflow-hidden rounded-[24px] border border-lav-200/70 bg-white p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-soft">Active escrow locked</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lav-100 text-lav-600">
            <Lock className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-4 flex items-baseline gap-2 font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
          {isLoading ? "…" : formatUSDC(lockedUSDC)}
          <span className="text-base font-medium text-ink-soft">USDC</span>
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-lav-500" />
          <span>{activeCount} active milestone{activeCount === 1 ? "" : "s"} on-chain</span>
        </div>
      </article>

      {/* Metric 2 */}
      <article className="relative overflow-hidden rounded-[24px] border border-lav-200/70 bg-white p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-soft">Total paid out</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-4 flex items-baseline gap-2 font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
          {isLoading ? "…" : formatUSDC(paidUSDC)}
          <span className="text-base font-medium text-ink-soft">USDC</span>
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Settled directly to freelancer wallets</span>
        </div>
      </article>

      {/* Metric 3 */}
      <article className="relative overflow-hidden rounded-[24px] border border-lav-200/70 bg-white p-6 shadow-sm transition-all hover:shadow-md sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-soft">Average settlement time</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lav-100 text-lav-600">
            <Zap className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
          &lt;1s
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-lav-500" />
          <span>Arc Malachite BFT deterministic finality</span>
        </div>
      </article>
    </div>
  );
}
