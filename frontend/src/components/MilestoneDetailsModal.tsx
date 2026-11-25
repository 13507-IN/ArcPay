"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { Milestone, MilestoneEvent } from "../types";
import { fetchMilestoneDetails } from "../lib/api";
import { AiVerificationReport } from "./AiVerificationReport";
import {
  formatUSDC,
  formatDate,
  shortenAddress,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from "../lib/utils";

interface MilestoneDetailsModalProps {
  milestoneId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MilestoneDetailsModal({
  milestoneId,
  isOpen,
  onClose,
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
    if (isOpen && milestoneId) {
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
    } catch (err: any) {
      setErrorMsg("Failed to load milestone timeline from backend.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl my-6 max-h-[90vh] overflow-y-auto rounded-[28px] border border-lav-200 bg-white p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-lav-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lav-100 text-lav-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-lav-700 bg-lav-100 px-2 py-0.5 rounded-full">
                  #{milestoneId}
                </span>
                <h2 className="font-display text-lg font-semibold text-ink">
                  {details?.title || "Milestone Escrow Details"}
                </h2>
              </div>
              <p className="text-xs text-ink-soft">
                Circle Arc Layer-1 Escrow Timeline & On-Chain Audit Log
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-soft hover:bg-lav-50 hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-soft space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-lav-600" />
            <span className="text-xs">Fetching timeline from Arc Testnet...</span>
          </div>
        ) : errorMsg ? (
          <div className="py-12 text-center text-sm text-rose-700">{errorMsg}</div>
        ) : details ? (
          <div className="mt-6 space-y-6">
            {/* Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-lav-50/70 border border-lav-200/80 p-3.5">
                <span className="text-xs text-ink-soft block font-medium">Amount</span>
                <span className="font-display text-lg font-semibold text-ink tabular-nums">
                  {formatUSDC(details.amount)}
                </span>
                <span className="text-[11px] text-lav-700 font-bold block">USDC (Native)</span>
              </div>

              <div className="rounded-2xl bg-lav-50/70 border border-lav-200/80 p-3.5">
                <span className="text-xs text-ink-soft block font-medium">Status</span>
                <span className="inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-lav-100 text-lav-700 border border-lav-200">
                  {details.status}
                </span>
              </div>

              <div className="rounded-2xl bg-lav-50/70 border border-lav-200/80 p-3.5">
                <span className="text-xs text-ink-soft block font-medium">Created</span>
                <span className="text-xs font-semibold text-ink block mt-1">
                  {formatDate(details.created_at)}
                </span>
              </div>

              <div className="rounded-2xl bg-lav-50/70 border border-lav-200/80 p-3.5">
                <span className="text-xs text-ink-soft block font-medium">Deadline</span>
                <span className="text-xs font-semibold text-ink block mt-1">
                  {formatDate(details.deadline)}
                </span>
              </div>
            </div>

            {/* Participants */}
            <div className="rounded-2xl bg-lav-50/70 border border-lav-200/80 p-4 space-y-2.5">
              <span className="block text-xs font-semibold text-ink uppercase tracking-wider">
                Counterparties
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-white border border-lav-200/70 p-3 shadow-sm">
                  <span className="text-ink-soft font-medium">Client:</span>
                  <a
                    href={getExplorerAddressUrl(details.client)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-lav-700 hover:underline flex items-center gap-1"
                  >
                    {shortenAddress(details.client, 6)}
                    <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                  </a>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white border border-lav-200/70 p-3 shadow-sm">
                  <span className="text-ink-soft font-medium">Freelancer:</span>
                  <a
                    href={getExplorerAddressUrl(details.freelancer)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-lav-700 hover:underline flex items-center gap-1"
                  >
                    {shortenAddress(details.freelancer, 6)}
                    <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                  </a>
                </div>
              </div>
            </div>

            {/* Off-Chain Scope / Brief */}
            {details.brief && (
              <div className="rounded-2xl bg-lav-50/70 border border-lav-200/80 p-4 space-y-1.5">
                <span className="block text-xs font-semibold text-ink uppercase tracking-wider">
                  Project Scope & Deliverable Brief
                </span>
                <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">
                  {details.brief}
                </p>
              </div>
            )}

            {/* Deliverable Link & AI Verification Audit */}
            {details.deliverable_url && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                      Submitted Deliverable / Proof of Work
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      On-Chain Linked
                    </span>
                  </div>
                  <a
                    href={details.deliverable_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-mono text-emerald-700 hover:underline break-all font-medium"
                  >
                    <span>{details.deliverable_url}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </div>

                {/* Autonomous AI Verification Report */}
                <AiVerificationReport
                  deliverableUrl={details.deliverable_url}
                  milestoneTitle={details.title}
                  milestoneBrief={details.brief || undefined}
                  milestoneId={details.id}
                />
              </div>
            )}

            {/* On-Chain Event Timeline */}
            <div>
              <span className="mb-3 block text-xs font-semibold text-ink uppercase tracking-wider">
                Malachite BFT On-Chain Audit Timeline
              </span>

              {details.events && details.events.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-lav-200">
                  {details.events.map((evt, idx) => (
                    <div key={evt.id || idx} className="relative">
                      <div className="absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full bg-lav-600 ring-4 ring-white" />
                      <div className="rounded-2xl bg-white border border-lav-200 p-3.5 space-y-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ink">
                            {evt.event_name}
                          </span>
                          <span className="text-[11px] text-ink-soft font-mono">
                            Block #{evt.block_number}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-ink-soft">
                          <span>{formatDate(evt.timestamp)}</span>
                          <a
                            href={getExplorerTxUrl(evt.tx_hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-lav-700 hover:underline flex items-center gap-1 font-medium"
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
                <div className="rounded-2xl bg-lav-50 border border-lav-200 p-4 text-center text-xs text-ink-soft">
                  No indexed events found yet. The indexer updates in real-time.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
