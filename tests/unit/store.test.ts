import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY, initStore, normalize, parseBackup, store } from "../../src/lib/store";

/** A backup exactly as the original single-file HTML tracker wrote it. */
const ORIGINAL_HTML_BACKUP = JSON.stringify({
  v: 2,
  start: "2026-11-09",
  logs: {
    "1:L": { done: true, date: "2026-11-10", ex: { l2: [{ kg: "60", r: "8", ok: true }] }, note: "felt good" },
    "1:Z": { done: false, mob: { "0": true, "3": true } }
  },
  habits: { "2026-11-10": { steps: true } },
  checkins: { "1": { kg: "82.4", waist: "91" } },
  tests: { "1": { push: "24" } },
  wake: "06:45"
});

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe("normalize / parseBackup", () => {
  it("accepts a backup from the original HTML tracker unchanged", () => {
    const s = parseBackup(ORIGINAL_HTML_BACKUP);
    expect(s.start).toBe("2026-11-09");
    expect(s.wake).toBe("06:45");
    expect(s.logs["1:L"].ex?.l2[0]).toEqual({ kg: "60", r: "8", ok: true });
    expect(s.checkins["1"].kg).toBe("82.4");
  });

  it("rejects text that isn't a backup", () => {
    expect(() => parseBackup("hello")).toThrow();
    expect(() => parseBackup("{}")).toThrow();
    expect(() => parseBackup("[1,2]")).toThrow();
  });

  it("drops malformed parts and snaps the start to a Monday", () => {
    const s = normalize({ start: "2026-11-12", wake: "late", logs: [], habits: "x", checkins: null });
    expect(s.start).toBe("2026-11-09");
    expect(s.wake).toBe("07:30");
    expect(s.logs).toEqual({});
    expect(s.habits).toEqual({});
    expect(s.checkins).toEqual({});
  });
});

describe("store persistence", () => {
  it("loads saved data from localStorage on start", () => {
    localStorage.setItem(STORAGE_KEY, ORIGINAL_HTML_BACKUP);
    initStore();
    expect(store.get().logs["1:L"].note).toBe("felt good");
    expect(store.storageOK()).toBe(true);
  });

  it("starts fresh instead of crashing on corrupt data", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    initStore();
    expect(store.get().logs).toEqual({});
  });

  it("debounces normal saves and writes immediate ones at once", () => {
    initStore();
    store.mutate(s => {
      s.wake = "06:00";
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    vi.advanceTimersByTime(250);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).wake).toBe("06:00");

    store.mutate(s => {
      s.wake = "05:30";
    }, true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).wake).toBe("05:30");
  });

  it("notifies subscribers on every change", () => {
    initStore();
    const fn = vi.fn();
    const off = store.subscribe(fn);
    store.mutate(s => {
      s.wake = "06:10";
    });
    off();
    store.mutate(s => {
      s.wake = "06:20";
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
