"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#08050D] px-6 text-center text-[#F6EFE0]">
      <p className="font-display text-7xl font-extrabold tracking-widest bg-gradient-to-r from-rose-500 to-amber-400 bg-clip-text text-transparent">
        DEFEAT
      </p>

      <h1 className="mt-4 font-display text-3xl font-bold tracking-wide text-[#F6EFE0] sm:text-4xl">
        A Scroll Was Disrupted.
      </h1>

      <p className="mt-3 max-w-md text-base leading-relaxed text-[#A99BB8]">
        {error.message || "An unexpected error occurred while loading the Dojo."}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="katana-btn inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-glow transition-all hover:brightness-110"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Strike Again
        </button>

        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-[#120D1B] px-5 py-2.5 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/15"
        >
          Return to Dojo
        </a>
      </div>
    </div>
  );
}
