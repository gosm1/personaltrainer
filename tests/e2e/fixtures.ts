import { test as base, expect, type Page } from "@playwright/test";

export const KEY = "lockin30.v1";
/** Tuesday of week 1 when the plan starts Monday 9 Nov 2026 (the default start on this date). */
export const TUE_WEEK1 = "2026-11-10T09:00:00";

// 1×1 transparent GIF used in place of the real ExerciseDB animations.
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export interface SeedState {
  start?: string;
  wake?: string;
  logs?: Record<string, unknown>;
  habits?: Record<string, unknown>;
  checkins?: Record<string, unknown>;
  tests?: Record<string, unknown>;
}

type Opts = { date?: string; state?: SeedState; realGifs?: boolean; failGifs?: boolean; lastBackup?: string };

export class App {
  /** ExerciseDB ids the page requested, in order. */
  gifRequests: string[] = [];
  constructor(public page: Page) {}

  async open(opts: Opts = {}) {
    const { page } = this;
    await page.clock.setFixedTime(new Date(opts.date ?? TUE_WEEK1));
    if (!opts.realGifs) {
      await page.route("https://static.exercisedb.dev/**", route => {
        this.gifRequests.push(route.request().url().split("/").pop()!.replace(".gif", ""));
        return opts.failGifs ? route.fulfill({ status: 404, body: "" }) : route.fulfill({ status: 200, contentType: "image/gif", body: GIF });
      });
    }
    // Seed saved data once per tab, so reloads keep whatever the test changed.
    const seed = opts.state ? JSON.stringify({ v: 2, start: "2026-11-09", wake: "07:30", logs: {}, habits: {}, checkins: {}, tests: {}, ...opts.state }) : null;
    await page.addInitScript(
      ([key, value, lastBackup]) => {
        try {
          if (sessionStorage.getItem("__seeded")) return;
          sessionStorage.setItem("__seeded", "1");
          if (value) localStorage.setItem(key, value);
          if (lastBackup) localStorage.setItem("lockin30.lastBackup", lastBackup);
        } catch {
          /* storage blocked on purpose by a test */
        }
      },
      [KEY, seed, opts.lastBackup ?? null] as const
    );
    await page.goto("/");
    await expect(page.locator("#topline")).not.toBeEmpty();
  }

  /** Saved state, after the 200 ms save debounce. */
  async saved(): Promise<any> {
    return this.page.evaluate(k => JSON.parse(localStorage.getItem(k) || "null"), KEY);
  }
  async eventuallySaved(check: (s: any) => unknown) {
    await expect.poll(async () => check(await this.saved())).toBeTruthy();
  }

  tab(name: "This week" | "Progress" | "Plan" | "Settings") {
    return this.page.getByRole("tab", { name });
  }
  day(sid: string) {
    return this.page.locator(`.day[data-sid="${sid}"]`);
  }
  get sheet() {
    return this.page.locator("#sheet");
  }
  get viewer() {
    return this.page.locator(".viewer");
  }
  exercise(id: string) {
    return this.page.locator(`.ex[data-ex="${id}"]`);
  }
  setRow(exId: string, n: number) {
    return this.exercise(exId).locator(`.setrow[data-set="${n}"]`);
  }
  async openDay(sid: string) {
    await this.day(sid).click();
    await expect(this.sheet).toBeVisible();
  }
}

export const test = base.extend<{ app: App }>({
  app: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => {
      if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text());
    });
    await use(new App(page));
    expect(errors, "page errors during the test").toEqual([]);
  }
});

export { expect };
