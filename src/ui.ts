import { createContext, useContext } from "react";
import type { SessionId, ViewerItem } from "./types";

export type Tab = "week" | "progress" | "plan" | "settings";

export interface UI {
  openSession(w: number, sid: SessionId): void;
  closeSession(): void;
  openViewer(item: ViewerItem): void;
  closeViewer(): void;
  goWeek(w: number): void;
  goTab(t: Tab): void;
}

export const UIContext = createContext<UI | null>(null);

export function useUI(): UI {
  const ui = useContext(UIContext);
  if (!ui) throw new Error("UIContext missing");
  return ui;
}
