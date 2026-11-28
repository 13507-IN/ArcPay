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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090B] px-6 text-center text-[#F4F1EA]">
      <p className="font-display text-7xl font-extrabold tracking-widest text-[#C8925A]">
        ERROR
      </p>

      <h1 className="mt-4 font-display text-3xl font-bold tracking-wide text-[#F4F1EA] sm:text-4xl">
        Something Went Wrong.
      </h1>

      <p className="mt-3 max-w-md text-base leading-relaxed text-[#8F8E94]">
        {error.message || "An unexpected error occurred while loading the page."}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="katana-btn inline-flex items-center gap-2 rounded-full bg-[#C8925A] hover:bg-[#D9A46D] px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-[#09090B] transition-colors"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try Again
        </button>

        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-[#27272F] bg-[#111114] px-5 py-2.5 text-sm font-semibold text-[#F4F1EA] transition-colors hover:border-[#C8925A]/50"
        >
          Back Home
        </a>
      </div>
    </div>
  );
}
