import type { Anim, ColorKey, Hold, KeySessionId, Move, Phase, Session, SessionId } from "../types";

/**
 * ExerciseDB animation reference. The id is the ExerciseDB exerciseId.
 * `npm run exercises:sync` scans this file for gif("...") calls, pulls the matching
 * metadata into src/data/exercises.json and checks every animation still exists.
 */
const gif = (id: string, label?: string): Anim => (label ? { id, label } : { id });

export const PHASES: Phase[] = [
  {
    i: 0, name: "Reboot", from: 1, to: 4,
    effort: "Stop each set 2–3 reps before failure. You’re rebuilding the habit and the technique after two months off, not proving anything.",
    goal: "Relearn the movements and bring back the strength you had (it returns much faster than it was built). Learn the complex with a lighter bell. Walk–jog on Mondays."
  },
  {
    i: 1, name: "Build", from: 5, to: 12,
    effort: "Stop 1–2 reps before failure. Beat last week by one rep or a little weight.",
    goal: "Add reps and weight every week. Complex rounds go up with the same bell, and your Monday run becomes non-stop. Week 12 is a deload with a retest."
  },
  {
    i: 2, name: "Forge", from: 13, to: 21,
    effort: "Stop 1–2 reps short on the big lifts. Take the last set of each isolation exercise to 0–1 reps short.",
    goal: "Harder sets and more volume. The complex moves up a bell size, strides join your runs, and an optional second easy run can go on Thursday. Week 21 is a deload with a retest."
  },
  {
    i: 3, name: "Peak", from: 22, to: 30,
    effort: "Hold onto the strength you’ve built while fat loss and conditioning peak. Same effort as Forge.",
    goal: "Keep the strength and push your complex rounds to your best. Week 26 is a deload, week 30 is the final test."
  }
];

export const TOTAL_WEEKS = 30;
export const DELOAD = [12, 21, 26];
export const TESTS = [1, 12, 21, 30];
export const KEY4: KeySessionId[] = ["L", "U", "LB", "UB"];
export const IDS: SessionId[] = ["Z", "L", "U", "R", "LB", "UB", "M2"];

export const COL: Record<ColorKey, string> = {
  red: "var(--red)",
  blue: "var(--blue)",
  yellow: "var(--yellow)",
  green: "var(--green)",
  grey: "var(--grey)",
  line: "var(--line-strong)"
};

