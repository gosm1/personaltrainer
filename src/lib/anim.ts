import data from "../data/exercises.json";

export interface ExerciseMeta {
  name: string;
  target: string[];
  secondary: string[];
  equipment: string[];
  bodyParts: string[];
  steps: string[];
}

const META = data as Record<string, ExerciseMeta>;

/**
 * Animations come from the free ExerciseDB v1 API by AscendAPI (personal, non-commercial use,
 * attribution required). They load from its CDN on demand and the service worker caches them.
 * To self-host or switch source later, change this one function.
 */
export const gifUrl = (id: string) => `https://static.exercisedb.dev/media/${id}.gif`;
export const meta = (id: string): ExerciseMeta | undefined => META[id];
export const ATTRIBUTION_URL = "https://ascendapi.com";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const pretty = (list: string[] | undefined) => (list || []).map(cap).join(", ");
