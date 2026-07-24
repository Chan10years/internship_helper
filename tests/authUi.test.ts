import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("authentication pages share the approved full-screen editorial experience", async () => {
  const [html, resetHtml, css] = await Promise.all([
    fs.readFile("src/server/public/auth.html", "utf8"),
    fs.readFile("src/server/public/reset-password.html", "utf8"),
    fs.readFile("src/server/public/auth.css", "utf8")
  ]);

  assert.match(html, /id="loginForm"/);
  assert.match(html, /id="registerForm"/);
  assert.match(html, /autocomplete="current-password"/);
  assert.match(html, /autocomplete="new-password"/);
  assert.match(resetHtml, /id="resetForm"/);
  assert.match(css, /min-height:\s*100svh/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media\s*\(max-width:/);
});

test("auth client obtains CSRF, preserves only local return paths, and avoids innerHTML", async () => {
  const script = await fs.readFile("src/server/public/auth.js", "utf8");

  assert.match(script, /\/api\/auth\/csrf/);
  assert.match(script, /x-csrf-token/);
  assert.match(script, /\/api\/auth\/login/);
  assert.match(script, /\/api\/auth\/register/);
  assert.match(script, /\/api\/auth\/reset-password/);
  assert.match(script, /returnTo/);
  assert.doesNotMatch(script, /\.innerHTML\s*=/);
});

test("job browser requests protected detail data instead of relying on hidden summary fields", async () => {
  const script = await fs.readFile("src/server/public/app.js", "utf8");

  assert.match(script, /fetch\(`\/api\/jobs\/\$\{encodeURIComponent\(job\.id\)\}`/);
  assert.match(script, /auth\.html/);
  assert.doesNotMatch(script, /job\.rawText/);
});
