"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { Coins, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-[#FAF8FE] text-ink font-body flex flex-col selection:bg-lav-200 selection:text-ink">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                Escrow Dashboard
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-lav-100 px-3 py-1 text-xs font-semibold text-lav-700">
                <Sparkles className="h-3 w-3 text-lav-600" />
                Live on Arc
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              Circle Arc Testnet <span aria-hidden="true">·</span> Native 18-decimal USDC <span aria-hidden="true">·</span> Sub-second finality
            </p>
          </div>
        </section>

        {/* Overview Metrics Bar */}
        <section>
          <OverviewMetrics stats={stats} isLoading={isLoading} />
        </section>

        {/* Role-Filtered Milestone Dashboard */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink tracking-tight">
              Your milestones
            </h2>
            <span className="rounded-full bg-lav-100/70 px-3 py-1 text-xs font-medium text-ink-soft">
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
      <footer className="border-t border-lav-200/60 bg-white py-8 text-center text-xs text-ink-soft mt-12">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lav-600 text-white">
              <Coins className="h-3.5 w-3.5" />
            </span>
            <span className="font-semibold text-ink">ArcPay</span>
            <span>— Built for Circle Arc Layer-1 Testnet</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <a
              href="https://rpc.testnet.arc.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-soft transition-colors hover:text-lav-700"
            >
              RPC: rpc.testnet.arc.io
            </a>
            <span className="text-lav-200">·</span>
            <a
              href="https://explorer.testnet.arc.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-soft transition-colors hover:text-lav-700"
            >
              Arc Explorer
            </a>
            <span className="text-lav-200">·</span>
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-soft transition-colors hover:text-lav-700"
            >
              Circle Faucet
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
