import { useEffect, useRef, useState } from "react";
import { backupText, eraseAll, importBackup, setStart, setWake } from "../lib/actions";
import { ATTRIBUTION_URL } from "../lib/anim";
import { fmtLong, iso, parse } from "../lib/dates";
import { getLastBackup, setLastBackup, store, useStore } from "../lib/store";
import { toast } from "../lib/toast";

/** Fires on the native `change` event (like the original), not on every keystroke. */
function useNativeChange<T extends HTMLInputElement>(handler: (v: string) => void) {
  const ref = useRef<T>(null);
  const h = useRef(handler);
  h.current = handler;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fn = () => h.current(el.value);
    el.addEventListener("change", fn);
    return () => el.removeEventListener("change", fn);
  }, []);
  return ref;
}

const validYear = (v: string) => {
  const y = Number(v.slice(0, 4));
  return y >= 2000 && y <= 2100;
};

export function SettingsView({ onStartChanged }: { onStartChanged: () => void }) {
  const S = useStore();
  const [resetArm, setResetArm] = useState(false);
  const [imp, setImp] = useState("");
  const [msg, setMsg] = useState("");
  const [lastBackup, setLB] = useState(getLastBackup());
  const impRef = useRef<HTMLTextAreaElement>(null);

  const startRef = useNativeChange<HTMLInputElement>(v => {
    if (!v || !validYear(v)) return;
    setStart(v);
    onStartChanged();
    toast("Saved.");
  });
  const wakeRef = useNativeChange<HTMLInputElement>(v => {
    if (setWake(v)) toast("Saved.");
  });

  // Keep the uncontrolled date/time inputs in sync after a restore or reset.
  useEffect(() => {
    if (startRef.current && document.activeElement !== startRef.current) startRef.current.value = S.start;
    if (wakeRef.current && document.activeElement !== wakeRef.current) wakeRef.current.value = S.wake;
  });

  useEffect(() => {
    if (!resetArm) return;
    const t = setTimeout(() => setResetArm(false), 5000);
    return () => clearTimeout(t);
  }, [resetArm]);

  function markBackedUp() {
    const d = iso(new Date());
    setLastBackup(d);
    setLB(d);
  }

  function download() {
    try {
      const blob = new Blob([backupText()], { type: "application/json" });
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = "lockin30-backup-" + iso(new Date()) + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 2000);
      markBackedUp();
    } catch {
      toast("Download didn’t start here. Use Copy backup text instead.");
    }
  }

  function copy() {
    const txt = backupText();
    const fallback = () => {
      setImp(txt);
      setTimeout(() => impRef.current?.select(), 0);
      setMsg("Backup text is in the box above. Select it all and copy it somewhere safe.");
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(txt).then(() => {
        markBackedUp();
        toast("Backup copied. Paste it somewhere safe.");
      }, fallback);
    } else fallback();
  }

  function restore(text: string) {
    try {
      importBackup(text);
      onStartChanged();
      setMsg("");
      setImp("");
      toast("Backup restored.");
    } catch {
      setMsg("That text isn’t a Lock-in 30 backup. Paste the full text from Copy backup text or the downloaded file.");
    }
  }

  async function restoreFile(file: File | undefined) {
    if (!file) return;
    restore(await file.text());
  }

  return (
    <>
      <h2>Settings</h2>
      <div className="settings">
        <label className="fld">
          <span className="fl">Week 1 starts on</span>
          <input ref={startRef} type="date" defaultValue={S.start} data-testid="start-date" />
        </label>
        <p className="small muted">Any date you pick snaps to that week’s Monday. Week 1 is set to {fmtLong(parse(S.start))}.</p>
        <label className="fld">
          <span className="fl">Weekday wake-up time</span>
          <input ref={wakeRef} type="time" defaultValue={S.wake} data-testid="wake-time" />
        </label>

        <h3 className="sub">Backup</h3>
        <p className="prose">
          {store.storageOK()
            ? "Your logs save in this browser automatically. There is no account and no server, so download a backup now and then, and always before clearing your browser data or switching phones."
            : "Saving is blocked in this browser (private mode?), so your logs disappear when you close the tab. Download a backup before you leave."}
        </p>
        <p className="small muted" data-testid="last-backup">
          {lastBackup ? `Last backup: ${fmtLong(parse(lastBackup))}.` : "No backup yet."}
        </p>
        <div className="btns">
          <button type="button" className="ghost" onClick={download}>Download backup</button>
          <button type="button" className="ghost" onClick={copy}>Copy backup text</button>
        </div>
        <label className="fld" style={{ maxWidth: "none" }}>
          <span className="fl">Restore from backup</span>
          <textarea id="imp" ref={impRef} rows={4} placeholder="Paste backup text here" value={imp} onChange={e => setImp(e.target.value)} />
        </label>
        <div className="btns">
          <button type="button" className="ghost" onClick={() => restore(imp)}>Restore backup</button>
          <label className="ghost filebtn">
            Restore from file
            <input
              type="file"
              accept="application/json,.json,.txt"
              data-testid="restore-file"
              onChange={e => {
                void restoreFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p id="impmsg" className="small" role="status">{msg}</p>

        <h3 className="sub">Use it like an app</h3>
        <p className="prose small">
          Add it to your home screen. On iPhone, open it in Safari, tap Share, then Add to Home Screen. On Android, open the Chrome menu and tap Install app. It then opens full-screen,
          works offline at the gym, and your browser is far less likely to clear your logs.
        </p>

        <h3 className="sub">Start over</h3>
        <div className="btns">
          <button
            type="button"
            className="danger"
            onClick={() => {
              if (!resetArm) {
                setResetArm(true);
                return;
              }
              setResetArm(false);
              eraseAll();
              onStartChanged();
              toast("Everything erased. Fresh start.");
            }}
          >
            {resetArm ? "Tap again to erase everything" : "Erase all data"}
          </button>
        </div>

        <p className="credit small muted">
          Exercise animations and instructions:{" "}
          <a href={ATTRIBUTION_URL} target="_blank" rel="noopener noreferrer">ExerciseDB by AscendAPI</a>.
        </p>
      </div>
    </>
  );
}
