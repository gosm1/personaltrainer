import { CX, DELOAD, IDS, KEY4, PHASES, SESS, TESTS, TOTAL_WEEKS } from "../data/plan";
import type { Anim, ComplexLog, Exercise, Hold, Move, RunLog, SessionId, SessionLog, SetLog, State, ViewerItem } from "../types";
import { addDays, clamp, fmtLong, iso, pad, parse, today0 } from "./dates";

export const weekStart = (S: State, w: number) => addDays(parse(S.start), (w - 1) * 7);
export const weekOfDate = (S: State, d: Date) => Math.floor(Math.round((d.getTime() - parse(S.start).getTime()) / 864e5) / 7) + 1;
export const curWeekRaw = (S: State) => weekOfDate(S, today0());
export const curWeek = (S: State) => clamp(curWeekRaw(S), 1, TOTAL_WEEKS);

export interface Day {
  i: number;
  sid: SessionId;
  date: Date;
}
export const schedule = (S: State, w: number): Day[] => {
  const s = weekStart(S, w);
  return IDS.map((sid, i) => ({ i, sid, date: addDays(s, i) }));
};

export const phase = (w: number) => PHASES.find(p => w >= p.from && w <= p.to) || PHASES[0];
export const isDeload = (w: number) => DELOAD.includes(w);
export const isTest = (w: number) => TESTS.includes(w);
export const isPhaseStart = (w: number) => PHASES.some(p => p.from === w && w > 1);

export const logKey = (w: number, sid: string) => w + ":" + sid;
export const peek = (S: State, w: number, sid: string): SessionLog | undefined => S.logs[logKey(w, sid)];
/** Get the log for a session, creating it. Only call inside store.mutate. */
export const getLog = (S: State, w: number, sid: string): SessionLog => (S.logs[logKey(w, sid)] ||= { done: false });

export const keyDone = (S: State, w: number) => KEY4.filter(s => peek(S, w, s)?.done).length;
export const shortTitle = (sid: SessionId) => SESS[sid].title.split(":")[0];

const filled = (x: SetLog | null | undefined) => !!x && x.r !== "" && x.r != null;

export function lastFor(S: State, sid: string, exId: string, w: number): { wk: number; sets: SetLog[] } | null {
  for (let k = w - 1; k >= 1; k--) {
    const a = peek(S, k, sid)?.ex?.[exId];
    if (a && a.some(filled)) return { wk: k, sets: a.map(x => x || { kg: "", r: "" }) };
  }
  return null;
}
export function lastCX(S: State, w: number): { wk: number; c: ComplexLog } | null {
  for (let k = w - 1; k >= 1; k--) {
    const c = peek(S, k, "UB")?.cx;
    if (c && c.rounds) return { wk: k, c };
  }
  return null;
}
export function lastRun(S: State, sid: string, w: number): { wk: number; z: RunLog } | null {
  for (let k = w - 1; k >= 1; k--) {
    const z = peek(S, k, sid)?.z;
    if (z && (z.min || z.km)) return { wk: k, z };
  }
  return null;
}
export const testBell = (S: State) => peek(S, 1, "UB")?.cx?.bell || "";
export const cxScore = (c: ComplexLog) =>
  (c.rounds || 0) + " rounds" + (c.reps ? " + " + c.reps + " reps" : "") + (c.bell ? " with " + c.bell + " kg" : "");

/** Key sessions dated before today that aren't marked done. */
export function missedKeys(S: State, w: number): SessionId[] {
  const t = iso(today0());
  return schedule(S, w)
    .filter(d => (KEY4 as string[]).includes(d.sid) && !peek(S, w, d.sid)?.done && iso(d.date) < t)
    .map(d => d.sid);
}

/* ---------- exercise prescriptions ---------- */

export const setCount = (e: Exercise, phaseIndex: number, deload: boolean) =>
  deload ? Math.max(1, Math.ceil(e.sets[phaseIndex] / 2)) : e.sets[phaseIndex];
export const repRange = (e: Exercise) => (e.r[0] === e.r[1] ? String(e.r[0]) : e.r[0] + "–" + e.r[1]);
export const restText = (sec: number) =>
  sec >= 60 ? Math.floor(sec / 60) + (sec % 60 ? ":" + pad(sec % 60) : "") + " min" : sec + " s";

