import { TOTAL_WEEKS } from "../data/plan";
import { curWeekRaw, isPhaseStart, isTest, keyDone, topline } from "../lib/logic";
import { useStore } from "../lib/store";
import { useUI } from "../ui";

const WEEKS = Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1);

export function Header({ viewWeek }: { viewWeek: number }) {
  const S = useStore();
  const ui = useUI();
  const raw = curWeekRaw(S);
  return (
    <header className="top">
      <div className="brand">
        <h1>Lock-in 30</h1>
        <p id="topline">{topline(S)}</p>
      </div>
      <div className="barwrap">
        <div className="bar" id="bar">
          {WEEKS.map(w => {
            const n = keyDone(S, w);
            const cls = [
              "plate",
              n >= 3 ? "full" : n > 0 ? "part" : "",
              isPhaseStart(w) ? "ps" : "",
              w === viewWeek ? "cur" : "",
              isTest(w) ? "test" : "",
              w === raw ? "now" : ""
            ].filter(Boolean).join(" ");
            return (
              <button
                key={w}
                type="button"
                className={cls}
                data-week={w}
                title={`Week ${w}: ${n} of 4 key sessions`}
                aria-label={`Week ${w}, ${n} of 4 key sessions`}
                aria-current={w === viewWeek ? "true" : undefined}
                onClick={() => ui.goWeek(w)}
              />
            );
          })}
        </div>
        <div className="phl" aria-hidden="true">
          <span style={{ flex: 4 }}>Reboot</span>
          <span style={{ flex: 8 }}>Build</span>
          <span style={{ flex: 9 }}>Forge</span>
          <span style={{ flex: 9 }}>Peak</span>
        </div>
      </div>
      <p className="legend">Each plate is a week. Three key sessions in a week loads a full plate. Dots mark test weeks.</p>
    </header>
  );
}
