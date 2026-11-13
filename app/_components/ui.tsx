"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export function Badge() {
  return (
    <span
      title="Subscribed member"
      className="inline-flex items-center  bg-green px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white"
    >
      Pro
    </span>
  );
}

/** Custom error component used by every form. Announced to screen readers. */
export function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="fade-in flex items-start gap-2  bg-red-soft px-4 py-3 text-sm font-semibold text-red">
      <span aria-hidden className="mt-0.5 inline-block h-2 w-2 shrink-0  bg-red" />
      {message}
    </div>
  );
}

export function SuccessMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="status" className="fade-in  bg-green-soft px-4 py-3 text-sm font-semibold text-green">
      {message}
    </div>
  );
}

export function SubmitButton({
  children,
  className = "btn btn-blue",
  pendingText = "Please wait…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}

export interface Option {
  value: string;
  label: string;
}

/** Custom dropdown (replaces the native select). Keyboard accessible, posts via a hidden input. */
export function Select({
  name,
  options,
  defaultValue = "",
  placeholder = "Select…",
  onChange,
}: {
  name: string;
  options: Option[];
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const choose = (v: string) => {
    setValue(v);
    setOpen(false);
    onChange?.(v);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActive((i) => (e.key === "ArrowDown" ? Math.min(i + 1, options.length - 1) : Math.max(i - 1, 0)));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      choose(options[active].value);
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={root} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={() => {
          setActive(Math.max(0, options.findIndex((o) => o.value === value)));
          setOpen((o) => !o);
        }}
        onKeyDown={onKey}
        className="field flex items-center justify-between text-left"
      >
        <span className={current ? "" : "text-[#98a1bd]"}>{current?.label ?? placeholder}</span>
        <svg aria-hidden width="14" height="14" viewBox="0 0 20 20" className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <path d="M5 7l5 6 5-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="fade-in absolute z-20 mt-2 max-h-64 w-full overflow-auto  bg-paper p-1.5 ring-1 ring-black/5"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(o.value);
              }}
              className={`cursor-pointer  px-3 py-2 text-sm font-semibold ${
                i === active ? "bg-surface-2 text-accent" : ""
              } ${o.value === value ? "text-accent" : ""}`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Guests can look around, but any real action asks them to register first.
 * Wrap the element that triggers the action; signed-in users pass straight through.
 */
export function Gate({
  allowed,
  reason,
  children,
}: {
  allowed: boolean;
  reason: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (allowed) return <>{children}</>;
  return (
    <>
      <span
        className="contents"
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
      </span>
      {open && (
        <div
          className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm  bg-paper p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-extrabold">Join to continue</h2>
            <p className="mt-2 text-sm text-muted">{reason}</p>
            <div className="mt-5 flex gap-2">
              <a href={`/register?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`} className="btn btn-blue flex-1">
                Create account
              </a>
              <a href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`} className="btn btn-soft flex-1">
                Sign in
              </a>
            </div>
            <button onClick={() => setOpen(false)} className="mt-3 w-full text-sm font-semibold text-muted">
              Keep browsing
            </button>
          </div>
        </div>
      )}
    </>
  );
}
