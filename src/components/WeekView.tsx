import type { CSSProperties } from "react";
import { COL, HAB, KEY4, SESS, TOTAL_WEEKS } from "../data/plan";
import { toggleHabit } from "../lib/actions";
import { DOW, DOWL, addDays, addMin, fmt, iso, today0 } from "../lib/dates";
import { isDeload, isTest, keyDone, peek, phase, schedule, weekStart, type Day } from "../lib/logic";
import { useStore } from "../lib/store";
import type { State } from "../types";
import { useUI } from "../ui";

const stripe = (c: string) => ({ "--c": c }) as CSSProperties;

function DayRow({ S, w, d, t }: { S: State; w: number; d: Day; t: string }) {
  const ui = useUI();
  const s = SESS[d.sid];
  const done = !!peek(S, w, d.sid)?.done;
  const di = iso(d.date);
  const isToday = di === t;
  const past = di < t;
  let st = null;
  if (done) st = <span className="st done">Done</span>;
  else if (isToday) st = <span className="st now">Today</span>;
  else if (past && (KEY4 as string[]).includes(d.sid)) st = <span className="st miss">Not logged</span>;
  return (
    <li>
      <button
        type="button"
        className={"day" + (isToday ? " is-today" : "") + (done ? " is-done" : "")}
        style={stripe(COL[s.c])}
        data-sid={d.sid}
        onClick={() => ui.openSession(w, d.sid)}
      >
        <span className="dd">
          <b>{DOW[d.i]}</b>
          <span>{fmt(d.date)}</span>
        </span>
        <span className="stripe" aria-hidden="true" />
        <span className="tt">
          <span className="title">{s.title}</span>
          <span className="meta">{s.where}, {s.dur}</span>
        </span>
        {st}
      </button>
    </li>
  );
}

function HabitsGrid({ S, w }: { S: State; w: number }) {
  const s0 = weekStart(S, w);
  const t = iso(today0());
  return (
    <section className="habits">
      <h3>Daily habits</h3>
      <p className="small muted">
        “Up on time” means by {S.wake} on weekdays and by {addMin(S.wake, 90)} on weekends. Late weekend mornings were what wrecked your Saturdays and Sundays.
      </p>
      <div className="hgrid">
        <div className="hrow head">
          <span />
          {DOW.map((d, i) => (
            <span key={d} className={iso(addDays(s0, i)) === t ? "tday" : ""}>{d}</span>
          ))}
        </div>
        {HAB.map(hb => (
          <div className="hrow" key={hb.k}>
            <span className="lab">{hb.l}</span>
            {DOW.map((_, i) => {
              const di = iso(addDays(s0, i));
              const on = !!S.habits[di]?.[hb.k];
              return (
                <button
                  key={i}
                  type="button"
                  className={"hb" + (on ? " on" : "")}
                  aria-pressed={on}
                  aria-label={`${hb.l}, ${DOWL[i]}`}
                  onClick={() => toggleHabit(di, hb.k)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

export function WeekView({ w, setWeek }: { w: number; setWeek: (w: number) => void }) {
  const S = useStore();
  const ui = useUI();
  const ph = phase(w);
  const sch = schedule(S, w);
  const t = iso(today0());
  const s0 = weekStart(S, w);
  const ti = sch.find(d => iso(d.date) === t);
  const todayDone = ti ? !!peek(S, w, ti.sid)?.done : false;

  return (
    <>
      <div className="weeknav">
        <button type="button" className="ghost" disabled={w <= 1} aria-label="Previous week" onClick={() => setWeek(Math.max(1, w - 1))}>‹</button>
        <div>
          <h2>Week {w}</h2>
          <p>{fmt(s0)} to {fmt(addDays(s0, 6))}</p>
        </div>
        <button type="button" className="ghost" disabled={w >= TOTAL_WEEKS} aria-label="Next week" onClick={() => setWeek(Math.min(TOTAL_WEEKS, w + 1))}>›</button>
      </div>

      <div className="phasebox">
        <p><b>{ph.name} phase.</b> {ph.effort}</p>
        {isDeload(w) ? <p><b>Deload week.</b> Same weights, half the sets, nothing close to failure. This is where the last block’s work turns into progress.</p> : null}
        {isTest(w) ? (
          <p><b>Test week.</b> {w === 1 ? "Set your baseline" : "Retest"} with the tests on the Progress tab. Monday’s run is the 1.6 km test, and Saturday’s complex is the benchmark.</p>
        ) : null}
        <p className="small muted">Two gym days, a rest day, two gym days. Never more than two in a row, and every muscle twice a week.</p>
      </div>

      {ti ? (
        <button type="button" className="today" style={stripe(COL[SESS[ti.sid].c])} data-testid="today-card" onClick={() => ui.openSession(w, ti.sid)}>
          <span className="small muted">Today</span>
          <strong>{SESS[ti.sid].title}</strong>
          <span className="small">{todayDone ? "Done. Nice work." : "Open the session"}</span>
        </button>
      ) : null}

      <ol className="days">
        {sch.map(d => <DayRow key={d.sid} S={S} w={w} d={d} t={t} />)}
      </ol>
      <p className="count" data-testid="week-count">
        {keyDone(S, w)} of 4 key sessions done this week. Tap any day to see the session and log it.
      </p>
      <HabitsGrid S={S} w={w} />
    </>
  );
}
