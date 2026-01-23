import React from "react";
import classNames from "classnames";

export function Button({ className, variant = "primary", loading, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition active:scale-[0.99]";
  const styles =
    variant === "ghost"
      ? "bg-white/5 hover:bg-white/10 border border-white/10"
      : "bg-emerald-500/90 hover:bg-emerald-500 text-black";

  return (
    <button
      className={classNames(
        base,
        styles,
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "Loading..." : props.children}
    </button>
  );
}
