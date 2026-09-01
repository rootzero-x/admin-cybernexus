// src/shared/ui/DataTable.jsx
import React from "react";
import classNames from "classnames";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Inbox } from "lucide-react";

/**
 * The listing primitives every admin page shares.
 *
 * Nine sections all needed the same table, the same empty state, the same
 * pager and the same "loading over existing rows" behaviour. Written once
 * here so they stay identical as sections are added.
 */

/** Wide tables scroll inside their own container so the page never does. */
export function TableShell({ children, className }) {
  return (
    <div
      className={classNames(
        "overflow-x-auto rounded-2xl border border-white/8 bg-void-950/30",
        className,
      )}
    >
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

/**
 * A header cell that can sort.
 *
 * Passing `sortKey` makes it a button; the parent owns the sort state so the
 * request and the arrow can never disagree.
 */
export function Th({ children, sortKey, sort, dir, onSort, className, align = "left" }) {
  const active = sortKey && sort === sortKey;

  const content = (
    <span className="inline-flex items-center gap-1.5">
      {children}
      {sortKey ? (
        active ? (
          dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-40" />
        )
      ) : null}
    </span>
  );

  return (
    <th
      scope="col"
      className={classNames(
        "border-b border-white/8 px-4 py-3 text-[11px] font-bold uppercase tracking-[.14em]",
        active ? "text-signal-300" : "text-white/35",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {sortKey ? (
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className="group inline-flex items-center transition-colors hover:text-white"
        >
          {content}
        </button>
      ) : (
        content
      )}
    </th>
  );
}

export function Td({ children, className, align = "left" }) {
  return (
    <td
      className={classNames(
        "border-b border-white/5 px-4 py-3 align-middle text-white/70",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({ children, onClick, className }) {
  return (
    <tr
      onClick={onClick}
      className={classNames(
        "transition-colors",
        onClick && "cursor-pointer hover:bg-white/[.035]",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function EmptyRow({ colSpan, icon: Icon = Inbox, title, body }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16">
        <div className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[.03]">
            <Icon className="h-5 w-5 text-white/25" />
          </span>
          <div className="mt-4 font-display text-base font-bold text-white/70">{title}</div>
          {body ? <p className="mt-1.5 max-w-sm text-sm text-white/35">{body}</p> : null}
        </div>
      </td>
    </tr>
  );
}

/**
 * Loading bar shown above a table.
 *
 * Deliberately not a spinner replacing the rows: keeping the previous page
 * visible while the next one loads stops the whole view jumping on every
 * filter keystroke.
 */
export function LoadingBar({ active }) {
  if (!active) return null;
  return (
    <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/5">
      <div className="animate-sweep h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-signal-400 to-transparent" />
    </div>
  );
}

export function Pagination({ page, limit, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="text-xs text-white/35">
        {from}–{to} / {total}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Oldingi sahifa"
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/50 transition-colors hover:border-white/25 hover:text-white disabled:opacity-30 disabled:hover:border-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="px-2 text-xs tabular-nums text-white/55">
          {page} / {pages}
        </span>

        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Keyingi sahifa"
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/50 transition-colors hover:border-white/25 hover:text-white disabled:opacity-30 disabled:hover:border-white/10"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Filter tabs with counts — used by messages, sessions and certificates. */
export function FilterTabs({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={classNames(
              "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-all",
              active
                ? "border-signal-500/40 bg-signal-500/10 text-signal-300"
                : "border-white/10 bg-white/[.02] text-white/50 hover:border-white/20 hover:text-white/80",
            )}
          >
            {o.label}
            {typeof o.count === "number" ? (
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white/60">
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default TableShell;
