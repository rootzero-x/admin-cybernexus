import React from "react";
import { Link, useRouteError } from "react-router-dom";

export function ErrorPage() {
  const err = useRouteError();
  return (
    <div className="min-h-screen bg-[#05070b] bg-grid flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-white font-extrabold text-2xl">404 / Error</div>
        <div className="text-white/60 text-sm mt-2">
          {err?.statusText || err?.message || "Page not found"}
        </div>
        <Link
          to="/"
          className="inline-block mt-4 text-emerald-300 hover:text-emerald-200 font-semibold"
        >
          Go to Login →
        </Link>
      </div>
    </div>
  );
}
