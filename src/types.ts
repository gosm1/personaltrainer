/* ---------- saved data (same shape as the original HTML tracker, so old backups restore) ---------- */

export interface SetLog {
  kg: string;
  r: string;
  ok?: boolean;
}

export interface ComplexLog {
  bell?: string;
  rounds?: string;
  reps?: string;
  rpe?: string;
}

export interface RunLog {
  min?: string;
  km?: string;
}

export interface SessionLog {
  done: boolean;
  date?: string | null;
  note?: string;
  ex?: Record<string, SetLog[]>;
  cx?: ComplexLog;
  z?: RunLog;
  mob?: Record<string, boolean>;
  /** isometric holds: hold id -> set index -> done */
  iso?: Record<string, Record<string, boolean>>;
}

export interface Checkin {
  kg?: string;
  waist?: string;
}

export interface State {
  v: 2;
  start: string;
  wake: string;
  logs: Record<string, SessionLog>;
  habits: Record<string, Record<string, boolean>>;
  checkins: Record<string, Checkin>;
  tests: Record<string, Record<string, string>>;
}

/* ---------- plan data ---------- */

/** One ExerciseDB animation. `id` is the ExerciseDB exercise id; `label` names it when it differs from the plan's name. */
export interface Anim {
  id: string;
  label?: string;
}

export type ColorKey = "red" | "blue" | "yellow" | "green" | "grey" | "line";
export type SessionId = "Z" | "L" | "U" | "R" | "LB" | "UB" | "M2";
export type KeySessionId = "L" | "U" | "LB" | "UB";

export interface Exercise {
  id: string;
  name: string;
  /** sets per phase: Reboot, Build, Forge, Peak */
  sets: [number, number, number, number];
  /** rep range [low, high] */
  r: [number, number];
  /** rest in seconds */
  rest: number;
  /** "none" = no load field, "bw" = bodyweight (load field is optional extra/assist) */
  u?: "none" | "bw";
  kgLabel?: string;
  assist?: boolean;
  /** reps are counted per leg or per side */
  per?: "leg" | "side";
  kb?: boolean;
  ss?: string;
  how: string;
  alt?: string;
  anim: Anim[];
  altAnim?: Anim[];
  animNote?: string;
}

export interface Session {
  type: "run" | "str" | "rest" | "mob";
  title: string;
  where: string;
  dur: string;
  c: ColorKey;
  why: string;
  warm?: string[];
  ex?: Exercise[];
}

/** An isometric hold, timed instead of counted. */
export interface Hold {
  id: string;
  name: string;
  sets: number;
  secs: number;
  /** one side at a time: each set is `secs` on the first side, then `secs` on the other */
  perSide?: boolean;
  how: string;
  anim?: Anim[];
  animNote?: string;
}

export interface Move {
  text: string;
  anim?: Anim[];
  animNote?: string;
}

export interface Phase {
  i: 0 | 1 | 2 | 3;
  name: string;
  from: number;
  to: number;
  effort: string;
  goal: string;
}

/** What the exercise viewer shows. Built from an Exercise or a Move. */
export interface ViewerItem {
  title: string;
  anims: Anim[];
  altAnims?: Anim[];
  cue?: string;
  alt?: string;
  note?: string;
}