export const SESS: Record<SessionId, Session> = {
  Z: {
    type: "run", title: "Easy run and mobility", where: "Outdoors", dur: "45–60 min", c: "grey",
    why: "No gym on Mondays, so no crowd. An easy run builds the engine you said you’re missing. Then, while you’re warm, a short mobility routine and five isometric holds for your knees, hips and ankles. Keep it easy: legs train tomorrow."
  },
  L: {
    type: "str", title: "Lower A: strength and power", where: "Gym", dur: "65–75 min", c: "red",
    why: "Your heavy leg day, on a day your job never touches. Jumps first while you’re fresh, then the big lifts.",
    warm: ["5 min bike or incline walk", "Leg swings, 10 each direction per leg", "10 bodyweight squats and 10 glute bridges", "2–3 light ramp-up sets of Zercher squats"],
    ex: [
      {
        id: "l1", name: "Box jump", sets: [3, 4, 4, 3], r: [3, 3], rest: 90, u: "none",
        how: "Jump onto the box, land softly, step down. Reset fully between reps. End the set if reps get slow: this trains power, not breathing.",
        alt: "Broad jumps onto a mat, same sets and reps.",
        anim: [gif("LIlE5Tn", "Jump take-off")],
        animNote: "The animation shows the take-off you use for a box jump: dip, swing your arms, explode up. On the box, land softly with bent knees and step down."
      },
      {
        id: "l2", name: "Zercher squat", sets: [3, 4, 4, 4], r: [5, 8], rest: 150,
        how: "Bar in the crease of your elbows, chest tall, sit down between your hips, drive up through mid-foot. Wrap a towel around the bar if your elbows complain.",
        alt: "Goblet squat or hack squat.",
        anim: [gif("LSTChY9")],
        altAnim: [gif("yn8yg1r", "Goblet squat"), gif("Qa55kX1", "Hack squat")]
      },
      {
        id: "l3", name: "Romanian deadlift", sets: [3, 3, 4, 3], r: [8, 10], rest: 120,
        how: "The hip hinge your old plan was missing. Soft knees, push your hips back, keep the bar sliding down your thighs and stop when your hamstrings are fully stretched (around mid-shin). Back flat the whole time.",
        alt: "Dumbbell Romanian deadlift.",
        anim: [gif("wQ2c4XD")],
        altAnim: [gif("rR0LJzx", "Dumbbell Romanian deadlift")]
      },
      {
        id: "l4", name: "Dumbbell walking lunge", sets: [2, 3, 3, 3], r: [8, 12], rest: 90, per: "leg",
        how: "Single-leg strength and balance, the base of running. Long steps work glutes more, short steps work quads more. Back knee almost touches the floor.",
        alt: "Bulgarian split squat.",
        anim: [gif("RRWFUcw")],
        altAnim: [gif("qx4fgX7", "Bulgarian split squat")],
        animNote: "Shown as a single lunge. For the walking version, bring your back foot through into the next step."
      },
      {
        id: "l5", name: "Lying leg curl", sets: [3, 3, 3, 3], r: [10, 15], rest: 75,
        how: "Lower the weight over 2–3 seconds. Hips stay pinned to the pad.",
        anim: [gif("17lJ1kr")]
      },
      {
        id: "l6", name: "Standing calf raise", sets: [3, 3, 4, 3], r: [10, 15], rest: 60,
        how: "Full stretch at the bottom with a 1-second pause, then all the way up. Stronger calves make running easier on your shins.",
        alt: "Calf raises on the leg press.",
        anim: [gif("ykUOVze")],
        altAnim: [gif("ykHcWme", "Calf raise on the leg press")]
      },
      {
        id: "l7", name: "Hanging knee raise", ss: "A1", sets: [3, 3, 3, 3], r: [10, 15], rest: 30, u: "bw", kgLabel: "+kg",
        how: "Curl your hips up toward your ribs instead of only lifting your legs. No swinging. When 15 gets easy, straighten your legs.",
        alt: "Reverse crunch on a bench.",
        anim: [gif("VEcJRo2")],
        altAnim: [gif("nCU1Ekp", "Reverse crunch")]
      },
      {
        id: "l8", name: "Pallof press", ss: "A2", sets: [3, 3, 3, 3], r: [10, 12], rest: 60, per: "side",
        how: "Superset with the hanging knee raise: one set of knee raises, rest 30 s, one set of Pallof presses, rest 60 s, repeat. Stand side-on to a cable or band at chest height, hands at your chest. Brace, press your hands straight out, hold 2 seconds, bring them back. Don’t let it twist you. Do all the reps facing one way, then turn around.",
        alt: "Dead bug, same sets.",
        anim: [gif("9pa4H5m")],
        altAnim: [gif("iny3m5y", "Dead bug")],
        animNote: "Shown with a band. A cable set at chest height works the same way."
      }
    ]
  },
  U: {
    type: "str", title: "Upper A: strength", where: "Gym", dur: "65–75 min", c: "blue",
    why: "Heavy pressing and heavy rowing, equal priority. Strength here is what protects your muscle while you lose fat.",
    warm: ["5 min rower or arm circles", "Band pull-aparts, 2 × 15", "10 push-ups", "2–3 ramp-up sets of bench press"],
    ex: [
      {
        id: "u1", name: "Barbell bench press", sets: [3, 4, 4, 4], r: [5, 8], rest: 150,
        how: "Shoulder blades pinned back and down, feet planted, lower the bar to your lower chest, press up and slightly back.",
        alt: "Dumbbell bench press.",
        anim: [gif("EIeI8Vf")],
        altAnim: [gif("SpYC0Kp", "Dumbbell bench press")]
      },
      {
        id: "u2", name: "Barbell bent-over row", sets: [3, 4, 4, 3], r: [6, 10], rest: 120,
        how: "Hinge to about 45°, pull the bar to your belly button, hold the squeeze for 1 second. If you have to swing your body, the weight is too heavy.",
        alt: "Chest-supported row.",
        anim: [gif("eZyBC3j")],
        altAnim: [gif("7vG5o25", "Chest-supported row")]
      },
      {
        id: "u3", name: "Incline machine press", sets: [3, 3, 3, 3], r: [8, 12], rest: 90,
        how: "Your upper-chest machine. Set the seat so the handles start level with your upper chest, and control the way down.",
        anim: [gif("jHAnWmT")]
      },
      {
        id: "u4", name: "Lat pulldown, wide grip", sets: [3, 3, 4, 3], r: [8, 12], rest: 90,
        how: "Chest up, pull your elbows down to your ribs, full stretch at the top of every rep.",
        anim: [gif("qdRxqCj")]
      },
      {
        id: "u5", name: "Lateral raise", ss: "A1", sets: [3, 4, 4, 4], r: [12, 20], rest: 30,
        how: "Lead with your elbows, stop at shoulder height, no swinging. Light and strict wins here.",
        alt: "Cable lateral raise.",
        anim: [gif("DsgkuIt")],
        altAnim: [gif("goJ6ezq", "Cable lateral raise")]
      },
      {
        id: "u8", name: "Face pull", ss: "A2", sets: [3, 4, 4, 4], r: [12, 20], rest: 60,
        how: "Rear delts, your weakest point. Superset with the lateral raise: one set of lateral raises, rest 30 s, one set of face pulls, rest 60 s, repeat. Rope on a cable at face height. Pull it toward your eyes with your elbows high and wide, pulling the ends apart so your hands finish beside your ears. Squeeze for a second. Light enough that you never lean back.",
        alt: "Cable rear-delt fly or reverse pec deck.",
        anim: [gif("wqNPGCg")],
        altAnim: [gif("aqvSOQE", "Cable rear-delt fly")]
      },
      {
        id: "u6", name: "Overhead cable triceps extension", sets: [3, 3, 3, 3], r: [10, 15], rest: 60,
        how: "This is the long-head exercise you were thinking of (an overhead press is a shoulder exercise). Elbows next to your ears, deep stretch behind your head, then lock out.",
        alt: "Dumbbell overhead extension.",
        anim: [gif("2IxROQ1")],
        altAnim: [gif("PdmaD0N", "Dumbbell overhead extension")]
      },
      {
        id: "u7", name: "Incline dumbbell curl", sets: [2, 3, 3, 3], r: [10, 12], rest: 60,
        how: "Arms hang behind your body, which stretches the long head (the outer part of the biceps). No swinging.",
        anim: [gif("ae9UoXQ")]
      },
      {
        id: "u9", name: "Wrist curl", ss: "B1", sets: [3, 3, 3, 3], r: [15, 20], rest: 30,
        how: "Forearms. Superset with the reverse wrist curl. Sit with your forearms on your thighs, palms up, wrists just past your knees. Let the bar roll down to your fingertips, then curl it up as high as your wrists go. Slow and full range.",
        anim: [gif("6kSxYnw")]
      },
      {
        id: "u10", name: "Reverse wrist curl", ss: "B2", sets: [3, 3, 3, 3], r: [15, 20], rest: 60,
        how: "Same position, palms down. Lift the backs of your hands toward you, pause, lower slowly. Go light: these are small muscles.",
        anim: [gif("BLCvwr2")]
      }
    ]
  },
  R: {
    type: "rest", title: "Rest day", where: "Anywhere", dur: "optional 12-min holds", c: "line",
    why: "No gym, on purpose. Whether you’re remote or at the office, this day can’t break your week, and it splits your training into two pairs. If you have 12 minutes at home, do the isometric holds; if the day falls apart, skip them."
  },
  LB: {
    type: "str", title: "Lower B: muscle and athletic", where: "Gym", dur: "60–70 min", c: "yellow",
    why: "Your second leg day, on the day you never miss. Easier on the lower back than Tuesday, more machines, and heavy swings for hip power.",
    warm: ["5 min bike", "Leg swings, 10 each direction per leg", "10 hip hinges with hands on hips, then 10 light swings", "1–2 ramp-up sets on the hack squat or leg press"],
    ex: [
      {
        id: "lb1", name: "Heavy kettlebell swing", sets: [3, 4, 4, 4], r: [10, 10], rest: 90, kb: true,
        how: "Hike the bell back between your legs, then snap your hips forward so it floats to chest height. Your arms are ropes; the hips do the work. Heavy enough that 10 reps feel powerful, not like cardio.",
        alt: "Cable pull-through, same sets.",
        anim: [gif("UHJlbu3")],
        altAnim: [gif("OM46QHm", "Cable pull-through")]
      },
      {
        id: "lb2", name: "Hack squat or leg press", sets: [3, 3, 3, 3], r: [8, 12], rest: 120,
        how: "Deep and controlled. On the leg press, go as low as you can without your lower back peeling off the pad.",
        alt: "Goblet squat.",
        anim: [gif("Qa55kX1", "Hack squat"), gif("10Z2DXU", "Leg press")],
        altAnim: [gif("yn8yg1r", "Goblet squat")]
      },
      {
        id: "lb3", name: "Hip thrust", sets: [2, 3, 3, 3], r: [8, 12], rest: 90,
        how: "Upper back on a bench, chin tucked, drive through your heels and squeeze your glutes for 1 second at the top. Glutes power your running and jumping.",
        alt: "Hip thrust machine or glute bridge.",
        anim: [gif("qg2PGl6")],
        altAnim: [gif("qKBpF7I", "Glute bridge")]
      },
      {
        id: "lb4", name: "Seated leg curl", sets: [3, 3, 3, 3], r: [10, 15], rest: 75,
        how: "A different angle from Tuesday’s lying curl. Lean slightly forward, lower over 2–3 seconds.",
        anim: [gif("Zg3XY7P")]
      },
      {
        id: "lb5", name: "Leg extension", sets: [2, 3, 3, 3], r: [12, 15], rest: 60,
        how: "Pause for 1 second at the top, control the way down.",
        anim: [gif("my33uHU")]
      },
      {
        id: "lb6", name: "Seated calf raise", sets: [3, 3, 3, 3], r: [12, 20], rest: 60,
        how: "Full stretch at the bottom, pause, all the way up. The seated version hits a different part of the calf than Tuesday’s.",
        anim: [gif("bOOdeyc")]
      },
      {
        id: "lb7", name: "Cable crunch", ss: "A1", sets: [3, 3, 3, 3], r: [10, 15], rest: 30,
        how: "Kneel, rope by your head, curl your ribs toward your hips. Your hips stay still; it’s a crunch, not a bow.",
        alt: "Ab wheel rollout.",
        anim: [gif("WW95auq")],
        altAnim: [gif("NAgVB3t", "Ab wheel rollout")]
      },
      {
        id: "lb8", name: "Lying leg raise", ss: "A2", sets: [3, 3, 3, 3], r: [10, 15], rest: 60, u: "bw", kgLabel: "+kg",
        how: "Superset with the cable crunch: one set of crunches, rest 30 s, one set of leg raises, rest 60 s, repeat. Lie on a bench and hold it behind your head. Press your lower back down, raise straight legs to vertical, then lower over 3 seconds and stop just before your heels touch. Bend your knees slightly if your lower back starts to arch.",
        anim: [gif("WhuFnR7")]
      }
    ]
  },
  UB: {
    type: "str", title: "Upper B: muscle and the complex", where: "Gym, by 3 pm", dur: "70–75 min", c: "green",
    why: "The workout you love most, on your least reliable day, so you always have a reason to show up. Train by 3 pm, whatever time you wake. Muscle work first, with your rear delts early while you’re fresh, then your 15-minute complex.",
    warm: ["5 min rower", "Band pull-aparts, 2 × 15", "10 push-ups", "1–2 ramp-up sets of pull-ups and incline press"],
    ex: [
      {
        id: "ub1", name: "Incline dumbbell press", sets: [3, 3, 3, 3], r: [8, 12], rest: 90,
        how: "Bench at about 30°. The dumbbells come down to the sides of your upper chest.",
        anim: [gif("B3Rxp6L")]
      },
      {
        id: "ub2", name: "Pull-up", sets: [3, 3, 4, 4], r: [5, 10], rest: 120, u: "bw", kgLabel: "assist kg", assist: true,
        how: "Full hang to chin over the bar. Use the assisted machine or a band if you need it, log the assistance, and lower it over time: fewer assist kilos is progress.",
        alt: "Assisted pull-up machine or band-assisted pull-up.",
        anim: [gif("lBDjFxJ")],
        altAnim: [gif("kiJ4Z2K", "Assisted pull-up machine")]
      },
      {
        id: "ub5", name: "Cable lateral raise", ss: "A1", sets: [3, 4, 4, 4], r: [12, 20], rest: 30,
        how: "Superset with the reverse pec deck: one set of this, rest 30 s, one set of reverse pec deck, rest 60 s, repeat. Cable behind you, lead with your elbow.",
        anim: [gif("goJ6ezq")]
      },
      {
        id: "ub6", name: "Reverse pec deck", ss: "A2", sets: [3, 4, 4, 4], r: [15, 20], rest: 60,
        how: "Rear delts, your weakest point, so they come early while you’re fresh. Arms nearly straight, push the handles out and back, no shrugging.",
        anim: [gif("myfUsKf")]
      },
      {
        id: "ub3", name: "Pec deck or cable fly", sets: [2, 3, 3, 3], r: [12, 15], rest: 60,
        how: "Soft elbows, big stretch at the start, squeeze for a second when your hands meet.",
        anim: [gif("v3xmPAR", "Pec deck"), gif("Pr9Rhf4", "Cable fly")]
      },
      {
        id: "ub4", name: "Chest-supported T-bar row", sets: [3, 3, 3, 3], r: [8, 12], rest: 90,
        how: "Chest on the pad means no lower-back stress the day after Lower B. Squeeze your shoulder blades together at the top.",
        alt: "Seated cable row.",
        anim: [gif("BgljGjd")],
        altAnim: [gif("fUBheHs", "Seated cable row")]
      },
      {
        id: "ub7", name: "Cable curl", ss: "B1", sets: [2, 3, 3, 3], r: [10, 15], rest: 30,
        how: "Elbows pinned at your sides, squeeze at the top. Tri-set: curl, pushdown, reverse curl, then rest. If Saturday runs long, cut this group to 2 sets.",
        anim: [gif("G08RZcQ")]
      },
      {
        id: "ub8", name: "Triceps pushdown", ss: "B2", sets: [2, 3, 3, 3], r: [10, 15], rest: 30,
        how: "Rope or straight bar, elbows glued to your sides, full lockout.",
        alt: "Overhead cable extension.",
        anim: [gif("dU605di", "Rope"), gif("3ZflifB", "Straight bar")],
        altAnim: [gif("2IxROQ1", "Overhead cable extension")]
      },
      {
        id: "ub9", name: "Reverse curl", ss: "B3", sets: [2, 3, 3, 3], r: [12, 15], rest: 60,
        how: "Forearms. Straight bar on the same cable, overhand grip, elbows pinned to your sides. Curl up, lower over 2 seconds. It works the top of your forearm, the part that shows.",
        alt: "Barbell or EZ-bar reverse curl.",
        anim: [gif("eOG0r6v")],
        altAnim: [gif("xNrS20v", "Barbell reverse curl")]
      }
    ]
  },
  M2: {
    type: "mob", title: "Rest, check-in and backup", where: "Home", dur: "15 min", c: "line",
    why: "Recover, log your numbers, and catch up if Saturday didn’t happen."
  }
};

