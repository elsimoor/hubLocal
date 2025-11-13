"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type ActionType =
  | { event: "click" | "mouseenter" | "mouseleave"; type: "navigate"; url?: string; target?: "_self" | "_blank" }
  | { event: "click" | "mouseenter" | "mouseleave"; type: "scrollTo"; targetElId?: string; selector?: string; offset?: number; smooth?: boolean }
  | { event: "click" | "mouseenter" | "mouseleave"; type: "copy"; text?: string }
  | { event: "click" | "mouseenter" | "mouseleave"; type: "emit"; name: string; detail?: string }
  | { event: "click" | "mouseenter" | "mouseleave"; type: "toggle"; flag: string }
  | { event: "click" | "mouseenter" | "mouseleave"; type: "setFlag"; flag: string; value?: boolean }
  | { event: "click" | "mouseenter" | "mouseleave"; type: "runJS"; code: string };

export type ActionState = {
  flags: Record<string, boolean>;
  setFlag: (name: string, value: boolean) => void;
  toggleFlag: (name: string) => void;
  allowCustomJS: boolean;
};

const ActionCtx = createContext<ActionState | null>(null);

export function ActionStateProvider({ allowCustomJS, children }: { allowCustomJS?: boolean; children: React.ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const api = useMemo<ActionState>(() => ({
    flags,
    setFlag: (name, value) => setFlags((f) => ({ ...f, [name]: value })),
    toggleFlag: (name) => setFlags((f) => ({ ...f, [name]: !f[name] })),
    allowCustomJS: !!allowCustomJS,
  }), [flags, allowCustomJS]);
  return <ActionCtx.Provider value={api}>{children}</ActionCtx.Provider>;
}

export function useActionState() {
  const ctx = useContext(ActionCtx);
  if (!ctx) throw new Error("useActionState must be used within ActionStateProvider");
  return ctx;
}

export async function runActions(
  actions: ActionType[] | undefined,
  opts: {
    isEditing?: boolean;
    currentEl?: HTMLElement | null;
    ctxOverride?: ActionState | null;
  }
) {
  if (!Array.isArray(actions) || actions.length === 0) return;
  const ctx = opts?.ctxOverride ?? ((typeof window !== "undefined") ? (ActionCtx as any)._currentValue as ActionState | null : null);
  // We run all non‑navigate actions before navigate actions.  Navigating away
  // from the page can stop subsequent actions from running (e.g. toggling a
  // flag to open a modal).  To mitigate this, we partition actions and run
  // non‑navigate actions first, followed by navigate actions.
  const nonNavigate: ActionType[] = [];
  const navigateActions: ActionType[] = [];
  for (const a of actions) {
    if (a.type === "navigate") navigateActions.push(a);
    else nonNavigate.push(a);
  }
  const allActs = [...nonNavigate, ...navigateActions];
  for (const a of allActs) {
    try {
      switch (a.type) {
        case "navigate": {
          const url = a.url || "#";
          const target = a.target || "_self";
          // In editing mode we always open links in a new tab to preserve the editor
          // state. Outside of editing we respect the configured target.
          if (opts.isEditing) {
            try { window.open(url, "_blank", "noopener"); } catch {}
          } else {
            if (target === "_blank") window.open(url, "_blank", "noopener");
            else window.location.href = url;
          }
          break;
        }
        case "scrollTo": {
          const sel = a.selector;
          let el: HTMLElement | null = null;
          if (a.targetElId) el = document.getElementById(a.targetElId);
          if (!el && sel) el = document.querySelector(sel) as HTMLElement | null;
          if (!el) break;
          const y = el.getBoundingClientRect().top + window.scrollY - (a.offset ?? 0);
          window.scrollTo({ top: y, behavior: a.smooth ? "smooth" : ("auto" as ScrollBehavior) });
          break;
        }
        case "copy": {
          const t = a.text || "";
          if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(t);
          break;
        }
        case "emit": {
          const name = a.name || "puck:event";
          let detail: any = undefined;
          try { detail = a.detail ? JSON.parse(a.detail) : undefined; } catch { detail = a.detail; }
          window.dispatchEvent(new CustomEvent(name, { detail }));
          break;
        }
        case "toggle": {
          const name = (a.flag || "").trim();
          if (!name) break;
          const current = ctx?.flags?.[name];
          ctx?.setFlag(name, !(current ?? false));
          break;
        }
        case "setFlag": {
          const name = (a.flag || "").trim();
          if (!name) break;
          const v: any = (a as any).value;
          const b = typeof v === "string" ? v === "true" : !!v;
          ctx?.setFlag(name, b);
          break;
        }
        case "runJS": {
          if (!ctx?.allowCustomJS) break;
          const code = a.code || "";
          const fn = new Function("ctx", "el", code);
          try { fn({ flags: ctx.flags, setFlag: ctx.setFlag, toggleFlag: ctx.toggleFlag }, opts.currentEl || null); } catch {}
          break;
        }
      }
    } catch {
      // Swallow action errors to avoid breaking UI
    }
  }
}
