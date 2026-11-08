import { useState, type CSSProperties } from "react";
import { BACKUPS } from "../data/plan";
import { setCheckin, setTest } from "../lib/actions";
import { gifUrl } from "../lib/anim";
import { fromMove, isTest } from "../lib/logic";
import { useStore } from "../lib/store";
import { TESTF } from "../data/plan";
import type { Anim, Move, ViewerItem } from "../types";
import { useUI } from "../ui";

/** Labelled input with a unit suffix. Stores raw text while typing and trims on blur. */
export function Field(props: {
  label: string;
  unit?: string;
  value: string | undefined;
  onChange: (v: string) => void;
  mode?: "decimal" | "numeric" | "text";
  testId?: string;
}) {
  const { label, unit, value, onChange, mode = "decimal", testId } = props;
  return (
    <label className="fld">
      <span className="fl">{label}</span>
      <span className="in">
        <input
          value={value ?? ""}
          inputMode={mode}
          autoComplete="off"
          data-testid={testId}
          onChange={e => onChange(e.target.value)}
          onBlur={e => {
            const t = e.target.value.trim();
            if (t !== e.target.value) onChange(t);
          }}
        />
        {unit ? <em>{unit}</em> : null}
      </span>
    </label>
  );
}

/**
 * An animated exercise illustration. It only downloads when it scrolls near the screen
 * (loading="lazy"), and the service worker keeps it after the first view.
 * Tapping it opens the full exercise viewer.
 */
export function AnimTile(props: { anim: Anim; item: ViewerItem; size?: number; label: string }) {
  const { anim, item, size = 96, label } = props;
  const ui = useUI();
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      className={"anim" + (failed ? " fail" : "")}
      style={{ "--s": size + "px" } as CSSProperties}
      onClick={() => ui.openViewer(item)}
      aria-label={"Show how to do " + label}
      data-testid="anim-tile"
    >
      {failed ? (
        <span>Offline</span>
      ) : (
        <img
          src={gifUrl(anim.id)}
          alt=""
          width={180}
          height={180}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      {size >= 80 ? (
        <span className="zoom" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="12" height="12">
            <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
      ) : null}
    </button>
  );
}

/** An ordered list of moves (complex, backup circuits), each with a small animation when one exists. */
export function MoveList({ moves }: { moves: Move[] }) {
  return (
    <ol className="moves">
      {moves.map((m, i) => {
        const item = fromMove(m);
        return (
          <li key={i} className={item ? "has-anim" : undefined}>
            {item && m.anim ? <AnimTile anim={m.anim[0]} item={item} size={52} label={m.text} /> : null}
            <span>{m.text}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Backups() {
  return (
    <>
      {BACKUPS.map(b => (
        <div className="bk" key={b.name}>
          <b>{b.name}</b> <span className="muted small">{b.p}</span>
          <MoveList moves={b.moves} />
        </div>
      ))}
    </>
  );
}

export function CheckinForm({ w }: { w: number }) {
  const S = useStore();
  const c = S.checkins[w] || {};
  const tv = S.tests[w] || {};
  return (
    <>
      <h3 className="sub">Week {w} check-in</h3>
      <p className="small muted">Weigh yourself every morning after the toilet and before eating. Log the 7-day average here, not one day’s number.</p>
      <div className="kgrid">
        <Field label="Average weight" unit="kg" value={c.kg} onChange={v => setCheckin(w, "kg", v)} testId={`ci-kg-${w}`} />
        <Field label="Waist at the navel" unit="cm" value={c.waist} onChange={v => setCheckin(w, "waist", v)} testId={`ci-waist-${w}`} />
      </div>
      {isTest(w) ? (
        <>
          <h3 className="sub">Week {w} tests</h3>
          <div className="kgrid">
            {TESTF.map(f => (
              <Field key={f.k} label={f.l} value={tv[f.k]} onChange={v => setTest(w, f.k, v)} mode="text" testId={`ci-test-${f.k}-${w}`} />
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
