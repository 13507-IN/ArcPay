"use client";

import React, { useState } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { X, Send, Link as LinkIcon, AlertCircle, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { ESCROW_CONTRACT_ADDRESS, ARC_MILESTONE_ESCROW_ABI } from "../config/contracts";
import { Milestone } from "../types";
import { getExplorerTxUrl } from "../lib/utils";
import { AiVerificationReport } from "./AiVerificationReport";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-[28px] border border-lav-200 bg-white p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-lav-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lav-100 text-lav-600">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Submit Proof of Work</h2>
              <p className="text-xs text-ink-soft">
                Milestone #{milestone.id}: {milestone.title}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="rounded-full p-2 text-ink-soft hover:bg-lav-50 hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success */}
        {successTx ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">Deliverable Submitted!</h3>
              <p className="text-xs text-ink-soft mt-1">
                The client has been notified to review and approve payment release.
              </p>
            </div>

            <div className="rounded-2xl bg-lav-50 border border-lav-200 p-3 text-xs font-mono text-ink flex items-center justify-between">
              <span className="truncate max-w-[240px]">Tx: {successTx}</span>
              <a
                href={getExplorerTxUrl(successTx)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lav-700 hover:underline flex items-center gap-1 font-sans font-medium"
              >
                Explorer <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full rounded-full bg-lav-600 hover:bg-lav-700 py-3 text-sm font-semibold text-white shadow-sm transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMsg && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
                <LinkIcon className="h-3.5 w-3.5 text-lav-600" />
                Deliverable URL or IPFS Hash
              </label>
              <input
                type="text"
                placeholder="https://github.com/my-org/pull/42 or ipfs://Qm..."
                value={deliverableUrl}
                onChange={(e) => setDeliverableUrl(e.target.value)}
                required
                className="w-full rounded-2xl border border-lav-200 bg-lav-50/50 px-4 py-2.5 text-sm font-mono text-ink placeholder:text-ink-soft/60 focus:bg-white focus:border-lav-500 focus:outline-none focus:ring-2 focus:ring-lav-200 transition-all"
              />
              <p className="text-[11px] text-ink-soft mt-1.5">
                Provide a verifiable link to code, Figma design, staging deployment, or IPFS CID.
              </p>
            </div>

            {/* Live AI Deliverable Pre-Audit Preview */}
            {deliverableUrl.trim().length >= 8 && (
              <div className="pt-1">
                <AiVerificationReport
                  deliverableUrl={deliverableUrl.trim()}
                  milestoneTitle={milestone.title}
                  milestoneId={milestone.id}
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
                className="rounded-full border border-lav-200 bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-lav-50 hover:border-lav-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-10 items-center gap-2 rounded-full bg-lav-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-lav-700 active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting on Arc...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
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
