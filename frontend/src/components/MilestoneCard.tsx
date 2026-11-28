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
  Swords,
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
import { dojoSfx } from "../lib/dojoSfx";

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

  const getStatusBadge = () => {
    switch (milestone.status) {
      case "Funded":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#18181D] text-[#C8925A] border border-[#C8925A]/40">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C8925A]" />
            Locked
          </span>
        );
      case "Submitted":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#C8925A]/15 text-[#C8925A] border border-[#C8925A]/50">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C8925A]" />
            Submitted
          </span>
        );
      case "Released":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#18181D] text-[#F4F1EA] border border-[#C8925A]/40">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#C8925A]" />
            Paid
          </span>
        );
      case "Refunded":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#18181D] text-[#8F8E94] border border-[#27272F]">
            <RotateCcw className="h-3 w-3" />
            Refunded
          </span>
        );
      case "Disputed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#18181D] text-red-400 border border-red-500/50">
            <AlertTriangle className="h-3 w-3" />
            Disputed
          </span>
        );
    }
  };

  const handleReleasePayment = async () => {
    try {
      setIsProcessing(true);
      setErrorMsg(null);
      dojoSfx.playSlash();

      const hash = await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ARC_MILESTONE_ESCROW_ABI,
        functionName: "releasePayment",
        args: [BigInt(milestone.id)],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      dojoSfx.playGong(true);
      try {
        confetti({
          particleCount: 75,
          spread: 55,
          origin: { y: 0.6 },
          colors: ["#C8925A", "#F4F1EA", "#8F8E94"],
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

  const handleRefund = async () => {
    try {
      setIsProcessing(true);
      setErrorMsg(null);
      dojoSfx.playSlash();

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

  const relevantTx =
    milestone.released_tx_hash ||
    milestone.refunded_tx_hash ||
    milestone.submitted_tx_hash ||
    milestone.created_tx_hash;

  return (
    <div className="dojo-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272F] pb-4">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-xs font-bold text-[#C8925A] bg-[#18181D] border border-[#27272F] px-2.5 py-1 rounded-full">
            #{milestone.id}
          </span>
          <h3 className="font-display text-base sm:text-lg font-bold text-[#F4F1EA] tracking-wide">
            {milestone.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {(milestone.status === "Submitted" || milestone.status === "Released") && (
            <AiVerificationBadge
              audit={milestone.ai_audit}
              onClick={() => onOpenDetailsModal(milestone.id)}
            />
          )}
          {getStatusBadge()}
          <div className="text-right pl-1">
            <span className="font-display text-xl font-extrabold text-[#C8925A] tabular-nums">
              {formatUSDC(milestone.amount)}
            </span>
            <span className="text-xs font-bold text-[#8F8E94] ml-1.5 uppercase">
              USDC
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-xs">
        <div>
          <span className="text-[#8F8E94] uppercase tracking-wider block mb-1 font-semibold">
            Patron (Client)
          </span>
          <div className="flex items-center gap-1.5">
            <a
              href={getExplorerAddressUrl(milestone.client)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-semibold text-[#F4F1EA] hover:text-[#C8925A] flex items-center gap-1 transition-colors"
            >
              {shortenAddress(milestone.client, 4)}
              {isClient && (
                <span className="rounded-full bg-[#C8925A]/15 border border-[#C8925A]/40 px-2 py-0.2 text-[10px] text-[#C8925A] font-sans font-bold uppercase">
                  You
                </span>
              )}
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
            <button
              type="button"
              onClick={() => handleCopyAddress("client", milestone.client)}
              aria-label="Copy client address"
              title="Copy client address"
              className="rounded p-1 text-[#8F8E94] hover:bg-[#1C1C22] hover:text-[#F4F1EA] transition-colors"
            >
              {copiedRole === "client" ? (
                <Check className="h-3 w-3 text-[#C8925A]" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        <div>
          <span className="text-[#8F8E94] uppercase tracking-wider block mb-1 font-semibold">
            Ronin (Freelancer)
          </span>
          <div className="flex items-center gap-1.5">
            <a
              href={getExplorerAddressUrl(milestone.freelancer)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-semibold text-[#F4F1EA] hover:text-[#C8925A] flex items-center gap-1 transition-colors"
            >
              {shortenAddress(milestone.freelancer, 4)}
              {isFreelancer && (
                <span className="rounded-full bg-[#C8925A]/15 border border-[#C8925A]/40 px-2 py-0.2 text-[10px] text-[#C8925A] font-sans font-bold uppercase">
                  You
                </span>
              )}
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
            <button
              type="button"
              onClick={() => handleCopyAddress("freelancer", milestone.freelancer)}
              aria-label="Copy freelancer address"
              title="Copy freelancer address"
              className="rounded p-1 text-[#8F8E94] hover:bg-[#1C1C22] hover:text-[#F4F1EA] transition-colors"
            >
              {copiedRole === "freelancer" ? (
                <Check className="h-3 w-3 text-[#C8925A]" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        <div>
          <span className="text-[#8F8E94] uppercase tracking-wider block mb-1 font-semibold">
            Deadline
          </span>
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-[#C8925A]" />
            <span
              className={`font-semibold ${
                isExpired && milestone.status === "Funded"
                  ? "text-red-400"
                  : "text-[#F4F1EA]"
              }`}
            >
              {deadlineText}
            </span>
          </div>
        </div>
      </div>

      {milestone.brief && (
        <p className="mb-3 rounded-xl bg-[#09090B] border border-[#27272F] px-3.5 py-2 text-xs text-[#8F8E94] line-clamp-2">
          <span className="font-bold text-[#C8925A] uppercase tracking-wider mr-1.5">
            Brief:
          </span>
          {milestone.brief}
        </p>
      )}

      {milestone.ai_audit?.status === "FAILED" && milestone.status === "Submitted" && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-500/45 bg-[#18181D] px-3.5 py-2.5 text-xs text-red-300">
          <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-bold text-red-400">
              AI Audit Flagged ({milestone.ai_audit.overallScore}/100):{" "}
            </span>
            <span>{milestone.ai_audit.summary}</span>
          </div>
        </div>
      )}

      {milestone.deliverable_url && (() => {
        const safeUrl = toSafeExternalUrl(milestone.deliverable_url);
        return (
          <div className="rounded-xl bg-[#09090B] border border-[#27272F] p-3 mb-4 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 truncate pr-2">
              <FileCheck className="h-4 w-4 text-[#C8925A] shrink-0" />
              <span className="text-[#8F8E94] shrink-0 font-semibold uppercase tracking-wider">
                Proof:
              </span>
              {safeUrl ? (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[#C8925A] hover:underline truncate font-medium"
                >
                  {milestone.deliverable_url}
                </a>
              ) : (
                <span className="font-mono text-red-400 truncate font-medium">
                  [Blocked unsafe URL]
                </span>
              )}
            </div>
            {safeUrl && (
              <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8F8E94] hover:text-[#C8925A] shrink-0 ml-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        );
      })()}

      {errorMsg && (
        <div className="rounded-xl bg-[#18181D] border border-red-500/45 p-2.5 text-xs text-red-300 mb-4">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#27272F]">
        <div className="flex items-center space-x-4 text-xs text-[#8F8E94]">
          <button
            onClick={() => {
              dojoSfx.playSlash();
              onOpenDetailsModal(milestone.id);
            }}
            className="hover:text-[#C8925A] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            <span>Timeline &amp; Audit</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {relevantTx && (
            <a
              href={getExplorerTxUrl(relevantTx)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#C8925A] font-mono text-[11px] flex items-center gap-1 transition-colors"
            >
              <span>Receipt</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isFreelancer && milestone.status === "Funded" && (
            <button
              onClick={() => {
                dojoSfx.playSlash();
                onOpenSubmitModal(milestone);
              }}
              className="katana-btn inline-flex items-center space-x-1.5 rounded-full bg-[#C8925A] hover:bg-[#D9A46D] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#09090B] transition-colors active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Work</span>
            </button>
          )}

          {isFreelancer &&
            (milestone.status === "Funded" || milestone.status === "Submitted") && (
              <button
                onClick={handleRefund}
                disabled={isProcessing}
                className="inline-flex items-center space-x-1 rounded-full border border-[#27272F] bg-[#18181D] px-4 py-2 text-xs font-semibold text-[#F4F1EA] hover:border-[#C8925A]/50 transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin text-[#C8925A]" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
                <span>Cancel &amp; Refund</span>
              </button>
            )}

          {isClient &&
            (milestone.status === "Submitted" || milestone.status === "Funded") &&
            (confirmRelease ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setConfirmRelease(false);
                    void handleReleasePayment();
                  }}
                  disabled={isProcessing}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#C8925A] hover:bg-[#D9A46D] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#09090B] disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Swords className="h-3.5 w-3.5" />
                  )}
                  <span>Confirm Pay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRelease(false)}
                  disabled={isProcessing}
                  className="rounded-full border border-[#27272F] bg-[#18181D] px-3 py-2 text-xs font-semibold text-[#8F8E94] hover:text-[#F4F1EA]"
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
                    dojoSfx.playSlash();
                    setConfirmRelease(true);
                  } else {
                    void handleReleasePayment();
                  }
                }}
                disabled={isProcessing}
                className={`katana-btn inline-flex min-h-9 items-center gap-1.5 rounded-full px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors active:scale-[0.98] disabled:opacity-50 ${
                  milestone.ai_audit?.status === "FAILED"
                    ? "bg-[#18181D] border border-red-500/50 text-red-400 hover:bg-red-950/30"
                    : "bg-[#C8925A] hover:bg-[#D9A46D] text-[#09090B]"
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
                        : "Approve & Pay"}
                    </span>
                  </>
                )}
              </button>
            ))}

          {isClient && milestone.status === "Funded" && isExpired && (
            <button
              onClick={handleRefund}
              disabled={isProcessing}
              className="inline-flex items-center space-x-1 rounded-full bg-[#18181D] border border-[#C8925A]/50 px-4 py-2 text-xs font-semibold text-[#C8925A] hover:bg-[#C8925A]/15 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              <span>Reclaim Funds</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
