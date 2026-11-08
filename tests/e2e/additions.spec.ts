import { expect, test } from "./fixtures";

const names = (page: import("@playwright/test").Page) => page.locator("#sheet .ex:not(.hold) > .ex-head h3");

test.describe("Abs, rear delts and forearms", () => {
  test("Lower A ends with knee raises supersetted with the Pallof press, per side", async ({ app }) => {
    await app.open();
    await app.openDay("L");
    const pallof = app.exercise("l8");
    await expect(pallof.locator("h3")).toHaveText("A2Pallof press");
    await expect(pallof.locator(".target")).toHaveText("3 sets of 10–12 reps per side, rest 1 min");
    await expect(app.setRow("l8", 1).getByLabel("Set 1 reps").locator("..")).toContainText("per side");
    await expect(app.exercise("l7").locator(".ss")).toHaveText("A1");
    await expect(app.exercise("l7").locator(".target")).toHaveText("3 sets of 10–15 reps, rest 30 s");
    await expect(pallof.locator(".anim img")).toHaveAttribute("src", /9pa4H5m\.gif$/);
    await pallof.locator(".watch").click();
    await expect(app.viewer.locator(".chip")).toHaveText(["Pallof press", "Swap: Dead bug"]);
  });

  test("Lower B ends with cable crunches supersetted with lying leg raises", async ({ app }) => {
    await app.open({ date: "2026-11-13T09:00:00" });
    await app.openDay("LB");
    await expect(app.exercise("lb7").locator(".ss")).toHaveText("A1");
    const lr = app.exercise("lb8");
    await expect(lr.locator("h3")).toHaveText("A2Lying leg raise");
    await expect(lr.locator(".anim img")).toHaveAttribute("src", /WhuFnR7\.gif$/);
    await expect(lr.locator(".hint")).toHaveText("First time: log your reps.");
    await expect(app.sheet.locator(".ex")).toHaveCount(8);
  });

  test("Upper A pairs face pulls with lateral raises and finishes with forearms", async ({ app, page }) => {
    await app.open({ date: "2026-11-11T09:00:00" });
    await app.openDay("U");
    await expect(names(page)).toHaveText([
      "Barbell bench press", "Barbell bent-over row", "Incline machine press", "Lat pulldown, wide grip",
      "A1Lateral raise", "A2Face pull", "Overhead cable triceps extension", "Incline dumbbell curl",
      "B1Wrist curl", "B2Reverse wrist curl"
    ]);
    await expect(app.exercise("u8").locator(".target")).toHaveText("3 sets of 12–20 reps, rest 1 min");
    await expect(app.exercise("u9").locator(".target")).toHaveText("3 sets of 15–20 reps, rest 30 s");
    await expect(app.exercise("u4").locator(".anim img")).toHaveAttribute("src", /qdRxqCj\.gif$/); // seated lat pulldown machine
  });

  test("Upper B moves rear delts to third, with more sets, and adds reverse curls to the arm group", async ({ app, page }) => {
    await app.open({ date: "2026-11-14T09:00:00" });
    await app.openDay("UB");
    await expect(names(page)).toHaveText([
      "Incline dumbbell press", "Pull-up", "A1Cable lateral raise", "A2Reverse pec deck", "Pec deck or cable fly",
      "Chest-supported T-bar row", "B1Cable curl", "B2Triceps pushdown", "B3Reverse curl"
    ]);
    await expect(app.exercise("ub6").locator(".setrow")).toHaveCount(3); // was 2 in Reboot
    await expect(app.exercise("ub8").locator(".target")).toHaveText("2 sets of 10–15 reps, rest 30 s");
    await expect(app.exercise("ub9").locator(".target")).toHaveText("2 sets of 12–15 reps, rest 1 min");
  });
});