export const CX = {
  moves: [
    { text: "5 deadlifts", anim: [gif("nUwVh7b", "Deadlift")], animNote: "Shown with two dumbbells. With one bell, stand over it and hinge the same way." },
    { text: "5 bent-over rows", anim: [gif("wf24o8S", "Bent-over row")] },
    { text: "5 hang cleans", anim: [gif("LHWF7us", "Hang clean")] },
    { text: "5 front squats", anim: [gif("DB0n8AG", "Front squat")] },
    { text: "5 push presses", anim: [gif("osdXT3K", "Push press")] },
    { text: "5 push-ups", anim: [gif("I4hDWkc", "Push-up")] },
    { text: "5 burpees", anim: [gif("dK9394r", "Burpee")] }
  ] as Move[],
  p: [
    "12 minutes, as many rounds as you can, with a lighter bell (12–16 kg). Learn the hang clean and the push press; smooth beats fast.",
    "15 minutes, as many rounds as you can, with the same bell every week. Beat last week’s rounds.",
    "15 minutes with one bell size heavier than in Build. Build the rounds back up.",
    "15 minutes with your heavier bell. Push the rounds to your best."
  ],
  base: "Baseline test: the full 15 minutes with the bell you’ll use for every test. Pace it; the first round should feel easy.",
  test: "Test week: the full 15 minutes with your week-1 bell, so the score compares with every other test.",
  deload: "Deload: 10 minutes at an easy pace.",
  note: "Deadlift through push press without putting the bell down. With one bell, switch arms each round for the cleans and presses. Use the same setup every week.",
  tech: "Your hips move the bell on the deadlift and the clean; your arms only guide it. If your lower back rounds, or the bell bangs your forearm on the clean, go lighter. Rest whenever you need to between rounds: the clock keeps running, so short breaks still count against you."
};

