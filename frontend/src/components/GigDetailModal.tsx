"use client";

import React, { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import {
  X,
  Briefcase,
  Clock,
  Users,
  CheckCircle2,
  ExternalLink,
  Send,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Ban,
} from "lucide-react";
import { Gig, GigApplication, EscrowPrefill } from "../types";
import {
  shortenAddress,
  getExplorerAddressUrl,
  toSafeExternalUrl,
} from "../lib/utils";
import {
  buildGigAuthorizationMessage,
  applyToOpenGig,
  selectGigApplicant,
  closeOpenGig,
} from "../lib/api";
import { dojoSfx } from "../lib/dojoSfx";

interface GigDetailModalProps {
  gig: Gig | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: Gig) => void;
  onFundEscrow: (prefill: EscrowPrefill) => void;
}

export function GigDetailModal({
  gig,
  isOpen,
  onClose,
  onUpdated,
  onFundEscrow,
}: GigDetailModalProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [pitch, setPitch] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [proposedUsdc, setProposedUsdc] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [isClosingGig, setIsClosingGig] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (gig) {
      setProposedUsdc(gig.budget_usdc);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [gig?.id]);

  if (!isOpen || !gig) return null;

  const userAddr = address?.toLowerCase();
  const isOwner = Boolean(userAddr && gig.client.toLowerCase() === userAddr);
  const myExistingApp = userAddr
    ? gig.applications.find((a) => a.freelancer.toLowerCase() === userAddr)
    : undefined;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isConnected || !address) {
      setErrorMsg("Connect your wallet to submit a proposal.");
      return;
    }

    try {
      setIsApplying(true);
      dojoSfx.playSlash();
      const issuedAt = Date.now();
      const cleanPortfolio = portfolioUrl.trim();
      const cleanProposed = proposedUsdc.trim();
      const message = buildGigAuthorizationMessage({
        action: "apply-gig",
        address,
        issuedAt,
        gigId: gig.id,
        payload: {
          pitch: pitch.trim(),
          portfolioUrl: cleanPortfolio || null,
          proposedUsdc: cleanProposed || null,
        },
      });
      const signature = await signMessageAsync({ message });
      const savedApp = await applyToOpenGig(
        gig.id,
        {
          pitch: pitch.trim(),
          portfolioUrl: cleanPortfolio || undefined,
          proposedUsdc: cleanProposed || undefined,
        },
        { address, issuedAt, signature }
      );

      const remainingApps = gig.applications.filter(
        (a) => a.freelancer.toLowerCase() !== savedApp.freelancer.toLowerCase()
      );
      const updatedGig: Gig = {
        ...gig,
        applications: [savedApp, ...remainingApps],
        applications_count: remainingApps.length + 1,
      };
      onUpdated(updatedGig);
      setPitch("");
      setSuccessMsg("Proposal sealed! The Patron can now select you and fund an escrow vault.");
    } catch (err: any) {
      setErrorMsg(err?.shortMessage || err?.message || "Failed to submit proposal.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleSelectAndFund = async (app: GigApplication) => {
    if (!address) return;
    setErrorMsg(null);
    try {
      setSelectingId(app.id);
      dojoSfx.playSlash();
      const issuedAt = Date.now();
      const message = buildGigAuthorizationMessage({
        action: "select-applicant",
        address,
        issuedAt,
        gigId: gig.id,
        targetId: app.id,
      });
      const signature = await signMessageAsync({ message });
      const updated = await selectGigApplicant(gig.id, app.id, {
        address,
        issuedAt,
        signature,
      });
      onUpdated(updated);
      onClose();
      onFundEscrow({
        gigId: updated.id,
        freelancer: app.freelancer,
        title: updated.title,
        brief: updated.description,
        amountUSDC: app.proposed_usdc || updated.budget_usdc,
        deadlineDays: updated.deadline_days,
      });
    } catch (err: any) {
      setErrorMsg(err?.shortMessage || err?.message || "Failed to select applicant.");
    } finally {
      setSelectingId(null);
    }
  };

  const handleCloseGig = async () => {
    if (!address) return;
    setErrorMsg(null);
    try {
      setIsClosingGig(true);
      const issuedAt = Date.now();
      const message = buildGigAuthorizationMessage({
        action: "close-gig",
        address,
        issuedAt,
        gigId: gig.id,
      });
      const signature = await signMessageAsync({ message });
      const updated = await closeOpenGig(gig.id, { address, issuedAt, signature });
      onUpdated(updated);
    } catch (err: any) {
      setErrorMsg(err?.shortMessage || err?.message || "Failed to close gig.");
    } finally {
      setIsClosingGig(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto dojo-card p-6 sm:p-8 text-[#F6EFE0] space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-amber-500/20 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 shrink-0 mt-0.5">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/35 px-2.5 py-0.5 rounded-full">
                  Quest #{gig.id}
                </span>
                <span className="text-xs font-semibold text-[#C7BBD4] bg-[#161022] border border-white/10 px-2.5 py-0.5 rounded-full">
                  {gig.category}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    gig.status === "Open"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                      : gig.status === "Assigned"
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/40"
                      : "bg-slate-800 text-slate-300 border border-slate-600"
                  }`}
                >
                  {gig.status}
                </span>
              </div>
              <h2 className="font-display text-xl font-bold tracking-wide text-[#F6EFE0] mt-1.5">
                {gig.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#A99BB8] hover:bg-amber-500/15 hover:text-amber-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-rose-950/70 border border-rose-500/40 p-3 text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-2xl bg-emerald-950/60 border border-emerald-500/40 p-3 text-xs text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Key Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#0D0914] border border-amber-500/20 p-3.5">
            <span className="text-[11px] font-bold text-[#A99BB8] uppercase tracking-wider block">
              Bounty Reward
            </span>
            <span className="font-display text-xl font-extrabold text-amber-300 mt-0.5 block">
              {gig.budget_usdc}{" "}
              <span className="text-xs font-semibold text-amber-500/80">USDC</span>
            </span>
          </div>

          <div className="rounded-2xl bg-[#0D0914] border border-amber-500/20 p-3.5">
            <span className="text-[11px] font-bold text-[#A99BB8] uppercase tracking-wider block">
              Target Timeline
            </span>
            <span className="font-display text-lg font-bold text-[#F6EFE0] mt-0.5 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-400" />
              {gig.deadline_days} days
            </span>
          </div>

          <div className="rounded-2xl bg-[#0D0914] border border-amber-500/20 p-3.5">
            <span className="text-[11px] font-bold text-[#A99BB8] uppercase tracking-wider block">
              Patron
            </span>
            <a
              href={getExplorerAddressUrl(gig.client)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-300 hover:underline"
            >
              <span>{shortenAddress(gig.client, 6)}</span>
              {isOwner && (
                <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-sans font-bold text-rose-300">
                  You
                </span>
              )}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </div>
        </div>

        {/* Scope & Skills */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-500/20 bg-[#0D0914] p-4 space-y-2">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
              Quest Scope &amp; Deliverables
            </span>
            <p className="text-sm text-[#E4DAF0] leading-relaxed whitespace-pre-wrap">
              {gig.description}
            </p>
          </div>

          {gig.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {gig.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-amber-500/25 bg-[#161022] px-3 py-1 text-xs font-semibold text-amber-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Banner */}
        {gig.status === "Assigned" && gig.selected_freelancer && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                <span>Ronin Selected</span>
              </div>
              <p className="text-xs text-emerald-200">
                Assigned to{" "}
                <code className="font-mono font-bold text-amber-200">
                  {shortenAddress(gig.selected_freelancer, 6)}
                </code>
                {gig.linked_milestone_id
                  ? ` · Vault Funded in Scroll #${gig.linked_milestone_id}`
                  : " · Ready to seal USDC on-chain"}
              </p>
            </div>
            {isOwner && !gig.linked_milestone_id && (
              <button
                onClick={() => {
                  const accepted = gig.applications.find((a) => a.status === "Accepted");
                  onClose();
                  onFundEscrow({
                    gigId: gig.id,
                    freelancer: gig.selected_freelancer!,
                    title: gig.title,
                    brief: gig.description,
                    amountUSDC: accepted?.proposed_usdc || gig.budget_usdc,
                    deadlineDays: gig.deadline_days,
                  });
                }}
                className="katana-btn rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-glow-emerald"
              >
                Lock &amp; Fund Escrow Now
              </button>
            )}
          </div>
        )}

        {/* Proposals */}
        <div className="space-y-4 border-t border-amber-500/15 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-bold text-[#F6EFE0] uppercase tracking-wider">
              <Users className="h-4 w-4 text-amber-400" />
              <span>Ronin Proposals ({gig.applications.length})</span>
            </h3>
            {isOwner && gig.status === "Open" && (
              <button
                onClick={handleCloseGig}
                disabled={isClosingGig}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-950/60 px-3 py-1 text-xs font-bold text-rose-300 hover:bg-rose-900/70 transition-colors disabled:opacity-50"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>{isClosingGig ? "Closing..." : "Close Quest"}</span>
              </button>
            )}
          </div>

          {gig.applications.length > 0 ? (
            <div className="space-y-3">
              {gig.applications.map((app) => (
                <div
                  key={app.id}
                  className={`rounded-2xl border p-4 space-y-2.5 ${
                    app.status === "Accepted"
                      ? "border-emerald-500/45 bg-emerald-950/30"
                      : "border-amber-500/20 bg-[#161022]/80"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#F6EFE0]">
                        {shortenAddress(app.freelancer, 6)}
                      </span>
                      {userAddr && app.freelancer.toLowerCase() === userAddr && (
                        <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          You
                        </span>
                      )}
                      {app.proposed_usdc && (
                        <span className="rounded-full bg-[#0D0914] border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-mono font-bold text-amber-300">
                          Quote: {app.proposed_usdc} USDC
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                          app.status === "Accepted"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : app.status === "Rejected"
                            ? "bg-slate-800 text-slate-400"
                            : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {app.status}
                      </span>

                      {isOwner && gig.status === "Open" && (
                        <button
                          onClick={() => handleSelectAndFund(app)}
                          disabled={selectingId === app.id}
                          className="katana-btn inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-glow transition-all disabled:opacity-50"
                        >
                          {selectingId === app.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          )}
                          <span>Accept &amp; Fund Escrow</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#E4DAF0] leading-relaxed whitespace-pre-wrap">
                    {app.pitch}
                  </p>

                  {(() => {
                    const safePortfolio = toSafeExternalUrl(app.portfolio_url);
                    return safePortfolio ? (
                      <a
                        href={safePortfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-amber-300 hover:underline"
                      >
                        <span>{app.portfolio_url}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null;
                  })()}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-amber-500/25 bg-[#0D0914]/70 p-4 text-center text-xs text-[#A99BB8]">
              No proposals yet. Be the first Ronin to accept this quest!
            </p>
          )}

          {/* Application Form */}
          {gig.status === "Open" && !isOwner && (
            <form
              onSubmit={handleApply}
              className="rounded-2xl border border-amber-500/25 bg-[#161022]/90 p-4 sm:p-5 space-y-3.5"
            >
              <h4 className="font-display text-sm font-bold text-amber-300 uppercase tracking-wider">
                {myExistingApp ? "Update Your Proposal" : "Submit Battle Proposal"}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[#C7BBD4] uppercase tracking-wider">
                    Proposed Bounty (USDC)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder={gig.budget_usdc}
                    value={proposedUsdc}
                    onChange={(e) => setProposedUsdc(e.target.value)}
                    className="w-full rounded-xl border border-amber-500/25 bg-[#0A0710] px-3.5 py-2 text-xs font-mono font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[#C7BBD4] uppercase tracking-wider">
                    GitHub / Portfolio Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/your-handle"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full rounded-xl border border-amber-500/25 bg-[#0A0710] px-3.5 py-2 text-xs font-mono text-[#F6EFE0] focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#C7BBD4] uppercase tracking-wider">
                  Your Pitch &amp; Execution Plan
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={2500}
                  rows={3}
                  placeholder="Share relevant experience, architecture plan, and delivery timeline..."
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  className="w-full rounded-xl border border-amber-500/25 bg-[#0A0710] px-3.5 py-2.5 text-xs text-[#F6EFE0] placeholder:text-[#7E708F] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isApplying}
                  className="katana-btn inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-glow transition-all disabled:opacity-60"
                >
                  {isApplying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isApplying
                      ? "Signing..."
                      : myExistingApp
                      ? "Update Proposal"
                      : "Submit Proposal"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
