import React from "react";
import classNames from "classnames";

export function Card({ className, children }) {
  return (
    <div
      className={classNames(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl glow",
        "shadow-[0_20px_80px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
