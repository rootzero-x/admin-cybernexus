import React from "react";
import { Outlet } from "react-router-dom";
import Backdrop from "./design/Backdrop";

export default function App() {
  return (
    // One WebGL backdrop for the whole panel. Mounting it per page would open
    // and tear down a GL context on every navigation, and browsers cap how
    // many live contexts a tab may hold.
    <div className="relative min-h-screen">
      <Backdrop density={0.65} parallax={0.7} />
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
}
