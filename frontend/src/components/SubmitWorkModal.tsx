"use client";

import React, { useState } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { X, Send, Link as LinkIcon, AlertCircle, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { ESCROW_CONTRACT_ADDRESS, ARC_MILESTONE_ESCROW_ABI } from "../config/contracts";
import { Milestone } from "../types";
import { getExplorerTxUrl } from "../lib/utils";
import { AiVerificationReport } from "./AiVerificationReport";
import { dojoSfx } from "../lib/dojoSfx";

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
      dojoSfx.playSlash();

      const hash = await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ARC_MILESTONE_ESCROW_ABI,
        functionName: "submitWork",
        args: [BigInt(milestone.id), deliverableUrl.trim()],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      dojoSfx.playGong(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl my-6 max-h-[90vh] overflow-y-auto dojo-card p-6 sm:p-8 text-[#F4F1EA]">
        <div className="flex items-center justify-between border-b border-[#27272F] pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C8925A]/15 border border-[#C8925A]/35 text-[#C8925A]">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold tracking-wide text-[#F4F1EA]">
                Submit Proof Scroll
              </h2>
              <p className="text-xs text-[#8F8E94]">
                Milestone #{milestone.id}: {milestone.title}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="rounded-full p-2 text-[#8F8E94] hover:bg-[#1C1C22] hover:text-[#F4F1EA] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {successTx ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#C8925A]/15 text-[#C8925A] border border-[#C8925A]/40">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[#F4F1EA]">
                Proof Scroll Delivered!
              </h3>
              <p className="text-xs text-[#8F8E94] mt-1">
                The Patron has been notified to inspect the AI audit and release your USDC payout.
              </p>
            </div>

            <div className="rounded-xl bg-[#09090B] border border-[#27272F] p-3 text-xs font-mono text-[#F4F1EA] flex items-center justify-between">
              <span className="truncate max-w-[260px]">Tx: {successTx}</span>
              <a
                href={getExplorerTxUrl(successTx)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C8925A] hover:underline flex items-center gap-1 font-sans font-semibold"
              >
                Arc Explorer <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <button
              onClick={handleResetAndClose}
              className="katana-btn w-full rounded-full bg-[#C8925A] hover:bg-[#D9A46D] py-3 text-sm font-bold uppercase tracking-wider text-[#09090B] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMsg && (
              <div className="rounded-xl bg-[#18181D] border border-red-500/45 p-3 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#8F8E94] uppercase tracking-wider">
                <LinkIcon className="h-3.5 w-3.5 text-[#C8925A]" />
                Deliverable URL or IPFS Hash
              </label>
              <input
                type="text"
                placeholder="https://github.com/my-org/pull/42 or ipfs://Qm..."
                value={deliverableUrl}
                onChange={(e) => setDeliverableUrl(e.target.value)}
                required
                className="w-full rounded-xl border border-[#27272F] bg-[#09090B] px-4 py-2.5 text-sm font-mono text-[#F4F1EA] placeholder:text-[#68676E] focus:border-[#C8925A] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-[#8F8E94] mt-1.5">
                Paste a public GitHub repo/PR, Figma canvas, live deployment, or IPFS CID for instant AI pre-audit.
              </p>
            </div>

            {deliverableUrl.trim().length >= 8 && (
              <div className="pt-1">
                <AiVerificationReport
                  deliverableUrl={deliverableUrl.trim()}
                  milestoneTitle={milestone.title}
                  milestoneBrief={milestone.brief || undefined}
                  milestoneId={milestone.id}
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
                className="rounded-full border border-[#27272F] bg-[#18181D] px-5 py-2.5 text-sm font-semibold text-[#8F8E94] hover:text-[#F4F1EA] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="katana-btn flex min-h-10 items-center gap-2 rounded-full bg-[#C8925A] hover:bg-[#D9A46D] px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-[#09090B] transition-colors active:scale-[0.98] disabled:opacity-50"
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
