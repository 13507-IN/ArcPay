import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Sparkles,
  Swords,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { MilestoneDemo } from "@/components/landing/MilestoneDemo";
import { AnimeShadowBackground } from "@/components/landing/AnimeShadowBackground";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { DojoAudioButton } from "@/components/DojoAudioButton";
import { DuelArenaSvg, CrossedKatanaSvg } from "@/components/DojoGraphics";

const steps = [
  {
    act: "Act I",
    title: "Seal the Vault (Fund)",
    body: "The Patron locks USDC directly inside the on-chain Circle Arc smart contract. Funds sit immutably on-chain — never custodied by ArcPay.",
  },
  {
    act: "Act II",
    title: "Deliver & Audit (Submit)",
    body: "The Ronin submits a GitHub repo, PR, Figma canvas, deployment, or IPFS hash. Our AI Deliverable Oracle inspects live code & scope alignment.",
  },
  {
    act: "Act III",
    title: "Strike & Settle (Release)",
    body: "Once approved, native 18-decimal USDC settles straight to the builder's wallet with <1s Malachite BFT finality.",
  },
];

const clientPoints = [
  "Lock bounty USDC, deadline, and Ronin address in one signed strike.",
  "Post Open Gigs on the Dojo Bounty Board to attract competitive builders.",
  "Reclaim locked funds automatically if the deadline passes unsubmitted.",
];

