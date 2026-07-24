# Authenticated Job Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 登录成功后让岗位列表与当前岗位区域停止显示游客专用的登录提示。

**Architecture:** 用一个无副作用的文案函数统一游客与登录用户的展示文本。岗位页保存 `/api/auth/me` 的结果，并在会话状态就绪后重新渲染，不改变服务器端详情权限和公开列表字段。

**Tech Stack:** 原生 JavaScript ES Modules、Node.js 内置测试运行器、TypeScript 项目检查。

## Global Constraints

- 不新增依赖。
- 不改变数据库、认证接口或岗位接口契约。
- 不使用不受控 `innerHTML`。
- 不执行 Git 修改命令。

---

### Task 1: 登录状态文案与页面同步

**Files:**
- Create: `src/server/public/accessCopy.js`
- Create: `src/server/public/accessCopy.d.ts`
- Modify: `src/server/public/app.js`
- Test: `tests/uiAccessCopy.test.ts`

**Interfaces:**
- Produces: `accessCopy(isAuthenticated)`，返回 `listAction`、`detailState`、`detailDescription`。
- Consumes: `/api/auth/me` 成功响应作为已登录信号。

- [ ] **Step 1: Write the failing test**

测试游客返回“登录查看/登录后可见”，登录用户返回“查看详情/点击查看”，并确保登录用户说明不含“登录后”。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/uiAccessCopy.test.ts`
Expected: FAIL because `src/server/public/accessCopy.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

创建纯函数并在 `app.js` 中保存登录状态；`loadSession()` 成功后调用 `renderResults()`，列表和舞台区域使用统一文案。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/uiAccessCopy.test.ts`
Expected: PASS.

- [ ] **Step 5: Run project verification**

Run: `npm.cmd run check` and `npm.cmd run build`.
Expected: all tests pass and TypeScript build exits with code 0.

- [ ] **Step 6: Browser acceptance**

刷新已登录岗位页，确认列表显示“查看详情”、详情状态显示“点击查看”，并确认完整岗位弹窗可打开。

Git commit is intentionally omitted because project rules prohibit Git modification commands without explicit approval.
