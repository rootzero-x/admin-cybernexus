import React from "react";
import classNames from "classnames";

export function Input({ className, ...props }) {
  return (
    <input
      className={classNames(
        "w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3",
        "text-white placeholder:text-white/40 outline-none",
        "focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10",
        className
      )}
      {...props}
    />
  );
}
