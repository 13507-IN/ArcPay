"use client";

import React, { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import {
  Filter,
  Search,
  RotateCw,
  Plus,
  Briefcase,
  UserCheck,
  CheckCircle2,
  Clock,
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
        <div className="flex max-w-full items-center overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-1">
          <button
            onClick={() => setRoleFilter("all")}
            className={`flex min-h-10 flex-none items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-semibold transition-colors ${
              roleFilter === "all"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All ({milestones.length})</span>
          </button>

          <button
            onClick={() => setRoleFilter("client")}
            className={`flex min-h-10 flex-none items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-semibold transition-colors ${
              roleFilter === "client"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>As Client {userAddr ? `(${clientCount})` : ""}</span>
          </button>

          <button
            onClick={() => setRoleFilter("freelancer")}
            className={`flex min-h-10 flex-none items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-semibold transition-colors ${
              roleFilter === "freelancer"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>As Freelancer {userAddr ? `(${freelancerCount})` : ""}</span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by title, #ID, or 0x..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-9 pr-3 text-sm text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={onRefresh}
            title="Refresh milestones"
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-md bg-blue-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Escrow</span>
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1 text-sm">
        {(["all", "Funded", "Submitted", "Released", "Refunded"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`min-h-10 flex-none whitespace-nowrap rounded-md px-3 py-2 font-medium transition-colors ${
                statusFilter === status
                  ? "bg-slate-800 text-blue-400 border border-blue-500/40"
                  : "bg-slate-900/50 text-slate-400 border border-slate-800/80 hover:text-slate-200"
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
