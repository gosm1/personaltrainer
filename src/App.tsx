import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExerciseViewer } from "./components/ExerciseViewer";
import { Header } from "./components/Header";
import { RestTimer, Toast } from "./components/Overlays";
import { PlanView } from "./components/PlanView";
import { ProgressView } from "./components/ProgressView";
import { SessionSheet } from "./components/SessionSheet";
import { SettingsView } from "./components/SettingsView";
import { WeekView } from "./components/WeekView";
import { curWeek, hasAnyLog } from "./lib/logic";
import { getLastBackup, store, useStore } from "./lib/store";
import { parse, today0 } from "./lib/dates";
import type { SessionId, ViewerItem } from "./types";
import { UIContext, type Tab, type UI } from "./ui";

const TABS: { id: Tab; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "progress", label: "Progress" },
  { id: "plan", label: "Plan" },
  { id: "settings", label: "Settings" }
];

type HistState = { lk?: "sheet" | "viewer"; t?: number } | null;
const histState = () => history.state as HistState;

function Banners({ onBackup }: { onBackup: () => void }) {
  const S = useStore();
  if (!store.storageOK()) {
    return (
      <p className="banner" role="alert">
        Saving is blocked in this browser (private mode or blocked site data), so anything you log disappears when you close the tab. Open the app in a normal window, or download a
        backup in Settings before you leave.
      </p>
    );
  }
  const lb = getLastBackup();
  const days = lb ? Math.round((today0().getTime() - parse(lb).getTime()) / 864e5) : Infinity;
  if (hasAnyLog(S) && days > 14) {
    return (
      <p className="banner" data-testid="backup-reminder">
        Your logs live only in this browser. {lb ? `Your last backup was ${days} days ago.` : "You haven’t made a backup yet."}{" "}
        <button type="button" className="linkish" onClick={onBackup}>Back up now</button>
      </p>
    );
  }
  return null;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("week");
  const [viewWeek, setViewWeek] = useState(() => curWeek(store.get()));
  const [open, setOpen] = useState<{ w: number; sid: SessionId } | null>(null);
  const [viewer, setViewer] = useState<ViewerItem | null>(null);

  const openRef = useRef(open);
  const viewerRef = useRef(viewer);
  const sheetToken = useRef(0);
  const returnFocus = useRef<Element | null>(null);
  useEffect(() => {
    openRef.current = open;
    viewerRef.current = viewer;
  });

  // A reload can leave one of our overlay entries as the current history entry; neutralise it.
  useEffect(() => {
    if (histState()?.lk) history.replaceState(null, "");
  }, []);

  // Phone back button / browser back closes the viewer first, then the session.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = e.state as HistState;
      setViewer(null);
      const keepSheet = !!st && (st.lk === "sheet" || st.lk === "viewer") && st.t === sheetToken.current && sheetToken.current !== 0;
      if (!keepSheet) {
        setOpen(null);
        sheetToken.current = 0;
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const ui: UI = useMemo(
    () => ({
      openSession(w, sid) {
        if (!openRef.current) {
          returnFocus.current = document.activeElement;
          sheetToken.current = Date.now();
          history.pushState({ lk: "sheet", t: sheetToken.current }, "");
        }
        setOpen({ w, sid });
      },
      closeSession() {
        const st = histState();
        if (st?.lk === "sheet" && st.t === sheetToken.current) history.back();
        else {
          setOpen(null);
          sheetToken.current = 0;
        }
      },
      openViewer(item) {
        if (!viewerRef.current) history.pushState({ lk: "viewer", t: sheetToken.current }, "");
        setViewer(item);
      },
      closeViewer() {
        if (histState()?.lk === "viewer") history.back();
        else setViewer(null);
      },
      goWeek(w) {
        setViewWeek(w);
        setTab("week");
      },
      goTab(t) {
        setTab(t);
        window.scrollTo(0, 0);
      }
    }),
    []
  );

  // Lock page scroll under overlays; give focus back when the session closes.
  useEffect(() => {
    document.body.classList.toggle("lock", !!open || !!viewer);
  }, [open, viewer]);
  useEffect(() => {
    if (!open && returnFocus.current instanceof HTMLElement && returnFocus.current.isConnected) {
      returnFocus.current.focus();
      returnFocus.current = null;
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (viewerRef.current) ui.closeViewer();
      else if (openRef.current) ui.closeSession();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ui]);

  const resetWeek = useCallback(() => setViewWeek(curWeek(store.get())), []);

  return (
    <UIContext.Provider value={ui}>
      <div className="wrap" aria-hidden={open || viewer ? true : undefined}>
        <Header viewWeek={viewWeek} />
        <nav className="tabs" role="tablist" aria-label="Sections">
          {TABS.map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} data-tab={t.id} onClick={() => ui.goTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <Banners onBackup={() => ui.goTab("settings")} />
        <main id="main">
          {tab === "week" ? <WeekView w={viewWeek} setWeek={setViewWeek} />
            : tab === "progress" ? <ProgressView />
            : tab === "plan" ? <PlanView />
            : <SettingsView onStartChanged={resetWeek} />}
        </main>
      </div>
      {open ? <SessionSheet w={open.w} sid={open.sid} /> : null}
      {viewer ? <ExerciseViewer item={viewer} /> : null}
      <RestTimer />
      <Toast />
    </UIContext.Provider>
  );
}
