import React from "react";
import classNames from "classnames";
import HoloCard from "../../design/HoloCard";

/**
 * Panel surface for the admin pages.
 *
 * Delegates to the shared HoloCard so the panel picks up the same pointer
 * tilt, edge glow and glass treatment as the main site instead of being a
 * separate, flatter card style.
 */
export function Card({ className, children, glow = "signal", interactive = true }) {
  return (
    <HoloCard
      glow={glow}
      interactive={interactive}
      padded={false}
      className={classNames("overflow-hidden", className)}
    >
      {children}
    </HoloCard>
  );
}

export default Card;
