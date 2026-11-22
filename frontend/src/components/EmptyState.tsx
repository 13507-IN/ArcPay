"use client";

import React from "react";
import { Droplets, ExternalLink, ShieldCheck } from "lucide-react";

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
    <div className="rounded-[28px] border border-dashed border-lav-300 bg-white px-6 py-12 text-center sm:px-12 shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lav-100 text-lav-600">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">No milestones found</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
        {roleFilter !== "all" || statusFilter !== "all"
          ? `No milestones match your current filters (${roleFilter} • ${statusFilter}). Try clearing filters.`
          : "Get started by creating your first milestone escrow on Circle Arc Layer-1 Testnet."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onOpenCreateModal}
          className="min-h-10 rounded-full bg-lav-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-lav-700 active:scale-[0.98]"
        >
          Create milestone
        </button>

        <a
          href="https://faucet.circle.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-10 items-center gap-1.5 rounded-full border border-lav-200 bg-white px-5 py-2.5 text-sm font-medium text-ink shadow-sm transition-all hover:bg-lav-50 hover:border-lav-300"
        >
          <Droplets aria-hidden="true" className="h-4 w-4 text-lav-600" />
          <span>Get Arc Testnet USDC</span>
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 opacity-60" />
        </a>
      </div>
    </div>
  );
}
