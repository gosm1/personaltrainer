import { useEffect, useState } from "react";
import { pad } from "../lib/dates";
import { rest, useRest } from "../lib/rest";
import { useToast } from "../lib/toast";

const mmss = (s: number) => Math.floor(s / 60) + ":" + pad(s % 60);

export function RestTimer() {
  const { active, phase } = useRest();
  const [, force] = useState(0);

  useEffect(() => {
    document.body.classList.toggle("resting", active);
    if (!active) return;
    const tick = () => {
      if (rest.remaining() <= 0) rest.finish();
      else force(n => n + 1);
    };
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
  }, [active]);

  if (!active) return null;
  return (
    <div id="rest" className="rest" role="timer" aria-label={(phase?.title || "Rest") + " timer"}>
      <span className="rl">
        <span id="restLabel">{phase?.title || "Rest"}</span>
        {phase?.detail ? <small id="restDetail">{phase.detail}</small> : null}
      </span>
      <b id="restT">{mmss(Math.ceil(rest.remaining() / 1000))}</b>
      <button type="button" onClick={() => rest.add(15)}>+15 s</button>
      <button type="button" onClick={() => rest.stop()}>Skip</button>
    </div>
  );
}

export function Toast() {
  const t = useToast();
  return (
    <div id="toast" className="toast" role="status" aria-live="polite" hidden={!t}>
      {t?.msg}
    </div>
  );
}
