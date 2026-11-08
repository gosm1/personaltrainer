import { useSyncExternalStore } from "react";

/**
 * The bottom-bar timer: rest between sets, or a hold countdown. A run can have several phases
 * (e.g. a one-sided hold: first side, then the other side); it beeps at the end of each phase.
 */
export interface TimerPhase {
  title: string;
  detail?: string;
  sec: number;
}

let active = false;
let phases: TimerPhase[] = [];
let idx = 0;
let endAt = 0;
let version = 0;
let actx: AudioContext | null = null;
const listeners = new Set<() => void>();
const emit = () => {
  version++;
  listeners.forEach(l => l());
};

function beep() {
  try {
    if (actx) {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.connect(g);
      g.connect(actx.destination);
      o.start(t);
      o.stop(t + 0.65);
    }
  } catch {
    /* sound is a nice-to-have */
  }
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    /* ignore */
  }
}

function unlockAudio() {
  try {
    if (!actx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) actx = new AC();
    }
    if (actx && actx.state === "suspended") void actx.resume();
  } catch {
    /* ignore */
  }
}

export const rest = {
  /** Rest between sets. Must be called from a tap so the browser lets the beep play later. */
  start(sec: number) {
    rest.run([{ title: "Rest", sec }]);
  },
  /** Run one or more timed phases back to back. Also must be called from a tap. */
  run(list: TimerPhase[]) {
    if (!list.length) return;
    unlockAudio();
    phases = list;
    idx = 0;
    endAt = Date.now() + list[0].sec * 1000;
    active = true;
    emit();
  },
  add(sec: number) {
    endAt += sec * 1000;
    emit();
  },
  stop() {
    active = false;
    emit();
  },
  /** Current phase is over: beep, then move to the next phase or finish. */
  finish() {
    beep();
    if (idx < phases.length - 1) {
      idx++;
      endAt = Date.now() + phases[idx].sec * 1000;
    } else active = false;
    emit();
  },
  remaining: () => Math.max(0, endAt - Date.now()),
  isActive: () => active,
  phase: (): TimerPhase | undefined => phases[idx]
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export function useRest() {
  useSyncExternalStore(subscribe, () => version, () => version);
  return { active, endAt, phase: phases[idx] as TimerPhase | undefined };
}
