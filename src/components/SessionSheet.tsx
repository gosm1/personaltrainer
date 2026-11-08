import { useEffect, useRef, type CSSProperties } from "react";
import { COL, CX, HOLDS_MON, HOLDS_THU, KEY4, MOB, MOB_MON, RUN, SESS, ZONE2 } from "../data/plan";
import { setComplex, setNote, setRun, setSetField, toggleComplete, toggleHold, toggleMob, toggleSet } from "../lib/actions";
import { DOWL, fmt, addDays } from "../lib/dates";
import {
  complexPrescription, cxScore, fromAnims, fromExercise, fromHold, holdDose, holdPhases, isDeload, isTest, keyDone,
  lastCX, lastFor, lastRun, missedKeys, peek, phase, progression, repRange, restText, schedule, setCount,
  setPlaceholders, shortTitle, testBell, weekStart
} from "../lib/logic";
import { rest } from "../lib/rest";
import { store, useStore } from "../lib/store";
import { toast } from "../lib/toast";
import type { Exercise, Hold, SessionId, SetLog, State } from "../types";
import { useUI } from "../ui";
import { AnimTile, Backups, CheckinForm, Field, MoveList } from "./common";

const stripe = (c: string) => ({ "--c": c }) as CSSProperties;

function SetRow(props: { w: number; sid: SessionId; e: Exercise; i: number; row?: SetLog; last: { sets: SetLog[] } | null }) {
  const { w, sid, e, i, row, last } = props;
  const hasKg = e.u !== "none";
  const ph = setPlaceholders(e, last, i);
  const ok = !!row?.ok;
  return (
    <div className={"setrow" + (hasKg ? "" : " nokg") + (ok ? " ok" : "")} data-set={i + 1}>
      <span className="sn">{i + 1}</span>
      {hasKg ? (
        <label className="f">
          <input
            inputMode="decimal"
            autoComplete="off"
            value={row?.kg ?? ""}
            placeholder={ph.kg}
            aria-label={`Set ${i + 1} weight`}
            onChange={ev => setSetField(w, sid, e.id, i, "kg", ev.target.value)}
          />
          <span>{e.kgLabel || "kg"}</span>
        </label>
      ) : null}
      <label className="f">
        <input
          inputMode="numeric"
          autoComplete="off"
          value={row?.r ?? ""}
          placeholder={ph.r}
          aria-label={`Set ${i + 1} reps`}
          onChange={ev => setSetField(w, sid, e.id, i, "r", ev.target.value)}
        />
        <span>{e.per ? `per ${e.per}` : "reps"}</span>
      </label>
      <button
        type="button"
        className="tick"
        aria-pressed={ok}
        aria-label={`Set ${i + 1} done`}
        onClick={() => {
          if (toggleSet(w, sid, e.id, i, { kg: hasKg ? ph.kg : undefined, r: ph.r })) rest.start(e.rest);
        }}
      >
        ✓
      </button>
    </div>
  );
}

function ExerciseCard({ S, w, sid, e }: { S: State; w: number; sid: SessionId; e: Exercise }) {
  const ui = useUI();
  const ph = phase(w);
  const n = setCount(e, ph.i, isDeload(w));
  const last = lastFor(S, sid, e.id, w);
  const rows = peek(S, w, sid)?.ex?.[e.id] || [];
  const { lastTxt, hint } = progression(e, last);
  const item = fromExercise(e);
  return (
    <article className="ex" data-ex={e.id}>
      <div className="ex-head">
        <AnimTile anim={e.anim[0]} item={item} label={e.name} />
        <div className="ex-title">
          <h3>
            {e.ss ? <span className="ss">{e.ss}</span> : null}
            {e.name}
          </h3>
          <p className="target">
            {n} sets of {repRange(e)} {e.per ? `reps per ${e.per}` : "reps"}, rest {restText(e.rest)}
          </p>
          <button type="button" className="watch" onClick={() => ui.openViewer(item)}>
            See how it’s done
          </button>
        </div>
      </div>
      <details className="how">
        <summary>How to do it</summary>
        <p>{e.how}</p>
        {e.alt ? <p className="alt">Swap if busy or unavailable: {e.alt}</p> : null}
      </details>
      {lastTxt ? <p className="last">{lastTxt}</p> : null}
      <p className="hint">{hint}</p>
      <div className="sets">
        {Array.from({ length: n }, (_, i) => (
          <SetRow key={i} w={w} sid={sid} e={e} i={i} row={rows[i]} last={last} />
        ))}
      </div>
    </article>
  );
}