export const BACKUPS: { name: string; p: string; moves: Move[] }[] = [
  {
    name: "The four", p: "4 rounds, 60 s rest between rounds.",
    moves: [
      { text: "6 thrusters", anim: [gif("yWxMvB5", "Thruster")] },
      { text: "15 rows (two bells, or 8 per arm with one)", anim: [gif("wf24o8S", "Row")] },
      { text: "15 burpees", anim: [gif("dK9394r", "Burpee")] },
      { text: "10 high pulls", anim: [gif("8ARQ9Hw", "High pull")] }
    ]
  },
  {
    name: "Ten by ten", p: "2 rounds, 2 min rest between rounds.",
    moves: [
      { text: "10 push-ups", anim: [gif("I4hDWkc", "Push-up")] },
      { text: "10 rows", anim: [gif("wf24o8S", "Row")] },
      { text: "10 reverse lunges (5 per leg)", anim: [gif("SSsBDwB", "Reverse lunge")] },
      { text: "10 clean and press", anim: [gif("7Ba7bQ2", "Clean"), gif("blBXysN", "Press")] },
      { text: "10 deadlifts", anim: [gif("nUwVh7b", "Deadlift")], animNote: "Shown with two dumbbells. With one bell, stand over it and hinge the same way." },
      { text: "10 clean and squat", anim: [gif("7Ba7bQ2", "Clean"), gif("DB0n8AG", "Front squat")] },
      { text: "10 power snatches (swings until week 5)", anim: [gif("aXcUyKb", "Snatch"), gif("UHJlbu3", "Swing")] },
      { text: "10 kettlebell curls", anim: [gif("3s4NnTh", "Curl")], animNote: "Shown with dumbbells. Hold the bell by the horns and curl the same way." },
      { text: "10 burpees", anim: [gif("dK9394r", "Burpee")] },
      { text: "10 jump squats", anim: [gif("LIlE5Tn", "Jump squat")] }
    ]
  }
];

