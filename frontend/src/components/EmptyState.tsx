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
      <h3 className="font-display text-xl font-bold tracking-wide text-[#F4F1EA]">
        No Escrow Scrolls Found
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#8F8E94]">
        {roleFilter !== "all" || statusFilter !== "all"
          ? `No milestones match your filters (${roleFilter} • ${statusFilter}). Clear filters to view all scrolls.`
          : "Create your first milestone escrow on Circle Arc Layer-1 Testnet or claim free Testnet USDC first."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => {
            dojoSfx.playSlash();
            onOpenCreateModal();
          }}
          className="katana-btn inline-flex min-h-10 items-center gap-2 rounded-full bg-[#C8925A] hover:bg-[#D9A46D] px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-[#09090B] transition-colors active:scale-[0.98]"
        >
          <Swords className="h-4 w-4" />
          <span>Create Escrow</span>
        </button>

        <a
          href="https://faucet.circle.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-10 items-center gap-1.5 rounded-full border border-[#27272F] bg-[#111114] px-5 py-2.5 text-sm font-semibold text-[#F4F1EA] transition-colors hover:border-[#C8925A]/60"
        >
          <Droplets aria-hidden="true" className="h-4 w-4 text-[#C8925A]" />
          <span>Claim Testnet USDC</span>
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 opacity-60" />
        </a>
      </div>
    </div>
  );
}
