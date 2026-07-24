import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import session from "express-session";
import { createWebApp } from "../src/server/app.js";
import type { SessionUser } from "../src/auth/authService.js";

const user: SessionUser = {
  id: "7",
  email: "student@example.com",
  displayName: "小林",
  role: "user",
  authVersion: 1
};

function createDependencies() {
  return {
    jobs: {
      async listSummaries() {
        return [{ id: "1", title: "AI 实习生", company: "星河", city: "上海", salary: "200/天", publishTime: "今天" }];
      },
      async findDetailById(id: string) {
        return id === "1"
          ? {
              id: "1", title: "AI 实习生", company: "星河", city: "上海", salary: "200/天", publishTime: "今天",
              duration: "3个月", education: "本科", workDaysPerWeek: "4天", description: "完整岗位描述",
              link: "https://example.com/job/1", source: "shixiseng" as const, tags: ["AIGC"], matchScore: 80,
              matchReasons: ["技能匹配"], resumeAdvice: ["突出项目"]
            }
          : null;
      }
    },
    authService: {
      async register() { return { ok: true as const, user }; },
      async login() { return { ok: true as const, user }; },
      async resetPassword() { return { ok: true as const }; }
    },
    async resolveSessionUser(id: string) {
      return id === user.id ? { ...user, passwordHash: "unused", isActive: true } : null;
    },
    async isReady() { return true; },
    sessionStore: new session.MemoryStore(),
    sessionSecret: "test-session-secret-that-is-at-least-32-characters",
    isProduction: false,
    rateLimitMax: undefined as number | undefined
  };
}

async function withServer(
  run: (baseUrl: string) => Promise<void>,
  overrides: Partial<ReturnType<typeof createDependencies>> = {}
): Promise<void> {
  const app = createWebApp({ ...createDependencies(), ...overrides });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function cookieFrom(response: Response): string {
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie, "expected a session cookie");
  return setCookie.split(";", 1)[0];
}

async function csrfSession(baseUrl: string): Promise<{ token: string; cookie: string }> {
  const response = await fetch(`${baseUrl}/api/auth/csrf`);
  assert.equal(response.status, 200);
  const body = await response.json() as { csrfToken: string };
  return { token: body.csrfToken, cookie: cookieFrom(response) };
}

test("public jobs expose summaries while details require a valid server session", async () => {
  await withServer(async (baseUrl) => {
    const summaries = await fetch(`${baseUrl}/api/jobs`);
    const summaryBody = await summaries.json() as Array<Record<string, unknown>>;
    assert.equal(summaries.status, 200);
    assert.deepEqual(Object.keys(summaryBody[0]).sort(), ["city", "company", "id", "publishTime", "salary", "title"]);

    const blocked = await fetch(`${baseUrl}/api/jobs/1`);
    assert.equal(blocked.status, 401);

    const csrf = await csrfSession(baseUrl);
    const registered = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf.token, cookie: csrf.cookie },
      body: JSON.stringify({ email: user.email, password: "twelve-characters", displayName: user.displayName, inviteCode: "unused" })
    });
    assert.equal(registered.status, 201);
    const authenticatedCookie = cookieFrom(registered);
    assert.notEqual(authenticatedCookie, csrf.cookie);

    const detail = await fetch(`${baseUrl}/api/jobs/1`, { headers: { cookie: authenticatedCookie } });
    assert.equal(detail.status, 200);
    assert.equal((await detail.json() as { description: string }).description, "完整岗位描述");
  });
});

test("state-changing auth endpoints enforce CSRF and safe local return paths", async () => {
  await withServer(async (baseUrl) => {
    const rejected = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, password: "twelve-characters" })
    });
    assert.equal(rejected.status, 403);

    const csrf = await csrfSession(baseUrl);
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf.token, cookie: csrf.cookie },
      body: JSON.stringify({ email: user.email, password: "twelve-characters", returnTo: "https://evil.example/steal" })
    });
    assert.equal(login.status, 200);
    assert.equal((await login.json() as { returnTo: string }).returnTo, "/");
  });
});

test("health endpoints distinguish process liveness from database readiness", async () => {
  await withServer(async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/health/live`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/health/ready`)).status, 200);
  });

  await withServer(async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/health/ready`)).status, 503);
  }, { async isReady() { return false; } });
});

test("authentication rate limiting returns a stable 429 response", async () => {
  await withServer(async (baseUrl) => {
    const csrf = await csrfSession(baseUrl);
    const first = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf.token, cookie: csrf.cookie },
      body: JSON.stringify({ email: user.email, password: "twelve-characters" })
    });
    assert.equal(first.status, 200);

    const limited = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, password: "twelve-characters" })
    });
    assert.equal(limited.status, 429);
    assert.equal((await limited.json() as { error: string }).error, "TOO_MANY_REQUESTS");
  }, { rateLimitMax: 1 });
});

test("an auth-version change invalidates an otherwise valid stored session", async () => {
  await withServer(async (baseUrl) => {
    const csrf = await csrfSession(baseUrl);
    const registered = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf.token, cookie: csrf.cookie },
      body: JSON.stringify({ email: user.email, password: "twelve-characters", displayName: user.displayName, inviteCode: "unused" })
    });
    const cookie = cookieFrom(registered);
    const expired = await fetch(`${baseUrl}/api/jobs/1`, { headers: { cookie } });
    assert.equal(expired.status, 401);
    assert.equal((await expired.json() as { error: string }).error, "SESSION_EXPIRED");
  }, {
    async resolveSessionUser(id: string) {
      return id === user.id ? { ...user, authVersion: 2, passwordHash: "unused", isActive: true } : null;
    }
  });
});
