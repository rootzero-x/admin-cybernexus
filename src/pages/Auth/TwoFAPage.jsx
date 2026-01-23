import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, KeyRound } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { adminApi } from "../../shared/api/adminApi.js";
import { loadAuth, saveAuth, clearAuth } from "../../shared/auth/authStore.js";

export function TwoFAPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = useMemo(
    () => (loc.state && loc.state.from) || "/admin",
    [loc.state],
  );

  const auth = loadAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const username = (auth.username || "").trim();
  const challenge = auth.challenge || "";

  async function onVerify(e) {
    e.preventDefault();
    setToast(null);

    if (!username || !challenge) {
      setToast({
        type: "error",
        title: "Missing challenge",
        message: "Login step1 is required. Please login again.",
      });
      return;
    }

    setLoading(true);
    try {
      await adminApi.step2Verify(username, challenge, code.trim());
      // backend cookie set bo‘ladi
      const me = await adminApi.me();
      saveAuth({ me, step: "authed" });
      nav(from, { replace: true });
    } catch (err) {
      setToast({
        type: "error",
        title: "2FA failed",
        message: err.message || "Invalid code / locked out",
      });
    } finally {
      setLoading(false);
    }
  }

  function backToLogin() {
    clearAuth();
    nav("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#05070b] bg-grid flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <Card className="p-6 md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-white font-bold text-lg flex items-center gap-2">
                <Shield className="text-emerald-300" size={18} />
                2FA Verification
              </div>
              <div className="text-white/60 text-sm mt-1">
                Enter your one-time code to unlock root panel
              </div>
            </div>
            <Button variant="ghost" onClick={backToLogin}>
              Back
            </Button>
          </div>

          <form onSubmit={onVerify} className="mt-5 space-y-4">
            <div>
              <label className="text-sm text-white/70">Code</label>
              <div className="relative">
                <KeyRound
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                  size={18}
                />
                <Input
                  className="pl-10"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="2FA code"
                  inputMode="numeric"
                />
              </div>
            </div>

            <Button loading={loading} className="w-full">
              Verify & Enter Admin Panel
            </Button>
          </form>

          {toast ? (
            <div className="mt-4">
              <Toast {...toast} onClose={() => setToast(null)} />
            </div>
          ) : null}

          <div className="mt-5 text-xs text-white/40">
            Current user:{" "}
            <span className="text-white/70">{username || "unknown"}</span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