function ComplexBlock({ S, w }: { S: State; w: number }) {
  const c = peek(S, w, "UB")?.cx || {};
  const tb = testBell(S);
  const lc = lastCX(S, w);
  const finishMonth = addDays(weekStart(S, 30), 6).toLocaleString("en", { month: "long" });
  return (
    <section className="cx">
      <h3>The 15-minute complex</h3>
      <p className="small muted">Your favourite, every Saturday, after the muscle work. Rest 3–5 minutes before you start it.</p>
      <div className="effort">
        <p><b>Today.</b> {complexPrescription(w)}</p>
        {isTest(w) && w > 1 ? (
          <p className="small">{tb ? `Your week-1 bell: ${tb} kg.` : "No week-1 bell logged, so use the bell you tested with."}</p>
        ) : null}
        <p className="small">{CX.note}</p>
      </div>
      <MoveList moves={CX.moves} />
      <p className="last">
        {lc ? `Last time (week ${lc.wk}): ${cxScore(lc.c)}.` : `First time: today’s score is the number to beat every week until ${finishMonth}.`}
      </p>
      <div className="kgrid">
        <Field label="Bell weight" unit="kg" value={c.bell} onChange={v => setComplex(w, "bell", v)} testId="cx-bell" />
        <Field label="Rounds" unit="rounds" value={c.rounds} onChange={v => setComplex(w, "rounds", v)} mode="numeric" testId="cx-rounds" />
        <Field label="Extra reps" unit="reps" value={c.reps} onChange={v => setComplex(w, "reps", v)} mode="numeric" testId="cx-reps" />
        <Field label="How hard, 1 to 10" value={c.rpe} onChange={v => setComplex(w, "rpe", v)} mode="numeric" testId="cx-rpe" />
      </div>
      {isTest(w) ? <p className="small muted">Test week: your score is copied into the Tests table on the Progress tab.</p> : null}
      <details className="how">
        <summary>Technique notes</summary>
        <p>{CX.tech}</p>
      </details>
    </section>
  );
}

function StrengthBody({ S, w, sid }: { S: State; w: number; sid: SessionId }) {
  const s = SESS[sid];
  const ph = phase(w);
  return (
    <>
      <div className="effort">
        <p><b>Effort.</b> {ph.effort}</p>
        {isDeload(w) ? <p><b>Deload.</b> The sets below are halved. Keep the weights, skip the grind.</p> : null}
        <p className="small">Short on time? Do the first two exercises and leave. It still counts.</p>
      </div>
      <details className="warm">
        <summary>Warm-up, 5–8 min</summary>
        <ol>{s.warm?.map(x => <li key={x}>{x}</li>)}</ol>
      </details>
      <p className="small muted">
        Tap ✓ after each set: it fills in last time’s numbers if you left them blank and starts your rest timer. Tap an animation to see the movement up close.
      </p>
      {s.ex?.map(e => <ExerciseCard key={e.id} S={S} w={w} sid={sid} e={e} />)}
      {sid === "UB" ? <ComplexBlock S={S} w={w} /> : null}
    </>
  );
}