export function progression(e: Exercise, last: { wk: number; sets: SetLog[] } | null): { lastTxt: string; hint: string } {
  const hasKg = e.u !== "none";
  if (!last) {
    const hint =
      e.u === "none" ? "Pick a box you can land on comfortably. Height comes later."
      : e.kb ? "First time: pick a bell you can swing powerfully for 10 reps, usually 16–24 kg."
      : e.u === "bw" ? "First time: log your reps" + (e.assist ? " and any assistance" : "") + "."
      : "First time: pick a weight you could lift about " + (e.r[1] + 2) + " times, and stop at " + e.r[1] + ".";
    return { lastTxt: "", hint };
  }
  const got = last.sets.filter(filled);
  const lastTxt =
    "Last time (week " + last.wk + "): " +
    got.map(x => (hasKg && x.kg !== "" && x.kg != null ? x.kg + " " + (e.kgLabel || "kg") + " × " : "") + x.r).join(", ");
  const allTop = got.length > 0 && got.every(x => Number(x.r) >= e.r[1]);
  let hint: string;
  if (e.u === "none") hint = "Quality over height. Same box until every rep feels snappy.";
  else if (allTop)
    hint = e.kb ? "Every set was 10 powerful reps: move up a bell size next time."
      : e.assist ? "Top of the range on every set: drop the assistance one notch."
      : e.u === "bw" ? "Top of the range on every set: add a little weight or slow the lowering to 3 seconds."
      : "Top of the range on every set last time: add the smallest jump (about 2.5 kg upper body, 5 kg legs) and restart at " + e.r[0] + " reps.";
  else hint = e.kb ? "Same bell until all your sets are 10 crisp reps." : "Beat last time: one more rep on any set, same weight.";
  return { lastTxt, hint };
}

/** Placeholders for set i: last time's weight and reps, or the target range. */
export function setPlaceholders(e: Exercise, last: { sets: SetLog[] } | null, i: number) {
  const lp = last ? last.sets[i] || last.sets[last.sets.length - 1] : null;
  return {
    kg: lp && lp.kg != null ? String(lp.kg) : "",
    r: lp && lp.r != null && lp.r !== "" ? String(lp.r) : repRange(e)
  };
}

export function complexPrescription(w: number) {
  return w === 1 ? CX.base : isTest(w) ? CX.test : isDeload(w) ? CX.deload : CX.p[phase(w).i];
}

/* ---------- header and progress ---------- */

export function topline(S: State) {
  const raw = curWeekRaw(S), cw = clamp(raw, 1, TOTAL_WEEKS), ph = phase(cw), finish = addDays(weekStart(S, TOTAL_WEEKS), 6);
  if (raw < 1) return "Week 1 starts " + fmtLong(parse(S.start)) + ". Finish line: " + fmtLong(finish) + ".";
  if (raw > TOTAL_WEEKS) return "All 30 weeks are behind you. The finish line was " + fmtLong(finish) + ".";
  const left = TOTAL_WEEKS - cw;
  return (
    "Week " + cw + " of 30, " + ph.name + " phase. " +
    (left === 0 ? "Final week, finish line " + fmtLong(finish) + "." : left + (left === 1 ? " week" : " weeks") + " after this one, finish line " + fmtLong(finish) + ".")
  );
}

export function progressSummary(S: State) {
  const cw = curWeek(S);
  let total = 0, plates = 0;
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const n = keyDone(S, w);
    total += n;
    if (n >= 3) plates++;
  }
  let streak = 0;
  for (let w = keyDone(S, cw) >= 3 ? cw : cw - 1; w >= 1; w--) {
    if (keyDone(S, w) >= 3) streak++;
    else break;
  }
  return { total, plates, streak };
}

export const num = (v: unknown) => parseFloat(String(v ?? "").replace(",", "."));

export function checkinSeries(S: State, key: "kg" | "waist"): [number, number][] {
  const pts: [number, number][] = [];
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const v = num(S.checkins[w]?.[key]);
    if (!isNaN(v)) pts.push([w, v]);
  }
  return pts;
}

export function hasAnyLog(S: State) {
  return Object.values(S.logs).some(l => l && (l.done || l.ex || l.cx || l.z || l.iso)) || Object.keys(S.checkins).length > 0;
}

/* ---------- exercise viewer ---------- */

export const fromExercise = (e: Exercise): ViewerItem => ({
  title: e.name,
  anims: e.anim,
  altAnims: e.altAnim,
  cue: e.how,
  alt: e.alt,
  note: e.animNote
});
export const fromMove = (m: Move, title?: string): ViewerItem | null =>
  m.anim && m.anim.length ? { title: title || m.text, anims: m.anim, note: m.animNote } : null;
export const fromAnims = (title: string, anims: Anim[] | undefined, note?: string): ViewerItem | null =>
  anims && anims.length ? { title, anims, note } : null;
export const fromHold = (h: Hold): ViewerItem | null =>
  h.anim && h.anim.length ? { title: h.name, anims: h.anim, cue: h.how, note: h.animNote } : null;

/** "3 × 30 s per side" */
export const holdDose = (h: Hold) => `${h.sets} × ${h.secs} s${h.perSide ? " per side" : ""}`;

/** The countdown phases for one set of a hold: one side, or first side then the other. */
export const holdPhases = (h: Hold) =>
  h.perSide
    ? [
        { title: "Hold", detail: `${h.name}, first side`, sec: h.secs },
        { title: "Hold", detail: `${h.name}, other side`, sec: h.secs }
      ]
    : [{ title: "Hold", detail: h.name, sec: h.secs }];
