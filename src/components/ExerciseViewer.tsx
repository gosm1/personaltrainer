import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ATTRIBUTION_URL, gifUrl, meta, pretty } from "../lib/anim";
import type { Anim, ViewerItem } from "../types";
import { useUI } from "../ui";

interface Option {
  a: Anim;
  swap: boolean;
}

export function ExerciseViewer({ item }: { item: ViewerItem }) {
  const ui = useUI();
  const options: Option[] = [
    ...item.anims.map(a => ({ a, swap: false })),
    ...(item.altAnims || []).map(a => ({ a, swap: true }))
  ];
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIdx(0);
    cardRef.current?.scrollTo?.(0, 0);
    const t = setTimeout(() => closeRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [item]);

  const cur = options[Math.min(idx, options.length - 1)];
  const m = meta(cur.a.id);
  const name = cur.a.label || item.title;

  // Keep Tab focus inside the viewer while it's open.
  function trap(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !cardRef.current) return;
    const f = Array.from(cardRef.current.querySelectorAll<HTMLElement>("button, a[href], summary"));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onKeyDown={trap}
      onClick={e => {
        if (e.target === e.currentTarget) ui.closeViewer();
      }}
    >
      <div className="viewer-card" ref={cardRef}>
        <div className="viewer-head">
          <h2>{item.title}</h2>
          <button ref={closeRef} type="button" className="ghost" onClick={ui.closeViewer}>
            Close
          </button>
        </div>

        {options.length > 1 ? (
          <div className="chips" role="group" aria-label="Versions">
            {options.map((o, i) => (
              <button key={o.a.id + i} type="button" className="chip" aria-pressed={i === idx} onClick={() => setIdx(i)}>
                {o.swap ? "Swap: " : ""}
                {o.a.label || item.title}
              </button>
            ))}
          </div>
        ) : null}

        <div className="viewer-stage">
          {failed[cur.a.id] ? (
            <p className="muted small">
              This animation needs a connection the first time you open it. After that it’s saved on your phone for the gym.
            </p>
          ) : (
            <img
              key={cur.a.id}
              src={gifUrl(cur.a.id)}
              alt={"Animated illustration: " + name}
              width={180}
              height={180}
              onError={() => setFailed(f => ({ ...f, [cur.a.id]: true }))}
            />
          )}
        </div>

        {m && (m.target.length || m.secondary.length) ? (
          <p className="muscles">
            {m.target.length ? <span className="mtag tgt">Works: {pretty(m.target)}</span> : null}
            {m.secondary.length ? <span className="mtag">Also: {pretty(m.secondary)}</span> : null}
          </p>
        ) : null}

        {cur.swap ? (
          <p className="note">The swap for {item.title.toLowerCase()} when the equipment’s busy or missing. Same sets and reps.</p>
        ) : (
          <>
            {item.note ? <p className="note">{item.note}</p> : null}
            {item.cue ? (
              <>
                <h3 className="sub">Coach’s cue</h3>
                <p>{item.cue}</p>
              </>
            ) : null}
          </>
        )}

        {m?.steps.length ? (
          <>
            <h3 className="sub">Step by step</h3>
            <ol className="steps">
              {m.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </>
        ) : null}

        <p className="credit small muted">
          Animation and steps:{" "}
          <a href={ATTRIBUTION_URL} target="_blank" rel="noopener noreferrer">
            ExerciseDB by AscendAPI
          </a>
          .
        </p>
      </div>
    </div>
  );
}