export const RUN = [
  "Walk–jog for 30 minutes: 2 min easy jog, 2 min walk, 7 or 8 times. If jogging hurts anything, do a fast incline walk on the treadmill instead.",
  "Build toward non-stop running. Weeks 5–8: 3 min jog, 1 min walk, 7 times. Weeks 9–12: 20–25 minutes without stopping, as slow as you need.",
  "30–35 minutes of continuous easy running, then 4–6 relaxed strides of 15–20 seconds with a walk back.",
  "35–45 minutes of easy running, then 4–6 relaxed strides."
];

export const ZONE2 = "Easy means Zone 2: you can still talk in full sentences. If you can’t, slow down or walk. Keep it truly easy, because Lower A is tomorrow.";

/** Mobility moves. Only moves with a faithful animation get one; the rest stay text-only. */
export const MOB: { name: string; dose: string; anim?: Anim[] }[] = [
  { name: "Cat–cow", dose: "10 slow reps" },
  { name: "World’s greatest stretch", dose: "3 per side", anim: [gif("DFGXwZr")] },
  { name: "90/90 hip switches", dose: "8 per side" },
  { name: "Couch stretch", dose: "45 s per side" },
  { name: "Deep squat hold", dose: "60 s, hold a post if needed" },
  { name: "Thoracic open book", dose: "8 per side" },
  { name: "Dead hang", dose: "30–45 s, or a doorway chest stretch" }
];

