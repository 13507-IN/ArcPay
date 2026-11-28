"use client";

import React from "react";
import { Droplets, ExternalLink, Swords } from "lucide-react";
import { DuelArenaSvg } from "./DojoGraphics";
import { dojoSfx } from "../lib/dojoSfx";

interface EmptyStateProps {
  roleFilter: string;
  statusFilter: string;
  onOpenCreateModal: () => void;
}

export function EmptyState({
  roleFilter,
  statusFilter,
  onOpenCreateModal,
}: EmptyStateProps) {
  return (
    <div className="dojo-card px-6 py-10 text-center sm:px-12">
      <div className="mx-auto max-w-md mb-4 opacity-90">
        <DuelArenaSvg className="w-full h-24" />
      </div>
      <h3 className="font-display text-xl font-bold tracking-wide text-[#F6EFE0]">
        No Active Scrolls Found
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#A99BB8]">
        {roleFilter !== "all" || statusFilter !== "all"
          ? `No escrow scrolls match your filter (${roleFilter} • ${statusFilter}). Clear filters to view all contracts.`
          : "Summon your first milestone escrow contract on Circle Arc Layer-1 Testnet or claim free Testnet USDC first."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => {
            dojoSfx.playSlash();
            onOpenCreateModal();
          }}
          className="katana-btn inline-flex min-h-10 items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <Swords className="h-4 w-4" />
          <span>Forge Milestone</span>
        </button>

        <a
          href="https://faucet.circle.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-10 items-center gap-1.5 rounded-full border border-amber-500/30 bg-[#161022] px-5 py-2.5 text-sm font-semibold text-amber-200 shadow-sm transition-all hover:bg-amber-500/15 hover:border-amber-400"
        >
          <Droplets aria-hidden="true" className="h-4 w-4 text-amber-400" />
          <span>Claim Testnet USDC</span>
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 opacity-60" />
        </a>
      </div>
    </div>
  );
}
