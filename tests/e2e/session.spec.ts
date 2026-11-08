import { SESS } from "../../src/data/plan";
import { expect, test } from "./fixtures";

test.describe("Strength sessions", () => {
  test("Lower A shows every exercise with its animation and the Reboot set counts", async ({ app, page }) => {
    await app.open();
    await page.getByTestId("today-card").click();
    await expect(app.sheet.locator("h2")).toHaveText("Lower A: strength and power");
    await expect(app.sheet).toContainText("Tuesday 10 Nov, week 1, Reboot phase. Gym, 65–75 min.");

    const plan = SESS.L.ex!;
    await expect(app.sheet.locator(".ex")).toHaveCount(plan.length);
    for (const e of plan) {
      const card = app.exercise(e.id);
      await expect(card.locator("h3")).toHaveText((e.ss ?? "") + e.name);
      await expect(card.locator(".anim img")).toHaveAttribute("src", `https://static.exercisedb.dev/media/${e.anim[0].id}.gif`);
      await expect(card.locator(".anim img")).toHaveAttribute("loading", "lazy");
      await expect(card.locator(".setrow")).toHaveCount(e.sets[0]);
    }
    await expect(app.exercise("l2").locator(".target")).toHaveText("3 sets of 5–8 reps, rest 2:30 min");
    await expect(app.exercise("l4").locator(".target")).toHaveText("2 sets of 8–12 reps per leg, rest 1:30 min");
    // Box jumps have no weight field.
    await expect(app.setRow("l1", 1).locator("input")).toHaveCount(1);
  });

  test("logging a set ticks it, saves it and starts the rest timer", async ({ app, page }) => {
    await app.open();
    await app.openDay("L");
    const row = app.setRow("l2", 1);
    await row.getByLabel("Set 1 weight").fill("60");
    await row.getByLabel("Set 1 reps").fill("8");
    await row.getByRole("button", { name: "Set 1 done" }).click();
    await expect(row).toHaveClass(/ok/);
    await expect(page.locator("#rest")).toBeVisible();
    await expect(page.locator("#restT")).toHaveText(/^2:(30|29)$/);
    await page.locator("#rest").getByRole("button", { name: "+15 s" }).click();
    await expect(page.locator("#restT")).toHaveText(/^2:(45|44)$/);
    await page.locator("#rest").getByRole("button", { name: "Skip" }).click();
    await expect(page.locator("#rest")).toBeHidden();
    await app.eventuallySaved(s => {
      const r = s?.logs?.["1:L"]?.ex?.l2?.[0];
      return r && r.kg === "60" && r.r === "8" && r.ok === true;
    });
  });

  test("the rest timer counts down and disappears when time is up", async ({ app, page }) => {
    await page.clock.install({ time: new Date("2026-11-10T09:00:00") });
    await app.page.route("https://static.exercisedb.dev/**", r => r.fulfill({ status: 200, contentType: "image/gif", body: Buffer.alloc(0) }));
    await page.goto("/");
    await page.clock.pauseAt(new Date("2026-11-10T09:00:05")); // only the test moves time from here
    await app.openDay("L");
    await app.setRow("l5", 1).getByRole("button", { name: "Set 1 done" }).click();
    await expect(page.locator("#restT")).toHaveText("1:15");
    await page.clock.runFor(30_000);
    await expect(page.locator("#restT")).toHaveText("0:45");
    await page.clock.runFor(46_000);
    await expect(page.locator("#rest")).toBeHidden();
  });

  test("next week shows last time's numbers, the progression hint, and fills blanks when ticked", async ({ app }) => {
    await app.open({
      date: "2026-11-17T09:00:00",
      state: {
        logs: {
          "1:L": { done: true, ex: { l2: [{ kg: "60", r: "8", ok: true }, { kg: "60", r: "8", ok: true }, { kg: "60", r: "8", ok: true }], l5: [{ kg: "30", r: "12", ok: true }] } }
        }
      }
    });
    await app.openDay("L");
    const zercher = app.exercise("l2");
    await expect(zercher.locator(".last")).toHaveText("Last time (week 1): 60 kg × 8, 60 kg × 8, 60 kg × 8");
    await expect(zercher.locator(".hint")).toContainText("add the smallest jump");
    await expect(app.exercise("l5").locator(".hint")).toHaveText("Beat last time: one more rep on any set, same weight.");

    const row = app.setRow("l2", 1);
    await expect(row.getByLabel("Set 1 weight")).toHaveAttribute("placeholder", "60");
    await row.getByRole("button", { name: "Set 1 done" }).click();
    await expect(row.getByLabel("Set 1 weight")).toHaveValue("60");
    await expect(row.getByLabel("Set 1 reps")).toHaveValue("8");
  });

  test("completing a session closes it, fills the plate and can be undone", async ({ app, page }) => {
    await app.open();
    await app.openDay("L");
    await app.sheet.getByRole("button", { name: "Mark session complete" }).click();
    await expect(app.sheet).toBeHidden();
    await expect(page.locator("#toast")).toHaveText("1 of 4 key sessions this week.");
    await expect(app.day("L")).toContainText("Done");
    await expect(page.locator('.plate[data-week="1"]')).toHaveClass(/part/);
    await expect(page.getByTestId("today-card")).toContainText("Done. Nice work.");

    await app.openDay("L");
    await app.sheet.getByRole("button", { name: "Completed. Tap to undo" }).click();
    await expect(app.sheet.getByRole("button", { name: "Mark session complete" })).toBeVisible();
    await app.eventuallySaved(s => s?.logs?.["1:L"]?.done === false);
  });

  test("three key sessions load a full plate", async ({ app, page }) => {
    await app.open({ state: { logs: { "1:L": { done: true }, "1:U": { done: true } } } });
    await app.openDay("LB");
    await app.sheet.getByRole("button", { name: "Mark session complete" }).click();
    await expect(page.locator("#toast")).toHaveText("3 of 4 key sessions this week. Plate loaded.");
    await expect(page.locator('.plate[data-week="1"]')).toHaveClass(/full/);
  });

  test("notes are kept after a reload", async ({ app, page }) => {
    await app.open();
    await app.openDay("U");
    await app.sheet.getByLabel("Notes").fill("Left shoulder tight on bench");
    await app.eventuallySaved(s => s?.logs?.["1:U"]?.note === "Left shoulder tight on bench");
    await page.reload();
    await app.openDay("U");
    await expect(app.sheet.getByLabel("Notes")).toHaveValue("Left shoulder tight on bench");
  });

  test("deload weeks halve the sets", async ({ app, page }) => {
    await app.open();
    await page.locator('.plate[data-week="12"]').click();
    await app.openDay("L");
    await expect(app.sheet).toContainText("Deload. The sets below are halved.");
    await expect(app.exercise("l2").locator(".setrow")).toHaveCount(2); // Build: 4 sets -> 2
    await expect(app.exercise("l2").locator(".target")).toHaveText("2 sets of 5–8 reps, rest 2:30 min");
  });

  test("Upper B shows the supersets and the complex, and a test-week score lands in the Tests table", async ({ app, page }) => {
    await app.open({ date: "2026-11-14T10:00:00" });
    await app.openDay("UB");
    await expect(app.sheet.locator(".ss")).toHaveText(["A1", "A2", "B1", "B2", "B3"]);
    const cx = app.sheet.locator(".cx");
    await expect(cx).toContainText("Baseline test");
    await expect(cx.locator(".moves li")).toHaveCount(7);
    await expect(cx.locator(".moves .anim")).toHaveCount(7);
    await cx.getByTestId("cx-bell").fill("16");
    await cx.getByTestId("cx-rounds").fill("5");
    await cx.getByTestId("cx-reps").fill("12");
    await cx.getByTestId("cx-rpe").fill("8");
    await app.sheet.getByRole("button", { name: "Mark session complete" }).click();
    await app.tab("Progress").click();
    await expect(page.getByLabel("15-min complex, week 1", { exact: true })).toHaveValue("5 + 12");
    await expect(page.getByTestId("cx-history")).toContainText("5 rounds + 12 reps with 16 kg");
  });

  test("Escape and the back button close the session", async ({ app, page }) => {
    await app.open();
    await app.openDay("L");
    await page.keyboard.press("Escape");
    await expect(app.sheet).toBeHidden();
    await app.openDay("U");
    await page.goBack();
    await expect(app.sheet).toBeHidden();
    await expect(page).toHaveURL(/localhost:4173\/$/);
    await expect(page.locator("#topline")).toBeVisible();
  });
});