/**
 * Monday's mobility after the run: only the moves the isometric holds don't already cover.
 * Indexes into MOB, which is how mobility ticks are saved, so MOB's order must not change.
 */
export const MOB_MON = [0, 1, 5, 6];

/** Isometric holds, Monday after the run: the lighter, mobility-style ones (Lower A is tomorrow). */
export const HOLDS_MON: Hold[] = [
  {
    id: "hm1", name: "Deep squat hold", sets: 3, secs: 30,
    how: "Sit all the way down between your heels, chest up, heels flat. Hold a post or door frame if you need to. Breathe slowly and let your hips sink a little lower each set."
  },
  {
    id: "hm2", name: "Deep lunge hold", sets: 3, secs: 30, perSide: true,
    how: "Long split stance. Sink until your back knee hovers just off the floor, front heel down. Stay tall and squeeze the glute of your back leg to open the front of that hip.",
    anim: [gif("9E25EOx", "Deep lunge")],
    animNote: "Hold the bottom of this movement instead of moving."
  },
  {
    id: "hm3", name: "Cossack squat hold", sets: 3, secs: 30, perSide: true,
    how: "Wide stance. Shift onto one leg and sit down into it while the other leg stays straight with its toes up. Heel down, chest up. Hold a support at first.",
    anim: [gif("GWoKnIm", "Cossack squat")],
    animNote: "Shown with a weight; bodyweight is enough. Hold the bottom position on each side."
  },
  {
    id: "hm4", name: "Soleus raise hold", sets: 3, secs: 30,
    how: "Knees bent to about 45°, rise onto the balls of your feet and hold the top. Bent knees put the work on the soleus, the deep calf muscle that takes most of the load when you run. Move to one leg at a time when both legs gets easy."
  },
  {
    id: "hm5", name: "Calf raise hold", sets: 3, secs: 30,
    how: "Straight knees, on a step if you have one. Rise as high as you can and hold the top without rocking.",
    anim: [gif("6HmFgmx", "Calf raise")],
    animNote: "Hold the top position instead of moving."
  }
];

