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

  // Role Counts
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

  // Filtered Milestones
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      // Role filter
      if (roleFilter === "client" && userAddr) {
        if (m.client.toLowerCase() !== userAddr) return false;
      } else if (roleFilter === "freelancer" && userAddr) {
        if (m.freelancer.toLowerCase() !== userAddr) return false;
      }

      // Status filter
      if (statusFilter !== "all" && m.status !== statusFilter) {
        return false;
      }

      // Search query
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
        <div className="flex max-w-full items-center overflow-x-auto rounded-full border border-lav-200 bg-lav-100/60 p-1 shadow-sm">
          <button
            onClick={() => setRoleFilter("all")}
            className={`flex min-h-9 flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs sm:text-sm font-semibold transition-all ${
              roleFilter === "all"
                ? "bg-white text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-lav-600" />
            <span>All ({milestones.length})</span>
          </button>

          <button
            onClick={() => setRoleFilter("client")}
            className={`flex min-h-9 flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs sm:text-sm font-semibold transition-all ${
              roleFilter === "client"
                ? "bg-white text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5 text-lav-600" />
            <span>As Client {userAddr ? `(${clientCount})` : ""}</span>
          </button>

          <button
            onClick={() => setRoleFilter("freelancer")}
            className={`flex min-h-9 flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs sm:text-sm font-semibold transition-all ${
              roleFilter === "freelancer"
                ? "bg-white text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 text-lav-600" />
            <span>As Freelancer {userAddr ? `(${freelancerCount})` : ""}</span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-ink-soft/60" />
            <input
              type="text"
              placeholder="Search title, #ID, or 0x..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-9 w-full rounded-full border border-lav-200 bg-white px-9 pr-3 text-sm text-ink placeholder:text-ink-soft/60 shadow-sm transition-colors focus:border-lav-500 focus:outline-none focus:ring-2 focus:ring-lav-200"
            />
          </div>

          <button
            onClick={onRefresh}
            title="Refresh milestones"
            className="flex min-h-9 min-w-9 items-center justify-center rounded-full border border-lav-200 bg-white p-2 text-ink-soft shadow-sm transition-all hover:bg-lav-50 hover:text-ink hover:border-lav-300"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin text-lav-600" : ""}`} />
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-lav-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-lav-700 active:scale-[0.98]"
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
              onClick={() => setStatusFilter(status)}
              className={`min-h-8 flex-none whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === status
                  ? "bg-lav-600 text-white shadow-sm"
                  : "border border-lav-200/80 bg-white text-ink-soft hover:bg-lav-50 hover:text-ink"
              }`}
            >
              {status === "all" ? "All Statuses" : status}
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
