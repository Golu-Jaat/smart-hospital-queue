import { expect, test } from "@playwright/test";

const publicPages = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/ai-assistant",
  "/display",
];

for (const path of publicPages) {
  test(`${path} renders without horizontal overflow`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
}

test("health endpoint returns a monitoring payload", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Health check only runs once");

  const response = await request.get("/api/health");
  expect([200, 503]).toContain(response.status());
  expect(response.headers()["cache-control"]).toMatch(/no-store/);

  const payload = await response.json();
  expect(payload).toMatchObject({
    service: "smart-hospital-queue",
  });
  expect(["ok", "degraded"]).toContain(payload.status);
});

test("saved dark theme is active by the first frame after refresh", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Theme check only runs once");

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("theme", "dark"));
  await page.addInitScript(() => {
    const firstFrame = new Promise<boolean>((resolve) => {
      requestAnimationFrame(() => {
        resolve(document.documentElement.classList.contains("dark"));
      });
    });

    Object.defineProperty(window, "__smartQueueDarkAtFirstFrame", {
      configurable: true,
      value: firstFrame,
    });
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  const darkAtFirstFrame = await page.evaluate(async () => {
    return await (
      window as typeof window & {
        __smartQueueDarkAtFirstFrame: Promise<boolean>;
      }
    ).__smartQueueDarkAtFirstFrame;
  });

  expect(darkAtFirstFrame).toBe(true);
  await expect(page.locator("html")).toHaveClass(/dark/);
});
