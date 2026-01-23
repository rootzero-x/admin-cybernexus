import React from "react";

export function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 rounded-full border border-white/10 border-t-emerald-400 animate-spin" />
      <div className="text-sm text-white/70">{label}</div>
    </div>
  );
}
