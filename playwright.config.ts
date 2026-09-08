import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const usesExistingServer = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    // 게스트 세션을 실행당 한 번만 만든다 — 테스트마다 익명 로그인을 부르면 rate limit에 걸린다.
    { name: "setup", testMatch: /guest\.setup\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, dependencies: ["setup"] },
  ],
  webServer: usesExistingServer
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        // ★E2E가 실제 AI 생성을 부르지 못하게 서버에서 잠근다.★ 테스트가 생성 POST를
        // 가짜 응답으로 막지만, 한 군데라도 새면 비용과 외부 전송이 발생한다.
        // 이 값은 DB 변경까지 막아주지는 않으므로 세션은 여전히 게스트로 만든다.
        env: { AI_GENERATION_ENABLED: "false" },
      },
});
