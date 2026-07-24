import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { chromium } from "playwright";
import { Pool } from "pg";
import { createInviteToken, hashOpaqueToken } from "../../src/auth/tokens.js";

const baseUrl = process.env.E2E_BASE_URL;
const databaseUrl = process.env.E2E_DATABASE_URL;

test("desktop registration, protected job detail, logout, and mobile login", {
  skip: baseUrl && databaseUrl ? false : "E2E_BASE_URL and E2E_DATABASE_URL are not configured"
}, async () => {
  assert.ok(baseUrl);
  assert.ok(databaseUrl);
  const marker = randomBytes(8).toString("hex");
  const email = `e2e-${marker}@example.invalid`;
  const password = `e2e-password-${marker}`;
  const invitation = createInviteToken();
  const invitationHash = hashOpaqueToken(invitation);
  const pool = new Pool({ connectionString: databaseUrl });
  await pool.query(
    `insert into invitations (code_hash, expires_at)
     values ($1, now() + interval '30 minutes')`,
    [invitationHash]
  );

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await desktop.newPage();
    await page.goto(`${baseUrl}/auth.html?mode=register`);
    await page.locator("#registerForm input[name='displayName']").fill("端到端用户");
    await page.locator("#registerForm input[name='email']").fill(email);
    await page.locator("#registerForm input[name='password']").fill(password);
    await page.locator("#registerForm input[name='inviteCode']").fill(invitation);
    await page.locator("#registerForm button[type='submit']").click();
    await page.waitForURL(`${baseUrl}/`);

    await page.locator(".stage-detail-button").click();
    await page.locator("#detailDialog.is-open").waitFor();
    await page.locator("#closeDetailButton").click();
    await page.locator("#logoutButton").click();
    await page.waitForURL(`${baseUrl}/`);
    await desktop.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobile.newPage();
    await mobilePage.goto(`${baseUrl}/auth.html`);
    await mobilePage.locator("#loginForm input[name='email']").fill(email);
    await mobilePage.locator("#loginForm input[name='password']").fill(password);
    await mobilePage.locator("#loginForm button[type='submit']").click();
    await mobilePage.waitForURL(`${baseUrl}/`);
    await mobilePage.locator("#logoutButton").waitFor();
    await mobile.close();
  } finally {
    await browser.close();
    const user = await pool.query<{ id: string }>(
      "select id::text as id from users where lower(email) = lower($1)",
      [email]
    );
    if (user.rows[0]) {
      await pool.query("delete from web_sessions where sess ->> 'userId' = $1", [user.rows[0].id]);
      await pool.query("delete from users where id = $1", [user.rows[0].id]);
    }
    await pool.query("delete from invitations where code_hash = $1", [invitationHash]);
    await pool.end();
  }
});
