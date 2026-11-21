"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F19] px-4 text-center text-slate-100">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Something went wrong
      </h1>

      <p className="mt-2 max-w-md text-xs text-slate-400">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-glow transition-all hover:bg-blue-500"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Try again</span>
        </button>

        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
