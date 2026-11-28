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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl my-6 max-h-[90vh] overflow-y-auto dojo-card p-6 sm:p-8 text-[#F6EFE0]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Scroll #{milestoneId}
                </span>
                <h2 className="font-display text-lg font-bold tracking-wide text-[#F6EFE0]">
                  {details?.title || "Milestone Escrow Scroll"}
                </h2>
              </div>
              <p className="text-xs text-[#A99BB8]">
                Circle Arc Layer-1 Escrow Timeline &amp; AI Oracle Audit Log
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#A99BB8] hover:bg-amber-500/15 hover:text-amber-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#A99BB8] space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            <span className="text-xs">Fetching scroll timeline from Arc Testnet...</span>
          </div>
        ) : errorMsg ? (
          <div className="py-12 text-center text-sm text-rose-400">{errorMsg}</div>
        ) : details ? (
          <div className="mt-6 space-y-6">
            {/* Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-[#0D0914] border border-amber-500/20 p-3.5">
                <span className="text-xs text-[#A99BB8] block font-semibold">Vault Stake</span>
                <span className="font-display text-lg font-bold text-amber-300 tabular-nums">
                  {formatUSDC(details.amount)}
                </span>
                <span className="text-[11px] text-amber-500/80 font-bold block">USDC (Native)</span>
              </div>

              <div className="rounded-2xl bg-[#0D0914] border border-amber-500/20 p-3.5">
                <span className="text-xs text-[#A99BB8] block font-semibold">Status</span>
                <span className="inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/40">
                  {details.status}
                </span>
              </div>

              <div className="rounded-2xl bg-[#0D0914] border border-amber-500/20 p-3.5">
                <span className="text-xs text-[#A99BB8] block font-semibold">Forged</span>
                <span className="text-xs font-semibold text-[#F6EFE0] block mt-1">
                  {formatDate(details.created_at)}
                </span>
              </div>

              <div className="rounded-2xl bg-[#0D0914] border border-amber-500/20 p-3.5">
                <span className="text-xs text-[#A99BB8] block font-semibold">Deadline</span>
                <span className="text-xs font-semibold text-[#F6EFE0] block mt-1">
                  {formatDate(details.deadline)}
                </span>
              </div>
            </div>

            {/* Participants */}
            <div className="rounded-2xl bg-[#0D0914]/90 border border-amber-500/20 p-4 space-y-2.5">
              <span className="block text-xs font-bold text-[#A99BB8] uppercase tracking-wider">
                Duelists
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-[#161022] border border-white/10 p-3">
                  <span className="text-[#A99BB8] font-semibold">Patron (Client):</span>
                  <a
                    href={getExplorerAddressUrl(details.client)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-amber-300 hover:underline flex items-center gap-1"
                  >
                    {shortenAddress(details.client, 6)}
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#161022] border border-white/10 p-3">
                  <span className="text-[#A99BB8] font-semibold">Ronin (Freelancer):</span>
                  <a
                    href={getExplorerAddressUrl(details.freelancer)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-amber-300 hover:underline flex items-center gap-1"
                  >
                    {shortenAddress(details.freelancer, 6)}
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </div>
              </div>
            </div>

            {/* Off-Chain Scope / Brief */}
            {details.brief && (
              <div className="rounded-2xl bg-[#0D0914]/90 border border-amber-500/20 p-4 space-y-1.5">
                <span className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Quest Scope &amp; Acceptance Criteria
                </span>
                <p className="text-xs text-[#E4DAF0] leading-relaxed whitespace-pre-wrap">
                  {details.brief}
                </p>
              </div>
            )}

            {/* Deliverable Link & AI Verification Audit */}
            {details.deliverable_url && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-emerald-950/35 border border-emerald-500/35 p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Submitted Proof Scroll
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
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
                        className="inline-flex items-center space-x-1.5 text-xs font-mono text-amber-300 hover:underline break-all font-medium"
                      >
                        <span>{details.deliverable_url}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs font-mono text-rose-400">
                        Blocked unsafe deliverable link
                      </span>
                    );
                  })()}
                </div>

                {/* Autonomous AI Verification Report */}
                <AiVerificationReport
                  deliverableUrl={details.deliverable_url}
                  milestoneTitle={details.title}
                  milestoneBrief={details.brief || undefined}
                  milestoneId={details.id}
                  onRefresh={() => onAuditUpdated?.()}
                />
              </div>
            )}

            {/* On-Chain Event Timeline */}
            <div>
              <span className="mb-3 block text-xs font-bold text-[#A99BB8] uppercase tracking-wider">
                Malachite BFT On-Chain Battle Log
              </span>

              {details.events && details.events.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-amber-500/30">
                  {details.events.map((evt, idx) => (
                    <div key={evt.id || idx} className="relative">
                      <div className="absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-[#120D1B]" />
                      <div className="rounded-2xl bg-[#0D0914] border border-amber-500/20 p-3.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#F6EFE0]">
                            {evt.event_name}
                          </span>
                          <span className="text-[11px] text-amber-300 font-mono">
                            Block #{evt.block_number}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#A99BB8]">
                          <span>{formatDate(evt.timestamp)}</span>
                          <a
                            href={getExplorerTxUrl(evt.tx_hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-amber-300 hover:underline flex items-center gap-1 font-medium"
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
                <div className="rounded-2xl bg-[#0D0914] border border-white/10 p-4 text-center text-xs text-[#A99BB8]">
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
