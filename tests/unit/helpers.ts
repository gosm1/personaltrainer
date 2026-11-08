import type { SessionLog, State } from "../../src/types";

export function makeState(over: Partial<State> = {}): State {
  return { v: 2, start: "2026-11-09", wake: "07:30", logs: {}, habits: {}, checkins: {}, tests: {}, ...over };
}

export function withLogs(logs: Record<string, SessionLog>, over: Partial<State> = {}): State {
  return makeState({ logs, ...over });
}
