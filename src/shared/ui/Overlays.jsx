// src/shared/ui/Overlays.jsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";
import { AlertTriangle, Search, X } from "lucide-react";

/**
 * Side drawer for record detail.
 *
 * Rendered in a portal so it is never clipped by a table's overflow container,
 * closes on Escape and on a backdrop click, and locks the page behind it.
 */
export function Drawer({ open, onClose, title, subtitle, children, footer, width = "max-w-2xl" }) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-void-950/75 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={classNames(
          "absolute inset-y-0 right-0 flex w-full flex-col border-l border-white/10",
          "bg-void-900/95 shadow-panel-lg backdrop-blur-xl",
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/8 p-5">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold text-white">{title}</h2>
            {subtitle ? (
              <p className="mt-1 truncate text-xs text-white/40">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-white/50 transition-colors hover:border-white/25 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {footer ? (
          <div className="border-t border-white/8 bg-void-950/40 p-4">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Destructive-action confirmation.
 *
 * Everything in this panel that deletes goes through here. `confirmWord` adds
 * a typed confirmation for the cases where an accidental click is expensive —
 * deleting an account, or clearing the whole traffic log.
 */
/**
 * The dialog body lives in its own component so that closing unmounts it. That
 * is what clears the typed confirmation between openings — carrying it over
 * would let a second delete go through on the first one's word.
 */
export function ConfirmDialog(props) {
  if (!props.open) return null;
  return <ConfirmDialogBody {...props} />;
}

function ConfirmDialogBody({
  open,
  onCancel,
  onConfirm,
  title,
  body,
  confirmLabel = "O'chirish",
  confirmWord,
  busy,
  extra,
}) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!confirmWord) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [confirmWord]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const ready = !confirmWord || typed.trim() === confirmWord;

  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-void-950/80 backdrop-blur-sm" onClick={onCancel} />

      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-plasma/25 bg-void-900/95 p-6 shadow-panel-lg backdrop-blur-xl"
      >
        <div className="flex items-start gap-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-plasma/35 bg-plasma/10">
            <AlertTriangle className="h-5 w-5 text-plasma" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
          </div>
        </div>

        {extra ? <div className="mt-4">{extra}</div> : null}

        {confirmWord ? (
          <div className="mt-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40">
              Tasdiqlash uchun <span className="text-plasma">{confirmWord}</span> deb yozing
            </label>
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 font-mono text-sm text-white outline-none transition-colors focus:border-plasma/60"
            />
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-white/12 px-4 py-2.5 text-sm text-white/60 transition-colors hover:border-white/25 hover:text-white disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || !ready}
            className="rounded-xl border border-plasma/40 bg-plasma/15 px-4 py-2.5 text-sm font-bold text-plasma transition-colors hover:bg-plasma/25 disabled:opacity-40"
          >
            {busy ? "Bajarilmoqda..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Search box with a built-in debounce.
 *
 * The input stays instant while the callback lags behind it, so typing does
 * not fire a request per keystroke.
 */
export function SearchInput({ value, onChange, placeholder = "Qidirish...", delay = 300 }) {
  const [local, setLocal] = useState(value);
  const timer = useRef(0);
  const [lastExternal, setLastExternal] = useState(value);

  // Follow an external reset (a filter cleared elsewhere) without fighting the
  // user while they are typing. Adjusting during render rather than in an
  // effect keeps the box from flashing the stale text for one frame.
  if (lastExternal !== value) {
    setLastExternal(value);
    setLocal(value);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  const handle = (v) => {
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), delay);
  };

  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
      <input
        value={local}
        onChange={(e) => handle(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/12 bg-black/40 py-2.5 pl-10 pr-9 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-signal-400/70 focus:bg-signal-500/5"
      />
      {local ? (
        <button
          type="button"
          onClick={() => {
            clearTimeout(timer.current);
            setLocal("");
            onChange("");
          }}
          aria-label="Tozalash"
          className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-white/30 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/** Transient success/failure banner. */
export function Banner({ tone = "ok", children, onDismiss }) {
  if (!children) return null;

  const tones = {
    ok: "border-signal-500/30 bg-signal-500/[.08] text-signal-200",
    error: "border-plasma/35 bg-plasma/[.08] text-white/80",
    warn: "border-yellow-400/30 bg-yellow-400/[.07] text-yellow-100",
  };

  return (
    <div
      className={classNames(
        "mb-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
        tones[tone],
      )}
    >
      <span className="min-w-0">{children}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Yopish"
          className="shrink-0 opacity-50 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
