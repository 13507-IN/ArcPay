"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { Coins } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { OverviewMetrics } from "@/components/OverviewMetrics";
import { MilestoneDashboard } from "@/components/MilestoneDashboard";
import { CreateMilestoneModal } from "@/components/CreateMilestoneModal";
import { SubmitWorkModal } from "@/components/SubmitWorkModal";
import { MilestoneDetailsModal } from "@/components/MilestoneDetailsModal";
import { fetchMilestones } from "@/lib/api";
import { Milestone, MilestoneStats } from "@/types";
import { ESCROW_CONTRACT_ADDRESS, ARC_MILESTONE_ESCROW_ABI } from "@/config/contracts";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<MilestoneStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitMilestone, setSubmitMilestone] = useState<Milestone | null>(null);
  const [selectedDetailsId, setSelectedDetailsId] = useState<number | null>(null);

  // Load milestones from backend API (with fallback to contract if backend is syncing)
  const loadMilestonesData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchMilestones(address);
      setMilestones(data.milestones || []);
      setStats(data.stats || null);
    } catch (err) {
      console.warn("Backend not yet indexed, reading directly from contract fallback:", err);
      // Fallback: Read directly from Arc Testnet contract if backend is offline/unreachable
      if (
        publicClient &&
        ESCROW_CONTRACT_ADDRESS &&
        ESCROW_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000"
      ) {
        try {
          const totalCount = await publicClient.readContract({
            address: ESCROW_CONTRACT_ADDRESS,
            abi: ARC_MILESTONE_ESCROW_ABI,
            functionName: "getMilestonesCount",
          });

          const count = Number(totalCount);
          if (count > 0) {
            const rawBatch = await publicClient.readContract({
              address: ESCROW_CONTRACT_ADDRESS,
              abi: ARC_MILESTONE_ESCROW_ABI,
              functionName: "getMilestones",
              args: [0n, BigInt(count)],
            });

            const statusMap = ["Funded", "Submitted", "Released", "Disputed", "Refunded"] as const;
            const mapped: Milestone[] = (rawBatch as any[]).map((m) => ({
              id: Number(m.id),
              client: m.client,
              freelancer: m.freelancer,
              amount: m.amount.toString(),
              title: m.title,
              deliverable_url: m.deliverableIpfsOrUrl,
              deadline: Number(m.deadline),
              status: statusMap[m.status] || "Funded",
              created_at: Number(m.createdAt),
              created_tx_hash: null,
              submitted_tx_hash: null,
              released_tx_hash: null,
              refunded_tx_hash: null,
            }));

            setMilestones(mapped);
          }
        } catch (contractErr) {
          console.error("Contract read fallback failed:", contractErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    loadMilestonesData();
    const interval = setInterval(loadMilestonesData, 6000);
    return () => clearInterval(interval);
  }, [loadMilestonesData]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Milestones
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Arc Testnet <span aria-hidden="true">·</span> Native USDC (18 decimals)
          </p>
        </section>

        {/* Overview Metrics Bar */}
        <section>
          <OverviewMetrics stats={stats} isLoading={isLoading} />
        </section>

        {/* Role-Filtered Milestone Dashboard */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white tracking-tight">
              Your milestones
            </h2>
            <span className="text-sm text-slate-300">
              Auto-refreshes every 6 seconds
            </span>
          </div>

          <MilestoneDashboard
            milestones={milestones}
            isLoading={isLoading}
            onRefresh={loadMilestonesData}
            onOpenCreateModal={() => setIsCreateOpen(true)}
            onOpenSubmitModal={(m) => setSubmitMilestone(m)}
            onOpenDetailsModal={(id) => setSelectedDetailsId(id)}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0B0F19] py-6 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-blue-500" />
            <span className="font-bold text-slate-300">ArcPay</span>
            <span>— Built for Circle Arc Layer-1 Testnet</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://rpc.testnet.arc.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              RPC: rpc.testnet.arc.io
            </a>
            <a
              href="https://explorer.testnet.arc.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Arc Explorer
            </a>
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Faucet
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateMilestoneModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          loadMilestonesData();
        }}
      />

      <SubmitWorkModal
        milestone={submitMilestone}
        isOpen={!!submitMilestone}
        onClose={() => setSubmitMilestone(null)}
        onSuccess={() => {
          loadMilestonesData();
        }}
      />

      <MilestoneDetailsModal
        milestoneId={selectedDetailsId}
        isOpen={selectedDetailsId !== null}
        onClose={() => setSelectedDetailsId(null)}
      />
    </div>
  );
}
