"use client";

import React, { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import {
  Briefcase,
  Search,
  Plus,
  RotateCw,
  Clock,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Gig, GigCategory, EscrowPrefill } from "../types";
import { shortenAddress } from "../lib/utils";
import { PostGigModal } from "./PostGigModal";
import { GigDetailModal } from "./GigDetailModal";
import { dojoSfx } from "../lib/dojoSfx";

interface GigBoardProps {
  gigs: Gig[];
  isLoading: boolean;
  errorMsg?: string | null;
  onRefresh: () => void;
  onGigsChanged: (updater: (prev: Gig[]) => Gig[]) => void;
  onFundEscrow: (prefill: EscrowPrefill) => void;
}

const CATEGORIES: Array<"all" | GigCategory> = [
  "all",
  "Smart Contracts",
  "Frontend & UI",
  "Full-Stack",
  "Security Audit",
  "Design",
  "Other",
];

export function GigBoard({
  gigs,
  isLoading,
  errorMsg,
  onRefresh,
  onGigsChanged,
  onFundEscrow,
}: GigBoardProps) {
  const { address } = useAccount();
  const userAddr = address?.toLowerCase();

  const [categoryFilter, setCategoryFilter] = useState<"all" | GigCategory>("all");
  const [statusFilter, setStatusFilter] = useState<"Open" | "Assigned" | "all">("Open");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);

  const filteredGigs = useMemo(() => {
    return gigs.filter((g) => {
      if (statusFilter !== "all" && g.status !== statusFilter) return false;
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.client.toLowerCase().includes(q) ||
          g.skills.some((s) => s.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [gigs, statusFilter, categoryFilter, searchQuery]);

  const handleGigCreated = (created: Gig) => {
    onGigsChanged((prev) => [created, ...prev]);
  };

  const handleGigUpdated = (updated: Gig) => {
    onGigsChanged((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelectedGig((curr) => (curr?.id === updated.id ? updated : curr));
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-amber-500/25 bg-[#120D1B]/90 p-1 shadow-md">
          {(["Open", "Assigned", "all"] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                dojoSfx.playSlash();
                setStatusFilter(st);
              }}
              className={`flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                statusFilter === st
                  ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm"
                  : "text-[#A99BB8] hover:text-amber-200"
              }`}
            >
              <span>{st === "all" ? "All Quests" : st}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A99BB8]" />
            <input
              type="text"
              placeholder="Search quests, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-amber-500/25 bg-[#120D1B]/90 py-2 pl-9 pr-4 text-xs sm:text-sm text-[#F6EFE0] placeholder:text-[#A99BB8]/70 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <button
            onClick={() => {
              dojoSfx.playSlash();
              onRefresh();
            }}
            aria-label="Refresh open gigs"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/25 bg-[#120D1B]/90 text-[#A99BB8] hover:bg-amber-500/15 hover:text-amber-200 transition-colors shadow-xs shrink-0"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>

          <button
            onClick={() => {
              dojoSfx.playSlash();
              setIsPostOpen(true);
            }}
            className="katana-btn inline-flex min-h-10 items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-glow transition-all active:scale-[0.98] shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Post Open Gig</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              dojoSfx.playSlash();
              setCategoryFilter(cat);
            }}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all border ${
              categoryFilter === cat
                ? "bg-amber-500/20 text-amber-200 border-amber-400 shadow-glow-gold"
                : "bg-[#120D1B]/80 text-[#A99BB8] border-amber-500/20 hover:border-amber-400/50 hover:text-[#F6EFE0]"
            }`}
          >
            {cat === "all" ? "All Disciplines" : cat}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/50 p-4 text-xs text-amber-200">
          {errorMsg}
        </div>
      )}

      {/* Gig Cards Grid */}
      {isLoading && gigs.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-56 dojo-card p-6 animate-pulse"
            />
          ))}
        </div>
      ) : filteredGigs.length === 0 ? (
        <div className="dojo-card p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <Briefcase className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-[#F6EFE0]">
              No Open Bounties Match Your Filter
            </h3>
            <p className="text-xs sm:text-sm text-[#A99BB8] max-w-md mx-auto">
              Patrons can post open quests with a target USDC reward, compare Ronin proposals, and lock escrow in 1 click.
            </p>
          </div>
          <button
            onClick={() => {
              dojoSfx.playSlash();
              setIsPostOpen(true);
            }}
            className="katana-btn inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-glow transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Post the First Quest</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGigs.map((gig) => {
            const isOwner = Boolean(userAddr && gig.client.toLowerCase() === userAddr);
            const hasApplied = Boolean(
              userAddr &&
                gig.applications.some((a) => a.freelancer.toLowerCase() === userAddr)
            );

            return (
              <div
                key={gig.id}
                onClick={() => {
                  dojoSfx.playSlash();
                  setSelectedGig(gig);
                }}
                className="dojo-card group cursor-pointer flex flex-col justify-between p-6"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/35 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                      <Sparkles className="h-3 w-3" />
                      {gig.category}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
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

                  <div>
                    <h3 className="font-display text-base font-bold text-[#F6EFE0] group-hover:text-amber-300 transition-colors line-clamp-2">
                      {gig.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#C7BBD4] leading-relaxed line-clamp-3">
                      {gig.description}
                    </p>
                  </div>

                  {gig.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {gig.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-[#0D0914] border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-[#C7BBD4]"
                        >
                          {skill}
                        </span>
                      ))}
                      {gig.skills.length > 4 && (
                        <span className="text-[11px] text-[#A99BB8] self-center">
                          +{gig.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 border-t border-amber-500/15 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#A99BB8] block">
                        Bounty Reward
                      </span>
                      <span className="font-display text-lg font-extrabold text-amber-300">
                        {gig.budget_usdc}{" "}
                        <span className="text-xs font-semibold text-amber-500/80">USDC</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#A99BB8]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        {gig.deadline_days}d
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-[#F6EFE0]">
                        <Users className="h-3.5 w-3.5 text-rose-400" />
                        {gig.applications_count}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#A99BB8]">
                      {shortenAddress(gig.client, 4)}
                      {isOwner && (
                        <span className="ml-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 font-sans text-[10px] font-bold text-rose-300 uppercase">
                          Patron
                        </span>
                      )}
                    </span>

                    <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-amber-300 group-hover:translate-x-0.5 transition-transform">
                      {isOwner ? (
                        <>Inspect ({gig.applications_count})</>
                      ) : hasApplied ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Applied
                        </span>
                      ) : (
                        <>Accept Quest</>
                      )}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PostGigModal
        isOpen={isPostOpen}
        onClose={() => setIsPostOpen(false)}
        onSuccess={handleGigCreated}
      />

      <GigDetailModal
        gig={selectedGig}
        isOpen={Boolean(selectedGig)}
        onClose={() => setSelectedGig(null)}
        onUpdated={handleGigUpdated}
        onFundEscrow={onFundEscrow}
      />
    </div>
  );
}
