import React from "react";

export function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="relative h-12 w-12">
        <span className="absolute inset-0 rounded-full border border-signal-500/20" />
        <span className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-signal-400 border-r-signal-400/40" />
        <span
          className="absolute inset-2.5 animate-spin-slow rounded-full border-2 border-transparent border-b-cyber-400"
          style={{ animationDirection: "reverse", animationDuration: "8s" }}
        />
      </span>
      <div className="text-[11px] font-bold uppercase tracking-[.22em] text-white/40">
        {label}
      </div>
    </div>
  );
}

export default Spinner;
