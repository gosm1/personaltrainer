import { expect, test } from "./fixtures";

test.describe("This week", () => {
  test("shows where you are in the plan, the bar of 30 plates and today's session", async ({ app, page }) => {
    await app.open();
    await expect(page.locator("#topline")).toHaveText("Week 1 of 30, Reboot phase. 29 weeks after this one, finish line Sunday 6 Jun.");
    await expect(page.locator(".plate")).toHaveCount(30);
    await expect(page.locator(".plate.now")).toHaveAttribute("data-week", "1");
    await expect(page.locator(".plate.test")).toHaveCount(4);
    await expect(page.getByTestId("today-card")).toContainText("Lower A: strength and power");
    await expect(page.locator(".day")).toHaveCount(7);
    await expect(app.day("L")).toContainText("Today");
    await expect(page.locator(".phasebox")).toContainText("Test week. Set your baseline");
    await expect(page.getByTestId("week-count")).toHaveText(/^0 of 4 key sessions done this week/);
  });

  test("moves between weeks with the arrows and the plates", async ({ app, page }) => {
    await app.open();
    const prev = page.getByRole("button", { name: "Previous week" });
    const next = page.getByRole("button", { name: "Next week" });
    await expect(prev).toBeDisabled();
    await next.click();
    await expect(page.locator(".weeknav h2")).toHaveText("Week 2");
    await expect(page.locator(".weeknav p")).toHaveText("16 Nov to 22 Nov");
    await expect(page.getByTestId("today-card")).toHaveCount(0);

    await page.locator('.plate[data-week="12"]').click();
    await expect(page.locator(".weeknav h2")).toHaveText("Week 12");
    await expect(page.locator(".phasebox")).toContainText("Build phase.");
    await expect(page.locator(".phasebox")).toContainText("Deload week.");
    await expect(page.locator(".phasebox")).toContainText("Test week. Retest");
    await expect(page.locator('.plate[data-week="12"]')).toHaveClass(/cur/);

    await page.locator('.plate[data-week="30"]').click();
    await expect(next).toBeDisabled();
  });

  test("plate click from another tab jumps back to the week view", async ({ app, page }) => {
    await app.open();
    await app.tab("Plan").click();
    await page.locator('.plate[data-week="5"]').click();
    await expect(app.tab("This week")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".weeknav h2")).toHaveText("Week 5");
  });

  test("ticks daily habits and keeps them after a reload", async ({ app, page }) => {
    await app.open();
    const steps = page.getByRole("button", { name: "8k+ steps, Tuesday" });
    await steps.click();
    await expect(steps).toHaveAttribute("aria-pressed", "true");
    await app.eventuallySaved(s => s?.habits?.["2026-11-10"]?.steps === true);
    await page.reload();
    await expect(page.getByRole("button", { name: "8k+ steps, Tuesday" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".habits")).toContainText("by 07:30 on weekdays and by 09:00 on weekends");
  });

  test("flags key sessions you didn't log once their day has passed", async ({ app }) => {
    await app.open({ date: "2026-11-14T10:00:00", state: { logs: { "1:U": { done: true } } } });
    await expect(app.day("L")).toContainText("Not logged");
    await expect(app.day("U")).toContainText("Done");
    await expect(app.day("LB")).toContainText("Not logged");
    await expect(app.day("UB")).toContainText("Today");
    await expect(app.day("R")).not.toContainText("Not logged");
  });

  test("before week 1 the header counts down to the start", async ({ app, page }) => {
    await app.open({ state: { start: "2026-11-30" } });
    await expect(page.locator("#topline")).toHaveText("Week 1 starts Monday 30 Nov. Finish line: Sunday 27 Jun.");
  });
});
