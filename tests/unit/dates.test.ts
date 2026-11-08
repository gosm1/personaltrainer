import { describe, expect, it } from "vitest";
import { addDays, addMin, defaultStart, dowOf, fmt, fmtLong, iso, isIsoDate, mondayOf, parse } from "../../src/lib/dates";

describe("dates", () => {
  it("round-trips ISO dates in local time", () => {
    expect(iso(parse("2026-11-09"))).toBe("2026-11-09");
    expect(iso(parse("2027-03-28"))).toBe("2027-03-28");
  });

  it("treats Monday as day 0 and finds the Monday of any date", () => {
    expect(dowOf(parse("2026-11-09"))).toBe(0);
    expect(dowOf(parse("2026-11-15"))).toBe(6);
    expect(iso(mondayOf(parse("2026-11-15")))).toBe("2026-11-09");
    expect(iso(mondayOf(parse("2026-11-09")))).toBe("2026-11-09");
  });

  it("adds days across the March DST change without drifting", () => {
    expect(iso(addDays(parse("2027-03-27"), 1))).toBe("2027-03-28");
    expect(iso(addDays(parse("2027-03-27"), 2))).toBe("2027-03-29");
  });

  it("starts week 1 this Monday on Mon/Tue, otherwise next Monday", () => {
    expect(defaultStart(parse("2026-11-09"))).toBe("2026-11-09");
    expect(defaultStart(parse("2026-11-10"))).toBe("2026-11-09");
    expect(defaultStart(parse("2026-11-11"))).toBe("2026-11-16");
    expect(defaultStart(parse("2026-11-15"))).toBe("2026-11-16");
  });

  it("formats dates and the weekend wake-up time", () => {
    expect(fmt(parse("2026-11-09"))).toBe("9 Nov");
    expect(fmtLong(parse("2027-06-06"))).toBe("Sunday 6 Jun");
    expect(addMin("07:30", 90)).toBe("09:00");
    expect(addMin("23:30", 90)).toBe("01:00");
    expect(addMin("", 90)).toBe("09:00");
  });

  it("validates ISO date strings", () => {
    expect(isIsoDate("2026-11-09")).toBe(true);
    expect(isIsoDate("09/11/2026")).toBe(false);
    expect(isIsoDate(42)).toBe(false);
  });
});
