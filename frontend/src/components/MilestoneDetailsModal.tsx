"use client";

import React, { useState, useEffect } from "react";
import { X, ExternalLink, FileText, Loader2 } from "lucide-react";
import { Milestone, MilestoneEvent } from "../types";
import { fetchMilestoneDetails } from "../lib/api";
import { AiVerificationReport } from "./AiVerificationReport";
import {
  formatUSDC,
  formatDate,
  shortenAddress,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  toSafeExternalUrl,
} from "../lib/utils";

interface MilestoneDetailsModalProps {
  milestoneId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onAuditUpdated?: () => void;
}

export function MilestoneDetailsModal({
  milestoneId,
  isOpen,
  onClose,
  onAuditUpdated,
}: MilestoneDetailsModalProps) {
  const [details, setDetails] = useState<
    | (Milestone & {
        events: MilestoneEvent[];
        explorerLinks: {
          createdTx: string | null;
          submittedTx: string | null;
          releasedTx: string | null;
          refundedTx: string | null;
        };
      })
    | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && milestoneId !== null) {
      loadDetails(milestoneId);
    } else {
      setDetails(null);
      setErrorMsg(null);
    }
  }, [isOpen, milestoneId]);

  const loadDetails = async (id: number) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await fetchMilestoneDetails(id);
      setDetails(data);
    } catch {
      setErrorMsg("Failed to load milestone timeline from backend.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl my-6 max-h-[90vh] overflow-y-auto dojo-card p-6 sm:p-8 text-[#F4F1EA]">
        <div className="flex items-center justify-between border-b border-[#27272F] pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C8925A]/15 border border-[#C8925A]/35 text-[#C8925A]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#C8925A] bg-[#18181D] border border-[#27272F] px-2 py-0.5 rounded-full">
                  #{milestoneId}
                </span>
                <h2 className="font-display text-lg font-bold tracking-wide text-[#F4F1EA]">
                  {details?.title || "Milestone Escrow Details"}
                </h2>
              </div>
              <p className="text-xs text-[#8F8E94]">
                Circle Arc Layer-1 Escrow Timeline &amp; AI Audit Log
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#8F8E94] hover:bg-[#1C1C22] hover:text-[#F4F1EA] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#8F8E94] space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#C8925A]" />
            <span className="text-xs">Fetching timeline from Arc Testnet...</span>
          </div>
        ) : errorMsg ? (
          <div className="py-12 text-center text-sm text-red-400">{errorMsg}</div>
        ) : details ? (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-[#09090B] border border-[#27272F] p-3.5">
                <span className="text-xs text-[#8F8E94] block font-semibold">Amount</span>
                <span className="font-display text-lg font-bold text-[#C8925A] tabular-nums">
                  {formatUSDC(details.amount)}
                </span>
                <span className="text-[11px] text-[#8F8E94] font-bold block">USDC (Native)</span>
              </div>

              <div className="rounded-xl bg-[#09090B] border border-[#27272F] p-3.5">
                <span className="text-xs text-[#8F8E94] block font-semibold">Status</span>
                <span className="inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-[#18181D] text-[#C8925A] border border-[#C8925A]/40">
                  {details.status}
                </span>
              </div>

              <div className="rounded-xl bg-[#09090B] border border-[#27272F] p-3.5">
                <span className="text-xs text-[#8F8E94] block font-semibold">Created</span>
                <span className="text-xs font-semibold text-[#F4F1EA] block mt-1">
                  {formatDate(details.created_at)}
                </span>
              </div>

              <div className="rounded-xl bg-[#09090B] border border-[#27272F] p-3.5">
                <span className="text-xs text-[#8F8E94] block font-semibold">Deadline</span>
                <span className="text-xs font-semibold text-[#F4F1EA] block mt-1">
                  {formatDate(details.deadline)}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-[#09090B] border border-[#27272F] p-4 space-y-2.5">
              <span className="block text-xs font-bold text-[#8F8E94] uppercase tracking-wider">
                Counterparties
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-[#141418] border border-[#27272F] p-3">
                  <span className="text-[#8F8E94] font-semibold">Patron (Client):</span>
                  <a
                    href={getExplorerAddressUrl(details.client)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-[#C8925A] hover:underline flex items-center gap-1"
                  >
                    {shortenAddress(details.client, 6)}
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#141418] border border-[#27272F] p-3">
                  <span className="text-[#8F8E94] font-semibold">Ronin (Freelancer):</span>
                  <a
                    href={getExplorerAddressUrl(details.freelancer)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-[#C8925A] hover:underline flex items-center gap-1"
                  >
                    {shortenAddress(details.freelancer, 6)}
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </div>
              </div>
            </div>

            {details.brief && (
              <div className="rounded-xl bg-[#09090B] border border-[#27272F] p-4 space-y-1.5">
                <span className="block text-xs font-bold text-[#C8925A] uppercase tracking-wider">
                  Project Scope &amp; Acceptance Criteria
                </span>
                <p className="text-xs text-[#F4F1EA] leading-relaxed whitespace-pre-wrap">
                  {details.brief}
                </p>
              </div>
            )}

            {details.deliverable_url && (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#09090B] border border-[#C8925A]/35 p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-bold text-[#C8925A] uppercase tracking-wider">
                      Submitted Proof of Work
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#18181D] border border-[#27272F] px-2 py-0.5 text-[10px] font-bold text-[#F4F1EA]">
                      On-Chain Linked
                    </span>
                  </div>
                  {(() => {
                    const safeDeliverable = toSafeExternalUrl(details.deliverable_url);
                    return safeDeliverable ? (
                      <a
                        href={safeDeliverable}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#C8925A] hover:underline break-all font-medium"
                      >
                        <span>{details.deliverable_url}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs font-mono text-red-400">
                        Blocked unsafe deliverable link
                      </span>
                    );
                  })()}
                </div>

                <AiVerificationReport
                  deliverableUrl={details.deliverable_url}
                  milestoneTitle={details.title}
                  milestoneBrief={details.brief || undefined}
                  milestoneId={details.id}
                  onRefresh={() => onAuditUpdated?.()}
                />
              </div>
            )}

            <div>
              <span className="mb-3 block text-xs font-bold text-[#8F8E94] uppercase tracking-wider">
                Malachite BFT On-Chain Timeline
              </span>

              {details.events && details.events.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#27272F]">
                  {details.events.map((evt, idx) => (
                    <div key={evt.id || idx} className="relative">
                      <div className="absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full bg-[#C8925A] ring-4 ring-[#111114]" />
                      <div className="rounded-xl bg-[#09090B] border border-[#27272F] p-3.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#F4F1EA]">
                            {evt.event_name}
                          </span>
                          <span className="text-[11px] text-[#C8925A] font-mono">
                            Block #{evt.block_number}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#8F8E94]">
                          <span>{formatDate(evt.timestamp)}</span>
                          <a
                            href={getExplorerTxUrl(evt.tx_hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[#C8925A] hover:underline flex items-center gap-1 font-medium"
                          >
                            <span>{shortenAddress(evt.tx_hash, 6)}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-[#09090B] border border-[#27272F] p-4 text-center text-xs text-[#8F8E94]">
                  No indexed events found yet. The Arc indexer updates continuously.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
