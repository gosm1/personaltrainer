import { expect, test } from "./fixtures";

async function noSideScroll(page: import("@playwright/test").Page, selector?: string) {
  const over = await page.evaluate(sel => {
    const el = sel ? document.querySelector(sel)! : document.documentElement;
    return el.scrollWidth - el.clientWidth;
  }, selector ?? null);
  expect(over, `horizontal overflow on ${selector ?? "page"}`).toBeLessThanOrEqual(0);
}

test.describe("Layout", () => {
  test("no sideways scrolling on any tab, session or viewer", async ({ app, page }) => {
    await app.open({ state: { checkins: { "1": { kg: "83" }, "2": { kg: "82.5" } } } });
    for (const t of ["This week", "Progress", "Plan", "Settings"] as const) {
      await app.tab(t).click();
      await noSideScroll(page);
    }
    await app.tab("This week").click();
    for (const sid of ["Z", "L", "U", "R", "LB", "UB", "M2"]) {
      await app.openDay(sid);
      await noSideScroll(page, "#sheet");
      await page.keyboard.press("Escape");
      await expect(app.sheet).toBeHidden();
    }
    await app.openDay("UB");
    await app.exercise("ub8").locator(".anim").click();
    await noSideScroll(page, ".viewer-card");
  });

  test("follows the phone's dark mode", async ({ app, page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await app.open();
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(16, 21, 27)");
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(228, 231, 234)");
  });

  test("keyboard: the session's Close button gets focus and focus returns afterwards", async ({ app, page }) => {
    await app.open();
    await app.day("U").focus();
    await page.keyboard.press("Enter");
    await expect(app.sheet.getByRole("button", { name: "Close" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(app.sheet).toBeHidden();
    await expect(app.day("U")).toBeFocused();
  });
});
