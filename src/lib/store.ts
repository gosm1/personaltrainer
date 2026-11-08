import { useSyncExternalStore } from "react";
import type { State } from "../types";
import { defaultStart, isIsoDate, iso, mondayOf, parse } from "./dates";

/** Same key and shape as the original single-file tracker. */
export const STORAGE_KEY = "lockin30.v1";
export const LAST_BACKUP_KEY = "lockin30.lastBackup";

export function fresh(): State {
  return { v: 2, start: defaultStart(), logs: {}, habits: {}, checkins: {}, tests: {}, wake: "07:30" };
}

const isObj = (o: unknown): o is Record<string, unknown> => !!o && typeof o === "object" && !Array.isArray(o);

/** Merge anything that looks like saved data onto a fresh state, dropping malformed parts. */
export function normalize(o: unknown): State {
  const s = fresh();
  if (!isObj(o)) return s;
  if (isIsoDate(o.start)) s.start = iso(mondayOf(parse(o.start)));
  if (typeof o.wake === "string" && /^\d{2}:\d{2}$/.test(o.wake)) s.wake = o.wake;
  if (isObj(o.logs)) s.logs = o.logs as State["logs"];
  if (isObj(o.habits)) s.habits = o.habits as State["habits"];
  if (isObj(o.checkins)) s.checkins = o.checkins as State["checkins"];
  if (isObj(o.tests)) s.tests = o.tests as State["tests"];
  return s;
}

/** Parse backup text. Throws if it is not a Lock-in 30 backup. */
export function parseBackup(text: string): State {
  const o: unknown = JSON.parse(text);
  if (!isObj(o) || !isObj(o.logs)) throw new Error("Not a Lock-in 30 backup");
  return normalize(o);
}

function probeStorage() {
  try {
    localStorage.setItem("__lk", "1");
    localStorage.removeItem("__lk");
    return true;
  } catch {
    return false;
  }
}

let storageOK = false;
let state: State = fresh();
let version = 0;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach(l => l());
}

export function writeNow() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  if (!storageOK) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    storageOK = false;
    emit();
  }
}

/** (Re)load from localStorage. Called once at startup and by tests. */
export function initStore() {
  clearTimeout(saveTimer);
  storageOK = probeStorage();
  state = fresh();
  if (storageOK) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = normalize(JSON.parse(raw));
    } catch {
      /* corrupt data: start fresh rather than crash */
    }
  }
  emit();
}

export const store = {
  get: () => state,
  storageOK: () => storageOK,
  /** Change the state in place. Saves after a short debounce, or right away with `immediate`. */
  mutate(fn: (s: State) => void, immediate = false) {
    fn(state);
    emit();
    if (immediate) writeNow();
    else if (storageOK) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(writeNow, 200);
    }
  },
  replace(next: State) {
    state = next;
    emit();
    writeNow();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  version: () => version
};

/** Re-renders the calling component whenever saved data changes. */
export function useStore(): State {
  useSyncExternalStore(store.subscribe, store.version, store.version);
  return state;
}

export function getLastBackup(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
}
export function setLastBackup(date: string) {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, date);
  } catch {
    /* ignore */
  }
}

if (typeof window !== "undefined") {
  initStore();
  window.addEventListener("pagehide", writeNow);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") writeNow();
  });
}
