"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { ShieldCheck, Briefcase, WifiOff, Swords } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { OverviewMetrics } from "@/components/OverviewMetrics";
import { MilestoneDashboard } from "@/components/MilestoneDashboard";
import { GigBoard } from "@/components/GigBoard";
import { CreateMilestoneModal } from "@/components/CreateMilestoneModal";
import { SubmitWorkModal } from "@/components/SubmitWorkModal";
import { MilestoneDetailsModal } from "@/components/MilestoneDetailsModal";
import { AnimeShadowBackground } from "@/components/landing/AnimeShadowBackground";
import { fetchMilestones, fetchGigs } from "@/lib/api";
import { computeStatsFromMilestones } from "@/lib/utils";
import { dojoSfx } from "@/lib/dojoSfx";
import { Milestone, MilestoneStats, Gig, EscrowPrefill } from "@/types";
import { ESCROW_CONTRACT_ADDRESS, ARC_MILESTONE_ESCROW_ABI } from "@/config/contracts";

export default function DashboardPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [activeTab, setActiveTab] = useState<"escrows" | "gigs">("escrows");

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<MilestoneStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);

  const [gigs, setGigs] = useState<Gig[]>([]);
  const [isGigsLoading, setIsGigsLoading] = useState(true);
  const [gigsError, setGigsError] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [escrowPrefill, setEscrowPrefill] = useState<EscrowPrefill | null>(null);
  const [submitMilestone, setSubmitMilestone] = useState<Milestone | null>(null);
  const [selectedDetailsId, setSelectedDetailsId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "gigs") {
        setActiveTab("gigs");
      }
    }
  }, []);

  const loadMilestonesData = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setIsLoading(true);
      const data = await fetchMilestones(address);
      setMilestones(data.milestones || []);
      setStats(data.stats || null);
      setBackendOnline(true);
    } catch (err) {
      setBackendOnline(false);
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
            const userAddr = address?.toLowerCase();
            const allMapped: Milestone[] = (rawBatch as any[])
              .map((m) => ({
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
              }))
              .sort((a, b) => b.id - a.id);

            const filtered = userAddr
              ? allMapped.filter(
                  (m) =>
                    m.client.toLowerCase() === userAddr ||
                    m.freelancer.toLowerCase() === userAddr
                )
              : allMapped;

            setMilestones(filtered);
            setStats(computeStatsFromMilestones(allMapped, address));
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
    } catch {
      setGigsError(
        "Could not load Open Bounty Board from backend API. Start or configure your ArcPay backend & MongoDB."
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
    <div className="relative min-h-screen bg-[#08050D] text-[#F6EFE0] font-body flex flex-col selection:bg-rose-600/40 selection:text-amber-100">
      {/* Persistent Shadow Fight 2 Atmospheric Twilight Dojo Canvas */}
      <AnimeShadowBackground />

      <div className="relative z-10 flex flex-col min-h-screen bg-[#08050D]/45">
        {/* Top Navbar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="mx-auto w-full max-w-[1480px] flex-1 space-y-8 px-6 py-8 sm:px-10 lg:px-16 xl:px-20">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-[#F6EFE0] uppercase">
                  {activeTab === "escrows" ? "Dojo Escrow Arena" : "Dojo Bounty Board"}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-300">
                  <Swords className="h-3.5 w-3.5 text-amber-400" />
                  Live on Arc
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-[#C7BBD4]">
                {activeTab === "escrows"
                  ? "Circle Arc Testnet · Native 18-decimal USDC · Sub-second Malachite finality"
                  : "Patrons post open quests · Ronin submit proposals · Instant 1-click USDC vault funding"}
              </p>
            </div>

            {/* Main Workspace Mode Switcher */}
            <div className="inline-flex self-start sm:self-auto items-center rounded-full border border-amber-500/30 bg-[#120D1B]/90 p-1 shadow-xl">
              <button
                onClick={() => {
                  dojoSfx.playSlash();
                  setActiveTab("escrows");
                }}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                  activeTab === "escrows"
                    ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-glow"
                    : "text-[#A99BB8] hover:text-amber-200"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Escrows ({milestones.length})</span>
              </button>

              <button
                onClick={() => {
                  dojoSfx.playSlash();
                  setActiveTab("gigs");
                }}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                  activeTab === "gigs"
                    ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-glow"
                    : "text-[#A99BB8] hover:text-amber-200"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                <span>Bounty Board</span>
                <span className="rounded-full bg-black/40 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  {openGigsCount}
                </span>
              </button>
            </div>
          </section>

          {!backendOnline && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-500/40 bg-amber-950/50 backdrop-blur-md px-4 py-3 text-xs text-amber-200 shadow-lg">
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  <strong className="text-amber-300">Direct On-Chain Mode:</strong> Backend API unreachable. Escrow lock, submit, and instant USDC payouts still work on Circle Arc; connect <code className="font-mono text-amber-100">NEXT_PUBLIC_API_URL</code> for Open Bounties, Briefs &amp; AI Audits.
                </span>
              </div>
            </div>
          )}

          {activeTab === "escrows" ? (
            <>
              <section>
                <OverviewMetrics stats={stats} isLoading={isLoading} />
              </section>

              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl font-bold text-[#F6EFE0] tracking-wide uppercase">
                    Active Escrow Scrolls
                  </h2>
                  <span className="rounded-full border border-amber-500/20 bg-[#120D1B]/80 px-3 py-1 text-xs font-semibold text-[#A99BB8]">
                    Auto-syncs every 10s
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
        <footer className="border-t border-amber-500/20 bg-[#08050D]/90 backdrop-blur-xl py-8 text-center text-xs text-[#A99BB8] mt-12">
          <div className="mx-auto max-w-[1480px] w-full px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-7 w-10 items-center justify-center rounded-lg bg-black border border-amber-500/40 p-0.5 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="ArcPay Logo"
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="font-display font-bold tracking-wider text-[#F6EFE0] uppercase">
                ArcPay
              </span>
              <span>— Shadow Dojo Escrow on Circle Arc Layer-1</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <a
                href="https://rpc.testnet.arc.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A99BB8] transition-colors hover:text-amber-300"
              >
                RPC: rpc.testnet.arc.io
              </a>
              <span className="text-amber-500/30">·</span>
              <a
                href="https://explorer.testnet.arc.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A99BB8] transition-colors hover:text-amber-300"
              >
                Arc Explorer
              </a>
              <span className="text-amber-500/30">·</span>
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A99BB8] transition-colors hover:text-amber-300"
              >
                Circle Faucet
              </a>
            </div>
          </div>
        </footer>
      </div>

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
        onAuditUpdated={() => loadMilestonesData(false)}
      />
    </div>
  );
}
