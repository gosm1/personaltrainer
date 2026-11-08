import type { ComplexLog, RunLog, SessionId, SetLog, State } from "../types";
import { iso, mondayOf, parse, today0 } from "./dates";
import { getLog, isTest } from "./logic";
import { fresh, parseBackup, store } from "./store";

/** Every change to saved data goes through here. */

function setRows(S: State, w: number, sid: string, exId: string, i: number): SetLog[] {
  const log = getLog(S, w, sid);
  log.ex ||= {};
  const arr = (log.ex[exId] ||= []);
  for (let j = 0; j <= i; j++) if (!arr[j]) arr[j] = { kg: "", r: "" };
  return arr;
}

export function setSetField(w: number, sid: string, exId: string, i: number, f: "kg" | "r", v: string) {
  store.mutate(S => {
    setRows(S, w, sid, exId, i)[i][f] = v.trim();
  });
}

const NUMERIC = /^\d+([.,]\d+)?$/;

/**
 * Toggle a set as done. When ticking, blank fields take last time's numbers (the placeholders),
 * matching the original tracker. Returns the new done state.
 */
export function toggleSet(w: number, sid: string, exId: string, i: number, fill: { kg?: string; r?: string }) {
  let ok = false;
  store.mutate(S => {
    const row = setRows(S, w, sid, exId, i)[i];
    row.ok = !row.ok;
    ok = row.ok;
    if (ok) {
      (["kg", "r"] as const).forEach(f => {
        const ph = fill[f];
        if ((row[f] === "" || row[f] == null) && ph && NUMERIC.test(ph)) row[f] = ph;
      });
    }
  });
  return ok;
}

export function setComplex(w: number, f: keyof ComplexLog, v: string) {
  store.mutate(S => {
    const log = getLog(S, w, "UB");
    log.cx ||= {};
    log.cx[f] = v;
    if (isTest(w) && (f === "rounds" || f === "reps") && log.cx.rounds) {
      S.tests[w] ||= {};
      S.tests[w].amrap = log.cx.rounds.trim() + (log.cx.reps?.trim() ? " + " + log.cx.reps.trim() : "");
    }
  });
}

export function setRun(w: number, sid: SessionId, f: keyof RunLog, v: string) {
  store.mutate(S => {
    const log = getLog(S, w, sid);
    log.z ||= {};
    log.z[f] = v;
  });
}

export function setCheckin(w: number, f: "kg" | "waist", v: string) {
  store.mutate(S => {
    S.checkins[w] ||= {};
    S.checkins[w][f] = v;
  });
}

export function setTest(w: number, f: string, v: string) {
  store.mutate(S => {
    S.tests[w] ||= {};
    S.tests[w][f] = v;
  });
}

export function setNote(w: number, sid: SessionId, v: string) {
  store.mutate(S => {
    getLog(S, w, sid).note = v;
  });
}

export function toggleMob(w: number, sid: SessionId, i: number) {
  store.mutate(S => {
    const log = getLog(S, w, sid);
    log.mob ||= {};
    log.mob[i] = !log.mob[i];
  });
}

/** Tick or untick one set of an isometric hold. Returns the new done state. */
export function toggleHold(w: number, sid: SessionId, holdId: string, i: number) {
  let on = false;
  store.mutate(S => {
    const log = getLog(S, w, sid);
    log.iso ||= {};
    const sets = (log.iso[holdId] ||= {});
    sets[i] = !sets[i];
    on = sets[i];
  });
  return on;
}

export function toggleHabit(date: string, k: string) {
  store.mutate(S => {
    S.habits[date] ||= {};
    S.habits[date][k] = !S.habits[date][k];
  });
}

/** Returns the new done state. Saved immediately. */
export function toggleComplete(w: number, sid: SessionId) {
  let done = false;
  store.mutate(S => {
    const log = getLog(S, w, sid);
    log.done = !log.done;
    log.date = log.done ? iso(today0()) : null;
    done = log.done;
  }, true);
  return done;
}

export function setStart(v: string) {
  if (!v) return false;
  store.mutate(S => {
    S.start = iso(mondayOf(parse(v)));
  }, true);
  return true;
}

export function setWake(v: string) {
  if (!v) return false;
  store.mutate(S => {
    S.wake = v;
  }, true);
  return true;
}

export function importBackup(text: string) {
  store.replace(parseBackup(text));
}

export function eraseAll() {
  store.replace(fresh());
}

export const backupText = () => JSON.stringify(store.get());
