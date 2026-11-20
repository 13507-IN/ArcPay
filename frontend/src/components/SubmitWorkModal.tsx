"use client";

import React, { useState } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { X, Send, Link as LinkIcon, AlertCircle, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { ESCROW_CONTRACT_ADDRESS, ARC_MILESTONE_ESCROW_ABI } from "../config/contracts";
import { Milestone } from "../types";
import { getExplorerTxUrl } from "../lib/utils";

interface SubmitWorkModalProps {
  milestone: Milestone | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubmitWorkModal({
  milestone,
  isOpen,
  onClose,
  onSuccess,
}: SubmitWorkModalProps) {
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<string | null>(null);

  if (!isOpen || !milestone) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessTx(null);

    if (!deliverableUrl.trim()) {
      setErrorMsg("Please enter a deliverable link or IPFS CID.");
      return;
    }

    try {
      setIsSubmitting(true);

      const hash = await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ARC_MILESTONE_ESCROW_ABI,
        functionName: "submitWork",
        args: [BigInt(milestone.id), deliverableUrl.trim()],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setSuccessTx(hash);
      onSuccess();
    } catch (err: any) {
      console.error("Submit work error:", err);
      setErrorMsg(
        err?.shortMessage || err?.message || "Failed to submit deliverable."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setDeliverableUrl("");
    setErrorMsg(null);
    setSuccessTx(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Submit Proof of Work</h2>
              <p className="text-xs text-slate-400">
                Milestone #{milestone.id}: {milestone.title}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success */}
        {successTx ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Deliverable Submitted!</h3>
              <p className="text-xs text-slate-400 mt-1">
                The client has been notified to review and approve payment release.
              </p>
            </div>

            <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs font-mono text-slate-300 flex items-center justify-between">
              <span className="truncate max-w-[240px]">Tx: {successTx}</span>
              <a
                href={getExplorerTxUrl(successTx)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 font-sans"
              >
                Explorer <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-semibold text-white transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMsg && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-200">
                <LinkIcon className="h-3.5 w-3.5 text-blue-400" />
                Deliverable URL or IPFS Hash
              </label>
              <input
                type="text"
                placeholder="https://github.com/my-org/pull/42 or ipfs://Qm..."
                value={deliverableUrl}
                onChange={(e) => setDeliverableUrl(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Provide a verifiable link to code, Figma design, staging deployment, or IPFS CID.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-10 items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting on Arc...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit Work</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
