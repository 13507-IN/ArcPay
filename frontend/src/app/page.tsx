import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Coins } from "lucide-react";
import { MilestoneDemo } from "@/components/landing/MilestoneDemo";
import { AnimeShadowBackground } from "@/components/landing/AnimeShadowBackground";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

const steps = [
  {
    title: "Fund",
    body: "The client locks the agreed amount in the escrow contract. The money sits on-chain, not with ArcPay.",
  },
  {
    title: "Submit",
    body: "The freelancer posts the deliverable link — a pull request, a Figma file, an IPFS hash. The milestone moves to Submitted.",
  },
  {
    title: "Release",
    body: "The client approves, and the contract pays the freelancer in native USDC. Settlement is final in under a second.",
  },
];

const clientPoints = [
  "Set the amount, deadline, and freelancer in one transaction.",
  "Review the full event timeline before approving.",
  "Reclaim the funds if the deadline passes with no submission.",
];

const freelancerPoints = [
  "See the escrowed balance before you start work.",
  "Submit a PR, design file, or IPFS link as proof.",
  "Get paid the moment the client approves.",
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-transparent font-body text-ink selection:bg-rose-200">
      <ScrollReveal />
      {/* Aesthetic Anime & Shadow Fight Background with Falling Sakura Petals */}
      <AnimeShadowBackground />

      <header className="sticky top-0 z-40 bg-slate-950/40 backdrop-blur-md border-b border-white/10 transition-opacity duration-300">
        <div className="mx-auto flex h-20 max-w-[1480px] w-full items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-20">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-lav-600 text-white shadow-md shadow-rose-950/50">
              <Coins className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              ArcPay
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-rose-100/80 sm:flex">
            <a href="#how" className="transition-colors hover:text-white">
              How it works
            </a>
            <a href="#network" className="transition-colors hover:text-white">
              Network
            </a>
            <a href="#teams" className="transition-colors hover:text-white">
              For teams
            </a>
          </nav>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-600 to-lav-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/30 transition-all hover:scale-105 hover:from-rose-500 hover:to-lav-500 active:scale-95"
          >
            Launch app
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 transition-opacity duration-300">
        <section className="bg-transparent">
          <div className="mx-auto grid max-w-[1480px] w-full gap-12 px-6 pb-24 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-16 xl:px-20 lg:pb-32 lg:pt-20">
            <div className="max-w-3xl">
              <h1 className="landing-rise font-display text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-white drop-shadow-md sm:text-6xl lg:text-7xl">
                Escrow for global teams.
              </h1>
              <p className="landing-rise landing-rise-1 mt-6 max-w-2xl text-lg leading-relaxed text-rose-100/90 sm:text-xl">
                ArcPay holds each milestone&rsquo;s funds in an on-chain contract
                and releases native USDC to freelancers the moment work is
                approved — on Circle&rsquo;s Arc Layer-1.
              </p>
              <div className="landing-rise landing-rise-2 mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-lav-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-rose-950/40 transition-all hover:from-rose-500 hover:to-lav-500 hover:scale-105 active:scale-95"
                >
                  Launch app
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white bg-white/10 backdrop-blur-md border border-white/20 shadow-sm transition-all hover:bg-white/20 hover:text-white"
                >
                  See how it works
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
              <p className="landing-rise landing-rise-3 mt-10 text-sm text-rose-200/75">
                Built on Circle Arc Testnet · Chain 5042002 · Native 18-decimal
                USDC
              </p>
            </div>

            <div className="landing-rise landing-rise-2">
              <div className="rounded-[40px] bg-white/95 backdrop-blur-xl p-5 sm:p-8 lg:p-10 border border-white/40 shadow-2xl shadow-rose-950/30">
                <MilestoneDemo />
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="bg-white/80 backdrop-blur-md border-t border-lav-200/40">
          <div className="mx-auto max-w-[1480px] w-full px-6 py-24 sm:px-10 lg:px-16 xl:px-20 lg:py-32">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <h2 className="reveal font-display text-4xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-5xl">
                  Three moves, one calm ledger.
                </h2>
                <p className="reveal mt-6 max-w-md text-lg leading-relaxed text-ink">
                  Every milestone follows the same short path. The funds stay
                  visible the whole time, and neither side has to trust a bank
                  transfer.
                </p>
                <p className="reveal mt-6 max-w-md text-base leading-relaxed text-ink">
                  If work never arrives, the client can reclaim the locked
                  amount once the deadline passes.
                </p>

                <div
                  data-ui
                  className="reveal mt-8 max-w-md rounded-3xl border border-lav-200 bg-white p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">Activity</p>
                    <p className="text-sm text-ink-soft">Mar 10</p>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm">
                    <li className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-ink">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-lav-600"
                          aria-hidden="true"
                        />
                        Funded
                      </span>
                      <span className="tabular-nums text-ink-soft">
                        2,400.00 USDC
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-ink">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-lav-500"
                          aria-hidden="true"
                        />
                        Submitted
                      </span>
                      <span className="text-ink-soft">figma.com/file</span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-ink">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-lav-500"
                          aria-hidden="true"
                        />
                        Released
                      </span>
                      <span className="tabular-nums text-ink-soft">
                        0x4c9d…8e04
                      </span>
                    </li>
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-lav-100 pt-3 text-sm">
                    <span className="text-ink-soft">Escrow closed</span>
                    <span className="font-medium text-ink">0.8s</span>
                  </div>
                </div>
              </div>

              <div className="relative space-y-14 pl-8">
                <span
                  className="absolute bottom-2 left-[7px] top-2 w-[3px] rounded-full bg-lav-200"
                  aria-hidden="true"
                />
                {steps.map((step) => (
                  <div key={step.title} className="reveal relative">
                    <span
                      className="absolute -left-8 top-2 h-4 w-4 rounded-full bg-lav-600"
                      aria-hidden="true"
                    />
                    <h3 className="font-display text-3xl font-semibold tracking-tight text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-lg text-lg leading-relaxed text-ink">
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="network" className="bg-lav-100/85 backdrop-blur-md border-t border-lav-200/40">
          <div className="mx-auto max-w-[1480px] w-full px-6 py-24 sm:px-10 lg:px-16 xl:px-20 lg:py-32">
            <div className="max-w-2xl">
              <h2 className="reveal font-display text-4xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-5xl">
                Settled on Circle Arc.
              </h2>
              <p className="reveal mt-6 text-lg leading-relaxed text-ink">
                Arc is Circle&rsquo;s Layer-1 for money movement. ArcPay uses it
                directly — no bridges, no wrapped assets, and no waiting on a
                bank.
              </p>
            </div>

            <div className="mt-16 grid gap-10 sm:grid-cols-3 lg:gap-16">
              <div className="reveal">
                <p className="font-display text-4xl font-semibold tracking-tight text-ink">
                  &lt;1s
                </p>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
                  Malachite BFT settles every release deterministically.
                </p>
              </div>
              <div className="reveal">
                <p className="font-display text-4xl font-semibold tracking-tight text-ink">
                  18-dec
                </p>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
                  Native USDC is the gas token and the payout asset, with no
                  wrapper.
                </p>
              </div>
              <div className="reveal">
                <p className="font-display text-4xl font-semibold tracking-tight text-ink tabular-nums">
                  5042002
                </p>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
                  Arc Testnet, live today for teams and freelancers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="teams" className="bg-white/80 backdrop-blur-md border-t border-lav-200/40">
          <div className="mx-auto max-w-[1480px] w-full px-6 py-24 sm:px-10 lg:px-16 xl:px-20 lg:py-32">
            <h2 className="reveal max-w-2xl font-display text-4xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-5xl">
              One contract, both sides of the table.
            </h2>

            <div className="mt-16 grid gap-14 lg:grid-cols-2 lg:gap-20">
              <div className="reveal">
                <h3 className="font-display text-2xl font-semibold text-ink">
                  For clients
                </h3>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-ink">
                  Fund work with a clear deadline and a single approval. The
                  amount is locked on-chain, so your team knows the money is
                  there.
                </p>
                <ul className="mt-6 space-y-3 text-base text-ink">
                  {clientPoints.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lav-500"
                        aria-hidden="true"
                      />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>

                <div
                  data-ui
                  className="mt-8 max-w-md rounded-3xl border border-lav-200 bg-lav-50 p-5"
                >
                  <p className="text-sm font-medium text-ink">New milestone</p>
                  <div className="mt-4 space-y-2.5 text-sm">
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-2.5">
                      <span className="text-ink-soft">Title</span>
                      <span className="font-medium text-ink">
                        Website redesign
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-2.5">
                      <span className="text-ink-soft">Amount</span>
                      <span className="font-medium tabular-nums text-ink">
                        2,400.00 USDC
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-2.5">
                      <span className="text-ink-soft">Due</span>
                      <span className="font-medium text-ink">Mar 14</span>
                    </div>
                  </div>
                  <div className="mt-4 rounded-full bg-lav-600 px-4 py-2.5 text-center text-sm font-semibold text-white">
                    Fund escrow
                  </div>
                </div>
              </div>

              <div className="reveal lg:mt-16">
                <h3 className="font-display text-2xl font-semibold text-ink">
                  For freelancers
                </h3>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-ink">
                  See the money before you start. When the client approves, the
                  payout lands in your wallet in the same breath.
                </p>
                <ul className="mt-6 space-y-3 text-base text-ink">
                  {freelancerPoints.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lav-500"
                        aria-hidden="true"
                      />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>

                <div
                  data-ui
                  className="mt-8 min-h-[210px] max-w-md rounded-3xl border border-lav-200 bg-lav-50 p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">
                      Payout released
                    </p>
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-lav-600 text-white">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
                    2,400.00{" "}
                    <span className="text-base font-medium text-ink-soft">
                      USDC
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">to 0x4c9d…8e04</p>
                  <div className="mt-4 flex items-center justify-between border-t border-lav-200 pt-3 text-sm">
                    <span className="text-ink-soft">Settled</span>
                    <span className="font-medium text-ink">0.8s · Arc</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-lav-600">
          <div className="mx-auto max-w-[1480px] w-full px-6 py-24 sm:px-10 lg:px-16 xl:px-20 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <h2 className="reveal font-display text-4xl font-semibold leading-tight tracking-[-0.02em] text-white sm:text-5xl">
                Put the next project in escrow.
              </h2>
              <div className="reveal sm:justify-self-end sm:text-right">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-lav-700 transition-colors hover:bg-lav-50"
                >
                  Launch app
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <p className="mt-4 text-sm text-white/80">
                  Testnet USDC is free from the Circle faucet.
                </p>
                <p className="mt-2 text-sm text-white/80">Arc Testnet · Live</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white/90 backdrop-blur-md border-t border-lav-200/50 transition-opacity duration-300">
        <div className="mx-auto max-w-[1480px] w-full px-6 py-16 sm:px-10 lg:px-16 xl:px-20">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href="/"
                className="font-display text-2xl font-semibold tracking-tight text-ink"
              >
                ArcPay
              </Link>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
                Milestone escrow and instant USDC payroll on Circle&rsquo;s Arc
                Layer-1.
              </p>
            </div>

            <nav className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm text-ink-soft sm:grid-cols-3">
              <Link href="/dashboard" className="transition-colors hover:text-ink">
                Dashboard
              </Link>
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-ink"
              >
                Faucet
              </a>
              <a
                href="https://explorer.testnet.arc.io"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-ink"
              >
                Arc Explorer
              </a>
              <a
                href="https://rpc.testnet.arc.io"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-ink"
              >
                RPC
              </a>
            </nav>
          </div>

          <p className="mt-12 text-sm text-ink-soft">
            © 2026 ArcPay. Built for Circle Arc Testnet.
          </p>
        </div>
      </footer>
    </div>
  );
}
