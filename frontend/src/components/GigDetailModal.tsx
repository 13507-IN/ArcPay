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
import { shortenAddress, getExplorerAddressUrl } from "../lib/utils";
import {
  buildGigAuthorizationMessage,
  applyToOpenGig,
  selectGigApplicant,
  closeOpenGig,
} from "../lib/api";

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
      const issuedAt = Date.now();
      const message = buildGigAuthorizationMessage({
        action: "apply-gig",
        address,
        issuedAt,
        gigId: gig.id,
      });
      const signature = await signMessageAsync({ message });
      const savedApp = await applyToOpenGig(
        gig.id,
        {
          pitch: pitch.trim(),
          portfolioUrl: portfolioUrl.trim() || undefined,
          proposedUsdc: proposedUsdc.trim() || undefined,
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
      setSuccessMsg("Proposal submitted! The client can now review and fund an escrow for you.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-lav-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-lav-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lav-100 text-lav-600 shrink-0 mt-0.5">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-lav-700 bg-lav-100 px-2.5 py-0.5 rounded-full">
                  Gig #{gig.id}
                </span>
                <span className="text-xs font-semibold text-ink-soft bg-lav-50 border border-lav-200 px-2.5 py-0.5 rounded-full">
                  {gig.category}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    gig.status === "Open"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : gig.status === "Assigned"
                      ? "bg-lav-100 text-lav-700 border border-lav-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {gig.status}
                </span>
              </div>
              <h2 className="font-display text-xl font-semibold text-ink mt-1.5">
                {gig.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-soft hover:bg-lav-50 hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Key Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-lav-50/70 border border-lav-200/70 p-3.5">
            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block">
              Budget
            </span>
            <span className="font-display text-xl font-bold text-ink mt-0.5 block">
              {gig.budget_usdc} <span className="text-xs font-medium text-ink-soft">USDC</span>
            </span>
          </div>

          <div className="rounded-2xl bg-lav-50/70 border border-lav-200/70 p-3.5">
            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block">
              Target Timeline
            </span>
            <span className="font-display text-lg font-semibold text-ink mt-0.5 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-lav-600" />
              {gig.deadline_days} days
            </span>
          </div>

          <div className="rounded-2xl bg-lav-50/70 border border-lav-200/70 p-3.5">
            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block">
              Posted By
            </span>
            <a
              href={getExplorerAddressUrl(gig.client)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-lav-700 hover:underline"
            >
              <span>{shortenAddress(gig.client, 6)}</span>
              {isOwner && (
                <span className="rounded-full bg-lav-200/70 px-2 py-0.5 text-[10px] font-sans text-lav-800">
                  You
                </span>
              )}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </div>
        </div>

        {/* Scope & Skills */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-lav-200/80 bg-white p-4 space-y-2">
            <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
              Project Scope &amp; Deliverables
            </span>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
              {gig.description}
            </p>
          </div>

          {gig.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {gig.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-lav-200 bg-lav-50 px-3 py-1 text-xs font-medium text-lav-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Banner */}
        {gig.status === "Assigned" && gig.selected_freelancer && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                <span>Freelancer Selected</span>
              </div>
              <p className="text-xs text-emerald-900">
                Assigned to <code className="font-mono font-semibold">{shortenAddress(gig.selected_freelancer, 6)}</code>
                {gig.linked_milestone_id
                  ? ` · Funded in Escrow Milestone #${gig.linked_milestone_id}`
                  : " · Ready to lock USDC on-chain"}
              </p>
            </div>
            {isOwner && !gig.linked_milestone_id && (
              <button
                onClick={() => {
                  onClose();
                  onFundEscrow({
                    gigId: gig.id,
                    freelancer: gig.selected_freelancer!,
                    title: gig.title,
                    brief: gig.description,
                    amountUSDC: gig.budget_usdc,
                    deadlineDays: gig.deadline_days,
                  });
                }}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
              >
                Lock &amp; Fund Escrow Now
              </button>
            )}
          </div>
        )}

        {/* Proposals Section */}
        <div className="space-y-4 border-t border-lav-100 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-ink uppercase tracking-wider">
              <Users className="h-4 w-4 text-lav-600" />
              <span>Proposals ({gig.applications.length})</span>
            </h3>
            {isOwner && gig.status === "Open" && (
              <button
                onClick={handleCloseGig}
                disabled={isClosingGig}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>{isClosingGig ? "Closing..." : "Close Gig"}</span>
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
                      ? "border-emerald-300 bg-emerald-50/40"
                      : "border-lav-200 bg-lav-50/30"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-ink">
                        {shortenAddress(app.freelancer, 6)}
                      </span>
                      {userAddr && app.freelancer.toLowerCase() === userAddr && (
                        <span className="rounded-full bg-lav-100 px-2 py-0.5 text-[10px] font-semibold text-lav-700">
                          You
                        </span>
                      )}
                      {app.proposed_usdc && (
                        <span className="rounded-full bg-white border border-lav-200 px-2.5 py-0.5 text-[11px] font-semibold text-ink">
                          Quote: {app.proposed_usdc} USDC
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          app.status === "Accepted"
                            ? "bg-emerald-100 text-emerald-800"
                            : app.status === "Rejected"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-lav-100 text-lav-700"
                        }`}
                      >
                        {app.status}
                      </span>

                      {isOwner && gig.status === "Open" && (
                        <button
                          onClick={() => handleSelectAndFund(app)}
                          disabled={selectingId === app.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-lav-600 hover:bg-lav-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50"
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

                  <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">
                    {app.pitch}
                  </p>

                  {app.portfolio_url && (
                    <a
                      href={app.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-lav-700 hover:underline"
                    >
                      <span>{app.portfolio_url}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-lav-200 bg-lav-50/40 p-4 text-center text-xs text-ink-soft">
              No proposals yet. Be the first freelancer to submit a pitch!
            </p>
          )}

          {/* Freelancer Application Form */}
          {gig.status === "Open" && !isOwner && (
            <form
              onSubmit={handleApply}
              className="rounded-2xl border border-lav-200 bg-lav-50/50 p-4 sm:p-5 space-y-3.5"
            >
              <h4 className="font-display text-sm font-semibold text-ink">
                {myExistingApp ? "Update Your Proposal" : "Apply for this Gig"}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-ink uppercase tracking-wider">
                    Proposed Budget (USDC)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder={gig.budget_usdc}
                    value={proposedUsdc}
                    onChange={(e) => setProposedUsdc(e.target.value)}
                    className="w-full rounded-xl border border-lav-200 bg-white px-3.5 py-2 text-xs font-semibold text-ink focus:border-lav-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-ink uppercase tracking-wider">
                    GitHub / Portfolio Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/your-handle"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full rounded-xl border border-lav-200 bg-white px-3.5 py-2 text-xs font-mono text-ink focus:border-lav-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink uppercase tracking-wider">
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
                  className="w-full rounded-xl border border-lav-200 bg-white px-3.5 py-2.5 text-xs text-ink focus:border-lav-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isApplying}
                  className="inline-flex items-center gap-2 rounded-full bg-lav-600 hover:bg-lav-700 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-60"
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
