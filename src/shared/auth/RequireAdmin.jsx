import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { adminApi } from "../api/adminApi.js";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { saveAuth } from "./authStore.js";

export function RequireAdmin({ children }) {
  const [state, setState] = useState({ loading: true, ok: false });
  const loc = useLocation();

  useEffect(() => {
    let alive = true;
    adminApi
      .me()
      .then((d) => {
        if (!alive) return;
        saveAuth({ me: d });
        setState({ loading: false, ok: true });
      })
      .catch(() => {
        if (!alive) return;
        setState({ loading: false, ok: false });
      });

    return () => {
      alive = false;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen bg-[#05070b] bg-grid flex items-center justify-center p-6">
        <Spinner label="Checking admin session..." />
      </div>
    );
  }

  if (!state.ok)
    return <Navigate to="/" replace state={{ from: loc.pathname }} />;

  return children;
}
