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
        <div className="flex items-center gap-2 overflow-x-auto rounded-full border border-lav-200 bg-lav-100/60 p-1 shadow-sm">
          {(["Open", "Assigned", "all"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs sm:text-sm font-semibold transition-all ${
                statusFilter === st
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <span>{st === "all" ? "All Gigs" : st}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              placeholder="Search gigs, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-lav-200 bg-white py-2 pl-9 pr-4 text-xs sm:text-sm text-ink placeholder:text-ink-soft/60 focus:border-lav-500 focus:outline-none focus:ring-2 focus:ring-lav-200"
            />
          </div>

          <button
            onClick={onRefresh}
            aria-label="Refresh open gigs"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-lav-200 bg-white text-ink-soft hover:bg-lav-50 hover:text-ink transition-colors shadow-xs shrink-0"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin text-lav-600" : ""}`} />
          </button>

          <button
            onClick={() => setIsPostOpen(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-lav-600 hover:bg-lav-700 px-5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] shrink-0"
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
            onClick={() => setCategoryFilter(cat)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border ${
              categoryFilter === cat
                ? "bg-lav-600 text-white border-lav-600 shadow-xs"
                : "bg-white text-ink-soft border-lav-200 hover:border-lav-300 hover:text-ink"
            }`}
          >
            {cat === "all" ? "All Categories" : cat}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          {errorMsg}
        </div>
      )}

      {/* Gig Cards Grid */}
      {isLoading && gigs.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-56 rounded-3xl border border-lav-200 bg-white/70 p-6 animate-pulse"
            />
          ))}
        </div>
      ) : filteredGigs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-lav-200 bg-white/80 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lav-100 text-lav-600">
            <Briefcase className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-semibold text-ink">
              No open gigs match your filter
            </h3>
            <p className="text-xs sm:text-sm text-ink-soft max-w-md mx-auto">
              Clients can post open work with a target USDC budget, review proposals from builders, and fund an escrow milestone in one click.
            </p>
          </div>
          <button
            onClick={() => setIsPostOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-lav-600 hover:bg-lav-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Post the First Gig</span>
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
                onClick={() => setSelectedGig(gig)}
                className="group cursor-pointer flex flex-col justify-between rounded-3xl border border-lav-200/80 bg-white p-6 shadow-sm hover:border-lav-400 hover:shadow-md transition-all"
              >
                <div className="space-y-3.5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-lav-50 border border-lav-200 px-2.5 py-0.5 text-[11px] font-semibold text-lav-700">
                      <Sparkles className="h-3 w-3" />
                      {gig.category}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        gig.status === "Open"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : gig.status === "Assigned"
                          ? "bg-lav-100 text-lav-800 border border-lav-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {gig.status}
                    </span>
                  </div>

                  {/* Title & Scope Snippet */}
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink group-hover:text-lav-700 transition-colors line-clamp-2">
                      {gig.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-ink-soft leading-relaxed line-clamp-3">
                      {gig.description}
                    </p>
                  </div>

                  {/* Skills */}
                  {gig.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {gig.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-lav-50/80 border border-lav-100 px-2.5 py-0.5 text-[11px] font-medium text-ink-soft"
                        >
                          {skill}
                        </span>
                      ))}
                      {gig.skills.length > 4 && (
                        <span className="text-[11px] text-ink-soft self-center">
                          +{gig.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-5 border-t border-lav-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft block">
                        Budget
                      </span>
                      <span className="font-display text-lg font-bold text-ink">
                        {gig.budget_usdc}{" "}
                        <span className="text-xs font-medium text-ink-soft">USDC</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-ink-soft">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-lav-600" />
                        {gig.deadline_days}d
                      </span>
                      <span className="flex items-center gap-1 font-medium text-ink">
                        <Users className="h-3.5 w-3.5 text-lav-600" />
                        {gig.applications_count}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-ink-soft">
                      {shortenAddress(gig.client, 4)}
                      {isOwner && (
                        <span className="ml-1.5 rounded-full bg-lav-100 px-2 py-0.5 font-sans text-[10px] font-semibold text-lav-700">
                          Your Post
                        </span>
                      )}
                    </span>

                    <span className="inline-flex items-center gap-1 font-semibold text-lav-700 group-hover:translate-x-0.5 transition-transform">
                      {isOwner ? (
                        <>Review ({gig.applications_count})</>
                      ) : hasApplied ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Applied
                        </span>
                      ) : (
                        <>Apply</>
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

      {/* Post Open Gig Modal */}
      <PostGigModal
        isOpen={isPostOpen}
        onClose={() => setIsPostOpen(false)}
        onSuccess={handleGigCreated}
      />

      {/* Gig Details & Proposals Modal */}
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
