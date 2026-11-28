import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
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
    title: "Seal the Vault",
    body: "The Patron locks USDC directly inside the on-chain Circle Arc smart contract. Funds remain verifiable on-chain — never custodied by ArcPay.",
  },
  {
    act: "Act II",
    title: "Deliver & Audit",
    body: "The Ronin submits a GitHub repo, PR, Figma file, or IPFS hash. Our AI Deliverable Oracle inspects live code and checks scope alignment.",
  },
  {
    act: "Act III",
    title: "Settle in <1s",
    body: "Upon approval, native 18-decimal USDC transfers directly to the builder's wallet with deterministic Malachite BFT finality.",
  },
];

const clientPoints = [
  "Lock bounty USDC, deadline, and builder wallet in one transaction.",
  "Post Open Gigs on the Bounty Board to review competitive proposals.",
  "Reclaim locked funds if the deadline passes with no submission.",
];

const freelancerPoints = [
  "Confirm locked vault funds on-chain before writing any code.",
  "Submit GitHub repos, PRs, deployments, or IPFS hashes as proof.",
  "Receive instant native USDC settlement upon approval.",
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-transparent font-body text-[#F4F1EA] selection:bg-[#C8925A]/30">
      <ScrollReveal />
      <AnimeShadowBackground />

      <header className="sticky top-0 z-40 bg-[#09090B]/85 backdrop-blur-md border-b border-[#27272F]">
        <div className="mx-auto flex h-20 max-w-[1480px] w-full items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-20">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="flex h-10 w-14 items-center justify-center rounded-xl bg-black border border-[#27272F] group-hover:border-[#C8925A]/60 p-1 transition-colors overflow-hidden">
                <img
                  src="/logo.png"
                  alt="ArcPay Logo"
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="font-display text-lg font-bold tracking-wider text-[#F4F1EA] uppercase">
                ArcPay
              </span>
            </Link>
            <div className="hidden sm:inline-block">
              <NetworkSwitcher variant="dark" />
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-semibold uppercase tracking-wider text-[#8F8E94] md:flex">
            <a href="#how" className="transition-colors hover:text-[#C8925A]">
              How It Works
            </a>
            <a href="#network" className="transition-colors hover:text-[#C8925A]">
              Circle Arc
            </a>
            <a href="#teams" className="transition-colors hover:text-[#C8925A]">
              Duelists
            </a>
            <Link
              href="/dashboard?tab=gigs"
              className="inline-flex items-center gap-1.5 text-[#C8925A] hover:text-[#D9A46D] transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Bounty Board</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <DojoAudioButton />
            <Link
              href="/dashboard"
              className="katana-btn inline-flex items-center gap-1.5 rounded-full bg-[#C8925A] hover:bg-[#D9A46D] px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#09090B] transition-colors active:scale-95"
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
              <div className="landing-rise inline-flex items-center gap-2 rounded-full bg-[#111114]/90 border border-[#C8925A]/35 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#C8925A] mb-6">
                <CrossedKatanaSvg className="h-3.5 w-3.5" />
                <span>Shadow Dojo Escrow · AI Audit · Circle Arc L1</span>
              </div>

              <h1 className="landing-rise font-display text-4xl font-extrabold leading-[1.04] tracking-tight text-[#F4F1EA] sm:text-6xl lg:text-7xl uppercase">
                Honor Every Contract.{" "}
                <span className="text-[#C8925A]">Settle in &lt;1s.</span>
              </h1>

              <p className="landing-rise landing-rise-1 mt-6 max-w-2xl text-base sm:text-xl leading-relaxed text-[#C8C4BC]">
                ArcPay combines trustless USDC milestone vaults with a live AI
                Deliverable Oracle and an Open Bounty Board — forged directly on
                Circle&rsquo;s Arc Layer-1.
              </p>

              {/* Monochrome Obsidian + Bronze Duelist Arena SVG */}
              <div className="landing-rise landing-rise-1 mt-6 max-w-xl rounded-2xl border border-[#27272F] bg-[#111114]/85 p-2">
                <DuelArenaSvg className="w-full h-24 sm:h-28" />
              </div>

              <div className="landing-rise landing-rise-2 mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/dashboard"
                  className="katana-btn inline-flex items-center gap-2 rounded-full bg-[#C8925A] hover:bg-[#D9A46D] px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-[#09090B] shadow-glow transition-colors active:scale-95"
                >
                  <Swords className="h-4 w-4" aria-hidden="true" />
                  <span>Enter Escrow Dojo</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <Link
                  href="/dashboard?tab=gigs"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-[#F4F1EA] bg-[#111114]/90 border border-[#27272F] hover:border-[#C8925A]/60 transition-colors"
                >
                  <Briefcase className="h-4 w-4 text-[#C8925A]" />
                  <span>Browse Open Gigs</span>
                </Link>
              </div>

              <p className="landing-rise landing-rise-3 mt-7 text-xs font-semibold uppercase tracking-widest text-[#8F8E94]">
                Circle Arc Testnet · Chain 5042002 · Native 18-decimal USDC
              </p>
            </div>

            <div className="landing-rise landing-rise-2">
              <div className="dojo-card p-3 sm:p-5">
                <MilestoneDemo />
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how"
          className="bg-[#09090B]/95 backdrop-blur-md border-t border-[#27272F]"
        >
          <div className="mx-auto max-w-[1480px] w-full px-6 py-24 sm:px-10 lg:px-16 xl:px-20 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#C8925A]">
                  The Way of Escrow
                </span>
                <h2 className="reveal mt-2 font-display text-4xl font-bold leading-tight tracking-wide text-[#F4F1EA] sm:text-5xl">
                  Three Strikes, One Immutable Scroll.
                </h2>
                <p className="reveal mt-5 max-w-md text-base sm:text-lg leading-relaxed text-[#8F8E94]">
                  Every contract follows one clear path. Locked funds stay
                  visible on-chain until work clears audit.
                </p>

                <div data-ui className="reveal dojo-card mt-8 max-w-md p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#C8925A]">
                      Ledger Record
                    </p>
                    <p className="text-xs font-mono text-[#8F8E94]">Chain 5042002</p>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm">
                    <li className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[#F4F1EA]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C8925A]" aria-hidden="true" />
                        Vault Sealed
                      </span>
                      <span className="font-mono font-bold tabular-nums text-[#C8925A]">
                        2,400.00 USDC
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[#F4F1EA]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C8925A]" aria-hidden="true" />
                        AI Oracle Verified
                      </span>
                      <span className="font-mono text-xs text-[#8F8E94]">
                        github.com/pr/42
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[#F4F1EA]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F4F1EA]" aria-hidden="true" />
                        Released
                      </span>
                      <span className="font-mono tabular-nums text-[#8F8E94]">
                        0x4c9d…8e04
                      </span>
                    </li>
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-[#27272F] pt-3 text-xs font-semibold uppercase tracking-wider">
                    <span className="text-[#8F8E94]">Finality</span>
                    <span className="text-[#C8925A]">0.8s Deterministic</span>
                  </div>
                </div>
              </div>

              <div className="relative space-y-10 pl-8">
                <span
                  className="absolute bottom-2 left-[7px] top-2 w-[2px] rounded-full bg-[#27272F]"
                  aria-hidden="true"
                />
                {steps.map((step) => (
                  <div key={step.title} className="reveal dojo-card p-6 relative">
                    <span
                      className="absolute -left-10 top-7 h-3.5 w-3.5 rounded-full bg-[#C8925A] ring-4 ring-[#09090B]"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8925A]">
                      {step.act}
                    </span>
                    <h3 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-wide text-[#F4F1EA]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-[#8F8E94]">
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CIRCLE ARC NETWORK SPECS */}
        <section
          id="network"
          className="bg-[#111114]/95 backdrop-blur-md border-t border-[#27272F]"
        >
          <div className="mx-auto max-w-[1480px] w-full px-6 py-24 sm:px-10 lg:px-16 xl:px-20 lg:py-28">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#C8925A]">
                Infrastructure
              </span>
              <h2 className="reveal mt-2 font-display text-4xl font-bold leading-tight tracking-wide text-[#F4F1EA] sm:text-5xl">
                Forged on Circle Arc Layer-1.
              </h2>
              <p className="reveal mt-5 text-base sm:text-lg leading-relaxed text-[#8F8E94]">
                Arc is Circle&rsquo;s Layer-1 for programmable money movement.
                No bridges, no wrapped assets, no clearing delays.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-3 lg:gap-8">
              <div className="reveal dojo-card p-7">
                <p className="font-display text-4xl font-extrabold tracking-tight text-[#C8925A]">
                  &lt;1s
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#8F8E94]">
                  Malachite BFT settles every milestone payout deterministically.
                </p>
              </div>
              <div className="reveal dojo-card p-7">
                <p className="font-display text-4xl font-extrabold tracking-tight text-[#F4F1EA]">
                  18-DEC
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#8F8E94]">
                  Native USDC powers both transaction gas and bounty payouts.
                </p>
              </div>
              <div className="reveal dojo-card p-7">
                <p className="font-display text-4xl font-extrabold tracking-tight text-[#C8925A] tabular-nums">
                  5042002
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#8F8E94]">
                  Circle Arc Testnet, live today for global teams and builders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DUAL ROLES */}
        <section
          id="teams"
          className="bg-[#09090B]/95 backdrop-blur-md border-t border-[#27272F]"
        >
          <div className="mx-auto max-w-[1480px] w-full px-6 py-24 sm:px-10 lg:px-16 xl:px-20 lg:py-28">
            <h2 className="reveal max-w-2xl font-display text-4xl font-bold leading-tight tracking-wide text-[#F4F1EA] sm:text-5xl">
              One Contract. Both Sides Protected.
            </h2>

            <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-14">
              <div className="reveal dojo-card p-7 sm:p-9 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#C8925A]/15 border border-[#C8925A]/35 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#C8925A]">
                    For Patrons (Clients)
                  </span>
                  <ShieldCheck className="h-5 w-5 text-[#C8925A]" />
                </div>
                <p className="text-base sm:text-lg leading-relaxed text-[#C8C4BC]">
                  Fund milestones with strict deadlines and automated AI code
                  inspection before releasing USDC.
                </p>
                <ul className="space-y-3 text-sm sm:text-base text-[#8F8E94]">
                  {clientPoints.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8925A]" aria-hidden="true" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-xl border border-[#27272F] bg-[#09090B] p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#C8925A]">
                    New Escrow Scroll
                  </p>
                  <div className="mt-3 space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-[#141418] px-4 py-2.5">
                      <span className="text-[#8F8E94]">Title</span>
                      <span className="font-semibold text-[#F4F1EA]">
                        Smart Contract Audit
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[#141418] px-4 py-2.5">
                      <span className="text-[#8F8E94]">Stake</span>
                      <span className="font-mono font-bold tabular-nums text-[#C8925A]">
                        2,400.00 USDC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="reveal dojo-card p-7 sm:p-9 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#18181D] border border-[#27272F] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#F4F1EA]">
                    For Ronin (Freelancers)
                  </span>
                  <Swords className="h-5 w-5 text-[#C8925A]" />
                </div>
                <p className="text-base sm:text-lg leading-relaxed text-[#C8C4BC]">
                  Verify locked funds on-chain before you begin — and receive
                  instant USDC payouts upon approval.
                </p>
                <ul className="space-y-3 text-sm sm:text-base text-[#8F8E94]">
                  {freelancerPoints.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8925A]" aria-hidden="true" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-xl border border-[#27272F] bg-[#09090B] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#C8925A]">
                      Payout Settled
                    </p>
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#C8925A] text-[#09090B]">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[#F4F1EA] tabular-nums">
                    2,400.00{" "}
                    <span className="text-sm font-medium text-[#C8925A]">USDC</span>
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-[#27272F] pt-3 text-xs text-[#8F8E94]">
                    <span>0x4c9d…8e04</span>
                    <span className="font-semibold text-[#C8925A]">0.8s · Arc</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-[#111114]/95 border-t border-[#27272F] backdrop-blur-md">
          <div className="mx-auto max-w-[1480px] w-full px-6 py-20 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C8925A]">
                  Ready for Settlement
                </p>
                <h2 className="reveal mt-2 font-display text-3xl font-bold leading-tight tracking-wide text-[#F4F1EA] sm:text-5xl">
                  Put Your Next Project in Escrow.
                </h2>
              </div>
              <div className="reveal sm:justify-self-end sm:text-right">
                <Link
                  href="/dashboard"
                  className="katana-btn inline-flex items-center gap-2 rounded-full bg-[#C8925A] hover:bg-[#D9A46D] px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-[#09090B] transition-colors"
                >
                  <span>Enter Dojo</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#8F8E94]">
                  Free Testnet USDC from Circle Faucet · Arc Chain 5042002
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 bg-[#09090B]/95 backdrop-blur-md border-t border-[#27272F]">
        <div className="mx-auto max-w-[1480px] w-full px-6 py-14 sm:px-10 lg:px-16 xl:px-20">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-3 font-display text-2xl font-bold tracking-wider text-[#F4F1EA] uppercase group"
              >
                <span className="flex h-10 w-14 items-center justify-center rounded-xl bg-black border border-[#27272F] group-hover:border-[#C8925A]/60 p-1 transition-colors overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="ArcPay Logo"
                    className="h-full w-full object-contain"
                  />
                </span>
                <span>ArcPay</span>
              </Link>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#8F8E94]">
                Milestone escrow, AI Deliverable Oracle &amp; Open Bounty Board on
                Circle&rsquo;s Arc Layer-1.
              </p>
            </div>

            <nav className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm font-medium text-[#8F8E94] sm:grid-cols-3">
              <Link href="/dashboard" className="transition-colors hover:text-[#C8925A]">
                Escrow Dojo
              </Link>
              <Link href="/dashboard?tab=gigs" className="transition-colors hover:text-[#C8925A]">
                Bounty Board
              </Link>
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[#C8925A]"
              >
                Faucet
              </a>
              <a
                href="https://explorer.testnet.arc.io"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[#C8925A]"
              >
                Arc Explorer
              </a>
              <a
                href="https://rpc.testnet.arc.io"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[#C8925A]"
              >
                RPC
              </a>
            </nav>
          </div>

          <p className="mt-10 text-xs uppercase tracking-widest text-[#68676E]">
            © 2026 ArcPay · Forged on Circle Arc Testnet
          </p>
        </div>
      </footer>
    </div>
  );
}
