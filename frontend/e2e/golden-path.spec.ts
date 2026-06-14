import { test, expect, type ConsoleMessage } from "@playwright/test";

/**
 * The demo's golden path: every one of the five views must load on the prod
 * build, render its WebGL where expected, and produce ZERO console errors. This
 * is the same walk a judge does. If Mol* breaks under webpack, or the real
 * Engine C bundle fails to import, or any view throws, this fails the build.
 */

type View = { path: string; title: RegExp; expectCanvas: boolean; expectText?: RegExp };

const VIEWS: View[] = [
  { path: "/", title: /REWEAR-FUSED/i, expectCanvas: true },
  { path: "/passport", title: /Digital Recyclability Passport/i, expectCanvas: false, expectText: /clear|lab-test|divert/i },
  { path: "/fiber", title: /Cleavable Elastane Design/i, expectCanvas: true },
  { path: "/enzyme", title: /Carbamate Hydrolase/i, expectCanvas: true, expectText: /Ser-His-Asp/i },
  { path: "/loop", title: /Closed Loop/i, expectCanvas: true },
];

for (const view of VIEWS) {
  test(`${view.path} renders with no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg: ConsoleMessage) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(String(err)));

    await page.goto(view.path, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(view.title);

    // let WebGL / Mol* / R3F settle (scenes animate continuously, never go idle)
    await page.waitForTimeout(3000);

    if (view.expectCanvas) {
      await expect(page.locator("canvas").first()).toBeVisible();
    }
    if (view.expectText) {
      await expect(page.getByText(view.expectText).first()).toBeVisible();
    }

    expect(errors, `console errors on ${view.path}:\n${errors.join("\n")}`).toEqual([]);
  });
}
