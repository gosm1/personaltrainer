export const pad = (n: number) => String(n).padStart(2, "0");
export const iso = (d: Date) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
export const parse = (s: string) => {
  const a = String(s).split("-").map(Number);
  return new Date(a[0], a[1] - 1, a[2]);
};
export const isIsoDate = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parse(s).getTime());
export const addDays = (d: Date, n: number) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};
export const today0 = () => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
};
/** Monday = 0 … Sunday = 6 */
export const dowOf = (d: Date) => (d.getDay() + 6) % 7;
export const mondayOf = (d: Date) => addDays(d, -dowOf(d));
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DOWL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmt = (d: Date) => d.getDate() + " " + MON[d.getMonth()];
export const fmtLong = (d: Date) => DOWL[dowOf(d)] + " " + fmt(d);

export function addMin(hhmm: string, m: number) {
  const p = String(hhmm || "07:30").split(":").map(Number);
  const t = (((p[0] * 60 + (p[1] || 0) + m) % 1440) + 1440) % 1440;
  return pad(Math.floor(t / 60)) + ":" + pad(t % 60);
}

/** Week 1 starts this Monday if today is Monday or Tuesday, otherwise next Monday. */
export function defaultStart(now = today0()) {
  const d = dowOf(now);
  return iso(d <= 1 ? mondayOf(now) : addDays(mondayOf(now), 7));
}
