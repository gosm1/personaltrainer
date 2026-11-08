import fs from "node:fs";
import { expect, test } from "./fixtures";

const ORIGINAL_BACKUP = JSON.stringify({
  v: 2,
  start: "2026-11-09",
  logs: { "1:L": { done: true, date: "2026-11-10", ex: { l2: [{ kg: "60", r: "8", ok: true }] } }, "1:U": { done: true } },
  habits: {},
  checkins: { "1": { kg: "82.4" } },
  tests: {},
  wake: "06:45"
});

test.describe("Settings", () => {
  test("changing the start date snaps to Monday and moves the whole plan", async ({ app, page }) => {
    await app.open();
    await app.tab("Settings").click();
    await page.getByTestId("start-date").fill("2026-11-04"); // a Wednesday
    await expect(page.locator("#toast")).toHaveText("Saved.");
    await expect(page.locator(".settings")).toContainText("Week 1 is set to Monday 2 Nov.");
    await expect(page.locator("#topline")).toHaveText(/^Week 2 of 30, Reboot phase/);
    await app.eventuallySaved(s => s?.start === "2026-11-02");
  });

  test("changing the wake-up time updates the habit rule", async ({ app, page }) => {
    await app.open();
    await app.tab("Settings").click();
    await page.getByTestId("wake-time").fill("06:45");
    await expect(page.locator("#toast")).toHaveText("Saved.");
    await app.tab("This week").click();
    await expect(page.locator(".habits")).toContainText("by 06:45 on weekdays and by 08:15 on weekends");
  });

  test("downloads a backup file that restores everything", async ({ app, page }) => {
    await app.open({ state: { logs: { "1:L": { done: true } }, checkins: { "1": { kg: "82" } } } });
    await app.tab("Settings").click();
    await expect(page.getByTestId("last-backup")).toHaveText("No backup yet.");
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download backup" }).click()]);
    expect(download.suggestedFilename()).toBe("lockin30-backup-2026-11-10.json");
    const file = await download.path();
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    expect(data.logs["1:L"].done).toBe(true);
    expect(data.checkins["1"].kg).toBe("82");
    await expect(page.getByTestId("last-backup")).toHaveText("Last backup: Tuesday 10 Nov.");

    // Erase, then restore from that same file.
    await page.getByRole("button", { name: "Erase all data" }).click();
    await page.getByRole("button", { name: "Tap again to erase everything" }).click();
    await expect(page.locator("#toast")).toHaveText("Everything erased. Fresh start.");
    await app.eventuallySaved(s => s && Object.keys(s.logs).length === 0);
    await page.getByTestId("restore-file").setInputFiles(file);
    await expect(page.locator("#toast")).toHaveText("Backup restored.");
    await app.tab("This week").click();
    await expect(app.day("L")).toContainText("Done");
  });

  test("copies backup text to the clipboard", async ({ app, page, context, browserName }) => {
    test.skip(browserName !== "chromium", "clipboard permissions are Chromium-only");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await app.open({ state: { logs: { "1:U": { done: true } } } });
    await app.tab("Settings").click();
    await page.getByRole("button", { name: "Copy backup text" }).click();
    await expect(page.locator("#toast")).toHaveText("Backup copied. Paste it somewhere safe.");
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(JSON.parse(text).logs["1:U"].done).toBe(true);
  });

  test("restores a backup pasted from the original HTML tracker", async ({ app, page }) => {
    await app.open();
    await app.tab("Settings").click();
    await page.getByPlaceholder("Paste backup text here").fill(ORIGINAL_BACKUP);
    await page.getByRole("button", { name: "Restore backup" }).click();
    await expect(page.locator("#toast")).toHaveText("Backup restored.");
    await expect(page.getByTestId("wake-time")).toHaveValue("06:45");
    await app.tab("This week").click();
    await expect(app.day("L")).toContainText("Done");
    await expect(app.day("U")).toContainText("Done");
    await expect(page.locator(".habits")).toContainText("by 06:45 on weekdays");
  });

  test("rejects text that isn't a backup", async ({ app, page }) => {
    await app.open();
    await app.tab("Settings").click();
    await page.getByPlaceholder("Paste backup text here").fill("my notes");
    await page.getByRole("button", { name: "Restore backup" }).click();
    await expect(page.locator("#impmsg")).toHaveText(/That text isn’t a Lock-in 30 backup/);
  });

  test("erase needs a second tap, and disarms after 5 seconds", async ({ app, page }) => {
    await page.clock.install({ time: new Date("2026-11-10T09:00:00") });
    await page.goto("/");
    await page.clock.pauseAt(new Date("2026-11-10T09:00:05")); // only the test moves time from here
    await app.tab("Settings").click();
    await page.getByRole("button", { name: "Erase all data" }).click();
    await expect(page.getByRole("button", { name: "Tap again to erase everything" })).toBeVisible();
    await page.clock.runFor(5_100);
    await expect(page.getByRole("button", { name: "Erase all data" })).toBeVisible();
  });

  test("reminds you to back up once you have logs, until you do", async ({ app, page }) => {
    await app.open({ state: { logs: { "1:L": { done: true } } } });
    await expect(page.getByTestId("backup-reminder")).toContainText("You haven’t made a backup yet.");
    await page.getByTestId("backup-reminder").getByRole("button", { name: "Back up now" }).click();
    await expect(app.tab("Settings")).toHaveAttribute("aria-selected", "true");
    await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download backup" }).click()]);
    await app.tab("This week").click();
    await expect(page.getByTestId("backup-reminder")).toHaveCount(0);
  });

  test("no reminder with a recent backup", async ({ app, page }) => {
    await app.open({ state: { logs: { "1:L": { done: true } } }, lastBackup: "2026-11-05" });
    await expect(page.getByTestId("backup-reminder")).toHaveCount(0);
  });
});

test.describe("Storage", () => {
  test("everything you log survives closing and reopening the app", async ({ app, page, context }) => {
    await app.open();
    await app.openDay("L");
    await app.setRow("l2", 1).getByLabel("Set 1 weight").fill("55");
    await app.sheet.getByRole("button", { name: "Mark session complete" }).click();
    await page.getByRole("button", { name: "7 h+ sleep, Monday" }).click();
    await app.eventuallySaved(s => s?.habits?.["2026-11-09"]?.sleep === true);
    await page.close();

    const again = await context.newPage();
    await again.clock.setFixedTime(new Date("2026-11-10T09:00:00"));
    await again.route("https://static.exercisedb.dev/**", r => r.fulfill({ status: 404, body: "" }));
    await again.goto("/");
    await expect(again.locator('.day[data-sid="L"]')).toContainText("Done");
    await expect(again.getByRole("button", { name: "7 h+ sleep, Monday" })).toHaveAttribute("aria-pressed", "true");
    await again.locator('.day[data-sid="L"]').click();
    await expect(again.getByLabel("Set 1 weight").first()).toHaveValue("55");
  });

  test("warns when the browser blocks saving", async ({ app, page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new Error("blocked");
      };
    });
    await app.open();
    await expect(page.getByRole("alert")).toContainText("Saving is blocked in this browser");
    await app.tab("Settings").click();
    await expect(page.locator(".settings")).toContainText("Saving is blocked in this browser (private mode?)");
  });
});
