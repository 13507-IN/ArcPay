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
      <article className="dojo-card p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8F8E94]">
            Vault Escrow Locked
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C8925A]/15 border border-[#C8925A]/30 text-[#C8925A]">
            <Lock className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-4 flex items-baseline gap-2 font-display text-3xl font-bold tracking-tight text-[#C8925A] tabular-nums">
          {isLoading ? "…" : formatUSDC(lockedUSDC)}
          <span className="text-sm font-semibold text-[#8F8E94]">USDC</span>
        </p>
        <div className="mt-2.5 flex items-center gap-2 text-xs text-[#8F8E94]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C8925A]" />
          <span>
            {activeCount} active scroll{activeCount === 1 ? "" : "s"} sealed on-chain
          </span>
        </div>
      </article>

      <article className="dojo-card p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8F8E94]">
            Total Paid Out
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#18181D] border border-[#27272F] text-[#C8925A]">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-4 flex items-baseline gap-2 font-display text-3xl font-bold tracking-tight text-[#F4F1EA] tabular-nums">
          {isLoading ? "…" : formatUSDC(paidUSDC)}
          <span className="text-sm font-semibold text-[#8F8E94]">USDC</span>
        </p>
        <div className="mt-2.5 flex items-center gap-2 text-xs text-[#8F8E94]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#F4F1EA]" />
          <span>Settled directly to Ronin wallets</span>
        </div>
      </article>

      <article className="dojo-card p-6 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8F8E94]">
            Settlement Finality
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#18181D] border border-[#27272F] text-[#C8925A]">
            <Zap className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-4 font-display text-3xl font-bold tracking-tight text-[#F4F1EA] tabular-nums">
          &lt;1s
        </p>
        <div className="mt-2.5 flex items-center gap-2 text-xs text-[#8F8E94]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C8925A]" />
          <span>Arc Malachite BFT deterministic strike</span>
        </div>
      </article>
    </div>
  );
}
