import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HOLDS_MON, SESS } from "../../src/data/plan";
import {
  checkinSeries, complexPrescription, cxScore, curWeekRaw, holdDose, holdPhases, isDeload, isTest, keyDone, lastCX, lastFor, lastRun,
  missedKeys, phase, progression, progressSummary, repRange, restText, schedule, setCount, setPlaceholders, testBell,
  topline, weekOfDate
} from "../../src/lib/logic";
import { iso, parse } from "../../src/lib/dates";
import type { Exercise } from "../../src/types";
import { makeState, withLogs } from "./helpers";

const ex = (sid: "L" | "U" | "LB" | "UB", id: string): Exercise => SESS[sid].ex!.find(e => e.id === id)!;

describe("phases and special weeks", () => {
  it("maps weeks to the right phase", () => {
    expect([1, 4, 5, 12, 13, 21, 22, 30].map(w => phase(w).name)).toEqual(["Reboot", "Reboot", "Build", "Build", "Forge", "Forge", "Peak", "Peak"]);
  });
  it("knows deload and test weeks", () => {
    expect([12, 21, 26].every(isDeload)).toBe(true);
    expect(isDeload(13)).toBe(false);
    expect([1, 12, 21, 30].every(isTest)).toBe(true);
    expect(isTest(2)).toBe(false);
  });
});

describe("schedule", () => {
  const S = makeState({ start: "2026-11-09" });
  it("lays out Monday to Sunday in plan order", () => {
    const sch = schedule(S, 1);
    expect(sch.map(d => d.sid)).toEqual(["Z", "L", "U", "R", "LB", "UB", "M2"]);
    expect(iso(sch[0].date)).toBe("2026-11-09");
    expect(iso(sch[6].date)).toBe("2026-11-15");
    expect(iso(schedule(S, 2)[0].date)).toBe("2026-11-16");
  });
  it("computes the week of a date, including across DST", () => {
    expect(weekOfDate(S, parse("2026-11-09"))).toBe(1);
    expect(weekOfDate(S, parse("2026-11-15"))).toBe(1);
    expect(weekOfDate(S, parse("2026-11-16"))).toBe(2);
    expect(weekOfDate(S, parse("2026-11-08"))).toBe(0);
    // Week 21 starts 29 Mar 2027, the day after clocks go forward in the UK.
    expect(weekOfDate(S, parse("2027-03-28"))).toBe(20);
    expect(weekOfDate(S, parse("2027-03-29"))).toBe(21);
  });
});

describe("sets, reps and rest", () => {
  it("halves sets on deload weeks, never below one", () => {
    const zercher = ex("L", "l2");
    expect(setCount(zercher, 1, false)).toBe(4);
    expect(setCount(zercher, 1, true)).toBe(2);
    expect(setCount({ ...zercher, sets: [1, 1, 1, 1] }, 0, true)).toBe(1);
    expect(setCount(ex("L", "l1"), 0, true)).toBe(2); // 3 sets -> 2
  });
  it("formats rep ranges and rest", () => {
    expect(repRange(ex("L", "l1"))).toBe("3");
    expect(repRange(ex("L", "l2"))).toBe("5–8");
    expect(restText(150)).toBe("2:30 min");
    expect(restText(120)).toBe("2 min");
    expect(restText(30)).toBe("30 s");
  });
});

describe("progression hints", () => {
  it("gives first-time advice per exercise type", () => {
    expect(progression(ex("L", "l1"), null).hint).toMatch(/Pick a box/);
    expect(progression(ex("LB", "lb1"), null).hint).toMatch(/16–24 kg/);
    expect(progression(ex("UB", "ub2"), null).hint).toBe("First time: log your reps and any assistance.");
    expect(progression(ex("L", "l7"), null).hint).toBe("First time: log your reps.");
    expect(progression(ex("L", "l2"), null).hint).toBe("First time: pick a weight you could lift about 10 times, and stop at 8.");
  });

  it("tells you to add weight when every set hit the top of the range", () => {
    const last = { wk: 3, sets: [{ kg: "60", r: "8" }, { kg: "60", r: "8" }, { kg: "60", r: "9" }] };
    const p = progression(ex("L", "l2"), last);
    expect(p.lastTxt).toBe("Last time (week 3): 60 kg × 8, 60 kg × 8, 60 kg × 9");
    expect(p.hint).toMatch(/add the smallest jump .* restart at 5 reps/);
  });

  it("asks for one more rep when the range wasn't topped out", () => {
    const last = { wk: 2, sets: [{ kg: "60", r: "8" }, { kg: "60", r: "6" }] };
    expect(progression(ex("L", "l2"), last).hint).toBe("Beat last time: one more rep on any set, same weight.");
  });

  it("handles kettlebell, assisted and bodyweight top-outs", () => {
    const top10 = { wk: 1, sets: [{ kg: "24", r: "10" }, { kg: "24", r: "10" }] };
    expect(progression(ex("LB", "lb1"), top10).hint).toMatch(/move up a bell size/);
    expect(progression(ex("UB", "ub2"), top10).hint).toMatch(/drop the assistance/);
    expect(progression(ex("UB", "ub2"), top10).lastTxt).toBe("Last time (week 1): 24 assist kg × 10, 24 assist kg × 10");
    const top15 = { wk: 1, sets: [{ kg: "", r: "15" }] };
    expect(progression(ex("L", "l7"), top15).hint).toMatch(/add a little weight/);
    expect(progression(ex("L", "l7"), top15).lastTxt).toBe("Last time (week 1): 15");
  });

  it("uses last time's numbers as placeholders, falling back to the target range", () => {
    const e = ex("L", "l2");
    const last = { sets: [{ kg: "60", r: "8" }] };
    expect(setPlaceholders(e, last, 0)).toEqual({ kg: "60", r: "8" });
    expect(setPlaceholders(e, last, 2)).toEqual({ kg: "60", r: "8" }); // reuses the last logged set
    expect(setPlaceholders(e, null, 0)).toEqual({ kg: "", r: "5–8" });
  });
});

