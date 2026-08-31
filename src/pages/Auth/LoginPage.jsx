import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, TerminalSquare, Lock, KeyRound, User, Eye, EyeOff } from "lucide-react";

import { Toast } from "../../components/ui/Toast.jsx";
import { adminApi } from "../../shared/api/adminApi.js";
import { saveAuth } from "../../shared/auth/authStore.js";
import {
  HoloCard,
  Eyebrow,
  Display,
  Accent,
  NeonButton,
  Backdrop,
  Reveal,
} from "../../design";

const GUARANTEES = [
  { icon: ShieldCheck, text: "Parol bcrypt (cost 12) bilan hashlangan, kodda saqlanmaydi" },
  { icon: KeyRound, text: "Ikkinchi bosqich — RFC 6238 TOTP, har 30 soniyada yangilanadi" },
  { icon: Lock, text: "3 ta xatodan keyin progressiv bloklash (5m → 10m → 20m)" },
];

export function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const from = useMemo(() => (loc.state && loc.state.from) || "/admin", [loc.state]);

  async function onSubmit(e) {
    e.preventDefault();
    setToast(null);
    setLoading(true);
    try {
      const res = await adminApi.step1Login(username.trim(), password);
      saveAuth({ username: username.trim(), challenge: res.challenge, step: "2fa" });
      // The password must not linger in component state once it is spent.
      setPassword("");
      nav("/2fa", { replace: true, state: { from } });
    } catch (err) {
      setToast({
        type: "error",
        title: "Login muvaffaqiyatsiz",
        message: err.message || "Noto'g'ri credentials yoki bloklangan",
      });
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-white/12 bg-black/40 py-3 pl-11 pr-11 text-sm text-white " +
    "placeholder:text-white/25 outline-none transition-all duration-200 " +
    "focus:border-signal-400/70 focus:bg-signal-500/5 focus:shadow-glow-sm";

  return (
    <div className="relative min-h-screen">
      <Backdrop density={0.7} parallax={0.8} />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
          {/* ---------------- Identity ---------------- */}
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2 text-cyber-400">
                <TerminalSquare size={18} />
                <span className="text-[11px] font-bold uppercase tracking-[.22em]">
                  CyberNexus · Admin Root
                </span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <Display size="lg" className="mt-5">
                Boshqaruv <Accent>paneli.</Accent>
              </Display>
            </Reveal>

            <Reveal delay={150}>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-white/50">
                Ikki bosqichli kirish: parol, so'ng autentifikator kodi. Barcha
                urinishlar audit jurnaliga yoziladi.
              </p>
            </Reveal>

            <div className="mt-8 space-y-3">
              {GUARANTEES.map((g, i) => (
                <Reveal key={g.text} delay={220 + i * 80}>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-signal-500/25 bg-signal-500/10">
                      <g.icon className="h-3.5 w-3.5 text-signal-400" />
                    </span>
                    <span className="text-sm leading-relaxed text-white/50">{g.text}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* ---------------- Form ---------------- */}
          <Reveal delay={160} y={26}>
            <HoloCard glow="signal" className="relative overflow-hidden">
              <Eyebrow tone="signal">Step 1 · Credentials</Eyebrow>
              <h2 className="mt-3 font-display text-2xl font-bold text-white">Admin Login</h2>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="admin-username"
                    className="mb-2 block text-[11px] font-bold uppercase tracking-[.18em] text-white/40"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      id="admin-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      autoComplete="username"
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-password"
                    className="mb-2 block text-[11px] font-bold uppercase tracking-[.18em] text-white/40"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      id="admin-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/30 transition-colors hover:text-white/70"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <NeonButton
                  type="submit"
                  disabled={loading || !username.trim() || !password}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Tekshirilmoqda..." : "2FA ga o'tish"}
                </NeonButton>
              </form>

              {toast ? (
                <div className="mt-4">
                  <Toast {...toast} onClose={() => setToast(null)} />
                </div>
              ) : null}
            </HoloCard>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