const freelancerPoints = [
  "Verify on-chain vault liquidity before drawing a single line of code.",
  "Apply to Open Gigs with proposals or submit live repo proof scrolls.",
  "Receive instant native USDC settlement upon approval.",
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-transparent font-body text-[#F6EFE0] selection:bg-rose-600/40">
      <ScrollReveal />
      {/* Interactive Shadow Fight 2 Twilight Canvas with Dueling Silhouettes & Katana Slash Sparks */}
      <AnimeShadowBackground />

      <header className="sticky top-0 z-40 bg-[#09060E]/75 backdrop-blur-xl border-b border-amber-500/20 shadow-lg shadow-black/40">
        <div className="mx-auto flex h-20 max-w-[1480px] w-full items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-20">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="flex h-10 w-14 items-center justify-center rounded-xl bg-black border border-amber-500/40 p-1 shadow-glow-gold transition-transform group-hover:scale-105 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="ArcPay Logo"
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="font-display text-lg font-bold tracking-wider text-[#F6EFE0] uppercase">
                ArcPay
              </span>
            </Link>
            <div className="hidden sm:inline-block">
              <NetworkSwitcher variant="dark" />
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-semibold uppercase tracking-wider text-[#C7BBD4] md:flex">
            <a href="#how" className="transition-colors hover:text-amber-300">
              Three Acts
            </a>
            <a href="#network" className="transition-colors hover:text-amber-300">
              Arena L1
            </a>
            <a href="#teams" className="transition-colors hover:text-amber-300">
              Duelists
            </a>
            <Link
              href="/dashboard?tab=gigs"
              className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Bounty Board</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <DojoAudioButton />
            <Link
              href="/dashboard"
              className="katana-btn inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-glow transition-all hover:scale-105 hover:brightness-110 active:scale-95"
            >
              <span>Enter Dojo</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="bg-transparent">
          <div className="mx-auto grid max-w-[1480px] w-full gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:px-16 xl:px-20 lg:pb-28 lg:pt-16">
            <div className="max-w-3xl">
              <div className="landing-rise inline-flex items-center gap-2 rounded-full bg-[#161022]/85 border border-amber-500/35 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300 backdrop-blur-md mb-6 shadow-glow-gold">
                <CrossedKatanaSvg className="h-3.5 w-3.5 text-rose-400" />
                <span>Shadow Dojo Escrow · AI Audit · Circle Arc L1</span>
              </div>

              <h1 className="landing-rise font-display text-4xl font-extrabold leading-[1.03] tracking-tight text-[#F6EFE0] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] sm:text-6xl lg:text-7xl uppercase">
                Honor Every Contract.{" "}
                <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-rose-500 bg-clip-text text-transparent">
                  Settle in &lt;1s.
                </span>
              </h1>

              <p className="landing-rise landing-rise-1 mt-6 max-w-2xl text-base sm:text-xl leading-relaxed text-[#E4DAF0]">
                ArcPay fuses{" "}
                <strong className="text-amber-300 font-semibold">
                  trustless USDC milestone vaults
                </strong>{" "}
                with an adversarial{" "}
                <strong className="text-rose-300 font-semibold">
                  AI Code &amp; Deliverable Oracle
                </strong>{" "}
                and an Open Bounty Board — forged on Circle&rsquo;s Arc Layer-1.
              </p>

              {/* Inline Shadow Duelist Arena SVG */}
              <div className="landing-rise landing-rise-1 mt-6 max-w-xl rounded-2xl border border-amber-500/20 bg-[#0D0815]/70 p-2 backdrop-blur-md shadow-xl">
                <DuelArenaSvg className="w-full h-24 sm:h-28" />
              </div>

              <div className="landing-rise landing-rise-2 mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/dashboard"
                  className="katana-btn inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-glow transition-all hover:scale-105 hover:brightness-110 active:scale-95"
                >
                  <Swords className="h-4 w-4" aria-hidden="true" />
                  <span>Enter Escrow Dojo</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <Link
                  href="/dashboard?tab=gigs"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-amber-200 bg-[#140D20]/85 backdrop-blur-md border border-amber-500/35 shadow-sm transition-all hover:bg-amber-500/20 hover:border-amber-400"
                >
                  <Briefcase className="h-4 w-4 text-amber-400" />
                  <span>Browse Open Gigs</span>
                </Link>
              </div>

              <p className="landing-rise landing-rise-3 mt-7 text-xs font-semibold uppercase tracking-widest text-amber-200/75">
                Tip: Click anywhere in the twilight sky to unleash a Katana Wind Slash · Native 18-dec USDC
              </p>
            </div>

            <div className="landing-rise landing-rise-2">
              <div className="dojo-card p-3 sm:p-5 lg:p-6">
                <MilestoneDemo />
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS / THREE ACTS */}
        <section
          id="how"
          className="bg-[#0B0812]/82 backdrop-blur-xl border-t border-amber-500/20"
        >
          <div className="mx-auto max-w-[1480px] w-full px-6 py-24 sm:px-10 lg:px-16 xl:px-20 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-amber-400">
                  The Way of Escrow
                </span>
                <h2 className="reveal mt-2 font-display text-4xl font-bold leading-tight tracking-wide text-[#F6EFE0] sm:text-5xl">
                  Three Strikes, One Immutable Scroll.
                </h2>
                <p className="reveal mt-5 max-w-md text-base sm:text-lg leading-relaxed text-[#C7BBD4]">
                  Every contract follows a strict martial code. Funds remain
                  locked and visible on-chain until work passes inspection.
                </p>

                <div
                  data-ui
                  className="reveal dojo-card mt-8 max-w-md p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Scroll Battle Log
                    </p>
                    <p className="text-xs font-mono text-[#A99BB8]">Chain 5042002</p>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm">
                    <li className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[#F6EFE0]">
                        <span
                          className="h-2 w-2 rounded-full bg-rose-500"
                          aria-hidden="true"
                        />
                        Vault Sealed
                      </span>
                      <span className="font-mono font-bold tabular-nums text-amber-300">
                        2,400.00 USDC
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[#F6EFE0]">
                        <span
                          className="h-2 w-2 rounded-full bg-amber-400"
                          aria-hidden="true"
                        />
                        AI Oracle Checked
                      </span>
                      <span className="font-mono text-xs text-emerald-400">
                        github.com/pr/42
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[#F6EFE0]">
                        <span
                          className="h-2 w-2 rounded-full bg-emerald-400"
                          aria-hidden="true"
                        />
                        Victory Payout
                      </span>
                      <span className="font-mono tabular-nums text-[#A99BB8]">
                        0x4c9d…8e04
                      </span>
                    </li>
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-amber-500/20 pt-3 text-xs font-semibold uppercase tracking-wider">
                    <span className="text-[#A99BB8]">Finality Speed</span>
                    <span className="text-emerald-400">0.8s Deterministic</span>
                  </div>
                </div>
              </div>

              <div className="relative space-y-12 pl-8">
                <span
                  className="absolute bottom-2 left-[7px] top-2 w-[3px] rounded-full bg-gradient-to-b from-rose-600 via-amber-500 to-emerald-500"
                  aria-hidden="true"
                />
                {steps.map((step) => (
                  <div
                    key={step.title}
                    className="reveal dojo-card p-6 relative"
                  >
                    <span
                      className="absolute -left-10 top-7 h-4 w-4 rounded-full bg-amber-400 ring-4 ring-[#0B0812] shadow-glow-gold"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-rose-400">
                      {step.act}
                    </span>
                    <h3 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-wide text-[#F6EFE0]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-[#C7BBD4]">
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CIRCLE ARC ARENA SPECS */}
        <section
          id="network"
          className="bg-[#120D1B]/85 backdrop-blur-xl border-t border-amber-500/20"
        >
          <div className="mx-auto max-w-[1480px] w-full px-6 py-24 sm:px-10 lg:px-16 xl:px-20 lg:py-28">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-rose-400">
                Arena Infrastructure
              </span>
              <h2 className="reveal mt-2 font-display text-4xl font-bold leading-tight tracking-wide text-[#F6EFE0] sm:text-5xl">
                Forged on Circle Arc Layer-1.
              </h2>
              <p className="reveal mt-5 text-base sm:text-lg leading-relaxed text-[#C7BBD4]">
                Arc is Circle&rsquo;s native Layer-1 for instant USDC liquidity.
                Zero bridges, zero wrapped tokens, zero waiting on clearinghouses.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-3 lg:gap-8">
              <div className="reveal dojo-card p-7">
                <p className="font-display text-4xl font-extrabold tracking-tight text-amber-300">
                  &lt;1s
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#C7BBD4]">
                  Malachite BFT settles every milestone strike deterministically.
                </p>
              </div>
              <div className="reveal dojo-card p-7">
                <p className="font-display text-4xl font-extrabold tracking-tight text-rose-400">
                  18-DEC
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#C7BBD4]">
                  Native USDC powers both gas and bounty payouts seamlessly.
                </p>
              </div>
              <div className="reveal dojo-card p-7">
                <p className="font-display text-4xl font-extrabold tracking-tight text-emerald-400 tabular-nums">
                  5042002
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#C7BBD4]">
                  Circle Arc Testnet Arena, open today for Patrons &amp; Ronin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DUAL ROLES: PATRON vs RONIN */}
        <section
          id="teams"
          className="bg-[#0B0812]/82 backdrop-blur-xl border-t border-amber-500/20"
        >
          <div className="mx-auto max-w-[1480px] w-full px-6 py-24 sm:px-10 lg:px-16 xl:px-20 lg:py-28">
            <h2 className="reveal max-w-2xl font-display text-4xl font-bold leading-tight tracking-wide text-[#F6EFE0] sm:text-5xl">
              One Smart Contract. Both Sides Protected.
            </h2>

            <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-14">
              {/* Patron Card */}
              <div className="reveal dojo-card p-7 sm:p-9 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-rose-500/15 border border-rose-500/40 px-3 py-1 text-xs font-bold uppercase tracking-widest text-rose-300">
                    For Patrons (Clients)
                  </span>
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                </div>
                <p className="text-base sm:text-lg leading-relaxed text-[#E4DAF0]">
                  Fund bounties with an enforceable deadline and AI-assisted
                  deliverable verification before releasing USDC.
                </p>
                <ul className="space-y-3 text-sm sm:text-base text-[#C7BBD4]">
                  {clientPoints.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span
                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-rose-500"
                        aria-hidden="true"
                      />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-2xl border border-amber-500/25 bg-[#0D0914] p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Escrow Summon Scroll
                  </p>
                  <div className="mt-3 space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between rounded-xl bg-[#161022] px-4 py-2.5">
                      <span className="text-[#A99BB8]">Quest</span>
                      <span className="font-semibold text-[#F6EFE0]">
                        Smart Contract Audit
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-[#161022] px-4 py-2.5">
                      <span className="text-[#A99BB8]">Vault Stake</span>
                      <span className="font-mono font-bold tabular-nums text-amber-300">
                        2,400.00 USDC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ronin Card */}
              <div className="reveal dojo-card p-7 sm:p-9 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/40 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
                    For Ronin (Freelancers)
                  </span>
                  <Swords className="h-5 w-5 text-rose-400" />
                </div>
                <p className="text-base sm:text-lg leading-relaxed text-[#E4DAF0]">
                  Verify the locked USDC stake on-chain before you write a line
                  of code — and claim instant payout on approval.
                </p>
                <ul className="space-y-3 text-sm sm:text-base text-[#C7BBD4]">
                  {freelancerPoints.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span
                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-400"
                        aria-hidden="true"
                      />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-2xl border border-emerald-500/30 bg-[#0D0914] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Victory Settlement
                    </p>
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[#F6EFE0] tabular-nums">
                    2,400.00{" "}
                    <span className="text-sm font-medium text-amber-300">USDC</span>
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-[#A99BB8]">
                    <span>Ronin 0x4c9d…8e04</span>
                    <span className="font-semibold text-emerald-400">0.8s · Arc</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA BANNER */}
        <section className="bg-gradient-to-r from-[#2D0B1E]/95 via-[#180E25]/95 to-[#2D1A09]/95 border-t border-amber-500/30 backdrop-blur-xl">
          <div className="mx-auto max-w-[1480px] w-full px-6 py-20 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-400">
                  Ready for Battle
                </p>
                <h2 className="reveal mt-2 font-display text-3xl font-bold leading-tight tracking-wide text-[#F6EFE0] sm:text-5xl">
                  Seal Your Next Bounty in the ArcPay Dojo.
                </h2>
              </div>
              <div className="reveal sm:justify-self-end sm:text-right">
                <Link
                  href="/dashboard"
                  className="katana-btn inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-glow transition hover:scale-105"
                >
                  <span>Enter Dojo</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber-200/80">
                  Free Testnet USDC from Circle Faucet · Arc Chain 5042002
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 bg-[#08050D]/95 backdrop-blur-xl border-t border-amber-500/20">
        <div className="mx-auto max-w-[1480px] w-full px-6 py-14 sm:px-10 lg:px-16 xl:px-20">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-3 font-display text-2xl font-bold tracking-wider text-[#F6EFE0] uppercase group"
              >
                <span className="flex h-10 w-14 items-center justify-center rounded-xl bg-black border border-amber-500/40 p-1 shadow-glow-gold transition-transform group-hover:scale-105 overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="ArcPay Logo"
                    className="h-full w-full object-contain"
                  />
                </span>
                <span>ArcPay</span>
              </Link>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#A99BB8]">
                Shadow Dojo milestone escrow, AI Deliverable Oracle &amp; Open
                Bounty Board on Circle&rsquo;s Arc Layer-1.
              </p>
            </div>

            <nav className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm font-medium text-[#A99BB8] sm:grid-cols-3">
              <Link href="/dashboard" className="transition-colors hover:text-amber-300">
                Escrow Dojo
              </Link>
              <Link href="/dashboard?tab=gigs" className="transition-colors hover:text-amber-300">
                Bounty Board
              </Link>
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-amber-300"
              >
                Circle Faucet
              </a>
              <a
                href="https://explorer.testnet.arc.io"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-amber-300"
              >
                Arc Explorer
              </a>
              <a
                href="https://rpc.testnet.arc.io"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-amber-300"
              >
                Arc RPC
              </a>
            </nav>
          </div>

          <p className="mt-10 text-xs uppercase tracking-widest text-[#7E708F]">
            © 2026 ArcPay · Forged on Circle Arc Testnet
          </p>
        </div>
      </footer>
    </div>
  );
}
