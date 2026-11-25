"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { Sparkles, ShieldCheck, Briefcase } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { OverviewMetrics } from "@/components/OverviewMetrics";
import { MilestoneDashboard } from "@/components/MilestoneDashboard";
import { GigBoard } from "@/components/GigBoard";
import { CreateMilestoneModal } from "@/components/CreateMilestoneModal";
import { SubmitWorkModal } from "@/components/SubmitWorkModal";
import { MilestoneDetailsModal } from "@/components/MilestoneDetailsModal";
import { fetchMilestones, fetchGigs } from "@/lib/api";
import { Milestone, MilestoneStats, Gig, EscrowPrefill } from "@/types";
import { ESCROW_CONTRACT_ADDRESS, ARC_MILESTONE_ESCROW_ABI } from "@/config/contracts";

export default function DashboardPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [activeTab, setActiveTab] = useState<"escrows" | "gigs">("escrows");

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<MilestoneStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [gigs, setGigs] = useState<Gig[]>([]);
  const [isGigsLoading, setIsGigsLoading] = useState(true);
  const [gigsError, setGigsError] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [escrowPrefill, setEscrowPrefill] = useState<EscrowPrefill | null>(null);
  const [submitMilestone, setSubmitMilestone] = useState<Milestone | null>(null);
  const [selectedDetailsId, setSelectedDetailsId] = useState<number | null>(null);

  // Check ?tab=gigs query param on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "gigs") {
        setActiveTab("gigs");
      }
    }
  }, []);

  // Load milestones from backend API (with fallback to contract if backend is syncing)
  const loadMilestonesData = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setIsLoading(true);
      const data = await fetchMilestones(address);
      setMilestones(data.milestones || []);
      setStats(data.stats || null);
    } catch (err) {
      console.warn("Backend not yet indexed, reading directly from contract fallback:", err);
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

  const loadGigsData = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setIsGigsLoading(true);
      setGigsError(null);
      const list = await fetchGigs({ status: "all" });
      setGigs(list);
    } catch (err: any) {
      setGigsError(
        "Could not load open gigs from backend API. Make sure the ArcPay backend server is running and connected to MongoDB."
      );
    } finally {
      setIsGigsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMilestonesData(true);
    loadGigsData(true);
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      loadMilestonesData(false);
      loadGigsData(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [loadMilestonesData, loadGigsData]);

  const openGigsCount = gigs.filter((g) => g.status === "Open").length;

  const handleOpenFundFromGig = (prefill: EscrowPrefill) => {
    setEscrowPrefill(prefill);
    setIsCreateOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8FE] text-ink font-body flex flex-col selection:bg-lav-200 selection:text-ink">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-[1480px] flex-1 space-y-8 px-6 py-8 sm:px-10 lg:px-16 xl:px-20">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                {activeTab === "escrows" ? "Escrow Dashboard" : "Open Gig Board"}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-lav-100 px-3 py-1 text-xs font-semibold text-lav-700">
                <Sparkles className="h-3 w-3 text-lav-600" />
                Live on Arc
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {activeTab === "escrows"
                ? "Circle Arc Testnet · Native 18-decimal USDC · Sub-second finality"
                : "Clients post open work · Freelancers apply with pitches · One-click USDC escrow funding"}
            </p>
          </div>

          {/* Main Workspace Mode Switcher */}
          <div className="inline-flex self-start sm:self-auto items-center rounded-full border border-lav-200 bg-lav-100/70 p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("escrows")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "escrows"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-lav-600" />
              <span>Escrows ({milestones.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("gigs")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "gigs"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Briefcase className="h-4 w-4 text-lav-600" />
              <span>Open Gig Board</span>
              <span className="rounded-full bg-lav-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {openGigsCount}
              </span>
            </button>
          </div>
        </section>

        {activeTab === "escrows" ? (
          <>
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
                  Auto-refreshes every 10 seconds
                </span>
              </div>

              <MilestoneDashboard
                milestones={milestones}
                isLoading={isLoading}
                onRefresh={() => loadMilestonesData(true)}
                onOpenCreateModal={() => {
                  setEscrowPrefill(null);
                  setIsCreateOpen(true);
                }}
                onOpenSubmitModal={(m) => setSubmitMilestone(m)}
                onOpenDetailsModal={(id) => setSelectedDetailsId(id)}
              />
            </section>
          </>
        ) : (
          <section>
            <GigBoard
              gigs={gigs}
              isLoading={isGigsLoading}
              errorMsg={gigsError}
              onRefresh={() => loadGigsData(true)}
              onGigsChanged={setGigs}
              onFundEscrow={handleOpenFundFromGig}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-lav-200/60 bg-white py-8 text-center text-xs text-ink-soft mt-12">
        <div className="mx-auto max-w-[1480px] w-full px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="flex h-7 w-10 items-center justify-center rounded-lg bg-black border border-lav-200/80 p-0.5 overflow-hidden">
              <img
                src="/logo.png"
                alt="ArcPay Logo"
                className="h-full w-full object-contain"
              />
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
        prefill={escrowPrefill}
        onClose={() => {
          setIsCreateOpen(false);
          setEscrowPrefill(null);
        }}
        onSuccess={() => {
          loadMilestonesData(false);
          loadGigsData(false);
        }}
      />

      <SubmitWorkModal
        milestone={submitMilestone}
        isOpen={!!submitMilestone}
        onClose={() => setSubmitMilestone(null)}
        onSuccess={() => {
          loadMilestonesData(false);
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