test.describe("Run, rest and Sunday days", () => {
  test("Monday run logs time and distance, and the mobility checklist ticks off", async ({ app, page }) => {
    await app.open({ date: "2026-11-16T08:00:00", state: { logs: { "1:Z": { done: true, z: { min: "30", km: "3.8" } } } } });
    await app.openDay("Z");
    await expect(app.sheet).toContainText("Today’s run. Walk–jog for 30 minutes"); // week 2 is still Reboot
    await expect(app.sheet.locator(".last")).toHaveText("Last run (week 1): 30 min, 3.8 km.");
    await app.sheet.getByTestId("run-min").fill("32");
    await app.sheet.getByTestId("run-km").fill("4.1");
    const wgs = app.sheet.getByRole("button", { name: "World’s greatest stretch 3 per side" });
    await wgs.click();
    await expect(wgs).toHaveAttribute("aria-pressed", "true");
    await expect(app.sheet.locator(".checks .anim")).toHaveCount(1);
    await app.sheet.getByRole("button", { name: "Mark day complete" }).click();
    await expect(page.locator("#toast")).toHaveText("Logged. See you at the next one.");
    await app.eventuallySaved(s => s?.logs?.["2:Z"]?.z?.km === "4.1" && s.logs["2:Z"].mob?.["1"] === true);
  });

  test("the optional second run appears on rest days from the Forge phase", async ({ app, page }) => {
    await app.open();
    await app.openDay("R");
    await expect(app.sheet).not.toContainText("Optional second easy run");
    await page.keyboard.press("Escape");
    await page.locator('.plate[data-week="13"]').click();
    await app.openDay("R");
    await expect(app.sheet).toContainText("Optional second easy run");
    await expect(app.sheet.getByTestId("run-min")).toBeVisible();
  });

  test("Sunday lists missed sessions and opens them for a catch-up", async ({ app }) => {
    await app.open({ date: "2026-11-15T10:00:00", state: { logs: { "1:U": { done: true } } } });
    await app.openDay("M2");
    const c = app.sheet.getByTestId("catchup");
    await expect(c).toContainText("Not logged this week: Lower A, Lower B, Upper B.");
    await expect(c).toContainText("Saturday didn’t happen? Today is your backup slot for Upper B.");
    await expect(c).toContainText("If you can only do one, pick Lower A.");
    await c.getByRole("button", { name: "Open Lower A" }).click();
    await expect(app.sheet.locator("h2")).toHaveText("Lower A: strength and power");
  });

  test("Sunday has the backup circuits with animations and the weekly check-in", async ({ app }) => {
    await app.open({ date: "2026-11-15T10:00:00" });
    await app.openDay("M2");
    await app.sheet.getByText("Can’t get to the gym at all? Your backup circuits").click();
    await expect(app.sheet.locator(".bk")).toHaveCount(2);
    await expect(app.sheet.locator(".bk .anim").first()).toBeVisible();
    await app.sheet.getByTestId("ci-kg-1").fill("82.4");
    await app.sheet.getByTestId("ci-test-push-1").fill("24");
    await app.eventuallySaved(s => s?.checkins?.["1"]?.kg === "82.4" && s.tests?.["1"]?.push === "24");
  });
});