describe("history lookups", () => {
  const S = withLogs({
    "1:L": { done: true, ex: { l2: [{ kg: "50", r: "8" }] } },
    "2:L": { done: false, ex: { l2: [{ kg: "", r: "" }] } },
    "1:UB": { done: true, cx: { bell: "16", rounds: "5", reps: "12", rpe: "7" } },
    "1:Z": { done: true, z: { min: "30", km: "4.2" } }
  });
  it("finds the latest earlier week with reps logged", () => {
    expect(lastFor(S, "L", "l2", 3)).toEqual({ wk: 1, sets: [{ kg: "50", r: "8" }] });
    expect(lastFor(S, "L", "l2", 1)).toBeNull();
  });
  it("finds the last complex score, the week-1 bell and the last run", () => {
    expect(lastCX(S, 4)?.wk).toBe(1);
    expect(cxScore(lastCX(S, 4)!.c)).toBe("5 rounds + 12 reps with 16 kg");
    expect(testBell(S)).toBe("16");
    expect(lastRun(S, "Z", 2)).toEqual({ wk: 1, z: { min: "30", km: "4.2" } });
    expect(lastRun(S, "R", 20)).toBeNull();
  });
});

describe("counting and streaks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-26T10:00:00")); // Thursday of week 3
  });
  afterEach(() => vi.useRealTimers());

  it("counts key sessions, plates and the current streak", () => {
    const done = { done: true };
    const S = withLogs({ "1:L": done, "1:U": done, "1:LB": done, "2:L": done, "2:U": done, "2:LB": done, "2:UB": done, "3:L": done, "1:Z": done });
    expect(curWeekRaw(S)).toBe(3);
    expect(keyDone(S, 1)).toBe(3);
    expect(keyDone(S, 2)).toBe(4);
    expect(progressSummary(S)).toEqual({ total: 8, plates: 2, streak: 2 });
  });

  it("lists key sessions dated before today that aren't done", () => {
    const S = withLogs({ "3:L": { done: true } });
    expect(missedKeys(S, 3)).toEqual(["U"]); // Tue done, Wed missed, Fri/Sat still ahead
    expect(missedKeys(S, 2)).toEqual(["L", "U", "LB", "UB"]);
  });

  it("describes where you are in the 30 weeks", () => {
    expect(topline(makeState({ start: "2026-11-09" }))).toBe("Week 3 of 30, Reboot phase. 27 weeks after this one, finish line Sunday 6 Jun.");
    expect(topline(makeState({ start: "2026-11-30" }))).toBe("Week 1 starts Monday 30 Nov. Finish line: Sunday 27 Jun.");
    expect(topline(makeState({ start: "2026-04-27" }))).toMatch(/^All 30 weeks are behind you/);
    expect(topline(makeState({ start: "2026-05-04" }))).toBe("Week 30 of 30, Peak phase. Final week, finish line Sunday 29 Nov.");
  });
});

describe("isometric holds", () => {
  it("times one-sided holds as two phases and two-sided holds as one", () => {
    const lunge = HOLDS_MON.find(h => h.id === "hm2")!;
    const calf = HOLDS_MON.find(h => h.id === "hm5")!;
    expect(holdDose(lunge)).toBe("3 × 30 s per side");
    expect(holdDose(calf)).toBe("3 × 30 s");
    expect(holdPhases(lunge)).toEqual([
      { title: "Hold", detail: "Deep lunge hold, first side", sec: 30 },
      { title: "Hold", detail: "Deep lunge hold, other side", sec: 30 }
    ]);
    expect(holdPhases(calf)).toEqual([{ title: "Hold", detail: "Calf raise hold", sec: 30 }]);
  });
});

describe("complex and check-ins", () => {
  it("prescribes the right complex for each kind of week", () => {
    expect(complexPrescription(1)).toMatch(/^Baseline test/);
    expect(complexPrescription(12)).toMatch(/^Test week/);
    expect(complexPrescription(26)).toMatch(/^Deload/);
    expect(complexPrescription(2)).toMatch(/^12 minutes/);
    expect(complexPrescription(6)).toMatch(/^15 minutes, as many rounds/);
    expect(complexPrescription(15)).toMatch(/one bell size heavier/);
    expect(complexPrescription(23)).toMatch(/Push the rounds to your best/);
  });
  it("reads check-ins with dot or comma decimals and skips blanks", () => {
    const S = makeState({ checkins: { 1: { kg: "82.4" }, 2: { kg: "81,9", waist: "90" }, 3: { kg: "" } } });
    expect(checkinSeries(S, "kg")).toEqual([[1, 82.4], [2, 81.9]]);
    expect(checkinSeries(S, "waist")).toEqual([[2, 90]]);
  });
});
