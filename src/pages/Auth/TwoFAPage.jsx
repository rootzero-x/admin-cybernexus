import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Smartphone } from "lucide-react";

import { Toast } from "../../components/ui/Toast.jsx";
import { adminApi } from "../../shared/api/adminApi.js";
import { loadAuth, saveAuth, clearAuth } from "../../shared/auth/authStore.js";
import { HoloCard, Eyebrow, NeonButton } from "../../design";

const DIGITS = 6;

/**
 * Second factor.
 *
 * This used to accept a single fixed code that was hardcoded in the PHP source.
 * It is now a real TOTP (RFC 6238) check against a per-installation secret, so
 * the code changes every 30 seconds and comes from an authenticator app.
 */
export function TwoFAPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = useMemo(() => (loc.state && loc.state.from) || "/admin", [loc.state]);

  const auth = loadAuth();
  const username = (auth.username || "").trim();
  const challenge = auth.challenge || "";

  const [digits, setDigits] = useState(() => Array(DIGITS).fill(""));
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(
    () => 30 - (Math.floor(Date.now() / 1000) % 30),
  );

  const inputsRef = useRef([]);
  const submittedFor = useRef("");

  const code = digits.join("");

  // Mirrors the authenticator's own countdown, so a code that is about to roll
  // over visibly is about to roll over.
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft(30 - (Math.floor(Date.now() / 1000) % 30));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  async function verify(fullCode) {
    if (!username || !challenge) {
      setToast({
        type: "error",
        title: "Challenge yo'q",
        message: "Login birinchi bosqichini qaytadan bajaring.",
      });
      return;
    }

    setLoading(true);
    setToast(null);
    try {
      await adminApi.step2Verify(username, challenge, fullCode);
      const me = await adminApi.me();
      saveAuth({ me, step: "authed" });
      nav(from, { replace: true });
    } catch (err) {
      // The challenge is single-use on the server, so a wrong code means
      // starting over rather than retyping into a dead challenge.
      setToast({
        type: "error",
        title: "2FA muvaffaqiyatsiz",
        message: (err.message || "Noto'g'ri kod") + " — qaytadan login qiling.",
      });
      setDigits(Array(DIGITS).fill(""));
      submittedFor.current = "";
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  // Auto-submit once all six digits are present, but never twice for one code.
  useEffect(() => {
    if (code.length === DIGITS && !loading && submittedFor.current !== code) {
      submittedFor.current = code;
      verify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, loading]);

  function setDigit(index, value) {
    const clean = value.replace(/\D/g, "");

    if (!clean) {
      setDigits((d) => {
        const next = [...d];
        next[index] = "";
        return next;
      });
      return;
    }

    setDigits((d) => {
      const next = [...d];
      // Pasting a full code into any box fills the whole row.
      for (let i = 0; i < clean.length && index + i < DIGITS; i++) {
        next[index + i] = clean[i];
      }
      return next;
    });

    const nextIndex = Math.min(index + clean.length, DIGITS - 1);
    inputsRef.current[nextIndex]?.focus();
  }

  function onKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < DIGITS - 1) inputsRef.current[index + 1]?.focus();
  }

  function backToLogin() {
    clearAuth();
    nav("/", { replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">

      <div className="w-full max-w-lg">
        <HoloCard glow="cyber" className="relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow tone="cyber">Step 2 · Two-factor</Eyebrow>
              <h1 className="mt-3 font-display text-2xl font-bold text-white">
                Autentifikator kodi
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                Google Authenticator (yoki Authy) ilovasidagi 6 xonali kodni
                kiriting.
              </p>
            </div>
            <button
              type="button"
              onClick={backToLogin}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-white/25 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Orqaga
            </button>
          </div>

          <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                disabled={loading}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={DIGITS}
                aria-label={`Kod raqami ${i + 1}`}
                className="h-14 w-11 rounded-xl border border-white/12 bg-black/40 text-center font-display text-2xl font-bold text-white outline-none transition-all duration-200 focus:border-signal-400/70 focus:bg-signal-500/5 focus:shadow-glow-sm disabled:opacity-50 sm:h-16 sm:w-12"
              />
            ))}
          </div>

          {/* Validity countdown */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/40">
            <Smartphone className="h-3.5 w-3.5" />
            Kod {secondsLeft}s dan keyin yangilanadi
            <span className="ml-1 h-1 w-16 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-signal-400 to-cyber-400 transition-[width] duration-1000 ease-linear"
                style={{ width: `${(secondsLeft / 30) * 100}%` }}
              />
            </span>
          </div>

          <NeonButton
            onClick={() => verify(code)}
            disabled={loading || code.length !== DIGITS}
            className="mt-6 w-full"
            size="lg"
          >
            <ShieldCheck className="h-4 w-4" />
            {loading ? "Tekshirilmoqda..." : "Admin panelga kirish"}
          </NeonButton>

          {toast ? (
            <div className="mt-4">
              <Toast {...toast} onClose={() => setToast(null)} />
            </div>
          ) : null}

          <div className="mt-6 text-center text-xs text-white/35">
            Foydalanuvchi:{" "}
            <span className="text-white/60">{username || "noma'lum"}</span>
          </div>
        </HoloCard>
      </div>
    </div>
  );
}

export default TwoFAPage;
