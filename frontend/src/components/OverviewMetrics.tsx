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
      {/* Metric 1: Locked Vault */}
      <article className="dojo-card p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A99BB8]">
            Vault Escrow Locked
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <Lock className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-4 flex items-baseline gap-2 font-display text-3xl font-bold tracking-tight text-amber-300 tabular-nums">
          {isLoading ? "…" : formatUSDC(lockedUSDC)}
          <span className="text-sm font-semibold text-amber-500/80">USDC</span>
        </p>
        <div className="mt-2.5 flex items-center gap-2 text-xs text-[#A99BB8]">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span>
            {activeCount} active duel{activeCount === 1 ? "" : "s"} sealed on-chain
          </span>
        </div>
      </article>

      {/* Metric 2: Settled Bounties */}
      <article className="dojo-card p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A99BB8]">
            Bounties Paid Out
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-4 flex items-baseline gap-2 font-display text-3xl font-bold tracking-tight text-emerald-300 tabular-nums">
          {isLoading ? "…" : formatUSDC(paidUSDC)}
          <span className="text-sm font-semibold text-emerald-500/80">USDC</span>
        </p>
        <div className="mt-2.5 flex items-center gap-2 text-xs text-[#A99BB8]">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          <span>Settled directly to Ronin wallets</span>
        </div>
      </article>

      {/* Metric 3: Finality Speed */}
      <article className="dojo-card p-6 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A99BB8]">
            Strike Finality Speed
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Zap className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-4 font-display text-3xl font-bold tracking-tight text-[#F6EFE0] tabular-nums">
          &lt;1s
        </p>
        <div className="mt-2.5 flex items-center gap-2 text-xs text-[#A99BB8]">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          <span>Arc Malachite BFT deterministic strike</span>
        </div>
      </article>
    </div>
  );
}
