import React from "react";
import classNames from "classnames";
import { NeonButton } from "../../design";

/**
 * Admin button. Thin wrapper over the shared NeonButton so the panel and the
 * main site press the same way, while keeping this component's existing
 * `variant` / `loading` API for the pages that already use it.
 */
export function Button({ className, variant = "primary", loading, children, ...props }) {
  const mapped = variant === "ghost" ? "ghost" : variant === "danger" ? "danger" : "primary";

  return (
    <NeonButton
      variant={mapped}
      className={classNames("normal-case tracking-[.1em]", className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "Loading..." : children}
    </NeonButton>
  );
}

export default Button;
