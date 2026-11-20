"use client";

import React, { useState } from "react";
import {
  useAccount,
  useWriteContract,
  usePublicClient,
  useSignMessage,
} from "wagmi";
import { parseUnits, isAddress, decodeEventLog } from "viem";
import {
  X,
  PlusCircle,
  Calendar,
  DollarSign,
  User,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import {
  ESCROW_CONTRACT_ADDRESS,
  ARC_MILESTONE_ESCROW_ABI,
} from "../config/contracts";
import {
  buildMetadataAuthorizationMessage,
  saveMilestoneMetadata,
} from "../lib/api";
import { getExplorerTxUrl } from "../lib/utils";

interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function toLocalDateTimeInput(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function CreateMilestoneModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateMilestoneModalProps) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { signMessageAsync } = useSignMessage();

  const [freelancer, setFreelancer] = useState("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [deadlineDate, setDeadlineDate] = useState(() =>
    toLocalDateTimeInput(new Date(Date.now() + 7 * 86_400_000))
  );
  const [amountUSDC, setAmountUSDC] = useState("100");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [metadataSaveError, setMetadataSaveError] = useState<string | null>(null);
  const [metadataSaved, setMetadataSaved] = useState(false);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    id: number;
    txHash: string;
  } | null>(null);

  if (!isOpen) return null;

  const saveOffchainMetadata = async (milestoneId: number) => {
    const metadata = {
      brief: brief.trim() || undefined,
      invoiceNotes: invoiceNotes.trim() || undefined,
    };
    if (!metadata.brief && !metadata.invoiceNotes) return;
    if (!address) {
      setMetadataSaveError("Reconnect the milestone wallet to sign and save these notes.");
      return;
    }

    setIsSavingMetadata(true);
    setMetadataSaveError(null);
    try {
      const issuedAt = Date.now();
      const message = buildMetadataAuthorizationMessage(
        address,
        milestoneId,
        issuedAt,
        metadata,
      );
      const signature = await signMessageAsync({ message });
      await saveMilestoneMetadata(milestoneId, metadata, {
        address,
        issuedAt,
        signature,
      });
      setMetadataSaved(true);
    } catch (metaErr) {
      console.warn("Failed to attach signed off-chain metadata:", metaErr);
      setMetadataSaveError(
        "The escrow was created, but its notes were not saved. Sign again to retry.",
      );
    } finally {
      setIsSavingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setTxHash(null);
    setSuccessInfo(null);

    if (!isConnected || !address) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }

    if (!isAddress(freelancer)) {
      setErrorMsg("Invalid freelancer wallet address (must be 0x...).");
      return;
    }

    if (freelancer.toLowerCase() === address.toLowerCase()) {
      setErrorMsg("Client and Freelancer cannot be the same address.");
      return;
    }

    let amountInWei: bigint;
    try {
      amountInWei = parseUnits(amountUSDC.trim(), 18);
    } catch {
      setErrorMsg("Enter a valid USDC amount with no more than 18 decimal places.");
      return;
    }

    if (amountInWei <= 0n) {
      setErrorMsg("Escrow amount must be greater than 0 USDC.");
      return;
    }

    const deadlineMilliseconds = new Date(deadlineDate).getTime();
    if (!Number.isFinite(deadlineMilliseconds) || deadlineMilliseconds <= Date.now()) {
      setErrorMsg("Choose a deadline in the future.");
      return;
    }

    if (!title.trim()) {
      setErrorMsg("Please enter a milestone title.");
      return;
    }

    try {
      setIsSubmitting(true);

      // On Arc, native USDC msg.value uses 18 decimals!
      const deadlineTimestamp = BigInt(Math.floor(deadlineMilliseconds / 1000));

      // Trigger on-chain contract call
      const hash = await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ARC_MILESTONE_ESCROW_ABI,
        functionName: "createMilestone",
        args: [freelancer as `0x${string}`, title.trim(), deadlineTimestamp],
        value: amountInWei,
      });

      setTxHash(hash);

      // Wait for sub-second Malachite BFT block receipt
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
        });

        // Find MilestoneCreated log to extract milestone ID
        let createdId: number = 1;
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: ARC_MILESTONE_ESCROW_ABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === "MilestoneCreated") {
              createdId = Number((decoded.args as any).id);
              break;
            }
          } catch {
            // non-matching log
          }
        }

        await saveOffchainMetadata(createdId);

        setSuccessInfo({ id: createdId, txHash: hash });
        onSuccess();
      }
    } catch (err: any) {
      console.error("Contract call error:", err);
      setErrorMsg(
        err?.shortMessage ||
          err?.message ||
          "Transaction was rejected or failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setFreelancer("");
    setTitle("");
    setBrief("");
    setInvoiceNotes("");
    setAmountUSDC("100");
    setDeadlineDate(
      toLocalDateTimeInput(new Date(Date.now() + 7 * 86_400_000))
    );
    setErrorMsg(null);
    setMetadataSaveError(null);
    setMetadataSaved(false);
    setTxHash(null);
    setSuccessInfo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Milestone Escrow</h2>
              <p className="text-xs text-slate-400">
                Lock native USDC on Arc Testnet • Instant payout upon approval
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

        {/* Success Screen */}
        {successInfo ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Milestone Escrow Created!</h3>
              <p className="text-sm text-slate-400 mt-1">
                Milestone #{successInfo.id} has been securely funded on Arc Testnet.
              </p>
            </div>

            {metadataSaved && (
              <p className="text-sm text-emerald-400" role="status">
                Project notes were signed and saved.
              </p>
            )}
            {metadataSaveError && (
              <div className="space-y-3" role="alert">
                <p className="text-sm text-amber-300">{metadataSaveError}</p>
                <button
                  type="button"
                  onClick={() => saveOffchainMetadata(successInfo.id)}
                  disabled={isSavingMetadata}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSavingMetadata ? "Waiting for wallet..." : "Sign and retry saving notes"}
                </button>
              </div>
            )}

            <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs font-mono text-slate-300 flex items-center justify-between">
              <span className="truncate max-w-[280px]">Tx: {successInfo.txHash}</span>
              <a
                href={getExplorerTxUrl(successInfo.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 font-sans"
              >
                Explorer <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMsg && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Freelancer Address */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-200">
                <User className="h-3.5 w-3.5 text-blue-400" />
                Freelancer Wallet Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={freelancer}
                onChange={(e) => setFreelancer(e.target.value.trim())}
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-200">
                <FileText className="h-3.5 w-3.5 text-blue-400" />
                Milestone Title
              </label>
              <input
                type="text"
                placeholder="e.g. Design Arc L1 Web3 Dashboard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Amount & Deadline row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-200">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                  Amount (Native USDC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.000000000000000001"
                    placeholder="100.00"
                    value={amountUSDC}
                    onChange={(e) => setAmountUSDC(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-3.5 pr-14 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                    USDC
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-200">
                  <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  min={toLocalDateTimeInput(new Date())}
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Project Brief / Deliverable Specs */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-200">
                Project Scope & Deliverable Notes (Off-Chain)
              </label>
              <textarea
                rows={2}
                placeholder="Include specifications, deliverables checklist, or GitHub issue link..."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Arc Native Gas Callout */}
            <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-3 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-blue-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Circle Arc Native USDC Protocol Note</span>
              </div>
              <p className="text-slate-400">
                Native USDC is sent as <code className="text-blue-300">msg.value</code> at 18 decimals;
                the separate ERC-20 USDC interface uses 6. Indicative gas estimate:{" "}
                <span className="text-emerald-400 font-mono">~$0.01 USDC</span>. Confirm the live fee in your wallet.
              </p>
            </div>

            {/* Actions */}
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
                    <span>Locking Escrow on Arc...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Fund & Lock {amountUSDC} USDC</span>
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
