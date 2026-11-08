import { useSyncExternalStore } from "react";

let current: { msg: string; id: number } | null = null;
let n = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export function toast(msg: string) {
  current = { msg, id: ++n };
  clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    emit();
  }, 2800);
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const useToast = () => useSyncExternalStore(subscribe, () => current, () => current);
