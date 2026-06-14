import { defineConfig, devices } from "@playwright/test";

/**
 * Golden-path e2e. Boots the PRODUCTION build (next start, webpack) and walks the
 * five views. This is the gate that makes "CI green" mean the real, deployable
 * app renders — including Mol* under the webpack prod bundle, which a plain
 * `next build` does NOT prove (D5 lesson). Locally it reuses a running dev
 * server; in CI it builds and starts fresh.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // Mol* needs a real WebGL context; headless chromium gates SwiftShader WebGL
    // behind these flags. Without them Mol* throws "Could not create a WebGL
    // rendering context" in CI even though the app is fine on a GPU browser.
    launchOptions: {
      args: [
        "--enable-unsafe-swiftshader",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--ignore-gpu-blocklist",
      ],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
