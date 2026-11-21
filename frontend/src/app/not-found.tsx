import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F19] px-4 text-center text-slate-100">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400 shadow-glow">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        404 — Page Not Found
      </h1>

      <p className="mt-3 max-w-md text-sm text-slate-400">
        The page, milestone, or resource you are looking for does not exist or has been moved.
      </p>

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-xs font-semibold text-white shadow-glow transition-all hover:from-blue-500 hover:to-blue-600 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to ArcPay Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
