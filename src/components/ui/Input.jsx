import React from "react";
import classNames from "classnames";

export function Input({ className, ...props }) {
  return (
    <input
      className={classNames(
        "w-full rounded-xl border border-white/12 bg-black/40 px-4 py-3",
        "text-sm text-white placeholder:text-white/25 outline-none",
        "transition-all duration-200",
        "focus:border-signal-400/70 focus:bg-signal-500/5 focus:shadow-glow-sm",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export default Input;