test.describe("Isometric holds", () => {
  test("Monday: four mobility moves, then five holds; text-only where no animation fits", async ({ app }) => {
    await app.open({ date: "2026-11-09T08:00:00" });
    await app.openDay("Z");
    await expect(app.sheet.locator(".checks .chk b")).toHaveText(["Cat–cow", "World’s greatest stretch", "Thoracic open book", "Dead hang"]);
    const holds = app.sheet.getByTestId("holds-Z");
    await expect(holds.locator(".hold h3")).toHaveText(["Deep squat hold", "Deep lunge hold", "Cossack squat hold", "Soleus raise hold", "Calf raise hold"]);
    await expect(holds.locator('[data-hold="hm2"] .target')).toHaveText("3 × 30 s per side");
    await expect(holds.locator('[data-hold="hm1"] .target')).toHaveText("3 × 30 s");
    await expect(holds.locator('[data-hold="hm1"] .anim')).toHaveCount(0);
    await expect(holds.locator('[data-hold="hm4"] .anim')).toHaveCount(0);
    await expect(holds.locator(".anim")).toHaveCount(3);
    await expect(holds.locator(".hset")).toHaveCount(15);
  });

  test("a one-sided hold counts the first side, beeps over to the other side, then stops", async ({ app, page }) => {
    await page.clock.install({ time: new Date("2026-11-09T08:00:00") });
    await page.route("https://static.exercisedb.dev/**", r => r.fulfill({ status: 404, body: "" }));
    await page.goto("/");
    await page.clock.pauseAt(new Date("2026-11-09T08:00:05")); // only the test moves time from here
    await app.openDay("Z");
    const set1 = page.getByRole("button", { name: "Deep lunge hold, set 1" });
    await set1.click();
    await expect(set1).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#restLabel")).toHaveText("Hold");
    await expect(page.locator("#restDetail")).toHaveText("Deep lunge hold, first side");
    await expect(page.locator("#restT")).toHaveText("0:30");
    await page.clock.runFor(31_000);
    await expect(page.locator("#restDetail")).toHaveText("Deep lunge hold, other side");
    await expect(page.locator("#restT")).toHaveText(/^0:(30|29)$/);
    await page.clock.runFor(31_000);
    await expect(page.locator("#rest")).toBeHidden();
    await set1.click(); // untick
    await expect(set1).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#rest")).toBeHidden();
  });

  test("a two-sided hold is a single 30-second countdown, and Skip stops it", async ({ app, page }) => {
    await app.open({ date: "2026-11-09T08:00:00" });
    await app.openDay("Z");
    await page.getByRole("button", { name: "Calf raise hold, set 2" }).click();
    await expect(page.locator("#restDetail")).toHaveText("Calf raise hold");
    const over = await page.locator("#rest").evaluate(el => el.scrollWidth - el.clientWidth);
    expect(over).toBeLessThanOrEqual(0);
    await page.locator("#rest").getByRole("button", { name: "Skip" }).click();
    await expect(page.locator("#rest")).toBeHidden();
    await app.eventuallySaved(s => s?.logs?.["1:Z"]?.iso?.hm5?.["1"] === true);
    await page.reload();
    await app.openDay("Z");
    await expect(page.getByRole("button", { name: "Calf raise hold, set 2" })).toHaveAttribute("aria-pressed", "true");
  });

  test("Thursday offers the four optional holds before the optional mobility", async ({ app, page }) => {
    await app.open({ date: "2026-11-12T08:00:00" });
    await expect(app.day("R")).toContainText("Anywhere, optional 12-min holds");
    await app.openDay("R");
    const holds = app.sheet.getByTestId("holds-R");
    await expect(holds.locator("h3.sub")).toHaveText("Optional isometric holds, about 12 minutes");
    await expect(holds.locator(".hold h3")).toHaveText(["Sissy squat hold", "Single-leg deadlift hold", "Glute bridge hold", "Copenhagen plank"]);
    await expect(holds.locator('[data-hold="ht4"] .anim')).toHaveCount(0);
    await expect(app.sheet.locator(".checks .chk")).toHaveCount(7); // the full mobility list is still there
    await holds.locator('[data-hold="ht2"]').getByRole("button", { name: "See how it’s done" }).click();
    await expect(app.viewer.locator("h2")).toHaveText("Single-leg deadlift hold");
    await expect(app.viewer.locator(".note")).toHaveText("Shown with a dumbbell; bodyweight is fine. Hold the bottom position.");
    await page.keyboard.press("Escape");
    await expect(app.viewer).toBeHidden();
  });
});
