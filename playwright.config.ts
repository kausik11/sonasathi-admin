import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  use: { baseURL: "http://127.0.0.1:3010", browserName: "chromium", launchOptions: { executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" }, headless: true },
  webServer: { command: "npm run dev -- --hostname 127.0.0.1 --port 3010", url: "http://127.0.0.1:3010", reuseExistingServer: false, timeout: 120000, env: { NEXT_DIST_DIR: ".next-playwright" } },
});
