"use client";

import React from "react";
import { Droplets, ExternalLink } from "lucide-react";

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
    <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/50 px-5 py-8 text-center sm:px-8">
      <h3 className="text-base font-semibold text-white">No milestones found</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-300">
        {roleFilter !== "all" || statusFilter !== "all"
          ? `No milestones match your current filters (${roleFilter} • ${statusFilter}). Try clearing filters.`
          : "Get started by creating your first milestone escrow on Circle Arc Layer-1 Testnet."}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onOpenCreateModal}
          className="min-h-10 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          Create milestone
        </button>

        <a
          href="https://faucet.circle.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-10 items-center gap-1.5 rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <Droplets aria-hidden="true" className="h-3.5 w-3.5 text-blue-400" />
          <span>Get Arc Testnet USDC</span>
          <ExternalLink aria-hidden="true" className="h-3 w-3 opacity-60" />
        </a>
      </div>
    </div>
  );
}
