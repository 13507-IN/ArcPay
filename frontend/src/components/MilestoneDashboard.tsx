"use client";

import React, { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import {
  Search,
  RotateCw,
  Plus,
  Briefcase,
  UserCheck,
  Layers,
} from "lucide-react";
import { Milestone, RoleFilter, StatusFilter } from "../types";
import { MilestoneCard } from "./MilestoneCard";
import { EmptyState } from "./EmptyState";
import { dojoSfx } from "../lib/dojoSfx";

interface MilestoneDashboardProps {
  milestones: Milestone[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onOpenSubmitModal: (m: Milestone) => void;
  onOpenDetailsModal: (id: number) => void;
}

export function MilestoneDashboard({
  milestones,
  isLoading,
  onRefresh,
  onOpenCreateModal,
  onOpenSubmitModal,
  onOpenDetailsModal,
}: MilestoneDashboardProps) {
  const { address } = useAccount();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const userAddr = address?.toLowerCase();

  const { clientCount, freelancerCount } = useMemo(() => {
    let c = 0;
    let f = 0;
    if (userAddr) {
      for (const m of milestones) {
        if (m.client.toLowerCase() === userAddr) c++;
        if (m.freelancer.toLowerCase() === userAddr) f++;
      }
    }
    return { clientCount: c, freelancerCount: f };
  }, [milestones, userAddr]);

  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (roleFilter === "client" && userAddr) {
        if (m.client.toLowerCase() !== userAddr) return false;
      } else if (roleFilter === "freelancer" && userAddr) {
        if (m.freelancer.toLowerCase() !== userAddr) return false;
      }

      if (statusFilter !== "all" && m.status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesId = m.id.toString() === q || `#${m.id}` === q;
        const matchesClient = m.client.toLowerCase().includes(q);
        const matchesFreelancer = m.freelancer.toLowerCase().includes(q);
        if (!matchesTitle && !matchesId && !matchesClient && !matchesFreelancer) {
          return false;
        }
      }

      return true;
    });
  }, [milestones, roleFilter, statusFilter, searchQuery, userAddr]);

  return (
    <div className="space-y-6">
      {/* Dashboard Top Navigation & Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Role Segment Tabs */}
        <div className="flex max-w-full items-center overflow-x-auto rounded-full border border-amber-500/25 bg-[#120D1B]/90 p-1 shadow-md">
          <button
            onClick={() => {
              dojoSfx.playSlash();
              setRoleFilter("all");
            }}
            className={`flex min-h-9 flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs sm:text-sm font-semibold transition-all ${
              roleFilter === "all"
                ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm"
                : "text-[#A99BB8] hover:text-amber-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Scrolls ({milestones.length})</span>
          </button>

          <button
            onClick={() => {
              dojoSfx.playSlash();
              setRoleFilter("client");
            }}
            className={`flex min-h-9 flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs sm:text-sm font-semibold transition-all ${
              roleFilter === "client"
                ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm"
                : "text-[#A99BB8] hover:text-amber-200"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>As Patron {userAddr ? `(${clientCount})` : ""}</span>
          </button>

          <button
            onClick={() => {
              dojoSfx.playSlash();
              setRoleFilter("freelancer");
            }}
            className={`flex min-h-9 flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs sm:text-sm font-semibold transition-all ${
              roleFilter === "freelancer"
                ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm"
                : "text-[#A99BB8] hover:text-amber-200"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>As Ronin {userAddr ? `(${freelancerCount})` : ""}</span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#A99BB8]" />
            <input
              type="text"
              placeholder="Search quest, #ID, or 0x..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-9 w-full rounded-full border border-amber-500/25 bg-[#120D1B]/90 px-9 pr-3 text-sm text-[#F6EFE0] placeholder:text-[#A99BB8]/70 shadow-sm transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/25"
            />
          </div>

          <button
            onClick={() => {
              dojoSfx.playSlash();
              onRefresh();
            }}
            title="Refresh milestones"
            className="flex min-h-9 min-w-9 items-center justify-center rounded-full border border-amber-500/25 bg-[#120D1B]/90 p-2 text-[#A99BB8] shadow-sm transition-all hover:bg-amber-500/15 hover:text-amber-200 hover:border-amber-400"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>

          <button
            onClick={() => {
              dojoSfx.playSlash();
              onOpenCreateModal();
            }}
            className="katana-btn flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-rose-600 to-amber-600 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>New Escrow</span>
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1 text-xs sm:text-sm">
        {(["all", "Funded", "Submitted", "Released", "Refunded"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => {
                dojoSfx.playSlash();
                setStatusFilter(status);
              }}
              className={`min-h-8 flex-none whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                statusFilter === status
                  ? "bg-amber-500/20 border border-amber-400 text-amber-200 shadow-glow-gold"
                  : "border border-amber-500/20 bg-[#120D1B]/80 text-[#A99BB8] hover:bg-amber-500/10 hover:text-[#F6EFE0]"
              }`}
            >
              {status === "all"
                ? "All Ranks"
                : status === "Funded"
                ? "Locked"
                : status === "Released"
                ? "Victory (Paid)"
                : status}
            </button>
          )
        )}
      </div>

      {/* Milestones Cards Grid */}
      {filteredMilestones.length === 0 ? (
        <EmptyState
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onOpenCreateModal={onOpenCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMilestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              onOpenSubmitModal={onOpenSubmitModal}
              onOpenDetailsModal={onOpenDetailsModal}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
