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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-ink">
      <p className="font-display text-7xl font-semibold tracking-tight text-lav-300">
        Oops
      </p>

      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Something went wrong.
      </h1>

      <p className="mt-3 max-w-md text-base leading-relaxed text-ink-soft">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-full bg-lav-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-lav-700"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>

        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:text-lav-700"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}
