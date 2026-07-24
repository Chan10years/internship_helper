# internship_helper

`internship_helper` 现已进入“邀请制账号闭环”阶段：游客可浏览岗位摘要，登录用户可查看完整岗位、来源、评分理由和简历建议。Web 运行时以 PostgreSQL 为唯一岗位主数据源；现有 JSON 用于迁移和恢复，CSV 保留为导出结果。

## 已实现

- 实习僧安全采集、JSON/CSV、合并去重、规则评分和简历建议。
- PostgreSQL 17 版本化迁移和幂等岗位导入。
- Express 5 模块化单体，公开摘要与登录后完整详情真实分离。
- 邀请码注册、邮箱密码登录、7 天服务端会话、CSRF、限流和退出。
- 管理员邀请码、账号停用/恢复和一次性密码重置链接。
- 桌面/移动端原生 HTML/CSS/JavaScript 登录注册体验。
- Dockerfile、Docker Compose、健康检查、备份恢复材料和自动化测试入口。

本阶段不包含收藏、投递、偏好、推荐、邮件、简历存储、管理员网页、支付、用户触发爬虫或真实公网发布。

## 首次运行

1. 复制 `.env.example` 为 `.env`，设置强 `POSTGRES_PASSWORD` 和至少 32 位随机 `SESSION_SECRET`。
2. 执行 `npm.cmd run db:up`。
3. 执行 `npm.cmd run db:migrate`。
4. 执行 `npm.cmd run db:import-jobs`。
5. 执行 `npm.cmd run db:verify`。
6. 执行 `npm.cmd run web`，访问 [http://localhost:3000/](http://localhost:3000/)。

容器化启动可使用 `docker compose up --build -d`；现有岗位导入需显式执行 `docker compose --profile tools run --rm import-jobs`。

## 常用命令

```text
npm.cmd run check
npm.cmd run build
npm.cmd run admin -- invite:create
npm.cmd run admin -- account:disable --email user@example.com
npm.cmd run admin -- account:enable --email user@example.com
npm.cmd run admin -- password-reset:create --email user@example.com
```

完整发布检查为 `npm.cmd run release:check`，它要求真实的测试 PostgreSQL 和运行中的 E2E 应用环境；所需变量见 `docs/15_ONLINE_MVP_OPERATIONS.md`。

## 安全边界

- 不保存第三方招聘网站账号、Cookie、Token 或 `storageState`。
- 不绕过验证码、短信验证、访问控制或风控。
- 普通用户不能启动爬虫或访问管理员能力。
- 不清空或广泛改写 `data/`。
- 邀请码与密码重置链接只显示一次，不进入应用日志。
- 遇到实验迁移 `001_initial_postgres_foundation` 时停止，不自动删除或重建数据库。

## 文档入口

- 有效产品决定：`docs/13_DECISIONS.md`
- 技术栈：`docs/01_TECH_STACK.md`
- 验收：`docs/08_ACCEPTANCE_CHECKLIST.md`
- 运维、备份、恢复：`docs/15_ONLINE_MVP_OPERATIONS.md`
- 执行规则：`AGENTS.md`
