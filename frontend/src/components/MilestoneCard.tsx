"use client";

import React, { useState } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import confetti from "canvas-confetti";
import {
  Clock,
  CheckCircle2,
  ExternalLink,
  Send,
  RotateCcw,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  Loader2,
  Copy,
  Check,
  ShieldAlert,
} from "lucide-react";
import { Milestone } from "../types";
import {
  ESCROW_CONTRACT_ADDRESS,
  ARC_MILESTONE_ESCROW_ABI,
} from "../config/contracts";
import {
  formatUSDC,
  shortenAddress,
  getRemainingTime,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  toSafeExternalUrl,
} from "../lib/utils";
import { AiVerificationBadge } from "./AiVerificationBadge";

interface MilestoneCardProps {
  milestone: Milestone;
  onOpenSubmitModal: (milestone: Milestone) => void;
  onOpenDetailsModal: (id: number) => void;
  onRefresh: () => void;
}

export function MilestoneCard({
  milestone,
  onOpenSubmitModal,
  onOpenDetailsModal,
  onRefresh,
}: MilestoneCardProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [copiedRole, setCopiedRole] = useState<"client" | "freelancer" | null>(null);

  const handleCopyAddress = (role: "client" | "freelancer", value: string) => {
    try {
      navigator.clipboard?.writeText(value);
      setCopiedRole(role);
      setTimeout(() => setCopiedRole(null), 1500);
    } catch {}
  };

  const userAddr = address?.toLowerCase();
  const isClient = userAddr === milestone.client.toLowerCase();
  const isFreelancer = userAddr === milestone.freelancer.toLowerCase();

  const { isExpired, text: deadlineText } = getRemainingTime(milestone.deadline);

  // Status Chip Colors
  const getStatusBadge = () => {
    switch (milestone.status) {
      case "Funded":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-lav-100 text-lav-700 border border-lav-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-lav-500"></span>
            Funded
          </span>
        );
      case "Submitted":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Work Submitted
          </span>
        );
      case "Released":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Paid & Settled
          </span>
        );
      case "Refunded":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <RotateCcw className="h-3 w-3 text-slate-500" />
            Refunded
          </span>
        );
      case "Disputed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="h-3 w-3 text-rose-500" />
            Disputed
          </span>
        );
    }
  };

  // Client approves work and triggers instant native USDC payment release
  const handleReleasePayment = async () => {
    try {
      setIsProcessing(true);
      setErrorMsg(null);

      const hash = await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ARC_MILESTONE_ESCROW_ABI,
        functionName: "releasePayment",
        args: [BigInt(milestone.id)],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Celebrate sub-second Malachite BFT instant finality payout!
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#7C57C9", "#10B981", "#B9A0E8"],
        });
      } catch {}

      onRefresh();
    } catch (err: any) {
      console.error("Release payment error:", err);
      setErrorMsg(
        err?.shortMessage || err?.message || "Failed to release payment."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Refund client (either freelancer voluntary cancellation, or client if expired)
  const handleRefund = async () => {
    try {
      setIsProcessing(true);
      setErrorMsg(null);

      const hash = await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ARC_MILESTONE_ESCROW_ABI,
        functionName: "refundClient",
        args: [BigInt(milestone.id)],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      onRefresh();
    } catch (err: any) {
      console.error("Refund error:", err);
      setErrorMsg(
        err?.shortMessage || err?.message || "Failed to process refund."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Get relevant tx hash for receipt link
  const relevantTx =
    milestone.released_tx_hash ||
    milestone.refunded_tx_hash ||
    milestone.submitted_tx_hash ||
    milestone.created_tx_hash;

  return (
    <div className="relative rounded-[24px] border border-lav-200/80 bg-white p-6 shadow-sm transition-all hover:border-lav-300 hover:shadow-md">
      {/* Top Header: ID, Status, Amount */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lav-100 pb-4">
        <div className="flex items-center space-x-2.5">
          <span className="font-mono text-xs font-bold text-lav-700 bg-lav-100 px-2.5 py-0.5 rounded-full">
            #{milestone.id}
          </span>
          <h3 className="font-display text-base sm:text-lg font-semibold text-ink tracking-tight">
            {milestone.title}
          </h3>
        </div>

        <div className="flex items-center space-x-2.5">
          {(milestone.status === "Submitted" || milestone.status === "Released") && (
            <div className="hidden sm:inline-block">
              <AiVerificationBadge
                audit={milestone.ai_audit}
                onClick={() => onOpenDetailsModal(milestone.id)}
              />
            </div>
          )}
          {getStatusBadge()}
          <div className="text-right">
            <span className="font-display text-xl font-semibold text-ink tabular-nums">
              {formatUSDC(milestone.amount)}
            </span>
            <span className="text-xs font-semibold text-lav-600 ml-1.5">
              USDC
            </span>
          </div>
        </div>
      </div>

      {/* Middle Body: Counterparties & Timeline Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-xs">
        <div>
          <span className="text-ink-soft block mb-1 font-medium">Client</span>
          <div className="flex items-center gap-1.5">
            <a
              href={getExplorerAddressUrl(milestone.client)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-medium text-ink hover:text-lav-700 flex items-center gap-1 transition-colors"
            >
              {shortenAddress(milestone.client, 4)}
              {isClient && (
                <span className="rounded-full bg-lav-100 px-2 py-0.2 text-[10px] text-lav-700 font-sans font-semibold">
                  You
                </span>
              )}
              <ExternalLink className="h-3 w-3 opacity-40" />
            </a>
            <button
              type="button"
              onClick={() => handleCopyAddress("client", milestone.client)}
              aria-label="Copy client address"
              title="Copy client address"
              className="rounded p-1 text-ink-soft hover:bg-lav-100 hover:text-ink transition-colors"
            >
              {copiedRole === "client" ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        <div>
          <span className="text-ink-soft block mb-1 font-medium">Freelancer</span>
          <div className="flex items-center gap-1.5">
            <a
              href={getExplorerAddressUrl(milestone.freelancer)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-medium text-ink hover:text-lav-700 flex items-center gap-1 transition-colors"
            >
              {shortenAddress(milestone.freelancer, 4)}
              {isFreelancer && (
                <span className="rounded-full bg-lav-100 px-2 py-0.5 text-xs text-lav-700 font-sans font-semibold">
                  You
                </span>
              )}
              <ExternalLink className="h-3 w-3 opacity-40" />
            </a>
            <button
              type="button"
              onClick={() => handleCopyAddress("freelancer", milestone.freelancer)}
              aria-label="Copy freelancer address"
              title="Copy freelancer address"
              className="rounded p-1 text-ink-soft hover:bg-lav-100 hover:text-ink transition-colors"
            >
              {copiedRole === "freelancer" ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        <div>
          <span className="text-ink-soft block mb-1 font-medium">Deadline</span>
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-ink-soft" />
            <span
              className={`font-medium ${
                isExpired && milestone.status === "Funded"
                  ? "text-rose-600 font-semibold"
                  : "text-ink"
              }`}
            >
              {deadlineText}
            </span>
          </div>
        </div>
      </div>

      {/* Off-chain Scope Preview */}
      {milestone.brief && (
        <p className="mb-3 rounded-xl bg-lav-50/40 border border-lav-100 px-3 py-2 text-xs text-ink-soft line-clamp-2">
          <span className="font-semibold text-ink">Scope:</span> {milestone.brief}
        </p>
      )}

      {/* AI Mismatch Guardrail Warning */}
      {milestone.ai_audit?.status === "FAILED" && milestone.status === "Submitted" && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
          <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-bold">AI Audit Flagged ({milestone.ai_audit.overallScore}/100): </span>
            <span>{milestone.ai_audit.summary}</span>
          </div>
        </div>
      )}

      {/* Deliverable Link if submitted */}
      {milestone.deliverable_url && (() => {
        const safeUrl = toSafeExternalUrl(milestone.deliverable_url);
        return (
          <div className="rounded-2xl bg-lav-50/70 border border-lav-200/80 p-3 mb-4 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 truncate pr-2">
              <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-ink-soft shrink-0 font-medium">Deliverable:</span>
              {safeUrl ? (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-lav-700 hover:underline truncate font-medium"
                >
                  {milestone.deliverable_url}
                </a>
              ) : (
                <span className="font-mono text-rose-700 truncate font-medium">
                  [Blocked unsafe URL]
                </span>
              )}
            </div>
            {safeUrl && (
              <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-soft hover:text-ink shrink-0 ml-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        );
      })()}

      {/* Error alert if any */}
      {errorMsg && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 mb-4">
          {errorMsg}
        </div>
      )}

      {/* Bottom Footer: Action Buttons & Receipts */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-lav-100">
        <div className="flex items-center space-x-3 text-xs text-ink-soft">
          <button
            onClick={() => onOpenDetailsModal(milestone.id)}
            className="hover:text-lav-700 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Timeline & Audit</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {relevantTx && (
            <a
              href={getExplorerTxUrl(relevantTx)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-lav-700 font-mono text-[11px] flex items-center gap-1 transition-colors"
            >
              <span>Receipt</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Freelancer Action: Submit Deliverable */}
          {isFreelancer && milestone.status === "Funded" && (
            <button
              onClick={() => onOpenSubmitModal(milestone)}
              className="inline-flex items-center space-x-1.5 rounded-full bg-lav-600 hover:bg-lav-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Work</span>
            </button>
          )}

          {/* Freelancer Action: Voluntary Refund */}
          {isFreelancer &&
            (milestone.status === "Funded" || milestone.status === "Submitted") && (
              <button
                onClick={handleRefund}
                disabled={isProcessing}
                className="inline-flex items-center space-x-1 rounded-full border border-lav-200 bg-white px-4 py-2 text-xs font-medium text-ink hover:bg-lav-50 hover:border-lav-300 transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin text-lav-600" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
                <span>Cancel & Refund</span>
              </button>
            )}

          {/* Client Action: Approve & Instant Pay */}
          {isClient &&
            (milestone.status === "Submitted" || milestone.status === "Funded") && (
              confirmRelease ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setConfirmRelease(false);
                      void handleReleasePayment();
                    }}
                    disabled={isProcessing}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>Confirm Release</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRelease(false)}
                    disabled={isProcessing}
                    className="rounded-full border border-lav-200 bg-white px-3 py-2 text-xs font-medium text-ink-soft hover:bg-lav-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (
                      milestone.ai_audit?.status === "FAILED" ||
                      milestone.status === "Funded"
                    ) {
                      setConfirmRelease(true);
                    } else {
                      void handleReleasePayment();
                    }
                  }}
                  disabled={isProcessing}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 ${
                    milestone.ai_audit?.status === "FAILED"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Settling on Arc...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>
                        {milestone.ai_audit?.status === "FAILED"
                          ? "Release Anyway"
                          : "Approve & Instant Pay"}
                      </span>
                    </>
                  )}
                </button>
              )
            )}

          {/* Client Action: Refund if deadline expired and still Funded */}
          {isClient &&
            milestone.status === "Funded" &&
            isExpired && (
              <button
                onClick={handleRefund}
                disabled={isProcessing}
                className="inline-flex items-center space-x-1 rounded-full bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
                <span>Reclaim Expired Funds</span>
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
