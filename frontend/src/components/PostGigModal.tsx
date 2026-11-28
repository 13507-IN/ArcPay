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
import { dojoSfx } from "../lib/dojoSfx";

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
      setErrorMsg("Connect your wallet to post an open bounty.");
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
      dojoSfx.playSlash();
      const issuedAt = Date.now();
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        budgetUsdc: budgetUsdc.trim(),
        deadlineDays: parsedDays,
        skills,
      };
      const message = buildGigAuthorizationMessage({
        action: "create-gig",
        address,
        issuedAt,
        payload,
      });

      const signature = await signMessageAsync({ message });
      const created = await createOpenGig(payload, { address, issuedAt, signature });

      dojoSfx.playGong(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto dojo-card p-6 sm:p-8 text-[#F6EFE0]">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold tracking-wide text-[#F6EFE0]">
                Post Bounty Quest
              </h2>
              <p className="text-xs text-[#A99BB8]">
                Recruit skilled Ronin, compare pitches, then seal USDC in escrow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#A99BB8] hover:bg-amber-500/15 hover:text-amber-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMsg && (
            <div className="rounded-2xl bg-rose-950/70 border border-rose-500/40 p-3 text-xs text-rose-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#C7BBD4] uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Quest Title
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={140}
              placeholder="e.g. Build & Audit ERC-20 Staking Contract on Arc"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-amber-500/25 bg-[#0A0710] px-4 py-2.5 text-sm text-[#F6EFE0] placeholder:text-[#7E708F] focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#C7BBD4] uppercase tracking-wider">
                Discipline
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GigCategory)}
                className="w-full rounded-2xl border border-amber-500/25 bg-[#0A0710] px-3.5 py-2.5 text-sm text-[#F6EFE0] focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-bold text-[#C7BBD4] uppercase tracking-wider">
                <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                Bounty (USDC)
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={budgetUsdc}
                onChange={(e) => setBudgetUsdc(e.target.value)}
                className="w-full rounded-2xl border border-amber-500/25 bg-[#0A0710] px-3.5 py-2.5 text-sm font-mono font-bold text-amber-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-bold text-[#C7BBD4] uppercase tracking-wider">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                Timeline (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                required
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
                className="w-full rounded-2xl border border-amber-500/25 bg-[#0A0710] px-3.5 py-2.5 text-sm font-mono font-bold text-[#F6EFE0] focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#C7BBD4] uppercase tracking-wider">
              <Tag className="h-3.5 w-3.5 text-amber-400" />
              Required Skills (comma-separated)
            </label>
            <input
              type="text"
              placeholder="Solidity, Next.js, TypeScript, Figma"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full rounded-2xl border border-amber-500/25 bg-[#0A0710] px-4 py-2.5 text-sm text-[#F6EFE0] placeholder:text-[#7E708F] focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#C7BBD4] uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              Scope &amp; Acceptance Criteria
            </label>
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={4}
              placeholder="Describe exact deliverables, tech stack, and acceptance criteria (our AI Oracle checks submissions against this exact brief)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-amber-500/25 bg-[#0A0710] px-4 py-3 text-sm text-[#F6EFE0] placeholder:text-[#7E708F] focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <p className="text-[11px] text-[#A99BB8] mt-1">
              Gasless wallet signature only. You fund USDC on-chain once you select a Ronin.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full border border-white/15 bg-[#161022] px-5 py-2.5 text-sm font-semibold text-[#C7BBD4] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="katana-btn inline-flex min-h-10 items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-glow hover:brightness-110 transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Briefcase className="h-4 w-4" />
                  <span>Publish Bounty Quest</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
