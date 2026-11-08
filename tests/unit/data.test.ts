import { describe, expect, it } from "vitest";
import exercises from "../../src/data/exercises.json";
import { BACKUPS, CX, HOLDS_MON, HOLDS_THU, IDS, MOB, MOB_MON, PHASES, SESS, TESTF } from "../../src/data/plan";
import { gifUrl } from "../../src/lib/anim";
import type { Anim } from "../../src/types";

const META = exercises as Record<string, { name: string; target: string[]; steps: string[] }>;

const allAnims: { where: string; a: Anim }[] = [];
for (const sid of IDS) for (const e of SESS[sid].ex || []) {
  e.anim.forEach(a => allAnims.push({ where: `${sid}/${e.name}`, a }));
  e.altAnim?.forEach(a => allAnims.push({ where: `${sid}/${e.name} (swap)`, a }));
}
CX.moves.forEach(m => m.anim?.forEach(a => allAnims.push({ where: `complex/${m.text}`, a })));
BACKUPS.forEach(b => b.moves.forEach(m => m.anim?.forEach(a => allAnims.push({ where: `${b.name}/${m.text}`, a }))));
MOB.forEach(m => m.anim?.forEach(a => allAnims.push({ where: `mobility/${m.name}`, a })));
[...HOLDS_MON, ...HOLDS_THU].forEach(h => h.anim?.forEach(a => allAnims.push({ where: `hold/${h.name}`, a })));

describe("plan data", () => {
  it("covers all 30 weeks with four contiguous phases", () => {
    expect(PHASES.map(p => [p.from, p.to])).toEqual([[1, 4], [5, 12], [13, 21], [22, 30]]);
  });

  it("gives every strength exercise four phase set counts, a valid rep range and an animation", () => {
    for (const sid of IDS) {
      const ids = new Set<string>();
      for (const e of SESS[sid].ex || []) {
        expect(e.sets).toHaveLength(4);
        expect(e.r[0]).toBeLessThanOrEqual(e.r[1]);
        expect(e.anim.length, e.name).toBeGreaterThan(0);
        expect(ids.has(e.id), `duplicate id ${e.id}`).toBe(false);
        ids.add(e.id);
      }
    }
  });

  it("has metadata (target muscles and steps) for every animation it references", () => {
    for (const { where, a } of allAnims) {
      const m = META[a.id];
      expect(m, `${where}: ${a.id} missing from exercises.json`).toBeDefined();
      expect(m.target.length, `${where}: no target muscles`).toBeGreaterThan(0);
      expect(m.steps.length, `${where}: no steps`).toBeGreaterThan(0);
    }
  });

  it("does not ship animations the plan no longer uses", () => {
    const used = new Set(allAnims.map(x => x.a.id));
    expect(Object.keys(META).filter(id => !used.has(id))).toEqual([]);
  });

  it("builds CDN URLs for animations", () => {
    expect(gifUrl("UHJlbu3")).toBe("https://static.exercisedb.dev/media/UHJlbu3.gif");
  });

  it("trains abs with two exercises on each leg day, and rear delts and forearms on both upper days", () => {
    const ids = (sid: "L" | "U" | "LB" | "UB") => SESS[sid].ex!.map(e => e.id);
    expect(ids("L").slice(-2)).toEqual(["l7", "l8"]); // knee raise + Pallof press
    expect(ids("LB").slice(-2)).toEqual(["lb7", "lb8"]); // cable crunch + lying leg raise
    expect(ids("U")).toEqual(expect.arrayContaining(["u8", "u9", "u10"])); // face pull, wrist curls
    expect(ids("UB").indexOf("ub6")).toBe(3); // reverse pec deck early
    expect(ids("UB")).toContain("ub9"); // reverse curl
  });

  it("keeps saved mobility ticks meaningful: MOB order is fixed and Monday's subset is valid", () => {
    // Mobility ticks are saved by index into MOB, so reordering MOB would scramble old logs.
    expect(MOB.map(m => m.name)).toEqual([
      "Cat–cow", "World’s greatest stretch", "90/90 hip switches", "Couch stretch", "Deep squat hold", "Thoracic open book", "Dead hang"
    ]);
    expect(MOB_MON.map(i => MOB[i].name)).toEqual(["Cat–cow", "World’s greatest stretch", "Thoracic open book", "Dead hang"]);
  });

  it("defines the nine isometric holds at 3 × 30 s with unique ids", () => {
    const all = [...HOLDS_MON, ...HOLDS_THU];
    expect(all).toHaveLength(9);
    expect(new Set(all.map(h => h.id)).size).toBe(9);
    expect(all.every(h => h.sets === 3 && h.secs === 30)).toBe(true);
    expect(all.filter(h => h.perSide).map(h => h.name)).toEqual(["Deep lunge hold", "Cossack squat hold", "Single-leg deadlift hold", "Copenhagen plank"]);
  });

  it("keeps the five tests", () => {
    expect(TESTF.map(t => t.k)).toEqual(["push", "run", "amrap", "zercher", "photos"]);
  });
});
