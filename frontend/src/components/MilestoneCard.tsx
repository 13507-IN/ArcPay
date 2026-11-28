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
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/40">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
            Vault Locked
          </span>
        );
      case "Submitted":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Scroll Submitted
          </span>
        );
      case "Released":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/45">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Victory · Paid
          </span>
        );
      case "Refunded":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-slate-800/80 text-slate-300 border border-slate-600/50">
            <RotateCcw className="h-3 w-3 text-slate-400" />
            Refunded
          </span>
        );
      case "Disputed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-500/50">
            <AlertTriangle className="h-3 w-3 text-rose-400" />
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
          particleCount: 90,
          spread: 65,
          origin: { y: 0.6 },
          colors: ["#E11D48", "#F59E0B", "#10B981"],
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
      {/* Top Header: ID, Title, AI Seal, Status, Bounty */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/15 pb-4">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/35 px-2.5 py-1 rounded-full">
            Scroll #{milestone.id}
          </span>
          <h3 className="font-display text-base sm:text-lg font-bold text-[#F6EFE0] tracking-wide">
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
            <span className="font-display text-xl font-extrabold text-amber-300 tabular-nums">
              {formatUSDC(milestone.amount)}
            </span>
            <span className="text-xs font-bold text-amber-500/80 ml-1.5 uppercase">
              USDC
            </span>
          </div>
        </div>
      </div>

      {/* Middle Body: Duelists (Patron vs Ronin) & Deadline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-xs">
        <div>
          <span className="text-[#A99BB8] uppercase tracking-wider block mb-1 font-semibold">
            Patron (Client)
          </span>
          <div className="flex items-center gap-1.5">
            <a
              href={getExplorerAddressUrl(milestone.client)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-semibold text-[#F6EFE0] hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              {shortenAddress(milestone.client, 4)}
              {isClient && (
                <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.2 text-[10px] text-rose-300 font-sans font-bold uppercase">
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
              className="rounded p-1 text-[#A99BB8] hover:bg-amber-500/15 hover:text-amber-200 transition-colors"
            >
              {copiedRole === "client" ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        <div>
          <span className="text-[#A99BB8] uppercase tracking-wider block mb-1 font-semibold">
            Ronin (Freelancer)
          </span>
          <div className="flex items-center gap-1.5">
            <a
              href={getExplorerAddressUrl(milestone.freelancer)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-semibold text-[#F6EFE0] hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              {shortenAddress(milestone.freelancer, 4)}
              {isFreelancer && (
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.2 text-[10px] text-amber-300 font-sans font-bold uppercase">
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
              className="rounded p-1 text-[#A99BB8] hover:bg-amber-500/15 hover:text-amber-200 transition-colors"
            >
              {copiedRole === "freelancer" ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        <div>
          <span className="text-[#A99BB8] uppercase tracking-wider block mb-1 font-semibold">
            Duel Deadline
          </span>
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span
              className={`font-semibold ${
                isExpired && milestone.status === "Funded"
                  ? "text-rose-400"
                  : "text-[#F6EFE0]"
              }`}
            >
              {deadlineText}
            </span>
          </div>
        </div>
      </div>

      {/* Off-chain Scope Preview */}
      {milestone.brief && (
        <p className="mb-3 rounded-xl bg-[#0D0914]/90 border border-amber-500/15 px-3.5 py-2 text-xs text-[#C7BBD4] line-clamp-2">
          <span className="font-bold text-amber-300 uppercase tracking-wider mr-1.5">
            Brief:
          </span>
          {milestone.brief}
        </p>
      )}

      {/* AI Mismatch Guardrail Warning */}
      {milestone.ai_audit?.status === "FAILED" && milestone.status === "Submitted" && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-500/50 bg-rose-950/60 px-3.5 py-2.5 text-xs text-rose-200">
          <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-bold text-rose-300">
              AI Audit Flagged ({milestone.ai_audit.overallScore}/100):{" "}
            </span>
            <span>{milestone.ai_audit.summary}</span>
          </div>
        </div>
      )}

      {/* Deliverable Link if submitted */}
      {milestone.deliverable_url && (() => {
        const safeUrl = toSafeExternalUrl(milestone.deliverable_url);
        return (
          <div className="rounded-xl bg-[#0D0914]/90 border border-amber-500/20 p-3 mb-4 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 truncate pr-2">
              <FileCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-[#A99BB8] shrink-0 font-semibold uppercase tracking-wider">
                Proof Scroll:
              </span>
              {safeUrl ? (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-amber-300 hover:underline truncate font-medium"
                >
                  {milestone.deliverable_url}
                </a>
              ) : (
                <span className="font-mono text-rose-400 truncate font-medium">
                  [Blocked unsafe URL]
                </span>
              )}
            </div>
            {safeUrl && (
              <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A99BB8] hover:text-amber-300 shrink-0 ml-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        );
      })()}

      {errorMsg && (
        <div className="rounded-xl bg-rose-950/70 border border-rose-500/40 p-2.5 text-xs text-rose-200 mb-4">
          {errorMsg}
        </div>
      )}

      {/* Bottom Footer: Action Buttons & Receipts */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-500/15">
        <div className="flex items-center space-x-4 text-xs text-[#A99BB8]">
          <button
            onClick={() => {
              dojoSfx.playSlash();
              onOpenDetailsModal(milestone.id);
            }}
            className="hover:text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            <span>Timeline &amp; AI Audit</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {relevantTx && (
            <a
              href={getExplorerTxUrl(relevantTx)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 font-mono text-[11px] flex items-center gap-1 transition-colors"
            >
              <span>Arc Receipt</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {isFreelancer && milestone.status === "Funded" && (
            <button
              onClick={() => {
                dojoSfx.playSlash();
                onOpenSubmitModal(milestone);
              }}
              className="katana-btn inline-flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Proof Scroll</span>
            </button>
          )}

          {isFreelancer &&
            (milestone.status === "Funded" || milestone.status === "Submitted") && (
              <button
                onClick={handleRefund}
                disabled={isProcessing}
                className="inline-flex items-center space-x-1 rounded-full border border-amber-500/25 bg-[#161022] px-4 py-2 text-xs font-semibold text-[#C7BBD4] hover:bg-amber-500/15 hover:text-amber-200 transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
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
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-glow hover:bg-rose-500 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Swords className="h-3.5 w-3.5" />
                  )}
                  <span>Confirm Strike</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRelease(false)}
                  disabled={isProcessing}
                  className="rounded-full border border-white/15 bg-[#161022] px-3 py-2 text-xs font-semibold text-[#A99BB8] hover:text-white"
                >
                  Abort
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
                className={`katana-btn inline-flex min-h-9 items-center gap-1.5 rounded-full px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 ${
                  milestone.ai_audit?.status === "FAILED"
                    ? "bg-gradient-to-r from-amber-600 to-rose-600 hover:brightness-110"
                    : "bg-gradient-to-r from-emerald-600 to-teal-500 shadow-glow-emerald hover:brightness-110"
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
            ))}

          {isClient && milestone.status === "Funded" && isExpired && (
            <button
              onClick={handleRefund}
              disabled={isProcessing}
              className="inline-flex items-center space-x-1 rounded-full bg-rose-950/70 border border-rose-500/40 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/70 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              <span>Reclaim Expired Stake</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
