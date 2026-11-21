import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-ink">
      <p className="font-display text-7xl font-semibold tracking-tight text-lav-300">
        404
      </p>

      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        This page is not here.
      </h1>

      <p className="mt-3 max-w-md text-base leading-relaxed text-ink-soft">
        The page, milestone, or resource you are looking for does not exist or
        has moved.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-lav-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-lav-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:text-lav-700"
        >
          Open the app
        </Link>
      </div>
    </div>
  );
}