/** Isometric holds, Thursday at home. Optional, so a messy Thursday still can't break the week. */
export const HOLDS_THU: Hold[] = [
  {
    id: "ht1", name: "Sissy squat hold", sets: 3, secs: 30,
    how: "Hold a door frame, rise onto your toes and lean back as your knees travel forward, keeping a straight line from knees to shoulders. Go only as deep as your knees are happy with, and hold there.",
    anim: [gif("xdYPUtE", "Sissy squat")],
    animNote: "Shown with a support pad. Holding a door frame works too. Hold the lowest position your knees are happy with."
  },
  {
    id: "ht2", name: "Single-leg deadlift hold", sets: 3, secs: 30, perSide: true,
    how: "Stand on one leg with a soft knee and hinge until your body and back leg are close to level, hips square to the floor. Hold. Touch a wall with one hand if balance is the limit.",
    anim: [gif("gKozT8X", "Single-leg deadlift")],
    animNote: "Shown with a dumbbell; bodyweight is fine. Hold the bottom position."
  },
  {
    id: "ht3", name: "Glute bridge hold", sets: 3, secs: 30,
    how: "On your back, feet flat, push through your heels until your body is straight from knees to shoulders. Squeeze your glutes hard and keep your ribs down so your lower back doesn’t take over.",
    anim: [gif("u0cNiij", "Glute bridge")],
    animNote: "Hold the top position."
  },
  {
    id: "ht4", name: "Copenhagen plank", sets: 3, secs: 30, perSide: true,
    how: "Side plank with your top leg on a bench or sofa and your bottom leg tucked underneath. Knee on the bench is the easier version, foot on the bench is harder. Lift your hips into a straight line. It works your inner thigh and the side of your core."
  }
];

export const HAB = [
  { k: "steps", l: "8k+ steps" },
  { k: "mob", l: "Mobility" },
  { k: "sleep", l: "7 h+ sleep" },
  { k: "wake", l: "Up on time" }
];

export const TESTF = [
  { k: "push", l: "Max push-ups", u: "reps" },
  { k: "run", l: "1.6 km run/walk", u: "min:sec" },
  { k: "amrap", l: "15-min complex", u: "rounds + reps, week-1 bell" },
  { k: "zercher", l: "Zercher, best set of 5", u: "kg" },
  { k: "photos", l: "Photos taken", u: "yes or no" }
];
