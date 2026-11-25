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
  Mic,
  MicOff,
  Sparkles,
} from "lucide-react";
import {
  ESCROW_CONTRACT_ADDRESS,
  ARC_MILESTONE_ESCROW_ABI,
} from "../config/contracts";
import {
  buildMetadataAuthorizationMessage,
  saveMilestoneMetadata,
  buildGigAuthorizationMessage,
  linkGigToMilestone,
} from "../lib/api";
import { EscrowPrefill } from "../types";
import { getExplorerTxUrl } from "../lib/utils";

interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefill?: EscrowPrefill | null;
}

function toLocalDateTimeInput(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function CreateMilestoneModal({
  isOpen,
  onClose,
  onSuccess,
  prefill,
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
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [metadataSaved, setMetadataSaved] = useState(false);
  const [metadataSaveError, setMetadataSaveError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    id: number;
    txHash: string;
  } | null>(null);

  // Voice Speech-to-Text Input State
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(
        "Voice input is not supported in this browser. Try Chrome, Edge, or Safari."
      );
      return;
    }

    try {
      setSpeechError(null);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript;
          }
        }
        if (finalChunk.trim()) {
          setBrief((prev) =>
            prev ? `${prev.trim()} ${finalChunk.trim()}` : finalChunk.trim()
          );
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setSpeechError(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Speech recognition start failed:", err);
      setSpeechError("Could not access microphone.");
      setIsListening(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && prefill) {
      if (prefill.freelancer) setFreelancer(prefill.freelancer);
      if (prefill.title) setTitle(prefill.title);
      if (prefill.brief) setBrief(prefill.brief);
      if (prefill.amountUSDC) setAmountUSDC(prefill.amountUSDC);
      if (prefill.deadlineDays && prefill.deadlineDays > 0) {
        setDeadlineDate(
          toLocalDateTimeInput(
            new Date(Date.now() + prefill.deadlineDays * 86_400_000)
          )
        );
      }
    }
  }, [isOpen, prefill]);

  React.useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  if (!isOpen) return null;

  const saveOffchainMetadata = async (milestoneId: number) => {
    if (!brief.trim() && !invoiceNotes.trim()) {
      return;
    }
    if (!address) {
      setMetadataSaveError("Connect wallet to sign and save milestone notes.");
      return;
    }

    try {
      setIsSavingMetadata(true);
      setMetadataSaveError(null);

      const metadata = {
        brief: brief.trim() || undefined,
        invoiceNotes: invoiceNotes.trim() || undefined,
      };
      const issuedAt = Date.now();
      const message = buildMetadataAuthorizationMessage(
        address,
        milestoneId,
        issuedAt,
        metadata
      );

      const signature = await signMessageAsync({ message });

      await saveMilestoneMetadata(milestoneId, metadata, {
        address,
        issuedAt,
        signature,
      });

      setMetadataSaved(true);
    } catch (saveErr: any) {
      console.warn("Failed to persist off-chain metadata:", saveErr);
      setMetadataSaveError(
        saveErr?.message ||
          "Milestone funded on-chain, but off-chain notes could not be signed/saved."
      );
    } finally {
      setIsSavingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setMetadataSaveError(null);
    setMetadataSaved(false);

    if (!isConnected || !address) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }

    if (
      !ESCROW_CONTRACT_ADDRESS ||
      ESCROW_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
    ) {
      setErrorMsg("Escrow contract address is not configured.");
      return;
    }

    if (!isAddress(freelancer)) {
      setErrorMsg("Please enter a valid Ethereum checksum address for the freelancer.");
      return;
    }

    if (freelancer.toLowerCase() === address.toLowerCase()) {
      setErrorMsg("Client address cannot be the same as the freelancer address.");
      return;
    }

    if (!title.trim()) {
      setErrorMsg("Please specify a milestone title.");
      return;
    }

    const deadlineTimestamp = Math.floor(new Date(deadlineDate).getTime() / 1000);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (deadlineTimestamp <= currentTimestamp) {
      setErrorMsg("Deadline must be set in the future.");
      return;
    }

    let parsedAmountWei: bigint;
    try {
      // Circle Arc Native USDC uses 18 decimals for native value transfers
      parsedAmountWei = parseUnits(amountUSDC, 18);
      if (parsedAmountWei <= 0n) {
        throw new Error("Amount must be greater than zero.");
      }
    } catch (err: any) {
      setErrorMsg("Invalid USDC amount. Please enter a positive number.");
      return;
    }

    try {
      setIsSubmitting(true);

      const hash = await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ARC_MILESTONE_ESCROW_ABI,
        functionName: "createMilestone",
        args: [
          freelancer as `0x${string}`,
          title.trim(),
          BigInt(deadlineTimestamp),
        ],
        value: parsedAmountWei,
      });

      setTxHash(hash);

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        let createdId = 0;
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
          } catch {}
        }

        if (createdId === 0) {
          try {
            const count = await publicClient.readContract({
              address: ESCROW_CONTRACT_ADDRESS,
              abi: ARC_MILESTONE_ESCROW_ABI,
              functionName: "getMilestonesCount",
            });
            createdId = Number(count) - 1;
          } catch {}
        }

        await saveOffchainMetadata(createdId);

        if (prefill?.gigId && createdId > 0 && address) {
          try {
            const issuedAt = Date.now();
            const message = buildGigAuthorizationMessage({
              action: "link-milestone",
              address,
              issuedAt,
              gigId: prefill.gigId,
              targetId: createdId,
            });
            const signature = await signMessageAsync({ message });
            await linkGigToMilestone(prefill.gigId, createdId, {
              address,
              issuedAt,
              signature,
            });
          } catch (linkErr) {
            console.warn("Escrow created, but failed to link gig record:", linkErr);
          }
        }

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
    stopListening();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-[28px] border border-lav-200 bg-white p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-lav-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lav-100 text-lav-600">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Create Milestone Escrow</h2>
              <p className="text-xs text-ink-soft">
                Lock native USDC on Arc Testnet • Instant payout upon approval
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

        {/* Success Screen */}
        {successInfo ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold text-ink">Milestone Escrow Created!</h3>
              <p className="text-sm text-ink-soft mt-1">
                Milestone #{successInfo.id} has been securely funded on Arc Testnet.
              </p>
            </div>

            {metadataSaved && (
              <p className="text-sm text-emerald-700 font-medium" role="status">
                Project notes were signed and saved.
              </p>
            )}
            {metadataSaveError && (
              <div className="space-y-3" role="alert">
                <p className="text-sm text-amber-800">{metadataSaveError}</p>
                <button
                  type="button"
                  onClick={() => saveOffchainMetadata(successInfo.id)}
                  disabled={isSavingMetadata}
                  className="rounded-full border border-lav-200 px-4 py-2 text-sm text-ink hover:bg-lav-50 disabled:opacity-50"
                >
                  {isSavingMetadata ? "Waiting for wallet..." : "Sign and retry saving notes"}
                </button>
              </div>
            )}

            <div className="rounded-2xl bg-lav-50 border border-lav-200 p-3 text-xs font-mono text-ink flex items-center justify-between">
              <span className="truncate max-w-[280px]">Tx: {successInfo.txHash}</span>
              <a
                href={getExplorerTxUrl(successInfo.txHash)}
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
              Back to Dashboard
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMsg && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Freelancer Address */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
                <User className="h-3.5 w-3.5 text-lav-600" />
                Freelancer Wallet Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={freelancer}
                onChange={(e) => setFreelancer(e.target.value.trim())}
                required
                className="w-full rounded-2xl border border-lav-200 bg-lav-50/50 px-4 py-2.5 text-sm font-mono text-ink placeholder:text-ink-soft/60 focus:bg-white focus:border-lav-500 focus:outline-none focus:ring-2 focus:ring-lav-200 transition-all"
              />
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
                <FileText className="h-3.5 w-3.5 text-lav-600" />
                Milestone Title
              </label>
              <input
                type="text"
                placeholder="e.g. Website redesign & smart contract audit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-2xl border border-lav-200 bg-lav-50/50 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:bg-white focus:border-lav-500 focus:outline-none focus:ring-2 focus:ring-lav-200 transition-all"
              />
            </div>

            {/* Amount & Deadline row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
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
                    className="w-full rounded-2xl border border-lav-200 bg-lav-50/50 pl-4 pr-16 py-2.5 text-sm font-mono text-ink placeholder:text-ink-soft/60 focus:bg-white focus:border-lav-500 focus:outline-none focus:ring-2 focus:ring-lav-200 transition-all"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-lav-700 bg-lav-100 px-2 py-0.5 rounded-lg">
                    USDC
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5 text-lav-600" />
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  min={toLocalDateTimeInput(new Date())}
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-lav-200 bg-lav-50/50 px-4 py-2.5 text-sm font-mono text-ink placeholder:text-ink-soft/60 focus:bg-white focus:border-lav-500 focus:outline-none focus:ring-2 focus:ring-lav-200 transition-all"
                />
              </div>
            </div>

            {/* Project Brief / Deliverable Specs with Voice Input */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                  Project Scope & Deliverable Notes (Off-Chain)
                </label>
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    isListening
                      ? "bg-rose-500 text-white shadow-sm ring-2 ring-rose-300 animate-pulse"
                      : "bg-lav-100 text-lav-700 hover:bg-lav-200"
                  }`}
                  title={isListening ? "Click to stop listening" : "Click to dictate notes with your voice"}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-3.5 w-3.5" />
                      <span>Listening... (Click to stop)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5 text-lav-600" />
                      <span>Dictate with Voice</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="Include specifications, deliverables checklist, or GitHub issue link (or click Dictate with Voice)..."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  className={`w-full rounded-2xl border bg-lav-50/50 px-4 py-2.5 text-xs text-ink placeholder:text-ink-soft/60 focus:bg-white focus:outline-none focus:ring-2 transition-all resize-none ${
                    isListening
                      ? "border-lav-500 ring-2 ring-lav-300/60 bg-white"
                      : "border-lav-200 focus:border-lav-500 focus:ring-lav-200"
                  }`}
                />
                {isListening && (
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-lav-100 px-2.5 py-0.5 text-[10px] font-semibold text-lav-700 pointer-events-none shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    Recording speech...
                  </div>
                )}
              </div>

              {speechError && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{speechError}</p>
              )}
            </div>

            {/* AI Deliverable Verification Oracle Configuration */}
            <div className="rounded-2xl border border-lav-200/90 bg-gradient-to-r from-lav-50/70 to-indigo-50/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-ink">
                  <Sparkles className="h-3.5 w-3.5 text-lav-600" />
                  <span>Autonomous AI Deliverable Oracle</span>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  Active by Default
                </span>
              </div>
              <p className="text-[11px] text-ink-soft leading-relaxed">
                When your contractor submits work, our AI Oracle will automatically audit code quality, CI test suites, and security integrity to provide a one-click verification score before releasing payment.
              </p>
            </div>

            {/* Arc Native Gas Callout */}
            <div className="rounded-2xl bg-lav-50 border border-lav-200 p-3.5 text-xs text-ink-soft space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-lav-700">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Circle Arc Native USDC Protocol Note</span>
              </div>
              <p>
                Native USDC is sent as <code className="text-lav-700 font-mono">msg.value</code> at 18 decimals;
                the separate ERC-20 USDC interface uses 6. Indicative gas fee:{" "}
                <span className="text-emerald-700 font-mono font-semibold">~$0.01 USDC</span>.
              </p>
            </div>

            {/* Actions */}
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
                    <span>Locking Escrow on Arc...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
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
