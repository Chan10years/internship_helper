import express, { type NextFunction, type Request, type Response } from "express";
import session, { type Store } from "express-session";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { csrfSync } from "csrf-sync";
import type {
  AuthUserRecord,
  AuthenticationResult,
  PasswordResetResult,
  RegistrationResult,
  SessionUser
} from "../auth/authService.js";
import type { JobDetail, JobSummary } from "../jobs/types.js";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    authVersion?: number;
  }
}

interface JobReader {
  listSummaries(): Promise<JobSummary[]>;
  findDetailById(id: string): Promise<JobDetail | null>;
}

interface AuthApplicationService {
  register(input: unknown): Promise<RegistrationResult>;
  login(input: unknown): Promise<AuthenticationResult>;
  resetPassword(input: unknown): Promise<PasswordResetResult>;
}

export interface WebAppDependencies {
  jobs: JobReader;
  authService: AuthApplicationService;
  resolveSessionUser(id: string): Promise<AuthUserRecord | null>;
  isReady(): Promise<boolean>;
  sessionStore: Store;
  sessionSecret: string;
  isProduction: boolean;
  rateLimitMax?: number;
  publicDir?: string;
}

const sevenDaysMilliseconds = 7 * 24 * 60 * 60 * 1_000;

function localReturnPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return "/";
  }

  try {
    const parsed = new URL(value, "http://internal.local");
    return parsed.origin === "http://internal.local"
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : "/";
  } catch {
    return "/";
  }
}

function sessionIdentity(req: Request, user: SessionUser): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }
      req.session.userId = user.id;
      req.session.authVersion = user.authVersion;
      resolve();
    });
  });
}

function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => error ? reject(error) : resolve());
  });
}

function authInput(body: unknown, mode: "register" | "login" | "reset"): unknown {
  if (typeof body !== "object" || body === null) {
    return body;
  }
  const record = body as Record<string, unknown>;
  if (mode === "register") {
    return {
      email: record.email,
      password: record.password,
      displayName: record.displayName,
      inviteCode: record.inviteCode
    };
  }
  if (mode === "login") {
    return { email: record.email, password: record.password };
  }
  return { token: record.token, password: record.password };
}

export function createWebApp(dependencies: WebAppDependencies): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "16kb" }));
  app.use(session({
    name: "ih.sid",
    store: dependencies.sessionStore,
    secret: dependencies.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: dependencies.isProduction,
      maxAge: sevenDaysMilliseconds
    }
  }));

  const { generateToken, csrfSynchronisedProtection } = csrfSync({
    errorConfig: { statusCode: 403, message: "Request validation failed.", code: "EBADCSRFTOKEN" }
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1_000,
    limit: dependencies.rateLimitMax ?? 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "TOO_MANY_REQUESTS", message: "请求过于频繁，请稍后重试。" }
  });

  app.get("/health/live", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/health/ready", async (_req, res, next) => {
    try {
      const ready = await dependencies.isReady();
      res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not-ready" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/csrf", (req, res) => {
    res.json({ csrfToken: generateToken(req) });
  });

  app.get("/api/jobs", async (_req, res, next) => {
    try {
      res.json(await dependencies.jobs.listSummaries());
    } catch (error) {
      next(error);
    }
  });

  async function authenticatedUser(req: Request, res: Response): Promise<AuthUserRecord | null> {
    const { userId, authVersion } = req.session;
    if (!userId || authVersion === undefined) {
      res.status(401).json({ error: "AUTHENTICATION_REQUIRED", message: "请先登录后继续。" });
      return null;
    }

    const current = await dependencies.resolveSessionUser(userId);
    if (!current || !current.isActive || current.authVersion !== authVersion) {
      await destroySession(req);
      res.clearCookie("ih.sid");
      res.status(401).json({ error: "SESSION_EXPIRED", message: "登录状态已失效，请重新登录。" });
      return null;
    }
    return current;
  }

  app.get("/api/jobs/:id", async (req, res, next) => {
    try {
      if (!await authenticatedUser(req, res)) {
        return;
      }
      const job = await dependencies.jobs.findDetailById(req.params.id);
      if (!job) {
        res.status(404).json({ error: "JOB_NOT_FOUND", message: "未找到该岗位。" });
        return;
      }
      res.json(job);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/me", async (req, res, next) => {
    try {
      const current = await authenticatedUser(req, res);
      if (!current) {
        return;
      }
      const { passwordHash: _passwordHash, isActive: _isActive, ...publicUser } = current;
      res.json({ user: publicUser });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/register", authLimiter, csrfSynchronisedProtection, async (req, res, next) => {
    try {
      const result = await dependencies.authService.register(authInput(req.body, "register"));
      if (!result.ok) {
        res.status(400).json({ error: result.code, message: "无法完成注册，请检查信息或联系邀请人。" });
        return;
      }
      await sessionIdentity(req, result.user);
      res.status(201).json({ user: result.user, returnTo: localReturnPath(req.body?.returnTo) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", authLimiter, csrfSynchronisedProtection, async (req, res, next) => {
    try {
      const result = await dependencies.authService.login(authInput(req.body, "login"));
      if (!result.ok) {
        res.status(401).json({ error: result.code, message: "邮箱或密码不正确。" });
        return;
      }
      await sessionIdentity(req, result.user);
      res.json({ user: result.user, returnTo: localReturnPath(req.body?.returnTo) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/reset-password", authLimiter, csrfSynchronisedProtection, async (req, res, next) => {
    try {
      const result = await dependencies.authService.resetPassword(authInput(req.body, "reset"));
      if (!result.ok) {
        res.status(400).json({ error: result.code, message: "重置链接无效或已过期。" });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", csrfSynchronisedProtection, async (req, res, next) => {
    try {
      await destroySession(req);
      res.clearCookie("ih.sid");
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  if (dependencies.publicDir) {
    app.use(express.static(dependencies.publicDir));
  }

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    if (code === "EBADCSRFTOKEN") {
      res.status(403).json({ error: "INVALID_CSRF", message: "页面安全令牌已失效，请刷新后重试。" });
      return;
    }
    res.status(500).json({ error: "INTERNAL_ERROR", message: "服务暂时不可用，请稍后重试。" });
  });

  return app;
}

