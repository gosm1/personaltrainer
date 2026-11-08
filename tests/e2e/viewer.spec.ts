import { expect, test } from "./fixtures";

test.describe("Exercise animations", () => {
  test("tapping an exercise animation opens the viewer with muscles, cue, steps and credit", async ({ app }) => {
    await app.open();
    await app.openDay("L");
    await app.exercise("l2").getByRole("button", { name: "Show how to do Zercher squat" }).click();
    const v = app.viewer;
    await expect(v).toBeVisible();
    await expect(v.locator("h2")).toHaveText("Zercher squat");
    await expect(v.locator(".viewer-stage img")).toHaveAttribute("src", "https://static.exercisedb.dev/media/LSTChY9.gif");
    await expect(v.locator(".mtag.tgt")).toHaveText(/^Works: /);
    await expect(v).toContainText("Coach’s cue");
    await expect(v).toContainText("Bar in the crease of your elbows");
    expect(await v.locator(".steps li").count()).toBeGreaterThan(2);
    await expect(v.getByRole("link", { name: "ExerciseDB by AscendAPI" })).toHaveAttribute("href", "https://ascendapi.com");
  });

  test("switches between versions and the swap option", async ({ app }) => {
    await app.open({ date: "2026-11-13T09:00:00" });
    await app.openDay("LB");
    await app.exercise("lb2").getByRole("button", { name: "See how it’s done" }).click();
    const v = app.viewer;
    const chips = v.locator(".chip");
    await expect(chips).toHaveText(["Hack squat", "Leg press", "Swap: Goblet squat"]);
    await expect(chips.nth(0)).toHaveAttribute("aria-pressed", "true");
    const img = v.locator(".viewer-stage img");
    await expect(img).toHaveAttribute("src", /Qa55kX1\.gif$/);
    await chips.nth(1).click();
    await expect(img).toHaveAttribute("src", /10Z2DXU\.gif$/);
    await expect(chips.nth(1)).toHaveAttribute("aria-pressed", "true");
    await chips.nth(2).click();
    await expect(img).toHaveAttribute("src", /yn8yg1r\.gif$/);
    await expect(v.locator(".note")).toContainText("The swap for hack squat or leg press");
    await expect(v).not.toContainText("Coach’s cue");
  });

  test("Escape and back close the viewer first and leave the session open", async ({ app, page }) => {
    await app.open();
    await app.openDay("L");
    await app.exercise("l3").locator(".anim").click();
    await expect(app.viewer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(app.viewer).toBeHidden();
    await expect(app.sheet).toBeVisible();

    await app.exercise("l3").locator(".anim").click();
    await expect(app.viewer).toBeVisible();
    await page.goBack();
    await expect(app.viewer).toBeHidden();
    await expect(app.sheet).toBeVisible();
    await page.goBack();
    await expect(app.sheet).toBeHidden();
  });

  test("the Close button and tapping outside both close the viewer", async ({ app, page }) => {
    await app.open();
    await app.openDay("L");
    await app.exercise("l2").locator(".anim").click();
    await app.viewer.getByRole("button", { name: "Close" }).click();
    await expect(app.viewer).toBeHidden();
    await expect(app.sheet).toBeVisible();
    await app.exercise("l2").locator(".anim").click();
    await page.mouse.click(5, 5); // the dimmed area above the card
    await expect(app.viewer).toBeHidden();
    await expect(app.sheet).toBeVisible();
  });

  test("the rest timer stays visible above the viewer", async ({ app, page }) => {
    await app.open();
    await app.openDay("L");
    await app.setRow("l2", 1).getByRole("button", { name: "Set 1 done" }).click();
    await app.exercise("l3").locator(".anim").click();
    await expect(app.viewer).toBeVisible();
    await expect(page.locator("#rest")).toBeVisible();
    await page.locator("#rest").getByRole("button", { name: "Skip" }).click();
    await expect(page.locator("#rest")).toBeHidden();
  });

  test("animations only download when they come near the screen", async ({ app, page }) => {
    await app.open();
    expect(app.gifRequests).toEqual([]); // nothing on the week view
    await app.openDay("UB");
    await expect.poll(() => app.gifRequests.length).toBeGreaterThan(0);
    // The burpee is the last move of the complex, far below the fold: not fetched yet.
    expect(app.gifRequests).not.toContain("dK9394r");
    await app.sheet.locator(".cx .moves li").last().scrollIntoViewIfNeeded();
    await expect.poll(() => app.gifRequests).toContain("dK9394r");
    await expect(page.locator(".cx .moves .anim img").last()).toHaveJSProperty("complete", true);
  });

  test("Plan tab lists every key-session exercise with a tappable animation", async ({ app, page }) => {
    await app.open();
    await app.tab("Plan").click();
    // 8 + 10 + 8 + 9 exercises across the four key sessions, plus 6 holds that have an animation.
    await expect(page.getByTestId("sessions-glance").locator(".anim")).toHaveCount(35);
    await expect(page.getByTestId("holds-glance").locator(".anim")).toHaveCount(6);
    await expect(page.getByTestId("holds-glance")).toContainText("Copenhagen plank, 3 × 30 s per side");
    await page.getByTestId("sessions-glance").locator(".anim").first().click();
    await expect(app.viewer.locator("h2")).toHaveText("Box jump");
    await expect(app.viewer.locator(".note")).toContainText("take-off");
    await page.keyboard.press("Escape");
    await expect(app.viewer).toBeHidden();
    await expect(page.locator(".bk .anim").first()).toBeVisible();
  });

  test("shows a friendly fallback when an animation can't load", async ({ app }) => {
    await app.open({ failGifs: true });
    await app.openDay("L");
    await expect(app.exercise("l1").locator(".anim.fail")).toHaveText("Offline");
    await app.exercise("l1").locator(".anim").click();
    await expect(app.viewer).toContainText("This animation needs a connection the first time you open it.");
    // The cue and steps still work without the image.
    await expect(app.viewer.locator(".steps li").first()).toBeVisible();
  });
});

test.describe("Real ExerciseDB CDN", () => {
  test.describe.configure({ retries: 2 }); // depends on a third-party CDN
  test("animations really load from static.exercisedb.dev", async ({ app, page }) => {
    await app.open({ realGifs: true });
    await app.openDay("L");
    const img = app.exercise("l1").locator(".anim img");
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth), { timeout: 15_000 }).toBe(180);
    await app.exercise("l1").locator(".anim").click();
    const big = app.viewer.locator(".viewer-stage img");
    await expect.poll(() => big.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth), { timeout: 15_000 }).toBe(180);
    await page.keyboard.press("Escape");
  });
});
