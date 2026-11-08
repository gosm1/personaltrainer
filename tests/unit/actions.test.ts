import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  backupText, eraseAll, importBackup, setCheckin, setComplex, setSetField, setStart, setTest, toggleComplete, toggleHabit,
  toggleHold, toggleMob, toggleSet
} from "../../src/lib/actions";
import { STORAGE_KEY, initStore, store } from "../../src/lib/store";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-10T09:00:00"));
  initStore();
});
afterEach(() => vi.useRealTimers());

const S = () => store.get();

describe("logging sets", () => {
  it("creates rows up to the edited set", () => {
    setSetField(1, "L", "l2", 2, "kg", " 62.5 ");
    expect(S().logs["1:L"].ex!.l2).toEqual([{ kg: "", r: "" }, { kg: "", r: "" }, { kg: "62.5", r: "" }]);
  });

  it("fills blanks from numeric placeholders when ticking, and leaves typed values alone", () => {
    setSetField(1, "L", "l2", 0, "r", "7");
    expect(toggleSet(1, "L", "l2", 0, { kg: "60", r: "8" })).toBe(true);
    expect(S().logs["1:L"].ex!.l2[0]).toEqual({ kg: "60", r: "7", ok: true });
  });

  it("does not copy a rep range like 5–8 into the reps field", () => {
    toggleSet(1, "L", "l2", 0, { kg: "", r: "5–8" });
    expect(S().logs["1:L"].ex!.l2[0]).toEqual({ kg: "", r: "", ok: true });
  });

  it("unticks without clearing the numbers", () => {
    toggleSet(1, "L", "l2", 0, { kg: "60", r: "8" });
    expect(toggleSet(1, "L", "l2", 0, { kg: "60", r: "8" })).toBe(false);
    expect(S().logs["1:L"].ex!.l2[0]).toEqual({ kg: "60", r: "8", ok: false });
  });
});

describe("complex, check-ins and tests", () => {
  it("copies a test-week complex score into the tests table", () => {
    setComplex(1, "rounds", "6");
    setComplex(1, "reps", "14");
    expect(S().tests[1].amrap).toBe("6 + 14");
  });

  it("does not touch the tests table in a normal week", () => {
    setComplex(2, "rounds", "6");
    expect(S().tests[2]).toBeUndefined();
    expect(S().logs["2:UB"].cx).toEqual({ rounds: "6" });
  });

  it("stores check-ins and tests", () => {
    setCheckin(3, "kg", "81.2");
    setTest(12, "push", "30");
    expect(S().checkins[3]).toEqual({ kg: "81.2" });
    expect(S().tests[12]).toEqual({ push: "30" });
  });
});

describe("toggles", () => {
  it("marks a session done with today's date, and undoes it", () => {
    expect(toggleComplete(1, "L")).toBe(true);
    expect(S().logs["1:L"]).toMatchObject({ done: true, date: "2026-11-10" });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).logs["1:L"].done).toBe(true); // saved immediately
    expect(toggleComplete(1, "L")).toBe(false);
    expect(S().logs["1:L"]).toMatchObject({ done: false, date: null });
  });

  it("ticks and unticks isometric hold sets", () => {
    expect(toggleHold(1, "Z", "hm2", 0)).toBe(true);
    expect(toggleHold(1, "Z", "hm2", 2)).toBe(true);
    expect(S().logs["1:Z"].iso).toEqual({ hm2: { 0: true, 2: true } });
    expect(toggleHold(1, "Z", "hm2", 0)).toBe(false);
    expect(S().logs["1:Z"].iso!.hm2[0]).toBe(false);
  });

  it("toggles habits and mobility items", () => {
    toggleHabit("2026-11-10", "steps");
    toggleMob(1, "Z", 3);
    expect(S().habits["2026-11-10"].steps).toBe(true);
    expect(S().logs["1:Z"].mob![3]).toBe(true);
    toggleHabit("2026-11-10", "steps");
    expect(S().habits["2026-11-10"].steps).toBe(false);
  });
});

describe("settings and backups", () => {
  it("snaps a new start date to its Monday", () => {
    setStart("2026-11-19");
    expect(S().start).toBe("2026-11-16");
  });

  it("round-trips a backup and erases everything", () => {
    toggleComplete(1, "L");
    const text = backupText();
    eraseAll();
    expect(S().logs).toEqual({});
    importBackup(text);
    expect(S().logs["1:L"].done).toBe(true);
  });
});
