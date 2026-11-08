import { expect, test } from "@playwright/test";

// These tests need the real service worker. The offline-animation one also depends on ExerciseDB's
// real CDN, which can be slow while the rest of the suite runs in parallel, so allow retries.
test.use({ serviceWorkers: "allow" });
test.describe.configure({ retries: 2 });

async function waitForControl(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

test("is installable: manifest, icons and theme colour", async ({ page, request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m).toMatchObject({ name: "Lock-in 30", short_name: "Lock-in 30", display: "standalone", start_url: "/" });
  expect(m.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  for (const icon of m.icons) expect((await request.get("/" + icon.src)).ok(), icon.src).toBe(true);
  expect((await request.get("/apple-touch-icon.png")).ok()).toBe(true);
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#141C26");
});

test("opens with no connection after the first visit", async ({ page, context }) => {
  await waitForControl(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#topline")).toContainText(/Week/);
  await expect(page.locator(".plate")).toHaveCount(30);
  // Self-hosted fonts come from the cache too.
  await expect.poll(() => page.evaluate(() => document.fonts.ready.then(() => document.fonts.check("800 20px 'Big Shoulders Display'")))).toBe(true);
  await context.setOffline(false);
});

test("an animation you've viewed once still plays offline at the gym", async ({ page, context }) => {
  test.setTimeout(60_000);
  await waitForControl(page);
  await page.locator('.day[data-sid="L"]').click();
  const img = page.locator('.ex[data-ex="l1"] .anim img');
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth), { timeout: 20_000 }).toBe(180);
  // Give the service worker a moment to finish writing it to the cache.
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).includes("exercise-gifs") && (await (await caches.open("exercise-gifs")).keys()).length > 0)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await page.locator('.day[data-sid="L"]').click();
  const offlineImg = page.locator('.ex[data-ex="l1"] .anim img');
  await expect.poll(() => offlineImg.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth), { timeout: 10_000 }).toBe(180);
  await context.setOffline(false);
});
