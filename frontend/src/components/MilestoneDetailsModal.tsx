"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FileText,
  User,
  DollarSign,
  ArrowRight,
  Loader2,
  Calendar,
} from "lucide-react";
import { Milestone, MilestoneEvent } from "../types";
import { fetchMilestoneDetails } from "../lib/api";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-400">
                  #{milestoneId}
                </span>
                <h2 className="text-base font-bold text-white">
                  {details?.title || "Milestone Escrow Details"}
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Circle Arc Layer-1 Escrow Timeline & On-Chain Audit Log
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-xs">Fetching timeline from Arc Testnet...</span>
          </div>
        ) : errorMsg ? (
          <div className="py-12 text-center text-sm text-rose-400">{errorMsg}</div>
        ) : details ? (
          <div className="mt-5 space-y-6">
            {/* Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                <span className="text-[11px] text-slate-400 block">Amount</span>
                <span className="font-mono text-base font-bold text-white">
                  {formatUSDC(details.amount)}
                </span>
                <span className="text-[10px] text-blue-400 font-bold block">USDC (Native)</span>
              </div>

              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                <span className="text-[11px] text-slate-400 block">Status</span>
                <span className="inline-block mt-0.5 rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {details.status}
                </span>
              </div>

              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                <span className="text-[11px] text-slate-400 block">Created</span>
                <span className="text-xs font-medium text-slate-300 block mt-1">
                  {formatDate(details.created_at)}
                </span>
              </div>

              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                <span className="text-[11px] text-slate-400 block">Deadline</span>
                <span className="text-xs font-medium text-slate-300 block mt-1">
                  {formatDate(details.deadline)}
                </span>
              </div>
            </div>

            {/* Participants */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-2.5">
              <span className="block text-sm font-medium text-slate-300">
                Counterparties
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-slate-800/60 p-2.5">
                  <span className="text-slate-400">Client:</span>
                  <a
                    href={getExplorerAddressUrl(details.client)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {shortenAddress(details.client, 6)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-800/60 p-2.5">
                  <span className="text-slate-400">Freelancer:</span>
                  <a
                    href={getExplorerAddressUrl(details.freelancer)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {shortenAddress(details.freelancer, 6)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Off-Chain Scope / Brief */}
            {details.brief && (
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-1.5">
                <span className="block text-sm font-medium text-slate-300">
                  Project Scope & Deliverable Brief
                </span>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {details.brief}
                </p>
              </div>
            )}

            {/* Deliverable Link if available */}
            {details.deliverable_url && (
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-1.5">
                <span className="block text-sm font-medium text-emerald-300">
                  Submitted Deliverable / Proof of Work
                </span>
                <a
                  href={details.deliverable_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-mono text-emerald-300 hover:underline break-all"
                >
                  <span>{details.deliverable_url}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>
            )}

            {/* On-Chain Event Timeline */}
            <div>
              <span className="mb-3 block text-sm font-medium text-slate-300">
                Malachite BFT On-Chain Audit Timeline
              </span>

              {details.events && details.events.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {details.events.map((evt, idx) => (
                    <div key={evt.id || idx} className="relative">
                      <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-slate-900" />
                      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            {evt.event_name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Block #{evt.block_number}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{formatDate(evt.timestamp)}</span>
                          <a
                            href={getExplorerTxUrl(evt.tx_hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-blue-400 hover:underline flex items-center gap-1"
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
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-center text-xs text-slate-400">
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
