#!/usr/bin/env node
/**
 * Keeps src/data/exercises.json in step with the gif("...") ids used in src/data/plan.ts.
 *
 *   npm run exercises:sync    fetch metadata for every id from the free ExerciseDB API
 *                             (oss.exercisedb.dev) and verify every animation exists
 *   npm run exercises:check   only verify: every id has metadata and its GIF responds 200
 *
 * The free API has strict rate limits, so requests are paced. Nothing here runs at build
 * time or in the browser: the app ships the small JSON this script writes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLAN = path.join(root, "src/data/plan.ts");
const OUT = path.join(root, "src/data/exercises.json");
const API = "https://oss.exercisedb.dev/api/v1/exercises/";
const GIF = id => `https://static.exercisedb.dev/media/${id}.gif`;
const UA = { "User-Agent": "lock-in-30-personal-tracker/1.0" };
const checkOnly = process.argv.includes("--check");
const sleep = ms => new Promise(r => setTimeout(r, ms));

const ids = [...new Set([...fs.readFileSync(PLAN, "utf8").matchAll(/gif\("([A-Za-z0-9]+)"/g)].map(m => m[1]))].sort();
const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};

async function get(url, opts = {}) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: UA, ...opts });
    if (res.status !== 429) return res;
    const wait = Number(res.headers.get("retry-after") || 5) * 1000;
    console.log(`  rate limited, waiting ${wait / 1000}s`);
    await sleep(wait);
  }
  throw new Error("Still rate limited after retries: " + url);
}

const problems = [];
const out = {};
console.log(`${ids.length} animations referenced in plan.ts`);

for (const id of ids) {
  if (!checkOnly) {
    const res = await get(API + id);
    if (!res.ok) { problems.push(`${id}: API returned ${res.status}`); continue; }
    const { data: e } = await res.json();
    out[id] = {
      name: e.name,
      target: e.targetMuscles,
      secondary: e.secondaryMuscles,
      equipment: e.equipments,
      bodyParts: e.bodyParts,
      steps: e.instructions.map(s => s.replace(/^Step:\s*\d+\s*/i, "").trim())
    };
    await sleep(900);
  } else if (!existing[id]) {
    problems.push(`${id}: missing from exercises.json (run npm run exercises:sync)`);
  }
  const g = await get(GIF(id), { method: "HEAD" });
  const type = g.headers.get("content-type") || "";
  if (!g.ok || !type.startsWith("image/")) problems.push(`${id}: animation ${GIF(id)} returned ${g.status} ${type}`);
  else process.stdout.write(".");
  await sleep(300);
}
console.log("");

if (!checkOnly && Object.keys(out).length) {
  const sorted = Object.fromEntries(Object.keys(out).sort().map(k => [k, out[k]]));
  fs.writeFileSync(OUT, JSON.stringify(sorted, null, 1) + "\n");
  console.log(`Wrote ${Object.keys(sorted).length} exercises to ${path.relative(root, OUT)}`);
}
if (problems.length) {
  console.error("\nProblems:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log("All animations OK.");
