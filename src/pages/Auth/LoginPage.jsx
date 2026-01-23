import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, TerminalSquare, Lock } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { adminApi } from "../../shared/api/adminApi.js";
import { saveAuth } from "../../shared/auth/authStore.js";

export function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const from = useMemo(
    () => (loc.state && loc.state.from) || "/admin",
    [loc.state],
  );

  async function onSubmit(e) {
    e.preventDefault();
    setToast(null);
    setLoading(true);
    try {
      const res = await adminApi.step1Login(username.trim(), password);
      // res: { ok:true, step:'2fa_required', challenge, expires_in }
      saveAuth({
        username: username.trim(),
        challenge: res.challenge,
        step: "2fa",
      });
      nav("/2fa", { replace: true, state: { from } });
    } catch (err) {
      setToast({
        type: "error",
        title: "Login failed",
        message: err.message || "Invalid credentials / locked out",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05070b] bg-grid relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col justify-center"
          >
            <div className="inline-flex items-center gap-2 text-emerald-300/90">
              <TerminalSquare size={18} />
              <span className="text-sm font-semibold">
                CyberNexus • Admin Root
              </span>
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Secure Admin Access
            </h1>
            <p className="mt-3 text-white/70">
              Step 1: Username & Password. Step 2: 2FA verification. Bruteforce
              protection enabled.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="flex items-center gap-3 text-white/70">
                <ShieldCheck className="text-emerald-300" size={18} />
                <span className="text-sm">Cookie-based secure session</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Lock className="text-emerald-300" size={18} />
                <span className="text-sm">
                  Progressive lockout after 3 failed attempts
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 md:p-7">
              <div className="text-white font-bold text-lg">Admin Login</div>
              <div className="text-white/60 text-sm mt-1">
                Enter credentials to continue
              </div>

              <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="text-sm text-white/70">Username</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70">Password</label>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                  />
                </div>

                <Button loading={loading} className="w-full">
                  Continue to 2FA
                </Button>
              </form>

              {toast ? (
                <div className="mt-4">
                  <Toast {...toast} onClose={() => setToast(null)} />
                </div>
              ) : null}

              <div className="mt-5 text-xs text-white/40">
                Tip: If you get locked out, wait for retry timer (5m → 10m →
                20m...).
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
