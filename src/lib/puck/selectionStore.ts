"use client";

import { useSyncExternalStore } from "react";

// A tiny global store to coordinate multi-selection between the editor canvas
// (component renders defined in config.fixed.tsx) and the editor header toolbar
// (defined in dashboard/puck/page.tsx overrides). We keep it simple on purpose
// to avoid adding extra dependencies.

type Listener = () => void;

let selectedPaths = new Set<string>();
const listeners = new Set<Listener>();

// Keep a cached array reference so getSnapshot returns a stable object identity
// unless the selection actually changes (required by useSyncExternalStore SSR).
let cachedArray: string[] = [];
function updateCache() {
  cachedArray = Array.from(selectedPaths);
}

function emit() {
  listeners.forEach((fn) => {
    try { fn(); } catch {}
  });
}

export const selectionStore = {
  // Subscribe to selection changes. Returns an unsubscribe function.
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  // Return the selected paths as a stable array (path strings).
  get(): string[] {
    return cachedArray;
  },
  has(path: string | undefined | null) {
    if (!path) return false;
    return selectedPaths.has(path);
  },
  set(paths: string[]) {
    selectedPaths = new Set(paths.filter(Boolean));
    updateCache();
    emit();
  },
  clear() {
    if (selectedPaths.size === 0) return;
    selectedPaths.clear();
    updateCache();
    emit();
  },
  toggle(path: string | undefined | null, multi = false) {
    if (!path) return;
    if (!multi) {
      selectedPaths = new Set([path]);
      updateCache();
      emit();
      return;
    }
    if (selectedPaths.has(path)) selectedPaths.delete(path);
    else selectedPaths.add(path);
    updateCache();
    emit();
  },
  size() {
    return selectedPaths.size;
  },
  // Helpers for grouping operations
  parentPathOf(path: string): string {
    const parts = path.split(".");
    parts.pop();
    return parts.join(".");
  },
  sameParent(paths: string[]): { ok: boolean; parent: string | null } {
    const unique = new Set(paths.map((p) => this.parentPathOf(p)));
    if (unique.size === 1) return { ok: true, parent: Array.from(unique)[0] };
    return { ok: false, parent: null };
  },
};

export function useSelectedPaths(): string[] {
  return useSyncExternalStore(selectionStore.subscribe, selectionStore.get, selectionStore.get);
}

export function parseIndexFromPath(path: string): number | null {
  const last = path.split(".").pop();
  if (last == null) return null;
  const n = Number(last);
  return Number.isFinite(n) ? n : null;
}
