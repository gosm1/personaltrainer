import { TESTF, TESTS, TOTAL_WEEKS } from "../data/plan";
import { setTest } from "../lib/actions";
import { checkinSeries, curWeek, cxScore, isTest, peek, progressSummary } from "../lib/logic";
import { useStore } from "../lib/store";
import type { ComplexLog, State } from "../types";
import { CheckinForm } from "./common";

function Chart({ S, k, label, unit }: { S: State; k: "kg" | "waist"; label: string; unit: string }) {
  const pts = checkinSeries(S, k);
  if (pts.length < 2) {
    return (
      <figure className="chart" data-testid={`chart-${k}`}>
        <figcaption>{label}</figcaption>
        <p className="small muted">{pts.length ? "One week logged. The line appears after the second." : "Your Sunday check-ins draw this line."}</p>
      </figure>
    );
  }
  const W = 600, H = 180, L = 40, R = 14, T = 14, B = 26;
  const ys = pts.map(p => p[1]);
  let mn = Math.min(...ys), mx = Math.max(...ys);
  if (mx - mn < 1) {
    mn -= 0.5;
    mx += 0.5;
  }
  const pd = (mx - mn) * 0.15;
  mn -= pd;
  mx += pd;
  const X = (w: number) => L + ((w - 1) / (TOTAL_WEEKS - 1)) * (W - L - R);
  const Y = (v: number) => T + ((mx - v) / (mx - mn)) * (H - T - B);
  const diff = ys[ys.length - 1] - ys[0];
  const cls = k === "kg" ? "kg" : "waist";
  return (
    <figure className="chart" data-testid={`chart-${k}`}>
      <figcaption>
        {label}: {ys[ys.length - 1]} {unit}{" "}
        <span className="muted">
          ({diff > 0 ? "+" : ""}
          {diff.toFixed(1)} {unit} since week {pts[0][0]})
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} by week`}>
        {[5, 13, 22].map(w => <line key={w} className="pb" x1={X(w)} x2={X(w)} y1={T} y2={H - B} />)}
        {[1, 5, 13, 22, 30].map(w => (
          <text key={w} x={X(w)} y={H - 6} textAnchor="middle">W{w}</text>
        ))}
        <line className="grid" x1={L} x2={W - R} y1={H - B} y2={H - B} />
        <text x={L - 6} y={T + 10} textAnchor="end">{mx.toFixed(1)}</text>
        <text x={L - 6} y={H - B} textAnchor="end">{mn.toFixed(1)}</text>
        <polyline className={"ln " + cls} points={pts.map(p => X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1)).join(" ")} />
        {pts.map(p => <circle key={p[0]} className={"dot " + cls} cx={X(p[0]).toFixed(1)} cy={Y(p[1]).toFixed(1)} r="4" />)}
      </svg>
    </figure>
  );
}

function ComplexHistory({ S }: { S: State }) {
  const rows: [number, ComplexLog][] = [];
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const c = peek(S, w, "UB")?.cx;
    if (c && c.rounds) rows.push([w, c]);
  }
  if (!rows.length) return <p className="small muted">Your Saturday scores will list here.</p>;
  return (
    <div className="tablewrap">
      <table className="tests" data-testid="cx-history">
        <thead>
          <tr><th>Week</th><th>Score</th><th>How hard</th></tr>
        </thead>
        <tbody>
          {rows.map(([w, c]) => (
            <tr key={w}>
              <th>Week {w}{isTest(w) ? <span>test</span> : null}</th>
              <td>{cxScore(c)}</td>
              <td>{c.rpe || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProgressView() {
  const S = useStore();
  const cw = curWeek(S);
  const { total, plates, streak } = progressSummary(S);
  return (
    <>
      <h2>Progress</h2>
      <p data-testid="progress-summary">
        You’ve logged {total} key {total === 1 ? "session" : "sessions"} so far. {plates}
        {plates === 1 ? " week has" : " weeks have"} loaded a plate
        {streak ? `, and your current streak is ${streak} ${streak === 1 ? "week" : "weeks"}` : ""}.
      </p>
      <div className="phasebox">
        <CheckinForm w={cw} />
      </div>
      <div id="charts">
        <Chart S={S} k="kg" label="Weight" unit="kg" />
        <Chart S={S} k="waist" label="Waist" unit="cm" />
      </div>
      <h3 className="sub">Your complex, week by week</h3>
      <ComplexHistory S={S} />
      <h3 className="sub">Tests</h3>
      <p className="small muted">Weeks 1, 12, 21 and 30. Same conditions each time.</p>
      <div className="tablewrap">
        <table className="tests" data-testid="tests-table">
          <thead>
            <tr>
              <th>Test</th>
              {TESTS.map(w => <th key={w}>Week {w}</th>)}
            </tr>
          </thead>
          <tbody>
            {TESTF.map(f => (
              <tr key={f.k}>
                <th>{f.l}<span>{f.u}</span></th>
                {TESTS.map(w => (
                  <td key={w}>
                    <input
                      value={S.tests[w]?.[f.k] ?? ""}
                      aria-label={`${f.l}, week ${w}`}
                      autoComplete="off"
                      onChange={e => setTest(w, f.k, e.target.value)}
                      onBlur={e => {
                        const t = e.target.value.trim();
                        if (t !== e.target.value) setTest(w, f.k, t);
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details>
        <summary>How to run the tests</summary>
        <ul>
          <li>Push-ups: strict reps, chest to a fist’s height from the floor, stop when you pause longer than 2 seconds.</li>
          <li>1.6 km: on Monday’s run, after a 10-minute easy warm-up. Flat route or treadmill at 1% incline, walking breaks allowed.</li>
          <li>15-minute complex: Saturday, the full 15 minutes with your week-1 bell.</li>
          <li>Zercher: the heaviest clean set of 5 you can do, on Tuesday.</li>
          <li>Photos: front, side and back, same spot, same light, morning.</li>
        </ul>
      </details>
    </>
  );
}