function MobilityList(props: { S: State; w: number; sid: SessionId; title: string; sub: string; only?: number[] }) {
  const { S, w, sid, title, sub, only } = props;
  const m = peek(S, w, sid)?.mob || {};
  const items = (only ?? MOB.map((_, i) => i)).map(i => ({ x: MOB[i], i }));
  return (
    <>
      <h3 className="sub">{title}</h3>
      <p className="small muted">{sub}</p>
      <ol className="checks">
        {items.map(({ x, i }) => {
          const on = !!m[i];
          const item = fromAnims(x.name, x.anim);
          return (
            <li key={x.name}>
              <button type="button" className={"chk" + (on ? " on" : "")} aria-pressed={on} onClick={() => toggleMob(w, sid, i)}>
                <span className="box" aria-hidden="true" />
                <span>
                  <b>{x.name}</b> <span className="muted">{x.dose}</span>
                </span>
              </button>
              {item && x.anim ? <AnimTile anim={x.anim[0]} item={item} size={48} label={x.name} /> : null}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** Isometric holds: tap a set to start its countdown; the set is ticked off as you start it. */
function HoldList(props: { S: State; w: number; sid: SessionId; holds: Hold[]; title: string; sub: string }) {
  const { S, w, sid, holds, title, sub } = props;
  const ui = useUI();
  const iso = peek(S, w, sid)?.iso || {};
  return (
    <section className="holds" data-testid={`holds-${sid}`}>
      <h3 className="sub">{title}</h3>
      <p className="small muted">{sub}</p>
      {holds.map(h => {
        const item = fromHold(h);
        const done = iso[h.id] || {};
        return (
          <article className="ex hold" key={h.id} data-hold={h.id}>
            <div className={"ex-head" + (item ? "" : " solo")}>
              {item && h.anim ? <AnimTile anim={h.anim[0]} item={item} label={h.name} /> : null}
              <div className="ex-title">
                <h3>{h.name}</h3>
                <p className="target">{holdDose(h)}</p>
                {item ? (
                  <button type="button" className="watch" onClick={() => ui.openViewer(item)}>
                    See how it’s done
                  </button>
                ) : null}
              </div>
            </div>
            <details className="how">
              <summary>How to do it</summary>
              <p>{h.how}</p>
            </details>
            <div className="holdsets">
              {Array.from({ length: h.sets }, (_, i) => {
                const on = !!done[i];
                return (
                  <button
                    key={i}
                    type="button"
                    className={"hset" + (on ? " on" : "")}
                    aria-pressed={on}
                    aria-label={`${h.name}, set ${i + 1}`}
                    onClick={() => {
                      if (toggleHold(w, sid, h.id, i)) rest.run(holdPhases(h));
                    }}
                  >
                    Set {i + 1}
                  </button>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function RunFields({ S, w, sid }: { S: State; w: number; sid: SessionId }) {
  const z = peek(S, w, sid)?.z || {};
  const lz = lastRun(S, sid, w);
  return (
    <>
      <div className="kgrid">
        <Field label="Minutes" unit="min" value={z.min} onChange={v => setRun(w, sid, "min", v)} mode="numeric" testId="run-min" />
        <Field label="Distance" unit="km" value={z.km} onChange={v => setRun(w, sid, "km", v)} testId="run-km" />
      </div>
      {lz ? (
        <p className="last">
          Last run (week {lz.wk}): {lz.z.min || "?"} min{lz.z.km ? `, ${lz.z.km} km` : ""}.
        </p>
      ) : null}
    </>
  );
}

function RunBody({ S, w }: { S: State; w: number }) {
  const plan = isDeload(w) ? "25–30 minutes easy, no strides." : RUN[phase(w).i];
  return (
    <>
      <div className="effort">
        <p><b>Today’s run.</b> {plan}</p>
        {isTest(w) ? (
          <p><b>Test week.</b> After a 10-minute easy warm-up, run your 1.6 km test instead (walking is allowed) and log the time on the Progress tab.</p>
        ) : null}
      </div>
      <p>{ZONE2}</p>
      <RunFields S={S} w={w} sid="Z" />
      <MobilityList
        S={S}
        w={w}
        sid="Z"
        only={MOB_MON}
        title="Mobility, about 4 minutes"
        sub="Right after the run, while you’re warm. Tap each one when it’s done."
      />
      <HoldList
        S={S}
        w={w}
        sid="Z"
        holds={HOLDS_MON}
        title="Isometric holds, about 13 minutes"
        sub="Still warm from the run. Tap a set as you start it: the timer counts the hold (both sides for one-sided holds) and beeps when it’s time to switch or stop. Rest about 30 seconds between holds."
      />
    </>
  );
}

function RestBody({ S, w }: { S: State; w: number }) {
  return (
    <>
      <div className="effort">
        <p><b>No gym today.</b> A walk counts toward your steps. The isometric holds take about 12 minutes at home, any time of day; skip them if the day falls apart.</p>
      </div>
      <HoldList
        S={S}
        w={w}
        sid="R"
        holds={HOLDS_THU}
        title="Optional isometric holds, about 12 minutes"
        sub="Tap a set as you start it: the timer counts the hold (both sides for one-sided holds) and beeps when it’s time to switch or stop. Rest about 30 seconds between holds."
      />
      {phase(w).i >= 2 ? (
        <>
          <h3 className="sub">Optional second easy run</h3>
          <p className="small muted">From the Forge phase on: 25–30 minutes at Zone 2 pace if you want more endurance. Skip it if your legs feel heavy for Friday.</p>
          <RunFields S={S} w={w} sid="R" />
        </>
      ) : null}
      <MobilityList S={S} w={w} sid="R" title="Optional mobility" sub="Ten minutes, any time of day." />
    </>
  );
}

function SundayBody({ S, w }: { S: State; w: number }) {
  const ui = useUI();
  const miss = missedKeys(S, w);
  const lead = miss.includes("UB") ? "Saturday didn’t happen? Today is your backup slot for Upper B." : "Today is your backup slot.";
  const pick = miss.includes("L") ? "Lower A" : miss.includes("LB") ? "Lower B" : miss.length ? shortTitle(miss[0]) : "";
  return (
    <>
      {miss.length ? (
        <div className="effort warn" data-testid="catchup">
          <p>
            <b>Catch-up.</b> Not logged this week: {miss.map(shortTitle).join(", ")}. {lead}
            {miss.length > 1 ? ` If you can only do one, pick ${pick}.` : ""}
          </p>
          <div className="btns">
            {miss.map(s => (
              <button key={s} type="button" className="ghost" onClick={() => ui.openSession(w, s)}>
                Open {shortTitle(s)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <details className="how">
        <summary>Can’t get to the gym at all? Your backup circuits</summary>
        <Backups />
      </details>
      <MobilityList S={S} w={w} sid="M2" title="10-minute mobility" sub="Tap each one when it’s done." />
      <CheckinForm w={w} />
    </>
  );
}

export function SessionSheet({ w, sid }: { w: number; sid: SessionId }) {
  const S = useStore();
  const ui = useUI();
  const s = SESS[sid];
  const d = schedule(S, w).find(x => x.sid === sid)!;
  const ph = phase(w);
  const log = peek(S, w, sid);
  const done = !!log?.done;
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
    const t = setTimeout(() => closeRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [w, sid]);

  const body =
    s.type === "str" ? <StrengthBody S={S} w={w} sid={sid} />
    : s.type === "run" ? <RunBody S={S} w={w} />
    : s.type === "rest" ? <RestBody S={S} w={w} />
    : <SundayBody S={S} w={w} />;

  function complete() {
    const nowDone = toggleComplete(w, sid);
    if (!nowDone) return;
    const n = keyDone(store.get(), w);
    ui.closeSession();
    toast(
      (KEY4 as string[]).includes(sid)
        ? n >= 3 ? `${n} of 4 key sessions this week. Plate loaded.` : `${n} of 4 key sessions this week.`
        : "Logged. See you at the next one."
    );
  }

  return (
    <div id="sheet" ref={ref} className="sheet" role="dialog" aria-modal="true" aria-label={s.title}>
      <div className="sheet-head" style={stripe(COL[s.c])}>
        <div className="wrap">
          <button ref={closeRef} type="button" className="ghost close" onClick={ui.closeSession}>Close</button>
          <h2>{s.title}</h2>
          <p className="muted">
            {DOWL[d.i]} {fmt(d.date)}, week {w}, {ph.name} phase. {s.where}, {s.dur}.
          </p>
          <p className="why">{s.why}</p>
        </div>
      </div>
      <div className="wrap">
        {body}
        <label className="lbl" htmlFor="snote">Notes</label>
        <textarea
          id="snote"
          rows={3}
          placeholder="How it felt, any pain, anything to change next time"
          value={log?.note ?? ""}
          onChange={e => setNote(w, sid, e.target.value)}
        />
        <button type="button" className={"primary" + (done ? " is-done" : "")} onClick={complete}>
          {done ? "Completed. Tap to undo" : s.type === "str" ? "Mark session complete" : "Mark day complete"}
        </button>
      </div>
    </div>
  );
}
