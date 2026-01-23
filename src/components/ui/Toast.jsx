import React from "react";
import { X } from "lucide-react";

export function Toast({ type = "info", title, message, onClose }) {
  const tone =
    type === "error"
      ? "border-red-500/30 bg-red-500/10"
      : type === "success"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : "border-white/10 bg-white/5";

  return (
    <div className={`rounded-2xl border ${tone} p-4 backdrop-blur-xl`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {title ? <div className="font-bold text-white">{title}</div> : null}
          <div className="text-sm text-white/70 mt-1">{message}</div>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
