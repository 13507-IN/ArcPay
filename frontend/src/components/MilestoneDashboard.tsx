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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-full items-center overflow-x-auto rounded-full border border-[#27272F] bg-[#111114] p-1">
          <button
            onClick={() => {
              dojoSfx.playSlash();
              setRoleFilter("all");
            }}
            className={`flex min-h-9 flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs sm:text-sm font-bold transition-colors ${
              roleFilter === "all"
                ? "bg-[#C8925A] text-[#09090B]"
                : "text-[#8F8E94] hover:text-[#F4F1EA]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All ({milestones.length})</span>
          </button>

          <button
            onClick={() => {
              dojoSfx.playSlash();
              setRoleFilter("client");
            }}
            className={`flex min-h-9 flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs sm:text-sm font-bold transition-colors ${
              roleFilter === "client"
                ? "bg-[#C8925A] text-[#09090B]"
                : "text-[#8F8E94] hover:text-[#F4F1EA]"
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
            className={`flex min-h-9 flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs sm:text-sm font-bold transition-colors ${
              roleFilter === "freelancer"
                ? "bg-[#C8925A] text-[#09090B]"
                : "text-[#8F8E94] hover:text-[#F4F1EA]"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>As Ronin {userAddr ? `(${freelancerCount})` : ""}</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8F8E94]" />
            <input
              type="text"
              placeholder="Search title, #ID, or 0x..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-9 w-full rounded-full border border-[#27272F] bg-[#111114] px-9 pr-3 text-sm text-[#F4F1EA] placeholder:text-[#8F8E94] focus:border-[#C8925A] focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              dojoSfx.playSlash();
              onRefresh();
            }}
            title="Refresh milestones"
            className="flex min-h-9 min-w-9 items-center justify-center rounded-full border border-[#27272F] bg-[#111114] p-2 text-[#8F8E94] transition-colors hover:border-[#C8925A]/60 hover:text-[#F4F1EA]"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin text-[#C8925A]" : ""}`} />
          </button>

          <button
            onClick={() => {
              dojoSfx.playSlash();
              onOpenCreateModal();
            }}
            className="katana-btn flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#C8925A] hover:bg-[#D9A46D] px-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#09090B] transition-colors active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>New Escrow</span>
          </button>
        </div>
      </div>

      <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1 text-xs sm:text-sm">
        {(["all", "Funded", "Submitted", "Released", "Refunded"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => {
                dojoSfx.playSlash();
                setStatusFilter(status);
              }}
              className={`min-h-8 flex-none whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === status
                  ? "bg-[#C8925A]/15 border border-[#C8925A] text-[#C8925A]"
                  : "border border-[#27272F] bg-[#111114] text-[#8F8E94] hover:border-[#C8925A]/40 hover:text-[#F4F1EA]"
              }`}
            >
              {status === "all"
                ? "All Statuses"
                : status === "Funded"
                ? "Locked"
                : status}
            </button>
          )
        )}
      </div>

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
