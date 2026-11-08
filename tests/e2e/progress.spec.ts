import { expect, test } from "./fixtures";

test.describe("Progress", () => {
  test("summarises sessions, plates and the streak", async ({ app, page }) => {
    const done = { done: true };
    await app.open({
      date: "2026-11-26T09:00:00",
      state: { logs: { "1:L": done, "1:U": done, "1:LB": done, "2:L": done, "2:U": done, "2:LB": done, "2:UB": done, "3:L": done } }
    });
    await app.tab("Progress").click();
    await expect(page.getByTestId("progress-summary")).toHaveText(
      "You’ve logged 8 key sessions so far. 2 weeks have loaded a plate, and your current streak is 2 weeks."
    );
    await expect(page.locator('.plate[data-week="1"]')).toHaveClass(/full/);
    await expect(page.locator('.plate[data-week="3"]')).toHaveClass(/part/);
  });

  test("check-ins draw the weight and waist charts, accepting comma decimals", async ({ app, page }) => {
    await app.open({ date: "2026-11-17T09:00:00", state: { checkins: { "1": { kg: "83.0", waist: "92" } } } });
    await app.tab("Progress").click();
    await expect(page.getByTestId("chart-kg")).toContainText("One week logged");
    await page.getByTestId("ci-kg-2").fill("82,4");
    await page.getByTestId("ci-waist-2").fill("91");
    await expect(page.getByTestId("chart-kg").locator("figcaption")).toHaveText("Weight: 82.4 kg (-0.6 kg since week 1)");
    await expect(page.getByTestId("chart-kg").locator("polyline")).toHaveCount(1);
    await expect(page.getByTestId("chart-kg").locator("circle")).toHaveCount(2);
    await expect(page.getByTestId("chart-waist").locator("figcaption")).toHaveText("Waist: 91 cm (-1.0 cm since week 1)");
  });

  test("the tests table is editable, trims spaces and persists", async ({ app, page }) => {
    await app.open();
    await app.tab("Progress").click();
    const push = page.getByLabel("Max push-ups, week 12", { exact: true });
    await push.fill("  31 ");
    await push.blur();
    await expect(push).toHaveValue("31");
    await page.getByLabel("1.6 km run/walk, week 1", { exact: true }).fill("9:45");
    await app.eventuallySaved(s => s?.tests?.["12"]?.push === "31" && s.tests["1"]?.run === "9:45");
    await page.reload();
    await app.tab("Progress").click();
    await expect(page.getByLabel("Max push-ups, week 12", { exact: true })).toHaveValue("31");
    await page.getByText("How to run the tests").click();
    await expect(page.getByText("Zercher: the heaviest clean set of 5")).toBeVisible();
  });

  test("lists complex scores week by week", async ({ app, page }) => {
    await app.open({
      date: "2026-11-24T09:00:00",
      state: { logs: { "1:UB": { done: true, cx: { bell: "16", rounds: "5", reps: "3", rpe: "8" } }, "2:UB": { done: true, cx: { bell: "16", rounds: "6", rpe: "7" } } } }
    });
    await app.tab("Progress").click();
    const rows = page.getByTestId("cx-history").locator("tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText("Week 1test5 rounds + 3 reps with 16 kg8");
    await expect(rows.nth(1)).toContainText("6 rounds with 16 kg");
    // Next Saturday's session shows the last score to beat.
    await app.tab("This week").click();
    await app.openDay("UB");
    await expect(app.sheet.locator(".cx .last")).toHaveText("Last time (week 2): 6 rounds with 16 kg.");
  });
});
