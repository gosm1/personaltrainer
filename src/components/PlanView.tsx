import type { CSSProperties } from "react";
import { COL, HOLDS_MON, HOLDS_THU, KEY4, PHASES, SESS } from "../data/plan";
import { ATTRIBUTION_URL } from "../lib/anim";
import { curWeek, fromExercise, fromHold, holdDose, phase, repRange } from "../lib/logic";
import { useStore } from "../lib/store";
import type { Hold } from "../types";
import { AnimTile, Backups } from "./common";

function HoldGlance({ holds }: { holds: Hold[] }) {
  return (
    <ol>
      {holds.map(h => {
        const item = fromHold(h);
        return (
          <li key={h.id} className={item ? undefined : "noanim"}>
            {item && h.anim ? <AnimTile anim={h.anim[0]} item={item} size={44} label={h.name} /> : null}
            <span>{h.name}, {holdDose(h)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function PlanView() {
  const S = useStore();
  const ph = phase(curWeek(S));
  return (
    <>
      <h2>The plan</h2>
      <div className="prose">
        <h3>How your week works</h3>
        <p>Two gym days, a rest day, two gym days, then the weekend. You never train more than two days in a row, and every muscle gets trained exactly twice, with three days between sessions.</p>
        <p>
          Both leg days sit on your guaranteed days, Tuesday and Friday, so the session you used to skip is on the days you never miss. Upper B goes on Saturday, your least reliable day,
          because upper body and your complex are what you’re least likely to skip. Thursday, the day your remote and office schedule kept moving, has nothing on it. Monday stays out of the
          crowded gym with an easy run, followed by your isometric holds.
        </p>

        <h3>Sessions at a glance</h3>
        <p className="small muted">Sets shown for the {ph.name} phase. Tap any animation to see the movement up close.</p>
      </div>
      <div className="glance" data-testid="sessions-glance">
        {KEY4.map(sid => {
          const s = SESS[sid];
          return (
            <div key={sid} style={{ "--c": COL[s.c] } as CSSProperties}>
              <b>{s.title}</b>
              <ol>
                {s.ex?.map(e => (
                  <li key={e.id}>
                    <AnimTile anim={e.anim[0]} item={fromExercise(e)} size={44} label={e.name} />
                    <span>{e.name}, {e.sets[ph.i]} × {repRange(e)}</span>
                  </li>
                ))}
                {sid === "UB" ? <li className="noanim"><span>The 15-minute complex</span></li> : null}
              </ol>
            </div>
          );
        })}
      </div>
      <div className="prose">
        <h3>Isometric holds</h3>
        <p>
          Holds build strength in the end positions your knees, hips and ankles get pushed into when you run and jump. They’re split across your two non-gym days so no gym
          session gets longer and nothing tires your legs before a heavy lift. In the session, tap a set as you start it and the timer counts the hold for you.
        </p>
      </div>
      <div className="glance" data-testid="holds-glance">
        <div style={{ "--c": COL.grey } as CSSProperties}>
          <b>Monday, after the run</b>
          <HoldGlance holds={HOLDS_MON} />
        </div>
        <div style={{ "--c": COL.line } as CSSProperties}>
          <b>Thursday, at home (optional)</b>
          <HoldGlance holds={HOLDS_THU} />
        </div>
      </div>
      <div className="prose">
        <h3>The four phases</h3>
        <ol>
          {PHASES.map(p => (
            <li key={p.name}><b>{p.name}, weeks {p.from}–{p.to}.</b> {p.goal}</li>
          ))}
        </ol>

        <h3>Rules that keep you consistent</h3>
        <ul>
          <li><b>Sessions are a queue, not a calendar.</b> Missed one? It’s the next thing you do. Sunday is your backup slot.</li>
          <li><b>Never miss twice in a row.</b> One missed day is noise. Two is the start of a new habit.</li>
          <li><b>The 20-minute rule.</b> On a bad day, do the first two exercises and go home. It counts.</li>
          <li><b>If you can only train twice in a week, make it Lower A and Upper A.</b> Between them they cover everything.</li>
          <li><b>Write every set down.</b> You can’t beat a number you never recorded.</li>
          <li><b>Weekend wake-up within 90 minutes of your weekday time, and Saturday training done by 3 pm.</b> That fixes the slept-late, day-ruined pattern.</li>
          <li><b>8,000+ steps a day.</b> During fat loss, this matters more than any finisher.</li>
        </ul>

        <h3>How progression works</h3>
        <p>
          Every exercise has a rep range, for example 8–12. Keep the same weight until you hit 12 on every set, then add the smallest jump and start again at 8. The session screen shows last
          time’s numbers and tells you which move to make. For the complex, keep the same bell and add rounds; the bell only goes up when a new phase says so.
        </p>

        <h3>Your backup circuits</h3>
        <p>For any day you can’t get to the gym. They don’t replace a session, but they keep the habit alive.</p>
        <Backups />

        <h3>What changed from your old plan</h3>
        <ul>
          <li>Your old split was upper, lower, upper, lower, and the second leg day always got skipped. Both leg days are now on your guaranteed days, and the second one is built to be the one you enjoy: machines, swings and pump work.</li>
          <li>The hip hinge, lunges, glutes and calves were added. The front-delt machine is gone, because bench and incline pressing already hit the front delts hard.</li>
          <li>Pressing and pulling are balanced, and rear delts now get direct work.</li>
          <li>Your weak points get trained twice a week. Rear delts: face pulls on Wednesday and the reverse pec deck on Saturday, both early in the session. Forearms: wrist curls on Wednesday and reverse curls on Saturday. Abs: two exercises on each leg day.</li>
          <li>Isometric holds for your knees, hips and ankles: Monday after the run, and optionally Thursday at home.</li>
          <li>The names are sorted: the overhead long-head move is a triceps extension; the short head is the inner part of the biceps and the long head is the outer part.</li>
          <li>Running and mobility have fixed slots, so being athletic is something you train rather than something you assume.</li>
          <li>Your 15-minute complex closes every Saturday, so you see your score every week. Your other two circuits are backups.</li>
        </ul>

        <p className="credit small muted">
          Exercise animations and step-by-step instructions:{" "}
          <a href={ATTRIBUTION_URL} target="_blank" rel="noopener noreferrer">ExerciseDB by AscendAPI</a> (free tier, personal use).
        </p>
      </div>
    </>
  );
}
