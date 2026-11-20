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
  Calendar,
  User,
  ShieldCheck,
} from "lucide-react";
import { Milestone } from "../types";
import {
  ESCROW_CONTRACT_ADDRESS,
  ARC_MILESTONE_ESCROW_ABI,
} from "../config/contracts";
import {
  formatUSDC,
  formatDate,
  shortenAddress,
  getRemainingTime,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from "../lib/utils";

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

  const userAddr = address?.toLowerCase();
  const isClient = userAddr === milestone.client.toLowerCase();
  const isFreelancer = userAddr === milestone.freelancer.toLowerCase();

  const { isExpired, text: deadlineText } = getRemainingTime(milestone.deadline);

  // Status Chip Colors
  const getStatusBadge = () => {
    switch (milestone.status) {
      case "Funded":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
            Funded
          </span>
        );
      case "Submitted":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            Work Submitted
          </span>
        );
      case "Released":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Paid & Settled
          </span>
        );
      case "Refunded":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-700/50 text-slate-400 border border-slate-700">
            <RotateCcw className="h-3 w-3" />
            Refunded
          </span>
        );
      case "Disputed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-3 w-3" />
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
          colors: ["#0066FF", "#43C59E", "#3385FF"],
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
    <div className="relative rounded-2xl border border-slate-800 bg-[#111827] p-5 transition-colors hover:border-slate-700">
      {/* Top Header: ID, Status, Amount */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-2.5">
          <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
            #{milestone.id}
          </span>
          <h3 className="text-base font-bold text-white tracking-tight">
            {milestone.title}
          </h3>
        </div>

        <div className="flex items-center space-x-3">
          {getStatusBadge()}
          <div className="text-right">
            <span className="font-mono text-lg font-bold text-white">
              {formatUSDC(milestone.amount)}
            </span>
            <span className="font-mono text-[11px] text-blue-400 font-bold ml-1">
              USDC
            </span>
          </div>
        </div>
      </div>

      {/* Middle Body: Counterparties & Timeline Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 text-xs">
        <div>
          <span className="text-slate-400 block mb-0.5">Client</span>
          <a
            href={getExplorerAddressUrl(milestone.client)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono font-medium text-slate-200 hover:text-blue-400 flex items-center gap-1 transition-colors"
          >
            {shortenAddress(milestone.client, 4)}
            {isClient && (
              <span className="rounded bg-blue-500/20 px-1 py-0.2 text-[10px] text-blue-300 font-sans">
                You
              </span>
            )}
            <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
        </div>

        <div>
          <span className="text-slate-400 block mb-0.5">Freelancer</span>
          <a
            href={getExplorerAddressUrl(milestone.freelancer)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono font-medium text-slate-200 hover:text-blue-400 flex items-center gap-1 transition-colors"
          >
            {shortenAddress(milestone.freelancer, 4)}
            {isFreelancer && (
              <span className="rounded bg-blue-500/20 px-1 py-0.5 text-xs text-blue-200 font-sans">
                You
              </span>
            )}
            <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
        </div>

        <div>
          <span className="text-slate-400 block mb-0.5">Deadline</span>
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span
              className={`font-medium ${
                isExpired && milestone.status === "Funded"
                  ? "text-rose-400"
                  : "text-slate-300"
              }`}
            >
              {deadlineText}
            </span>
          </div>
        </div>
      </div>

      {/* Deliverable Link if submitted */}
      {milestone.deliverable_url && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-2.5 mb-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 truncate pr-2">
            <FileCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-slate-400 shrink-0">Deliverable:</span>
            <a
              href={milestone.deliverable_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-emerald-400 hover:underline truncate"
            >
              {milestone.deliverable_url}
            </a>
          </div>
          <a
            href={milestone.deliverable_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white shrink-0 ml-2"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Error alert if any */}
      {errorMsg && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2 text-xs text-rose-400 mb-3">
          {errorMsg}
        </div>
      )}

      {/* Bottom Footer: Action Buttons & Receipts */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <button
            onClick={() => onOpenDetailsModal(milestone.id)}
            className="hover:text-blue-400 font-medium flex items-center gap-1 transition-colors"
          >
            <span>Timeline & Audit</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {relevantTx && (
            <a
              href={getExplorerTxUrl(relevantTx)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 font-mono text-[11px] flex items-center gap-1 transition-colors"
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
              className="inline-flex items-center space-x-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
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
                className="inline-flex items-center space-x-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
                <span>Cancel & Refund</span>
              </button>
            )}

          {/* Client Action: Approve & Instant Pay */}
          {isClient &&
            (milestone.status === "Submitted" || milestone.status === "Funded") && (
              <button
                onClick={handleReleasePayment}
                disabled={isProcessing}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-emerald-700 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Settling on Arc...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Approve & Instant Pay</span>
                  </>
                )}
              </button>
            )}

          {/* Client Action: Refund if deadline expired and still Funded */}
          {isClient &&
            milestone.status === "Funded" &&
            isExpired && (
              <button
                onClick={handleRefund}
                disabled={isProcessing}
                className="inline-flex items-center space-x-1 rounded-xl bg-rose-600/20 border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-600/30 transition-colors disabled:opacity-50"
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
