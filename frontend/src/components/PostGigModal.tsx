"use client";

import React, { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import {
  X,
  Briefcase,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { GigCategory, Gig } from "../types";
import { buildGigAuthorizationMessage, createOpenGig } from "../lib/api";

interface PostGigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (created: Gig) => void;
}

const CATEGORIES: GigCategory[] = [
  "Smart Contracts",
  "Frontend & UI",
  "Full-Stack",
  "Security Audit",
  "Design",
  "Other",
];

export function PostGigModal({ isOpen, onClose, onSuccess }: PostGigModalProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GigCategory>("Smart Contracts");
  const [budgetUsdc, setBudgetUsdc] = useState("250");
  const [deadlineDays, setDeadlineDays] = useState("7");
  const [skillsInput, setSkillsInput] = useState("Solidity, Foundry, Arc");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isConnected || !address) {
      setErrorMsg("Connect your wallet to post an open gig.");
      return;
    }

    const parsedBudget = parseFloat(budgetUsdc);
    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      setErrorMsg("Budget must be greater than 0 USDC.");
      return;
    }

    const parsedDays = parseInt(deadlineDays, 10);
    if (!Number.isFinite(parsedDays) || parsedDays < 1 || parsedDays > 365) {
      setErrorMsg("Timeline must be between 1 and 365 days.");
      return;
    }

    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);

    try {
      setIsSubmitting(true);
      const issuedAt = Date.now();
      const message = buildGigAuthorizationMessage({
        action: "create-gig",
        address,
        issuedAt,
      });

      const signature = await signMessageAsync({ message });
      const created = await createOpenGig(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          budgetUsdc: budgetUsdc.trim(),
          deadlineDays: parsedDays,
          skills,
        },
        { address, issuedAt, signature }
      );

      setTitle("");
      setDescription("");
      onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error("Post gig error:", err);
      setErrorMsg(err?.shortMessage || err?.message || "Failed to post open gig.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-lav-200 bg-white p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-lav-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lav-100 text-lav-600">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                Post Open Gig
              </h2>
              <p className="text-xs text-ink-soft">
                Attract builders, compare proposals, then lock USDC escrow when ready
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-soft hover:bg-lav-50 hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMsg && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-lav-600" />
              Gig Title
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={140}
              placeholder="e.g. Build & Audit ERC-20 Staking Contract on Arc"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-lav-200 bg-lav-50/50 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:bg-white focus:border-lav-500 focus:outline-none focus:ring-2 focus:ring-lav-200 transition-all"
            />
          </div>

          {/* Category, Budget, Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GigCategory)}
                className="w-full rounded-2xl border border-lav-200 bg-lav-50/50 px-3.5 py-2.5 text-sm text-ink focus:bg-white focus:border-lav-500 focus:outline-none focus:ring-2 focus:ring-lav-200"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-ink uppercase tracking-wider">
                <DollarSign className="h-3.5 w-3.5 text-lav-600" />
                Budget (USDC)
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={budgetUsdc}
                onChange={(e) => setBudgetUsdc(e.target.value)}
                className="w-full rounded-2xl border border-lav-200 bg-lav-50/50 px-3.5 py-2.5 text-sm font-semibold text-ink focus:bg-white focus:border-lav-500 focus:outline-none focus:ring-2 focus:ring-lav-200"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-ink uppercase tracking-wider">
                <Calendar className="h-3.5 w-3.5 text-lav-600" />
                Timeline (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                required
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
                className="w-full rounded-2xl border border-lav-200 bg-lav-50/50 px-3.5 py-2.5 text-sm font-semibold text-ink focus:bg-white focus:border-lav-500 focus:outline-none focus:ring-2 focus:ring-lav-200"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
              <Tag className="h-3.5 w-3.5 text-lav-600" />
              Required Skills (comma-separated)
            </label>
            <input
              type="text"
              placeholder="Solidity, Next.js, TypeScript, Figma"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full rounded-2xl border border-lav-200 bg-lav-50/50 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:bg-white focus:border-lav-500 focus:outline-none focus:ring-2 focus:ring-lav-200"
            />
          </div>

          {/* Description / Acceptance Criteria */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5 text-lav-600" />
              Scope &amp; Acceptance Criteria
            </label>
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={4}
              placeholder="Describe exact deliverables, tech stack, and what must pass review (our AI Deliverable Auditor also uses this scope when the work is submitted)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-lav-200 bg-lav-50/50 px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:bg-white focus:border-lav-500 focus:outline-none focus:ring-2 focus:ring-lav-200"
            />
            <p className="text-[11px] text-ink-soft mt-1">
              Posting is gasless (wallet signature only). You only lock USDC on-chain once you pick a freelancer.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full border border-lav-200 bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-lav-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-lav-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-lav-700 transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Briefcase className="h-4 w-4" />
                  <span>Publish Open Gig</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
